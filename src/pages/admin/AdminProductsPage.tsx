import React from "react";
import { Plus, Search, Image, Trash2, Pencil } from "lucide-react";
import api from "../../lib/api";
import { Skeleton } from "../../components/ui/Skeleton";
import { Modal } from "../../components/ui/Modal";
import { useToast } from "../../components/ui/Toast";
import { PageHeader } from "../../components/ui/PageHeader";
import { EmptyState } from "../../components/ui/EmptyState";
import { StickyActionBar } from "../../components/ui/StickyActionBar";

type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  status: string;
  image_url?: string | null;
  car_image_url?: string | null;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  categories?: { name: string };
  brands?: { name: string };
  models?: { name: string };
  years?: { label: string };
};

type Option = { id: string; name?: string; label?: string; brand_id?: string; years?: string[] };

const fallbackImage =
  "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?q=80&w=600&auto=format&fit=crop";

export const AdminProductsPage: React.FC = () => {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [editOpen, setEditOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [name, setName] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [quantity, setQuantity] = React.useState("");
  const [categoryId, setCategoryId] = React.useState("");
  const [brandId, setBrandId] = React.useState("");
  const [modelId, setModelId] = React.useState("");
  const [yearId, setYearId] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [imageUrl, setImageUrl] = React.useState("");
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [carImageUrl, setCarImageUrl] = React.useState("");
  const [carImageFile, setCarImageFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [createPreviewUrl, setCreatePreviewUrl] = React.useState<string | null>(null);
  const [carPreviewUrl, setCarPreviewUrl] = React.useState<string | null>(null);
  const [carCreatePreviewUrl, setCarCreatePreviewUrl] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null);
  const [categories, setCategories] = React.useState<Option[]>([]);
  const [brands, setBrands] = React.useState<Option[]>([]);
  const [models, setModels] = React.useState<Option[]>([]);
  const [years, setYears] = React.useState<Option[]>([]);
  const { push } = useToast();
  const [addCategoryOpen, setAddCategoryOpen] = React.useState(false);
  const [addBrandOpen, setAddBrandOpen] = React.useState(false);
  const [addModelOpen, setAddModelOpen] = React.useState(false);
  const [addYearOpen, setAddYearOpen] = React.useState(false);
  const [newCategory, setNewCategory] = React.useState("");
  const [newBrand, setNewBrand] = React.useState("");
  const [newModel, setNewModel] = React.useState("");
  const [newModelBrandId, setNewModelBrandId] = React.useState("");
  const [newYear, setNewYear] = React.useState("");
  const [exporting, setExporting] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const importInputRef = React.useRef<HTMLInputElement | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, brandRes, modelRes, yearRes] = await Promise.all([
        api.get<Product[]>("/products"),
        api.get<Option[]>("/categories"),
        api.get<Option[]>("/brands"),
        api.get<Option[]>("/models"),
        api.get<Option[]>("/years")
      ]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
      setBrands(brandRes.data);
      setModels(modelRes.data);
      setYears(yearRes.data);
      setLastUpdated(new Date());
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const exportCsv = async () => {
    try {
      setExporting(true);
      const res = await api.get("/products/export", { responseType: "blob" });
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "products.csv";
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      push("Failed to export products", "error");
    } finally {
      setExporting(false);
    }
  };

  const importCsv = async (file: File | null) => {
    if (!file) return;
    try {
      setImporting(true);
      const text = await file.text();
      await api.post("/products/import", { csv: text });
      push("Products imported", "success");
      load();
    } catch {
      push("Failed to import products", "error");
    } finally {
      setImporting(false);
      if (importInputRef.current) {
        importInputRef.current.value = "";
      }
    }
  };

  React.useEffect(() => {
    load();
  }, [load]);

  React.useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  React.useEffect(() => {
    if (!imageFile) {
      setCreatePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    setCreatePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  React.useEffect(() => {
    if (!carImageFile) {
      setCarPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(carImageFile);
    setCarPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [carImageFile]);

  React.useEffect(() => {
    if (!carImageFile) {
      setCarCreatePreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(carImageFile);
    setCarCreatePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [carImageFile]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let finalYearId = yearId;
      
      if (yearId && selectedModel?.years?.includes(yearId)) {
        const existingYear = years.find(y => y.label === yearId);
        if (existingYear) {
          finalYearId = existingYear.id;
        } else {
          const res = await api.post("/years", { label: yearId });
          finalYearId = res.data.id;
        }
      }

      const payload = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        category_id: categoryId,
        brand_id: brandId,
        model_id: modelId || null,
        year_id: finalYearId || null,
        description,
        image_url: imageUrl || null,
        car_image_url: carImageUrl || null,
        status: "active"
      };

      if (imageFile || carImageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        if (imageFile) {
          formData.append("image", imageFile);
        }
        if (carImageFile) {
          formData.append("car_image", carImageFile);
        }
        await api.post("/products", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.post("/products", payload);
      }
      push("Product created", "success");
      setOpen(false);
      setName("");
      setPrice("");
      setQuantity("");
      setCategoryId("");
      setBrandId("");
      setModelId("");
      setYearId("");
      setDescription("");
      setImageUrl("");
      setImageFile(null);
      setCarImageUrl("");
      setCarImageFile(null);
      load();
    } catch {
      push("Failed to create product", "error");
    }
  };

  const onOpenEdit = (product: Product) => {
    setEditing(product);
    setName(product.name);
    setPrice(String(product.price));
    setQuantity(String(product.quantity));
    setCategoryId((product as any).category_id || "");
    setBrandId((product as any).brand_id || "");
    setModelId((product as any).model_id || "");
    setYearId((product as any).year_id || "");
    setDescription(product.description || "");
    setImageUrl(product.image_url || "");
    setCarImageUrl(product.car_image_url || "");
    setImageFile(null);
    setCarImageFile(null);
    setEditOpen(true);
  };

  const onUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      let finalYearId = yearId;
      
      if (yearId && selectedModel?.years?.includes(yearId)) {
        const existingYear = years.find(y => y.label === yearId);
        if (existingYear) {
          finalYearId = existingYear.id;
        } else {
          const res = await api.post("/years", { label: yearId });
          finalYearId = res.data.id;
        }
      }

      const payload = {
        name,
        price: Number(price),
        quantity: Number(quantity),
        category_id: categoryId,
        brand_id: brandId,
        model_id: modelId || null,
        year_id: finalYearId || null,
        description,
        image_url: imageUrl || null,
        car_image_url: carImageUrl || null,
        status: editing.status || "active"
      };

      if (imageFile || carImageFile) {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value !== null && value !== undefined) {
            formData.append(key, String(value));
          }
        });
        if (imageFile) {
          formData.append("image", imageFile);
        }
        if (carImageFile) {
          formData.append("car_image", carImageFile);
        }
        await api.put(`/products/${editing.id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      } else {
        await api.put(`/products/${editing.id}`, payload);
      }

      push("Product updated", "success");
      setEditOpen(false);
      setEditing(null);
      setName("");
      setPrice("");
      setQuantity("");
      setCategoryId("");
      setBrandId("");
      setModelId("");
      setYearId("");
      setDescription("");
      setImageUrl("");
      setImageFile(null);
      setCarImageUrl("");
      setCarImageFile(null);
      load();
    } catch {
      push("Failed to update product", "error");
    }
  };

  const onDelete = async (id: string) => {
    const confirmed = window.confirm("Are you sure you want to delete this product?");
    if (!confirmed) return;
    try {
      await api.delete(`/products/${id}`);
      push("Product deleted", "success");
      load();
    } catch {
      push("Failed to delete product", "error");
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const createCategory = async () => {
    try {
      await api.post("/categories", { name: newCategory });
      setNewCategory("");
      setAddCategoryOpen(false);
      load();
      push("Category added", "success");
    } catch {
      push("Failed to add category", "error");
    }
  };

  const createBrand = async () => {
    try {
      await api.post("/brands", { name: newBrand });
      setNewBrand("");
      setAddBrandOpen(false);
      load();
      push("Brand added", "success");
    } catch {
      push("Failed to add brand", "error");
    }
  };

  const createModel = async () => {
    if (!newModelBrandId) {
      push("Please select a brand", "error");
      return;
    }
    try {
      await api.post("/models", { name: newModel, brand_id: newModelBrandId });
      setNewModel("");
      setNewModelBrandId("");
      setAddModelOpen(false);
      load();
      push("Model added", "success");
    } catch {
      push("Failed to add model", "error");
    }
  };

  const createYear = async () => {
    try {
      await api.post("/years", { label: newYear });
      setNewYear("");
      setAddYearOpen(false);
      load();
      push("Year added", "success");
    } catch {
      push("Failed to add year", "error");
    }
  };

  const selectedModel = models.find(m => m.id === modelId);
  const availableYears = selectedModel?.years?.length
    ? selectedModel.years.map(y => ({ id: y, label: y }))
    : years;

  return (
    <div className="space-y-6 text-foreground">
      <PageHeader
        title="Products"
        subtitle="Manage catalogue pricing and stock."
        meta={
          <>
            {products.length} total
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ""}
          </>
        }
        actions={
          <div className="flex flex-wrap gap-2">
            <input
              ref={importInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => importCsv(e.target.files?.[0] || null)}
            />
            <button
              className="btn-outline h-10 text-sm"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
            >
              Import CSV
            </button>
            <button className="btn-outline h-10 text-sm" onClick={exportCsv} disabled={exporting}>
              Export CSV
            </button>
            <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add product
            </button>
          </div>
        }
      />

      <div className="card p-4">
        <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-muted-foreground">
          <Search className="h-4 w-4" />
          <input
            className="w-full bg-transparent outline-none"
            placeholder="Search products..."
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
              title="No products found"
              description="Try adjusting your search or add a new product."
              action={
                <button className="btn-primary h-10 text-sm" onClick={() => setOpen(true)}>
                  Add product
                </button>
              }
            />
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p.id} className="card p-4">
                <img
                  src={p.image_url || fallbackImage}
                  alt={p.name}
                  className="h-40 w-full rounded-lg object-cover"
                />
                <div className="mt-3">
                  <div className="text-sm font-semibold text-foreground">
                    {p.name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.categories?.name || "Uncategorized"}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      GHS {p.price.toLocaleString()}
                    </span>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
                      {p.status}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="btn-outline h-9 flex-1"
                      onClick={() => onOpenEdit(p)}
                    >
                      <Pencil className="mr-1 h-4 w-4" />
                      Edit
                    </button>
                    <button
                      className="btn-destructive h-9 flex-1"
                      onClick={() => onDelete(p.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Add product">
        <form onSubmit={onCreate} className="space-y-4">
          <div className="relative">
            <Image className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              required
              className="w-full rounded-lg border border-border bg-card px-10 py-3 text-sm text-foreground outline-none"
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-outline h-12 text-xs"
              onClick={() => setAddCategoryOpen(true)}
            >
              Add new category
            </button>
            <select
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setModelId("");
              }}
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="btn-outline h-12 text-xs"
              onClick={() => setAddBrandOpen(true)}
            >
              Add new brand
            </button>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              <option value="">Select model (optional)</option>
              {models
                .filter((m) => !brandId || m.brand_id === brandId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn-outline h-12 text-xs"
              onClick={() => setAddModelOpen(true)}
            >
              Add new model
            </button>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
            >
              <option value="">Select year (optional)</option>
              {availableYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
            {!selectedModel?.years?.length && (
              <button
                type="button"
                className="btn-outline h-12 text-xs"
                onClick={() => setAddYearOpen(true)}
              >
                Add new year
              </button>
            )}
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              required
              type="number"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <textarea
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Car image URL (optional)"
            value={carImageUrl}
            onChange={(e) => setCarImageUrl(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Product image file</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-foreground"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Car image file</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-foreground"
              onChange={(e) => setCarImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Image preview</p>
            <img
              src={createPreviewUrl || imageUrl || fallbackImage}
              alt="Preview"
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Car image preview</p>
            <img
              src={carCreatePreviewUrl || carImageUrl || fallbackImage}
              alt="Car preview"
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          </div>
          <StickyActionBar>
            <button className="btn-primary h-11 w-full">Create</button>
          </StickyActionBar>
        </form>
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Edit product">
        <form onSubmit={onUpdate} className="space-y-4">
          <div className="relative">
            <Image className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              required
              className="w-full rounded-lg border border-border bg-card px-10 py-3 text-sm text-foreground outline-none"
              placeholder="Product name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <select
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
            >
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              required
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={brandId}
              onChange={(e) => {
                setBrandId(e.target.value);
                setModelId("");
              }}
            >
              <option value="">Select brand</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
            >
              <option value="">Select model (optional)</option>
              {models
                .filter((m) => !brandId || m.brand_id === brandId)
                .map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
            </select>
            <select
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              value={yearId}
              onChange={(e) => setYearId(e.target.value)}
            >
              <option value="">Select year (optional)</option>
              {availableYears.map((y) => (
                <option key={y.id} value={y.id}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              required
              type="number"
              step="0.01"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Price"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <input
              required
              type="number"
              className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
              placeholder="Quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <textarea
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Image URL (optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Car image URL (optional)"
            value={carImageUrl}
            onChange={(e) => setCarImageUrl(e.target.value)}
          />
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Product image file</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-foreground"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground">Car image file</label>
            <input
              type="file"
              accept="image/*"
              className="w-full text-sm text-foreground"
              onChange={(e) => setCarImageFile(e.target.files?.[0] || null)}
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Image preview</p>
            <img
              src={previewUrl || imageUrl || editing?.image_url || fallbackImage}
              alt="Preview"
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          </div>
          <div className="rounded-lg border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">Car image preview</p>
            <img
              src={carPreviewUrl || carImageUrl || editing?.car_image_url || fallbackImage}
              alt="Car preview"
              className="mt-2 h-40 w-full rounded-lg object-cover"
            />
          </div>
          <StickyActionBar>
            <button className="btn-primary h-11 w-full">Save changes</button>
          </StickyActionBar>
        </form>
      </Modal>

      <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} title="Add category">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
          />
          <button className="btn-primary h-11 w-full" onClick={createCategory}>
            Save category
          </button>
        </div>
      </Modal>

      <Modal open={addBrandOpen} onClose={() => setAddBrandOpen(false)} title="Add brand">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Brand name"
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
          />
          <button className="btn-primary h-11 w-full" onClick={createBrand}>
            Save brand
          </button>
        </div>
      </Modal>

      <Modal open={addModelOpen} onClose={() => setAddModelOpen(false)} title="Add model">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Model name"
            value={newModel}
            onChange={(e) => setNewModel(e.target.value)}
          />
          <select
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            value={newModelBrandId}
            onChange={(e) => setNewModelBrandId(e.target.value)}
          >
            <option value="">Select brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button className="btn-primary h-11 w-full" onClick={createModel}>
            Save model
          </button>
        </div>
      </Modal>

      <Modal open={addYearOpen} onClose={() => setAddYearOpen(false)} title="Add year">
        <div className="space-y-3">
          <input
            className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground outline-none"
            placeholder="Year (e.g. 2022)"
            value={newYear}
            onChange={(e) => setNewYear(e.target.value)}
          />
          <button className="btn-primary h-11 w-full" onClick={createYear}>
            Save year
          </button>
        </div>
      </Modal>
    </div>
  );
};
