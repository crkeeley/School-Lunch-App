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

interface RecurringRule {
  id: string;
  startDate: string;
  endDate?: string;
  daysOfWeek: string;
  child: { firstName: string; lastName: string };
  ruleItems: { quantity: number; menuItem: { name: string } }[];
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STATUS_COLORS: Record<string, string> = {
  PENDING:    "bg-yellow-100 text-yellow-700 border-yellow-200",
  PAID:       "bg-blue-100 text-blue-700 border-blue-200",
  PREPARING:  "bg-orange-100 text-orange-700 border-orange-200",
  READY:      "bg-green-100 text-green-700 border-green-200",
  DELIVERED:  "bg-gray-100 text-gray-600 border-gray-200",
  CANCELLED:  "bg-red-100 text-red-600 border-red-200",
};

export default function DashboardPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [orders, setOrders] = useState<Order[]>([]);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);

  const month = format(currentDate, "yyyy-MM");

  useEffect(() => {
    Promise.all([
      fetch(`/api/orders?month=${month}`).then((r) => r.json()),
      fetch("/api/orders/recurring").then((r) => r.json()),
    ]).then(([ordersData, recurringData]) => {
      setOrders(ordersData);
      setRecurringRules(recurringData);
    });
  }, [month]);

  const days = eachDayOfInterval({ start: startOfMonth(currentDate), end: endOfMonth(currentDate) });
  const firstDayOffset = getDay(startOfMonth(currentDate));

  function getOrdersForDay(date: Date) {
    const dateStr = format(date, "yyyy-MM-dd");
    return orders.filter((o) => o.deliveryDate.startsWith(dateStr));
  }

  function getRecurringForDay(date: Date) {
    const dayStart = startOfDay(date);
    const dayKey = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getDay()];

    return recurringRules.filter((rule) => {
      let ruleDays: string[] = [];
      try {
        const parsed = JSON.parse(rule.daysOfWeek);
        if (Array.isArray(parsed)) {
          ruleDays = parsed.filter((day): day is string => typeof day === "string");
        }
      } catch {
        return false;
      }

      if (!ruleDays.includes(dayKey)) return false;

      const ruleStart = startOfDay(new Date(rule.startDate));
      if (Number.isNaN(ruleStart.getTime())) return false;
      if (dayStart < ruleStart) return false;

      if (rule.endDate) {
        const ruleEnd = startOfDay(new Date(rule.endDate));
        if (!Number.isNaN(ruleEnd.getTime()) && dayStart > ruleEnd) return false;
      }

      return true;
    });
  }

  function handleDayClick(date: Date) {
    if (date.getDay() === 0 || date.getDay() === 6) return;
    if (isBefore(date, startOfDay(new Date()))) return;
    router.push(`/order/${format(date, "yyyy-MM-dd")}`);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">
            📅 Lunch Calendar
          </h1>
          <p className="text-gray-500 font-semibold mt-1">Click any school day to order lunch</p>
        </div>
        <div className="flex items-center gap-2 bg-white border-2 border-orange-200 rounded-2xl px-2 py-1">
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
            className="w-9 h-9 hover:bg-orange-50 rounded-xl transition-colors font-black text-orange-500 flex items-center justify-center text-lg"
          >
            ‹
          </button>
          <span className="font-black text-gray-800 min-w-[150px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </span>
          <button
            onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
            className="w-9 h-9 hover:bg-orange-50 rounded-xl transition-colors font-black text-orange-500 flex items-center justify-center text-lg"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-3xl shadow-sm border-2 border-orange-100 overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-xs font-black text-gray-500 py-3 bg-orange-50 border-b-2 border-orange-100 uppercase tracking-wide">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOffset }).map((_, i) => (
            <div key={`empty-${i}`} className="border-b border-r border-gray-100 min-h-[90px]" />
          ))}
          {days.map((day) => {
            const isWeekend = day.getDay() === 0 || day.getDay() === 6;
            const isPast    = isBefore(day, startOfDay(new Date()));
            const dayOrders = getOrdersForDay(day);
            const dayRecurring = getRecurringForDay(day);
            const isClickable = !isWeekend && !isPast;
            const today = isToday(day);

            return (
              <div
                key={day.toISOString()}
                onClick={() => isClickable && handleDayClick(day)}
                className={`border-b border-r border-gray-100 min-h-[90px] p-2 transition-all
                  ${isClickable ? "cursor-pointer hover:bg-orange-50 hover:scale-[0.98]" : ""}
                  ${isWeekend ? "bg-gray-50" : ""}
                  ${isPast && !isWeekend ? "opacity-40" : ""}
                  ${today ? "bg-orange-50 ring-2 ring-inset ring-orange-400" : ""}
                `}
              >
                <span
                  className={`text-sm font-black inline-flex w-7 h-7 items-center justify-center rounded-full
                    ${today
                      ? "bg-orange-500 text-white shadow-md"
                      : isWeekend
                      ? "text-gray-400"
                      : "text-gray-800"}
                  `}
                >
                  {format(day, "d")}
                </span>

                <div className="mt-1 space-y-1">
                  {dayOrders.map((o) => (
                    <div
                      key={o.id}
                      className={`text-[10px] font-bold border rounded-lg px-1.5 py-0.5 truncate ${STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"}`}
                    >
                      🧒 {o.child.firstName}: {o.items[0]?.menuItem.name}{o.items.length > 1 ? ` +${o.items.length - 1}` : ""}
                    </div>
                  ))}

                  {dayRecurring
                    .filter((rule) => !dayOrders.some((order) => order.child.firstName === rule.child.firstName && order.child.lastName === rule.child.lastName))
                    .slice(0, 2)
                    .map((rule) => (
                      <div
                        key={`recurring-${rule.id}`}
                        className="text-[10px] font-bold border rounded-lg px-1.5 py-0.5 truncate bg-purple-100 text-purple-700 border-purple-200"
                      >
                        🔁 {rule.child.firstName}: {rule.ruleItems[0]?.menuItem.name}{rule.ruleItems.length > 1 ? ` +${rule.ruleItems.length - 1}` : ""}
                      </div>
                    ))}

                  {dayRecurring.length > 2 && (
                    <div className="text-[10px] font-bold text-purple-700 px-1">+{dayRecurring.length - 2} more recurring</div>
                  )}

                  {isClickable && dayOrders.length === 0 && (
                    <div className="text-[10px] text-orange-300 font-bold opacity-0 group-hover:opacity-100 mt-1">
                      + Order
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-orange-500 inline-block" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-lg bg-yellow-100 border border-yellow-300 inline-block" /> Ordered
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-lg bg-purple-100 border border-purple-300 inline-block" /> Recurring
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-gray-200 inline-block" /> Weekend / Past
        </span>
      </div>
    </div>
  );
}
