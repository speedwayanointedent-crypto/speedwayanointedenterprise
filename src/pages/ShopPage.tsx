import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, ShoppingCart } from "lucide-react";
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

type Option = { id: string; name?: string; label?: string; brand_id?: string };

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

export const ShopPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState(() => searchParams.get("q") ?? "");
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [years, setYears] = React.useState<Option[]>([]);
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [yearId, setYearId] = React.useState("");
  const [pendingCategoryParam, setPendingCategoryParam] = React.useState(
    () => searchParams.get("category") ?? ""
  );
  const { push } = useToast();

  React.useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    const urlCategory = searchParams.get("category") ?? "";
    if (urlQuery !== query) {
      setQuery(urlQuery);
    }
    if (urlCategory !== pendingCategoryParam) {
      setPendingCategoryParam(urlCategory);
    }
  }, [searchParams, query, pendingCategoryParam]);

  React.useEffect(() => {
    async function load() {
      try {
        const [prodRes, catRes, brandRes, modelRes, yearRes] =
          await Promise.all([
            api.get<Product[]>("/products"),
            api.get<Option[]>("/categories"),
            api.get<Option[]>("/brands"),
            api.get<Option[]>("/models"),
            api.get<Option[]>("/years")
          ]);
        setProducts(prodRes.data);
        setCategories(catRes.data || []);
        setBrands(brandRes.data || []);
        setModels(modelRes.data || []);
        setYears(yearRes.data || []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  React.useEffect(() => {
    if (!pendingCategoryParam || categoryId || categories.length === 0) {
      return;
    }
    const normalized = pendingCategoryParam.trim().toLowerCase();
    const match =
      categories.find((cat) => cat.id === pendingCategoryParam) ||
      categories.find((cat) => (cat.name || "").toLowerCase() === normalized);
    if (match) {
      setCategoryId(match.id);
    }
  }, [pendingCategoryParam, categories, categoryId]);

  const normalizedQuery = query.trim().toLowerCase();
  const selectedCategory = categories.find((cat) => cat.id === categoryId);
  const visibleModels = brandId
    ? models.filter((m) => m.brand_id === brandId)
    : models;

  React.useEffect(() => {
    const nextParams = new URLSearchParams();
    const trimmedQuery = query.trim();
    if (trimmedQuery) {
      nextParams.set("q", trimmedQuery);
    }
    if (categoryId) {
      nextParams.set("category", selectedCategory?.name || categoryId);
    }
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, categoryId, selectedCategory, searchParams, setSearchParams]);

  const filtered = products.filter((p) => {
    const matchesQuery = p.name.toLowerCase().includes(normalizedQuery);
    const matchesCategory = categoryId
      ? p.category_id === categoryId ||
        p.categories?.name ===
          categories.find((c) => c.id === categoryId)?.name
      : true;
    const matchesBrand = brandId
      ? p.brand_id === brandId ||
        p.brands?.name === brands.find((b) => b.id === brandId)?.name
      : true;
    const matchesModel = modelId
      ? p.model_id === modelId ||
        p.models?.name === models.find((m) => m.id === modelId)?.name
      : true;
    const matchesYear = yearId
      ? p.year_id === yearId ||
        p.years?.label === years.find((y) => y.id === yearId)?.label
      : true;
    return matchesQuery && matchesCategory && matchesBrand && matchesModel && matchesYear;
  });

  const clearFilters = () => {
    setQuery("");
    setCategoryId("");
    setBrandId("");
    setModelId("");
    setYearId("");
  };

  const resetSearch = () => {
    setQuery("");
  };

  return (
    <div className="page-shell">
      <PublicNavbar />

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <section className="section-band rounded-2xl p-4 sm:p-6">
          <div className="card p-4 sm:p-6">
            <PageHeader
              title="Products"
              subtitle="Browse our catalogue of genuine spare parts."
              actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
            />
            <div className="mt-4 flex flex-col gap-3 rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Filters & search</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={resetSearch} className="btn-outline h-9 px-3 text-sm">
                  Reset search
                </button>
                <button type="button" onClick={clearFilters} className="btn-outline h-9 px-3 text-sm">
                  Clear filters
                </button>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_repeat(4,minmax(0,0.5fr))]">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                <Search className="h-4 w-4" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search products..."
                  list="product-suggestions"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <datalist id="product-suggestions">
                  {products.slice(0, 50).map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </div>
              <select
                className="form-input h-11"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name || "Category"}
                  </option>
                ))}
              </select>
              <select
                className="form-input h-11"
                value={brandId}
                onChange={(e) => {
                  setBrandId(e.target.value);
                  setModelId("");
                }}
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
              >
                <option value="">All models</option>
                {visibleModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name || "Model"}
                  </option>
                ))}
              </select>
              <select
                className="form-input h-11"
                value={yearId}
                onChange={(e) => setYearId(e.target.value)}
              >
                <option value="">All years</option>
                {years.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.label || "Year"}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Showing <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
                {filtered.length === 1 ? "item" : "items"}
              </span>
              <button type="button" onClick={clearFilters} className="btn-outline h-9 px-3 text-sm">
                Clear filters
              </button>
            </div>
          </div>
        </section>

        <section className="mt-6">
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-60" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.length === 0 ? (
                <div className="col-span-full rounded-xl border border-dashed border-border bg-background p-8 text-center">
                  <div className="text-base font-semibold text-foreground">
                    No products match your filters
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Try clearing filters or searching for a different part.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="btn-primary mt-4 h-10 px-5 text-sm"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                filtered.map((p) => (
                  <div key={p.id} className="card card-hover p-4">
                    <img
                      src={p.image_url || fallbackImage}
                      alt={p.name}
                      className="h-36 w-full rounded-lg object-cover sm:h-40"
                    />
                    <div className="mt-3">
                      <div className="text-xs text-muted-foreground">
                        {p.categories?.name || "Auto parts"}
                      </div>
                      <div className="mt-1 text-sm font-semibold text-foreground">
                        {p.name}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {p.brands?.name ? (
                          <span className="badge border-border bg-background text-muted-foreground">
                            {p.brands.name}
                          </span>
                        ) : null}
                        {p.models?.name ? (
                          <span className="badge border-border bg-background text-muted-foreground">
                            {p.models.name}
                          </span>
                        ) : null}
                        {p.years?.label ? (
                          <span className="badge border-border bg-background text-muted-foreground">
                            {p.years.label}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold">
                          GHS {p.price.toLocaleString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {p.status === "active" ? "In stock" : "Unavailable"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                        <button
                          type="button"
                          className="btn-outline flex-1 text-center"
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
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Add
                        </button>
                        <Link
                          to={`/product/${p.id}`}
                          className="btn-primary flex-1 text-center"
                        >
                          View
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </main>
      <PublicFooterCTA />
    </div>
  );
};

