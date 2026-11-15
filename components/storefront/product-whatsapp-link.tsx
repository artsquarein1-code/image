import styles from "./product-whatsapp-link.module.css";
import { getProductWhatsAppUrl, type WhatsAppProduct } from "@/lib/whatsapp";

export default function ProductWhatsAppLink({
  product,
  siteUrl,
  quantity = 1,
  children = "Enquire on WhatsApp",
}: {
  product: WhatsAppProduct;
  siteUrl: string;
  quantity?: number;
  children?: React.ReactNode;
}) {
  const href = getProductWhatsAppUrl(product, siteUrl, quantity);
  if (!href) return null;

  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
