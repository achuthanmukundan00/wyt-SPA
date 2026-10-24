import { applyColourTransform, colourTransform, gradientLine, isIdentity, objectFit, parseGradients } from './crt-math.js';

// Reads what the browser laid out and draws it again into 2D canvases, so the
// screen (crt.js) can show the whole page through the tube. Nothing is captured:
// every glyph, image, rule, gradient, icon and control is drawn from its computed
// style at the position the DOM gave it. The site's own vocabulary is the
// contract: solid and gradient backgrounds, uniform borders and radii, text and
// underlines, images with colour filters and object-fit, inline SVG icons and
// range inputs. Images from other origins cannot be drawn into a canvas, so they
// become windows (data-crt-window) that the page shows above the screen.
//
// Items live in one of three layers: 'page' (document coordinates), 'fixed'
// (viewport coordinates) or a sticky element (coordinates in its own box), and
// paint in phases: boxes and images, then selection, then text, then focus rings.

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'TEMPLATE', 'NOSCRIPT', 'AUDIO', 'CANVAS', 'DIALOG', 'LINK', 'META']);
const SKIP_CLASSES = ['crt-glass', 'crt-raster', 'crt-screen'];
const KEEP_COPIES = 16; // graded image copies kept between paints
const PICTOGRAPH = /\p{Extended_Pictographic}/u;
// Input types whose value is a line of text the screen draws.
const TEXT_FIELDS = new Set(['text', 'email', 'search', 'tel', 'url', 'number', 'password']);
const PAINT_PROPERTIES = ['fill', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'opacity'];
const canvasFilters = typeof CanvasRenderingContext2D !== 'undefined' && 'filter' in CanvasRenderingContext2D.prototype;

const parseColour = (value) => {
  const match = /^rgba?\(([^)]+)\)/.exec(value ?? '');
  if (!match) return null;
  const channels = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  return { css: value, alpha: channels.length > 3 ? channels[3] : 1 };
};
const visibleColour = (value) => {
  const colour = parseColour(value);
  return colour && colour.alpha > 0 ? colour.css : null;
};
const px = (value) => Number.parseFloat(value) || 0;
const intersect = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  const x = Math.max(a.x, b.x);
  const y = Math.max(a.y, b.y);
  return { x, y, width: Math.max(0, Math.min(a.x + a.width, b.x + b.width) - x), height: Math.max(0, Math.min(a.y + a.height, b.y + b.height) - y) };
};
export const union = (a, b) => {
  if (!a) return b;
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return { x, y, width: Math.max(a.x + a.width, b.x + b.width) - x, height: Math.max(a.y + a.height, b.y + b.height) - y };
};
export const overlaps = (a, b) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
const inflate = (rect, amount) => ({ x: rect.x - amount, y: rect.y - amount, width: rect.width + 2 * amount, height: rect.height + 2 * amount });

export const sameOrigin = (url) => {
  try {
    const parsed = new URL(url, location.href);
    return parsed.origin === location.origin || parsed.protocol === 'data:';
  } catch { return false; }
};

