import { db as firestoreDB, auth } from "../lib/firebaseConfig";
import { getDoc, doc, getFirestore, getDocs, collection, query, where } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid"; // Pastikan uuid sudah diinstall
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';

const DB_NAME = "StarlinkMoneyDB";
const DB_VERSION = 2;
const STORE_NAMES = ["userData", "transaksi", "sumber_dana", "saldo", "allUserData", "token", "token_riwayat"];
const collectionName = ["transaksi"];
const EVENT_NAME = "indexedDBUpdated";

const db = getFirestore();

export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = function (event) {
  const db = event.target.result;

  // Buat object store dari daftar
  STORE_NAMES.forEach((storeName) => {
    if (!db.objectStoreNames.contains(storeName)) {
      db.createObjectStore(storeName, { keyPath: "id" });
      console.log(`✅ Object Store '${storeName}' berhasil dibuat.`);
    }
  });

  // Tambahkan pembuatan tempTransaksi DI SINI
  if (!db.objectStoreNames.contains("tempTransaksi")) {
    db.createObjectStore("tempTransaksi", {
      keyPath: "id",
    });
    console.log("✅ Object Store 'tempTransaksi' berhasil dibuat.");
  }
};

    request.onsuccess = function (event) {
      resolve(event.target.result);
    };

    request.onerror = function (event) {
      reject(event.target.error);
    };
  });
}

function triggerUpdate() {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export async function clearIndexedDB() {
  const db = await openDB();

  // Konversi `DOMStringList` ke array
  const storeNames = Array.from(db.objectStoreNames);

  if (storeNames.length === 0) {
    console.warn("Tidak ada object store yang tersedia untuk dibersihkan.");
    return;
  }

  const tx = db.transaction(storeNames, "readwrite");

  return new Promise((resolve, reject) => {
    try {
      storeNames.forEach((storeName) => {
        const store = tx.objectStore(storeName);
        store.clear();
      });

      tx.oncomplete = () => {
        db.close();
        triggerUpdate();
        resolve();
      };

      tx.onerror = () => reject(tx.error);
    } catch (error) {
      reject(error);
    }
  });
}

async function getData(key) {
  const db = await openDB();
  const tx = db.transaction("transaksi", "readonly");
  const store = tx.objectStore("transaksi");

  return new Promise((resolve, reject) => {
    const request = store.get(key);

    request.onsuccess = () => {
      const result = request.result || []; // Gunakan langsung request.result jika ada
      resolve(result);
    };

    request.onerror = () => reject(request.error);

    tx.oncomplete = () => db.close(); // Tutup database setelah transaksi selesai
  });
}

// Fungsi utama untuk mengambil `entitasId` user yang sedang aktif dan menyinkronkan data
export async function syncUserData() {
  try {
    // 🔹 Pastikan userData sudah diambil sebelum memulai sinkronisasi
    const userData = await getUserData();
    if (!userData || !userData.entitasId) {
      console.error("❌ Tidak dapat menemukan data user atau entitasId.");
      return Promise.reject(new Error("User data atau entitasId tidak ditemukan."));
    }

    const entitasId = userData.entitasId;
    console.log(`🔄 Memulai sinkronisasi data untuk entitasId: ${entitasId}`);

    const db = await openDB();

    // 🔹 Hapus semua data lama sebelum menyinkronkan
    await clearAllIndexedDBData();

    // 🔹 Ambil data dari Firestore
    const [transaksiData, sumberDanaData, saldoData, allUserData] = await Promise.all([
      fetchDataFromFirestore("transaksi", entitasId),
      fetchDataFromFirestore("sumber_dana", entitasId),
      fetchDataFromFirestore("saldo", entitasId),
      fetchDataFromFirestore("users", entitasId),
    ]);

    // 🔹 Tambahkan ID unik jika belum ada
    transaksiData.forEach(item => item.id = item.id || uuidv4());
    sumberDanaData.forEach(item => item.id = item.id || uuidv4());
    saldoData.forEach(item => item.id = item.id || uuidv4());
    allUserData.forEach(user => user.id = user.id || uuidv4());

    // 🔹 Simpan data ke IndexedDB dalam satu transaksi
    const tx = db.transaction(["transaksi", "sumber_dana", "saldo", "allUserData"], "readwrite");

    const transaksiStore = tx.objectStore("transaksi");
    const sumberDanaStore = tx.objectStore("sumber_dana");
    const saldoStore = tx.objectStore("saldo");
    const userStore = tx.objectStore("allUserData");

    transaksiData.forEach(item => transaksiStore.put(item));
    sumberDanaData.forEach(item => sumberDanaStore.put(item));
    saldoData.forEach(item => saldoStore.put(item));
    allUserData.forEach(user => userStore.put(user)); // 🔥 Simpan data user

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        console.log("✅ Semua data berhasil disinkronkan ke IndexedDB.");
        resolve({ transaksiData, sumberDanaData, saldoData, allUserData });
      };

      tx.onerror = () => {
        console.error("❌ Gagal menyimpan data ke IndexedDB:", tx.error);
        reject(tx.error);
      };
    });

  } catch (error) {
    console.error("❌ Error saat sinkronisasi data:", error);
    return Promise.reject(error);
  }
}

