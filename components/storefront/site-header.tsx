"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { useShopping } from "./shopping-provider";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/our-story", label: "Our story" },
  { href: "/custom-orders", label: "Custom orders" },
  { href: "/contact", label: "Contact" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { wishlistCount, cartCount } = useShopping();
  const [open, setOpen] = useState(false);
  const closeMenu = () => setOpen(false);
  return (
    <header className="site-header">
      <Link className="brand" href="/" onClick={closeMenu} aria-label="Art Square home">
        <Image className="brand-logo" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/artpic-AvTUEMcA1uizd4cnFXMy1Efh3jDoPM.jpeg" alt="Art Square logo" width={1254} height={1254} unoptimized />
      </Link>
      <nav className={`nav-links${open ? " nav-links-open" : ""}`} aria-label="Main navigation">
        {links.map((link) => (
          <Link key={link.href} href={link.href} aria-current={pathname === link.href ? "page" : undefined} onClick={closeMenu}>
            {link.label}
          </Link>
        ))}
        <Link className="nav-count-link" href="/wishlist" onClick={closeMenu} aria-label={`Wishlist, ${wishlistCount} saved items`}>
          <Heart size={16} aria-hidden="true" /><span>Wishlist</span><span className="nav-count">{wishlistCount}</span>
        </Link>
        <Link className="nav-count-link" href="/cart" onClick={closeMenu} aria-label={`Enquiry basket, ${cartCount} items`}>
          <ShoppingBag size={16} aria-hidden="true" /><span>Basket</span><span className="nav-count">{cartCount}</span>
        </Link>
      </nav>
      <button className="mobile-menu-toggle" type="button" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} onClick={() => setOpen((value) => !value)}>
        {open ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
    </header>
  );
}
