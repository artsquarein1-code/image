import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const code = request.nextUrl.searchParams.get("code");
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  let error: unknown = new Error("Invalid authentication callback.");

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type === "invite") {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "invite" }));
  }

  const destination = error ? "/admin/login?invite=invalid" : "/admin";
  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
