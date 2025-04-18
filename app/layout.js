"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { IndexedDBProvider } from "../context/IndexedDBContext";
import { SumberDanaProvider } from "../context/SumberDanaContext";
import { TransaksiProvider } from "../context/TransaksiContext";
import { SaldoProvider } from "../context/SaldoContext";
import { TokenProvider } from "../context/tokenContext";
import { UserProvider } from "../context/UserContext";
import { RegisterProvider } from "../context/RegisterContext";

import "../public/bootstrap/css/bootstrap.min.css";
import "../public/bootstrap/css/custom.css";

export default function RootLayout({ children }) {
  const pathname = usePathname();
  const router = useRouter();

  // route yang sudah di-/m
  const isMobileRoute = pathname.startsWith("/m");
  // halaman yang tidak perlu wrapper apa‑apa
  const isExcluded = pathname === "/" || pathname === "/register";

  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const isMobileDevice = window.innerWidth <= 768;

    // redirect ke /m jika di mobile dan belum di /m
    if (isMobileDevice && !isMobileRoute) {
      router.replace(`/m${pathname}`);
      return;
    }
    // redirect ke versi desktop kalau di /m tapi bukan mobile
    if (!isMobileDevice && isMobileRoute) {
      const newPath = pathname.replace(/^\/m/, "") || "/";
      router.replace(newPath);
      return;
    }

    // atur sidebar only untuk desktop
    setSidebarOpen(!isMobileDevice);
  }, [pathname, isMobileRoute, router]);

  // 1) Mobile route: langsung render children tanpa layout desktop
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

  // 2) Halaman excluded ("/" & "/register"): tanpa context & sidebar/navbar
  if (isExcluded) {
    return (
      <html lang="id">
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body>{children}</body>
      </html>
    );
  }

  // 3) Desktop layout utama
return (
  <html lang="id">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </head>
    <body className="root-layout">
      <RegisterProvider> {/* ✅ Tambahkan ini */}
        <UserProvider>
          <IndexedDBProvider>
            <TokenProvider>
              <SumberDanaProvider>
                <TransaksiProvider>
                  <SaldoProvider>
                    <Navbar className={sidebarOpen ? "sidebar-open" : "sidebar-closed"} />
                    <div className={`d-flex ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
                      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
                      <div className="content-container p-4">{children}</div>
                    </div>
                  </SaldoProvider>
                </TransaksiProvider>
              </SumberDanaProvider>
            </TokenProvider>
          </IndexedDBProvider>
        </UserProvider>
      </RegisterProvider> {/* ✅ Penutup */}
    </body>
  </html>
);
}
