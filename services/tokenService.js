import { getDocById, updateDocData, addDocToCollection, runFirestoreTransaction } from "./firestoreService";
import { doc, getFirestore } from "firebase/firestore";

// Fungsi utama untuk penggunaan token
export async function gunakanToken(entitasId, jumlahToken, aktivitas) {
  try {
    if (!entitasId) throw new Error("Entitas ID tidak ditemukan.");

    // Ambil data token berdasarkan entitasId
    const tokenData = await getDocById("token", entitasId);
    if (!tokenData) throw new Error("Token tidak ditemukan.");

    const currentToken = tokenData.totalToken ?? 0;

    if (currentToken < jumlahToken) {
      return { success: false, error: "Token tidak mencukupi." };
    }

    const newTotal = currentToken - jumlahToken;

    // Gunakan transaksi untuk menyimpan riwayat & update token secara atomik
    const result = await runFirestoreTransaction(async (transaction) => {
      // Simpan riwayat penggunaan token dalam transaksi
      await saveTokenRiwayat(transaction, entitasId, jumlahToken, aktivitas);
      
      // Update token di koleksi token
      const tokenRef = doc(getFirestore(), "token", entitasId);
      transaction.update(tokenRef, {
        totalToken: newTotal,
        lastUpdate: new Date(),
      });

      return { newTotal };  // Kembalikan nilai token baru
    });

    return result;
  } catch (error) {
    console.error("❌ Gagal menggunakan token:", error);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk menyimpan riwayat penggunaan token di koleksi token_riwayat
async function saveTokenRiwayat(transaction, entitasId, jumlahToken, aktivitas) {
  try {
    const tokenRiwayat = {
      entitasId,
      jumlah: jumlahToken,
      bonus: 0, // Bonus token, bisa diubah jika ada kebijakan bonus
      metode: aktivitas, // Misalnya: "Pembelian", "Penggunaan", dll.
      tanggal: new Date(),
    };

    // Gunakan addDoc agar Firebase menghasilkan ID unik secara otomatis
    const tokenRiwayatRef = doc(getFirestore(), "token_riwayat", `${entitasId}_${new Date().getTime()}`);
    transaction.set(tokenRiwayatRef, tokenRiwayat);  // Menyimpan riwayat transaksi dalam transaksi
  } catch (error) {
    console.error("❌ Gagal menyimpan riwayat token:", error);
    throw new Error("Gagal menyimpan riwayat penggunaan token.");
  }
}

// Fungsi untuk top up token
export async function topUpToken(jumlahToken) {
  try {
    const user = await getUserData();
    const entitasId = user?.entitasId;

    if (!entitasId) throw new Error("Entitas ID tidak ditemukan.");

    // Mengambil data token dari koleksi token berdasarkan entitasId
    const tokenDoc = await getDocById("token", entitasId);
    const tokenData = tokenDoc?.data();

    if (!tokenData) throw new Error("Token tidak ditemukan.");

    const currentToken = tokenData.totalToken ?? 0;
    const newTotal = currentToken + jumlahToken;

    // Gunakan transaksi untuk top up dan simpan riwayat secara atomik
    const result = await runFirestoreTransaction(async (transaction) => {
      // Simpan riwayat top up token dalam transaksi
      await saveTokenRiwayat(transaction, entitasId, jumlahToken, "Top Up");

      // Update nilai token di koleksi token setelah top up
      const tokenRef = doc(getFirestore(), "token", entitasId);
      transaction.update(tokenRef, { totalToken: newTotal, lastUpdate: new Date() });

      return { newTotal };
    });

    return result;
  } catch (error) {
    console.error("❌ Gagal melakukan top up token:", error);
    return { success: false, error: error.message };
  }
}

// Fungsi untuk mengambil data token berdasarkan entitasId
export async function getToken(entitasId) {
  try {
    const tokenData = await getDocById("token", entitasId);
    if (!tokenData) throw new Error("Token tidak ditemukan.");

    return tokenData; // langsung return datanya
  } catch (error) {
    console.error("❌ Gagal mengambil data token:", error);
    throw new Error("Gagal mengambil data token.");
  }
}
