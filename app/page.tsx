import Image from "next/image";
import Link from "next/link";
import ProductCatalog from "./product-catalog";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";

type Product = { id: string; name: string; slug: string; short_description: string | null; price: number | null; contact_for_price: boolean; category_id: string | null; featured: boolean; display_order: number };
type ProductImage = { product_id: string; public_url: string; alt_text: string; is_primary: boolean; sort_order: number };
type Category = { id: string; name: string };

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createClient();
  const [{ data: products }, { data: images }, { data: categories }] = await Promise.all([
    supabase.from("products").select("id,name,slug,short_description,price,contact_for_price,category_id,featured,display_order").eq("status", "published").order("display_order"),
    supabase.from("product_images").select("product_id,public_url,alt_text,is_primary,sort_order").order("sort_order"),
    supabase.from("categories").select("id,name").eq("active", true).order("display_order"),
  ]);
  const list = (products ?? []) as Product[];
  const photos = (images ?? []) as ProductImage[];
  const groups = (categories ?? []) as Category[];
  const photoFor = (productId: string) => photos.filter((photo) => photo.product_id === productId).sort((a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order)[0];
  const heroImage = photoFor(list[0]?.id);

  return <>
    <SiteHeader />
    <main id="top">
      <section className="hero"><div className="hero-copy"><span className="eyebrow">Crafted slowly. Loved forever.</span><h1>Art for the moments that make a home.</h1><p>Thoughtful, handmade décor inspired by the colors, rituals, and artistry of India.</p><a className="button-primary" href="/shop">Explore the collection</a></div><div className="hero-art">{heroImage ? <Image src={heroImage.public_url} alt={heroImage.alt_text || list[0]?.name || "Handcrafted Art Square piece"} fill priority sizes="(max-width: 640px) 100vw, 50vw" unoptimized /> : <div className="empty-note">New handmade pieces are coming soon.</div>}</div></section>
      <section className="section" id="collection"><div className="section-heading"><span className="eyebrow">Made by hand, made to last</span><h2>The Art Square collection</h2><p>One-of-a-kind details. A little piece of art for every corner.</p></div>
        {list.length ? <ProductCatalog products={list} images={photos} categories={groups} /> : <p className="empty-note">Our collection is being prepared. Please check back soon.</p>}
      </section>
      <section className="about-band" id="story"><span className="eyebrow">A little more meaning in every detail</span><h2>Made with care. Meant to be kept.</h2><p>Art Square celebrates the beauty of handmade work — bringing together traditional craft, considered color, and the warmth of pieces made one at a time.</p></section>
    </main><SiteFooter />
  </>;
}
