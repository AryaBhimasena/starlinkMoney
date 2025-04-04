import { db } from "../lib/firebaseConfig";
import { doc, setDoc, collection, addDoc, runTransaction, getDocs, Timestamp } from "firebase/firestore";
import { validasiTransaksi } from "./validasiTransaksi";
import { getUnsyncedTransactions, markTransactionsAsSynced } from "./localStorage";

/**
 * Fungsi untuk menambah transaksi baru
 * Sekarang transaksi akan disimpan ke localStorage terlebih dahulu
 */
export async function tambahTransaksi(data, userRole) {
  const errors = validasiTransaksi(data);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const transaksiData = {
    id: Date.now().toString(), // Gunakan timestamp sebagai ID sementara sebelum diunggah
    date: new Date(data.date).toISOString(),
    entitasId: data.entitasId,
    jenisTransaksi: data.jenisTransaksi,
    keterangan: data.keterangan,
    noHP: Number(data.noHP) || 0,
    noMeterID: Number(data.noMeterID) || 0,
    noReff: data.noReff,
    noRekening: Number(data.noRekening) || 0,
    noTokenListrik: Number(data.noTokenListrik) || 0,
    operatorSelular: data.operatorSelular || "",
    pelanggan: data.pelanggan || "",
    penerima: data.penerima || "",
    statusTransaksi: "pending",
    sumberDana: data.sumberDana,
    biayaAdmin: Number(data.biayaAdmin) || 0,
    hargaJual: Number(data.hargaJual) || 0,
    hargaModal: Number(data.hargaModal) || 0,
    nominal: Number(data.nominal) || 0,
    pengeluaran: Number(data.pengeluaran) || 0,
    profit: Number(data.profit) || 0,
    tarif: Number(data.tarif) || 0,
    isSynced: false, // Menandakan transaksi ini belum diunggah ke Firestore
  };

  try {
    // Simpan transaksi ke localStorage
    addTransactionToLocal(transaksiData);
    return "✅ Transaksi berhasil disimpan ke localStorage!";
  } catch (error) {
    console.error("❌ Gagal menyimpan transaksi:", error);
    throw new Error("Gagal menyimpan transaksi. Silakan coba lagi.");
  }
}

/**
 * Fungsi untuk menyinkronkan transaksi yang belum tersimpan ke Firestore secara berkala
 */
export async function syncTransactionsToFirestore() {
  const unsyncedTransactions = getUnsyncedTransactions();
  if (unsyncedTransactions.length === 0) return;

  const transaksiRef = collection(db, "transaksi");
  const syncedIds = [];

  try {
    await Promise.all(
      unsyncedTransactions.map(async (transaction) => {
        const transaksiFirestore = { ...transaction, createdAt: Timestamp.now() };
        delete transaksiFirestore.isSynced; // Hapus properti ini sebelum menyimpan ke Firestore

        await addDoc(transaksiRef, transaksiFirestore);
        syncedIds.push(transaction.id);
      })
    );

    // Tandai transaksi sebagai tersinkronisasi
    markTransactionsAsSynced(syncedIds);
    console.log("✅ Transaksi berhasil disinkronkan ke Firestore!");
  } catch (error) {
    console.error("❌ Gagal menyinkronkan transaksi:", error);
  }
}