// Fungsi untuk mengambil `entitasId` user yang aktif dari IndexedDB
export async function getActiveEntitasId() {
  try {
    const db = await openDB();
    const tx = db.transaction("userData", "readonly");
    const store = tx.objectStore("userData");

    return new Promise((resolve, reject) => {
      const request = store.get("activeUser");

      request.onsuccess = () => {
        const userData = request.result;
        resolve(userData ? userData.entitasId : null);
      };

      request.onerror = () => {
        console.error("❌ Gagal mengambil entitasId dari IndexedDB:", request.error);
        reject(request.error);
      };

      tx.oncomplete = () => db.close();
    });
  } catch (error) {
    console.error("❌ Error saat mengambil entitasId user:", error);
    return null;
  }
}

// Fungsi untuk mengambil data dari Firestore berdasarkan entitasId
async function fetchDataFromFirestore(collectionName, entitasId) {
  try {
    const q = query(collection(db, collectionName), where("entitasId", "==", entitasId));
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) || [];
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    return [];
  }
}

// Fungsi untuk menghapus semua data lama di IndexedDB sebelum sinkronisasi
async function clearAllIndexedDBData() {
  try {
    const db = await openDB(); // Pastikan openDB() mengembalikan IndexedDB Database
    
    const tx = db.transaction(["transaksi", "sumber_dana", "saldo", "token", "token_riwayat"], "readwrite");
    await Promise.all([
      tx.objectStore("transaksi").clear(),
      tx.objectStore("sumber_dana").clear(),
      tx.objectStore("saldo").clear(),
      tx.objectStore("token").clear(),
      tx.objectStore("token_riwayat").clear(),
    ]);

    await tx.done; // Pastikan transaksi selesai sebelum melanjutkan
    console.log("🧹 Semua data lama di IndexedDB telah dihapus.");
  } catch (error) {
    console.error("❌ Gagal menghapus data IndexedDB:", error);
  }
}

export async function rekonsiliasiData() {
    try {
        const sumberDanaList = await getAllData("sumber_dana");
        const saldoList = await getAllData("saldo");
        
        if (sumberDanaList.length === saldoList.length) {
            console.log("✅ Rekonsiliasi selesai: Tidak ada perubahan pada saldo.");
            return;
        }
        
        // Buat set untuk menyimpan semua sumberDana yang sudah ada di saldo
        const saldoSumberDanaSet = new Set(saldoList.map(item => item.sumberDana));
        
        // Temukan item di sumber_dana yang tidak ada di saldo berdasarkan field sumberDana
        const missingItems = sumberDanaList.filter(item => !saldoSumberDanaSet.has(item.sumberDana));
        
        if (missingItems.length > 0) {
            for (const item of missingItems) {
                const newSaldoEntry = {
					id: item.id,
                    sumberDana: item.sumberDana,
                    saldo: item.saldo || 0, // Pastikan saldo awal tidak undefined
                    entitasId: item.entitasId,
                    timeStamp: Date.now()
                };
                await saveToIndexedDB("saldo", newSaldoEntry);
                console.log(`✅ Saldo ditambahkan untuk sumber dana: ${item.sumberDana}`);
            }
        }
    } catch (error) {
        console.error("❌ Error saat rekonsiliasi data:", error);
    }
}

export async function getAllData(STORE_NAME) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("StarlinkMoneyDB", 2);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(STORE_NAME, "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const getAllRequest = store.getAll();

            getAllRequest.onsuccess = () => {
                resolve(getAllRequest.result);
            };
            getAllRequest.onerror = () => {
                reject(getAllRequest.error);
            };
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

export async function saveToIndexedDB(STORE_NAME, data) {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("StarlinkMoneyDB", 2);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(STORE_NAME, "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const addRequest = store.put(data); // `put` untuk update atau insert

            addRequest.onsuccess = () => {
                resolve(true);
            };
            addRequest.onerror = () => {
                reject(addRequest.error);
            };
        };
        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Simpan noReff sementara
export const saveTempReff = async (entitasId, noReff) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB", 2);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("tempTransaksi", "readwrite");
      const store = tx.objectStore("tempTransaksi");

      const today = new Date().toISOString().split("T")[0];
      const key = `${entitasId}_${today}`;

      const data = { id: key, noReff };
      store.put(data);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    };
    request.onerror = () => reject(request.error);
  });
};

