export type StoreVariant = {
  id: string;
  name: string;
  size: string;
  color: string;
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

export type CheckoutIntentStatus =
  | 'requires_payment'
  | 'paid'
  | 'order_created'
  | 'in_production'
  | 'shipped'
  | 'delivered'
  | 'fulfilled'
  | 'cancelled'
  | 'refunded';

export type CheckoutIntent = {
  intentId: string;
  status: CheckoutIntentStatus;
  lineItem: {
    productId: string;
    productTitle: string;
    variantId: string;
    variantName: string;
    unitPrice: number;
    currency: string;
    quantity: number;
    subtotal: number;
  };
  message: string;
};
