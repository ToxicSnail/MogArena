process.env.DATABASE_URL ??= "postgresql://mogvs:mogvs@localhost:5432/mogvs?schema=public";
process.env.AUTH_SECRET ??= "test-secret-that-is-at-least-32-characters";
process.env.APP_URL ??= "http://localhost:3000";
process.env.PROFILE_IMPORT_SOURCE ??= "fixtures";
