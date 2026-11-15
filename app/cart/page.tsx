import type { Metadata } from "next";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import { CartPage } from "@/components/storefront/shopping-pages";
import { getPublicSiteUrl } from "@/lib/public-site-url";
export const metadata: Metadata = { title: "Enquiry basket — Art Square", description: "Collect handmade pieces to ask the ART SQUARE studio about." };
export default function Page() { return <><SiteHeader /><CartPage siteUrl={getPublicSiteUrl()} /><SiteFooter /></>; }
