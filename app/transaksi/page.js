"use client";

import { useState, useEffect, useContext, useRef } from "react";
import Swal from "sweetalert2";

// ====== Services ======
import { getTransaksiByEntitas, deleteTransaksiById } from "../../services/transaksiService";
import { getUserData } from "../../services/indexedDBService";
import { getDateFromCreatedAt } from "../../services/firestoreService";
import { getSaldoByEntitasId, updateSaldo } from "../../services/saldoService";

// ====== Context ======
import { SaldoContext } from "../../context/SaldoContext";
import { TransaksiContext } from "../../context/TransaksiContext";

// ====== Components / Modal ======
import SaldoCard from "../../components/saldoCard";
import MiniBankModal from "./mini-bank/MiniBankModal";
import TopUpPulsaModal from "./topup-pulsa/TopUpPulsaModal";
import TopUpTokenListrikModal from "./topup-listrik/TopUpTokenListrikModal";
import TopUpEWalletModal from "./topup-ewallet/TopUpEWalletModal";

const PageTransaksi = () => {
  // ====== Context State ======
  const { saldo } = useContext(SaldoContext);
  const { transaksi, loading } = useContext(TransaksiContext);

  // ====== Modal Visibility State ======
  const [showMiniBankModal, setShowMiniBankModal] = useState(false);
  const [showTopUpPulsaModal, setShowTopUpPulsaModal] = useState(false);
  const [showTopUpTokenModal, setShowTopUpTokenModal] = useState(false);
  const [showTopUpEwalletModal, setShowTopUpEWalletModal] = useState(false);

  // ====== Data State ======
  const [saldoList, setSaldoList] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [role, setRole] = useState(null);

  // ====== Dropdown State ======
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
  const fetchUserAndSaldo = async () => {
	const user = await getUserData();
	if (user?.entitasId) {
	  setEntitasId(user.entitasId);
	  const saldoData = await getSaldoByEntitasId(user.entitasId);
	  setSaldoList(saldoData);
	}
	if (user?.role) {
	  setRole(user.role); // Simpan role user
	}
  };
	fetchUserAndSaldo();
	}, []);

  const toggleDropdown = () => setDropdownOpen((v) => !v);

  const handleTypeSelect = (type) => {
    if (type === "Transfer/Setor Tunai/Tarik Tunai") {
      setShowMiniBankModal(true);
    } else if (type === "Top Up Pulsa Telepon") {
      setShowTopUpPulsaModal(true); // Tampilkan modal TopUpPulsa
    } else if (type === "Top Up Token Listrik") {
      setShowTopUpTokenModal(true); // Buka modal untuk top up token listrik
    } else if (type === "Top Up E-Wallet") {
      setShowTopUpEWalletModal(true); // Buka modal untuk top up e-wallet
    }
    setDropdownOpen(false);
  };

  const handleDelete = async (id) => {
  const transaksiToDelete = transaksi.find((t) => t.id === id);
  if (!transaksiToDelete) {
    Swal.fire("Transaksi tidak ditemukan", "", "error");
    return;
  }

  const nominal = transaksiToDelete.nominal || 0;
  const biaya = transaksiToDelete.tarif || transaksiToDelete.profit || 0;
  const totalKembali = nominal + biaya;

  const sumberTerkunci = saldoList.find(
    (item) => item.sumberDana === transaksiToDelete.namaSumberDana
  );

  if (!sumberTerkunci) {
    Swal.fire("Sumber dana dari transaksi tidak ditemukan", "", "error");
    return;
  }

  const pilihanKas = saldoList
    .filter((item) => item.sumberDana.toLowerCase().includes("kas")) // bisa diatur sesuai jenis "kas"
    .map((item) => `<option value="${item.id}">${item.sumberDana}</option>`)
    .join("");

  const { value: kasDipilihId } = await Swal.fire({
    title: "Pilih uang kas untuk pengembalian",
    html: `
      <div class="mutasi-form-wrapper">
        <div class="mutasi-form-group">
          <label><strong>Kas (yang akan dikurangi):</strong></label>
          <select id="kasSelect" class="mutasi-input">${pilihanKas}</select>
        </div>
        <div class="mutasi-form-group">
          <label><strong>Sumber Dana Terkunci (yang akan bertambah):</strong></label>
          <input disabled class="mutasi-input" value="${sumberTerkunci.sumberDana}" />
        </div>
        <div class="mutasi-form-group">
          <label><strong>Jumlah yang dikembalikan:</strong></label>
          <input disabled class="mutasi-input" value="Rp ${nominal.toLocaleString("id-ID")} (ke sumber dana)" />
        </div>
        <div class="mutasi-form-group">
          <label><strong>Biaya:</strong></label>
          <input disabled class="mutasi-input" value="Rp ${biaya.toLocaleString("id-ID")} (potong dari kas)" />
        </div>
      </div>
    `,
    preConfirm: () => {
      const select = document.getElementById("kasSelect");
      return select.value;
    },
    showCancelButton: true,
    confirmButtonText: "Kembalikan & Hapus",
    cancelButtonText: "Batal",
    customClass: {
      popup: "mutasi-popup",
      confirmButton: "btn btn-success",
      cancelButton: "btn btn-secondary",
    },
  });

  if (!kasDipilihId) return;

  const kasDipilih = saldoList.find((item) => item.id === kasDipilihId);
  if (!kasDipilih) {
    Swal.fire("Kas tidak ditemukan", "", "error");
    return;
  }

  if (kasDipilih.saldo < totalKembali) {
    Swal.fire("Saldo kas tidak mencukupi", "", "warning");
    return;
  }

  try {
    // Update saldo
    await updateSaldo(entitasId, kasDipilih.id, kasDipilih.saldo - totalKembali); // Kas berkurang
    await updateSaldo(entitasId, sumberTerkunci.id, sumberTerkunci.saldo + nominal); // Sumber bertambah

    // Hapus transaksi
    await deleteTransaksiById(id);

    Swal.fire("Transaksi dihapus & saldo dikembalikan!", "", "success");

    const updatedSaldo = await getSaldoByEntitasId(entitasId);
    setSaldoList(updatedSaldo);
  } catch (err) {
    console.error(err);
    Swal.fire("Gagal", "Terjadi kesalahan saat menghapus transaksi", "error");
  }
};

  const formatTanggal = (input) => {
    const date = getDateFromCreatedAt(input);
    if (!date || isNaN(date.getTime())) return "";

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0"); // 0-based
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatRupiah = (n) => (n != null ? `Rp ${n.toLocaleString("id-ID")}` : "Rp 0");

  const handleMutasiSaldo = async () => {
    if (!entitasId || saldoList.length < 2) return;

    const options = saldoList
      .map((item) => `<option value="${item.sumberDana}">${item.sumberDana}</option>`)
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "<strong>Mutasi Saldo</strong>",
      html: `
        <div class="mutasi-form-wrapper">
          <div class="mutasi-form-group">
            <label for="from">Dari Sumber Dana</label>
            <select id="from" class="mutasi-input">
              ${options}
            </select>
          </div>

          <div class="mutasi-form-group">
            <label for="to">Ke Sumber Dana</label>
            <select id="to" class="mutasi-input">
              ${options}
            </select>
          </div>

          <div class="mutasi-form-group">
            <label for="amount">Jumlah (Rp)</label>
            <input id="amount" class="mutasi-input" placeholder="Rp 0" inputmode="numeric" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Mutasi",
      cancelButtonText: "Batal",
      focusConfirm: false,
      customClass: {
        popup: "mutasi-popup",
        confirmButton: "btn btn-success",
        cancelButton: "btn btn-secondary",
      },
      didOpen: () => {
        const amountInput = document.getElementById("amount");
        amountInput.addEventListener("input", (e) => {
          let value = e.target.value.replace(/[^\d]/g, "");
          value = parseInt(value || "0", 10).toLocaleString("id-ID");
          e.target.value = `Rp ${value}`;
        });
      },
      preConfirm: () => {
        const from = document.getElementById("from").value;
        const to = document.getElementById("to").value;
        const amountStr = document.getElementById("amount").value.replace(/[^\d]/g, "");
        const amount = parseFloat(amountStr);
        return { from, to, amount };
      },
    });

    if (!formValues) return;

    const { from, to, amount } = formValues;
    if (!from || !to || isNaN(amount) || amount <= 0 || from === to) {
      Swal.fire("Input tidak valid", "", "error");
      return;
    }

    const sumberAwal = saldoList.find((item) => item.sumberDana === from);
    const sumberTujuan = saldoList.find((item) => item.sumberDana === to);

    if (!sumberAwal || !sumberTujuan) {
      Swal.fire("Sumber dana tidak ditemukan", "", "error");
      return;
    }

    if (sumberAwal.saldo < amount) {
      Swal.fire("Saldo tidak mencukupi", "", "warning");
      return;
    }

    await updateSaldo(entitasId, sumberAwal.id, sumberAwal.saldo - amount);
    await updateSaldo(entitasId, sumberTujuan.id, sumberTujuan.saldo + amount);

    Swal.fire("Mutasi berhasil!", "", "success");

    const updated = await getSaldoByEntitasId(entitasId);
    setSaldoList(updated);
  };

  // pagination
  const itemsPerPage = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.ceil(transaksi.length / itemsPerPage);
  const currentData = transaksi.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <>
      <div className="header-container">
        <h3 className="header mb-0">Daftar Transaksi</h3>
      </div>

      <div className="content content-expand">
        <div className="card shadow-sm p-3">
          <div className="card-body">
            {/* tombol + dropdown */}
            <div className="d-flex justify-content-end mb-3" style={{ position: "relative" }}>
			{/* Tombol Mutasi Saldo hanya jika user adalah superadmin */}
			{role === "superadmin" && (
			  <button className="mutasi-saldo-btn-container btn btn-outline-primary" onClick={handleMutasiSaldo}>
				  Mutasi Saldo
				</button>
			)}
              <button
                className="btn btn-primary"
                onClick={toggleDropdown}
                ref={buttonRef}
              >
                Tambah Transaksi
              </button>
              {isDropdownOpen && (
                <div className="transaksi-type-selector" ref={dropdownRef}>
                  <ul>
                    <li onClick={() => handleTypeSelect("Transfer/Setor Tunai/Tarik Tunai")}>
                      Transfer/Setor Tunai/Tarik Tunai
                    </li>
                    <li onClick={() => handleTypeSelect("Top Up Pulsa Telepon")}>
                      Top Up Pulsa Telepon
                    </li>
                    <li onClick={() => handleTypeSelect("Top Up Token Listrik")}>
                      Top Up Token Listrik
                    </li>
                    <li onClick={() => handleTypeSelect("Top Up E-Wallet")}>
                      Top Up E-Wallet
                    </li>
                  </ul>
                </div>
              )}
            </div>
			
		    <MiniBankModal
			  show={showMiniBankModal}
			  onClose={() => setShowMiniBankModal(false)}
			/>
			<TopUpPulsaModal
			  show={showTopUpPulsaModal}
			  onClose={() => setShowTopUpPulsaModal(false)}
			/>
			<TopUpTokenListrikModal
			  show={showTopUpTokenModal}
			  onClose={() => setShowTopUpTokenModal(false)}
			/>
			<TopUpEWalletModal
			  show={showTopUpEwalletModal}
			  onClose={() => setShowTopUpEWalletModal(false)}
			/>

            {/* isi transaksi */}
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
                            <th>Sumber Dana</th>
                            <th>Nominal</th>
                            <th>Profit</th>
                            <th>Status</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="9" className="text-center">
                                Memuat transaksi...
                              </td>
                            </tr>
                          ) : currentData.length ? (
                            currentData.map((item) => (
                              <tr key={item.id}>
                                <td>{formatTanggal(item.createdAt)}</td>
                                <td>{item.jenisTransaksi}</td>
                                <td>{item.namaSumberDana}</td>
                                <td>{formatRupiah(item.nominal)}</td>
                                <td>{formatRupiah(item.profit)}</td>
                                <td>{item.statusTransaksi}</td>
                                <td>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => handleDelete(item.id)}
                                  >
                                    🗑
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="9" className="text-center">
                                Tidak ada transaksi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                    <div className="d-flex justify-content-between mt-3">
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page === 1}
                      >
                        Back
                      </button>
                      <span>
                        Halaman {page} dari {totalPages}
                      </span>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page === totalPages}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageTransaksi;
