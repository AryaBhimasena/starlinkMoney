"use client";
import { useState, useEffect } from "react";
import {
  getAllUserData,
  getUserData,
  addSingleUserData,
  saveSingleUserData,
  deleteUserData,
} from "../../../services/indexedDBService";
import UserModal from "../../../components/userModal";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

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
    } catch (error) {
      console.error("Gagal mendapatkan data pengguna:", error);
      setCurrentUser(null);
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await getAllUserData();
      setUsers(data);
    } catch (error) {
      console.error("Gagal memuat pengguna:", error);
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
        alert("Gagal mendapatkan data entitas pengguna saat menyimpan.");
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
        foto: userData.foto ? userData.foto.trim() : "",
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
    } catch (error) {
      console.error("Gagal menyimpan pengguna:", error);
      alert("Terjadi kesalahan saat menyimpan pengguna.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Yakin ingin menghapus pengguna ini?")) return;
    try {
      await deleteUserData(userId);
      fetchUsers();
    } catch (error) {
      console.error("Gagal menghapus pengguna:", error);
      alert("Terjadi kesalahan saat menghapus pengguna.");
    }
  };

  return (
    <>
      {/* Header Full Width */}
      <div className="header-container">
        <h3 className="header mb-0">Daftar Pengguna</h3>
      </div>

      {/* Konten */}
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
							  <button className="btn btn-warning btn-sm me-2" onClick={() => setSelectedUser(user)}>
								Edit
							  </button>
							  {user.role !== "superadmin" && (
								<button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(user.id)}>
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
        <UserModal
          user={selectedUser}
          currentUser={currentUser}
          onSave={handleSaveUser}
          onClose={() => {
            setShowModal(false);
            setSelectedUser(null);
          }}
        />
      )}
    </>
  );
}
