import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect to profile setup if authenticated but profile not complete
    if (
      token &&
      !token.profileComplete &&
      !pathname.startsWith("/profile/setup") &&
      !pathname.startsWith("/api/") &&
      !pathname.startsWith("/_next")
    ) {
      return NextResponse.redirect(new URL("/profile/setup", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        const publicPaths = [
          "/login",
          "/register",
          "/api/auth",
          "/api/users/check-username",
          "/_next",
          "/favicon.ico",
        ];

        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
