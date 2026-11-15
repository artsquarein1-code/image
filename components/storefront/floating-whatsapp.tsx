import { MessageCircle } from "lucide-react";
import { getGeneralWhatsAppUrl, ART_SQUARE_PHONE_DISPLAY } from "@/lib/whatsapp";
import styles from "./floating-whatsapp.module.css";

export default function FloatingWhatsApp() {
  return (
    <a
      className={styles.button}
      href={getGeneralWhatsAppUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Message ART SQUARE on WhatsApp at ${ART_SQUARE_PHONE_DISPLAY}`}
    >
      <MessageCircle size={19} aria-hidden="true" />
      <span>WhatsApp</span>
    </a>
  );
}
