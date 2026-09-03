import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartItem, Product } from '../lib/types';

const STORAGE_KEY = 'aether-cart-v1';

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (product: Product, quantity?: number) => { ok: boolean; reason?: string };
  updateQuantity: (productId: number, quantity: number) => void;
  removeItem: (productId: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  count: 0,
  subtotal: 0,
  isOpen: false,
  openCart: () => undefined,
  closeCart: () => undefined,
  addItem: () => ({ ok: false }),
  updateQuantity: () => undefined,
  removeItem: () => undefined,
  clearCart: () => undefined,
});

function load(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem => typeof i === 'object' && i !== null && 'product_id' in i && 'quantity' in i
    );
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(load);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable */
    }
  }, [items]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    if (product.stock <= 0) return { ok: false, reason: 'This object is currently sold out.' };
    let result: { ok: boolean; reason?: string } = { ok: true };
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      const current = existing?.quantity ?? 0;
      const next = current + quantity;
      if (next > product.stock) {
        result = { ok: false, reason: `Only ${product.stock} available.` };
        return prev;
      }
      const entry: CartItem = {
        product_id: product.id,
        slug: product.slug,
        name: product.name,
        price: Number(product.price),
        image: product.images?.[0] ?? '',
        quantity: next,
        stock: product.stock,
        sku: product.sku,
        collection: product.collection?.name ?? '',
      };
      return existing ? prev.map((i) => (i.product_id === product.id ? entry : i)) : [...prev, entry];
    });
    return result;
  }, []);

  const updateQuantity = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => (i.product_id === productId ? { ...i, quantity: Math.min(Math.max(1, quantity), Math.max(1, i.stock)) } : i))
        .filter((i) => i.quantity > 0)
    );
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }, []);

  const clearCart = useCallback(() => setItems([]), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const count = items.reduce((s, i) => s + i.quantity, 0);
    const subtotal = Math.round(items.reduce((s, i) => s + i.price * i.quantity, 0) * 100) / 100;
    return { items, count, subtotal, isOpen, openCart, closeCart, addItem, updateQuantity, removeItem, clearCart };
  }, [items, isOpen, openCart, closeCart, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
