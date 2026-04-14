# Printful API Integration Plan (replacing Stripe Payment Links)

Short answer: **yes, but not directly from the browser**.

The current site is frontend-only and uses hosted Stripe Payment Links. Printful API tokens must be kept secret, so Printful calls need to happen in a backend function (serverless is fine).

## Recommended flow

1. Customer clicks **Buy** in the React app.
2. Frontend calls your backend endpoint (e.g. `/api/checkout`).
3. Backend creates payment intent/session with your payment provider.
4. After payment succeeds, backend creates a Printful order via `POST /orders`.
5. Backend stores order IDs and listens for Printful webhooks (fulfillment + tracking updates).
6. Frontend shows confirmation and tracking status from your backend.

## Why not fully direct-to-Printful?

- Printful API is an order-fulfillment API, not a complete customer checkout UI.
- API credentials must never be exposed in client code.
- You still need customer payment handling, taxes, and fraud checks.

## Minimal backend endpoints to add

- `POST /api/checkout/start` - starts customer checkout.
- `POST /api/checkout/confirm` - verifies payment success.
- `POST /api/printful/orders` - creates Printful order after payment.
- `POST /api/printful/webhooks` - receives fulfillment/tracking updates.

## Data model additions

In product data, keep:

- `printfulVariantId`
- `retailPrice`
- `currency`
- `enabled`

In orders table, keep:

- `paymentProviderOrderId`
- `printfulOrderId`
- `status`
- `trackingNumber`
- `trackingUrl`

## Migration notes for this repo

- Keep Stripe links temporarily to avoid downtime.
- Add backend integration first, then swap Store buy buttons to your own `/checkout` route.
- Remove `stripeUrl` only after successful end-to-end testing in sandbox.
