import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { recurringRuleSchema } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `orders:recurring:get:${session.user.id}:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many recurring order requests", limitResult);
  }

  const rules = await prisma.recurringOrderRule.findMany({
    where: { child: { parentId: session.user.id }, isActive: true },
    include: {
      child: { include: { teacher: true } },
      ruleItems: { include: { menuItem: true } },
    },
  });
  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `orders:recurring:create:${session.user.id}:${getClientIp(req)}`,
    limit: 10,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many recurring order attempts", limitResult);
  }

  const parsed = recurringRuleSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid recurring payload" }, { status: 422 });
  }

  const { childId, startDate, endDate, daysOfWeek, items } = parsed.data;
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : null;
  if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
    return NextResponse.json({ error: "Invalid date range" }, { status: 422 });
  }
  if (end && end < start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 422 });
  }

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: session.user.id },
    select: { id: true, teacher: { select: { schoolId: true } } },
  });
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const validItems = await prisma.menuItem.findMany({
    where: {
      id: { in: items.map((item) => item.menuItemId) },
      schoolId: child.teacher.schoolId,
      isAvailable: true,
    },
    select: { id: true },
  });

  if (validItems.length !== items.length) {
    return NextResponse.json({ error: "One or more menu items are invalid" }, { status: 400 });
  }

  const rule = await prisma.recurringOrderRule.create({
    data: {
      parentId: session.user.id,
      childId,
      startDate: start,
      endDate: end,
      daysOfWeek: JSON.stringify(daysOfWeek),
      ruleItems: {
        create: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      },
    },
    include: { ruleItems: { include: { menuItem: true } } },
  });

  return NextResponse.json(rule);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `orders:recurring:delete:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many recurring order updates", limitResult);
  }

  const { searchParams } = new URL(req.url);
  const ruleId = searchParams.get("ruleId");
  if (!ruleId) return NextResponse.json({ error: "Missing ruleId" }, { status: 400 });

  await prisma.recurringOrderRule.updateMany({
    where: { id: ruleId, parentId: session.user.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
