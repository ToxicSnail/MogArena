import { NextResponse } from "next/server";
import { getStorageProvider } from "@/server/storage";

export async function GET(_: Request, context: { params: Promise<{ key: string[] }> }) {
  try {
    const { key } = await context.params;
    const data = await getStorageProvider().read(key.join("/"));
    return new NextResponse(new Uint8Array(data), {
      headers: { "Content-Type": "image/webp", "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
