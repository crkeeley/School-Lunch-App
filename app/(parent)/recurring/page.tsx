"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";

interface Rule {
  id: string;
  daysOfWeek: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  child: { firstName: string; lastName: string; teacher: { firstName: string; lastName: string } };
  ruleItems: { quantity: number; menuItem: { name: string; price: number } }[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri",
};

export default function RecurringPage() {
  const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => {
    fetch("/api/orders/recurring").then((r) => r.json()).then(setRules);
  }, []);

  async function deactivate(ruleId: string) {
    await fetch(`/api/orders/recurring?ruleId=${ruleId}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recurring Orders</h1>
      <p className="text-gray-600 mb-6">Set it once and your child's lunch is automatically ordered on the days you choose.</p>

      {rules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p className="text-4xl mb-3">🔄</p>
          <p className="font-medium">No recurring orders set up yet.</p>
          <p className="text-sm mt-1">Go to the order page and click "Set as Recurring" after adding items.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map((rule) => {
            const days: string[] = JSON.parse(rule.daysOfWeek);
            return (
              <div key={rule.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">
                      {rule.child.firstName} {rule.child.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{rule.child.teacher.firstName} {rule.child.teacher.lastName}'s class</p>
                  </div>
                  <button
                    onClick={() => deactivate(rule.id)}
                    className="text-red-500 text-sm hover:underline"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-1 mb-3">
                  {DAYS.map((d) => (
                    <span
                      key={d}
                      className={`text-xs px-2 py-1 rounded font-medium ${
                        days.includes(d) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {DAY_LABELS[d]}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2">
                  {rule.ruleItems.map((item, i) => (
                    <span key={i} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                      {item.menuItem.name} × {item.quantity}
                    </span>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-400">
                  From {format(new Date(rule.startDate), "MMM d, yyyy")}
                  {rule.endDate ? ` to ${format(new Date(rule.endDate), "MMM d, yyyy")}` : " (ongoing)"}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
