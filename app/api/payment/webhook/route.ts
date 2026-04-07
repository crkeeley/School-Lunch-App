import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { formatCurrency, formatDate } from "@/lib/utils";
import { logger } from "@/lib/logger";
import Stripe from "stripe";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

function parseOrderIds(raw: string | undefined): string[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  const limitResult = await rateLimit({
    key: `payments:webhook:${getClientIp(req)}`,
    limit: 300,
    windowSec: 60,
  });

  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many webhook requests", limitResult);
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing webhook signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error: unknown) {
    logger.warn("stripe_webhook_signature_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderIds = parseOrderIds(pi.metadata.orderIds);
    if (orderIds.length === 0) {
      return NextResponse.json({ received: true });
    }
    const paymentMethodId =
      typeof pi.payment_method === "string"
        ? pi.payment_method
        : pi.payment_method?.id ?? null;

    const ordersToMarkPaid = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        status: { not: "PAID" },
      },
      include: {
        parent: true,
        child: true,
        teacher: true,
        items: { include: { menuItem: true } },
      },
    });

    if (ordersToMarkPaid.length === 0) {
      return NextResponse.json({ received: true });
    }

    await prisma.order.updateMany({
      where: { id: { in: ordersToMarkPaid.map((order) => order.id) }, status: { not: "PAID" } },
      data: { status: "PAID", stripePaymentMethodId: paymentMethodId },
    });

    for (const order of ordersToMarkPaid) {
      sendOrderConfirmation({
        to: order.parent.email!,
        parentName: order.parent.name ?? "Parent",
        childName: `${order.child.firstName} ${order.child.lastName}`,
        teacherName: `${order.teacher.firstName} ${order.teacher.lastName}`,
        deliveryDate: formatDate(order.deliveryDate),
        items: order.items.map((i) => ({
          name: i.menuItem.name,
          quantity: i.quantity,
          price: formatCurrency(i.totalPrice),
        })),
        total: formatCurrency(order.totalCents),
        orderId: order.id,
      }).catch(console.error);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const pi = event.data.object as Stripe.PaymentIntent;
    const orderIds = parseOrderIds(pi.metadata.orderIds);
    if (orderIds.length === 0) {
      return NextResponse.json({ received: true });
    }
    await prisma.order.updateMany({
      where: { id: { in: orderIds }, status: { not: "PAID" } },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
