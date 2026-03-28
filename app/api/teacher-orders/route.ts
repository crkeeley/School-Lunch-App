import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as any).role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { deliveryDate, notes, items } = await req.json();
  const userId = (session.user as any).id;

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i: any) => i.menuItemId) } },
  });

  const subtotalCents = items.reduce((sum: number, item: any) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    return sum + (menuItem?.price ?? 0) * item.quantity;
  }, 0);

  const order = await prisma.teacherOrder.create({
    data: {
      userId,
      deliveryDate: new Date(deliveryDate),
      subtotalCents,
      totalCents: subtotalCents,
      notes,
      items: {
        create: items.map((item: any) => {
          const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
          return {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: menuItem.price,
            totalPrice: menuItem.price * item.quantity,
          };
        }),
      },
    },
  });

  return NextResponse.json(order);
}
