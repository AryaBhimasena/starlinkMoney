'use client';

import { useEffect, useState } from "react";
import { Clock3, X } from "lucide-react";

export default function ModalPromo({ onClose }) {
  const [countdown, setCountdown] = useState("");

  useEffect(() => {
    const endTime = new Date("2025-04-18T22:00:00+07:00");
    const interval = setInterval(() => {
      const now = new Date();
      const diff = endTime - now;

      if (diff <= 0) {
        setCountdown("00:00:00");
        clearInterval(interval);
        return;
      }

      const h = String(Math.floor(diff / (1000 * 60 * 60))).padStart(2, "0");
      const m = String(Math.floor((diff / (1000 * 60)) % 60)).padStart(2, "0");
      const s = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");

      setCountdown(`${h}:${m}:${s}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleBuy = () => {
    const msg = encodeURIComponent(
      "Halo, saya tertarik untuk membeli paket Enterprise 99rb (1000 token + bonus 500 token)."
    );
    window.open(`https://wa.me/6281234567890?text=${msg}`, "_blank");
  };

  return (
    <div className="modal-overlay">
      <div className="poster">
        {/* === CLOSE BUTTON === */}
        <button className="close-button" onClick={onClose}>
          <X size={20} />
        </button>

        {/* ===== HEADER ===== */}
        <div className="poster-section">
          <div className="poster-header">
            <div className="countdown-box">
              
            </div>
            <div className="speech-box top">
              <Clock3 size={20} style={{ marginRight: 6 }} />
              <span>{countdown}</span>
              <div className="triangle top-triangle"></div>
            </div>
          </div>
        </div>

        {/* ===== BODY ===== */}
		<div className="poster-section poster-body">
		  <div className="poster-speech-box main full-body">
			<div className="poster-main-grid">
			  <div className="poster-main-text">
				<div>DA</div>
				<div>PAT</div>
				<div>KAN</div>
				<div>SE</div>
				<div>GERA!</div>
			  </div>
			  <div className="poster-main-offer">
				<p className="poster-offer-line">
				  Paket Enterprise {" "}
									  <span
										style={{
										  textDecoration: "line-through",
										  color: "#f87171",
										  marginRight: "6px",
										}}
									  >
										139rb
									  </span><br />
				  hanya dengan {" "}
									  <strong
										style={{
										  color: "#facc15",
										  fontSize: "30px",
										  fontWeight: "bold",
										}}
									  >
										99rb
									  </strong>{" "} saja!
				</p>
			  </div>
			</div>
			<div className="triangle main-triangle"></div>
		  </div>
		</div>

        {/* ===== FOOTER ===== */}
        <div className="poster-section poster-footer">
          <div className="bottom-grid">
			  <div className="poster-column double">
				<button className="buy-button" onClick={handleBuy}>
				  Beli Sekarang
				</button>
			  </div>
			  <div className="poster-column">
				<h3 className="poster-col-header">KEUNTUNGAN</h3>
				<p className="poster-col-body">
				  1.000 Token <br />
				  + 500 Token <br />
				  TOTAL 1.500 Token
				</p>
			  </div>
			  <div className="poster-column">
				<h3 className="poster-col-header">INFO</h3>
				<p className="poster-col-body">
				  WA : <br />0822-2344-6079
				</p>
			  </div>
			</div>
        </div>
      </div>
    </div>
  );
}
