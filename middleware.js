import { NextResponse } from "next/server";

export function middleware(req) {
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");
  const entitasId = req.cookies.get("entitasId");
  
  // Jika user belum login, arahkan ke halaman login
  if (!token && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/", req.url));
  }
  
  // Middleware untuk proteksi halaman berdasarkan role
  if (req.nextUrl.pathname.startsWith("/admin") && role !== "admin" && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (req.nextUrl.pathname.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// Pastikan middleware tidak menghalangi akses ke public dan CSS
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
