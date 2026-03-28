export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
};

const STORAGE_KEY = "cart_items";

export const getCart = (): CartItem[] => {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
};

export const saveCart = (items: CartItem[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("cart_updated"));
};

export const addToCart = (item: Omit<CartItem, "qty">, qty = 1) => {
  const current = getCart();
  const existing = current.find((c) => c.id === item.id);
  if (existing) {
    const updated = current.map((c) =>
      c.id === item.id ? { ...c, qty: c.qty + qty } : c
    );
    saveCart(updated);
    return;
  }
  saveCart([...current, { ...item, qty }]);
};

export const updateQty = (id: string, qty: number) => {
  const current = getCart();
  const updated = current
    .map((c) => (c.id === id ? { ...c, qty } : c))
    .filter((c) => c.qty > 0);
  saveCart(updated);
};

export const removeFromCart = (id: string) => {
  const current = getCart();
  saveCart(current.filter((c) => c.id !== id));
};

export const clearCart = () => {
  saveCart([]);
};

export const getCartCount = () =>
  getCart().reduce((sum, item) => sum + item.qty, 0);
