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

## Next steps

1. Connect checkout intent response to payment session/intent creation.
2. Create Printful order after payment confirmation.
3. Add webhook endpoints for fulfillment/tracking updates.


## v2 lifecycle env vars

- `PAYMENT_PROVIDER` (`stripe`)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRINTFUL_WEBHOOK_SECRET`
- `STORE_BASE_URL`
