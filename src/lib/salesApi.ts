import api from './api';
import type { SaleRecord, SaleItem } from '../types/sale';

export interface CreateSalePayload {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  price: number;
  note?: string | null;
}

export interface SalesResponse {
  sales: SaleRecord[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const salesApi = {
  async createSale(payload: CreateSalePayload): Promise<SaleRecord> {
    const response = await api.post<SaleRecord>('/sales', payload);
    return response.data;
  },

  async createBatchSales(items: CreateSalePayload[]): Promise<{ sales: SaleRecord[]; summary: { items_count: number; total: number } }> {
    const response = await api.post<{ success: boolean; sales: SaleRecord[]; summary: { items_count: number; total: number } }>('/sales/batch', { items });
    return response.data;
  },

  async getSales(params?: {
    page?: number;
    limit?: number;
    date?: string;
    search?: string;
  }): Promise<SalesResponse> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', String(params.page));
    if (params?.limit) searchParams.append('limit', String(params.limit));
    if (params?.date) searchParams.append('date', params.date);
    if (params?.search) searchParams.append('search', params.search);

    const response = await api.get<SalesResponse | SaleRecord[]>(
      `/sales?${searchParams.toString()}`
    );
    
    if (Array.isArray(response.data)) {
      return { sales: response.data };
    }
    return response.data;
  },

  async getTodaySales(): Promise<SaleRecord[]> {
    const today = new Date().toISOString().slice(0, 10);
    const response = await api.get<SaleRecord[]>(`/sales?date=${today}`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getSalesByDateRange(startDate: string, endDate: string): Promise<SaleRecord[]> {
    const response = await api.get<SaleRecord[]>(
      `/sales?start_date=${startDate}&end_date=${endDate}`
    );
    return Array.isArray(response.data) ? response.data : [];
  }
};

export const formatSaleForCompletion = (item: {
  product_id?: string | null;
  product_name?: string | null;
  quantity: number;
  unit_price: number;
  note?: string;
}): CreateSalePayload => ({
  product_id: item.product_id || null,
  product_name: item.product_name || null,
  quantity: item.quantity,
  price: item.unit_price,
  note: item.note || null
});
