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
    expect(html).toContain('Made with ❤️ in Toronto, Ontario, Canada');
    expect(html).not.toContain('glitch-link');
  });

  it('keeps the native-DOM CRT control and fallback glass layers mounted across routes', () => {
    const html = render(<SignalScreen />);
    expect(html).toContain('data-crt-toggle');
    expect(html).toContain('class="crt-glue"');
    expect(html).toContain('class="crt-grain"');
    expect(html).toContain('class="crt-filter-defs"');
    expect(html).toContain('id="crt-glass-warp"');
    expect(html).toContain('aria-label="Site preferences"');
  });

  it('ships an in-document coarse phosphor filter for the composed DOM', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/styles/artist.css'), 'utf8');
    const shader = readFileSync(resolve(process.cwd(), 'src/components/screenCrt.ts'), 'utf8');
    const html = render(<SignalScreen />);
    expect(css).toContain('url("/#crt-glass-warp")');
    expect(css).toContain('repeating-linear-gradient(to bottom');
    expect(shader).toContain('uniform float u_pixel_ratio;');
    expect(shader).toContain('float scanline = step');
    expect(shader).toContain('phosphorTint(column)');
    expect(html).toContain('id="crt-glass-warp"');
    expect(html).toContain('in="SourceGraphic"');
    expect(html).toContain('<feDisplacementMap');
    expect(html).toContain('scale="8"');
    expect(html).toContain('baseFrequency="0.002 0.04"');
    expect(html).toContain('type="discrete"');
    expect(html).toContain('baseFrequency=".67 .53"');
    expect(html).toContain('flood-color="#5c5c5c"');
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
