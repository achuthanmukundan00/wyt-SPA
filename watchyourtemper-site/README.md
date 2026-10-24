# watchyourtemper site

The React frontend and Cloudflare Worker behind [watchyourtemper.com](https://watchyourtemper.com).

The public experience links listeners to streaming services, redirects mailing-list signups to MailerLite, keeps an audio player mounted across client-side routes, and includes a Printful-backed merch store. The Worker serves the SPA and keeps catalog, pricing, checkout, webhook, and order-state logic out of the browser.

## Architecture

| Layer | Responsibility |
| --- | --- |
| React 19 + React Router | Public pages, persistent audio, product selection, cart, shipping form, and checkout UI |
| Vite + TypeScript | Frontend development and production asset build |
| Cloudflare Worker | Static asset serving, store API, input validation, and external-service calls |
| Durable Object | Checkout records, webhook idempotency, and fulfillment status |
| Printful | Product variants, retail prices, shipping estimates, and fulfillment |
| Stripe Checkout | Hosted payment collection |
| Resend | Optional order-confirmation email delivery |

Store requests send product IDs, variant IDs, and quantities—not trusted prices. The Worker reloads the corresponding Printful data, calculates charges from server-side values, verifies Stripe and Printful webhook credentials, and advances persisted order status without allowing ordinary status regressions.

## Routes

Frontend routes:

- `/` — entry page
- `/machine` — streaming-service links
- `/join` — MailerLite signup handoff
- `/store` — catalog, cart, shipping quote, and checkout
- `/store/success` and `/store/cancel` — Stripe return states

Worker routes:

| Method | Route | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Worker and Durable Object health response |
| `GET` | `/api/store/preferences` | Countries, currencies, exchange rates, and support address |
| `GET` | `/api/store/products` | Normalized Printful catalog |
| `GET` | `/api/store/products/:idOrSlug` | One normalized product |
| `GET` | `/api/store/image?src=` | Printful product picture, passed through so the CRT screen can draw it (https `files.cdn.printful.com` only, no redirects) |
| `POST` | `/api/store/checkout-intent` | Validate cart lines and return canonical item data |
| `POST` | `/api/store/shipping-quote` | Fetch shipping options and estimate final charges |
| `POST` | `/api/store/checkout-start` | Persist checkout state and create a Stripe Checkout Session |
| `POST` | `/api/webhooks/payment` | Verify Stripe events and create paid Printful orders |
| `POST` | `/api/webhooks/printful` | Verify fulfillment events and update order status |

## Local development

Requirements:

- Node.js 20.19+ or 22.12+
- npm
- Cloudflare, Printful, Stripe, and Resend accounts for exercising the complete commerce flow

From this directory:

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` serves the front end only. For the store with its API, run `npm run build`, then `npx wrangler dev` from the repository root; its `.dev.vars` holds live credentials, so never submit a checkout locally.

The root [`wrangler.jsonc`](../wrangler.jsonc) defines the Worker entrypoint, static asset binding, SPA fallback, and `OrderStoreDurableObject` migration.

### Environment variables

| Variable | Required for | Notes |
| --- | --- | --- |
| `PRINTFUL_TOKEN` | Catalog and fulfillment | Server-side token; never prefix it with `VITE_`. |
| `PRINTFUL_STORE_ID` | Optional store scoping | Sent to Printful when configured. |
| `STRIPE_SECRET_KEY` | Checkout creation | Server-side Stripe credential. |
| `STRIPE_WEBHOOK_SECRET` | Payment webhook | Used to verify Stripe's signature. |
| `PRINTFUL_WEBHOOK_SECRET` | Fulfillment webhook | Used to verify the Printful webhook token/signature. |
| `STORE_BASE_URL` | Checkout | Base URL used for Stripe success and cancel redirects. |
| `EMAIL_PROVIDER` | Optional email | Currently supports `resend`; defaults to it. |
| `RESEND_API_KEY` | Optional email | Confirmation mail is skipped when email configuration is incomplete. |
| `ORDER_CONFIRMATION_FROM_EMAIL` | Optional email | Sender address; also the default support address. |
| `SUPPORT_EMAIL` | Optional support link | Overrides the support address shown by the store. |
| `VITE_API_BASE_URL` | Split deployments | Browser-visible API origin; leave empty when assets and Worker share an origin. |

Use local development variables for testing and Wrangler secrets for deployed server credentials. Do not commit populated `.env` or `.dev.vars` files.

## Verification

```bash
npm run lint
npm run typecheck:worker
npm test
npm run build
```

The Vitest suite covers cart variant selection and pure Worker boundaries including checkout parsing, Stripe line-item construction, email rendering, shipping estimates, stable webhook IDs, and monotonic fulfillment status. It does not replace sandbox checkout tests against Stripe and Printful.

## Deployment

The Worker and the static app deploy together as the Worker `watchyourtemper-api`, defined by the repository-root `wrangler.jsonc`, on the Cloudflare account it pins. Deploy only with [`../deploy.sh`](../deploy.sh), from the repository root, after pushing to master. It builds the commit in a clean checkout, deploys it and checks the live site. Pushing to GitHub does not deploy, and `wrangler deploy` must never be run from this folder. [`../AGENTS.md`](../AGENTS.md) has the hosting details and the PRESSURE TEST publishing steps.

Before a deploy that changes the store:

1. Run the verification commands above.
2. Make sure the server-side secrets exist on the Worker (`wrangler secret list`).
3. Register any new payment or fulfillment webhook URLs with Stripe and Printful.
4. Exercise a sandbox checkout before enabling a real store drop.

## License

No open-source license is included. All rights reserved.
