import type { ReactNode } from "react";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";

export default function PolicyPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">ART SQUARE information</span><h1>{title}</h1><p>{intro}</p></header><article className="policy-copy">{children}<p>For questions about this policy or a specific enquiry, please contact <a href="mailto:artsquarein765@gmail.com">artsquarein765@gmail.com</a>.</p><p>Last reviewed: November 2026</p></article></main><SiteFooter /></>;
}
