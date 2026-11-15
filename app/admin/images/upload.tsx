"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; name: string; slug: string; status: string };
type ExistingImage = { product_id: string; storage_path: string; public_url: string; is_primary: boolean; sort_order: number };
type RowStatus = { kind: "idle" | "uploading" | "success" | "error"; message: string };

export default function BulkProductImageUpload({ files, products, existingImages }: { files: string[]; products: Product[]; existingImages: ExistingImage[] }) {
  const supabase = createClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<Record<string, RowStatus>>({});
  const [busy, setBusy] = useState(false);
  const [filter, setFilter] = useState("");
  const linked = useMemo(() => new Set(existingImages.map((image) => image.storage_path)), [existingImages]);
  const visibleFiles = useMemo(() => files.filter((file) => file.toLowerCase().includes(filter.toLowerCase())), [files, filter]);
  function toggle(file: string) { setSelected((current) => current.includes(file) ? current.filter((item) => item !== file) : [...current, file]); }
  async function uploadSelected() {
    if (busy || selected.length === 0) return;
    const unmapped = selected.filter((file) => !mapping[file]);
    if (unmapped.length) {
      setStatus((current) => ({ ...current, ...Object.fromEntries(unmapped.map((file) => [file, { kind: "error", message: "Choose the matching product before uploading." }])) }));
      return;
    }
    setBusy(true);
    for (const [index, fileName] of selected.entries()) {
      const product = products.find((item) => item.id === mapping[fileName]);
      if (!product) continue;
      const storagePath = `catalog/${product.id}/source-${encodeURIComponent(fileName).replaceAll("%", "_")}`;
      if (linked.has(storagePath)) {
        setStatus((current) => ({ ...current, [fileName]: { kind: "success", message: "Already uploaded and linked; skipped to prevent a duplicate." } }));
        continue;
      }
      setStatus((current) => ({ ...current, [fileName]: { kind: "uploading", message: `Uploading ${index + 1} of ${selected.length}…` } }));
      let uploaded = false;
      try {
        const response = await fetch(`/api/admin/source-image?name=${encodeURIComponent(fileName)}`);
        if (!response.ok) throw new Error("Could not read the repository image. Refresh and try again.");
        const blob = await response.blob();
        const file = new File([blob], fileName, { type: "image/jpeg" });
        const { error: uploadError } = await supabase.storage.from("product-images").upload(storagePath, file, { contentType: "image/jpeg", upsert: false });
        if (uploadError) {
          if (/already exists|duplicate/i.test(uploadError.message)) {
            setStatus((current) => ({ ...current, [fileName]: { kind: "error", message: "A storage object already exists at this path. No duplicate was created; refresh the page to reconcile it." } }));
            continue;
          }
          throw uploadError;
        }
        uploaded = true;
        const { data: { publicUrl } } = supabase.storage.from("product-images").getPublicUrl(storagePath);
        const existingForProduct = existingImages.filter((image) => image.product_id === product.id);
        const { error: recordError } = await supabase.from("product_images").insert({ product_id: product.id, storage_path: storagePath, public_url: publicUrl, alt_text: product.name, is_primary: existingForProduct.length === 0, sort_order: existingForProduct.length });
        if (recordError) {
          const { error: cleanupError } = await supabase.storage.from("product-images").remove([storagePath]);
          throw new Error(`${recordError.message}${cleanupError ? ` Storage cleanup also failed: ${cleanupError.message}` : " The uploaded object was removed."}`);
        }
        setStatus((current) => ({ ...current, [fileName]: { kind: "success", message: "Uploaded and linked." } }));
      } catch (error) {
        const message = error instanceof Error ? error.message : "Upload failed.";
        if (uploaded) {
          const { error: cleanupError } = await supabase.storage.from("product-images").remove([storagePath]);
          setStatus((current) => ({ ...current, [fileName]: { kind: "error", message: `${message}${cleanupError ? ` Cleanup failed: ${cleanupError.message}` : " The object was removed."}` } }));
        } else {
          setStatus((current) => ({ ...current, [fileName]: { kind: "error", message } }));
        }
      }
    }
    setBusy(false);
  }
  const completed = Object.values(status).filter((item) => item.kind === "success").length;
  return <div>
    <div className="field-row" style={{ alignItems: "end", margin: "24px 0" }}><div className="field"><label htmlFor="image-search">Filter source images</label><input id="image-search" type="search" value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Search filenames" /></div><p aria-live="polite">{selected.length} selected · {completed} completed</p><button className="admin-button" type="button" disabled={busy || !visibleFiles.length} onClick={() => setSelected((current) => Array.from(new Set([...current, ...visibleFiles.filter((file) => !status[file] || status[file].kind !== "success")])))}>Select visible</button><button className="admin-button" type="button" disabled={busy} onClick={() => setSelected([])}>Clear selection</button><button className="button-primary" type="button" disabled={busy || selected.length === 0} onClick={uploadSelected}>{busy ? "Uploading…" : `Upload ${selected.length} selected`}</button></div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", gap: 16 }}>
      {visibleFiles.map((file, index) => {
        const itemStatus = status[file];
        return <article key={file} style={{ border: "1px solid #d8d5cc", borderRadius: 12, padding: 12, background: "#fff" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}><input type="checkbox" checked={selected.includes(file)} disabled={busy || itemStatus?.kind === "success"} onChange={() => toggle(file)} /><strong>Image {files.indexOf(file) + 1}</strong></label>
          <Image src={`/api/admin/source-image?name=${encodeURIComponent(file)}`} alt={`Repository source image ${files.indexOf(file) + 1}`} width={480} height={360} unoptimized style={{ width: "100%", height: 190, objectFit: "contain", background: "#f4f1ea", borderRadius: 8 }} />
          <p style={{ fontSize: 12, overflowWrap: "anywhere" }}>{file}</p>
          <label className="field" htmlFor={`mapping-${index}`}><span>Confirm product mapping</span><select id={`mapping-${index}`} value={mapping[file] ?? ""} disabled={busy} onChange={(event) => setMapping((current) => ({ ...current, [file]: event.target.value }))}><option value="">Choose product…</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name}{product.status !== "published" ? ` (${product.status})` : ""}</option>)}</select></label>
          {itemStatus && <p role={itemStatus.kind === "error" ? "alert" : "status"} style={{ color: itemStatus.kind === "error" ? "#a21c18" : itemStatus.kind === "success" ? "#176b43" : "#6c5a2c", fontSize: 13 }}>{itemStatus.message}</p>}
        </article>;
      })}
    </div>
    <p style={{ marginTop: 20, color: "#68665f" }}>Images are not uploaded until selected and mapped. Matching is intentionally manual; existing catalog records are preserved. Database and Storage policies must authorize the signed-in admin account.</p>
  </div>;
}
