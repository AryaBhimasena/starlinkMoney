"use client";

import { useEffect, useState, useContext } from "react";
import { db, auth } from "../../../../lib/firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";
import { getSumberDana } from "../../../../services/sumberDanaService";
import { addSingleTransaksi, getTokenFromIndexedDB } from "../../../../services/indexedDBService";
import { gunakanToken } from "../../../../services/tokenService";
import { TransaksiContext } from "../../../../context/TransaksiContext";
import { SaldoContext } from "../../../../context/SaldoContext";
import { TokenContext } from "../../../../context/tokenContext";

export default function MiniBankPage() {
  const { updateSaldo } = useContext(SaldoContext);
  const { refreshTransaksi } = useContext(TransaksiContext);
  const { setTotalToken } = useContext(TokenContext);

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split("T")[0],
    noReff: "AUTO-GENERATED",
    jenisTransaksi: "Transfer",
    pelanggan: "Umum",
    penerima: "",
    noRekening: "",
    nominal: 0,
    tarif: 0,
    admin: 0,
    sumberDana: "", // ✅ Tambahan untuk dropdown
  });

  const [entitasId, setEntitasId] = useState("");
  const [loading, setLoading] = useState(false);
  const [sumberDanaList, setSumberDanaList] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchEntitas = async () => {
      const user = auth.currentUser;
      if (!user) return;
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const userData = snapshot.docs[0]?.data();
      if (userData?.entitasId) {
        setEntitasId(userData.entitasId);
        const sumberDana = await getSumberDana(userData.entitasId);
        setSumberDanaList(sumberDana);
      }
    };

    fetchEntitas();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: ["nominal", "tarif", "admin"].includes(name) ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!entitasId) return alert("Entitas ID belum ditemukan.");
    if (!form.nominal || !form.sumberDana) return alert("Nominal dan Sumber Dana wajib diisi.");

    setLoading(true);
    const transaksiData = {
      ...form,
      entitasId,
      createdAt: Date.now(),
      profit: Number(form.tarif),
    };

    try {
      const tokenInfo = await getTokenFromIndexedDB(entitasId);
      if ((tokenInfo?.totalToken ?? 0) < 1) {
        setLoading(false);
        return alert("Token tidak mencukupi.");
      }

      const transaksiBaru = await addSingleTransaksi(transaksiData);
      if (!transaksiBaru || !transaksiBaru.sumberDana) throw new Error("Data transaksi tidak valid.");

      setTimeout(async () => {
        const result = await gunakanToken(1, "Transaksi Baru");
        if (result.success) setTotalToken((prev) => prev - 1);
      }, 0);

      await updateSaldo(transaksiBaru.sumberDana, transaksiBaru);
      refreshTransaksi();
      setSuccess("Transaksi berhasil.");
      setForm((prev) => ({ ...prev, penerima: "", noRekening: "", nominal: 0, tarif: 0, admin: 0 }));
    } catch (err) {
      console.error(err);
      setError("Gagal memproses transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-mini-bank-container">
      <div className="mobile-mini-bank-header">
        <h5 className="mobile-mini-bank-title">Transaksi Mini Bank</h5>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mobile-mini-bank-card">
          {[
            { label: "Tanggal", type: "date", name: "tanggal" },
            { label: "No Reff", type: "text", name: "noReff", readOnly: true },
            {
              label: "Jenis Transaksi",
              type: "select",
              name: "jenisTransaksi",
              options: ["Transfer", "Tarik Tunai", "Setor Tunai"],
            },
            {
              label: "Sumber Dana",
              type: "select",
              name: "sumberDana",
              options: sumberDanaList.map((item) => item.nama),
            },
            { label: "Pelanggan", type: "text", name: "pelanggan", readOnly: true },
            { label: "Penerima", type: "text", name: "penerima" },
            { label: "No Rekening", type: "text", name: "noRekening" },
            { label: "Nominal", type: "number", name: "nominal" },
            { label: "Tarif", type: "number", name: "tarif" },
            { label: "Admin (Biaya Admin)", type: "number", name: "admin" },
          ].map((field, index) => (
            <div className="mobile-form-row" key={index}>
              <span className="mobile-form-label">{field.label}</span>
              {field.type === "select" ? (
                <select
                  className="mobile-form-input"
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                >
                  <option value="">-- Pilih --</option>
                  {field.options.map((opt) => (
                    <option value={opt} key={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="mobile-form-input"
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  readOnly={field.readOnly || false}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mobile-mini-bank-submit">
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Transaksi"}
          </button>
        </div>

        {error && <p className="text-danger mt-2">{error}</p>}
        {success && <p className="text-success mt-2">{success}</p>}
      </form>
    </div>
  );
}
