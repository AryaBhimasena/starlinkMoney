'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../lib/firebaseConfig';
import Cookies from 'js-cookie';
import {
  clearIndexedDB,
  saveUserData,
  syncUserData,
  rekonsiliasiData,
  getUserData,
  fetchAndSaveTokenData,
} from '../../services/indexedDBService';
import Image from 'next/image';

export default function MobileLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const [currentSlide, setCurrentSlide] = useState(0);
  const [paused, setPaused] = useState(false);
  const [startX, setStartX] = useState(0);
	
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % 3);

  };

  useEffect(() => {
    const cssPath = '/bootstrap/css/mobile.css';
    if (!document.querySelector(`link[href="${cssPath}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssPath;
      document.head.appendChild(link);
      console.log('✅ Mobile CSS berhasil dimuat:', cssPath);
    }
  }, []);

  useEffect(() => {
    if (paused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [paused, currentSlide]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      Cookies.remove('token');
      await clearIndexedDB();

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      if (!userCredential?.user) throw new Error('User credential is undefined');

      const token = await userCredential.user.getIdToken(true);
      Cookies.set('token', token, { expires: 1 });

      await saveUserData(userCredential.user.uid);
      await syncUserData();
      const userData = await getUserData();
      const entitasId = userData?.entitasId;
      if (!entitasId) throw new Error('entitasId tidak ditemukan');

      await fetchAndSaveTokenData(entitasId);
      await rekonsiliasiData();

      router.push('/m/dashboard');
    } catch (err) {
      console.error('Error Login:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        setError('Email atau password salah.');
      } else if (err.code === 'auth/user-not-found') {
        setError('Akun tidak ditemukan.');
      } else {
        setError('Terjadi kesalahan. Coba lagi nanti.');
      }
    }
  };

return (
  <div className="mobile-home-container">
    {/* === Carousel === */}
    <div
      className="mobile-carousel"
      onTouchStart={(e) => {
        setPaused(true);
        setStartX(e.touches[0].clientX);
      }}
      onTouchEnd={(e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (diff > 50) nextSlide();
        if (diff < -50) setCurrentSlide((prev) => (prev - 1 + 3) % 3);
        setPaused(false);
      }}
    >
      <div
        className="carousel-slides"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        <div className="carousel-slide">
          <h2>Starlink Money</h2>
          <p>Solusi digital untuk usaha mini bank Anda.</p>
          <ul className="checklist">
            <li> Transaksi otomatis</li>
            <li> Laporan real-time</li>
            <li> Semua dalam satu platform</li>
          </ul>
        </div>
        <div className="carousel-slide">
          <h3>Paket Token</h3>
          <ul className="token-pack">
            <li><strong>Starter:</strong> 50 Token (Rp 20rb)</li>
            <li><strong>Medium:</strong> 475 Token (Rp 67rb)</li>
            <li><strong>Enterprise:</strong> 1.500 Token (Rp 139rb)</li>
          </ul>
          <p className="bonus-info">Bonus: 20 Token untuk pengguna baru!</p>
        </div>
        <div className="carousel-slide">
          <h2>Laporan Keuangan</h2>
          <p>
            Dapatkan laporan saldo dan histori transaksi <br />
            secara langsung & transparan.
          </p>
        </div>
      </div>

      {/* === Dots === */}
      <div className="carousel-dots">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={i === currentSlide ? 'dot active' : 'dot'}
            onClick={() => {
              setCurrentSlide(i);
              setPaused(true);
            }}
          ></span>
        ))}
      </div>
    </div>

    {/* === Login Form === */}
    <div className="mobile-login-form">
      <h3>Login</h3>
      {error && <div className="alert alert-danger">{error}</div>}
      <form onSubmit={handleLogin}>
        <div className="form-group">
          <input
            type="email"
            className="form-control"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
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
        <button type="submit" className="btn btn-primary btn-block">
          Masuk
        </button>
      </form>
      <p className="text-center mt-3">
        Belum punya akun? <a href="/m/register">Daftar</a>
      </p>
    </div>
  </div>
);

}
