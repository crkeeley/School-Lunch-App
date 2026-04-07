"use client";
import { useEffect, useState } from "react";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/utils";

interface Rule {
  id: string;
  daysOfWeek: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  child: { firstName: string; lastName: string; teacher: { firstName: string; lastName: string } };
  ruleItems: { quantity: number; menuItem: { name: string; price: number } }[];
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  teacher: { firstName: string; lastName: string };
}

interface OrderTemplate {
  id: string;
  childId: string;
  deliveryDate: string;
  totalCents: number;
  items: { menuItemId: string; quantity: number; menuItem: { name: string } }[];
}

const DAYS = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"];
const DAY_LABELS: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed", THURSDAY: "Thu", FRIDAY: "Fri",
};

export default function RecurringPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [orderTemplates, setOrderTemplates] = useState<OrderTemplate[]>([]);
  const [selectedChildId, setSelectedChildId] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>(["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY"]);
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const [rulesRes, childrenRes, ordersRes] = await Promise.all([
        fetch("/api/orders/recurring"),
        fetch("/api/children"),
        fetch("/api/orders"),
      ]);

      const [rulesData, childrenData, ordersData] = await Promise.all([
        rulesRes.json(),
        childrenRes.json(),
        ordersRes.json(),
      ]);

      setRules(rulesData);
      setChildren(childrenData);
      setOrderTemplates(ordersData);
      if (childrenData.length > 0) {
        setSelectedChildId(childrenData[0].id);
      }
    }

    load();
  }, []);

  async function deactivate(ruleId: string) {
    await fetch(`/api/orders/recurring?ruleId=${ruleId}`, { method: "DELETE" });
    setRules((prev) => prev.filter((r) => r.id !== ruleId));
  }

  function toggleDay(day: string) {
    setSelectedDays((prev) => {
      if (prev.includes(day)) return prev.filter((d) => d !== day);
      return [...prev, day];
    });
  }

  async function createRecurringFromOrder() {
    setError("");
    const selectedTemplate = orderTemplates.find((order) => order.id === selectedOrderId);

    if (!selectedChildId) {
      setError("Please select a child.");
      return;
    }
    if (!selectedTemplate) {
      setError("Please choose an order template.");
      return;
    }
    if (selectedDays.length === 0) {
      setError("Please select at least one day.");
      return;
    }

    setCreating(true);
    const res = await fetch("/api/orders/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        childId: selectedChildId,
        startDate,
        endDate: endDate || undefined,
        daysOfWeek: selectedDays,
        items: selectedTemplate.items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not create recurring order.");
      setCreating(false);
      return;
    }

    const refreshed = await fetch("/api/orders/recurring");
    const refreshedData = await refreshed.json();
    setRules(refreshedData);
    setSelectedOrderId("");
    setCreating(false);
  }

  const templatesForChild = orderTemplates
    .filter((order) => order.childId === selectedChildId && order.items.length > 0)
    .sort((a, b) => new Date(b.deliveryDate).getTime() - new Date(a.deliveryDate).getTime())
    .slice(0, 8);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Recurring Orders</h1>
      <p className="text-gray-600 mb-6">Set it once and your child&apos;s lunch is automatically ordered on the days you choose.</p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">Create Recurring from Existing Order</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Child</label>
            <select
              value={selectedChildId}
              onChange={(e) => {
                setSelectedChildId(e.target.value);
                setSelectedOrderId("");
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
            >
              {children.length === 0 ? <option value="">No children found</option> : null}
              {children.map((child) => (
                <option key={child.id} value={child.id}>
                  {child.firstName} {child.lastName} ({child.teacher.firstName} {child.teacher.lastName})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date (Optional)</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Repeat On</p>
          <div className="flex gap-2 flex-wrap">
            {DAYS.map((day) => {
              const active = selectedDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                    active ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"
                  }`}
                >
                  {DAY_LABELS[day]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Pick an Existing Order</p>
          {templatesForChild.length === 0 ? (
            <p className="text-sm text-gray-500">No previous orders found for this child yet.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {templatesForChild.map((order) => (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`w-full text-left border rounded-lg p-3 transition-colors ${
                    selectedOrderId === order.id ? "border-green-500 bg-green-50" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {format(new Date(order.deliveryDate), "EEE, MMM d, yyyy")} · {formatCurrency(order.totalCents)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {order.items.map((item) => `${item.menuItem.name} ×${item.quantity}`).join(", ")}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

        <button
          type="button"
          onClick={createRecurringFromOrder}
          disabled={creating || templatesForChild.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Recurring Order"}
        </button>
      </div>

      {rules.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <p className="text-4xl mb-3">🔄</p>
          <p className="font-medium">No recurring orders set up yet.</p>
          <p className="text-sm mt-1">Use the picker above to create one from a previous order.</p>
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
                    <p className="text-sm text-gray-500">{rule.child.teacher.firstName} {rule.child.teacher.lastName}&apos;s class</p>
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
