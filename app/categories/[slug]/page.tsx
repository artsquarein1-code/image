import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import ShopCatalog from "@/app/shop/shop-catalog";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/public-site-url";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("categories").select("name,description").eq("slug", slug).eq("active", true).maybeSingle();
  return {
    title: data ? `${data.name} — Art Square` : "Category — Art Square",
    description: data?.description || "Browse handcrafted ART SQUARE pieces by category.",
  };
}

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("id,name,slug,description,image_url,active").eq("slug", slug).eq("active", true).maybeSingle();
  if (!category) notFound();

  const [{ data: products, error: productsError }, { data: categories }, { data: collections }, { data: images }] = await Promise.all([
    supabase.from("products").select("id,sku,name,slug,short_description,description,price,contact_for_price,featured,display_order,created_at,collection_id,category_id,availability").eq("status", "published").eq("category_id", category.id).order("display_order"),
    supabase.from("categories").select("id,name,slug,description,display_order").eq("active", true).order("display_order"),
    supabase.from("collections").select("id,name,slug,description,display_order").eq("active", true).order("display_order"),
    supabase.from("product_images").select("id,product_id,public_url,alt_text,is_primary,sort_order").order("sort_order"),
  ]);

  return (
    <>
      <SiteHeader />
      <main>
        <header className="collection-hero">
          {category.image_url && <Image src={category.image_url} alt="" fill priority sizes="100vw" className="collection-banner-image" unoptimized />}
          <div className="collection-hero-content">
            <span className="eyebrow">Explore the category</span>
            <h1>{category.name}</h1>
            <p>{category.description || "A considered edit of handmade pieces from ART SQUARE."}</p>
          </div>
        </header>
        <div className="page-shell">
          <ShopCatalog
            products={products ?? []}
            categories={(categories ?? []).filter((item) => item.id === category.id)}
            collections={collections ?? []}
            images={images ?? []}
            siteUrl={getPublicSiteUrl()}
            hasError={Boolean(productsError)}
          />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
