import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ChevronDown, ChevronUp, ShoppingCart, Check, SlidersHorizontal, X, Package } from "lucide-react";
import api from "../lib/api";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoading } from "../components/ui/LoadingSpinner";
import { useToast } from "../components/ui/Toast";
import { addToCart } from "../lib/cart";

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
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  status: string;
  model_id?: string;
};

type GroupedProduct = {
  model: Model;
  products: Product[];
};

const fallbackImage = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop";

export const ShopBrandPage: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [category, setCategory] = React.useState<{ id: string; name: string } | null>(null);
  const [groupedProducts, setGroupedProducts] = React.useState<GroupedProduct[]>([]);
  const [allProducts, setAllProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [addedProducts, setAddedProducts] = React.useState<Set<string>>(new Set());

  const categoryId = new URLSearchParams(window.location.search).get("category");

  React.useEffect(() => {
    async function loadData() {
      if (!brandId) return;
      setLoading(true);
      try {
        const [brandRes, productsRes] = await Promise.all([
          api.get<Brand>(`/brands/${brandId}`),
          api.get<{ data: any[] }>("/products", {
            params: {
              brand_id: brandId,
              category_id: categoryId || undefined,
              limit: "500"
            }
          })
        ]);

        setBrand(brandRes.data);

        if (categoryId) {
          const catRes = await api.get<{ id: string; name: string }>(`/categories/${categoryId}`);
          setCategory(catRes.data);
        }

        const products: any[] = productsRes.data.data || [];
        setAllProducts(products);

        const modelIds = [...new Set(products.map(p => p.model_id).filter(Boolean))];
        let modelsMap: Map<string, Model> = new Map();

        if (modelIds.length > 0) {
          const modelsRes = await api.get<Model[]>("/models");
          modelsMap = new Map(
            (modelsRes.data || [])
              .filter(m => modelIds.includes(m.id))
              .map(m => [m.id, m])
          );
        }

        const grouped = new Map<string, Product[]>();
        products.forEach(p => {
          const modelId = p.model_id || "universal";
          if (!grouped.has(modelId)) {
            grouped.set(modelId, []);
          }
          grouped.get(modelId)!.push(p);
        });

        const result: GroupedProduct[] = [];
        grouped.forEach((prods, modelId) => {
          if (modelId === "universal") {
            result.unshift({
              model: { id: "universal", name: "Universal Parts", brand_id: brandId, image_url: null },
              products: prods
            });
          } else if (modelsMap.has(modelId)) {
            result.push({
              model: modelsMap.get(modelId)!,
              products: prods
            });
          }
        });

        setGroupedProducts(result);
        setError(null);
      } catch (err) {
        console.error("Failed to load:", err);
        setError("Failed to load products");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [brandId, categoryId]);

  const handleAddToCart = (product: Product) => {
    setAddedProducts(prev => new Set(prev).add(product.id));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || fallbackImage
    });
    push("Added to cart", "success");

    setTimeout(() => {
      setAddedProducts(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return groupedProducts;
    const query = searchQuery.toLowerCase();
    return groupedProducts.map(group => ({
      ...group,
      products: group.products.filter(p =>
        p.name.toLowerCase().includes(query) ||
        group.model.name.toLowerCase().includes(query)
      )
    })).filter(g => g.products.length > 0);
  }, [groupedProducts, searchQuery]);

  const totalProducts = filteredGroups.reduce((sum, g) => sum + g.products.length, 0);

  const displayedProducts = showAll ? filteredGroups.flatMap(g => g.products) : filteredGroups.flatMap(g => g.products).slice(0, 24);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:pt-28">
        {loading ? (
          <PageLoading text="Loading products..." />
        ) : error ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <Package className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{error}</h3>
              <p className="mt-1 text-sm text-gray-500">Please try again later.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => navigate(categoryId ? `/shop/category/${categoryId}` : "/shop")}
                className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to {category?.name || "Shop"}
              </button>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-lg shadow-gray-200/50">
                    {brand?.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="h-14 w-14 object-contain" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-800">{brand?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">{brand?.name}</h1>
                    <p className="mt-1 text-gray-500">
                      {category ? `${category.name} · ` : ""}
                      <span className="font-medium text-gray-900">{totalProducts}</span> products available
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 sm:min-w-[320px]">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-12 pr-10 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all focus:border-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <WhatsAppButton label="Support" className="h-12 px-6 shadow-lg shadow-green-500/20" />
                </div>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="flex min-h-[40vh] items-center justify-center">
                <div className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">No products found</h3>
                  <p className="mt-1 text-sm text-gray-500">Try adjusting your search.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {(showAll ? displayedProducts : displayedProducts).map((product) => (
                    <div
                      key={product.id}
                      className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-200/50 transition-all hover:shadow-xl hover:shadow-gray-900/5"
                    >
                      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
                        <img
                          src={product.image_url || fallbackImage}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                        {product.quantity === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                            <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-gray-900">Out of Stock</span>
                          </div>
                        )}

                        {product.quantity > 0 && product.quantity <= 5 && (
                          <div className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg shadow-orange-500/30">
                            Only {product.quantity} left
                          </div>
                        )}
                      </div>

                      <div className="p-5">
                        <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 leading-snug">
                          {product.name}
                        </h3>

                        <div className="mt-3 flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-lg font-bold text-gray-900">GHS {product.price.toLocaleString()}</p>
                          </div>

                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={product.quantity === 0 || addedProducts.has(product.id)}
                            className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                              addedProducts.has(product.id)
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                : product.quantity === 0
                                ? "cursor-not-allowed bg-gray-100 text-gray-400"
                                : "bg-gray-900 text-white shadow-lg hover:bg-gray-800 active:scale-95"
                            }`}
                          >
                            {addedProducts.has(product.id) ? (
                              <Check className="h-5 w-5" />
                            ) : (
                              <ShoppingCart className="h-5 w-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!showAll && filteredGroups.flatMap(g => g.products).length > 24 && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:bg-gray-800 hover:shadow-2xl active:scale-95"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      View all {totalProducts} products
                    </button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </main>
      <PublicFooterCTA />
    </div>
  );
};
