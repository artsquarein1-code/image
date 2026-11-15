import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import ShopCatalog from "@/app/shop/shop-catalog";
import { createClient } from "@/lib/supabase/server";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("collections").select("name,description").eq("slug", slug).eq("active", true).maybeSingle();
  return { title: data ? `${data.name} — Art Square` : "Collection — Art Square", description: data?.description || "Explore a handmade ART SQUARE collection." };
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: collection } = await supabase.from("collections").select("id,name,slug,description,banner_url,display_order,active").eq("slug", slug).eq("active", true).maybeSingle();
  if (!collection) notFound();
  const [{ data: products, error: productsError }, { data: collections }, { data: images }] = await Promise.all([
    supabase.from("products").select("id,name,slug,short_description,description,price,contact_for_price,featured,display_order,created_at,collection_id,availability").eq("status", "published").eq("collection_id", collection.id).order("display_order"),
    supabase.from("collections").select("id,name,slug,description,display_order").eq("active", true).order("display_order"),
    supabase.from("product_images").select("id,product_id,public_url,alt_text,is_primary,sort_order").order("sort_order"),
  ]);
  return <><SiteHeader /><main><header className="collection-hero">{collection.banner_url && <Image src={collection.banner_url} alt="" fill priority sizes="100vw" className="collection-banner-image" unoptimized />}<div className="collection-hero-content"><span className="eyebrow">Explore the collection</span><h1>{collection.name}</h1><p>{collection.description || "A considered edit of handmade pieces from ART SQUARE."}</p></div></header><div className="page-shell"><ShopCatalog products={products ?? []} collections={(collections ?? []).filter((item) => item.id === collection.id)} images={images ?? []} hasError={Boolean(productsError)} /><section className="related-collections"><span className="eyebrow">More to discover</span><div>{(collections ?? []).filter((item) => item.id !== collection.id).map((item) => <Link href={`/collections/${item.slug}`} key={item.id}>{item.name}</Link>)}</div></section></div></main><SiteFooter /></>;
}
