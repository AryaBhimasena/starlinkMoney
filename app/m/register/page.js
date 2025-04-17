'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';  // Import SweetAlert2
import { newRegisterUser } from '../../../services/registerService';
import { db } from '../../../firebase';  // Pastikan db sudah dikonfigurasi dengan Firebase SDK
import { collection, doc, setDoc } from 'firebase/firestore';  // Import firestore functions

export default function MobileRegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noWa, setNoWa] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [error, setError] = useState('');

const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== konfirmasiPassword) {
      setError("Password dan konfirmasi tidak sama.");
      return;
    }

    const result = await Swal.fire({
      title: "Konfirmasi Data Anda",
      html: `
        <p><strong>Nama:</strong> ${nama}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Nomor WA:</strong> ${noWa}</p>
        <p>Apakah data Anda sudah benar?</p>
      `,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Konfirmasi",
      cancelButtonText: "Batal",
    });

    if (!result.isConfirmed) return;

    try {
      const uid = await newRegisterUser(email, password, nama, noWa);
      Swal.fire("Sukses", "Pendaftaran berhasil! Mohon tunggu konfirmasi CS.", "success");
      router.push("/m");
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal membuat akun.");
    }
  };
  
  return (
    <div className="mobile-home-container">
      {/* === Register Form === */}
      <div className="mobile-login-form">
        <h3>Daftar</h3>
        {error && <div className="alert alert-danger">{error}</div>}
        <form onSubmit={handleRegister}>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nama Lengkap"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              className="form-control"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              placeholder="Nomor WA Aktif"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              className="form-control"
              placeholder="Konfirmasi Password"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn btn-success btn-block">
            Daftar
          </button>
        </form>
        <p className="text-center mt-3">
          Sudah punya akun? <a href="/m">Masuk</a>
        </p>
      </div>
    </div>
  );
}
