"use client";

import { useState, useEffect, useContext, useMemo, useCallback } from "react";
import { SumberDanaContext } from "../../context/SumberDanaContext";
import { getUserData, getTransaksiData, getSaldoBySumberDana } from "../../services/indexedDBService";
import { hitungSaldo } from "../../lib/hitungSaldo";

export default function MonitoringPage() {
  const [user, setUser] = useState(null);
  const [transaksi, setTransaksi] = useState([]);
  const [saldo, setSaldo] = useState([]);
  const [logSaldo, setLogSaldo] = useState([]);
  
const [logProses, setLogProses] = useState([]);

useEffect(() => {
  function handleSaldoLog(event) {
    console.log("📩 Event saldoLog diterima dengan data:", event.detail);
    setLogProses(prevLogs => [...prevLogs, ...event.detail]);
  }

  window.addEventListener("saldoLog", handleSaldoLog);
  
  return () => window.removeEventListener("saldoLog", handleSaldoLog);
}, []);


  // Ambil data sumber dana dari Context
  const { sumberDana } = useContext(SumberDanaContext);

  console.log("📌 Data Sumber Dana dari Context:", sumberDana);

  useEffect(() => {
    async function fetchData() {
      try {
        const userData = await getUserData();
        setUser(userData);

        const transaksiData = await getTransaksiData();
        setTransaksi(transaksiData || []);

        const saldoData = await getSaldoBySumberDana();
        setSaldo(saldoData || []);

        // Logging proses hitungSaldo
        const hasilSaldo = hitungSaldo(saldoData, transaksiData);
        setLogSaldo(hasilSaldo.log || []);
      } catch (error) {
        console.error("❌ Gagal mengambil data dari IndexedDB:", error);
      }
    }

    fetchData();
  }, []);

  // Listener untuk update realtime dari IndexedDB
  const handleUpdate = useCallback(() => {
    async function fetchData() {
      try {
        const transaksiData = await getTransaksiData();
        setTransaksi(transaksiData || []);

        const saldoData = await getSaldoBySumberDana();
        setSaldo(saldoData || []);

        // Logging proses hitungSaldo
        const hasilSaldo = hitungSaldo(saldoData, transaksiData);
        setLogSaldo(hasilSaldo.log || []);
      } catch (error) {
        console.error("❌ Gagal memperbarui data IndexedDB:", error);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    window.addEventListener("indexedDBUpdated", handleUpdate);
    return () => {
      window.removeEventListener("indexedDBUpdated", handleUpdate);
    };
  }, [handleUpdate]);

  // Sorting "Uang Kas" tetap di urutan pertama
  const sumberDanaSorted = useMemo(() => {
    if (!Array.isArray(sumberDana)) return [];
    return [...sumberDana].sort((a, b) =>
      a.sumberDana === "Uang Kas" ? -1 : b.sumberDana === "Uang Kas" ? 1 : 0
    );
  }, [sumberDana]);

  return (
    <div className="container mt-4">
      <h1 className="text-center">Monitoring Data</h1>

      {/* Data User */}
      <div className="card p-3 mb-4">
        <h3>Data User</h3>
        {user ? (
          <>
            <p><strong>Nama:</strong> {user.name}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Entitas ID:</strong> {user.entitasId}</p>
          </>
        ) : (
          <p className="text-danger">Belum ada user login.</p>
        )}
      </div>

{/* Log Perhitungan Saldo */}
<div className="card p-3 mt-4">
  <h3>Log Perhitungan Saldo</h3>
  <ul>
    {logProses.map((log, index) => (
      <li key={index} style={{ whiteSpace: "pre-line" }}>{log}</li>
    ))}
  </ul>
</div>



      {/* Data Sumber Dana */}
      <div className="card p-3 mb-4">
        <h3>Sumber Dana</h3>
        {sumberDanaSorted.length > 0 ? (
          <table className="table table-bordered">
            <thead>
              <tr>
                <th>Sumber Dana</th>
                <th>Saldo</th>
                <th>Kategori</th>
              </tr>
            </thead>
            <tbody>
              {sumberDanaSorted.map((item, index) => (
                <tr key={index}>
                  <td>{item.sumberDana || "-"}</td>
                  <td>Rp {item.saldo?.toLocaleString("id-ID") || "0"}</td>
                  <td>{item.kategori || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-warning">Tidak ada sumber dana yang tersimpan.</p>
        )}
      </div>

      {/* Data Saldo */}
      <div className="card p-3 mb-4">
        <h3>Saldo</h3>
        {saldo.length > 0 ? (
          <ul>
            {saldo.map((item, index) => (
              <li key={index}>
                <strong>{item.sumberDana}:</strong> Rp {item.saldo?.toLocaleString("id-ID") ?? "0"}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-warning">Tidak ada saldo yang tersedia.</p>
        )}
      </div>
    </div>
  );
}
