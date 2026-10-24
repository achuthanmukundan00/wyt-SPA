# Agent instructions: watchyourtemper.com

Read this before building, deploying or touching hosting. Every rule here exists because an earlier deploy went to the wrong place.

## What serves what

| Address | Served by |
| --- | --- |
| `watchyourtemper.com` (site, store, `/api/*`) | Cloudflare Worker `watchyourtemper-api`, defined by `wrangler.jsonc` at this repo's root: `watchyourtemper-site/src/worker.ts` plus static assets from `watchyourtemper-site/dist`, plus the `OrderStoreDurableObject` (live order records) |
| `watchyourtemper.com/pressure-test/` | The same Worker's static assets: `watchyourtemper-site/public/pressure-test/`, a build copied from the `pressure-test` repository |

The Worker lives on the Cloudflare account **watchyourtemper** (`2be661efcc5940eba07b8f005d627a91`), reached by logging in as `hello.watchyourtemper@gmail.com`. `wrangler.jsonc` pins that `account_id`, so a deploy under any other login fails rather than creating a new Worker. Nothing else serves this site.

## Deploying

There is one way to deploy:

```sh
./deploy.sh --dry-run   # build the commit at HEAD and check it, upload nothing
./deploy.sh             # deploy HEAD, which must already be on origin/master
```

`deploy.sh` checks the wrangler login is the watchyourtemper account. It builds the commit in a clean checkout, so uncommitted files never ship. It deploys, then confirms the live site serves the new build, the API and PRESSURE TEST. If wrangler is logged in elsewhere, sign in to dash.cloudflare.com as `hello.watchyourtemper@gmail.com`, then run `wrangler logout && wrangler login`.

Do not:

- **Treat a push to GitHub as a deploy.** Nothing builds on push. A Cloudflare Pages project (`wyt-spa`) used to rebuild on every push without being on the domain; it was deleted on 2026-10-24.
- **Run `wrangler deploy` from `watchyourtemper-site/`, or with a config other than the root `wrangler.jsonc`.** That path created a stray Worker (`watchyourtemper-site`), deleted on 2026-10-24.
- **Re-add `@cloudflare/vite-plugin` or another build step that writes a `wrangler.json` into `dist/`.** That is what made the stray deploy possible.
- **Deploy to Vercel, Netlify or another Pages project.** The old Vercel link (`watchyourtemper-store`) is retired.
- **Change the Worker's name, Durable Object class or migrations without a plan for the stored orders.**

## PRESSURE TEST

PRESSURE TEST is developed in its own repository (`../pressure-test`, published under base path `/pressure-test/`). To publish a change to it:

1. In `pressure-test`, run `npm run check`, which builds `dist/`.
2. In `watchyourtemper-site/`, run `node scripts/sync-pressure-test.mjs`. It copies that `dist/` into `public/pressure-test/` and writes `public/_headers`, the security headers from `pressure-test/deploy/security-headers.conf.example`.
3. Commit, push to master, then run `./deploy.sh`.

Photos PRESSURE TEST marks private (`HIDDEN` in its `src/night.js`) are removed from its build and are never in `public/pressure-test/`.

## Working locally

From `watchyourtemper-site/`:

- `npm run dev` serves the front end only. `/api/*` does not exist there.
- For the store with its real API, run `npm run build`, then `npx wrangler dev` from the repo root. It uses `.dev.vars`, which holds **live** Stripe and Printful credentials: browse and fill the cart, but never submit a checkout locally.
- Checks: `npm run lint`, `npm run typecheck:worker`, `npm test`, `npm run build`, then `node scripts/design-check.mjs --playwright-module /path/to/@playwright/test/index.mjs` (browser checks against `dist/`).

## Design

See `watchyourtemper-site/DESIGN.md`. In short:

- No navbar on any page.
- Two type sizes.
- One 12-column grid.
- The whole site is shown through the CRT engine in `watchyourtemper-site/src/crt/`, shared with PRESSURE TEST; carry engine fixes across both copies.
- Artists' names keep their own casing: `nexusflipppp` is always lowercase.
