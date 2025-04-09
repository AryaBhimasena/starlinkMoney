"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { IndexedDBProvider } from "../context/IndexedDBContext";
import { SumberDanaProvider } from "../context/SumberDanaContext";
import { TransaksiProvider } from "../context/TransaksiContext";
import { SaldoProvider } from "../context/SaldoContext";
import { TokenProvider } from "../context/tokenContext";
import { UserProvider } from "../context/UserContext";

import "../public/bootstrap/css/bootstrap.min.css";
import "../public/bootstrap/css/custom.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/";
  const isMobileRoute = pathname.startsWith("/m");

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isMobile = window.innerWidth <= 768;
      if (isMobile) {
        setSidebarOpen(false);
      }
    }
  }, []);

  // 👉 Skip desktop layout if it's a mobile route
  if (isMobileRoute) {
    return (
      <html lang="id">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="root-layout">
        <UserProvider>
          <IndexedDBProvider>
            <TokenProvider>
              <SumberDanaProvider>
                <TransaksiProvider>
                  <SaldoProvider>
                    {!isAuthPage && (
                      <Navbar
                        className={
                          sidebarOpen ? "sidebar-open" : "sidebar-closed"
                        }
                      />
                    )}
                    <div
                      className={`d-flex ${
                        sidebarOpen ? "sidebar-open" : "sidebar-closed"
                      }`}
                    >
                      {!isAuthPage && (
                        <Sidebar
                          isOpen={sidebarOpen}
                          setIsOpen={setSidebarOpen}
                        />
                      )}
                      <div className="content-container p-4">{children}</div>
                    </div>
                  </SaldoProvider>
                </TransaksiProvider>
              </SumberDanaProvider>
            </TokenProvider>
          </IndexedDBProvider>
        </UserProvider>
      </body>
    </html>
  );
}
