import { db } from "@/server/db/client";
import { AppError } from "@/server/errors";

export class ProfileService {
  async getByUsername(username: string) {
    const user = await db.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true,
        username: true,
        bio: true,
        avatarUrl: true,
        rating: true,
        wins: true,
        losses: true,
        createdAt: true,
        _count: { select: { votes: true } },
        photos: { where: { active: true }, take: 1, select: { id: true, url: true, thumbnailUrl: true, source: true } },
      },
    });
    if (!user) throw new AppError("USER_NOT_FOUND", "User not found", 404);
    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      rating: user.rating,
      wins: user.wins,
      losses: user.losses,
      createdAt: user.createdAt,
      voteCount: user._count.votes,
      activePhoto: user.photos[0] ?? null,
    };
  }
}
