import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";
import { Prisma } from "@prisma/client";
import { resolveScopedSchoolId } from "@/lib/school-scope";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitResult = await rateLimit({
    key: `reports:export:get:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many export requests", limitResult);
  }

  const role = session.user.role;
  if (!["ADMIN", "TEACHER"].includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? new Date().toISOString().split("T")[0];
  const teacherId = role === "TEACHER" ? session.user.teacherId : searchParams.get("teacherId");
  const requestedSchoolId = searchParams.get("schoolId");

  const schoolId = await resolveScopedSchoolId({
    role,
    userId: session.user.id,
    requestedSchoolId,
  });

  if (!schoolId) {
    return NextResponse.json({ error: "School scope required" }, { status: 400 });
  }

  const d = new Date(date);
  if (Number.isNaN(d.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 422 });
  }

  const start = new Date(d);
  start.setHours(0, 0, 0, 0);
  const end = new Date(d);
  end.setHours(23, 59, 59, 999);

  const where: Prisma.OrderWhereInput = {
    status: { in: ["PAID", "PREPARING", "READY", "DELIVERED"] },
    teacher: { schoolId },
    deliveryDate: {
      gte: start,
      lt: end,
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
