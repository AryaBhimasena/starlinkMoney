"use client";

import { useEffect, useState, useContext } from "react";
import {
  getUserData,
  getSaldoData,
  addSingleTransaksi,
  getAllTransaksi,
  getTokenFromIndexedDB,
  saveTempReff,
  getTempReff,
} from "../../../../services/indexedDBService";
import { gunakanToken } from "../../../../services/tokenService";
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";
import { TokenContext } from "../../../../context/tokenContext";
import Swal from "sweetalert2";

export default function MiniBankPage() {
  const { updateSaldo } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  const initialForm = {
  tanggal: new Date().toISOString().split("T")[0],
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

  const [form, setForm] = useState(initialForm);


  const [entitasId, setEntitasId] = useState("");
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const generateNoReff = async (entitasId) => {
    const today = new Date();
    const ddmmyyyy = today
      .toLocaleDateString("id-ID")
      .split("/")
      .map((val) => val.padStart(2, "0"))
      .join(""); // contoh: 10042025

    const allTransaksi = await getAllTransaksi();
    const transaksiHariIni = allTransaksi.filter((t) => {
      const tgl = new Date(t.tanggal);
      return (
        t.entitasId === entitasId &&
        tgl.getDate() === today.getDate() &&
        tgl.getMonth() === today.getMonth() &&
        tgl.getFullYear() === today.getFullYear()
      );
    });

    const noUrut = (transaksiHariIni.length + 1).toString().padStart(3, "0");
    return `${ddmmyyyy}-${noUrut}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        if (!userData?.entitasId) return setError("Entitas tidak ditemukan.");

        setEntitasId(userData.entitasId);
        const saldoList = await getSaldoData();
        setSumberDanaList(saldoList);

        let noReff = await getTempReff(userData.entitasId);
        if (!noReff) {
          noReff = await generateNoReff(userData.entitasId);
          await saveTempReff(userData.entitasId, noReff);
        }

        setForm((prev) => ({ ...prev, noReff }));
      } catch (err) {
        console.error("Gagal inisialisasi data:", err);
        setError("Gagal mengambil data pengguna atau sumber dana.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["nominal", "tarif", "admin"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!entitasId) return alert("Entitas ID belum ditemukan.");
    if (!form.nominal || !form.sumberDana) return alert("Nominal dan Sumber Dana wajib diisi.");

    setLoading(true);

    try {
      const tokenInfo = await getTokenFromIndexedDB(entitasId);
      const currentToken = tokenInfo?.totalToken ?? 0;

      if (currentToken < 1) throw new Error("❌ Token tidak mencukupi untuk membuat transaksi.");

		console.log("DEBUG: Semua sumber dana:", sumberDanaList);
		console.log("DEBUG: Sumber dana yang dipilih:", form.sumberDana);

		const sumberDanaData = sumberDanaList.find(
		  (item) => item.id.toLowerCase().trim() === form.sumberDana.toLowerCase().trim()
		);

		if (!sumberDanaData) {
		  const tersedia = sumberDanaList.map((d) => d.sumberDana).join(", ");
		  throw new Error(`❌ Sumber Dana '${form.sumberDana}' tidak ditemukan. Pilihan yang tersedia: ${tersedia}`);
		}


      const noReffBaru = await generateNoReff(entitasId);

      const transaksiData = {
        ...form,
        noReff: noReffBaru,
        entitasId,
        createdAt: Date.now(),
        profit: Number(form.tarif),
        namaSumberDana: sumberDanaData.sumberDana,
      };

      const transaksiBaru = await addSingleTransaksi(transaksiData);
      if (!transaksiBaru || typeof transaksiBaru !== "object") throw new Error("Data transaksi tidak valid.");

      const result = await gunakanToken(1, "Transaksi Baru");
      if (!result.success) throw new Error("Gagal memotong token.");

      setTotalToken((prev) => prev - 1);
      await updateSaldo(transaksiBaru.sumberDana, transaksiBaru);

      Swal.fire({
	  icon: "success",
	  title: "Transaksi Berhasil",
	  text: "Data transaksi berhasil ditambahkan.",
		});


      const nextNoReff = await generateNoReff(entitasId);
      await saveTempReff(entitasId, nextNoReff);
      setForm({
	  ...initialForm,
	  noReff: nextNoReff,
	  });

    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      setError(err.message || "❌ Gagal memproses transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-mini-bank-container">
      <div className="mobile-mini-bank-header">
        <h5 className="mobile-mini-bank-title">Transaksi Mini Bank</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          {[
            { label: "Tanggal", type: "date", name: "tanggal" },
            { label: "No Reff", type: "text", name: "noReff", readOnly: true },
            {
              label: "Jenis Transaksi",
              type: "select",
              name: "jenisTransaksi",
              options: ["Transfer", "Tarik Tunai", "Setor Tunai"],
              className: "transaksi-select-group",
            },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: sumberDanaList.map((item) => ({
                label: `${item.sumberDana} - Rp${item.saldo.toLocaleString("id-ID")}`,
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
                  {field.options.map((opt, idx) => {
                    if (typeof opt === "string") {
                      return (
                        <option value={opt} key={opt}>
                          {opt}
                        </option>
                      );
                    } else {
                      return (
                        <option value={opt.value} key={opt.value || idx}>
                          {opt.label}
                        </option>
                      );
                    }
                  })}
                </select>
              ) : (
                <input
                  className="mobile-form-input"
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
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
