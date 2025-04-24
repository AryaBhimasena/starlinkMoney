"use client";

import React, { useEffect, useState } from "react";
import {
  tambahSumberDana,
  getSumberDanaByEntitas,
  updateSumberDana,
  hapusSumberDana,
} from "../../../../services/sumberDanaService";
import { 
	getSaldoByEntitasId, 
	updateSaldo, 
	deleteSaldo } from "../../../../services/saldoService";
import { getUserData } from "../../../../services/indexedDBService";
import Swal from "sweetalert2";

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