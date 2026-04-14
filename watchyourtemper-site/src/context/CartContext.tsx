/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useStorePreferences } from './StorePreferencesContext';
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
  baseUnitPrice: number;
  baseCurrency: string;
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

export const CART_STORAGE_KEY = 'wyt-store-cart-v1';

const CartContext = createContext<CartContextValue | null>(null);

const makeLineKey = (productId: string, variantId: string) => `${productId}::${variantId}`;

const sanitizeQuantity = (value: number) => Math.max(1, Math.min(20, Math.floor(value)));
const toMoney = (value: number) => Number(value.toFixed(2));

export const CartProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<CartLineItem[]>([]);
  const { selectedCurrency, exchangeRates, baseCurrency } = useStorePreferences();

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
          .map((item) => ({
            ...item,
            baseUnitPrice: typeof item.baseUnitPrice === 'number' ? item.baseUnitPrice : item.unitPrice,
            baseCurrency: typeof item.baseCurrency === 'string' ? item.baseCurrency : item.currency || baseCurrency,
            quantity: sanitizeQuantity(item.quantity || 1),
          })),
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
    const convertAmount = (amount: number, sourceCurrency: string) => {
      const normalizedSource = sourceCurrency.toUpperCase();
      const normalizedTarget = selectedCurrency.toUpperCase();

      if (normalizedSource === normalizedTarget) {
        return toMoney(amount);
      }

      if (normalizedSource !== baseCurrency.toUpperCase()) {
        return toMoney(amount);
      }

      const rate = exchangeRates[normalizedTarget];
      return rate ? toMoney(amount * rate) : toMoney(amount);
    };

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
          baseUnitPrice: variant.basePrice ?? variant.price,
          baseCurrency: variant.baseCurrency ?? variant.currency,
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

    const displayItems = items.map((item) => {
      const displayUnitPrice = convertAmount(item.baseUnitPrice, item.baseCurrency);
      return {
        ...item,
        unitPrice: displayUnitPrice,
        currency: selectedCurrency,
      };
    });

    const totalQuantity = displayItems.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = toMoney(displayItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
    const currency = selectedCurrency || items[0]?.baseCurrency || 'USD';

    return {
      items: displayItems,
      totalQuantity,
      subtotal,
      currency,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
    };
  }, [baseCurrency, exchangeRates, items, selectedCurrency]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const value = useContext(CartContext);
  if (!value) {
    throw new Error('useCart must be used within CartProvider');
  }

  return value;
};
