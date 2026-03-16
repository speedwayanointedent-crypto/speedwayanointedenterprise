import React from "react";
import { MessageCircle } from "lucide-react";
import { WHATSAPP_LINK } from "../../lib/whatsapp";

type WhatsAppButtonProps = {
  label?: string;
  className?: string;
};

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
  label = "Chat on WhatsApp",
  className = ""
}) => {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noreferrer"
      className={`btn-whatsapp ${className}`}
    >
      <MessageCircle className="mr-2 h-4 w-4" />
      {label}
    </a>
  );
};
