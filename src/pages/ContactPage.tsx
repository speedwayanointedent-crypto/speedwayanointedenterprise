import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, Phone, MapPin, MessageCircle, Loader2 } from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";

export const ContactPage: React.FC = () => {
  const [submitting, setSubmitting] = useState(false);
  return (
    <div className="page-shell">
      <PublicNavbar />

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <PageHeader
          kicker="Contact"
          title="We're here to help with parts, fitment, and orders."
          size="lg"
          actions={
            <>
              <Link to="/shop" className="btn-primary h-10 w-full px-5 text-sm sm:w-auto">
                Shop now
              </Link>
              <WhatsAppButton label="WhatsApp us" className="h-10 w-full px-5 text-sm sm:w-auto" />
            </>
          }
        />

        <section className="section-band mt-8 rounded-2xl p-4 sm:p-6">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
            <div className="rounded-xl border border-border bg-card p-5 shadow-md sm:p-6">
              <h2 className="text-xl font-semibold text-foreground">
                Send a message
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Tell us what you need and our team will respond quickly.
              </p>
              <form className="mt-6 space-y-4">
                <div>
                  <label className="form-label">Full name</label>
                  <input
                    className="form-input mt-2"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-input mt-2"
                    placeholder="you@email.com"
                  />
                </div>
                <div>
                  <label className="form-label">How can we help?</label>
                  <textarea
                    rows={4}
                    className="form-input mt-2 min-h-[120px]"
                    placeholder="Tell us about the part you need..."
                  />
                </div>
<button
                  className="btn-primary h-11 w-full"
                  type="button"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    "Send message"
                  )}
                </button>
              </form>
            </div>

            <div className="space-y-4">
              <div className="card card-hover p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-semibold text-foreground">
                      +233 50 000 0000
                    </p>
                  </div>
                </div>
              </div>
              <div className="card card-hover p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-semibold text-foreground">
                      support@speedway.example
                    </p>
                  </div>
                </div>
              </div>
              <div className="card card-hover p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="text-sm font-semibold text-foreground">
                      Accra, Ghana
                    </p>
                  </div>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-primary text-primary-foreground p-5 shadow-md">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
                    <MessageCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs text-white/70">Live chat</p>
                    <p className="text-sm font-semibold">
                      Average response under 10 mins
                    </p>
                  </div>
                </div>
                <WhatsAppButton
                  label="Chat on WhatsApp"
                  className="mt-4 h-10 w-full justify-center"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <PublicFooterCTA />
    </div>
  );
};

