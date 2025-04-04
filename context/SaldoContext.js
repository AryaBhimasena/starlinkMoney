import { createContext, useState, useEffect } from "react";
import { getSaldoData, getSaldoBySumberDana, saveSaldoBySumberDana  } from "../services/indexedDBService";
import { hitungSaldo } from "../lib/hitungSaldo"; // ✅ Pastikan ini sudah benar

export const SaldoContext = createContext({
  saldo: [],
  updateSaldo: () => {},
});

export const SaldoProvider = ({ children }) => {
  const [saldo, setSaldo] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const saldoData = await getSaldoData();
        setSaldo(saldoData || []);
      } catch (error) {
        console.error("❌ Gagal mengambil saldo dari IndexedDB:", error);
      }
    };

    fetchData();
  }, []);

const updateSaldo = async (sumberDana, transaksiData) => {
    try {
        console.log("💰 Memulai updateSaldo...");

        // 1️⃣ Pastikan transaksiData valid
        if (!transaksiData || typeof transaksiData !== "object") {
            throw new Error("❌ transaksiData tidak valid atau undefined.");
        }

        // 2️⃣ Ambil saldo saat ini berdasarkan sumber dana & Uang Kas
        const saldoSumberDana = await getSaldoBySumberDana(sumberDana);
        const saldoUangKas = await getSaldoBySumberDana("Uang Kas");

        if (!saldoSumberDana || !saldoUangKas) {
            throw new Error(`❌ Saldo tidak ditemukan untuk sumber dana: ${sumberDana} atau Uang Kas.`);
        }

        // 3️⃣ Hitung saldo baru berdasarkan transaksi
        const saldoBaru = await hitungSaldo([...saldoSumberDana, ...saldoUangKas], transaksiData);
        if (!saldoBaru || saldoBaru.error) {
            throw new Error(saldoBaru?.error || "❌ Gagal menghitung saldo baru.");
        }

        // 4️⃣ Pastikan saldo tidak negatif sebelum menyimpan
        if (saldoBaru.saldoBaruSumber < 0 || saldoBaru.saldoBaruUangKas < 0) {
            throw new Error("❌ Saldo tidak mencukupi untuk transaksi ini!");
        }

        // 5️⃣ Simpan saldo baru ke IndexedDB
        await saveSaldoBySumberDana(sumberDana, saldoBaru.saldoBaruSumber);
        await saveSaldoBySumberDana("Uang Kas", saldoBaru.saldoBaruUangKas);

        // 6️⃣ Update state saldo di aplikasi untuk sumber dana & Uang Kas
        setSaldo((prevSaldo) =>
            prevSaldo.map((item) =>
                item.sumberDana === sumberDana
                    ? { ...item, saldo: saldoBaru.saldoBaruSumber }
                    : item.sumberDana === "Uang Kas"
                    ? { ...item, saldo: saldoBaru.saldoBaruUangKas }
                    : item
            )
        );

        console.log("✅ updateSaldo selesai!");
    } catch (error) {
        console.error("❌ Gagal updateSaldo:", error);
        alert(`❌ Terjadi kesalahan saat memperbarui saldo: ${error.message}`);
    }
};

  return (
    <SaldoContext.Provider value={{ saldo, updateSaldo }}>
      {children}
    </SaldoContext.Provider>
  );
};
