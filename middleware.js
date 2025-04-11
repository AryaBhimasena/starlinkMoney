import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("token");
  const role = req.cookies.get("role");

  const userAgent = req.headers.get("user-agent") || "";
  const isMobile = /Android|iPhone|iPad|Mobile/i.test(userAgent);

  const isMainDomain = req.nextUrl.hostname === "starlinkmoney.vercel.app";
  const isAlreadyMobileRoute = url.pathname.startsWith("/m");
  const isOnMobileSubdomain = req.nextUrl.hostname === "m-starlinkmoney.vercel.app";

  // ✅ Redirect ke /m jika mobile di domain utama dan belum di /m
  if (isMobile && isMainDomain && !isAlreadyMobileRoute) {
    url.pathname = `/m${url.pathname}`;
    return NextResponse.redirect(url);
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

// ✅ Matcher: jangan ganggu API, _next, assets, dsb
export const config = {
  matcher: ["/((?!_next|api|login|public|bootstrap|favicon.ico).*)"],
};
