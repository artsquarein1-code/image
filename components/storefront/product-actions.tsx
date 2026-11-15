"use client";

import { useState } from "react";
import { Heart, Minus, Plus, ShoppingBag } from "lucide-react";
import { useShopping } from "./shopping-provider";
import styles from "./product-actions.module.css";

export default function ProductActions({ productId, compact = false }: { productId: string; compact?: boolean }) {
  const { items, add, remove } = useShopping();
  const [pending, setPending] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState("");
  const saved = items.some((item) => item.kind === "wishlist" && item.product_id === productId);

  async function toggleWishlist() {
    setPending("wishlist");
    const updated = await (saved ? remove("wishlist", productId) : add("wishlist", productId));
    setFeedback(updated ? (saved ? "Removed from your wishlist." : "Saved to your wishlist.") : "Your list could not be updated. Please try again.");
    setPending("");
  }

  async function addToCart() {
    setPending("cart");
    const updated = await add("cart", productId, compact ? undefined : quantity);
    setFeedback(updated ? "Added to your enquiry basket." : "Your basket could not be updated. Please try again.");
    setPending("");
  }

  return (
    <div>
      {!compact && (
        <fieldset className={styles.quantity}>
          <legend>Quantity</legend>
          <button
            type="button"
            aria-label="Decrease quantity"
            disabled={quantity <= 1 || Boolean(pending)}
            onClick={() => setQuantity((current) => Math.max(1, current - 1))}
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <output aria-live="polite">{quantity}</output>
          <button
            type="button"
            aria-label="Increase quantity"
            disabled={quantity >= 10 || Boolean(pending)}
            onClick={() => setQuantity((current) => Math.min(10, current + 1))}
          >
            <Plus size={14} aria-hidden="true" />
          </button>
        </fieldset>
      )}
      <div className={`product-action-row${compact ? " product-action-compact" : ""}`}>
        <button type="button" onClick={toggleWishlist} disabled={Boolean(pending)} aria-pressed={saved} aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}>
          <Heart size={15} aria-hidden="true" fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
        <button type="button" onClick={addToCart} disabled={Boolean(pending)} aria-label="Add to enquiry basket">
          <ShoppingBag size={15} aria-hidden="true" /> {pending === "cart" ? "Adding…" : "Add to basket"}
        </button>
      </div>
      <p className={styles.feedback} role="status" aria-live="polite">{feedback}</p>
    </div>
  );
}
