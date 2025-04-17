import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);

  const hostname = req.headers.get("host") || "";
  const isMainDomain = hostname === "starlinkmoney.vercel.app";
  const isMobileSubdomain = hostname === "m-starlinkmoney.vercel.app";

  const isAlreadyMobileRoute = url.pathname.startsWith("/m");

  // ✅ Redirect mobile user (domain utama) ke /m
  if (isMobile && isMainDomain && !isAlreadyMobileRoute) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.redirect(url);
  }

  // ✅ Redirect root dari mobile subdomain ke /m
  if (isMobileSubdomain && url.pathname === "/") {
    url.pathname = "/m";
    return NextResponse.redirect(url);
  }

  // ✅ Auth check (kecuali halaman bebas akses)
  const publicPaths = ["/", "/register", "/m", "/m/login", "/m/register"];
  if (!token && !publicPaths.includes(url.pathname)) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // ✅ Role-based routing
  if (url.pathname.startsWith("/admin") && role !== "admin" && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (url.pathname.startsWith("/superadmin") && role !== "superadmin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

// ✅ Jangan ganggu API, _next, asset, dsb
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