// Ambil noReff sementara
export const getTempReff = async (entitasId) => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB", 2);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("tempTransaksi", "readonly");
      const store = tx.objectStore("tempTransaksi");

      const today = new Date().toISOString().split("T")[0];
      const key = `${entitasId}_${today}`;
      const getRequest = store.get(key);

      getRequest.onsuccess = () => {
        resolve(getRequest.result?.noReff || null);
      };
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};


// Fungsi untuk USER
export async function saveUserData(uid) {
  if (!uid) {
    console.error("UID tidak valid:", uid);
    return Promise.reject(new Error("UID tidak valid"));
  }

  try {
    // 🔥 2. Ambil data user dari Firestore berdasarkan UID
    const userRef = doc(firestoreDB, "users", uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error("User tidak ditemukan di Firestore untuk UID:", uid);
      return Promise.reject(new Error("User tidak ditemukan"));
    }

    const userData = userSnap.data();

    // 🔥 3. Simpan data user ke IndexedDB
    const db = await openDB();
    const tx = db.transaction("userData", "readwrite");
    const store = tx.objectStore("userData");

    const userRecord = {
      id: "user", // ID tetap "user" karena hanya ada satu userData
      uid: uid,
      entitasId: userData.entitasId,
      name: userData.name,
      role: userData.role,
      Email: userData.Email,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(userRecord);

      request.onsuccess = () => {
        console.log("User data berhasil disimpan ke IndexedDB:", userRecord);
        resolve(userRecord);
      };

      request.onerror = () => {
        console.error("IndexedDB Error:", request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error("Error saat mengambil atau menyimpan userData:", error);
    return Promise.reject(error);
  }
}

export async function getUserData() {
  const db = await openDB();
  const tx = db.transaction("userData", "readonly");
  const store = tx.objectStore("userData");

  return new Promise((resolve, reject) => {
    const request = store.getAll(); // Mengambil semua data dalam objectStore
    request.onsuccess = () => {
      if (request.result.length > 0) {
        resolve(request.result[0]); // Ambil data pertama (jika hanya ada satu pengguna)
      } else {
        resolve(null);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function removeUserData() {
  await clearIndexedDB();
}

export async function fetchAndStoreAllUsers(entitasId) {
  try {
    if (!entitasId) {
      throw new Error("entitasId tidak valid atau undefined.");
    }

    console.log(`🔍 Mengambil semua user dengan entitasId: ${entitasId}`);

    const usersRef = collection(db, "users", entitasId);
    const q = query(usersRef, where("entitasId", "==", entitasId));
    const querySnapshot = await getDocs(q);

    const allUsers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const indexedDB = await openDB();
    const transaction = indexedDB.transaction("allUserData", "readwrite");
    const store = transaction.objectStore("allUserData");

    allUsers.forEach(user => store.put(user));

    console.log(`✅ ${allUsers.length} user berhasil disimpan dalam IndexedDB (allUserData).`);

    return allUsers;
  } catch (error) {
    console.error("❌ Gagal mengambil atau menyimpan data user:", error);
    return [];
  }
}

export const getAllUserData = async () => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("StarlinkMoneyDB", 2);
        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction("allUserData", "readonly");
            const store = transaction.objectStore("allUserData");
            const getRequest = store.getAll();
            getRequest.onsuccess = () => resolve(getRequest.result);
            getRequest.onerror = () => reject("Gagal mengambil data user dari IndexedDB");
        };
        request.onerror = () => reject("Gagal membuka database IndexedDB");
    });
};

// Fungsi menambahkan satu user baru ke IndexedDB & Firebase Auth
export const addSingleUserData = async (userData) => {
    try {
        // Buat user di Firebase Authentication terlebih dahulu
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password);
        const firebaseUser = userCredential.user;

        // Data user tanpa password
        const newUser = {
            uid: firebaseUser.uid,
            id: userData.id || crypto.randomUUID(),
            entitasId: userData.entitasId,
            name: userData.name,
            email: userData.email,
            kontak: userData.kontak,
			role: userData.role || "admin", // Tambahkan role dengan default "admin"
            foto: userData.foto || "",
        };

        // Buka IndexedDB setelah Firebase selesai
        const db = await openDB();
        const tx = db.transaction('allUserData', 'readwrite');
        const store = tx.objectStore('allUserData');

        // Simpan ke IndexedDB
        await store.add(newUser);
        await tx.done;

        return newUser;
    } catch (error) {
        console.error("Gagal menambahkan pengguna:", error);
        throw error;
    }
};

// Fungsi untuk memperbarui data user di IndexedDB (setelah Firebase Auth sukses)
export const saveSingleUserData = async (userData) => {
    try {
        // 🔹 Pastikan ID valid
        if (!userData.id) {
            throw new Error("ID tidak ditemukan. Pastikan form memiliki data yang benar.");
        }

        // 🔹 Buka database IndexedDB
        const db = await openDB();
        const tx = db.transaction('allUserData', 'readwrite');
        const store = tx.objectStore('allUserData');

        // 🔹 Ambil data user dari IndexedDB berdasarkan ID
        const existingUser = await store.get(userData.id);
        if (!existingUser) {
            throw new Error("User tidak ditemukan di IndexedDB.");
        }

        // 🔹 Perbarui hanya field yang diberikan, tanpa menimpa data lainnya
        Object.assign(existingUser, userData);

        // 🔹 Hilangkan `undefined` dari objek sebelum disimpan
        const sanitizedData = JSON.parse(JSON.stringify(existingUser));

        // 🔹 Simpan kembali ke IndexedDB
        await store.put(sanitizedData);
        await tx.done;

        return sanitizedData;

    } catch (error) {
        console.error("Gagal menyimpan pengguna:", error);
        throw error;
    }
};

// Fungsi menghapus user dari IndexedDB & Firebase Authentication
export const deleteUserData = async (id) => {
    try {
        // 🔹 Pastikan ID valid sebelum melanjutkan
        if (!id) {
            throw new Error("Gagal menghapus: ID pengguna tidak valid.");
        }

        // 🔹 Buka IndexedDB
        const db = await openDB();
        const tx = db.transaction("allUserData", "readwrite");
        const store = tx.objectStore("allUserData");

        // 🔹 Cek apakah user ada sebelum menghapus
        const userToDelete = await store.get(id);
        if (!userToDelete) {
            throw new Error("User tidak ditemukan di IndexedDB.");
        }

        // 🔹 Hapus user berdasarkan ID
        await store.delete(id);
        await tx.done;

        console.log(`User dengan ID ${id} berhasil dihapus dari IndexedDB.`);
        return true;
    } catch (error) {
        console.error("Gagal menghapus pengguna:", error);
        throw error;
    }
};


// Fungsi untuk TRANSAKSI
export async function saveTransaksiData(transaksiData) {
  try {
    const db = await openDB();
    const tx = db.transaction("transaksi", "readwrite");
    const store = tx.objectStore("transaksi");

    await store.clear(); // Hapus transaksi lama sebelum menyimpan yang baru

    // ✅ Pastikan data yang disimpan dalam bentuk array
    const dataToStore = Array.isArray(transaksiData) ? transaksiData : [transaksiData];

    for (const transaksi of dataToStore) {
      await store.put(transaksi);
    }

    await tx.done;
    console.log("✅ Transaksi berhasil disimpan ke IndexedDB!");
  } catch (error) {
    console.error("❌ Error menyimpan transaksi ke IndexedDB:", error);
  }
}

export const addSingleTransaksi = async (transaksiBaru) => {
  try {
    const db = await openDB();
    const tx = db.transaction("transaksi", "readwrite");
    const store = tx.objectStore("transaksi");

    // ✅ Pastikan `entitasId` tersedia
    if (!transaksiBaru.entitasId) {
      console.error("❌ entitasId tidak valid saat menyimpan transaksi.");
      throw new Error("entitasId wajib ada.");
    }

    // ✅ Buat ID unik untuk transaksi
    const transaksiId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    // ✅ Buat objek transaksi yang akan disimpan
    const transaksiFinal = {
      id: transaksiId,
      ...transaksiBaru,
    };

    console.log("📥 Menyimpan transaksi ke IndexedDB:", transaksiFinal);

    // ✅ Simpan transaksi ke IndexedDB
    await store.add(transaksiFinal);
    await tx.done; // Tunggu hingga transaksi selesai

    console.log("✅ Transaksi berhasil disimpan dengan ID:", transaksiId);

    return transaksiFinal; // 🔥 Pastikan fungsi mengembalikan transaksi
  } catch (error) {
    console.error("❌ Gagal menambahkan transaksi ke IndexedDB:", error);
    throw error;
  }
};

export const getAllTransaksi = async () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB", 2);
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction("transaksi", "readonly");
      const store = tx.objectStore("transaksi");
      const getRequest = store.getAll();

      getRequest.onsuccess = () => resolve(getRequest.result);
      getRequest.onerror = () => reject(getRequest.error);
    };
    request.onerror = () => reject(request.error);
  });
};

