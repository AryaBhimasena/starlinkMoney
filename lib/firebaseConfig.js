import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs } from "firebase/firestore";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Coba inisialisasi Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase berhasil diinisialisasi");
} catch (error) {
  console.error("❌ Gagal menginisialisasi Firebase:", error);
}

let auth, db;
try {
  auth = getAuth(app);
  db = getFirestore(app);
  console.log("✅ Firebase Auth & Firestore berhasil diinisialisasi");
} catch (error) {
  console.error("❌ Gagal menginisialisasi Auth atau Firestore:", error);
}

// Referensi koleksi Firestore
const saldoRef = collection(db, "saldo");
const transaksiRef = collection(db, "transaksi");
const sumberDanaRef = collection(db, "sumber_dana");

// Fungsi untuk memantau perubahan status autentikasi
const subscribeAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// Fungsi untuk mengambil data sumber dana berdasarkan entitasId
const getSumberDanaByEntitasId = async (entitasId) => {
  try {
    // Membuat query untuk mengambil sumber dana berdasarkan entitasId
    const q = query(sumberDanaRef, where("entitasId", "==", entitasId));
    const querySnapshot = await getDocs(q);

    // Memproses hasil query menjadi array
    const sumberDanaArray = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Menambahkan "Uang Kas" jika belum ada
    if (!sumberDanaArray.some(item => item.sumberDana.toLowerCase() === "uang kas")) {
      sumberDanaArray.unshift({ id: "default", sumberDana: "Uang Kas", kategori: "Kas", saldo: 0 });
    }

    return sumberDanaArray;
  } catch (error) {
    console.error("❌ Error fetching sumber dana:", error);
    return [];
  }
};

export { auth, db, saldoRef, transaksiRef, sumberDanaRef, subscribeAuthState, getSumberDanaByEntitasId };
