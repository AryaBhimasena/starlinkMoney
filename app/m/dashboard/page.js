"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "../../../lib/firebaseConfig"; // pastikan path benar
import {
  collection,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";
import { getUserData } from "../../../services/indexedDBService";
import ModalPromo from "../../../components/ModalPenawaran";

const formatRupiah = (angka) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

export default function HomePage() {
  const [jumlahTransaksi, setJumlahTransaksi] = useState(0);
  const [totalOmzet, setTotalOmzet] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSaldo, setTotalSaldo] = useState(0);
  const [dataHarian, setDataHarian] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [showPromo, setShowPromo] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;


  const containerRef = useRef();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const userData = await getUserData();
        const entitasId = userData?.entitasId;
		if (!entitasId) return;

        const transaksiRef = collection(db, "transaksi");
        const saldoRef = collection(db, "saldo");

        // Filter transaksi berdasarkan entitasId dan tanggal hari ini
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const qTransaksi = query(
          transaksiRef,
          where("entitasId", "==", entitasId),
          where("createdAt", ">=", Timestamp.fromDate(today))
        );

        const transaksiSnapshot = await getDocs(qTransaksi);
        const transaksiData = transaksiSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const jumlah = transaksiData.length;
        const omzet = transaksiData.reduce((acc, item) => acc + (item.nominal || 0), 0);
        const profit = transaksiData.reduce((acc, item) => {
          const calculated =
            (item.hargaJual || 0) - (item.hargaModal || 0);
          return acc + (item.profit ?? calculated);
        }, 0);

        // Sort terbaru dulu
        const sorted = [...transaksiData].sort(
          (a, b) => new Date(b.createdAt.toDate()) - new Date(a.createdAt.toDate())
        );

        const cleanData = sorted.map((item) => {
          const calculatedProfit =
            parseInt(item.hargaJual || 0) - parseInt(item.hargaModal || 0);
          return {
            ...item,
            profit: item.profit ?? (isNaN(calculatedProfit) ? 0 : calculatedProfit),
          };
        });

        // Ambil saldo total
        const qSaldo = query(saldoRef, where("entitasId", "==", entitasId));
        const saldoSnapshot = await getDocs(qSaldo);
        const saldoTotal = saldoSnapshot.docs.reduce((acc, doc) => {
          const data = doc.data();
          return acc + (data.saldo || 0);
        }, 0);

        setJumlahTransaksi(jumlah);
        setTotalOmzet(omzet);
        setTotalProfit(profit);
        setTotalSaldo(saldoTotal);
        setDataHarian(cleanData);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setSelectedIndex(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);
  
    useEffect(() => {
    const hasSeenPromo = sessionStorage.getItem("hasSeenPromoModal");
    if (!hasSeenPromo) {
      setShowPromo(true);
      sessionStorage.setItem("hasSeenPromoModal", "true");
    }
  }, []);


  return (
	
	
    <div className="mobile-scroll-area" ref={containerRef}>
	{showPromo && <ModalPromo onClose={() => setShowPromo(false)} />}
      <div className="mobile-dashboard-header mb-4">
        <h4 className="welcome-text">Transaksi Hari Ini</h4>
      </div>

      <div className="stat-list mb-4">
        {[
          {
            label: "Total Transaksi",
            value: `${jumlahTransaksi} Transaksi`,
            className: "text-primary",
          },
          {
            label: "Total Omzet",
            value: formatRupiah(totalOmzet),
            className: "text-success",
          },
          {
            label: "Total Profit",
            value: formatRupiah(totalProfit),
            className: "text-success",
          },
          {
            label: "Total Saldo",
            value: formatRupiah(totalSaldo),
            className: "text-danger",
          },
        ].map((item, i) => (
          <div className="stat-item" key={i}>
            <span className="stat-label">{item.label}</span>
            <span className={`stat-value ${item.className}`}>{item.value}</span>
          </div>
        ))}
      </div>

      <div className="trend-strip-container">
        <h6 className="trend-strip-title">Detail Transaksi</h6>
        <div className="trend-strip-list">
          {dataHarian
			  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
			  .map((item, i) => {
				const globalIndex = (currentPage - 1) * itemsPerPage + i;
				return (
				  <div key={globalIndex}>
					<div
					  className="trend-strip-item"
					  onClick={() =>
						setSelectedIndex(globalIndex === selectedIndex ? null : globalIndex)
					  }
					>
					  <span className="trend-date">{item.jenisTransaksi}</span>
					  <span className="trend-value text-success">
						{formatRupiah(item.profit)}
					  </span>
					</div>

					{selectedIndex === globalIndex && (
					  <div className="mobile-dashboard-detail-box">
						<div className="trend-stat-row">
						  <span>Pelanggan</span>
						  <span>{item.pelanggan || "-"}</span>
						</div>
						<div className="trend-stat-row">
						  <span>Penerima</span>
						  <span>{item.penerima || "-"}</span>
						</div>
						<div className="trend-stat-row">
						  <span>Nominal</span>
						  <span>{formatRupiah(item.nominal || 0)}</span>
						</div>
						<div className="trend-stat-row">
						  <span>Profit</span>
						  <span>{formatRupiah(item.profit || 0)}</span>
						</div>
						<div className="trend-stat-row">
						  <span>Sumber Dana</span>
						  <span>{item.namaSumberDana || "-"}</span>
						</div>
						<div className="trend-stat-row">
						  <span>Total Bayar</span>
						  <span>
							{formatRupiah((item.nominal || 0) + (item.profit || 0))}
						  </span>
						</div>
					  </div>
					)}
				  </div>
				);
			  })}

		</div>
		<div className="d-flex justify-content-between align-items-center mt-3 px-2">
		  <button
			className="btn btn-sm btn-outline-secondary"
			onClick={() => {
			  setCurrentPage((prev) => Math.max(prev - 1, 1));
			  setSelectedIndex(null);
			}}
			disabled={currentPage === 1}
		  >
			Prev
		  </button>
		  <span className="mx-2">
			Halaman {currentPage} dari {Math.ceil(dataHarian.length / itemsPerPage)}
		  </span>
		  <button
			className="btn btn-sm btn-outline-primary"
			onClick={() => {
			  const maxPage = Math.ceil(dataHarian.length / itemsPerPage);
			  setCurrentPage((prev) => Math.min(prev + 1, maxPage));
			  setSelectedIndex(null);
			}}
			disabled={currentPage === Math.ceil(dataHarian.length / itemsPerPage)}
		  >
			Next
		  </button>
		</div>
      </div>
    </div>
  );
}
