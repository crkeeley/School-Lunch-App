import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getClientIp, rateLimit, rateLimitExceededResponse } from "@/lib/rate-limit";

const fakeConfirmSchema = z.object({
  orderIds: z.array(z.string().min(1)).min(1),
});

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limitResult = await rateLimit({
    key: `payments:fake-confirm:${session.user.id}:${getClientIp(req)}`,
    limit: 30,
    windowSec: 60,
  });
  if (!limitResult.success) {
    return rateLimitExceededResponse("Too many requests", limitResult);
  }

  const parsed = fakeConfirmSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 422 });
  }

  await prisma.order.updateMany({
    where: { id: { in: parsed.data.orderIds }, status: "PENDING" },
    data: { status: "PAID" },
  });

  return NextResponse.json({ success: true });
}
