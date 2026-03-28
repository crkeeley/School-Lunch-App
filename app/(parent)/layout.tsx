import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DropdownAuthMenu } from "@/components/layout/DropdownAuthMenu";
import { CartButton } from "@/components/order/CartButton";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if ((session.user as any).role === "ADMIN") redirect("/admin");
  if ((session.user as any).role === "TEACHER") redirect("/teacher");

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="flex items-center gap-2">
                <span className="text-xl">🍎</span>
                <span className="font-bold text-green-700">School Lunch</span>
              </Link>
              <div className="hidden md:flex gap-1">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  Dashboard
                </Link>
                <Link href="/orders" className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  My Orders
                </Link>
                <Link href="/recurring" className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  Recurring
                </Link>
                <Link href="/account" className="text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 text-sm font-medium">
                  Account
                </Link>
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
