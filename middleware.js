import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const hostname = req.headers.get("host");

  // ✅ Jika akses dari HP ke domain utama, redirect ke subdomain mobile
  if (
    hostname === "starlinkmoney.vercel.app" &&
    isMobile &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    return NextResponse.redirect("https://m-starlinkmoney.vercel.app");
  }

  // ✅ Rewrite semua path di subdomain mobile ke /m/*
  if (
    hostname === "m-starlinkmoney.vercel.app" &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.rewrite(url); // tidak ubah URL di browser
  }

  // ✅ Auth check: redirect ke "/" jika belum login
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

// ✅ Jangan blokir asset, API, favicon, dll
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};