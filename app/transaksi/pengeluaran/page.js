"use client";

import { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";

// Services
import { getUserData } from "../../../../services/indexedDBService";
import {
  tambahTransaksi,
  generateNoReff,
  rollbackTransaksi,
} from "../../../../services/transaksiService";
import { getSaldoByEntitasId, updateSaldo } from "../../../../services/saldoService";
import { hitungSaldo } from "../../../../lib/hitungSaldo";

// Context
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";

export default function PengeluaranPage() {
  // Contexts
  const { updateSaldoState } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);

  // Initial Form
  const initialForm = {
    date: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Pengeluaran",
    sumberDana: "",
    keterangan: "",
    nominal: 0,
    biayaAdmin: 0,
  };

  // State
  const [form, setForm] = useState(initialForm);
  const [entitasId, setEntitasId] = useState("");
  const [saldoList, setSaldoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Helper
  const formatRupiah = (angka) => `Rp${angka.toLocaleString("id-ID")}`;

  // useEffect 1: Inisialisasi halaman
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        if (!userData?.entitasId) return setError("Entitas tidak ditemukan.");

        setEntitasId(userData.entitasId);

        const saldoData = await getSaldoByEntitasId(userData.entitasId);
        setSaldoList(Array.isArray(saldoData) ? saldoData : []);

        const generatedNoReff = await generateNoReff(userData.entitasId, "Pengeluaran");
        setForm((prev) => ({ ...prev, noReff: generatedNoReff }));
      } catch (err) {
        console.error("Gagal inisialisasi data:", err);
        setError("Gagal mengambil data pengguna atau saldo.");
      }
    };

    fetchData();
  }, []);

  // Handle input form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["nominal", "biayaAdmin"].includes(name) ? Number(value) : value,
    }));
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
    if (form.nominal > saldoList.find(item => item.id === form.sumberDana)?.saldo) {
      return alert("Saldo tidak mencukupi untuk transaksi ini.");
    }

    let transaksiBaru = null;
    let saldoData = null;

    try {
      saldoData = saldoList.find(item => item.id === form.sumberDana);
      if (!saldoData) throw new Error(`Sumber Dana '${form.sumberDana}' tidak ditemukan.`);

      const transaksiData = {
        ...form,
        entitasId,
        createdAt: Date.now(),
      };

      transaksiBaru = await tambahTransaksi(transaksiData);
      if (!transaksiBaru) throw new Error("Gagal menyimpan transaksi.");

      const { saldoBaruSumber, error } = await hitungSaldo(saldoList, transaksiData);
      if (error) throw new Error(error);

      await updateSaldo(entitasId, form.sumberDana, saldoBaruSumber);
      await updateSaldoState(saldoData.id, transaksiData);

      Swal.fire({
        icon: "success",
        title: "Transaksi Berhasil",
        text: "Data transaksi berhasil ditambahkan.",
      });

      setForm({ ...initialForm, noReff: await generateNoReff(entitasId, "Pengeluaran") });

      const updatedSaldo = await getSaldoByEntitasId(entitasId);
      setSaldoList(updatedSaldo);
    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      if (transaksiBaru?.id) await rollbackTransaksi(transaksiBaru.id);
      setError(err.message || "Gagal memproses transaksi.");
    }

    setLoading(false);
  };

  return (
    <div className="mobile-pengeluaran-container">
      <div className="mobile-pengeluaran-header">
        <h5 className="mobile-pengeluaran-title">Transaksi Pengeluaran</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-pengeluaran-card">
          {[ 
            { label: "Tanggal", type: "date", name: "date" },
            { label: "No Reff", type: "text", name: "noReff", readOnly: true },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: saldoList.map((item) => ({
                label: `${item.sumberDana} - ${formatRupiah(item.saldo)}`,
                value: item.id,
              })),
            },
            { label: "Keterangan", type: "text", name: "keterangan" },
            { label: "Nominal", type: "number", name: "nominal" },
            { label: "Biaya Admin", type: "number", name: "biayaAdmin" },
          ].map((field, index) => (
            <div className="mobile-form-row" key={index}>
              <span className="mobile-form-label">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className="mobile-form-input"
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

        <div className="mobile-pengeluaran-submit">
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
