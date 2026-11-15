import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Art Square — Handmade décor, made with heart",
  description: "Discover handcrafted Indian décor by Art Square: resin pooja thalis, mirror-work art, and distinctive pieces for your home.",
};

export const viewport: Viewport = { themeColor: "#f8f5ef", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
