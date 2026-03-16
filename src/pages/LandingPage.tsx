import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Shield,
  Truck,
  Wrench,
  BadgeCheck,
  Clock,
  Star,
  Users,
  MapPin
} from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import api from "../lib/api";

const features = [
  {
    title: "Genuine parts",
    description: "Trusted brands with verified fitment for your vehicle.",
    icon: Shield
  },
  {
    title: "Fast delivery",
    description: "Nationwide delivery with reliable tracking and support.",
    icon: Truck
  },
  {
    title: "Expert support",
    description: "Speak to specialists for fitment and compatibility advice.",
    icon: Wrench
  },
  {
    title: "Quality assurance",
    description: "Every order inspected for quality before dispatch.",
    icon: BadgeCheck
  },
  {
    title: "Real-time updates",
    description: "Order updates and stock alerts for key parts.",
    icon: Clock
  },
  {
    title: "Easy ordering",
    description: "Simple checkout and responsive customer service.",
    icon: CheckCircle
  }
];

const stats = [
  { label: "Parts in stock", value: "15,000+", icon: Users },
  { label: "Brands available", value: "120+", icon: Shield },
  { label: "Avg delivery", value: "24 hrs", icon: Truck }
];

type Review = {
  id: number;
  rating: number;
  title?: string | null;
  body: string;
  created_at: string;
  users?: { full_name: string } | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  car_image_url?: string | null;
  categories?: { name: string };
};

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

