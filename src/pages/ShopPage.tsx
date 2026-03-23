import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
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

function normalizeCategoryName(name: string): string {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

const CATEGORY_IMAGES: Record<string, string> = {
  bonnet: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop',
  door: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop',
  doors: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=600&h=400&fit=crop',
  bumper: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
  bumpers: 'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600&h=400&fit=crop',
  mirror: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
  mirrors: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
  'side mirror': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
  'side mirrors': 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=600&h=400&fit=crop',
  headlight: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&h=400&fit=crop',
  headlights: 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&h=400&fit=crop',
  'head light': 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&h=400&fit=crop',
  'head lights': 'https://images.unsplash.com/photo-1489824904134-891ab64532f1?w=600&h=400&fit=crop',
  taillight: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  taillights: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  'tail light': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  'tail lights': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop',
  gear: 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=600&h=400&fit=crop',
  'gear level': 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=600&h=400&fit=crop',
  'gear levels': 'https://images.unsplash.com/photo-1483581940-31b8fabb23dc?w=600&h=400&fit=crop',
  fender: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=600&h=400&fit=crop',
  fenders: 'https://images.unsplash.com/photo-1503736334956-4c8f8e92992d?w=600&h=400&fit=crop',
  grille: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop',
  grilles: 'https://images.unsplash.com/photo-1580273916550-e323be2ae537?w=600&h=400&fit=crop',
};

function getCategoryImage(category: CategoryWithCount): string {
  if (category.image_url) return category.image_url;
  const normalized = normalizeCategoryName(category.name);
  return CATEGORY_IMAGES[normalized] || fallbackImage;
}

const FALLBACK_CATEGORIES: CategoryWithCount[] = [
  { id: "cat-bonnet", name: "Bonnet", product_count: 214 },
  { id: "cat-bumpers", name: "Bumpers", product_count: 214 },
  { id: "cat-doors", name: "Doors", product_count: 214 },
  { id: "cat-headlights", name: "Head Lights", product_count: 214 },
  { id: "cat-mirrors", name: "Side Mirrors", product_count: 214 },
  { id: "cat-taillights", name: "Tail Lights", product_count: 214 },
  { id: "cat-gears", name: "Gear Levels", product_count: 214 },
  { id: "cat-fenders", name: "Fenders", product_count: 214 },
  { id: "cat-grilles", name: "Grilles", product_count: 214 },
];

export const ShopPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadCategories() {
      try {
        const res = await api.get<CategoryWithCount[]>("/products/by-category");
        setCategories(res.data && res.data.length > 0 ? res.data : FALLBACK_CATEGORIES);
        setError(null);
      } catch (err) {
        console.error("Failed to load categories:", err);
        setError("Failed to load categories. Using offline data.");
        setCategories(FALLBACK_CATEGORIES);
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
