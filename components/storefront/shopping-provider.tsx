"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ShoppingItem, ShoppingKind } from "@/lib/shopping/server";

type ShoppingContextValue = {
  items: ShoppingItem[];
  wishlistCount: number;
  cartCount: number;
  error: string;
  add: (kind: ShoppingKind, productId: string) => Promise<boolean>;
  remove: (kind: ShoppingKind, productId: string) => Promise<boolean>;
  setQuantity: (productId: string, quantity: number) => Promise<boolean>;
  clear: (kind: ShoppingKind) => Promise<boolean>;
};
const ShoppingContext = createContext<ShoppingContextValue | null>(null);

export function ShoppingProvider({ initialItems, children }: { initialItems: ShoppingItem[]; children: React.ReactNode }) {
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const mutate = useCallback(async (body: Record<string, string | number>) => {
    setError("");
    try {
      const response = await fetch("/api/shopping", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not update your list.");
      setItems(result.items as ShoppingItem[]);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not update your list.");
      return false;
    }
  }, []);
  const add = useCallback((kind: ShoppingKind, productId: string) => mutate({ action: "add", kind, productId }), [mutate]);
  const remove = useCallback((kind: ShoppingKind, productId: string) => mutate({ action: "remove", kind, productId }), [mutate]);
  const setQuantity = useCallback((productId: string, quantity: number) => mutate({ action: "set", kind: "cart", productId, quantity }), [mutate]);
  const clear = useCallback((kind: ShoppingKind) => mutate({ action: "clear", kind }), [mutate]);
  const value = useMemo(() => ({
    items,
    wishlistCount: items.filter((item) => item.kind === "wishlist").length,
    cartCount: items.filter((item) => item.kind === "cart").reduce((total, item) => total + item.quantity, 0),
    error, add, remove, setQuantity, clear,
  }), [items, error, add, remove, setQuantity, clear]);
  return <ShoppingContext.Provider value={value}>{children}</ShoppingContext.Provider>;
}

export function useShopping() {
  const context = useContext(ShoppingContext);
  if (!context) throw new Error("useShopping must be used inside ShoppingProvider.");
  return context;
}
