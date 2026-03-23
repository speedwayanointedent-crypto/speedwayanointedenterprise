import React from "react";
import { Plus, Search, Filter, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";

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
  const getLocalDateKey = (value: string | Date) => {
    const date = typeof value === "string" ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };
  const [selectedDay, setSelectedDay] = React.useState(
    getLocalDateKey(new Date())
  );
  const [rangeStart, setRangeStart] = React.useState("");
  const [rangeEnd, setRangeEnd] = React.useState("");
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, productsRes] = await Promise.all([
        api.get<Sale[]>("/sales"),
        api.get<Product[]>("/products")
      ]);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : []);
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
  const dailyTotals = React.useMemo(() => {
    const totals = new Map<string, { total: number; quantity: number }>();
    sales.forEach((s) => {
      const key = getLocalDateKey(s.created_at);
      if (!key) {
        return;
      }
      const current = totals.get(key) || { total: 0, quantity: 0 };
      totals.set(key, {
        total: current.total + s.total,
        quantity: current.quantity + s.quantity
      });
    });
    return Array.from(totals.entries())
      .map(([date, value]) => ({ date, ...value }))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [sales]);
  const daySales = React.useMemo(
    () => sales.filter((s) => getLocalDateKey(s.created_at) === selectedDay),
    [sales, selectedDay]
  );
  const dayTotal = daySales.reduce((sum, s) => sum + s.total, 0);
  const rangeValid =
    Boolean(rangeStart && rangeEnd) && rangeStart <= rangeEnd;
  const rangeSales = React.useMemo(() => {
    if (!rangeValid) {
      return [];
    }
    return sales.filter((s) => {
      const key = getLocalDateKey(s.created_at);
      return key && key >= rangeStart && key <= rangeEnd;
    });
  }, [sales, rangeStart, rangeEnd, rangeValid]);
  const rangeTotal = rangeSales.reduce((sum, s) => sum + s.total, 0);

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

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-foreground">
                Total Sales Per Day
              </div>
              <div className="text-xs text-muted-foreground">
                Daily revenue totals across all recorded sales.
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {dailyTotals.length} days
            </div>
          </div>
          {loading ? (
            <PageLoading text="Loading sales data..." />
          ) : dailyTotals.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No sales yet. Record a sale to start tracking daily totals.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="table text-sm">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyTotals.map((day) => (
                    <tr key={day.date}>
                      <td className="font-medium">{day.date}</td>
                      <td className="text-right">{day.quantity}</td>
                      <td className="text-right font-semibold">
                        GHS {day.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="text-sm font-semibold text-foreground">
            Daily Total Lookup
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            Choose a day to see its total sales.
          </div>
          <input
            type="date"
            className="form-input mt-4"
            value={selectedDay}
            onChange={(e) => setSelectedDay(e.target.value)}
          />
          <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
            <div className="text-xs text-muted-foreground">Total for day</div>
            <div className="mt-1 text-lg font-semibold">
              GHS {dayTotal.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {daySales.length} sale{daySales.length === 1 ? "" : "s"} recorded
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-foreground">
              Extended Period Analysis
            </div>
            <div className="text-xs text-muted-foreground">
              Select a start and end date to see everything sold in that range.
            </div>
          </div>
          {rangeValid ? (
            <div className="text-xs text-muted-foreground">
              {rangeSales.length} sale{rangeSales.length === 1 ? "" : "s"} · GHS{" "}
              {rangeTotal.toLocaleString()}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">
              Choose both dates to calculate totals.
            </div>
          )}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input
            type="date"
            className="form-input"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
          />
          <input
            type="date"
            className="form-input"
            value={rangeEnd}
            onChange={(e) => setRangeEnd(e.target.value)}
          />
          <button
            type="button"
            className="btn-outline h-11"
            onClick={() => {
              setRangeStart("");
              setRangeEnd("");
            }}
          >
            Clear range
          </button>
        </div>
        {rangeValid ? (
          rangeSales.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">
              No sales found in this period.
            </p>
          ) : (
            <div className="mt-4 overflow-x-auto">
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
                  {rangeSales.map((s) => (
                    <tr key={`range-${s.id}`}>
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
          )
        ) : null}
      </div>

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
          <PageLoading text="Loading sales..." />
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
