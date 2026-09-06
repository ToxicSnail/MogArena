import { AppError } from "@/server/errors";

export interface RateLimiter {
  consume(key: string, limit: number, windowMs: number): Promise<void>;
}

type Bucket = { count: number; expiresAt: number };

export class MemoryRateLimiter implements RateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  async consume(key: string, limit: number, windowMs: number) {
    const now = Date.now();
    if (this.buckets.size > 10_000) {
      for (const [bucketKey, bucket] of this.buckets) if (bucket.expiresAt <= now) this.buckets.delete(bucketKey);
      if (this.buckets.size > 10_000) throw new AppError("RATE_LIMITED", "Too many requests", 429);
    }
    const current = this.buckets.get(key);
    if (!current || current.expiresAt <= now) {
      this.buckets.set(key, { count: 1, expiresAt: now + windowMs });
      return;
    }
    if (current.count >= limit) throw new AppError("RATE_LIMITED", "Too many requests", 429);
    current.count += 1;
  }
}

export const rateLimiter = new MemoryRateLimiter();

export function requestKey(request: Request, scope: string, userId?: string) {
  const ip = request.headers.get("x-real-ip") ?? "local";
  return `${scope}:${userId ?? ip}`;
}
