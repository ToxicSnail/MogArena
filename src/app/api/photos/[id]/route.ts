import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { apiError, AppError } from "@/server/errors";
import { assertTrustedOrigin } from "@/server/security/origin";

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    const { id } = await context.params;
    const found = await db.photo.findFirst({ where: { id, userId }, select: { id: true } });
    if (!found) throw new AppError("PHOTO_NOT_FOUND", "Photo not found", 404);
    await db.$transaction([
      db.battle.updateMany({ where: { status: "ACTIVE", OR: [{ photoAId: id }, { photoBId: id }] }, data: { status: "CANCELLED" } }),
      db.photo.update({ where: { id }, data: { active: false } }),
    ]);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return apiError(error);
  }
}
