import type { CheckoutIntent } from './types';
import type { ShippingAddress } from './orderStore';
import { getStoreProductByIdOrSlug } from './printfulClient';

export type CheckoutIntentInput = {
  productId: string;
  variantId: string;
  quantity: number;
};

export type CheckoutStartInput = CheckoutIntentInput & {
  customer: {
    email: string;
  };
  shippingAddress: ShippingAddress;
};

export const parseCheckoutInput = (body: unknown): CheckoutIntentInput => {
  if (!body || typeof body !== 'object') {
    throw new Error('Invalid request body.');
  }

  const parsed = body as Partial<CheckoutIntentInput>;

  if (!parsed.productId || typeof parsed.productId !== 'string') {
    throw new Error('productId is required.');
  }

  if (!parsed.variantId || typeof parsed.variantId !== 'string') {
    throw new Error('variantId is required.');
  }

  const quantity = Number(parsed.quantity);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
    throw new Error('quantity must be an integer between 1 and 20.');
  }

  return {
    productId: parsed.productId,
    variantId: parsed.variantId,
    quantity,
  };
};

const parseShippingAddress = (value: unknown): ShippingAddress => {
  if (!value || typeof value !== 'object') {
    throw new Error('shippingAddress is required.');
  }

  const shipping = value as Partial<ShippingAddress>;

  const requiredFields: Array<keyof ShippingAddress> = ['name', 'line1', 'city', 'state', 'postalCode', 'country'];
  for (const field of requiredFields) {
    const fieldValue = shipping[field];
    if (!fieldValue || typeof fieldValue !== 'string') {
      throw new Error(`shippingAddress.${field} is required.`);
    }
  }

  return {
    name: shipping.name!,
    line1: shipping.line1!,
    line2: typeof shipping.line2 === 'string' ? shipping.line2 : undefined,
    city: shipping.city!,
    state: shipping.state!,
    postalCode: shipping.postalCode!,
    country: shipping.country!,
  };
};

export const parseCheckoutStartInput = (body: unknown): CheckoutStartInput => {
  const base = parseCheckoutInput(body);
  const parsed = body as { customer?: { email?: string }; shippingAddress?: unknown };

  if (!parsed.customer?.email || typeof parsed.customer.email !== 'string') {
    throw new Error('customer.email is required.');
  }

  return {
    ...base,
    customer: {
      email: parsed.customer.email,
    },
    shippingAddress: parseShippingAddress(parsed.shippingAddress),
  };
};

export const buildCheckoutIntent = async (input: CheckoutIntentInput): Promise<CheckoutIntent> => {
  const product = await getStoreProductByIdOrSlug(input.productId);

  if (!product) {
    throw new Error('Product not found.');
  }

  const variant = product.variants.find((item) => item.id === input.variantId);

  if (!variant || !variant.availability) {
    throw new Error('Variant unavailable.');
  }

  const subtotal = Number((variant.price * input.quantity).toFixed(2));

  return {
    intentId: crypto.randomUUID(),
    status: 'requires_payment',
    lineItem: {
      productId: product.id,
      productTitle: product.title,
      variantId: variant.id,
      variantName: variant.name,
      unitPrice: variant.price,
      currency: variant.currency,
      quantity: input.quantity,
      subtotal,
    },
    message: 'Checkout intent created. Attach payment provider next.',
  };
};
