"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setMessage(error.message.includes("Email not confirmed") ? "Please confirm your email address before signing in." : error.status === 429 ? "Too many sign-in attempts. Please wait and try again." : error.status && error.status >= 500 ? "Sign-in is temporarily unavailable. Please try again shortly." : "Invalid email or password."); setBusy(false); return; }
    const { data, error: roleError } = await supabase.rpc("is_art_square_admin");
    if (roleError || !data) { await supabase.auth.signOut(); setMessage("This account does not have catalog access."); setBusy(false); return; }
    router.replace("/admin"); router.refresh();
  }
  return <main className="admin-page"><header className="admin-top"><Link href="/" className="brand">ART SQUARE</Link><Link href="/">Return to storefront</Link></header><form className="login-card" onSubmit={submit}><span className="eyebrow">Private studio</span><h1>Welcome back</h1><p>Sign in with your Art Square staff account to manage the product catalog.</p><div className="field"><label htmlFor="email">Email</label><input id="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} /></div><div className="field"><label htmlFor="password">Password</label><input id="password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></div>{message && <p className="error-message" role="alert">{message}</p>}<p style={{ margin: "14px 0 0", textAlign: "center" }}><Link className="text-link" href="/admin/reset-password">Forgot your password?</Link></p><button className="button-primary" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button></form></main>;
}
