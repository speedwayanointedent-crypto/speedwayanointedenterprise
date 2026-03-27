import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Search, ShoppingCart, Check, X, Package, ChevronRight } from "lucide-react";
import api from "../lib/api";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { WhatsAppButton } from "../components/ui/WhatsAppButton";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { PageLoading } from "../components/ui/LoadingSpinner";
import { useToast } from "../components/ui/Toast";
import { addToCart } from "../lib/cart";

type Category = {
  id: string;
  name: string;
  image_url?: string | null;
  show_by_brand?: boolean;
};

type Brand = {
  id: string;
  name: string;
  logo_url?: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
};

type ModelGroup = {
  model_id: string;
  model_name: string;
  model_image?: string | null;
  brand_id?: string;
  brand_name?: string;
  products: Product[];
};

const fallbackImage = "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600&h=400&fit=crop";

export const ShopCategoryPage: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { push } = useToast();
  const [category, setCategory] = React.useState<Category | null>(null);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [modelGroups, setModelGroups] = React.useState<ModelGroup[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [addedProducts, setAddedProducts] = React.useState<Set<string>>(new Set());
  const [showAll, setShowAll] = React.useState(false);

  React.useEffect(() => {
    async function loadData() {
      if (!categoryId) return;
      setLoading(true);
      try {
        const catRes = await api.get<Category>(`/categories/${categoryId}`);
        const cat = catRes.data;
        cat.show_by_brand = cat.show_by_brand !== false;
        setCategory(cat);

        if (cat.show_by_brand) {
          const [brandRes] = await Promise.all([
            api.get<Brand[]>("/brands")
          ]);
          setBrands(brandRes.data || []);
        } else {
          const [productsRes] = await Promise.all([
            api.get<ModelGroup[]>(`/categories/${categoryId}/products-by-model`)
          ]);
          setModelGroups(productsRes.data || []);
        }

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

  const handleAddToCart = (product: Product, modelImage?: string | null) => {
    setAddedProducts(prev => new Set(prev).add(product.id));

    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image_url || modelImage || ""
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

  const filteredBrands = React.useMemo(() => {
    if (!searchQuery.trim()) return brands;
    const query = searchQuery.toLowerCase();
    return brands.filter(brand => brand.name.toLowerCase().includes(query));
  }, [brands, searchQuery]);

  const filteredGroups = React.useMemo(() => {
    if (!searchQuery.trim()) return modelGroups;
    const query = searchQuery.toLowerCase();
    return modelGroups.map(group => ({
      ...group,
      products: group.products.filter(p =>
        p.name.toLowerCase().includes(query)
      )
    })).filter(g => g.products.length > 0);
  }, [modelGroups, searchQuery]);

  const displayedGroups = React.useMemo(() => {
    if (showAll) return filteredGroups;
    return filteredGroups.slice(0, 4);
  }, [filteredGroups, showAll]);

  const handleBrandClick = (brand: Brand) => {
    navigate(`/shop/brand/${brand.id}?category=${categoryId}`);
  };

  const totalProducts = filteredGroups.reduce((sum, g) => sum + g.products.length, 0);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <PublicNavbar />
      <main className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:pt-28">
        {loading ? (
          <PageLoading text="Loading category..." />
        ) : error ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <Package className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{error}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Please try again later.</p>
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <button
                onClick={() => navigate("/shop")}
                className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Back to Shop
              </button>

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 shadow-lg overflow-hidden">
                    {category?.image_url ? (
                      <img src={category.image_url} alt={category.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-gray-800 dark:text-white">{category?.name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{category?.name}</h1>
                    <p className="mt-1 text-gray-500 dark:text-gray-400">
                      {category?.show_by_brand
                        ? `${brands.length} brand${brands.length !== 1 ? 's' : ''} available`
                        : `${totalProducts} product${totalProducts !== 1 ? 's' : ''} available`
                      }
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="relative flex-1 sm:min-w-[320px]">
                    <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder={category?.show_by_brand ? "Search brands..." : "Search products..."}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-12 pr-10 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 shadow-sm transition-all focus:border-gray-900 dark:focus:border-white focus:outline-none focus:ring-2 focus:ring-gray-900/10"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  <WhatsAppButton label="Support" className="h-12 px-6 shadow-lg shadow-green-500/20" />
                </div>
              </div>
            </div>

            {category?.show_by_brand ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredBrands.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => handleBrandClick(brand)}
                    className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 transition-all hover:shadow-xl"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-full w-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <span className="text-4xl font-bold text-gray-400 dark:text-gray-500">{brand.name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <ChevronRight className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{brand.name}</h3>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <>
                {filteredGroups.length === 0 ? (
                  <div className="flex min-h-[40vh] items-center justify-center">
                    <div className="text-center">
                      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                        <Search className="h-8 w-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No products found</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your search.</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {displayedGroups.map((group) => (
                      <div key={group.model_id} className="mb-10">
                        <div className="mb-4 flex items-center gap-4">
                          {group.model_image ? (
                            <img src={group.model_image} alt={group.model_name} className="h-12 w-12 rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{group.model_name}</h2>
                            {group.brand_name && (
                              <p className="text-sm text-gray-500 dark:text-gray-400">{group.brand_name}</p>
                            )}
                          </div>
                        </div>
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          {group.products.map((product) => {
                            const imageUrl = product.image_url || group.model_image;
                            return (
                              <div
                                key={product.id}
                                className="group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-gray-200/50 dark:ring-gray-700/50 transition-all hover:shadow-xl"
                              >
                                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700">
                                  {imageUrl ? (
                                    <img
                                      src={imageUrl}
                                      alt={product.name}
                                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-600">
                                      <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                                    </div>
                                  )}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                                  {product.quantity === 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                      <span className="rounded-full bg-white dark:bg-gray-900 px-4 py-1.5 text-sm font-semibold text-gray-900 dark:text-white">Out of Stock</span>
                                    </div>
                                  )}

                                  {product.quantity > 0 && product.quantity <= 5 && (
                                    <div className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                                      Only {product.quantity} left
                                    </div>
                                  )}
                                </div>

                                <div className="p-5">
                                  <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white leading-snug">
                                    {product.name}
                                  </h3>

                                  <div className="mt-3 flex items-center justify-between">
                                    <div>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">Price</p>
                                      <p className="text-lg font-bold text-gray-900 dark:text-white">GHS {product.price.toLocaleString()}</p>
                                    </div>

                                    <button
                                      onClick={() => handleAddToCart(product, group.model_image)}
                                      disabled={product.quantity === 0 || addedProducts.has(product.id)}
                                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all ${
                                        addedProducts.has(product.id)
                                          ? "bg-green-500 text-white shadow-lg shadow-green-500/30"
                                          : product.quantity === 0
                                          ? "cursor-not-allowed bg-gray-100 dark:bg-gray-700 text-gray-400"
                                          : "bg-gray-900 dark:bg-white dark:text-gray-900 text-white shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95"
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
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {!showAll && filteredGroups.length > 4 && (
                      <div className="mt-12 text-center">
                        <button
                          onClick={() => setShowAll(true)}
                          className="inline-flex items-center gap-2 rounded-full bg-gray-900 dark:bg-white dark:text-gray-900 px-8 py-4 text-sm font-semibold text-white shadow-xl transition-all hover:bg-gray-800 dark:hover:bg-gray-100 active:scale-95"
                        >
                          View all products
                        </button>
                      </div>
                    )}
                  </>
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
