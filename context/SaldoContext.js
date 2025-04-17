import { createContext, useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseConfig";
import { getUserData } from "../services/indexedDBService"; // ✅ Ambil entitasId dari IndexedDB

export const SaldoContext = createContext({
  saldo: [],
  updateSaldoState: () => {},
  loading: true,
});

export const SaldoProvider = ({ children }) => {
  const [saldo, setSaldo] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe;

    const listenToSaldo = async () => {
      try {
        setLoading(true);
        const user = await getUserData();
        const entitasId = user?.entitasId;

        if (!entitasId) {
          console.warn("⚠️ Tidak ditemukan entitasId.");
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, "saldo"),
          where("entitasId", "==", entitasId)
        );

        unsubscribe = onSnapshot(q, (snapshot) => {
          const saldoData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setSaldo(saldoData);
          setLoading(false);
        });
      } catch (error) {
        console.error("❌ Gagal menyambungkan listener saldo:", error);
        setLoading(false);
      }
    };

    listenToSaldo();

    return () => {
      if (unsubscribe) unsubscribe(); // ✅ Unsubscribe saat unmount
    };
  }, []);

  const updateSaldoState = (sumberDanaId, saldoBaru) => {
    setSaldo((prevSaldo) =>
      prevSaldo.map((item) =>
        item.id === sumberDanaId ? { ...item, saldo: saldoBaru } : item
      )
    );
  };

  return (
    <SaldoContext.Provider value={{ saldo, updateSaldoState, loading }}>
      {children}
    </SaldoContext.Provider>
  );
};
