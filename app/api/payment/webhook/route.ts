import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendOrderConfirmation } from "@/lib/email";
import { formatCurrency, formatDate } from "@/lib/utils";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const pi = event.data.object as any;
    const orderIds = JSON.parse(pi.metadata.orderIds ?? "[]");

    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "PAID", stripePaymentMethodId: pi.payment_method },
    });

    // Send confirmation emails
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
      include: {
        parent: true,
        child: true,
        teacher: true,
        items: { include: { menuItem: true } },
      },
    });

    for (const order of orders) {
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
    const pi = event.data.object as any;
    const orderIds = JSON.parse(pi.metadata.orderIds ?? "[]");
    await prisma.order.updateMany({
      where: { id: { in: orderIds } },
      data: { status: "CANCELLED" },
    });
  }

  return NextResponse.json({ received: true });
}
