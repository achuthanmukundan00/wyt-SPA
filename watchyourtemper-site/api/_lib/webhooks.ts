import crypto from 'node:crypto';
import { createPrintfulOrder } from './printfulClient';
import {
  getCheckoutIntentById,
  getCheckoutIntentByPaymentReference,
  isWebhookEventProcessed,
  markWebhookEventProcessed,
  updateCheckoutIntent,
} from './orderStore';

const getRawBody = (body: unknown) => {
  if (typeof body === 'string') {
    return body;
  }

  return JSON.stringify(body || {});
};

const safeJsonParse = <T>(rawBody: string) => {
  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error('Invalid webhook JSON body.');
  }
};

const verifyStripeSignature = (rawBody: string, signatureHeader?: string) => {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing STRIPE_WEBHOOK_SECRET environment variable.');
  }

  if (!signatureHeader) {
    throw new Error('Missing Stripe-Signature header.');
  }

  const parts = signatureHeader.split(',').map((part) => part.trim());
  const timestamp = parts.find((part) => part.startsWith('t='))?.slice(2);
  const signature = parts.find((part) => part.startsWith('v1='))?.slice(3);

  if (!timestamp || !signature) {
    throw new Error('Malformed Stripe-Signature header.');
  }

  const signedPayload = `${timestamp}.${rawBody}`;
  const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

  const valid = crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) {
    throw new Error('Invalid Stripe webhook signature.');
  }
};

type StripeEvent = {
  id: string;
  type: string;
  data?: {
    object?: {
      id?: string;
      metadata?: Record<string, string>;
    };
  };
};

export const handlePaymentWebhook = async (rawBody: string, signatureHeader?: string) => {
  verifyStripeSignature(rawBody, signatureHeader);
  const event = safeJsonParse<StripeEvent>(rawBody);

  if (!event.id) {
    throw new Error('Missing Stripe event id.');
  }

  if (isWebhookEventProcessed(event.id)) {
    return { ok: true, duplicate: true };
  }

  if (event.type !== 'checkout.session.completed') {
    markWebhookEventProcessed(event.id);
    return { ok: true, ignored: true };
  }

  const object = event.data?.object;
  const intentId = object?.metadata?.intentId;
  const paymentReferenceId = object?.id;

  const record =
    (intentId ? getCheckoutIntentById(intentId) : null) ||
    (paymentReferenceId ? getCheckoutIntentByPaymentReference(paymentReferenceId) : null);

  if (!record) {
    markWebhookEventProcessed(event.id);
    return { ok: true, ignored: true, reason: 'intent_not_found' };
  }

  if (record.status === 'order_created' || record.status === 'in_production' || record.status === 'shipped') {
    markWebhookEventProcessed(event.id);
    return { ok: true, duplicate: true };
  }

  if (record.status === 'requires_payment') {
    updateCheckoutIntent(record.intentId, { status: 'paid' });
  }

  const printfulOrder = await createPrintfulOrder({
    externalId: record.intentId,
    recipient: {
      name: record.shipping.name,
      address1: record.shipping.line1,
      address2: record.shipping.line2,
      city: record.shipping.city,
      state_code: record.shipping.state,
      zip: record.shipping.postalCode,
      country_code: record.shipping.country,
      email: record.customerEmail,
    },
    items: [
      {
        variant_id: Number(record.lineItem.variantId),
        quantity: record.lineItem.quantity,
      },
    ],
  });

  updateCheckoutIntent(record.intentId, {
    status: 'order_created',
    printfulOrderId: String(printfulOrder.id),
    printfulExternalId: printfulOrder.external_id || record.intentId,
    fulfillmentStatus: printfulOrder.status || 'draft',
  });

  markWebhookEventProcessed(event.id);
  return { ok: true };
};

type PrintfulWebhookEvent = {
  type?: string;
  event?: string;
  data?: {
    order?: {
      external_id?: string;
      status?: string;
    };
    shipment?: {
      tracking_number?: string;
      tracking_url?: string;
      carrier?: string;
    };
  };
  order?: {
    external_id?: string;
    status?: string;
  };
  shipment?: {
    tracking_number?: string;
    tracking_url?: string;
    carrier?: string;
  };
};

const verifyPrintfulWebhook = (rawBody: string, signatureHeader?: string, authorizationHeader?: string) => {
  const secret = process.env.PRINTFUL_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('Missing PRINTFUL_WEBHOOK_SECRET environment variable.');
  }

  if (signatureHeader) {
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const isValid = crypto.timingSafeEqual(Buffer.from(signatureHeader), Buffer.from(expected));
    if (isValid) {
      return;
    }
  }

  if (authorizationHeader === `Bearer ${secret}`) {
    return;
  }

  throw new Error('Invalid Printful webhook signature/token.');
};

const toStatusFromPrintful = (status?: string) => {
  switch (status) {
    case 'fulfilled':
      return 'delivered';
    case 'shipped':
      return 'shipped';
    case 'inprocess':
      return 'in_production';
    case 'canceled':
      return 'cancelled';
    default:
      return undefined;
  }
};

export const handlePrintfulWebhook = async (
  rawBody: string,
  signatureHeader?: string,
  authorizationHeader?: string,
) => {
  verifyPrintfulWebhook(rawBody, signatureHeader, authorizationHeader);
  const event = safeJsonParse<PrintfulWebhookEvent>(rawBody);
  const payload = event.data || event;

  const externalId = payload.order?.external_id;
  if (!externalId) {
    return { ok: true, ignored: true, reason: 'external_id_missing' };
  }

  const record = getCheckoutIntentById(externalId);
  if (!record) {
    return { ok: true, ignored: true, reason: 'intent_not_found' };
  }

  const status = toStatusFromPrintful(payload.order?.status);
  updateCheckoutIntent(record.intentId, {
    status: status || record.status,
    fulfillmentStatus: payload.order?.status || record.fulfillmentStatus,
    trackingNumber: payload.shipment?.tracking_number || record.trackingNumber,
    trackingUrl: payload.shipment?.tracking_url || record.trackingUrl,
    carrier: payload.shipment?.carrier || record.carrier,
  });

  return { ok: true };
};

export const getWebhookRawBody = getRawBody;
