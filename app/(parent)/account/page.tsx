"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
  teacher: { firstName: string; lastName: string; grade?: string };
}

export default function AccountPage() {
  const { data: session } = useSession();
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    fetch("/api/payment/saved-cards").then((r) => r.json()).then(setCards);
    fetch("/api/children").then((r) => r.json()).then(setChildren);
  }, []);

  async function removeCard(pmId: string) {
    await fetch(`/api/payment/saved-cards?pmId=${pmId}`, { method: "DELETE" });
    setCards((prev) => prev.filter((c) => c.id !== pmId));
  }

  const BRAND_ICONS: Record<string, string> = {
    visa: "💳", mastercard: "💳", amex: "💳", discover: "💳",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Account</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">Profile</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Name</span>
            <span className="font-medium">{session?.user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="font-medium">{session?.user?.email}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3">My Children</h2>
        {children.length === 0 ? (
          <p className="text-gray-500 text-sm">No children added yet.</p>
        ) : (
          <div className="space-y-3">
            {children.map((child) => (
              <div key={child.id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="font-medium text-gray-900">{child.firstName} {child.lastName}</p>
                  <p className="text-xs text-gray-500">
                    {child.teacher.firstName} {child.teacher.lastName}
                    {child.teacher.grade ? ` · ${child.teacher.grade}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <h2 className="font-semibold text-gray-800 mb-3">Saved Payment Methods</h2>
        {cards.length === 0 ? (
          <p className="text-gray-500 text-sm">No saved cards. Check &quot;Save card&quot; at checkout to save one.</p>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div key={card.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{BRAND_ICONS[card.brand] ?? "💳"}</span>
                  <div>
                    <p className="font-medium capitalize">{card.brand} ···· {card.last4}</p>
                    <p className="text-xs text-gray-500">Expires {card.expMonth}/{card.expYear}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeCard(card.id)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
