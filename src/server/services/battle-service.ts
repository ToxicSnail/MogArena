import { db } from "@/server/db/client";
import { pairKey } from "@/lib/utils";
import { BattleMatcher } from "@/server/services/battle-matcher";
import { PrismaBattleMatcherRepository } from "@/server/repositories/prisma-battle-matcher-repository";
import { AppError } from "@/server/errors";
import { toPublicIdentity } from "@/lib/public-identity";
import type { Prisma } from "@prisma/client";

const battleSelect = {
  id: true,
  status: true,
  votesA: true,
  votesB: true,
  participantA: { select: { id: true, username: true, rating: true } },
  participantB: { select: { id: true, username: true, rating: true } },
  photoA: { select: { id: true, url: true, thumbnailUrl: true } },
  photoB: { select: { id: true, url: true, thumbnailUrl: true } },
} as const;

interface BattleParticipantRecord { id: string; username: string; rating: number }

function presentBattle<T extends { participantA: BattleParticipantRecord; participantB: BattleParticipantRecord }>(battle: T) {
  const { participantA, participantB, ...rest } = battle;
  return {
    ...rest,
    participantA: { ...toPublicIdentity(participantA), rating: participantA.rating },
    participantB: { ...toPublicIdentity(participantB), rating: participantB.rating },
  };
}

export class BattleService {
  private readonly matcher = new BattleMatcher(new PrismaBattleMatcherRepository());

  async next(userId: string, skipBattleId?: string, excludeUserIds: string[] = []) {
    const previousVotes = await db.vote.findMany({
      where: { voterId: userId },
      select: { battle: { select: { participantAId: true, participantBId: true } } },
    });
    const seenUserIds = [...new Set([
      ...excludeUserIds,
      ...previousVotes.flatMap(({ battle }) => [battle.participantAId, battle.participantBId]),
    ])].filter((id) => id !== userId);
    const findReusable = async (avoidSeenUsers: boolean) => {
      const where: Prisma.BattleWhereInput = {
        status: "ACTIVE",
        id: skipBattleId ? { not: skipBattleId } : undefined,
        participantAId: avoidSeenUsers ? { notIn: [userId, ...seenUserIds] } : { not: userId },
        participantBId: avoidSeenUsers ? { notIn: [userId, ...seenUserIds] } : { not: userId },
        votes: { none: { voterId: userId } },
        photoA: { active: true },
        photoB: { active: true },
      };
      const count = await db.battle.count({ where });
      if (!count) return null;
      return db.battle.findFirst({
        where,
        orderBy: { id: "asc" },
        skip: Math.floor(Math.random() * count),
        select: battleSelect,
      });
    };
    const reusable = await findReusable(true);
    if (reusable) return presentBattle(reusable);

    let pair;
    try {
      pair = await this.matcher.match(userId, seenUserIds);
    } catch (error) {
      if (!(error instanceof AppError) || error.code !== "NO_MATCH") throw error;
      const fallback = await findReusable(false);
      if (fallback) return presentBattle(fallback);
      pair = await this.matcher.match(userId);
    }
    const battle = await db.battle.create({
      data: {
        participantAId: pair.participantA.id,
        participantBId: pair.participantB.id,
        photoAId: pair.participantA.photo.id,
        photoBId: pair.participantB.photo.id,
        normalizedPairKey: pairKey(pair.participantA.id, pair.participantB.id),
      },
      select: battleSelect,
    });
    return presentBattle(battle);
  }

  async get(id: string, userId: string) {
    const battle = await db.battle.findUnique({
      where: { id },
      select: { ...battleSelect, votes: { where: { voterId: userId }, select: { selectedUserId: true } } },
    });
    if (!battle) throw new AppError("BATTLE_NOT_FOUND", "Battle not found", 404);
    const { votes, ...record } = battle;
    return { ...presentBattle(record), userVote: votes[0]?.selectedUserId ?? null };
  }
}
