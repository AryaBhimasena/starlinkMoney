"use client";

import { useEffect, useState, useContext } from "react";
import { 
	getAllDocsEntitasId,
	getDateFromCreatedAt 
	} from "../../services/firestoreService";
import { getUserData } from "../../services/indexedDBService";
import { exportToPDF, exportToExcel } from "../../services/eksportDataService";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css"; // opsional untuk style
import { gunakanToken } from "../../services/tokenService"; // ✅ Tambahkan ini
import { TokenContext } from "../../context/tokenContext"; // atau path sesuai struktur kamu

const PageLaporan = () => {
  const { setTotalToken } = useContext(TokenContext);
  const [transaksiList, setTransaksiList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [periode, setPeriode] = useState("bulanan");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());
  const [totalRow, setTotalRow] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [transaksiData, setTransaksiData] = useState([]);
  const [isDataProcessed, setIsDataProcessed] = useState(false);

const formatTanggalDDMMYYYY = (input) => {
  const date = getDateFromCreatedAt(input);
  if (!date || isNaN(date.getTime())) return "";

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-based
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
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

  const formatRupiah = (angka) => {
    return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
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
    setFilteredData((prevData) => [...prevData ]);
	setIsDataProcessed(true);
  } catch (error) {
    console.error("Gagal memproses laporan:", error);
  }
    // Tambahkan console.log untuk melihat filteredData
  console.log("Filtered Data:", filteredData);

};

  const bulanOptions = [...Array(12).keys()].map((i) => i + 1);
  const tahunOptions = [...Array(5).keys()].map(
    (i) => new Date().getFullYear() - i
  );

  return (
    <>
      <div className="header-container">
        <h3 className="header mb-0">Laporan Usaha</h3>
      </div>

      <div className="content content-expand">
        <div className="card shadow-sm p-3">
          <div className="card-body">
            {/* Filter + Export */}
            <div className="row mb-4 align-items-end">
              <div className="col-md-9">
                <div className="row">
                  <div className="col-md-3">
                    <label className="form-label">Periode</label>
                    <select
                      className="form-select"
                      value={periode}
                      onChange={(e) => setPeriode(e.target.value)}
                    >
                      <option value="harian">Harian</option>
                      <option value="mingguan">Mingguan</option>
                      <option value="bulanan">Bulanan</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <label className="form-label">Bulan</label>
                    <select
                      className="form-select"
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
                  <div className="col-md-3">
                    <label className="form-label">Tahun</label>
                    <select
                      className="form-select"
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
                  <div className="col-md-3 d-flex align-items-end">
                    <button
                      className="btn btn-primary w-100"
                      onClick={handleProsesLaporan}
                    >
                      Proses
                    </button>
                  </div>
                </div>
              </div>

              <div className="col-md-3 text-end">
                <button
                  className="btn btn-success me-2"
                  onClick={handleExportExcel}
                >
                  Export Excel
                </button>
                <button className="btn btn-danger" onClick={handleExportPDF}>
                  Export PDF
                </button>
              </div>
            </div>

            {/* Tabel */}
            <div className="table-responsive">
              <table className="table table-bordered table-striped">
                <thead className="table-dark text-center">
                  <tr>
                    <th>Tanggal</th>
                    <th>Transfer</th>
                    <th>Tarik Tunai</th>
                    <th>Setor Tunai</th>
                    <th>Top Up</th>
                    <th>Pengeluaran</th>
                    <th>Total Transaksi</th>
                    <th>Omzet</th>
                    <th>Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length > 0 ? (
                    <>
                      {filteredData.map((row, index) => (
                        <tr key={index} className="text-center">
                          <td>{row.tanggal}</td>
                          <td>{row.Transfer}</td>
                          <td>{row.TarikTunai}</td>
                          <td>{row.SetorTunai}</td>
                          <td>{row.TopUp}</td>
                          <td>{row.Pengeluaran}</td>
                          <td>{row.Total}</td>
                          <td>{formatRupiah(row.Omzet)}</td>
                          <td>{formatRupiah(row.Profit)}</td>
                        </tr>
                      ))}
                      <tr className="fw-bold text-center bg-light">
                        <td>Total</td>
                        <td>
                          {filteredData.reduce((sum, i) => sum + i.Transfer, 0)}
                        </td>
                        <td>
                          {filteredData.reduce(
                            (sum, i) => sum + i.TarikTunai,
                            0
                          )}
                        </td>
                        <td>
                          {filteredData.reduce(
                            (sum, i) => sum + i.SetorTunai,
                            0
                          )}
                        </td>
                        <td>
                          {filteredData.reduce((sum, i) => sum + i.TopUp, 0)}
                        </td>
                        <td>
                          {filteredData.reduce(
                            (sum, i) => sum + i.Pengeluaran,
                            0
                          )}
                        </td>
                        <td>
                          {filteredData.reduce((sum, i) => sum + i.Total, 0)}
                        </td>
                        <td>
                          {formatRupiah(
                            filteredData.reduce((sum, i) => sum + i.Omzet, 0)
                          )}
                        </td>
                        <td>
                          {formatRupiah(
                            filteredData.reduce((sum, i) => sum + i.Profit, 0)
                          )}
                        </td>
                      </tr>
                    </>
                  ) : (
                    <tr>
                      <td colSpan="9" className="text-center">
                        Belum ada data laporan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageLaporan;
