// File: app/transaksi/top-up/TopUpEwalletModal.jsx
"use client";

import { useState, useEffect, useContext } from "react";
import Swal from "sweetalert2";

// Services
import { getUserData } from "../../../services/indexedDBService";
import {
  tambahTransaksi,
  generateNoReff,
} from "../../../services/transaksiService";
import { getSaldoByEntitasId, updateSaldo } from "../../../services/saldoService";
import { hitungSaldo } from "../../../lib/hitungSaldo";
import { gunakanToken } from "../../../services/tokenService";

// Context
import { SaldoContext } from "../../../context/SaldoContext";
import { TransaksiContext } from "../../../context/TransaksiContext";

export default function TopUpEwalletModal({ show, onClose }) {
  const { updateSaldoState } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const [entitasId, setEntitasId] = useState("");
  const [saldoList, setSaldoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatRupiah = (angka) => `Rp${angka.toLocaleString("id-ID")}`;
  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Top Up E-Wallet",
    noHp: "",
    operator: "",
    nominal: 0,
    hargaJual: 0,
    hargaModal: 0,
    sumberDana: "",
  });

  useEffect(() => {
    if (!show) return;

    const init = async () => {
      const user = await getUserData();
      if (!user?.entitasId) return;

      setEntitasId(user.entitasId);
      const saldo = await getSaldoByEntitasId(user.entitasId);
      setSaldoList(saldo || []);

      const noReff = await generateNoReff(user.entitasId, form.jenisTransaksi);
      setForm((prev) => ({ ...prev, noReff }));
    };

    init();
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const angkaFields = ["nominal", "hargaJual", "hargaModal"];

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

    try {
      const tokenResult = await gunakanToken(entitasId, 1, "Top Up E-Wallet");
      if (!tokenResult.success) throw new Error("Token gagal digunakan.");

      const sumber = saldoList.find((s) => s.id === form.sumberDana);
      if (!sumber) throw new Error("Sumber Dana tidak ditemukan.");
      if (form.hargaModal > sumber.saldo) throw new Error("Saldo tidak cukup.");

	  const uangKas = saldoList.find((s) => s.sumberDana.toLowerCase() === "uang kas");
      if (!uangKas) throw new Error("Uang Kas tidak ditemukan.");

      const noReff = await generateNoReff(entitasId, form.jenisTransaksi);

      const data = {
        ...form,
        entitasId,
        createdAt: Date.now(),
        profit: form.hargaJual - form.hargaModal,
        namaSumberDana: sumber.sumberDana,
      };

      await tambahTransaksi(data);
      const { saldoBaruSumber, saldoBaruUangKas, error } = await hitungSaldo(saldoList, data);
      if (error) throw new Error(error);
	  
      if (form.sumberDana !== uangKas.id) {
	  await updateSaldo(entitasId, form.sumberDana, saldoBaruSumber);
	  await updateSaldoState(form.sumberDana, saldoBaruSumber);
	  }

	  await updateSaldo(entitasId, uangKas.id, saldoBaruUangKas);
	  await updateSaldoState(uangKas.id, saldoBaruUangKas);

      Swal.fire("Berhasil", "Transaksi Top Up E-Wallet berhasil disimpan", "success");
      onClose();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    }

    setLoading(false);
  };

  if (!show) return null;

  return (
    <div className="mobile-modal-backdrop">
      <div className="mobile-modal-content">
        <div className="mobile-mini-bank-container">
          <div className="mobile-mini-bank-header d-flex justify-content-between align-items-center">
            <h5 className="mobile-mini-bank-title m-0">Top Up E-Wallet</h5>
            <button className="btn btn-sm btn-outline-secondary" onClick={onClose}>
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mobile-mini-bank-card">

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

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="mobile-form-label">No HP Pelanggan</label>
                  <input
                    type="text"
                    name="noHp"
                    value={form.noHp}
                    onChange={handleChange}
                    className="mobile-form-input"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="mobile-form-label">E-Wallet</label>
                  <select
                    name="operator"
                    value={form.operator}
                    onChange={handleChange}
                    className="mobile-form-input"
                  >
                    <option value="">-- Pilih E-Wallet --</option>
                    <option value="OVO">OVO</option>
                    <option value="DANA">DANA</option>
                    <option value="GoPay">GoPay</option>
                    <option value="ShopeePay">ShopeePay</option>
                    <option value="LinkAja">LinkAja</option>
                  </select>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="mobile-form-label">Nominal E-Wallet</label>
                  <input
                    type="text"
                    name="nominal"
                    value={form.nominal.toLocaleString("id-ID")}
                    onChange={handleChange}
                    className="mobile-form-input"
                  />
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

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="mobile-form-label">Harga Jual</label>
                  <input
                    type="text"
                    name="hargaJual"
                    value={form.hargaJual.toLocaleString("id-ID")}
                    onChange={handleChange}
                    className="mobile-form-input"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="mobile-form-label">Harga Modal</label>
                  <input
                    type="text"
                    name="hargaModal"
                    value={form.hargaModal.toLocaleString("id-ID")}
                    onChange={handleChange}
                    className="mobile-form-input"
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mt-3">
                <div>
                  <span className="label-total">Total Bayar:</span>{" "}
                  <strong className="nominal-total">{formatRupiah(form.hargaJual)}</strong>
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Menyimpan..." : "Simpan Transaksi"}
                </button>
              </div>

              {error && <p className="text-danger mt-2 text-center">{error}</p>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
