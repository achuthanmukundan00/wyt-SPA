# watchyourtemper.com

Source for [watchyourtemper.com](https://watchyourtemper.com), the artist site and merch store for watchyourtemper.

The project pairs a React single-page app with a Cloudflare Worker that serves the built assets and owns the store API. The same deployment handles the music links, mailing-list handoff, cart and checkout UI, Printful catalog data, Stripe Checkout, fulfillment webhooks, and durable order state.

## Repository layout

```text
.
├── watchyourtemper-site/   # React app, Worker, tests, and technical docs
└── wrangler.jsonc          # Cloudflare Worker, assets, and Durable Object config
```

See [`watchyourtemper-site/README.md`](watchyourtemper-site/README.md) for the architecture, environment variables, API routes, and deployment notes.

## Local setup

```bash
git clone https://github.com/achuthanmukundan00/wyt-SPA.git
cd wyt-SPA/watchyourtemper-site
npm install
cp .env.example .env
npm run dev
```

The public pages can run locally without completing a purchase. Catalog, shipping, payment, fulfillment, and email flows require the corresponding external-service credentials described in the app README.

## Checks

Run from `watchyourtemper-site/`:

```bash
npm run lint
npm run typecheck:worker
npm test
npm run build
```

## Deploying

Run `./deploy.sh` from the repository root (`./deploy.sh --dry-run` to check without uploading). Pushing to GitHub does not deploy. [`AGENTS.md`](AGENTS.md) explains where the site is hosted, which Cloudflare account it is on, and how PRESSURE TEST is published at `/pressure-test/`.

## License

No open-source license is included. All rights reserved.
