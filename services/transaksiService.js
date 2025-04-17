// transaksiService.js
import {
  addDocToCollection,
  getDocRef,
  getAllDocs,
  getDocsByField,
  setDocData,
  updateDocData,
  deleteDocById,
} from "./firestoreService";
import { validasiTransaksi } from "./validasiTransaksi";
import { getToken, topUpToken } from "./tokenService";
import { updateSaldo } from "./saldoService";
import { getFirestore, runTransaction, doc, updateDoc, getDoc } from "firebase/firestore";

/**
 * Tambah transaksi ke koleksi "transaksi"
 */
export async function tambahTransaksi(data) {
  const errors = validasiTransaksi(data);
  if (errors.length > 0) throw new Error(errors.join("\n"));

  const transaksiData = {
    ...data,
    date: new Date(data.date).toISOString(),
    createdAt: new Date(),
  };

  try {
    const response = await addDocToCollection("transaksi", transaksiData);  // Menambahkan transaksi ke koleksi
    if (response.success) {
      return { success: true, message: "✅ Transaksi berhasil ditambahkan.", docId: response.docId };
    } else {
      throw new Error(response.error);  // Mengirim error jika gagal menambah
    }
  } catch (error) {
    console.error("❌ Gagal menambah transaksi:", error);
    throw new Error("Gagal menambah transaksi ke Firestore.");
  }
}

/**
 * Ambil semua transaksi berdasarkan entitasId
 */
export async function getTransaksiByEntitas(entitasId) {
  try {
    const transaksi = await getDocsByField("transaksi", "entitasId", entitasId);
    return transaksi;
  } catch (error) {
    console.error("❌ Gagal mengambil transaksi:", error);
    throw new Error("Gagal mengambil data transaksi.");
  }
}

/**
 * Update transaksi berdasarkan entitasId
 */
export async function updateTransaksi(entitasId, updateData) {
  try {
    // Ambil transaksi berdasarkan entitasId terlebih dahulu
    const transaksi = await getDocsByField("transaksi", "entitasId", entitasId);

    if (transaksi.length === 0) throw new Error("❌ Transaksi tidak ditemukan.");

    // Update semua transaksi yang ditemukan berdasarkan entitasId
    for (let doc of transaksi) {
      await updateDocData("transaksi", doc.id, updateData);
    }

    return { success: true, message: "✅ Transaksi berhasil diupdate." };
  } catch (error) {
    console.error("❌ Gagal update transaksi:", error);
    throw new Error("Gagal memperbarui transaksi.");
  }
}

/**
 * Hapus transaksi berdasarkan entitasId
 */
export async function deleteTransaksi(entitasId) {
  try {
    // Ambil transaksi berdasarkan entitasId terlebih dahulu
    const transaksi = await getDocsByField("transaksi", "entitasId", entitasId);

    if (transaksi.length === 0) throw new Error("❌ Transaksi tidak ditemukan.");

    // Hapus semua transaksi yang ditemukan berdasarkan entitasId
    for (let doc of transaksi) {
      await deleteDocById("transaksi", doc.id);
    }

    return { success: true, message: "✅ Transaksi berhasil dihapus." };
  } catch (error) {
    console.error("❌ Gagal menghapus transaksi:", error);
    throw new Error("Gagal menghapus transaksi.");
  }
}

/**
 * Ambil transaksi berdasarkan entitasId dan ID transaksi
 */
export async function getTransaksiByEntitasIdAndId(entitasId, transaksiId) {
  try {
    const transaksi = await getDocsByField("transaksi", "entitasId", entitasId);
    const transaksiById = transaksi.find(t => t.id === transaksiId);
    return transaksiById || null;
  } catch (error) {
    console.error("❌ Gagal mengambil transaksi:", error);
    throw new Error("Gagal mengambil transaksi berdasarkan entitasId dan ID transaksi.");
  }
}

export async function getTransaksiByTanggal(entitasId, tanggalISO) {
  try {
    const semua = await getDocsByField("transaksi", "entitasId", entitasId);
    return semua.filter(t => t.date.startsWith(tanggalISO));
  } catch (error) {
    console.error("❌ Gagal ambil transaksi per tanggal:", error);
    throw new Error("Gagal mengambil transaksi berdasarkan tanggal.");
  }
}

export async function updateTransaksiById(transaksiId, dataBaru) {
  try {
    await updateDocData("transaksi", transaksiId, dataBaru);
    return { success: true, message: "✅ Transaksi berhasil diupdate." };
  } catch (error) {
    console.error("❌ Gagal update transaksi ID:", error);
    throw new Error("Gagal update transaksi berdasarkan ID.");
  }
}

export async function deleteTransaksiById(transaksiId) {
  try {
    await deleteDocById("transaksi", transaksiId);
    return { success: true, message: "✅ Transaksi berhasil dihapus." };
  } catch (error) {
    console.error("❌ Gagal hapus transaksi ID:", error);
    throw new Error("Gagal menghapus transaksi berdasarkan ID.");
  }
}

