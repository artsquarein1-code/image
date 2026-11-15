"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Product = { id: string; sku: string; name: string; slug: string; short_description: string; description: string; category_id: string | null; collection_id: string | null; price: number | null; original_price: number | null; contact_for_price: boolean; availability: string; featured: boolean; new_arrival: boolean; bestseller: boolean; status: string; custom_color: boolean; personalized: boolean; custom_order: boolean; notes: string; display_order: number };
type Category = { id: string; name: string; active: boolean };
type Collection = { id: string; name: string; active: boolean };
type Photo = { id: string; product_id: string; storage_path: string; public_url: string; alt_text: string; is_primary: boolean; sort_order: number; file_size: number | null; mime_type: string | null };
type Enquiry = { id: string; customer_name: string; email: string; phone: string; product_id: string | null; message: string; kind: string; status: string; created_at: string; products: { name: string }[] | null };
const blank: Omit<Product, "id"> = { sku: "", name: "", slug: "", short_description: "", description: "", category_id: null, collection_id: null, price: null, original_price: null, contact_for_price: true, availability: "available", featured: false, new_arrival: false, bestseller: false, status: "draft", custom_color: false, personalized: false, custom_order: false, notes: "", display_order: 0 };

export default function AdminDashboard({ initialProducts, categories, collections, initialImages, initialEnquiries, email }: { initialProducts: Product[]; categories: Category[]; collections: Collection[]; initialImages: Photo[]; initialEnquiries: Enquiry[]; email: string }) {
  const supabase = createClient(); const router = useRouter();
  const [products, setProducts] = useState(initialProducts); const [images, setImages] = useState(initialImages); const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [form, setForm] = useState<Omit<Product,"id"> & { id?: string }>(blank);
  const [status, setStatus] = useState(""); const [busy, setBusy] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]); const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const selectedImages = useMemo(() => images.filter((image) => image.product_id === form.id).sort((a,b) => a.sort_order-b.sort_order), [images,form.id]);
  useEffect(() => () => previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)), []);
  function startNew() { setForm({ ...blank, display_order: products.length + 1 }); setStatus(""); }
  function edit(product: Product) { setForm({ ...product }); setStatus(""); }
  function change<K extends keyof typeof form>(key: K, value: (typeof form)[K]) { setForm((current) => ({ ...current, [key]: value })); }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus("");
    const slug = (form.slug || form.name).toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const payload = { ...form, slug, price: form.contact_for_price ? null : form.price, original_price: form.original_price || null, category_id: form.category_id || null, collection_id: form.collection_id || null };
    const result = form.id ? await supabase.from("products").update(payload).eq("id",form.id) : await supabase.from("products").insert(payload);
    if (result.error) { setStatus(result.error.message.includes("row-level security") ? "Your account cannot make that change. Check your staff role and publishing permissions." : result.error.message); setBusy(false); return; }
    setStatus("Product saved."); setBusy(false); router.refresh();
    const { data } = await supabase.from("products").select("id,sku,name,slug,short_description,description,category_id,collection_id,price,original_price,contact_for_price,availability,featured,new_arrival,bestseller,status,custom_color,personalized,custom_order,notes,display_order").order("display_order");
    if (data) setProducts(data as Product[]);
    if (!form.id) { const created = data?.find((item) => item.slug === slug); if (created) setForm({ ...created }); }
  }
  async function uploadFiles(files: File[]) {
    if (!form.id) { setStatus("Save the product before adding images."); return; }
    if (!files.length) return;
    setBusy(true); setStatus("Uploading images to secure storage…");
    let uploaded = 0;
    let nextSortOrder = images.filter((image) => image.product_id === form.id).length;
    let makePrimary = images.every((image) => image.product_id !== form.id);
    for (const file of files) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10*1024*1024) { setStatus("Choose JPEG, PNG, or WebP images under 10 MB each."); continue; }
      const path = `${form.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g,"-")}`;
      const { error: uploadError } = await supabase.storage.from("product-images").upload(path,file,{contentType:file.type,upsert:false});
      if (uploadError) { setStatus(uploadError.message); continue; }
      const { data: publicData } = supabase.storage.from("product-images").getPublicUrl(path);
      const { data: record, error } = await supabase.from("product_images").insert({ product_id:form.id,storage_path:path,public_url:publicData.publicUrl,alt_text:form.name,is_primary:makePrimary,sort_order:nextSortOrder,file_size:file.size,mime_type:file.type }).select("id,product_id,storage_path,public_url,alt_text,is_primary,sort_order,file_size,mime_type").single();
      if (error) { await supabase.storage.from("product-images").remove([path]); setStatus(error.message); continue; }
      uploaded += 1; nextSortOrder += 1; makePrimary = false;
      setImages((current)=>[...current,record as Photo]);
      setStatus(`Uploaded ${uploaded} of ${files.length} image${files.length===1?"":"s"} and saved to the catalog.`);
    }
    setBusy(false); router.refresh();
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url)); previewUrlsRef.current = [];
    setPendingFiles([]); setPreviewUrls([]);
  }
  function chooseFiles(event: FormEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    const urls = files.map((file) => URL.createObjectURL(file));
    previewUrlsRef.current = urls;
    setPendingFiles(files); setPreviewUrls(urls);
    void uploadFiles(files);
  }
  async function updatePhoto(photo: Photo, changes: Partial<Photo>) {
    if (changes.is_primary) {
      const { error: clearError } = await supabase.from("product_images").update({ is_primary: false }).eq("product_id", photo.product_id).neq("id", photo.id);
      if (clearError) { setStatus(clearError.message); return; }
    }
    const { error } = await supabase.from("product_images").update(changes).eq("id",photo.id);
    if (error) { setStatus(error.message); return; }
    setImages((current)=>current.map((item)=>item.id===photo.id?{...item,...changes}:changes.is_primary?{...item,is_primary:false}:item));
  }
  async function movePhoto(photo: Photo, direction: -1|1) {
    const ordered=[...selectedImages]; const index=ordered.findIndex((item)=>item.id===photo.id); const next=index+direction; if(next<0||next>=ordered.length)return;
    const other=ordered[next]; const { error }=await supabase.from("product_images").upsert([{id:photo.id,product_id:photo.product_id,storage_path:photo.storage_path,public_url:photo.public_url,alt_text:photo.alt_text,is_primary:photo.is_primary,sort_order:other.sort_order},{id:other.id,product_id:other.product_id,storage_path:other.storage_path,public_url:other.public_url,alt_text:other.alt_text,is_primary:other.is_primary,sort_order:photo.sort_order}]);
    if(error){setStatus(error.message);return;} setImages((current)=>current.map((item)=>item.id===photo.id?{...item,sort_order:other.sort_order}:item.id===other.id?{...item,sort_order:photo.sort_order}:item));
  }
  async function removePhoto(photo: Photo) {
    const { error }=await supabase.from("product_images").delete().eq("id",photo.id); if(error){setStatus(error.message);return;}
    const { error:storageError }=await supabase.storage.from("product-images").remove([photo.storage_path]); if(storageError)setStatus(`Image record removed, but storage cleanup failed: ${storageError.message}`);
    setImages((current)=>current.filter((item)=>item.id!==photo.id));
  }
  async function updateEnquiryStatus(enquiry: Enquiry, nextStatus: string) {
    const { error } = await supabase.from("enquiries").update({ status: nextStatus }).eq("id", enquiry.id);
    if (error) { setStatus("Could not update this enquiry. Check your administrator permissions and try again."); return; }
    setEnquiries((current) => current.map((item) => item.id === enquiry.id ? { ...item, status: nextStatus } : item));
  }
  async function signOut(){await supabase.auth.signOut();router.replace("/admin/login");router.refresh();}

  return <main className="admin-page"><header className="admin-top"><Link href="/" className="brand">ART SQUARE <small>CATALOG STUDIO</small></Link><div>{email} <button className="admin-button" onClick={signOut}>Sign out</button></div></header><div className="admin-shell"><div className="admin-title"><div><span className="eyebrow">Catalog management</span><h1>Your product studio</h1><p>Changes to published items appear on the storefront as soon as they are saved.</p></div><button className="button-primary" onClick={startNew}>New product</button></div><div className="admin-grid"><section className="panel"><h2>Products <span style={{color:"#8a887f",fontFamily:"var(--sans)",fontSize:12}}>({products.length})</span></h2><div className="product-list">{products.map((product)=>{const photo=images.find((item)=>item.product_id===product.id&&item.is_primary)||images.find((item)=>item.product_id===product.id);return <div className="admin-product" key={product.id}>{photo?<Image className="admin-thumb" src={photo.public_url} alt="" width={58} height={65} unoptimized/>:<div className="admin-thumb"/>}<div><strong>{product.name}</strong><small>{product.sku} · {product.status} · {photo?"Image verified":"No product image"}</small></div><button className="admin-button" onClick={()=>edit(product)}>Edit</button><Link className="admin-button" href={`/products/${product.slug}`} target="_blank" rel="noopener noreferrer">Preview</Link></div>})}</div></section><section className="panel"><h2>{form.id?"Edit product":"Create product"}</h2><form onSubmit={save}><div className="field"><label htmlFor="name">Product name</label><input id="name" required value={form.name} onChange={(e)=>change("name",e.target.value)}/></div><div className="field-row"><div className="field"><label htmlFor="sku">SKU</label><input id="sku" required value={form.sku} onChange={(e)=>change("sku",e.target.value)}/></div><div className="field"><label htmlFor="slug">Slug</label><input id="slug" value={form.slug} onChange={(e)=>change("slug",e.target.value)}/></div></div><div className="field"><label htmlFor="short">Short description</label><input id="short" value={form.short_description} onChange={(e)=>change("short_description",e.target.value)}/></div><div className="field"><label htmlFor="description">Full description</label><textarea id="description" value={form.description} onChange={(e)=>change("description",e.target.value)}/></div><div className="field-row"><div className="field"><label htmlFor="category">Category</label><select id="category" value={form.category_id??""} onChange={(e)=>change("category_id",e.target.value||null)}><option value="">Select category</option>{categories.filter((c)=>c.active).map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div><div className="field"><label htmlFor="collection">Collection</label><select id="collection" value={form.collection_id??""} onChange={(e)=>change("collection_id",e.target.value||null)}><option value="">No collection</option>{collections.filter((c)=>c.active).map((c)=><option value={c.id} key={c.id}>{c.name}</option>)}</select></div></div><label className="inline-check"><input type="checkbox" checked={form.contact_for_price} onChange={(e)=>change("contact_for_price",e.target.checked)}/> Contact for price</label>{!form.contact_for_price&&<div className="field-row"><div className="field"><label htmlFor="price">Price (₹)</label><input id="price" type="number" min="0" step="0.01" required value={form.price??""} onChange={(e)=>change("price",e.target.value?Number(e.target.value):null)}/></div><div className="field"><label htmlFor="original">Original price (₹)</label><input id="original" type="number" min="0" step="0.01" value={form.original_price??""} onChange={(e)=>change("original_price",e.target.value?Number(e.target.value):null)}/></div></div>}<div className="field-row"><div className="field"><label htmlFor="availability">Availability</label><select id="availability" value={form.availability} onChange={(e)=>change("availability",e.target.value)}><option value="available">Available</option><option value="made_to_order">Made to order</option><option value="unavailable">Unavailable</option></select></div><div className="field"><label htmlFor="order">Display order</label><input id="order" type="number" value={form.display_order} onChange={(e)=>change("display_order",Number(e.target.value))}/></div></div><label className="inline-check"><input type="checkbox" checked={form.featured} onChange={(e)=>change("featured",e.target.checked)}/> Featured product</label><label className="inline-check"><input type="checkbox" checked={form.new_arrival} onChange={(e)=>change("new_arrival",e.target.checked)}/> New arrival</label><label className="inline-check"><input type="checkbox" checked={form.bestseller} onChange={(e)=>change("bestseller",e.target.checked)}/> Bestseller</label><label className="inline-check"><input type="checkbox" checked={form.custom_color} onChange={(e)=>change("custom_color",e.target.checked)}/> Custom colour available</label><label className="inline-check"><input type="checkbox" checked={form.personalized} onChange={(e)=>change("personalized",e.target.checked)}/> Personalized design available</label><label className="inline-check"><input type="checkbox" checked={form.custom_order} onChange={(e)=>change("custom_order",e.target.checked)}/> Custom orders available</label><div className="field"><label htmlFor="notes">Product-specific notes</label><textarea id="notes" value={form.notes} onChange={(e)=>change("notes",e.target.value)}/></div><div className="field"><label htmlFor="status">Publishing status</label><select id="status" value={form.status} onChange={(e)=>change("status",e.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></div><button className="button-primary" disabled={busy}>{busy?"Saving…":form.id?"Save changes":"Create product"}</button><button className="admin-button" type="button" onClick={startNew} style={{marginLeft:8}}>Clear</button><p className="form-status" role="status">{status}</p></form>{form.id&&<div className="image-manager"><h3>Product images</h3><p className="admin-note">JPEG, PNG, or WebP up to 10 MB. Uploads use the persistent product-images bucket.</p><div className="field"><label htmlFor="upload">Upload images</label><input id="upload" type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={busy} onChange={chooseFiles}/></div><div className="image-list">{pendingFiles.map((file,index)=><div className="image-row" key={`${file.name}-${index}`}><Image src={previewUrls[index]} alt={`Preview of ${file.name}`} width={56} height={58} unoptimized/><span>{file.name}<small style={{display:"block",color:"#77756c"}}>Uploading…</small></span></div>)}{selectedImages.map((photo,index)=><div className="image-row" key={photo.id}><Image src={photo.public_url} alt={photo.alt_text||form.name} width={56} height={58} unoptimized/><div>{photo.is_primary?"Primary image":"Gallery image"}<small style={{display:"block",color:"#77756c"}}>{photo.mime_type} · {photo.file_size?`${Math.round(photo.file_size/1024)} KB`:""}</small></div><div className="image-actions"><button className="admin-button" title="Move up" aria-label="Move image up" disabled={index===0} onClick={()=>movePhoto(photo,-1)}>↑</button><button className="admin-button" title="Move down" aria-label="Move image down" disabled={index===selectedImages.length-1} onClick={()=>movePhoto(photo,1)}>↓</button><button className="admin-button" onClick={()=>updatePhoto(photo,{is_primary:true})} disabled={photo.is_primary}>Main</button><button className="admin-button danger" onClick={()=>removePhoto(photo)}>Remove</button></div></div>)}</div></div>}</section></div><section className="panel enquiry-admin-panel"><h2>Customer enquiries <span style={{color:"#8a887f",fontFamily:"var(--sans)",fontSize:12}}>({enquiries.length})</span></h2>{enquiries.length ? <div className="enquiry-admin-list">{enquiries.map((enquiry) => <article className="enquiry-admin-card" key={enquiry.id}><div className="enquiry-admin-heading"><div><strong>{enquiry.customer_name}</strong><small>{new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(enquiry.created_at))} · {enquiry.kind.replaceAll("_", " ")}{enquiry.products?.[0]?.name ? ` · ${enquiry.products[0].name}` : ""}</small></div><select aria-label={`Status for ${enquiry.customer_name}`} value={enquiry.status} onChange={(event) => void updateEnquiryStatus(enquiry, event.target.value)}><option value="new">New</option><option value="contacted">Contacted</option><option value="in_progress">In progress</option><option value="completed">Completed</option><option value="closed">Closed</option></select></div><div className="enquiry-admin-contact"><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>{enquiry.phone && <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a>}</div><p>{enquiry.message}</p></article>)}</div> : <p className="admin-note">No enquiries have been received yet.</p>}<p className="form-status" role="status">{status}</p></section></div></main>;
}
