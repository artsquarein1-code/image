"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ProductImageManager from "@/components/admin/product-image-manager";
import styles from "@/components/admin/admin-management.module.css";

type Product = { id: string; sku: string; name: string; slug: string; short_description: string; description: string; category_id: string | null; collection_id: string | null; price: number | null; original_price: number | null; contact_for_price: boolean; availability: string; featured: boolean; new_arrival: boolean; bestseller: boolean; status: string; custom_color: boolean; personalized: boolean; custom_order: boolean; notes: string; display_order: number };
type Category = { id: string; name: string; active: boolean };
type Collection = { id: string; name: string; active: boolean };
type Photo = { id: string; product_id: string; storage_path: string; public_url: string; alt_text: string; is_primary: boolean; sort_order: number; file_size: number | null; mime_type: string | null };
type Enquiry = { id: string; customer_name: string; email: string; phone: string; product_id: string | null; message: string; kind: string; status: string; created_at: string; products: { name: string }[] | null };
const blank: Omit<Product, "id"> = { sku: "", name: "", slug: "", short_description: "", description: "", category_id: null, collection_id: null, price: null, original_price: null, contact_for_price: true, availability: "available", featured: false, new_arrival: false, bestseller: false, status: "draft", custom_color: false, personalized: false, custom_order: false, notes: "", display_order: 0 };

