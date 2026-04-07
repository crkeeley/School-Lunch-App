import { NextAuthOptions, Session } from "next-auth";
import { Adapter } from "next-auth/adapters";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";
import { rateLimit } from "./rate-limit";
import { Role } from "@/types";

type AuthorizedUser = {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  teacherId: string | null;
};

function toRole(value: string): Role | null {
  if (value === "PARENT" || value === "TEACHER" || value === "ADMIN") {
    return value;
  }

  return null;
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        const forwarded = req?.headers?.["x-forwarded-for"];
        const rawIp = Array.isArray(forwarded) ? forwarded[0] : forwarded;
        const ipAddress = rawIp?.split(",")[0]?.trim() ?? "unknown";

        const limitResult = await rateLimit({
          key: `auth:login:${ipAddress}:${credentials.email.toLowerCase()}`,
          limit: 5,
          windowSec: 900,
        });

        if (!limitResult.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { teacher: true },
        });
        if (!user || !user.passwordHash) return null;
        const role = toRole(user.role);
        if (!role) return null;
        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) return null;

        // Require email verification for parent accounts
        if (role === "PARENT" && !user.emailVerified) {
          throw new Error("EmailNotVerified");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role,
          teacherId: user.teacher?.id ?? null,
        } satisfies AuthorizedUser;
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const authorizedUser = user as typeof user & Pick<AuthorizedUser, "role" | "teacherId">;
        token.role = authorizedUser.role;
        token.teacherId = authorizedUser.teacherId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? session.user.id;
        session.user.role = token.role;
        session.user.teacherId = token.teacherId;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export function requireRole(session: Session | null, roles: Role[]) {
  if (!session || !roles.includes(session.user?.role)) {
    throw new Error("Unauthorized");
  }
}
