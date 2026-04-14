import { buildCheckoutIntent, parseCheckoutStartInput } from '../_lib/checkout';
import { createCheckoutIntentRecord } from '../_lib/orderStore';
import { createStripeCheckoutSession } from '../_lib/payment';

const sendJson = (res: any, statusCode: number, body: unknown) => {
  res.status(statusCode).setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(body));
};

const checkoutStartIdempotencyKey = (input: {
  productId: string;
  variantId: string;
  quantity: number;
  email: string;
}) => `${input.productId}:${input.variantId}:${input.quantity}:${input.email.toLowerCase()}`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const input = parseCheckoutStartInput(req.body);
    const intent = await buildCheckoutIntent(input);
    const idempotencyKey = checkoutStartIdempotencyKey({
      productId: intent.lineItem.productId,
      variantId: intent.lineItem.variantId,
      quantity: intent.lineItem.quantity,
      email: input.customer.email,
    });

    const payment = await createStripeCheckoutSession({
      intent,
      customerEmail: input.customer.email,
      storeBaseUrl: process.env.STORE_BASE_URL || 'http://localhost:5173',
      idempotencyKey,
    });

    createCheckoutIntentRecord({
      intent,
      shipping: input.shippingAddress,
      customerEmail: input.customer.email,
      paymentProvider: payment.provider,
      paymentReferenceId: payment.checkoutSessionId,
      idempotencyKey,
    });

    return sendJson(res, 200, {
      intent,
      payment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected server error';
    const status =
      message.includes('required') || message.includes('quantity') || message.includes('Unsupported PAYMENT_PROVIDER')
        ? 400
        : 422;

    return sendJson(res, status, { error: message });
  }
}
