import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clients/:path*",
    "/projects/:path*",
    "/documents/:path*",
    "/team/:path*",
    "/timeline/:path*",
    "/settings/:path*",
    "/workflows/:path*",
    "/billing/:path*",
    "/client-requests/:path*",
  ],
};
