import { getSaldoBySumberDana } from "../services/indexedDBService";

export async function hitungSaldo(saldoData, transaksiBaru) {
    try {
        console.log("📊 Memulai perhitungan saldo untuk transaksi baru...");

        // Pastikan saldoData tidak null atau undefined
        if (!saldoData || saldoData.length === 0) {
            throw new Error("❌ Data saldo kosong atau tidak valid.");
        }

        const { jenisTransaksi, sumberDana, nominal, tarif = 0 } = transaksiBaru;
        console.log(`🔎 Memproses transaksi: ${jenisTransaksi} | Sumber Dana: ${sumberDana}`);

        // Ambil saldo dari sumber dana yang digunakan
        let sumberSaldo = saldoData.find((saldo) => saldo.sumberDana === sumberDana);

        // Cek apakah "Uang Kas" ada dalam saldoData
        let uangKas = saldoData.find((saldo) => saldo.sumberDana === "Uang Kas");

        // Jika "Uang Kas" tidak ditemukan di saldoData, ambil dari IndexedDB
        if (!uangKas) {
            console.warn("⚠️ 'Uang Kas' tidak ditemukan dalam saldoData, mengambil dari IndexedDB...");
            const saldoUangKas = await getSaldoBySumberDana("Uang Kas");
            if (saldoUangKas.length > 0) {
                uangKas = saldoUangKas[0]; // Gunakan saldo pertama
            } else {
                throw new Error("❌ 'Uang Kas' tidak ditemukan dalam IndexedDB.");
            }
        }

        if (!sumberSaldo) {
            throw new Error(`❌ Sumber Dana tidak ditemukan: ${sumberDana}`);
        }

        // Simpan saldo awal sebelum perubahan
        let saldoAwalSumber = sumberSaldo.saldo;
        let saldoAwalUangKas = uangKas.saldo;

        console.log(`💰 Saldo Awal - ${sumberDana}: ${saldoAwalSumber}`);
        console.log(`💰 Saldo Awal - Uang Kas: ${saldoAwalUangKas}`);


        // 🚀 Hitung saldo berdasarkan jenis transaksi
        switch (jenisTransaksi) {
            case "Transfer":
                sumberSaldo.saldo -= nominal;
                uangKas.saldo += nominal + tarif;
                break;
            case "Tarik Tunai":
				sumberSaldo.saldo += nominal;
				uangKas.saldo -= (nominal - tarif);
				break;
            case "Setor Tunai":
                uangKas.saldo += nominal + tarif;
                sumberSaldo.saldo -= nominal;
                break;
            case "Top Up E-Wallet":
            case "Top Up Pulsa":
            case "Top Up Token Listrik":
                sumberSaldo.saldo -= nominal;
                uangKas.saldo += nominal + tarif;
                break;
            case "Pengeluaran":
                sumberSaldo.saldo -= nominal;
                break;
        }

        // 🔄 Log hasil perubahan saldo
        console.log(`📊 Perubahan Saldo (${sumberSaldo.sumberDana}): ${saldoAwalSumber} ➝ ${sumberSaldo.saldo}`);
        console.log(`📊 Perubahan Saldo (Uang Kas): ${saldoAwalUangKas} ➝ ${uangKas.saldo}`);

        return {
            saldoBaruSumber: sumberSaldo.saldo,
            saldoBaruUangKas: uangKas.saldo,
        };
    } catch (error) {
        console.error("❌ Error di hitungSaldo():", error);
        return { error: error.message };
    }
}
