"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { logout } from "../lib/auth";
import { FaHome, FaRegHandshake, FaChartLine, FaCog } from "react-icons/fa";
import { getUserData } from "../services/indexedDBService";
import { FiChevronRight, FiChevronLeft } from "react-icons/fi";

const Sidebar = ({ isOpen, setIsOpen }) => {
  const pathname = usePathname();
  const router = useRouter();

  const [user, setUser] = useState({
    name: "Loading...",
    role: "Loading...",
    photo: "/images/starship.jpg",
  });

  const isSubMenuActive = pathname.startsWith("/pengaturan");
  const isMainPengaturanActive = pathname === "/pengaturan";
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(isSubMenuActive);

  useEffect(() => {
    if (!pathname.startsWith("/pengaturan")) {
      setIsPengaturanOpen(false);
    }
  }, [pathname]);

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

  const handleLogout = async () => {
    sessionStorage.clear();
	await logout(router);
    router.push("/");
  };

  const toggleSidebar = () => {
    setIsOpen((prev) => !prev);
  };

  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {
      setIsOpen(false); // Menutup sidebar saat menu dipilih pada layar kecil
    }
  };

  return (
    <div className={`sidebar ${isOpen ? "open" : "closed"} responsive-sidebar`}>
      <div className="toggle-btn text-end mb-2">
        <button className="btn btn-sm toggle-icon" onClick={toggleSidebar}>
          {isOpen ? <FiChevronLeft /> : <FiChevronRight />}
        </button>
      </div>

      <div className="text-center mb-3">
        <Image
          src={user.photo}
          alt="User Photo"
          width={isOpen ? 80 : 50}
          height={isOpen ? 80 : 50}
          className="rounded-circle border mb-2"
        />
        {isOpen && (
          <>
            <h5 className="m-0 username-text">{user.name}</h5>
            <small className="role-text">{user.role}</small>
            <br />
            <a
              href="#"
              onClick={handleLogout}
              className="text-decoration-underline text-danger small d-block mt-1"
            >
              Logout
            </a>
          </>
        )}
      </div>

      <ul className="nav flex-column gap-2 flex-grow-1">
        <li className="nav-item">
          <Link
            href="/dashboard"
            className={`nav-link sidebar-link ${pathname === "/dashboard" ? "active" : ""}`}
            onClick={handleMenuClick}
          >
            <FaHome className="icon" />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}> Dashboard</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/transaksi"
            className={`nav-link sidebar-link ${pathname === "/transaksi" ? "active" : ""}`}
            onClick={handleMenuClick}
          >
            <FaRegHandshake className="icon" />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}> Transaksi</span>
          </Link>
        </li>
        <li className="nav-item">
          <Link
            href="/laporan"
            className={`nav-link sidebar-link ${pathname === "/laporan" ? "active" : ""}`}
            onClick={handleMenuClick}
          >
            <FaChartLine className="icon" />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}> Laporan</span>
          </Link>
        </li>
        <li className="nav-item">
          <div
            className={`nav-link sidebar-link ${isMainPengaturanActive ? "active" : ""}`}
            onClick={() => setIsPengaturanOpen(!isPengaturanOpen)}
          >
            <FaCog className="icon" />
            <span className={`menu-text ${isOpen ? "" : "d-none"}`}> Pengaturan</span>
          </div>
          {(isPengaturanOpen || isSubMenuActive) && isOpen && (
            <ul className="nav flex-column ms-3">
              <li className="nav-item">
                <Link
                  href="/pengaturan/pengguna"
                  className={`nav-link sidebar-link ${pathname === "/pengaturan/pengguna" ? "active" : ""}`}
                  onClick={handleMenuClick}
                >
                  Daftar Pengguna
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href="/pengaturan/sumberDana"
                  className={`nav-link sidebar-link ${pathname === "/pengaturan/sumberDana" ? "active" : ""}`}
                  onClick={handleMenuClick}
                >
                  Pengaturan Sumber Dana
                </Link>
              </li>
              <li className="nav-item">
                <Link
                  href="/pengaturan/detail-toko"
                  className={`nav-link sidebar-link ${pathname === "/pengaturan/detail-toko" ? "active" : ""}`}
                  onClick={handleMenuClick}
                >
                  Identitas Toko
                </Link>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
