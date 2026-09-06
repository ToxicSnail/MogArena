import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { AppError } from "@/server/errors";
import type { VoteStore, VoteTransaction } from "@/server/services/vote-service";

function adapter(tx: Prisma.TransactionClient): VoteTransaction {
  const battleInclude = { participantA: { select: { rating: true } }, participantB: { select: { rating: true } } } as const;
  return {
    getBattle: (id) => tx.battle.findUnique({ where: { id }, include: battleInclude }),
    async hasVote(battleId, voterId) {
      return Boolean(await tx.vote.findUnique({ where: { battleId_voterId: { battleId, voterId } }, select: { id: true } }));
    },
    async createVote(battleId, voterId, selectedUserId) {
      try {
        await tx.vote.create({ data: { battleId, voterId, selectedUserId } });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          throw new AppError("DUPLICATE_VOTE", "You already voted", 409);
        }
        throw error;
      }
    },
    incrementVotes: (battleId, side) =>
      tx.battle.update({
        where: { id: battleId },
        data: side === "A" ? { votesA: { increment: 1 } } : { votesB: { increment: 1 } },
        include: battleInclude,
      }),
    async closeBattleIfActive(battleId) {
      const result = await tx.battle.updateMany({ where: { id: battleId, status: "ACTIVE" }, data: { status: "CLOSED" } });
      return result.count === 1;
    },
    async updateRatings(participantAId, participantBId, values) {
      await tx.user.update({ where: { id: participantAId }, data: { rating: values.ratingA } });
      await tx.user.update({ where: { id: participantBId }, data: { rating: values.ratingB } });
      if (values.winnerId) await tx.user.update({ where: { id: values.winnerId }, data: { wins: { increment: 1 } } });
      if (values.loserId) await tx.user.update({ where: { id: values.loserId }, data: { losses: { increment: 1 } } });
    },
  };
}

export class PrismaVoteStore implements VoteStore {
  async transaction<T>(operation: (tx: VoteTransaction) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await db.$transaction((tx) => operation(adapter(tx)), { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034" && attempt < 2) continue;
        throw error;
      }
    }
    throw new AppError("VOTE_CONFLICT", "Please retry your vote", 409);
  }
}
