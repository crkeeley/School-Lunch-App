import { Role } from "@/types";
import { prisma } from "@/lib/prisma";

type ResolveSchoolScopeOptions = {
  role?: Role;
  userId?: string;
  requestedSchoolId?: string | null;
};

async function normalizeRequestedSchoolId(requestedSchoolId?: string | null) {
  if (!requestedSchoolId) {
    return null;
  }

  const school = await prisma.school.findUnique({
    where: { id: requestedSchoolId },
    select: { id: true },
  });

  return school?.id ?? null;
}

async function resolveSingleSchoolFallback() {
  const schools = await prisma.school.findMany({
    select: { id: true },
    take: 2,
    orderBy: { createdAt: "asc" },
  });

  if (schools.length !== 1) {
    return null;
  }

  return schools[0].id;
}

export async function resolveScopedSchoolId(options: ResolveSchoolScopeOptions): Promise<string | null> {
  if (options.role === "TEACHER" && options.userId) {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: options.userId },
      select: { schoolId: true },
    });
    const scoped = teacher?.schoolId ?? null;
    if (!scoped) {
      return null;
    }

    if (options.requestedSchoolId && options.requestedSchoolId !== scoped) {
      return null;
    }

    return scoped;
  }

  if (options.role === "PARENT" && options.userId) {
    const children = await prisma.child.findMany({
      where: { parentId: options.userId },
      select: {
        teacher: {
          select: { schoolId: true },
        },
      },
    });

    const schoolIds = Array.from(new Set(children.map((child) => child.teacher.schoolId)));
    if (schoolIds.length === 1) {
      const scoped = schoolIds[0];
      if (options.requestedSchoolId && options.requestedSchoolId !== scoped) {
        return null;
      }

      return scoped;
    }

    return null;
  }

  if (options.role === "ADMIN") {
    const requested = await normalizeRequestedSchoolId(options.requestedSchoolId);
    if (requested) {
      return requested;
    }

    return resolveSingleSchoolFallback();
  }

  const requested = await normalizeRequestedSchoolId(options.requestedSchoolId);
  if (requested) {
    return requested;
  }

  return resolveSingleSchoolFallback();
}