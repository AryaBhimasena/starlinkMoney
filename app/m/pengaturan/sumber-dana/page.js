"use client";

import React, { useEffect, useState } from "react";
import {
  tambahSumberDana,
  getSumberDanaByEntitas,
  updateSumberDana,
  hapusSumberDana,
} from "../../../../services/sumberDanaService";
import { getUserData } from "../../../../services/indexedDBService";

const MobileSumberDana = () => {
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sumberDana, setSumberDana] = useState("");
  const [kategori, setKategori] = useState("Bank");
  const [nominal, setNominal] = useState("");
  const [data, setData] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const fetchEntitasId = async () => {
      const user = await getUserData();
      if (user?.entitasId) {
        setEntitasId(user.entitasId);
      }
    };
    fetchEntitasId();
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

{showModal && (
  <div className="sumber-dana-modal-overlay">
    <div className="sumber-dana-modal-content">
      <h5 className="sumber-dana-modal-title">
        {isEdit ? "Edit" : "Tambah"} Sumber Dana
      </h5>
      <input
        className={`form-control sumber-dana-modal-input mb-2 ${!sumberDana.trim() ? "is-invalid" : ""}`}
        type="text"
        placeholder="Nama Sumber Dana"
        value={sumberDana}
        onChange={(e) => setSumberDana(e.target.value)}
      />
      <select
        className={`form-select sumber-dana-modal-input mb-2 ${!kategori ? "is-invalid" : ""}`}
        value={kategori}
        onChange={(e) => setKategori(e.target.value)}
      >
        <option value="Bank">Bank</option>
        <option value="E-Wallet">E-Wallet</option>
      </select>
      <input
        className={`form-control sumber-dana-modal-input mb-3 ${isNaN(parseFloat(nominal)) || parseFloat(nominal) <= 0 ? "is-invalid" : ""}`}
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