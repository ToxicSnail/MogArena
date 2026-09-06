import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url().optional(),
  APP_URL: z.string().url().default("http://localhost:3000"),
  STORAGE_PROVIDER: z.literal("local").default("local"),
  LOCAL_STORAGE_PATH: z.string().default("./storage"),
  PROFILE_IMPORT_SOURCE: z.enum(["fixtures", "external"]).default("fixtures"),
  PROFILE_IMPORT_ALLOWED_HOST: z.string().default("accounts.tsu.ru"),
  PROFILE_IMPORT_IMAGE_HOSTS: z.string().default("accounts.tsu.ru"),
  PROFILE_IMPORT_CONCURRENCY: z.coerce.number().int().min(1).max(10).default(2),
  PROFILE_IMPORT_DELAY_MS: z.coerce.number().int().min(0).default(1000),
  PROFILE_IMPORT_TIMEOUT_MS: z.coerce.number().int().min(100).default(10000),
  PROFILE_IMPORT_RETRIES: z.coerce.number().int().min(0).max(5).default(2),
  PROFILE_IMPORT_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  PLACEHOLDER_PHASH_THRESHOLD: z.coerce.number().int().min(0).max(64).default(6),
  BATTLE_VOTE_TARGET: z.coerce.number().int().min(1).default(20),
  LOG_LEVEL: z.string().default("info"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

export function getEnv(): Env {
  if (!cached) cached = envSchema.parse(process.env);
  return cached;
}
