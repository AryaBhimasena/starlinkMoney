import { getFromIndexedDB, updateIndexedDB } from "../lib/indexedDBService";

// Fungsi untuk memperbarui saldo di IndexedDB
export const updateSaldo = async (entitasId, transaksiData) => {
  try {
    // Ambil saldo dari IndexedDB
    const saldo = await getFromIndexedDB("saldo", entitasId);
    if (!saldo) {
      throw new Error("Saldo tidak ditemukan!");
    }

    let saldoUpdate = {};
    
    // Tentukan perubahan saldo berdasarkan jenis transaksi
    if (transaksiData.jenis === "Kas Masuk") {
      saldoUpdate = {
        ...saldo.sumber_dana,
        [transaksiData.sumberDana]: (saldo.sumber_dana[transaksiData.sumberDana] || 0) + transaksiData.nominal,
      };
    } else if (transaksiData.jenis === "Kas Keluar") {
      if ((saldo.sumber_dana[transaksiData.sumberDana] || 0) < transaksiData.nominal) {
        throw new Error("Saldo tidak cukup!");
      }
      saldoUpdate = {
        ...saldo.sumber_dana,
        [transaksiData.sumberDana]: saldo.sumber_dana[transaksiData.sumberDana] - transaksiData.nominal,
      };
    }

    // Perbarui saldo di IndexedDB
    await updateIndexedDB("saldo", { ...saldo, sumber_dana: saldoUpdate, updated_at: Date.now() });
  } catch (error) {
    console.error("Error memperbarui saldo:", error);
    throw error;
  }
};

// Fungsi untuk mencatat transaksi ke IndexedDB
export const saveTransaksi = async (entitasId, transaksiData) => {
  try {
    const transaksi = {
      entitas_id: entitasId,
      jenis: transaksiData.jenis,
      sumber_dana: transaksiData.sumberDana,
      nominal: transaksiData.nominal,
      tanggal: Date.now(),
      status: "berhasil",
    };
    
    await updateIndexedDB("transaksi", transaksi);
  } catch (error) {
    console.error("Error mencatat transaksi:", error);
    throw error;
  }
};
