import api from './api';
import type { Product } from '../types/sale';

export interface ProductSearchParams {
  q?: string;
  status?: 'active' | 'inactive';
  category_id?: string;
  brand_id?: string;
  signal?: AbortSignal;
}

function normalizeProduct(raw: any): Product {
  if (!raw || !raw.id) return null as any;
  return {
    id: String(raw.id),
    name: String(raw.name || 'Unknown'),
    price: Number(raw.price || 0),
    quantity: Number(raw.quantity ?? 0),
    image_url: raw.image_url ?? null,
    status: raw.status ?? undefined,
    description: raw.description ?? null,
    category_id: raw.category_id ?? null,
    brand_id: raw.brand_id ?? null,
    model_id: raw.model_id ?? null,
    year_id: raw.year_id ?? null,
    gallery: Array.isArray(raw.gallery) ? raw.gallery.map((g: any) => ({
      url: String(g.url || ''),
      type: g.type === 'video' ? 'video' : 'image'
    })).filter((g: any) => g.url) : [],
    categories: raw.categories ? { id: String(raw.categories.id || ''), name: String(raw.categories.name || '') } : undefined,
    brands: raw.brands ? { id: String(raw.brands.id || ''), name: String(raw.brands.name || '') } : undefined,
    models: raw.models ? { id: String(raw.models.id || ''), name: String(raw.models.name || ''), image_url: raw.models.image_url ?? null } : undefined,
    years: raw.years ? { id: String(raw.years.id || ''), label: String(raw.years.label || '') } : undefined,
  };
}

function parseProductList(data: any): Product[] {
  if (!data) return [];
  const raw = Array.isArray(data) ? data : data.data;
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeProduct).filter(Boolean);
}

/**
 * Loads ALL products via paginated requests to the standard /products endpoint.
 * This is the primary method — it works regardless of backend version.
 */
async function fetchAllPaginated(params?: ProductSearchParams): Promise<Product[]> {
  const LIMIT = 100;
  const allProducts: Product[] = [];
  let page = 1;

  while (page <= 200) {
    const qs = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (params?.status) qs.set('status', params.status);
    if (params?.category_id) qs.set('category_id', params.category_id);
    if (params?.brand_id) qs.set('brand_id', params.brand_id);
    if (params?.q?.trim()) qs.set('q', params.q.trim());

    const res = await api.get(`/products?${qs}`, { signal: params?.signal });
    const products = parseProductList(res.data);
    allProducts.push(...products);

    const pagination = res.data?.pagination;
    if (pagination) {
      if (page >= Number(pagination.totalPages || 1)) break;
    } else {
      if (products.length < LIMIT) break;
    }

    page++;
  }

  return allProducts;
}

/**
 * Loads ALL products from the /products/all endpoint (no pagination needed).
 * Faster but requires auth and backend support.
 */
async function fetchAllFromEndpoint(params?: ProductSearchParams): Promise<Product[]> {
  const qs = new URLSearchParams();
  if (params?.status) qs.set('status', params.status);
  if (params?.category_id) qs.set('category_id', params.category_id);
  if (params?.brand_id) qs.set('brand_id', params.brand_id);
  if (params?.q?.trim()) qs.set('q', params.q.trim());

  const url = `/products/all${qs.toString() ? `?${qs}` : ''}`;
  const res = await api.get(url, { signal: params?.signal });
  return parseProductList(res.data);
}

/**
 * Fetches all products. Tries /products/all first (fast), falls back to
 * paginated /products (reliable). Returns [] on total failure.
 */
export async function fetchAllProducts(params?: ProductSearchParams): Promise<Product[]> {
  try {
    const products = await fetchAllFromEndpoint(params);
    if (products.length > 0) return products;
    // If /all returned empty, fall through to paginated
  } catch {
    // /products/all failed (auth, server, etc.) — use paginated fallback
  }

  try {
    return await fetchAllPaginated(params);
  } catch {
    return [];
  }
}

/**
 * Server-side search via the standard /products endpoint with ?q= param.
 * Returns a single page of results (for search-as-you-type).
 */
export async function searchProducts(
  q: string,
  params?: Omit<ProductSearchParams, 'q'> & { page?: number; limit?: number }
): Promise<Product[]> {
  if (!q.trim()) return [];

  const qs = new URLSearchParams({
    q: q.trim(),
    page: String(params?.page || 1),
    limit: String(params?.limit || 200),
  });
  if (params?.status) qs.set('status', params.status);
  if (params?.category_id) qs.set('category_id', params.category_id);
  if (params?.brand_id) qs.set('brand_id', params.brand_id);

  const res = await api.get(`/products?${qs}`, { signal: params?.signal });
  return parseProductList(res.data);
}
