import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const children = await prisma.child.findMany({
    where: { parentId: (session.user as any).id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, grade: true, roomNumber: true } },
    },
  });
  return NextResponse.json(children);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const child = await prisma.child.create({
    data: {
      parentId: (session.user as any).id,
      teacherId: body.teacherId,
      firstName: body.firstName,
      lastName: body.lastName,
      allergies: body.allergies,
      notes: body.notes,
    },
    include: { teacher: true },
  });
  return NextResponse.json(child);
}
