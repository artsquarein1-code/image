import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPublicSiteUrl } from "@/lib/public-site-url";

export async function POST(request: Request) {
  let email: unknown;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  if (typeof email !== "string" || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const sessionClient = await createClient();
  const { data: { user }, error: userError } = await sessionClient.auth.getUser();
  if (userError || !user) {
    return NextResponse.json({ error: "You must be signed in as an Art Square admin." }, { status: 401 });
  }

  const { data: isAdmin, error: permissionError } = await sessionClient.rpc("is_art_square_admin");
  if (permissionError || !isAdmin) {
    return NextResponse.json({ error: "You are not authorized to invite staff." }, { status: 403 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceRoleKey || !supabaseUrl) {
    return NextResponse.json({ error: "Invitation service is not configured." }, { status: 503 });
  }

  let redirectTo: string;
  try {
    redirectTo = new URL("/auth/callback", getPublicSiteUrl()).toString();
  } catch {
    return NextResponse.json({ error: "Invitation service is not configured." }, { status: 503 });
  }

  const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (inviteError) {
    return NextResponse.json({ error: "The invitation could not be sent." }, { status: 502 });
  }

  return NextResponse.json({ message: "Invitation sent." }, { status: 200 });
}
