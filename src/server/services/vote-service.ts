import type { BattleStatus, Prisma } from "@prisma/client";
import { AppError } from "@/server/errors";
import { RatingService } from "@/server/services/rating-service";

export interface VoteBattle {
  id: string;
  participantAId: string;
  participantBId: string;
  status: BattleStatus;
  votesA: number;
  votesB: number;
  participantA: { rating: number };
  participantB: { rating: number };
}

export interface VoteTransaction {
  getBattle(id: string): Promise<VoteBattle | null>;
  hasVote(battleId: string, voterId: string): Promise<boolean>;
  createVote(battleId: string, voterId: string, selectedUserId: string): Promise<void>;
  incrementVotes(battleId: string, side: "A" | "B"): Promise<VoteBattle>;
  closeBattleIfActive(battleId: string): Promise<boolean>;
  updateRatings(
    participantAId: string,
    participantBId: string,
    values: { ratingA: number; ratingB: number; winnerId?: string; loserId?: string },
  ): Promise<void>;
}

export interface VoteStore {
  transaction<T>(operation: (tx: VoteTransaction) => Promise<T>): Promise<T>;
}

export interface VoteResult {
  votesA: number;
  votesB: number;
  status: BattleStatus;
  selectedUserId: string;
}

export class VoteService {
  constructor(
    private readonly store: VoteStore,
    private readonly rating = new RatingService(),
    private readonly voteTarget = 20,
  ) {}

  vote(battleId: string, voterId: string, selectedUserId: string): Promise<VoteResult> {
    return this.store.transaction(async (tx) => {
      const battle = await tx.getBattle(battleId);
      if (!battle) throw new AppError("BATTLE_NOT_FOUND", "Battle not found", 404);
      if (battle.status !== "ACTIVE") throw new AppError("BATTLE_CLOSED", "Battle is closed", 409);
      if (![battle.participantAId, battle.participantBId].includes(selectedUserId)) {
        throw new AppError("INVALID_SELECTION", "Selected user is not a participant", 422);
      }
      if ([battle.participantAId, battle.participantBId].includes(voterId)) {
        throw new AppError("SELF_VOTE", "Participants cannot vote in their own battle", 403);
      }
      if (await tx.hasVote(battleId, voterId)) throw new AppError("DUPLICATE_VOTE", "You already voted", 409);

      await tx.createVote(battleId, voterId, selectedUserId);
      const updated = await tx.incrementVotes(battleId, selectedUserId === battle.participantAId ? "A" : "B");
      if (updated.votesA + updated.votesB < this.voteTarget) {
        return { votesA: updated.votesA, votesB: updated.votesB, status: "ACTIVE", selectedUserId };
      }

      const closed = await tx.closeBattleIfActive(battleId);
      if (closed && updated.votesA !== updated.votesB) {
        const outcome = updated.votesA > updated.votesB ? "A_WIN" : "B_WIN";
        const result = this.rating.calculate(battle.participantA.rating, battle.participantB.rating, outcome);
        const winnerId = outcome === "A_WIN" ? battle.participantAId : battle.participantBId;
        const loserId = outcome === "A_WIN" ? battle.participantBId : battle.participantAId;
        await tx.updateRatings(battle.participantAId, battle.participantBId, {
          ratingA: result.ratingA,
          ratingB: result.ratingB,
          winnerId,
          loserId,
        });
      }
      return { votesA: updated.votesA, votesB: updated.votesB, status: "CLOSED", selectedUserId };
    });
  }
}

export type PrismaTx = Prisma.TransactionClient;
