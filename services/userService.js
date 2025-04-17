import { auth, db } from "../lib/firebaseConfig";
import { 
    collection, getDocs, addDoc, updateDoc, doc, deleteDoc, setDoc, getDoc, query, where
} from "firebase/firestore";
import { saveUserData, getUserData, removeUserData } from "./indexedDBService";

// Koleksi Firestore "users"
const usersCollection = collection(db, "users");

// Fungsi untuk menyimpan data user aktif ke IndexedDB
export const saveUserToIndexedDB = async (user) => {
    if (user) {
        await saveUserData(user);
    }
};

// Fungsi untuk mendapatkan data user yang sedang aktif dari IndexedDB
export const getUserFromIndexedDB = async () => {
    return await getUserData();
};

// Fungsi untuk mengambil semua user
export const getUsers = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("❌ User belum login!");
    }

    // 1. Fetch profil user untuk dapatkan entitasId
    const profileSnap = await getDoc(doc(db, "users", currentUser.uid));
    if (!profileSnap.exists()) {
      throw new Error("❌ Profil user tidak ditemukan di Firestore!");
    }
    const { entitasId } = profileSnap.data();

    // 2. Query semua user di entitas yang sama
    const q = query(
      collection(db, "users"),
      where("entitasId", "==", entitasId)
    );
    const querySnapshot = await getDocs(q);

    // 3. Kembalikan daftar user
    return querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
};

// Fungsi untuk menambahkan user baru
export const addUser = async (user) => {
    try {
        console.log("Adding user:", user);
        const userRef = user.id ? doc(db, "users", user.id) : null;

        if (userRef) {
            await setDoc(userRef, user);
            console.log("User added successfully with provided ID:", user.id);
            await saveUserToIndexedDB(user);
            return user.id;
        }

        const newDocRef = await addDoc(usersCollection, user);
        console.log("User added successfully with generated ID:", newDocRef.id);
        await saveUserToIndexedDB(user);
        return newDocRef.id;
    } catch (error) {
        console.error("Error adding user:", error);
        throw error;
    }
};

// Fungsi untuk memperbarui data user
export const updateUser = async (id, data) => {
    try {
        console.log("Updating user:", id, data);
        await updateDoc(doc(db, "users", id), data);
        console.log("User updated successfully");

        const updatedUser = { ...data, id };
        await saveUserToIndexedDB(updatedUser);
    } catch (error) {
        console.error("Error updating user", id, error);
    }
};

// Fungsi untuk menghapus user
export const deleteUser = async (id) => {
    try {
        console.log("Deleting user:", id);
        await deleteDoc(doc(db, "users", id));
        console.log("User deleted successfully");

        const activeUser = await getUserFromIndexedDB();
        if (activeUser && activeUser.id === id) {
            await removeUserData();
        }
    } catch (error) {
        console.error("Error deleting user", id, error);
    }
};

// Fungsi untuk menyimpan user ke Firestore
export const saveUserToFirestore = async (uid, name, email, role) => {
    try {
        console.log("Saving user to Firestore:", uid);
        await setDoc(doc(db, "users", uid), { name, email, role });
        console.log("User saved successfully");

        const newUser = { id: uid, name, email, role };
        await saveUserToIndexedDB(newUser);
    } catch (error) {
        console.error("Error saving user", uid, "to Firestore:", error);
    }
};

// Fungsi untuk mengambil user berdasarkan ID
export const getUserById = async (uid) => {
    try {
        console.log("Fetching user by ID:", uid);
        const userSnap = await getDoc(doc(db, "users", uid));

        if (!userSnap.exists()) {
            console.warn("No user found with ID:", uid);
            return null;
        }

        return { id: userSnap.id, ...userSnap.data() };
    } catch (error) {
        console.error("Error fetching user", uid, error);
        return null;
    }
};
