"use client";
import { useEffect, useState } from "react";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  isFamilySize: boolean;
}

export default function TeacherOrderPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [deliveryDate, setDeliveryDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenuItems);
  }, []);

  function addToCart(itemId: string) {
    setCart((prev) => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
  }
  function updateQty(itemId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => {
        const next = { ...prev };
        delete next[itemId];
        return next;
      });
    } else {
      setCart((prev) => ({ ...prev, [itemId]: qty }));
    }
  }

  const cartItems = Object.entries(cart).map(([id, qty]) => ({
    item: menuItems.find((m) => m.id === id)!,
    quantity: qty,
  })).filter((c) => c.item);

  const total = cartItems.reduce((sum, c) => sum + c.item.price * c.quantity, 0);

  async function handleSubmit() {
    const res = await fetch("/api/teacher-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deliveryDate,
        notes,
        items: cartItems.map((c) => ({ menuItemId: c.item.id, quantity: c.quantity })),
      }),
    });
    if (res.ok) setSubmitted(true);
  }

  const familyItems = menuItems.filter((m) => m.isFamilySize);
  const regularItems = menuItems.filter((m) => !m.isFamilySize);

  if (submitted) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Order Submitted!</h2>
        <p className="text-gray-600">Your lunch order for {format(new Date(deliveryDate), "MMM d")} has been placed.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Place My Order</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date</label>
        <input
          type="date"
          value={deliveryDate}
          onChange={(e) => setDeliveryDate(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
        />
      </div>

      {familyItems.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Family Size Options <span className="text-sm font-normal text-green-700 bg-green-50 px-2 py-0.5 rounded-full">Teachers Only</span></h2>
          <div className="grid grid-cols-2 gap-4">
            {familyItems.map((item) => (
              <MenuCard key={item.id} item={item} qty={cart[item.id] ?? 0} onAdd={() => addToCart(item.id)} onUpdate={(q) => updateQty(item.id, q)} />
            ))}
          </div>
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Regular Menu</h2>
        <div className="grid grid-cols-2 gap-4">
          {regularItems.map((item) => (
            <MenuCard key={item.id} item={item} qty={cart[item.id] ?? 0} onAdd={() => addToCart(item.id)} onUpdate={(q) => updateQty(item.id, q)} />
          ))}
        </div>
      </div>

      {cartItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h2 className="font-semibold text-gray-800 mb-3">Order Summary</h2>
          <div className="space-y-2 mb-4">
            {cartItems.map((c) => (
              <div key={c.item.id} className="flex justify-between text-sm text-gray-700">
                <span>{c.item.name} × {c.quantity}</span>
                <span>{formatCurrency(c.item.price * c.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-3 flex justify-between font-semibold mb-4">
            <span>Total</span>
            <span className="text-green-700">{formatCurrency(total)}</span>
          </div>
          <textarea
            placeholder="Special notes or instructions..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
            rows={2}
          />
          <button
            onClick={handleSubmit}
            className="w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700"
          >
            Submit Order
          </button>
        </div>
      )}
    </div>
  );
}

function MenuCard({ item, qty, onAdd, onUpdate }: { item: MenuItem; qty: number; onAdd: () => void; onUpdate: (q: number) => void }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex justify-between mb-1">
        <p className="font-semibold text-gray-900">{item.name}</p>
        <span className="text-green-700 font-semibold">{formatCurrency(item.price)}</span>
      </div>
      {item.description && <p className="text-xs text-gray-500 mb-3">{item.description}</p>}
      {qty === 0 ? (
        <button onClick={onAdd} className="w-full bg-green-600 text-white py-1.5 rounded-lg text-sm hover:bg-green-700">Add</button>
      ) : (
        <div className="flex items-center gap-3 justify-center">
          <button onClick={() => onUpdate(qty - 1)} className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center">−</button>
          <span className="font-semibold">{qty}</span>
          <button onClick={() => onUpdate(qty + 1)} className="w-7 h-7 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center">+</button>
        </div>
      )}
    </div>
  );
}
