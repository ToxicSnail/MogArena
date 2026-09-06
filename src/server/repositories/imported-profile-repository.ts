import type { ImportedProfile, ImportedProfileStatus } from "@prisma/client";
import { db } from "@/server/db/client";
import { AppError } from "@/server/errors";
import { generateUniqueUsername } from "@/server/services/random-username";

export interface ValidImportedPhoto {
  externalId: string;
  profileUrl: string;
  photoUrl: string;
  storedUrl: string;
  thumbnailUrl: string;
  photoHash: string;
  photoPerceptualHash: string;
}

export interface ImportedProfileRepository {
  find(externalId: string): Promise<ImportedProfile | null>;
  saveStatus(input: { externalId: string; profileUrl: string; photoUrl?: string; status: ImportedProfileStatus }): Promise<void>;
  saveValid(input: ValidImportedPhoto): Promise<boolean>;
}

export class PrismaImportedProfileRepository implements ImportedProfileRepository {
  find(externalId: string) { return db.importedProfile.findUnique({ where: { externalId } }); }

  async saveStatus(input: { externalId: string; profileUrl: string; photoUrl?: string; status: ImportedProfileStatus }) {
    return db.$transaction(async (tx) => {
      await tx.importedProfile.upsert({
        where: { externalId: input.externalId },
        create: { ...input, photoUrl: input.photoUrl ?? null, lastCheckedAt: new Date() },
        update: { profileUrl: input.profileUrl, photoUrl: input.photoUrl ?? null, photoHash: null, photoPerceptualHash: null, importedAt: null, status: input.status, lastCheckedAt: new Date() },
      });
      const oldPhotos = await tx.photo.findMany({ where: { source: "EXTERNAL_IMPORT", sourceExternalId: input.externalId, active: true }, select: { id: true } });
      const oldIds = oldPhotos.map((photo) => photo.id);
      if (oldIds.length) {
        await tx.battle.updateMany({ where: { status: "ACTIVE", OR: [{ photoAId: { in: oldIds } }, { photoBId: { in: oldIds } }] }, data: { status: "CANCELLED" } });
        await tx.photo.updateMany({ where: { id: { in: oldIds } }, data: { active: false } });
      }
    });
  }

  async saveValid(input: ValidImportedPhoto) {
    return db.$transaction(async (tx) => {
      const importedProfile = await tx.importedProfile.findUnique({ where: { externalId: input.externalId }, select: { user: { select: { id: true, isImported: true } } } });
      if (importedProfile?.user && !importedProfile.user.isImported) throw new AppError("IMPORTED_USER_CONFLICT", "Imported profile is linked to a registered user", 409);
      const user = importedProfile?.user ?? await tx.user.create({
        data: {
          username: await generateUniqueUsername(async (candidate) => Boolean(await tx.user.findUnique({ where: { username: candidate }, select: { id: true } }))),
          isImported: true,
        },
        select: { id: true, isImported: true },
      });
      const targetPhoto = await tx.photo.findUnique({ where: { source_sourceExternalId_contentHash: { source: "EXTERNAL_IMPORT", sourceExternalId: input.externalId, contentHash: input.photoHash } }, select: { id: true } });
      const oldPhotos = await tx.photo.findMany({ where: { userId: user.id, active: true, id: targetPhoto ? { not: targetPhoto.id } : undefined }, select: { id: true } });
      const oldIds = oldPhotos.map((photo) => photo.id);
      if (oldIds.length) {
        await tx.battle.updateMany({ where: { status: "ACTIVE", OR: [{ photoAId: { in: oldIds } }, { photoBId: { in: oldIds } }] }, data: { status: "CANCELLED" } });
        await tx.photo.updateMany({ where: { id: { in: oldIds } }, data: { active: false } });
      }
      await tx.photo.upsert({
        where: { source_sourceExternalId_contentHash: { source: "EXTERNAL_IMPORT", sourceExternalId: input.externalId, contentHash: input.photoHash } },
        create: { userId: user.id, url: input.storedUrl, thumbnailUrl: input.thumbnailUrl, source: "EXTERNAL_IMPORT", sourceExternalId: input.externalId, contentHash: input.photoHash, active: true },
        update: { active: true },
      });
      await tx.importedProfile.upsert({
        where: { externalId: input.externalId },
        create: { externalId: input.externalId, userId: user.id, profileUrl: input.profileUrl, photoUrl: input.photoUrl, photoHash: input.photoHash, photoPerceptualHash: input.photoPerceptualHash, status: "VALID_PHOTO", importedAt: new Date() },
        update: { userId: user.id, profileUrl: input.profileUrl, photoUrl: input.photoUrl, photoHash: input.photoHash, photoPerceptualHash: input.photoPerceptualHash, status: "VALID_PHOTO", importedAt: new Date(), lastCheckedAt: new Date() },
      });
      return !targetPhoto;
    });
  }
}
