"use client";

import React, { useState, useEffect } from "react";
import { tambahSumberDana, getSumberDanaByEntitas, updateSumberDana, hapusSumberDana } from "../../../services/sumberDanaService";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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
