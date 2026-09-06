CREATE TYPE "PhotoSource" AS ENUM ('USER_UPLOAD', 'EXTERNAL_IMPORT', 'SEED');
CREATE TYPE "BattleStatus" AS ENUM ('ACTIVE', 'CLOSED', 'CANCELLED');
CREATE TYPE "ImportedProfileStatus" AS ENUM ('VALID_PHOTO', 'NO_PHOTO', 'PLACEHOLDER', 'NOT_FOUND', 'INVALID_RESPONSE', 'ERROR');

CREATE TABLE "User" (
  "id" TEXT NOT NULL, "username" VARCHAR(30) NOT NULL, "email" VARCHAR(320), "passwordHash" TEXT,
  "displayName" VARCHAR(80), "bio" VARCHAR(500), "avatarUrl" TEXT, "rating" INTEGER NOT NULL DEFAULT 1000,
  "wins" INTEGER NOT NULL DEFAULT 0, "losses" INTEGER NOT NULL DEFAULT 0, "isImported" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Photo" (
  "id" TEXT NOT NULL, "userId" TEXT NOT NULL, "url" TEXT NOT NULL, "thumbnailUrl" TEXT NOT NULL,
  "source" "PhotoSource" NOT NULL, "sourceExternalId" TEXT, "contentHash" TEXT, "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Photo_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Battle" (
  "id" TEXT NOT NULL, "participantAId" TEXT NOT NULL, "participantBId" TEXT NOT NULL, "photoAId" TEXT NOT NULL,
  "photoBId" TEXT NOT NULL, "normalizedPairKey" TEXT NOT NULL, "status" "BattleStatus" NOT NULL DEFAULT 'ACTIVE',
  "votesA" INTEGER NOT NULL DEFAULT 0, "votesB" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Battle_pkey" PRIMARY KEY ("id"), CONSTRAINT "Battle_distinct_participants" CHECK ("participantAId" <> "participantBId")
);
CREATE TABLE "Vote" (
  "id" TEXT NOT NULL, "battleId" TEXT NOT NULL, "voterId" TEXT NOT NULL, "selectedUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "ImportedProfile" (
  "id" TEXT NOT NULL, "externalId" TEXT NOT NULL, "profileUrl" TEXT NOT NULL, "photoUrl" TEXT,
  "photoHash" TEXT, "photoPerceptualHash" TEXT, "status" "ImportedProfileStatus" NOT NULL,
  "lastCheckedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "importedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ImportedProfile_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_rating_id_idx" ON "User"("rating" DESC,"id");
CREATE INDEX "User_displayName_idx" ON "User"("displayName");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
CREATE UNIQUE INDEX "Photo_source_sourceExternalId_contentHash_key" ON "Photo"("source","sourceExternalId","contentHash");
CREATE UNIQUE INDEX "Photo_one_active_per_user" ON "Photo"("userId") WHERE "active" = true;
CREATE INDEX "Photo_active_createdAt_idx" ON "Photo"("active","createdAt");
CREATE INDEX "Photo_userId_active_idx" ON "Photo"("userId","active");
CREATE INDEX "Battle_status_createdAt_idx" ON "Battle"("status","createdAt" DESC);
CREATE INDEX "Battle_normalizedPairKey_createdAt_idx" ON "Battle"("normalizedPairKey","createdAt" DESC);
CREATE INDEX "Battle_participantAId_createdAt_idx" ON "Battle"("participantAId","createdAt" DESC);
CREATE INDEX "Battle_participantBId_createdAt_idx" ON "Battle"("participantBId","createdAt" DESC);
CREATE UNIQUE INDEX "Vote_battleId_voterId_key" ON "Vote"("battleId","voterId");
CREATE INDEX "Vote_voterId_createdAt_idx" ON "Vote"("voterId","createdAt" DESC);
CREATE INDEX "Vote_selectedUserId_idx" ON "Vote"("selectedUserId");
CREATE UNIQUE INDEX "ImportedProfile_externalId_key" ON "ImportedProfile"("externalId");
CREATE INDEX "ImportedProfile_status_lastCheckedAt_idx" ON "ImportedProfile"("status","lastCheckedAt");

ALTER TABLE "Photo" ADD CONSTRAINT "Photo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_participantAId_fkey" FOREIGN KEY ("participantAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_participantBId_fkey" FOREIGN KEY ("participantBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_photoAId_fkey" FOREIGN KEY ("photoAId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Battle" ADD CONSTRAINT "Battle_photoBId_fkey" FOREIGN KEY ("photoBId") REFERENCES "Photo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_battleId_fkey" FOREIGN KEY ("battleId") REFERENCES "Battle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_selectedUserId_fkey" FOREIGN KEY ("selectedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
