# ART SQUARE password reset setup

## Production Supabase Auth URL configuration

The current Vercel production deployment for `art-3046/image` serves the aliases `image-nine-gamma-41.vercel.app` and `image-art-3046.vercel.app`. Use the first as the canonical Supabase Site URL:

- **Site URL:** `https://image-nine-gamma-41.vercel.app`

Add these exact entries to the Supabase Auth redirect allowlist (include the second hostname only if it is used by staff):

- `https://image-nine-gamma-41.vercel.app/auth/callback`
- `https://image-nine-gamma-41.vercel.app/auth/callback?flow=recovery&next=%2Fadmin%2Freset-password`
- `https://image-art-3046.vercel.app/auth/callback`
- `https://image-art-3046.vercel.app/auth/callback?flow=recovery&next=%2Fadmin%2Freset-password`

The recovery request explicitly sends users to `/auth/callback` on the current production origin. The callback exchanges the PKCE `code` (or verifies a `recovery` token hash), establishes the Supabase session, then routes to `/admin/reset-password`. In non-production v0 previews, the configured `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` proxy is used instead.

Keep the Site URL on the canonical production origin, not `/`, `/admin`, or a preview hostname. If a custom production domain is added, set it as the canonical Site URL and add its exact callback URLs to the allowlist as well. Do not add broad wildcard redirects unless the team has a specific preview-domain requirement.

## End-to-end verification

1. Deploy this change to the production domain.
2. Open `/admin/login`, choose **Forgot your password?**, and submit an authorized staff email address.
3. Open the newest reset email promptly. It should land on `/admin/reset-password` with an active recovery session.
4. Set and confirm a password (minimum 8 characters), submit, and verify the success confirmation and admin-login link.
5. Sign in at `/admin/login` with the new password. Confirm an expired or reused link shows the request-another-email form rather than redirecting to the storefront.

A real inbox and authorized staff account are required to complete this production email test; do not put passwords or Supabase secret keys in logs, chat, or this document.
