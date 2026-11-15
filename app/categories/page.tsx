import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Categories — Art Square",
  description: "Browse handmade Indian décor by category at Art Square.",
};

export default async function CategoriesPage() {
  const supabase = await createClient();
  const [{ data: categories, error }, { data: products }] = await Promise.all([
    supabase.from("categories").select("id,name,slug,description,image_url,display_order").eq("active", true).order("display_order"),
    supabase.from("products").select("category_id").eq("status", "published"),
  ]);
  const counts = new Map<string, number>();
  for (const product of products ?? []) {
    if (product.category_id) counts.set(product.category_id, (counts.get(product.category_id) ?? 0) + 1);
  }

  return (
    <>
      <SiteHeader />
      <main className="page-shell">
        <header className="collection-hero">
          <div className="collection-hero-content">
            <span className="eyebrow">Find your kind of handmade</span>
            <h1>Browse by category</h1>
            <p>Explore considered, handcrafted pieces by the art forms and moments they celebrate.</p>
          </div>
        </header>
        {error ? (
          <section className="empty-state" role="alert"><h2>Categories are temporarily unavailable.</h2><p>Please try again in a moment.</p></section>
        ) : categories?.length ? (
          <section className="collection-grid" aria-label="Product categories">
            {categories.map((category) => (
              <Link className="collection-card" href={`/categories/${category.slug}`} key={category.id}>
                <div className="collection-card-image">
                  {category.image_url ? <Image src={category.image_url} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 960px) 50vw, 33vw" unoptimized /> : <span>ART SQUARE</span>}
                </div>
                <div className="collection-card-copy">
                  <span className="eyebrow">{counts.get(category.id) ?? 0} pieces</span>
                  <h2>{category.name}</h2>
                  {category.description && <p>{category.description}</p>}
                  <span className="text-link">Explore category</span>
                </div>
              </Link>
            ))}
          </section>
        ) : (
          <section className="empty-state"><h2>Categories are taking shape.</h2><p>Please check back soon.</p></section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
