import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderIds, saveCard, paymentMethodId } = await req.json();
  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const orders = await prisma.order.findMany({
    where: { id: { in: orderIds }, parentId: userId, status: "PENDING" },
  });

  if (orders.length === 0) {
    return NextResponse.json({ error: "No valid orders found" }, { status: 400 });
  }

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

  const paymentIntentData: any = {
    amount: totalCents,
    currency: "usd",
    customer: stripeCustomerId,
    metadata: { orderIds: JSON.stringify(orderIds), userId },
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
    where: { id: { in: orderIds } },
    data: { stripePaymentIntentId: paymentIntent.id },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
  });
}
