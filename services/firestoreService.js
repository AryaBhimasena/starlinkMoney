import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getFirestore,
  runTransaction
} from "firebase/firestore";
import { db } from "../lib/firebaseConfig.js";

// 🔁 UTILITY: Referensi Koleksi
export const getCollectionRef = (collectionName) => collection(db, collectionName);
export const getDocRef = (collectionName, docId) => doc(db, collectionName, docId);

// 📘 GET SEMUA DOKUMEN DARI KOLEKSI
export const getAllDocs = async (collectionName) => {
  try {
    const snapshot = await getDocs(getCollectionRef(collectionName));
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Gagal mengambil data dari koleksi ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// 📘 GET SEMUA DOKUMEN DARI KOLEKSI TERFILTER BERDASARKAN ENTITASID
export const getAllDocsEntitasId = async (collectionName, entitasId) => {
  try {
    // Membuat query untuk menyaring berdasarkan entitasID
    const q = query(getCollectionRef(collectionName), where("entitasId", "==", entitasId));

    // Mendapatkan snapshot dari query yang sudah difilter
    const snapshot = await getDocs(q);

    // Mengembalikan data yang sudah di-mapping
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Gagal mengambil data dari koleksi ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// 📘 GET DOKUMEN BERDASARKAN ID
export const getDocById = async (collectionName, docId) => {
  try {
    const docSnap = await getDoc(getDocRef(collectionName, docId));
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    console.error(`Gagal mengambil dokumen ${docId} dari koleksi ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// 🔍 GET DOKUMEN DENGAN FILTER (WHERE)
export const getDocsByField = async (collectionName, field, value, operator = "==") => {
  try {
    const q = query(getCollectionRef(collectionName), where(field, operator, value));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Gagal filter data dari koleksi ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// 📝 SET / UPDATE DATA DOKUMEN (MIRIP UPSERT)
export const setDocData = async (collectionName, docId, data, merge = true, transaction = null) => {
  try {
    const docRef = getDocRef(collectionName, docId);

    if (transaction) {
      // Gunakan transaksi untuk set data
      transaction.set(docRef, data, { merge });
    } else {
      // Jika tanpa transaksi, gunakan setDoc biasa
      await setDoc(docRef, data, { merge });
    }

    return { success: true };
  } catch (error) {
    console.error(`Gagal menyimpan data di ${collectionName}/${docId}:`, error);
    return { success: false, error: error.message };
  }
};

// ✏️ UPDATE DATA DOKUMEN (KHUSUS FIELD-FIELD)
export const updateDocData = async (collectionName, docId, data, transaction = null) => {
  try {
    const docRef = getDocRef(collectionName, docId);

    if (transaction) {
      // Gunakan transaksi untuk update data
      transaction.update(docRef, data);
    } else {
      // Jika tanpa transaksi, gunakan updateDoc biasa
      await updateDoc(docRef, data);
    }

    return { success: true };
  } catch (error) {
    console.error(`Gagal update data di ${collectionName}/${docId}:`, error);
    return { success: false, error: error.message };
  }
};

// 🗑️ DELETE DOKUMEN
export const deleteDocById = async (collectionName, docId, transaction = null) => {
  try {
    const docRef = getDocRef(collectionName, docId);

    if (transaction) {
      // Gunakan transaksi untuk delete dokumen
      transaction.delete(docRef);
    } else {
      // Jika tanpa transaksi, gunakan deleteDoc biasa
      await deleteDoc(docRef);
    }

    return { success: true };
  } catch (error) {
    console.error(`Gagal menghapus dokumen ${docId} di koleksi ${collectionName}:`, error);
    return { success: false, error: error.message };
  }
};

// 📝 MENAMBAHKAN DOKUMEN BARU KE KOLEKSI
export const addDocToCollection = async (collectionName, data, transaction = null) => {
  try {
    const collectionRef = getCollectionRef(collectionName);  // Mendapatkan referensi koleksi
    const docRef = doc(collectionRef);  // Mendapatkan referensi dokumen baru

    if (transaction) {
      // Gunakan transaksi untuk menambahkan dokumen
      transaction.set(docRef, data);
    } else {
      // Jika tanpa transaksi, gunakan add biasa
      await setDoc(docRef, data);
    }

    return { success: true, docId: docRef.id };  // Mengembalikan ID dokumen baru
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Menjalankan transaksi untuk beberapa operasi Firestore secara atomik.
 * @param {Function} transactionFn - Fungsi yang berisi logika transaksi
 * @returns {Promise<Object>} - Hasil transaksi
 */
export async function runFirestoreTransaction(transactionFn) {
  const db = getFirestore();

  try {
    // Menjalankan transaksi
    const result = await runTransaction(db, async (transaction) => {
      return transactionFn(transaction);  // Menjalankan fungsi yang diberikan
    });
    return { success: true, result };
  } catch (error) {
    console.error("❌ Gagal menjalankan transaksi:", error);
    return { success: false, error: error.message };
  }
}

// HELPER MENANGANI FORMAT TIMESTAMP FIRESTORE
export const getDateFromCreatedAt = (createdAt) => {
  if (!createdAt) return null;

  // Firestore Timestamp
  if (typeof createdAt.toDate === "function") {
    return createdAt.toDate();
  }

  // Jika string (misalnya ISO)
  if (typeof createdAt === "string") {
    return new Date(createdAt);
  }

  // Sudah dalam bentuk Date
  if (createdAt instanceof Date) {
    return createdAt;
  }

  return null;
};
