"use client";

import { useEffect, useState } from "react";
import {
  getJumlahTransaksi,
  getTotalOmzet,
  getTotalProfit,
  getTotalSaldo,
  getTransaksiHarian,
} from "../../../services/indexedDBService";

// Format rupiah helper
const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function HomePage() {
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [dataHarian, setDataHarian] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const transaksiCount = await getJumlahTransaksi();
        setJumlahTransaksi(transaksiCount);

        const omzet = await getTotalOmzet();
        setTotalOmzet(omzet);

        const profit = await getTotalProfit();
        setTotalProfit(profit);

        const saldo = await getTotalSaldo();
        setTotalSaldo(saldo);

        const data = await getTransaksiHarian();

        // Perbaikan: pastikan setiap item memiliki nilai profit
        const cleanData = data.map((item) => {
          const calculatedProfit =
            parseInt(item.hargaJual || 0) - parseInt(item.hargaModal || 0);

          return {
            ...item,
            profit: item.profit ?? (isNaN(calculatedProfit) ? 0 : calculatedProfit),
          };
        });

        setDataHarian(cleanData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="mobile-scroll-area">
      {/* Header */}
      <div className="mobile-dashboard-header mb-4">
        <h4 className="welcome-text">Selamat Datang Kembali</h4>
      </div>

      {/* Ringkasan Statistik */}
      <div className="stat-list mb-4">
        {[
          {
            label: 'Total Transaksi',
            value: `${jumlahTransaksi} Transaksi`,
            className: 'text-primary',
          },
          {
            label: 'Total Omzet',
            value: formatRupiah(totalOmzet),
            className: 'text-success',
          },
          {
            label: 'Total Profit',
            value: formatRupiah(totalProfit),
            className: 'text-success',
          },
          {
            label: 'Total Saldo',
            value: formatRupiah(totalSaldo),
            className: 'text-danger',
          },
        ].map((item, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-label">{item.label}</span>
            <span className={`stat-value ${item.className}`}>{item.value}</span>
          </div>
        ))}
      </div>

      {/* Strip List - Transaksi Bulan Ini */}
      <div className="trend-strip-container">
        <h6 className="trend-strip-title">Transaksi Bulan Ini</h6>
        <div className="trend-strip-list">
          {dataHarian.map((item, i) => (
            <div className="trend-strip-item" key={i}>
              <span className="trend-date">{item.tanggal}</span>
              <span className="trend-value">{formatRupiah(item.transaksi)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Strip List - Profit Bulan Ini */}
      <div className="trend-strip-container mt-4">
        <h6 className="trend-strip-title">Profit Bulan Ini</h6>
        <div className="trend-strip-list">
          {dataHarian.map((item, i) => (
            <div className="trend-strip-item" key={i}>
              <span className="trend-date">{item.tanggal}</span>
              <span className="trend-value text-success">{formatRupiah(item.profit)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
