"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { newRegisterUser } from '../../services/registerService';
import { db } from '../../lib/firebaseConfig';  // Pastikan db sudah dikonfigurasi dengan Firebase SDK
import { collection, doc, setDoc } from 'firebase/firestore';  // Import firestore functions
import Swal from 'sweetalert2';  // Import SweetAlert2

export default function RegisterPage() {
  const router = useRouter();
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [noWa, setNoWa] = useState('');
  const [password, setPassword] = useState('');
  const [konfirmasiPassword, setKonfirmasiPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cssPath = "/bootstrap/css/custom.css";
    if (!document.querySelector(`link[href="${cssPath}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssPath;
      document.head.appendChild(link);
      console.log("✅ Custom CSS berhasil dimuat:", cssPath);
    }
  }, []);

// 👉 Carousel State
  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 3); // 3 slides
  };

  // 👉 Carousel Auto Scroll
  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, currentSlide]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== konfirmasiPassword) {
      setError("Konfirmasi password tidak cocok.");
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
      router.push("/");
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal membuat akun.");
    }
  };

  return (
    <div className="home-container">
{/* Bagian Kiri: Carousel Display */}
      <div
        className="home-description carousel-display"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="carousel-slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
		  {/* === Slide 1: Deskripsi Aplikasi === */}
		  <div className="carousel-slide">
			<h1>Starlink Money - Solusi Cerdas untuk Mini Bank</h1>
			<p>
			  Kelola transaksi usaha jasa mini bank Anda dengan lebih mudah, cepat, dan akurat.
			  <br />Starlink Money menggantikan pencatatan manual dengan sistem digital yang mendokumentasikan
			  <br /><strong>seluruh transaksi perbankan dalam satu platform</strong>, memastikan keuangan lebih terorganisir dan transparan.
			</p>
			<div className="feature-list">
			  <p><span className="checkmark">✔</span> Pencatatan transaksi otomatis & akurat</p>
			  <p><span className="checkmark">✔</span> Semua transaksi perbankan terdokumentasi dalam satu platform</p>
			  <p><span className="checkmark">✔</span> Manajemen keuangan modern tanpa buku catatan</p>
			  <p><span className="checkmark">✔</span> Laporan bisnis yang dapat diakses kapan saja & di mana saja</p>
			</div>
		  </div>

			{/* === Slide 2: Paket Token === */}
			<div className="carousel-slide">
			  <h2 className="slide-title">Pilih Paket Token Sesuai Kebutuhan</h2>
			  <div className="pricing-cards">
				{/* Starter Pack */}
				<div className="pricing-card">
				  <h4>Starter Pack</h4>
				  <p className="price">Rp 20.000</p>
				  <ul>
					<li>50 Token</li>
					<li>50 Transaksi</li>
					<li>Cocok untuk pemula</li>
				  </ul>
				  <p className="card-footer">Mulai dengan fitur dasar dan coba gratis</p>
				</div>

			{/* Medium Pack */}
			<div className="pricing-card best-deal">
			  <h4>⭐ Medium Pack ⭐</h4>
			  <p className="price">Rp 67.000</p>
			  <ul>
				<li>400 Token + Bonus 75 Token</li>
				<li>Total: 475 Transaksi</li>
				<li>Biaya per transaksi: Rp 141</li>
				<li>Ideal untuk usaha menengah</li>
			  </ul>
			  <p className="card-footer highlight">Paling populer! Hemat & fleksibel</p>
			</div>

			{/* Enterprise Pack */}
			<div className="pricing-card">
			  <h4>Enterprise Pack</h4>
			  <p className="price">Rp 139.000</p>
			  <ul>
				<li>1000 Token + Bonus 500 Token</li>
				<li>Total: 1.500 Transaksi</li>
				<li>Biaya per transaksi: Rp 92</li>
				<li>Dirancang untuk skala besar</li>
			  </ul>
			  <p className="card-footer">Paket paling hemat untuk transaksi volume tinggi</p>
			</div>
		  </div>

		  {/* Bonus & Info Tambahan */}
		  <div className="token-info-box">
			<p><strong>Bonus Pendaftaran:</strong> 20 Token Gratis untuk pengguna baru</p>
			<p><strong>Skema Penggunaan Token:</strong></p>
			<ul>
			  <li>1 Token untuk setiap transaksi (deposit, penarikan, dll)</li>
			  <li>3 Token untuk export data (Excel/PDF)</li>
			</ul>
		  </div>
		</div>


		  {/* === Slide 3: Real-Time Report === */}
		  <div className="carousel-slide">
			<h1>Laporan Real-Time</h1>
			<p>
			  Dapatkan laporan bisnis dan saldo keuangan usaha jasa Anda secara real-time,<br />
			  lengkap dengan histori transaksi & laporan keuntungan berbasis tarif.
			</p>
		  </div>
		</div>

		{/* Tombol next slide */}
		<button className="btn-next-slide" onClick={nextSlide}>
		  <span className="chevron">&gt;</span>
		</button>
		</div>

      {/* Garis Vertikal Pemisah */}
      <div className="vertical-line"></div>

      {/* Bagian Kanan: Form Register */}
      <div className="login-section">
        <h3 className="login-title">Registrasi</h3>

        {error && <div className="alert alert-danger alert-login">{error}</div>}

        <form onSubmit={handleRegister}>
		  <div className="form-group">
            <label className="form-label">Nama</label>
            <input
              type="text"
              className="form-control"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
              placeholder="Nama Lengkap"
              autoFocus
            />
          </div>
		  <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Masukkan email"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">No HP</label>
            <input
              type="text"
              className="form-control"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              required
              placeholder="Nomor WA Aktif"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Masukkan password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Konfirmasi Password</label>
            <input
              type="password"
              className="form-control"
              value={konfirmasiPassword}
              onChange={(e) => setKonfirmasiPassword(e.target.value)}
              required
              placeholder="Ulangi password"
            />
          </div>

          <button type="submit" className="btn btn-login" disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <p className="register-info">
          Sudah punya akun? <a href="/">Login di sini</a>.
        </p>
      </div>
    </div>
  );
}
