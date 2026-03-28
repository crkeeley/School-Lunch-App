"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isToday, isBefore, startOfDay } from "date-fns";

interface Order {
  id: string;
  deliveryDate: string;
  status: string;
  child: { firstName: string; lastName: string };
  items: { menuItem: { name: string } }[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function DashboardPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);

  const month = format(currentDate, "yyyy-MM");

  useEffect(() => {
    fetch(`/api/orders?month=${month}`)
      .then((r) => r.json())
      .then(setOrders);
  }, [month]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate),
  });

  const firstDayOffset = getDay(startOfMonth(currentDate));

  function getOrdersForDay(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return orders.filter((o) => o.deliveryDate.startsWith(dateStr));
  }

  function handleDayClick(date: Date) {
    if (date.getDay() === 0 || date.getDay() === 6) return;
    if (isBefore(date, startOfDay(new Date()))) return;
    router.push(`/order/${format(date, "yyyy-MM-dd")}`);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lunch Calendar</h1>
          <p className="text-gray-600 text-sm mt-1">Click any school day to place an order</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            ←
          </button>
          <span className="font-semibold text-gray-900 min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-500 py-3 bg-gray-50 border-b border-gray-100">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-100 min-h-[80px]" />
          ))}
          {days.map((day) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isPast = isBefore(day, startOfDay(new Date()));
            const dayOrders = getOrdersForDay(day);
            const isClickable = !isWeekend && !isPast;

            return (
              <div
                key={day.toISOString()}
                onClick={() => isClickable && handleDayClick(day)}
                className={`border-b border-r border-gray-100 min-h-[80px] p-2 transition-colors
                  ${isClickable ? "cursor-pointer hover:bg-green-50" : ""}
                  ${isWeekend ? "bg-gray-50" : ""}
                  ${isPast && !isWeekend ? "bg-gray-50 opacity-60" : ""}
                  ${isToday(day) ? "ring-2 ring-inset ring-green-400" : ""}
                `}
              >
                <span
                  className={`text-sm font-medium inline-flex w-7 h-7 items-center justify-center rounded-full
                    ${isToday(day) ? "bg-green-600 text-white" : "text-gray-700"}
                  `}
                >
                  {format(day, "d")}
                </span>
                {dayOrders.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayOrders.map((o) => (
                      <div
                        key={o.id}
                        className="text-xs bg-green-100 text-green-800 rounded px-1.5 py-0.5 truncate"
                      >
                        {o.child.firstName}: {o.items[0]?.menuItem.name}
                        {o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-100 border border-green-300 inline-block" /> Has order</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full ring-2 ring-green-400 inline-block" /> Today</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-200 inline-block" /> Weekend / Past</span>
      </div>
    </div>
  );
}
