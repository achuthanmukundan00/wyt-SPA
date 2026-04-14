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


## 🛒 Store (Stripe now, Printful API-ready path)

The current merch store is frontend-only and uses hosted Stripe Payment Links.

- Edit product data in `src/data/storeProducts.ts`.
- Paste each Stripe URL into `stripeUrl` and set `enabled: true` for products you want live.
- Add product images to `public/assets/images/store/` and set each product `image` path (example: `/assets/images/store/watchyourtemper-tee.jpg`).
- Store UI route/page lives at `src/pages/Store.tsx` and is available at `/store`.

### Printful API note

You can integrate Printful, but **not directly from browser-only code** (API token exposure risk).
Use a backend/serverless layer to create orders after successful checkout.

See implementation notes in `docs-printful-integration.md`.

Files changed for this feature:
- `src/data/storeProducts.ts`
- `src/pages/Store.tsx`
- `src/App.tsx`
- `src/components/Navbar.tsx`
- `src/styles/index.css`
- `README.md`

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
