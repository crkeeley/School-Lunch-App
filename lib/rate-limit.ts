import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getRedisClient } from "@/lib/redis";
import { logger } from "@/lib/logger";

type RateLimitOptions = {
  key: string;
  limit: number;
  windowSec: number;
};

type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
};

const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }

  return req.headers.get("x-real-ip") ?? "unknown";
}

function rateLimitInMemory({ key, limit, windowSec }: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSec * 1000;
  const entry = memoryStore.get(key);

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs;
    memoryStore.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, resetAt };
  }

  entry.count += 1;
  memoryStore.set(key, entry);

  return {
    success: entry.count <= limit,
    limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export async function rateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    return rateLimitInMemory(options);
  }

  try {
    if (redis.status === "wait") {
      await redis.connect();
    }

    const redisKey = `ratelimit:${options.key}`;
    const count = await redis.incr(redisKey);

    if (count === 1) {
      await redis.expire(redisKey, options.windowSec);
    }

    const ttl = await redis.ttl(redisKey);
    const resetAt = Date.now() + Math.max(ttl, 1) * 1000;

    return {
      success: count <= options.limit,
      limit: options.limit,
      remaining: Math.max(0, options.limit - count),
      resetAt,
    };
  } catch (error) {
    logger.warn("rate_limit_redis_fallback", {
      key: options.key,
      error: error instanceof Error ? error.message : "unknown",
    });
    return rateLimitInMemory(options);
  }
}

export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.floor(result.resetAt / 1000)),
  };
}

export function rateLimitExceededResponse(message: string, result: RateLimitResult) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: rateLimitHeaders(result),
    }
  );
}
