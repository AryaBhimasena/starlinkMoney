"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../lib/auth";
import { FaHome, FaRegHandshake, FaChartLine, FaCog, FaSignOutAlt } from "react-icons/fa"; 
import { getUserData } from "../services/indexedDBService";

const Sidebar = ({ isOpen }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState({
    name: "Loading...",
    role: "Loading...",
    photo: "/images/starship.jpg",
  });

  // Cek apakah submenu aktif
  const isSubMenuActive = pathname.startsWith("/pengaturan");
  const isMainPengaturanActive = pathname === "/pengaturan";

  // State untuk submenu pengaturan (buka/tutup)
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(isSubMenuActive);

  // Tutup submenu jika user memilih menu lain
  useEffect(() => {
    if (!pathname.startsWith("/pengaturan")) {
      setIsPengaturanOpen(false);
    }
  }, [pathname]);

  // Ambil data user dari IndexedDB saat komponen dimuat
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userData = await getUserData();
        if (userData) {
          setUser((prevUser) => ({
            ...prevUser,
            name: userData.name || "User",
            role: userData.role || "Tidak Diketahui",
          }));
        }
      } catch (error) {
        console.error("Gagal mengambil data user dari IndexedDB:", error);
      }
    };

    fetchUserData();
  }, []);

  // Fungsi untuk menangani logout
  const handleLogout = async () => {
    await logout(router);
    router.push('/');
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"}`}>
      {/* Profile User */}
      <div className="text-center mb-4">
        <Image 
          src={user.photo} 
          alt="User Photo" 
          width={isOpen ? 80 : 50}  
          height={isOpen ? 80 : 50} 
          className="rounded-circle border mb-2" 
        />
        <h5 className={`m-0 ${isOpen ? "" : "d-none"} username-text`}>{user.name}</h5>
        <small className={` ${isOpen ? "" : "d-none"} role-text`}>{user.role}</small>
      </div>

      {/* Menu List */}
      <ul className="nav flex-column gap-2 flex-grow-1">
        <li className="nav-item">
          <Link href="/dashboard" className={`nav-link sidebar-link ${pathname === "/dashboard" ? "active" : ""}`}>
            <FaHome className={`icon ${isOpen ? "d-none" : ""}`} />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}>Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/transaksi" className={`nav-link sidebar-link ${pathname === "/transaksi" ? "active" : ""}`}>
            <FaRegHandshake className={`icon ${isOpen ? "d-none" : ""}`} />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}>Transaksi</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link href="/laporan" className={`nav-link sidebar-link ${pathname === "/laporan" ? "active" : ""}`}>
            <FaChartLine className={`icon ${isOpen ? "d-none" : ""}`} />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}>Laporan</span>
          </Link>
        </li>
        
        {/* Pengaturan */}
        <li className="nav-item">
          <div 
            className={`nav-link sidebar-link ${isMainPengaturanActive ? "active" : ""}`} 
            onClick={() => setIsPengaturanOpen(!isPengaturanOpen)}
          >
            <FaCog className={`icon ${isOpen ? "d-none" : ""}`} />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}>Pengaturan</span>
          </div>
          {(isPengaturanOpen || isSubMenuActive) && (
            <ul className="nav flex-column ms-3">
              <li className="nav-item">
                <Link href="/pengaturan/pengguna" className={`nav-link sidebar-link ${pathname === "/pengaturan/pengguna" ? "active" : ""}`}>
                  Daftar Pengguna
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/pengaturan/sumberDana" className={`nav-link sidebar-link ${pathname === "/pengaturan/sumberDana" ? "active" : ""}`}>
                  Pengaturan Sumber Dana
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/pengaturan/nama-toko" className={`nav-link sidebar-link ${pathname === "/pengaturan/nama-toko" ? "active" : ""}`}>
                  Identitas Toko
                </Link>
              </li>
              <li className="nav-item">
                <Link href="/pengaturan/jenis-transaksi" className={`nav-link sidebar-link ${pathname === "/pengaturan/jenis-transaksi" ? "active" : ""}`}>
                  Jenis Transaksi
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>

      {/* Log Out Button di Bawah */}
      <div className="logout-btn">
        <button onClick={handleLogout} className="btn btn-logout w-100">
          <FaSignOutAlt className={`icon ${isOpen ? "d-none" : ""}`} />
          <span className={`menu-text ${isOpen ? "" : "d-none"}`}>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
