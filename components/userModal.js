"use client";
import { useState, useEffect } from "react";

export default function UserModal({ user, currentUser, onSave, onClose }) {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [kontak, setKontak] = useState("");
    const [password, setPassword] = useState("");
    const [foto, setFoto] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
		console.log("User prop:", user);
        if (user) {
            // Mode Edit: Isi data dari user yang dipilih
            setName(user.name || "");
            setEmail(user.email || "");
            setKontak(user.kontak || "");
            setFoto(user.foto || "");
            setPassword(""); // Kosongkan password demi keamanan
        } else {
            // Mode Tambah: Reset Form
            setName("");
            setEmail("");
            setKontak("");
            setPassword("");
            setFoto("");
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSaving) return; // Cegah klik ganda

        setIsSaving(true);

        try {
            const userData = {
                uid: user?.uid || "", // UID tetap jika sedang diedit
                id: user?.id || "",
                entitasId: user?.entitasId && user.entitasId !== "" ? user.entitasId : currentUser.entitasId,
                name: name.trim(),
                email: email.trim(),
                kontak: kontak.trim(),
                role: "admin",
                password: user ? user.password : password.trim() || "", // Jika edit, password tidak berubah
                foto: foto.trim(),
            };

            console.log("Data yang dikirim ke onSave:", userData);

            // Validasi input
            if (!userData.name || !userData.email || !userData.kontak || (!user && !userData.password)) {
                alert("Semua bidang harus diisi!");
                setIsSaving(false);
                return;
            }

            await onSave(userData);
            onClose();
        } catch (error) {
            console.error("Gagal menyimpan data:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="modal show d-block" tabIndex="-1">
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">{user ? "Edit Pengguna" : "Tambah Pengguna"}</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label className="form-label">name</label>
                                <input type="text" className="form-control" value={name} onChange={(e) => setName(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={!!user} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Kontak</label>
                                <input type="text" className="form-control" value={kontak} onChange={(e) => setKontak(e.target.value)} required />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Foto (Link)</label>
                                <input type="text" className="form-control" value={foto} onChange={(e) => setFoto(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Role</label>
                                <input type="text" className="form-control" value="admin" readOnly />
                            </div>
                            {!user && (
                                <div className="mb-3">
                                    <label className="form-label">Password</label>
                                    <input type="password" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary" disabled={isSaving}>
                                {isSaving ? "Menyimpan..." : "Simpan"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};
