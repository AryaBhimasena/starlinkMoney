import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import { gunakanToken } from "./tokenService";

// Helper: Format angka ke dalam format Rupiah
const formatRupiah = (angka) => {
  return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
};

// Helper: Menghasilkan baris total dari data transaksi
const generateTotalRow = (filteredData) => {
  const dataValid = filteredData.filter((row) => row.tanggal !== "Total");

  return {
    tanggal: "Total",
    Transfer: dataValid.reduce((sum, i) => sum + (parseFloat(i.Transfer) || 0), 0),
    TarikTunai: dataValid.reduce((sum, i) => sum + (parseFloat(i.TarikTunai) || 0), 0),
    SetorTunai: dataValid.reduce((sum, i) => sum + (parseFloat(i.SetorTunai) || 0), 0),
    TopUp: dataValid.reduce((sum, i) => sum + (parseFloat(i.TopUp) || 0), 0),
    Pengeluaran: dataValid.reduce((sum, i) => sum + (parseFloat(i.Pengeluaran) || 0), 0),
    Total: dataValid.reduce((sum, i) => sum + (parseFloat(i.Total) || 0), 0),
    Omzet: dataValid.reduce((sum, i) => sum + (parseFloat(i.Omzet) || 0), 0),
    Profit: dataValid.reduce((sum, i) => sum + (parseFloat(i.Profit) || 0), 0),
  };
};

// Fungsi export ke PDF
export const exportToPDF = async ({
  data,
  bulan,
  tahun,
  entitasId,
  namaToko = "Toko",
  formatRupiah,
  generateTotalRow,
}) => {
  const result = await gunakanToken(entitasId, 5, "Export Laporan PDF");
  if (!result.success) {
    Swal.fire({
      icon: "error",
      title: "Export Gagal",
      text: result.error || "Token tidak mencukupi.",
    });
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const tanggalAwal = new Date(tahun, bulan - 1, 1);
  const tanggalAkhir = new Date(tahun, bulan, 0);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodeString = `${tanggalAwal.getDate()} - ${tanggalAkhir.getDate()} ${formatter.format(tanggalAkhir).split(" ")[1]} ${tahun}`;

  doc.setFontSize(14);
  doc.text("Laporan Usaha", 105, 15, null, null, "center");
  doc.setFontSize(11);
  doc.text(namaToko, 105, 22, null, null, "center");
  doc.text(`Periode: ${periodeString}`, 105, 28, null, null, "center");

  const tableColumns = [
    "Tanggal",
    "Transfer",
    "Tarik Tunai",
    "Setor Tunai",
    "Top Up",
    "Pengeluaran",
    "Total",
    "Omzet",
    "Profit",
  ];

const dataWithoutTotal = data.filter((row) => row.tanggal !== "Total");
const dataWithTotal = [...dataWithoutTotal, generateTotalRow(dataWithoutTotal)];


  const tableRows = dataWithTotal.map((row) => [
    row.tanggal,
    row.Transfer,
    row.TarikTunai,
    row.SetorTunai,
    row.TopUp,
    row.Pengeluaran,
    row.Total,
    formatRupiah(row.Omzet),
    formatRupiah(row.Profit),
  ]);

  doc.autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: 35,
    styles: {
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      7: { halign: "right" },
      8: { halign: "right" },
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: "bold",
    },
    footStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    didDrawPage: function (data) {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`Page ${data.pageNumber} of ${pageCount}`, 200, 290, {
        align: "right",
      });
    },
  });

  doc.save(`Laporan_Usaha_bulanan_${bulan}_${tahun}.pdf`);

  Swal.fire({
    icon: "success",
    title: "Export PDF berhasil!",
    showConfirmButton: false,
    timer: 1500,
  });
};

// Fungsi export ke Excel
export const exportToExcel = async ({
  data,
  bulan,
  tahun,
  entitasId,
  namaToko = "Toko",
  formatRupiah,
  generateTotalRow,
}) => {
  const result = await gunakanToken(entitasId, 5, "Export Laporan Excel");
  if (!result.success) {
    Swal.fire({
      icon: "error",
      title: "Export Gagal",
      text: result.error || "Token tidak mencukupi.",
    });
    return;
  }

  const tanggalAwal = new Date(tahun, bulan - 1, 1);
  const tanggalAkhir = new Date(tahun, bulan, 0);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodeString = `${tanggalAwal.getDate()} - ${tanggalAkhir.getDate()} ${formatter.format(tanggalAkhir).split(" ")[1]} ${tahun}`;

  // Menyiapkan data untuk diekspor
  const tableColumns = [
    "Tanggal",
    "Transfer",
    "Tarik Tunai",
    "Setor Tunai",
    "Top Up",
    "Pengeluaran",
    "Total",
    "Omzet",
    "Profit",
  ];

  const dataWithoutTotal = data.filter((row) => row.tanggal !== "Total");
  const dataWithTotal = [...dataWithoutTotal, generateTotalRow(dataWithoutTotal)];

  // Membuat rows dengan format rupiah untuk Omzet dan Profit
  const tableRows = dataWithTotal.map((row) => [
    row.tanggal,
    row.Transfer,
    row.TarikTunai,
    row.SetorTunai,
    row.TopUp,
    row.Pengeluaran,
    row.Total,
    formatRupiah(row.Omzet),
    formatRupiah(row.Profit),
  ]);

  // Menyiapkan worksheet
  const ws = XLSX.utils.aoa_to_sheet([tableColumns, ...tableRows]);

  // Menyiapkan workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Laporan Usaha ${bulan}_${tahun}`);

  // Menyimpan file Excel
  XLSX.writeFile(wb, `Laporan_Usaha_bulanan_${bulan}_${tahun}.xlsx`);

  Swal.fire({
    icon: "success",
    title: "Export Excel berhasil!",
    showConfirmButton: false,
    timer: 1500,
  });
};

