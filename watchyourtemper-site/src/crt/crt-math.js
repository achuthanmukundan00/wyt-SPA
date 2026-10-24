// DOM-free helpers for the CRT screen, so the maths runs under node --test.

const multiply = (a, b) => a.map((row) => [0, 1, 2].map((column) =>
  row[0] * b[0][column] + row[1] * b[1][column] + row[2] * b[2][column]));
const transform = (matrix, vector) => matrix.map((row) => row[0] * vector[0] + row[1] * vector[1] + row[2] * vector[2]);

const parseAmount = (value, fallback) => {
  if (!value) return fallback;
  const match = /^(-?\d*\.?\d+(?:e-?\d+)?)(%?)$/i.exec(value);
  if (!match) return null;
  return Math.max(0, Number(match[1]) / (match[2] ? 100 : 1));
};

const radiansPer = { deg: Math.PI / 180, grad: Math.PI / 200, rad: 1, turn: Math.PI * 2 };
const parseAngle = (value) => {
  if (!value || value === '0') return 0;
  const match = /^(-?\d*\.?\d+(?:e-?\d+)?)(deg|grad|rad|turn)$/i.exec(value);
  return match ? Number(match[1]) * radiansPer[match[2].toLowerCase()] : null;
};

// Matrices are the sRGB definitions from Filter Effects Module Level 1, which is
// what browsers use for the CSS shorthand functions. Each step is affine:
// colour' = matrix * colour + offset.
const toward = (amount, from, to) => from.map((row, r) => row.map((value, c) => to[r][c] + (value - to[r][c]) * amount));
const SEPIA = [[0.393, 0.769, 0.189], [0.349, 0.686, 0.168], [0.272, 0.534, 0.131]];
const GREY = [[0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722], [0.2126, 0.7152, 0.0722]];
const IDENTITY = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const scaled = (a) => [[a, 0, 0], [0, a, 0], [0, 0, a]];
const linear = (matrix) => ({ matrix, offset: [0, 0, 0] });

const filters = {
  brightness: (value) => {
    const a = parseAmount(value, 1);
    return a === null ? null : linear(scaled(a));
  },
  contrast: (value) => {
    const a = parseAmount(value, 1);
    return a === null ? null : { matrix: scaled(a), offset: [0.5 - 0.5 * a, 0.5 - 0.5 * a, 0.5 - 0.5 * a] };
  },
  invert: (value) => {
    const a = parseAmount(value, 1);
    return a === null ? null : { matrix: scaled(1 - 2 * Math.min(1, a)), offset: [Math.min(1, a), Math.min(1, a), Math.min(1, a)] };
  },
  saturate: (value) => {
    const s = parseAmount(value, 1);
    return s === null ? null : linear([
      [0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s],
      [0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s],
      [0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s],
    ]);
  },
  sepia: (value) => {
    const a = parseAmount(value, 1);
    return a === null ? null : linear(toward(1 - Math.min(1, a), IDENTITY, SEPIA));
  },
  grayscale: (value) => {
    const a = parseAmount(value, 1);
    return a === null ? null : linear(toward(1 - Math.min(1, a), IDENTITY, GREY));
  },
  'hue-rotate': (value) => {
    const angle = parseAngle(value);
    if (angle === null) return null;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return linear([
      [0.213 + cos * 0.787 - sin * 0.213, 0.715 - cos * 0.715 - sin * 0.715, 0.072 - cos * 0.072 + sin * 0.928],
      [0.213 - cos * 0.213 + sin * 0.143, 0.715 + cos * 0.285 + sin * 0.140, 0.072 - cos * 0.072 - sin * 0.283],
      [0.213 - cos * 0.213 - sin * 0.787, 0.715 - cos * 0.715 + sin * 0.715, 0.072 + cos * 0.928 + sin * 0.072],
    ]);
  },
};

// Folds a computed CSS `filter` into one affine colour transform, so a copy of an
// image drawn into the screen matches the page. Returns null for anything that is
// not a colour transform (blur, drop-shadow, opacity, url(...)).
export const colourTransform = (filter) => {
  const source = String(filter ?? '').trim();
  let result = { matrix: IDENTITY.map((row) => [...row]), offset: [0, 0, 0] };
  if (!source || source === 'none') return result;
  const pattern = /([a-z-]+)\(([^)]*)\)\s*/gy;
  let match;
  let consumed = 0;
  while ((match = pattern.exec(source))) {
    const build = filters[match[1]];
    const step = build ? build(match[2].trim()) : null;
    if (!step) return null;
    const offset = transform(step.matrix, result.offset).map((value, i) => value + step.offset[i]);
    result = { matrix: multiply(step.matrix, result.matrix), offset };
    consumed = pattern.lastIndex;
  }
  return consumed === source.length ? result : null;
};

