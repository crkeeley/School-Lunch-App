"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { useCartStore } from "@/lib/cart-store";
import { formatCurrency } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  isFamilySize: boolean;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  teacher: { id: string; firstName: string; lastName: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  ENTREE: "Entrees",
  SIDE: "Sides",
  DRINK: "Drinks",
  DESSERT: "Desserts",
  SPECIAL: "Daily Specials",
};

export default function OrderPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const { items, addItem, removeItem, updateQuantity, setOrderDetails, getTotal } = useCartStore();

  useEffect(() => {
    fetch("/api/menu").then((r) => r.json()).then(setMenuItems);
    fetch("/api/children")
      .then((r) => r.json())
      .then((data: Child[]) => {
        setChildren(data);
        if (data.length > 0) {
          setSelectedChild(data[0]);
          setOrderDetails({
            deliveryDate: date,
            childId: data[0].id,
            childName: `${data[0].firstName} ${data[0].lastName}`,
            teacherId: data[0].teacher.id,
            teacherName: `${data[0].teacher.firstName} ${data[0].teacher.lastName}`,
          });
        }
      });
  }, [date]);

  const categories = [...new Set(menuItems.map((m) => m.category))];

  function getQuantity(itemId: string) {
    return items.find((i) => i.menuItemId === itemId)?.quantity ?? 0;
  }

  function handleChildChange(childId: string) {
    const child = children.find((c) => c.id === childId);
    if (!child) return;
    setSelectedChild(child);
    setOrderDetails({
      deliveryDate: date,
      childId: child.id,
      childName: `${child.firstName} ${child.lastName}`,
      teacherId: child.teacher.id,
      teacherName: `${child.teacher.firstName} ${child.teacher.lastName}`,
    });
  }

  const total = getTotal();

  return (
    <div>
      <div className="mb-6">
        <button onClick={() => router.back()} className="text-sm text-gray-500 hover:text-gray-700 mb-2">
          ← Back to Calendar
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          Order for {format(parseISO(date), "EEEE, MMMM d, yyyy")}
        </h1>
      </div>

      {children.length > 1 && (
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">Ordering for:</label>
          <div className="flex gap-3 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleChildChange(child.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                  ${selectedChild?.id === child.id
                    ? "bg-green-600 text-white border-green-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {child.firstName} {child.lastName}
                <span className="text-xs block opacity-75">
                  {child.teacher.firstName} {child.teacher.lastName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {categories.map((category) => {
        const categoryItems = menuItems.filter((m) => m.category === category);
        if (categoryItems.length === 0) return null;
        return (
          <div key={category} className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              {CATEGORY_LABELS[category] ?? category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => {
                const qty = getQuantity(item.id);
                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center text-4xl">
                        {category === "ENTREE" ? "🍱" : category === "SIDE" ? "🥗" : category === "DRINK" ? "🥤" : category === "DESSERT" ? "🍪" : "⭐"}
                      </div>
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-semibold text-gray-900">{item.name}</h3>
                        <span className="text-green-700 font-semibold">{formatCurrency(item.price)}</span>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-sm mb-3">{item.description}</p>
                      )}
                      {qty === 0 ? (
                        <button
                          onClick={() => addItem({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl })}
                          className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
                        >
                          Add to Order
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 justify-center">
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            className="w-8 h-8 rounded-full border border-gray-300 hover:bg-gray-100 flex items-center justify-center font-bold"
                          >
                            −
                          </button>
                          <span className="font-semibold text-gray-900 min-w-[1.5rem] text-center">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, qty + 1)}
                            className="w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 flex items-center justify-center font-bold"
                          >
                            +
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {total > 0 && (
        <div className="fixed bottom-6 right-6">
          <button
            onClick={() => router.push("/cart")}
            className="bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-3"
          >
            View Cart
            <span className="bg-white text-green-700 px-2 py-0.5 rounded-lg text-sm font-bold">
              {formatCurrency(total)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
