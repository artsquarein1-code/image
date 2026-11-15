"use client";

import Image from "next/image";
import Link from "next/link";
import { useShopping } from "./shopping-provider";

function priceLabel(item: ReturnType<typeof useShopping>["items"][number]) {
  return item.product.contact_for_price || item.product.price == null
    ? "Contact for price"
    : `₹${Number(item.product.price).toLocaleString("en-IN")}`;
}

export function WishlistPage() {
  const { items, remove, error } = useShopping();
  const wishlist = items.filter((item) => item.kind === "wishlist");
  return <main className="page-shell"><header className="page-intro"><span className="eyebrow">A little inspiration</span><h1>Your wishlist</h1><p>Keep the pieces you love close while you decide what feels right.</p></header>{error && <p role="alert" className="form-status">{error}</p>}{wishlist.length ? <div className="product-grid">{wishlist.map((item) => <article className="product-card-wrap" key={item.product_id}><Link className="product-card" href={`/products/${item.product.slug}`}><div className="product-image">{item.product.image ? <Image src={item.product.image.public_url} alt={item.product.image.alt_text || item.product.name} fill sizes="(max-width:640px) 50vw,25vw" unoptimized /> : <div className="image-fallback">Image coming soon</div>}</div><div className="product-info"><span className="product-collection">Handmade décor</span><h2>{item.product.name}</h2><span className="price">{priceLabel(item)}</span></div></Link><div className="product-action-row"><button type="button" onClick={() => void remove("wishlist", item.product_id)}>Remove from wishlist</button></div></article>)}</div> : <section className="content-card empty-state"><h2>Your wishlist is waiting for its first piece.</h2><p>Save a handmade favourite and come back to it any time.</p><Link href="/shop" className="button-primary">Explore the collection</Link></section>}</main>;
}

export function CartPage() {
  const { items, setQuantity, remove, error } = useShopping();
  const cart = items.filter((item) => item.kind === "cart");
  const message = cart.map((item) => `${item.product.name} × ${item.quantity}`).join("\n");
  const whatsapp = `https://wa.me/919054934190?text=${encodeURIComponent(`Hello Art Square, I'd like to enquire about these pieces:\n${message}`)}`;
  return <main className="page-shell"><header className="page-intro"><span className="eyebrow">Gather your favourites</span><h1>Your enquiry basket</h1><p>Collect the pieces you would like to ask the studio about. This is an enquiry list, not a checkout.</p></header>{error && <p role="alert" className="form-status">{error}</p>}{cart.length ? <div className="shopping-layout"><section className="shopping-list" aria-label="Basket items">{cart.map((item) => <article className="shopping-row" key={item.product_id}><Link className="shopping-row-image" href={`/products/${item.product.slug}`}>{item.product.image && <Image src={item.product.image.public_url} alt={item.product.image.alt_text || item.product.name} fill sizes="108px" unoptimized />}</Link><div><h2><Link href={`/products/${item.product.slug}`}>{item.product.name}</Link></h2><p>{priceLabel(item)} · {item.product.availability.replaceAll("_", " ")}</p><div className="quantity-control" aria-label={`Quantity for ${item.product.name}`}><button type="button" aria-label="Decrease quantity" disabled={item.quantity <= 1} onClick={() => void setQuantity(item.product_id, item.quantity - 1)}>−</button><span aria-live="polite">{item.quantity}</span><button type="button" aria-label="Increase quantity" disabled={item.quantity >= 10} onClick={() => void setQuantity(item.product_id, item.quantity + 1)}>+</button></div></div><div className="shopping-row-actions"><button className="text-button" type="button" onClick={() => void remove("cart", item.product_id)}>Remove</button></div></article>)}</section><aside className="summary-card"><h2>Enquire with the studio</h2><p>Prices and availability are confirmed by the studio. No payment is collected on this site.</p><a className="button-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">Ask about these pieces</a><p><Link className="text-link" href="/contact">Prefer email? Contact us</Link></p></aside></div> : <section className="content-card empty-state"><h2>Your basket is empty.</h2><p>Add pieces here to ask the studio about them together.</p><Link href="/shop" className="button-primary">Browse the collection</Link></section>}</main>;
}
