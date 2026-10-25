import { NextResponse } from "next/server";

/**
 * Rate limiting for public endpoints (§38 security).
 *
 * Fixed-window counters in process memory. This bounds what one source can do
 * to every anonymous surface (case creation, uploads, assistant, sign-in) and
 * is sufficient for a single-instance deployment. A multi-instance production
 * deployment must back these counters with a shared store (Redis) — the
 * `checkRateLimit` core is pure so the swap is a one-module change.
 */

export interface RateLimitRule {
  limit: number;
  windowMs: number;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

interface WindowState {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, WindowState>();

/** Guard against unbounded growth from spoofed-forwarded identifiers. */
const MAX_TRACKED_KEYS = 10_000;

function sweep(now: number): void {
  for (const [key, state] of buckets) {
    if (state.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit(key: string, rule: RateLimitRule, now: number = Date.now()): RateLimitResult {
  if (buckets.size > MAX_TRACKED_KEYS) sweep(now);

  const state = buckets.get(key);
  if (!state || state.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + rule.windowMs });
    return { ok: true, remaining: rule.limit - 1, retryAfterSeconds: 0 };
  }

  state.count += 1;
  if (state.count > rule.limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((state.resetAt - now) / 1000)),
    };
  }
  return { ok: true, remaining: rule.limit - state.count, retryAfterSeconds: 0 };
}

/** Test isolation: forget every counted window. */
export function resetRateLimitsForTesting(): void {
  buckets.clear();
}

/**
 * The platform sits behind the host proxy, so the client address is the first
 * hop of `x-forwarded-for` — never the socket address, which would rate-limit
 * the proxy instead of the caller.
 */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Applies a rule to a request. Returns the 429 response to send when the limit
 * is hit, or null when the call may proceed.
 */
export function enforceRateLimit(request: Request, bucket: string, rule: RateLimitRule): NextResponse | null {
  const ip = clientIpFromHeaders(request.headers);
  const result = checkRateLimit(`${bucket}:${ip}`, rule);
  if (result.ok) return null;

  return NextResponse.json(
    { ok: false, error: "TOO_MANY_REQUESTS" },
    {
      status: 429,
      headers: {
        "retry-after": String(result.retryAfterSeconds),
        "cache-control": "no-store",
      },
    },
  );
}

/**
 * Published limits per surface. Strict where a stranger creates durable state
 * (a case, an upload), looser where a read follows.
 */
export const RATE_RULES = {
  /** Anonymous case creation (also the bot-protection surface, §48). */
  guestStart: { limit: 10, windowMs: 60 * 60 * 1000 },
  /** Any action on an existing guest dossier (answer, pay, …). */
  guestAction: { limit: 90, windowMs: 60 * 1000 },
  /** Sentence → catalogue suggestions. */
  assistant: { limit: 20, windowMs: 60 * 1000 },
  /** Credential attempts. */
  signIn: { limit: 10, windowMs: 60 * 1000 },
  /** Stranger file intake — expensive payloads, keep tight. */
  verifyUpload: { limit: 6, windowMs: 60 * 60 * 1000 },
  /** Verify checkout/settle per token holder. */
  verifyAction: { limit: 30, windowMs: 60 * 1000 },
  /** Document downloads. */
  documentDownload: { limit: 120, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>;
