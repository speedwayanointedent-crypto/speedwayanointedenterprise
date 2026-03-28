import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle, Shield, Truck, Wrench, BadgeCheck, Clock, Star, Users, MapPin, ArrowRight, Search, Car, Phone, Mail, ChevronRight, Sparkles, ArrowDown, Paintbrush } from "lucide-react";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import api from "../lib/api";

const features = [
  { title: "Genuine Parts", description: "Trusted brands with verified fitment for your vehicle.", icon: Shield, color: "primary" },
  { title: "Fast Delivery", description: "Nationwide delivery with reliable tracking and support.", icon: Truck, color: "success" },
  { title: "Expert Support", description: "Speak to specialists for fitment and compatibility advice.", icon: Wrench, color: "warning" },
  { title: "Quality Assurance", description: "Every order inspected for quality before dispatch.", icon: BadgeCheck, color: "success" },
  { title: "Real-time Updates", description: "Order updates and stock alerts for key parts.", icon: Clock, color: "primary" },
  { title: "Easy Ordering", description: "Simple checkout and responsive customer service.", icon: CheckCircle, color: "primary" }
];

const stats = [
  { label: "Parts in Stock", value: "15,000+" },
  { label: "Happy Customers", value: "5,000+" },
  { label: "Avg Delivery", value: "24 hrs" }
];

type Review = { id: number; rating: number; title?: string | null; body: string; users?: { full_name: string } | null };
type Product = { id: string; name: string; price: number; image_url?: string | null; categories?: { name: string } };

const fallbackImage = "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

