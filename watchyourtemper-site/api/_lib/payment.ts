import type { CheckoutIntent } from './types';

const STRIPE_API_BASE = 'https://api.stripe.com/v1';

type StartPaymentInput = {
  intent: CheckoutIntent;
  customerEmail: string;
  storeBaseUrl: string;
  idempotencyKey: string;
};

export type PaymentStartResult = {
  provider: 'stripe';
  checkoutSessionId: string;
  checkoutUrl: string;
};

const getRequiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable.`);
  }

  return value;
};

const getProvider = () => {
  const provider = process.env.PAYMENT_PROVIDER || 'stripe';
  if (provider !== 'stripe') {
    throw new Error(`Unsupported PAYMENT_PROVIDER: ${provider}`);
  }

  return provider;
};

export const createStripeCheckoutSession = async (input: StartPaymentInput): Promise<PaymentStartResult> => {
  getProvider();

  const secretKey = getRequiredEnv('STRIPE_SECRET_KEY');
  const successUrl = new URL('/store/success?intentId={CHECKOUT_SESSION_ID}', input.storeBaseUrl).toString();
  const cancelUrl = new URL('/store/cancel', input.storeBaseUrl).toString();

  const body = new URLSearchParams({
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    'line_items[0][quantity]': String(input.intent.lineItem.quantity),
    'line_items[0][price_data][currency]': input.intent.lineItem.currency.toLowerCase(),
    'line_items[0][price_data][unit_amount]': String(Math.round(input.intent.lineItem.unitPrice * 100)),
    'line_items[0][price_data][product_data][name]': `${input.intent.lineItem.productTitle} - ${input.intent.lineItem.variantName}`,
    customer_email: input.customerEmail,
    'metadata[intentId]': input.intent.intentId,
    'metadata[productId]': input.intent.lineItem.productId,
    'metadata[variantId]': input.intent.lineItem.variantId,
    'metadata[quantity]': String(input.intent.lineItem.quantity),
  });

  const response = await fetch(`${STRIPE_API_BASE}/checkout/sessions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Idempotency-Key': input.idempotencyKey,
    },
    body,
  });

  const payload = (await response.json()) as { id?: string; url?: string; error?: { message?: string } };

  if (!response.ok || !payload.id || !payload.url) {
    throw new Error(payload.error?.message || 'Failed to create Stripe checkout session.');
  }

  return {
    provider: 'stripe',
    checkoutSessionId: payload.id,
    checkoutUrl: payload.url,
  };
};
