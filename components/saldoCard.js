import React, { useContext } from "react";
import { SaldoContext } from "../context/SaldoContext"; // 🔹 Gunakan saldo dari context

const SaldoCard = () => {
    const { saldo } = useContext(SaldoContext); // 🎯 Ambil saldo langsung dari context

    return (
        <div className="saldo-card">
            <table className="saldo-table">
                <thead>
                    <tr>
                        <th>Sumber Dana</th>
                        <th>Saldo</th>
                    </tr>
                </thead>
                <tbody>
                    {saldo.length > 0 ? (
                        saldo.map(({ id, sumberDana, saldo: nominalSaldo }) => {
                            return (
                                <tr key={id}>
                                    <td>{sumberDana}</td>
                                    <td>Rp {nominalSaldo.toLocaleString("id-ID")}</td>
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan="2" className="text-center">Saldo tidak tersedia</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default SaldoCard;
