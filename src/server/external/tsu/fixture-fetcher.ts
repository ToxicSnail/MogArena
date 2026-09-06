import { readFile } from "node:fs/promises";
import path from "node:path";
import type { FetchResult, ProfilePageFetcher, ProfilePhotoFetcher } from "@/server/external/tsu/types";
import { ensureFixtureImages } from "@/server/external/tsu/fixture-images";

const profileMap: Record<string,string> = { "99999999999999999991": "real-photo.html", "99999999999999999992": "placeholder.html", "99999999999999999993": "no-photo.html", "404": "not-found.html" };
const fixtureRoot = path.resolve("fixtures");

export class FixtureProfilePageFetcher implements ProfilePageFetcher {
  async fetch(externalId: string): Promise<FetchResult> {
    const name = profileMap[externalId];
    if (!name || name === "not-found.html") return { status: 404, url: `https://accounts.tsu.ru/Profile/Index/${externalId}`, contentType: "text/html", body: Buffer.from(await readFile(path.join(fixtureRoot,"profiles","not-found.html"))) };
    return { status: 200, url: `https://accounts.tsu.ru/Profile/Index/${externalId}`, contentType: "text/html", body: Buffer.from(await readFile(path.join(fixtureRoot,"profiles",name))) };
  }
}

export class FixtureProfilePhotoFetcher implements ProfilePhotoFetcher {
  async fetch(url: string): Promise<FetchResult> {
    await ensureFixtureImages();
    const parsed = new URL(url); const name = path.basename(parsed.pathname);
    if (!["real.jpg","placeholder.jpg","placeholder-recompressed.jpg"].includes(name)) return { status:404,url,contentType:"text/html",body:Buffer.from("not found") };
    return { status:200,url,contentType:"image/jpeg",body:Buffer.from(await readFile(path.join(fixtureRoot,"images",name))) };
  }
}
