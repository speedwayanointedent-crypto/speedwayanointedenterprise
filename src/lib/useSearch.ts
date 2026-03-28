import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  search,
  SearchOptions,
  SearchResult
} from './search';

export interface UseSearchOptions<T> extends SearchOptions<T> {
  debounceMs?: number;
  keepResultsOnEmpty?: boolean;
}

export interface UseSearchReturn<T> {
  query: string;
  setQuery: (query: string) => void;
  debouncedQuery: string;
  results: SearchResult<T>[];
  items: T[];
  isSearching: boolean;
  clearSearch: () => void;
  totalResults: number;
}

export const useSearch = <T extends object>(
  data: T[],
  options: UseSearchOptions<T>
): UseSearchReturn<T> => {
  const {
    fields,
    caseSensitive = false,
    debounceMs = 300,
    keepResultsOnEmpty = true
  } = options;

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const previousQueryRef = useRef('');

  useEffect(() => {
    setIsSearching(true);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
      setIsSearching(false);
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, debounceMs]);

  const results = useMemo(() => {
    if (!debouncedQuery.trim() && !keepResultsOnEmpty) {
      return [];
    }

    return search(data, debouncedQuery, {
      fields,
      caseSensitive
    });
  }, [data, debouncedQuery, fields, caseSensitive, keepResultsOnEmpty]);

  const items = useMemo(() => {
    return results.map((r) => r.item);
  }, [results]);

  const clearSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
  }, []);

  const totalResults = results.length;

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    items,
    isSearching,
    clearSearch,
    totalResults
  };
};

export interface UseDebounceOptions {
  debounceMs?: number;
}

export const useDebounce = <T>(value: T, debounceMs: number = 300): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, debounceMs);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, debounceMs]);

  return debouncedValue;
};

export interface UseFilteredSearchOptions<T> extends UseSearchOptions<T> {
  filterFn?: (item: T) => boolean;
  sortFn?: (a: T, b: T) => number;
}

export const useFilteredSearch = <T extends object>(
  data: T[],
  options: UseFilteredSearchOptions<T>
): UseSearchReturn<T> => {
  const {
    filterFn,
    sortFn,
    ...searchOptions
  } = options;

  const filteredData = useMemo(() => {
    if (!filterFn) return data;
    return data.filter(filterFn);
  }, [data, filterFn]);

  const sortedData = useMemo(() => {
    if (!sortFn) return filteredData;
    return [...filteredData].sort(sortFn);
  }, [filteredData, sortFn]);

  const searchResult = useSearch(sortedData, searchOptions);

  return searchResult;
};

export interface UseSearchNavigationOptions {
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  wrapAround?: boolean;
}

export const useSearchNavigation = (
  itemCount: number,
  options: UseSearchNavigationOptions = {}
) => {
  const { onSelect, onEscape, wrapAround = true } = options;
  const [selectedIndex, setSelectedIndex] = useState(-1);

  useEffect(() => {
    if (itemCount === 0) {
      setSelectedIndex(-1);
    } else if (selectedIndex >= itemCount) {
      setSelectedIndex(wrapAround ? 0 : itemCount - 1);
    }
  }, [itemCount, selectedIndex, wrapAround]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (itemCount === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (prev >= itemCount - 1) {
              return wrapAround ? 0 : prev;
            }
            return prev + 1;
          });
          break;

        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => {
            if (prev <= 0) {
              return wrapAround ? itemCount - 1 : 0;
            }
            return prev - 1;
          });
          break;

        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < itemCount) {
            onSelect?.(selectedIndex);
          }
          break;

        case 'Escape':
          e.preventDefault();
          setSelectedIndex(-1);
          onEscape?.();
          break;
      }
    },
    [itemCount, selectedIndex, onSelect, onEscape, wrapAround]
  );

  const resetSelection = useCallback(() => {
    setSelectedIndex(-1);
  }, []);

  return {
    selectedIndex,
    setSelectedIndex,
    handleKeyDown,
    resetSelection
  };
};
