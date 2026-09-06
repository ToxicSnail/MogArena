import type { BattleMatcherRepository, BattleParticipant } from "@/server/services/battle-matcher";
import { db } from "@/server/db/client";

export class PrismaBattleMatcherRepository implements BattleMatcherRepository {
  async activeParticipants(excludeUserIds: string[], limit: number): Promise<BattleParticipant[]> {
    const where = { active: true, userId: { notIn: excludeUserIds } };
    const count = await db.photo.count({ where });
    const skip = Math.floor(Math.random() * Math.max(1, count - limit + 1));
    const photos = await db.photo.findMany({
      where,
      orderBy: { id: "asc" },
      skip,
      take: limit,
      select: {
        id: true,
        url: true,
        thumbnailUrl: true,
        user: { select: { id: true, username: true, displayName: true, rating: true } },
      },
    });
    return photos.map(({ user, ...photo }) => ({ ...user, photo }));
  }

  async recentPairKeys(limit: number) {
    const battles = await db.battle.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { normalizedPairKey: true },
    });
    return battles.map((battle) => battle.normalizedPairKey);
  }
}
