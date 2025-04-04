import { db } from "../lib/firebaseConfig";
import { collection, addDoc, getDocs, query, where } from "firebase/firestore";
import { saveTransaksiData, getTransaksiData } from "../services/indexedDBService";

/**
 * Mengambil transaksi dari IndexedDB terlebih dahulu, jika kosong baru ambil dari Firestore.
 * @param {string} entitasId
 * @returns {Promise<Array>}
 */
export const getTransaksi = async (entitasId) => {
  try {
    const localData = await getTransaksiData(entitasId);
    if (localData.length > 0) {
      console.log("📂 Menggunakan data transaksi dari IndexedDB.");
      return localData;
    }

    console.log("🌐 Mengambil data transaksi dari Firestore...");
    const q = query(collection(db, "transaksi"), where("entitasId", "==", entitasId));
    const snapshot = await getDocs(q);
    const transaksi = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    // Simpan ke IndexedDB untuk akses offline
    await saveTransaksiData(transaksi, entitasId);
    return transaksi;
  } catch (error) {
    console.error("❌ Error mengambil transaksi:", error);
    return [];
  }
};

/**
 * Menambah transaksi ke IndexedDB terlebih dahulu, lalu sinkronisasi ke Firestore.
 * @param {Object} data - Data transaksi yang akan disimpan.
 * @returns {Promise<Object>}
 */
export const tambahTransaksi = async (data) => {
  try {
    // Pastikan nominal dalam format angka
    const nominalNumber = typeof data.nominal === "string" ? parseInt(data.nominal, 10) : data.nominal;
    if (!nominalNumber || nominalNumber <= 0) {
      throw new Error("Nominal harus lebih dari 0!");
    }

    const transaksiData = {
      ...data,
      nominal: nominalNumber,
      createdAt: new Date(), // Timestamp Firestore opsional
    };

    // Simpan transaksi ke IndexedDB terlebih dahulu
    await saveTransaksiData([transaksiData], data.entitasId);
    console.log("📂 Transaksi disimpan ke IndexedDB. Menunggu sinkronisasi ke Firestore...");

    // Sinkronisasi ke Firestore secara async (bisa pakai background sync)
    syncTransaksiToFirestore();

    return { success: true };
  } catch (error) {
    console.error("❌ Gagal menambahkan transaksi:", error);
    return { success: false, message: `Gagal menyimpan transaksi: ${error.message}` };
  }
};

/**
 * Sinkronisasi transaksi dari IndexedDB ke Firestore (dapat dipanggil secara berkala).
 */
export const syncTransaksiToFirestore = async () => {
  try {
    console.log("🔄 Memulai sinkronisasi transaksi ke Firestore...");
    const transaksiOffline = await getTransaksiData();
    if (transaksiOffline.length === 0) {
      console.log("✅ Tidak ada transaksi offline yang perlu disinkronkan.");
      return;
    }

    for (const transaksi of transaksiOffline) {
      await addDoc(collection(db, "transaksi"), transaksi);
    }

    console.log(`✅ ${transaksiOffline.length} transaksi berhasil disinkronkan ke Firestore.`);
  } catch (error) {
    console.error("❌ Gagal melakukan sinkronisasi transaksi ke Firestore:", error);
  }
};
