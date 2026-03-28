import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  deliveryDate: string;
  childId: string;
  childName: string;
  teacherId: string;
  teacherName: string;
  addItem: (item: CartItem) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  setOrderDetails: (details: {
    deliveryDate: string;
    childId: string;
    childName: string;
    teacherId: string;
    teacherName: string;
  }) => void;
  getTotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      deliveryDate: "",
      childId: "",
      childName: "",
      teacherId: "",
      teacherName: "",
      addItem: (item) =>
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === item.menuItemId);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === item.menuItemId
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),
      removeItem: (menuItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.menuItemId !== menuItemId),
        })),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.menuItemId !== menuItemId)
              : state.items.map((i) =>
                  i.menuItemId === menuItemId ? { ...i, quantity } : i
                ),
        })),
      clearCart: () => set({ items: [], deliveryDate: "", childId: "", childName: "", teacherId: "", teacherName: "" }),
      setOrderDetails: (details) => set(details),
      getTotal: () =>
        get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: "school-lunch-cart" }
  )
);
