import argon2 from "argon2";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginSchema } from "@/features/auth/schemas";
import { baseAuthConfig } from "@/server/auth/base-config";
import { db } from "@/server/db/client";
import { logger } from "@/server/logging/logger";
import { rateLimiter } from "@/server/security/rate-limiter";

export const { handlers, auth } = NextAuth({
  ...baseAuthConfig,
  providers: [
    CredentialsProvider({
      name: "Email and password",
      credentials: { email: {}, password: { type: "password" } },
      async authorize(credentials) {
        const input = loginSchema.safeParse(credentials);
        if (!input.success) return null;
        await rateLimiter.consume(`login:${input.data.email}`, 10, 60_000);
        const user = await db.user.findUnique({ where: { email: input.data.email } });
        if (!user?.passwordHash || user.isImported) return null;
        try {
          if (!(await argon2.verify(user.passwordHash, input.data.password))) return null;
        } catch (error) {
          logger.warn({ err: error, userId: user.id }, "Password verification failed");
          return null;
        }
        return { id: user.id, email: user.email, name: user.username, username: user.username };
      },
    }),
  ],
});
