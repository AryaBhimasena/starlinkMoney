"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Send, Smartphone, Zap, Wallet } from "lucide-react";

export default function FabModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const toggleModal = () => setOpen(!open);

  const actions = [
    {
      icon: <Send size={20} />,
      label: "Transfer / Setor / Tarik",
      href: "/m/transaksi/mini-bank",
    },
    {
      icon: <Smartphone size={20} />,
      label: "Top-up Pulsa",
      href: "/m/transaksi/topup-pulsa",
    },
    {
      icon: <Zap size={20} />,
      label: "Top-up Listrik",
      href: "/m/transaksi/topup-listrik",
    },
    {
      icon: <Wallet size={20} />,
      label: "Top-up eWallet",
      href: "/m/transaksi/topup-ewallet",
    },
  ];

  const handleAction = (href) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <div className="fab-container">
        <button className="fab-button" onClick={toggleModal}>
          {open ? <X size={24} /> : <Plus size={24} />}
        </button>
        {open && (
          <div className="fab-modal shadow">
            {actions.map((action, idx) => (
              <div
                key={idx}
                className="fab-action"
                onClick={() => handleAction(action.href)}
              >
                <div className="fab-icon">{action.icon}</div>
                <div className="fab-label">{action.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
