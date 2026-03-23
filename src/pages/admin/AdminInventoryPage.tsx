import React from "react";
import { Edit3, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
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
  const [adjustOpen, setAdjustOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Product | null>(null);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();
  const navigate = useNavigate();

  const [adjustDelta, setAdjustDelta] = React.useState("");
  const [adjustReason, setAdjustReason] = React.useState("restock");
  const [adjustNote, setAdjustNote] = React.useState("");

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.get<Product[]>("/products");
        setItems(Array.isArray(res.data) ? res.data : []);
        setLastUpdated(new Date());
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(query.toLowerCase())
  );
  const lowStock = items.filter((item) => item.quantity <= 5).slice(0, 5);

  const onAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    try {
      await api.post("/inventory/adjust", {
        product_id: selected.id,
        delta: Number(adjustDelta),
        reason: adjustReason,
        note: adjustNote || null
      });
      push("Inventory adjusted", "success");
      setAdjustOpen(false);
      setSelected(null);
      setAdjustDelta("");
      setAdjustReason("restock");
      setAdjustNote("");
      const res = await api.get<Product[]>("/products");
      setItems(res.data);
    } catch {
      push("Failed to update inventory", "error");
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Inventory"
        subtitle="Track stock levels and restock priorities."
        meta={
          <>
            {items.length} items
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary" onClick={() => navigate("/admin/products")}>
            Add item
          </button>
        }
      />

      {lowStock.length > 0 ? (
        <div className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Low stock alerts</div>
              <div className="text-xs text-muted-foreground">
                Reorder suggestions for fast-moving items.
              </div>
            </div>
            <span className="text-xs text-muted-foreground">
              {lowStock.length} items
            </span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {lowStock.map((item) => (
              <div key={item.id} className="rounded-xl border border-border p-3">
                <div className="text-sm font-semibold">{item.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  Stock: {item.quantity}
                </div>
                <button
                  className="btn-outline mt-3 h-8 text-xs"
                  onClick={() => {
                    setSelected(item);
                    setAdjustDelta("");
                    setAdjustReason("restock");
                    setAdjustNote("");
                    setAdjustOpen(true);
                  }}
                >
                  Create restock
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

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
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              Search: {query}
            </span>
          </div>
        ) : null}

        {loading ? (
          <PageLoading text="Loading inventory..." />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No inventory items found"
              description="Try adjusting your search or add new products to stock."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => navigate("/admin/products")}>
                  Add product
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Quantity</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th className="text-right">Actions</th>
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
                    <td className="font-medium">{item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{item.categories?.name || "—"}</td>
                    <td>{item.brands?.name || "—"}</td>
                    <td className="text-right">
                      <button
                        className="btn-outline h-8 px-3 text-xs"
                        onClick={() => {
                          setSelected(item);
                          setAdjustDelta("");
                          setAdjustReason("restock");
                          setAdjustNote("");
                          setAdjustOpen(true);
                        }}
                      >
                        <Edit3 className="mr-1 h-4 w-4" />
                        Adjust
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        open={adjustOpen}
        onClose={() => setAdjustOpen(false)}
        title="Adjust stock"
      >
        <form onSubmit={onAdjust} className="space-y-4">
          <input
            disabled
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground"
            value={selected?.name || ""}
          />
          <input
            required
            type="number"
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Adjustment (e.g. 5 or -3)"
            value={adjustDelta}
            onChange={(e) => setAdjustDelta(e.target.value)}
          />
          <select
            className="form-input"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          >
            <option value="restock">Restock</option>
            <option value="damage">Damaged stock</option>
            <option value="correction">Stock correction</option>
            <option value="transfer">Transfer</option>
          </select>
          <input
            className="form-input"
            placeholder="Note (optional)"
            value={adjustNote}
            onChange={(e) => setAdjustNote(e.target.value)}
          />
          <button className="btn-primary w-full">Update quantity</button>
        </form>
      </Modal>
    </div>
  );
};
