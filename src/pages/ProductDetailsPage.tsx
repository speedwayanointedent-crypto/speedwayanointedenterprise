import React from "react";
import { useParams, Link } from "react-router-dom";
import { ShieldCheck, Truck, CheckCircle2, Heart, ShoppingCart } from "lucide-react";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { useToast } from "../components/ui/Toast";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { addToCart } from "../lib/cart";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  image_url?: string | null;
  car_image_url?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string };
  years?: { label: string };
};

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=1200&auto=format&fit=crop";

export const ProductDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [recommended, setRecommended] = React.useState<Product[]>([]);
  const [recommendedLoading, setRecommendedLoading] = React.useState(true);
  const { push } = useToast();

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.get<Product>(`/products/${id}`);
        setProduct(res.data);
        setRecommendedLoading(true);
        try {
          const listRes = await api.get<Product[]>("/products");
          const all = Array.isArray(listRes.data) ? listRes.data : [];
          const filtered = all.filter((item) => item.id !== res.data.id);
          const related = filtered.filter((item) => {
            const sameCategory =
              res.data.category_id && item.category_id
                ? res.data.category_id === item.category_id
                : res.data.categories?.name &&
                  item.categories?.name &&
                  res.data.categories.name === item.categories.name;
            const sameBrand =
              res.data.brand_id && item.brand_id
                ? res.data.brand_id === item.brand_id
                : res.data.brands?.name &&
                  item.brands?.name &&
                  res.data.brands.name === item.brands.name;
            return sameCategory || sameBrand;
          });
          const fallback = filtered.filter((item) => !related.includes(item));
          setRecommended([...related, ...fallback].slice(0, 3));
        } catch {
          setRecommended([]);
        } finally {
          setRecommendedLoading(false);
        }
      } catch {
        setProduct(null);
        setRecommended([]);
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const addItemToCart = () => {
    if (!product) return;
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || fallbackImage
    });
    push("Added to cart", "success");
  };

  const gallery = product
    ? [product.car_image_url || null, product.image_url || fallbackImage].filter(Boolean)
    : [];

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <Link to="/shop" className="text-xs text-muted-foreground hover:text-foreground">
          &larr; Back to shop
        </Link>

        {loading ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-80 rounded-xl" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        ) : !product ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground shadow-md">
            Product not found.
          </div>
        ) : (
          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
                  {product.car_image_url ? (
                    <img
                      src={product.car_image_url}
                      alt={`${product.name} vehicle`}
                      className="h-56 w-full object-cover sm:h-72 lg:h-80"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-secondary text-sm text-muted-foreground sm:h-72 lg:h-80">
                      No vehicle image yet
                    </div>
                  )}
                  <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                    Vehicle photo
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md">
                  <img
                    src={product.image_url || fallbackImage}
                    alt={`${product.name} part`}
                    className="h-56 w-full object-cover sm:h-72 lg:h-80"
                  />
                  <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
                    Part photo
                  </div>
                </div>
              </div>
              {gallery.length > 1 ? (
                <div className="grid grid-cols-2 gap-3">
                  {gallery.map((image, idx) => (
                    <div
                      key={`${image}-${idx}`}
                      className="overflow-hidden rounded-xl border border-border bg-card shadow-sm"
                    >
                      <img
                        src={image as string}
                        alt={`${product.name} view ${idx + 1}`}
                        className="h-20 w-full object-cover sm:h-24"
                      />
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="rounded-xl border border-border bg-card p-5 shadow-md sm:p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">
                    {product.name}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {product.description || "Premium spare part ready to ship."}
                  </p>
                </div>
                <button className="icon-btn">
                  <Heart className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <p className="text-3xl font-semibold text-foreground">
                  GHS {product.price.toLocaleString()}
                </p>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    product.quantity > 0
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200"
                  }`}
                >
                  {product.quantity > 0 ? "In stock" : "Out of stock"}
                </span>
              </div>

              <div className="mt-6 grid gap-3 text-sm text-muted-foreground">
                {[
                  "Verified fitment for popular models",
                  "Fast delivery and pickup options",
                  "Quality checked before dispatch"
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                    {product.categories?.name || "Category"}
                  </span>
                  <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                    {product.brands?.name || "Brand"}
                  </span>
                  {product.models?.name ? (
                    <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                      {product.models.name}
                    </span>
                  ) : null}
                  {product.years?.label ? (
                    <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold">
                      {product.years.label}
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  className="btn-primary h-11"
                  disabled={product.quantity <= 0}
                  onClick={addItemToCart}
                >
                  Add to cart
                </button>
                <button className="btn-outline h-11">Buy now</button>
              </div>

              <div className="mt-6 rounded-xl border border-border bg-background p-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  Same-day dispatch for orders placed before 3pm.
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-muted-foreground" />
                  Secure payments with instant order confirmation.
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="mt-10">
          <div className="section-header">
            <div>
              <h2 className="section-title">Recommended for you</h2>
              <p className="section-subtitle">More parts that match your vehicle.</p>
            </div>
            <Link to="/shop" className="text-sm text-muted-foreground hover:text-foreground">
              View all
            </Link>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedLoading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-56" />
              ))
            ) : recommended.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border bg-background p-6 text-sm text-muted-foreground">
                No recommendations yet. Browse the shop to discover more parts.
              </div>
            ) : (
              recommended.map((item) => (
                <div key={item.id} className="card card-hover p-4">
                  <img
                    src={item.image_url || fallbackImage}
                    alt={item.name}
                    className="h-32 w-full rounded-lg object-cover sm:h-36"
                  />
                  <div className="mt-3">
                    <div className="text-xs text-muted-foreground">
                      {item.categories?.name || "Auto parts"}
                    </div>
                    <div className="mt-1 text-sm font-semibold text-foreground">
                      {item.name}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-sm font-semibold">
                        GHS {item.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {item.quantity > 0 ? "In stock" : "Unavailable"}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        className="btn-outline flex-1 text-center"
                        onClick={() => {
                          addToCart({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            image: item.image_url || fallbackImage
                          });
                          push("Added to cart", "success");
                        }}
                      >
                        <ShoppingCart className="mr-2 h-4 w-4" />
                        Add
                      </button>
                      <Link to={`/product/${item.id}`} className="btn-primary flex-1 text-center">
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
      <PublicFooterCTA />
    </div>
  );
};

