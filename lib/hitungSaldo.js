export async function hitungSaldo(saldoData, transaksiBaru) {
  try {
    console.log("📊 Memulai perhitungan saldo untuk transaksi baru...");

    if (!saldoData || saldoData.length === 0) {
      throw new Error("❌ Data saldo kosong atau tidak valid.");
    }

    const { jenisTransaksi, sumberDana, nominal, tarif = 0, profit = 0 } = transaksiBaru;
    console.log(`🔎 Memproses transaksi: ${jenisTransaksi} | Sumber Dana: ${sumberDana}`);

    const sumberSaldo = saldoData.find((item) =>
      item.id?.toLowerCase() === sumberDana.toLowerCase() ||
      item.sumberDana?.toLowerCase() === sumberDana.toLowerCase()
    );

    const uangKas = saldoData.find((item) =>
      item.sumberDana?.toLowerCase() === "uang kas"
    );

    if (!sumberSaldo) {
      throw new Error(`❌ Sumber Dana tidak ditemukan dalam koleksi saldo: ${sumberDana}`);
    }

    if (!uangKas) {
      throw new Error("❌ 'Uang Kas' tidak ditemukan dalam koleksi saldo.");
    }

    const saldoAwalSumber = sumberSaldo.saldo;
    const saldoAwalUangKas = uangKas.saldo;

    console.log(`💰 Saldo Awal - ${sumberSaldo.sumberDana || sumberSaldo.id}: ${saldoAwalSumber}`);
    console.log(`💰 Saldo Awal - Uang Kas: ${saldoAwalUangKas}`);

    // Proses perhitungan berdasarkan jenis transaksi
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

      case "Top Up Pulsa":
      case "Top Up Token Listrik":
      case "Top Up E-Wallet":
        sumberSaldo.saldo -= nominal;
        uangKas.saldo += nominal + profit;
        break;

      case "Pengeluaran":
        sumberSaldo.saldo -= nominal;
        break;

      default:
        throw new Error(`❌ Jenis transaksi tidak dikenali: ${jenisTransaksi}`);
    }

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
