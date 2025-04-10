"use client";

import React, { useEffect, useState } from "react";
import { getUserData, getSaldoData } from "../../../services/indexedDBService";
import { Banknote, CreditCard, Wallet } from "lucide-react";

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

  useEffect(() => {
    const fetchEntitasId = async () => {
      const user = await getUserData();
      if (user?.entitasId) {
        setEntitasId(user.entitasId);
      }
    };
    fetchEntitasId();
  }, []);

  useEffect(() => {
    if (entitasId) {
      const fetchData = async () => {
        const allSaldo = await getSaldoData();
        const filtered = allSaldo.filter(item => item.entitasId === entitasId);

        const sorted = filtered.sort((a, b) => {
          if (a.sumberDana?.toLowerCase() === "uang kas") return -1;
          if (b.sumberDana?.toLowerCase() === "uang kas") return 1;
          return 0;
        });

        setData(sorted);
      };
      fetchData();
    }
  }, [entitasId]);

  return (
    <div className="mobile-saldo-container">
      <h5 className="mb-3 fw-semibold">Saldo</h5>

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
