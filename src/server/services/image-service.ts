import sharp from "sharp";
import { AppError } from "@/server/errors";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const allowedFormats = new Set(["jpeg", "png", "webp"]);

function hasAllowedSignature(input: Buffer) {
  const jpeg = input.length > 3 && input[0] === 0xff && input[1] === 0xd8 && input[2] === 0xff;
  const png = input.length > 8 && input.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const webp = input.length > 12 && input.subarray(0, 4).toString("ascii") === "RIFF" && input.subarray(8, 12).toString("ascii") === "WEBP";
  return jpeg || png || webp;
}

export async function inspectImage(input: Buffer, minimumSize = 64) {
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new AppError("INVALID_IMAGE", "Image must be at most 10 MB", 422);
  if (!hasAllowedSignature(input)) throw new AppError("INVALID_IMAGE", "Only JPEG, PNG and WebP images are accepted", 422);
  try {
    const metadata = await sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).metadata();
    if (!metadata.format || !allowedFormats.has(metadata.format) || !metadata.width || !metadata.height) throw new Error("Unsupported image");
    if (metadata.width < minimumSize || metadata.height < minimumSize) {
      throw new AppError("IMAGE_TOO_SMALL", `Image must be at least ${minimumSize}x${minimumSize}`, 422);
    }
    return metadata;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INVALID_IMAGE", "The image is corrupt or cannot be decoded", 422);
  }
}

export async function normalizeImage(input: Buffer) {
  await inspectImage(input);
  const image = sharp(input, { failOn: "error", limitInputPixels: 40_000_000 }).rotate();
  const full = await image.clone().resize({ width: 1600, height: 2000, fit: "inside", withoutEnlargement: true }).webp({ quality: 88 }).toBuffer();
  const thumbnail = await image.clone().resize(400, 500, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toBuffer();
  return { full, thumbnail };
}
