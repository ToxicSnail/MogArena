import { NextResponse } from "next/server";
import { nextBattleSchema, recentBattleUsersSchema } from "@/features/battle/schemas";
import { getCurrentUserId } from "@/server/auth/session";
import { apiError } from "@/server/errors";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { BattleService } from "@/server/services/battle-service";
import { assertTrustedOrigin } from "@/server/security/origin";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    await rateLimiter.consume(requestKey(request, "battle-next", userId), 180, 60_000);
    const url = new URL(request.url);
    const query = nextBattleSchema.parse({ skip: url.searchParams.get("skip") ?? undefined });
    const recentUserIds = recentBattleUsersSchema.parse(url.searchParams.getAll("exclude"));
    const battle = await new BattleService().next(userId, query.skip, recentUserIds);
    return NextResponse.json({ battle });
  } catch (error) {
    return apiError(error);
  }
}
