import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { NextRequest } from "next/server";

const handler = NextAuth(authOptions);

type AuthRouteContext = {
	params: {
		nextauth: string[];
	};
};

export async function GET(req: NextRequest, context: AuthRouteContext) {
	const limitResult = await rateLimit({
		key: `auth:nextauth:get:${getClientIp(req)}`,
		limit: 120,
		windowSec: 60,
	});

	if (!limitResult.success) {
		return rateLimitExceededResponse("Too many auth requests", limitResult);
	}

	return handler(req, context);
}

export async function POST(req: NextRequest, context: AuthRouteContext) {
	const limitResult = await rateLimit({
		key: `auth:nextauth:post:${getClientIp(req)}`,
		limit: 120,
		windowSec: 60,
	});

	if (!limitResult.success) {
		return rateLimitExceededResponse("Too many auth attempts", limitResult);
	}

	return handler(req, context);
}
