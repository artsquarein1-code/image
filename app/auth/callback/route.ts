import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const RESET_PASSWORD_PATH = "/admin/reset-password";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const params = request.nextUrl.searchParams;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  const isRecovery =
    params.get("flow") === "recovery" ||
    params.get("next") === RESET_PASSWORD_PATH ||
    type === "recovery";

  if (params.has("error")) {
    const destination = isRecovery
      ? `${RESET_PASSWORD_PATH}?error=expired`
      : "/admin/login?invite=invalid";
    return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
  }

  let hasError = true;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    hasError = Boolean(error);
  } else if (tokenHash && (type === "invite" || type === "recovery")) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });
    hasError = Boolean(error);
  }

  const destination = isRecovery
    ? hasError
      ? `${RESET_PASSWORD_PATH}?error=expired`
      : RESET_PASSWORD_PATH
    : hasError
      ? "/admin/login?invite=invalid"
      : "/admin";

  return NextResponse.redirect(new URL(destination, request.nextUrl.origin));
}
