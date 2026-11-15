import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ShopCatalog from "./shop-catalog";
import styles from "./shop.module.css";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Shop — Art Square",
  description: "Browse Art Square’s published handcrafted décor collection.",
};

export default async function ShopPage() {
  const supabase = await createClient();
  const [productsResult, collectionsResult, imagesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,slug,short_description,description,price,contact_for_price,featured,display_order,created_at,collection_id",
      )
      .eq("status", "published")
      .order("display_order", { ascending: true }),
    supabase
      .from("collections")
      .select("id,name,slug,description,display_order")
      .eq("active", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("product_images")
      .select("id,product_id,public_url,alt_text,is_primary,sort_order")
      .order("sort_order", { ascending: true }),
  ]);

  const hasError = Boolean(
    productsResult.error || collectionsResult.error || imagesResult.error,
  );

  return (
    <>
      <SiteHeader />
      <main className={styles.page}>
        <section className={styles.hero} aria-labelledby="shop-title">
          <div className={styles.heroCopy}>
            <span className="eyebrow">Made by hand, made to last</span>
            <h1 id="shop-title">The Art Square collection</h1>
            <p>
              Thoughtful, handmade décor inspired by the colors, rituals, and
              artistry of India.
            </p>
          </div>
          <div className={styles.heroNote} aria-label="Shop overview">
            <span>Eight considered collections</span>
            <span>Made by hand in India</span>
          </div>
        </section>
        <ShopCatalog
          products={productsResult.data ?? []}
          collections={collectionsResult.data ?? []}
          images={imagesResult.data ?? []}
          hasError={hasError}
        />
      </main>
      <SiteFooter />
    </>
  );
}
