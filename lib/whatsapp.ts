export const ART_SQUARE_PHONE_DISPLAY = "+91 90549 34190";
export const ART_SQUARE_WHATSAPP_NUMBER = "919054934190";

export type WhatsAppProduct = {
  id: string;
  sku?: string | null;
  name: string;
  slug: string;
};

export type WhatsAppBasketItem = {
  product: WhatsAppProduct;
  quantity: number;
};

const PRODUCT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function getProductUrl(product: WhatsAppProduct, siteUrl: string) {
  if (!product.name.trim() || !product.slug || !PRODUCT_SLUG_PATTERN.test(product.slug)) return null;
  try {
    const origin = new URL(siteUrl);
    if (origin.protocol !== "https:") return null;
    return new URL(`/product/${product.slug}`, origin).toString();
  } catch {
    return null;
  }
}

function getProductId(product: WhatsAppProduct) {
  return product.sku?.trim() || product.id.trim();
}

function buildProductDetails(product: WhatsAppProduct, siteUrl: string, quantity: number) {
  const productUrl = getProductUrl(product, siteUrl);
  const productId = getProductId(product);
  if (!productUrl || !productId || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) return null;

  return [
    `Product: ${product.name.trim()}`,
    `Product ID: ${productId}`,
    `Quantity: ${quantity}`,
    "Price: Please share current pricing.",
    "Availability enquiry: Please confirm availability.",
    "Delivery enquiry: Please share delivery options, charges, and estimated timing.",
    `Product link: ${productUrl}`,
  ].join("\n");
}

function toWhatsAppUrl(message: string) {
  return `https://wa.me/${ART_SQUARE_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppUrl(product: WhatsAppProduct, siteUrl: string, quantity = 1) {
  const details = buildProductDetails(product, siteUrl, quantity);
  if (!details) return null;
  return toWhatsAppUrl(`Hello ART SQUARE,\n\nI am interested in:\n\n${details}\n\nPlease share more details about this product.`);
}

export function getBasketWhatsAppUrl(items: WhatsAppBasketItem[], siteUrl: string) {
  if (!items.length) return null;
  const entries = items.map(({ product, quantity }) => buildProductDetails(product, siteUrl, quantity));
  if (entries.some((entry) => !entry)) return null;
  return toWhatsAppUrl(`Hello ART SQUARE,\n\nI am interested in these products:\n\n${entries.join("\n\n")}\n\nPlease share more details about these products.`);
}

export function getGeneralWhatsAppUrl(message?: string) {
  const text = message?.trim();
  return text ? toWhatsAppUrl(text) : `https://wa.me/${ART_SQUARE_WHATSAPP_NUMBER}`;
}
