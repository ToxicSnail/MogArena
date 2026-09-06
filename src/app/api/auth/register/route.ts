import argon2 from "argon2";
import { NextResponse } from "next/server";
import { registerSchema } from "@/features/auth/schemas";
import { db } from "@/server/db/client";
import { apiError, AppError } from "@/server/errors";
import { logger } from "@/server/logging/logger";
import { assertTrustedOrigin } from "@/server/security/origin";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { generateUniqueUsername } from "@/server/services/random-username";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    await rateLimiter.consume(requestKey(request, "register"), 5, 60_000);
    const input = registerSchema.parse(await request.json());
    const existing = await db.user.findFirst({
      where: { email: input.email },
      select: { id: true },
    });
    if (existing) throw new AppError("ACCOUNT_EXISTS", "Email is already in use", 409);
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const username = await generateUniqueUsername(async (candidate) => Boolean(await db.user.findUnique({ where: { username: candidate }, select: { id: true } })));
    const user = await db.user.create({
      data: { username, email: input.email, passwordHash },
      select: { id: true, username: true, email: true },
    });
    logger.info({ userId: user.id }, "User registered");
    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
