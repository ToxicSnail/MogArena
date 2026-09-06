import type { ImportedProfileStatus } from "@prisma/client";
import type { ProfilePageFetcher, ProfilePhotoFetcher } from "@/server/external/tsu/types";
import { ProfileParser } from "@/server/external/tsu/profile-parser";
import type { ImportedProfileRepository } from "@/server/repositories/imported-profile-repository";
import type { StorageProvider } from "@/server/storage/storage-provider";
import { differenceHash, ProfilePhotoClassifier, sha256 } from "@/server/services/profile-photo-classifier";
import { normalizeImage } from "@/server/services/image-service";
import { AppError } from "@/server/errors";
import { logger } from "@/server/logging/logger";

export interface ImportResult { externalId: string; status: ImportedProfileStatus | "CACHED" }
export interface ImportSummary { processed: number; imported: number; placeholder: number; noPhoto: number; notFound: number; errors: number; cached: number; results: ImportResult[] }

export class ExternalProfileImporter {
  constructor(
    private readonly pageFetcher: ProfilePageFetcher,
    private readonly parser: ProfileParser,
    private readonly photoFetcher: ProfilePhotoFetcher,
    private readonly classifier: ProfilePhotoClassifier,
    private readonly repository: ImportedProfileRepository,
    private readonly storage: StorageProvider,
    private readonly options: { concurrency: number; delayMs: number } = { concurrency: 2, delayMs: 1000 },
  ) {}

  async importOne(externalId: string, force = false): Promise<ImportResult> {
    if (!/^\d{1,20}$/.test(externalId)) throw new AppError("INVALID_EXTERNAL_ID", "External ID must contain only digits", 422);
    if (!force && await this.repository.find(externalId)) return { externalId, status: "CACHED" };
    const profileUrl = `https://accounts.tsu.ru/Profile/Index/${externalId}`;
    try {
      const page = await this.pageFetcher.fetch(externalId);
      if (page.status === 404) { await this.repository.saveStatus({ externalId, profileUrl, status: "NOT_FOUND" }); return { externalId, status: "NOT_FOUND" }; }
      if (page.status !== 200 || !page.contentType?.toLowerCase().includes("text/html")) { await this.repository.saveStatus({ externalId, profileUrl, status: "INVALID_RESPONSE" }); return { externalId, status: "INVALID_RESPONSE" }; }
      const html = page.body.toString("utf8");
      if (/captcha|sign\s?in|authentication required/i.test(html)) throw new AppError("EXTERNAL_BLOCKED", "External source requires authentication or CAPTCHA; import stopped", 403);
      const profile = this.parser.parse(html, externalId, page.url);
      if (!profile.photoUrl) { await this.repository.saveStatus({ externalId, profileUrl, status: "NO_PHOTO" }); return { externalId, status: "NO_PHOTO" }; }
      const photo = await this.photoFetcher.fetch(profile.photoUrl);
      if (photo.status !== 200) { await this.repository.saveStatus({ externalId, profileUrl, photoUrl: profile.photoUrl, status: "INVALID_RESPONSE" }); return { externalId, status: "INVALID_RESPONSE" }; }
      const classification = await this.classifier.classify(photo.body, { url: photo.url, contentType: photo.contentType });
      if (classification === "PLACEHOLDER") { await this.repository.saveStatus({ externalId, profileUrl, photoUrl: profile.photoUrl, status: "PLACEHOLDER" }); return { externalId, status: "PLACEHOLDER" }; }
      if (classification === "INVALID_IMAGE") { await this.repository.saveStatus({ externalId, profileUrl, photoUrl: profile.photoUrl, status: "INVALID_RESPONSE" }); return { externalId, status: "INVALID_RESPONSE" }; }
      const normalized = await normalizeImage(photo.body);
      const [stored, thumbnail] = await Promise.all([
        this.storage.put(normalized.full, { namespace: "external", extension: "webp" }),
        this.storage.put(normalized.thumbnail, { namespace: "thumbs", extension: "webp" }),
      ]);
      try {
        const usedNewObjects = await this.repository.saveValid({ externalId, profileUrl, photoUrl: profile.photoUrl, storedUrl: stored.url, thumbnailUrl: thumbnail.url, photoHash: sha256(photo.body), photoPerceptualHash: await differenceHash(photo.body) });
        if (!usedNewObjects) await Promise.all([this.storage.delete(stored.key), this.storage.delete(thumbnail.key)]);
      } catch (error) {
        await Promise.allSettled([this.storage.delete(stored.key), this.storage.delete(thumbnail.key)]);
        throw error;
      }
      logger.info({ externalId, status: "VALID_PHOTO" }, "External profile imported");
      return { externalId, status: "VALID_PHOTO" };
    } catch (error) {
      if (error instanceof AppError && error.code === "EXTERNAL_BLOCKED") throw error;
      logger.error({ err: error, externalId }, "External profile import failed");
      await this.repository.saveStatus({ externalId, profileUrl, status: "ERROR" });
      return { externalId, status: "ERROR" };
    }
  }

  async importMany(externalIds: string[], force = false, onResult?: (result: ImportResult, index: number) => void): Promise<ImportSummary> {
    const ids = [...new Set(externalIds)]; const results: ImportResult[] = []; let cursor = 0; let stopped: unknown;
    const worker = async () => { while (!stopped) { const index = cursor++; if (index >= ids.length) return; if (index > 0 && this.options.delayMs) await new Promise((resolve) => setTimeout(resolve, this.options.delayMs)); try { const result = await this.importOne(ids[index], force); results[index] = result; onResult?.(result,index); } catch (error) { stopped = error; } } };
    await Promise.all(Array.from({ length: Math.min(this.options.concurrency, ids.length) }, worker));
    if (stopped) throw stopped;
    return {
      processed: results.length,
      imported: results.filter((item) => item.status === "VALID_PHOTO").length,
      placeholder: results.filter((item) => item.status === "PLACEHOLDER").length,
      noPhoto: results.filter((item) => item.status === "NO_PHOTO").length,
      notFound: results.filter((item) => item.status === "NOT_FOUND").length,
      errors: results.filter((item) => ["ERROR","INVALID_RESPONSE"].includes(item.status)).length,
      cached: results.filter((item) => item.status === "CACHED").length,
      results,
    };
  }
}