export const hapusTransaksi = async (id) => {
  if (!id) throw new Error("ID transaksi tidak valid!");

  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB", 2);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("transaksi", "readwrite");
      const store = transaction.objectStore("transaksi");

      const deleteRequest = store.delete(id);

      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => reject(new Error("Gagal menghapus transaksi"));
    };

    request.onerror = () => reject(new Error("Gagal membuka IndexedDB"));
  });
};

export async function getTransaksiData() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB"); // Pastikan nama database benar

    request.onsuccess = function (event) {
      const db = event.target.result;
      const transaction = db.transaction("transaksi", "readonly"); // Pastikan object store "transaksi" benar
      const store = transaction.objectStore("transaksi");
      const getAllRequest = store.getAll();

      getAllRequest.onsuccess = function () {
        console.log("Data transaksi dari IndexedDB:", getAllRequest.result);
        resolve(getAllRequest.result);
      };

      getAllRequest.onerror = function () {
        reject("Gagal mengambil transaksi dari IndexedDB.");
      };
    };

    request.onerror = function () {
      reject("Gagal membuka database IndexedDB.");
    };
  });
}

// Fungsi untuk Page Dashboard
// Fungsi untuk mendapatkan jumlah transaksi bulan ini
export const getJumlahTransaksi = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("StarlinkMoneyDB", 2);

    request.onsuccess = (event) => {
      const db = event.target.result;
      const transaction = db.transaction("transaksi", "readonly");
      const objectStore = transaction.objectStore("transaksi");
      const getAllRequest = objectStore.getAll();

      getAllRequest.onsuccess = (e) => {
        const transaksiData = e.target.result;
        const hariIni = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

        const filtered = transaksiData.filter(item => item.tanggal === hariIni);
        resolve(filtered.length);
      };

      getAllRequest.onerror = () => reject("Gagal mengambil data transaksi.");
    };

    request.onerror = () => reject("Gagal membuka database.");
  });
};

