"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebaseConfig";
import Cookies from "js-cookie";
import { clearIndexedDB, saveUserData, syncUserData, rekonsiliasiData } from "../services/indexedDBService";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      Cookies.remove("token");
      await clearIndexedDB();
      console.log("IndexedDB cleared successfully");

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential?.user) {
        throw new Error("User credential is undefined");
      }

      const token = await userCredential.user.getIdToken(true);
      Cookies.set("token", token, { expires: 1 });
      console.log("User authenticated, token set");

      await saveUserData(userCredential.user.uid);
      console.log("✅ Data pengguna berhasil disimpan di IndexedDB");

      await syncUserData();
      console.log("✅ Sinkronisasi data pengguna selesai!");

      await rekonsiliasiData();
      console.log("✅ Rekonsiliasi saldo selesai!");

      router.push("/dashboard");
    } catch (err) {
      console.error("Error Login:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Email atau password salah.");
      } else if (err.code === "auth/user-not-found") {
        setError("Akun tidak ditemukan.");
      } else {
        setError("Terjadi kesalahan. Coba lagi nanti.");
      }
    }
  };

  return (
    <div className="home-container">
      {/* Bagian Kiri: Informasi Aplikasi */}
      <div className="home-description">
        <h1>Starlink Money - Solusi Keuangan Modern</h1>
        <p>
          Platform yang memudahkan Anda dalam mengelola transaksi keuangan secara real-time,
          dari transfer, tarik tunai, hingga top-up e-wallet dengan sistem yang efisien dan aman.
        </p>

        <ul>
          <li>✅ Kemudahan transaksi tanpa batas</li>
          <li>✅ Keamanan data tingkat tinggi</li>
          <li>✅ Manajemen saldo real-time</li>
          <li>✅ Terintegrasi dengan Google Sheets</li>
        </ul>

        {/* Ruang untuk Gambar */}
<figure className="app-image" style={{ border: "2px solid red" }}>
<Image
  src="/images/home.png" // Wajib pakai "/"
  alt="Dashboard Keuangan"
  width={500}
  height={300}
  priority
  unoptimized
/>

</figure>
      </div>

      {/* Garis Vertikal Pemisah */}
      <div className="vertical-line"></div>

      {/* Bagian Kanan: Form Login */}
      <div className="login-section">
        <h3 className="login-title">Login</h3>

        {error && <div className="alert alert-danger alert-login">{error}</div>}

        <form onSubmit={handleLogin}>
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

          <button type="submit" className="btn btn-login">
            Login
          </button>
        </form>

        {/* Informasi Registrasi */}
        <p className="register-info">
          Belum punya akun? <a href="/register">Daftar di sini</a>.
        </p>
      </div>
    </div>
  );
}
