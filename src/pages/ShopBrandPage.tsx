import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Loader2, ChevronDown, ChevronUp, ShoppingCart, Check } from "lucide-react";
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

const fallbackImage = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=600&h=400&fit=crop";

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
  const [expandedModels, setExpandedModels] = React.useState<Set<string>>(new Set());
  const [addedProducts, setAddedProducts] = React.useState<Set<string>>(new Set());
  const [addingToCart, setAddingToCart] = React.useState<Set<string>>(new Set());

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
        setExpandedModels(new Set(result.map(g => g.model.id)));
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

  const toggleModel = (modelId: string) => {
    setExpandedModels(prev => {
      const next = new Set(prev);
      if (next.has(modelId)) {
        next.delete(modelId);
      } else {
        next.add(modelId);
      }
      return next;
    });
  };

  const handleAddToCart = async (product: Product) => {
    setAddingToCart(prev => new Set(prev).add(product.id));
    setAddedProducts(prev => new Set(prev).add(product.id));
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || fallbackImage
    });
    push("Added to cart", "success");

    setTimeout(() => {
      setAddingToCart(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 1500);
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

  return (
    <div className="page-shell">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <div className="mb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(categoryId ? `/shop/category/${categoryId}` : "/shop")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {category?.name || "Shop"}
          </button>
        </div>

        {loading ? (
          <PageLoading text="Loading products..." />
        ) : error ? (
          <div className="rounded-xl border border-dashed border-border bg-background p-8 text-center">
            <div className="text-base font-semibold text-foreground">{error}</div>
          </div>
        ) : (
          <>
            <section className="section-band rounded-2xl p-4 sm:p-6">
              <div className="card p-4 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="flex items-center gap-4">
                    {brand?.logo_url ? (
                      <img src={brand.logo_url} alt={brand.name} className="h-20 w-20 rounded-lg object-contain bg-white p-2" />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg bg-muted">
                        <span className="text-3xl font-bold text-muted-foreground">
                          {brand?.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <PageHeader
                        title={brand?.name || "Brand"}
                        subtitle={category ? `${category.name} · ${totalProducts} products` : `${totalProducts} products`}
                        actions={<WhatsAppButton label="WhatsApp support" className="h-10 px-5 text-sm" />}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
                      <Search className="h-4 w-4" />
                      <input
                        className="w-full bg-transparent outline-none"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {filteredGroups.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-border bg-background p-8 text-center">
                <div className="text-base font-semibold text-foreground">No products found</div>
                <p className="mt-2 text-sm text-muted-foreground">Try adjusting your search.</p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {filteredGroups.map((group) => (
                  <div key={group.model.id} className="card overflow-hidden">
                    <button
                      onClick={() => toggleModel(group.model.id)}
                      className="flex w-full items-center justify-between p-4 text-left hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {group.model.image_url ? (
                          <img
                            src={group.model.image_url}
                            alt={group.model.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                            <span className="text-lg font-bold text-muted-foreground">
                              {group.model.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h3 className="font-semibold text-foreground">{group.model.name}</h3>
                          <p className="text-sm text-muted-foreground">{group.products.length} products</p>
                        </div>
                      </div>
                      {expandedModels.has(group.model.id) ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>

                    {expandedModels.has(group.model.id) && (
                      <div className="border-t border-border">
                        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {group.products.map((product) => (
                            <div key={product.id} className="rounded-lg border border-border bg-background p-3 transition-colors hover:border-primary/30">
                              <img
                                src={product.image_url || fallbackImage}
                                alt={product.name}
                                className="h-32 w-full rounded-lg object-cover"
                              />
                              <div className="mt-3">
                                <h4 className="line-clamp-2 text-sm font-medium text-foreground">
                                  {product.name}
                                </h4>
                                <div className="mt-2 flex items-center justify-between">
                                  <span className="text-sm font-semibold">
                                    GHS {product.price.toLocaleString()}
                                  </span>
                                  {product.quantity === 0 ? (
                                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">
                                      Out of stock
                                    </span>
                                  ) : product.quantity <= 5 ? (
                                    <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                                      {product.quantity} left
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                                      In stock
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleAddToCart(product)}
                                  disabled={product.quantity === 0 || addingToCart.has(product.id)}
                                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-colors ${
                                    addedProducts.has(product.id)
                                      ? "bg-green-500 text-white"
                                      : product.quantity === 0
                                      ? "cursor-not-allowed bg-muted text-muted-foreground"
                                      : "bg-primary text-white hover:bg-primary/90"
                                  }`}
                                >
                                  {addedProducts.has(product.id) ? (
                                    <>
                                      <Check className="h-4 w-4" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="h-4 w-4" />
                                      Add to Cart
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
      <PublicFooterCTA />
    </div>
  );
};
