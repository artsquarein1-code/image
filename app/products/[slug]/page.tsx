import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import ProductActions from "@/components/storefront/product-actions";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("name,short_description").eq("slug",slug).eq("status","published").maybeSingle();
  return { title: product ? `${product.name} — Art Square` : "Product — Art Square", description: product?.short_description || "Discover handmade décor from Art Square." };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("id,sku,name,slug,short_description,description,category_id,price,original_price,contact_for_price,availability,custom_color,personalized,custom_order,notes,status").eq("slug",slug).eq("status","published").maybeSingle();
  if (!product) notFound();
  const [{ data: images }, { data: category }] = await Promise.all([
    supabase.from("product_images").select("id,public_url,alt_text,is_primary,sort_order").eq("product_id",product.id).order("sort_order"),
    product.category_id ? supabase.from("categories").select("name").eq("id",product.category_id).maybeSingle() : Promise.resolve({ data:null }),
  ]);
  const gallery = (images ?? []).sort((a,b)=>Number(b.is_primary)-Number(a.is_primary)||a.sort_order-b.sort_order);
  const whatsapp = `https://wa.me/919054934190?text=${encodeURIComponent(`Hello Art Square, I'm interested in ${product.name} (${product.sku}).`)}`;
  return <><SiteHeader /><main className="product-detail"><div><div className="detail-gallery">{gallery.length?gallery.map((photo)=><div className="detail-photo" key={photo.id}><Image src={photo.public_url} alt={photo.alt_text||product.name} fill sizes="(max-width: 700px) 100vw, 50vw" unoptimized /></div>):<div className="detail-photo empty-note">Product photography coming soon</div>}</div></div><section className="detail-copy"><Link className="product-category" href="/#collection">{category?.name??"Handmade décor"}</Link><h1>{product.name}</h1><p className="detail-sku">Product ID · {product.sku}</p><p className="detail-description">{product.description || product.short_description}</p><p className="detail-price">{product.contact_for_price||product.price==null?"Contact for price":`₹${Number(product.price).toLocaleString("en-IN")}`}</p><p className="availability">{product.availability==="available"?"Available to enquire":product.availability==="made_to_order"?"Made to order":"Currently unavailable"}</p><ProductActions productId={product.id} />{product.notes&&<p className="detail-description">{product.notes}</p>}<a className="button-primary" href={whatsapp} target="_blank" rel="noopener noreferrer">Enquire on WhatsApp</a>{(product.custom_color||product.personalized||product.custom_order)&&<div className="custom-options"><span className="eyebrow">Make it your own</span><ul>{product.custom_color&&<li>Custom colour available</li>}{product.personalized&&<li>Personalized design available</li>}{product.custom_order&&<li>Custom order available</li>}</ul></div>}<Link className="text-link back-link" href="/#collection">← Back to the collection</Link></section></main><SiteFooter /></>;
}
