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
      <h1>Starlink Money - Solusi Cerdas untuk Mini Bank</h1>
      <p>
        Kelola transaksi usaha jasa mini bank Anda dengan lebih mudah, cepat, dan akurat. 
        Starlink Money menggantikan pencatatan manual dengan sistem digital yang mendokumentasikan 
        <strong> seluruh transaksi perbankan dalam satu platform</strong>, memastikan keuangan lebih terorganisir dan transparan.
      </p>

      <div className="feature-list">
        <p><span className="checkmark">✔</span> Pencatatan transaksi otomatis & akurat</p>
        <p><span className="checkmark">✔</span> Semua transaksi perbankan terdokumentasi dalam satu platform</p>
        <p><span className="checkmark">✔</span> Manajemen keuangan modern tanpa buku catatan</p>
        <p><span className="checkmark">✔</span> Laporan bisnis yang dapat diakses kapan saja & dimana saja</p>
      </div>
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