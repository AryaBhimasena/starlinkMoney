export const saveToLocalStorage = (key, data) => {
    localStorage.setItem(key, JSON.stringify(data));
};

export const getFromLocalStorage = (key) => {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
};

// Hapus fungsi removeFromLocalStorage untuk menghindari penghapusan data
// export const removeFromLocalStorage = (key) => {
//    localStorage.removeItem(key);
// };

/**
 * Menambahkan transaksi baru ke localStorage.
 * Transaksi yang belum tersinkronisasi ke Firestore akan memiliki flag `isSynced: false`
 */
export const addTransactionToLocal = (transaction) => {
    const transactions = getFromLocalStorage("transactions") || [];
    transactions.push({ ...transaction, isSynced: false });
    saveToLocalStorage("transactions", transactions);
};

/**
 * Menandai transaksi tertentu sebagai tersinkronisasi dengan Firestore.
 */
export const markTransactionsAsSynced = (syncedIds) => {
    let transactions = getFromLocalStorage("transactions") || [];
    transactions = transactions.map((tx) => 
        syncedIds.includes(tx.id) ? { ...tx, isSynced: true } : tx
    );
    saveToLocalStorage("transactions", transactions);
};

/**
 * Mendapatkan daftar transaksi yang belum tersinkronisasi ke Firestore.
 */
export const getUnsyncedTransactions = () => {
    const transactions = getFromLocalStorage("transactions") || [];
    return transactions.filter((tx) => !tx.isSynced);
};

/**
 * Menyimpan data user aktif ke localStorage (pastikan data ini tidak terhapus selama tahap development).
 */
export const saveUserToLocalStorage = (user) => {
    saveToLocalStorage("user", user); // Menyimpan data user aktif
};

/**
 * Mengambil data user yang sedang aktif dari localStorage.
 */
export const getUserFromLocalStorage = () => {
    return getFromLocalStorage("user"); // Mengambil data user aktif
};
