import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DropdownAuthMenu } from "@/components/layout/DropdownAuthMenu";
import { CartButton } from "@/components/order/CartButton";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");
  if (session.user.role === "TEACHER") redirect("/teacher");

  return (
    <div className="min-h-screen" style={{ background: "#fffbf5" }}>
      <nav className="bg-white border-b-4 border-orange-400 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-2xl">🍱</span>
                <span className="font-black text-orange-500 text-lg tracking-tight">LunchBox</span>
              </Link>
              <div className="hidden md:flex gap-1">
                {[
                  { href: "/dashboard", label: "📅 Calendar" },
                  { href: "/orders",    label: "📋 My Orders" },
                  { href: "/recurring", label: "🔄 Recurring" },
                  { href: "/account",   label: "👤 Account" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="text-gray-600 hover:text-orange-500 px-3 py-1.5 rounded-xl hover:bg-orange-50 text-sm font-bold transition-colors"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CartButton />
              <DropdownAuthMenu />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
