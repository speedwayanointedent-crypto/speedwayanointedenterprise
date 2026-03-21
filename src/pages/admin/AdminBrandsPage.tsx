import React from "react";
import { Plus, Search, Layers, Pencil, Trash2, X } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Brand = { id: string; name: string; years: string[] };

export const AdminBrandsPage: React.FC = () => {
  const [items, setItems] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Brand | null>(null);
  const [name, setName] = React.useState("");
  const [years, setYears] = React.useState<string[]>([]);
  const [newYear, setNewYear] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Brand[]>("/brands");
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

  const addYear = () => {
    if (newYear && !years.includes(newYear)) {
      setYears([...years, newYear].sort());
      setNewYear("");
    }
  };

  const removeYear = (year: string) => {
    setYears(years.filter(y => y !== year));
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/brands", { name, years });
      push("Brand created", "success");
      setName("");
      setYears([]);
      setOpen(false);
      load();
    } catch {
      push("Failed to create brand", "error");
    }
  };

  const onOpenEdit = (brand: Brand) => {
    setEditing(brand);
    setName(brand.name);
    setYears(brand.years || []);
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      await api.put(`/brands/${editing.id}`, { name, years });
      push("Brand updated", "success");
      setEditOpen(false);
      setEditing(null);
      setName("");
      setYears([]);
      load();
    } catch {
      push("Failed to update brand", "error");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this brand? This may affect products using this brand.");
    if (!confirmed) return;
    try {
      await api.delete(`/brands/${id}`);
      push("Brand deleted", "success");
      load();
    } catch {
      push("Failed to delete brand", "error");
    }
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Brands"
        subtitle="Maintain supplier and manufacturer brand lists with their vehicle years."
        meta={
          <>
            {items.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add brand
          </button>
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search brands..."
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
              title="No brands found"
              description="Try adjusting your search or add a new brand."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Add brand
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((c) => (
              <div key={c.id} className="card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.years?.length ? `${c.years.length} years` : 'No years set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="btn-outline h-9 w-9 p-0"
                      onClick={() => onOpenEdit(c)}
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      className="btn-destructive h-9 w-9 p-0"
                      onClick={() => onDelete(c.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {c.years?.length ? (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {c.years.slice(0, 6).map((y) => (
                      <span key={y} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {y}
                      </span>
                    ))}
                    {c.years.length > 6 && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        +{c.years.length - 6}
                      </span>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); setName(""); setYears([]); }} title="Add brand">
        <form onSubmit={onCreate} className="space-y-4">
          <input
            required
            className="form-input"
            placeholder="Brand name (e.g., Toyota)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Vehicle Years</label>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="Enter year (e.g., 2024)"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addYear())}
              />
              <button
                type="button"
                className="btn-outline h-10"
                onClick={addYear}
              >
                Add
              </button>
            </div>
            {years.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <span
                    key={y}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm text-primary"
                  >
                    {y}
                    <button
                      type="button"
                      onClick={() => removeYear(y)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add years for vehicles this brand supports. Products will auto-filter by brand years.
            </p>
          </div>
          <button className="btn-primary h-11 w-full">Create</button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); setName(""); setYears([]); }} title="Edit brand">
        <form onSubmit={onUpdate} className="space-y-4">
          <input
            required
            className="form-input"
            placeholder="Brand name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Vehicle Years</label>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="Enter year (e.g., 2024)"
                value={newYear}
                onChange={(e) => setNewYear(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addYear())}
              />
              <button
                type="button"
                className="btn-outline h-10"
                onClick={addYear}
              >
                Add
              </button>
            </div>
            {years.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <span
                    key={y}
                    className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-1 text-sm text-primary"
                  >
                    {y}
                    <button
                      type="button"
                      onClick={() => removeYear(y)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add years for vehicles this brand supports.
            </p>
          </div>
          <button className="btn-primary h-11 w-full">Save changes</button>
        </form>
      </Modal>
    </div>
  );
};
