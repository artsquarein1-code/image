import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return NextResponse.json({ error: "Request could not be verified." }, { status: 403 });
  }
  const rawBody = await request.text();
  if (rawBody.length > 5000) return NextResponse.json({ error: "Request is too large." }, { status: 413 });

  let body: { name?: unknown; email?: unknown; phone?: unknown; message?: unknown; kind?: unknown; productId?: unknown; website?: unknown };
  try {
    body = JSON.parse(rawBody) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const kind = body.kind;
  const productId = body.productId;
  if (
    name.length < 2 || name.length > 120 || !emailPattern.test(email) || email.length > 254 ||
    phone.length > 30 || message.length < 10 || message.length > 3000 ||
    !["contact", "custom_order", "product"].includes(String(kind)) ||
    (kind === "product" && (typeof productId !== "string" || !uuidPattern.test(productId))) ||
    (kind !== "product" && productId !== undefined && productId !== null)
  ) {
    return NextResponse.json({ error: "Please check your contact details and enquiry." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.from("enquiries").insert({
      customer_name: name,
      email,
      phone,
      product_id: typeof productId === "string" ? productId : null,
      kind,
      message,
    });
    if (error) throw error;
    return NextResponse.json({ success: true, emailConfigured: false }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We could not save your enquiry just now. Please contact the studio directly." }, { status: 503 });
  }
}
