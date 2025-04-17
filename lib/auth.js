import Cookies from "js-cookie";
import { signOut, createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseConfig.js";
import { saveUserToFirestore } from "../services/userService.js";

export const logout = async (router) => {
  try {
    console.log("Proses logout dimulai...");
    await signOut(auth);
    Cookies.remove("token");
    Cookies.remove("user"); // Hapus data user dari cookies saat logout
    console.log("Logout berhasil, mengarahkan ke halaman login...");
    router.push("/login");
  } catch (error) {
    console.error("Gagal logout:", error);
  }
};

export const registerUser = async (email, password, name, role, entitasId) => {
  try {
    console.log("🔹 registerUser dipanggil dengan email:", email, "dan password:", password);

    if (!auth) {
      console.error("❌ Firebase Auth tidak terinisialisasi!");
      return { success: false, error: "Firebase Auth tidak ditemukan." };
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    console.log("✅ userCredential berhasil dibuat:", userCredential);

    if (!userCredential || !userCredential.user) {
      throw new Error("❌ UserCredential tidak valid!");
    }

    const user = userCredential.user;
    console.log("✅ User berhasil dibuat di Authentication dengan UID:", user.uid);

    const firestoreResponse = await saveUserToFirestore(user.uid, name, email, role, entitasId);
    console.log("✅ Data user berhasil disimpan di Firestore:", firestoreResponse);

    return { success: true, uid: user.uid };
  } catch (error) {
    console.error("❌ Gagal menambahkan pengguna:", error);
    return { success: false, error: error.message };
  }
};

export const getCurrentUser = () => {
  return new Promise((resolve, reject) => {
    console.log("Mengecek status pengguna yang sedang login...");
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        console.log("Pengguna sedang login:", user.email);

        try {
          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            console.log("✅ Data user ditemukan di Firestore:", userData);

            Cookies.set("user", JSON.stringify(userData), { expires: 1 });
            resolve(userData);
          } else {
            console.error("❌ Data user tidak ditemukan di Firestore!");
            resolve(null);
          }
        } catch (error) {
          console.error("❌ Gagal mengambil data user dari Firestore:", error);
          reject(error);
        }
      } else {
        console.log("Tidak ada pengguna yang sedang login.");
        resolve(null);
      }
    }, (error) => {
      console.error("Gagal mendapatkan status pengguna:", error);
      reject(error);
    });
  });
};

export const addSumberDana = async (kategori, saldo, sumberDana) => {
  try {
    // Ambil user yang sedang login
    const user = await getCurrentUser();
    if (!user || !user.entitasId) {
      throw new Error("Entitas ID tidak ditemukan atau pengguna tidak terautentikasi.");
    }

    const docRef = await addDoc(collection(db, "sumber_dana"), {
      createdAt: serverTimestamp(),
      createdBy: user.uid,  // Menggunakan UID user aktif
      entitasId: user.entitasId, // Menggunakan entitasId dari user aktif
      kategori,
      saldo,
      sumberDana
    });

    console.log("✅ Sumber dana berhasil ditambahkan dengan ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("❌ Gagal menambahkan sumber dana:", error);
    return { success: false, error: error.message };
  }
};


