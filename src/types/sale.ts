export type GalleryItem = {
  url: string;
  type: "image" | "video";
};

export type Product = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
  status?: string;
  description?: string | null;
  category_id?: string | null;
  brand_id?: string | null;
  model_id?: string | null;
  year_id?: string | null;
  gallery?: GalleryItem[];
  categories?: { id: string; name: string };
  brands?: { id: string; name: string };
  models?: { id: string; name: string; image_url?: string | null };
  years?: { id: string; label: string };
};

export type CartItem = {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  unit_price: number;
  availableStock: number;
  image_url?: string | null;
  category?: string;
  brand?: string;
  model?: string;
  year?: string;
  isManual?: boolean;
  isNew?: boolean;
};

export type SaleRecord = {
  id: string;
  product_id?: string | null;
  product_name: string;
  quantity: number;
  price?: number;
  unit_price?: number;
  total: number;
  created_at?: string;
  note?: string | null;
};

export const getUnitPrice = (sale: SaleRecord): number => {
  return sale.unit_price ?? sale.price ?? 0;
};

export type SaleItem = {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
};

export type CategoryOption = {
  id: string;
  name: string;
};

export type BrandOption = {
  id: string;
  name: string;
};

export type ModelOption = {
  id: string;
  name: string;
  brand_id: string;
};

export type YearOption = {
  id: string;
  label: string;
};

export type SaleStats = {
  todayRevenue: number;
  todayItems: number;
  todayTransactions: number;
  avgTicket: number;
};

export type FilterOptions = {
  search: string;
  category: string;
  brand: string;
  model: string;
  year: string;
};

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export const getStockStatus = (quantity: number): StockStatus => {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= 5) return 'low_stock';
  return 'in_stock';
};

export const formatCurrency = (value: number): string =>
  `GHS ${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
