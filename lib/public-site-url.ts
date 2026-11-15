export function getPublicSiteUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (configuredUrl) {
    const parsedUrl = new URL(configuredUrl);
    if (process.env.NODE_ENV === "production" && parsedUrl.protocol !== "https:") {
      throw new Error("NEXT_PUBLIC_SITE_URL must use HTTPS in production.");
    }
    return parsedUrl.origin;
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error("NEXT_PUBLIC_SITE_URL must be configured in production.");
}
