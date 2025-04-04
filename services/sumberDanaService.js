import { db } from "../lib/firebaseConfig";
import { 
  collection, addDoc, getDocs, query, where, serverTimestamp, 
  getDoc, doc, deleteDoc, updateDoc, runTransaction 
} from "firebase/firestore";
import { getCurrentUser } from "../lib/auth";

/**
 * Mengambil seluruh sumber dana yang ada, termasuk "Uang Kas" jika tidak ada
 */
export const getAllSumberDana = async () => {
  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const entitasId = user.entitasId;
    const q = query(collection(db, COLLECTION_NAME), where("entitasId", "==", entitasId.trim()));
    const querySnapshot = await getDocs(q);
    
    let sumberDanaArray = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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

const COLLECTION_NAME = "sumber_dana";

/**
 * Menambah sumber dana baru dengan validasi ketat
 */
export const tambahSumberDana = async (sumberDana, kategori, saldo) => {
  if (!sumberDana || !kategori || saldo === undefined || isNaN(saldo) || saldo < 0) {
    throw new Error("❌ Data tidak valid! Pastikan semua input terisi dengan benar.");
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const entitasId = user.entitasId;
    const sumberDanaTrimmed = sumberDana.trim();

    // Cek apakah sumber dana dengan nama yang sama sudah ada
    const q = query(collection(db, COLLECTION_NAME), where("entitasId", "==", entitasId), where("sumberDana", "==", sumberDanaTrimmed));
    const existingDocs = await getDocs(q);

    if (!existingDocs.empty) {
      throw new Error(`❌ Sumber dana '${sumberDanaTrimmed}' sudah ada.`);
    }

    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      entitasId,
      sumberDana: sumberDanaTrimmed,
      kategori: kategori.trim(),
      saldo: Number(saldo),
      createdAt: serverTimestamp(),
      createdBy: user.uid,
    });

    console.log("✅ Sumber dana berhasil ditambahkan:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("❌ Gagal menambahkan sumber dana:", error);
    throw error;
  }
};

/**
 * Mengambil daftar sumber dana berdasarkan entitas ID
 */
export const getSumberDanaByEntitas = async (entitasId) => {
  if (!entitasId) throw new Error("❌ Entitas ID diperlukan untuk mengambil sumber dana.");

  try {
    const q = query(collection(db, COLLECTION_NAME), where("entitasId", "==", entitasId.trim()));
    const querySnapshot = await getDocs(q);
    
    let sumberDanaArray = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

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
 * Menghapus sumber dana dengan validasi tambahan
 */
export const hapusSumberDana = async (sumberDanaId) => {
  if (!sumberDanaId) throw new Error("❌ ID sumber dana diperlukan!");

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const sumberDanaRef = doc(db, COLLECTION_NAME, sumberDanaId);
    const sumberDanaSnap = await getDoc(sumberDanaRef);

    if (!sumberDanaSnap.exists()) throw new Error("❌ Sumber dana tidak ditemukan.");

    const sumberDanaData = sumberDanaSnap.data();
    if (sumberDanaData.entitasId !== user.entitasId) {
      throw new Error("❌ Anda tidak memiliki akses ke entitas ini.");
    }

    if (sumberDanaData.sumberDana.toLowerCase() === "uang kas") {
      throw new Error("❌ Sumber dana 'Uang Kas' tidak dapat dihapus!");
    }

    await deleteDoc(sumberDanaRef);
    console.log("✅ Sumber dana berhasil dihapus.");
  } catch (error) {
    console.error("❌ Gagal menghapus sumber dana:", error);
    throw error;
  }
};

/**
 * Memperbarui sumber dana dengan Firestore Transaction
 */
export const updateSumberDana = async (sumberDanaId, data) => {
  if (!sumberDanaId || !data || typeof data !== "object") {
    throw new Error("❌ Data tidak valid untuk memperbarui sumber dana.");
  }

  try {
    const user = await getCurrentUser();
    if (!user) throw new Error("❌ Pengguna tidak terautentikasi.");

    const sumberDanaRef = doc(db, COLLECTION_NAME, sumberDanaId);

    await runTransaction(db, async (transaction) => {
      const sumberDanaSnap = await transaction.get(sumberDanaRef);

      if (!sumberDanaSnap.exists()) {
        throw new Error("❌ Sumber dana tidak ditemukan.");
      }

      const sumberDanaData = sumberDanaSnap.data();
      if (sumberDanaData.entitasId !== user.entitasId) {
        throw new Error("❌ Anda tidak memiliki akses ke entitas ini.");
      }

      if (sumberDanaData.sumberDana.toLowerCase() === "uang kas" && 
          data.sumberDana && data.sumberDana.toLowerCase() !== "uang kas") {
        throw new Error("❌ 'Uang Kas' tidak dapat diubah menjadi nama lain!");
      }

      const updateData = {
        sumberDana: data.sumberDana ? data.sumberDana.trim() : sumberDanaData.sumberDana,
        kategori: data.kategori ? data.kategori.trim() : sumberDanaData.kategori,
        saldo: data.saldo !== undefined ? Number(data.saldo) : sumberDanaData.saldo,
        updatedAt: serverTimestamp(),
      };

      transaction.update(sumberDanaRef, updateData);
    });

    console.log("✅ Sumber dana berhasil diperbarui.");
    return true;
  } catch (error) {
    console.error("❌ Gagal memperbarui sumber dana:", error);
    throw error;
  }
};

/**
 * Mengambil sumber dana berdasarkan entitas ID
 */
export const getSumberDana = async (entitasId) => {
  const sumberDanaRef = collection(db, "sumber_dana");
  const q = query(sumberDanaRef, where("entitasId", "==", entitasId));

  try {
    const querySnapshot = await getDocs(q);
    const sumberDanaList = querySnapshot.docs.map(doc => doc.data());
    return sumberDanaList;
  } catch (error) {
    console.error("❌ Error mengambil sumber dana:", error);
    throw error;
  }
};
