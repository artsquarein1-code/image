"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import ProductActions from "@/components/storefront/product-actions";
import ProductWhatsAppLink from "@/components/storefront/product-whatsapp-link";
import styles from "./shop.module.css";

type Product = {
  id: string;
  sku: string | null;
  name: string;
  slug: string;
  short_description: string | null;
  description: string | null;
  price: number | string | null;
  contact_for_price: boolean;
  featured: boolean;
  display_order: number;
  created_at: string;
  collection_id: string | null;
  category_id: string | null;
  availability: "available" | "made_to_order" | "unavailable";
};

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
};

type Collection = {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
};

type ProductImage = {
  id: string;
  product_id: string;
  public_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

type SortMode = "featured" | "newest" | "name" | "price-low" | "price-high";

function compareDisplayOrder(a: Product, b: Product) {
  return a.display_order - b.display_order || a.name.localeCompare(b.name);
}

function comparePrice(a: Product, b: Product, direction: "ascending" | "descending") {
  if (a.price == null && b.price == null) return compareDisplayOrder(a, b);
  if (a.price == null) return 1;
  if (b.price == null) return -1;
  const difference = Number(a.price) - Number(b.price);
  return (direction === "ascending" ? difference : -difference) || compareDisplayOrder(a, b);
}

function formatPrice(product: Product) {
  if (product.contact_for_price || product.price == null) return "Contact for price";
  return `₹${Number(product.price).toLocaleString("en-IN")}`;
}

export default function ShopCatalog({
  products,
  categories,
  collections,
  images,
  siteUrl,
  hasError,
}: {
  products: Product[];
  categories: Category[];
  collections: Collection[];
  images: ProductImage[];
  siteUrl: string;
  hasError: boolean;
}) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [collectionId, setCollectionId] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("featured");
  const [minimumPrice, setMinimumPrice] = useState("");
  const [maximumPrice, setMaximumPrice] = useState("");
  const [availability, setAvailability] = useState("all");
  const filterDialogRef = useRef<HTMLDialogElement>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((category) => [category.id, category])),
    [categories],
  );
  const collectionById = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections],
  );
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.category_id) counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
    }
    return counts;
  }, [products]);
  const imageByProductId = useMemo(() => {
    const sortedImages = [...images].sort(
      (a, b) =>
        Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
    );
    const imageMap = new Map<string, ProductImage>();
    for (const image of sortedImages) {
      if (!imageMap.has(image.product_id)) imageMap.set(image.product_id, image);
    }
    return imageMap;
  }, [images]);
  const productCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      if (product.collection_id) {
        counts.set(product.collection_id, (counts.get(product.collection_id) ?? 0) + 1);
      }
    }
    return counts;
  }, [products]);
  const visibleProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const filteredProducts = products.filter((product) => {
      const matchesCategory = categoryId === "all" || product.category_id === categoryId;
      const matchesCollection = collectionId === "all" || product.collection_id === collectionId;
      const searchableText = `${product.name} ${product.short_description ?? ""} ${product.description ?? ""}`;
      const matchesQuery = searchableText.toLocaleLowerCase().includes(normalizedQuery);
      const numericPrice = product.price == null ? null : Number(product.price);
      const matchesMinimum = !minimumPrice || (numericPrice !== null && numericPrice >= Number(minimumPrice));
      const matchesMaximum = !maximumPrice || (numericPrice !== null && numericPrice <= Number(maximumPrice));
      const matchesAvailability = availability === "all" || product.availability === availability;
      return matchesCategory && matchesCollection && matchesQuery && matchesMinimum && matchesMaximum && matchesAvailability;
    });

    return filteredProducts.sort((a, b) => {
      if (sortMode === "name") return a.name.localeCompare(b.name);
      if (sortMode === "newest") {
        return Date.parse(b.created_at) - Date.parse(a.created_at) || compareDisplayOrder(a, b);
      }
      if (sortMode === "price-low") return comparePrice(a, b, "ascending");
      if (sortMode === "price-high") return comparePrice(a, b, "descending");
      return Number(b.featured) - Number(a.featured) || compareDisplayOrder(a, b);
    });
  }, [availability, categoryId, collectionId, maximumPrice, minimumPrice, products, query, sortMode]);

  function resetFilters() {
    setQuery("");
    setCategoryId("all");
    setCollectionId("all");
    setMinimumPrice("");
    setMaximumPrice("");
    setAvailability("all");
  }

  function renderFilterControls() {
    return (
      <div className={styles.filterControls}>
        <label className={styles.filterField}>
          <span>Minimum price (₹)</span>
          <input type="number" min="0" inputMode="numeric" value={minimumPrice} onChange={(event) => setMinimumPrice(event.target.value)} />
        </label>
        <label className={styles.filterField}>
          <span>Maximum price (₹)</span>
          <input type="number" min="0" inputMode="numeric" value={maximumPrice} onChange={(event) => setMaximumPrice(event.target.value)} />
        </label>
        <label className={styles.filterField}>
          <span>Availability</span>
          <select value={availability} onChange={(event) => setAvailability(event.target.value)}>
            <option value="all">All availability</option>
            <option value="available">Available to enquire</option>
            <option value="made_to_order">Made to order</option>
            <option value="unavailable">Currently unavailable</option>
          </select>
        </label>
        <button className={styles.resetButton} type="button" onClick={resetFilters}>Clear filters</button>
      </div>
    );
  }

  return (
    <section className={styles.catalog} aria-label="Shop products">
      {hasError ? (
        <div className={styles.stateCard} role="alert">
          <span className="eyebrow">A little pause</span>
          <h2>The collection is temporarily unavailable.</h2>
          <p>Please try again in a moment.</p>
          <Link className="button-primary" href="/shop">
            Try again
          </Link>
        </div>
      ) : (
        <>
          <div className={styles.collectionSection}>
            <div className={styles.sectionIntro}>
              <span className="eyebrow">Explore by category</span>
              <p>Browse handmade work by art form and occasion.</p>
            </div>
            <div className={styles.collectionFilters} role="group" aria-label="Filter by category">
              <button
                className={`${styles.collectionButton} ${categoryId === "all" ? styles.activeCollection : ""}`}
                type="button"
                aria-pressed={categoryId === "all"}
                onClick={() => setCategoryId("all")}
              >
                <span>All categories</span>
                <span className={styles.collectionCount}>{products.length}</span>
              </button>
              {categories.map((category) => (
                <button
                  className={`${styles.collectionButton} ${categoryId === category.id ? styles.activeCollection : ""}`}
                  key={category.id}
                  type="button"
                  aria-pressed={categoryId === category.id}
                  onClick={() => setCategoryId(category.id)}
                >
                  <span>{category.name}</span>
                  <span className={styles.collectionCount}>{categoryCounts.get(category.id) ?? 0}</span>
                </button>
              ))}
            </div>
          </div>
          <div className={styles.collectionSection}>
            <div className={styles.sectionIntro}>
              <span className="eyebrow">Explore by collection</span>
              <p>Choose a collection to find the pieces within it.</p>
            </div>
            <div className={styles.collectionFilters} role="group" aria-label="Filter by collection">
              <button
                className={`${styles.collectionButton} ${collectionId === "all" ? styles.activeCollection : ""}`}
                type="button"
                aria-pressed={collectionId === "all"}
                onClick={() => setCollectionId("all")}
              >
                <span>All pieces</span>
                <span className={styles.collectionCount}>{products.length}</span>
              </button>
              {collections.map((collection) => (
                <button
                  className={`${styles.collectionButton} ${collectionId === collection.id ? styles.activeCollection : ""}`}
                  key={collection.id}
                  type="button"
                  aria-pressed={collectionId === collection.id}
                  onClick={() => setCollectionId(collection.id)}
                >
                  <span>{collection.name}</span>
                  <span className={styles.collectionCount}>
                    {productCounts.get(collection.id) ?? 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className={styles.toolbar}>
            <label className={styles.searchField}>
              <span className="sr-only">Search published products</span>
              <input
                type="search"
                placeholder="Search the collection"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <label className={styles.sortField}>
              <span>Sort by</span>
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="name">Name, A to Z</option>
                <option value="price-low">Price, low to high</option>
                <option value="price-high">Price, high to low</option>
              </select>
            </label>
          </div>
          <div className={styles.desktopFilters}>
            <span className={styles.filterHeading}>Refine your search</span>
            {renderFilterControls()}
          </div>
          <button
            className={styles.mobileFilterButton}
            type="button"
            onClick={() => filterDialogRef.current?.showModal()}
          >
            Filters and availability
          </button>
          <dialog className={styles.filterDialog} ref={filterDialogRef} aria-labelledby="mobile-filters-title">
            <div className={styles.dialogHeading}>
              <h2 id="mobile-filters-title">Refine your search</h2>
              <button type="button" onClick={() => filterDialogRef.current?.close()} aria-label="Close filters">×</button>
            </div>
            {renderFilterControls()}
            <button className="button-primary" type="button" onClick={() => filterDialogRef.current?.close()}>
              Show {visibleProducts.length} pieces
            </button>
          </dialog>

          <p className={styles.resultsCount} aria-live="polite">
            {products.length === 0
              ? "No published pieces yet"
              : `Showing ${visibleProducts.length} of ${products.length} pieces`}
          </p>

          {visibleProducts.length > 0 ? (
            <div className={styles.productGrid}>
              {visibleProducts.map((product) => {
                const image = imageByProductId.get(product.id);
                const collection = product.collection_id
                  ? collectionById.get(product.collection_id)
                  : undefined;
                const category = product.category_id
                  ? categoryById.get(product.category_id)
                  : undefined;

                return (
                  <article className={styles.productCardWrap} key={product.id}>
                    <Link
                      className={styles.productCard}
href={`/product/${product.slug}`}
                      aria-label={`View ${product.name}`}
                    >
                      <div className={styles.productImage}>
                        {image ? (
                          <Image
                            src={image.public_url}
                            alt={image.alt_text || product.name}
                            fill
                            sizes="(max-width: 640px) 50vw, (max-width: 960px) 33vw, 25vw"
                            unoptimized
                          />
                        ) : (
                          <div className={styles.imageFallback}>Image coming soon</div>
                        )}
                        {product.featured && <span className={styles.featuredBadge}>Featured</span>}
                      </div>
                      <div className={styles.productInfo}>
                        <span className={styles.productCollection}>
                          {category?.name ?? collection?.name ?? "Art Square"}
                        </span>
                        <h2>{product.name}</h2>
                        {product.short_description && <p>{product.short_description}</p>}
                        <span className={styles.price}>{formatPrice(product)}</span>
                      </div>
                    </Link>
                    <ProductActions productId={product.id} compact />
                    <ProductWhatsAppLink product={product} siteUrl={siteUrl} />
                    <details className="quick-view"><summary>Quick view</summary><div className="quick-view-panel"><p>{product.description || product.short_description || "A handmade piece from ART SQUARE."}</p><Link className="text-link" href={`/product/${product.slug}`}>View full details</Link><ProductWhatsAppLink product={product} siteUrl={siteUrl} /></div></details>
                  </article>
                );
              })}
            </div>
          ) : products.length > 0 ? (
            <div className={styles.stateCard}>
              <span className="eyebrow">No match this time</span>
              <h2>No pieces match your search.</h2>
              <p>Try another search or browse all collections.</p>
              <button className={styles.resetButton} type="button" onClick={resetFilters}>
                Clear filters
              </button>
            </div>
          ) : (
            <div className={styles.stateCard}>
              <span className="eyebrow">The collection is taking shape</span>
              <h2>No published pieces yet.</h2>
              <p>Please check back soon.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
