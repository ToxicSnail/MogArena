UPDATE "User"
SET "displayName" = NULL
WHERE "isImported" = true;
