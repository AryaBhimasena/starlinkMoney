"use client";
import { useState, useEffect, useRef, useContext } from "react";
import { TokenContext } from "../context/tokenContext";
import { getUserData } from "../services/indexedDBService";


export default function Navbar() {
  const { totalToken, loading } = useContext(TokenContext);
  const [showDetails, setShowDetails] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [selectedPaket, setSelectedPaket] = useState({ paket: 50, bonus: 0 });
  const detailsRef = useRef(null);
  const [userData, setUserData] = useState({
  entitasId: "",
  name: "",
  email: "",
  role: "",
});


  const toggleDetails = () => setShowDetails((prev) => !prev);
  const toggleTopUp = () => setShowTopUp((prev) => !prev);

  const hargaMap = {
    50: 20000,
    400: 67000,
    1000: 139000,
  };

	useEffect(() => {
	  const fetchUser = async () => {
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
		  console.error("Gagal mengambil user dari IDB:", err);
		}
	  };

	  fetchUser();
	}, []);


  // click outside to close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        setShowDetails(false);
        setShowTopUp(false);
      }
    };

    if (showDetails) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDetails]);

const handleKonfirmasi = () => {
  const totalToken = selectedPaket.paket + selectedPaket.bonus;
  const harga = hargaMap[selectedPaket.paket];

  const pesan = `Halo CS Starlink Money 👋

Saya ingin melakukan pembelian token dengan rincian berikut:

📦 Paket: ${selectedPaket.paket} Token
🎁 Bonus: ${selectedPaket.bonus} Token
🧮 Total Token: ${totalToken}
💰 Harga: Rp${harga.toLocaleString("id-ID")}

🔐 ID User: ${userData.entitasId}
🙍‍♂️ Nama User: ${userData.name}
✉️ Email: ${userData.email}
🔑 Role: ${userData.role}

Terima kasih!`;

  const url = `https://wa.me/6282223446079?text=${encodeURIComponent(pesan)}`;
  window.open(url, "_blank");
};

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">Starlink Money Web App</div>
        <div className="token-container" ref={detailsRef}>
          <div
            className="token-card"
            onClick={toggleDetails}
            style={{ cursor: "pointer" }}
          >
            <div className="token-summary">
              <span className="fw-semibold">
                Jumlah Token : {loading ? "..." : totalToken}
              </span>
            </div>
          </div>

          {showDetails && (
            <div className="token-details mt-2 bg-light border p-3 rounded shadow-sm">
              <p className="mb-2 fw-bold">Skema Penggunaan Token :</p>
              <ul className="mb-3">
                <li>Transaksi: 1 Token</li>
                <li>Export Data Excel/PDF: 5 Token</li>
              </ul>

              <button
                className="btn btn-sm btn-primary mb-3"
                onClick={toggleTopUp}
              >
                {showTopUp ? "Tutup Pilihan Top Up" : "Top Up Token"}
              </button>

              {showTopUp && (
                <>
                  {/* List Paket */}
                  <div className="list-group mb-3">
                    {[
                      { paket: 50, bonus: 0 },
                      { paket: 400, bonus: 75 },
                      { paket: 1000, bonus: 500 },
                    ].map((item, idx) => {
                      const isActive =
                        selectedPaket.paket === item.paket &&
                        selectedPaket.bonus === item.bonus;

                      return (
                        <button
                          key={idx}
                          className={`list-group-item list-group-item-action ${
                            isActive ? "active" : ""
                          }`}
                          onClick={() => setSelectedPaket(item)}
                        >
                          Paket {item.paket} Token{" "}
                          {item.bonus > 0 ? `+ ${item.bonus} Bonus` : ""} —{" "}
                        </button>
                      );
                    })}
                  </div>

                  {/* Detail Paket */}
                  <div className="border rounded p-3 bg-white">
                    <h6>Detail Pembelian Token</h6>
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
                    <p className="text-muted small mt-3">
                      Konfirmasi pembelian dengan mengirimkan bukti pembayaran
                      kepada CS kami melalui WA ke nomor{" "}
                      <strong>0822-2344-6079</strong>
                    </p>
                    <button
                      className="btn btn-success mt-2"
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
    </>
  );
}
