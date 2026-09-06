import { AppError } from "@/server/errors";

export class TrustedUrlPolicy {
  private readonly hosts: Set<string>;
  constructor(hosts: string[]) { this.hosts = new Set(hosts.map((host) => host.trim().toLowerCase()).filter(Boolean)); }

  assert(rawUrl: string) {
    let url: URL;
    try { url = new URL(rawUrl); } catch { throw new AppError("UNTRUSTED_URL", "Invalid external URL", 400); }
    if (url.protocol !== "https:" || !this.hosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
      throw new AppError("UNTRUSTED_URL", "External URL is not allowed", 403);
    }
    return url;
  }
}
