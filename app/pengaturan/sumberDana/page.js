"use client";

import React, { useState, useEffect } from "react";
import { tambahSumberDana, getSumberDanaByEntitas, updateSumberDana, hapusSumberDana } from "../../../services/sumberDanaService";
import { getSaldoByEntitasId, updateSaldo, deleteSaldo } from "../../../services/saldoService";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc, deleteDoc } from "firebase/firestore";
import Swal from "sweetalert2";
import { getUserData } from "../../../services/indexedDBService";

const SumberDana = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sumberDana, setSumberDana] = useState("");
  const [kategori, setKategori] = useState("Bank");
  const [nominal, setNominal] = useState("");
  const [data, setData] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);
  const [user, setUser] = useState(null);
  
  useEffect(() => {
    const auth = getAuth();
    const db = getFirestore();
    
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          setEntitasId(userData.entitasId);
          console.log("✅ Entitas Aktif:", userData.entitasId);
        }
      } else {
        setUser(null);
        setEntitasId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (entitasId) {
      const fetchSumberDana = async () => {
        const result = await getSumberDanaByEntitas(entitasId);
        setData(result);
      };
      fetchSumberDana();
    }
  }, [entitasId]);

  useEffect(() => {
    setIsFormValid(sumberDana.trim() && !isNaN(parseFloat(nominal)) && parseFloat(nominal) >= 0 && entitasId);
  }, [sumberDana, nominal, entitasId]);
  
	  const handleAddOrUpdate = async () => {
	  // Cek jika form tidak valid
	  if (!isFormValid) {
		alert("❌ Data tidak valid! Pastikan semua input terisi dengan benar.");
		return;
	  }

	  // Pastikan nominal menjadi angka yang benar
	  const nominalAmount = parseFloat(nominal);
	  if (isNaN(nominalAmount) || nominalAmount < 0) {
		alert("❌ Nominal saldo tidak valid.");
		return;
	  }

	  const payload = {
		sumberDana,
		kategori,
		saldo: nominalAmount,
		entitasId,
	  };

	  try {
		if (isEdit && editId) {
		  // Update sumber dana jika sedang dalam mode edit
		  await updateSumberDana(editId, payload);
		} else {
		  // Tambah sumber dana dan saldo baru
		  await tambahSumberDana(sumberDana, kategori, nominalAmount);
		}

		// Reset form setelah berhasil
		setShowModal(false);
		setSumberDana("");
		setNominal("");
		setEditId(null);
		setIsEdit(false);

		// Refresh data sumber dana
		const refreshed = await getSumberDanaByEntitas(entitasId);
		setData(refreshed);
	  } catch (error) {
		console.error("❌ Gagal menambah atau mengedit sumber dana:", error);
		alert("❌ Terjadi kesalahan. Coba lagi.");
	  }
	};

// Handle Edit saldo
const handleEdit = async (item) => {
  try {
    const user = await getUserData();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const sumberDanaList = await getSumberDanaByEntitas(user.entitasId);
    const sumberDana = sumberDanaList.find((sd) => sd.sumberDana === item.sumberDana);
    const saldoAwal = sumberDana ? parseFloat(sumberDana.saldo) : 0;

    const saldoList = await getSaldoByEntitasId(user.entitasId);
    const saldoDoc = saldoList.find((s) => s.sumberDana === item.sumberDana);
    const saldoSaatIni = saldoDoc ? parseFloat(saldoDoc.saldo) : 0;

    const { value: penyesuaian } = await Swal.fire({
      title: `Edit Saldo: ${item.sumberDana}`,
      html:
        `<p><strong>Saldo Awal:</strong> Rp ${saldoAwal.toLocaleString()}</p>` +
        `<p><strong>Saldo Saat Ini:</strong> Rp ${saldoSaatIni.toLocaleString()}</p>` +
        `<p><em>Jika ingin mengurangi saldo, tambahkan (-) minus di depan nominal, contoh: -1.000.000</em></p>` +
        `<input type="text" id="swal-input1" class="swal2-input" placeholder="Penyesuaian Saldo (±)">`,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
      cancelButtonText: 'Batal',
      preConfirm: () => {
        let val = document.getElementById("swal-input1").value;
        val = val.replace(/[^\d\,-]/g, ''); // Menghapus karakter selain angka dan koma
        val = val.replace(/\./g, ''); // Menghapus titik
        val = parseFloat(val.replace(',', '.'));
        if (isNaN(val)) {
          Swal.showValidationMessage("Masukkan angka penyesuaian yang valid");
        }
        return val;
      }
    });

    if (penyesuaian == null) return;

    const saldoBaru = saldoAwal + penyesuaian;
    const saldoSaatIniBaru = saldoSaatIni + penyesuaian;

    await updateSumberDana(sumberDana.id, {
      sumberDana: item.sumberDana,
      kategori: item.kategori,
      saldo: saldoBaru,
    });

    await updateSaldo(user.entitasId, saldoDoc.id, saldoSaatIniBaru);

    Swal.fire(
      'Berhasil!',
      `Saldo telah disesuaikan: Rp ${saldoAwal.toLocaleString()} → Rp ${saldoBaru.toLocaleString()}`,
      'success'
    );

    const refreshedSumberDana = await getSumberDanaByEntitas(user.entitasId);
    setData(refreshedSumberDana);

  } catch (error) {
    console.error("❌ Error saat edit saldo:", error);
    Swal.fire('Error', 'Gagal memperbarui saldo sumber dana.', 'error');
  }
};

