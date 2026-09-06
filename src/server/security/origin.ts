import { AppError } from "@/server/errors";

export function assertTrustedOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) throw new AppError("INVALID_ORIGIN", "Invalid request origin", 403);
  try {
    const expected = new URL(process.env.APP_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000");
    const url = new URL(origin);
    if (url.origin === expected.origin && ["http:", "https:"].includes(url.protocol)) return;
  } catch {
    throw new AppError("INVALID_ORIGIN", "Invalid request origin", 403);
  }
  throw new AppError("INVALID_ORIGIN", "Invalid request origin", 403);
}
