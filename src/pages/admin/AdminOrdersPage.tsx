import React from "react";
import { Eye, Search } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
  users?: { full_name: string; email: string };
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  completed: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  cancelled: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  processing: "bg-blue-500/15 text-blue-700 dark:text-blue-300"
};

export const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<Order | null>(null);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Order[]>("/orders");
      setOrders(res.data);
      setLastUpdated(new Date());
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      push("Order status updated", "success");
      load();
    } catch {
      push("Failed to update order", "error");
    }
  };

  const filtered = orders.filter((o) => {
    const target = `${o.id} ${o.users?.full_name || ""} ${
      o.users?.email || ""
    }`.toLowerCase();
    return target.includes(query.toLowerCase());
  });

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Orders"
        subtitle="Manage customer orders and fulfillment status."
        meta={
          <>
            {orders.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search order or customer..."
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
          <Skeleton className="mt-6 h-40" />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No orders found"
              description="Orders will appear here as customers checkout."
            />
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="table text-sm">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="text-right">Total</th>
                  <th className="text-right">Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <div className="font-medium">
                        #{o.id.toString().padStart(4, "0")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(o.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td>
                      <div>{o.users?.full_name || "—"}</div>
                      <div className="text-xs text-muted-foreground">
                        {o.users?.email}
                      </div>
                    </td>
                    <td className="text-right font-medium">
                      GHS {o.total.toLocaleString()}
                    </td>
                    <td className="text-right">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          statusStyles[o.status] ||
                          "bg-muted text-muted-foreground"
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-outline h-8 w-8 p-0"
                          onClick={() => {
                            setSelected(o);
                            setOpen(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <select
                          className="rounded-md border border-border bg-card px-2 py-1 text-xs"
                          value={o.status}
                          onChange={(e) => updateStatus(o.id, e.target.value)}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Order details">
        {selected ? (
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Order ID
              </p>
              <p className="text-base font-semibold">#{selected.id}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Customer
              </p>
              <p className="font-semibold">
                {selected.users?.full_name || "—"}
              </p>
              <p className="text-xs text-muted-foreground">
                {selected.users?.email}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Total
              </p>
              <p className="font-semibold">
                GHS {selected.total.toLocaleString()}
              </p>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
};
