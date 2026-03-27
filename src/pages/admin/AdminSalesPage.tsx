import React from "react";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Loader2,
  Minus,
  Package,
  Plus,
  RefreshCcw,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Trash2
} from "lucide-react";
import api from "../../lib/api";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { PageHeader } from "../../components/ui/PageHeader";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { useToast } from "../../components/ui/Toast";

type SaleRecord = {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at?: string;
  note?: string | null;
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string; image_url?: string | null };
};

type CartItem = {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  availableStock: number;
  image_url?: string | null;
  category?: string;
  brand?: string;
  isManual?: boolean;
};

type ProductsResponse = {
  data?: Product[];
  pagination?: { total: number; totalPages: number; page: number };
};

type CategoryOption = {
  id: string;
  name: string;
};

const PRODUCTS_LIMIT = 60;

const formatCurrency = (value: number) =>
  `GHS ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

const getStockTone = (quantity: number) => {
  if (quantity <= 0) return "bg-red-100 text-red-700";
  if (quantity <= 5) return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const getFriendlyDate = (value?: string) => {
  if (!value) return "";
  return new Date(value).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
};

export const AdminSalesPage: React.FC = () => {
  const [sales, setSales] = React.useState<SaleRecord[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [loadingSales, setLoadingSales] = React.useState(true);
  const [loadingProducts, setLoadingProducts] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [saleModalOpen, setSaleModalOpen] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<CartItem[]>([]);
  const [catalogQuery, setCatalogQuery] = React.useState("");
  const [salesQuery, setSalesQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().slice(0, 10)
  );
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const [note, setNote] = React.useState("");
  const [manualName, setManualName] = React.useState("");
  const [manualPrice, setManualPrice] = React.useState("");
  const [manualQuantity, setManualQuantity] = React.useState("1");
  const deferredCatalogQuery = React.useDeferredValue(catalogQuery);
  const { push } = useToast();

  const loadSales = React.useCallback(async () => {
    setLoadingSales(true);
    try {
      const res = await api.get<any[]>("/sales");
      const rows = Array.isArray(res.data) ? res.data : [];
      const mapped = rows.map((sale) => ({
        id: String(sale.id),
        product_id: sale.product_id || null,
        product_name: sale.product_name || sale.products?.name || "Unknown Product",
        quantity: Number(sale.quantity || 0),
        unit_price: Number(sale.price || 0),
        total: Number(sale.total || 0),
        created_at: sale.created_at,
        note: sale.note || null
      }));
      setSales(mapped);
    } catch {
      setSales([]);
      push("Failed to load sales", "error");
    } finally {
      setLoadingSales(false);
    }
  }, [push]);

  const loadProducts = React.useCallback(
    async (search = "") => {
      setLoadingProducts(true);
      try {
        const res = await api.get<ProductsResponse | Product[]>("/products", {
          params: { limit: PRODUCTS_LIMIT, q: search || undefined }
        });
        const rows = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.data)
          ? res.data.data
          : [];
        setProducts(rows);
      } catch {
        setProducts([]);
        push("Failed to load products", "error");
      } finally {
        setLoadingProducts(false);
      }
    },
    [push]
  );

  const loadCategories = React.useCallback(async () => {
    try {
      const res = await api.get<CategoryOption[]>("/categories");
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCategories([]);
    }
  }, []);

  const refreshPage = React.useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadSales(), loadProducts(deferredCatalogQuery.trim())]);
    setRefreshing(false);
  }, [deferredCatalogQuery, loadProducts, loadSales]);

  React.useEffect(() => {
    loadSales();
  }, [loadSales]);

  React.useEffect(() => {
    loadProducts(deferredCatalogQuery.trim());
  }, [deferredCatalogQuery, loadProducts]);

  React.useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const productLookup = React.useMemo(() => {
    return new Map(products.map((product) => [product.id, product]));
  }, [products]);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySales = sales.filter((sale) => sale.created_at?.slice(0, 10) === todayKey);
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const todayItems = todaySales.reduce((sum, sale) => sum + sale.quantity, 0);
  const todayTransactions = todaySales.length;
  const avgTicket = todayTransactions ? todayRevenue / todayTransactions : 0;

  const visibleProducts = React.useMemo(() => {
    const search = deferredCatalogQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "all" || product.categories?.name === selectedCategory;
      if (!matchesCategory) return false;
      if (!search) return true;
      const haystack = [
        product.name,
        product.categories?.name,
        product.brands?.name,
        product.models?.name
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(search);
    });
  }, [deferredCatalogQuery, products, selectedCategory]);

  const filteredSales = React.useMemo(() => {
    const search = salesQuery.trim().toLowerCase();
    return sales.filter((sale) => {
      if (!search) return true;
      return sale.product_name.toLowerCase().includes(search);
    });
  }, [sales, salesQuery]);

  const groupedSales = React.useMemo(() => {
    const grouped = new Map<string, { total: number; count: number; items: number }>();
    filteredSales.forEach((sale) => {
      if (!sale.created_at) return;
      const key = sale.created_at.slice(0, 10);
      const current = grouped.get(key) || { total: 0, count: 0, items: 0 };
      grouped.set(key, {
        total: current.total + sale.total,
        count: current.count + 1,
        items: current.items + sale.quantity
      });
    });
    return Array.from(grouped.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  const salesForSelectedDate = React.useMemo(() => {
    return filteredSales.filter((sale) => sale.created_at?.slice(0, 10) === selectedDate);
  }, [filteredSales, selectedDate]);

  React.useEffect(() => {
    if (!groupedSales.some((entry) => entry.date === selectedDate) && groupedSales[0]?.date) {
      setSelectedDate(groupedSales[0].date);
    }
  }, [groupedSales, selectedDate]);

  const addProductToCart = (product: Product) => {
    if (product.quantity <= 0) {
      push(`${product.name} is out of stock`, "error");
      return;
    }

    setCartItems((current) => {
      const existing = current.find((item) => item.product_id === product.id && !item.isManual);
      if (existing) {
        if (existing.quantity >= product.quantity) {
          push(`Only ${product.quantity} unit(s) available for ${product.name}`, "error");
          return current;
        }
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: item.quantity + 1, availableStock: product.quantity }
            : item
        );
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: Number(product.price || 0),
          availableStock: product.quantity,
          image_url: product.models?.image_url || product.image_url || null,
          category: product.categories?.name,
          brand: product.brands?.name,
          isManual: false
        }
      ];
    });
  };

  const addManualItemToCart = () => {
    const trimmedName = manualName.trim();
    const quantity = Number(manualQuantity);
    const price = Number(manualPrice);

    if (!trimmedName) {
      push("Enter a product name for the manual sale", "error");
      return;
    }
    if (!Number.isFinite(quantity) || quantity <= 0) {
      push("Enter a valid quantity", "error");
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      push("Enter a valid price", "error");
      return;
    }

    setCartItems((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        product_id: null,
        product_name: trimmedName,
        quantity,
        unit_price: price,
        availableStock: Number.MAX_SAFE_INTEGER,
        isManual: true
      }
    ]);
    setManualName("");
    setManualPrice("");
    setManualQuantity("1");
  };

  const updateCartQuantity = (itemId: string, nextQuantity: number) => {
    setCartItems((current) => {
      if (nextQuantity <= 0) {
        return current.filter((item) => item.id !== itemId);
      }

      return current.map((item) => {
        if (item.id !== itemId) return item;
        if (item.isManual || !item.product_id) {
          return { ...item, quantity: nextQuantity };
        }
        const available = productLookup.get(item.product_id)?.quantity ?? item.availableStock;
        if (nextQuantity > available) {
          push(`Only ${available} unit(s) available for ${item.product_name}`, "error");
          return { ...item, availableStock: available };
        }
        return { ...item, quantity: nextQuantity, availableStock: available };
      });
    });
  };

  const updateCartPrice = (itemId: string, nextPrice: string) => {
    const parsed = Number(nextPrice);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setCartItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, unit_price: parsed } : item
      )
    );
  };

  const removeCartItem = (itemId: string) => {
    setCartItems((current) => current.filter((item) => item.id !== itemId));
  };

  const clearSaleBuilder = () => {
    setCartItems([]);
    setNote("");
    setManualName("");
    setManualPrice("");
    setManualQuantity("1");
  };

  const completeSale = async () => {
    if (cartItems.length === 0) {
      push("Add at least one product before checkout", "error");
      return;
    }

    for (const item of cartItems) {
      const liveProduct = item.product_id ? productLookup.get(item.product_id) : null;
      const available = liveProduct?.quantity ?? item.availableStock;
      if (!item.isManual && item.product_id && item.quantity > available) {
        push(`Only ${available} unit(s) available for ${item.product_name}`, "error");
        return;
      }
      if (item.unit_price <= 0) {
        push(`Enter a valid price for ${item.product_name}`, "error");
        return;
      }
    }

    setSaving(true);
    try {
      for (const item of cartItems) {
        await api.post("/sales", {
          product_id: item.product_id || null,
          product_name: item.isManual ? item.product_name : null,
          quantity: item.quantity,
          price: item.unit_price,
          note: note.trim() || null
        });
      }

      push(
        `Sale completed for ${cartCount} item(s). Total ${formatCurrency(subtotal)}`,
        "success"
      );
      clearSaleBuilder();
      setSaleModalOpen(false);
      await Promise.all([loadSales(), loadProducts(deferredCatalogQuery.trim())]);
    } catch (error: any) {
      push(error?.response?.data?.error || "Failed to complete sale", "error");
    } finally {
      setSaving(false);
    }
  };

  const selectedDateRevenue = salesForSelectedDate.reduce((sum, sale) => sum + sale.total, 0);

  const topProducts = React.useMemo(() => {
    const bucket = new Map<string, { name: string; quantity: number; total: number }>();
    sales.forEach((sale) => {
      const key = sale.product_id || `manual:${sale.product_name}`;
      const current = bucket.get(key) || {
        name: sale.product_name,
        quantity: 0,
        total: 0
      };
      bucket.set(key, {
        name: current.name,
        quantity: current.quantity + sale.quantity,
        total: current.total + sale.total
      });
    });
    return Array.from(bucket.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [sales]);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Sales"
        subtitle="Run in-store sales with a faster product picker, a live cart, and cleaner checkout."
        meta={`${sales.length} sales recorded`}
        actions={
          <>
            <button
              className="btn-outline h-10 gap-2 px-4 text-sm"
              onClick={refreshPage}
              disabled={refreshing}
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
            <button
              className="btn-primary h-10 gap-2 px-4 text-sm"
              onClick={() => setSaleModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Sale
            </button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card overflow-hidden p-0">
          <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Today Revenue
                </p>
                <p className="mt-2 text-2xl font-bold">{formatCurrency(todayRevenue)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{todayTransactions} transactions today</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Items Sold
              </p>
              <p className="mt-2 text-2xl font-bold">{todayItems}</p>
              <p className="mt-1 text-sm text-muted-foreground">Across all in-store sales today</p>
            </div>
            <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Average Ticket
              </p>
              <p className="mt-2 text-2xl font-bold">{formatCurrency(avgTicket)}</p>
              <p className="mt-1 text-sm text-muted-foreground">Average value per sale line today</p>
            </div>
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="card p-4">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Current Cart
              </p>
              <p className="mt-2 text-2xl font-bold">{cartCount} item(s)</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatCurrency(subtotal)} ready to checkout</p>
            </div>
            <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
              <ShoppingCart className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="space-y-6">
          <div className="card p-4">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Product Catalog</h2>
                <p className="text-sm text-muted-foreground">
                  Search, filter, and add products to the cart in one click.
                </p>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-semibold text-foreground">{visibleProducts.length}</span> products
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  className="w-full bg-transparent outline-none"
                  placeholder="Search by product, brand, model, or category..."
                  value={catalogQuery}
                  onChange={(event) => setCatalogQuery(event.target.value)}
                />
              </div>
              <select
                className="form-input h-11 min-w-[220px]"
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
              >
                <option value="all">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {loadingProducts ? (
              <div className="py-12">
                <PageLoading text="Loading products..." />
              </div>
            ) : visibleProducts.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No products found"
                  description="Try another search or category to find products to sell."
                  action={
                    <button className="btn-outline h-10 px-4" onClick={refreshPage}>
                      Refresh products
                    </button>
                  }
                />
              </div>
            ) : (
              <div className="mt-6 grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {visibleProducts.map((product) => {
                  const imageSrc = product.models?.image_url || product.image_url;
                  const cartItem = cartItems.find((item) => item.product_id === product.id);
                  return (
                    <div
                      key={product.id}
                      className="group overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <div className="relative h-40 bg-muted/40">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={product.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Package className="h-8 w-8" />
                          </div>
                        )}
                        <div className="absolute left-3 top-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStockTone(
                              product.quantity
                            )}`}
                          >
                            {product.quantity <= 0
                              ? "Out of stock"
                              : `${product.quantity} in stock`}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 p-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            {product.categories?.name ? (
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                {product.categories.name}
                              </span>
                            ) : null}
                            {product.brands?.name ? (
                              <span className="rounded-full bg-muted px-2.5 py-1">
                                {product.brands.name}
                              </span>
                            ) : null}
                          </div>
                          <h3 className="line-clamp-2 text-base font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {product.models?.name || "Ready for immediate sale"}
                          </p>
                        </div>

                        <div className="flex items-end justify-between">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">Price</p>
                            <p className="text-xl font-bold">{formatCurrency(product.price)}</p>
                          </div>
                          {cartItem ? (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              {cartItem.quantity} in cart
                            </span>
                          ) : null}
                        </div>

                        <button
                          className="btn-primary h-11 w-full gap-2"
                          onClick={() => addProductToCart(product)}
                          disabled={product.quantity <= 0}
                        >
                          <Plus className="h-4 w-4" />
                          {product.quantity <= 0 ? "Unavailable" : "Add Product"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="card p-4">
              <div className="mb-4 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="font-semibold">Sales by Day</h2>
                  <p className="text-sm text-muted-foreground">Quick revenue view for recent selling days.</p>
                </div>
              </div>

              {loadingSales ? (
                <PageLoading text="Loading sales..." />
              ) : groupedSales.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No sales recorded yet.</p>
              ) : (
                <div className="space-y-2">
                  {groupedSales.slice(0, 8).map((day) => (
                    <button
                      key={day.date}
                      onClick={() => setSelectedDate(day.date)}
                      className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition-colors ${
                        selectedDate === day.date
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      <div>
                        <p className="font-medium">{day.date}</p>
                        <p className="text-xs text-muted-foreground">
                          {day.count} sales lines | {day.items} items
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(day.total)}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="card p-4">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">Top Products</h2>
                  <p className="text-sm text-muted-foreground">Best performers from recorded sales.</p>
                </div>
              </div>

              {topProducts.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No product sales data yet.</p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((product, index) => (
                    <div
                      key={`${product.name}-${index}`}
                      className="flex items-center justify-between rounded-xl border border-border/60 p-3"
                    >
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.quantity} item(s) sold</p>
                      </div>
                      <p className="font-semibold">{formatCurrency(product.total)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        <aside className="space-y-6">
          <div className="card p-4 xl:sticky xl:top-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Sale Builder</h2>
                <p className="text-sm text-muted-foreground">
                  Review the cart, adjust quantities, and complete checkout.
                </p>
              </div>
              {cartItems.length > 0 ? (
                <button className="btn-outline h-9 px-3 text-xs" onClick={clearSaleBuilder}>
                  Clear
                </button>
              ) : null}
            </div>

            {cartItems.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="Cart is empty"
                  description="Select products from the catalog to start building a sale."
                />
              </div>
            ) : (
              <>
                <div className="mt-6 space-y-3">
                  {cartItems.map((item) => {
                    const lineTotal = item.quantity * item.unit_price;
                    return (
                      <div key={item.id} className="rounded-2xl border border-border bg-background p-3">
                        <div className="flex items-start gap-3">
                          <div className="h-16 w-16 overflow-hidden rounded-xl bg-muted/50">
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.product_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-muted-foreground">
                                <Package className="h-5 w-5" />
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="line-clamp-2 font-medium">{item.product_name}</p>
                                <p className="text-xs text-muted-foreground">
                                  {item.isManual
                                    ? "Manual sale item"
                                    : [item.category, item.brand].filter(Boolean).join(" | ") || "Store product"}
                                </p>
                              </div>
                              <button
                                className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                                onClick={() => removeCartItem(item.id)}
                                aria-label={`Remove ${item.product_name}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-[auto_1fr]">
                              <div>
                                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Quantity
                                </p>
                                <div className="inline-flex items-center rounded-xl border border-border bg-card">
                                  <button
                                    className="px-3 py-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                                  >
                                    <Minus className="h-4 w-4" />
                                  </button>
                                  <span className="min-w-[2.5rem] text-center text-sm font-semibold">
                                    {item.quantity}
                                  </span>
                                  <button
                                    className="px-3 py-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                                  >
                                    <Plus className="h-4 w-4" />
                                  </button>
                                </div>
                                {!item.isManual ? (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    {item.availableStock} available
                                  </p>
                                ) : (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    Not linked to inventory
                                  </p>
                                )}
                              </div>

                              <div>
                                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                  Unit price
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-input h-10 w-full"
                                  value={item.unit_price}
                                  onChange={(event) =>
                                    updateCartPrice(item.id, event.target.value)
                                  }
                                />
                              </div>
                            </div>

                            <div className="flex items-center justify-between border-t border-border/70 pt-3">
                              <span className="text-sm text-muted-foreground">Line total</span>
                              <span className="text-base font-semibold">{formatCurrency(lineTotal)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 space-y-4 rounded-2xl border border-border bg-muted/30 p-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Sale note</label>
                    <textarea
                      className="form-input min-h-[96px] w-full resize-none"
                      placeholder="Optional note for the sale receipt or staff reference"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />
                  </div>

                  <div className="space-y-3 border-t border-border pt-4">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Items</span>
                      <span className="font-medium">{cartCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex items-center justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                  </div>

                  <button
                    className="btn-primary h-12 w-full gap-2"
                    onClick={completeSale}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Processing sale...
                      </>
                    ) : (
                      <>
                        Complete sale
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-semibold">Sales Activity</h2>
                <p className="text-sm text-muted-foreground">
                  Browse recorded sales and inspect a selected day.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search sales history..."
                value={salesQuery}
                onChange={(event) => setSalesQuery(event.target.value)}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Selected day
              </p>
              <p className="mt-1 text-lg font-semibold">{selectedDate || "No date selected"}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {salesForSelectedDate.length} sales lines | {formatCurrency(selectedDateRevenue)}
              </p>
            </div>

            {loadingSales ? (
              <div className="py-10">
                <PageLoading text="Loading sales..." />
              </div>
            ) : filteredSales.length === 0 ? (
              <div className="mt-6">
                <EmptyState
                  title="No sales found"
                  description="Record a sale or adjust your search to see more results."
                />
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                {salesForSelectedDate.slice(0, 10).map((sale) => (
                  <div key={sale.id} className="rounded-2xl border border-border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{sale.product_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getFriendlyDate(sale.created_at)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Qty {sale.quantity} | {formatCurrency(sale.unit_price)} each
                        </p>
                        {sale.note ? (
                          <p className="mt-2 text-xs text-muted-foreground">Note: {sale.note}</p>
                        ) : null}
                      </div>
                      <p className="text-right text-base font-semibold">{formatCurrency(sale.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      <Modal
        open={saleModalOpen}
        onClose={() => setSaleModalOpen(false)}
        title="Add Sale"
        size="lg"
      >
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Select From Products
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Pick an item already in inventory, or add a manual sale below.
                </p>
              </div>

              <div className="flex flex-col gap-3 lg:flex-row">
                <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    className="w-full bg-transparent outline-none"
                    placeholder="Search products..."
                    value={catalogQuery}
                    onChange={(event) => setCatalogQuery(event.target.value)}
                  />
                </div>
                <select
                  className="form-input h-11 min-w-[200px]"
                  value={selectedCategory}
                  onChange={(event) => setSelectedCategory(event.target.value)}
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="max-h-[26rem] space-y-3 overflow-y-auto pr-1">
                {loadingProducts ? (
                  <PageLoading text="Loading products..." />
                ) : visibleProducts.length === 0 ? (
                  <EmptyState
                    title="No products found"
                    description="Try another search or category, or use the manual sale form."
                  />
                ) : (
                  visibleProducts.slice(0, 20).map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between rounded-2xl border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {[product.categories?.name, product.brands?.name].filter(Boolean).join(" | ") || "Store product"}
                        </p>
                        <p className="mt-1 text-sm font-semibold">{formatCurrency(product.price)}</p>
                      </div>
                      <div className="ml-4 flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStockTone(
                            product.quantity
                          )}`}
                        >
                          {product.quantity <= 0 ? "Out" : `${product.quantity} in stock`}
                        </span>
                        <button
                          className="btn-primary h-10 px-4 text-sm"
                          onClick={() => addProductToCart(product)}
                          disabled={product.quantity <= 0}
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-muted/30 p-4">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Manual Sale
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Use this when the product is not yet in the database. Manual sales do not affect inventory.
                </p>

                <div className="mt-4 space-y-3">
                  <input
                    className="form-input w-full"
                    placeholder="Type product name"
                    value={manualName}
                    onChange={(event) => setManualName(event.target.value)}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      min="1"
                      className="form-input w-full"
                      placeholder="Qty"
                      value={manualQuantity}
                      onChange={(event) => setManualQuantity(event.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="form-input w-full"
                      placeholder="Price"
                      value={manualPrice}
                      onChange={(event) => setManualPrice(event.target.value)}
                    />
                  </div>
                  <button className="btn-outline h-11 w-full" onClick={addManualItemToCart}>
                    Add Manual Item
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Cart</h3>
                    <p className="text-sm text-muted-foreground">{cartCount} item(s)</p>
                  </div>
                  {cartItems.length > 0 ? (
                    <button className="btn-outline h-9 px-3 text-xs" onClick={clearSaleBuilder}>
                      Clear
                    </button>
                  ) : null}
                </div>

                {cartItems.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState
                      title="No items added yet"
                      description="Add products or type a manual sale item."
                    />
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {cartItems.map((item) => (
                      <div key={item.id} className="rounded-xl border border-border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{item.product_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {item.isManual ? "Manual sale item" : "Inventory product"}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Qty {item.quantity} | {formatCurrency(item.unit_price)} each
                            </p>
                          </div>
                          <button
                            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                            onClick={() => removeCartItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}

                    <textarea
                      className="form-input min-h-[90px] w-full resize-none"
                      placeholder="Optional note for this sale"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                    />

                    <div className="rounded-xl border border-border bg-muted/20 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Items</span>
                        <span className="font-medium">{cartCount}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatCurrency(subtotal)}</span>
                      </div>
                    </div>

                    <button
                      className="btn-primary h-12 w-full gap-2"
                      onClick={completeSale}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Processing sale...
                        </>
                      ) : (
                        <>
                          Create Sale
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
