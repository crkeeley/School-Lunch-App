import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { teacherOrderSchema } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { resolveScopedSchoolId } from "@/lib/school-scope";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = session.user.role;
  if (role !== "TEACHER" && role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `teacher-orders:create:${session.user.id}:${getClientIp(req)}`,
    limit: 20,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many order attempts", limitResult);
  }

  const parsed = teacherOrderSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid order payload" }, { status: 422 });
  }

  const userId = session.user.id;
  const parsedDeliveryDate = new Date(parsed.data.deliveryDate);
  if (Number.isNaN(parsedDeliveryDate.getTime())) {
    return NextResponse.json({ error: "Invalid delivery date" }, { status: 422 });
  }

  const schoolId = await resolveScopedSchoolId({
    role,
    userId,
    requestedSchoolId: parsed.data.schoolId ?? null,
  });
  if (!schoolId) {
    return NextResponse.json({ error: "School scope required" }, { status: 400 });
  }

  const menuItems = await prisma.menuItem.findMany({
    where: {
      id: { in: parsed.data.items.map((i) => i.menuItemId) },
      schoolId,
      isAvailable: true,
    },
  });

  if (menuItems.length !== parsed.data.items.length) {
    return NextResponse.json({ error: "One or more menu items are invalid" }, { status: 400 });
  }

  const subtotalCents = parsed.data.items.reduce((sum: number, item) => {
    const menuItem = menuItems.find((m) => m.id === item.menuItemId);
    return sum + (menuItem?.price ?? 0) * item.quantity;
  }, 0);

  const order = await prisma.teacherOrder.create({
    data: {
      userId,
      deliveryDate: parsedDeliveryDate,
      subtotalCents,
      totalCents: subtotalCents,
      notes: parsed.data.notes,
      items: {
        create: parsed.data.items.map((item) => {
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
