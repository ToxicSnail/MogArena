import { pairKey } from "@/lib/utils";
import { AppError } from "@/server/errors";

export interface BattleParticipant {
  id: string;
  username: string;
  displayName: string | null;
  rating: number;
  photo: { id: string; url: string; thumbnailUrl: string };
}

export interface BattlePair {
  participantA: BattleParticipant;
  participantB: BattleParticipant;
}

export interface BattleMatcherRepository {
  activeParticipants(excludeUserIds: string[], limit: number): Promise<BattleParticipant[]>;
  recentPairKeys(limit: number): Promise<string[]>;
}

export class BattleMatcher {
  constructor(
    private readonly repository: BattleMatcherRepository,
    private readonly random: () => number = Math.random,
  ) {}

  async match(currentUserId: string, excludeUserIds: string[] = []): Promise<BattlePair> {
    const [participants, recentKeys] = await Promise.all([
      this.repository.activeParticipants([...new Set([currentUserId, ...excludeUserIds])], 60),
      this.repository.recentPairKeys(30),
    ]);
    const unique = [...new Map(participants.map((item) => [item.id, item])).values()];
    if (unique.length < 2) throw new AppError("NO_MATCH", "Not enough active profiles for a battle", 404);

    const shuffled = [...unique];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const target = Math.floor(this.random() * (index + 1));
      [shuffled[index], shuffled[target]] = [shuffled[target], shuffled[index]];
    }
    const recent = new Set(recentKeys);
    for (let a = 0; a < shuffled.length; a += 1) {
      for (let b = a + 1; b < shuffled.length; b += 1) {
        if (!recent.has(pairKey(shuffled[a].id, shuffled[b].id))) {
          return { participantA: shuffled[a], participantB: shuffled[b] };
        }
      }
    }
    return { participantA: shuffled[0], participantB: shuffled[1] };
  }
}
