"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface Teacher {
  id: string;
  firstName: string;
  lastName: string;
  grade?: string;
  orders: { id: string }[];
}

export default function AdminDashboard() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [groups, setGroups] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  useEffect(() => {
    fetch(`/api/reports/by-teacher?date=${today}`)
      .then((r) => r.json())
      .then(setGroups);
    fetch("/api/teachers")
      .then((r) => r.json())
      .then(setTeachers);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
      <p className="text-gray-600 mb-6">Today's lunch orders — {format(new Date(), "EEEE, MMMM d, yyyy")}</p>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-gray-500 text-sm">Total Orders Today</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            {groups.reduce((sum: number, g: any) => sum + g.orders.length, 0)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-gray-500 text-sm">Classes with Orders</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{groups.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <p className="text-gray-500 text-sm">Revenue Today</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {formatCurrency(groups.reduce((sum: number, g: any) =>
              sum + g.orders.reduce((s: number, o: any) => s + o.totalCents, 0), 0)
            )}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Orders by Class</h2>
        <a
          href={`/api/reports/export?date=${today}`}
          className="text-sm bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Export All CSV
        </a>
      </div>

      {groups.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          No orders placed for today yet.
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group: any) => (
            <div key={group.teacher.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b border-gray-100">
                <div>
                  <p className="font-semibold text-gray-900">
                    {group.teacher.firstName} {group.teacher.lastName}
                    {group.teacher.grade ? ` — ${group.teacher.grade}` : ""}
                  </p>
                  <p className="text-sm text-gray-500">{group.orders.length} orders</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`/api/reports/export?date=${today}&teacherId=${group.teacher.id}`}
                    className="text-xs border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50"
                  >
                    CSV
                  </a>
                  <Link
                    href={`/admin/orders?teacherId=${group.teacher.id}&date=${today}`}
                    className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700"
                  >
                    View All
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {group.orders.map((order: any) => (
                  <div key={order.id} className="px-4 py-3 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900">
                        {order.child.firstName} {order.child.lastName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.items.map((i: any) => `${i.menuItem.name} ×${i.quantity}`).join(", ")}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700">{formatCurrency(order.totalCents)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
