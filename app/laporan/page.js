"use client";

import { useEffect, useState, useContext } from "react";
import { getAllData } from "../../services/indexedDBService";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css"; // opsional untuk style
import { gunakanToken } from "../../services/tokenService"; // ✅ Tambahkan ini
import { TokenContext } from "../../context/tokenContext"; // atau path sesuai struktur kamu

const formatTanggalDDMMYYYY = (tanggalStr) => {
  const [year, month, day] = tanggalStr.split("-");
  return `${day.padStart(2, "0")}-${month.padStart(2, "0")}-${year}`;
};


const PageLaporan = () => {
  const { setTotalToken } = useContext(TokenContext);
  const [transaksiList, setTransaksiList] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [periode, setPeriode] = useState("bulanan");
  const [bulan, setBulan] = useState(new Date().getMonth() + 1);
  const [tahun, setTahun] = useState(new Date().getFullYear());

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


    const hasil = Object.values(rekap).sort(
      (a, b) => new Date(a.tanggal) - new Date(b.tanggal)
    );
    setFilteredData(hasil);
  };

  const bulanOptions = [...Array(12).keys()].map((i) => i + 1);
  const tahunOptions = [...Array(5).keys()].map(
    (i) => new Date().getFullYear() - i
  );

  const formatRupiah = (angka) => {
    return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
  };

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
