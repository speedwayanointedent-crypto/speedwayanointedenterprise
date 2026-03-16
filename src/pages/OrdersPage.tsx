import React from "react";
import api from "../lib/api";
import { Skeleton } from "../components/ui/Skeleton";
import { PublicNavbar } from "../components/layout/PublicNavbar";
import { PublicFooterCTA } from "../components/layout/PublicFooterCTA";
import { PageHeader } from "../components/ui/PageHeader";
import { EmptyState } from "../components/ui/EmptyState";

type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
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
            <Skeleton className="h-40" />
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
                    <div className="mt-2 text-sm font-semibold text-foreground">
                      GHS {o.total.toLocaleString()}
                    </div>
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

