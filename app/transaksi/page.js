"use client";

import { useState, useEffect, useContext } from "react";
import { getAllTransaksi, hapusTransaksi } from "../../services/indexedDBService";
import { SaldoContext } from "../../context/SaldoContext"; // Import SaldoContext
import SaldoCard from "../../components/saldoCard";
import TambahTransaksi from "./TambahTransaksi";

const PageTransaksi = () => {
  const { saldo } = useContext(SaldoContext); // 🔹 Gunakan saldo dari SaldoContext
  const [transaksiList, setTransaksiList] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(dateString));
  };

  const formatRupiah = (angka) => {
    return angka ? `Rp ${angka.toLocaleString("id-ID")}` : "Rp 0";
  };

const refreshTransaksi = async () => {
  const data = await getAllTransaksi();

  const sortedData = [...data].sort((a, b) => {
    const dateA = a.tanggal ? new Date(a.tanggal) : new Date(0);
    const dateB = b.tanggal ? new Date(b.tanggal) : new Date(0);
    return dateB.getTime() - dateA.getTime(); // 🔹 terbaru ke paling lama
  });

  setTransaksiList(sortedData);
};



  useEffect(() => {
    refreshTransaksi();
  }, []);

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => {
    setIsModalOpen(false);
    setEditData(null);
  };

  const handleEdit = (transaksi) => {
    setEditData(transaksi);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus transaksi ini?")) {
      await hapusTransaksi(id);
      refreshTransaksi();
    }
  };

  const totalPages = Math.ceil(transaksiList.length / itemsPerPage);
  const currentData = transaksiList.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      {/* Header Full Width */}
      <div className="header-container">
        <h3 className="header mb-0">Daftar Transaksi</h3>
      </div>

      {/* Konten */}
      <div className="content content-expand">
        <div className="card shadow-sm p-3">
          <div className="card-body">
            <div className="d-flex justify-content-end mb-3">
			  <button className="btn btn-primary" onClick={openModal}>
				Tambah Transaksi
			  </button>
			</div>

            <div className="row">
              <div className="col-md-3 mb-3">
                <SaldoCard />
              </div>
              <div className="col-md-9">
                <div className="card shadow-sm">
                  <div className="card-header bg-dark text-white">Daftar Transaksi</div>
                  <div className="card-body">
                    <div className="table-responsive">
                      <table className="table table-bordered table-striped">
                        <thead className="thead-dark">
                          <tr>
                            <th>Tanggal</th>
                            <th>Jenis</th>
                            <th>Pelanggan</th>
                            <th>Penerima</th>
                            <th>Nominal</th>
                            <th>Tarif</th>
                            <th>Profit</th>
                            <th>Status</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentData.length > 0 ? (
                            currentData.map((item) => (
                              <tr key={item.id}>
                                <td>{formatTanggal(item.tanggal)}</td>
                                <td>{item.jenisTransaksi || "-"}</td>
                                <td>{item.pelanggan || "-"}</td>
                                <td>{item.penerima || "-"}</td>
                                <td>{formatRupiah(item.nominal)}</td>
                                <td>{formatRupiah(item.tarif)}</td>
                                <td>{formatRupiah(item.profit)}</td>
                                <td>{item.statusTransaksi || "-"}</td>
                                <td>
                                  <button className="btn btn-warning btn-sm me-1" onClick={() => handleEdit(item)}>✏</button>
                                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑</button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center">Tidak ada transaksi.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer d-flex justify-content-between">
                    <button className="btn btn-secondary" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
                      Back
                    </button>
                    <span>Halaman {currentPage} dari {totalPages}</span>
                    <button className="btn btn-secondary" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <TambahTransaksi closeModal={closeModal} refreshTransaksi={refreshTransaksi} editData={editData} />
      )}
    </>
  );
};

export default PageTransaksi;