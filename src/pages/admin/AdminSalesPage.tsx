import React from "react";
import { Plus, Search, Filter } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Sale = {
  id: number;
  total: number;
  quantity: number;
  created_at: string;
  products?: { name: string };
};

type Product = { id: string; name: string };

export const AdminSalesPage: React.FC = () => {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [productId, setProductId] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get<Sale[]>("/sales"),
        api.get<Product[]>("/products")
      ]);
      setSales(salesRes.data);
      setProducts(productsRes.data);
      setLastUpdated(new Date());
    } catch {
      setSales([]);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/sales", {
        product_id: productId,
        quantity: Number(quantity),
        price: Number(price)
      });
      push("Sale recorded", "success");
      setProductId("");
      setQuantity("");
      setPrice("");
      setOpen(false);
      load();
    } catch {
      push("Failed to record sale", "error");
    }
  };

  const filtered = sales.filter((s) =>
    (s.products?.name || "")
      .toLowerCase()
      .includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Sales"
        subtitle="Track in-store transactions and revenue."
        meta={
          <>
            {sales.length} records
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record sale
          </button>
        }
      />

      <div className="card p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Search className="h-4 w-4" />
            <input
              className="w-full bg-transparent outline-none"
              placeholder="Search sales..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-xs">Keyword filter</span>
          </div>
        </div>
        {query ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full border border-border bg-background px-2.5 py-1">
              Search: {query}
            </span>
          </div>
        ) : null}

        {loading ? (
          <Skeleton className="mt-6 h-40" />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No sales found"
              description="Record a sale to see revenue appear here."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Record sale
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Product</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id}>
                    <td>{s.products?.name || "—"}</td>
                    <td className="text-right">{s.quantity}</td>
                    <td className="text-right font-semibold">
                      GHS {s.total.toLocaleString()}
                    </td>
                    <td className="text-right text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Record sale">
        <form onSubmit={onCreate} className="space-y-4">
          <select
            required
            className="form-input"
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
          >
            <option value="">Select product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              type="number"
              className="form-input"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
            <input
              required
              type="number"
              step="0.01"
              className="form-input"
              placeholder="Unit price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <button className="btn-primary h-11 w-full">Save sale</button>
        </form>
      </Modal>
    </div>
  );
};
