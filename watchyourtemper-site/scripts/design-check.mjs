import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { preview } from 'vite';

// Browser checks for the built site (run `CF_PAGES=1 npm run build` first).
// Disposable browsers, mocked APIs, blocked external services. Never submits payment.
const { values } = parseArgs({ options: { 'playwright-module': { type: 'string' } } });
assert(values['playwright-module'], 'Pass an existing @playwright/test/index.mjs path');
const { chromium, expect } = await import(pathToFileURL(resolve(values['playwright-module'])).href);
const server = await preview({ configFile: false, preview: { host: '127.0.0.1', port: 0 }, appType: 'spa' });
const baseURL = server.resolvedUrls.local[0];
const browser = await chromium.launch({ channel: 'chrome' });
const output = resolve('design-results'); await mkdir(output, { recursive: true });
const preferences = {
  detectedCountry: 'US', defaultCurrency: 'USD', baseCurrency: 'USD', supportEmail: '',
  countries: [{ code: 'US', name: 'United States' }, { code: 'CA', name: 'Canada' }],
  currencies: ['USD', 'CAD'], exchangeRates: { USD: 1, CAD: 1.35 },
};
const products = [1, 2].map(id => ({
  id: `design-test-${id}`, slug: `design-test-${id}`, title: `Design test shirt ${id}`,
  description: 'Synthetic browser-test product.', image: `${baseURL}assets/images/chains.webp`,
  variants: [{ id: `variant-${id}`, name: 'Black / M', size: 'M', color: 'Black', basePrice: 45, baseCurrency: 'USD', price: 45, currency: 'USD', availability: true }],
}));

const fontsReady = page => page.evaluate(() => document.fonts.ready);
const onScreen = page => expect(page.locator('html')).toHaveAttribute('data-screen', 'on', { timeout: 15000 });
// Mean brightness of what the CRT screen shows inside a viewport rect (CSS px).
const light = (page, rect) => page.evaluate(rect => {
  const canvas = document.querySelector('canvas.crt-screen');
  const scale = canvas.width / document.documentElement.clientWidth;
  const copy = document.createElement('canvas'); copy.width = canvas.width; copy.height = canvas.height;
  const context = copy.getContext('2d'); context.drawImage(canvas, 0, 0);
  const { data } = context.getImageData(Math.round(rect.x * scale), Math.round(rect.y * scale), Math.max(1, Math.round(rect.width * scale)), Math.max(1, Math.round(rect.height * scale)));
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) sum += data[i] + data[i + 1] + data[i + 2];
  return sum / (data.length / 4) / 3;
}, rect);
// Two sizes on the whole site: text everywhere, display for the lines that carry a page.
const typeSizes = async page => {
  const sizes = await page.evaluate(() => {
    const result = new Set(); const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode, el = node.parentElement;
      if (!node.textContent.trim() || !el || el.closest('.sr-only, .visually-hidden, script, style, svg, noscript, option')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      if (range.getBoundingClientRect().width > 1) result.add(getComputedStyle(el).fontSize);
    }
    return [...result];
  });
  assert(sizes.length <= 2, `More than two type sizes: ${sizes}`);
};

