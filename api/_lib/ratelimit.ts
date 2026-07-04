import type { VercelRequest } from "@vercel/node";

// Best-effort in-memory rate limit (per serverless instance). Good enough to
// blunt abuse of the AI endpoints; not a billing control.
const hits = new Map<string, number[]>();

export function rateLimited(req: VercelRequest, max = 10, windowMs = 60_000): boolean {
  const ip =
    (typeof req.headers["x-forwarded-for"] === "string"
      ? req.headers["x-forwarded-for"].split(",")[0].trim()
      : null) ?? "unknown";
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}
