import crypto from 'node:crypto';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { __resetOrderStoreForTests, createCheckoutIntentRecord, getCheckoutIntentById } from './orderStore';
import { handlePaymentWebhook, handlePrintfulWebhook } from './webhooks';

const { createPrintfulOrderMock } = vi.hoisted(() => ({
  createPrintfulOrderMock: vi.fn(),
}));

vi.mock('./printfulClient', () => ({
  createPrintfulOrder: createPrintfulOrderMock,
}));

const stripeSignatureForBody = (body: string, secret: string) => {
  const timestamp = '1710000000';
  const payload = `${timestamp}.${body}`;
  const digest = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  return `t=${timestamp},v1=${digest}`;
};

describe('webhook lifecycle', () => {
  beforeEach(() => {
    __resetOrderStoreForTests();
    createPrintfulOrderMock.mockResolvedValue({ id: 9988, external_id: 'intent-1', status: 'draft' });
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.PRINTFUL_WEBHOOK_SECRET = 'printful_secret';
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  test('duplicate payment webhook does not create duplicate Printful orders', async () => {
    createCheckoutIntentRecord({
      intent: {
        intentId: 'intent-1',
        status: 'requires_payment',
        lineItem: {
          productId: 'tee-01',
          productTitle: 'Tee',
          variantId: '1234',
          variantName: 'Black / M',
          unitPrice: 30,
          currency: 'USD',
          quantity: 2,
          subtotal: 60,
        },
        message: '',
      },
      shipping: {
        name: 'Ava Fan',
        line1: '123 Ritual Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      customerEmail: 'fan@example.com',
      paymentProvider: 'stripe',
      paymentReferenceId: 'cs_123',
      idempotencyKey: 'key-1',
    });

    const body = JSON.stringify({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_123', metadata: { intentId: 'intent-1' } } },
    });

    const signature = stripeSignatureForBody(body, process.env.STRIPE_WEBHOOK_SECRET!);

    await handlePaymentWebhook(body, signature);
    await handlePaymentWebhook(body, signature);

    expect(createPrintfulOrderMock).toHaveBeenCalledTimes(1);
    expect(getCheckoutIntentById('intent-1')?.status).toBe('order_created');
  });

  test('duplicate printful webhook does not regress status transitions', async () => {
    createCheckoutIntentRecord({
      intent: {
        intentId: 'intent-2',
        status: 'requires_payment',
        lineItem: {
          productId: 'tee-01',
          productTitle: 'Tee',
          variantId: '1234',
          variantName: 'Black / M',
          unitPrice: 30,
          currency: 'USD',
          quantity: 1,
          subtotal: 30,
        },
        message: '',
      },
      shipping: {
        name: 'Ava Fan',
        line1: '123 Ritual Ave',
        city: 'Los Angeles',
        state: 'CA',
        postalCode: '90001',
        country: 'US',
      },
      customerEmail: 'fan@example.com',
      paymentProvider: 'stripe',
      paymentReferenceId: 'cs_999',
      idempotencyKey: 'key-2',
    });

    const printfulPayload = JSON.stringify({
      data: {
        order: { external_id: 'intent-2', status: 'shipped' },
        shipment: {
          tracking_number: 'TRACK123',
          tracking_url: 'https://carrier.example/TRACK123',
          carrier: 'UPS',
        },
      },
    });

    const signature = crypto.createHmac('sha256', process.env.PRINTFUL_WEBHOOK_SECRET!).update(printfulPayload).digest('hex');

    await handlePrintfulWebhook(printfulPayload, signature);
    await handlePrintfulWebhook(printfulPayload, signature);

    const record = getCheckoutIntentById('intent-2');
    expect(record?.status).toBe('shipped');
    expect(record?.trackingNumber).toBe('TRACK123');
  });
});
