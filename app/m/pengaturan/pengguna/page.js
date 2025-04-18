"use client";

import { useEffect, useState } from "react";
import { getUsers, addUser, updateUser, deleteUser, getUserFromIndexedDB } from "../../../../services/userService";
import { registerUser } from "../../../../services/registerService"; // Import registerUser dari registerService
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../../../../lib/firebaseConfig";
import Swal from "sweetalert2";

export default function MobilePenggunaPage() {
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isEmailAvailable = async (email) => {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.length === 0; // true kalau belum terpakai
};

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser?.entitasId) {
      fetchUsers(currentUser.entitasId);
    }
  }, [currentUser]);

  const fetchCurrentUser = async () => {
    try {
      const userData = await getUserFromIndexedDB();
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

  const fetchUsers = async (entitasId) => {
    setIsLoading(true);
    try {
      const data = await getUsers(entitasId);
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
    // Validasi awal
    if (!userData.name || !userData.email || !userData.kontak || (!userData.id && !userData.password)) {
      alert("❗ Semua bidang harus diisi!");
      setIsSaving(false);
      return;
    }

    // Superadmin harus tersedia
    const superadmin = currentUser;
    if (!superadmin || !superadmin.entitasId) {
      alert("❗ Gagal mendapatkan data entitas.");
      setIsSaving(false);
      return;
    }

    // Kalau user baru, cek email terlebih dahulu
    if (!userData.id) {
      const emailAvailable = await isEmailAvailable(userData.email.trim());
      if (!emailAvailable) {
        Swal.fire("Email sudah digunakan", "Silakan gunakan email lain.", "warning");
        setIsSaving(false);
        return;
      }

      // Tampilkan modal konfirmasi password superadmin
      const { value: password } = await Swal.fire({
        title: "Konfirmasi Password",
        input: "password",
        inputLabel: "Masukkan password akun Anda",
        inputPlaceholder: "Password Anda",
        inputAttributes: {
          autocapitalize: "off",
          autocorrect: "off",
        },
        showCancelButton: true,
        confirmButtonText: "Lanjutkan",
        cancelButtonText: "Batal",
        preConfirm: (value) => {
          if (!value) return Swal.showValidationMessage("Password wajib diisi!");
        },
      });

      if (!password) {
        setIsSaving(false);
        return;
      }

      // Jalankan proses konfirmasi (register)
      await handleKonfirmasiRegister(userData, password.trim(), {
        fetchUsers,
        setShowModal,
        setSelectedUser,
      });

      return; // Selesai proses tambah user baru
    }

    // Proses update user lama
    const finalUserData = {
      id: userData.id,
      uid: userData.id,
      entitasId: superadmin.entitasId,
      name: userData.name.trim(),
      email: userData.email.trim(),
      kontak: userData.kontak.trim(),
      role: "admin",
      foto: userData.foto?.trim() || "",
    };

    await updateUser(finalUserData.id, finalUserData);
    await addUser(finalUserData);
    setShowModal(false);
    setSelectedUser(null);
    fetchUsers(superadmin.entitasId);
    console.log("🎉 Data pengguna berhasil diperbarui.");
  } catch (err) {
    console.error("❌ Gagal menyimpan:", err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
  } finally {
    setIsSaving(false);
  }
};
  
  const handleKonfirmasiRegister = async (formData, passwordSuperadmin, uiHandlers) => {
  const { fetchUsers, setShowModal, setSelectedUser } = uiHandlers;

  try {
    // Simpan password ke sessionStorage
    sessionStorage.setItem("adminPassword", passwordSuperadmin);

    // Jalankan registerUser
    const { user, userData: registeredData } = await registerUser(
      formData.email.trim(),
      formData.password.trim(),
      formData.name.trim(),
      formData.kontak.trim()
    );

    const newUserId = user.uid;
    const finalUserData = {
      ...registeredData,
      id: newUserId,
      uid: newUserId,
      kontak: formData.kontak.trim(),
      foto: formData.foto?.trim() || "",
    };

    // Sukses, refresh UI
    setShowModal(false);
    setSelectedUser(null);
    await fetchUsers(registeredData.entitasId);

    Swal.fire("Berhasil", "Admin baru berhasil ditambahkan.", "success");
  } catch (err) {
    console.error("❌ Gagal mendaftarkan admin:", err);
    Swal.fire("Gagal", err.message || "Terjadi kesalahan saat pendaftaran.", "error");
  } finally {
    sessionStorage.removeItem("adminPassword");
  }
};
  
  const handleDeleteUser = async (userId) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return;
    try {
      await deleteUser(userId);
      fetchUsers(currentUser.entitasId);
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
