import { createHash } from "node:crypto";
import sharp from "sharp";
import placeholderConfig from "../../../config/placeholders.json";
import type { PhotoClassification } from "@/server/external/tsu/types";

interface ClassifierOptions { exactHashes?: string[]; perceptualHashes?: string[]; threshold?: number }

export function sha256(input: Buffer) { return createHash("sha256").update(input).digest("hex"); }

export async function differenceHash(input: Buffer) {
  const { data } = await sharp(input, { failOn: "error" }).greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer({ resolveWithObject: true });
  let bits = 0n;
  for (let y = 0; y < 8; y += 1) for (let x = 0; x < 8; x += 1) { bits <<= 1n; if (data[y * 9 + x] > data[y * 9 + x + 1]) bits |= 1n; }
  return bits.toString(16).padStart(16, "0");
}

function hammingDistance(a: string, b: string) {
  let value = BigInt(`0x${a}`) ^ BigInt(`0x${b}`); let count = 0;
  while (value) { count += Number(value & 1n); value >>= 1n; }
  return count;
}

function isKnownPlaceholderUrl(url?: string) {
  if (!url) return false;
  try { return new URL(url).pathname.toLowerCase() === "/content/noavatar.jpg"; }
  catch { return false; }
}

export class ProfilePhotoClassifier {
  private exactHashes: Set<string>;
  private perceptualHashes: string[];
  private threshold: number;

  constructor(options: ClassifierOptions = {}) {
    this.exactHashes = new Set(options.exactHashes ?? placeholderConfig.sha256);
    this.perceptualHashes = options.perceptualHashes ?? placeholderConfig.dhash;
    this.threshold = options.threshold ?? Number(process.env.PLACEHOLDER_PHASH_THRESHOLD ?? 6);
  }

  async addPlaceholderReference(image: Buffer) { this.exactHashes.add(sha256(image)); this.perceptualHashes.push(await differenceHash(image)); }

  async classify(image: Buffer, metadata?: { url?: string; contentType?: string }): Promise<PhotoClassification> {
    if (!image.length || image.length > 10 * 1024 * 1024 || metadata?.contentType?.toLowerCase().includes("text/html")) return "INVALID_IMAGE";
    if (isKnownPlaceholderUrl(metadata?.url)) return "PLACEHOLDER";
    if (this.exactHashes.has(sha256(image))) return "PLACEHOLDER";
    try {
      const info = await sharp(image, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
      if (!info.width || !info.height || info.width < 64 || info.height < 64 || !["jpeg","png","webp"].includes(info.format ?? "")) return "INVALID_IMAGE";
      const hash = await differenceHash(image);
      if (this.perceptualHashes.some((known) => hammingDistance(hash, known) <= this.threshold)) return "PLACEHOLDER";
      return "REAL_PHOTO";
    } catch { return "INVALID_IMAGE"; }
  }
}
