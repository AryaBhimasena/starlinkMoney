import { createContext, useState, useEffect, useCallback } from "react";
import { saveSumberDanaData, getSumberDanaData } from "../services/indexedDBService";

export const SumberDanaContext = createContext(null);

export const SumberDanaProvider = ({ children }) => {
  const [sumberDana, setSumberDana] = useState([]); // Pastikan state default adalah array

  const fetchData = useCallback(async () => {
    console.log("📌 Debug: Memanggil getSumberDanaData...");
    const data = await getSumberDanaData();
    console.log("📌 Debug: Data yang diterima di Context:", data);

    if (!Array.isArray(data) || data.length === 0) {
      console.warn("⚠️ Data sumber dana tidak ditemukan.");
      setSumberDana([]);
      return;
    }

    // Pastikan "Uang Kas" selalu di urutan pertama
    data.sort((a, b) => 
      a.sumberDana === "Uang Kas" ? -1 : b.sumberDana === "Uang Kas" ? 1 : 
      a.sumberDana.localeCompare(b.sumberDana, "id")
    );

    setSumberDana(data);
  }, []);

  useEffect(() => {
    console.log("📌 Debug: useEffect di SumberDanaProvider berjalan");
    fetchData();
  }, [fetchData]);

  const tambahSumberDana = async (sumberDanaBaru) => {
    console.log("📌 Debug: Menambah sumber dana baru", sumberDanaBaru);

    if (!sumberDanaBaru?.sumberDana || typeof sumberDanaBaru.sumberDana !== "string") {
      console.error("❌ Data sumber dana tidak valid.");
      return;
    }

    if (sumberDana.some((item) => item.sumberDana === sumberDanaBaru.sumberDana)) {
      console.warn("⚠️ Sumber dana sudah ada, tidak bisa ditambahkan lagi.");
      return;
    }

    if (sumberDanaBaru.saldo <= 0) {
      console.error("❌ Saldo awal tidak boleh 0 atau negatif.");
      return;
    }

    await saveSumberDanaData(sumberDanaBaru);

    setSumberDana((prev) => {
      const updatedData = [...prev, sumberDanaBaru];

      // Pastikan "Uang Kas" tetap di urutan pertama setelah update
      updatedData.sort((a, b) => 
        a.sumberDana === "Uang Kas" ? -1 : b.sumberDana === "Uang Kas" ? 1 : 
        a.sumberDana.localeCompare(b.sumberDana, "id")
      );

      return updatedData;
    });
  };

  return (
    <SumberDanaContext.Provider value={{ sumberDana, tambahSumberDana }}>
      {children}
    </SumberDanaContext.Provider>
  );
};
