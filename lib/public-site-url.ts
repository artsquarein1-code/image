const DEVELOPMENT_SITE_URL = "https://art-square-website-development.vercel.app";

export function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const candidateUrl = configuredUrl ?? (vercelProductionUrl ? `https://${vercelProductionUrl}` : undefined);

  if (candidateUrl) {
    const parsedUrl = new URL(candidateUrl);
    if (parsedUrl.protocol !== "https:") {
      throw new Error("The public site URL must use HTTPS.");
    }
    return parsedUrl.origin;
  }

  if (process.env.NODE_ENV !== "production") return DEVELOPMENT_SITE_URL;
  throw new Error("NEXT_PUBLIC_SITE_URL or VERCEL_PROJECT_PRODUCTION_URL must be configured in production.");
}
