import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export const SHOPPING_COOKIE = "art_square_guest";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30;

export type ShoppingKind = "wishlist" | "cart";
export type ShoppingProduct = {
  id: string;
  name: string;
  slug: string;
  short_description: string | null;
  price: number | null;
  contact_for_price: boolean;
  availability: string;
  image: { public_url: string; alt_text: string | null } | null;
};
export type ShoppingItem = {
  kind: ShoppingKind;
  product_id: string;
  quantity: number;
  product: ShoppingProduct;
};

function serviceClient() {
  const url = process.env.SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) throw new Error("Shopping storage is not configured.");
  return createSupabaseClient(url, secret, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hashVisitorToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getOrCreateVisitorToken() {
  const jar = await cookies();
  const existing = jar.get(SHOPPING_COOKIE)?.value;
  if (existing && /^[a-f0-9]{64}$/.test(existing)) return existing;

  const token = randomBytes(32).toString("hex");
  jar.set(SHOPPING_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return token;
}

export async function getShoppingItems(token?: string): Promise<ShoppingItem[]> {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return [];
  const client = serviceClient();
  const { data: records, error } = await client
    .from("guest_shopping_items")
    .select("kind,product_id,quantity")
    .eq("visitor_token_hash", hashVisitorToken(token))
    .gte("updated_at", new Date(Date.now() - COOKIE_MAX_AGE * 1000).toISOString());
  if (error || !records?.length) return [];

  const productIds = [...new Set(records.map((record) => record.product_id))];
  const [{ data: products }, { data: photos }] = await Promise.all([
    client
      .from("products")
      .select("id,name,slug,short_description,price,contact_for_price,availability")
      .eq("status", "published")
      .in("id", productIds),
    client
      .from("product_images")
      .select("product_id,public_url,alt_text,is_primary,sort_order")
      .in("product_id", productIds)
      .order("sort_order"),
  ]);
  const productById = new Map((products ?? []).map((product) => [product.id, product]));
  const photoById = new Map<string, { public_url: string; alt_text: string | null }>();
  for (const photo of [...(photos ?? [])].sort(
    (a, b) => Number(b.is_primary) - Number(a.is_primary) || a.sort_order - b.sort_order,
  )) {
    if (!photoById.has(photo.product_id)) {
      photoById.set(photo.product_id, { public_url: photo.public_url, alt_text: photo.alt_text });
    }
  }

  return records.flatMap((record) => {
    const product = productById.get(record.product_id);
    if (!product) return [];
    return [{
      kind: record.kind as ShoppingKind,
      product_id: record.product_id,
      quantity: record.quantity,
      product: { ...product, image: photoById.get(product.id) ?? null },
    }];
  });
}

export function getShoppingServiceClient() {
  return serviceClient();
}
