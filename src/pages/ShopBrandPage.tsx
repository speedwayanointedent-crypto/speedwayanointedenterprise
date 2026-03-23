import React from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChevronRight } from "lucide-react";
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

type Model = {
  id: string;
  name: string;
  brand_id: string;
  image_url?: string | null;
  years?: string[];
};

const fallbackImage = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop";

export const ShopBrandPage: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [models, setModels] = React.useState<Model[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const categoryId = searchParams.get("category");

  React.useEffect(() => {
    async function loadData() {
      if (!brandId) return;
      setLoading(true);
      try {
        const [brandRes, modelRes] = await Promise.all([
          api.get<Brand>(`/brands/${brandId}`),
          api.get<Model[]>("/models")
        ]);
        setBrand(brandRes.data);
        setModels((modelRes.data || []).filter(m => m.brand_id === brandId));
        setError(null);
      } catch (err) {
        console.error("Failed to load:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [brandId]);

  const handleModelClick = (model: Model) => {
    const params = new URLSearchParams();
    if (categoryId) params.set("category", categoryId);
    params.set("brand", brandId || "");
    params.set("model", model.id);
    navigate(`/shop/products?${params.toString()}`);
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(`/shop/category/${categoryId}`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {brand?.name || "Category"}
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
                <div className="flex items-center gap-4">
                  {brand?.logo_url ? (
                    <img src={brand.logo_url} alt={brand.name} className="h-16 w-16 rounded-lg object-contain" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-muted">
                      <span className="text-2xl font-bold text-muted-foreground">
                        {brand?.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <PageHeader
                      title={brand?.name || "Brand"}
                      subtitle="Select a model to continue"
                      actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              {models.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                  <div className="text-base font-semibold text-foreground">No models found</div>
                  <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {models.map((model) => (
                    <button
                      key={model.id}
                      onClick={() => handleModelClick(model)}
                      className="card card-hover overflow-hidden p-0 text-left transition-all hover:shadow-lg hover:shadow-primary/10"
                    >
                      <div className="relative h-32 w-full bg-gradient-to-br from-muted/30 to-muted/10">
                        {model.image_url ? (
                          <img
                            src={model.image_url}
                            alt={model.name}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-4xl font-bold text-muted-foreground">
                              {model.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-semibold text-white">{model.name}</h3>
                          {model.years && model.years.length > 0 && (
                            <p className="text-sm text-white/80">{model.years.join(", ")}</p>
                          )}
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
