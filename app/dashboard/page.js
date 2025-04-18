"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import { useEffect, useState, useContext } from "react";
import { TransaksiContext } from "../../context/TransaksiContext";
import { SaldoContext } from "../../context/SaldoContext"; // Pastikan kamu sudah buat ini
import ModalPromo from "../../components/ModalPenawaran";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function HomePage() {
  const { transaksi } = useContext(TransaksiContext);
  const { saldo } = useContext(SaldoContext);

  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [dataHarian, setDataHarian] = useState([]);
  const [showPromo, setShowPromo] = useState(false);

  useEffect(() => {
    const hasSeenPromo = sessionStorage.getItem("hasSeenPromoModal");
    if (!hasSeenPromo) {
      setShowPromo(true);
      sessionStorage.setItem("hasSeenPromoModal", "true");
    }
  }, []);

  useEffect(() => {
    if (!transaksi || transaksi.length === 0) return;

    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const tanggalHariIni = today.toISOString().split("T")[0]; // yyyy-mm-dd

    let totalTransaksiHariIni = 0;
    let omzetHariIni = 0;
    let profitHariIni = 0;

    const transaksiByDate = {}; // key: dd-mm
    const formatTanggalKey = (dateObj) => {
      const dd = String(dateObj.getDate()).padStart(2, "0");
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      return `${dd}-${mm}`;
    };

    transaksi.forEach((data) => {
      const createdAt = data.createdAt?.toDate?.();
      if (!createdAt) return;

      const tanggalKey = formatTanggalKey(createdAt);
      const tanggalString = createdAt.toISOString().split("T")[0];

      const nominal = parseInt(data.nominal || 0);
      const hargaJual = parseInt(data.hargaJual || 0);
      const hargaModal = parseInt(data.hargaModal || 0);
      const tarif = parseInt(data.tarif || 0);

      const itemProfit = hargaJual - hargaModal;
      const finalProfit = isNaN(itemProfit) ? tarif : itemProfit;

      // == Untuk Card Hari Ini ==
      if (tanggalString === tanggalHariIni) {
        totalTransaksiHariIni++;
        omzetHariIni += nominal + finalProfit;
        profitHariIni += finalProfit;
      }

      // == Untuk Grafik Bulanan ==
      if (!transaksiByDate[tanggalKey]) {
        transaksiByDate[tanggalKey] = {
          transaksi: 1,
          profit: finalProfit,
        };
      } else {
        transaksiByDate[tanggalKey].transaksi += 1;
        transaksiByDate[tanggalKey].profit += finalProfit;
      }
    });

    // Buat array lengkap semua tanggal di bulan aktif (dd-mm)
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const fullTanggalArray = Array.from({ length: daysInMonth }, (_, i) => {
      const dateObj = new Date(year, month, i + 1);
      return formatTanggalKey(dateObj);
    });

    // Gabungkan data harian agar semua tanggal tetap tampil meski 0
    const completeData = fullTanggalArray.map((tgl) => {
      const found = transaksiByDate[tgl];
      return {
        tanggal: tgl,
        transaksi: found?.transaksi || 0,
        profit: found?.profit || 0,
      };
    });

    setDataHarian(completeData);
    setJumlahTransaksi(totalTransaksiHariIni);
    setTotalOmzet(omzetHariIni);
    setTotalProfit(profitHariIni);
  }, [transaksi]);

  useEffect(() => {
    if (!saldo || saldo.length === 0) return;
    const total = saldo.reduce((acc, curr) => acc + parseInt(curr.saldo || 0), 0);
    setTotalSaldo(total);
  }, [saldo]);

  return (
    <>
	
	{showPromo && <ModalPromo onClose={() => setShowPromo(false)} />}
    
      {/* Header Full Width */}
      <div className="header-container">
        <h3 className="header mb-0">Selamat Datang Kembali...</h3>
      </div>

      {/* Konten Dashboard */}
      <div className="content content-expand">
        <div className="row g-4">
          <div className="col-md-3">
            <div className="card shadow-sm p-3 text-center card-content">
              <div className="card-header">
                <h5>Transaksi Hari Ini</h5>
              </div>
              <div className="card-body">
                <p className="text-primary fw-bold">
                  {jumlahTransaksi} Transaksi
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm p-3 text-center card-content">
              <div className="card-header">
                <h5>Omzet Hari Ini</h5>
              </div>
              <div className="card-body">
                <p className="text-success fw-bold">
                  {formatRupiah(totalOmzet)}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm p-3 text-center card-content">
              <div className="card-header">
                <h5>Profit Hari Ini</h5>
              </div>
              <div className="card-body">
                <p className="text-success fw-bold">
                  {formatRupiah(totalProfit)}
                </p>
              </div>
            </div>
          </div>

          <div className="col-md-3">
            <div className="card shadow-sm p-3 text-center card-content">
              <div className="card-header">
                <h5>Total Saldo</h5>
              </div>
              <div className="card-body">
                <p className="text-danger fw-bold">
                  {formatRupiah(totalSaldo)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Dua Grafik Berdampingan */}
        <div className="row mt-4 g-4">
          <div className="col-md-6">
            <div className="card p-3 shadow-sm card-graph h-100">
              <h5 className="mb-3">Transaksi Bulan Ini</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataHarian}>
					<XAxis
					  dataKey="tanggal"
					  interval={0}
					  tick={({ x, y, payload }) => {
						const [dd, mm] = payload.value.split("-");
						const dayNum = parseInt(dd);
						if (dayNum % 2 === 1) {
						  return (
							<text x={x} y={y + 10} fontSize={11} textAnchor="middle">
							  {dd}-{mm}
							</text>
						  );
						}
						return null;
					  }}
					  tickLine={false}
					/>
                  <YAxis />
                  <Tooltip />
                  <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                  <Bar dataKey="transaksi" fill="#007bff" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card p-3 shadow-sm card-graph h-100">
              <h5 className="mb-3">Profit Bulan Ini</h5>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dataHarian}>
					<XAxis
					  dataKey="tanggal"
					  interval={0}
					  tick={({ x, y, payload }) => {
						const [dd, mm] = payload.value.split("-");
						const dayNum = parseInt(dd);
						if (dayNum % 2 === 1) {
						  return (
							<text x={x} y={y + 10} fontSize={11} textAnchor="middle">
							  {dd}-{mm}
							</text>
						  );
						}
						return null;
					  }}
					  tickLine={false}
					/>
                  <YAxis />
                  <Tooltip formatter={(value) => formatRupiah(value)} />
                  <CartesianGrid stroke="#eee" strokeDasharray="5 5" />
                  <Bar dataKey="profit" fill="#28a745" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
