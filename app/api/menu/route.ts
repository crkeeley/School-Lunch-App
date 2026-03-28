import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role;
  const isTeacherOrAdmin = role === "TEACHER" || role === "ADMIN";

  const school = await prisma.school.findFirst();
  if (!school) return NextResponse.json([]);

  const items = await prisma.menuItem.findMany({
    where: {
      schoolId: school.id,
      isAvailable: true,
      ...(isTeacherOrAdmin ? {} : { isFamilySize: false }),
    },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json();
  const school = await prisma.school.findFirst();
  if (!school) return NextResponse.json({ error: "No school" }, { status: 400 });

  const item = await prisma.menuItem.create({
    data: {
      schoolId: school.id,
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
