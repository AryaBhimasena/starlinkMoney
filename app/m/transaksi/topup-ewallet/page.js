"use client";

import { useEffect, useState, useContext } from "react";
import {
  getUserData,
  getSaldoData,
  addSingleTransaksi,
  getTokenFromIndexedDB,
  saveTempReff,
  getTempReff,
} from "../../../../services/indexedDBService";
import { gunakanToken } from "../../../../services/tokenService";
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";
import { TokenContext } from "../../../../context/tokenContext";
import Swal from "sweetalert2";

export default function TopUpEwalletPage() {
  const { updateSaldo } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noReff: "",
    jenisTransaksi: "Top Up E-Wallet",
    sumberDana: "",
    NoHP_IDPel: "",
    nominal: 0,
    hargaJual: 0,
    hargaModal: 0,
    tarif: 0,
  });

  const [entitasId, setEntitasId] = useState("");
  const [listSumberDana, setListSumberDana] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const init = async () => {
      const userData = await getUserData();
      if (!userData?.entitasId) return;
      const id = userData.entitasId;
      setEntitasId(id);

      const saldo = await getSaldoData(id);
      const sumber = Object.keys(saldo || {});
      const urutanSumber = sumber.sort((a, b) =>
        a === "Uang Kas" ? -1 : b === "Uang Kas" ? 1 : 0
      );
      setListSumberDana(urutanSumber);

      const temp = await getTempReff(id);
      if (temp?.jenisTransaksi === "Top Up E-Wallet") {
        const confirm = await Swal.fire({
          title: "Pulihkan transaksi sebelumnya?",
          text: "Kami menemukan transaksi Top Up E-Wallet yang belum tersimpan. Ingin melanjutkan?",
          icon: "question",
          showCancelButton: true,
          confirmButtonText: "Ya, pulihkan",
          cancelButtonText: "Tidak",
        });

        if (confirm.isConfirmed) {
          setForm({
            ...temp,
            tanggal: new Date().toISOString().split("T")[0],
          });
        }
      }
    };

    init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const numericFields = ["nominal", "tarif", "hargaJual", "hargaModal"];
    const updatedValue = numericFields.includes(name) ? Number(value) : value;

    const updatedForm = {
      ...form,
      [name]: updatedValue,
    };

    if (name === "hargaJual" || name === "hargaModal") {
      updatedForm.tarif =
        Number(updatedForm.hargaJual) - Number(updatedForm.hargaModal);
    }

    setForm(updatedForm);
  };

  const generateNoReff = () => {
    const now = new Date();
    return `EW-${now.getFullYear()}${now.getMonth() + 1}${now.getDate()}-${now.getTime()}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entitasId) return alert("Entitas ID belum ditemukan.");

    const requiredFields = ["sumberDana", "nominal", "hargaJual", "hargaModal"];
    for (const field of requiredFields) {
      if (!form[field]) {
        return alert(`Field ${field} wajib diisi.`);
      }
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const transaksiData = {
      ...form,
      noReff: generateNoReff(),
      entitasId,
      createdAt: Date.now(),
      profit: Number(form.tarif),
    };

    try {
      const tokenInfo = await getTokenFromIndexedDB(entitasId);
      if ((tokenInfo?.totalToken ?? 0) < 1) {
        setLoading(false);
        return alert("Token tidak mencukupi. Silakan ulangi proses transaksi.");
      }

      const transaksiBaru = await addSingleTransaksi(transaksiData);
      if (!transaksiBaru) throw new Error("Gagal menambahkan transaksi.");

      setTimeout(async () => {
        const result = await gunakanToken(1, "Top Up E-Wallet");
        if (result.success) setTotalToken((prev) => prev - 1);
      }, 0);

      await updateSaldo(transaksiBaru.sumberDana, transaksiBaru);
      refreshTransaksi();
      await saveTempReff(entitasId, null);

      setSuccess("Transaksi berhasil disimpan.");
      setForm({
        tanggal: new Date().toISOString().split("T")[0],
        noReff: "",
        jenisTransaksi: "Top Up E-Wallet",
        sumberDana: "",
        NoHP_IDPel: "",
        nominal: 0,
        hargaJual: 0,
        hargaModal: 0,
        tarif: 0,
      });
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat menyimpan transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-mini-bank-container">
      <div className="mobile-mini-bank-header">
        <h5 className="mobile-mini-bank-title">Top Up E-Wallet</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          {[
            { label: "Tanggal", type: "date", name: "tanggal" },
            {
              label: "No Reff",
              type: "text",
              name: "noReff",
              readOnly: true,
              value: generateNoReff(),
            },
            {
              label: "Jenis Transaksi",
              type: "text",
              name: "jenisTransaksi",
              readOnly: true,
            },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: listSumberDana,
            },
            { label: "No HP / ID Pelanggan", type: "text", name: "NoHP_IDPel" },
            { label: "Nominal", type: "number", name: "nominal" },
            { label: "Harga Jual", type: "number", name: "hargaJual" },
            { label: "Harga Modal", type: "number", name: "hargaModal" },
            {
              label: "Tarif (Otomatis)",
              type: "number",
              name: "tarif",
              readOnly: true,
            },
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
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mobile-form-input"
                  type={field.type}
                  name={field.name}
                  value={field.value ?? form[field.name]}
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
