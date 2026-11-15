import type { Metadata } from "next";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import { WishlistPage } from "@/components/storefront/shopping-pages";
import { getPublicSiteUrl } from "@/lib/public-site-url";
export const metadata: Metadata = { title: "Wishlist — Art Square", description: "Your saved ART SQUARE pieces." };
export default function Page() { return <><SiteHeader /><WishlistPage siteUrl={getPublicSiteUrl()} /><SiteFooter /></>; }