// Fungsi untuk mendapatkan total omzet bulan ini
export const getTotalOmzet = async () => {
  try {
    const db = await openDB();
    const transaksiStore = db.transaction("transaksi", "readonly").objectStore("transaksi");
    const hariIni = new Date().toISOString().split("T")[0];
    let totalOmzet = 0;

    return new Promise((resolve, reject) => {
      const request = transaksiStore.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const { nominal = 0, profit = 0, tanggal } = cursor.value;
          if (tanggal === hariIni) {
            totalOmzet += Number(nominal) + Number(profit);
          }
          cursor.continue();
        } else {
          resolve(totalOmzet);
        }
      };

      request.onerror = (event) => reject(event.target.error);
    });
  } catch (error) {
    console.error("Gagal mengambil total omzet:", error);
    return 0;
  }
};

// Fungsi untuk mendapatkan total profit bulan ini
export const getTotalProfit = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction("transaksi", "readonly");
    const store = tx.objectStore("transaksi");
    const hariIni = new Date().toISOString().split("T")[0];
    let total = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          if (item.tanggal === hariIni) {
            const profit = parseInt(item.profit ?? item.tarif ?? 0) || 0;
            total += profit;
          }
          cursor.continue();
        } else {
          resolve(total);
        }
      };

      request.onerror = (event) => {
        console.error("Gagal membaca data transaksi:", event.target.error);
        reject(0);
      };
    });
  } catch (error) {
    console.error("Gagal menghitung total profit:", error);
    return 0;
  }
};

// Fungsi untuk mendapatkan total saldo (tidak dipengaruhi bulan)
export const getTotalSaldo = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction("saldo", "readonly");
    const store = tx.objectStore("saldo");

    let total = 0;

    return new Promise((resolve, reject) => {
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          const item = cursor.value;
          const nominal = parseInt(item.saldo) || 0;
          total += nominal;
          cursor.continue();
        } else {
          resolve(total);
        }
      };

      request.onerror = (event) => {
        console.error("Gagal membaca data saldo:", event.target.error);
        reject(0);
      };
    });
  } catch (error) {
    console.error("Gagal mengambil total saldo:", error);
    return 0;
  }
};

