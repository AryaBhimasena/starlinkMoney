import { createContext, useState, useEffect } from "react";
import { db } from "../lib/firebaseConfig";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { getUserData } from "../services/indexedDBService";

export const TransaksiContext = createContext();

export const TransaksiProvider = ({ children }) => {
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const listenToTransaksi = async () => {
      setLoading(true);
      try {
        const user = await getUserData();
        if (!user?.entitasId) {
          console.warn("⚠️ Tidak ditemukan entitasId.");
          setLoading(false);
          return;
        }

        const transaksiRef = collection(db, "transaksi");
        const q = query(
          transaksiRef,
          where("entitasId", "==", user.entitasId),
          orderBy("createdAt", "desc") // ⬅️ opsional, agar urutan by tanggal terbaru
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const transaksiData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setTransaksi(transaksiData);
          setLoading(false);
        });
      } catch (error) {
        console.error("❌ Gagal memuat data transaksi:", error);
        setLoading(false);
      }
    };

    listenToTransaksi();

    return () => {
      if (unsubscribe) unsubscribe(); // ✅ Bersihkan listener saat unmount
    };
  }, []);

  return (
    <TransaksiContext.Provider value={{ transaksi }}>
      {loading ? <p>🔄 Memuat data transaksi...</p> : children}
    </TransaksiContext.Provider>
  );
};
