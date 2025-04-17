"use client";

import { useEffect, useState, useContext } from "react";
import {
  getUserData,
  getSaldoData,
  addSingleTransaksi,
  getTokenFromIndexedDB,
} from "../../../../services/indexedDBService";
import { gunakanToken } from "../../../../services/tokenService";
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";
import { TokenContext } from "../../../../context/tokenContext";
import Swal from "sweetalert2";

export default function TopUpPulsaPage() {
  const { updateSaldo } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noReff: "",
    jenisTransaksi: "Top Up Pulsa",
    sumberDana: "",
    NoHP_IDPel: "",
    operator: "",
    nominal: 0,
    hargaJual: 0,
    hargaModal: 0,
  });

  const [entitasId, setEntitasId] = useState("");
  const [listSumberDana, setListSumberDana] = useState([]);
  const [saldoMap, setSaldoMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // generate No Reff harian
  const generateNoReff = async () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const key = `pulsa-${yyyy}${mm}${dd}`;
    let counter = Number(localStorage.getItem(key) || "0") + 1;
    localStorage.setItem(key, String(counter));
    return `TP-${dd}${mm}${yyyy}${String(counter).padStart(3, "0")}`;
  };

  // inisialisasi entitas, sumber dana, saldoMap
useEffect(() => {
  (async () => {
    const user = await getUserData();
    if (!user?.entitasId) return;
    setEntitasId(user.entitasId);

    const saldoData = await getSaldoData(user.entitasId);

    let saldoMap = {};
    let filteredSumberDana = [];

    if (Array.isArray(saldoData)) {
      saldoData.forEach((item) => {
        if (
          item.entitasId === user.entitasId &&
          item.sumberDana &&
          typeof item.saldo === "number"
        ) {
          saldoMap[item.sumberDana] = {
            id: item.id || item.sumberDana,
            saldo: item.saldo,
          };
          filteredSumberDana.push(item.sumberDana);
        }
      });
    } else if (saldoData && typeof saldoData === "object") {
      for (const [key, value] of Object.entries(saldoData)) {
        if (typeof value === "number") {
          saldoMap[key] = {
            id: key,
            saldo: value,
          };
          filteredSumberDana.push(key);
        }
      }
    }

    filteredSumberDana.sort((a, b) =>
      a === "Uang Kas" ? -1 : b === "Uang Kas" ? 1 : 0
    );

    setSaldoMap(saldoMap);
    setListSumberDana(filteredSumberDana);

    console.log("DATA SALDO:", saldoMap);

    const noRef = await generateNoReff();
    setForm((f) => ({ ...f, noReff: noRef }));
  })();
}, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({
      ...f,
      [name]: name === "nominal" || name === "hargaJual" || name === "hargaModal"
        ? Number(value)
        : value
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  if (!entitasId) return alert("Entitas ID belum ditemukan.");

  for (let k of ["sumberDana", "NoHP_IDPel", "operator", "nominal", "hargaJual", "hargaModal"]) {
    if (!form[k]) return alert(`Field ${k} wajib diisi.`);
  }

  setLoading(true);
  setError("");
  setSuccess("");

  try {
    const tokenInfo = await getTokenFromIndexedDB(entitasId);
    if ((tokenInfo?.totalToken ?? 0) < 1)
      return alert("Token tidak mencukupi.");

    // Pastikan yang dikirim adalah ID dari sumber dana
    const sumberDanaNama = form.sumberDana;
    const sumberDanaId = saldoMap[sumberDanaNama]?.id;

    if (!sumberDanaId) {
      throw new Error("ID sumber dana tidak ditemukan.");
    }

    const transaksiData = {
      admin: 0,
      createdAt: Date.now(),
      entitasId,
      jenisTransaksi: form.jenisTransaksi || "Top Up Pulsa",
      noReff: form.noReff,
      tanggal: form.tanggal,
      sumberDana: sumberDanaId, // << INI HARUS ID, BUKAN NAMA
      nominal: form.nominal || 0,
      hargaJual: form.hargaJual || 0,
      hargaModal: form.hargaModal || 0,
      NoHP_IDPel: form.NoHP_IDPel || "",
      operator: form.operator || "",
      pelanggan: "Umum",
      penerima: "",
      noRekening: "",
      noToken: "",
      tarif: 0,
      totalBayar: 0,
      profit: (form.hargaJual || 0) - (form.hargaModal || 0),
    };

    const tx = await addSingleTransaksi(transaksiData);
    if (!tx) throw new Error("Gagal menambah transaksi.");

    await gunakanToken(1, "Top Up Pulsa");
    setTotalToken(t => t - 1);
    await updateSaldo(sumberDanaId, tx); // gunakan ID

    Swal.fire({
      icon: "success",
      title: "Berhasil",
      text: "Transaksi berhasil disimpan.",
      timer: 2000,
      showConfirmButton: false,
    });

    const today = new Date().toISOString().split("T")[0];
    const noRef = await generateNoReff();
    setForm({
      tanggal: today,
      noReff: noRef,
      jenisTransaksi: "Top Up Pulsa",
      sumberDana: "",
      NoHP_IDPel: "",
      operator: "",
      nominal: 0,
      hargaJual: 0,
      hargaModal: 0,
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

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          <h5 className="card-header">Top Up Pulsa Telepon</h5>

          {/* Tanggal */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">Tanggal</span>
            <input
              type="date"
              name="tanggal"
              className="mobile-form-input"
              value={form.tanggal}
              onChange={handleChange}
            />
          </div>

          {/* No Reff */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">No Reff</span>
            <input
              type="text"
              name="noReff"
              className="mobile-form-input"
              value={form.noReff}
              readOnly
            />
          </div>

          {/* Sumber Dana */}
		<div className="mobile-form-row">
		  <span className="mobile-form-label">Sumber Dana</span>
		  <select
			name="sumberDana"
			className="mobile-form-input"
			value={form.sumberDana}
			onChange={handleChange}
		  >
			<option value="">-- Pilih --</option>
			{listSumberDana.map((sdId) => {
			  const sumber = saldoMap[sdId];
			  return (
				<option key={sdId} value={sdId}>
				  {sumber?.nama || sdId} — Rp{(sumber?.saldo || 0).toLocaleString("id-ID")}
				</option>
			  );
			})}
		  </select>
		</div>


          {/* No HP */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">No HP Pelanggan</span>
            <input
              type="text"
              name="NoHP_IDPel"
              className="mobile-form-input"
              value={form.NoHP_IDPel}
              onChange={handleChange}
            />
          </div>

          {/* Operator */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">Operator</span>
            <select
              name="operator"
              className="mobile-form-input"
              value={form.operator}
              onChange={handleChange}
            >
              <option value="">-- Pilih Operator --</option>
              {["Telkomsel", "Indosat", "XL", "Tri", "Axis"].map((op) => (
                <option key={op} value={op}>{op}</option>
              ))}
              <option value="manual">Lainnya...</option>
            </select>
            {form.operator === "manual" && (
              <input
                type="text"
                name="operator"
                className="mobile-form-input mt-1"
                placeholder="Masukkan operator"
                onChange={handleChange}
              />
            )}
          </div>

          {/* Nominal */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">Nominal</span>
            <input
              type="number"
              name="nominal"
              className="mobile-form-input"
              value={form.nominal}
              onChange={handleChange}
            />
          </div>

          {/* Harga Jual */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">Harga Jual</span>
            <input
              type="number"
              name="hargaJual"
              className="mobile-form-input"
              value={form.hargaJual}
              onChange={handleChange}
            />
          </div>

          {/* Harga Modal */}
          <div className="mobile-form-row">
            <span className="mobile-form-label">Harga Modal</span>
            <input
              type="number"
              name="hargaModal"
              className="mobile-form-input"
              value={form.hargaModal}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="mobile-mini-bank-submit">
          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
        {success && <p className="text-success mt-2">{success}</p>}
      </form>
    </div>
  );
}
