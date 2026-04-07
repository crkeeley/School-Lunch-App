import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  const base = req.nextUrl.origin;

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=invalid_token", base));
  }

  const record = await prisma.emailVerificationToken.findUnique({
    where: { token },
  });

  if (!record || record.expiresAt < new Date()) {
    // Clean up expired token if it exists
    if (record) {
      await prisma.emailVerificationToken.delete({ where: { token } });
    }
    return NextResponse.redirect(new URL("/login?error=invalid_token", base));
  }

  await prisma.user.update({
    where: { id: record.userId },
    data: { emailVerified: new Date() },
  });

  await prisma.emailVerificationToken.delete({ where: { token } });

  return NextResponse.redirect(new URL("/login?verified=1", base));
}
