import { 
	getDocsByField,
	addDocToCollection,
	getDocById,
	deleteDocById,
	updateDocData
	} from "./firestoreService";
import { addSaldo } from "./saldoService"; // Pastikan sudah diimpor
import { getUserData } from "./indexedDBService";

/**
 * Mengambil seluruh sumber dana yang ada, termasuk "Uang Kas" jika tidak ada
 */
export const getAllSumberDana = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const entitasId = user.entitasId;
    const sumberDanaArray = await getDocsByField("sumber_dana", "entitasId", entitasId.trim());

    // Pastikan "Uang Kas" selalu ada dalam daftar
    if (!sumberDanaArray.some((item) => item.sumberDana.toLowerCase() === "uang kas")) {
      sumberDanaArray.unshift({ id: "default", sumberDana: "Uang Kas", kategori: "Kas", saldo: 0 });
    }

    return sumberDanaArray;
  } catch (error) {
    console.error("❌ Gagal mengambil sumber dana:", error);
    throw error;
  }
};

/**
 * Menambah sumber dana baru dengan validasi ketat
 */
export const tambahSumberDana = async (sumberDana, kategori, saldo) => {
  if (!sumberDana || !kategori || saldo === undefined || isNaN(saldo) || saldo < 0) {
    throw new Error("❌ Data tidak valid! Pastikan semua input terisi dengan benar.");
  }

  try {
    const user = await getUserData();
    if (!user || !user.entitasId) throw new Error("❌ Pengguna tidak valid atau belum login.");

    // ✅ Validasi role superadmin sesuai Firestore rules
    if (user.role !== "superadmin") {
      throw new Error("❌ Hanya superadmin yang diizinkan menambahkan sumber dana.");
    }

    const entitasId = user.entitasId;
    const sumberDanaTrimmed = sumberDana.trim();
    const kategoriTrimmed = kategori.trim();

    // Cek apakah sumber dana dengan nama yang sama sudah ada
    const existingDocs = await getDocsByField("sumber_dana", "entitasId", entitasId);
    if (existingDocs.some((doc) => doc.sumberDana.toLowerCase() === sumberDanaTrimmed.toLowerCase())) {
      throw new Error(`❌ Sumber dana '${sumberDanaTrimmed}' sudah ada.`);
    }

    // Tambahkan ke koleksi sumber_dana
    const result = await addDocToCollection("sumber_dana", {
      entitasId,
      sumberDana: sumberDanaTrimmed,
      kategori: kategoriTrimmed,
      saldo: Number(saldo),
      createdAt: new Date(),
    });

    if (!result.success) throw new Error(result.error || "Gagal tambah data");

    // Tambahkan ke koleksi saldo
    await addSaldo(entitasId, sumberDanaTrimmed, Number(saldo), kategoriTrimmed, user?.uid || "");

    console.log("✅ Sumber dana dan saldo berhasil ditambahkan:", result.docId);
    return result.docId;
  } catch (error) {
    console.error("❌ Gagal menambahkan sumber dana dan saldo:", error);
    throw error;
  }
};

/**
 * Mengambil sumber dana berdasarkan entitas ID
 */
export const getSumberDanaByEntitas = async (entitasId) => {
  if (!entitasId) throw new Error("❌ Entitas ID diperlukan!");

  try {
    const sumberDanaArray = await getDocsByField("sumber_dana", "entitasId", entitasId.trim());

    // Pastikan "Uang Kas" selalu ada dalam daftar
    if (!sumberDanaArray.some((item) => item.sumberDana.toLowerCase() === "uang kas")) {
      sumberDanaArray.unshift({ id: "default", sumberDana: "Uang Kas", kategori: "Kas", saldo: 0 });
    }

    return sumberDanaArray;
  } catch (error) {
    console.error("❌ Gagal mengambil sumber dana:", error);
    throw error;
  }
};

/**
 * Menghapus sumber dana dengan validasi tambahan menggunakan entitasId
 */
export const hapusSumberDana = async (sumberDanaId) => {
  if (!sumberDanaId) throw new Error("❌ ID sumber dana diperlukan!");

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const sumberDana = await getDocById("sumber_dana", sumberDanaId);
    if (!sumberDana) throw new Error("❌ Sumber dana tidak ditemukan.");

    // Validasi bahwa entitasId sumber dana sesuai dengan milik pengguna
    if (sumberDana.entitasId !== user.entitasId) {
      throw new Error("❌ Anda tidak memiliki akses ke entitas ini.");
    }

    // Tidak bisa menghapus 'Uang Kas'
    if (sumberDana.sumberDana.toLowerCase() === "uang kas") {
      throw new Error("❌ Sumber dana 'Uang Kas' tidak dapat dihapus!");
    }

    // 🔥 Hapus dokumen dari sumber_dana
    await deleteDocById("sumber_dana", sumberDanaId);

    // 🔥 Hapus juga dari koleksi saldo (ID sama)
    await deleteDocById("saldo", sumberDanaId);

    console.log("✅ Sumber dana dan saldo terkait berhasil dihapus.");
  } catch (error) {
    console.error("❌ Gagal menghapus sumber dana:", error);
    throw error;
  }
};

/**
 * Memperbarui sumber dana dengan validasi menggunakan entitasId
 */
export const updateSumberDana = async (sumberDanaId, data) => {
  if (!sumberDanaId || !data || typeof data !== "object") {
    throw new Error("❌ Data tidak valid untuk memperbarui sumber dana.");
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    // Mengambil data sumber dana berdasarkan ID
    const sumberDana = await getDocById("sumber_dana", sumberDanaId);
    if (!sumberDana) throw new Error("❌ Sumber dana tidak ditemukan.");

    // Validasi bahwa entitasId sumber dana sesuai dengan milik pengguna
    if (sumberDana.entitasId !== user.entitasId) {
      throw new Error("❌ Anda tidak memiliki akses ke entitas ini.");
    }

    // Tidak bisa mengubah 'Uang Kas' menjadi nama lain
    if (sumberDana.sumberDana.toLowerCase() === "uang kas" && 
        data.sumberDana && data.sumberDana.toLowerCase() !== "uang kas") {
      throw new Error("❌ 'Uang Kas' tidak dapat diubah menjadi nama lain!");
    }

    const updateData = {
      sumberDana: data.sumberDana ? data.sumberDana.trim() : sumberDana.sumberDana,
      kategori: data.kategori ? data.kategori.trim() : sumberDana.kategori,
      saldo: data.saldo !== undefined ? Number(data.saldo) : sumberDana.saldo,
      updatedAt: serverTimestamp(),
    };

    // Melakukan pembaruan data sumber dana
    await updateDocData("sumber_dana", sumberDanaId, updateData);
    console.log("✅ Sumber dana berhasil diperbarui.");
    return true;
  } catch (error) {
    console.error("❌ Gagal memperbarui sumber dana:", error);
    throw error;
  }
};
