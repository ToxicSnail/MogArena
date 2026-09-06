import NextAuth from "next-auth";
import { baseAuthConfig } from "@/server/auth/base-config";

export default NextAuth(baseAuthConfig).auth;

export const config = {
  matcher: ["/battle/:path*", "/history/:path*", "/settings/:path*", "/admin/:path*"],
};
