export function validasiTransaksi(data) {
  let errors = [];

  // Validasi input yang wajib diisi
  if (!data.entitasId) errors.push("Entitas ID wajib diisi.");
  if (!data.jenisTransaksi) errors.push("Jenis transaksi wajib dipilih.");
  if (!data.sumberDana) errors.push("Sumber dana wajib diisi.");
  
  // Validasi tanggal
  if (!data.date) {
    errors.push("Tanggal transaksi harus diisi.");
  } else {
    const validDate = new Date(data.date);
    if (isNaN(validDate)) {
      errors.push("Tanggal transaksi tidak valid.");
    }
  }

  if (!data.noReff) errors.push("No Referensi wajib diisi.");

  // Pastikan angka tidak negatif
  const angkaFields = [
    "nominal", "tarif", "biayaAdmin", "hargaJual",
    "hargaModal", "profit", "pengeluaran"
  ];
  angkaFields.forEach(field => {
    if (data[field] !== undefined) {
      const angkaValue = Number(data[field]);
      if (isNaN(angkaValue)) {
        errors.push(`${field} harus berupa angka.`);
      } else if (angkaValue < 0) {
        errors.push(`${field} tidak boleh negatif.`);
      }
    }
  });

  // Validasi nomor rekening hanya jika transaksi terkait bank
  if (["Transfer", "Tarik Tunai", "Setor Tunai"].includes(data.jenisTransaksi) && !data.noRekening) {
    errors.push("No Rekening harus diisi untuk transaksi ini.");
  }

  // Validasi noMeterID & noTokenListrik hanya untuk transaksi listrik
  if (data.jenisTransaksi === "Top Up Token Listrik" && !data.noMeter) {
    errors.push("No Meter ID wajib diisi untuk transaksi listrik.");
  }

  return errors;
}
