"use client";

import { useEffect, useState } from "react";
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
import { db } from "../../lib/firebaseConfig";
import { getUserData } from "../../services/indexedDBService";

export default function OperatorPage() {
  const [dataMenunggu, setDataMenunggu] = useState([]);
  const [dataBerhasil, setDataBerhasil] = useState([]);
  const [entitasIdPengakses, setEntitasIdPengakses] = useState(null);
  const [processed, setProcessed] = useState({}); // untuk tracking data per entitasId
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData("userData", "Email");
        const entitasId = userData?.entitasId;
        setEntitasIdPengakses(entitasId);

        const querySnapshot = await getDocs(collection(db, "newRegistrar"));

        const menunggu = [];
        const berhasil = [];

        querySnapshot.forEach((docSnap) => {
          const item = docSnap.data();
          const status = item.status || "";

          const data = {
            id: docSnap.id,
            tanggal: item.createdAt?.toDate?.().toLocaleDateString("id-ID") || "-",
            nama: item.nama || "-",
            email: item.email || "-",
            noWa: item.noWa || "-",
            role: item.role || "admin",
            entitasId: item.entitasId || null,
            uid: item.uid || null,
          };

          if (status === "menunggu-konfirmasi") {
            menunggu.push(data);
          } else if (status === "berhasil-ditambahkan") {
            berhasil.push(data);
          }
        });

        setDataMenunggu(menunggu);
        setDataBerhasil(berhasil);
      } catch (error) {
        console.error("Gagal mengambil data:", error);
      }
    };

    fetchData();
  }, []);

  const handleTambahUsers = async (item) => {

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

        // Refresh data
        setDataMenunggu((prev) => prev.filter((row) => row.id !== item.id));
        setDataBerhasil((prev) => [...prev, item]);
      }
    } catch (err) {
      console.error("Gagal menambahkan ke token:", err);
    }
  };

  return (
    <>
      {/* Header dan Ringkasan tetap sama */}

      {/* Tabel Data Menunggu Konfirmasi */}
      <div className="row mt-4 g-4">
        <div className="col-12">
          <div className="card p-3 shadow-sm card-content">
            <h5 className="mb-3">Pendaftar Menunggu Konfirmasi</h5>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>Email</th>
                  <th>Aksi Users</th>
                  <th>Aksi Token</th>
                </tr>
              </thead>
              <tbody>
                {dataMenunggu.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      Tidak ada data menunggu konfirmasi.
                    </td>
                  </tr>
                ) : (
                  dataMenunggu.map((item, index) => {
                    const isUsersDone = processed[item.id]?.usersDone;
                    const isTokenDone = processed[item.id]?.tokenDone;

                    return (
                      <tr key={item.id}>
                        <td>{item.tanggal}</td>
                        <td>{item.nama}</td>
                        <td>{item.email}</td>
                        <td>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => handleTambahUsers(item, index)}
                            disabled={isUsersDone}
                          >
                            {isUsersDone ? "✅ Berhasil" : "Tambah ke Users"}
                          </button>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleTambahToken(item)}
                            disabled={!isUsersDone || isTokenDone}
                          >
                            {isTokenDone ? "✅ Berhasil" : "Tambah ke Token"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Tabel Data Berhasil Ditambahkan */}
      <div className="row mt-4 g-4">
        <div className="col-12">
          <div className="card p-3 shadow-sm card-content">
            <h5 className="mb-3">Pendaftar Berhasil Ditambahkan</h5>
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama</th>
                  <th>Email</th>
                </tr>
              </thead>
              <tbody>
                {dataBerhasil.length === 0 ? (
                  <tr>
                    <td colSpan="3" className="text-center text-muted">
                      Belum ada data.
                    </td>
                  </tr>
                ) : (
                  dataBerhasil.map((item, index) => (
                    <tr key={index}>
                      <td>{item.tanggal}</td>
                      <td>{item.nama}</td>
                      <td>{item.email}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
