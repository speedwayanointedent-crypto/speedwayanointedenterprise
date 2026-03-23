import React from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { AlertTriangle, DollarSign, Package, TrendingUp, Users } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { PageHeader } from "../../components/ui/PageHeader";

type Summary = {
  revenue: number;
  itemsSold: number;
};

type SummaryResponse = {
  today: Summary;
  week: Summary;
  month: Summary;
  year: Summary;
};

type Product = {
  id: string;
  name: string;
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  status: string;
  created_at: string;
};

type Sale = {
  id: number;
  total: number;
  quantity: number;
  created_at: string;
  products?: { name: string };
};

type ActivityItem = {
  label: string;
  created_at: string;
};

const buildRevenueSeries = (orders: Order[], sales: Sale[]) => {
  const now = new Date();
  const months: { key: string; label: string }[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const label = date.toLocaleString("default", { month: "short" });
    months.push({ key, label });
  }

  const bucket: Record<string, number> = {};
  months.forEach((m) => {
    bucket[m.key] = 0;
  });

  orders
    .filter((o) => o.status === "completed")
    .forEach((o) => {
      const date = new Date(o.created_at);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (bucket[key] !== undefined) {
        bucket[key] += Number(o.total || 0);
      }
    });

  sales.forEach((s) => {
    const date = new Date(s.created_at);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    if (bucket[key] !== undefined) {
      bucket[key] += Number(s.total || 0);
    }
  });

  return months.map((m) => ({ name: m.label, revenue: bucket[m.key] }));
};

export const AdminDashboardPage: React.FC = () => {
  const [summary, setSummary] = React.useState<SummaryResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [lowStock, setLowStock] = React.useState<Product[]>([]);
  const [recentActivity, setRecentActivity] = React.useState<ActivityItem[]>([]);
  const [revenueData, setRevenueData] = React.useState<{ name: string; revenue: number }[]>([]);
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);

  const load = React.useCallback(async () => {
    try {
      const [summaryRes, productsRes, ordersRes, salesRes] = await Promise.all([
        api.get<SummaryResponse>("/reports/summary"),
        api.get<Product[]>("/products"),
        api.get<Order[]>("/orders"),
        api.get<Sale[]>("/sales")
      ]);

      setSummary(summaryRes.data);
      const products = Array.isArray(productsRes.data) ? productsRes.data : [];
      const orders = Array.isArray(ordersRes.data) ? ordersRes.data : [];
      const sales = Array.isArray(salesRes.data) ? salesRes.data : [];
      
      const low = products.filter((p) => p.quantity <= 5).slice(0, 4);
      setLowStock(low);

      const activity: ActivityItem[] = [];
      orders.forEach((o) => {
        activity.push({
          label: `Order #${o.id.toString().padStart(4, "0")} • ${o.status} • GHS ${o.total}`,
          created_at: o.created_at
        });
      });
      sales.forEach((s) => {
        activity.push({
          label: `Sale • ${s.products?.name || "Product"} • GHS ${s.total}`,
          created_at: s.created_at
        });
      });
      activity.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentActivity(activity.slice(0, 6));

      setRevenueData(buildRevenueSeries(orders, sales));
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
    const interval = window.setInterval(load, 20000);
    return () => window.clearInterval(interval);
  }, [load]);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  const kpiCards = [
    {
      title: "Today Revenue",
      value: summary ? `GHS ${summary.today.revenue.toLocaleString()}` : "GHS 0",
      meta: summary ? `${summary.today.itemsSold} items` : "0 items",
      icon: DollarSign
    },
    {
      title: "Weekly Revenue",
      value: summary ? `GHS ${summary.week.revenue.toLocaleString()}` : "GHS 0",
      meta: summary ? `${summary.week.itemsSold} items` : "0 items",
      icon: Package
    },
    {
      title: "Monthly Revenue",
      value: summary ? `GHS ${summary.month.revenue.toLocaleString()}` : "GHS 0",
      meta: summary ? `${summary.month.itemsSold} items` : "0 items",
      icon: TrendingUp
    },
    {
      title: "Yearly Revenue",
      value: summary ? `GHS ${summary.year.revenue.toLocaleString()}` : "GHS 0",
      meta: summary ? `${summary.year.itemsSold} items` : "0 items",
      icon: Users
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        subtitle="A quick overview of store performance."
        meta={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : undefined}
        actions={
          <>
            <button className="btn-secondary">Last 30 days</button>
            <button className="btn-primary">Export report</button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.title} className="card p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">{card.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {card.title}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {card.meta}
                </div>
              </div>
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <card.icon className="h-5 w-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold">Revenue overview</h2>
            <span className="text-xs text-muted-foreground">Last 6 months</span>
          </div>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `GHS ${value}`}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem"
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="text-base font-semibold">Low stock alerts</h2>
          <div className="mt-4 space-y-3">
            {lowStock.length === 0 ? (
              <div className="text-sm text-muted-foreground">No low stock items.</div>
            ) : (
              lowStock.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {item.quantity}
                    </div>
                  </div>
                  <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                    Low
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-4">
        <h2 className="text-base font-semibold">Recent activity</h2>
        <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
          {recentActivity.length === 0 ? (
            <li>No recent activity.</li>
          ) : (
            recentActivity.map((item, idx) => (
              <li key={`${item.label}-${idx}`} className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <span>{item.label}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
};
