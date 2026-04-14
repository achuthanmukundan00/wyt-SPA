import type { CheckoutIntent } from './types';
import { getStoreProductByIdOrSlug } from './printfulClient';

export type CheckoutIntentInput = {
  productId: string;
  variantId: string;
  quantity: number;
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
