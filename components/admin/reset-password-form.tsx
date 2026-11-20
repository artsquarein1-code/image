"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type ResetPasswordFormProps = {
  initiallyAuthenticated: boolean;
  linkError: boolean;
};

type ResetRequestError = {
  status?: number;
  code?: string;
};

function getResetRequestErrorMessage(error: ResetRequestError) {
  const code = error.code?.toLowerCase() ?? "";

  if (code.includes("disabled_legacy_key")) {
    return "Supabase rejected a disabled legacy API key. Update the project to use its publishable key; no reset email was confirmed sent.";
  }
  if (error.status === 401 || code.includes("invalid_api_key")) {
    return "Supabase rejected the project API key (authentication configuration). No reset email was confirmed sent.";
  }
  if (error.status === 429 || code.includes("rate_limit")) {
    return "Too many reset requests (rate limited). Wait before trying again.";
  }
  if (code.includes("redirect") || code.includes("url_not_allowed")) {
    return "Supabase rejected the reset callback URL (redirect configuration). Contact the site administrator.";
  }
  if (error.status && error.status >= 500) {
    return "Supabase could not process the reset request (Auth/email service unavailable). Try again later.";
  }
  if (!error.status) {
    return "Could not reach Supabase Auth (network error). Check your connection and try again.";
  }
  return `Supabase rejected the reset request (request error, HTTP ${error.status}). No reset email was confirmed sent.`;
}

export function ResetPasswordForm({
  initiallyAuthenticated,
  linkError,
}: ResetPasswordFormProps) {
  const [hasSession, setHasSession] = useState(initiallyAuthenticated);
  const [isLinkError, setIsLinkError] = useState(linkError);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "INITIAL_SESSION" || event === "PASSWORD_RECOVERY" || event === "SIGNED_IN")) {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function requestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const redirectUrl = process.env.NODE_ENV === "production"
      ? new URL("/auth/callback", window.location.origin)
      : new URL(process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? "/auth/callback", window.location.origin);
    redirectUrl.searchParams.set("flow", "recovery");
    redirectUrl.searchParams.set("next", "/admin/reset-password");

    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl.toString(),
      });

      if (error) {
        setMessage(getResetRequestErrorMessage(error));
        setBusy(false);
        return;
      }

      setSent(true);
    } catch (caughtError) {
      const error = typeof caughtError === "object" && caughtError !== null
        ? caughtError as ResetRequestError
        : {};
      setMessage(getResetRequestErrorMessage(error));
    }

    setBusy(false);
  }

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Choose a password with at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setBusy(true);
    const supabase = createClient();
    const { data: { user }, error: sessionError } = await supabase.auth.getUser();

    if (sessionError || !user) {
      setHasSession(false);
      setIsLinkError(true);
      setMessage("");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setMessage(error.message.toLowerCase().includes("password")
        ? "Choose a stronger password and try again."
        : "Your password could not be updated. Please try again.");
      setBusy(false);
      return;
    }

    await supabase.auth.signOut();
    setUpdated(true);
    setBusy(false);
  }

  return (
    <main className="admin-page">
      <header className="admin-top">
        <Link href="/" className="brand">ART SQUARE</Link>
        <Link href="/admin/login">Admin login</Link>
      </header>

      {updated ? (
        <section className="login-card" aria-labelledby="reset-success-title">
          <span className="eyebrow">Private studio</span>
          <h1 id="reset-success-title">Password updated</h1>
          <p className="muted-note" role="status">Your password has been changed. Sign in with your new password to continue.</p>
          <Link className="button-primary" href="/admin/login">Go to admin login</Link>
        </section>
      ) : hasSession ? (
        <form className="login-card" onSubmit={updatePassword}>
          <span className="eyebrow">Private studio</span>
          <h1>Choose a new password</h1>
          <p>Set a new password for your ART SQUARE staff account.</p>
          <div className="field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="confirm-password">Confirm password</label>
            <input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {message && <p className="error-message" role="alert">{message}</p>}
          <button className="button-primary" type="submit" disabled={busy}>
            {busy ? "Updating password…" : "Update password"}
          </button>
        </form>
      ) : (
        <form className="login-card" onSubmit={requestReset}>
          <span className="eyebrow">Private studio</span>
          <h1>{isLinkError ? "Request a new reset link" : "Reset your password"}</h1>
          {isLinkError ? (
            <p className="error-message" role="alert">This reset link is expired or invalid. Enter your email to request another one.</p>
          ) : (
            <p>Enter the email address for your ART SQUARE staff account and we’ll send a password-reset link if an account matches.</p>
          )}
          {sent ? (
            <p className="muted-note" role="status">If an account exists for this email, a reset link will arrive shortly. Check your inbox.</p>
          ) : (
            <>
              <div className="field">
                <label htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              {message && <p className="error-message" role="alert">{message}</p>}
              <button className="button-primary" type="submit" disabled={busy}>
                {busy ? "Sending link…" : "Send reset email"}
              </button>
            </>
          )}
          <p style={{ marginTop: 18 }}><Link className="text-link" href="/admin/login">Back to admin login</Link></p>
        </form>
      )}
    </main>
  );
}
