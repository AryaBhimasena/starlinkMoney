import {
  getCollectionRef,
  getDocsByField,
  setDocData,
  updateDocData,
  deleteDocById
} from "./firestoreService";

/**
 * Fungsi untuk menambahkan saldo baru
 */
export const addSaldo = async (entitasId, sumberDana, saldoAwal, kategori) => {
  try {
    // Cek apakah saldo untuk sumber dana ini sudah ada
    const saldoDocs = await getDocsByField("saldo", "entitasId", entitasId);
    const existingSaldo = saldoDocs.find(doc => doc.sumberDana === sumberDana);

    if (existingSaldo) {
      throw new Error(`Saldo untuk sumber dana "${sumberDana}" sudah ada.`);
    }

    const now = new Date();
    const newSaldo = {
      entitasId,
      sumberDana,
      saldo: saldoAwal,
      kategori,
      dibuatPada: now,
      createdAt: now,
      updatedAt: now,
    };

    // Gunakan format dokumen ID: entitasId_namaSumberDana_diformat
    const saldoDocId = `${entitasId}_${sumberDana.replace(/\s+/g, "_").toLowerCase()}`;

    await setDocData("saldo", saldoDocId, newSaldo);
    console.log(`✅ Saldo untuk "${sumberDana}" berhasil ditambahkan.`);
  } catch (error) {
    console.error("❌ Gagal menambahkan saldo:", error);
    throw error;
  }
};

/**
 * Fungsi untuk mendapatkan saldo berdasarkan entitasId
 */
export const getSaldoByEntitasId = async (entitasId) => {
  try {
    // Ambil saldo berdasarkan entitasId
    const saldoDocs = await getDocsByField("saldo", "entitasId", entitasId);
	console.log("Saldo ditemukan:", saldoDocs); // Periksa hasil query
    return saldoDocs;
  } catch (error) {
    console.error("❌ Gagal mengambil saldo:", error);
    throw error;
  }
};

/**
 * Fungsi untuk memperbarui saldo berdasarkan ID
 */
export const updateSaldo = async (entitasId, saldoDocId, saldoBaru) => {
  try {
    if (!saldoDocId) throw new Error("ID dokumen saldo tidak ditemukan.");

    await updateDocData("saldo", saldoDocId, { saldo: saldoBaru });
    console.log(`✅ Saldo ID ${saldoDocId} berhasil diperbarui dengan nilai: ${saldoBaru}`);
  } catch (error) {
    console.error("❌ Gagal memperbarui saldo:", error);
    throw error;
  }
};


/**
 * Fungsi untuk menghapus saldo berdasarkan ID
 */
export const deleteSaldo = async (entitasId, sumberDana) => {
  try {
    // Ambil dokumen saldo berdasarkan entitasId dan sumberDana
    const saldoDocs = await getDocsByField("saldo", "entitasId", entitasId);
    const saldoItem = saldoDocs.find(doc => doc.sumberDana === sumberDana);

    if (!saldoItem) {
      throw new Error("Saldo untuk sumber dana ini tidak ditemukan.");
    }

    // Hapus saldo
    await deleteDocById("saldo", saldoItem.id);
    console.log(`Saldo untuk entitas ${entitasId} dan sumber dana ${sumberDana} berhasil dihapus.`);
  } catch (error) {
    console.error("❌ Gagal menghapus saldo:", error);
    throw error;
  }
};
