import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const teachers = await prisma.teacher.findMany({
      where: { isActive: true },
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
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch teachers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { email, firstName, lastName, grade, roomNumber, password } = body;
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash(password || "changeme123", 12);

    const school = await prisma.school.findFirst();
    if (!school) return NextResponse.json({ error: "No school configured" }, { status: 400 });

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: { email, name: `${firstName} ${lastName}`, passwordHash, role: "TEACHER" },
      });
      await tx.teacher.create({
        data: { userId: newUser.id, schoolId: school.id, firstName, lastName, grade, roomNumber },
      });
      return newUser;
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create teacher" }, { status: 500 });
  }
}
