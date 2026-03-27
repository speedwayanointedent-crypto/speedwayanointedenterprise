import React from "react";
import { Plus, Search, Loader2, X, ShoppingCart, Trash2, Calendar } from "lucide-react";
import api from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";
import { useToast } from "../../components/ui/Toast";

type SaleItem = {
  id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  created_at?: string;
};

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string };
};

export const AdminSalesPage: React.FC = () => {
  const [loading, setLoading] = React.useState(true);
  const [sales, setSales] = React.useState<SaleItem[]>([]);
  const [open, setOpen] = React.useState(false);
  const [cartItems, setCartItems] = React.useState<SaleItem[]>([]);
  const [productSearch, setProductSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<Product[]>([]);
  const [searching, setSearching] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(null);
  const [quantity, setQuantity] = React.useState("1");
  const [customPrice, setCustomPrice] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [query, setQuery] = React.useState("");
  const [selectedDate, setSelectedDate] = React.useState(new Date().toISOString().split("T")[0]);
  const { push } = useToast();

  const loadSales = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<any[]>("/sales");
      const rawSales = Array.isArray(res.data) ? res.data : [];
      // Map backend data to frontend format
      const mappedSales = rawSales.map(s => ({
        id: s.id,
        product_id: s.product_id,
        product_name: s.products?.name || "Unknown Product",
        quantity: s.quantity,
        unit_price: s.price,
        total: s.total,
        created_at: s.created_at
      }));
      setSales(mappedSales);
      setLastUpdated(new Date());
    } catch {
      setSales([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadSales();
  }, [loadSales]);

  const searchProducts = React.useCallback(async (search: string) => {
    if (search.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await api.get<{ data: Product[] }>("/products", {
        params: { q: search, limit: 20 }
      });
      setSearchResults(res.data.data || []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      searchProducts(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch, searchProducts]);

  const addToCart = () => {
    if (!selectedProduct) return;
    
    const unitPrice = customPrice ? Number(customPrice) : selectedProduct.price;
    const qty = Number(quantity);
    
    if (qty <= 0) {
      push("Quantity must be greater than 0", "error");
      return;
    }

    const existingIndex = cartItems.findIndex(item => item.product_id === selectedProduct.id);
    
    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].quantity += qty;
      updated[existingIndex].total = updated[existingIndex].quantity * updated[existingIndex].unit_price;
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, {
        id: Date.now().toString(),
        product_id: selectedProduct.id,
        product_name: selectedProduct.name,
        quantity: qty,
        unit_price: unitPrice,
        total: qty * unitPrice
      }]);
    }
    
    setSelectedProduct(null);
    setQuantity("1");
    setCustomPrice("");
    setProductSearch("");
    setSearchResults([]);
  };

  const removeFromCart = (id: string) => {
    setCartItems(cartItems.filter(item => item.id !== id));
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + item.total, 0);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const completeSale = async () => {
    if (cartItems.length === 0) {
      push("Add items to cart first", "error");
      return;
    }

    setSaving(true);
    try {
      for (const item of cartItems) {
        await api.post("/sales", {
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.unit_price
        });
      }
      push(`Sale completed! ${cartCount} items for GHS ${cartTotal.toLocaleString()}`, "success");
      setCartItems([]);
      setOpen(false);
      loadSales();
    } catch (err: any) {
      push(err.response?.data?.error || "Failed to record sale", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredSales = sales.filter((s) =>
    s.product_name?.toLowerCase().includes(query.toLowerCase())
  );

  const salesByDate = React.useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>();
    filteredSales.forEach((s) => {
      const date = s.created_at ? new Date(s.created_at).toISOString().split("T")[0] : "";
      if (!date) return;
      const existing = grouped.get(date) || { total: 0, count: 0 };
      grouped.set(date, {
        total: existing.total + s.total,
        count: existing.count + 1
      });
    });
    return Array.from(grouped.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [filteredSales]);

  const dateSales = React.useMemo(() => {
    return filteredSales.filter(s => 
      s.created_at ? new Date(s.created_at).toISOString().split("T")[0] === selectedDate : false
    );
  }, [filteredSales, selectedDate]);

  const dateTotal = dateSales.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Sales"
        subtitle="Record sales and track revenue."
        meta={<>{filteredSales.length} sales recorded</>}
        actions={
          <button 
            className="btn-primary h-10 gap-2 px-4"
            onClick={() => setOpen(true)}
          >
            <ShoppingCart className="h-4 w-4" />
            New Sale
          </button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-4">
          <div className="mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span className="font-semibold">Sales by Date</span>
          </div>
          {loading ? (
            <PageLoading text="Loading..." />
          ) : salesByDate.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sales recorded yet
            </p>
          ) : (
            <div className="max-h-64 space-y-2 overflow-y-auto">
              {salesByDate.map((day) => (
                <div
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors ${
                    selectedDate === day.date
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="font-medium">{day.date}</div>
                    <div className="text-xs text-muted-foreground">{day.count} sale{day.count !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">GHS {day.total.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="mb-4 flex items-center justify-between">
            <span className="font-semibold">Sales on {selectedDate}</span>
          </div>
          {dateSales.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No sales on this date
            </p>
          ) : (
            <div className="space-y-2">
              {dateSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div>
                    <div className="font-medium">{sale.product_name}</div>
                    <div className="text-xs text-muted-foreground">Qty: {sale.quantity}</div>
                  </div>
                  <div className="text-right font-semibold">
                    GHS {sale.total.toLocaleString()}
                  </div>
                </div>
              ))}
              <div className="border-t pt-2 mt-2 flex items-center justify-between font-bold">
                <span>Total</span>
                <span className="text-lg">GHS {dateTotal.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card p-4">
        <div className="mb-4 flex items-center justify-between">
          <span className="font-semibold">All Sales</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search sales..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        
        {filteredSales.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No sales found"
              description="Record your first sale to get started."
              action={
                <button className="btn-primary h-10" onClick={() => setOpen(true)}>
                  Record Sale
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            {filteredSales.slice(0, 50).map((sale) => (
              <div key={sale.id} className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium">{sale.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {sale.created_at ? new Date(sale.created_at).toLocaleDateString() : ""} · Qty: {sale.quantity}
                    </div>
                  </div>
                </div>
                <div className="text-right font-semibold">
                  GHS {sale.total.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setCartItems([]); }} title="New Sale">
        <div className="space-y-4">
          <div className="relative">
            <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                className="w-full bg-transparent outline-none"
                placeholder="Search products..."
                value={productSearch}
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setSelectedProduct(null);
                }}
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
            
            {searchResults.length > 0 && !selectedProduct && (
              <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-border bg-background shadow-lg">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => {
                      setSelectedProduct(product);
                      setProductSearch(product.name);
                      setCustomPrice(product.price ? String(product.price) : "");
                      setSearchResults([]);
                    }}
                    className="cursor-pointer border-b border-border/50 p-3 hover:bg-muted/50 last:border-0"
                  >
                    <div className="font-medium">{product.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {product.brands?.name} · {product.categories?.name}
                      <span className="font-semibold text-foreground">
                        GHS {product.price?.toLocaleString() || 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedProduct && (
            <div className="rounded-lg border border-primary/50 bg-primary/5 p-3">
              <div className="font-medium">{selectedProduct.name}</div>
              <div className="text-xs text-muted-foreground">
                {selectedProduct.brands?.name} · {selectedProduct.categories?.name}
              </div>
              <div className="mt-1 text-sm font-semibold text-primary">
                GHS {selectedProduct.price?.toLocaleString() || 0}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Quantity</label>
              <input
                type="number"
                min="1"
                className="form-input w-full"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Unit Price (GHS)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="form-input w-full"
                placeholder={selectedProduct?.price ? String(selectedProduct.price) : "0.00"}
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value)}
              />
            </div>
          </div>

          <button
            onClick={addToCart}
            disabled={!selectedProduct}
            className="btn-outline w-full"
          >
            Add to Sale
          </button>

          {cartItems.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <div className="font-semibold">Cart ({cartCount} items)</div>
              {cartItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-lg border border-border/50 p-2">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{item.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {item.quantity} × GHS {item.unit_price}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">GHS {item.total.toLocaleString()}</span>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span className="text-lg">GHS {cartTotal.toLocaleString()}</span>
              </div>
              <button
                onClick={completeSale}
                disabled={saving}
                className="btn-primary w-full"
              >
                {saving ? "Processing..." : `Complete Sale - GHS ${cartTotal.toLocaleString()}`}
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};
