# Printful Store Migration Note

## Discovery summary

- Framework: React + TypeScript + Vite SPA (`react-router-dom`).
- Previous store architecture: frontend-only page (`src/pages/Store.tsx`) + hardcoded product data (`src/data/storeProducts.ts`) with direct Stripe Payment Links.
- Chosen backend integration point: Cloudflare Worker in `src/worker.ts`.
- Durable persistence is handled by a Cloudflare Durable Object.

## Implemented architecture

- Frontend now calls backend endpoints for catalog and checkout-intent flows.
- Backend owns all Printful API communication and reads token config from environment variables.
- Product/variant data is normalized to frontend-safe shapes (`id`, `slug`, `title`, `image`, `variants[]`, `size`, `color`, `price`, `availability`).
- Checkout intent route performs server-side validation for cart items and returns canonical line-item data.
- Checkout session creation, webhook replay protection, and order status updates all run through the Worker.

## Security posture

- `PRINTFUL_TOKEN` is server-only.
- Browser does not call Printful directly.
- Browser-submitted prices are ignored.
- Quantity and variant IDs are validated on the server.

## Assumptions

- Deployment uses Cloudflare Workers + static assets.
- Durable Object storage is the source of truth for checkout + webhook lifecycle state.

## Lifecycle status

1. ✅ Checkout intent is connected to payment-session creation via `POST /api/store/checkout-start`.
2. ✅ Printful order creation occurs after payment confirmation in Stripe webhook handling.
3. ✅ Webhook endpoints exist for fulfillment/tracking updates.
4. ✅ Frontend now uses modal-based variant selection + persistent multi-item cart UX.
5. ✅ Webhook replay protection is persisted in Durable Object storage.

## Pricing and charge integrity

- Use Printful variant `retail_price` as the canonical catalog price.
- Recompute cart totals server-side (product + variant + quantity) before creating Stripe session.
- Never trust browser-submitted unit prices.
