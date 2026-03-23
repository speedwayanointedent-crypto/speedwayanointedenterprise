import React from "react";
import { Plus, Search, Truck, Pencil, Trash2, X, ImageIcon, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";

type Model = { id: string; name: string; brand_id?: string; brands?: { name: string }; years?: string[]; image_url?: string | null; gallery?: string[] };
type Brand = { id: string; name: string };

export const AdminModelsPage: React.FC = () => {
  const [items, setItems] = React.useState<Model[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Model | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedDetail, setSelectedDetail] = React.useState<Model | null>(null);
  const [detailImageErrors, setDetailImageErrors] = React.useState<Set<string>>(new Set());
  const [name, setName] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [years, setYears] = React.useState<string[]>([]);
  const [newYear, setNewYear] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [gallery, setGallery] = React.useState<string[]>([]);
  const [newGalleryUrl, setNewGalleryUrl] = React.useState("");
  const [galleryLightbox, setGalleryLightbox] = React.useState<{ index: number; images: string[] } | null>(null);
  const [imageErrors, setImageErrors] = React.useState<Set<string>>(new Set());
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [brands, setBrands] = React.useState<Brand[]>([]);
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
    setYears([]);
    setNewYear("");
    setImageUrl("");
    setImagePreview(null);
    setGallery([]);
    setNewGalleryUrl("");
  };

  const addGalleryImage = () => {
    if (newGalleryUrl && !gallery.includes(newGalleryUrl)) {
      setGallery([...gallery, newGalleryUrl]);
      setNewGalleryUrl("");
    }
  };

  const removeGalleryImage = (url: string) => {
    setGallery(gallery.filter(g => g !== url));
    setImageErrors(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleImageError = (url: string) => {
    setImageErrors(prev => new Set(prev).add(url));
  };

  const handleImageSuccess = (url: string) => {
    setImageErrors(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const openLightbox = (images: string[], index: number) => {
    setGalleryLightbox({ index, images });
  };

  const closeLightbox = () => {
    setGalleryLightbox(null);
  };

  const navigateLightbox = (direction: number) => {
    if (!galleryLightbox) return;
    const newIndex = galleryLightbox.index + direction;
    if (newIndex >= 0 && newIndex < galleryLightbox.images.length) {
      setGalleryLightbox({ ...galleryLightbox, index: newIndex });
    }
  };

  const openDetail = (model: Model) => {
    setSelectedDetail({ ...model });
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setSelectedDetail(null);
    setDetailImageErrors(new Set());
  };

  const handleDetailImageError = (url: string) => {
    setDetailImageErrors(prev => new Set(prev).add(url));
  };

  const handleDetailImageSuccess = (url: string) => {
    setDetailImageErrors(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleDetailAddYear = (year: string) => {
    if (!selectedDetail) return;
    if (!selectedDetail.years) selectedDetail.years = [];
    if (!selectedDetail.years.includes(year)) {
      setSelectedDetail({
        ...selectedDetail,
        years: [...selectedDetail.years, year].sort()
      });
    }
  };

  const handleDetailRemoveYear = (year: string) => {
    if (!selectedDetail) return;
    setSelectedDetail({
      ...selectedDetail,
      years: (selectedDetail.years || []).filter(y => y !== year)
    });
  };

  const handleDetailAddGallery = (url: string) => {
    if (!selectedDetail) return;
    if (!selectedDetail.gallery) selectedDetail.gallery = [];
    if (!selectedDetail.gallery.includes(url)) {
      setSelectedDetail({
        ...selectedDetail,
        gallery: [...selectedDetail.gallery, url]
      });
    }
  };

  const handleDetailRemoveGallery = (url: string) => {
    if (!selectedDetail) return;
    setSelectedDetail({
      ...selectedDetail,
      gallery: (selectedDetail.gallery || []).filter(g => g !== url)
    });
  };

  const handleDetailUpdate = (updates: Partial<Model>) => {
    if (!selectedDetail) return;
    setSelectedDetail({
      ...selectedDetail,
      ...updates
    });
  };

  const handleDetailSave = async () => {
    if (!selectedDetail) return;
    try {
      await api.put(`/models/${selectedDetail.id}`, {
        name: selectedDetail.name,
        brand_id: selectedDetail.brand_id,
        years: selectedDetail.years || [],
        image_url: selectedDetail.image_url || null,
        gallery: selectedDetail.gallery || []
      });
      push("Model updated", "success");
      load();
    } catch {
      push("Failed to update model", "error");
    }
  };

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
    if (!brandId) {
      push("Please select a brand", "error");
      return;
    }
    try {
      await api.post("/models", { 
        name, 
        brand_id: brandId, 
        years, 
        image_url: imageUrl || null,
        gallery: gallery.length > 0 ? gallery : []
      });
      push("Model created", "success");
      resetForm();
      setOpen(false);
      load();
    } catch {
      push("Failed to create model", "error");
    }
  };

  const onOpenEdit = (model: Model) => {
    setEditing(model);
    setName(model.name);
    setBrandId(model.brand_id || "");
    setYears(model.years || []);
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
    try {
      await api.put(`/models/${editing.id}`, { 
        name, 
        brand_id: brandId, 
        years, 
        image_url: imageUrl || null,
        gallery: gallery.length > 0 ? gallery : []
      });
      push("Model updated", "success");
      setEditOpen(false);
      setEditing(null);
      resetForm();
      load();
    } catch {
      push("Failed to update model", "error");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this model? This may affect products using this model.");
    if (!confirmed) return;
    try {
      await api.delete(`/models/${id}`);
      push("Model deleted", "success");
      load();
    } catch {
      push("Failed to delete model", "error");
    }
  };

  const handleImageUrlChange = (url: string) => {
    setImageUrl(url);
    if (url) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
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
        subtitle="Maintain fitment models and their compatible years."
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
                              {c.gallery.length} image{c.gallery.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
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
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
            placeholder="Model name (e.g., Corolla)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <div>
            <label className="mb-2 block text-sm font-medium">Image URL (optional)</label>
            <div className="space-y-3">
              <input
                className="form-input"
                placeholder="https://example.com/model.jpg"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
              />
              {imagePreview && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Compatible Years</label>
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
              Add years this model is compatible with. Products will auto-filter by model years.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gallery Images (optional)</label>
            <p className="text-xs text-muted-foreground">Add image URLs to display in the shop gallery. Click an image to preview.</p>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="Add image URL for gallery"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())}
              />
              <button
                type="button"
                className="btn-outline h-10"
                onClick={addGalleryImage}
              >
                Add
              </button>
            </div>
            {gallery.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{gallery.length} image{gallery.length !== 1 ? 's' : ''} in gallery</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {gallery.map((url, idx) => (
                    <div key={idx} className="group relative aspect-video overflow-hidden rounded-lg border border-border">
                      {imageErrors.has(url) ? (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Gallery ${idx + 1}`} 
                          className="h-full w-full object-cover"
                          onError={() => handleImageError(url)}
                          onLoad={() => handleImageSuccess(url)}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openLightbox(gallery, idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-gray-100"
                          title="Preview"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(url)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No gallery images added yet.</p>
            )}
          </div>
          <button className="btn-primary h-11 w-full">Create</button>
        </form>
      </Modal>

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
            <label className="mb-2 block text-sm font-medium">Image URL (optional)</label>
            <div className="space-y-3">
              <input
                className="form-input"
                placeholder="https://example.com/model.jpg"
                value={imageUrl}
                onChange={(e) => handleImageUrlChange(e.target.value)}
              />
              {imagePreview && (
                <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
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
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Compatible Years</label>
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
              Add years this model is compatible with.
            </p>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Gallery Images (optional)</label>
            <p className="text-xs text-muted-foreground">Add image URLs to display in the shop gallery. Click an image to preview.</p>
            <div className="flex gap-2">
              <input
                className="form-input flex-1"
                placeholder="Add image URL for gallery"
                value={newGalleryUrl}
                onChange={(e) => setNewGalleryUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())}
              />
              <button
                type="button"
                className="btn-outline h-10"
                onClick={addGalleryImage}
              >
                Add
              </button>
            </div>
            {gallery.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{gallery.length} image{gallery.length !== 1 ? 's' : ''} in gallery</p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {gallery.map((url, idx) => (
                    <div key={idx} className="group relative aspect-video overflow-hidden rounded-lg border border-border">
                      {imageErrors.has(url) ? (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Gallery ${idx + 1}`} 
                          className="h-full w-full object-cover"
                          onError={() => handleImageError(url)}
                          onLoad={() => handleImageSuccess(url)}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={() => openLightbox(gallery, idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-gray-100"
                          title="Preview"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(url)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No gallery images added yet.</p>
            )}
          </div>
          <button className="btn-primary h-11 w-full">Save changes</button>
        </form>
      </Modal>

      {galleryLightbox && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            onClick={closeLightbox}
          >
            <X className="h-6 w-6" />
          </button>
          {galleryLightbox.index > 0 && (
            <button
              className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
          )}
          {galleryLightbox.index < galleryLightbox.images.length - 1 && (
            <button
              className="absolute right-16 rounded-full bg-white/10 p-3 text-white hover:bg-white/20"
              onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          )}
          <img
            src={galleryLightbox.images[galleryLightbox.index]}
            alt={`Gallery ${galleryLightbox.index + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <div className="absolute bottom-4 text-white">
            {galleryLightbox.index + 1} / {galleryLightbox.images.length}
          </div>
        </div>
      )}

      <Modal open={detailOpen} onClose={closeDetail} title="Model Details">
        {selectedDetail && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Truck className="h-7 w-7" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{selectedDetail.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedDetail.brands?.name || "No brand"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Main Image</label>
                  <button
                    type="button"
                    onClick={() => {
                      const newUrl = window.prompt("Enter new image URL:", selectedDetail.image_url || "");
                      if (newUrl !== null) {
                        handleDetailUpdate({ image_url: newUrl || null });
                      }
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Change
                  </button>
                </div>
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-border">
                  {selectedDetail.image_url ? (
                    <img src={selectedDetail.image_url} alt={selectedDetail.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-muted">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Brand</label>
                <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
                  {selectedDetail.brands?.name || "Not set"}
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Compatible Years</label>
              <div className="flex flex-wrap gap-2">
                {selectedDetail.years && selectedDetail.years.length > 0 ? (
                  selectedDetail.years.map((year) => (
                    <span key={year} className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
                      {year}
                      <button
                        type="button"
                        onClick={() => handleDetailRemoveYear(year)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No years added</p>
                )}
              </div>
              <div className="mt-2 flex gap-2">
                <input
                  id="detail-year-input"
                  className="form-input flex-1"
                  placeholder="Add year (e.g., 2024)"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value) handleDetailAddYear(input.value);
                      input.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) handleDetailAddYear(e.target.value);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="btn-outline h-10"
                  onClick={() => {
                    const input = document.getElementById("detail-year-input") as HTMLInputElement;
                    if (input?.value) {
                      handleDetailAddYear(input.value);
                      input.value = "";
                    }
                  }}
                >
                  Add
                </button>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Gallery Images</label>
                <span className="text-xs text-muted-foreground">
                  {selectedDetail.gallery?.length || 0} photos
                </span>
              </div>
              <div className="mb-3 flex gap-2">
                <input
                  id="detail-gallery-input"
                  className="form-input flex-1"
                  placeholder="Add image URL to gallery"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const input = e.target as HTMLInputElement;
                      if (input.value) handleDetailAddGallery(input.value);
                      input.value = "";
                    }
                  }}
                  onBlur={(e) => {
                    if (e.target.value) handleDetailAddGallery(e.target.value);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  className="btn-outline h-10"
                  onClick={() => {
                    const input = document.getElementById("detail-gallery-input") as HTMLInputElement;
                    if (input?.value) {
                      handleDetailAddGallery(input.value);
                      input.value = "";
                    }
                  }}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {selectedDetail.gallery && selectedDetail.gallery.length > 0 ? (
                  selectedDetail.gallery.map((url, idx) => (
                    <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      {detailImageErrors.has(url) ? (
                        <div className="flex h-full w-full items-center justify-center bg-muted">
                          <ImageIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                      ) : (
                        <img 
                          src={url} 
                          alt={`Gallery ${idx + 1}`} 
                          className="h-full w-full object-cover"
                          onError={() => handleDetailImageError(url)}
                          onLoad={() => handleDetailImageSuccess(url)}
                        />
                      )}
                      <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => openLightbox(selectedDetail.gallery!, idx)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black hover:bg-gray-100"
                          title="Preview"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDetailRemoveGallery(url)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                          title="Remove"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full flex items-center justify-center rounded-lg border border-dashed border-border py-8 text-sm text-muted-foreground">
                    No gallery images added yet
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                className="btn-outline flex-1"
                onClick={() => {
                  closeDetail();
                  onOpenEdit(selectedDetail);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Edit All Fields
              </button>
              <button
                className="btn-primary flex-1"
                onClick={() => {
                  handleDetailSave();
                  closeDetail();
                }}
              >
                Save Changes
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
