import { firestore } from "../lib/firebase";  // Impor firestore dari konfigurasi Firebase
import { getFromLocalStorage } from "../lib/localStorage";  // Impor fungsi untuk membaca data transaksi

// Fungsi untuk memperbarui saldo dengan menggunakan Firestore Transaction
export const updateSaldo = async (entitasId, transaksiData) => {
  const saldoRef = firestore.collection("saldo").doc(entitasId);

  try {
    await firestore.runTransaction(async (transaction) => {
      const saldoDoc = await transaction.get(saldoRef);
      if (!saldoDoc.exists) {
        throw new Error("Saldo tidak ditemukan!");
      }

      const saldo = saldoDoc.data();
      let saldoUpdate = {};

      // Tentukan perubahan saldo berdasarkan jenis transaksi
      if (transaksiData.jenis === "Kas Masuk") {
        saldoUpdate = {
          ...saldo.sumber_dana,
          [transaksiData.sumberDana]: saldo.sumber_dana[transaksiData.sumberDana] + transaksiData.nominal
        };
      } else if (transaksiData.jenis === "Kas Keluar") {
        if (saldo.sumber_dana[transaksiData.sumberDana] < transaksiData.nominal) {
          throw new Error("Saldo tidak cukup!");
        }
        saldoUpdate = {
          ...saldo.sumber_dana,
          [transaksiData.sumberDana]: saldo.sumber_dana[transaksiData.sumberDana] - transaksiData.nominal
        };
      }

      // Perbarui saldo di Firestore
      transaction.update(saldoRef, {
        sumber_dana: saldoUpdate,
        updated_at: firestore.FieldValue.serverTimestamp() // Update waktu
      });
    });
  } catch (error) {
    console.error("Error memperbarui saldo:", error);
    throw error;  // Bisa dilemparkan ke lapisan yang lebih tinggi (misalnya, UI)
  }
};

// Fungsi untuk mencatat transaksi ke koleksi transaksi
export const saveTransaksi = async (entitasId, transaksiData) => {
  const transaksiRef = firestore.collection("transaksi");

  try {
    await transaksiRef.add({
      entitas_id: entitasId,
      jenis: transaksiData.jenis,
      sumber_dana: transaksiData.sumberDana,
      nominal: transaksiData.nominal,
      tanggal: firestore.FieldValue.serverTimestamp(),
      status: "berhasil"
    });
  } catch (error) {
    console.error("Error mencatat transaksi:", error);
    throw error;
  }
};
