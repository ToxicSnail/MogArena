import { NextResponse } from "next/server";
import { updateProfileSchema } from "@/features/profile/schemas";
import { getCurrentUserId } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { apiError } from "@/server/errors";
import { assertTrustedOrigin } from "@/server/security/origin";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    const user = await db.user.findUniqueOrThrow({
      where: { id: userId },
      select: { id: true, username: true, email: true, bio: true, avatarUrl: true, rating: true, wins: true, losses: true, createdAt: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    const input = updateProfileSchema.parse(await request.json());
    const user = await db.user.update({
      where: { id: userId },
      data: { bio: input.bio },
      select: { id: true, username: true, bio: true, avatarUrl: true },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return apiError(error);
  }
}
