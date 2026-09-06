import { readFile } from "node:fs/promises";
import { TrustedUrlPolicy } from "@/server/external/tsu/url-policy";
import { AppError } from "@/server/errors";

function parseEntry(value: unknown, host: string) {
  const raw = typeof value === "string" ? value.trim() : typeof value === "object" && value && "externalId" in value ? String(value.externalId).trim() : "";
  if (/^\d{1,20}$/.test(raw)) return raw;
  if (raw.startsWith("https://")) {
    const url = new TrustedUrlPolicy([host]).assert(raw);
    const match = url.pathname.match(/^\/Profile\/Index\/(\d{1,20})\/?$/i);
    if (match) return match[1];
  }
  throw new AppError("INVALID_IMPORT_INPUT", `Invalid profile entry: ${raw.slice(0,80)}`, 422);
}

export function parseProfileInput(content: string, filename: string, host = "accounts.tsu.ru") {
  if (filename.toLowerCase().endsWith(".json")) {
    const parsed: unknown = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new AppError("INVALID_IMPORT_INPUT", "JSON input must be an array", 422);
    return parsed.map((item) => parseEntry(item,host));
  }
  return content.split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#")).map((line) => parseEntry(line,host));
}

export async function readProfileInput(filePath: string, host?: string) { return parseProfileInput(await readFile(filePath,"utf8"),filePath,host); }
