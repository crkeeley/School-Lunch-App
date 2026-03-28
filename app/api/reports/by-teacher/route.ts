import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  // Group by teacher
  const grouped = orders.reduce((acc: any, order) => {
    const key = order.teacherId;
    if (!acc[key]) {
      acc[key] = {
        teacher: order.teacher,
        orders: [],
      };
    }
    acc[key].orders.push(order);
    return acc;
  }, {});

  return NextResponse.json(Object.values(grouped));
}
