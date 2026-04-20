import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware() {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow these public paths
        const publicPaths = [
          "/login",
          "/register",
          "/api/auth",
          "/api/users/managers", // needed on register page before auth
          "/_next",
          "/favicon.ico",
        ];

        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        // Everything else requires a valid JWT
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
