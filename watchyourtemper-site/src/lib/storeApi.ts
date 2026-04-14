import type { ChargeSummary, ShippingRateOption, CheckoutIntent, StoreProduct } from '../types/store';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const parseJson = async <T>(response: Response): Promise<T> => {
  const payload = (await response.json()) as T & { error?: string };

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

export const fetchStoreProducts = async (currency?: string): Promise<StoreProduct[]> => {
  const query = currency ? `?currency=${encodeURIComponent(currency)}` : '';
  const response = await fetch(`${API_BASE}/api/store/products${query}`);
  const payload = await parseJson<{ products: StoreProduct[] }>(response);
  return payload.products;
};

export type StoreCountryPreference = {
  code: string;
  name: string;
  region?: string;
};

export type StorePreferencesResponse = {
  detectedCountry: string;
  defaultCurrency: string;
  countries: StoreCountryPreference[];
  currencies: string[];
  exchangeRates: Record<string, number>;
  baseCurrency: string;
};

export const fetchStorePreferences = async (): Promise<StorePreferencesResponse> => {
  const response = await fetch(`${API_BASE}/api/store/preferences`);
  return parseJson<StorePreferencesResponse>(response);
};

export const createCheckoutIntent = async (input: {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
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

export type CheckoutStartInput = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  customer: { email: string };
  currency: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  shippingRateId?: string;
};

export type ShippingQuoteInput = {
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
  recipient: {
    name?: string;
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  currency: string;
  shippingRateId?: string;
};

type ShippingQuoteRequestOptions = {
  signal?: AbortSignal;
};

export type ShippingQuoteResponse = {
  selectedShippingRateId: string;
  shippingOptions: ShippingRateOption[];
  chargeSummary: ChargeSummary | null;
};

export const fetchShippingQuote = async (
  input: ShippingQuoteInput,
  options: ShippingQuoteRequestOptions = {},
): Promise<ShippingQuoteResponse> => {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}/api/store/shipping-quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
      signal: options.signal,
    });
  } catch (error) {
    throw new Error(error instanceof Error ? `Shipping quote request failed: ${error.message}` : 'Shipping quote request failed.');
  }

  return parseJson<ShippingQuoteResponse>(response);
};

export const createCheckoutStart = async (input: CheckoutStartInput) => {
  const response = await fetch(`${API_BASE}/api/store/checkout-start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const payload = await parseJson<{ payment: { checkoutUrl: string } }>(response);
  return payload;
};
