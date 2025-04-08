"use client";
import { useState, useEffect, useRef, useContext } from "react";
import { TokenContext } from "../context/tokenContext";

export default function Navbar() {
  const { totalToken, loading } = useContext(TokenContext);
  const [showDetails, setShowDetails] = useState(false);
  const detailsRef = useRef(null);

  const toggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  // Detect click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        detailsRef.current &&
        !detailsRef.current.contains(event.target)
      ) {
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
    <nav className="navbar">
      <div className="navbar-brand">Starlink Money Web App</div>
      <div className="token-container" ref={detailsRef}>
        <div className="token-card" onClick={toggleDetails}>
          <div className="token-summary">
            <span className="fw-semibold">
              Jumlah Token : {loading ? "..." : totalToken}
            </span>
          </div>
        </div>
        {showDetails && (
          <div className="token-details">
            <p>Skema Penggunaan Token :</p>
            <ul>
              <li>Transaksi: 1 Token</li>
              <li>Export Data Excel/PDF: 5 Token</li>
            </ul>
          </div>
        )}
      </div>
    </nav>
  );
}
