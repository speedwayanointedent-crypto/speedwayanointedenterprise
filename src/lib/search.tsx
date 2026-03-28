export interface SearchOptions<T> {
  fields: (keyof T | string)[];
  threshold?: number;
  caseSensitive?: boolean;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches: {
    field: string;
    value: string;
    indices: [number, number][];
  }[];
}

const findMatchIndices = (text: string, query: string): [number, number][] => {
  const indices: [number, number][] = [];
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();

  let startIndex = 0;
  while (true) {
    const index = lowerText.indexOf(lowerQuery, startIndex);
    if (index === -1) break;
    indices.push([index, index + query.length - 1]);
    startIndex = index + 1;
  }

  return indices;
};

const getNestedValue = (obj: any, path: string): any => {
  const keys = path.split('.');
  let value = obj;
  for (const key of keys) {
    if (value === null || value === undefined) return undefined;
    value = value[key];
  }
  return value;
};

/**
 * Simple, reliable substring search.
 * Matches if the query appears anywhere in any of the specified fields.
 * Sorts by relevance: exact match > starts with > contains.
 */
export const search = <T extends object>(
  data: T[],
  query: string,
  options: SearchOptions<T>
): SearchResult<T>[] => {
  const { fields, caseSensitive = false } = options;

  if (!query.trim()) {
    return data.map((item) => ({
      item,
      score: 0,
      matches: []
    }));
  }

  const q = caseSensitive ? query.trim() : query.trim().toLowerCase();
  const results: SearchResult<T>[] = [];

  for (const item of data) {
    const matches: SearchResult<T>['matches'] = [];
    let bestScore = 0;

    for (const field of fields) {
      const value = getNestedValue(item, field as string);
      if (value === null || value === undefined) continue;

      const text = String(value);
      const normalized = caseSensitive ? text : text.toLowerCase();

      if (!normalized.includes(q)) continue;

      // Score: exact > starts with > contains
      let score = 0.5;
      if (normalized === q) score = 1;
      else if (normalized.startsWith(q)) score = 0.9;
      else if (normalized.split(/[\s\-_]+/).some(w => w.startsWith(q))) score = 0.8;
      else if (normalized.includes(q)) score = 0.6;

      bestScore = Math.max(bestScore, score);
      matches.push({
        field: field as string,
        value: text,
        indices: findMatchIndices(text, query)
      });
    }

    if (bestScore > 0) {
      results.push({ item, score: bestScore, matches });
    }
  }

  return results.sort((a, b) => b.score - a.score);
};

export const searchProducts = <T extends object>(
  data: T[],
  query: string,
  fields: (keyof T | string)[] = ['name', 'categories.name', 'brands.name', 'models.name']
): SearchResult<T>[] => {
  return search(data, query, { fields });
};

export const searchSales = <T extends object>(
  data: T[],
  query: string,
  fields: (keyof T | string)[] = ['product_name', 'id', 'note']
): SearchResult<T>[] => {
  return search(data, query, { fields });
};

export const searchInventory = <T extends object>(
  data: T[],
  query: string,
  fields: (keyof T | string)[] = ['name', 'categories.name', 'brands.name']
): SearchResult<T>[] => {
  return search(data, query, { fields });
};

export const highlightMatch = (
  text: string,
  query: string,
  className: string = 'bg-warning/30 rounded px-0.5'
): React.ReactNode => {
  if (!query.trim()) return text;

  const indices = findMatchIndices(text, query);
  if (indices.length === 0) return text;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;

  for (const [start, end] of indices) {
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <mark key={`${start}-${end}`} className={className}>
        {text.slice(start, end + 1)}
      </mark>
    );
    lastIndex = end + 1;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
};
