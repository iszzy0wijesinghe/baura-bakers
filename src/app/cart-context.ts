import { createContext } from "react";
import type { CartItem } from "./cart";

export type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotal: number;
};

export const CartContext = createContext<CartCtx | null>(null);