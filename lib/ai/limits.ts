/**
 * Usage limits for AI endpoints (AI-09). In-memory, per server instance —
 * adequate for a single demo deployment.
 */
const PER_MINUTE = Number(process.env.AI_RATE_PER_MINUTE || 20);
const PER_DAY = Number(process.env.AI_DAILY_LIMIT || 1500);
const recent = new Map<string, number[]>();
let day = new Date().toISOString().slice(0, 10);
let dayCount = 0;

export function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

/** Records a request; returns the exceeded limit, or null when allowed. */
export function checkLimit(ip: string): "minute" | "day" | null {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== day) {
    day = today;
    dayCount = 0;
  }
  if (dayCount >= PER_DAY) return "day";
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (hits.length >= PER_MINUTE) return "minute";
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5000) recent.clear();
  dayCount++;
  return null;
}
