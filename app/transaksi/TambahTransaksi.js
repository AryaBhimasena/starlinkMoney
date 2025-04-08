"use client";

import React, { useState, useEffect, useContext } from "react";
import { db, auth } from "../../lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getSumberDana } from "../../services/sumberDanaService";
import { TransaksiContext } from "../../context/TransaksiContext";
import { SaldoContext } from "../../context/SaldoContext"; // ✅ Tambahkan import ini
import { addSingleTransaksi, getTokenFromIndexedDB } from "../../services/indexedDBService";
import { hitungSaldo } from "../../lib/hitungSaldo";
import { gunakanToken } from "../../services/tokenService"; // ✅ Tambahkan ini
import { TokenContext } from "../../context/tokenContext"; // atau path sesuai struktur kamu

const TambahTransaksi = ({ closeModal, refreshTransaksi, editData }) => {
  const { tambahTransaksi } = useContext(TransaksiContext);
  const { updateSaldo } = useContext(SaldoContext); // ✅ Ambil updateSaldo dari SaldoContext

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noReff: "ddmmyy-0001",
    jenisTransaksi: "Transfer",
    pelanggan: "Umum",
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
  const { setTotalToken } = useContext(TokenContext);

  useEffect(() => {
    let isMounted = true;

    const getUserEntitasId = async () => {
      const user = auth.currentUser;
      if (!user) {
        console.error("❌ Pengguna belum login.");
        return;
      }

      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          console.error("❌ Data user tidak ditemukan.");
          return;
        }

        const userData = querySnapshot.docs[0].data();
        const fetchedEntitasId = userData.entitasId;
        console.log("✅ Entitas ID ditemukan:", fetchedEntitasId);

        if (isMounted) {
          setEntitasId(fetchedEntitasId);
          fetchSumberDana(fetchedEntitasId);
        }
      } catch (error) {
        console.error("❌ Error mengambil data pengguna:", error);
      }
    };

    getUserEntitasId();

    return () => {
      isMounted = false;
    };
  }, []);

  const fetchSumberDana = async (entitasId) => {
    if (!entitasId) return;

    try {
      const sumberDanaList = await getSumberDana(entitasId);
      if (sumberDanaList.length === 0) {
        console.warn("⚠️ Tidak ada sumber dana ditemukan.");
      }
      setSumberDana(sumberDanaList);
    } catch (error) {
      console.error("❌ Error mengambil sumber dana:", error);
      setError("Gagal mengambil sumber dana.");
    }
  };

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      totalBayar: Number(prev.nominal) + Number(prev.tarif) + Number(prev.admin),
    }));
  }, [form.nominal, form.tarif, form.admin]);

  useEffect(() => {
    if (editData) {
      setForm(editData); // Mengisi form dengan data transaksi yang diedit
    }
  }, [editData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "nominal" || name === "tarif" || name === "admin" ? Number(value) : value,
    }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  console.log("🟢 handleSubmit() dipanggil...");

  if (!entitasId) {
    console.error("❌ Entitas ID tidak ditemukan!");
    alert("❌ Entitas ID tidak ditemukan!");
    return;
  }

  if (!form.nominal || !form.sumberDana) {
    console.error("❌ Nominal dan Sumber Dana wajib diisi!");
    setError("❌ Nominal dan Sumber Dana wajib diisi!");
    return;
  }

  // Tentukan jenisTransaksi otomatis berdasarkan tab
  let jenisTransaksi = "Transfer";
  if (activeTab === "tab1") jenisTransaksi = form.jenisTransaksi || "Transfer";
  else if (activeTab === "tab2") jenisTransaksi = "Top Up Pulsa / Listrik";
  else if (activeTab === "tab3") jenisTransaksi = "Top Up E-Wallet";

  // Siapkan data transaksi
  const transaksiData = {
    ...form,
    entitasId,
    jenisTransaksi,
    createdAt: Date.now(),
    profit: Number(form.tarif),
  };

  // Bersihkan field yang tidak relevan berdasarkan tab
  if (activeTab === "tab2") {
    delete transaksiData.penerima;
    delete transaksiData.noRekening;
  }
  if (activeTab === "tab3") {
    delete transaksiData.noRekening;
  }

  setLoading(true);
  try {
    // ✅ STEP 1: Validasi token cukup
    const tokenInfo = await getTokenFromIndexedDB(entitasId);
    const currentToken = tokenInfo?.totalToken ?? 0;

    if (currentToken < 1) {
      alert("❌ Token tidak mencukupi untuk membuat transaksi.");
      setLoading(false);
      return;
    }

    // ✅ STEP 2: Simpan transaksi
    console.log("📩 Menyimpan transaksi ke store transaksi...");
    console.log("🔍 Data transaksi yang akan disimpan:", transaksiData);

    const transaksiBaru = await addSingleTransaksi(transaksiData);

    console.log("✅ Transaksi berhasil ditambahkan!", transaksiBaru);

    if (!transaksiBaru || typeof transaksiBaru !== "object") {
      throw new Error("❌ Data transaksi tidak valid setelah ditambahkan!");
    }

    if (!transaksiBaru.sumberDana) {
      throw new Error("❌ sumberDana tidak ditemukan dalam transaksi!");
    }

// ✅ STEP 3: Kurangi token (tidak bergantung ke transaksi lagi)
setTimeout(async () => {
  const tokenResult = await gunakanToken(1, "Transaksi Baru");

  if (!tokenResult.success) {
    console.warn("⚠️ Transaksi tersimpan, tapi gagal mengurangi token:", tokenResult.error);
    alert(`⚠️ Transaksi berhasil, tapi token gagal dikurangi: ${tokenResult.error}`);
  } else {
    // ✅ Update context token agar UI langsung berubah
    setTotalToken((prev) => prev - 1);
  }
}, 0);

    console.log("💰 Memulai perhitungan saldo...");
    await updateSaldo(transaksiBaru.sumberDana, transaksiBaru);
    console.log("✅ Saldo berhasil diperbarui!");

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
                    <label className="form-label">No HP/ID Pelanggan/No Meter</label>
                    <input type="text" className="form-control" name="NoHP_IDPel" value={form.NoHP_IDPel} readOnly />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Nominal</label>
                    <input type="text" className="form-control" name="nominal" value={form.nominal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">No Token</label>
                    <input type="text" className="form-control" name="noToken" value={form.noToken} onChange={handleChange} required />
                  </div>
              </div>
			  
			  <div className="row">
                {/* Kolom 3 */}
                  <div className="col-md-4">
                    <label className="form-label">Harga Jual</label>
                    <input type="number" className="form-control" name="hargaJual" value={form.hargaJual} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Harga Modal</label>
                    <input type="number" className="form-control" name="hargaModal" value={form.hargaModal} onChange={handleChange} required />
                  </div>
                  <div className="col-md-4">
                    <label className="form-label">Jasa</label>
                    <input type="number" className="form-control" name="tarif" value={form.tarif} onChange={handleChange} required />
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
