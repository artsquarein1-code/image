import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import ProductActions from "@/components/storefront/product-actions";
import ProductWhatsAppLink from "@/components/storefront/product-whatsapp-link";
import { getPublicSiteUrl } from "@/lib/public-site-url";
import ProductGallery from "./product-gallery";
import styles from "./product-page.module.css";

type Props = { params: Promise<{ slug: string }> };
type RelatedProductImage = {
  id: string;
  product_id: string;
  public_url: string;
  alt_text: string;
  is_primary: boolean;
  sort_order: number;
};

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name,short_description")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return {
    title: product ? `${product.name} — Art Square` : "Product — Art Square",
    description: product?.short_description || "Discover handmade décor from Art Square.",
    alternates: { canonical: `/product/${slug}` },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("id,sku,name,slug,short_description,description,category_id,collection_id,price,original_price,contact_for_price,availability,custom_color,personalized,custom_order,notes,status")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (!product) notFound();

  const [{ data: images }, { data: category }, { data: collection }, { data: relatedProducts }] = await Promise.all([
    supabase
      .from("product_images")
      .select("id,public_url,alt_text,is_primary,sort_order")
      .eq("product_id", product.id)
      .order("sort_order"),
    product.category_id
      ? supabase.from("categories").select("name").eq("id", product.category_id).maybeSingle()
      : Promise.resolve({ data: null }),
    product.collection_id
      ? supabase.from("collections").select("name").eq("id", product.collection_id).maybeSingle()
      : Promise.resolve({ data: null }),
    product.collection_id
      ? supabase
          .from("products")
          .select("id,name,slug,price,contact_for_price")
          .eq("collection_id", product.collection_id)
          .eq("status", "published")
          .neq("id", product.id)
          .order("featured", { ascending: false })
          .limit(4)
      : Promise.resolve({ data: [] }),
  ]);
  const relatedIds = (relatedProducts ?? []).map((item) => item.id);
  const { data: relatedImages } = relatedIds.length
    ? await supabase
        .from("product_images")
        .select("id,product_id,public_url,alt_text,is_primary,sort_order")
        .in("product_id", relatedIds)
        .order("sort_order")
    : { data: [] };
  const relatedImageByProduct = new Map<string, RelatedProductImage>();
  for (const photo of relatedImages ?? []) {
    const current = relatedImageByProduct.get(photo.product_id);
    if (!current || (photo.is_primary && !current.is_primary) || photo.sort_order < current.sort_order) {
      relatedImageByProduct.set(photo.product_id, photo);
    }
  }
  const gallery = (images ?? []).sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  );
  const siteUrl = getPublicSiteUrl();

  return (
    <>
      <SiteHeader />
      <main>
        <div className="product-detail">
          <ProductGallery photos={gallery} productName={product.name} />
          <section className="detail-copy">
            <Link className="product-category" href="/#collection">
              {collection?.name ?? category?.name ?? "Handmade décor"}
            </Link>
            <h1>{product.name}</h1>
            <p className="detail-sku">Product ID · {product.sku || product.id}</p>
            <p className="detail-description">{product.description || product.short_description}</p>
            <p className="detail-price">
              {product.contact_for_price || product.price == null
                ? "Contact for price"
                : `₹${Number(product.price).toLocaleString("en-IN")}`}
            </p>
            <p className="availability">
              {product.availability === "available"
                ? "Available to enquire"
                : product.availability === "made_to_order"
                  ? "Made to order"
                  : "Currently unavailable"}
            </p>
            <ProductActions productId={product.id} />
            {product.notes && <p className="detail-description">{product.notes}</p>}
            <ProductWhatsAppLink product={product} siteUrl={siteUrl} />
            {(product.custom_color || product.personalized || product.custom_order) && (
              <div className="custom-options">
                <span className="eyebrow">Make it your own</span>
                <ul>
                  {product.custom_color && <li>Custom colour available</li>}
                  {product.personalized && <li>Personalized design available</li>}
                  {product.custom_order && <li>Custom order available</li>}
                </ul>
              </div>
            )}
            <Link className="text-link back-link" href="/#collection">
              ← Back to the collection
            </Link>
          </section>
        </div>
        {relatedProducts && relatedProducts.length > 0 && (
          <section className={styles.related} aria-labelledby="related-title">
            <span className="eyebrow">Continue exploring</span>
            <h2 id="related-title">More from this collection</h2>
            <div className={styles.relatedGrid}>
              {relatedProducts.map((item) => {
                const image = relatedImageByProduct.get(item.id);
                return (
                  <Link className={styles.relatedCard} href={`/product/${item.slug}`} key={item.id}>
                    <div className={styles.relatedImage}>
                      {image && (
                        <Image
                          src={image.public_url}
                          alt={image.alt_text || item.name}
                          fill
                          sizes="(max-width: 640px) 50vw, 25vw"
                          unoptimized
                        />
                      )}
                    </div>
                    <h3>{item.name}</h3>
                    <span>
                      {item.contact_for_price || item.price == null
                        ? "Contact for price"
                        : `₹${Number(item.price).toLocaleString("en-IN")}`}
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
