import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl;
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /mobile|android|iphone|ipad|ipod/i.test(userAgent);
  const hostname = req.headers.get("host");

  // ✅ Cek apakah sudah pernah redirect (hindari infinite loop)
  const hasRedirected = req.cookies.get("mobile_redirected");

  // ✅ Redirect ke subdomain mobile sekali saja
  if (
    hostname?.includes("starlinkmoney") &&
    isMobile &&
    !hostname.startsWith("m-") &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api") &&
    !hasRedirected
  ) {
    const redirectUrl = new URL(req.url);
    redirectUrl.hostname = "m-starlinkmoney.vercel.app";

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.set("mobile_redirected", "true", {
      maxAge: 60 * 60 * 24, // berlaku 1 hari
    });
    return response;
  }

  // ✅ Rewrite subdomain mobile ke /m/*
  if (
    hostname?.startsWith("m-") &&
    !url.pathname.startsWith("/m") &&
    !url.pathname.startsWith("/api")
  ) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // ✅ Auth check (kecuali halaman login & register)
  if (!token && !["/", "/register"].includes(url.pathname)) {
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

// ✅ Jangan blokir asset, API, dll
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
