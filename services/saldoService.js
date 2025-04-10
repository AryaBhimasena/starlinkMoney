import { getSaldoData, saveSaldoBySumberDana } from "./indexedDBService";

// Fungsi untuk memperbarui saldo di IndexedDB berdasarkan transaksi
export const updateSaldo = async (entitasId, transaksiData) => {
  try {
    // Ambil semua data saldo
    const allSaldo = await getSaldoData();

    // Cari saldo sesuai entitas dan sumber dana
    const saldoItem = allSaldo.find(item =>
      item.entitasId === entitasId &&
      (item.sumberDana === transaksiData.sumberDana ||
        (transaksiData.sumberDana === "Uang Kas" && item.sumberDana.toLowerCase() === "uang kas"))
    );

    if (!saldoItem) {
      throw new Error("❌ Saldo tidak ditemukan untuk sumber dana tersebut.");
    }

    let saldoBaru = saldoItem.saldo;

    // Perhitungan berdasarkan jenis transaksi
    if (transaksiData.jenis === "Kas Masuk") {
      saldoBaru += transaksiData.nominal;
    } else if (transaksiData.jenis === "Kas Keluar") {
      if (saldoBaru < transaksiData.nominal) {
        throw new Error("❌ Saldo tidak mencukupi.");
      }
      saldoBaru -= transaksiData.nominal;
    }

    // Simpan saldo baru
    await saveSaldoBySumberDana(transaksiData.sumberDana, saldoBaru);
  } catch (error) {
    console.error("❌ Error memperbarui saldo:", error);
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

    const db = await openDB();
    const tx = db.transaction("transaksi", "readwrite");
    const store = tx.objectStore("transaksi");

    await store.add(transaksi);
    await tx.done;
  } catch (error) {
    console.error("❌ Error mencatat transaksi:", error);
    throw error;
  }
};
