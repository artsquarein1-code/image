import type { Metadata } from "next";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";
import EnquiryForm from "@/components/storefront/enquiry-form";

export const metadata: Metadata = { title: "Contact — Art Square", description: "Contact ART SQUARE about a handmade piece, gifting or a custom creation." };
export default function ContactPage() {
  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">We would love to hear from you</span><h1>Let&apos;s talk about art.</h1><p>Ask about a piece, a gift or an idea you would like to make personal.</p></header><div className="contact-layout"><section className="content-card"><span className="eyebrow">The studio</span><h2 className="serif-heading">Worldwide enquiries welcome</h2><p>Reach out directly or leave a note for the studio.</p><ul className="contact-list"><li><strong>Email</strong><br /><a href="mailto:artsquarein765@gmail.com">artsquarein765@gmail.com</a></li><li><strong>WhatsApp</strong><br /><a href="https://wa.me/919054934190" target="_blank" rel="noopener noreferrer">Message ART SQUARE</a></li><li><strong>Instagram</strong><br /><a href="https://www.instagram.com/art_square_in/" target="_blank" rel="noopener noreferrer">@art_square_in</a></li></ul></section><section className="content-card"><h2 className="serif-heading">Send an enquiry</h2><EnquiryForm /></section></div></main><SiteFooter /></>;
}