try {
  for (const width of [320, 390, 768, 1024, 1440, 1920]) {
    const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: 'reduce', hasTouch: width === 390 });
    const errors = []; const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/store/preferences') return route.fulfill({ json: preferences });
      if (url.pathname === '/api/store/products') return route.fulfill({ json: { products } });
      if (url.pathname.startsWith('/api/')) return route.fulfill({ status: 503, json: { error: 'External actions disabled in design test.' } });
      return url.origin === new URL(baseURL).origin ? route.continue() : route.abort();
    });

    // Home: the wordmark and one way in. No navbar, and a silent entrance.
    await page.goto(baseURL); await fontsReady(page);
    await expect(page.getByRole('heading', { name: 'watchyourtemper', exact: true })).toBeVisible();
    await expect(page.locator('nav')).toHaveCount(0);
    assert(await page.locator('audio').evaluate(audio => audio.paused));
    await expect(page.locator('audio')).toHaveAttribute('preload', 'none');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px overflow`);
    const body = await page.locator('body').evaluate(el => parseFloat(getComputedStyle(el).fontSize));
    assert(body >= 16 && body <= 20, `body text is ${body}px`);
    assert.equal(await page.locator('.site-footer').evaluate(el => parseFloat(getComputedStyle(el).fontSize)), body);
    await typeSizes(page);

    // The whole site is shown through the CRT screen, which the switch turns off for good.
    await onScreen(page);
    const canvas = page.locator('canvas.crt-screen');
    assert.deepEqual(await canvas.evaluate(el => [getComputedStyle(el).position, getComputedStyle(el).pointerEvents, el.getAttribute('aria-hidden')]), ['fixed', 'none', 'true']);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/home-${width}.png` });
    await page.getByRole('link', { name: /feed the machine/ }).click();
    await expect(page.locator('.channels a')).toHaveCount(5);
    await expect(page.locator('#listen')).toBeInViewport();
    assert(await page.locator('audio').evaluate(audio => audio.paused), 'Entrance must remain silent');
    await page.getByRole('button', { name: 'CRT effect' }).click();
    await expect(canvas).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-crt', 'off');
    await page.reload(); await fontsReady(page);
    await expect(canvas).toHaveCount(0);
    await page.getByRole('button', { name: 'CRT effect' }).click();
    await onScreen(page);
    await page.locator('#soundtrack-controls > summary').click();
    await expect(page.locator('.audio-position__panel')).toBeVisible();
    await page.locator('#soundtrack-controls > summary').click();
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    assert(await page.evaluate(() => scrollY) > 0, 'deep scroll must move');

    await page.goto(`${baseURL}machine`); await fontsReady(page);
    await expect(page.getByRole('heading', { name: 'Listen', exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: 'watchyourtemper, home' })).toBeVisible();
    await expect(page.locator('.channels a')).toHaveCount(5); await typeSizes(page);

    // Store: preferences in the page, every layer under the screen, and what is typed shown on it.
    await page.goto(`${baseURL}store`); await fontsReady(page);
    await expect(page.locator('.store-card')).toHaveCount(2);
    await expect(page.getByLabel('Ship to')).toBeVisible();
    await expect(page.getByLabel('Currency')).toBeVisible();
    await typeSizes(page);
    await onScreen(page);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/store-${width}.png` });
    await page.getByRole('button', { name: 'Select options', exact: true }).first().click();
    await expect(page.getByRole('dialog', { name: 'Select options for Design test shirt 1' })).toBeVisible(); await typeSizes(page);
    await page.getByRole('button', { name: 'Add to cart', exact: true }).click();
    await expect(page.locator('.store-cart.is-open')).toContainText('Design test shirt 1');
    for (const layer of ['.store-cart', '.store-cart-backdrop']) {
      assert(await page.locator(layer).evaluate(el => el.parentElement === document.body && Number(getComputedStyle(el).zIndex) < 42), `${layer} must be a body child under the screen`);
    }
    await page.getByRole('button', { name: 'Checkout', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'Checkout details' })).toBeVisible();
    const email = page.getByLabel('Email', { exact: true });
    await expect(email).toBeVisible(); await typeSizes(page);
    // The shipping quote answers after a pause and reflows the dialog: measure after it.
    await expect(page.locator('.store-checkout-note-error')).toBeVisible();
    await page.waitForTimeout(600);
    const box = await email.boundingBox();
    const field = { x: box.x + 4, y: box.y + 4, width: Math.min(box.width - 8, 220), height: box.height - 8 };
    const empty = await light(page, field);
    await email.fill('fan@example.com');
    await expect.poll(() => light(page, field)).toBeGreaterThan(empty + 2);
    if ([390, 1440].includes(width)) await page.screenshot({ path: `${output}/checkout-${width}.png` });
    await page.getByRole('button', { name: 'Close checkout', exact: true }).click();
    assert.deepEqual(errors, []);
    await context.close();
    console.log(`${width}px: dark, no navbar, two sizes, CRT screen and switch, silent entrance, routes, options, cart and checkout on the screen passed.`);
  }
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await context.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
  await page.goto(baseURL);
  await expect(page.getByRole('heading', { name: 'watchyourtemper' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Bandcamp' })).toBeVisible();
  assert.equal(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor), 'rgb(8, 9, 9)');
  await context.close();
  console.log('No-JS dark fallback and original outbound listening routes passed.');
} finally {
  await browser.close(); await new Promise(resolve => server.httpServer.close(resolve));
}
