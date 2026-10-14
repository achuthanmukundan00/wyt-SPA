import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import Home from './Home';
import FeedTheMachine from './FeedTheMachine';
import SignalScreen from '../components/SignalScreen';

const render = (element: React.ReactNode) => renderToStaticMarkup(<MemoryRouter>{element}</MemoryRouter>);

describe('artist site composition', () => {
  it('keeps the original identity and offers actual navigation links, not a clickable heading', () => {
    const html = render(<Home />);
    expect(html).toContain('alt="watchyourtemper"');
    expect(html).toContain('href="#article"');
    expect(html).toContain('href="/store"');
    expect(html).toContain('href="/pressure-test/"');
    expect(html).toContain('data-mode="dark"');
    expect(html).not.toContain('Switch to light mode');
    expect(html).toContain('threshold-entry');
    expect(html).not.toContain('chains.webp');
    expect(html).toContain('Made with ❤️ in Toronto, Ontario, Canada');
    expect(html).not.toContain('glitch-link');
  });

  it('keeps the native-DOM CRT control and non-interactive texture layers mounted across routes', () => {
    const html = render(<SignalScreen />);
    expect(html).toContain('data-crt-toggle');
    expect(html).toContain('class="crt-glue"');
    expect(html).toContain('class="crt-grain"');
    expect(html).toContain('class="crt-filter-defs"');
    expect(html).toContain('id="crt-glass-warp"');
    expect(html).toContain('aria-label="Site preferences"');
  });

  it('ships one in-document raster pass that transforms the composed DOM', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/artist.css'), 'utf8');
    const controller = readFileSync(resolve(process.cwd(), 'src/components/screenCrt.ts'), 'utf8');
    const home = readFileSync(resolve(process.cwd(), 'src/pages/Home.tsx'), 'utf8');
    const html = render(<SignalScreen />);
    expect(css).toContain('url(#crt-glass-warp)');
    expect(css).toContain("html[data-crt='on'] .crt-grain");
    expect(css).toContain('repeating-linear-gradient(to bottom, transparent 0 6px');
    expect(css).toContain('rgba(0, 0, 0, .38) 6px 8px');
    expect(css).toContain('animation: crt-flicker 7s steps(1, end) infinite');
    expect(css).toContain('@keyframes crt-flicker');
    expect(css).toContain('border-radius: 2.4vw / 1.6vh');
    expect(css).toContain('rgba(190, 212, 255, .045)');
    expect(css).toContain('background: #080909');
    expect(home).not.toContain('chains.webp');
    expect(controller).toContain('root.dataset.crt');
    expect(controller).not.toContain('createElement');
    expect(controller).not.toContain('webgl2');
    expect(html).toContain('id="crt-glass-warp"');
    expect(html).toContain('in="SourceGraphic"');
    expect(html).toContain('<feDisplacementMap');
    expect(html).toContain('scale="6"');
    expect(html).toContain('baseFrequency="0.002 0.04"');
    expect(html).toContain('type="discrete"');
    expect(html).toContain('result="red-signal"');
    expect(html).toContain('dx="-2"');
    expect(html).toContain('mode="screen"');
    expect(html).toContain('baseFrequency=".67 .53"');
    expect(html).toContain('flood-color="#555555"');
    expect(html).toContain('width="12" height="16"');
    expect(html).toContain('stdDeviation="0.65 0.35"');
    expect(html).toContain('k3="0.1"');
    expect(html).toContain('<feTile');
    expect(html).not.toContain('<feImage');
  });

  it('retains the five existing listening destinations with safe new-tab links', () => {
    const html = render(<FeedTheMachine />);
    expect(html).toContain('>Listen</h1>');
    for (const host of ['watchyourtemper.bandcamp.com', 'open.spotify.com', 'music.apple.com', 'music.youtube.com', 'tidal.com']) {
      expect(html).toContain(host);
    }
    expect(html.match(/rel="noopener noreferrer"/g)).toHaveLength(5);
    expect(html).not.toContain('terminal-flicker');
  });
});
