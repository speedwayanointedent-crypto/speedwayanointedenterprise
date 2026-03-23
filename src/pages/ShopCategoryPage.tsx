import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ChevronRight, Search } from "lucide-react";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";

type Brand = {
  id: string;
  name: string;
  logo_url?: string | null;
};

const fallbackImage = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop";

export const ShopCategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [category, setCategory] = React.useState<{ id: string; name: string; image_url?: string | null } | null>(null);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");

  React.useEffect(() => {
    async function loadData() {
      if (!categoryId) return;
      setLoading(true);
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get<{ id: string; name: string; image_url?: string }>(`/categories/${categoryId}`),
          api.get<Brand[]>("/brands")
        ]);
        setCategory(catRes.data);
        setBrands(brandRes.data || []);
        setError(null);
      } catch (err) {
        console.error("Failed to load:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [categoryId]);

  const handleBrandClick = (brand: Brand) => {
    navigate(`/shop/brand/${brand.id}?category=${categoryId}`);
  };

  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(brand => brand.name.toLowerCase().includes(query));
  }, [brands, searchQuery]);

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate("/shop")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Shop
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, idx) => (
              <Skeleton key={idx} className="h-48" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <div className="text-base font-semibold text-foreground">{error}</div>
          </div>
        ) : (
          <>
            <section className="section-band rounded-2xl p-4 sm:p-6">
              <div className="card p-4 sm:p-6">
                <PageHeader
                  title={category?.name || "Category"}
                  subtitle="Select a brand to continue"
                  actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
                />
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                  <Search className="h-4 w-4" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="Search brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </section>

            <section className="mt-6">
              {filteredBrands.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                  <div className="text-base font-semibold text-foreground">No brands found</div>
                  <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {brands.map((brand) => (
                    <button
                      key={brand.id}
                      onClick={() => handleBrandClick(brand)}
                      className="card card-hover overflow-hidden p-0 text-left transition-all hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="relative h-48 w-full bg-gradient-to-br from-muted/30 to-muted/10">
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-full w-full object-contain p-6"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-5xl font-bold text-muted-foreground">
                              {brand.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-xl font-semibold text-white">{brand.name}</h3>
                          <ChevronRight className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <PublicFooterCTA />
    </div>
  );
};