const handleDelete = async (itemId, sumberDana) => {
  try {
    const user = await getUserData();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    // Tanyakan konfirmasi penghapusan
    const { value: confirmed } = await Swal.fire({
      title: `Anda yakin ingin menghapus sumber dana ${sumberDana}?`,
      text: "Penghapusan ini akan menghapus sumber dana dan saldo terkait.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Hapus',
      cancelButtonText: 'Batal'
    });

    if (!confirmed) return; // Jika tidak dikonfirmasi, keluar dari fungsi

    // Hapus sumber dana dan saldo terkait
    await hapusSumberDana(itemId); // Hapus sumber dana
    await deleteSaldo(user.entitasId, sumberDana); // Hapus saldo terkait

    // Notifikasi sukses
    Swal.fire('Berhasil!', `Sumber dana ${sumberDana} beserta saldo telah dihapus.`, 'success');

    // Refresh tabel sumber dana setelah penghapusan
    const refreshedSumberDana = await getSumberDanaByEntitas(user.entitasId);
    setData(refreshedSumberDana);
  } catch (error) {
    console.error("❌ Gagal menghapus sumber dana:", error);
    Swal.fire('Error', 'Gagal menghapus sumber dana dan saldo terkait.', 'error');
  }
};


  return (
    <>
      {/* Header Baru */}
      <div className="header-container">
        <h3 className="header mb-0">Sumber Dana</h3>
      </div>

      <div className="content content-expand">
        <div className="card p-3">
          <div className="d-flex justify-content-end mb-3">
            <button className="btn btn-primary" onClick={() => { setShowModal(true); setIsEdit(false); }}>
              + Tambah Sumber Dana
            </button>
          </div>
          
          <table className="table table-bordered">
            <thead className="table-dark">
              <tr>
                <th>No</th>
                <th>Sumber Dana</th>
                <th>Kategori</th>
                <th>Nominal (Saldo)</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.sumberDana}</td>
                  <td>{item.kategori}</td>
                  <td>Rp {item.saldo.toLocaleString()}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id, item.sumberDana)}>Hapus</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal show d-block" style={{ position: "fixed", top: "0", left: "0", width: "100vw", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{isEdit ? "Edit" : "Tambah"} Sumber Dana</h5>
                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <div className="modal-body">
                  <input type="text" className="form-control mb-3" placeholder="Nama Sumber Dana" value={sumberDana} onChange={(e) => setSumberDana(e.target.value)} />
                  <select className="form-select mb-3" value={kategori} onChange={(e) => setKategori(e.target.value)}>
                    <option value="Bank">Bank</option>
                    <option value="E-Wallet">E-Wallet</option>
                  </select>
                  <input type="number" className="form-control mb-3" placeholder="Nominal Saldo" value={nominal} onChange={(e) => setNominal(e.target.value)} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-success" onClick={handleAddOrUpdate} disabled={!isFormValid}>{isEdit ? "Update" : "Simpan"}</button>
                  <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default SumberDana;
