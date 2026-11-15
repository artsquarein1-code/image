import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BulkProductImageUpload from "./upload";

export const dynamic = "force-dynamic";

export default async function AdminImagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: permitted } = await supabase.rpc("is_art_square_admin");
  if (!permitted) redirect("/admin/login?denied=1");
  const [{ data: products }, { data: images }] = await Promise.all([
    supabase.from("products").select("id,name,slug,status").order("name"),
    supabase.from("product_images").select("product_id,storage_path,public_url,is_primary,sort_order"),
  ]);
  const files = [
    "WhatsApp Image 2026-11-12 at 8.52.23 PM.jpeg", "WhatsApp Image 2026-11-12 at 8.52.37 PM.jpeg", "WhatsApp Image 2026-11-12 at 8.52.38 PM (1).jpeg", "WhatsApp Image 2026-11-12 at 8.52.38 PM.jpeg",
    "WhatsApp Image 2026-11-12 at 8.53.01 PM (1).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (2).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (3).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (4).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (5).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (6).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (7).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (8).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (9).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (10).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (11).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (12).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (13).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (14).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (15).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (16).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (17).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (18).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (19).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM (20).jpeg", "WhatsApp Image 2026-11-12 at 8.53.01 PM.jpeg",
    "WhatsApp Image 2026-11-12 at 8.55.53 PM.jpeg", "WhatsApp Image 2026-11-12 at 8.55.56 PM.jpeg", "WhatsApp Image 2026-11-12 at 8.55.57 PM.jpeg", "WhatsApp Image 2026-11-12 at 9.01.22 PM (1).jpeg", "WhatsApp Image 2026-11-12 at 9.01.22 PM.jpeg", "WhatsApp Image 2026-11-12 at 9.01.23 PM (1).jpeg", "WhatsApp Image 2026-11-12 at 9.01.23 PM.jpeg",
  ];
  return <main className="admin-page"><header className="admin-top"><Link href="/" className="brand">ART SQUARE <small>CATALOG STUDIO</small></Link><Link href="/admin">Back to dashboard</Link></header><section className="admin-shell"><span className="eyebrow">Catalog management</span><h1>Bulk image upload</h1><p>Review each original, confirm its product mapping, then upload selected images to the product-images bucket. Existing image records are not modified.</p><BulkProductImageUpload files={files} products={products ?? []} existingImages={images ?? []} /></section></main>;
}
