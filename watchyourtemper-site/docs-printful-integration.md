# Printful Store Migration Note (v1 implemented)

## Discovery summary

- Framework: React + TypeScript + Vite SPA (`react-router-dom`).
- Previous store architecture: frontend-only page (`src/pages/Store.tsx`) + hardcoded product data (`src/data/storeProducts.ts`) with direct Stripe Payment Links.
- Existing backend surface: none.
- Chosen backend integration point: minimal serverless API routes under `api/` (Vercel-compatible pattern).

## Implemented architecture

- Frontend now calls backend endpoints for catalog and checkout-intent flows.
- Backend owns all Printful API communication and reads token config from environment variables.
- Product/variant data is normalized to frontend-safe shapes (`id`, `slug`, `title`, `image`, `variants[]`, `size`, `color`, `price`, `availability`).
- Checkout intent route performs server-side validation for product, variant, and quantity, then returns canonical line-item data.

## Security posture

- `PRINTFUL_TOKEN` is server-only.
- Browser does not call Printful directly.
- Browser-submitted prices are ignored.
- Quantity and variant IDs are validated on the server.

## Assumptions

- Deployment will use a platform that supports `api/` serverless routes.
- Current phase prepares payment and order automation but does not process live payment yet.

## Lifecycle status

1. ✅ Checkout intent is connected to payment-session creation via `POST /api/store/checkout-start`.
2. ✅ Printful order creation occurs after payment confirmation in Stripe webhook handling.
3. ✅ Webhook endpoints exist for fulfillment/tracking updates.
4. ✅ Frontend now uses modal-based variant selection + persistent cart UX.

## Pricing and charge integrity

- Use Printful variant `retail_price` as the canonical catalog price.
- Recompute line-item totals server-side (product + variant + quantity) before creating Stripe session.
- Never trust browser-submitted unit prices.


## v2 lifecycle env vars

- `PAYMENT_PROVIDER` (`stripe`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRINTFUL_WEBHOOK_SECRET`
- `STORE_BASE_URL`