export const createPainter = () => {
  const range = document.createRange();
  const measure = document.createElement('canvas').getContext('2d');
  const fonts = new Map();
  const svgs = new Map();
  const images = new Map();
  let onLate = () => {};

  const fontMetrics = (font) => {
    let metrics = fonts.get(font);
    if (!metrics) {
      measure.font = font;
      const text = measure.measureText('Hxgy');
      metrics = { ascent: text.fontBoundingBoxAscent ?? text.actualBoundingBoxAscent, descent: text.fontBoundingBoxDescent ?? text.actualBoundingBoxDescent };
      fonts.set(font, metrics);
    }
    return metrics;
  };

  // Where an element's items go, and what clips and fades them. Fixed and
  // sticky ancestors open their own layers; overflow clips; opacity multiplies.
  const contextFor = (element) => {
    const chain = [];
    for (let node = element.parentElement; node && node !== document.documentElement; node = node.parentElement) chain.unshift(node);
    let context = { layer: 'page', clip: null, alpha: 1 };
    for (const node of chain) context = enter(node, getComputedStyle(node), context).inner;
    return context;
  };

  const toLayer = (rect, layer) => {
    if (layer === 'page') return { x: rect.left, y: rect.top + scrollY, width: rect.width, height: rect.height };
    if (layer === 'fixed') return { x: rect.left, y: rect.top, width: rect.width, height: rect.height };
    const origin = layer.getBoundingClientRect();
    return { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height };
  };

  const enter = (element, style, context) => {
    let { layer, clip } = context;
    if (style.position === 'fixed') { layer = 'fixed'; clip = null; }
    else if (style.position === 'sticky') { layer = element; clip = null; }
    const box = toLayer(element.getBoundingClientRect(), layer);
    const alpha = context.alpha * Number(style.opacity);
    const clips = style.overflowX !== 'visible' || style.overflowY !== 'visible';
    return { box, layer, alpha, outer: { layer, clip, alpha }, inner: { layer, clip: clips ? intersect(clip, box) : clip, alpha } };
  };

  const boxItems = (node, style, box, context, out) => {
    const radius = px(style.borderTopLeftRadius);
    const fill = visibleColour(style.backgroundColor);
    if (fill) out.push({ kind: 'fill', phase: 0, node, bounds: box, box, radius, fill, alpha: context.alpha, clip: context.clip });
    const layers = parseGradients(style.backgroundImage).filter(Boolean).reverse();
    for (const gradient of layers) out.push({ kind: 'gradient', phase: 0, node, bounds: box, box, gradient, alpha: context.alpha, clip: context.clip });
    const width = px(style.borderTopWidth);
    const stroke = style.borderTopStyle === 'solid' && visibleColour(style.borderTopColor);
    const uniform = ['Right', 'Bottom', 'Left'].every((side) => px(style[`border${side}Width`]) === width);
    if (width && stroke && uniform) out.push({ kind: 'border', phase: 0, node, bounds: box, box, radius, stroke, width, alpha: context.alpha, clip: context.clip });
  };

  // Pseudo-elements have no boxes to measure; the site only uses ones that fill
  // their element (position: absolute, inset 0), so those are drawn and others skipped.
  const pseudoItems = (element, which, box, context, out) => {
    const style = getComputedStyle(element, which);
    if (style.content === 'none' || style.content === 'normal' || style.display === 'none') return;
    if (style.position !== 'absolute' || ['top', 'right', 'bottom', 'left'].some((side) => style[side] !== '0px')) return;
    const parent = getComputedStyle(element);
    const inner = { x: box.x + px(parent.borderLeftWidth), y: box.y + px(parent.borderTopWidth), width: element.clientWidth, height: element.clientHeight };
    boxItems(element, style, inner, { ...context, alpha: context.alpha * Number(style.opacity) }, out);
  };

  // Crops are worked out in natural size, which a srcset with w or x descriptors
  // divides by its density while drawImage reads the file's own pixels. The
  // site's pictures therefore have density-1 sources (a <picture> chosen by media).
  const imageItem = (image, style, box, context, out) => {
    if (!sameOrigin(image.currentSrc || image.src)) {
      image.dataset.crtWindow = '';
      return;
    }
    if (!image.complete || !image.naturalWidth) return;
    const content = {
      x: box.x + px(style.paddingLeft) + px(style.borderLeftWidth), y: box.y + px(style.paddingTop) + px(style.borderTopWidth),
      width: image.clientWidth - px(style.paddingLeft) - px(style.paddingRight), height: image.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
    };
    const { destination, source } = objectFit(style.objectFit, content, { width: image.naturalWidth, height: image.naturalHeight }, style.objectPosition);
    const filter = colourTransform(style.filter);
    out.push({ kind: 'image', phase: 0, node: image, bounds: destination, destination, source, image, filter: filter && !isIdentity(filter) ? style.filter : 'none', transform: filter, alpha: context.alpha, clip: context.clip });
  };

  // Inline SVG icons are serialised with their computed paint and drawn as images.
  const svgItem = (svg, box, context, out) => {
    const clone = svg.cloneNode(true);
    const sources = [svg, ...svg.querySelectorAll('*')];
    const targets = [clone, ...clone.querySelectorAll('*')];
    sources.forEach((source, i) => {
      const style = getComputedStyle(source);
      for (const property of PAINT_PROPERTIES) targets[i].setAttribute(property, style.getPropertyValue(property));
    });
    for (const name of ['class', 'aria-hidden', 'focusable']) clone.removeAttribute(name);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', box.width);
    clone.setAttribute('height', box.height);
    const markup = new XMLSerializer().serializeToString(clone);
    let entry = svgs.get(markup);
    if (!entry) {
      const image = new Image();
      entry = { image, ready: false, waiting: new Set() };
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
      image.decode().then(() => {
        entry.ready = true;
        for (const element of entry.waiting) onLate(element);
        entry.waiting.clear();
      }, () => {});
      svgs.set(markup, entry);
    }
    if (!entry.ready) entry.waiting.add(svg);
    out.push({ kind: 'svg', phase: 0, node: svg, bounds: box, box, entry, alpha: context.alpha, clip: context.clip });
  };

  const rangeItem = (input, style, box, context, out) => {
    const min = Number(input.min || 0);
    const max = Number(input.max || 100);
    const fraction = max > min ? Math.min(1, Math.max(0, (Number(input.value) - min) / (max - min))) : 0;
    const colour = visibleColour(style.accentColor) ?? style.color;
    out.push({ kind: 'range', phase: 0, node: input, bounds: box, box, fraction, colour, alpha: context.alpha * (input.disabled ? 0.45 : 1), clip: context.clip });
  };

  // Form fields draw their own text, which is not in the DOM to measure: the
  // value (or the placeholder, or a select's chosen option) on one line at the
  // start of the content box, scrolled as the field is, with the caret where
  // the selection collapses while the field has focus.
  const fieldItem = (field, style, box, context, out) => {
    const select = field.tagName === 'SELECT';
    if (!select && !TEXT_FIELDS.has(field.type)) return;
    let text = select ? field.selectedOptions[0]?.textContent?.trim() ?? '' : field.value;
    let colour = style.color;
    if (!select && field.type === 'password') text = '•'.repeat(text.length);
    if (!text && !select && field.placeholder) {
      text = field.placeholder;
      colour = getComputedStyle(field, '::placeholder').color;
    }
    const content = {
      x: box.x + px(style.borderLeftWidth) + px(style.paddingLeft), y: box.y + px(style.borderTopWidth) + px(style.paddingTop),
      width: field.clientWidth - px(style.paddingLeft) - px(style.paddingRight), height: field.clientHeight - px(style.paddingTop) - px(style.paddingBottom),
    };
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const { ascent, descent } = fontMetrics(font);
    const flat = context.layer === 'page' || context.layer === 'fixed';
    const baseline = (flat ? onBeam : Number)(content.y + (content.height - ascent - descent) / 2 + ascent);
    const x = content.x - (select ? 0 : field.scrollLeft);
    let caret = null;
    if (!select && field === document.activeElement && field.selectionStart === field.selectionEnd && field.selectionStart !== null) {
      measure.font = font;
      if ('letterSpacing' in measure) measure.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
      const before = field.type === 'password' ? text.slice(0, field.selectionStart) : field.value.slice(0, field.selectionStart);
      caret = { x: x + measure.measureText(before).width, y: baseline - ascent * 0.9, height: (ascent + descent) * 0.9 };
    }
    if (!text && !caret) return;
    out.push({
      kind: 'field', phase: 2, node: field, bounds: box, text, font, colour, x, y: baseline, caret,
      letterSpacing: style.letterSpacing === 'normal' ? '0px' : style.letterSpacing,
      alpha: context.alpha * (field.disabled ? 0.45 : 1), clip: intersect(context.clip, content),
    });
  };

  // Text decorations come from the box that declared them, which is the text's
  // own inline ancestor or the first block-level one.
  const decorationFor = (host) => {
    for (let node = host; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node);
      if (style.textDecorationLine.includes('underline')) return style;
      if (style.display !== 'inline') return null;
    }
    return null;
  };

  // Type is drawn a grapheme at a time, so an emoji keeps its presentation
  // selector (the red heart, not the text one) and marks stay on their letter.
  const graphemes = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const segments = (text) => {
    if (graphemes) return graphemes.segment(text);
    const out = [];
    for (let index = 0; index < text.length;) {
      const segment = String.fromCodePoint(text.codePointAt(index));
      out.push({ segment, index });
      index += segment.length;
    }
    return out;
  };

  // Type sits on the scanlines. The tube's beams are centred 2 CSS px into each
  // 4 px line, so every baseline moves (2 px at most) to 1 px below a centre:
  // each line of text is cut by the beams the same way, and the baseline stroke
  // is never lost in a gap. Sticky layers move on screen, so they keep theirs.
  const PITCH = 4;
  const onBeam = (y) => Math.round((y - 3) / PITCH) * PITCH + 3;

  const textItem = (node, style, context, out) => {
    if (!node.data.trim()) return;
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const { ascent, descent } = fontMetrics(font);
    const baseline = (rect) => rect.top + (rect.height - ascent - descent) / 2 + ascent;
    const shift = context.layer === 'page' ? scrollY : 0;
    const flat = context.layer === 'page' || context.layer === 'fixed';
    const origin = flat ? { left: 0, top: -shift } : context.layer.getBoundingClientRect();
    const baselineOf = (rect) => (flat ? onBeam : Number)(baseline(rect) - origin.top);
    const glyphs = [];
    let bounds = null;
    for (const { segment: glyph, index } of segments(node.data)) {
      range.setStart(node, index);
      range.setEnd(node, index + glyph.length);
      if (!glyph.trim()) continue;
      const rect = range.getBoundingClientRect();
      if (!rect.width && !rect.height) continue;
      glyphs.push({ glyph, x: rect.left - origin.left, y: baselineOf(rect), width: PICTOGRAPH.test(glyph) ? rect.width : 0 });
      bounds = union(bounds, { x: rect.left - origin.left, y: rect.top - origin.top, width: rect.width, height: rect.height });
    }
    if (!glyphs.length) return;
    const lines = [];
    const decoration = decorationFor(node.parentElement);
    if (decoration) {
      const size = px(style.fontSize);
      const thickness = px(decoration.textDecorationThickness) || Math.max(1, size / 16);
      const offset = decoration.textUnderlineOffset === 'auto' ? size * 0.1 : px(decoration.textUnderlineOffset);
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        const line = { x: rect.left - origin.left, y: baselineOf(rect) + offset, width: rect.width, height: thickness };
        lines.push(line);
        bounds = union(bounds, line);
      }
      lines.colour = visibleColour(decoration.textDecorationColor) ?? style.color;
    }
    out.push({ kind: 'text', phase: 2, node: node.parentElement, text: node, bounds: inflate(bounds, 4), font, colour: style.color, glyphs, lines, alpha: context.alpha, clip: context.clip });
  };

  const ringItem = (element, style, box, context, out) => {
    if (style.outlineStyle === 'none' || !px(style.outlineWidth)) return;
    const colour = visibleColour(style.outlineColor);
    if (!colour) return;
    const width = px(style.outlineWidth);
    const rect = inflate(box, px(style.outlineOffset) + width / 2);
    out.push({ kind: 'ring', phase: 3, node: element, bounds: inflate(rect, width), rect, width, colour, radius: px(style.borderTopLeftRadius) + px(style.outlineOffset), alpha: context.alpha, clip: null });
  };

  // Walks one element and everything inside it, sorting items into layers.
  const walk = (element, context, layers) => {
    if (SKIP_TAGS.has(element.tagName) || SKIP_CLASSES.some((name) => element.classList?.contains(name))) return;
    // checkVisibility also catches what is laid out but not rendered, like the
    // inside of a closed <details>.
    if (element.checkVisibility ? !element.checkVisibility() : element.closest('details:not([open]) > :not(summary)')) return;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.clipPath !== 'none') return;
    const entered = enter(element, style, context);
    if (entered.alpha <= 0.001) return;
    const out = layers.get(entered.layer) ?? layers.set(entered.layer, []).get(entered.layer);
    const own = { ...entered.outer };
    if (element !== document.body) boxItems(element, style, entered.box, own, out);
    const tag = element.tagName;
    if (tag === 'IMG') imageItem(element, style, entered.box, own, out);
    else if (tag === 'svg') svgItem(element, entered.box, own, out);
    else if (tag === 'INPUT' && element.type === 'range') rangeItem(element, style, entered.box, own, out);
    else if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') fieldItem(element, style, entered.box, own, out);
    else if (tag === 'IFRAME') element.dataset.crtWindow = '';
    else {
      pseudoItems(element, '::before', entered.box, own, out);
      for (const child of element.childNodes) {
        if (child.nodeType === Node.ELEMENT_NODE) walk(child, entered.inner, layers);
        else if (child.nodeType === Node.TEXT_NODE) textItem(child, style, entered.inner, out);
      }
      pseudoItems(element, '::after', entered.box, own, out);
    }
    if (element === document.activeElement && element.matches(':focus-visible')) ringItem(element, style, entered.box, own, out);
  };

  const byPhase = (items) => items.map((item, order) => ({ item, order })).sort((a, b) => a.item.phase - b.item.phase || a.order - b.order).map(({ item }) => item);

  // Everything on the page, as layers of items: { page, fixed, sticky: Map<element, items> }.
  const collect = () => {
    const layers = new Map([['page', []], ['fixed', []]]);
    walk(document.body, { layer: 'page', clip: null, alpha: 1 }, layers);
    const sticky = new Map();
    for (const [layer, items] of layers) if (layer !== 'page' && layer !== 'fixed') sticky.set(layer, byPhase(items));
    return { page: byPhase(layers.get('page')), fixed: byPhase(layers.get('fixed')), sticky };
  };

  // Items for one element's subtree, for repainting a hover or focus change.
  const collectSubtree = (element) => {
    const layers = new Map();
    walk(element, contextFor(element), layers);
    return layers;
  };

  // Highlight rects for the current text selection, per layer.
  const selection = () => {
    const layers = new Map();
    const current = getSelection();
    if (!current || current.isCollapsed) return layers;
    for (let i = 0; i < current.rangeCount; i++) {
      const selected = current.getRangeAt(i);
      const anchor = selected.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? selected.commonAncestorContainer : selected.commonAncestorContainer.parentElement;
      if (!anchor) continue;
      const context = contextFor(anchor);
      const layer = getComputedStyle(anchor).position === 'fixed' ? 'fixed' : context.layer;
      const items = layers.get(layer) ?? layers.set(layer, []).get(layer);
      for (const rect of selected.getClientRects()) {
        const box = toLayer(rect, layer);
        items.push({ kind: 'fill', phase: 1, node: null, bounds: box, box, radius: 0, fill: 'rgba(236, 236, 231, 0.32)', alpha: 1, clip: context.clip });
      }
    }
    return layers;
  };

  // A copy of an image at the size it is drawn, with its CSS filter applied once.
  // A slideshow brings many pictures through, so only the most recently used
  // copies are kept: more than the page shows at once, few enough to stay small.
  const keyOf = (item, width, height) => {
    const { source } = item;
    return `${item.image.currentSrc} ${width}x${height} ${[source.x, source.y, source.width, source.height].map(Math.round).join(',')} ${item.filter}`;
  };
  const filtered = (item, width, height) => {
    const key = keyOf(item, width, height);
    let copy = images.get(key);
    if (copy) {
      images.delete(key);
      images.set(key, copy);
      return copy;
    }
    copy = document.createElement('canvas');
    copy.width = width;
    copy.height = height;
    const context = copy.getContext('2d', { willReadFrequently: !canvasFilters });
    context.imageSmoothingQuality = 'high';
    if (canvasFilters) context.filter = item.filter;
    const { source } = item;
    context.drawImage(item.image, source.x, source.y, source.width, source.height, 0, 0, width, height);
    if (!canvasFilters && item.transform) {
      const pixels = context.getImageData(0, 0, width, height);
      applyColourTransform(pixels.data, item.transform);
      context.putImageData(pixels, 0, 0);
    }
    images.set(key, copy);
    while (images.size > KEEP_COPIES) images.delete(images.keys().next().value);
    return copy;
  };

  const copySize = (item, scale) => [Math.max(1, Math.round(item.destination.width * scale)), Math.max(1, Math.round(item.destination.height * scale))];
  // Images whose copy at drawn size (graded where the page grades them) is not
  // made yet, so the screen can make them ahead, a task each.
  const copiesNeeded = (items, scale) => items.filter((item) => item.kind === 'image' && !images.has(keyOf(item, ...copySize(item, scale))));
  const warm = (item, scale) => filtered(item, ...copySize(item, scale));

  const roundedPath = (context, rect, radius) => {
    context.beginPath();
    if (radius > 0 && context.roundRect) context.roundRect(rect.x, rect.y, rect.width, rect.height, Math.min(radius, rect.width / 2, rect.height / 2));
    else context.rect(rect.x, rect.y, rect.width, rect.height);
  };

  const drawGradient = (context, { gradient, box }) => {
    const paint = gradient.type === 'linear'
      ? (() => {
        const line = gradientLine(gradient.angle, box.width, box.height);
        return context.createLinearGradient(box.x + line.x0, box.y + line.y0, box.x + line.x1, box.y + line.y1);
      })()
      : context.createRadialGradient(0, 0, 0, 0, 0, 1);
    for (const stop of gradient.stops) paint.addColorStop(Math.min(1, Math.max(0, stop.at)), `rgba(${stop.colour.join(', ')})`);
    context.fillStyle = paint;
    if (gradient.type === 'linear') {
      context.fillRect(box.x, box.y, box.width, box.height);
      return;
    }
    // ellipse farthest-corner at the centre: a unit circle stretched to the box.
    context.save();
    context.translate(box.x + box.width / 2, box.y + box.height / 2);
    context.scale((box.width / 2) * Math.SQRT2, (box.height / 2) * Math.SQRT2);
    context.fillRect(-1 / Math.SQRT2, -1 / Math.SQRT2, Math.SQRT2, Math.SQRT2);
    context.restore();
  };

  // Boxes that meet on a fractional pixel each cover only part of it, so a
  // picture shows through a thin line where its own scrim starts. The browser
  // snaps these edges to device pixels; the screen does the same.
  const snap = (rect, scale) => {
    const x0 = Math.round(rect.x * scale) / scale;
    const y0 = Math.round(rect.y * scale) / scale;
    const x1 = Math.round((rect.x + rect.width) * scale) / scale;
    const y1 = Math.round((rect.y + rect.height) * scale) / scale;
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  };

  const drawItem = (context, item, scale) => {
    context.globalAlpha = item.alpha;
    switch (item.kind) {
      case 'fill':
        context.fillStyle = item.fill;
        roundedPath(context, snap(item.box, scale), item.radius);
        context.fill();
        break;
      case 'gradient':
        drawGradient(context, { ...item, box: snap(item.box, scale) });
        break;
      case 'border': {
        const half = item.width / 2;
        context.strokeStyle = item.stroke;
        context.lineWidth = item.width;
        roundedPath(context, inflate(item.box, -half), Math.max(0, item.radius - half));
        context.stroke();
        break;
      }
      case 'image': {
        const destination = snap(item.destination, scale);
        context.drawImage(filtered(item, ...copySize(item, scale)), destination.x, destination.y, destination.width, destination.height);
        break;
      }
      case 'svg':
        if (item.entry.ready) context.drawImage(item.entry.image, item.box.x, item.box.y, item.box.width, item.box.height);
        break;
      case 'range': {
        const { box, fraction, colour } = item;
        const y = box.y + box.height / 2;
        context.fillStyle = colour;
        context.globalAlpha = item.alpha * 0.3;
        roundedPath(context, { x: box.x, y: y - 2, width: box.width, height: 4 }, 2);
        context.fill();
        context.globalAlpha = item.alpha;
        roundedPath(context, { x: box.x, y: y - 2, width: Math.max(4, box.width * fraction), height: 4 }, 2);
        context.fill();
        context.beginPath();
        context.arc(box.x + 7 + (box.width - 14) * fraction, y, 7, 0, Math.PI * 2);
        context.fill();
        break;
      }
      case 'text':
        context.font = item.font;
        context.fillStyle = item.colour;
        context.textBaseline = 'alphabetic';
        for (const { glyph, x, y, width } of item.glyphs) {
          // A canvas can draw an emoji wider than the page set it (Firefox
          // does), running it into the next word; it is scaled to its space.
          const drawn = width && context.measureText(glyph).width;
          if (drawn > width * 1.04) {
            context.save();
            context.translate(x, y);
            context.scale(width / drawn, width / drawn);
            context.fillText(glyph, 0, 0);
            context.restore();
          } else context.fillText(glyph, x, y);
        }
        if (item.lines.length) {
          context.fillStyle = item.lines.colour;
          for (const line of item.lines) context.fillRect(line.x, line.y, line.width, line.height);
        }
        break;
      case 'field':
        context.font = item.font;
        if ('letterSpacing' in context) context.letterSpacing = item.letterSpacing;
        context.fillStyle = item.colour;
        context.textBaseline = 'alphabetic';
        context.fillText(item.text, item.x, item.y);
        if ('letterSpacing' in context) context.letterSpacing = '0px';
        if (item.caret) {
          context.fillStyle = getComputedStyle(item.node).caretColor === 'auto' ? item.colour : getComputedStyle(item.node).caretColor;
          context.fillRect(item.caret.x, item.caret.y, 2, item.caret.height);
        }
        break;
      case 'ring':
        context.strokeStyle = item.colour;
        context.lineWidth = item.width;
        roundedPath(context, item.rect, item.radius);
        context.stroke();
        break;
      default:
    }
  };

  // Draws the items that touch `region` (layer coordinates) into `context`,
  // whose pixels cover exactly that region at `scale`.
  const paint = (context, items, region, scale) => {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, context.canvas.width, context.canvas.height);
    context.setTransform(scale, 0, 0, scale, -region.x * scale, -region.y * scale);
    for (const item of items) {
      if (!overlaps(item.bounds, region)) continue;
      if (item.clip) {
        if (!overlaps(item.clip, region)) continue;
        context.save();
        context.beginPath();
        const clip = snap(item.clip, scale);
        context.rect(clip.x, clip.y, clip.width, clip.height);
        context.clip();
        drawItem(context, item, scale);
        context.restore();
      } else drawItem(context, item, scale);
    }
    context.globalAlpha = 1;
  };

  const forget = () => {
    images.clear();
    svgs.clear();
  };

  return {
    collect, collectSubtree, selection, paint, byPhase, copiesNeeded, warm, forget,
    set onLate(callback) { onLate = callback; },
  };
};
