"use client";

import { useEffect, useState, useContext } from "react";
import { getUserData } from "../../../services/indexedDBService";
import { getAllDocsEntitasId, getDateFromCreatedAt } from "../../../services/firestoreService";
import { gunakanToken } from "../../../services/tokenService";
import { TokenContext } from "../../../context/tokenContext";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";

// ✅ Import layanan export eksternal
import { exportToPDF, exportToExcel } from "../../../services/eksportDataService";

const PageLaporan = () => {
  const { setTotalToken } = useContext(TokenContext);
  const [transaksiList, setTransaksiList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [periode, setPeriode] = useState("bulanan");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [expandedDates, setExpandedDates] = useState([]);
  const [totalRow, setTotalRow] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [transaksiData, setTransaksiData] = useState([]);
  const [isDataProcessed, setIsDataProcessed] = useState(false);

  // **Helper Functions**
const formatTanggalDDMMYYYY = (input) => {
  const date = getDateFromCreatedAt(input);
  if (!date || isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};


  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = await getUserData();
        const fetchedEntitasId = userData.entitasId;
        setEntitasId(fetchedEntitasId);
        const data = await getAllDocsEntitasId("transaksi", fetchedEntitasId);

        if (!Array.isArray(data)) {
          console.error("Gagal mengambil data transaksi:", data.error);
          return;
        }

        setTransaksiData(data);
      } catch (error) {
        console.error("Gagal memuat data:", error);
      }
    };

    fetchData();
  }, []);

  const formatRupiah = (angka) => {
    return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
  };

  const generateTotalRow = () => {
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

const handleExportExcel = async () => {
  if (!isDataProcessed) {
    Swal.fire({
      icon: "warning",
      title: "Belum Diproses",
      text: "Silakan klik tombol 'Proses' terlebih dahulu sebelum mengekspor data.",
    });
    return;
  }
  
  const result = await gunakanToken(entitasId, 5, "Export Laporan Excel");
  if (!result.success) {
    Swal.fire({
      icon: "error",
      title: "Export Gagal",
      text: result.error || "Token tidak mencukupi.",
    });
    return;
  }

  exportToExcel({
    data: filteredData,
    bulan,
    tahun,
    entitasId,
    namaToko: "Toko Contoh",
    formatRupiah,
    generateTotalRow,
  });
};

  const handleExportPDF = async () => {
	if (!isDataProcessed) {
    Swal.fire({
      icon: "warning",
      title: "Belum Diproses",
      text: "Silakan klik tombol 'Proses' terlebih dahulu sebelum mengekspor data.",
    });
    return;
  }
  
    const result = await gunakanToken(entitasId, 5, "Export Laporan PDF");
    if (!result.success) {
      Swal.fire({
        icon: "error",
        title: "Export Gagal",
        text: result.error || "Token tidak mencukupi.",
      });
      return;
    }

    exportToPDF({
      data: filteredData,
      bulan,
      tahun,
      periode,
	  entitasId,
      namaToko: "Toko Contoh",
      formatRupiah,
      generateTotalRow,
    });
  };

const handleProsesLaporan = async () => {
  try {
    // Filter transaksi berdasarkan bulan dan tahun
    const filtered = transaksiData.filter((item) => {
      const transactionDate = getDateFromCreatedAt(item.createdAt);
      if (!transactionDate) return false;

      const year = transactionDate.getUTCFullYear();
      const month = transactionDate.getUTCMonth() + 1;
      return month === bulan && year === tahun;
    });

    const rekap = {};

    // Proses transaksi yang sudah difilter untuk rekapitulasi
    filtered.forEach((trx) => {
      const transactionDate = getDateFromCreatedAt(trx.createdAt);
      if (!transactionDate) return;

      const tglStr = formatTanggalDDMMYYYY(transactionDate);

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

      // Menghitung Total dan Profit
      rekap[tglStr].Total =
        rekap[tglStr].Transfer +
        rekap[tglStr].TarikTunai +
        rekap[tglStr].SetorTunai +
        rekap[tglStr].TopUp +
        rekap[tglStr].Pengeluaran;

      rekap[tglStr].Profit += profit;
    });

    // Mengurutkan hasil berdasarkan tanggal
    const hasil = Object.values(rekap).sort((a, b) => {
      const [da, ma, ya] = a.tanggal.split("-");
      const [db, mb, yb] = b.tanggal.split("-");
      return new Date(`${ya}-${ma}-${da}`) - new Date(`${yb}-${mb}-${db}`);
    });

    // Menyimpan data yang sudah diproses ke state filteredData
    setFilteredData(hasil);
    setFilteredData((prevData) => [...prevData, generateTotalRow()]);
	setIsDataProcessed(true);
  } catch (error) {
    console.error("Gagal memproses laporan:", error);
  }
    // Tambahkan console.log untuk melihat filteredData
  console.log("Filtered Data:", filteredData);

};
  
  // **Dropdown Options**
  const bulanOptions = [...Array(12).keys()].map((i) => i + 1);
  const tahunOptions = [...Array(5).keys()].map((i) => new Date().getFullYear() - i);

  // **Date Expansion**
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
