import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitResult = await rateLimit({
    key: `payments:saved-cards:get:${session.user.id}:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many requests", limitResult);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });

  if (!user?.stripeCustomerId) return NextResponse.json([]);

  const methods = await stripe.paymentMethods.list({
    customer: user.stripeCustomerId,
    type: "card",
  });

  return NextResponse.json(
    methods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand,
      last4: pm.card?.last4,
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
    }))
  );
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitResult = await rateLimit({
    key: `payments:saved-cards:delete:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many requests", limitResult);
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  });
  if (!user?.stripeCustomerId) {
    return NextResponse.json({ error: "No Stripe customer" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const pmId = searchParams.get("pmId");
  if (!pmId) return NextResponse.json({ error: "Missing pmId" }, { status: 400 });

  const paymentMethod = await stripe.paymentMethods.retrieve(pmId);
  if (typeof paymentMethod === "string") {
    return NextResponse.json({ error: "Payment method not found" }, { status: 404 });
  }

  if (paymentMethod.customer !== user.stripeCustomerId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await stripe.paymentMethods.detach(pmId);
  return NextResponse.json({ success: true });
}
