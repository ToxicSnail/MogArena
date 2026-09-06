import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/server/auth/session";
import { apiError } from "@/server/errors";
import { assertTrustedOrigin } from "@/server/security/origin";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { BattleService } from "@/server/services/battle-service";
import { recentBattleUsersSchema } from "@/features/battle/schemas";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    await rateLimiter.consume(requestKey(request, "skip", userId), 180, 60_000);
    const { id } = await context.params;
    const recentUserIds = recentBattleUsersSchema.parse(new URL(request.url).searchParams.getAll("exclude"));
    return NextResponse.json({ battle: await new BattleService().next(userId, id, recentUserIds) });
  } catch (error) {
    return apiError(error);
  }
}
