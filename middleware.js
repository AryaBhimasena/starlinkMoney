import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const hostname = req.headers.get("host");

  // ✅ Redirect ke m-domain jika pakai device mobile
  if (
    hostname === "starlinkmoney.vercel.app" &&
    isMobile &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    const redirectUrl = new URL(req.url);
    redirectUrl.hostname = "m-starlinkmoney.vercel.app";
    return NextResponse.redirect(redirectUrl);
  }

  // ✅ Rewrite semua request di m-subdomain ke /m/*
  if (
    hostname === "m-starlinkmoney.vercel.app" &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // ✅ Auth check
  if (!token && !["/", "/register"].includes(url.pathname)) {
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

// ✅ Matcher: jangan ganggu API, _next, asset
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
