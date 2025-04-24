const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();
const port = 3000;

// Inisialisasi Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Array untuk menyimpan beberapa token FCM
let DEVICE_TOKENS = [];

// Middleware untuk parsing JSON dan CORS
app.use(bodyParser.json());
app.use(cors());

// Endpoint untuk menerima token FCM dari aplikasi Android
app.post('/api/save-fcm-token', (req, res) => {
  const { token } = req.body;  // Ambil token dari request body

  if (token && !DEVICE_TOKENS.includes(token)) {
    DEVICE_TOKENS.push(token);  // Menyimpan token FCM jika belum ada dalam array
    return res.status(200).json({ message: 'Token FCM berhasil disimpan!' });
  }

  return res.status(400).json({ message: 'Token FCM tidak ditemukan atau sudah ada!' });
});

// Monitor koleksi "newRegistrar" di Firestore
db.collection('newRegistrar').onSnapshot(snapshot => {
  snapshot.docChanges().forEach(change => {
    if (change.type === 'added') {
      const data = change.doc.data();
      console.log('📥 Transaksi baru:', data);

      // Kirim notifikasi setiap kali ada transaksi baru
      sendNotification({
        title: 'Register Baru!',
        body: `Ada Pendaftaran Masuk`,
      });
    }
  });
});

// Fungsi untuk mengirim notifikasi ke semua perangkat yang terdaftar
function sendNotification({ title, body }) {
  if (DEVICE_TOKENS.length === 0) {
    console.log('❌ Tidak ada token FCM yang tersedia');
    return;
  }

  const messages = DEVICE_TOKENS.map(token => ({
    notification: { title, body },
    token,
  }));

  admin.messaging().sendAll(messages)
    .then(response => {
      console.log('✅ Notifikasi terkirim:', response);
    })
    .catch(error => {
      console.error('❌ Gagal kirim notifikasi:', error);
    });
}

// Mulai server
app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

// Menambahkan route untuk menangani permintaan ke root URL
app.get('/', (req, res) => {
  res.send('Server berjalan dengan baik!');
});