export const LandingPage: React.FC = () => {
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [featured, setFeatured] = React.useState<Product[]>([]);
  const [search, setSearch] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    async function loadData() {
      try {
        const [reviewsRes, productsRes] = await Promise.all([
          api.get<Review[]>("/reviews").catch(() => ({ data: [] })),
          api.get<{ data: Product[] }>("/products?limit=6").catch(() => ({ data: { data: [] } }))
        ]);
        setReviews((reviewsRes.data || []).slice(0, 3));
        const products = productsRes.data?.data || [];
        setFeatured([...products].sort(() => Math.random() - 0.5).slice(0, 3));
      } catch { /* Silently fail */ }
    }
    loadData();
  }, []);

  const reviewAvg = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : "5.0";

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNavbar />
      <main>
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-800">
          {/* Background decorations */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=2000')] bg-cover bg-center opacity-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-900/60 to-transparent" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="grid gap-10 lg:gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left: text content */}
              <div className="text-center lg:text-left animate-fade-in-up pt-6 pb-6 sm:pt-8 sm:pb-8 lg:pt-12 lg:pb-16">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-sm font-medium text-primary-foreground">Premium Auto Parts</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight tracking-tight">
                  Premium Auto Parts for Every Make & Model
                </h1>

                <p className="mt-4 sm:mt-6 text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0">
                  Genuine parts, expert fitment advice, and fast delivery across Ghana. Trusted by thousands of workshops and drivers.
                </p>

                <form
                  onSubmit={(e) => { e.preventDefault(); navigate(search.trim() ? `/shop?q=${encodeURIComponent(search)}` : "/shop"); }}
                  className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 max-w-lg mx-auto lg:mx-0"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search parts, brands, or vehicle models..."
                      className="w-full h-12 sm:h-14 pl-12 pr-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary backdrop-blur-sm transition-all text-sm sm:text-base"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="h-12 sm:h-14 px-6 sm:px-8 rounded-2xl bg-gradient-to-r from-primary to-primary/80 text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all text-sm sm:text-base"
                  >
                    Search
                  </Button>
                </form>

                {/* CTA buttons */}
                <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center lg:justify-start gap-3 sm:gap-4">
                  <Link to="/shop" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-white text-slate-900 font-semibold shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1 text-sm sm:text-base">
                    <Car className="w-5 h-5" />
                    Shop Parts
                  </Link>
                  <Link to="/shop?q=car+spec" className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-xl shadow-purple-500/25 hover:shadow-2xl hover:shadow-purple-500/30 transition-all hover:-translate-y-1 text-sm sm:text-base">
                    <Paintbrush className="w-5 h-5" />
                    Spec your Car
                  </Link>
                  <WhatsAppButton label="Contact Us" className="h-12 sm:h-14 px-6 sm:px-8 shadow-lg shadow-green-500/30" />
                </div>

                {/* Trust badges */}
                <div className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6">
                  {[{ icon: Shield, label: "Verified Parts" }, { icon: Truck, label: "Fast Delivery" }, { icon: CheckCircle, label: "Quality Assured" }].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex items-center gap-2 text-slate-300">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <span className="text-xs sm:text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: hero image */}
              <div className="relative animate-fade-in-up lg:pt-12 lg:pb-16" style={{ animationDelay: '200ms' }}>
                {/* Glow behind image */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl scale-95" />

                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=1200"
                    alt="Premium Auto Parts"
                    className="w-full aspect-[4/3] sm:aspect-video lg:aspect-[4/3] object-cover"
                  />
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />

                  {/* Stats overlay on image */}
                  <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6">
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {stats.map((stat) => (
                        <div key={stat.label} className="text-center p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
                          <p className="text-lg sm:text-2xl font-bold text-white">{stat.value}</p>
                          <p className="text-[10px] sm:text-xs text-slate-300">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ArrowDown className="w-5 h-5 text-white/40" />
          </div>
        </section>

        <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-slate-100 dark:border-slate-800">
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex flex-wrap items-center justify-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-400">
              {["OEM & Aftermarket", "Fitment Verified", "Secure Checkout", "Mobile Money Accepted", "Fast Dispatch", "Easy Returns"].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white">Why Choose Speedway</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Simple, reliable service for workshops and drivers across Ghana</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card 
                key={feature.title} 
                hover 
                className="group p-6 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-14 h-14 rounded-2xl bg-${feature.color}-100 dark:bg-${feature.color}-900/20 flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                  <feature.icon className={`w-7 h-7 text-${feature.color}-600 dark:text-${feature.color}-400`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {featured.length > 0 && (
          <section className="bg-slate-50 dark:bg-slate-800/50 py-16 sm:py-24">
            <div className="mx-auto max-w-7xl px-4">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Featured Products</h2>
                  <p className="mt-2 text-slate-500 dark:text-slate-400">Popular items from our shop</p>
                </div>
                <Link to="/shop" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group">
                  View All <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((item, index) => (
                  <Link 
                    key={item.id} 
                    to={`/product/${item.id}`} 
                    className="group bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden transition-all duration-300 hover:-translate-y-2 animate-fade-in-up"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="aspect-[4/3] bg-slate-100 dark:bg-slate-700 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <img src={item.image_url || fallbackImage} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      <div className="absolute top-3 right-3">
                        <span className="px-3 py-1 rounded-full bg-white/90 text-xs font-semibold text-slate-900">
                          {item.categories?.name || "Auto Parts"}
                        </span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover:text-primary transition-colors">{item.name}</h3>
                      <p className="mt-2 text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                        GHS {item.price.toLocaleString()}
                      </p>
                      <div className="mt-3 flex items-center gap-2 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2">
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 sm:p-10 border-primary/20">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Trusted by Workshops Nationwide</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{reviewAvg} rating</span>
                  </div>
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-300 mb-6">Thousands of professionals rely on Speedway for consistent stock and fast fulfillment.</p>
              {reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.slice(0, 2).map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1 text-yellow-400 mb-2">
                        {Array.from({ length: review.rating }).map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                      </div>
                      {review.title && <p className="font-medium text-slate-900 dark:text-white">{review.title}</p>}
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{review.body}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">{review.users?.full_name || "Customer"}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 dark:text-slate-400">Be the first to leave a review!</p>
              )}
              <Link to="/reviews" className="mt-6 inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all group">
                View All Reviews <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Card>

            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-700 p-8 sm:p-10 text-white">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                  <MapPin className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold">Visit Our Accra Hub</h3>
                  <p className="text-slate-300">Expert support on site</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                  <p className="text-slate-200">Abossey-Okai, Accra, Ghana</p>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <p className="text-slate-200">Mon - Sat, 8:00am - 6:00pm</p>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-primary" />
                  <p className="text-slate-200">+233 XX XXX XXXX</p>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-primary" />
                  <p className="text-slate-200">info@speedway.com</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link to="/contact" className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-slate-900 font-semibold hover:bg-slate-100 transition-colors">
                  <Mail className="w-5 h-5" /> Contact Sales
                </Link>
                <WhatsAppButton label="WhatsApp Us" className="h-12 px-6" />
              </div>
            </Card>
          </div>
        </section>
      </main>
      <PublicFooterCTA />
    </div>
  );
};
