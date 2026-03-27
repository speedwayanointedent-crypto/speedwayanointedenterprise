import React from "react";
import { Search, Edit3, Loader2, ChevronLeft, ChevronRight, Filter, X } from "lucide-react";
import api from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { Modal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";

type Product = {
  id: string;
  name: string;
  quantity: number;
  status?: string;
  image_url?: string | null;
  categories?: { id: string; name: string };
  brands?: { id: string; name: string };
};

const PRODUCTS_PER_PAGE = 50;

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=600&auto=format&fit=crop";

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [editQuantity, setEditQuantity] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [totalProducts, setTotalProducts] = React.useState(0);
  const [filterCategory, setFilterCategory] = React.useState("");
  const [filterBrand, setFilterBrand] = React.useState("");
  const [categories, setCategories] = React.useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = React.useState<{ id: string; name: string }[]>([]);
  const [showFilters, setShowFilters] = React.useState(false);

  const totalPages = Math.ceil(totalProducts / PRODUCTS_PER_PAGE);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(PRODUCTS_PER_PAGE)
      };
      if (query) params.q = query;
      if (filterCategory) params.category_id = filterCategory;
      if (filterBrand) params.brand_id = filterBrand;

      const [invRes, catRes, brandRes] = await Promise.all([
        api.get<{ data: Product[]; pagination: { total: number } }>("/products", { params }),
        api.get<{ id: string; name: string }[]>("/categories"),
        api.get<{ id: string; name: string }[]>("/brands")
      ]);

      setItems(invRes.data.data || []);
      setTotalProducts(invRes.data.pagination?.total || 0);
      setCategories(catRes.data || []);
      setBrands(brandRes.data || []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, query, filterCategory, filterBrand]);

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    setPage(1);
  }, [query, filterCategory, filterBrand]);

  const openEdit = (item: Product) => {
    setEditing(item);
    setEditQuantity(String(item.quantity));
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/products/${editing.id}`, {
        quantity: Number(editQuantity)
      });
      setItems(items.map(item =>
        item.id === editing.id ? { ...item, quantity: Number(editQuantity) } : item
      ));
      setEditOpen(false);
      setEditing(null);
    } catch (err) {
      console.error("Failed to update:", err);
    } finally {
      setSaving(false);
    }
  };

  const clearFilters = () => {
    setQuery("");
    setFilterCategory("");
    setFilterBrand("");
    setPage(1);
  };

  const hasFilters = query || filterCategory || filterBrand;

  const lowStock = items.filter((item) => item.quantity <= 5 && item.quantity > 0).length;
  const outOfStock = items.filter((item) => item.quantity === 0).length;

  const startItem = (page - 1) * PRODUCTS_PER_PAGE + 1;
  const endItem = Math.min(page * PRODUCTS_PER_PAGE, totalProducts);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Inventory"
        subtitle="Manage product stock levels."
        meta={<>{totalProducts} products</>}
      />

      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex flex-wrap gap-4">
          {outOfStock > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-red-500"></span>
              <span className="text-sm font-medium text-red-700">Out of stock: {outOfStock}</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-2">
              <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
              <span className="text-sm font-medium text-yellow-700">Low stock: {lowStock}</span>
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
            <Search className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              showFilters || filterCategory || filterBrand
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            {(filterCategory || filterBrand) && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-white">
                {(filterCategory ? 1 : 0) + (filterBrand ? 1 : 0)}
              </span>
            )}
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <select
              className="min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="min-w-[180px] rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            {hasFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 hover:bg-red-100"
              >
                <X className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>
        )}

        {loading ? (
          <div className="py-12">
            <PageLoading text="Loading inventory..." />
          </div>
        ) : items.length === 0 ? (
          <div className="py-12">
            <EmptyState
              title="No products found"
              description={hasFilters ? "Try adjusting your filters." : "Add products to your inventory."}
            />
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">Product</th>
                    <th className="pb-3 font-medium text-muted-foreground">Category</th>
                    <th className="pb-3 font-medium text-muted-foreground">Brand</th>
                    <th className="pb-3 text-center font-medium text-muted-foreground">Quantity</th>
                    <th className="pb-3 text-right font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="flex items-center gap-3 py-3">
                        <img
                          src={item.image_url || fallbackImage}
                          alt={item.name}
                          className="h-10 w-10 flex-shrink-0 rounded-lg object-cover"
                        />
                        <span className="line-clamp-1 font-medium">{item.name}</span>
                      </td>
                      <td className="py-3 text-muted-foreground">{item.categories?.name || "—"}</td>
                      <td className="py-3 text-muted-foreground">{item.brands?.name || "—"}</td>
                      <td className="py-3 text-center">
                        <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${
                          item.quantity === 0
                            ? "bg-red-100 text-red-700"
                            : item.quantity <= 5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => openEdit(item)}
                          className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                        >
                          <Edit3 className="h-3 w-3" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
              <div className="text-sm text-muted-foreground">
                Showing <span className="font-medium text-foreground">{startItem}</span> to{" "}
                <span className="font-medium text-foreground">{endItem}</span> of{" "}
                <span className="font-medium text-foreground">{totalProducts}</span> products
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPage(pageNum)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium ${
                            page === pageNum
                              ? "bg-primary text-white"
                              : "border border-border bg-background hover:bg-muted"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="flex items-center gap-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Quantity">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="font-medium">{editing?.name}</div>
            <div className="mt-1 text-xs text-muted-foreground">
              {editing?.categories?.name} · {editing?.brands?.name}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min="0"
              className="w-full rounded-lg border border-border bg-background px-4 py-3 text-lg outline-none focus:border-primary"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              autoFocus
            />
          </div>
          <button
            onClick={saveEdit}
            disabled={saving}
            className="w-full rounded-lg bg-primary py-3 font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
};
