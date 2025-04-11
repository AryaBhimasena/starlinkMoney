"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { TokenContext } from "../../../context/tokenContext";
import { useRouter } from "next/navigation";
import { getUserData } from "../../../services/indexedDBService";

export default function NavbarMobile() {
  const { totalToken, loading } = useContext(TokenContext);
  const [showDetails, setShowDetails] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState({ paket: 50, bonus: 0 });
  const [userData, setUserData] = useState({
    entitasId: "",
    name: "",
    email: "",
    role: "",
  });
  const detailsRef = useRef(null);
  const router = useRouter();

  const hargaMap = {
    50: 20000,
    400: 67000,
    1000: 139000,
  };

  // Ambil data user dari IDB
  useEffect(() => {
    (async () => {
      try {
        const data = await getUserData();
        if (data) {
          setUserData({
            entitasId: data.entitasId,
            name: data.name,
            email: data.email,
            role: data.role,
          });
        }
      } catch (err) {
        console.error("Gagal ambil userData:", err);
      }
    })();
  }, []);

  // Toggle detail box
  const toggleDetails = () => {
    setShowDetails((v) => !v);
    if (showTopUp) setShowTopUp(false);
  };

  // Toggle top up UI
  const toggleTopUp = () => setShowTopUp((v) => !v);

  // Tutup saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (detailsRef.current && !detailsRef.current.contains(e.target)) {
        setShowDetails(false);
        setShowTopUp(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    indexedDB.deleteDatabase("StarlinkDB");
    router.replace("/m");
  };

  const handleKonfirmasi = () => {
    const total = selectedPaket.paket + selectedPaket.bonus;
    const harga = hargaMap[selectedPaket.paket];
    const pesan = `Halo CS Starlink Money 👋

Saya ingin melakukan pembelian token dengan rincian berikut:

📦 Paket: ${selectedPaket.paket} Token
🎁 Bonus: ${selectedPaket.bonus} Token
🧮 Total Token: ${total}
💰 Harga: Rp${harga.toLocaleString("id-ID")}

🔐 ID User: ${userData.entitasId}
🙍‍♂️ Nama User: ${userData.name}
✉️ Email: ${userData.email}
🔑 Role: ${userData.role}

Terima kasih!`;

    window.open(
      `https://wa.me/6282223446079?text=${encodeURIComponent(pesan)}`,
      "_blank"
    );
  };

  return (
    <nav className="navbar-mobile d-flex justify-content-between align-items-center px-3 py-2 shadow-sm">
      {/* Logout */}
      <button
        className="mobile-btn-logout text-danger small fw-semibold"
        onClick={handleLogout}
      >
        Logout
      </button>

      {/* Judul */}
      <div className="mobile-navbar-title styled-brand">
        Starlink Money
      </div>

      {/* Token */}
      <div className="mobile-token-wrapper" ref={detailsRef}>
        <div
          className="mobile-token-card"
          onClick={toggleDetails}
        >
          <span className="mobile-token-label">
            Token: {loading ? "..." : totalToken}
          </span>
        </div>

        {showDetails && (
          <div className="mobile-token-details-box">
            <p className="mb-1 fw-bold small">Skema Penggunaan Token:</p>
            <ul className="ps-3 mb-2 small">
              <li>Transaksi: 1 Token</li>
              <li>Export Data Excel/PDF: 5 Token</li>
            </ul>

            <button
              className="btn btn-sm btn-primary w-100 mb-2"
              onClick={toggleTopUp}
            >
              {showTopUp ? "Tutup Pilihan Top Up" : "Top Up Token"}
            </button>

            {showTopUp && (
              <>
                {/* List Paket */}
                <div className="list-group mb-2 mobile-token-list-group">
                  {[
                    { paket: 50, bonus: 0 },
                    { paket: 400, bonus: 75 },
                    { paket: 1000, bonus: 500 },
                  ].map((item, idx) => {
                    const active =
                      selectedPaket.paket === item.paket &&
                      selectedPaket.bonus === item.bonus;
                    return (
                      <button
                        key={idx}
                        className={`list-group-item list-group-item-action ${
                          active ? "active" : ""
                        }`}
                        onClick={() => setSelectedPaket(item)}
                      >
                        Paket {item.paket} Token
                        {item.bonus > 0 ? ` + ${item.bonus} Bonus` : ""}
                      </button>
                    );
                  })}
                </div>

                {/* Detail Paket */}
                <div className="mobile-token-summary-box">
                  <p>
                    <strong>Paket:</strong> {selectedPaket.paket} Token
                  </p>
                  <p>
                    <strong>Bonus:</strong> {selectedPaket.bonus} Token
                  </p>
                  <p>
                    <strong>Total:</strong>{" "}
                    {selectedPaket.paket + selectedPaket.bonus} Token
                  </p>
                  <p>
                    <strong>Harga:</strong>{" "}
                    Rp{hargaMap[selectedPaket.paket].toLocaleString("id-ID")}
                  </p>
                  <p className="mobile-token-info">
                    Konfirmasi pembelian dengan mengirimkan bukti pembayaran
                    kepada CS kami melalui WA ke nomor{" "}
                    <strong>0822-2344-6079</strong>
                  </p>
                  <button
                    className="btn btn-success w-100 mobile-token-btn-konfirmasi"
                    onClick={handleKonfirmasi}
                  >
                    Konfirmasi Pembelian
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