export const LandingPage: React.FC = () => {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [featured, setFeatured] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    async function loadReviews() {
      try {
        const res = await api.get<Review[]>("/reviews");
        const list = Array.isArray(res.data) ? res.data : [];
        setReviews(list.slice(0, 3));
      } catch {
        setReviews([]);
      }
    }
    async function loadFeatured() {
      try {
        const res = await api.get<Product[]>("/products");
        const list = Array.isArray(res.data) ? res.data : [];
        const shuffled = [...list].sort(() => Math.random() - 0.5);
        setFeatured(shuffled.slice(0, 3));
      } catch {
        setFeatured([]);
      }
    }
    loadReviews();
    loadFeatured();
  }, []);

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const reviewCount = safeReviews.length;
  const reviewAvg =
    reviewCount > 0
      ? Math.round(
          (safeReviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount) * 10
        ) / 10
      : 0;

  return (
    <div className="page-shell">
      <PublicNavbar />

      <main>
        <section className="relative border-b border-border bg-gradient-to-r from-gray-50 to-white dark:from-slate-900 dark:to-slate-900">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1502877338535-766e3a6052db?ixlib=rb-4.0.3&auto=format&fit=crop&w=1974&q=80')] bg-cover bg-center opacity-10" />
          <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-16 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
              <div className="order-1">
                <p className="text-3xl sm:text-4xl font-semibold uppercase tracking-wide text-muted-foreground">
                  Speedway Anointed Ent
                </p>
                <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl text-balance">
                  Premium auto parts for every make and model
                </h1>
                <p className="mt-4 text-base text-muted-foreground sm:text-lg">
                  Genuine parts, expert fitment advice, and fast delivery across Ghana.
                </p>
                <form
                  className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const query = search.trim();
                    navigate(query ? `/shop?q=${encodeURIComponent(query)}` : "/shop");
                  }}
                >
                  <div className="flex-1">
                    <label htmlFor="part-search" className="sr-only">
                      Search parts
                    </label>
                    <input
                      id="part-search"
                      className="form-input h-11 w-full"
                      placeholder="Search by part name, brand, or vehicle model"
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                    />
                  </div>
                  <button type="submit" className="btn-primary h-11 px-6">
                    Find my part
                  </button>
                </form>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/shop" className="btn-primary h-11 px-6">
                    Shop Parts
                  </Link>
                  <Link to="/about" className="btn-outline h-11 px-6">
                    Learn More
                  </Link>
                  <WhatsAppButton className="h-11 px-6" />
                </div>
                <div className="mt-6 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    OEM & aftermarket
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    Fitment verified
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    Secure checkout
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    Mobile money accepted
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    Fast dispatch
                  </span>
                  <span className="rounded-full border border-border bg-background px-3 py-1">
                    Easy returns
                  </span>
                </div>
              </div>
              <div className="order-2 rounded-2xl border border-border bg-card p-4 shadow-md">
                <img
                  src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                  alt="Auto parts"
                  className="w-full rounded-xl object-cover aspect-[4/3] sm:aspect-[16/10]"
                />
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {stats.map((stat) => (
                    <div key={stat.label} className="rounded-xl border border-border bg-background p-3 text-center">
                      <div className="text-lg font-semibold text-foreground">
                        {stat.value}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl gap-4 px-6 py-8 md:grid-cols-4">
            {[
              { title: "Verified fitment", icon: CheckCircle, text: "Parts checked for compatibility." },
              { title: "Fast delivery", icon: Truck, text: "Nationwide shipping with tracking." },
              { title: "Secure checkout", icon: Shield, text: "Safe payment and order confirmation." },
              { title: "Expert support", icon: Clock, text: "Quick answers for workshops." }
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                <item.icon className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.title}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{item.text}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section-band">
          <div className="mx-auto max-w-7xl px-6 py-12">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-semibold">Featured parts</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Popular items from the shop. Tap to view the car + part photos.
                </p>
              </div>
              <Link to="/shop" className="btn-outline h-10 text-sm">
                Browse all
              </Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
              {featured.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                  Products will appear here once they are added.
                </div>
              ) : (
                featured.map((item) => (
                  <Link
                    key={item.id}
                    to={`/product/${item.id}`}
                    className="card card-hover overflow-hidden"
                  >
                    <img
                      src={item.image_url || fallbackImage}
                      alt={item.name}
                      className="h-32 w-full object-cover sm:h-40"
                    />
                    <div className="p-4">
                      <div className="text-xs text-muted-foreground">
                        {item.categories?.name || "Auto parts"}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {item.name}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        GHS {item.price.toLocaleString()}
                      </p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-14">
          <h2 className="text-2xl font-semibold">Why choose Speedway</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Simple, reliable service for workshops and drivers.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="card p-5">
                <feature.icon className="h-6 w-6 text-primary" />
                <h3 className="mt-3 text-base font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-band">
          <div className="mx-auto max-w-7xl px-6 py-14">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.45fr)]">
              <div className="card p-6">
                <h3 className="text-xl font-semibold">Trusted by workshops nationwide</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Thousands of professionals rely on Speedway for consistent stock and fast fulfillment.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                  <div className="rounded-full border border-border bg-background px-3 py-1">
                    {reviewCount > 0 ? `${reviewAvg} / 5 average rating` : "New reviews coming in"}
                  </div>
                  <div className="rounded-full border border-border bg-background px-3 py-1">
                    {reviewCount > 0 ? `${reviewCount} recent reviews` : "Be the first to review"}
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {safeReviews.length === 0 ? (
                    <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                      No reviews yet. Be the first to share your experience.
                    </div>
                  ) : (
                    safeReviews.map((review) => (
                      <div key={review.id} className="rounded-xl border border-border bg-background p-4">
                        <div className="flex items-center gap-2 text-amber-500">
                          {Array.from({ length: review.rating }).map((_, idx) => (
                            <Star key={idx} className="h-4 w-4" />
                          ))}
                        </div>
                        {review.title ? (
                          <div className="mt-2 text-sm font-semibold text-foreground">
                            {review.title}
                          </div>
                        ) : null}
                        <p className="mt-2 text-sm text-muted-foreground">{review.body}</p>
                        <div className="mt-3 text-xs text-muted-foreground">
                          {review.users?.full_name || "Customer"}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Link to="/reviews" className="btn-outline mt-4 h-10 text-sm">
                  View all reviews
                </Link>
              </div>
              <div className="card p-6">
                <h3 className="text-xl font-semibold">Visit our Accra hub</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Pickup options available in Abossey-Okai with expert support on site.
                </p>
                <div className="mt-4 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Abossey-Okai, Accra, Ghana
                  </div>
                  <p className="mt-2">Open Mon - Sat, 8:00am - 6:00pm</p>
                </div>
                <Link to="/contact" className="btn-primary mt-4 w-full">
                  Contact sales
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooterCTA />

    </div>
  );
};

