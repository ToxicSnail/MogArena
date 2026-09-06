import type { FetchResult, ProfilePageFetcher, ProfilePhotoFetcher } from "@/server/external/tsu/types";
import { TrustedUrlPolicy } from "@/server/external/tsu/url-policy";
import { AppError } from "@/server/errors";

interface SafeFetcherOptions { timeoutMs: number; retries: number; maxBytes: number; maxRedirects?: number }

export class SafeHttpFetcher {
  constructor(private readonly policy: TrustedUrlPolicy, private readonly options: SafeFetcherOptions) {}

  async fetch(rawUrl: string): Promise<FetchResult> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.options.retries; attempt += 1) {
      try { return await this.fetchOnce(rawUrl); } catch (error) {
        lastError = error;
        if (error instanceof AppError && [403, 429].includes(error.status)) throw error;
        if (attempt < this.options.retries) await new Promise((resolve) => setTimeout(resolve, 400 * 2 ** attempt));
      }
    }
    throw lastError;
  }

  private async fetchOnce(rawUrl: string): Promise<FetchResult> {
    let url = this.policy.assert(rawUrl);
    const maxRedirects = this.options.maxRedirects ?? 3;
    for (let redirect = 0; redirect <= maxRedirects; redirect += 1) {
      const response = await fetch(url, {
        redirect: "manual",
        signal: AbortSignal.timeout(this.options.timeoutMs),
        headers: { "User-Agent": "MogVS-ProfileImporter/1.0 (+local-development)", Accept: "text/html,image/jpeg,image/png,image/webp" },
      });
      if ([301,302,303,307,308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location || redirect === maxRedirects) throw new AppError("EXTERNAL_REDIRECT", "Too many or invalid redirects", 502);
        url = this.policy.assert(new URL(location, url).toString());
        continue;
      }
      if (response.status === 403 || response.status === 429) throw new AppError("EXTERNAL_BLOCKED", `External source returned ${response.status}; import stopped`, response.status);
      const declared = Number(response.headers.get("content-length") ?? 0);
      if (declared > this.options.maxBytes) throw new AppError("EXTERNAL_TOO_LARGE", "External response is too large", 413);
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = []; let length = 0;
      if (reader) while (true) { const item = await reader.read(); if (item.done) break; length += item.value.length; if (length > this.options.maxBytes) { await reader.cancel(); throw new AppError("EXTERNAL_TOO_LARGE", "External response is too large", 413); } chunks.push(item.value); }
      return { status: response.status, url: url.toString(), contentType: response.headers.get("content-type") ?? undefined, body: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))) };
    }
    throw new AppError("EXTERNAL_REDIRECT", "Redirect limit exceeded", 502);
  }
}

export class TsuProfilePageFetcher implements ProfilePageFetcher {
  constructor(private readonly http: SafeHttpFetcher, private readonly host: string) {}
  fetch(externalId: string) { return this.http.fetch(`https://${this.host}/Profile/Index/${encodeURIComponent(externalId)}`); }
}

export class TsuProfilePhotoFetcher implements ProfilePhotoFetcher {
  constructor(private readonly http: SafeHttpFetcher) {}
  fetch(url: string) { return this.http.fetch(url); }
}
