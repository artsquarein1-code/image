import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Collections — Art Square",
  description: "Explore the handmade ART SQUARE collections, from resin pooja thalis to mirror art and thoughtful gifting.",
};

type Collection = { id: string; name: string; slug: string; description: string | null; banner_url: string | null };
type Product = { collection_id: string | null };

export default async function CollectionsPage() {
  const supabase = await createClient();
  const [{ data: collections, error }, { data: products }] = await Promise.all([
    supabase.from("collections").select("id,name,slug,description,banner_url").eq("active", true).order("display_order"),
    supabase.from("products").select("collection_id").eq("status", "published"),
  ]);
  const list = (collections ?? []) as Collection[];
  const productCounts = new Map<string, number>();
  for (const product of (products ?? []) as Product[]) {
    if (product.collection_id) productCounts.set(product.collection_id, (productCounts.get(product.collection_id) ?? 0) + 1);
  }

  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">Thoughtfully gathered</span><h1>Explore our collections.</h1><p>Discover handmade pieces by material, mood and moment. Each collection brings together the work currently available from the ART SQUARE studio.</p></header>{error ? <p className="empty-note" role="status">Collections are temporarily unavailable. Please try again shortly.</p> : list.length ? <section className="collection-grid" aria-label="All collections">{list.map((collection) => <Link className="collection-card" href={`/collections/${collection.slug}`} key={collection.id}><div className="collection-card-image">{collection.banner_url ? <Image src={collection.banner_url} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 900px) 50vw, 33vw" unoptimized /> : <span aria-hidden="true">ART SQUARE</span>}</div><div className="collection-card-copy"><span className="eyebrow">{productCounts.get(collection.id) ?? 0} {(productCounts.get(collection.id) ?? 0) === 1 ? "piece" : "pieces"}</span><h2>{collection.name}</h2><p>{collection.description || "A considered edit of handmade ART SQUARE pieces."}</p><span className="text-link">Explore collection <span aria-hidden="true">→</span></span></div></Link>)}</section> : <div className="empty-state"><h2>Collections are being prepared.</h2><p>Please visit the shop to browse our published handmade pieces.</p><Link className="button-primary" href="/shop">Explore the shop</Link></div>}</main><SiteFooter /></>;
}
