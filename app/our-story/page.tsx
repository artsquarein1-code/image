import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Our story — Art Square", description: "Discover the handmade details and Indian craft sensibilities behind Art Square décor." };
export const dynamic = "force-dynamic";

export default async function OurStoryPage() {
  const supabase = await createClient();
  const { data: products } = await supabase.from("products").select("id,name,slug").eq("status", "published").order("display_order").limit(4);
  const ids = (products ?? []).map((item) => item.id);
  const { data: photos } = ids.length ? await supabase.from("product_images").select("product_id,public_url,alt_text,is_primary,sort_order").in("product_id", ids).order("sort_order") : { data: [] };
  const featured = (products ?? []).map((product) => ({ product, photo: (photos ?? []).filter((photo) => photo.product_id === product.id).sort((a,b) => Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order)[0] })).filter((entry) => entry.photo);
  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">An appreciation of handmade</span><h1>Every creation has a story.</h1><p>Some things are made to do more than decorate. They become part of a ritual, a celebration, a home.</p></header><section className="story-grid"><div className="story-image">{featured[0] && <Image src={featured[0].photo.public_url} alt={featured[0].photo.alt_text || featured[0].product.name} fill sizes="(max-width:640px) 100vw,50vw" unoptimized />}</div><div className="story-copy"><span className="eyebrow">Made by hand, made to be kept</span><h2>Tradition, with a fresh eye.</h2><p>ART SQUARE brings handmade creativity, Indian craft sensibilities and thoughtful detail into the spaces we live in. Each piece begins with an appreciation for material, colour and the small details that make a home feel personal.</p><p>Our collection brings together resin and pooja thalis, mirror art, mandalas, clocks, spiritual décor, tree-of-life pieces and thoughtful gifting.</p><Link className="button-primary" href="/shop">Explore the collection</Link></div></section>{featured.length > 1 && <section className="section"><header className="section-heading"><span className="eyebrow">A considered edit</span><h2>Made to live with.</h2></header><div className="product-grid">{featured.slice(1).map(({product,photo})=><Link className="product-card" href={`/products/${product.slug}`} key={product.id}><div className="product-image"><Image src={photo.public_url} alt={photo.alt_text||product.name} fill sizes="(max-width:640px) 50vw,25vw" unoptimized /></div><div className="product-info"><h3>{product.name}</h3></div></Link>)}</div></section>}</main><SiteFooter /></>;
}
