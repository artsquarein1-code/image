"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import styles from "./shop.module.css";

type Product = {
  id: string;
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
  collections,
  images,
  hasError,
}: {
  products: Product[];
  collections: Collection[];
  images: ProductImage[];
  hasError: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collectionId, setCollectionId] = useState("all");
  const [sortMode, setSortMode] = useState<SortMode>("featured");

  const collectionById = useMemo(
    () => new Map(collections.map((collection) => [collection.id, collection])),
    [collections],
  );
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
      const matchesCollection =
        collectionId === "all" || product.collection_id === collectionId;
      const searchableText = `${product.name} ${product.short_description ?? ""} ${product.description ?? ""}`;
      const matchesQuery = searchableText.toLocaleLowerCase().includes(normalizedQuery);
      return matchesCollection && matchesQuery;
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
  }, [collectionId, products, query, sortMode]);

  function resetFilters() {
    setQuery("");
    setCollectionId("all");
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

                return (
                  <Link
                    className={styles.productCard}
                    href={`/products/${product.slug}`}
                    key={product.id}
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
                        {collection?.name ?? "Art Square"}
                      </span>
                      <h2>{product.name}</h2>
                      {product.short_description && <p>{product.short_description}</p>}
                      <span className={styles.price}>{formatPrice(product)}</span>
                    </div>
                  </Link>
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
