import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../lib/firebaseConfig";
import { getUserData } from "./indexedDBService";

export const registerUser = async (email, password, name) => {
  let userCredential = null;

  try {
    // Langkah 1: Menerima data email dan password, serta data dari form.
    console.log("📌 [1] Menerima data untuk pembuatan akun admin baru...");
    
    // Ambil password superadmin dari sessionStorage
    const superadminPassword = sessionStorage.getItem("adminPassword");
	console.log("📌 Password superadmin dari sessionStorage:", superadminPassword);
	const currentUser = await getUserData();
    const superadminEmail = currentUser.Email;

    // Langkah 2: Membuat akun Auth baru untuk admin
    console.log("📌 [2] Membuat akun admin di Firebase...");
    userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const newUser = userCredential.user;
    console.log("✅ Akun admin berhasil dibuat:", newUser.uid);

    // Langkah 3: Relogin menggunakan email dan password superadmin
    console.log("📌 [3] Melakukan relogin menggunakan akun superadmin...");
    await signInWithEmailAndPassword(auth, superadminEmail, superadminPassword);
    console.log("✅ Relogin berhasil ke akun superadmin.");

    // Langkah 4: Hapus password superadmin dari sessionStorage
    sessionStorage.removeItem("adminPassword");
    console.log("🧹 Password superadmin telah dihapus dari sessionStorage.");

    // Langkah 5: Simpan data form ke koleksi Firestore
    console.log("📌 [4] Menyimpan data admin baru ke Firestore...");
    const userData = {
      name,
      email,
      role: "admin",
      entitasId: currentUser.entitasId,  // Mengambil entitasId dari data superadmin
      createdAt: new Date(),
    };
    await setDoc(doc(db, "users", newUser.uid), userData);
    console.log("✅ Data admin berhasil disimpan di Firestore.");

    // Langkah 6: Kirim email verifikasi
    console.log("📌 [5] Mengirim email verifikasi...");
    await sendEmailVerification(newUser);
    console.log("✅ Email verifikasi berhasil dikirim.");

    return { user: newUser, userData };
  } catch (error) {
    console.error("❌ Gagal mendaftarkan admin baru:", error.message);

    if (userCredential?.user) {
      try {
        console.log("⚠️ Rollback: Menghapus akun admin yang baru dibuat...");
        await deleteUser(userCredential.user);
        await signOut(auth);
      } catch (rollbackError) {
        console.error("❌ Gagal rollback:", rollbackError.message);
      }
    }

    // Bersihkan session jika ada error juga
    sessionStorage.removeItem("adminPassword");
    throw new Error(error.message);
  }
};

export const newRegisterUser = async (email, password, nama, noWa) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    // Simpan data ke koleksi newRegistrar
    const newRegistrarRef = doc(db, "newRegistrar", uid);
    await setDoc(newRegistrarRef, {
      uid,
      nama,
      email,
      noWa,
      status: "menunggu-konfirmasi",
      createdAt: new Date(),
    });

    // Logout user
    await signOut(auth);

    return uid;
  } catch (error) {
    console.error("❌ Gagal proses registrasi:", error);
    throw error;
  }
};