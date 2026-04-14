import type { CheckoutIntent } from './types';

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

export type ShippingAddress = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CheckoutIntentRecord = {
  intentId: string;
  status: CheckoutIntentStatus;
  lineItem: CheckoutIntent['lineItem'];
  shipping: ShippingAddress;
  customerEmail: string;
  paymentProvider: string;
  paymentReferenceId: string;
  printfulOrderId?: string;
  printfulExternalId?: string;
  fulfillmentStatus?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  carrier?: string;
  createdAt: string;
  updatedAt: string;
};

const intents = new Map<string, CheckoutIntentRecord>();
const paymentSessionIndex = new Map<string, string>();
const idempotencyIndex = new Map<string, string>();
const processedWebhookEvents = new Set<string>();

const nowIso = () => new Date().toISOString();

export const createCheckoutIntentRecord = (input: {
  intent: CheckoutIntent;
  shipping: ShippingAddress;
  customerEmail: string;
  paymentProvider: string;
  paymentReferenceId: string;
  idempotencyKey: string;
}) => {
  const existingIntentId = idempotencyIndex.get(input.idempotencyKey);

  if (existingIntentId) {
    const existing = intents.get(existingIntentId);
    if (existing) {
      return existing;
    }
  }

  const createdAt = nowIso();
  const record: CheckoutIntentRecord = {
    intentId: input.intent.intentId,
    status: 'requires_payment',
    lineItem: input.intent.lineItem,
    shipping: input.shipping,
    customerEmail: input.customerEmail,
    paymentProvider: input.paymentProvider,
    paymentReferenceId: input.paymentReferenceId,
    createdAt,
    updatedAt: createdAt,
  };

  intents.set(record.intentId, record);
  idempotencyIndex.set(input.idempotencyKey, record.intentId);
  paymentSessionIndex.set(record.paymentReferenceId, record.intentId);

  return record;
};

export const getCheckoutIntentById = (intentId: string) => intents.get(intentId) || null;

export const getCheckoutIntentByPaymentReference = (paymentReferenceId: string) => {
  const intentId = paymentSessionIndex.get(paymentReferenceId);
  if (!intentId) {
    return null;
  }

  return getCheckoutIntentById(intentId);
};

export const updateCheckoutIntent = (intentId: string, patch: Partial<CheckoutIntentRecord>) => {
  const existing = intents.get(intentId);
  if (!existing) {
    return null;
  }

  const updated: CheckoutIntentRecord = {
    ...existing,
    ...patch,
    intentId: existing.intentId,
    updatedAt: nowIso(),
  };
  intents.set(intentId, updated);

  return updated;
};

export const isWebhookEventProcessed = (eventId: string) => processedWebhookEvents.has(eventId);

export const markWebhookEventProcessed = (eventId: string) => {
  processedWebhookEvents.add(eventId);
};

export const __resetOrderStoreForTests = () => {
  intents.clear();
  paymentSessionIndex.clear();
  idempotencyIndex.clear();
  processedWebhookEvents.clear();
};
