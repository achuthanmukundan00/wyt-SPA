/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { StoreProduct, StoreVariant } from '../types/store';

export type CartLineItem = {
  key: string;
  productId: string;
  variantId: string;
  productTitle: string;
  productImage: string;
  variantName: string;
  size: string;
  color: string;
  unitPrice: number;
  currency: string;
  quantity: number;
};

type CartContextValue = {
  items: CartLineItem[];
  totalQuantity: number;
  subtotal: number;
  currency: string;
  addItem: (input: { product: StoreProduct; variant: StoreVariant; quantity: number }) => void;
  removeItem: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  clearCart: () => void;
};

const CART_STORAGE_KEY = 'wyt-store-cart-v1';

const CartContext = createContext<CartContextValue | null>(null);

const makeLineKey = (productId: string, variantId: string) => `${productId}::${variantId}`;

const sanitizeQuantity = (value: number) => Math.max(1, Math.min(20, Math.floor(value)));

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartLineItem[]>([]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const raw = window.localStorage.getItem(CART_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as CartLineItem[];
      if (!Array.isArray(parsed)) {
        return;
      }

      setItems(
        parsed
          .filter((item) => item && typeof item === 'object' && typeof item.key === 'string')
          .map((item) => ({ ...item, quantity: sanitizeQuantity(item.quantity || 1) })),
      );
    } catch {
      // ignore malformed persisted cart
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const addItem: CartContextValue['addItem'] = ({ product, variant, quantity }) => {
      setItems((current) => {
        const key = makeLineKey(product.id, variant.id);
        const existing = current.find((item) => item.key === key);

        if (existing) {
          return current.map((item) =>
            item.key === key ? { ...item, quantity: sanitizeQuantity(item.quantity + quantity) } : item,
          );
        }

        const nextLine: CartLineItem = {
          key,
          productId: product.id,
          variantId: variant.id,
          productTitle: product.title,
          productImage: product.image,
          variantName: variant.name,
          size: variant.size,
          color: variant.color,
          unitPrice: variant.price,
          currency: variant.currency,
          quantity: sanitizeQuantity(quantity),
        };

        return [...current, nextLine];
      });
    };

    const removeItem: CartContextValue['removeItem'] = (lineKey) => {
      setItems((current) => current.filter((item) => item.key !== lineKey));
    };

    const updateQuantity: CartContextValue['updateQuantity'] = (lineKey, quantity) => {
      const nextQuantity = sanitizeQuantity(quantity);
      setItems((current) => current.map((item) => (item.key === lineKey ? { ...item, quantity: nextQuantity } : item)));
    };

    const clearCart = () => setItems([]);

    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = Number(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0).toFixed(2));
    const currency = items[0]?.currency || 'USD';

    return {
      items,
      totalQuantity,
      subtotal,
      currency,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }

  return value;
};
