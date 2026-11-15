import { redirect } from "next/navigation";
import CatalogTermManager from "@/components/admin/catalog-term-manager";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: permitted } = await supabase.rpc("is_art_square_manager");
  if (!permitted) redirect("/admin/login?denied=1");
  const { data, error } = await supabase.from("categories").select("id,name,slug,description,display_order,active").order("display_order");
  return <CatalogTermManager kind="categories" initialItems={data ?? []} loadFailed={Boolean(error)} />;
}
