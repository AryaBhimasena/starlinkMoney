"use client";

import React, { useEffect, useState } from "react";
import {
  tambahSumberDana,
  getSumberDanaByEntitas,
  updateSumberDana,
  hapusSumberDana,
} from "../../../../services/sumberDanaService";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const MobileSumberDana = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sumberDana, setSumberDana] = useState("");
  const [kategori, setKategori] = useState("Bank");
  const [nominal, setNominal] = useState("");
  const [data, setData] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [user, setUser] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

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
      const fetchData = async () => {
        const result = await getSumberDanaByEntitas(entitasId);
        setData(result);
      };
      fetchData();
    }
  }, [entitasId]);

  useEffect(() => {
    setIsFormValid(
      sumberDana.trim() &&
        !isNaN(parseFloat(nominal)) &&
        parseFloat(nominal) >= 0 &&
        entitasId
    );
  }, [sumberDana, nominal, entitasId]);

  const handleAddOrUpdate = async () => {
    if (!isFormValid) return;

    const payload = {
      sumberDana,
      kategori,
      saldo: parseFloat(nominal),
      entitasId,
    };

    if (isEdit && editId) {
      await updateSumberDana(editId, payload);
    } else {
      await tambahSumberDana(payload);
    }

    setShowModal(false);
    setSumberDana("");
    setNominal("");
    setEditId(null);
    setIsEdit(false);

    const refreshed = await getSumberDanaByEntitas(entitasId);
    setData(refreshed);
  };

  const handleEdit = (item) => {
    setSumberDana(item.sumberDana);
    setKategori(item.kategori);
    setNominal(item.saldo);
    setEditId(item.id);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleDelete = async (id, nama) => {
    if (confirm(`Hapus sumber dana "${nama}"?`)) {
      await hapusSumberDana(id);
      const refreshed = await getSumberDanaByEntitas(entitasId);
      setData(refreshed);
    }
  };

  return (
    <div className="sumber-dana-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="sumber-dana-title">Sumber Dana</h4>
        <button
          className="btn btn-primary"
          onClick={() => {
            setIsEdit(false);
            setShowModal(true);
          }}
        >
          + Tambah
        </button>
      </div>

      <div className="sumber-dana-strip-list">
        {data.map((item, idx) => (
          <div className="sumber-dana-strip-item" key={idx}>
            <div className="sumber-dana-strip-header">
              <strong>{item.sumberDana}</strong>
              <span className="text-muted">{item.kategori}</span>
            </div>
            <div className="sumber-dana-strip-body">
              <div>Rp {item.saldo.toLocaleString()}</div>
              <div className="sumber-dana-strip-actions">
                <button
                  className="btn btn-sm btn-outline-warning me-2"
                  onClick={() => handleEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(item.id, item.sumberDana)}
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
  <div className="sumber-dana-modal-overlay">
    <div className="sumber-dana-modal-content">
      <h5 className="sumber-dana-modal-title">
        {isEdit ? "Edit" : "Tambah"} Sumber Dana
      </h5>
      <input
        className="form-control sumber-dana-modal-input mb-2"
        type="text"
        placeholder="Nama Sumber Dana"
        value={sumberDana}
        onChange={(e) => setSumberDana(e.target.value)}
      />
      <select
        className="form-select sumber-dana-modal-input mb-2"
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
      >
        <option value="Bank">Bank</option>
        <option value="E-Wallet">E-Wallet</option>
      </select>
      <input
        className="form-control sumber-dana-modal-input mb-3"
        type="number"
        placeholder="Nominal Saldo"
        value={nominal}
        onChange={(e) => setNominal(e.target.value)}
      />
      <div className="sumber-dana-modal-footer">
        <button
          className="btn sumber-dana-btn-batal"
          onClick={() => setShowModal(false)}
        >
          Batal
        </button>
        <button
          className="btn sumber-dana-btn-simpan"
          disabled={!isFormValid}
          onClick={handleAddOrUpdate}
        >
          {isEdit ? "Update" : "Simpan"}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
};

export default MobileSumberDana;