// Fungsi untuk mendapatkan transaksi harian bulan ini
export async function getTransaksiHarian() {
  const db = await openDB();
  const tx = db.transaction("transaksi", "readonly");
  const store = tx.objectStore("transaksi");

  const transaksi = [];
  const bulanIni = new Date().getMonth() + 2;
  const tahunIni = new Date().getFullYear();

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value;
        const tgl = new Date(item.tanggal);
        
        // Filter transaksi hanya di bulan ini
        if (tgl.getMonth() + 2 === bulanIni && tgl.getFullYear() === tahunIni) {
          transaksi.push(item);
        }

        cursor.continue();
      } else {
        const groupedData = {};

        transaksi.forEach((item) => {
          const tanggal = item.tanggal;
          if (!tanggal) return;

          if (!groupedData[tanggal]) {
            groupedData[tanggal] = {
              tanggal,
              transaksi: 0,
              profit: 0,
            };
          }

          // Gunakan profit jika ada, jika tidak gunakan tarif sebagai fallback
          const profit = parseInt(item.profit ?? item.tarif ?? 0);

          groupedData[tanggal].transaksi += 1;
          groupedData[tanggal].profit += isNaN(profit) ? 0 : profit;
        });

        // 🔽 Generate semua tanggal bulan ini
        const semuaTanggal = generateTanggalBulanIni();

        const finalData = semuaTanggal.map((tanggal) => {
          const [year, month, day] = tanggal.split("-");
          const label = `${day}/${month}`; // Format dd/mm

          return {
            tanggal: label,
            transaksi: groupedData[tanggal]?.transaksi || 0,
            profit: groupedData[tanggal]?.profit || 0,
          };
        });

        resolve(finalData);
      }
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

export async function getTransaksiHariIni() {
  const db = await openDB();
  const tx = db.transaction("transaksi", "readonly");
  const store = tx.objectStore("transaksi");

  const hariIni = new Date().toISOString().split("T")[0];
  const result = [];

  return new Promise((resolve, reject) => {
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const item = cursor.value;

        if (item.tanggal === hariIni) {
          // Tambahkan data profit jika belum ada
          const calculatedProfit =
            parseInt(item.hargaJual || 0) - parseInt(item.hargaModal || 0);
          result.push({
            ...item,
            profit: item.profit ?? (isNaN(calculatedProfit) ? 0 : calculatedProfit),
          });
        }

        cursor.continue();
      } else {
        resolve(result); // Kembalikan array transaksi hari ini
      }
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

// Fungsi untuk menghasilkan semua tanggal di bulan berjalan
function generateTanggalBulanIni() {
  const today = new Date();
  const tahun = today.getFullYear();
  const bulan = today.getMonth(); // 0-indexed

  const result = [];
  const jumlahHari = new Date(tahun, bulan + 2, 0).getDate();

  for (let i = 2; i <= jumlahHari; i++) {
    const tgl = new Date(tahun, bulan, i);
    const formatted = tgl.toISOString().split("T")[0]; // yyyy-mm-dd
    result.push(formatted);
  }

  return result;
}


// Fungsi untuk SUMBER DANA
export async function saveSumberDanaData(newData) {
  try {
    const db = await openDB();
    const tx = db.transaction("sumber_dana", "readwrite");
    const store = tx.objectStore("sumber_dana");

    // 🔹 Ambil data sumber dana yang sudah ada
    let existingData = await store.getAll();

    // ✅ Pastikan `existingData` adalah array
    if (!existingData || !Array.isArray(existingData)) {
      existingData = [];
    }

    // 🔹 Gabungkan data lama dan baru
    const mergedData = [...existingData, ...newData];

    // 🔥 Simpan setiap item satu per satu
    for (const item of mergedData) {
      await store.put(item); // ❌ Jangan pakai `entitasId` sebagai key tambahan!
    }

    console.log("✅ Sumber dana berhasil disimpan:", mergedData);
  } catch (error) {
    console.error("❌ Error saving sumber dana:", error);
    throw error;
  }
}

export async function getSumberDanaData() {
  try {
    const db = await openDB();
    if (!db) throw new Error("Gagal membuka IndexedDB.");

    const tx = db.transaction("sumber_dana", "readonly");
    const store = tx.objectStore("sumber_dana");

    // Tunggu hasil dari store.getAll() dengan Promise
    const sumberDanaData = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });

    console.log("📌 Debug: Data dari IndexedDB", sumberDanaData);

    if (!Array.isArray(sumberDanaData) || sumberDanaData.length === 0) {
      console.warn("⚠️ Tidak ada data sumber dana ditemukan.");
      return [];
    }

    // Filter hanya item yang valid
    const filteredData = sumberDanaData.filter(
      (item) => typeof item.sumberDana === "string" && item.sumberDana.trim() !== ""
    );

    // Sorting: "Uang Kas" harus selalu di urutan pertama
    filteredData.sort((a, b) =>
      a.sumberDana === "Uang Kas" ? -2 :
      b.sumberDana === "Uang Kas" ? 2 :
      a.sumberDana.localeCompare(b.sumberDana, "id")
    );

    return filteredData;
  } catch (error) {
    console.error("❌ Error fetching sumber dana:", error);
    return [];
  }
}

