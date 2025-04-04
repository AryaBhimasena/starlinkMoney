import admin from "firebase-admin";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync("./firebase-adminsdk.json", "utf-8"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

/**
 * Menetapkan peran pengguna berdasarkan UID dan peran yang diberikan.
 * @param {string} uid - UID pengguna.
 * @param {string} role - Peran yang akan diberikan (superadmin/admin).
 */
async function setCustomClaims(uid, role) {
  console.log(`Setting custom claims for UID: ${uid}, Role: ${role}`); // Debugging

  if (!["superadmin", "admin"].includes(role)) {
    console.error("Invalid role. Only 'superadmin' or 'admin' are allowed.");
    return;
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { role });
    console.log(`Custom claims '${role}' telah ditetapkan untuk UID: ${uid}`);
  } catch (error) {
    console.error("Error setting custom claims:", error);
  }
}

// Contoh pemanggilan fungsi
setCustomClaims("5cnd3wvJRESeU0COpQf1Z1KMANe2", "superadmin").catch(console.error);
