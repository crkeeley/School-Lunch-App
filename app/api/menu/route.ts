import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { menuItemSchema } from "@/lib/validations";
import { resolveScopedSchoolId } from "@/lib/school-scope";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const limitResult = await rateLimit({
    key: `menu:get:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many menu requests", limitResult);
  }

  const session = await getServerSession(authOptions);
  const role = session?.user?.role;
  const userId = session?.user?.id;
  const isTeacherOrAdmin = role === "TEACHER" || role === "ADMIN";
  const requestedSchoolId = new URL(req.url).searchParams.get("schoolId");

  const scopedSchoolId = await resolveScopedSchoolId({
    role,
    userId,
    requestedSchoolId,
  });

  if (!scopedSchoolId) {
    return NextResponse.json([]);
  }

  const items = await prisma.menuItem.findMany({
    where: {
      schoolId: scopedSchoolId,
      isAvailable: true,
      ...(isTeacherOrAdmin ? {} : { isFamilySize: false }),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `menu:create:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many menu update attempts", limitResult);
  }

  const parsed = menuItemSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid menu item payload" }, { status: 422 });
  }

  const body = parsed.data;
  const scopedSchoolId = await resolveScopedSchoolId({
    role: session.user.role,
    userId: session.user.id,
    requestedSchoolId: body.schoolId ?? null,
  });
  if (!scopedSchoolId) {
    return NextResponse.json({ error: "School scope required" }, { status: 400 });
  }

  const item = await prisma.menuItem.create({
    data: {
      schoolId: scopedSchoolId,
      name: body.name,
      description: body.description,
      price: Math.round(body.price * 100),
      category: body.category,
      imageUrl: body.imageUrl || null,
      isAvailable: body.isAvailable ?? true,
      isFamilySize: body.isFamilySize ?? false,
    },
  });
  return NextResponse.json(item);
}
