// app/transaksi/mini-bank/MiniBankModal.jsx
"use client";

import { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";

// Services
import { getUserData } from "../../../services/indexedDBService";
import {
  tambahTransaksi,
  generateNoReff,
  rollbackTransaksi,
} from "../../../services/transaksiService";
import { getSaldoByEntitasId, updateSaldo } from "../../../services/saldoService";
import { hitungSaldo } from "../../../lib/hitungSaldo";
import { gunakanToken } from "../../../services/tokenService";

// Context
import { TransaksiContext } from "../../../context/TransaksiContext";
import { SaldoContext } from "../../../context/SaldoContext";

export default function MiniBankModal({ show, onClose }) {
  const { updateSaldoState } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const [success, setSuccess] = useState("");
  const formatRupiah = (angka) => `Rp${angka.toLocaleString("id-ID")}`;

  const initialForm = {
    date: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Transfer",
    pelanggan: "Umum",
    penerima: "",
    noRekening: "",
    nominal: 0,
    tarif: 0,
    admin: 0,
    sumberDana: "",
  };

  const [form, setForm] = useState(initialForm);
  const [entitasId, setEntitasId] = useState("");
  const [saldoList, setSaldoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!show) return; // hanya jalan saat modal dibuka

    const init = async () => {
      const user = await getUserData();
      if (!user?.entitasId) return;

      setEntitasId(user.entitasId);
      const saldo = await getSaldoByEntitasId(user.entitasId);
      setSaldoList(saldo || []);

      if (form.jenisTransaksi) {
        const noReff = await generateNoReff(user.entitasId, form.jenisTransaksi);
        setForm((prev) => ({ ...prev, noReff }));
      }
    };
    init();
  }, [show]);

    // useEffect 2: Update noReff saat jenisTransaksi berubah
  useEffect(() => {
    const updateNoReffByJenis = async () => {
      if (!entitasId || !form.jenisTransaksi) return;

      const newNoReff = await generateNoReff(entitasId, form.jenisTransaksi);
      setForm((prev) => ({ ...prev, noReff: newNoReff }));
    };

    updateNoReffByJenis();
  }, [form.jenisTransaksi, entitasId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const angkaFields = ["nominal", "tarif"];

    if (angkaFields.includes(name)) {
      const cleaned = value.replace(/\D/g, "");
      const asNumber = Number(cleaned);
      e.target.value = asNumber.toLocaleString("id-ID");
      setForm((prev) => ({ ...prev, [name]: asNumber }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
	setSuccess("");

    try {
      const tokenResult = await gunakanToken(entitasId, 1, "Mini Bank");
      if (!tokenResult.success) throw new Error("Token gagal digunakan.");

      const sumber = saldoList.find((s) => s.id === form.sumberDana);
      if (!sumber) throw new Error("Sumber Dana tidak ditemukan.");
       if (form.jenisTransaksi === "Tarik Tunai") {
      const uangKas = saldoList.find((s) => s.sumberDana.toLowerCase() === "uang kas");
      if (!uangKas) throw new Error("Uang Kas tidak ditemukan.");
      if (form.nominal > uangKas.saldo) throw new Error("Saldo Uang Kas tidak cukup.");
    } else {
      
	  // Jika bukan Tarik Tunai, cek sumber dana yang dipilih
      const sumber = saldoList.find((s) => s.id === form.sumberDana);
      if (!sumber) throw new Error("Sumber Dana tidak ditemukan.");
      if (form.nominal > sumber.saldo) throw new Error("Saldo tidak cukup.");
    }

      const uangKas = saldoList.find((s) => s.sumberDana.toLowerCase() === "uang kas");
      if (!uangKas) throw new Error("Uang Kas tidak ditemukan.");

      const noReff = await generateNoReff(entitasId, form.jenisTransaksi);
      const data = {
        ...form,
        noReff,
        entitasId,
        createdAt: Date.now(),
        profit: Number(form.tarif),
        namaSumberDana: sumber.sumberDana,
      };

      const transaksi = await tambahTransaksi(data);
      const { saldoBaruSumber, saldoBaruUangKas, error } = await hitungSaldo(saldoList, data);
      if (error) throw new Error(error);

      if (form.sumberDana !== uangKas.id) {
        await updateSaldo(entitasId, form.sumberDana, saldoBaruSumber);
      }
      await updateSaldo(entitasId, uangKas.id, saldoBaruUangKas);

      await updateSaldoState(sumber.id, saldoBaruSumber);

      Swal.fire("Berhasil", "Transaksi berhasil disimpan", "success");
      onClose(); // Tutup modal
	  
	  const newNoReff = await generateNoReff(entitasId, form.jenisTransaksi);
      setForm({ ...initialForm, noReff: newNoReff });

    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    }

    setLoading(false);
  };

  // Options jenis transaksi
  const jenisTransaksiOptions = [
    { label: "Transfer", value: "Transfer" },
    { label: "Tarik Tunai", value: "Tarik Tunai" },
    { label: "Setor Tunai", value: "Setor Tunai" },
  ];

  if (!show) return null;
  
  const totalBayar = form.nominal + form.tarif;

return (
  <div className="mobile-modal-backdrop">
    <div className="mobile-modal-content">
      <div className="mobile-mini-bank-container">
        <div className="mobile-mini-bank-header d-flex justify-content-between align-items-center">
          <h5 className="mobile-mini-bank-title m-0">Transaksi Mini Bank</h5>
          <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mobile-mini-bank-card">
            {/* Tanggal, No Reff */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Tanggal</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="mobile-form-input"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">No Reff</label>
                <input
                  type="text"
                  name="noReff"
                  value={form.noReff}
                  readOnly
                  className="mobile-form-input disabled-input"
                />
              </div>
            </div>

            {/* Jenis Transaksi, Sumber Dana */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Jenis Transaksi</label>
                <select
                  name="jenisTransaksi"
                  value={form.jenisTransaksi}
                  onChange={handleChange}
                  className="mobile-form-input"
                >
                  <option value="">-- Pilih --</option>
                  {jenisTransaksiOptions.map((opt, idx) => (
                    <option key={opt.value || idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Sumber Dana</label>
                <select
                  name="sumberDana"
                  value={form.sumberDana}
                  onChange={handleChange}
                  className="mobile-form-input"
                >
                  <option value="">-- Pilih --</option>
                  {saldoList.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.sumberDana} - {formatRupiah(item.saldo)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Pelanggan, Penerima */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Pelanggan</label>
                <input
                  type="text"
                  name="pelanggan"
                  value={form.pelanggan}
                  readOnly
                  className="mobile-form-input disabled-input"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Penerima</label>
                <input
                  type="text"
                  name="penerima"
                  value={form.penerima}
                  onChange={handleChange}
                  className="mobile-form-input"
                />
              </div>
            </div>

            {/* No Rekening, Nominal */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">No Rekening</label>
                <input
                  type="text"
                  name="noRekening"
                  value={form.noRekening}
                  onChange={handleChange}
                  className="mobile-form-input"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Nominal</label>
                <input
				  type="text"
				  name="nominal"
				  value={form.nominal.toLocaleString("id-ID")}
				  onChange={handleChange}
				  className="mobile-form-input"
				/>
              </div>
            </div>

            {/* Tarif, Admin */}
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Tarif</label>
                <input
				  type="text"
				  name="tarif"
				  value={form.tarif.toLocaleString("id-ID")}
				  onChange={handleChange}
				  className="mobile-form-input"
				/>
              </div>

              <div className="col-md-6 mb-3">
                <label className="mobile-form-label">Admin (Biaya Admin)</label>
                <input
				  type="text"
				  name="admin"
				  value={form.admin.toLocaleString("id-ID")}
				  onChange={handleChange}
				  className="mobile-form-input"
				/>
              </div>
            </div>

            {/* Button */}
            <div className="mobile-mini-bank-submit d-flex justify-content-between align-items-center mt-3">
			  <div className="total-bayar-box">
				<span className="label-total">Total Bayar:</span>
				<strong className="nominal-total">{formatRupiah(totalBayar)}</strong>
			  </div>

			  <button type="submit" className="btn btn-primary" disabled={loading}>
				{loading ? "Menyimpan..." : "Simpan Transaksi"}
			  </button>
			</div>

            {error && <p className="text-danger mt-2 text-center">{error}</p>}
            {success && <p className="text-success mt-2 text-center">{success}</p>}
          </div>
        </form>
      </div>
    </div>
  </div>
);
};