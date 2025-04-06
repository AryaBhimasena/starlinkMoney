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
                    <div className="foto-preview mb-3">
                      <img
                        src="/placeholder-landscape.jpg"
                        alt="Foto utama"
                        className="img-fluid rounded main-photo"
                      />
                    </div>
                    <div className="row g-2">
                      {[1, 2, 3].map((i) => (
                        <div className="col-4" key={i}>
                          <img
                            src={`/thumbnail-${i}.jpg`}
                            alt={`Thumbnail ${i}`}
                            className="img-fluid rounded thumb-photo"
                          />
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
