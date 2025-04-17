"use client";

import React, { useEffect, useState } from "react";
import { getUserData } from "../../../services/indexedDBService";
import { getSaldoByEntitasId, updateSaldo } from "../../../services/saldoService";
import { Banknote, CreditCard, Wallet } from "lucide-react";
import Swal from "sweetalert2";

const getIconForKategori = (kategori = "") => {
  switch (kategori.toLowerCase()) {
    case "bank":
      return <Banknote size={18} className="text-secondary me-2" />;
    case "e-wallet":
      return <CreditCard size={18} className="text-secondary me-2" />;
    default:
      return <Wallet size={18} className="text-secondary me-2" />;
  }
};

const MobileSaldo = () => {
  const [data, setData] = useState([]);
  const [entitasId, setEntitasId] = useState(null);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUserData();
      if (user?.entitasId) {
        setEntitasId(user.entitasId);
      }
      if (user?.role) {
        setRole(user.role);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (entitasId) {
      const fetchData = async () => {
        const saldoData = await getSaldoByEntitasId(entitasId);

        const sorted = saldoData.sort((a, b) => {
          if (a.sumberDana?.toLowerCase() === "uang kas") return -1;
          if (b.sumberDana?.toLowerCase() === "uang kas") return 1;
          return 0;
        });

        setData(sorted);
      };
      fetchData();
    }
  }, [entitasId]);

const handleMutasiSaldo = async () => {
  if (!entitasId || data.length < 2) return;

  // Generate dropdown options
  const options = data
    .map((item) => `<option value="${item.sumberDana}">${item.sumberDana}</option>`)
    .join("");

const { value: formValues } = await Swal.fire({
  title: "<strong>Mutasi Saldo</strong>",
  html: `
    <div class="mutasi-form-wrapper">
      <label class="mutasi-label">Dari Sumber Dana:</label>
      <select id="from" class="swal2-input mutasi-select">
        ${options}
      </select>

      <label class="mutasi-label">Ke Sumber Dana:</label>
      <select id="to" class="swal2-input mutasi-select">
        ${options}
      </select>

      <label class="mutasi-label">Jumlah (Rp):</label>
      <input id="amount" class="swal2-input mutasi-input" placeholder="Rp 0" inputmode="numeric" />
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

  const sumberAwal = data.find((item) => item.sumberDana === from);
  const sumberTujuan = data.find((item) => item.sumberDana === to);

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

  const updatedSaldo = await getSaldoByEntitasId(entitasId);
  setData(updatedSaldo);
};

  return (
    <div className="mobile-saldo-container">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="fw-semibold mb-0">Saldo</h5>
        {role === "superadmin" && (
			<button className="mutasi-saldo-btn" onClick={handleMutasiSaldo}>
			  Mutasi Saldo
			</button>
        )}
      </div>

      <div className="d-flex flex-column gap-3">
        {data.map((item, idx) => (
          <div
            key={idx}
            className="mobile-saldo-card d-flex justify-content-between align-items-center p-3 border rounded shadow-sm bg-white"
          >
            <div className="d-flex align-items-center">
              {getIconForKategori(item.kategori)}
              <div>
                <div className="fw-medium">{item.sumberDana}</div>
              </div>
            </div>
            <div className="text-end fw-bold text-dark">
              Rp {item.saldo?.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MobileSaldo;
