# Artist site design

The site uses the same system as the [PRESSURE TEST site](https://github.com/achuthanmukundan00/pressure-test), and the same CRT engine shows it.

## Composition

- No navbar on any page. Home is the wordmark and one way in ("feed the machine ↓"); every other page opens on the wordmark, which leads home. Outbound links live in the sections and the footer. The listening page keeps all five original platform URLs, and PRESSURE TEST links to `/pressure-test/` on the main host.
- Two type sizes on the whole site: text (16px on phones, 20px on desktops, weight 500) and display (36px to 72px) for the line that opens a page or section. Line heights and gaps are whole 4px scanlines. Close marks are drawn as SVG, not set as a third size.
- One 12-column grid (4 below 48rem), everything flush left on a column line. What answers a section's title stands halfway across, its last line on the baseline of what it answers.
- The store's ship-to, currency and cart sit in the store page. Product cards share a height so prices and "Select options" line up. Spending money is the one solid button.
- Dark only. Stored light preferences are ignored. Space Grotesk is self-hosted, copied from the PRESSURE TEST assets (originally Google Fonts); the SIL Open Font License is at `public/fonts/space-grotesk/LICENSE.txt`.

Store variant, cart, API and payment logic are unchanged.

## The CRT screen

`src/crt/` is the PRESSURE TEST engine (`crt.js`, `crt-paint.js`, `crt-gl.js`, `crt-math.js`). The page stays the document underneath an opaque, pointer-transparent canvas; the engine draws what the browser laid out into WebGL2 textures and shows it through one tube shader. Without hardware WebGL2, in forced colours, in print, on a device too slow to scroll it, or with the switch off (remembered as `wyt-crt`), the page shows itself through the flat CSS glass. The engine's maths is unit tested in the PRESSURE TEST repository; carry fixes across both copies.

This copy adds what a store needs:

- Form fields are drawn: values, placeholders, a select's chosen option and the caret. Their platform drawing is turned off (`appearance: none`; selects use `FieldSelect`, whose arrow is a glyph in the page).
- Fixed layers (site controls, cart, dialogs, toast) are rendered into `<body>` through `Layer`, under the screen (z-index 50) and the flat glass (42), so the screen draws them and lines their hit areas up with what it shows.
- Panels that scroll inside the page repaint on their own scroll.
- Printful pictures are passed through the Worker (`/api/store/image`, https `files.cdn.printful.com` only, no redirects), so they are same-origin and drawn like the rest of the page.

## Derived assets

Original files remain untouched under `public/assets/images/`:

| New local asset | Existing source | Dimensions |
| --- | --- | --- |
| `wordmark.webp` | `logo.png`, surrounding empty space cropped | 2407 × 498 |
| `chains.webp` | `wyt-burying-5b.png`, resized | 1440 × 810 |
| `mirror.webp` | `wyt-burying-7.jpg`, resized | 960 × 540 |

Existing artwork and audio rights still need the owner's publication clearance; this redesign does not establish them.

## Local verification

```sh
npm run lint
npm run typecheck:worker
npm test
CF_PAGES=1 npm run build
node scripts/design-check.mjs --playwright-module /absolute/path/to/@playwright/test/index.mjs
```

The browser script needs an existing Playwright module and installed Google Chrome. It serves the built `dist/`, mocks the store APIs, blocks other external requests and never submits payment. At six widths it checks no navbar, two type sizes, a silent entrance, the CRT screen and its remembered switch, the routes, product options, cart and checkout, that layers sit under the screen, and that typed text appears on the screen; then the no-JavaScript fallback. Screenshots go to the ignored `design-results/`.

To try the store against the real Worker, build as above and run `npx wrangler dev` from the repository root (`npm run dev` does not run the Worker, since `wrangler.jsonc` sits one level up). Do not submit a checkout locally: `.dev.vars` holds live credentials.

Not established by these checks: real-device performance, Safari, and a live checkout. Firefox 158 was driven headless through the home page, scrolling and checkout, with the screen on and scrolling at 60fps.
