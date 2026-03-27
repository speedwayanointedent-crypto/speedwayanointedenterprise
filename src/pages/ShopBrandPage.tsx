import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart, Check, SlidersHorizontal, X, Package, Star } from "lucide-react";
import api from "../lib/api";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
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

export const ShopBrandPage: React.FC = () => {
  const { brandId } = useParams<{ brandId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [brand, setBrand] = React.useState<Brand | null>(null);
  const [category, setCategory] = React.useState<{ id: string; name: string } | null>(null);
  const [groupedProducts, setGroupedProducts] = React.useState<GroupedProduct[]>([]);
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
      image: product.image_url || ""
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

  const displayedProducts = React.useMemo(() => {
    const all = filteredGroups.flatMap(g => 
      g.products.map(p => ({ ...p, _modelImage: g.model.image_url }))
    );
    return showAll ? all : all.slice(0, 24);
  }, [filteredGroups, showAll]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:pt-28">
        {loading ? (
          <PageLoading text="Loading products..." />
        ) : error ? (
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="text-center max-w-md mx-auto px-4">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/30 dark:to-red-800/30 flex items-center justify-center">
                <X className="w-10 h-10 text-red-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{error}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">Please try again later.</p>
              <button onClick={() => navigate(-1)} className="px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-all">
                Go Back
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-10">
              <button
                onClick={() => navigate(categoryId ? `/shop/category/${categoryId}` : "/shop")}
                className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Back to {category?.name || "Shop"}
              </button>

              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl blur-xl"></div>
                    <div className="relative w-20 h-20 rounded-2xl bg-white dark:bg-gray-800 shadow-xl shadow-gray-200/50 dark:shadow-none overflow-hidden flex items-center justify-center border border-gray-100 dark:border-gray-700">
                      {brand?.logo_url ? (
                        <img src={brand.logo_url} alt={brand.name} className="w-full h-full object-contain p-2" />
                      ) : (
                        <span className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/60 bg-clip-text text-transparent">{brand?.name?.charAt(0)}</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{brand?.name}</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      {category ? `${category.name} · ` : ""}
                      <span className="font-semibold text-gray-900 dark:text-white">{totalProducts}</span> products available
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-12 pl-12 pr-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery("")} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <WhatsAppButton label="Support" className="h-12 px-6 shadow-lg shadow-green-500/20" />
                </div>
              </div>
            </div>

            {filteredGroups.length === 0 ? (
              <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <Search className="w-10 h-10 text-gray-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No products found</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try adjusting your search.</p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {displayedProducts.map((product: any) => {
                    const imageUrl = product.image_url || product._modelImage;
                    const isAdded = addedProducts.has(product.id);
                    return (
                      <div
                        key={product.id}
                        className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-2xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden transition-all duration-500 hover:-translate-y-2"
                      >
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 overflow-hidden">
                          {imageUrl ? (
                            <img src={imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          ) : (
                            <div className="flex items-center justify-center h-full">
                              <Package className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          
                          {product.quantity <= 5 && product.quantity > 0 && (
                            <div className="absolute left-3 top-3">
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 text-white text-xs font-bold shadow-lg shadow-orange-500/30">
                                <Star className="w-3 h-3" /> Only {product.quantity} left
                              </span>
                            </div>
                          )}
                          
                          <button
                            onClick={() => navigate(`/product/${product.id}`)}
                            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300"
                          >
                            <span className="px-6 py-2.5 rounded-full bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white text-sm font-semibold shadow-xl backdrop-blur-sm transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                              View Details
                            </span>
                          </button>
                        </div>

                        <div className="p-5">
                          <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 leading-snug mb-4 min-h-[2.5rem]">
                            {product.name}
                          </h3>
                          
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Price</p>
                              <p className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                                GHS {product.price.toLocaleString()}
                              </p>
                            </div>
                            
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={product.quantity === 0 || isAdded}
                              className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 ${
                                isAdded
                                  ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                  : product.quantity === 0
                                  ? "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                                  : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:shadow-lg hover:shadow-gray-900/20 dark:hover:shadow-white/20 active:scale-95"
                              }`}
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-4 h-4" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <ShoppingCart className="w-4 h-4" />
                                  Add
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {!showAll && filteredGroups.flatMap(g => g.products).length > 24 && (
                  <div className="mt-12 text-center">
                    <button
                      onClick={() => setShowAll(true)}
                      className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 dark:from-white dark:to-gray-100 text-white dark:text-gray-900 font-semibold shadow-xl shadow-gray-900/20 hover:shadow-2xl hover:shadow-gray-900/30 transition-all duration-300 hover:-translate-y-1 active:scale-95"
                    >
                      <SlidersHorizontal className="w-5 h-5" />
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
