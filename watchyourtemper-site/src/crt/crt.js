import { backingScale, bend, bendTarget, tileLayout } from './crt-math.js';
import { createPainter, overlaps, sameOrigin, union } from './crt-paint.js';
import { createTube } from './crt-gl.js';

// The whole site is shown through a CRT. This engine is shared with the
// PRESSURE TEST site (github.com/achuthanmukundan00/pressure-test), which keeps
// its unit tests; this copy adds what a store needs: form fields, scrolling
// panels and controls nested in labels. The page stays the document: it lays
// out, scrolls, takes focus and pointer input and carries meaning for assistive
// technology, underneath an opaque canvas. crt-paint.js draws what the page laid
// out into textures, and crt-gl.js shows the visible slice through the tube when
// the page scrolls or changes, and 30 times a second while it is alive (a faint
// flicker, unless motion is reduced). Without hardware WebGL2, in
// forced colours, in print, or on a device too slow to keep up, the page shows
// itself with the flat CSS glass (site.css). Fixed layers (controls, drawers,
// dialogs) must be children of <body>; the app renders them there with portals.
const keys = { preference: 'wyt-crt', verdict: 'wyt-crt-screen', still: 'wyt-crt-still' };
const LIFE_STEP = 1000 / 30; // ms between living frames
// CSS px per scanline, as in crt-gl.js. The screen scrolls the page by whole
// lines, the way old consoles did, so type keeps the same footing on the
// scanlines and does not shimmer as it moves.
const LINE = 4;
const PAD = 4; // CSS px of room around each sticky label in the atlas
const STEP = 8; // CSS px for the local warp of a control
const INTERACTIVE = 'a, button, summary, input, select, textarea, label';
const FIELDS = 'input, select, textarea';

const nextTask = () => new Promise((resolve) => { setTimeout(resolve); });
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const ruledOut = () => {
  try { return localStorage.getItem(keys.verdict) === 'slow'; } catch { return false; }
};
const heldStill = () => {
  try { return localStorage.getItem(keys.still) === 'still'; } catch { return false; }
};
const readPreference = () => {
  try { return localStorage.getItem(keys.preference) !== 'off'; } catch { return true; }
};
// Bezel width and the face's corner radius, CSS px, for a width x height screen.
const faceOf = (width, height) => {
  const short = Math.min(width, height);
  return [Math.min(22, Math.max(10, short * 0.018)), short * 0.045];
};
const fixedRootOf = (element) => {
  for (let node = element; node && node !== document.body; node = node.parentElement) {
    if (getComputedStyle(node).position === 'fixed') return node;
  }
  return null;
};

