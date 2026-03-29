import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from "axios";

// ─── Configuration ──────────────────────────────────────────────────────────

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const DEFAULT_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const BASE_DELAY = 500; // 500ms initial retry delay
const RETRYABLE_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);
const NON_RETRYABLE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

// ─── Types ──────────────────────────────────────────────────────────────────

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCount: number;
}

interface ApiRequestConfig extends AxiosRequestConfig {
  retry?: Partial<RetryConfig>;
  skipRetry?: boolean;
  _retryCount?: number;
  _requestId?: string;
}

// ─── Logging ────────────────────────────────────────────────────────────────

function logApiError(method: string, url: string, error: any, attempt: number, maxRetries: number) {
  const status = error?.response?.status;
  const message = error?.message || "Unknown error";
  const isRetrying = attempt < maxRetries;

  if (isRetrying) {
    console.warn(
      `[API] ${method.toUpperCase()} ${url} failed (attempt ${attempt + 1}/${maxRetries + 1}): ${status || message} - Retrying...`
    );
  } else {
    console.error(
      `[API] ${method.toUpperCase()} ${url} failed after ${maxRetries + 1} attempts: ${status || message}`
    );
  }
}

function logApiSuccess(method: string, url: string, statusCode: number) {
  if (import.meta.env.DEV) {
    console.log(`[API] ${method.toUpperCase()} ${url} → ${statusCode}`);
  }
}

// ─── Retry Logic ────────────────────────────────────────────────────────────

function shouldRetry(error: AxiosError, method: string | undefined): boolean {
  if (!method) return false;

  // Don't retry client errors (4xx) except specific ones
  const status = error.response?.status;
  if (status && status >= 400 && status < 500) {
    // Only retry on specific client errors
    return RETRYABLE_STATUS_CODES.has(status);
  }

  // Retry on network errors, timeouts, and server errors
  if (!error.response) return true; // Network error
  if (status && RETRYABLE_STATUS_CODES.has(status)) return true;

  return false;
}

function getRetryDelay(attempt: number, baseDelay: number): number {
  // Exponential backoff: 500ms -> 1000ms -> 2000ms
  const delay = baseDelay * Math.pow(2, attempt);
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 200;
  return delay + jitter;
}

// ─── Request Deduplication ──────────────────────────────────────────────────

const pendingRequests = new Map<string, Promise<any>>();

function getRequestId(config: AxiosRequestConfig): string {
  return `${config.method?.toUpperCase() || "GET"}_${config.url || ""}_${JSON.stringify(config.params || {})}_${JSON.stringify(config.data || "")}`;
}

// ─── Token Management ───────────────────────────────────────────────────────

function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem("auth_token");
  } catch {
    return null;
  }
}

function clearAuth() {
  try {
    window.localStorage.removeItem("auth_token");
    window.localStorage.removeItem("user_role");
  } catch {
    // Ignore errors
  }
}

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000;
    // Consider token expired if it expires within 5 minutes
    return Date.now() > exp - 5 * 60 * 1000;
  } catch {
    return true;
  }
}

// ─── Create Axios Instance ──────────────────────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: DEFAULT_TIMEOUT,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor ────────────────────────────────────────────────────

api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Initialize retry count
    const apiConfig = config as ApiRequestConfig;
    if (apiConfig._retryCount === undefined) {
      apiConfig._retryCount = 0;
    }

    // Generate request ID for deduplication
    if (!apiConfig._requestId) {
      apiConfig._requestId = getRequestId(config);
    }

    return config;
  },
  (error) => {
    console.error("[API] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// ─── Response Interceptor with Retry ────────────────────────────────────────

api.interceptors.response.use(
  (response: AxiosResponse) => {
    logApiSuccess(
      response.config.method || "unknown",
      response.config.url || "unknown",
      response.status
    );
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as ApiRequestConfig;
    if (!config) {
      return Promise.reject(error);
    }

    const method = config.method?.toUpperCase() || "unknown";
    const url = config.url || "unknown";
    const currentRetry = config._retryCount || 0;
    const maxRetries = config.skipRetry ? 0 : (config.retry?.retries ?? MAX_RETRIES);

    // Handle 401 Unauthorized - clear auth and redirect
    if (error.response?.status === 401) {
      // Only clear auth for non-auth endpoints
      if (!url.includes("/auth/login") && !url.includes("/auth/signup")) {
        console.warn("[API] Unauthorized - clearing auth token");
        clearAuth();
        // Don't redirect on 401, let components handle it
      }
    }

    // Check if we should retry
    if (currentRetry < maxRetries && shouldRetry(error, method)) {
      config._retryCount = currentRetry + 1;

      const delay = getRetryDelay(currentRetry, config.retry?.retryDelay ?? BASE_DELAY);
      logApiError(method, url, error, currentRetry, maxRetries);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));

      // Retry the request
      return api.request(config);
    }

    // Log final failure
    if (currentRetry >= maxRetries || !shouldRetry(error, method)) {
      logApiError(method, url, error, currentRetry, maxRetries);
    }

    return Promise.reject(error);
  }
);

// ─── Wrapper Functions with Request Deduplication ───────────────────────────

export async function apiGet<T = any>(
  url: string,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  const requestId = `GET_${url}_${JSON.stringify(config?.params || {})}`;

  // For GET requests, deduplicate concurrent identical requests
  if (pendingRequests.has(requestId)) {
    return pendingRequests.get(requestId);
  }

  const promise = api.get<T>(url, config).finally(() => {
    pendingRequests.delete(requestId);
  });

  pendingRequests.set(requestId, promise);
  return promise;
}

export async function apiPost<T = any>(
  url: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  return api.post<T>(url, data, config);
}

export async function apiPut<T = any>(
  url: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  return api.put<T>(url, data, config);
}

export async function apiPatch<T = any>(
  url: string,
  data?: any,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  return api.patch<T>(url, data, config);
}

export async function apiDelete<T = any>(
  url: string,
  config?: ApiRequestConfig
): Promise<AxiosResponse<T>> {
  return api.delete<T>(url, config);
}

// ─── Health Check ───────────────────────────────────────────────────────────

export async function checkApiHealth(): Promise<boolean> {
  try {
    await api.get("/health", { timeout: 5000, skipRetry: true } as ApiRequestConfig);
    return true;
  } catch {
    return false;
  }
}

// ─── Error Message Extractor ────────────────────────────────────────────────

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Server responded with error
    if (error.response?.data) {
      const data = error.response.data as any;
      return data.error || data.message || `Server error (${error.response.status})`;
    }

    // Network error
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please try again.";
    }

    if (error.code === "ERR_NETWORK") {
      return "Network error. Please check your connection.";
    }

    if (!error.response) {
      return "Network error. Please check your connection.";
    }

    return error.message || "An unexpected error occurred.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

// ─── Exports ────────────────────────────────────────────────────────────────

export default api;
export type { ApiRequestConfig };
