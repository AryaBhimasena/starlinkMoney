"use client";

import { useState } from "react";

const PageIdentitasToko = () => {
  const [namaToko, setNamaToko] = useState("");
  const [alamatToko, setAlamatToko] = useState("");
  const [kontakToko, setKontakToko] = useState("");

  const handleSave = () => {
    // Simpan data identitas toko
    console.log({ namaToko, alamatToko, kontakToko });
  };

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

          <div className="mobile-identitas-toko-foto-preview mb-3 border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "200px" }}>
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
                <div className="border rounded d-flex align-items-center justify-content-center bg-light" style={{ height: "80px" }}>
                  <img
                    src={`/thumbnail-${i}.jpg`}
                    alt={`Thumbnail ${i}`}
                    className="img-fluid h-100 object-fit-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.insertAdjacentHTML('afterend', '<a href="#" class="text-decoration-none text-muted small">Upload foto</a>');
                    }}
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
