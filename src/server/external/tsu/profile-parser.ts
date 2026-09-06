import * as cheerio from "cheerio";
import type { ParsedExternalProfile } from "@/server/external/tsu/types";

export class ProfileParser {
  parse(html: string, externalId: string, baseUrl: string): ParsedExternalProfile {
    const $ = cheerio.load(html);
    const displayName = $("[data-profile-name], .profile-name, .user-name, h1").first().text().trim() || undefined;
    const candidates = [
      $("meta[property='og:image']").attr("content"),
      $("img[data-profile-photo]").attr("src"),
      $(".profile-avatar img, .user-photo img, img.avatar").first().attr("src"),
    ];
    const rawPhoto = candidates.find((value) => value?.trim());
    let photoUrl: string | undefined;
    if (rawPhoto) { try { photoUrl = new URL(rawPhoto, baseUrl).toString(); } catch { photoUrl = undefined; } }
    return { externalId, displayName, photoUrl };
  }
}
