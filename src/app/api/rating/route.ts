import { NextResponse } from "next/server";
import { paginationSchema } from "@/features/profile/schemas";
import { db } from "@/server/db/client";
import { apiError } from "@/server/errors";
import { toPublicIdentity } from "@/lib/public-identity";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const { page, limit } = paginationSchema.parse({ page: url.searchParams.get("page") ?? undefined, limit: url.searchParams.get("limit") ?? undefined });
    const [users, total] = await db.$transaction([
      db.user.findMany({
        orderBy: [{ rating: "desc" }, { id: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
        select: { id: true, username: true, avatarUrl: true, rating: true, wins: true, losses: true },
      }),
      db.user.count(),
    ]);
    const publicUsers = users.map((user) => ({ ...toPublicIdentity(user), avatarUrl: user.avatarUrl, rating: user.rating, wins: user.wins, losses: user.losses }));
    return NextResponse.json({ users: publicUsers, page, pages: Math.ceil(total / limit), total });
  } catch (error) {
    return apiError(error);
  }
}
