"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  getTransaksiData,
  saveTransaksiData,
  addSingleTransaksi,
  getAllUserData,
} from "../services/indexedDBService";

const IndexedDBContext = createContext({
  saldo: [],
  transaksi: [],
  users: [],
  loading: true,
  tambahTransaksi: () => {},
});

export const IndexedDBProvider = ({ children }) => {
  const [saldo, setSaldo] = useState([]);
  const [transaksi, setTransaksi] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ Ambil daftar pengguna dari IndexedDB saat provider dimuat
  const fetchUsers = useCallback(async () => {
    try {
      const userData = await getAllUserData();
      setUsers(userData);
    } catch (error) {
      console.error("❌ Gagal memuat pengguna:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);
  
  
  // ✅ Fungsi untuk menambah transaksi baru
  const tambahTransaksi = useCallback(async (newTransaksi) => {
    try {
      await addSingleTransaksi(newTransaksi); // ✅ Simpan transaksi baru ke IndexedDB
      setTransaksi((prevTransaksi) => [...prevTransaksi, newTransaksi]); // ✅ Perbarui transaksi di state
    } catch (error) {
      console.error("❌ Gagal menyimpan transaksi:", error);
    }
  }, []);

 return (
    <IndexedDBContext.Provider value={{ saldo, transaksi, users, loading, tambahTransaksi }}>
      {children}
    </IndexedDBContext.Provider>
  );
};

export const useIndexedDB = () => {
  const context = useContext(IndexedDBContext);
  if (!context) {
    throw new Error("❌ useIndexedDB harus digunakan dalam IndexedDBProvider");
  }
  return context;
};
