"use client";
import Image from "next/image";
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

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; bg: string; text: string; border: string }> = {
  ENTREE:  { label: "Entrees",        emoji: "🍱", bg: "bg-orange-50",  text: "text-orange-600", border: "border-orange-200" },
  SIDE:    { label: "Sides",          emoji: "🥗", bg: "bg-green-50",   text: "text-green-600",  border: "border-green-200" },
  DRINK:   { label: "Drinks",         emoji: "🥤", bg: "bg-blue-50",    text: "text-blue-600",   border: "border-blue-200" },
  DESSERT: { label: "Desserts",       emoji: "🍪", bg: "bg-pink-50",    text: "text-pink-600",   border: "border-pink-200" },
  SPECIAL: { label: "Daily Specials", emoji: "⭐", bg: "bg-yellow-50",  text: "text-yellow-600", border: "border-yellow-200" },
};

const CATEGORY_CARD_BG: Record<string, string> = {
  ENTREE:  "from-orange-50 to-amber-50",
  SIDE:    "from-green-50 to-emerald-50",
  DRINK:   "from-blue-50 to-sky-50",
  DESSERT: "from-pink-50 to-rose-50",
  SPECIAL: "from-yellow-50 to-amber-50",
};

export default function OrderPage() {
  const { date } = useParams<{ date: string }>();
  const router = useRouter();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);

  const { items, addItem, updateQuantity, setOrderDetails, getTotal } = useCartStore();

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
  }, [date, setOrderDetails]);

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
    <div className="pb-28">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-orange-500 hover:text-orange-600 font-bold mb-3 flex items-center gap-1"
        >
          ← Back to Calendar
        </button>
        <h1 className="text-3xl font-black text-gray-900">
          🍽️ Pick Today&apos;s Lunch
        </h1>
        <p className="text-gray-500 font-semibold mt-1">
          {format(parseISO(date), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div className="bg-white rounded-3xl p-4 mb-6 shadow-sm border-2 border-orange-100">
          <label className="block text-sm font-black text-gray-700 mb-3">Ordering for:</label>
          <div className="flex gap-3 flex-wrap">
            {children.map((child) => (
              <button
                key={child.id}
                onClick={() => handleChildChange(child.id)}
                className={`px-4 py-2.5 rounded-2xl border-2 text-sm font-bold transition-all btn-bounce
                  ${selectedChild?.id === child.id
                    ? "bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-200"
                    : "border-gray-200 text-gray-700 hover:border-orange-200 hover:bg-orange-50"
                  }`}
              >
                🧒 {child.firstName} {child.lastName}
                <span className="text-xs block opacity-75 font-medium">
                  {child.teacher.firstName} {child.teacher.lastName}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu categories */}
      {categories.map((category) => {
        const cat = CATEGORY_LABELS[category];
        const categoryItems = menuItems.filter((m) => m.category === category);
        if (categoryItems.length === 0) return null;

        return (
          <div key={category} className="mb-10">
            {/* Category header */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border-2 ${cat?.bg ?? "bg-gray-50"} ${cat?.text ?? "text-gray-600"} ${cat?.border ?? "border-gray-200"} font-black text-lg mb-4`}>
              <span>{cat?.emoji}</span>
              {cat?.label ?? category}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryItems.map((item) => {
                const qty = getQuantity(item.id);
                const cardBg = CATEGORY_CARD_BG[category] ?? "from-gray-50 to-gray-100";

                return (
                  <div
                    key={item.id}
                    className="bg-white rounded-3xl shadow-sm border-2 border-gray-100 overflow-hidden hover:shadow-md hover:border-orange-200 transition-all"
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.name} width={400} height={160} className="w-full h-40 object-cover" />
                    ) : (
                      <div className={`w-full h-40 bg-gradient-to-br ${cardBg} flex items-center justify-center`}>
                        <span className="text-6xl drop-shadow">
                          {category === "ENTREE" ? "🍱" : category === "SIDE" ? "🥗" : category === "DRINK" ? "🥤" : category === "DESSERT" ? "🍪" : "⭐"}
                        </span>
                      </div>
                    )}

                    <div className="p-4">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-black text-gray-900 text-base">{item.name}</h3>
                        <span className="text-orange-500 font-black text-base ml-2 flex-shrink-0">
                          {formatCurrency(item.price)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-gray-500 text-sm mb-3 font-medium leading-snug">{item.description}</p>
                      )}

                      {qty === 0 ? (
                        <button
                          onClick={() => addItem({ menuItemId: item.id, name: item.name, price: item.price, quantity: 1, imageUrl: item.imageUrl })}
                          className="btn-bounce w-full bg-orange-500 text-white py-2.5 rounded-2xl text-sm font-black hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200"
                        >
                          + Add to Order
                        </button>
                      ) : (
                        <div className="flex items-center gap-3 justify-center bg-orange-50 rounded-2xl py-1.5">
                          <button
                            onClick={() => updateQuantity(item.id, qty - 1)}
                            className="w-9 h-9 rounded-xl border-2 border-orange-200 hover:bg-orange-100 flex items-center justify-center font-black text-orange-500 text-lg transition-colors"
                          >
                            −
                          </button>
                          <span className="font-black text-gray-900 min-w-[1.5rem] text-center text-lg">{qty}</span>
                          <button
                            onClick={() => updateQuantity(item.id, qty + 1)}
                            className="w-9 h-9 rounded-xl bg-orange-500 text-white hover:bg-orange-600 flex items-center justify-center font-black text-lg transition-colors"
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

      {/* Floating cart button */}
      {total > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => router.push("/cart")}
            className="btn-bounce bg-orange-500 text-white px-8 py-4 rounded-2xl shadow-xl shadow-orange-300 font-black text-lg hover:bg-orange-600 transition-colors flex items-center gap-3 whitespace-nowrap"
          >
            🛒 View Cart
            <span className="bg-white text-orange-500 px-3 py-1 rounded-xl text-sm font-black">
              {formatCurrency(total)}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
