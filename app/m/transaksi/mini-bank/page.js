"use client";

import { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";

// Services
import { getUserData } from "../../../../services/indexedDBService";
import {
  tambahTransaksi,
  getTransaksiByEntitas,
  generateNoReff,
  rollbackTransaksi,
} from "../../../../services/transaksiService";
import { getSaldoByEntitasId, updateSaldo } from "../../../../services/saldoService";
import { hitungSaldo } from "../../../../lib/hitungSaldo";
import { getToken, gunakanToken } from "../../../../services/tokenService";

// Context
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";
import { TokenContext } from "../../../../context/tokenContext";

export default function MiniBankPage() {
  // Contexts
  const { updateSaldoState } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  // Initial Form
  const initialForm = {
    date: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Transfer",
    pelanggan: "Umum",
    penerima: "",
    noRekening: "",
    nominal: 0,
    tarif: 0,
    admin: 0,
    sumberDana: "",
  };

  // State
  const [form, setForm] = useState(initialForm);
  const [entitasId, setEntitasId] = useState("");
  const [saldoList, setSaldoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formattedForm, setFormattedForm] = useState({
  nominal: "",
  tarif: "",
  admin: "",
  });

  // Helper
  const formatToRupiah = (angka) => {
  const cleanNumber = Number(
    (typeof angka === "string" ? angka : angka?.toString() || "0").replace(/\D/g, "")
  );
  return "Rp" + cleanNumber.toLocaleString("id-ID");
  };

  // useEffect 1: Inisialisasi halaman
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        if (!userData?.entitasId) return setError("Entitas tidak ditemukan.");

        setEntitasId(userData.entitasId);

        const saldoData = await getSaldoByEntitasId(userData.entitasId);
        setSaldoList(Array.isArray(saldoData) ? saldoData : []);

        if (form.jenisTransaksi) {
          const generatedNoReff = await generateNoReff(userData.entitasId, form.jenisTransaksi);
          setForm((prev) => ({ ...prev, noReff: generatedNoReff }));
        } else {
          console.log("Belum ada jenis transaksi, noReff tidak digenerate.");
        }
      } catch (err) {
        console.error("Gagal inisialisasi data:", err);
        setError("Gagal mengambil data pengguna atau saldo.");
      }
    };

    fetchData();
  }, []);

  // useEffect 2: Update noReff saat jenisTransaksi berubah
  useEffect(() => {
    const updateNoReffByJenis = async () => {
      if (!entitasId || !form.jenisTransaksi) return;

      const newNoReff = await generateNoReff(entitasId, form.jenisTransaksi);
      setForm((prev) => ({ ...prev, noReff: newNoReff }));
    };

    updateNoReffByJenis();
  }, [form.jenisTransaksi, entitasId]);

  // Handle input form
  const handleChange = (e) => {
  const { name, value } = e.target;

  if (["nominal", "tarif", "admin"].includes(name)) {
    const onlyNumber = value.replace(/[^\d]/g, "");
    setForm((prev) => ({ ...prev, [name]: Number(onlyNumber) }));
    setFormattedForm((prev) => ({ ...prev, [name]: formatToRupiah(value) }));
  } else {
    setForm((prev) => ({ ...prev, [name]: value }));
  }
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    if (!entitasId) return alert("Entitas ID belum ditemukan.");
    if (!form.nominal || !form.sumberDana) return alert("Nominal dan Sumber Dana wajib diisi.");
    if (!form.date) return alert("Tanggal transaksi harus diisi.");

    let transaksiBaru = null;
    let saldoData = null;
    let uangKasId = null;

    try {
      const tokenResult = await gunakanToken(entitasId, 1, "Mini Bank");
      if (!tokenResult.success) throw new Error(tokenResult.error || "Gagal menggunakan token.");

      saldoData = saldoList.find(item =>
        [item.id, item.nama, item.sumberDana].map(x => x?.toLowerCase().trim())
          .includes(form.sumberDana.toLowerCase().trim())
      );

      if (!saldoData) throw new Error(`❌ Sumber Dana '${form.sumberDana}' tidak ditemukan.`);
      if (form.nominal > saldoData.saldo) throw new Error(`❌ Saldo tidak mencukupi.`);

      const uangKas = saldoList.find(item => item.sumberDana.toLowerCase() === "uang kas");
      if (uangKas) {
        uangKasId = uangKas.id;
      } else {
        throw new Error("❌ Sumber Dana 'Uang Kas' tidak ditemukan.");
      }

      const noReffBaru = await generateNoReff(entitasId, form.jenisTransaksi);
      const transaksiData = {
        ...form,
        noReff: noReffBaru,
        entitasId,
        createdAt: Date.now(),
        profit: Number(form.tarif),
        namaSumberDana: saldoData.sumberDana,
      };

      console.log("Tanggal saat submit:", form.date);

      transaksiBaru = await tambahTransaksi(transaksiData);
      if (!transaksiBaru) throw new Error("❌ Gagal menyimpan transaksi.");

      const { saldoBaruSumber, saldoBaruUangKas, error } = await hitungSaldo(saldoList, transaksiData);
      if (error) throw new Error(error);

      if (form.sumberDana.toLowerCase() !== "uang kas") {
        await updateSaldo(entitasId, form.sumberDana, saldoBaruSumber);
      }

      if (uangKasId) {
        console.log("Memperbarui saldo untuk Uang Kas dengan ID yang sesuai");
        await updateSaldo(entitasId, uangKasId, saldoBaruUangKas);
      }

      await updateSaldoState(saldoData.id, transaksiData);

      Swal.fire({
        icon: "success",
        title: "Transaksi Berhasil",
        text: "Data transaksi berhasil ditambahkan.",
      });

      const newNoReff = await generateNoReff(entitasId, form.jenisTransaksi);
      setForm({ ...initialForm, noReff: newNoReff });

      const updatedSaldo = await getSaldoByEntitasId(entitasId);
      setSaldoList(updatedSaldo);
    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      if (transaksiBaru?.id) await rollbackTransaksi(transaksiBaru.id);
      setError(err.message || "❌ Gagal memproses transaksi.");
    }

    setLoading(false);
  };

  // Options jenis transaksi
  const jenisTransaksiOptions = [
    { label: "Transfer", value: "Transfer" },
    { label: "Tarik Tunai", value: "Tarik Tunai" },
    { label: "Setor Tunai", value: "Setor Tunai" },
  ];

  return (
    <div className="mobile-mini-bank-container">
      <div className="mobile-mini-bank-header">
        <h5 className="mobile-mini-bank-title">Transaksi Mini Bank</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          {[
            { label: "Tanggal", type: "date", name: "date" },
            { label: "No Reff", type: "text", name: "noReff", readOnly: true },
            {
              label: "Jenis Transaksi",
              type: "select",
              name: "jenisTransaksi",
              options: jenisTransaksiOptions,
              className: "transaksi-select-group",
            },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: saldoList.map((item) => ({
                label: `${item.sumberDana} - ${formatToRupiah(item.saldo)}`,
                value: item.id,
              })),
            },
            { label: "Pelanggan", type: "text", name: "pelanggan", readOnly: true },
            { label: "Penerima", type: "text", name: "penerima" },
            { label: "No Rekening", type: "text", name: "noRekening" },
            { label: "Nominal", type: "number", name: "nominal" },
            { label: "Tarif", type: "number", name: "tarif" },
            { label: "Admin (Biaya Admin)", type: "number", name: "admin" },
          ].map((field, index) => (
            <div className="mobile-form-row" key={index}>
              <span className="mobile-form-label">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className={`mobile-form-input ${field.className || ""}`}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih --</option>
                  {field.options.map((opt, idx) => (
                    <option value={opt.value} key={opt.value || idx}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
				  className="mobile-form-input"
				  type={
					["nominal", "tarif", "admin"].includes(field.name)
					  ? "text"
					  : field.type
				  }
				  name={field.name}
				  value={
					["nominal", "tarif", "admin"].includes(field.name)
					  ? formattedForm[field.name]
					  : form[field.name]
				  }
				  onChange={handleChange}
				  readOnly={field.readOnly || false}
				/>
              )}
            </div>
          ))}
        </div>

        <div className="mobile-mini-bank-submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
        {success && <p className="text-success mt-2">{success}</p>}
      </form>
    </div>
  );
}
