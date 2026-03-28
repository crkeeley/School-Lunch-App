"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { format, parseISO } from "date-fns";

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

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetch("/api/orders").then((r) => r.json()).then(setOrders);
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16 text-gray-500">No orders yet.</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-semibold text-gray-900">
                    {format(parseISO(order.deliveryDate), "EEEE, MMM d, yyyy")}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.child.firstName} {order.child.lastName} · {order.teacher.firstName} {order.teacher.lastName}'s class
                  </p>
                </div>
                <div className="text-right">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] ?? "bg-gray-100 text-gray-800"}`}>
                    {order.status}
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">{formatCurrency(order.totalCents)}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {order.items.map((item, i) => (
                  <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                    {item.menuItem.name} × {item.quantity}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
