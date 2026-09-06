import { NextResponse } from "next/server";
import { voteSchema } from "@/features/battle/schemas";
import { getCurrentUserId } from "@/server/auth/session";
import { apiError } from "@/server/errors";
import { assertTrustedOrigin } from "@/server/security/origin";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { PrismaVoteStore } from "@/server/repositories/prisma-vote-store";
import { VoteService } from "@/server/services/vote-service";
import { getEnv } from "@/lib/env";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    await rateLimiter.consume(requestKey(request, "vote", userId), 120, 60_000);
    const { selectedUserId } = voteSchema.parse(await request.json());
    const { id } = await context.params;
    const target = getEnv().BATTLE_VOTE_TARGET;
    const result = await new VoteService(new PrismaVoteStore(), undefined, target).vote(id, userId, selectedUserId);
    return NextResponse.json({ result });
  } catch (error) {
    return apiError(error);
  }
}
