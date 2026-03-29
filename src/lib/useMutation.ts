import { useState, useCallback, useRef } from "react";
import { getApiErrorMessage } from "./api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void | Promise<void>;
  onError?: (error: string, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: string | null, variables: TVariables) => void;
  successMessage?: string;
  errorMessage?: string;
}

interface UseMutationReturn<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData | null>;
  data: TData | null;
  error: string | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  reset: () => void;
}

// ─── useMutation Hook ───────────────────────────────────────────────────────

export function useMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {}
): UseMutationReturn<TData, TVariables> {
  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const isExecutingRef = useRef(false);

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData | null> => {
      // Prevent duplicate submissions
      if (isExecutingRef.current) {
        console.warn("[useMutation] Duplicate mutation prevented");
        return null;
      }

      isExecutingRef.current = true;
      setIsLoading(true);
      setError(null);
      setIsSuccess(false);

      try {
        const result = await mutationFn(variables);
        setData(result);
        setIsSuccess(true);

        if (options.onSuccess) {
          await options.onSuccess(result, variables);
        }

        if (options.onSettled) {
          await options.onSettled(result, null, variables);
        }

        return result;
      } catch (err) {
        const errorMessage = options.errorMessage || getApiErrorMessage(err);
        setError(errorMessage);

        if (options.onError) {
          options.onError(errorMessage, variables);
        }

        if (options.onSettled) {
          await options.onSettled(null, errorMessage, variables);
        }

        return null;
      } finally {
        setIsLoading(false);
        isExecutingRef.current = false;
      }
    },
    [mutationFn, options]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsSuccess(false);
    isExecutingRef.current = false;
  }, []);

  return {
    mutate,
    data,
    error,
    isLoading,
    isError: error !== null,
    isSuccess,
    reset,
  };
}

// ─── useApiMutation Hook (convenience wrapper) ──────────────────────────────

interface UseApiMutationOptions<TData> {
  onSuccess?: (data: TData) => void | Promise<void>;
  onError?: (error: string) => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useApiMutation<TData = any>(
  apiCall: () => Promise<{ data: TData }>,
  options: UseApiMutationOptions<TData> = {}
) {
  return useMutation<TData, void>(
    async () => {
      const response = await apiCall();
      return response.data;
    },
    {
      onSuccess: options.onSuccess,
      onError: options.onError,
      errorMessage: options.errorMessage,
    }
  );
}

export default useMutation;
