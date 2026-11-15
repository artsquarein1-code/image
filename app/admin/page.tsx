import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminDashboard from "./dashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: permitted } = await supabase.rpc("is_art_square_admin");
  if (!permitted) redirect("/admin/login?denied=1");
  const [{ data: products }, { data: categories }, { data: collections }, { data: images }] = await Promise.all([
    supabase.from("products").select("id,sku,name,slug,short_description,description,category_id,collection_id,price,original_price,contact_for_price,availability,featured,new_arrival,bestseller,status,custom_color,personalized,custom_order,notes,display_order").order("display_order"),
    supabase.from("categories").select("id,name,active").order("display_order"),
    supabase.from("collections").select("id,name,active").order("display_order"),
    supabase.from("product_images").select("id,product_id,storage_path,public_url,alt_text,is_primary,sort_order,file_size,mime_type").order("sort_order"),
  ]);
  return <AdminDashboard initialProducts={products ?? []} categories={categories ?? []} collections={collections ?? []} initialImages={images ?? []} email={user.email ?? "Staff"} />;
}
