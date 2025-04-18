import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const { pathname } = url;

  // ambil token & role
  const token = req.cookies.get("token")?.value;
  const role  = req.cookies.get("role")?.value;

  // deteksi device via User‑Agent
  const ua       = req.headers.get("user-agent") || "";
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(ua);

  // deteksi host
  const host              = req.headers.get("host") || "";
  const isMainDomain      = host === "starlinkmoney.vercel.app";
  const isMobileSubdomain = host === "m-starlinkmoney.vercel.app";

  const isMobileRoute = pathname.startsWith("/m");
  const isPublicPath  = ["/", "/register", "/m", "/m/register"].includes(pathname);

  // ─── 1) Mobile user on main domain → redirect to /m/*
  if (isMobile && isMainDomain && !isMobileRoute) {
    url.pathname = `/m${pathname}`;
    return NextResponse.redirect(url);
  }

  // ─── 2) Desktop user on mobile route (either main domain + /m or mobile subdomain)
  if (!isMobile && isMobileRoute) {
    // strip `/m`
    const newPath = pathname.replace(/^\/m/, "") || "/";
    return NextResponse.redirect(new URL(newPath, req.url));
  }

  // ─── 3) Mobile subdomain root → /m
  if (isMobileSubdomain && pathname === "/") {
    url.pathname = "/m";
    return NextResponse.redirect(url);
  }

  // ─── 4) Auth redirect: sudah login tidak boleh ke landing desktop (“/”)
  if (pathname === "/" && token) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // ─── 5) Protect non‑public pages: must login
  if (!isPublicPath && !token) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ─── 6) Role‑based protection
  if (pathname.startsWith("/admin") && !["admin","superadmin"].includes(role)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  if (pathname.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
      Terapkan middleware untuk semua route, 
      kecuali _next, api, asset statis, dll.
    */
    "/((?!_next/|api/|favicon.ico|public/).*)",
  ],
};
