import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DropdownAuthMenu } from "@/components/layout/DropdownAuthMenu";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "TEACHER") redirect("/dashboard");

  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex-shrink-0 fixed h-full">
        <div className="p-5 border-b border-gray-100">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🍎</span>
            <span className="font-bold text-green-700">School Lunch</span>
          </Link>
          <p className="text-xs text-gray-500 mt-1">{isAdmin ? "Admin" : "Teacher"} Portal</p>
        </div>
        <nav className="p-3 space-y-1">
          {isAdmin ? (
            <>
              <Link href="/admin" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                📊 Dashboard
              </Link>
              <Link href="/admin/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                📋 Orders
              </Link>
              <Link href="/admin/menu" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                🍽️ Menu
              </Link>
              <Link href="/admin/teachers" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                👩‍🏫 Teachers
              </Link>
            </>
          ) : (
            <>
              <Link href="/teacher" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                📋 My Class Orders
              </Link>
              <Link href="/teacher/order" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 text-sm font-medium">
                🍽️ Place My Order
              </Link>
            </>
          )}
        </nav>
        <div className="absolute bottom-4 left-0 right-0 px-3">
          <DropdownAuthMenu />
        </div>
      </aside>
      <main className="flex-1 ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