const createScreen = (onFail) => {
  const root = document.documentElement;
  const canvas = document.createElement('canvas');
  canvas.className = 'crt-screen';
  canvas.setAttribute('aria-hidden', 'true');
  const tube = createTube(canvas);
  if (!tube) return null;
  const painter = createPainter();
  const scratch = document.createElement('canvas');
  const pen = scratch.getContext('2d');
  let state = null;
  let generation = 0;
  let finished = false;
  let frame = 0;
  // Set while a relayout has emptied the textures and not yet repainted what is
  // under the viewport: the tube keeps showing its last frame until then.
  let holding = false;
  let relayoutTimer = 0;
  let densityQuery = null;
  let placed = [];
  let selectionDirty = false;
  const refreshing = new Set();

  // Controls sit in the corner, where the bend moves things most, so each one's
  // invisible DOM copy is moved onto its drawn copy: hit areas then line up with
  // what is on screen.
  const flatten = () => {
    for (const element of placed) element.style.transform = '';
  };
  const fixedRoots = () => [...document.body.children]
    .filter((element) => element !== canvas && getComputedStyle(element).position === 'fixed');
  const place = () => {
    placed = [];
    const { width, height } = state;
    for (const fixedRoot of fixedRoots()) {
      for (const element of fixedRoot.querySelectorAll(INTERACTIVE)) {
        // A control inside another (an input in its label) moves with it.
        if (element.parentElement?.closest(INTERACTIVE)) continue;
        if (getComputedStyle(element).transform !== 'none') continue;
        const box = element.getBoundingClientRect();
        if (!box.width || !box.height) continue;
        const x = box.left + box.width / 2;
        const y = box.top + box.height / 2;
        const [cx, cy] = bendTarget(x, y, width, height);
        const [rx, ry] = bendTarget(x + STEP, y, width, height);
        const [dx, dy] = bendTarget(x, y + STEP, width, height);
        const matrix = [(rx - cx) / STEP, (ry - cy) / STEP, (dx - cx) / STEP, (dy - cy) / STEP, cx - x, cy - y];
        element.style.transform = `matrix(${matrix.map((value) => value.toFixed(4)).join(', ')})`;
        placed.push(element);
      }
    }
  };

  const layerItems = (key) => (key === 'page' ? state.list.page : key === 'fixed' ? state.list.fixed : state.list.sticky.get(key));
  const setLayerItems = (key, items) => {
    if (key === 'page') state.list.page = items;
    else if (key === 'fixed') state.list.fixed = items;
    else state.list.sticky.set(key, items);
  };
  // Layer items with the selection highlight slotted in under the text.
  const itemsFor = (key) => {
    const base = layerItems(key) ?? [];
    const marks = state.selection.get(key);
    if (!marks?.length) return base;
    const cut = base.findIndex((item) => item.phase > 1);
    const at = cut < 0 ? base.length : cut;
    return [...base.slice(0, at), ...marks, ...base.slice(at)];
  };

  // Paints the part of `rect` inside `area` (CSS px, one layer) into the texture
  // region whose origin is area's corner, on whole backing pixels.
  const paintInto = (items, rect, area, upload) => {
    const { scale } = state;
    const x0 = Math.max(0, Math.floor((rect.x - area.x) * scale));
    const y0 = Math.max(0, Math.floor((rect.y - area.y) * scale));
    const x1 = Math.min(Math.round(area.width * scale), Math.ceil((rect.x + rect.width - area.x) * scale));
    const y1 = Math.min(Math.round(area.height * scale), Math.ceil((rect.y + rect.height - area.y) * scale));
    if (x1 <= x0 || y1 <= y0) return;
    scratch.width = x1 - x0;
    scratch.height = y1 - y0;
    painter.paint(pen, items, { x: area.x + x0 / scale, y: area.y + y0 / scale, width: (x1 - x0) / scale, height: (y1 - y0) / scale }, scale);
    upload(x0, y0);
  };

  const tileArea = (index) => {
    const { layout, width, scale } = state;
    return { x: 0, y: index * layout.span - layout.margin, width, height: layout.textureHeight / scale };
  };
  const paintPage = (rect) => {
    const items = itemsFor('page');
    for (let index = 0; index < state.layout.layers; index++) {
      const area = tileArea(index);
      if (overlaps(rect, area)) paintInto(items, rect, area, (x, y) => tube.upload('page', scratch, x, y, index));
    }
  };
  const paintFixed = (rect = { x: 0, y: 0, width: state.width, height: state.height }) => {
    paintInto(itemsFor('fixed'), rect, { x: 0, y: 0, width: state.width, height: state.height }, (x, y) => tube.upload('fixed', scratch, x, y));
  };
  const paintSticky = (slot) => {
    const area = { x: -PAD, y: -PAD, width: slot.cssWidth, height: slot.cssHeight };
    paintInto(itemsFor(slot.element), area, area, (x, y) => tube.upload('sticky', scratch, x, slot.top + y));
  };
  const repaint = (key, rect) => {
    const padded = { x: rect.x - 3, y: rect.y - 3, width: rect.width + 6, height: rect.height + 6 };
    if (key === 'page') paintPage(padded);
    else if (key === 'fixed') paintFixed(padded);
    else {
      const slot = state.atlas.find((entry) => entry.element === key);
      if (slot) paintSticky(slot);
    }
  };

  // Sticky labels move with scrolling, so each is painted once into an atlas and
  // placed by the shader wherever the page has stuck it.
  const pack = (sticky, scale) => {
    let top = 0;
    let atlasWidth = 1;
    const atlas = [];
    for (const element of sticky.keys()) {
      const box = element.getBoundingClientRect();
      const cssWidth = box.width + 2 * PAD;
      const cssHeight = box.height + 2 * PAD;
      const width = Math.ceil(cssWidth * scale);
      const height = Math.ceil(cssHeight * scale);
      atlas.push({ element, top, width, height, cssWidth, cssHeight });
      top += height + 2;
      atlasWidth = Math.max(atlasWidth, width);
    }
    const atlasHeight = Math.max(1, top);
    for (const slot of atlas) slot.uv = [0, slot.top / atlasHeight, slot.width / atlasWidth, slot.height / atlasHeight];
    return { atlas, atlasWidth, atlasHeight };
  };

  const fingerprint = () => `${root.clientWidth}x${root.scrollHeight}@${devicePixelRatio}`;

  // Everything again: the page reflowed, a font arrived, or the width changed.
  // Tiles under the viewport are painted first so the screen is right at once;
  // the rest follow a task at a time.
  const relayout = async () => {
    const run = ++generation;
    clearTimeout(relayoutTimer);
    const width = root.clientWidth;
    const height = root.clientHeight;
    const scale = backingScale(devicePixelRatio, width, height);
    // Fixed controls step in by the bezel, so the glass's curved corner never cuts them.
    root.style.setProperty('--crt-inset', `${Math.round(faceOf(width, height)[0] + 4)}px`);
    flatten();
    const list = painter.collect();
    const layout = tileLayout(root.scrollHeight, scale, tube.maxTexture);
    const { atlas, atlasWidth, atlasHeight } = pack(list.sticky, scale);
    // Resizing a canvas clears it, even to the size it already is.
    if (canvas.width !== Math.round(width * scale)) canvas.width = Math.round(width * scale);
    if (canvas.height !== Math.round(height * scale)) canvas.height = Math.round(height * scale);
    state = { width, height, scale, layout, list, atlas, atlasWidth, atlasHeight, selection: painter.selection(), key: fingerprint() };
    place();
    holding = true;
    tube.allocate({ width: canvas.width, height: canvas.height, layerHeight: layout.textureHeight, layers: layout.layers, atlasWidth, atlasHeight });
    paintFixed();
    for (const slot of atlas) paintSticky(slot);
    // Each step is its own task, so start-up never blocks input for long: graded
    // copies of images first, then the tiles under the viewport, then the rest.
    const steps = [
      ...painter.copiesNeeded(list.page, scale).map((item) => () => painter.warm(item, scale)),
    ];
    const top = scrollY;
    const visible = [...Array(layout.layers).keys()].filter((index) => overlaps(tileArea(index), { x: 0, y: top, width, height }));
    const rest = [...Array(layout.layers).keys()].filter((index) => !visible.includes(index))
      .sort((a, b) => Math.abs(a * layout.span - top) - Math.abs(b * layout.span - top));
    for (const index of visible) steps.push(() => paintPage(tileArea(index)));
    steps.push(() => {
      holding = false;
      // Whichever relayout catches up with the page brings a resting screen
      // back: the one a resize scheduled may have been superseded by another.
      if (root.dataset.screen === 'resting' && state.key === fingerprint()) root.dataset.screen = 'starting';
      draw();
    });
    for (const index of rest) steps.push(() => paintPage(tileArea(index)));
    for (const step of steps) {
      await nextTask();
      if (run !== generation || finished) return false;
      step();
    }
    requestDraw();
    return true;
  };
  const requestRelayout = (delay = 60) => {
    if (!state) return;
    clearTimeout(relayoutTimer);
    relayoutTimer = setTimeout(() => { void relayout(); }, delay);
  };

  // Hover, focus and input change how one element looks, not where anything is,
  // so only its items are rebuilt and only its area is repainted.
  const refresh = () => {
    const elements = [...refreshing].filter((element) => element.isConnected);
    refreshing.clear();
    const touchesFixed = elements.some((element) => fixedRootOf(element));
    if (touchesFixed) flatten();
    for (const element of elements) {
      const fresh = painter.collectSubtree(element);
      for (const key of new Set(['page', 'fixed', ...state.list.sticky.keys(), ...fresh.keys()])) {
        const items = layerItems(key);
        if (!items) {
          requestRelayout();
          continue;
        }
        let at = -1;
        let bounds = null;
        const kept = [];
        for (const item of items) {
          if (item.node && element.contains(item.node)) {
            bounds = union(bounds, item.bounds);
            if (at < 0) at = kept.length;
          } else kept.push(item);
        }
        const added = fresh.get(key) ?? [];
        for (const item of added) bounds = union(bounds, item.bounds);
        if (!bounds) continue;
        kept.splice(at < 0 ? kept.length : at, 0, ...added);
        setLayerItems(key, painter.byPhase(kept));
        repaint(key, bounds);
      }
    }
    if (touchesFixed) place();
  };
  const refreshSelection = () => {
    selectionDirty = false;
    const before = state.selection;
    state.selection = painter.selection();
    for (const key of new Set([...before.keys(), ...state.selection.keys()])) {
      let bounds = null;
      for (const item of [...(before.get(key) ?? []), ...(state.selection.get(key) ?? [])]) bounds = union(bounds, item.bounds);
      if (bounds) repaint(key, bounds);
    }
  };

  // Windows (what the screen may not draw: other sites' pictures, the video
  // player) sit above the glass, so every frame each is cut to the tube's face:
  // nothing of them shows on the bezel or past the face's rounded corners, and
  // the controls the screen draws are cut out of them. The face lands on screen
  // a little inside its edges, where the bend gathers them in.
  const rounded = (x0, y0, x1, y1, r) => `M${x0 + r} ${y0}H${x1 - r}A${r} ${r} 0 0 1 ${x1} ${y0 + r}V${y1 - r}`
    + `A${r} ${r} 0 0 1 ${x1 - r} ${y1}H${x0 + r}A${r} ${r} 0 0 1 ${x0} ${y1 - r}V${y0 + r}A${r} ${r} 0 0 1 ${x0 + r} ${y0}Z`;
  const clipWindows = () => {
    const windows = document.querySelectorAll('[data-crt-window]');
    if (!windows.length) return;
    const { width, height } = state;
    const [bezel, radius] = faceOf(width, height);
    const face = {
      left: bendTarget(bezel, height / 2, width, height)[0], right: bendTarget(width - bezel, height / 2, width, height)[0],
      top: bendTarget(width / 2, bezel, width, height)[1], bottom: bendTarget(width / 2, height - bezel, width, height)[1],
    };
    // Only the controls are cut out: decorative fixed layers (aria-hidden, like
    // the flat glass) are not things on the screen.
    const cuts = fixedRoots().filter((fixedRoot) => !fixedRoot.closest('[aria-hidden="true"]') && fixedRoot.querySelector(INTERACTIVE))
      .flatMap((fixedRoot) => [fixedRoot, ...fixedRoot.querySelectorAll('[open] > :not(summary)')])
      .map((element) => [element.getBoundingClientRect(), parseFloat(getComputedStyle(element).borderTopLeftRadius) || 0])
      .filter(([box]) => box.width && box.height && box.bottom > 0 && box.top < height);
    const at = (value) => Math.round(value * 2) / 2;
    for (const element of windows) {
      const box = element.getBoundingClientRect();
      if (box.bottom < -height || box.top > 2 * height) continue;
      const local = (rect, r) => rounded(at(rect.left - box.left), at(rect.top - box.top), at(rect.right - box.left), at(rect.bottom - box.top), r);
      let path = local(face, radius);
      for (const [cut, r] of cuts) if (overlaps({ x: box.left, y: box.top, width: box.width, height: box.height }, { x: cut.left, y: cut.top, width: cut.width, height: cut.height })) path += local(cut, r);
      const clip = `path(evenodd, "${path}")`;
      if (element.style.getPropertyValue('--crt-clip') !== clip) element.style.setProperty('--crt-clip', clip);
    }
  };

  function draw() {
    frame = 0;
    if (!state || finished || holding) return;
    if (refreshing.size) refresh();
    if (selectionDirty) refreshSelection();
    const { width, height, scale, layout } = state;
    const { shape, k } = bend(width, height);
    const stickies = state.atlas.map((slot) => {
      const box = slot.element.getBoundingClientRect();
      return { box: [box.left - PAD, box.top - PAD, slot.cssWidth, slot.cssHeight], uv: slot.uv };
    });
    tube.draw({
      view: [width, height], scroll: Math.round(scrollY / LINE) * LINE, tile: [layout.span, layout.margin, layout.textureHeight / scale], layers: layout.layers,
      bend: [shape[0], shape[1], k], face: faceOf(width, height),
      scale, stripe: Math.max(1, Math.round(scale)), stickies, time: performance.now() / 1000, alive: living,
    });
    clipWindows();
    if (root.dataset.screen === 'starting') root.dataset.screen = 'on';
  }
  function requestDraw() {
    if (!frame && !finished) frame = requestAnimationFrame(draw);
  }
  const requestRefresh = (element) => {
    if (!state || !(element instanceof Element)) return;
    refreshing.add(element);
    requestDraw();
  };

  // A weak GPU can pass the hardware check, so the first scrolls are timed
  // against the display's resting frame rate; a slow verdict hands the page back
  // to the flat glass on this device for good.
  const scrolling = [];
  const resting = [];
  let timing = 0;
  let previous = 0;
  let scrolled = false;
  let still = 0;
  const measure = () => {
    timing = 0;
    const now = performance.now();
    (scrolled ? scrolling : resting).push(now - previous);
    still = scrolled ? 0 : still + 1;
    scrolled = false;
    previous = now;
    if (scrolling.length >= 24 && resting.length >= 8) {
      if (median(scrolling) > Math.max(24, median(resting) * 1.6)) fail(true);
      else removeEventListener('scroll', watchScroll);
      return;
    }
    if (still < 10) timing = requestAnimationFrame(measure);
  };
  function watchScroll() {
    if (root.dataset.screen !== 'on') return;
    scrolled = true;
    if (timing) return;
    previous = performance.now();
    timing = requestAnimationFrame(measure);
  }

  // Life: while motion is welcome the tube flickers faintly, 30 frames a second.
  // Hidden tabs stop it (no animation frames), reduced motion holds it still,
  // and a device that cannot keep 25 frames a second is held still for good.
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let living = false;
  let lifeFrame = 0;
  let lastLife = 0;
  let lastTick = 0;
  const ticks = [];
  const live = (now) => {
    lifeFrame = requestAnimationFrame(live);
    if (lastTick && ticks.length < 90) {
      ticks.push(now - lastTick);
      if (ticks.length === 90 && median(ticks) > 40) {
        try { localStorage.setItem(keys.still, 'still'); } catch { /* still for this visit */ }
        hold();
        return;
      }
    }
    lastTick = now;
    if (now - lastLife < LIFE_STEP - 2 || root.dataset.screen !== 'on') return;
    lastLife = now;
    if (!frame) draw();
  };
  function hold() {
    cancelAnimationFrame(lifeFrame);
    lifeFrame = 0;
    lastTick = 0;
    if (living) {
      living = false;
      requestDraw();
    }
  }
  const breathe = () => {
    if (motion.matches || heldStill() || finished) {
      hold();
      return;
    }
    living = true;
    if (!lifeFrame) lifeFrame = requestAnimationFrame(live);
  };

  const onScroll = () => requestDraw();
  const onResize = () => {
    if (!state) return;
    if (fingerprint() !== state.key) {
      // The page reflows: show it flat until it settles, then paint it again.
      root.dataset.screen = 'resting';
      clearTimeout(relayoutTimer);
      relayoutTimer = setTimeout(() => { void relayout(); }, 160);
      return;
    }
    if (root.clientHeight === state.height) return;
    // Only the height changed (a mobile toolbar slid away): the page did not
    // move, so only the canvas and the fixed controls follow.
    flatten();
    state.height = root.clientHeight;
    canvas.width = Math.round(state.width * state.scale);
    canvas.height = Math.round(state.height * state.scale);
    const fixed = [];
    for (const element of fixedRoots()) {
      for (const items of painter.collectSubtree(element).values()) fixed.push(...items);
    }
    state.list.fixed = painter.byPhase(fixed);
    place();
    tube.allocate({ width: canvas.width, height: canvas.height, layerHeight: state.layout.textureHeight, layers: state.layout.layers, atlasWidth: state.atlasWidth, atlasHeight: state.atlasHeight });
    paintFixed();
    requestDraw();
  };
  const onPointer = (event) => {
    const target = event.target instanceof Element ? event.target.closest(INTERACTIVE) : null;
    if (target) requestRefresh(target);
  };
  const onFocus = (event) => requestRefresh(event.target);
  // A field's caret moves with keys and clicks, which change nothing else.
  const onField = (event) => {
    if (event.target instanceof Element && event.target.matches(FIELDS)) requestRefresh(event.target);
  };
  // A panel that scrolls inside the page (a cart, a dialog) moves its own content.
  const onInnerScroll = (event) => {
    if (event.target instanceof Element) requestRefresh(event.target);
  };
  const onSelection = () => {
    if (!state) return;
    selectionDirty = true;
    requestDraw();
  };
  const onLoad = (event) => {
    if (!(event.target instanceof HTMLImageElement)) return;
    if (event.target.closest('[data-crt-in-place]')) requestRefresh(event.target);
    else requestRelayout();
  };
  const onLost = (event) => {
    event.preventDefault();
    fail(false);
  };
  const observer = new MutationObserver((records) => {
    if (!state) return;
    const roots = new Set();
    for (const record of records) {
      if (record.type === 'childList' && [...record.addedNodes, ...record.removedNodes].every((node) => node === canvas)) continue;
      const target = record.target.nodeType === Node.ELEMENT_NODE ? record.target : record.target.parentElement;
      if (!target || target === canvas) continue;
      // A picture swapped in place (a slideshow) keeps its box: only it is repainted.
      if (record.type === 'attributes' && target.closest('[data-crt-in-place]')) {
        roots.add(target);
        continue;
      }
      const fixed = fixedRootOf(target);
      if (!fixed) {
        requestRelayout();
        return;
      }
      roots.add(fixed);
    }
    for (const element of roots) requestRefresh(element);
  });
  function watchDensity() {
    densityQuery?.removeEventListener('change', watchDensity);
    densityQuery = matchMedia(`(resolution: ${devicePixelRatio}dppx)`);
    densityQuery.addEventListener('change', watchDensity);
    onResize();
  }

  const listeners = [
    [window, 'scroll', onScroll, { passive: true }], [window, 'scroll', watchScroll, { passive: true }], [window, 'resize', onResize],
    [document, 'pointerover', onPointer], [document, 'pointerout', onPointer], [document, 'focusin', onFocus], [document, 'focusout', onFocus],
    [document, 'input', onFocus], [document, 'change', onField], [document, 'keyup', onField], [document, 'pointerup', onField],
    [document, 'scroll', onInnerScroll, { capture: true, passive: true }],
    [document, 'selectionchange', onSelection], [document, 'load', onLoad, true],
    [document.fonts, 'loadingdone', () => requestRelayout()], [canvas, 'webglcontextlost', onLost],
    [motion, 'change', breathe],
  ];

  const destroy = () => {
    if (finished) return;
    finished = true;
    generation++;
    cancelAnimationFrame(frame);
    cancelAnimationFrame(timing);
    cancelAnimationFrame(lifeFrame);
    clearTimeout(relayoutTimer);
    observer.disconnect();
    densityQuery?.removeEventListener('change', watchDensity);
    for (const [target, type, listener, options] of listeners) target.removeEventListener(type, listener, options);
    flatten();
    placed = [];
    for (const element of document.querySelectorAll('[data-crt-window]')) {
      delete element.dataset.crtWindow;
      element.style.removeProperty('--crt-clip');
    }
    delete root.dataset.screen;
    root.style.removeProperty('--crt-inset');
    canvas.remove();
    tube.destroy();
    painter.forget();
    scratch.width = 0;
  };
  function fail(slow) {
    if (finished) return;
    if (slow) {
      try { localStorage.setItem(keys.verdict, 'slow'); } catch { /* still flat for this visit */ }
    }
    destroy();
    onFail();
  }

  const start = async () => {
    // Every image is needed up front: one arriving mid-scroll would cost a repaint.
    for (const image of document.querySelectorAll('img[loading="lazy"]')) image.loading = 'eager';
    const images = [...document.images].filter((image) => sameOrigin(image.currentSrc || image.src));
    await Promise.race([
      Promise.all([document.fonts.ready, ...images.map((image) => image.decode().catch(() => {}))]),
      new Promise((resolve) => { setTimeout(resolve, 3000); }),
    ]);
    if (finished) return;
    for (const [target, type, listener, options] of listeners) target.addEventListener(type, listener, options);
    observer.observe(document.body, {
      subtree: true, childList: true, characterData: true, attributes: true,
      attributeFilter: ['open', 'hidden', 'disabled', 'class', 'src', 'aria-expanded'],
    });
    painter.onLate = (element) => requestRefresh(element);
    root.dataset.screen = 'starting';
    document.body.append(canvas);
    // A newer relayout may supersede this one (the store loading, say); the
    // screen still starts either way.
    await relayout();
    if (finished) return;
    watchDensity();
    breathe();
  };

  void start();
  return { destroy };
};

