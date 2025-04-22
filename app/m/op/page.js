"use client";

import { useEffect, useState, useContext } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../lib/firebaseConfig";
import { getUserData } from "../../../services/indexedDBService";
import { RegisterContext } from "../../../context/RegisterContext"; // sesuaikan path


export default function OperatorPage() {
  const [entitasIdPengakses, setEntitasIdPengakses] = useState(null);
  const [processed, setProcessed] = useState({}); // untuk tracking data per entitasId
  const { dataMenunggu, dataBerhasil } = useContext(RegisterContext);

  const handleTambahUsers = async (item) => {
  const entitasId = item.entitasId || item.uid;

  const newUserData = {
    name: item.nama,
    email: item.email,
    contact: item.noWa,
    role: item.role || "admin",
    entitasId: item.uid,
    uid: item.uid,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, "users", entitasId), newUserData);

    setProcessed((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], usersDone: true, entitasId },
    }));
  } catch (err) {
    console.error("Gagal menambahkan ke users:", err);
  }
};

  const handleTambahToken = async (item) => {
    const current = processed[item.id];
    const entitasId = current?.entitasId || item.entitasId || `dummy-${item.id}`;

    const newTokenData = {
      name: item.nama,
      email: item.email,
      contact: item.noWa,
      role: item.role || "admin",
      entitasId,
      uid: item.uid,
      totalToken: 20,
      createdAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, "token", entitasId), newTokenData);

      setProcessed((prev) => ({
        ...prev,
        [item.id]: { ...prev[item.id], tokenDone: true, entitasId },
      }));

      // Jika kedua proses selesai, update status di newRegistrar
      if (current?.usersDone) {
        await updateDoc(doc(db, "newRegistrar", item.id), {
          status: "berhasil-ditambahkan",
          createdAt: serverTimestamp(),
        });

      }
    } catch (err) {
      console.error("Gagal menambahkan ke token:", err);
    }
  };

  return (
<>
  {/* Menunggu Konfirmasi */}
  <div className="mobile-operator-section">
    <h4 className="mobile-operator-section-title">🕒 Menunggu Konfirmasi</h4>

    {dataMenunggu.length === 0 ? (
      <p className="mobile-operator-empty">Tidak ada data menunggu konfirmasi.</p>
    ) : (
      dataMenunggu.map((item, index) => {
        const isUsersDone = processed[item.id]?.usersDone;
        const isTokenDone = processed[item.id]?.tokenDone;

        return (
          <div key={item.id} className="mobile-operator-card">
            <p><strong>📅</strong> {item.tanggal}</p>
            <p><strong>👤</strong> {item.nama}</p>
            <p><strong>✉️</strong> {item.email}</p>
            <div className="mobile-operator-button-group">
              <button
                className="mobile-operator-btn mobile-operator-btn-primary"
                onClick={() => handleTambahUsers(item, index)}
                disabled={isUsersDone}
              >
                {isUsersDone ? "✅ Users" : "Tambah ke Users"}
              </button>
              <button
                className="mobile-operator-btn mobile-operator-btn-success"
                onClick={() => handleTambahToken(item)}
                disabled={!isUsersDone || isTokenDone}
              >
                {isTokenDone ? "✅ Token" : "Tambah ke Token"}
              </button>
            </div>
          </div>
        );
      })
    )}
  </div>

  {/* Berhasil Ditambahkan */}
  <div className="mobile-operator-section">
    <h4 className="mobile-operator-section-title">✅ Berhasil Ditambahkan</h4>
    {dataBerhasil.length === 0 ? (
      <p className="mobile-operator-empty">Belum ada data.</p>
    ) : (
      dataBerhasil.map((item, index) => (
        <div key={index} className="mobile-operator-card">
          <p><strong>📅</strong> {item.tanggal}</p>
          <p><strong>👤</strong> {item.nama}</p>
          <p><strong>✉️</strong> {item.email}</p>
        </div>
      ))
    )}
  </div>
</>
  );
}
