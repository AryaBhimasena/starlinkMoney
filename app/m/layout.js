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
  const isHomePage = pathname === "/m";

  const [isBottomMenuOpen, setIsBottomMenuOpen] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    const checkLogin = async () => {
      const user = await getUserData();

      // ❌ Jika tidak login, redirect ke homepage
      if (!user) {
        router.replace("/m");
      }

      // ✅ Jika akses langsung ke /m, biarkan (jangan redirect ke halaman lain)
      if (pathname === "/m") {
        setIsCheckingAuth(false);
        return;
      }

      // ✅ Jika user login dan berada di halaman lain, lanjut render
      if (user && pathname !== "/m") {
        setIsCheckingAuth(false);
      }
    };

    checkLogin();
  }, [pathname, router]);

  if (isCheckingAuth) return null; // Hindari flash sebelum redirect

  return (
    <UserProvider>
      <IndexedDBProvider>
        <TokenProvider>
          <SumberDanaProvider>
            <TransaksiProvider>
              <SaldoProvider>
                <div className="mobile-wrapper">
                  {!isHomePage && <NavbarMobile />}

                  <div className="mobile-scroll-container">
                    <div className="mobile-content p-3">{children}</div>
                  </div>

                  {!isHomePage && (
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
