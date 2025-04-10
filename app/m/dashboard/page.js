"use client";

import { useEffect, useState, useRef } from "react";
import {
  getJumlahTransaksi,
  getTotalOmzet,
  getTotalProfit,
  getTotalSaldo,
  getTransaksiHariIni,
} from "../../../services/indexedDBService";

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
  const [selectedIndex, setSelectedIndex] = useState(null);

  const containerRef = useRef();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const transaksiCount = await getJumlahTransaksi();
        const omzet = await getTotalOmzet();
        const profit = await getTotalProfit();
        const saldo = await getTotalSaldo();
        const transaksiHarian = await getTransaksiHariIni();

        setJumlahTransaksi(transaksiCount);
        setTotalOmzet(omzet);
        setTotalProfit(profit);
        setTotalSaldo(saldo);

        // Sort terbaru dulu
        const sorted = [...transaksiHarian].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Tambahkan kalkulasi profit jika belum ada
        const cleanData = sorted.map((item) => {
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

  // Tutup detail saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelectedIndex(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="mobile-scroll-area" ref={containerRef}>
      <div className="mobile-dashboard-header mb-4">
        <h4 className="welcome-text">Transaksi Hari Ini</h4>
      </div>

      <div className="stat-list mb-4">
        {[
          {
            label: "Total Transaksi",
            value: `${jumlahTransaksi} Transaksi`,
            className: "text-primary",
          },
          {
            label: "Total Omzet",
            value: formatRupiah(totalOmzet),
            className: "text-success",
          },
          {
            label: "Total Profit",
            value: formatRupiah(totalProfit),
            className: "text-success",
          },
          {
            label: "Total Saldo",
            value: formatRupiah(totalSaldo),
            className: "text-danger",
          },
        ].map((item, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-label">{item.label}</span>
            <span className={`stat-value ${item.className}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="trend-strip-container">
        <h6 className="trend-strip-title">Transaksi Hari Ini</h6>
        <div className="trend-strip-list">
          {dataHarian.map((item, i) => (
            <div key={i}>
              <div
                className="trend-strip-item"
                onClick={() => setSelectedIndex(i === selectedIndex ? null : i)}
              >
                <span className="trend-date">{item.jenisTransaksi}</span>
                <span className="trend-value text-success">
                  {formatRupiah(item.profit)}
                </span>
              </div>

              {selectedIndex === i && (
                <div className="mobile-dashboard-detail-box">
                  <div className="trend-stat-row">
                    <span>Pelanggan</span>
                    <span>{item.pelanggan || "-"}</span>
                  </div>
                  <div className="trend-stat-row">
                    <span>Penerima</span>
                    <span>{item.penerima || "-"}</span>
                  </div>
                  <div className="trend-stat-row">
                    <span>Nominal</span>
                    <span>{formatRupiah(item.nominal || 0)}</span>
                  </div>
                  <div className="trend-stat-row">
                    <span>Tarif</span>
                    <span>{formatRupiah(item.tarif || 0)}</span>
                  </div>
                  <div className="trend-stat-row">
                    <span>Sumber Dana</span>
                    <span>{item.sumberDana || "-"}</span>
                  </div>
                  <div className="trend-stat-row">
                    <span>Total Bayar</span>
                    <span>
                      {formatRupiah((item.nominal || 0) + (item.tarif || 0))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
