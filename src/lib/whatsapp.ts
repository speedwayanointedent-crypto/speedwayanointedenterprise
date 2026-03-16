export const WHATSAPP_NUMBER = "233242762437";

export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

export const buildWhatsAppLink = (message?: string) =>
  message ? `${WHATSAPP_LINK}?text=${encodeURIComponent(message)}` : WHATSAPP_LINK;
