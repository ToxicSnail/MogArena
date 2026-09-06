import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = path.resolve("fixtures/images");

export async function ensureFixtureImages() {
  await mkdir(root, { recursive: true });
  try { await readFile(path.join(root,"real.jpg")); await readFile(path.join(root,"placeholder.jpg")); return; } catch {}
  const placeholderSvg = Buffer.from(`<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg"><rect width="256" height="256" fill="#dbe4ef"/><circle cx="128" cy="96" r="43" fill="#94a3b8"/><path d="M50 238c5-63 36-91 78-91s73 28 78 91" fill="#94a3b8"/></svg>`);
  const realSvg = Buffer.from(`<svg width="320" height="400" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#ff9a62"/><stop offset="1" stop-color="#3658d8"/></linearGradient></defs><rect width="320" height="400" fill="url(#g)"/><circle cx="175" cy="145" r="72" fill="#f2c29b"/><path d="M55 400c10-115 70-166 125-166 58 0 111 52 130 166" fill="#18243d"/><path d="M105 118c25-85 139-80 151 16-44-31-94-38-151-16" fill="#36261e"/></svg>`);
  const placeholder = await sharp(placeholderSvg).jpeg({ quality: 95 }).toBuffer();
  await Promise.all([
    writeFile(path.join(root,"placeholder.jpg"),placeholder),
    sharp(placeholder).resize(220,220).jpeg({quality:62}).toFile(path.join(root,"placeholder-recompressed.jpg")),
    sharp(realSvg).jpeg({quality:90}).toFile(path.join(root,"real.jpg")),
    writeFile(path.join(root,"broken.jpg"),Buffer.from([0xff,0xd8,0xff,0x00,0x01])),
    writeFile(path.join(root,"invalid.html"),"<html>not an image</html>"),
  ]);
}
