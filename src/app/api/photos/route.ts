import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/server/auth/session";
import { db } from "@/server/db/client";
import { apiError, AppError } from "@/server/errors";
import { normalizeImage, MAX_IMAGE_BYTES } from "@/server/services/image-service";
import { assertTrustedOrigin } from "@/server/security/origin";
import { rateLimiter, requestKey } from "@/server/security/rate-limiter";
import { getStorageProvider } from "@/server/storage";
import { uploadKindSchema } from "@/features/photo/schemas";

export async function POST(request: Request) {
  try {
    assertTrustedOrigin(request);
    const userId = await getCurrentUserId();
    await rateLimiter.consume(requestKey(request, "upload", userId), 10, 60 * 60_000);
    const contentLengthHeader = request.headers.get("content-length");
    const contentLength = Number(contentLengthHeader);
    if (!contentLengthHeader || !Number.isSafeInteger(contentLength) || contentLength <= 0) throw new AppError("LENGTH_REQUIRED", "A valid Content-Length is required", 411);
    if (contentLength > MAX_IMAGE_BYTES + 128 * 1024) throw new AppError("FILE_TOO_LARGE", "Image must be at most 10 MB", 413);
    const form = await request.formData();
    const file = form.get("file");
    const kind = uploadKindSchema.parse(form.get("kind"));
    if (!(file instanceof File)) throw new AppError("FILE_REQUIRED", "Choose an image", 422);
    if (file.size > MAX_IMAGE_BYTES) throw new AppError("FILE_TOO_LARGE", "Image must be at most 10 MB", 413);
    const normalized = await normalizeImage(Buffer.from(await file.arrayBuffer()));
    const storage = getStorageProvider();
    const [full, thumbnail] = await Promise.all([
      storage.put(normalized.full, { extension: "webp", namespace: "photos" }),
      storage.put(normalized.thumbnail, { extension: "webp", namespace: "thumbs" }),
    ]);

    let photo;
    try {
      photo = await db.$transaction(async (tx) => {
      if (kind === "battle") {
        const oldPhotos = await tx.photo.findMany({ where: { userId, active: true }, select: { id: true } });
        const oldIds = oldPhotos.map((item) => item.id);
        if (oldIds.length) {
          await tx.battle.updateMany({ where: { status: "ACTIVE", OR: [{ photoAId: { in: oldIds } }, { photoBId: { in: oldIds } }] }, data: { status: "CANCELLED" } });
          await tx.photo.updateMany({ where: { id: { in: oldIds } }, data: { active: false } });
        }
      }
      const created = await tx.photo.create({
        data: { userId, url: full.url, thumbnailUrl: thumbnail.url, source: "USER_UPLOAD", active: kind === "battle" },
        select: { id: true, url: true, thumbnailUrl: true, active: true },
      });
      if (kind === "avatar") await tx.user.update({ where: { id: userId }, data: { avatarUrl: thumbnail.url } });
      return created;
      });
    } catch (error) {
      await Promise.allSettled([storage.delete(full.key), storage.delete(thumbnail.key)]);
      throw error;
    }
    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
