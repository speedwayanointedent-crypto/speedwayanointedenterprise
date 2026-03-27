import React from "react";
import { Search, Loader2, Check, X } from "lucide-react";
import api from "../../lib/api";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";

type Product = {
  id: string;
  name: string;
  quantity: number;
  status?: string;
  image_url?: string | null;
  categories?: { name: string };
  brands?: { name: string };
};

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=600&auto=format&fit=crop";

export const AdminInventoryPage: React.FC = () => {
  const [items, setItems] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editValue, setEditValue] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<{ data: Product[] }>("/products?limit=1000");
      setItems(res.data.data || []);
      setLastUpdated(new Date());
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );
  const lowStock = items.filter((item) => item.quantity <= 5 && item.quantity > 0);
  const outOfStock = items.filter((item) => item.quantity === 0);

  const startEdit = (item: Product) => {
    setEditingId(item.id);
    setEditValue(String(item.quantity));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await api.put(`/products/${id}`, {
        quantity: Number(editValue)
      });
      setItems(items.map(item =>
        item.id === id ? { ...item, quantity: Number(editValue) } : item
      ));
      setEditingId(null);
      setEditValue("");
    } catch {
      console.error("Failed to update quantity");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter") {
      saveEdit(id);
    } else if (e.key === "Escape") {
      cancelEdit();
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Inventory"
        subtitle="View and manage product stock levels."
        meta={
          <>
            {items.length} items
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
      />

      {outOfStock.length > 0 && (
        <div className="card border-red-200 bg-red-50 p-4">
          <div className="text-sm font-semibold text-red-700">
            Out of stock: {outOfStock.length} items
          </div>
          <div className="mt-2 text-xs text-red-600">
            Consider restocking these items.
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="card border-yellow-200 bg-yellow-50 p-4">
          <div className="text-sm font-semibold text-yellow-700">
            Low stock: {lowStock.length} items
          </div>
          <div className="mt-2 text-xs text-yellow-600">
            These items have 5 or fewer units remaining.
          </div>
        </div>
      )}

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search inventory..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        {query ? (
          <div className="mt-3 text-xs text-muted-foreground">
            Showing {filtered.length} results for "{query}"
          </div>
        ) : null}

        {loading ? (
          <PageLoading text="Loading inventory..." />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No products found"
              description="Try adjusting your search."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th className="text-center">Quantity</th>
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
                      {editingId === item.id ? (
                        <div className="flex items-center justify-center gap-2">
                          <input
                            type="number"
                            min="0"
                            className="w-20 rounded border border-border bg-background px-2 py-1 text-center text-foreground outline-none"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, item.id)}
                            autoFocus
                          />
                          <button
                            onClick={() => saveEdit(item.id)}
                            disabled={saving}
                            className="flex h-7 w-7 items-center justify-center rounded bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex h-7 w-7 items-center justify-center rounded bg-gray-500 text-white hover:bg-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className={`min-w-[60px] rounded px-3 py-1 text-center font-medium transition-colors ${
                            item.quantity === 0
                              ? "bg-red-100 text-red-700 hover:bg-red-200"
                              : item.quantity <= 5
                              ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                              : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {item.quantity}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
