export type Role = "PARENT" | "TEACHER" | "ADMIN";
export type OrderStatus = "PENDING" | "PAID" | "PREPARING" | "READY" | "DELIVERED" | "CANCELLED" | "REFUNDED";
export type MenuCategory = "ENTREE" | "SIDE" | "DRINK" | "DESSERT" | "SPECIAL";

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string | null;
}

export interface CartState {
  items: CartItem[];
  deliveryDate: string;
  childId: string;
  childName: string;
  teacherId: string;
  teacherName: string;
}