export const isIdentity = ({ matrix, offset }) => matrix.every((row, r) => row.every((value, c) => value === (r === c ? 1 : 0)))
  && offset.every((value) => value === 0);

// Applies a colour transform to unpremultiplied RGBA bytes in place.
export const applyColourTransform = (data, { matrix, offset }) => {
  const [m0, m1, m2] = matrix;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;
    data[i] = 255 * (m0[0] * r + m0[1] * g + m0[2] * b + offset[0]);
    data[i + 1] = 255 * (m1[0] * r + m1[1] * g + m1[2] * b + offset[1]);
    data[i + 2] = 255 * (m2[0] * r + m2[1] * g + m2[2] * b + offset[2]);
  }
  return data;
};

// Splits on commas that are not inside parentheses.
const splitTop = (value) => {
  const parts = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < value.length; i++) {
    if (value[i] === '(') depth++;
    else if (value[i] === ')') depth--;
    else if (value[i] === ',' && depth === 0) {
      parts.push(value.slice(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(value.slice(start).trim());
  return parts.filter(Boolean);
};

const parseColour = (value) => {
  const match = /^rgba?\(([^)]+)\)/.exec(value);
  if (!match) return value === 'transparent' ? [0, 0, 0, 0] : null;
  const channels = match[1].split(/[\s,/]+/).filter(Boolean).map(Number);
  if (channels.length < 3 || channels.some(Number.isNaN)) return null;
  return [channels[0], channels[1], channels[2], channels.length > 3 ? channels[3] : 1];
};

// Corner directions depend on the box's shape, so only sides and angles are read.
const SIDES = { top: 0, right: 90, bottom: 180, left: 270 };
const directionAngle = (value) => {
  const angle = parseAngle(value);
  if (angle !== null) return angle;
  const match = /^to (top|right|bottom|left)$/.exec(value);
  return match ? (SIDES[match[1]] * Math.PI) / 180 : null;
};

// Gives every stop a position and gives transparent stops their neighbour's
// colour, so canvas (which interpolates unpremultiplied) fades like CSS does.
export const resolveStops = (stops) => {
  const resolved = stops.map((stop) => ({ colour: [...stop.colour], at: stop.at }));
  if (resolved[0].at === null) resolved[0].at = 0;
  if (resolved.at(-1).at === null) resolved.at(-1).at = 1;
  let highest = 0;
  for (const stop of resolved) {
    if (stop.at === null) continue;
    stop.at = Math.max(stop.at, highest);
    highest = stop.at;
  }
  for (let i = 1; i < resolved.length - 1; i++) {
    if (resolved[i].at !== null) continue;
    let next = i;
    while (resolved[next].at === null) next++;
    const from = resolved[i - 1].at;
    const to = resolved[next].at;
    for (let j = i; j < next; j++) resolved[j].at = from + ((to - from) * (j - i + 1)) / (next - i + 1);
  }
  resolved.forEach((stop, i) => {
    if (stop.colour[3] !== 0) return;
    const neighbour = resolved[i + 1]?.colour[3] ? resolved[i + 1] : resolved[i - 1];
    if (neighbour) stop.colour = [...neighbour.colour.slice(0, 3), 0];
  });
  return resolved;
};

// Parses a computed `background-image` into the gradient layers the screen can
// paint, bottom layer last as in CSS. Linear gradients take any angle or side;
// radial gradients only the default ellipse, farthest-corner, at the centre.
// Layers it cannot reproduce come back as null.
export const parseGradients = (value) => {
  if (!value || value === 'none') return [];
  return splitTop(value).map((layer) => {
    const match = /^(linear|radial)-gradient\((.*)\)$/.exec(layer);
    if (!match) return null;
    const args = splitTop(match[2]);
    let angle = Math.PI;
    if (match[1] === 'linear' && !parseColour(args[0])) {
      angle = directionAngle(args.shift());
      if (angle === null) return null;
    }
    if (match[1] === 'radial' && !parseColour(args[0])) {
      if (!/^(ellipse)?\s*(farthest-corner)?\s*(at (center|50% 50%|center center))?$/.test(args.shift())) return null;
    }
    const stops = [];
    for (const arg of args) {
      const colour = parseColour(arg);
      if (!colour) return null;
      const position = arg.slice(arg.indexOf(')') + 1).trim();
      const at = position.endsWith('%') ? Number.parseFloat(position) / 100 : null;
      if (position && at === null) return null;
      stops.push({ colour, at });
    }
    return stops.length >= 2 ? { type: match[1], angle, stops: resolveStops(stops) } : null;
  });
};

// The gradient line of a CSS linear-gradient over a width x height box.
export const gradientLine = (angle, width, height) => {
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const half = (Math.abs(width * dx) + Math.abs(height * dy)) / 2;
  return { x0: width / 2 - dx * half, y0: height / 2 - dy * half, x1: width / 2 + dx * half, y1: height / 2 + dy * half };
};

// Destination and source rectangles for `object-fit` (centred) inside a box.
// Where object-position puts the image's near edge, from the box's near edge,
// for one axis: a percentage of the free space or a length. Anything else (a
// calc(), say) centres, as the screen cannot know what the page meant.
const positionOffset = (part, free) => {
  const match = /^(-?\d*\.?\d+)(%|px)$/.exec(part ?? '');
  if (!match) return free / 2;
  return match[2] === '%' ? free * Number(match[1]) / 100 : Number(match[1]);
};

export const objectFit = (fit, box, natural, position = '50% 50%') => {
  const full = { x: 0, y: 0, width: natural.width, height: natural.height };
  if (fit === 'fill' || !natural.width || !natural.height) return { destination: box, source: full };
  const ratio = { x: box.width / natural.width, y: box.height / natural.height };
  let scale = fit === 'cover' ? Math.max(ratio.x, ratio.y) : Math.min(ratio.x, ratio.y);
  if (fit === 'none') scale = 1;
  if (fit === 'scale-down') scale = Math.min(1, Math.min(ratio.x, ratio.y));
  const width = natural.width * scale;
  const height = natural.height * scale;
  const [across, down] = position.trim().split(/\s+/);
  const left = positionOffset(across, box.width - width);
  const top = positionOffset(down, box.height - height);
  // The part of the placed image inside the box.
  const x0 = Math.max(0, left);
  const y0 = Math.max(0, top);
  const x1 = Math.min(box.width, left + width);
  const y1 = Math.min(box.height, top + height);
  const destination = { x: box.x + x0, y: box.y + y0, width: Math.max(0, x1 - x0), height: Math.max(0, y1 - y0) };
  const source = { x: (x0 - left) / scale, y: (y0 - top) / scale, width: destination.width / scale, height: destination.height / scale };
  return { destination, source };
};

// The face of the tube. At each screen point c (centred, -1 to 1 per axis) the
// screen shows the page at c * (1 + k|c * shape|^2): the middle stays put, so
// links stay where they are drawn, and the edges are gathered in. k is capped
// so no point moves more than `maxShift` CSS px.
export const bend = (width, height, { curve = 0.045, maxShift = 18 } = {}) => {
  const diagonal = Math.hypot(width, height) || 1;
  const shape = [width / diagonal, height / diagonal];
  return { shape, k: Math.min(curve, maxShift / (diagonal / 2)) };
};

const gain = ({ shape, k }, cx, cy) => 1 + k * ((cx * shape[0]) ** 2 + (cy * shape[1]) ** 2);

// Screen point to the page point drawn there, in CSS px of a width x height screen.
export const bendSource = (x, y, width, height, options) => {
  const cx = (2 * x) / width - 1;
  const cy = (2 * y) / height - 1;
  const g = gain(bend(width, height, options), cx, cy);
  return [((cx * g + 1) * width) / 2, ((cy * g + 1) * height) / 2];
};

// Page point to where it lands on screen: bendSource inverted by fixed-point
// iteration, which settles fast because the gain changes slowly.
export const bendTarget = (x, y, width, height, options) => {
  const terms = bend(width, height, options);
  const cx = (2 * x) / width - 1;
  const cy = (2 * y) / height - 1;
  let sx = cx;
  let sy = cy;
  for (let step = 0; step < 16; step++) {
    const g = gain(terms, sx, sy);
    sx = cx / g;
    sy = cy / g;
  }
  return [((sx + 1) * width) / 2, ((sy + 1) * height) / 2];
};

// Splits a tall document into texture-array layers. Each layer holds `span` CSS px
// of the page plus `margin` above and below, so sampling (and blurred mip levels)
// never reaches across a seam.
export const tileLayout = (documentHeight, scale, maxTexture = 4096) => {
  const textureHeight = Math.min(2048, maxTexture);
  const margin = Math.ceil(48 / scale);
  const span = Math.floor(textureHeight / scale) - 2 * margin;
  return { span, margin, textureHeight, layers: Math.max(1, Math.ceil(documentHeight / span)) };
};

// Backing-store pixels per CSS pixel. Density is capped near 1.5, preferring a
// whole-number divisor of the device ratio so each backing pixel lands on whole
// device pixels (keeps the phosphor mask from beating), then capped by area.
export const backingScale = (devicePixelRatio, cssWidth, cssHeight, maxPixels = 2_500_000) => {
  const dpr = Number.isFinite(devicePixelRatio) && devicePixelRatio > 0 ? devicePixelRatio : 1;
  let scale = dpr <= 1.5 ? dpr : dpr / Math.ceil(dpr / 1.5);
  if (dpr > 1 && scale < 1) scale = 1;
  const area = cssWidth * cssHeight * scale * scale;
  return area > maxPixels ? scale * Math.sqrt(maxPixels / area) : scale;
};
