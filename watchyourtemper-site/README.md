# WATCHYOURTEMPER

**Your rage is sacred. Let it speak.**

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
| Deployment   | GitHub Pages / Vercel / Netlify (recommended) |

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

---

## 🧟‍♀️ Design Philosophy

This site is not a product — it’s a **ritual**.

No unnecessary hover states. No rounded corners. No algorithm-chasing fluff.

Instead, it leans into:

* **Corruption** over clarity
* **Silence** over spectacle
* **Feeling** over functionality

---

## 🩸 Inner Circle

This site links to a private supporters' mailing list through [MailerLite](https://www.mailerlite.com/), where listeners receive exclusive content, Bandcamp codes, and early access to rituals.

---


## 🛒 Store (Printful-backed catalog + server-side checkout intent)

The store now loads catalog + variant data from backend endpoints that integrate with Printful using a **server-side token**.

### Architecture (v1)

- Frontend `src/pages/Store.tsx` calls backend routes, not Stripe links.
- Backend routes live under `api/store/*`.
- Printful API calls are centralized in `api/_lib/printfulClient.ts`.
- `POST /api/store/checkout-intent` validates product/variant/quantity server-side and returns canonical line-item data for future payment + order automation.

### Required environment variables

Copy `.env.example` and set values:

- `PRINTFUL_TOKEN` (required, server-only)
- `PRINTFUL_STORE_ID` (optional for future store scoping)
- `VITE_API_BASE_URL` (optional when frontend and API are split across domains)

### API routes

- `GET /api/store/products`
- `GET /api/store/products/<id-or-slug>`
- `POST /api/store/checkout-intent`

### What remains for full live ordering

- Connect checkout intents to your payment processor session/intent creation.
- On successful payment, create real Printful orders server-side.
- Add webhook handlers for fulfillment/tracking sync.

---

## 📦 Deployment

Recommended: [Vercel](https://vercel.com/) or [Netlify](https://netlify.com/)

Build:

```bash
npm run build
```

Deploy the `dist/` folder to your static host of choice.

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
