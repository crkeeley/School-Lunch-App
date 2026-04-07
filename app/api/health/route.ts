import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NextRequest } from "next/server";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const startedAt = Date.now();

  const limitResult = await rateLimit({
    key: `health:get:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });

  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many health check requests", limitResult);
  }

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        environment: process.env.NODE_ENV,
        uptimeSeconds: Math.round(process.uptime()),
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        services: {
          database: "ok",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  } catch {
    return NextResponse.json(
      {
        status: "degraded",
        environment: process.env.NODE_ENV,
        responseTimeMs: Date.now() - startedAt,
        timestamp: new Date().toISOString(),
        services: {
          database: "error",
        },
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store",
        },
      }
    );
  }
}
