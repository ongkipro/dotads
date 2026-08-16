import type { Context, Next } from "hono";

const requestCounts = new Map<string, { count: number; resetAt: number }>();

if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requestCounts.entries()) {
      if (now > record.resetAt) {
        requestCounts.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  const unrefTimer = timer as unknown as { unref?: () => void };
  if (typeof unrefTimer?.unref === "function") {
    unrefTimer.unref();
  }
}

export async function rateLimitMiddleware(c: Context, next: Next) {
  const ip = c.req.header("cf-connecting-ip") || c.req.header("x-real-ip") || c.req.header("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const routeGroup = c.req.path.split("/").slice(0, 4).join("/") || "global";
  const rateKey = `${routeGroup}:${ip}`;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 120; // 120 requests per minute per IP/Tenant

  let record = requestCounts.get(rateKey);
  if (!record || now > record.resetAt) {
    record = { count: 1, resetAt: now + windowMs };
    requestCounts.set(rateKey, record);
  } else {
    record.count++;
  }


  c.header("X-RateLimit-Limit", maxRequests.toString());
  c.header("X-RateLimit-Remaining", Math.max(0, maxRequests - record.count).toString());
  c.header("X-RateLimit-Reset", Math.ceil(record.resetAt / 1000).toString());

  if (record.count > maxRequests) {
    return c.json({ error: "Too Many Requests", retryAfter: Math.ceil((record.resetAt - now) / 1000) }, 429);
  }

  await next();
}
