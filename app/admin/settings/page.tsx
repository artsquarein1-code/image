import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import styles from "@/components/admin/admin-management.module.css";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: permitted } = await supabase.rpc("is_art_square_admin");
  if (!permitted) redirect("/admin/login?denied=1");
  const { data: profile } = await supabase.from("profiles").select("role,display_name").eq("id", user.id).maybeSingle();

  return (
    <main className="admin-page">
      <header className="admin-top"><Link href="/" className="brand">ART SQUARE <small>CATALOG STUDIO</small></Link><Link href="/admin">Back to dashboard</Link></header>
      <div className="admin-shell">
        <div className="admin-title"><div><span className="eyebrow">Staff access</span><h1>Account settings</h1><p>Review the signed-in catalog account and its existing role.</p></div></div>
        <nav className={styles.adminNav} aria-label="Admin sections">
          <Link href="/admin/products">Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/collections">Collections</Link><Link href="/admin/enquiries">Enquiries</Link><Link href="/admin/settings" aria-current="page">Settings</Link>
        </nav>
        <section className="panel" aria-labelledby="account-title">
          <h2 id="account-title">Signed-in account</h2>
          <dl className={styles.settingsList}>
            <div><dt>Email</dt><dd>{user.email ?? "Unavailable"}</dd></div>
            <div><dt>Display name</dt><dd>{profile?.display_name || "Not set"}</dd></div>
            <div><dt>Catalog role</dt><dd>{profile?.role || "No staff profile is mapped"}</dd></div>
          </dl>
          <p className="admin-note">Staff roles are managed through the protected profiles table. This page does not offer public signup or self-service role changes.</p>
        </section>
      </div>
    </main>
  );
}
