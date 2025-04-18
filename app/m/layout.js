"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import NavbarMobile from "./components/NavbarMobile";
import BottomNav from "./components/BottomNav";
import FabModal from "./components/FabModal";

import "../../public/bootstrap/css/bootstrap.min.css";
import "../../public/bootstrap/css/mobile.css";

import { IndexedDBProvider } from "../../context/IndexedDBContext";
import { SumberDanaProvider } from "../../context/SumberDanaContext";
import { TransaksiProvider } from "../../context/TransaksiContext";
import { SaldoProvider } from "../../context/SaldoContext";
import { TokenProvider } from "../../context/tokenContext";
import { UserProvider } from "../../context/UserContext";

import { getUserData } from "../../services/indexedDBService";

export default function MobileLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // Halaman yang boleh diakses tanpa login
  const isPublicPage = pathname === "/m" || pathname === "/m/register";

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false);

  // Reset scroll ke top tiap navigasi
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Cek login; kalau belum dan bukan public page → redirect ke /m
  useEffect(() => {
    (async () => {
      const user = await getUserData();
      if (!user && !isPublicPage) {
        router.replace("/m");
        return;
      }
      setIsCheckingAuth(false);
    })();
  }, [pathname, router, isPublicPage]);

  // Sembunyikan UI sampai auth selesai dicek
  if (isCheckingAuth) return null;

  return (
    <UserProvider>
      <IndexedDBProvider>
        <TokenProvider>
          <SumberDanaProvider>
            <TransaksiProvider>
              <SaldoProvider>
                <div className="mobile-wrapper">
                  {/* Navbar hanya untuk halaman non‑public */}
                  {!isPublicPage && <NavbarMobile />}

                  <div className="mobile-scroll-container">
                    <div className="mobile-content p-3">{children}</div>
                  </div>

                  {/* Bottom nav & Fab hanya untuk halaman non‑public */}
                  {!isPublicPage && (
                    <>
                      <BottomNav onMenuToggle={setIsBottomMenuOpen} />
                      <FabModal hidden={isBottomMenuOpen} />
                    </>
                  )}
                </div>
              </SaldoProvider>
            </TransaksiProvider>
          </SumberDanaProvider>
        </TokenProvider>
      </IndexedDBProvider>
    </UserProvider>
  );
}
