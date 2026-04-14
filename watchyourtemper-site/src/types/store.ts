export type StoreVariant = {
  id: string;
  catalogVariantId?: number;
  name: string;
  size: string;
  color: string;
  basePrice: number;
  baseCurrency: string;
  price: number;
  currency: string;
  availability: boolean;
};

export type StoreProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  image: string;
  variants: StoreVariant[];
};

export type ShippingRateOption = {
  id: string;
  name: string;
  rate: number;
  currency: string;
  minDeliveryDays?: number;
  maxDeliveryDays?: number;
};

export type ChargeSummary = {
  currency: string;
  itemSubtotal: number;
  shipping: number;
  tax: number;
  vat: number;
  digitization: number;
  additionalFee: number;
  fulfillmentFee: number;
  retailDeliveryFee: number;
  total: number;
};

export type CheckoutIntent = {
  intentId: string;
  status: 'requires_payment' | 'paid' | 'order_created' | 'in_production' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  items: Array<{
    productId: string;
    productTitle: string;
    productImage: string;
    variantId: string;
    variantName: string;
    size: string;
    color: string;
    unitPrice: number;
    currency: string;
    quantity: number;
    subtotal: number;
  }>;
  totals: {
    currency: string;
    subtotal: number;
    quantity: number;
  };
  shippingRateId?: string;
  chargeSummary?: ChargeSummary | null;
  message: string;
};
