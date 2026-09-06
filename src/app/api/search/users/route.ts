import { NextResponse } from "next/server";
import { searchSchema } from "@/features/profile/schemas";
import { db } from "@/server/db/client";
import { apiError } from "@/server/errors";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";

export async function GET(request: Request) {
  try {
    await rateLimiter.consume(requestKey(request, "search"), 60, 60_000);
    const url = new URL(request.url);
    const { q, limit } = searchSchema.parse({ q: url.searchParams.get("q"), limit: url.searchParams.get("limit") ?? undefined });
    const users = await db.user.findMany({
      where: { username: { contains: q, mode: "insensitive" } },
      orderBy: { rating: "desc" },
      take: limit,
      select: { username: true, avatarUrl: true, rating: true },
    });
    return NextResponse.json({ users });
  } catch (error) {
    return apiError(error);
  }
}
