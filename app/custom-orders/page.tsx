import type { Metadata } from "next";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import EnquiryForm from "@/components/storefront/enquiry-form";

export const metadata: Metadata = { title: "Custom orders — Art Square", description: "Share your idea for a personalised handmade ART SQUARE creation." };
export default function CustomOrdersPage() {
  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">A thoughtful piece, made personal</span><h1>Made personal. Made for you.</h1><p>Have a colour, occasion or idea in mind? Tell us what you are imagining and the studio will follow up to discuss what is possible.</p></header><div className="contact-layout"><section className="story-copy"><h2>Start with an idea.</h2><p>Share the collection that caught your eye, the colours you are drawn to, and any details that would make the piece feel like yours. Each request is considered individually; availability, timing and pricing are confirmed with you directly.</p><p>To share a reference photo, you can send it to us on <a className="text-link" href="https://wa.me/919054934190" target="_blank" rel="noopener noreferrer">WhatsApp</a> after submitting your enquiry.</p></section><section className="content-card"><EnquiryForm custom /></section></div></main><SiteFooter /></>;
}
