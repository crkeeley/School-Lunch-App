"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";

interface OrderItem {
  quantity: number;
  menuItem: { name: string };
}

interface StudentOrder {
  id: string;
  totalCents: number;
  child: { firstName: string; lastName: string };
  items: OrderItem[];
}

interface TeacherGroup {
  teacher: { id: string; firstName: string; lastName: string };
  orders: StudentOrder[];
}

export default function TeacherDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [groups, setGroups] = useState<TeacherGroup[]>([]);

  useEffect(() => {
    fetch(`/api/reports/by-teacher?date=${today}`)
      .then((r) => r.json())
      .then(setGroups);
  }, [today]);

  const myClass = groups[0];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Class Orders</h1>
          <p className="text-gray-600 text-sm">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex gap-3">
          {myClass && (
            <a
              href={`/api/reports/export?date=${today}`}
              className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
            >
              Download CSV
            </a>
          )}
          <button onClick={() => window.print()} className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200">
            Print List
          </button>
          <Link href="/teacher/order" className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
            + Place My Order
          </Link>
        </div>
      </div>

      {!myClass || myClass.orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No student orders for today.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-green-50">
            <p className="font-semibold text-green-900">{myClass.orders.length} orders for today</p>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Items</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {myClass.orders.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3 font-medium">
                    {order.child.firstName} {order.child.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items.map((i) => `${i.menuItem.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(order.totalCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`@media print { nav, aside, button, a, .no-print { display: none !important; } }`}</style>
    </div>
  );
}
