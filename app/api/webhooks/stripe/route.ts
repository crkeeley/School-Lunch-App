import { NextRequest } from "next/server";
import { POST as paymentWebhookPost } from "@/app/api/payment/webhook/route";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
	const limitResult = await rateLimit({
		key: `webhooks:stripe:${getClientIp(req)}`,
		limit: 300,
		windowSec: 60,
	});

	if (!limitResult.success) {
		return rateLimitExceededResponse("Too many webhook requests", limitResult);
	}

	return paymentWebhookPost(req);
}
