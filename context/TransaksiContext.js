import { createContext, useState, useEffect } from "react";
import { getTransaksiData, getUserData } from "../services/indexedDBService";

export const TransaksiContext = createContext();

export const TransaksiProvider = ({ children }) => {
  const [transaksi, setTransaksi] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil data transaksi dari IndexedDB saat komponen dimuat
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await getUserData();
        if (!userData) {
          console.error("❌ Pengguna belum login.");
          return;
        }

        const fetchedEntitasId = userData.entitasId;
        setEntitasId(fetchedEntitasId);

        if (fetchedEntitasId) {
          const data = await getTransaksiData(fetchedEntitasId);
          setTransaksi(data);
        }
      } catch (error) {
        console.error("❌ Gagal mengambil data transaksi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <TransaksiContext.Provider value={{ transaksi }}>
      {loading ? <p>🔄 Memuat data transaksi...</p> : children}
    </TransaksiContext.Provider>
  );
};