// Starts the screen (or the flat glass) and returns a function that stops it,
// for a React effect. `storage` overrides the localStorage keys.
export const initializeCrt = (storage = {}) => {
  Object.assign(keys, storage);
  const root = document.documentElement;
  const toggle = document.querySelector('[data-crt-toggle]');
  const forcedColours = matchMedia('(forced-colors: active)');
  let screen = null;
  let unsupported = false;

  const apply = (on) => {
    root.dataset.crt = on ? 'on' : 'off';
    toggle?.setAttribute('aria-pressed', String(on));
    if (on && !forcedColours.matches && !unsupported && !ruledOut()) {
      screen ??= createScreen(() => { screen = null; });
      if (!screen) unsupported = true;
    } else {
      screen?.destroy();
      screen = null;
    }
  };

  const onToggle = () => {
    const on = root.dataset.crt !== 'on';
    try { localStorage.setItem(keys.preference, on ? 'on' : 'off'); } catch { /* the choice still applies to this visit */ }
    apply(on);
  };
  const onColours = () => apply(root.dataset.crt === 'on');
  toggle?.addEventListener('click', onToggle);
  forcedColours.addEventListener('change', onColours);
  apply(readPreference());
  return () => {
    toggle?.removeEventListener('click', onToggle);
    forcedColours.removeEventListener('change', onColours);
    screen?.destroy();
    screen = null;
  };
};
