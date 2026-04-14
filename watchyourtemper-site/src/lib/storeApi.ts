import type { CheckoutIntent, StoreProduct } from '../types/store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

export const fetchStoreProducts = async (): Promise<StoreProduct[]> => {
  const response = await fetch(`${API_BASE}/api/store/products`);
  const payload = await parseJson<{ products: StoreProduct[] }>(response);
  return payload.products;
};

export const createCheckoutIntent = async (input: {
  productId: string;
  variantId: string;
  quantity: number;
}): Promise<CheckoutIntent> => {
  const response = await fetch(`${API_BASE}/api/store/checkout-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseJson<{ intent: CheckoutIntent }>(response);
  return payload.intent;
};
