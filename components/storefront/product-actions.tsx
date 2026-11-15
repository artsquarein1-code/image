"use client";

import { useState } from "react";
import { Heart, ShoppingBag } from "lucide-react";
import { useShopping } from "./shopping-provider";

export default function ProductActions({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const { items, add, remove } = useShopping();
  const [pending, setPending] = useState("");
  const saved = items.some((item) => item.kind === "wishlist" && item.product_id === productId);

  async function toggleWishlist() {
    setPending("wishlist");
    await (saved ? remove("wishlist", productId) : add("wishlist", productId));
    setPending("");
  }
  async function addToCart() {
    setPending("cart");
    await add("cart", productId);
    setPending("");
  }

  return (
    <div className={`product-action-row${compact ? " product-action-compact" : ""}`}>
      <button type="button" onClick={toggleWishlist} disabled={Boolean(pending)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}>
        <Heart size={15} aria-hidden="true" fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
      </button>
      <button type="button" onClick={addToCart} disabled={Boolean(pending)} aria-label="Add to enquiry basket">
        <ShoppingBag size={15} aria-hidden="true" /> {pending === "cart" ? "Adding…" : "Add to basket"}
      </button>
    </div>
  );
}
