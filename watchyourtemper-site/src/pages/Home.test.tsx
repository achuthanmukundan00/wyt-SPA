import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import FeedTheMachine from './FeedTheMachine';
import SignalScreen from '../components/SignalScreen';
import { storeImage } from '../lib/storeApi';

const render = (element: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);
const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('artist site composition', () => {
  it('has no navbar: the wordmark and one way in, with its links in the page and footer', () => {
    const html = render(<Home />);
    expect(html).not.toContain('<nav');
    expect(html).toContain('alt="watchyourtemper"');
    expect(html).toContain('href="#content"');
    expect(html).toContain('feed the machine');
    for (const link of ['href="/store"', 'href="/join"', 'href="/pressure-test/"', 'https://www.instagram.com/watchyourtemper/', 'https://www.tiktok.com/@watchyourtemper', 'https://www.youtube.com/@watchyourtemper', 'https://soundcloud.com/watchyourtemper']) {
      expect(html).toContain(link);
    }
    expect(html).toContain('Made with 🖤 in Toronto, Ontario, Canada');
    expect(source('src/App.tsx')).not.toContain('Navbar');
  });

  it('keeps every listening platform', () => {
    const html = render(<FeedTheMachine />);
    for (const name of ['Bandcamp', 'Spotify', 'Apple Music', 'YouTube Music', 'Tidal']) expect(html).toContain(name);
    expect(html).toContain('aria-label="watchyourtemper, home"');
  });

  it('mounts the site controls and the flat glass, and shows the site through the shared CRT engine', () => {
    const html = render(<SignalScreen />);
    expect(html).toContain('data-crt-toggle');
    expect(html).toContain('aria-label="Site preferences"');
    expect(html).toContain('class="crt-glass"');
    expect(source('src/components/SignalScreen.tsx')).toContain("from '../crt/crt.js'");
    const css = source('src/styles/site.css');
    // Nothing filters live page content; the screen draws it instead.
    expect(css).not.toMatch(/html\[data-crt='on'\]\s*\{\s*filter/);
    expect(css).toContain("html[data-screen='on'] .crt-screen");
    // Layers over the page stay under the screen, so it draws them.
    for (const layer of ['store-cart-backdrop', 'store-cart', 'store-modal-backdrop', 'store-toast']) {
      const rule = new RegExp(`\\.${layer} \\{[^}]*z-index: (\\d+)`).exec(css);
      expect(Number(rule?.[1])).toBeLessThan(42);
    }
  });

  it('passes Printful pictures through the Worker so the screen can draw them', () => {
    const printful = 'https://files.cdn.printful.com/files/15c/a_preview.png';
    expect(storeImage(printful)).toBe(`/api/store/image?src=${encodeURIComponent(printful)}`);
    expect(storeImage('https://example.com/a.png')).toBe('https://example.com/a.png');
    expect(storeImage('/assets/images/logo.webp')).toBe('/assets/images/logo.webp');
  });
});
