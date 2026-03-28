"use client";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { items, removeItem, updateQuantity, deliveryDate, childName, teacherName, getTotal, clearCart } = useCartStore();
  const router = useRouter();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="text-center py-24">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Head to the calendar to add some items.</p>
        <button onClick={() => router.push("/dashboard")} className="bg-green-600 text-white px-6 py-2.5 rounded-lg hover:bg-green-700 transition-colors">
          Back to Calendar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-4">
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Delivery date</span>
          <span className="font-medium">{deliveryDate ? formatDate(new Date(deliveryDate)) : "—"}</span>
        </div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-500">Child</span>
          <span className="font-medium">{childName}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Teacher</span>
          <span className="font-medium">{teacherName}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-4">
        {items.map((item) => (
          <div key={item.menuItemId} className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0">
            <div className="text-2xl">
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
              ) : "🍽️"}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.name}</p>
              <p className="text-green-700 text-sm">{formatCurrency(item.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.menuItemId, item.quantity - 1)}
                className="w-7 h-7 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center"
              >
                −
              </button>
              <span className="font-semibold w-6 text-center">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.menuItemId, item.quantity + 1)}
                className="w-7 h-7 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center"
              >
                +
              </button>
            </div>
            <div className="text-right min-w-[60px]">
              <p className="font-semibold">{formatCurrency(item.price * item.quantity)}</p>
              <button onClick={() => removeItem(item.menuItemId)} className="text-red-500 text-xs hover:underline">
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span className="text-green-700">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={() => router.back()} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl hover:bg-gray-50 transition-colors font-medium">
          Add More Items
        </button>
        <button onClick={() => router.push("/checkout")} className="flex-1 bg-green-600 text-white py-3 rounded-xl hover:bg-green-700 transition-colors font-medium">
          Proceed to Checkout →
        </button>
      </div>
    </div>
  );
}
