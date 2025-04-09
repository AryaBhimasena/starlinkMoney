import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const hostname = req.headers.get("host");

  // ✅ Redirect ke subdomain mobile jika user pakai HP dan akses domain utama
  if (
    hostname === "starlinkmoney.vercel.app" &&
    isMobile &&
    !url.pathname.startsWith("/api") &&
    !url.pathname.startsWith("/m")
  ) {
    return NextResponse.redirect("https://m-starlinkmoney.vercel.app");
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
