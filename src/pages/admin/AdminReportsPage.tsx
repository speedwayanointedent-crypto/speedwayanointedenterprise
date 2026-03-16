import React from "react";
import { Calendar, Download } from "lucide-react";
import api from "../../lib/api";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { StickyActionBar } from "../../components/ui/StickyActionBar";

type RangeResult = { revenue: number; itemsSold: number };

export const AdminReportsPage: React.FC = () => {
  const [from, setFrom] = React.useState("");
  const [to, setTo] = React.useState("");
  const [result, setResult] = React.useState<RangeResult | null>(null);
  const { push } = useToast();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<RangeResult>("/reports/range", {
        from: new Date(from).toISOString(),
        to: new Date(to).toISOString()
      });
      setResult(res.data);
    } catch {
      push("Failed to load report. Check dates and backend.", "error");
    }
  };

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Reports"
        subtitle="Generate custom revenue and volume analytics by date range."
      />

      <form onSubmit={onSubmit} className="card p-4">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              required
              className="w-full bg-transparent outline-none"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <input
              type="date"
              required
              className="w-full bg-transparent outline-none"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
        </div>
        <StickyActionBar className="mt-4">
          <button className="btn-primary h-10 text-sm">Run report</button>
        </StickyActionBar>
      </form>

      {!result ? (
        <EmptyState
          title="Run a report"
          description="Pick a date range to generate revenue and item totals."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="card p-5">
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              GHS {result.revenue.toLocaleString()}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-muted-foreground">Items sold</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">
              {result.itemsSold}
            </p>
          </div>
          <div className="card p-5">
            <p className="text-xs text-muted-foreground">Export report</p>
            <button className="btn-outline mt-3 h-9 text-xs">
              <Download className="mr-2 h-4 w-4" />
              Download CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
