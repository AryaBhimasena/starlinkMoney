import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const hostname = req.headers.get("host");

  // ✅ Redirect dari domain utama ke subdomain mobile (m-dot) jika akses dari HP
  if (
    hostname === "starlinkmoney.vercel.app" &&
    isMobile &&
    !url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/m")
  ) {
    return NextResponse.redirect("https://m-starlinkmoney.vercel.app/m");
  }

  // ✅ Jika user sudah di subdomain mobile, arahkan semua path ke /m/*
  if (
    hostname === "m-starlinkmoney.vercel.app" &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.rewrite(url); // 👈 rewrite ke /m tanpa ubah URL di browser
  }

  // ✅ Auth: Jika belum login dan bukan halaman utama, redirect ke /
  if (!token && url.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Role protection
  if (url.pathname.startsWith("/admin") && role !== "admin" && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (url.pathname.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// ✅ Pastikan tidak block asset & API
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
