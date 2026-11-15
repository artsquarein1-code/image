import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { ShoppingProvider } from "@/components/storefront/shopping-provider";
import FloatingWhatsApp from "@/components/storefront/floating-whatsapp";
import { getShoppingItems, SHOPPING_COOKIE } from "@/lib/shopping/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Art Square — Handmade décor, made with heart",
  description: "Discover handcrafted Indian décor by Art Square: resin pooja thalis, mirror-work art, and distinctive pieces for your home.",
};

export const viewport: Viewport = { themeColor: "#f8f5ef", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const jar = await cookies();
  const token = jar.get(SHOPPING_COOKIE)?.value;
  const initialItems = await getShoppingItems(token).catch(() => []);
  return <html lang="en"><body><ShoppingProvider initialItems={initialItems}>{children}</ShoppingProvider><FloatingWhatsApp /></body></html>;
}
