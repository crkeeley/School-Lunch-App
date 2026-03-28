import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as any).role;
  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const teacherId = role === "TEACHER" ? (session.user as any).teacherId : searchParams.get("teacherId");

  const d = new Date(date);
  const where: any = {
    status: { in: ["PAID", "PREPARING", "READY", "DELIVERED"] },
    deliveryDate: {
      gte: new Date(d.setHours(0, 0, 0, 0)),
      lt: new Date(d.setHours(23, 59, 59, 999)),
    },
  };
  if (teacherId) where.teacherId = teacherId;

  const orders = await prisma.order.findMany({
    where,
    include: {
      child: true,
      teacher: true,
      items: { include: { menuItem: true } },
    },
    orderBy: [{ teacher: { lastName: "asc" } }, { child: { lastName: "asc" } }],
  });

  const rows: string[][] = [
    ["Teacher", "Child First Name", "Child Last Name", "Item", "Qty", "Price", "Order Total"],
  ];

  for (const order of orders) {
    for (const item of order.items) {
      rows.push([
        `${order.teacher.firstName} ${order.teacher.lastName}`,
        order.child.firstName,
        order.child.lastName,
        item.menuItem.name,
        String(item.quantity),
        formatCurrency(item.totalPrice),
        formatCurrency(order.totalCents),
      ]);
    }
  }

  const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="orders-${date}.csv"`,
    },
  });
}
