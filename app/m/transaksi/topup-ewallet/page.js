"use client";

import { useEffect, useState, useContext } from "react";
import Swal from "sweetalert2";

import { getUserData } from "../../../../services/indexedDBService";
import {
  tambahTransaksi,
  generateNoReff,
  rollbackTransaksi,
} from "../../../../services/transaksiService";
import { getSaldoByEntitasId, updateSaldo } from "../../../../services/saldoService";
import { hitungSaldo } from "../../../../lib/hitungSaldo";
import { gunakanToken } from "../../../../services/tokenService";

import { SaldoContext } from "../../../../context/SaldoContext";
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { TokenContext } from "../../../../context/tokenContext";

export default function TopUpEWalletPage() {
  const { updateSaldoState } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  const initialForm = {
    date: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Top Up E-Wallet",
    sumberDana: "",
	jenisEwallet: "",
    namaCustomer: "",
    noHp: "",
    nominal: 0,
    hargaJual: 0,
    hargaModal: 0,
  };

  const [form, setForm] = useState(initialForm);
  const [entitasId, setEntitasId] = useState("");
  const [saldoList, setSaldoList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatRupiah = (angka) => `Rp${angka.toLocaleString("id-ID")}`;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        if (!userData?.entitasId) return setError("Entitas tidak ditemukan.");

        setEntitasId(userData.entitasId);
        const saldoData = await getSaldoByEntitasId(userData.entitasId);
        setSaldoList(Array.isArray(saldoData) ? saldoData : []);

        const noReff = await generateNoReff(userData.entitasId, "Top Up E-Wallet");
        setForm((prev) => ({ ...prev, noReff }));
      } catch (err) {
        setError("Gagal mengambil data pengguna atau saldo.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["nominal", "hargaJual", "hargaModal"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!entitasId) return alert("Entitas ID belum ditemukan.");
    if (!form.nominal || !form.sumberDana || !form.namaCustomer || !form.noHp)
      return alert("Lengkapi semua data yang wajib.");

    let transaksiBaru = null;
    let saldoData = null;
    let uangKasId = null;

    try {
      const tokenResult = await gunakanToken(entitasId, 1, "Top Up E-Wallet");
      if (!tokenResult.success) throw new Error(tokenResult.error || "Gagal menggunakan token.");

      saldoData = saldoList.find(item =>
        [item.id, item.nama, item.sumberDana].map(x => x?.toLowerCase().trim())
          .includes(form.sumberDana.toLowerCase().trim())
      );

      if (!saldoData) throw new Error(`Sumber Dana '${form.sumberDana}' tidak ditemukan.`);
      if (form.nominal > saldoData.saldo) throw new Error(`Saldo tidak mencukupi.`);

      const uangKas = saldoList.find(item => item.sumberDana.toLowerCase() === "uang kas");
      if (!uangKas) throw new Error("Sumber Dana 'Uang Kas' tidak ditemukan.");
      uangKasId = uangKas.id;

      const noReffBaru = await generateNoReff(entitasId, "Top Up E-Wallet");

      const transaksiData = {
        ...form,
        noReff: noReffBaru,
        entitasId,
        createdAt: Date.now(),
        profit: Number(form.hargaJual) - Number(form.hargaModal),
        namaSumberDana: saldoData.sumberDana,
      };

      transaksiBaru = await tambahTransaksi(transaksiData);
      if (!transaksiBaru) throw new Error("Gagal menyimpan transaksi.");

      const { saldoBaruSumber, saldoBaruUangKas, error } = await hitungSaldo(saldoList, transaksiData);
      if (error) throw new Error(error);

      await updateSaldo(entitasId, form.sumberDana, saldoBaruSumber);
      await updateSaldo(entitasId, uangKasId, saldoBaruUangKas);
      await updateSaldoState(saldoData.id, transaksiData);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Transaksi berhasil disimpan.",
      });

      const newNoReff = await generateNoReff(entitasId, "Top Up E-Wallet");
      setForm({ ...initialForm, noReff: newNoReff });
      const updatedSaldo = await getSaldoByEntitasId(entitasId);
      setSaldoList(updatedSaldo);
    } catch (err) {
      if (transaksiBaru?.id) await rollbackTransaksi(transaksiBaru.id);
      setError(err.message || "Gagal menyimpan transaksi.");
    }

    setLoading(false);
  };

  return (
    <div className="mobile-mini-bank-container">
      <div className="mobile-mini-bank-header">
        <h5 className="mobile-mini-bank-title">Top Up E-Wallet</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          {[
            { label: "Tanggal", type: "date", name: "date" },
            { label: "No Reff", type: "text", name: "noReff", readOnly: true },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: saldoList.map((item) => ({
                label: `${item.sumberDana} - ${formatRupiah(item.saldo)}`,
                value: item.id,
              })),
            },
			{ label: "Jenis E-Wallet", type: "select", name: "jenisEwallet", options: [
			  { label: "Dana", value: "Dana" },
			  { label: "OVO", value: "OVO" },
			  { label: "GoPay", value: "GoPay" },
			  { label: "ShopeePay", value: "ShopeePay" },
			  { label: "LinkAja", value: "LinkAja" },
			] },
            { label: "Nama Customer", type: "text", name: "namaCustomer" },
            { label: "Nomor HP", type: "text", name: "noHp" },
            { label: "Nominal", type: "number", name: "nominal" },
            { label: "Harga Jual", type: "number", name: "hargaJual" },
            { label: "Harga Modal", type: "number", name: "hargaModal" },
          ].map((field, index) => (
            <div className="mobile-form-row" key={index}>
              <span className="mobile-form-label">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className="mobile-form-input"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih --</option>
                  {field.options.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mobile-form-input"
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  readOnly={field.readOnly || false}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mobile-mini-bank-submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
      </form>
    </div>
  );
}
