"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Product = { id: string; name: string; slug: string; short_description: string | null; price: number | null; contact_for_price: boolean; category_id: string | null; featured: boolean; display_order: number };
type ProductImage = { product_id: string; public_url: string; alt_text: string; is_primary: boolean; sort_order: number };
type Category = { id: string; name: string };

export default function ProductCatalog({ products, images, categories }: { products: Product[]; images: ProductImage[]; categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const visibleProducts = useMemo(() => products.filter((product) => {
    const matchesQuery = `${product.name} ${product.short_description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchesQuery && (categoryId === "all" || product.category_id === categoryId);
  }), [products, query, categoryId]);
  const photoFor = (productId: string) => images.filter((photo) => photo.product_id === productId).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];

  return <>
    <div className="catalog-tools"><label className="catalog-search"><span className="sr-only">Search products</span><input type="search" placeholder="Find a handmade piece…" value={query} onChange={(event) => setQuery(event.target.value)} /></label><div className="category-row" aria-label="Filter by category"><button type="button" className={`filter-chip${categoryId === "all" ? " active" : ""}`} aria-pressed={categoryId === "all"} onClick={() => setCategoryId("all")}>All pieces</button>{categories.map((category) => <button type="button" key={category.id} className={`filter-chip${categoryId === category.id ? " active" : ""}`} aria-pressed={categoryId === category.id} onClick={() => setCategoryId(category.id)}>{category.name}</button>)}</div></div>
    {visibleProducts.length ? <div className="product-grid">{visibleProducts.map((product) => {
      const photo = photoFor(product.id);
      const category = categories.find((item) => item.id === product.category_id);
      return <Link className="product-card" key={product.id} href={`/products/${product.slug}`}><div className="product-image">{photo && <Image src={photo.public_url} alt={photo.alt_text || product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 900px) 33vw, 25vw" unoptimized />}</div><div className="product-info"><span className="product-category">{category?.name ?? "Handmade décor"}</span><h3>{product.name}</h3><p>{product.short_description}</p><div className="price-line">{product.contact_for_price || product.price == null ? "Contact for price" : `₹${Number(product.price).toLocaleString("en-IN")}`}</div></div></Link>;
    })}</div> : <p className="empty-note">No pieces match your search. Try another name or category.</p>}
  </>;
}
