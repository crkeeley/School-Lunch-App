import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createOrderSchema } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { resolveScopedSchoolId } from "@/lib/school-scope";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limitResult = await rateLimit({
    key: `orders:get:${session.user.id}:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many order requests", limitResult);
  }

  const { searchParams } = new URL(req.url);
  const role = session.user.role;
  const userId = session.user.id;
  const teacherId = searchParams.get("teacherId");
  const requestedSchoolId = searchParams.get("schoolId");
  const date = searchParams.get("date");
  const month = searchParams.get("month");

  const where: Prisma.OrderWhereInput = {};

  if (role === "PARENT") {
    where.parentId = userId;
  } else if (role === "TEACHER" && session.user.teacherId) {
    where.teacherId = session.user.teacherId;
  } else if (role === "ADMIN") {
    const schoolId = await resolveScopedSchoolId({
      role,
      userId,
      requestedSchoolId,
    });

    if (!schoolId) {
      return NextResponse.json({ error: "School scope required" }, { status: 400 });
    }

    where.teacher = { schoolId };
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
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `orders:create:${session.user.id}:${getClientIp(req)}`,
    limit: 20,
    windowSec: 60,
  });

  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many order attempts", limitResult);
  }

  const parsed = createOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 422 });
  }

  const { childId, teacherId, deliveryDate, items, notes } = parsed.data;
  const parentId = session.user.id;

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId },
    select: {
      id: true,
      teacherId: true,
      teacher: {
        select: { schoolId: true, isActive: true },
      },
    },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  if (child.teacherId !== teacherId) {
    return NextResponse.json({ error: "Invalid teacher for child" }, { status: 400 });
  }

  if (!child.teacher.isActive) {
    return NextResponse.json({ error: "Teacher is not active" }, { status: 400 });
  }

  const parsedDeliveryDate = new Date(deliveryDate);
  if (Number.isNaN(parsedDeliveryDate.getTime())) {
    return NextResponse.json({ error: "Invalid delivery date" }, { status: 422 });
  }

  const schoolSettings = await prisma.schoolSettings.findUnique({
    where: { schoolId: child.teacher.schoolId },
    select: { taxRate: true },
  });
  const taxRate = schoolSettings?.taxRate ?? 0;

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((i) => i.menuItemId) },
      schoolId: child.teacher.schoolId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== items.length) {
    return NextResponse.json({ error: "One or more menu items are invalid" }, { status: 400 });
  }

  const subtotalCents = items.reduce((sum: number, item) => {
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
      deliveryDate: parsedDeliveryDate,
      status: "PENDING",
      subtotalCents,
      taxCents,
      totalCents,
      notes,
      items: {
        create: items.map((item) => {
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
