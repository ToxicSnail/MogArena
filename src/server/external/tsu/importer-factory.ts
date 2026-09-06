import { readFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/lib/env";
import { FixtureProfilePageFetcher, FixtureProfilePhotoFetcher } from "@/server/external/tsu/fixture-fetcher";
import { ensureFixtureImages } from "@/server/external/tsu/fixture-images";
import { SafeHttpFetcher, TsuProfilePageFetcher, TsuProfilePhotoFetcher } from "@/server/external/tsu/http-fetcher";
import { ProfileParser } from "@/server/external/tsu/profile-parser";
import { TrustedUrlPolicy } from "@/server/external/tsu/url-policy";
import { PrismaImportedProfileRepository } from "@/server/repositories/imported-profile-repository";
import { ExternalProfileImporter } from "@/server/services/external-profile-importer";
import { ProfilePhotoClassifier } from "@/server/services/profile-photo-classifier";
import { getStorageProvider } from "@/server/storage";

export async function createExternalProfileImporter() {
  const env = getEnv(); const classifier = new ProfilePhotoClassifier({ threshold: env.PLACEHOLDER_PHASH_THRESHOLD });
  let pageFetcher; let photoFetcher;
  if (env.PROFILE_IMPORT_SOURCE === "fixtures") {
    await ensureFixtureImages();
    await classifier.addPlaceholderReference(Buffer.from(await readFile(path.resolve("fixtures/images/placeholder.jpg"))));
    pageFetcher = new FixtureProfilePageFetcher(); photoFetcher = new FixtureProfilePhotoFetcher();
  } else {
    const pageHttp = new SafeHttpFetcher(new TrustedUrlPolicy([env.PROFILE_IMPORT_ALLOWED_HOST]), { timeoutMs: env.PROFILE_IMPORT_TIMEOUT_MS, retries: env.PROFILE_IMPORT_RETRIES, maxBytes: 2 * 1024 * 1024 });
    const imageHttp = new SafeHttpFetcher(new TrustedUrlPolicy(env.PROFILE_IMPORT_IMAGE_HOSTS.split(",")), { timeoutMs: env.PROFILE_IMPORT_TIMEOUT_MS, retries: env.PROFILE_IMPORT_RETRIES, maxBytes: env.PROFILE_IMPORT_MAX_BYTES });
    pageFetcher = new TsuProfilePageFetcher(pageHttp, env.PROFILE_IMPORT_ALLOWED_HOST); photoFetcher = new TsuProfilePhotoFetcher(imageHttp);
  }
  return new ExternalProfileImporter(pageFetcher, new ProfileParser(), photoFetcher, classifier, new PrismaImportedProfileRepository(), getStorageProvider(), { concurrency: env.PROFILE_IMPORT_CONCURRENCY, delayMs: env.PROFILE_IMPORT_DELAY_MS });
}
