const { db } = require("../lib/firebaseConfig");
const { collection, addDoc, getDocs, query, where } = require("firebase/firestore");

const COLLECTION_NAME = "sumber_dana";

// Menambah sumber dana baru
const tambahSumberDana = async (entitasId, nama, kategori, saldoAwal) => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      entitasId,
      nama,
      kategori,
      saldo: saldoAwal,
      createdAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error("Error menambahkan sumber dana: ", error);
    throw error;
  }
};

// Mengambil daftar sumber dana berdasarkan entitas
const getSumberDana = async (entitasId) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where("entitasId", "==", entitasId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error("Error mengambil sumber dana: ", error);
    throw error;
  }
};

module.exports = {
  tambahSumberDana,
  getSumberDana,
};
