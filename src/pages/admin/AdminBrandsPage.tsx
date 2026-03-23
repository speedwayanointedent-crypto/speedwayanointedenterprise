import React from "react";
import { Plus, Search, Layers, Pencil, Trash2, ImageIcon, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Brand = { id: string; name: string; logo_url?: string | null };

export const AdminBrandsPage: React.FC = () => {
  const [items, setItems] = React.useState<Brand[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Brand | null>(null);
  const [name, setName] = React.useState("");
  const [logoUrl, setLogoUrl] = React.useState("");
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null);
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

  const resetForm = () => {
    setName("");
    setLogoUrl("");
    setLogoPreview(null);
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/brands", { name, logo_url: logoUrl || null });
      push("Brand created", "success");
      resetForm();
      setOpen(false);
      load();
    } catch {
      push("Failed to create brand", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenEdit = (brand: Brand) => {
    setEditing(brand);
    setName(brand.name);
    setLogoUrl(brand.logo_url || "");
    setLogoPreview(brand.logo_url || null);
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSubmitting(true);
    try {
      await api.put(`/brands/${editing.id}`, { name, logo_url: logoUrl || null });
      push("Brand updated", "success");
      setEditOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch {
      push("Failed to update brand", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this brand? This may affect products using this brand.");
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await api.delete(`/brands/${id}`);
      push("Brand deleted", "success");
      load();
    } catch {
      push("Failed to delete brand", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogoUrlChange = (url: string) => {
    setLogoUrl(url);
    if (url) {
      setLogoPreview(url);
    } else {
      setLogoPreview(null);
    }
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Brands"
        subtitle="Maintain supplier and manufacturer brand lists."
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
              <div key={c.id} className="card card-hover overflow-hidden p-0">
                <div className="relative h-32 w-full bg-muted/30">
                  {c.logo_url ? (
                    <img src={c.logo_url} alt={c.name} className="h-full w-full object-contain p-4" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Layers className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{c.name}</p>
                        <p className="text-xs text-muted-foreground">OEM partner</p>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Add brand">
        <form onSubmit={onCreate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Brand name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Toyota, Honda, BMW"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Logo URL (optional)</label>
            <div className="space-y-3">
              <input
                className="form-input"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
              />
              {logoPreview && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                  <img src={logoPreview} alt="Preview" className="h-full w-full object-contain p-4" />
                  <button
                    type="button"
                    onClick={() => handleLogoUrlChange("")}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Paste a logo URL (transparent PNG works best).
              </p>
            </div>
          </div>
          <button className="btn-primary h-11 w-full" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="btn-spinner mr-2 h-4 w-4" />
                Creating...
              </span>
            ) : "Create"}
          </button>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); resetForm(); }} title="Edit brand">
        <form onSubmit={onUpdate} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Brand name</label>
            <input
              required
              className="form-input"
              placeholder="e.g., Toyota, Honda, BMW"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Logo URL (optional)</label>
            <div className="space-y-3">
              <input
                className="form-input"
                placeholder="https://example.com/logo.png"
                value={logoUrl}
                onChange={(e) => handleLogoUrlChange(e.target.value)}
              />
              {logoPreview && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-muted/30">
                  <img src={logoPreview} alt="Preview" className="h-full w-full object-contain p-4" />
                  <button
                    type="button"
                    onClick={() => handleLogoUrlChange("")}
                    className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
          <button className="btn-primary h-11 w-full" disabled={submitting}>
            {submitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="btn-spinner mr-2 h-4 w-4" />
                Saving...
              </span>
            ) : "Save changes"}
          </button>
        </form>
      </Modal>
    </div>
  );
};
