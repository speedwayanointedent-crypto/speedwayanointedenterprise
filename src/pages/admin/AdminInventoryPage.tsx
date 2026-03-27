import React from "react";
import { Search, Edit3, Loader2, ChevronLeft, ChevronRight, Filter } from "lucide-react";
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

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );

  const lowStock = items.filter((item) => item.quantity <= 5 && item.quantity > 0).length;
  const outOfStock = items.filter((item) => item.quantity === 0).length;

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Inventory"
        subtitle="Manage product stock levels."
        meta={<>{totalProducts} products</>}
      />

      {(outOfStock > 0 || lowStock > 0) && (
        <div className="flex gap-4">
          {outOfStock > 0 && (
            <div className="card border-red-200 bg-red-50 px-4 py-2">
              <span className="text-sm font-medium text-red-700">Out of stock: {outOfStock}</span>
            </div>
          )}
          {lowStock > 0 && (
            <div className="card border-yellow-200 bg-yellow-50 px-4 py-2">
              <span className="text-sm font-medium text-yellow-700">Low stock: {lowStock}</span>
            </div>
          )}
        </div>
      )}

      <div className="card p-4">
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search products..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`btn-outline h-10 gap-2 ${showFilters ? "bg-primary/10" : ""}`}
          >
            <Filter className="h-4 w-4" />
            Filters
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 p-4">
            <select
              className="form-input w-48"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <select
              className="form-input w-48"
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
            <button onClick={clearFilters} className="btn-outline h-10 text-sm">
              Clear
            </button>
          </div>
        )}

        {loading ? (
          <PageLoading text="Loading inventory..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No products found"
            description={query || filterCategory || filterBrand ? "Try adjusting your filters." : "Add products to your inventory."}
          />
        ) : (
          <>
            <div className="mt-6 overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th className="text-center">Quantity</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <img
                          src={item.image_url || fallbackImage}
                          alt={item.name}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      </td>
                      <td className="font-medium max-w-xs truncate">{item.name}</td>
                      <td>{item.categories?.name || "—"}</td>
                      <td>{item.brands?.name || "—"}</td>
                      <td className="text-center">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          item.quantity === 0
                            ? "bg-red-100 text-red-700"
                            : item.quantity <= 5
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => openEdit(item)}
                          className="btn-outline h-8 gap-1 px-3 text-xs"
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

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {((page - 1) * PRODUCTS_PER_PAGE) + 1} - {Math.min(page * PRODUCTS_PER_PAGE, totalProducts)} of {totalProducts}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="btn-outline h-9 gap-1 px-3 disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
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
                          className={`h-9 w-9 rounded-md text-sm ${
                            page === pageNum
                              ? "bg-primary text-white"
                              : "btn-outline"
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
                    className="btn-outline h-9 gap-1 px-3 disabled:opacity-50"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit Quantity">
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <div className="text-sm font-medium">{editing?.name}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              {editing?.categories?.name} · {editing?.brands?.name}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Quantity</label>
            <input
              type="number"
              min="0"
              className="form-input w-full"
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              autoFocus
            />
          </div>
          <button
            onClick={saveEdit}
            disabled={saving}
            className="btn-primary w-full"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
          </button>
        </div>
      </Modal>
    </div>
  );
};
