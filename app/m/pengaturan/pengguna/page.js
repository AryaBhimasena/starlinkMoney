"use client";
import { useEffect, useState } from "react";
import {
  getAllUserData,
  getUserData,
  addSingleUserData,
  saveSingleUserData,
  deleteUserData,
} from "../../../../services/indexedDBService";

export default function MobilePenggunaPage() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getUserData();
      if (userData) {
        setCurrentUser({
          id: userData.id,
          role: userData.role,
          entitasId: userData.entitasId,
        });
      }
    } catch (err) {
      console.error("Gagal mengambil user saat ini:", err);
      setCurrentUser(null);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUserData();
      setUsers(data);
    } catch (err) {
      console.error("Gagal mengambil daftar pengguna:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (userData) => {
    setIsSaving(true);
    try {
      if (!userData.name || !userData.email || !userData.kontak || (!userData.id && !userData.password)) {
        alert("Semua bidang harus diisi!");
        setIsSaving(false);
        return;
      }

      if (!currentUser || !currentUser.entitasId) {
        alert("Gagal mendapatkan data entitas.");
        setIsSaving(false);
        return;
      }

      const formattedUserData = {
        id: userData.id || "",
        uid: userData.uid || "",
        entitasId: currentUser.entitasId,
        name: userData.name.trim(),
        email: userData.email.trim(),
        kontak: userData.kontak.trim(),
        role: "admin",
        foto: userData.foto?.trim() || "",
        ...(userData.password ? { password: userData.password.trim() } : {}),
      };

      if (userData.id) {
        await saveSingleUserData(formattedUserData);
      } else {
        await addSingleUserData(formattedUserData);
      }

      setShowModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Gagal menyimpan:", err);
      alert("Terjadi kesalahan saat menyimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return;
    try {
      await deleteUserData(userId);
      fetchUsers();
    } catch (err) {
      console.error("Gagal menghapus:", err);
      alert("Terjadi kesalahan saat menghapus pengguna.");
    }
  };

  return (
    <div className="mobile-pengguna-container">
      <div className="mobile-pengguna-header d-flex justify-content-between align-items-center">
        <h4 className="mobile-pengguna-title">Pengguna</h4>
        {currentUser?.role === "superadmin" && (
          <button
            className="btn btn-primary btn-sm mobile-pengguna-add-btn"
            onClick={() => {
              setSelectedUser(null);
              setShowModal(true);
            }}
          >
            + Tambah
          </button>
        )}
      </div>

      <div className="mobile-pengguna-content">
        {isLoading ? (
          <div className="mobile-pengguna-loading">Memuat data...</div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="mobile-pengguna-strip">
              <div className="mobile-pengguna-info">
                <div className="mobile-pengguna-nama">{user.name}</div>
                <div className="mobile-pengguna-email">{user.email}</div>
                <div className="mobile-pengguna-role">{user.role}</div>
              </div>
              {currentUser?.role === "superadmin" && (
                <div className="mobile-pengguna-actions">
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={() => {
                      setSelectedUser(user);
                      setShowModal(true);
                    }}
                  >
                    ✎
                  </button>
                  {user.role !== "superadmin" && (
                    <button
                      className="btn btn-sm btn-danger ms-1"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      🗑
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="mobile-pengguna-modal-backdrop">
          <div className="mobile-pengguna-modal-card">
            <div className="mobile-pengguna-modal-header">
              <h5>{selectedUser ? "Edit Pengguna" : "Tambah Pengguna"}</h5>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveUser({
                  id: selectedUser?.id,
                  uid: selectedUser?.uid,
                  name: e.target.name.value,
                  email: e.target.email.value,
                  kontak: e.target.kontak.value,
                  foto: e.target.foto?.value || "",
                  password: e.target.password?.value || "",
                });
              }}
            >
              <div className="mb-3">
                <label className="form-label">Nama</label>
                <input name="name" className="form-control" defaultValue={selectedUser?.name || ""} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Email</label>
                <input type="email" name="email" className="form-control" defaultValue={selectedUser?.email || ""} required />
              </div>
              <div className="mb-3">
                <label className="form-label">Kontak</label>
                <input name="kontak" className="form-control" defaultValue={selectedUser?.kontak || ""} required />
              </div>
              {!selectedUser && (
                <div className="mb-3">
                  <label className="form-label">Password</label>
                  <input name="password" type="password" className="form-control" required />
                </div>
              )}
              <div className="d-flex justify-content-end gap-2 mt-3">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
