import React from "react";
import { Link } from "react-router-dom";
import { Award, Truck, ShieldCheck, Users } from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";

const values = [
  {
    title: "Authentic parts",
    description:
      "Every item is sourced from trusted suppliers with verified fitment.",
    icon: Award
  },
  {
    title: "Fast delivery",
    description:
      "Local pickup and delivery options designed for busy workshops.",
    icon: Truck
  },
  {
    title: "Trusted support",
    description:
      "Dedicated parts specialists to help you find the right match.",
    icon: Users
  },
  {
    title: "Secure checkout",
    description: "Encrypted payments with instant order confirmation.",
    icon: ShieldCheck
  }
];

export const AboutPage: React.FC = () => {
  return (
    <div className="page-shell">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-20 md:px-6">
        <PageHeader
          kicker="About"
          title="Built for professional spare parts teams."
          size="lg"
          actions={
            <>
              <Link to="/shop" className="btn-primary h-10 px-5 text-sm">
                Shop now
              </Link>
              <WhatsAppButton label="WhatsApp sales" className="h-10 px-5 text-sm" />
            </>
          }
        />

        <section className="section-band mt-8 rounded-2xl p-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
            <div>
              <p className="text-lg text-muted-foreground">
                Speedway Anointed Ent is a customer-first spare parts destination
                built to serve workshops, drivers, and fleet operators with
                reliable availability, fitment guidance, and fast fulfillment.
              </p>
              <p className="mt-4 text-muted-foreground">
                Our ecommerce storefront is backed by an internal inventory and
                sales system to ensure every listing is accurate and ready to
                ship.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="pill">Genuine brands</span>
                <span className="pill">Fitment assistance</span>
                <span className="pill">Fast delivery</span>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-md">
              <img
                src="https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop"
                alt="Auto parts delivery"
                className="h-56 w-full rounded-lg object-cover"
              />
              <div className="mt-4 rounded-lg border border-border bg-background p-3 text-sm text-muted-foreground">
                Warehouses and showrooms stocked with verified OEM and aftermarket
                parts.
              </div>
            </div>
          </div>
        </section>

        <section className="section-band mt-10 rounded-2xl p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {values.map((item) => (
              <div key={item.title} className="card card-hover p-5">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.4fr)]">
            <div>
              <h3 className="text-2xl font-semibold text-foreground">
                Need parts recommendations?
              </h3>
              <p className="mt-2 text-muted-foreground">
                Our specialists can confirm fitment by VIN, model, and year.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/contact" className="btn-primary h-11 px-5 text-sm">
                Contact support
              </Link>
              <Link to="/shop" className="btn-outline h-11 px-5 text-sm">
                Browse shop
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-card p-6 shadow-md">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.5fr)_minmax(0,0.5fr)]">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-foreground">
                Visit us in Abossey-Okai, Accra
              </h3>
              <p className="mt-2 text-muted-foreground">
                We're located in the heart of Accra's automotive hub for fast
                pickup and professional support.
              </p>
            </div>
            <a
              href="https://www.google.com/maps/dir/?api=1&destination=Abossey-Okai,Accra"
              target="_blank"
              rel="noreferrer"
              className="block overflow-hidden rounded-xl border border-border"
            >
              <iframe
                title="Speedway Anointed Ent - Abossey-Okai, Accra"
                src="https://www.google.com/maps?q=Abossey-Okai,Accra&output=embed"
                className="h-72 w-full"
                loading="lazy"
              />
            </a>
          </div>
        </section>
      </main>
      <PublicFooterCTA />
    </div>
  );
};