export async function rollbackTransaksi(transaksiId, opsi = { restoreSaldo: true, restoreToken: true }) {
  const db = getFirestore(); // Inisialisasi Firestore

  try {
    // Ambil data transaksi
    const transaksiRef = doc(db, "transaksi", transaksiId);
    const transaksiSnapshot = await getDoc(transaksiRef);
    if (!transaksiSnapshot.exists()) throw new Error("Transaksi tidak ditemukan untuk rollback.");

    const transaksi = transaksiSnapshot.data();
    const { entitasId, nominal, sumberDana, tokenDigunakan = 1 } = transaksi;

    // Validasi data transaksi
    if (!entitasId || !sumberDana || !nominal) {
      throw new Error("Data transaksi tidak lengkap untuk rollback.");
    }

    // Mulai transaksi Firestore
    await runTransaction(db, async (transaction) => {
      // Ambil dokumen transaksi untuk memastikannya masih valid
      const transaksiDoc = await transaction.get(transaksiRef);
      if (!transaksiDoc.exists()) {
        throw new Error("Transaksi tidak ditemukan untuk rollback.");
      }

      // Flag transaksi sebagai dibatalkan
      transaction.update(transaksiRef, { dibatalkan: true });

      // Restore saldo jika diperlukan
      if (opsi.restoreSaldo) {
        const saldoRef = doc(db, "saldo", `${entitasId}_${sumberDana}`);
        const saldoSnapshot = await transaction.get(saldoRef);
        if (!saldoSnapshot.exists()) {
          throw new Error("Saldo tidak ditemukan untuk rollback.");
        }

        const saldoData = saldoSnapshot.data();
        const newSaldo = saldoData.saldo + nominal; // Menambah saldo

        transaction.update(saldoRef, { saldo: newSaldo });
      }

      // Restore token jika diperlukan
      if (opsi.restoreToken && tokenDigunakan > 0) {
        const tokenRef = doc(db, "token", entitasId);
        const tokenSnapshot = await transaction.get(tokenRef);
        if (!tokenSnapshot.exists()) {
          throw new Error("Token tidak ditemukan untuk rollback.");
        }

        const tokenData = tokenSnapshot.data();
        const newToken = tokenData.totalToken + tokenDigunakan;

        // Update jumlah token
        transaction.update(tokenRef, { totalToken: newToken });

        // Menyimpan riwayat token
        const tokenRiwayatRef = doc(db, "token_riwayat", `${entitasId}_${new Date().getTime()}`);
        transaction.set(tokenRiwayatRef, {
          entitasId,
          jumlah: tokenDigunakan,
          keterangan: `Rollback transaksi ${transaksiId}`,
          kategori: "rollback",
          waktu: new Date().toISOString(),
        });
      }
    });

    return { success: true, message: "✅ Transaksi berhasil di-rollback dan saldo/token dikembalikan." };
  } catch (error) {
    console.error("❌ Rollback gagal:", error);
    throw new Error(`Gagal melakukan rollback transaksi: ${error.message}`);
  }
}

export async function generateNoReff(entitasId, jenisTransaksi) {
  const today = new Date();
  const ddmmyyyy = today
    .toLocaleDateString("id-ID")
    .split("/")
    .map((val) => val.padStart(2, "0"))
    .join("");

  let prefix = "";
  switch (jenisTransaksi) {
    case "Transfer":
      prefix = "TF";
      break;
    case "Setor Tunai":
      prefix = "ST";
      break;
    case "Tarik Tunai":
      prefix = "TT";
      break;
    case "Top Up Pulsa":
      prefix = "TP";
      break;
    case "Top Up Token Listrik":
      prefix = "TL";
      break;
    case "Top Up E-Wallet":
      prefix = "TE";
      break;
    case "Pengeluaran":
      prefix = "PE";
      break;
    default:
      prefix = "XX"; // fallback kalau jenis transaksi tidak dikenal
  }

  try {
    const allTransaksi = await getDocsByField("transaksi", "entitasId", entitasId);
    if (!Array.isArray(allTransaksi)) throw new Error("Data transaksi bukan array");

    const transaksiHariIni = allTransaksi.filter((t) => {
      if (!t.tanggal) return false;
      return t.jenisTransaksi === jenisTransaksi;
    });

    let maxNoUrut = 0;
    const regex = new RegExp(`^${prefix}-${ddmmyyyy}-(\\d{3})$`);
    transaksiHariIni.forEach((t) => {
      const match = regex.exec(t.noReff);
      if (match) {
        const no = parseInt(match[1], 10);
        if (no > maxNoUrut) maxNoUrut = no;
      }
    });

    let noUrut;
    let newNoReff;
    let retry = 0;

    do {
      noUrut = (maxNoUrut + 1 + retry).toString().padStart(3, "0");
      newNoReff = `${prefix}-${ddmmyyyy}-${noUrut}`;
      const isNoReffExist = allTransaksi.some((t) => t.noReff === newNoReff);
      if (!isNoReffExist) break;
      retry++;
    } while (retry < 10);

    return newNoReff;
  } catch (error) {
    console.error("❌ Gagal generate No Reff:", error);
    return null;
  }
}
