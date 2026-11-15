"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import styles from "./admin-management.module.css";

type CatalogTerm = {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  active: boolean;
};

type TermKind = "categories" | "collections";

function slugify(value: string) {
  return value.toLocaleLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function CatalogTermManager({
  kind,
  initialItems,
  loadFailed = false,
}: {
  kind: TermKind;
  initialItems: CatalogTerm[];
  loadFailed?: boolean;
}) {
  const supabase = createClient();
  const [items, setItems] = useState(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [displayOrder, setDisplayOrder] = useState(0);
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const title = kind === "categories" ? "Categories" : "Collections";

  function reset() {
    setSelectedId(null);
    setName("");
    setSlug("");
    setDescription("");
    setDisplayOrder(items.length + 1);
    setActive(true);
    setStatus("");
  }

  function edit(item: CatalogTerm) {
    setSelectedId(item.id);
    setName(item.name);
    setSlug(item.slug);
    setDescription(item.description);
    setDisplayOrder(item.display_order);
    setActive(item.active);
    setStatus("");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedName = name.trim();
    const normalizedSlug = slugify(slug || normalizedName);
    if (!normalizedName || !normalizedSlug) {
      setStatus("Enter a name and a valid URL slug.");
      return;
    }
    if (items.some((item) => item.id !== selectedId && item.slug.toLowerCase() === normalizedSlug)) {
      setStatus("That slug is already in use.");
      return;
    }

    setBusy(true);
    setStatus("");
    const payload = {
      name: normalizedName,
      slug: normalizedSlug,
      description: description.trim(),
      display_order: Number.isFinite(displayOrder) ? displayOrder : 0,
      active,
    };
    const result = kind === "categories"
      ? selectedId
        ? await supabase.from("categories").update(payload).eq("id", selectedId)
        : await supabase.from("categories").insert(payload)
      : selectedId
        ? await supabase.from("collections").update(payload).eq("id", selectedId)
        : await supabase.from("collections").insert(payload);

    if (result.error) {
      setStatus(result.error.code === "42501" ? "Your staff role cannot manage categories or collections." : "Could not save this entry. Check that its slug is unique and try again.");
      setBusy(false);
      return;
    }

    const refreshed = kind === "categories"
      ? await supabase.from("categories").select("id,name,slug,description,display_order,active").order("display_order")
      : await supabase.from("collections").select("id,name,slug,description,display_order,active").order("display_order");
    if (refreshed.error) {
      setStatus("Saved, but the list could not be refreshed. Reload the page to see the latest entries.");
      setBusy(false);
      return;
    }
    setItems((refreshed.data ?? []) as CatalogTerm[]);
    reset();
    setStatus(`${title.slice(0, -1)} saved.`);
    setBusy(false);
  }

  return (
    <main className="admin-page">
      <header className="admin-top">
        <Link href="/" className="brand">ART SQUARE <small>CATALOG STUDIO</small></Link>
        <Link href="/admin">Back to dashboard</Link>
      </header>
      <div className={`admin-shell ${styles.termManager}`}>
        <div className="admin-title">
          <div><span className="eyebrow">Catalog management</span><h1>{title}</h1><p>Manage the existing {title.toLocaleLowerCase()} used by the public storefront.</p></div>
          <button className="button-primary" type="button" onClick={reset}>Add {kind === "categories" ? "category" : "collection"}</button>
        </div>
        <nav className={styles.adminNav} aria-label="Admin sections">
          <Link href="/admin/products">Products</Link>
          <Link href="/admin/categories" aria-current={kind === "categories" ? "page" : undefined}>Categories</Link>
          <Link href="/admin/collections" aria-current={kind === "collections" ? "page" : undefined}>Collections</Link>
          <Link href="/admin/enquiries">Enquiries</Link>
          <Link href="/admin/settings">Settings</Link>
        </nav>
        {loadFailed && <p className="error-message" role="alert">Could not load this catalog list. Refresh the page to try again.</p>}
        <div className={styles.termGrid}>
          <section className="panel" aria-labelledby="term-list-title">
            <h2 id="term-list-title">Existing {title.toLocaleLowerCase()} ({items.length})</h2>
            {items.length ? (
              <div className={styles.termList}>
                {items.map((item) => (
                  <article className={styles.termRow} key={item.id}>
                    <div><strong>{item.name}</strong><small>/{kind}/{item.slug} · order {item.display_order} · {item.active ? "Active" : "Hidden"}</small></div>
                    <div className={styles.termStatus}>
                      <Link className="admin-button" href={`/${kind}/${item.slug}`} target="_blank" rel="noopener noreferrer">Preview</Link>
                      <button className="admin-button" type="button" onClick={() => edit(item)}>Edit</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="admin-note">No {title.toLocaleLowerCase()} are available.</p>}
          </section>
          <form className={styles.termForm} onSubmit={save}>
            <h2>{selectedId ? `Edit ${kind === "categories" ? "category" : "collection"}` : `Add ${kind === "categories" ? "category" : "collection"}`}</h2>
            <div className="field"><label htmlFor="term-name">Name</label><input id="term-name" required maxLength={120} value={name} onChange={(event) => { setName(event.target.value); if (!slug) setSlug(slugify(event.target.value)); }} /></div>
            <div className="field"><label htmlFor="term-slug">URL slug</label><input id="term-slug" required maxLength={140} value={slug} onChange={(event) => setSlug(event.target.value)} /></div>
            <div className="field"><label htmlFor="term-description">Description</label><textarea id="term-description" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} /></div>
            <div className="field"><label htmlFor="term-order">Display order</label><input id="term-order" type="number" step="1" value={displayOrder} onChange={(event) => setDisplayOrder(Number(event.target.value))} /></div>
            <label className="inline-check"><input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} /> Visible on the public storefront</label>
            {status && <p className="form-status" role="status" aria-live="polite">{status}</p>}
            <div className="admin-form-actions"><button className="button-primary" type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</button>{selectedId && <button className="admin-button" type="button" onClick={reset} disabled={busy}>Cancel</button>}</div>
          </form>
        </div>
      </div>
    </main>
  );
}
