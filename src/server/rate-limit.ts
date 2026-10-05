import "server-only";
import { HttpError } from "./http";

/**
 * Fixed-window in-memory rate limit. Good enough for a single instance; swap
 * for Redis or the platform's limiter when running more than one.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) for (const [k, v] of windows) if (v.resetAt <= now) windows.delete(k);
    return;
  }
  w.count++;
  if (w.count > limit) {
    throw new HttpError(429, "Too many requests. Wait a moment and try again.");
  }
}
