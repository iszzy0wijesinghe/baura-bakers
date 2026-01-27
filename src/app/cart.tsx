import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SugarLevel, SizeOption } from "../content/products";

export type CartItem = {
  id: string; // unique key: productSlug|size|sugar
  productSlug: string;
  productName: string;
  image?: string;
  size: SizeOption;
  sugar: SugarLevel;
  quantity: number;
  unitPriceLkr: number;
};

type CartCtx = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clear: () => void;
  subtotal: number;
};

const CartContext = createContext<CartCtx | null>(null);

const LS_KEY = "baura_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) setItems(JSON.parse(raw));
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(items));
  }, [items]);

  const addItem: CartCtx["addItem"] = (item) => {
    const id = `${item.productSlug}|${item.size.id}|${item.sugar}`;
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);
      if (found) {
        return prev.map((x) => (x.id === id ? { ...x, quantity: x.quantity + item.quantity } : x));
      }
      return [...prev, { ...item, id }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    setItems((prev) =>
      prev
        .map((x) => (x.id === id ? { ...x, quantity: Math.max(1, qty) } : x))
        .filter((x) => x.quantity > 0)
    );
  };

  const removeItem = (id: string) => setItems((prev) => prev.filter((x) => x.id !== id));
  const clear = () => setItems([]);

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + x.unitPriceLkr * x.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider value={{ items, addItem, updateQty, removeItem, clear, subtotal }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
