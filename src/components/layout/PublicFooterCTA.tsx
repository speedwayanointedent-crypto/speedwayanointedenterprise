import React from "react";
import { Mail, Phone, Facebook, Instagram, Twitter, Linkedin, Globe, ArrowUpRight, MapPin, Clock } from "lucide-react";
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

  const socialLinks = [
    settings.facebook_url && { url: settings.facebook_url, icon: Facebook, label: "Facebook" },
    settings.instagram_url && { url: settings.instagram_url, icon: Instagram, label: "Instagram" },
    settings.x_url && { url: settings.x_url, icon: Twitter, label: "X" },
    settings.linkedin_url && { url: settings.linkedin_url, icon: Linkedin, label: "LinkedIn" },
    settings.tiktok_url && { url: settings.tiktok_url, icon: Globe, label: "TikTok" },
  ].filter(Boolean) as { url: string; icon: React.ElementType; label: string }[];

  return (
    <footer className="border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
      {/* ── CTA Banner ──────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 lg:gap-10">
            <div className="max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary/80 mb-2 sm:mb-3">
                Need help sourcing parts?
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-snug">
                Talk to a parts specialist today
              </h3>
              <p className="mt-2 sm:mt-3 text-sm sm:text-base text-slate-400">
                Call, WhatsApp, or email us for fitment checks and bulk orders.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 flex-shrink-0">
              {supportPhone ? (
                <a
                  href={`tel:${supportPhone}`}
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Phone className="w-4 h-4" />
                  Call us
                </a>
              ) : null}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/20"
              >
                WhatsApp
                <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
              {supportEmail ? (
                <a
                  href={`mailto:${supportEmail}`}
                  className="inline-flex items-center justify-center gap-2 h-11 sm:h-12 px-5 sm:px-6 rounded-xl border border-white/20 text-white text-sm font-semibold hover:bg-white/10 active:scale-[0.98] transition-all"
                >
                  <Mail className="w-4 h-4" />
                  Email
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer Bottom ────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-8">
          {/* Top row: brand + nav + socials */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Brand + address */}
            <div>
              <div className="text-base font-semibold text-slate-900 dark:text-white">
                {businessName}
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{address}</span>
              </div>
            </div>

            {/* Nav links */}
            <nav className="flex flex-wrap gap-x-5 gap-y-1">
              {[
                { href: "/shop", label: "Shop" },
                { href: "/about", label: "About" },
                { href: "/contact", label: "Contact" },
                { href: "/reviews", label: "Reviews" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm text-slate-600 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Socials */}
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-2">
                {socialLinks.map(({ url, icon: Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-primary/10 hover:text-primary transition-colors"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Bottom divider + copyright */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-4 sm:pt-0 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              &copy; 2026 {businessName}. All rights reserved.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Built with precision in Ghana
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
