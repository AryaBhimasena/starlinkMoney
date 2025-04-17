import { createContext, useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { getUserData } from "../services/indexedDBService";

export const TokenContext = createContext();

export const TokenProvider = ({ children }) => {
  const [totalToken, setTotalToken] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const listenToToken = async () => {
      try {
        const user = await getUserData();
        if (!user?.entitasId) {
          console.warn("⚠️ Tidak ditemukan entitasId di IndexedDB.");
          setLoading(false);
          return;
        }

        const tokenRef = doc(db, "token", user.entitasId);

        unsubscribe = onSnapshot(tokenRef, (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            setTotalToken(data.totalToken ?? 0);
          } else {
            console.warn("⚠️ Dokumen token tidak ditemukan.");
            setTotalToken(0);
          }
          setLoading(false);
        });
      } catch (err) {
        console.error("❌ Gagal menyambungkan listener token:", err);
        setLoading(false);
      }
    };

    listenToToken();

    return () => {
      if (unsubscribe) unsubscribe(); // ✅ Unsubscribe saat komponen unmount
    };
  }, []);

  return (
    <TokenContext.Provider value={{ totalToken, setTotalToken }}>
      {loading ? <p>🔄 Memuat token...</p> : children}
    </TokenContext.Provider>
  );
};
