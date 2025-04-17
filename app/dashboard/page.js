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
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../lib/firebaseConfig";
import { getUserData } from "../../services/indexedDBService";

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
        const userData = await getUserData();
        const entitasId = userData?.entitasId;
        console.log("Entitas ID yang diambil:", entitasId);  // Log entitasId

        if (!entitasId) return;

        const today = new Date().toISOString().split("T")[0];  // Mendapatkan tanggal hari ini (yyyy-mm-dd)

        // Ambil semua transaksi berdasarkan entitasId
        const transaksiRef = collection(db, "transaksi");
        const transaksiQuery = query(transaksiRef, where("entitasId", "==", entitasId));
        const transaksiSnap = await getDocs(transaksiQuery);

        let totalTransaksi = 0;
        let omzet = 0;
        let profit = 0;
        const transaksiByDate = {};

        transaksiSnap.forEach((doc) => {
          const data = doc.data();
          const nominal = parseInt(data.nominal || 0);
          const hargaJual = parseInt(data.hargaJual || 0);
          const hargaModal = parseInt(data.hargaModal || 0);
          const tanggal = data.tanggal?.split("T")[0] || "Unknown";

          // Hanya mengambil transaksi pada hari ini
          if (tanggal === today) {
            totalTransaksi++;

            // Omzet hanya dihitung dari Kas/Bank Masuk
            if (["Kas Masuk", "Bank Masuk"].includes(data.jenisTransaksi)) {
              omzet += nominal;
            }

            // Hitung profit
            const itemProfit = hargaJual - hargaModal;
            profit += isNaN(itemProfit) ? 0 : itemProfit;

            // Hitung transaksi harian
            if (!transaksiByDate[tanggal]) {
              transaksiByDate[tanggal] = {
                tanggal,
                transaksi: 1,
                profit: isNaN(itemProfit) ? 0 : itemProfit,
              };
            } else {
              transaksiByDate[tanggal].transaksi += 1;
              transaksiByDate[tanggal].profit += isNaN(itemProfit) ? 0 : itemProfit;
            }
          }
        });

        setJumlahTransaksi(totalTransaksi);
        setTotalOmzet(omzet);
        setTotalProfit(profit);
        setDataHarian(Object.values(transaksiByDate));

        // Ambil semua saldo berdasarkan entitasId
        const saldoRef = collection(db, "saldo");
        const saldoQuery = query(saldoRef, where("entitasId", "==", entitasId));
        const saldoSnap = await getDocs(saldoQuery);

        let totalSaldoAll = 0;
        saldoSnap.forEach((doc) => {
          const data = doc.data();
          totalSaldoAll += parseInt(data.saldo || 0);
        });

        setTotalSaldo(totalSaldoAll);
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
                    interval={1}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return `${date.getDate()}-${date.getMonth() + 1}`;
                    }}
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
                    tickFormatter={(tick) => {
                      const date = new Date(tick);
                      return `${date.getDate()}-${date.getMonth() + 1}`;
                    }}
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
