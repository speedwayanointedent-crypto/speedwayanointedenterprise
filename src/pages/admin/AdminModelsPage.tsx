import React from "react";
import { Plus, Search, Truck } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Model = { id: string; name: string };

export const AdminModelsPage: React.FC = () => {
  const [items, setItems] = React.useState<Model[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Model[]>("/models");
      setItems(res.data);
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

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/models", { name });
      push("Model created", "success");
      setName("");
      setOpen(false);
      load();
    } catch {
      push("Failed to create model", "error");
    }
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Vehicle models"
        subtitle="Maintain fitment models and trim variations."
        meta={
          <>
            {items.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add model
          </button>
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search models..."
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
          <Skeleton className="mt-6 h-32" />
        ) : filtered.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="No models found"
              description="Try adjusting your search or add a new model."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Add model
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Truck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">Fitment ready</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add model">
        <form onSubmit={onCreate} className="space-y-4">
          <input
            required
            className="form-input"
            placeholder="Model name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <button className="btn-primary h-11 w-full">Create</button>
        </form>
      </Modal>
    </div>
  );
};
