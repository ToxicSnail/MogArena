ALTER TABLE "ImportedProfile" ADD COLUMN "userId" TEXT;

UPDATE "ImportedProfile" AS imported
SET "userId" = users.id
FROM "User" AS users
WHERE users.username = 'tsu_' || imported."externalId";

CREATE UNIQUE INDEX "ImportedProfile_userId_key" ON "ImportedProfile"("userId");

ALTER TABLE "ImportedProfile"
ADD CONSTRAINT "ImportedProfile_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "User"
SET
  username = (CASE floor(random() * 12)::int
    WHEN 0 THEN 'brave' WHEN 1 THEN 'calm' WHEN 2 THEN 'clever' WHEN 3 THEN 'cosmic'
    WHEN 4 THEN 'gentle' WHEN 5 THEN 'lucky' WHEN 6 THEN 'neon' WHEN 7 THEN 'rapid'
    WHEN 8 THEN 'silver' WHEN 9 THEN 'solar' WHEN 10 THEN 'steady' ELSE 'wild'
  END) || '_' || (CASE floor(random() * 10)::int
    WHEN 0 THEN 'badger' WHEN 1 THEN 'falcon' WHEN 2 THEN 'fox' WHEN 3 THEN 'lynx'
    WHEN 4 THEN 'otter' WHEN 5 THEN 'owl' WHEN 6 THEN 'panda' WHEN 7 THEN 'raven'
    WHEN 8 THEN 'tiger' ELSE 'wolf'
  END) || '_' || substr(md5(random()::text || id), 1, 6),
  "displayName" = NULL;
