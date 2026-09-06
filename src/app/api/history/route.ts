import { NextResponse } from "next/server";
import { paginationSchema } from "@/features/profile/schemas";
import { getCurrentUserId } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { apiError } from "@/server/errors";
import { toPublicIdentity } from "@/lib/public-identity";

export async function GET(request: Request) {
  try {
    const userId = await getCurrentUserId();
    const url = new URL(request.url);
    const { page, limit } = paginationSchema.parse({ page: url.searchParams.get("page") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    const [votes, total] = await db.$transaction([
      db.vote.findMany({
        where: { voterId: userId },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          createdAt: true,
          selectedUser: { select: { id: true, username: true } },
          battle: {
            select: {
              id: true,
              votesA: true,
              votesB: true,
              participantA: { select: { id: true, username: true, avatarUrl: true } },
              participantB: { select: { id: true, username: true, avatarUrl: true } },
              photoA: { select: { thumbnailUrl: true } },
              photoB: { select: { thumbnailUrl: true } },
            },
          },
        },
      }),
      db.vote.count({ where: { voterId: userId } }),
    ]);
    const publicVotes = votes.map((vote) => ({
      id: vote.id,
      createdAt: vote.createdAt,
      selectedUser: toPublicIdentity(vote.selectedUser),
      battle: {
        id: vote.battle.id,
        votesA: vote.battle.votesA,
        votesB: vote.battle.votesB,
        participantA: { ...toPublicIdentity(vote.battle.participantA), avatarUrl: vote.battle.participantA.avatarUrl },
        participantB: { ...toPublicIdentity(vote.battle.participantB), avatarUrl: vote.battle.participantB.avatarUrl },
        photoA: vote.battle.photoA,
        photoB: vote.battle.photoB,
      },
    }));
    return NextResponse.json({ votes: publicVotes, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    return apiError(error);
  }
}
