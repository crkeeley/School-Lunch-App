import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { childSchema } from "@/lib/validations";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `children:get:${session.user.id}:${getClientIp(req)}`,
    limit: 120,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many requests", limitResult);
  }

  const children = await prisma.child.findMany({
    where: { parentId: session.user.id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, grade: true, roomNumber: true } },
    },
  });
  return NextResponse.json(children);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARENT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `children:create:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many child creation attempts", limitResult);
  }

  const parsed = childSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid child payload" }, { status: 422 });
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: parsed.data.teacherId },
    select: { id: true, isActive: true },
  });
  if (!teacher || !teacher.isActive) {
    return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
  }

  const child = await prisma.child.create({
    data: {
      parentId: session.user.id,
      teacherId: parsed.data.teacherId,
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      allergies: parsed.data.allergies,
      notes: parsed.data.notes,
    },
    include: { teacher: true },
  });
  return NextResponse.json(child);
}
