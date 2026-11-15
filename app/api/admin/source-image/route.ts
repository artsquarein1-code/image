import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: permitted, error } = await supabase.rpc("is_art_square_admin");
  if (error || !permitted) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const name = request.nextUrl.searchParams.get("name") ?? "";
  if (!/^WhatsApp Image 2026-11-12 at (8\.52\.(23|37)|8\.55\.(53|56|57)) PM\.jpeg$|^WhatsApp Image 2026-11-12 at 8\.52\.38 PM( \(1\))?\.jpeg$|^WhatsApp Image 2026-11-12 at 8\.53\.01 PM( \((?:[1-9]|1[0-9]|20)\))?\.jpeg$|^WhatsApp Image 2026-11-12 at 9\.01\.(22|23) PM( \(1\))?\.jpeg$/.test(name)) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
  try {
    const content = await readFile(join(process.cwd(), name));
    return new NextResponse(new Uint8Array(content), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } catch {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }
}
