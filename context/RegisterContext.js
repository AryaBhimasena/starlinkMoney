// contexts/registerContext.js
"use client";

import { createContext, useEffect, useState, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseConfig"; // sesuaikan path-nya

export const RegisterContext = createContext();

export const RegisterProvider = ({ children }) => {
  const [dataMenunggu, setDataMenunggu] = useState([]);
  const [dataBerhasil, setDataBerhasil] = useState([]);

  const prevIds = useRef([]);

useEffect(() => {
  const unsubscribe = onSnapshot(collection(db, "newRegistrar"), (snapshot) => {
    const menunggu = [];
    const berhasil = [];
    const currentIds = [];

    snapshot.forEach((docSnap) => {
      const item = docSnap.data();
      const status = item.status || "";
      currentIds.push(docSnap.id);

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

      if (status === "menunggu-konfirmasi") menunggu.push(data);
      else if (status === "berhasil-ditambahkan") berhasil.push(data);
    });

    // Deteksi penambahan baru
    const added = currentIds.filter(id => !prevIds.current.includes(id));
    if (added.length > 0) {
      const audio = new Audio("/sounds/warning.mp3");
      audio.play().catch(() => {});
    }

    prevIds.current = currentIds;
    setDataMenunggu(menunggu);
    setDataBerhasil(berhasil);
  });

  return () => unsubscribe();
}, []);
  return (
    <RegisterContext.Provider value={{ dataMenunggu, dataBerhasil }}>
      {children}
    </RegisterContext.Provider>
  );
};
