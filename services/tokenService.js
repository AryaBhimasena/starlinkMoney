import {
  getUserData,
  getTokenFromIndexedDB,
  updateTokenInIndexedDB,
  saveTokenRiwayatToIndexedDB,
} from "./indexedDBService";

// Fungsi untuk konversi Date ke Firestore Timestamp-like
function toFirestoreTimestamp(date) {
  const milliseconds = date.getTime();
  return {
    seconds: Math.floor(milliseconds / 1000),
    nanoseconds: (milliseconds % 1000) * 1e6,
  };
}

// Fungsi utama untuk penggunaan token
export async function gunakanToken(jumlahToken, aktivitas) {
  try {
    const user = await getUserData();
    const entitasId = user?.entitasId;

    if (!entitasId) throw new Error("Entitas ID tidak ditemukan.");

    const tokenData = await getTokenFromIndexedDB(entitasId);
    if (!tokenData) throw new Error("Token tidak ditemukan.");

    const currentToken = tokenData.totalToken ?? 0;

    if (currentToken < jumlahToken) {
      return { success: false, error: "Token tidak mencukupi." };
    }

    const newTotal = currentToken - jumlahToken;
    const updated = {
      ...tokenData,
      totalToken: newTotal,
      lastUpdate: toFirestoreTimestamp(new Date()),
    };

    await updateTokenInIndexedDB(entitasId, updated);

    await saveTokenRiwayatToIndexedDB({
      id: crypto.randomUUID(),
      entitasId,
      jumlah: jumlahToken,
      bonus: 0,
      metode: aktivitas,
      tanggal: toFirestoreTimestamp(new Date()),
    });

    return { success: true, newTotal };
  } catch (error) {
    console.error("❌ Gagal menggunakan token:", error);
    return { success: false, error: error.message };
  }
}
