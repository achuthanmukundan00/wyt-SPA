# WATCHYOURTEMPER

**Enter here.**

This is the official interactive website for [WatchYourTemper](https://www.instagram.com/watchyourtemper)

---

## 🕳 Overview

Built as a **React + Vite single-page application**, this interface merges:

- Cinematic background video loops
- Ambient scanlines, corruption FX, and digital decay
- A ritualistic UI for streaming platform selection
- Mailing list integration (the Inner Circle)

It prioritizes **immersive continuity**, keeping audio, visuals, and interaction coherent across the entire experience.

---

## 🛠 Tech Stack

| Layer        | Technology              |
|--------------|--------------------------|
| Frontend     | React (TypeScript + Vite) |
| Styling      | Custom CSS (no Tailwind) |
| Assets       | MP4 background loops, SVG/PNG icons, custom overlays |
| Deployment   | Cloudflare Workers + static assets |

---

## 🌑 File Structure (Core)

```

/
├── public/
│   ├── assets/
│   │   ├── videos/        ← Background video loops
│   │   ├── textures/      ← Scanlines / chromatic overlays
│   │   └── icons/         ← Streaming platform icons
├── src/
│   ├── components/
│   │   └── FeedTheMachine.tsx  ← Main ritual interface
│   ├── styles/
│   │   └── index.css      ← Global brutalist styles
│   └── main.tsx
├── index.html
└── README.md

````

---

## 🧪 Development

### 1. Clone the repo
```bash
git clone https://github.com/your-username/watchyourtemper.git
cd watchyourtemper
````

### 2. Install dependencies

```bash
npm install
```

### 3. Run the dev server

```bash
npm run dev
```

## 🩸 Inner Circle

This site links to a private supporters' mailing list through [MailerLite](https://www.mailerlite.com/), where listeners receive exclusive content, Bandcamp codes, and early access to rituals.

---


## 🛒 Store (Printful-backed catalog + Worker checkout lifecycle)

The store now loads catalog + variant data from backend endpoints that integrate with Printful using a **server-side token**.

### Architecture

- Frontend `src/pages/Store.tsx` calls backend routes, not Stripe links.
- Cloudflare Worker entrypoint lives in `src/worker.ts`.
- Durable order + webhook state lives in the `OrderStoreDurableObject`.
- `POST /api/store/checkout-intent` validates product/variant/quantity server-side and returns canonical cart data for payment + order automation.

### Required environment variables

Copy `.env.example` and set values:

- `PRINTFUL_TOKEN` (required, server-only)
- `PRINTFUL_STORE_ID` (optional for future store scoping)
- `VITE_API_BASE_URL` (optional when frontend and API are split across domains)
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PRINTFUL_WEBHOOK_SECRET`
- `STORE_BASE_URL`
- `EMAIL_PROVIDER` (`resend`)
- `RESEND_API_KEY`
- `ORDER_CONFIRMATION_FROM_EMAIL`
- `SUPPORT_EMAIL` (optional, defaults to `ORDER_CONFIRMATION_FROM_EMAIL` for the store support link)

### API routes

- `GET /api/store/products`
- `GET /api/store/products/<id-or-slug>`
- `POST /api/store/checkout-intent`
- `POST /api/store/checkout-start`
- `POST /api/webhooks/payment`
- `POST /api/webhooks/printful`

### Lifecycle status (v2)

- Worker creates a Stripe Checkout Session from server-validated line-item data.
- Stripe webhook confirms payment and creates Printful orders.
- Printful webhook syncs fulfillment/tracking updates back to durable checkout records.
- After a Printful order is successfully created, the payment webhook attempts to send an order confirmation email to the checkout email address.

### Pricing source of truth

- Variant prices are read from Printful product data (`retail_price`) and normalized server-side.
- Checkout amounts are calculated on the server from the selected variant + quantity (browser price input is ignored).
- Stripe Checkout `unit_amount` is derived from the server-validated variant price to avoid client-side tampering.

---

## 📦 Deployment

Deploy through Cloudflare Workers/Wrangler. The Worker serves both the API routes and the static app asset bundle.

Build:

```bash
npm run build
```

Then publish with Wrangler using the checked-in `wrangler.jsonc`.

---

## ⚠️ License

This codebase is © 2025 WatchYourTemper (Achuthan Mukundan). All rights reserved.

If you're inspired by the ritual — cite it, don’t steal it.

---

## 🕷 Credits

* Visuals & Creative Direction: [@watchyourtemper](https://www.instagram.com/watchyourtemper)
* Ritual Interface: Built with intention and decay

---

> *In the end, they won't remember you.
