import React from "react";
import { Mail, Phone, Facebook, Instagram, Twitter, Linkedin, Globe } from "lucide-react";
import api from "../../lib/api";
import { WHATSAPP_LINK } from "../../lib/whatsapp";

type FooterSettings = {
  business_name?: string | null;
  support_email?: string | null;
  support_phone?: string | null;
  address?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  x_url?: string | null;
  tiktok_url?: string | null;
  linkedin_url?: string | null;
  whatsapp_url?: string | null;
};

export const PublicFooterCTA: React.FC = () => {
  const [settings, setSettings] = React.useState<FooterSettings>({});

  React.useEffect(() => {
    let isMounted = true;
    async function loadSettings() {
      try {
        const res = await api.get("/settings");
        if (isMounted) {
          setSettings(res.data || {});
        }
      } catch {
        if (isMounted) {
          setSettings({});
        }
      }
    }
    loadSettings();
    return () => {
      isMounted = false;
    };
  }, []);

  const supportPhone = settings.support_phone || "";
  const supportEmail = settings.support_email || "";
  const whatsappUrl = settings.whatsapp_url || WHATSAPP_LINK;
  const businessName = settings.business_name || "Speedway Anointed Ent";
  const address = settings.address || "Accra, Ghana";

  return (
    <section className="border-t border-border bg-gray-100 text-gray-700 dark:bg-slate-900 dark:text-gray-200">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Need help sourcing parts?
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-foreground">
            Talk to a parts specialist today
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Call, WhatsApp, or email us for fitment checks and bulk orders.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {supportPhone ? (
            <a href={`tel:${supportPhone}`} className="btn-outline h-10 px-4 text-sm">
              <Phone className="mr-2 h-4 w-4" />
              Call us
            </a>
          ) : null}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-whatsapp h-10 px-4 text-sm"
          >
            WhatsApp
          </a>
          {supportEmail ? (
            <a href={`mailto:${supportEmail}`} className="btn-outline h-10 px-4 text-sm">
              <Mail className="mr-2 h-4 w-4" />
              Email
            </a>
          ) : null}
        </div>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex flex-col items-start justify-between gap-4 px-6 py-4 text-xs text-gray-600 sm:flex-row sm:items-center">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {businessName}
            </div>
            <div className="mt-1">{address}</div>
          </div>
          <div className="flex flex-wrap gap-4">
            <a href="/shop" className="hover:text-indigo-600 transition-colors">
              Shop
            </a>
            <a href="/about" className="hover:text-indigo-600 transition-colors">
              About
            </a>
            <a href="/contact" className="hover:text-indigo-600 transition-colors">
              Contact
            </a>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {settings.facebook_url ? (
              <a
                href={settings.facebook_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                <Facebook className="h-3 w-3" />
                Facebook
              </a>
            ) : null}
            {settings.instagram_url ? (
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                <Instagram className="h-3 w-3" />
                Instagram
              </a>
            ) : null}
            {settings.x_url ? (
              <a
                href={settings.x_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                <Twitter className="h-3 w-3" />
                X
              </a>
            ) : null}
            {settings.linkedin_url ? (
              <a
                href={settings.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                <Linkedin className="h-3 w-3" />
                LinkedIn
              </a>
            ) : null}
            {settings.tiktok_url ? (
              <a
                href={settings.tiktok_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
              >
                <Globe className="h-3 w-3" />
                TikTok
              </a>
            ) : null}
          </div>
          <div>(c) 2026 {businessName}.</div>
        </div>
      </div>
    </section>
  );
};
