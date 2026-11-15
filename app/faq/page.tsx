import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/storefront/site-header";
import SiteFooter from "@/components/storefront/site-footer";

export const metadata: Metadata = {
  title: "Frequently asked questions — Art Square",
  description: "Answers about ART SQUARE handmade pieces, custom orders, enquiries and worldwide shipping.",
};

const questions = [
  { question: "How do I place an order?", answer: <>ART SQUARE currently handles orders by enquiry. Add pieces to your enquiry basket and send your details, or <Link href="/contact">contact the studio</Link>. The studio will confirm availability and the next steps with you before an order is accepted.</> },
  { question: "Are prices shown for every piece?", answer: <>Only verified prices are displayed. If a piece is marked “Contact for price”, please enquire and the studio will share the current quote.</> },
  { question: "Do you ship internationally?", answer: <>Worldwide enquiries are welcome. Destination availability, shipping charges, delivery estimates and any customs duties are confirmed individually before an order is accepted. See our <Link href="/shipping-policy">shipping information</Link>.</> },
  { question: "Can I request a custom design or colour?", answer: <>Some pieces support personalisation or customisation. Share your idea through the <Link href="/custom-orders">custom order form</Link>; the studio will confirm what is possible, along with pricing and timing.</> },
  { question: "How can I ask about a specific product?", answer: <>Open the product page and use its enquiry options, or add it to your enquiry basket. You can also message ART SQUARE on <a href="https://wa.me/919054934190" target="_blank" rel="noopener noreferrer">WhatsApp</a>.</> },
  { question: "When is my order confirmed?", answer: <>Submitting an enquiry does not complete a purchase or reserve an item. Your order is only accepted after the studio confirms the details directly with you. No payment is collected on this website.</> },
  { question: "What if I need to return or cancel an item?", answer: <>Please review the <Link href="/returns-policy">return and refund policy</Link> and contact the studio if you have a question about a specific enquiry or confirmed order.</> },
  { question: "How do I get in touch?", answer: <>Email <a href="mailto:artsquarein765@gmail.com">artsquarein765@gmail.com</a>, message us on <a href="https://wa.me/919054934190" target="_blank" rel="noopener noreferrer">WhatsApp</a>, or use the <Link href="/contact">contact form</Link>.</> },
];

export default function FAQPage() {
  return <><SiteHeader /><main className="page-shell"><header className="page-intro"><span className="eyebrow">A little more clarity</span><h1>Frequently asked questions.</h1><p>How enquiries, custom pieces and shipping work at ART SQUARE.</p></header><section className="faq-list" aria-label="Frequently asked questions">{questions.map(({ question, answer }) => <details className="faq-item" key={question}><summary>{question}</summary><div className="faq-answer"><p>{answer}</p></div></details>)}</section><p className="faq-contact">Still have a question? <Link href="/contact">Talk to the studio</Link>.</p></main><SiteFooter /></>;
}
