"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function EnquiryForm({ custom = false }: { custom?: boolean }) {
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sending) return;
    const form = event.currentTarget;
    const values = new FormData(form);
    if (String(values.get("website") ?? "").trim()) return;
    const name = String(values.get("name") ?? "").trim();
    const email = String(values.get("email") ?? "").trim();
    const phone = String(values.get("phone") ?? "").trim();
    const message = String(values.get("message") ?? "").trim();
    const quantity = Number(values.get("quantity") ?? 1);
    if (name.length < 2 || name.length > 120 || email.length > 254 || phone.length > 30 || message.length < 10 || message.length > 3000 || (custom && (!Number.isInteger(quantity) || quantity < 1 || quantity > 10))) {
      setStatus("Please check your details and include a little more about your enquiry.");
      return;
    }
    const description = custom
      ? `Custom order enquiry\nCategory: ${String(values.get("category") ?? "Not specified")}\nColour preference: ${String(values.get("colour") ?? "Not specified")}\nQuantity: ${String(values.get("quantity") ?? "1")}\n\n${message}`
      : message;
    setSending(true);
    setStatus("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("enquiries").insert({
        customer_name: name,
        email,
        phone,
        product_id: null,
        kind: custom ? "custom_order" : "contact",
        message: description,
      });
      if (error) throw error;
      form.reset();
      setStatus("Thank you — your enquiry has been sent to the Art Square studio.");
    } catch {
      setStatus("We could not send that just now. Please contact the studio by WhatsApp or email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <form className="enquiry-form" onSubmit={submit}>
      <label>Your name<input autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
      <label>Email address<input type="email" autoComplete="email" name="email" required maxLength={254} /></label>
      <label>WhatsApp number <span className="muted-note">(optional)</span><input type="tel" autoComplete="tel" name="phone" maxLength={30} /></label>
      {custom && <>
        <label>Product category<select name="category" defaultValue=""><option value="">Choose a collection</option><option>Resin &amp; Pooja Thali</option><option>Lippan &amp; Mirror Art</option><option>Mandala Art</option><option>Wall Clocks</option><option>Spiritual Wall Décor</option><option>Tree of Life</option><option>Decorative Trays</option><option>Festive &amp; Custom Gifting</option></select></label>
        <div className="field-row"><label>Preferred colour<input name="colour" maxLength={100} /></label><label>Quantity<input type="number" name="quantity" min={1} max={10} defaultValue={1} /></label></div>
      </>}
      <label>{custom ? "Tell us what you have in mind" : "How can we help?"}<textarea name="message" required minLength={10} maxLength={3000} /></label>
      <label className="sr-only" aria-hidden="true">Leave this field empty<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <button className="button-primary" type="submit" disabled={sending}>{sending ? "Sending…" : "Send enquiry"}</button>
      <p className="form-status" role="status" aria-live="polite">{status}</p>
    </form>
  );
}