/**
 * Mengambil semua sumber dana dari IndexedDB.
 * @returns {Promise<Array>} Data sumber dana.
 */
export const getDataSumberDana = async () => {
  try {
    const db = await openDB();
    const tx = db.transaction("sumber_dana", "readonly");
    const store = tx.objectStore("sumber_dana");
    const sumberDanaList = await store.getAll();
    await tx.done;
    return sumberDanaList;
  } catch (error) {
    console.error("❌ Gagal mengambil semua sumber dana:", error);
    throw error;
  }
};

/**
 * Menambahkan satu sumber dana ke IndexedDB.
 * @param {Object} data - Data sumber dana.
 * @param {string} data.sumberDana - Nama sumber dana.
 * @param {string} data.kategori - Kategori sumber dana.
 * @param {number} data.saldo - Saldo awal.
 * @param {string} data.entitasId - ID entitas pemilik sumber dana.
 * @returns {Promise<string>} ID sumber dana yang ditambahkan.
 */
export const addSingleSumberDana = async (data) => {
  try {
    if (!data.sumberDana || !data.kategori || data.saldo === undefined || !data.entitasId) {
      throw new Error("❌ Data sumber dana tidak lengkap!");
    }
    
    const db = await openDB();
    const tx = db.transaction("sumber_dana", "readwrite");
    const store = tx.objectStore("sumber_dana");
    const newId = crypto.randomUUID();
    const newData = { id: newId, ...data, createdAt: Date.now() };
    await store.add(newData);
    await tx.done;
    return newId;
  } catch (error) {
    console.error("❌ Gagal menambahkan sumber dana:", error);
    throw error;
  }
};

/**
 * Memperbarui satu sumber dana di IndexedDB.
 * @param {string} id - ID sumber dana yang akan diperbarui.
 * @param {Object} data - Data yang akan diperbarui.
 * @returns {Promise<void>}
 */
export const updateSingleSumberDana = async (id, data) => {
  try {
    if (!id || !data || typeof data !== "object") {
      throw new Error("❌ Data tidak valid untuk diperbarui.");
    }
    
    const db = await openDB();
    const tx = db.transaction("sumber_dana", "readwrite");
    const store = tx.objectStore("sumber_dana");
    const existingData = await store.get(id);
    
    if (!existingData) throw new Error("❌ Sumber dana tidak ditemukan.");
    
    const updatedData = { ...existingData, ...data, updatedAt: Date.now() };
    await store.put(updatedData);
    await tx.done;
  } catch (error) {
    console.error("❌ Gagal memperbarui sumber dana:", error);
    throw error;
  }
};

/**
 * Menghapus satu sumber dana dari IndexedDB.
 * @param {string} id - ID sumber dana yang akan dihapus.
 * @returns {Promise<void>}
 */
export const deleteSingleSumberDana = async (id) => {
  try {
    if (!id) throw new Error("❌ ID sumber dana diperlukan!");
    
    const db = await openDB();
    const tx = db.transaction("sumber_dana", "readwrite");
    const store = tx.objectStore("sumber_dana");
    await store.delete(id);
    await tx.done;
  } catch (error) {
    console.error("❌ Gagal menghapus sumber dana:", error);
    throw error;
  }
};



// Fungsi untuk SALDO
export async function getSaldoData() {
  try {
    const db = await openDB();
    const tx = db.transaction("saldo", "readonly");
    const store = tx.objectStore("saldo");

    // 🔍 Ambil semua data saldo dari IndexedDB
    const saldoData = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return saldoData;
  } catch (error) {
    console.error("❌ Error fetching saldo:", error);
    return [];
  }
}

export async function getSaldoBySumberDana(key) {
  try {
    const db = await openDB();
    const tx = db.transaction("saldo", "readonly");
    const store = tx.objectStore("saldo");

    const allSaldo = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const result = allSaldo.filter(item =>
      key === "Uang Kas"
        ? item.sumberDana.toLowerCase() === "uang kas"
        : item.id === key || item.sumberDana === key
    );

    return result;
  } catch (error) {
    console.error("❌ Error fetching saldo by sumberDana:", error);
    return [];
  }
}

