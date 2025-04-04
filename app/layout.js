"use client";

import { useState } from "react";
import { usePathname } from "next/navigation"; // 🔥 Import usePathname
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { IndexedDBProvider } from "../context/IndexedDBContext";
import { SumberDanaProvider } from "../context/SumberDanaContext"; 
import { TransaksiProvider } from "../context/TransaksiContext"; 
import { SaldoProvider } from "../context/SaldoContext"; 

import "../public/bootstrap/css/bootstrap.min.css";
import "../public/bootstrap/css/custom.css";

export default function RootLayout({ children }) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname(); // 🔥 Dapatkan path halaman saat ini
  const isAuthPage = pathname === "/"; // 🔥 Cek apakah halaman login (sekarang berada di app/page.js)

  return (
    <html lang="id">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="root-layout">
        <IndexedDBProvider> 
          <SumberDanaProvider> 
            <TransaksiProvider>
              <SaldoProvider>
                {/* 🔥 Jika bukan halaman login, tampilkan Navbar & Sidebar */}
                {!isAuthPage && <Navbar toggleSidebar={() => setSidebarOpen(!isSidebarOpen)} />}
                <div className="d-flex">
                  {/* Tampilkan Sidebar hanya jika bukan halaman login */}
                  {!isAuthPage && <Sidebar isOpen={isSidebarOpen} />}
                  <div
                    className={`content p-4 ${
                      isSidebarOpen ? "content-shrink" : "content-expand"
                    }`}
                    style={{ marginLeft: !isAuthPage ? (isSidebarOpen ? "250px" : "80px") : "0px" }}
                  >
                    {children}
                  </div>
                </div>
              </SaldoProvider>
            </TransaksiProvider>
          </SumberDanaProvider>
        </IndexedDBProvider>
      </body>
    </html>
  );
}
