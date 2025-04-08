import { createContext, useState, useEffect } from "react";
import { getUserData, getTokenFromIndexedDB } from "../services/indexedDBService";

export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [totalToken, setTotalToken] = useState(0);
  const [entitasId, setEntitasId] = useState(null);
  const [loading, setLoading] = useState(true);

  // Ambil token saat context dimuat
  useEffect(() => {
    const fetchToken = async () => {
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
          const tokenData = await getTokenFromIndexedDB(fetchedEntitasId);
          if (tokenData?.totalToken != null) {
            setTotalToken(tokenData.totalToken);
          } else {
            console.warn("⚠️ Token belum tersedia di IndexedDB.");
          }
        }
      } catch (error) {
        console.error("❌ Gagal mengambil data token:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchToken();
  }, []);

  return (
    <TokenContext.Provider value={{ totalToken, setTotalToken }}>
      {loading ? <p>🔄 Memuat token...</p> : children}
    </TokenContext.Provider>
  );
};
