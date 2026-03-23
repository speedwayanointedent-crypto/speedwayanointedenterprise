import React from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";

type CategoryWithCount = {
  id: string;
  name: string;
  image_url?: string | null;
  product_count: number;
};

const fallbackImage =
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop";

function getCategoryImage(category: CategoryWithCount): string {
  return category.image_url || fallbackImage;
}

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadCategories() {
      try {
        let res = await api.get<{ id: string; name: string; image_url?: string }[]>("/categories");
        if (res.data && res.data.length > 0) {
          const catsWithCount = res.data.map(cat => ({
            ...cat,
            product_count: 0
          }));
          setCategories(catsWithCount);
        } else {
          setCategories([]);
        }
        setError(null);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setError("Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const handleCategoryClick = (cat: CategoryWithCount) => {
    navigate(`/shop/category/${cat.id}`);
  };

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <section className="section-band rounded-2xl p-4 sm:p-6">
          <div className="card p-4 sm:p-6">
            <PageHeader
              title="Shop"
              subtitle="Browse our catalogue of genuine spare parts by category."
              actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
            />
          </div>
        </section>

        <section className="mt-6">
          {error && (
            <div className="mb-4 rounded-lg bg-yellow-900/50 border border-yellow-700 p-3 text-sm text-yellow-200">
              {error}
            </div>
          )}
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <Skeleton key={idx} className="h-48" />
              ))}
            </div>
          ) : categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
              <div className="text-base font-semibold text-foreground">No categories found</div>
              <p className="mt-2 text-sm text-muted-foreground">Please try again later.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat)}
                  className="card card-hover overflow-hidden p-0 text-left transition-all hover:shadow-lg hover:shadow-primary/10"
                >
                  <div className="relative h-40 w-full">
                    <img
                      src={getCategoryImage(cat)}
                      alt={cat.name.trim()}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h3 className="text-lg font-semibold text-white">{cat.name.trim()}</h3>
                      <p className="text-sm text-white/80">{cat.product_count} products</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
      <PublicFooterCTA />
    </div>
  );
};
