"use client";

import React, { useState, useEffect, useContext } from "react";
import { getSumberDanaData, addSingleTransaksi, getTokenFromIndexedDB, getUserData, getAllTransaksi, saveTempReff, getTempReff } from "../../services/indexedDBService";
import { TransaksiContext } from "../../context/TransaksiContext";
import { SaldoContext } from "../../context/SaldoContext";
import { hitungSaldo } from "../../lib/hitungSaldo";
import { gunakanToken } from "../../services/tokenService";
import { TokenContext } from "../../context/tokenContext";

const TambahTransaksi = ({ closeModal, refreshTransaksi, editData }) => {
  const { tambahTransaksi } = useContext(TransaksiContext);
  const { updateSaldo } = useContext(SaldoContext);
  const { setTotalToken } = useContext(TokenContext);
  
  const generateNoReff = async (entitasId) => {
  const today = new Date();
  const ddmmyyyy = today
    .toLocaleDateString("id-ID")
    .split("/")
    .map((val) => val.padStart(2, "0"))
    .join(""); // hasil: 10042025

  const allTransaksi = await getAllTransaksi();

  // Filter transaksi berdasarkan entitasId dan tanggal
  const transaksiHariIni = allTransaksi.filter((t) => {
    const tgl = new Date(t.tanggal);
    const samaTanggal =
      tgl.getDate() === today.getDate() &&
      tgl.getMonth() === today.getMonth() &&
      tgl.getFullYear() === today.getFullYear();
    return t.entitasId === entitasId && samaTanggal;
  });

  const noUrut = (transaksiHariIni.length + 1).toString().padStart(3, "0");
  return `${ddmmyyyy}-${noUrut}`; // contoh: 10042025-001
};

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noReff: "ddmmyy-0001",
    jenisTransaksi: "Transfer",
    pelanggan: "Umum",
	NoHP_IDPel: "",
    penerima: "",
    noRekening: "",
    nominal: 0,
    sumberDana: "",
    tarif: 0,
    admin: 0,
    totalBayar: 0,
  });

  const [entitasId, setEntitasId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sumberDana, setSumberDana] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [activeTab, setActiveTab] = useState("tab1");

  useEffect(() => {
    let isMounted = true;

    const initData = async () => {
      try {
        const userData = await getUserData();
        if (!userData || !userData.entitasId) {
          console.error("❌ entitasId tidak ditemukan di IndexedDB.");
          return;
        }

        if (isMounted) {
          setEntitasId(userData.entitasId);
          const sumberDanaList = await getSumberDanaData();
          setSumberDana(sumberDanaList);
        }
		
      let noReff = await getTempReff(userData.entitasId);
      if (!noReff) {
        noReff = await generateNoReff(userData.entitasId);
        await saveTempReff(userData.entitasId, noReff);
      }

      setForm((prev) => ({ ...prev, noReff }));
    
      } catch (err) {
        console.error("❌ Gagal inisialisasi data dari IndexedDB:", err);
        setError("Gagal memuat data pengguna atau sumber dana.");
      }
    };

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

useEffect(() => {
  const nominal = Number(form.nominal) || 0;
  const tarif = Number(form.tarif) || 0;
  const hargaJual = Number(form.hargaJual) || 0;
  const hargaModal = Number(form.hargaModal) || 0;

  let totalBayar = nominal;

  if (tarif > 0) {
    totalBayar += tarif;
  } else if (hargaJual && hargaModal) {
    totalBayar += hargaJual - hargaModal;
  }

  setForm((prev) => ({
    ...prev,
    totalBayar,
  }));
}, [form.nominal, form.tarif, form.hargaJual, form.hargaModal]);

  useEffect(() => {
    if (editData) {
      setForm(editData);
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["nominal", "tarif", "admin"].includes(name) ? Number(value) : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🟢 handleSubmit() dipanggil...");

  if (!entitasId) {
    alert("❌ Entitas ID tidak ditemukan!");
    return;
  }

  if (!form.nominal || !form.sumberDana) {
    setError("❌ Nominal dan Sumber Dana wajib diisi!");
    return;
  }

  // Tentukan jenis transaksi berdasarkan tab
  let jenisTransaksi = "Transfer";
  if (activeTab === "tab1") jenisTransaksi = form.jenisTransaksi || "Transfer";
  else if (activeTab === "tab2") jenisTransaksi = "Top Up Pulsa / Listrik";
  else if (activeTab === "tab3") jenisTransaksi = "Top Up E-Wallet";

  // Generate tanggal dan ID
  const createdAt = Date.now();
  const tanggal = new Date(createdAt).toISOString().split("T")[0];
  const id = `${createdAt}-${Math.random().toString(36).substr(2, 8)}`;

  // Hitung profit dan totalBayar
  let profit = 0;
  const tarif = Number(form.tarif) || 0;
  const hargaJual = Number(form.hargaJual) || 0;
  const hargaModal = Number(form.hargaModal) || 0;
  let totalBayar = Number(form.nominal) || 0;

  if (tarif > 0) {
    profit = tarif;
    totalBayar += tarif;
  } else if (hargaJual && hargaModal) {
    profit = hargaJual - hargaModal;
    totalBayar += profit;
  }

  // Buat nomor referensi
  const now = new Date();
  const ddmmyyyy = `${now.getDate().toString().padStart(2, "0")}${(now.getMonth() + 1)
    .toString()
    .padStart(2, "0")}${now.getFullYear()}`;
  const noReff = `${ddmmyyyy}-001`; // Bisa diganti nanti jadi counter otomatis

  // Siapkan objek transaksi final
  const transaksiData = {
    ...form,
    id,
    entitasId,
    jenisTransaksi,
    createdAt,
    tanggal,
    noReff,
    tarif,
    hargaJual,
    hargaModal,
    profit,
    totalBayar,
    admin: 0,
    pelanggan: form.pelanggan || "Umum",
  };

  // Bersihkan field yang tidak relevan
  if (activeTab === "tab2") {
    delete transaksiData.penerima;
    delete transaksiData.noRekening;
  }
  if (activeTab === "tab3") {
    delete transaksiData.noRekening;
  }

  setLoading(true);
  try {
    const tokenInfo = await getTokenFromIndexedDB(entitasId);
    const currentToken = tokenInfo?.totalToken ?? 0;

    if (currentToken < 1) {
      alert("❌ Token tidak mencukupi untuk membuat transaksi.");
      setLoading(false);
      return;
    }

    console.log("📦 Transaksi yang akan disimpan:", transaksiData);

    const transaksiBaru = await addSingleTransaksi(transaksiData);
    if (!transaksiBaru || typeof transaksiBaru !== "object") throw new Error("Data transaksi tidak valid!");
    if (!transaksiBaru.sumberDana) throw new Error("sumberDana tidak ditemukan dalam transaksi!");

    // Kurangi token
    setTimeout(async () => {
      const tokenResult = await gunakanToken(1, "Transaksi Baru");
      if (!tokenResult.success) {
        alert(`⚠️ Transaksi berhasil, tapi token gagal dikurangi: ${tokenResult.error}`);
      } else {
        setTotalToken((prev) => prev - 1);
      }
    }, 0);

    // Update saldo real-time
    await updateSaldo(transaksiBaru.sumberDana, transaksiBaru);

    setSuccessMessage("✅ Transaksi berhasil ditambahkan!");
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);

    refreshTransaksi();
    closeModal();
  } catch (error) {
    console.error("❌ Gagal memproses transaksi:", error);
    alert(`❌ Terjadi kesalahan: ${error.message || "Silakan coba lagi."}`);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/bootstrap/css/custom.css";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, []);

return (
    <div className="modal fade show" style={{ display: "block" }} tabIndex="-1">
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Tambah Transaksi</h5>
            <button type="button" className="btn-close" onClick={closeModal}></button>
          </div>
          <div className="modal-body">
            {successMessage && (
              <div className="alert alert-success" role="alert">
                {successMessage}
              </div>
            )}
			
			{/* Tab Navigation */}
            <ul className="nav nav-tabs">
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "tab1" ? "active" : ""}`} onClick={() => setActiveTab("tab1")}>
                  Mini ATM
                </button>
              </li>
              <li className="nav-item">
                <button className={`nav-link ${activeTab === "tab2" ? "active" : ""}`} onClick={() => setActiveTab("tab2")}>
                  Pulsa / Listrik
                </button>
              </li>
			  <li className="nav-item">
                <button className={`nav-link ${activeTab === "tab3" ? "active" : ""}`} onClick={() => setActiveTab("tab3")}>
                  Top Up
                </button>
              </li>
            </ul>
			
            <form onSubmit={handleSubmit}>
			{activeTab === "tab1" && (
			<div className="tab-pane fade show active mt-4">
              <div className="row">
                {/* Kolom 1 */}
                  <div className="col-md-4">
                    <label className="form-label">Tanggal</label>
                    <input type="date" className="form-control" name="tanggal" value={form.tanggal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">No Reff</label>
                    <input type="text" className="form-control" name="noReff" value={form.noReff} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Jenis Transaksi</label>
                    <select className="form-select" name="jenisTransaksi" value={form.jenisTransaksi} onChange={handleChange} required>
                      <option value="Transfer">Transfer</option>
                      <option value="Tarik Tunai">Tarik Tunai</option>
                      <option value="Setor Tunai">Setor Tunai</option>
                    </select>
                  </div>
			  </div>
			
			
			  
              <div className="row">  
                {/* Kolom 2 */}
                  <div className="col-md-4">
                    <label className="form-label">Pelanggan</label>
                    <input type="text" className="form-control" name="pelanggan" value={form.pelanggan} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Penerima</label>
                    <input type="text" className="form-control" name="penerima" value={form.penerima} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">No Rekening</label>
                    <input type="text" className="form-control" name="noRekening" value={form.noRekening} onChange={handleChange} required />
                  </div>
              </div>
			  
			  <div className="row">
                {/* Kolom 3 */}
                  <div className="col-md-4">
                    <label className="form-label">Nominal</label>
                    <input type="number" className="form-control" name="nominal" value={form.nominal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tarif</label>
                    <input type="number" className="form-control" name="tarif" value={form.tarif} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Admin (Biaya Admin)</label>
                    <input type="number" className="form-control" name="admin" value={form.admin} onChange={handleChange} required />
                  </div>
              </div>
			</div>
			)}
			
{activeTab === "tab2" && (
  <div className="tab-pane fade show active mt-4">
    <div className="row">
      {/* Kolom 1 */}
      <div className="col-md-4">
        <label className="form-label">Tanggal</label>
        <input
          type="date"
          className="form-control"
          name="tanggal"
          value={form.tanggal ?? ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">No Reff</label>
        <input
          type="text"
          className="form-control"
          name="noReff"
          value={form.noReff ?? ""}
          readOnly
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Jenis Transaksi</label>
        <select
          className="form-select"
          name="jenisTransaksi"
          value={form.jenisTransaksi ?? ""}
          onChange={handleChange}
          required
        >
          <option value="Pulsa Telepon">Pulsa Telepon</option>
          <option value="Pulsa Listrik">Pulsa Listrik</option>
        </select>
      </div>
    </div>

    <div className="row">
      {/* Kolom 2 */}
      <div className="col-md-4">
        <label className="form-label">No HP/ID Pelanggan/No Meter</label>
        <input
          type="text"
          className="form-control"
          name="NoHP_IDPel"
          value={form.NoHP_IDPel ?? ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Nominal</label>
        <input
          type="number"
          className="form-control"
          name="nominal"
          value={form.nominal ?? ""}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">No Token</label>
        <input
          type="text"
          className="form-control"
          name="noToken"
          value={form.noToken ?? ""}
          onChange={handleChange}
        />
      </div>
    </div>

    <div className="row">
      {/* Kolom 3 */}
      <div className="col-md-4">
        <label className="form-label">Harga Jual</label>
        <input
          type="number"
          className="form-control"
          name="hargaJual"
          value={form.hargaJual ?? 0}
          onChange={handleChange}
          required
        />
      </div>
      <div className="col-md-4">
        <label className="form-label">Harga Modal</label>
        <input
          type="number"
          className="form-control"
          name="hargaModal"
          value={form.hargaModal ?? 0}
          onChange={handleChange}
          required
        />
      </div>
    </div>
  </div>
)}
			
			{activeTab === "tab3" && (
			<div className="tab-pane fade show active mt-4">
              <div className="row">
                {/* Kolom 1 */}
                  <div className="col-md-4">
                    <label className="form-label">Tanggal</label>
                    <input type="date" className="form-control" name="tanggal" value={form.tanggal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">No Reff</label>
                    <input type="text" className="form-control" name="noReff" value={form.noReff} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Jenis Transaksi</label>
                    <input type="text" className="form-control" name="jenisTransaksi" value="Top Up E-Wallet" readOnly />
                  </div>
			  </div>
			
              <div className="row">  
                {/* Kolom 2 */}
                  <div className="col-md-4">
                    <label className="form-label">No Pelanggan</label>
                    <input type="text" className="form-control" name="pelanggan" value={form.pelanggan} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Nominal</label>
                    <input type="number" className="form-control" name="nominal" value={form.nominal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Tarif</label>
                    <input type="number" className="form-control" name="tarif" value={form.tarif} onChange={handleChange} required />
                  </div>
              </div>
			</div>
			)}

			<div className="row">
			  <div className="col-md-8">
                <label className="form-label">Total Bayar</label>
                <input type="number" className="form-control" name="totalBayar" value={form.totalBayar} readOnly />
              </div>
			  
              <div className="col-md-4">
                <label className="form-label">Sumber Dana</label>
                <select className="form-select" name="sumberDana" value={form.sumberDana} onChange={handleChange} required>
                  <option value="">Pilih Sumber Dana</option>
                  {sumberDana.length > 0
                    ? sumberDana.map((sumber, index) => (
                        <option key={index} value={sumber.id}>
                          {sumber.sumberDana}
                        </option>
                      ))
                    : <option disabled>Loading sumber dana...</option>}
                </select>
              </div>
			</div>
              <div className="mb-12 text-center">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Sedang Proses..." : "Simpan"}
                </button>
              </div>
            </form>
{showPopup && (
  <div className="popup-card">
    <p>✅ Transaksi berhasil ditambahkan!</p>
    <button onClick={() => setShowPopup(false)}>Tutup</button>
  </div>
)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TambahTransaksi;
