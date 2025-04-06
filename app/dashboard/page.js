"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import {
  getJumlahTransaksi,
  getTotalOmzet,
  getTotalProfit,
  getTotalSaldo,
  getTransaksiHarian,
} from "../../services/indexedDBService";

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
    <>
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
                <h5>Total Transaksi</h5>
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
                <h5>Total Omzet</h5>
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
                <h5>Total Profit</h5>
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
                    interval={1}
                    tick={{ fontSize: 11 }}
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
                    interval={1}
                    tick={{ fontSize: 11 }}
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
