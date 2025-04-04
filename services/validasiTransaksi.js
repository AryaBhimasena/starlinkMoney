export function validasiTransaksi(data) {
  let errors = [];

  if (!data.entitasId) errors.push("Entitas ID wajib diisi.");
  if (!data.jenisTransaksi) errors.push("Jenis transaksi wajib dipilih.");
  if (!data.sumberDana) errors.push("Sumber dana wajib diisi.");
  if (!data.date) errors.push("Tanggal transaksi harus diisi.");
  if (!data.noReff) errors.push("No Referensi wajib diisi.");
  if (!data.keterangan) errors.push("Keterangan transaksi harus diisi.");

  // Pastikan angka tidak negatif
  const angkaFields = [
    "nominal", "tarif", "biayaAdmin", "hargaJual",
    "hargaModal", "profit", "pengeluaran"
  ];
  angkaFields.forEach(field => {
    if (data[field] !== undefined && Number(data[field]) < 0) {
      errors.push(`${field} tidak boleh negatif.`);
    }
  });

  // Validasi nomor rekening hanya jika transaksi terkait bank
  if (["Transfer", "Top Up E-Wallet"].includes(data.jenisTransaksi) && !data.noRekening) {
    errors.push("No Rekening harus diisi untuk transaksi ini.");
  }

  // Validasi noMeterID & noTokenListrik hanya untuk transaksi listrik
  if (data.jenisTransaksi === "Top Up Token Listrik" && !data.noMeterID) {
    errors.push("No Meter ID wajib diisi untuk transaksi listrik.");
  }
  if (data.jenisTransaksi === "Top Up Token Listrik" && !data.noTokenListrik) {
    errors.push("No Token Listrik wajib diisi.");
  }

  return errors;
}
