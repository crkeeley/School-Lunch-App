"use client";
import { useCartStore } from "@/lib/cart-store";
import { useRouter } from "next/navigation";

export function CartButton() {
  const items = useCartStore((s) => s.items);
  const router = useRouter();
  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <button
      onClick={() => router.push("/cart")}
      className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-1.5 6h12M10 21a1 1 0 100-2 1 1 0 000 2zm7 0a1 1 0 100-2 1 1 0 000 2z" />
      </svg>
      {count > 0 && (
        <span className="absolute -top-1 -right-1 bg-green-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
          {count}
        </span>
      )}
    </button>
  );
}
