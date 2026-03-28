import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendWelcomeEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({ where: { id: data.teacherId } });
    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          passwordHash,
          role: "PARENT",
        },
      });

      await tx.child.create({
        data: {
          parentId: newUser.id,
          teacherId: data.teacherId,
          firstName: data.childFirstName,
          lastName: data.childLastName,
        },
      });

      return newUser;
    });

    // Send welcome email (non-blocking)
    sendWelcomeEmail({ to: user.email!, name: user.name! }).catch(console.error);

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
