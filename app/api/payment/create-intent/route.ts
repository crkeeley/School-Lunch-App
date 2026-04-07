import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { z } from "zod";
import Stripe from "stripe";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const createIntentSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
  saveCard: z.boolean().optional(),
  paymentMethodId: z.string().min(1).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitResult = await rateLimit({
    key: `payments:create-intent:${session.user.id}:${getClientIp(req)}`,
    limit: 10,
    windowSec: 60,
  });

  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many payment attempts", limitResult);
  }

  const parsed = createIntentSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 422 });
  }

  const { orderIds, saveCard, paymentMethodId } = parsed.data;
  const userId = session.user.id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, parentId: userId, status: "PENDING" },
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: "No valid orders found" }, { status: 400 });
  }

  const validOrderIds = orders.map((o) => o.id);

  const totalCents = orders.reduce((sum, o) => sum + o.totalCents, 0);

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: user.email!,
      name: user.name ?? undefined,
    });
    stripeCustomerId = customer.id;
    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId },
    });
  }

  const paymentIntentData: Stripe.PaymentIntentCreateParams = {
    amount: totalCents,
    currency: "usd",
    customer: stripeCustomerId,
    automatic_payment_methods: { enabled: true },
    metadata: { orderIds: JSON.stringify(validOrderIds), userId },
  };

  if (saveCard) {
    paymentIntentData.setup_future_usage = "off_session";
  }

  if (paymentMethodId) {
    paymentIntentData.payment_method = paymentMethodId;
    paymentIntentData.confirm = true;
    paymentIntentData.return_url = `${process.env.NEXTAUTH_URL}/confirmation`;
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);

  // Update orders with payment intent id
  await prisma.order.updateMany({
    where: { id: { in: validOrderIds }, parentId: userId, status: "PENDING" },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
