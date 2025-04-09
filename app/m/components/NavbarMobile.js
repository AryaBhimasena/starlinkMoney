"use client";

import { useState, useEffect, useRef, useContext } from "react";
import { TokenContext } from "../../../context/tokenContext"; // path disesuaikan untuk versi mobile

export default function NavbarMobile() {
  const { totalToken, loading } = useContext(TokenContext);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef(null);

  const toggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  // Tutup detail saat klik di luar komponen
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setShowDetails(false);
      }
    };

    if (showDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetails]);

  return (
    <nav className="navbar-mobile d-flex justify-content-between align-items-center px-3 py-2 shadow-sm">
      <div className="navbar-brand-mobile fw-bold text-primary">Starlink Money</div>
      <div className="token-container-mobile position-relative" ref={detailsRef}>
        <div className="token-card-mobile" onClick={toggleDetails}>
          <div className="token-summary-mobile">
            <span className="fw-semibold">
              Token: {loading ? "..." : totalToken}
            </span>
          </div>
        </div>
        {showDetails && (
          <div className="token-details-mobile position-absolute bg-white p-2 rounded shadow mt-1 end-0" style={{ zIndex: 10 }}>
            <p className="mb-1">Skema Penggunaan Token:</p>
            <ul className="mb-0 ps-3 small">
              <li>Transaksi: 1 Token</li>
              <li>Export Data Excel/PDF: 5 Token</li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
