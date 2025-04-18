"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import Swal from "sweetalert2";
import { getUserData } from "../../../services/indexedDBService";

const PageIdentitasToko = () => {
  const [namaToko, setNamaToko] = useState("");
  const [alamatToko, setAlamatToko] = useState("");
  const [kontakToko, setKontakToko] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        const entitasId = userData?.entitasId;

        if (!entitasId) {
          Swal.fire("Gagal", "Entitas ID tidak ditemukan. Silakan login ulang.", "error");
          return;
        }

        const entitasRef = doc(db, "entitas", entitasId);
        const entitasSnapshot = await getDoc(entitasRef);

        if (entitasSnapshot.exists()) {
          const data = entitasSnapshot.data();
          setNamaToko(data?.namaToko || "");
          setAlamatToko(data?.alamatToko || "");
          setKontakToko(data?.kontakToko || "");
        } else {
          console.log("Belum ada data identitas toko untuk entitas ini.");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        Swal.fire("Gagal", "Terjadi kesalahan saat mengambil data toko", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSave = async () => {
    if (!namaToko || !alamatToko || !kontakToko) {
      Swal.fire("Oops", "Semua kolom harus diisi!", "warning");
      return;
    }

    const konfirmasi = await Swal.fire({
      title: "Simpan Identitas Toko?",
      text: "Data akan disimpan ke server",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Simpan",
      cancelButtonText: "Batal",
    });

    if (!konfirmasi.isConfirmed) return;

    try {
      const userData = await getUserData();
      const entitasId = userData?.entitasId;
      if (!entitasId) {
        Swal.fire("Gagal", "Entitas ID tidak ditemukan. Silakan login ulang.", "error");
        return;
      }

      const entitasRef = doc(db, "entitas", entitasId);
      const dataBaru = {
        namaToko,
        alamatToko,
        kontakToko,
        updatedAt: new Date(),
      };

      await setDoc(entitasRef, dataBaru, { merge: true });

      Swal.fire("Berhasil", "Data identitas toko disimpan!", "success");
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      Swal.fire("Gagal", "Terjadi kesalahan saat menyimpan data", "error");
    }
  };

  const handleClickFoto = () => {
    Swal.fire("Maaf", "Layanan simpan foto saat ini sedang tidak dapat digunakan.", "info");
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <>
      {/* Header Full Width */}
      <div className="header-container">
        <h3 className="header mb-0">Identitas Toko</h3>
      </div>

      {/* Konten */}
      <div className="content content-expand">
        <div className="card shadow-sm p-3">
          <div className="card-body">
            <div className="row">
              {/* Detail Toko */}
              <div className="col-md-6 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-4 text-dark">Detail Toko</h5>
                    <div className="mb-3">
                      <label className="form-label">Nama Toko</label>
                      <input
                        type="text"
                        className="form-control"
                        value={namaToko}
                        onChange={(e) => setNamaToko(e.target.value)}
                        placeholder="Contoh: Toko Starlink"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Alamat Toko</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={alamatToko}
                        onChange={(e) => setAlamatToko(e.target.value)}
                        placeholder="Alamat lengkap"
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Kontak Toko</label>
                      <input
                        type="text"
                        className="form-control"
                        value={kontakToko}
                        onChange={(e) => setKontakToko(e.target.value)}
                        placeholder="Nomor WA atau HP"
                      />
                    </div>
                    <button className="btn btn-success w-100" onClick={handleSave}>
                      Simpan
                    </button>
                  </div>
                </div>
              </div>

              {/* Foto Toko */}
              <div className="col-md-6 mb-4">
                <div className="card h-100 border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="mb-4 text-dark">Foto Toko</h5>
						<div className="foto-preview mb-3 border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "300px" }}>
						  <img
							src="/placeholder-landscape.jpg"
							alt="Foto utama"
							className="img-fluid h-100 object-fit-cover"
							onError={(e) => {
							  e.target.style.display = "none";
							  e.target.insertAdjacentHTML('afterend', '<a href="#" class="text-decoration-none text-muted">Upload foto di sini</a>');
							}}
						  />
						</div>

						<div className="row g-2">
						  {[1, 2, 3].map((i) => (
							<div className="col-4" key={i}>
							  <div
								  className="border rounded d-flex align-items-center justify-content-center bg-light"
								  style={{ height: "80px", cursor: "pointer" }}
								  onClick={handleClickFoto}
								>
								<img
								  src={`/thumbnail-${i}.jpg`}
								  alt={`Thumbnail ${i}`}
								  className="img-fluid h-100 object-fit-cover"
								  onError={(e) => {
									e.target.style.display = "none";
									e.target.insertAdjacentHTML('afterend', '<a href="#" class="text-decoration-none text-muted small">Upload foto di sini</a>');
								  }}
								/>
							  </div>
							</div>
						  ))}
						</div>
                  </div>
                </div>
              </div>
            </div>  
          </div>
        </div>
      </div>
    </>
  );
};

export default PageIdentitasToko;
