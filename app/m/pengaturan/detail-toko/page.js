"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebaseConfig";
import Swal from "sweetalert2";
import { getUserData } from "../../../../services/indexedDBService";

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
      {/* Header Mobile */}
      <div className="mobile-identitas-toko-header py-3 px-4 border-bottom bg-white sticky-top">
        <h5 className="mb-0 fw-bold">Identitas Toko</h5>
      </div>

      {/* Konten */}
      <div className="mobile-identitas-toko-content p-3">

        {/* Detail Toko */}
        <div className="mobile-identitas-toko-section mb-4">
          <h6 className="mb-3 text-muted">Detail Toko</h6>

          <div className="mb-3">
            <label className="form-label small">Nama Toko</label>
            <input
              type="text"
              className="form-control mobile-identitas-toko-input"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              placeholder="Contoh: Toko Starlink"
            />
          </div>

          <div className="mb-3">
            <label className="form-label small">Alamat Toko</label>
            <textarea
              className="form-control mobile-identitas-toko-input"
              rows="3"
              value={alamatToko}
              onChange={(e) => setAlamatToko(e.target.value)}
              placeholder="Alamat lengkap"
            ></textarea>
          </div>

          <div className="mb-3">
            <label className="form-label small">Kontak Toko</label>
            <input
              type="text"
              className="form-control mobile-identitas-toko-input"
              value={kontakToko}
              onChange={(e) => setKontakToko(e.target.value)}
              placeholder="Nomor WA atau HP"
            />
          </div>

          <button className="btn btn-success w-100" onClick={handleSave}>
            Simpan
          </button>
        </div>

        {/* Foto Toko */}
        <div className="mobile-identitas-toko-section mb-4">
          <h6 className="mb-3 text-muted">Foto Toko</h6>

          <div
            className="mobile-identitas-toko-foto-preview mb-3 border rounded d-flex align-items-center justify-content-center bg-light"
            style={{ height: "200px", cursor: "pointer" }}
            onClick={handleClickFoto}
          >
            <img
              src="/placeholder-landscape.jpg"
              alt="Foto utama"
              className="img-fluid h-100 object-fit-cover"
              onError={(e) => (e.target.style.display = "none")}
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
                    onError={(e) => (e.target.style.display = "none")}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default PageIdentitasToko;
