"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { format, parseISO } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface Order {
  id: string;
  deliveryDate: string;
  status: string;
  totalCents: number;
  child: { firstName: string; lastName: string };
  teacher: { firstName: string; lastName: string };
  items: { quantity: number; menuItem: { name: string } }[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  PAID: "bg-blue-100 text-blue-800",
  PREPARING: "bg-purple-100 text-purple-800",
  READY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [date, setDate] = useState(searchParams.get("date") ?? format(new Date(), "yyyy-MM-dd"));
  const teacherId = searchParams.get("teacherId");

  useEffect(() => {
    const params = new URLSearchParams({ date });
    if (teacherId) params.set("teacherId", teacherId);
    fetch(`/api/orders?${params.toString()}`)
      .then((r) => r.json())
      .then(setOrders);
  }, [date, teacherId]);

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex gap-3 items-center">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <a
            href={`/api/reports/export?date=${date}${teacherId ? `&teacherId=${teacherId}` : ""}`}
            className="text-sm border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Download CSV
          </a>
          <button
            onClick={handlePrint}
            className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            Print
          </button>
        </div>
      </div>

      {/* Print-only header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-2xl font-bold">Lunch Orders — {format(new Date(date), "MMMM d, yyyy")}</h1>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No orders for this date.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Student</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Teacher</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Items</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700">Total</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-700 print:hidden">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">
                    {order.child.firstName} {order.child.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.teacher.firstName} {order.teacher.lastName}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {order.items.map((i) => `${i.menuItem.name} ×${i.quantity}`).join(", ")}
                  </td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(order.totalCents)}</td>
                  <td className="px-4 py-3 print:hidden">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        @media print {
          nav, aside, button, a { display: none !important; }
          .print\\:hidden { display: none !important; }
          .hidden.print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
}
