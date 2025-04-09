"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
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

export default function MobileLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/m";

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <UserProvider>
      <IndexedDBProvider>
        <TokenProvider>
          <SumberDanaProvider>
            <TransaksiProvider>
              <SaldoProvider>
                <div className="mobile-wrapper">
                  {!isAuthPage && <NavbarMobile />}

                  {/* Kontainer Scrollable */}
                  <div className="mobile-scroll-container">
                    <div className="mobile-content p-3">{children}</div>
                  </div>

                  {!isAuthPage && (
                    <>
                      <BottomNav />
                      <FabModal />
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