export async function saveSaldoBySumberDana(key, newSaldo) {
  try {
    const db = await openDB();
    const tx = db.transaction("saldo", "readwrite");
    const store = tx.objectStore("saldo");

    const allSaldo = await new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const saldoData = allSaldo.find(item =>
      key === "Uang Kas"
        ? item.sumberDana.toLowerCase() === "uang kas"
        : item.id === key || item.sumberDana === key
    );

    if (!saldoData) {
      throw new Error(`❌ Sumber Dana '${key}' tidak ditemukan dalam IndexedDB.`);
    }

    if (saldoData.saldo === newSaldo) {
      console.log(`⚠ Saldo untuk '${key}' tidak berubah, tidak perlu update timestamp.`);
      await tx.done;
      return;
    }

    const updatedSaldo = {
      ...saldoData,
      saldo: newSaldo,
      timestamp: Date.now()
    };
    await store.put(updatedSaldo);

    console.log("✅ Saldo berhasil diperbarui untuk:", key);
    await tx.done;
  } catch (error) {
    console.error("❌ Error saat menyimpan saldo:", error);
  }
}

// Fungsi untuk TOKEN
export async function saveTokenToIndexedDB(data) {
  const db = await openDB();
  const tx = db.transaction("token", "readwrite");
  const store = tx.objectStore("token");

  try {
    await store.put(data); // data harus punya .id = entitasId
    console.log("✅ Token berhasil disimpan di IndexedDB.");
  } catch (error) {
    console.error("❌ Gagal menyimpan token ke IndexedDB:", error);
  } finally {
    tx.oncomplete = () => db.close();
  }
}

export async function saveTokenRiwayatToIndexedDB(data) {
  const db = await openDB();
  const tx = db.transaction("token_riwayat", "readwrite");
  const store = tx.objectStore("token_riwayat");

  try {
    await store.put(data); // data harus punya .id
    console.log("✅ Token Riwayat disimpan ke IndexedDB");
  } catch (error) {
    console.error("❌ Gagal simpan token_riwayat ke IndexedDB:", error);
  } finally {
    tx.oncomplete = () => db.close();
  }
}

// Ambil token berdasarkan entitasId
export async function getTokenFromIndexedDB(entitasId) {
  const db = await openDB();
  const tx = db.transaction("token", "readonly");
  const store = tx.objectStore("token");

  return new Promise((resolve, reject) => {
    const request = store.get(entitasId);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => {
      console.error("❌ Gagal mengambil token dari IndexedDB:", request.error);
      reject(request.error);
    };

    tx.oncomplete = () => db.close();
  });
}

// Update token total
export async function updateTokenInIndexedDB(entitasId, updatedToken) {
  const db = await openDB();
  const tx = db.transaction("token", "readwrite");
  const store = tx.objectStore("token");

  try {
    store.put(updatedToken); // langsung update objek lengkap
    await tx.done;
    return updatedToken;
  } catch (error) {
    console.error("❌ Gagal update token di IndexedDB:", error);
    throw error;
  } finally {
    db.close();
  }
}

export async function fetchAndSaveTokenData(entitasId) {
  if (!entitasId) throw new Error("entitasId tidak tersedia");

  // Ambil dan simpan dokumen 'token'
  const tokenDocRef = doc(firestoreDB, "token", entitasId);
  const tokenSnapshot = await getDoc(tokenDocRef);
  if (tokenSnapshot.exists()) {
    const tokenData = tokenSnapshot.data();
    tokenData.id = entitasId;
    await saveTokenToIndexedDB(tokenData);
    console.log("✅ Token berhasil disimpan ke IndexedDB");
	} else {
	console.warn("⚠️ Dokumen 'token' tidak ditemukan di Firestore untuk entitasId:", entitasId);
}

  // Ambil dan simpan koleksi 'token_riwayat'
  const q = query(
    collection(firestoreDB, "token_riwayat"),
    where("entitasId", "==", entitasId)
  );
  const tokenRiwayatSnapshot = await getDocs(q);
  const tokenRiwayatData = tokenRiwayatSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  for (const item of tokenRiwayatData) {
    await saveTokenRiwayatToIndexedDB(item);
  }

  console.log("✅ Token Riwayat berhasil disimpan ke IndexedDB");
}

export async function deleteTokenFromIndexedDB(entitasId) {
  const db = await openDB();
  const tx = db.transaction("token", "readwrite");
  const store = tx.objectStore("token");

  try {
    await store.delete(entitasId);
    console.log("🗑️ Token berhasil dihapus dari IndexedDB.");
  } catch (error) {
    console.error("❌ Gagal menghapus token dari IndexedDB:", error);
  } finally {
    tx.oncomplete = () => db.close();
  }
}
