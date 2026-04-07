import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { teacherCreateSchema } from "@/lib/validations";
import { resolveScopedSchoolId } from "@/lib/school-scope";
import { NextRequest } from "next/server";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  try {
    const limitResult = await rateLimit({
      key: `teachers:get:${getClientIp(req)}`,
      limit: 120,
      windowSec: 60,
    });
    if (!limitResult.success) {
      return rateLimitExceededResponse("Too many teacher requests", limitResult);
    }

    const schoolId = await resolveScopedSchoolId({
      requestedSchoolId: new URL(req.url).searchParams.get("schoolId"),
    });

    if (!schoolId) {
      return NextResponse.json([]);
    }

    const teachers = await prisma.teacher.findMany({
      where: { isActive: true, schoolId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        grade: true,
        roomNumber: true,
      },
      orderBy: [{ grade: "asc" }, { lastName: "asc" }],
    });
    return NextResponse.json(teachers);
  } catch {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `teachers:create:${session.user.id}:${getClientIp(req)}`,
    limit: 20,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many teacher create attempts", limitResult);
  }

  try {
    const parsed = teacherCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid teacher payload" }, { status: 422 });
    }

    const { email, firstName, lastName, grade, roomNumber, password } = parsed.data;
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password, 12);

    const schoolId = await resolveScopedSchoolId({
      role: session.user.role,
      userId: session.user.id,
      requestedSchoolId: parsed.data.schoolId ?? null,
    });
    if (!schoolId) return NextResponse.json({ error: "School scope required" }, { status: 400 });

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, name: `${firstName} ${lastName}`, passwordHash, role: "TEACHER", emailVerified: new Date() },
      });
      await tx.teacher.create({
        data: { userId: newUser.id, schoolId, firstName, lastName, grade, roomNumber },
      });
      return newUser;
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}
