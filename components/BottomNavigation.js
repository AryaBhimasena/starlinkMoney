import Link from "next/link";

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav fixed-bottom bg-light border-top py-2 d-flex justify-content-around">
      <Link href="/m/dashboard">🏠</Link>
      <Link href="/m/transaksi">💸</Link>
      <Link href="/m/saldo">💰</Link>
      <Link href="/m/pengaturan">⚙️</Link>
    </nav>
  );
}
