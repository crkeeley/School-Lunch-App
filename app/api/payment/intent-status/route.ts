import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { stripe } from "@/lib/stripe";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const querySchema = z.object({
  payment_intent: z.string().min(1),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limitResult = await rateLimit({
    key: `payments:intent-status:${session.user.id}:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });

  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many requests", limitResult);
  }

  const parsed = querySchema.safeParse({
    payment_intent: req.nextUrl.searchParams.get("payment_intent"),
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request query" }, { status: 422 });
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(parsed.data.payment_intent);

  if (paymentIntent.metadata.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: paymentIntent.id,
    status: paymentIntent.status,
  });
}
