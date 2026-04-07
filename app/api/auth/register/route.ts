import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { sendVerificationEmail } from "@/lib/email";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";

export async function POST(req: NextRequest) {
  try {
    const isDev = process.env.NODE_ENV !== "production";
    const ipAddress = getClientIp(req);
    const limitResult = await rateLimit({
      key: `auth:register:${ipAddress}`,
      limit: isDev ? 30 : 5,
      windowSec: isDev ? 60 : 900,
    });

    if (!limitResult.success) {
      return rateLimitExceededResponse("Too many registration attempts", limitResult);
    }

    const body = await req.json();
    const data = registerSchema.parse(body);

    // Delete any unverified account for this email older than 15 minutes so the
    // user can re-register after the verification window expires.
    const staleThreshold = new Date(Date.now() - 15 * 60 * 1000);
    await prisma.user.deleteMany({
      where: { email: data.email, emailVerified: null, createdAt: { lt: staleThreshold } },
    });

    // Background sweep: purge ALL stale unverified accounts to keep the DB clean.
    prisma.user
      .deleteMany({ where: { emailVerified: null, createdAt: { lt: staleThreshold } } })
      .catch(console.error);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Registration could not be completed" }, { status: 400 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: data.teacherId },
      select: { id: true, isActive: true },
    });
    if (!teacher) {
      return NextResponse.json({ error: "Registration could not be completed" }, { status: 400 });
    }

    if (!teacher.isActive) {
      return NextResponse.json({ error: "Registration could not be completed" }, { status: 400 });
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

      // Generate email verification token (24 hour expiry)
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await prisma.emailVerificationToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      // Send verification email (non-blocking)
      const verifyUrl = `${process.env.NEXTAUTH_URL}/api/auth/verify-email?token=${token}`;
      sendVerificationEmail({ to: user.email!, name: user.name!, verifyUrl }).catch(console.error);

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "name" in error && error.name === "ZodError" && "errors" in error) {
      return NextResponse.json({ error: error.errors }, { status: 422 });
    }

    logger.error("register_failed", {
      error: error instanceof Error ? error.message : "unknown",
    });
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
