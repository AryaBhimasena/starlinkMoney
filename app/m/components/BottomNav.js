"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  House,
  FileText,
  Settings,
  Wallet,
} from "lucide-react";

export default function BottomNav({ onMenuToggle }) {
  const pathname = usePathname();
  const router = useRouter();
  const [active, setActive] = useState("");
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const settingsRef = useRef(null);

  useEffect(() => {
    setActive(pathname);
  }, [pathname]);

  // Handle klik luar settings panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target)
      ) {
        setShowSettingsPanel(false);
        if (onMenuToggle) onMenuToggle(false); // 🆕 Hide panel → show FAB
      }
    };

    if (showSettingsPanel) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSettingsPanel]);

  const navItems = [
    { label: "Beranda", icon: <House size={20} />, path: "/m/dashboard" },
    { label: "Laporan", icon: <FileText size={20} />, path: "/m/laporan" },
    { label: "Saldo", icon: <Wallet size={20} />, path: "/m/saldo" },
    { label: "Pengaturan", icon: <Settings size={20} />, path: "/m/pengaturan" },
  ];

  const handleNav = (path) => {
    router.push(path);
    setActive(path);
    setShowSettingsPanel(false);
    if (onMenuToggle) onMenuToggle(false); // 🆕 Pindah menu → show FAB
  };

  const toggleSettingsPanel = () => {
    setShowSettingsPanel((prev) => {
      const next = !prev;
      if (onMenuToggle) onMenuToggle(next); // 🆕 Tampilkan atau sembunyikan FAB
      return next;
    });
  };

  return (
    <>
      {showSettingsPanel && (
        <div
          ref={settingsRef}
          className="mobile-settings-panel position-fixed bottom-12 start-0 end-0 bg-white border-top shadow-lg px-4 py-3"
        >
          <div className="mobile-settings-list d-flex flex-column gap-3">
            <div
              className="mobile-settings-item text-dark fw-semibold"
              onClick={() => handleNav("/m/pengaturan/pengguna")}
            >
              Daftar Pengguna
            </div>
            <div
              className="mobile-settings-item text-dark fw-semibold"
              onClick={() => handleNav("/m/pengaturan/detail-toko")}
            >
              Detail Toko
            </div>
            <div
              className="mobile-settings-item text-dark fw-semibold"
              onClick={() => handleNav("/m/pengaturan/sumber-dana")}
            >
              Sumber Dana
            </div>
          </div>
        </div>
      )}

      <div className="mobile-bottom-nav d-flex justify-content-around align-items-center px-2 py-1 shadow-lg">
        {navItems.map((item, idx) => (
          <div
            key={idx}
            className={`mobile-bottom-nav-item d-flex flex-column align-items-center justify-content-center ${
              active === item.path ? "active" : ""
            }`}
            onClick={() => {
              item.label === "Pengaturan" ? toggleSettingsPanel() : handleNav(item.path);
            }}
          >
            {item.icon}
            <small className="mt-1">{item.label}</small>
          </div>
        ))}
      </div>
    </>
  );
}