export default function AdminDashboard({ initialProducts, categories, collections, initialImages, initialEnquiries, email, section = "all", initialProductMode, initialProductId }: { initialProducts: Product[]; categories: Category[]; collections: Collection[]; initialImages: Photo[]; initialEnquiries: Enquiry[]; email: string; section?: "all" | "products" | "enquiries"; initialProductMode?: "new" | "edit"; initialProductId?: string }) {
  const supabase = createClient(); const router = useRouter();
  const [products, setProducts] = useState(initialProducts); const [images, setImages] = useState(initialImages); const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [form, setForm] = useState<Omit<Product,"id"> & { id?: string }>(() => {
    const selectedProduct = initialProductId ? initialProducts.find((product) => product.id === initialProductId) : undefined;
    if (selectedProduct) return { ...selectedProduct };
    if (initialProductMode === "new") return { ...blank, display_order: initialProducts.length + 1 };
    return blank;
  });
  const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number; fileName: string } | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false); const [retryIntent, setRetryIntent] = useState<"save" | "draft" | "publish">("save");
  const [query, setQuery] = useState(""); const [statusFilter, setStatusFilter] = useState("all"); const [categoryFilter, setCategoryFilter] = useState("all");
  const previewUrlsRef = useRef<string[]>([]);
  const selectedImages = useMemo(() => images.filter((image) => image.product_id === form.id).sort((a,b) => a.sort_order-b.sort_order), [images,form.id]);
  const filteredProducts = useMemo(() => products.filter((product) => {
    const needle = query.trim().toLocaleLowerCase();
    const matchesQuery = !needle || [product.name, product.sku, product.slug].some((value) => value.toLocaleLowerCase().includes(needle));
    const matchesStatus = statusFilter === "all" || product.status === statusFilter;
    const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
    return matchesQuery && matchesStatus && matchesCategory;
  }), [products, query, statusFilter, categoryFilter]);
  useEffect(() => () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);
  function clearPendingFiles() {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setPendingFiles([]); setPreviewUrls([]);
  }
  function startNew() { clearPendingFiles(); setForm({ ...blank, display_order: products.length + 1 }); setStatus(""); }
  function change<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function uploadPendingFiles(productId: string, startOrder: number, makePrimary: boolean) {
    const paths: string[] = [];
    const records: Omit<Photo, "id">[] = [];
    try {
      for (const [index, file] of pendingFiles.entries()) {
        setUploadProgress({ current: index + 1, total: pendingFiles.length, fileName: file.name });
        const path = `${productId}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
        const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        paths.push(path);
        const { data } = supabase.storage.from("product-images").getPublicUrl(path);
        records.push({ product_id: productId, storage_path: path, public_url: data.publicUrl, alt_text: form.name.trim(), is_primary: makePrimary && index === 0, sort_order: startOrder + index, file_size: file.size, mime_type: file.type });
      }
      setUploadProgress(null);
      return { paths, records };
    } catch (cause) {
      setUploadProgress(null);
      setUploadFailed(true);
      const message = cause instanceof Error ? cause.message : "An image could not be uploaded.";
      if (paths.length) {
        const { error: cleanupError } = await supabase.storage.from("product-images").remove(paths);
        if (cleanupError) throw new Error(`${message} Cleanup of earlier uploaded files also failed: ${cleanupError.message}`);
      }
      throw cause instanceof Error ? cause : new Error(message);
    }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const intent = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const requestedStatus = intent?.value === "publish" ? "published" : intent?.value === "draft" ? "draft" : form.status;
    const requestedIntent = intent?.value === "publish" || intent?.value === "draft" ? intent.value : "save";
    setRetryIntent(requestedIntent);
    const slug = (form.slug || form.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const sku = form.sku.trim();
    if (!form.name.trim() || !sku || !slug) { setStatus("Enter a product name, SKU, and valid URL slug."); return; }
    if (products.some((product) => product.id !== form.id && (product.sku.toLowerCase() === sku.toLowerCase() || product.slug.toLowerCase() === slug.toLowerCase()))) { setStatus("That SKU or slug is already used by another product."); return; }
    if (!form.contact_for_price && (form.price == null || !Number.isFinite(form.price) || form.price < 0)) { setStatus("Enter a valid non-negative price or choose Contact for price."); return; }
    if (pendingFiles.some((file) => !/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10 * 1024 * 1024)) { setStatus("Choose JPEG, PNG, or WebP images under 10 MB each."); return; }
    setBusy(true); setStatus(""); setUploadFailed(false);
    const productId = form.id ?? crypto.randomUUID();
    const payload = { sku, name: form.name.trim(), slug, short_description: form.short_description.trim(), description: form.description.trim(), category_id: form.category_id || null, collection_id: form.collection_id || null, price: form.contact_for_price ? null : form.price, original_price: form.original_price ?? null, contact_for_price: form.contact_for_price, availability: form.availability, featured: form.featured, new_arrival: form.new_arrival, bestseller: form.bestseller, status: requestedStatus, custom_color: form.custom_color, personalized: form.personalized, custom_order: form.custom_order, notes: form.notes.trim(), display_order: form.display_order };
    const uploadedPaths: string[] = [];
    let insertedPhotoIds: string[] = [];
    let createdProduct = false;
    try {
      const uploaded = await uploadPendingFiles(productId, selectedImages.length, selectedImages.length === 0);
      uploadedPaths.push(...uploaded.paths);
      const productResult = form.id
        ? await supabase.from("products").update(payload).eq("id", productId)
        : await supabase.from("products").insert({ id: productId, ...payload });
      if (productResult.error) throw productResult.error;
      createdProduct = !form.id;
      if (uploaded.records.length) {
        const { data, error } = await supabase.from("product_images").insert(uploaded.records).select("id,product_id,storage_path,public_url,alt_text,is_primary,sort_order,file_size,mime_type");
        if (error) throw error;
        insertedPhotoIds = (data ?? []).map((photo) => photo.id);
        setImages((existing) => [...existing, ...(data as Photo[])]);
      }
      const { data } = await supabase.from("products").select("id,sku,name,slug,short_description,description,category_id,collection_id,price,original_price,contact_for_price,availability,featured,new_arrival,bestseller,status,custom_color,personalized,custom_order,notes,display_order").order("display_order");
      if (data) {
        setProducts(data as Product[]);
        const saved = data.find((product) => product.id === productId);
        if (saved) setForm({ ...saved });
      }
      setStatus(requestedStatus === "published" ? "Product published and storefront updated." : `Product saved. Status: ${requestedStatus}.`);
      setUploadFailed(false);
      clearPendingFiles();
      router.refresh();
    } catch (error) {
      const cleanupIssues: string[] = [];
      if (insertedPhotoIds.length) {
        const { error: imageRecordError } = await supabase.from("product_images").delete().in("id", insertedPhotoIds);
        if (imageRecordError) cleanupIssues.push(`Image-record cleanup failed: ${imageRecordError.message}`);
      }
      if (uploadedPaths.length) {
        const { error: storageCleanupError } = await supabase.storage.from("product-images").remove(uploadedPaths);
        if (storageCleanupError) cleanupIssues.push(`Storage cleanup failed: ${storageCleanupError.message}`);
      }
      if (createdProduct) {
        const { error: productCleanupError } = await supabase.from("products").delete().eq("id", productId);
        if (productCleanupError) cleanupIssues.push(`The draft product could not be removed: ${productCleanupError.message}`);
      }
      const message = error instanceof Error ? error.message : "The product could not be saved.";
      const permissionDenied = message.toLowerCase().includes("row-level security") || message.includes("42501");
      const cleanupMessage = cleanupIssues.length ? ` ${cleanupIssues.join(" ")}` : " Uploaded files were cleaned up where possible.";
      setStatus(permissionDenied ? `Your account cannot make that change. Check your staff role and publishing permissions.${cleanupIssues.length ? ` ${cleanupIssues.join(" ")}` : ""}` : `Save failed. ${message}.${cleanupMessage}`);
      setImages((existing) => existing.filter((photo) => !insertedPhotoIds.includes(photo.id)));
    } finally {
      setBusy(false);
    }
  }
  function chooseFiles(files: File[]) {
    const accepted = files.filter((file) => /^image\/(jpeg|png|webp)$/.test(file.type) && file.size <= 10 * 1024 * 1024);
    const urls = accepted.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = [...previewUrlsRef.current, ...urls];
    setPendingFiles((current) => [...current, ...accepted]);
    setPreviewUrls((current) => [...current, ...urls]);
    setUploadFailed(false);
    setStatus(files.length !== accepted.length ? "Only JPEG, PNG, and WebP files up to 10 MiB are accepted." : accepted.length ? `${accepted.length} image${accepted.length === 1 ? "" : "s"} added to the upload queue.` : "");
  }
  function removePendingFile(index: number) {
    const url = previewUrlsRef.current[index];
    if (url) URL.revokeObjectURL(url);
    setUploadFailed(false);
    previewUrlsRef.current = previewUrlsRef.current.filter((_, fileIndex) => fileIndex !== index);
    setPendingFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
    setPreviewUrls((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }
  async function updatePhoto(photo: Photo, changes: Partial<Photo>) {
    if (changes.is_primary) {
      const { error } = await supabase.from("product_images").update({ is_primary: true }).eq("id", photo.id);
      if (error) { setStatus(error.message); return; }
      const { error: clearError } = await supabase.from("product_images").update({ is_primary: false }).eq("product_id", photo.product_id).neq("id", photo.id);
      if (clearError) {
        await supabase.from("product_images").update({ is_primary: false }).eq("id", photo.id);
        setStatus(`Could not finish changing the primary image: ${clearError.message}`);
        return;
      }
      setImages((current) => current.map((item) => ({ ...item, is_primary: item.id === photo.id ? true : item.product_id === photo.product_id ? false : item.is_primary })));
      return;
    }
    const { error } = await supabase.from("product_images").update(changes).eq("id", photo.id);
    if (error) { setStatus(error.message); return; }
    setImages((current) => current.map((item) => item.id === photo.id ? { ...item, ...changes } : item));
  }
  async function movePhoto(photo: Photo, direction: -1|1) {
    const ordered = [...selectedImages]; const index = ordered.findIndex((item) => item.id === photo.id); const next = index + direction; if (next < 0 || next >= ordered.length) return;
    const other = ordered[next];
    const { error: firstError } = await supabase.from("product_images").update({ sort_order: -1 }).eq("id", photo.id);
    if (firstError) { setStatus(firstError.message); return; }
    const { error: secondError } = await supabase.from("product_images").update({ sort_order: photo.sort_order }).eq("id", other.id);
    if (secondError) { await supabase.from("product_images").update({ sort_order: photo.sort_order }).eq("id", photo.id); setStatus(secondError.message); return; }
    const { error: thirdError } = await supabase.from("product_images").update({ sort_order: other.sort_order }).eq("id", photo.id);
    if (thirdError) { setStatus(thirdError.message); return; }
    setImages((current) => current.map((item) => item.id === photo.id ? { ...item, sort_order: other.sort_order } : item.id === other.id ? { ...item, sort_order: photo.sort_order } : item));
  }
  async function removePhoto(photo: Photo) {
    if (!window.confirm("Delete this product image? This removes the stored file and its catalog record.")) return;
    const { error } = await supabase.from("product_images").delete().eq("id", photo.id);
    if (error) { setStatus(error.message); return; }
    const { error: storageError } = await supabase.storage.from("product-images").remove([photo.storage_path]);
    if (storageError) {
      const { error: restoreError } = await supabase.from("product_images").insert(photo);
      setStatus(restoreError ? `Storage cleanup failed and the image record could not be restored: ${storageError.message}` : `Storage cleanup failed; the image record was restored. ${storageError.message}`);
      return;
    }
    const remaining = selectedImages.filter((image) => image.id !== photo.id);
    setImages((current) => current.filter((item) => item.id !== photo.id).map((item) => photo.is_primary && item.id === remaining[0]?.id ? { ...item, is_primary: true } : item));
    if (photo.is_primary && remaining[0]) {
      const { error: primaryError } = await supabase.from("product_images").update({ is_primary: true }).eq("id", remaining[0].id);
      if (primaryError) setStatus(`Image removed; choose a new primary image manually. ${primaryError.message}`);
    }
  }
  async function updateEnquiryStatus(enquiry: Enquiry, nextStatus: string) {
    const { error } = await supabase.from("enquiries").update({ status: nextStatus }).eq("id", enquiry.id);
    if (error) { setStatus("Could not update this enquiry. Check your administrator permissions and try again."); return; }
    setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, status: nextStatus } : item));
  }
  async function signOut(){await supabase.auth.signOut();router.replace("/admin/login");router.refresh();}

  return <main className="admin-page"><header className="admin-top"><Link href="/" className="brand">ART SQUARE <small>CATALOG STUDIO</small></Link><div>{email} <button type="button" className="admin-button" onClick={signOut}>Sign out</button></div></header><div className="admin-shell"><nav className={styles.adminNav} aria-label="Admin sections"><Link href="/admin/products" aria-current={section === "products" ? "page" : undefined}>Products</Link><Link href="/admin/categories">Categories</Link><Link href="/admin/collections">Collections</Link><Link href="/admin/enquiries" aria-current={section === "enquiries" ? "page" : undefined}>Enquiries</Link><Link href="/admin/images">Bulk image upload</Link><Link href="/admin/settings">Settings</Link></nav><div className="admin-title"><div><span className="eyebrow">Catalog management</span><h1>Your product studio</h1><p>Changes to published items appear on the storefront as soon as they are saved.</p></div><button className="button-primary" type="button" onClick={()=>router.push("/admin/products/new")}>New product</button></div><div className="admin-grid" hidden={section === "enquiries"}><section className="panel"><h2>Products <span style={{color:"#8a887f",fontFamily:"var(--sans)",fontSize:12}}>({filteredProducts.length} of {products.length})</span></h2><div className={`field-row admin-filters ${styles.adminFilters}`}><div className="field"><label htmlFor="product-search">Search products</label><input id="product-search" type="search" value={query} onChange={(event)=>setQuery(event.target.value)} placeholder="Name, SKU, or slug"/></div><div className="field"><label htmlFor="product-status-filter">Filter by status</label><select id="product-status-filter" value={statusFilter} onChange={(event)=>setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div><div className="field"><label htmlFor="product-category-filter">Filter by category</label><select id="product-category-filter" value={categoryFilter} onChange={(event)=>setCategoryFilter(event.target.value)}><option value="all">All categories</option>{categories.map((category)=><option key={category.id} value={category.id}>{category.name}</option>)}</select></div></div><div className="product-list">{filteredProducts.map((product)=>{const photo=images.find((item)=>item.product_id===product.id&&item.is_primary)||images.find((item)=>item.product_id===product.id);return <div className="admin-product" key={product.id}>{photo?<Image className="admin-thumb" src={photo.public_url} alt="" width={58} height={65} unoptimized/>:<div className="admin-thumb"/>}<div><strong>{product.name}</strong><small>{product.sku} · {product.status} · {photo?"Image verified":"No product image"}</small></div><Link className="admin-button" href={`/admin/products/${product.id}`}>Edit</Link><Link className="admin-button" href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer">Preview</Link></div>})}</div></section><section className="panel"><h2>{form.id?"Edit product":"Create product"}</h2><form onSubmit={save}><div className="field"><label htmlFor="name">Product name</label><input id="name" required value={form.name} onChange={(e)=>change("name",e.target.value)}/></div><div className="field-row"><div className="field"><label htmlFor="sku">SKU</label><input id="sku" required value={form.sku} onChange={(e)=>change("sku",e.target.value)}/></div><div className="field"><label htmlFor="slug">Slug</label><input id="slug" value={form.slug} onChange={(e)=>change("slug",e.target.value)}/></div></div><div className="field"><label htmlFor="short">Short description</label><input id="short" value={form.short_description} onChange={(e)=>change("short_description",e.target.value)}/></div><div className="field"><label htmlFor="description">Full description</label><textarea id="description" value={form.description} onChange={(e)=>change("description",e.target.value)}/></div><div className="field-row"><div className="field"><label htmlFor="category">Category</label><select id="category" value={form.category_id??""} onChange={(e)=>change("category_id",e.target.value||null)}><option value="">Select category</option>{categories.filter((c)=>c.active).map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div><div className="field"><label htmlFor="collection">Collection</label><select id="collection" value={form.collection_id??""} onChange={(e)=>change("collection_id",e.target.value||null)}><option value="">No collection</option>{collections.filter((c)=>c.active).map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div></div><label className="inline-check"><input type="checkbox" checked={form.contact_for_price} onChange={(e)=>change("contact_for_price",e.target.checked)}/> Contact for price</label>{!form.contact_for_price&&<div className="field-row"><div className="field"><label htmlFor="price">Price (₹)</label><input id="price" type="number" min="0" step="0.01" required value={form.price??""} onChange={(e)=>change("price",e.target.value?Number(e.target.value):null)}/></div><div className="field"><label htmlFor="original">Original price (₹)</label><input id="original" type="number" min="0" step="0.01" value={form.original_price??""} onChange={(e)=>change("original_price",e.target.value?Number(e.target.value):null)}/></div></div>}<div className="field-row"><div className="field"><label htmlFor="availability">Availability</label><select id="availability" value={form.availability} onChange={(e)=>change("availability",e.target.value)}><option value="available">Available</option><option value="made_to_order">Made to order</option><option value="unavailable">Unavailable</option></select></div><div className="field"><label htmlFor="order">Display order</label><input id="order" type="number" value={form.display_order} onChange={(e)=>change("display_order",Number(e.target.value))}/></div></div><label className="inline-check"><input type="checkbox" checked={form.featured} onChange={(e)=>change("featured",e.target.checked)}/> Featured product</label><label className="inline-check"><input type="checkbox" checked={form.new_arrival} onChange={(e)=>change("new_arrival",e.target.checked)}/> New arrival</label><label className="inline-check"><input type="checkbox" checked={form.bestseller} onChange={(e)=>change("bestseller",e.target.checked)}/> Bestseller</label><label className="inline-check"><input type="checkbox" checked={form.custom_color} onChange={(e)=>change("custom_color",e.target.checked)}/> Custom colour available</label><label className="inline-check"><input type="checkbox" checked={form.personalized} onChange={(e)=>change("personalized",e.target.checked)}/> Personalized design available</label><label className="inline-check"><input type="checkbox" checked={form.custom_order} onChange={(e)=>change("custom_order",e.target.checked)}/> Custom orders available</label><div className="field"><label htmlFor="notes">Product-specific notes</label><textarea id="notes" value={form.notes} onChange={(e)=>change("notes",e.target.value)}/></div><div className="field"><label htmlFor="status">Publishing status</label><select id="status" value={form.status} onChange={(e)=>change("status",e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div><div className="admin-form-actions"><button className="admin-button" name="intent" value="save" disabled={busy}>{busy?"Saving…":form.id?"Save changes":"Save as draft"}</button><button className="admin-button" name="intent" value="draft" disabled={busy}>Save draft</button><button className="button-primary" name="intent" value="publish" disabled={busy}>{busy?"Publishing…":"Publish"}</button>{uploadFailed&&pendingFiles.length>0&&<button className="admin-button" name="intent" value={retryIntent} disabled={busy}>Retry failed uploads</button>}<button className="admin-button" type="button" onClick={startNew}>Clear</button></div><p className="form-status" role="status" aria-live="polite">{status}</p></form><ProductImageManager productName={form.name} photos={selectedImages} pendingFiles={pendingFiles} previewUrls={previewUrls} busy={busy} uploadProgress={uploadProgress} uploadFailed={uploadFailed} onFiles={chooseFiles} onRemovePending={removePendingFile} onMove={(photo, direction) => void movePhoto(photo, direction)} onPrimary={(photo) => void updatePhoto(photo, { is_primary: true })} onRemove={(photo) => void removePhoto(photo)} onAltText={(photo, value) => void updatePhoto(photo, { alt_text: value })} /></section></div><section className="panel enquiry-admin-panel" hidden={section === "products"}><h2>Customer enquiries <span style={{color:"#8a887f",fontFamily:"var(--sans)",fontSize:12}}>({enquiries.length})</span></h2>{enquiries.length ? <div className="enquiry-admin-list">{enquiries.map((enquiry) => <article className="enquiry-admin-card" key={enquiry.id}><div className="enquiry-admin-heading"><div><strong>{enquiry.customer_name}</strong><small>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(enquiry.created_at))} · {enquiry.kind.replaceAll("_", " ")}{enquiry.products?.[0]?.name ? ` · ${enquiry.products[0].name}` : ""}</small></div><select aria-label={`Status for ${enquiry.customer_name}`} value={enquiry.status} onChange={(event) => void updateEnquiryStatus(enquiry, event.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="closed">Closed</option></select></div><div className="enquiry-admin-contact"><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>}</div><p>{enquiry.message}</p></article>)}</div> : <p className="admin-note">No enquiries have been received yet.</p>}<p className="form-status" role="status">{status}</p></section></div></main>;
}
