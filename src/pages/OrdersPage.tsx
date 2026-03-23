import React from "react";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { Link } from "react-router-dom";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";
import { PageLoading } from "../components/ui/LoadingSpinner";

type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
  estimated_delivery_date?: string | null;
  order_status_events?: { id: number; status: string; note?: string | null; created_at: string }[];
};

const statusStyles: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200",
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200",
  cancelled: "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-200",
  processing: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200"
};

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function load() {
      try {
        const res = await api.get<Order[]>("/orders/my");
        setOrders(res.data);
      } catch {
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="page-shell">
      <PublicNavbar />
      <div className="mx-auto max-w-5xl px-4 pb-16 pt-16 sm:pt-20 md:px-6">
        <PageHeader
          title="My orders"
          subtitle="Track your recent purchases and delivery status."
          size="lg"
        />

        <div className="mt-6 card p-4">
          {loading ? (
            <PageLoading text="Loading orders..." />
          ) : orders.length === 0 ? (
            <EmptyState
              title="No orders yet"
              description="When you place an order, it will show up here with tracking details."
            />
          ) : (
            <>
              <div className="space-y-3 sm:hidden">
                {orders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold text-foreground">
                        Order #{o.id.toString().padStart(4, "0")}
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[o.status] || "bg-muted text-muted-foreground"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString()}
                    </div>
                    {o.estimated_delivery_date ? (
                      <div className="mt-1 text-xs text-muted-foreground">
                        ETA: {new Date(o.estimated_delivery_date).toLocaleDateString()}
                      </div>
                    ) : null}
                    <div className="mt-2 text-sm font-semibold text-foreground">
                      GHS {o.total.toLocaleString()}
                    </div>
                    <Link
                      to={`/invoice/${o.id}`}
                      className="mt-3 inline-flex text-xs text-primary hover:underline"
                    >
                      Download receipt
                    </Link>
                    {o.order_status_events?.length ? (
                      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                        {o.order_status_events
                          .slice()
                          .sort(
                            (a, b) =>
                              new Date(b.created_at).getTime() -
                              new Date(a.created_at).getTime()
                          )
                          .slice(0, 3)
                          .map((ev) => (
                            <div key={ev.id}>
                              {ev.status} • {new Date(ev.created_at).toLocaleString()}
                            </div>
                          ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto sm:block">
                <table className="table text-sm">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Date</th>
                      <th className="text-right">Total</th>
                      <th className="text-right">Status</th>
                      <th className="text-right">ETA</th>
                      <th className="text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id}>
                        <td className="font-semibold text-foreground">
                          #{o.id.toString().padStart(4, "0")}
                        </td>
                        <td className="text-muted-foreground">
                          {new Date(o.created_at).toLocaleDateString()}
                        </td>
                        <td className="text-right font-semibold text-foreground">
                          GHS {o.total.toLocaleString()}
                        </td>
                        <td className="text-right">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[o.status] || "bg-muted text-muted-foreground"
                            }`}
                          >
                            {o.status}
                          </span>
                        </td>
                        <td className="text-right text-xs text-muted-foreground">
                          {o.estimated_delivery_date
                            ? new Date(o.estimated_delivery_date).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="text-right">
                          <Link
                            to={`/invoice/${o.id}`}
                            className="text-xs text-primary hover:underline"
                          >
                            Receipt
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      <PublicFooterCTA />
    </div>
  );
};

