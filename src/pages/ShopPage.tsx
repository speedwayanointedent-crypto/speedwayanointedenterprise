import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { addToCart } from "../lib/cart";
import { useToast } from "../components/ui/Toast";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url?: string | null;
  car_image_url?: string | null;
  status: string;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string };
  years?: { label: string };
};

type CategoryWithCount = {
  id: string;
  name: string;
  product_count: number;
};

type Option = { id: string; name?: string; label?: string; brand_id?: string; years?: string[] };

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

const PRODUCTS_PER_PAGE = 24;

const CATEGORY_ICONS: Record<string, string> = {
  'BONNET': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/automobile-1252872_1280.jpg',
  'Bonnet': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/automobile-1252872_1280.jpg',
  'Doors': 'https://cdn.pixabay.com/photo/2016/03/12/23/23/car-1252872_1280.jpg',
  'Bumpers': 'https://cdn.pixabay.com/photo/2015/09/12/19/39/car-937061_1280.jpg',
  'Side Mirrors': 'https://cdn.pixabay.com/photo/2016/04/13/19/20/side-mirror-1328401_1280.jpg',
  'Head Lights': 'https://cdn.pixabay.com/photo/2014/11/13/23/54/headlight-534069_1280.jpg',
  'Tail Lights': 'https://cdn.pixabay.com/photo/2015/05/22/05/57/taillight-779740_1280.jpg',
  'Gear Levels': 'https://cdn.pixabay.com/photo/2016/08/01/21/41/gear-stick-1569409_1280.jpg',
  'Fenders': 'https://cdn.pixabay.com/photo/2016/11/23/18/36/auto-1853826_1280.jpg',
  'Grilles': 'https://cdn.pixabay.com/photo/2016/11/22/20/09/automobile-1851053_1280.jpg',
};

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
  const [searchParams, setSearchParams] = useSearchParams();
  const [categories, setCategories] = React.useState<CategoryWithCount[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [brandId, setBrandId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryWithCount | null>(null);
  const { push } = useToast();

  const categoryIdFromUrl = searchParams.get("category");
  const pageFromUrl = parseInt(searchParams.get("page") || "1");

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

  React.useEffect(() => {
    async function loadFilters() {
      try {
        const [brandRes, modelRes] = await Promise.all([
          api.get<Option[]>("/brands"),
          api.get<Option[]>("/models")
        ]);
        setBrands(brandRes.data || []);
        setModels(modelRes.data || []);
      } catch {
        setBrands([]);
        setModels([]);
      }
    }
    loadFilters();
  }, []);

  const loadProducts = React.useCallback(async (catId: string, brand?: string, model?: string, pageNum: number = 1) => {
    setLoadingProducts(true);
    try {
      const params: Record<string, string> = {
        category_id: catId,
        page: String(pageNum),
        limit: String(PRODUCTS_PER_PAGE)
      };
      if (brand) params.brand_id = brand;
      if (model) params.model_id = model;
      if (query) params.q = query;

      const res = await api.get<{ data: Product[]; pagination: { page: number; totalPages: number; total: number } }>("/products", { params });
      setProducts(res.data.data || []);
      setTotalPages(res.data.pagination.totalPages || 1);
      setTotalProducts(res.data.pagination.total || 0);
      setPage(pageNum);
    } catch {
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  }, [query]);

  React.useEffect(() => {
    if (categoryIdFromUrl) {
      const cat = categories.find(c => c.id === categoryIdFromUrl);
      setSelectedCategory(cat || null);
      if (cat) {
        loadProducts(cat.id, brandId || undefined, modelId || undefined, pageFromUrl);
      }
    }
  }, [categoryIdFromUrl, categories, brandId, modelId, pageFromUrl, loadProducts]);

  const handleCategoryClick = (cat: CategoryWithCount) => {
    setSelectedCategory(cat);
    setSearchParams({ category: cat.id, page: "1" });
    setPage(1);
    setBrandId("");
    setModelId("");
    loadProducts(cat.id, undefined, undefined, 1);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
    setProducts([]);
    setSearchParams({});
  };

  const handleFilterChange = () => {
    if (selectedCategory) {
      loadProducts(selectedCategory.id, brandId || undefined, modelId || undefined, 1);
      setSearchParams({ category: selectedCategory.id, page: "1" });
    }
  };

  const handlePageChange = (newPage: number) => {
    if (selectedCategory && newPage >= 1 && newPage <= totalPages) {
      loadProducts(selectedCategory.id, brandId || undefined, modelId || undefined, newPage);
      setSearchParams({ category: selectedCategory.id, page: String(newPage) });
    }
  };

  const visibleModels = brandId ? models.filter(m => m.brand_id === brandId) : [];

  return (
    <div className="page-shell">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        {selectedCategory ? (
          <>
            <div className="mb-4 flex items-center gap-3">
              <button
                onClick={handleBackToCategories}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Categories
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm font-medium">{selectedCategory.name}</span>
            </div>

            <section className="section-band rounded-2xl p-4 sm:p-6">
              <div className="card p-4 sm:p-6">
                <PageHeader
                  title={selectedCategory.name}
                  subtitle={`${totalProducts} products available`}
                  actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
                />

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(3,minmax(0,0.5fr))]">
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                    <Search className="h-4 w-4" />
                    <input
                      className="w-full bg-transparent outline-none"
                      placeholder="Search in this category..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleFilterChange()}
                    />
                  </div>
                  <select
                    className="form-input h-11"
                    value={brandId}
                    onChange={(e) => { setBrandId(e.target.value); setModelId(""); }}
                  >
                    <option value="">All brands</option>
                    {brands.map((brand) => (
                      <option key={brand.id} value={brand.id}>
                        {brand.name || "Brand"}
                      </option>
                    ))}
                  </select>
                  <select
                    className="form-input h-11"
                    value={modelId}
                    onChange={(e) => setModelId(e.target.value)}
                    disabled={!brandId}
                  >
                    <option value="">All models</option>
                    {visibleModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name || "Model"}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Showing <span className="font-semibold text-foreground">{products.length}</span> of{" "}
                    <span className="font-semibold text-foreground">{totalProducts}</span> products
                  </span>
                  <div className="flex gap-2">
                    {(brandId || modelId || query) && (
                      <button
                        onClick={() => { setBrandId(""); setModelId(""); setQuery(""); handleFilterChange(); }}
                        className="btn-outline h-9 px-3 text-sm"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-6">
              {loadingProducts ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-60" />
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
                  <div className="text-base font-semibold text-foreground">No products found</div>
                  <p className="mt-2 text-sm text-muted-foreground">Try adjusting your filters.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.map((p) => (
                      <div key={p.id} className="card card-hover p-4">
                        <img
                          src={p.image_url || fallbackImage}
                          alt={p.name}
                          className="h-36 w-full rounded-lg object-cover sm:h-40"
                        />
                        <div className="mt-3">
                          <div className="text-xs text-muted-foreground">
                            {p.brands?.name} {p.models?.name && `- ${p.models.name}`}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-foreground line-clamp-2">
                            {p.name}
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.years?.label && (
                              <span className="badge border-border bg-background text-muted-foreground">
                                {p.years.label}
                              </span>
                            )}
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <span className="text-sm font-semibold">GHS {p.price.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground">
                              {p.status === "active" ? "In stock" : "Unavailable"}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                            <button
                              className="btn-outline flex-1 text-center text-sm"
                              onClick={() => {
                                addToCart({
                                  id: p.id,
                                  name: p.name,
                                  price: p.price,
                                  image: p.image_url || fallbackImage
                                });
                                push("Added to cart", "success");
                              }}
                            >
                              <ShoppingCart className="mr-1 h-4 w-4" />
                              Add
                            </button>
                            <Link
                              to={`/product/${p.id}`}
                              className="btn-primary flex-1 text-center text-sm"
                            >
                              View
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        className="btn-outline h-10 w-10 p-0"
                        disabled={page <= 1}
                        onClick={() => handlePageChange(page - 1)}
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm">
                        Page <span className="font-semibold">{page}</span> of{" "}
                        <span className="font-semibold">{totalPages}</span>
                      </span>
                      <button
                        className="btn-outline h-10 w-10 p-0"
                        disabled={page >= totalPages}
                        onClick={() => handlePageChange(page + 1)}
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </>
        ) : (
          <>
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
                      className="card card-hover overflow-hidden p-0 text-left"
                    >
                      <div className="relative h-32 w-full">
                        <img
                          src={CATEGORY_ICONS[cat.name] || fallbackImage}
                          alt={cat.name}
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-lg font-semibold text-white">{cat.name}</h3>
                          <p className="text-sm text-white/80">{cat.product_count} products</p>
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
