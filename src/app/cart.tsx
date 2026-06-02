import React, { createContext, useContext, useMemo, useState } from "react";

export type CartSize = {
  id: string;
  label: string;
  serves?: string | null;
  priceLkr: number;
};

export type CartItem = {
  id: string;
  itemId: string;
  itemSizeId: string;
  sugarLevelId: number;
  productSlug: string;
  productName: string;
  image?: string;
  size: CartSize;
  sugar: string;
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

function isValidCartItem(item: unknown): item is CartItem {
  const x = item as CartItem;

  return Boolean(
    x &&
      typeof x.itemId === "string" &&
      typeof x.itemSizeId === "string" &&
      typeof x.sugarLevelId === "number" &&
      typeof x.productSlug === "string" &&
      typeof x.productName === "string" &&
      typeof x.quantity === "number" &&
      typeof x.unitPriceLkr === "number" &&
      x.size &&
      typeof x.size.id === "string",
  );
}

function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) return [];

    return parsed.filter(isValidCartItem);
  } catch (error) {
    console.error("Failed to load cart:", error);
    return [];
  }
}

function saveCartToStorage(items: CartItem[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Failed to save cart:", error);
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => loadCartFromStorage());

  const updateCart = (updater: (prev: CartItem[]) => CartItem[]) => {
    setItems((prev) => {
      const next = updater(prev);
      saveCartToStorage(next);
      return next;
    });
  };

  const addItem: CartCtx["addItem"] = (item) => {
    const id = `${item.itemId}|${item.itemSizeId}|${item.sugarLevelId}`;

    updateCart((prev) => {
      const found = prev.find((x) => x.id === id);

      if (found) {
        return prev.map((x) =>
          x.id === id
            ? { ...x, quantity: x.quantity + item.quantity }
            : x,
        );
      }

      return [...prev, { ...item, id }];
    });
  };

  const updateQty = (id: string, qty: number) => {
    updateCart((prev) =>
      prev
        .map((x) =>
          x.id === id ? { ...x, quantity: Math.max(1, qty) } : x,
        )
        .filter((x) => x.quantity > 0),
    );
  };

  const removeItem = (id: string) => {
    updateCart((prev) => prev.filter((x) => x.id !== id));
  };

  const clear = () => {
    setItems([]);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LS_KEY);
    }
  };

  const subtotal = useMemo(
    () => items.reduce((sum, x) => sum + x.unitPriceLkr * x.quantity, 0),
    [items],
  );

  return (
    <CartContext.Provider
      value={{ items, addItem, updateQty, removeItem, clear, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return ctx;
}