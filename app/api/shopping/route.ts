import { NextRequest, NextResponse } from "next/server";
import {
  getOrCreateVisitorToken,
  getShoppingItems,
  getShoppingServiceClient,
  hashVisitorToken,
  type ShoppingKind,
} from "@/lib/shopping/server";

export const runtime = "nodejs";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const kinds = new Set<ShoppingKind>(["wishlist", "cart"]);

function verifyOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  return Boolean(origin && origin === new URL(request.url).origin);
}

export async function GET() {
  try {
    const token = await getOrCreateVisitorToken();
    const items = await getShoppingItems(token);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Shopping lists are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  }
  const rawBody = await request.text();
  if (rawBody.length > 4096) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: { action?: string; kind?: string; productId?: string; quantity?: number };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const action = body.action;
  const kind = body.kind;
  if (!kind || !kinds.has(kind as ShoppingKind) || !["add", "set", "remove", "clear"].includes(action ?? "")) {
    return NextResponse.json({ error: "Invalid shopping-list action." }, { status: 400 });
  }
  if (action !== "clear" && (!body.productId || !uuidPattern.test(body.productId))) {
    return NextResponse.json({ error: "Choose a valid product." }, { status: 400 });
  }
  if (
    kind === "cart" &&
    (action === "set" || (action === "add" && body.quantity !== undefined)) &&
    (!Number.isInteger(body.quantity) || Number(body.quantity) < 1 || Number(body.quantity) > 10)
  ) {
    return NextResponse.json({ error: "Choose a quantity from 1 to 10." }, { status: 400 });
  }

  try {
    const token = await getOrCreateVisitorToken();
    const visitorHash = hashVisitorToken(token);
    const supabase = getShoppingServiceClient();
    await supabase.from("guest_shopping_items").delete()
      .lt("updated_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (action === "clear") {
      const { error } = await supabase.from("guest_shopping_items").delete().eq("visitor_token_hash", visitorHash).eq("kind", kind);
      if (error) throw error;
    } else if (action === "remove") {
      const { error } = await supabase.from("guest_shopping_items").delete().eq("visitor_token_hash", visitorHash).eq("kind", kind).eq("product_id", body.productId!);
      if (error) throw error;
    } else {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("id")
        .eq("id", body.productId!)
        .eq("status", "published")
        .maybeSingle();
      if (productError || !product) return NextResponse.json({ error: "That piece is no longer available." }, { status: 404 });

      const { data: existing, error: existingError } = await supabase
        .from("guest_shopping_items")
        .select("quantity")
        .eq("visitor_token_hash", visitorHash)
        .eq("kind", kind)
        .eq("product_id", body.productId!)
        .maybeSingle();
      if (existingError) throw existingError;
      const requestedQuantity = Number(body.quantity ?? 1);
      const quantity = kind === "wishlist"
        ? 1
        : action === "set"
          ? requestedQuantity
          : (existing?.quantity ?? 0) + requestedQuantity;
      if (kind === "cart" && quantity > 10) {
        return NextResponse.json({ error: "Your basket can hold up to 10 of each piece." }, { status: 400 });
      }
      const { error } = await supabase.from("guest_shopping_items").upsert({
        visitor_token_hash: visitorHash,
        kind,
        product_id: body.productId!,
        quantity,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
    }

    const items = await getShoppingItems(token);
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Shopping lists are temporarily unavailable." }, { status: 503 });
  }
}
