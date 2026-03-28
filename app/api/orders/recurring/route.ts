import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rules = await prisma.recurringOrderRule.findMany({
    where: { child: { parentId: (session.user as any).id }, isActive: true },
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

  const body = await req.json();
  const { childId, startDate, endDate, daysOfWeek, items } = body;

  const child = await prisma.child.findFirst({
    where: { id: childId, parentId: (session.user as any).id },
  });
  if (!child) return NextResponse.json({ error: "Child not found" }, { status: 404 });

  const rule = await prisma.recurringOrderRule.create({
    data: {
      parentId: (session.user as any).id,
      childId,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      daysOfWeek: JSON.stringify(daysOfWeek),
      ruleItems: {
        create: items.map((item: any) => ({
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

  const { searchParams } = new URL(req.url);
  const ruleId = searchParams.get("ruleId");
  if (!ruleId) return NextResponse.json({ error: "Missing ruleId" }, { status: 400 });

  await prisma.recurringOrderRule.updateMany({
    where: { id: ruleId, parentId: (session.user as any).id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
