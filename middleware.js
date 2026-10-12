export function middleware(req) {
  const pathname = req.nextUrl.pathname;

  if (
    (pathname === "/api" || pathname.startsWith("/api/")) &&
    (req.headers.get("sec-fetch-dest") === "document" ||
      req.headers.get("sec-fetch-mode") === "navigate" ||
      req.headers.get("accept")?.includes("text/html"))
  ) {
    return Response.json(
      { success: false, error: "Not found" },
      { status: 404, headers: { "Cache-Control": "no-store" } }
    );
  }

  const session = req.cookies.get("admin_session");

  if (!session && pathname.startsWith("/admin")) {
    return Response.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
