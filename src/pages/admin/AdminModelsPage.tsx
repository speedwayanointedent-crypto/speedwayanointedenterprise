import React from "react";
import { Plus, Search, Truck, Pencil, Trash2, X, ImageIcon, Loader2 } from "lucide-react";
import api from "../../lib/api";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { PageLoading } from "../../components/ui/LoadingSpinner";

type Model = { 
  id: string; 
  name: string; 
  brand_id?: string; 
  brands?: { name: string }; 
  years?: string[]; 
  image_url?: string | null; 
  gallery?: string[] 
};
type Brand = { id: string; name: string };

export const AdminModelsPage: React.FC = () => {
  const [items, setItems] = React.useState<Model[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Model | null>(null);
  const [name, setName] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [brands, setBrands] = React.useState<Brand[]>([]);
  const [submitting, setSubmitting] = React.useState(false);
  const { push } = useToast();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [modelsRes, brandsRes] = await Promise.all([
        api.get<Model[]>("/models"),
        api.get<Brand[]>("/brands")
      ]);
      setItems(modelsRes.data);
      setBrands(brandsRes.data);
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
    setBrandId("");
    setImageUrl("");
    setImagePreview(null);
    setGallery([]);
    setNewGalleryUrl("");
  };

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brandId) {
      push("Please select a brand", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/models", { 
        name, 
        brand_id: brandId, 
        years: [],
        image_url: imageUrl || null,
        gallery: gallery
      });
      push("Model created", "success");
      resetForm();
      setOpen(false);
      load();
    } catch {
      push("Failed to create model", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenEdit = (model: Model) => {
    setEditing(model);
    setName(model.name);
    setBrandId(model.brand_id || "");
    setImageUrl(model.image_url || "");
    setImagePreview(model.image_url || null);
    setGallery(model.gallery || []);
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    if (!brandId) {
      push("Please select a brand", "error");
      return;
    }
    setSubmitting(true);
    try {
      await api.put(`/models/${editing.id}`, { 
        name, 
        brand_id: brandId, 
        years: editing.years || [],
        image_url: imageUrl || null,
        gallery: gallery
      });
      push("Model updated", "success");
      setEditOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch {
      push("Failed to update model", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this model? This may affect products using this model.");
    if (!confirmed) return;
    setSubmitting(true);
    try {
      await api.delete(`/models/${id}`);
      push("Model deleted", "success");
      load();
    } catch {
      push("Failed to delete model", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    setImagePreview(url || null);
  };

  const addGalleryImage = () => {
    if (newGalleryUrl && !gallery.includes(newGalleryUrl)) {
      setGallery([...gallery, newGalleryUrl]);
      setNewGalleryUrl("");
    }
  };

  const removeGalleryImage = (url: string) => {
    setGallery(gallery.filter(g => g !== url));
  };

  const filtered = items.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const groupedModels = React.useMemo(() => {
    const groups: Record<string, Model[]> = {};
    filtered.forEach((model) => {
      const brandName = model.brands?.name || "Unknown";
      if (!groups[brandName]) groups[brandName] = [];
      groups[brandName].push(model);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Vehicle models"
        subtitle="Manage vehicle models and their images."
        meta={<>{items.length} total</>}
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

        {loading ? (
          <PageLoading text="Loading models..." />
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
          <div className="mt-6 space-y-8">
            {groupedModels.map(([brandName, models]) => (
              <div key={brandName}>
                <h3 className="mb-4 text-lg font-semibold text-foreground">{brandName}</h3>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {models.map((c) => (
                    <div key={c.id} className="card card-hover overflow-hidden p-0">
                      <div className="relative h-32 w-full bg-muted/30">
                        {c.image_url ? (
                          <img src={c.image_url} alt={c.name} className="h-full w-full object-cover" />
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
                              <Truck className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">{c.name}</p>
                              <p className="text-xs text-muted-foreground">{c.brands?.name || "No brand"}</p>
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
                        {c.gallery && c.gallery.length > 0 && (
                          <div className="mt-3 flex items-center gap-2">
                            <div className="flex -space-x-2">
                              {c.gallery.slice(0, 3).map((img, idx) => (
                                <img 
                                  key={idx} 
                                  src={img} 
                                  alt="" 
                                  className="h-8 w-8 rounded-lg border-2 border-card object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {c.gallery.length} gallery image{c.gallery.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {c.years?.length ? (
                          <div className="mt-3 flex flex-wrap gap-1">
                            {c.years.slice(0, 3).map((y) => (
                              <span key={y} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                                {y}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Model Modal */}
      <Modal open={open} onClose={() => { setOpen(false); resetForm(); }} title="Add model">
        <form onSubmit={onCreate} className="space-y-4">
          <select
            required
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            required
            className="form-input"
            placeholder="Model name (e.g., A1 2010)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium">Image URL</label>
            <input
              className="form-input"
              placeholder="https://example.com/model.jpg"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
            />
            {imagePreview && (
              <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleImageUrlChange("")}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            )}
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

      {/* Edit Model Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); setEditing(null); resetForm(); }} title="Edit model">
        <form onSubmit={onUpdate} className="space-y-4">
          <select
            required
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <input
            required
            className="form-input"
            placeholder="Model name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium">Image URL</label>
            <input
              className="form-input"
              placeholder="https://example.com/model.jpg"
              value={imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
            />
            {imagePreview && (
              <div className="mt-2 relative aspect-video w-full overflow-hidden rounded-lg border border-border">
                <img src={imagePreview} alt="Preview" className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleImageUrlChange("")}
                  className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
                >
                  ×
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Gallery Images</label>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="https://example.com/gallery1.jpg"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())}
              />
              <button
                type="button"
                className="btn-outline h-10 px-3"
                onClick={addGalleryImage}
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {gallery.length > 0 && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                {gallery.map((url, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={url} alt={`Gallery ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(url)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
