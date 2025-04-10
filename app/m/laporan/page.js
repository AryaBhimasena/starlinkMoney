"use client";

import { useEffect, useState, useContext } from "react";
import { getAllData } from "../../../services/indexedDBService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css"; // opsional untuk style
import { gunakanToken } from "../../../services/tokenService"; // ✅ Tambahkan ini
import { TokenContext } from "../../../context/tokenContext"; // atau path sesuai struktur kamu

const PageLaporan = () => {
  const { setTotalToken } = useContext(TokenContext);
  const [transaksiList, setTransaksiList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [periode, setPeriode] = useState("bulanan");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [expandedDates, setExpandedDates] = useState([]); // State to track expanded dates
  const [totalRow, setTotalRow] = useState([]);

const formatTanggalDDMMYYYY = (tanggalStr) => {
  const [year, month, day] = tanggalStr.split("-");
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
};

const formatRupiah = (angka) => {
  return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
};

const handleToggleDetail = (date) => {
    setSelectedDate(selectedDate === date ? null : date); // Toggle the selected date
  };

const generateTotalRow = () => {
  const totalRow = {
    tanggal: "Total",
    Transfer: filteredData.reduce((sum, i) => sum + i.Transfer, 0),
    TarikTunai: filteredData.reduce((sum, i) => sum + i.TarikTunai, 0),
    SetorTunai: filteredData.reduce((sum, i) => sum + i.SetorTunai, 0),
    TopUp: filteredData.reduce((sum, i) => sum + i.TopUp, 0),
    Pengeluaran: filteredData.reduce((sum, i) => sum + i.Pengeluaran, 0),
    Total: filteredData.reduce((sum, i) => sum + i.Total, 0),
    Omzet: filteredData.reduce((sum, i) => sum + i.Omzet, 0),
    Profit: filteredData.reduce((sum, i) => sum + i.Profit, 0),
  };
  return totalRow;
};

const handleExportExcel = async () => {
  const result = await gunakanToken(3, "Export Laporan Excel"); // ✅ gunakanToken (misalnya butuh 2 token)
  if (!result.success) {
    Swal.fire({
      icon: "error",
      title: "Export Gagal",
      text: result.error || "Token tidak mencukupi.",
    });
    return;
  }

  const namaToko = "Toko Contoh";
  const tanggalAwal = new Date(tahun, bulan - 1, 1);
  const tanggalAkhir = new Date(tahun, bulan, 0);
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodeString = `${tanggalAwal.getDate()} - ${tanggalAkhir.getDate()} ${formatter.format(tanggalAkhir).split(" ")[1]} ${tahun}`;

  const headerRows = [
    ["Laporan Usaha"],
    [namaToko],
    [`Periode: ${periodeString}`],
    [],
  ];

  const tableHeader = [
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

  const tableBody = filteredData.map((row) => [
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

  const totalRow = [
    "Total",
    ...["Transfer", "TarikTunai", "SetorTunai", "TopUp", "Pengeluaran", "Total"].map((key) =>
      filteredData.reduce((sum, i) => sum + i[key], 0)
    ),
    formatRupiah(filteredData.reduce((sum, i) => sum + i["Omzet"], 0)),
    formatRupiah(filteredData.reduce((sum, i) => sum + i["Profit"], 0)),
  ];

  const finalData = [...headerRows, tableHeader, ...tableBody, totalRow];
  const ws = XLSX.utils.aoa_to_sheet(finalData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Laporan");
  XLSX.writeFile(wb, `Laporan_Usaha_${periode}_${bulan}_${tahun}.xlsx`);

  Swal.fire({
    icon: "success",
    title: "Export Excel berhasil!",
    showConfirmButton: false,
    timer: 1500,
  });
};

const handleExportPDF = async () => {
  const result = await gunakanToken(3, "Export Laporan PDF");
  if (!result.success) {
    Swal.fire({
      icon: "error",
      title: "Export Gagal",
      text: result.error || "Token tidak mencukupi.",
    });
    return;
  }

  const doc = new jsPDF("p", "mm", "a4");
  const namaToko = "Toko Contoh";
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

  const startY = 35;
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

  const tableRows = filteredData.map((row) => [
    formatTanggalDDMMYYYY(row.tanggal),
    row.Transfer,
    row.TarikTunai,
    row.SetorTunai,
    row.TopUp,
    row.Pengeluaran,
    row.Total,
    formatRupiah(row.Omzet),
    formatRupiah(row.Profit),
  ]);

  const totalRow = [
    "Total",
    ...["Transfer", "TarikTunai", "SetorTunai", "TopUp", "Pengeluaran", "Total"].map((key) =>
      filteredData.reduce((sum, i) => sum + i[key], 0)
    ),
    formatRupiah(filteredData.reduce((sum, i) => sum + i["Omzet"], 0)),
    formatRupiah(filteredData.reduce((sum, i) => sum + i["Profit"], 0)),
  ];
  tableRows.push(totalRow);

  doc.autoTable({
    head: [tableColumns],
    body: tableRows,
    startY: startY,
    styles: {
      fontSize: 9,
      halign: "center",
      valign: "middle",
    },
    columnStyles: {
      7: { halign: "right" }, // Omzet
      8: { halign: "right" }, // Profit
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

  doc.save(`Laporan_Usaha_${periode}_${bulan}_${tahun}.pdf`);

  Swal.fire({
    icon: "success",
    title: "Export PDF berhasil!",
    showConfirmButton: false,
    timer: 1500,
  });
};

  useEffect(() => {
    const fetchData = async () => {
      const data = await getAllData("transaksi");
      setTransaksiList(data);
    };
    fetchData();
  }, []);

const handleProsesLaporan = () => {
  const filtered = transaksiList.filter((item) => {
    const [year, month] = item.tanggal.split("-").map(Number);
    return month === bulan && year === tahun;
  });

  const rekap = {};

  filtered.forEach((trx) => {
    const tglStr = formatTanggalDDMMYYYY(trx.tanggal);
    if (!rekap[tglStr]) {
      rekap[tglStr] = {
        tanggal: tglStr,
        Transfer: 0,
        TarikTunai: 0,
        SetorTunai: 0,
        TopUp: 0,
        Pengeluaran: 0,
        Total: 0,
        Omzet: 0,
        Profit: 0,
      };
    }

    const jenis = trx.jenisTransaksi?.toLowerCase() || "";
    const nominal = trx.nominal || 0;
    const profit = Number(trx.profit) || Number(trx.tarif) || 0;

    switch (jenis) {
      case "transfer":
        rekap[tglStr].Transfer += 1;
        rekap[tglStr].Omzet += nominal;
        break;
      case "tarik tunai":
        rekap[tglStr].TarikTunai += 1;
        rekap[tglStr].Omzet += nominal;
        break;
      case "setor tunai":
        rekap[tglStr].SetorTunai += 1;
        rekap[tglStr].Omzet += nominal;
        break;
      case "top up e-wallet":
      case "top up pulsa":
      case "top up token listrik":
        rekap[tglStr].TopUp += 1;
        rekap[tglStr].Omzet += nominal;
        break;
      case "pengeluaran":
        rekap[tglStr].Pengeluaran += 1;
        break;
    }

    rekap[tglStr].Total =
      rekap[tglStr].Transfer +
      rekap[tglStr].TarikTunai +
      rekap[tglStr].SetorTunai +
      rekap[tglStr].TopUp +
      rekap[tglStr].Pengeluaran;

    rekap[tglStr].Profit += profit;
  });

  const hasil = Object.values(rekap).sort((a, b) => {
    const [da, ma, ya] = a.tanggal.split("-");
    const [db, mb, yb] = b.tanggal.split("-");
    return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
  });

  setFilteredData(hasil);

  // Total row calculation using generateTotalRow function
  const totalRow = generateTotalRow();

  // Update filteredData with the totalRow
  setFilteredData((prevData) => [...prevData, totalRow]);
};
  
  const bulanOptions = [...Array(12).keys()].map((i) => i + 1);
  const tahunOptions = [...Array(5).keys()].map((i) => new Date().getFullYear() - i);

const toggleDetails = (date) => {
    setExpandedDates((prevDates) =>
      prevDates.includes(date)
        ? prevDates.filter((d) => d !== date) // Remove from expanded if already there
        : [...prevDates, date] // Add to expanded if not present
    );
  };
 
 return (
    <>
<div className="mobile-header-container">
  <div className="mobile-header-title">Laporan Usaha</div>
  <div className="mobile-header-action"></div>
</div>


      <div className="mobile-laporan-container">
        <div className="mobile-card">
          <div className="mobile-card-body">
            {/* Filter */}
            <div className="mobile-filter">
              <div className="mobile-filter-item">
                <label className="mobile-label">Periode</label>
                <select
                  className="mobile-select"
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                >
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                </select>
              </div>
              <div className="mobile-filter-item">
                <label className="mobile-label">Bulan</label>
                <select
                  className="mobile-select"
                  value={bulan}
                  onChange={(e) => setBulan(parseInt(e.target.value))}
                >
                  {bulanOptions.map((b) => (
                    <option key={b} value={b}>
                      {b.toString().padStart(2, "0")}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mobile-filter-item">
                <label className="mobile-label">Tahun</label>
                <select
                  className="mobile-select"
                  value={tahun}
                  onChange={(e) => setTahun(parseInt(e.target.value))}
                >
                  {tahunOptions.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tombol Proses + Export */}
            <div className="mobile-buttons">
              <button className="btn btn-primary mobile-button" onClick={handleProsesLaporan}>
                Proses
              </button>
              <div className="mobile-export-buttons">
                <button className="btn btn-success" onClick={handleExportExcel}>
                  Export Excel
                </button>
                <button className="btn btn-danger" onClick={handleExportPDF}>
                  Export PDF
                </button>
              </div>
            </div>

            {/* Ringkasan */}
            <div className="trend-strip-container">
              <div className="trend-strip-title">Ringkasan Laporan</div>
              <div className="trend-strip-list">
                {filteredData.length > 0 ? (
                  <>
                    {filteredData.map((row, index) => (
						<div
						  key={index}
						  className="trend-strip-item flex-column align-items-start"
						  onClick={() => toggleDetails(row.tanggal)}
						  style={{ cursor: "pointer" }}
						>
						  <div className="trend-date mb-2">
							{row.tanggal}
						  </div>

                        {/* Show details only if this date is expanded */}
                        {expandedDates.includes(row.tanggal) && (
                          <>
                            <div className="trend-stat-row">
                              <span>Transfer</span>
                              <span>{row.Transfer}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Tarik Tunai</span>
                              <span>{row.TarikTunai}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Setor Tunai</span>
                              <span>{row.SetorTunai}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Top Up</span>
                              <span>{row.TopUp}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Pengeluaran</span>
                              <span className="text-danger">{row.Pengeluaran}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Total Transaksi</span>
                              <span>{row.Total}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Omzet</span>
                              <span className="text-success">{formatRupiah(row.Omzet)}</span>
                            </div>
                            <div className="trend-stat-row">
                              <span>Profit</span>
                              <span className="text-primary">{formatRupiah(row.Profit)}</span>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Total Keseluruhan */}
                    
                  </>
                ) : (
                  <div className="text-center text-muted">Belum ada data laporan.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageLaporan;
