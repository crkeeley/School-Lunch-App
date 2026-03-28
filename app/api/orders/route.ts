import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const role = (session.user as any).role;
  const userId = (session.user as any).id;
  const teacherId = searchParams.get("teacherId");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  const where: any = {};

  if (role === "PARENT") {
    where.parentId = userId;
  } else if (role === "TEACHER") {
    where.teacherId = (session.user as any).teacherId;
  }

  if (teacherId && (role === "ADMIN")) {
    where.teacherId = teacherId;
  }

  if (date) {
    const d = new Date(date);
    where.deliveryDate = {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lt: new Date(d.setHours(23, 59, 59, 999)),
    };
  }

  if (month) {
    const [year, m] = month.split("-").map(Number);
    where.deliveryDate = {
      gte: new Date(year, m - 1, 1),
      lt: new Date(year, m, 1),
    };
  }

  const orders = await prisma.order.findMany({
    where,
    include: {
      child: true,
      teacher: true,
      items: { include: { menuItem: true } },
    },
    orderBy: { deliveryDate: "asc" },
  });

  return NextResponse.json(orders);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { childId, teacherId, deliveryDate, items, notes } = body;
  const parentId = (session.user as any).id;

  const school = await prisma.school.findFirst({ include: { settings: true } });
  const taxRate = school?.settings?.taxRate ?? 0;

  const menuItems = await prisma.menuItem.findMany({
    where: { id: { in: items.map((i: any) => i.menuItemId) } },
  });

  const subtotalCents = items.reduce((sum: number, item: any) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    return sum + (menuItem?.price ?? 0) * item.quantity;
  }, 0);

  const taxCents = Math.round(subtotalCents * taxRate);
  const totalCents = subtotalCents + taxCents;

  const order = await prisma.order.create({
    data: {
      parentId,
      childId,
      teacherId,
      deliveryDate: new Date(deliveryDate),
      status: "PENDING",
      subtotalCents,
      taxCents,
      totalCents,
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
    include: { items: { include: { menuItem: true } }, child: true, teacher: true },
  });

  return NextResponse.json(order);
}
