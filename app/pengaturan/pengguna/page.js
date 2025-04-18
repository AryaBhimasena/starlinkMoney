"use client";

import { useEffect, useState } from "react";
import { getUsers, addUser, updateUser, deleteUser, getUserFromIndexedDB } from "../../../services/userService";
import { registerUser } from "../../../services/registerService";
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../../../lib/firebaseConfig";
import Swal from "sweetalert2";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const isEmailAvailable = async (email) => {
    const methods = await fetchSignInMethodsForEmail(auth, email);
    return methods.length === 0;
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
      if (!userData.name || !userData.email || !userData.kontak || (!userData.id && !userData.password)) {
        alert("❗ Semua bidang harus diisi!");
        setIsSaving(false);
        return;
      }

      const superadmin = currentUser;
      if (!superadmin || !superadmin.entitasId) {
        alert("❗ Gagal mendapatkan data entitas.");
        setIsSaving(false);
        return;
      }

      if (!userData.id) {
        const emailAvailable = await isEmailAvailable(userData.email.trim());
        if (!emailAvailable) {
          Swal.fire("Email sudah digunakan", "Silakan gunakan email lain.", "warning");
          setIsSaving(false);
          return;
        }

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
    } catch (err) {
      console.error("❌ Gagal menyimpan:", err);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data.", "error");
    } finally {
      sessionStorage.removeItem("adminPassword");
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
    <>
      <div className="header-container">
        <h3 className="header mb-0">Daftar Pengguna</h3>
      </div>

      <div className="content content-expand">
        <div className="card shadow-sm p-3">
          <div className="card-body">
            {currentUser?.role === "superadmin" && (
              <button
                className="btn btn-primary mb-3"
                onClick={() => {
                  setSelectedUser(null);
                  setShowModal(true);
                }}
              >
                Tambah Pengguna
              </button>
            )}

            {isLoading && <div className="loading-overlay">Memuat data...</div>}

            <div className="table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.email}</td>
                      <td>{user.role}</td>
                      <td>
                        {currentUser?.role === "superadmin" && (
                          <>
                            <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => {
                                setSelectedUser(user);
                                setShowModal(true);
                              }}
                            >
                              Edit
                            </button>
                            {user.role !== "superadmin" && (
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                Hapus
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
  <div className="pengguna-modal-backdrop">
    <div className="pengguna-modal-card">
      <div className="pengguna-modal-header">
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
        <div className="pengguna-form-group">
          <label className="pengguna-form-label">Nama</label>
          <input
            name="name"
            className="pengguna-form-control"
            defaultValue={selectedUser?.name || ""}
            required
          />
        </div>
        <div className="pengguna-form-group">
          <label className="pengguna-form-label">Email</label>
          <input
            type="email"
            name="email"
            className="pengguna-form-control"
            defaultValue={selectedUser?.email || ""}
            required
          />
        </div>
        <div className="pengguna-form-group">
          <label className="pengguna-form-label">Kontak</label>
          <input
            name="kontak"
            className="pengguna-form-control"
            defaultValue={selectedUser?.kontak || ""}
            required
          />
        </div>
        {!selectedUser && (
          <div className="pengguna-form-group">
            <label className="pengguna-form-label">Password</label>
            <input
              name="password"
              type="password"
              className="pengguna-form-control"
              required
            />
          </div>
        )}
        <div className="pengguna-modal-actions">
          <button
            type="button"
            className="pengguna-btn pengguna-btn-secondary"
            onClick={() => setShowModal(false)}
          >
            Batal
          </button>
          <button
            type="submit"
            className="pengguna-btn pengguna-btn-primary"
            disabled={isSaving}
          >
            {isSaving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </div>
  </div>
)}

    </>
  );
}
