// The tube: one WebGL2 program that shows the painted page (crt-paint.js)
// through a thick, curved CRT face. It reads three textures: the document in
// layers, the fixed controls, and an atlas of sticky labels. It draws when the
// page scrolls or is repainted, and while alive (crt.js) 30 times a second for
// a faint flicker, hum bar and breathing glow.

const VERTEX = `#version 300 es
in vec2 a_position;
uniform vec2 u_view;
out vec2 v_screen;
void main() {
  v_screen = vec2(a_position.x * 0.5 + 0.5, 0.5 - a_position.y * 0.5) * u_view;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
precision highp sampler2DArray;
in vec2 v_screen;            // CSS px, y down
out vec4 outColour;
uniform sampler2DArray u_page;
uniform sampler2D u_fixed;
uniform sampler2D u_sticky;
uniform vec2 u_view;         // viewport, CSS px
uniform float u_scroll;
uniform vec3 u_tile;         // CSS px of page per layer, margin above and below, layer height
uniform float u_layers;
uniform vec3 u_bend;         // shape.x, shape.y, k from crt-math.js bend()
uniform vec2 u_face;         // bezel inset and corner radius, CSS px
uniform float u_scale;       // backing px per CSS px
uniform float u_stripe;      // aperture-grille stripe width, backing px
uniform int u_stickyCount;
uniform vec4 u_stickyBox[8]; // where each sticky label is now, CSS px
uniform vec4 u_stickyUv[8];  // where it is in the atlas, uv
uniform float u_time;        // seconds
uniform float u_alive;       // 1 while the tube breathes, 0 when it is held still

const float PITCH = 4.0;     // CSS px per scanline: coarse, like a broadcast set
const float CONVERGE = 1.35; // CSS px of red/blue drift at the sides
const float COARSE = 0.26;   // how much of each line is the line's own signal
const float MASK_LIGHT = 1.38;
const float MASK_DARK = 0.81;
const vec3 PAPER = vec3(0.0314, 0.0353, 0.0353);

// The convex face: the screen point shows the page further out, so the middle
// holds still and the edges gather in.
vec2 bendPoint(vec2 screen) {
  vec2 c = screen / u_view * 2.0 - 1.0;
  vec2 p = c * u_bend.xy;
  return (c * (1.0 + u_bend.z * dot(p, p)) * 0.5 + 0.5) * u_view;
}

vec4 over(vec4 top, vec4 under) { return top + under * (1.0 - top.a); }

vec4 pageAt(vec2 q, float lod) {
  float y = q.y + u_scroll;
  float layer = clamp(floor(y / u_tile.x), 0.0, u_layers - 1.0);
  vec2 uv = vec2(q.x / u_view.x, (y - layer * u_tile.x + u_tile.y) / u_tile.z);
  return textureLod(u_page, vec3(uv, layer), lod);
}

// The page as the browser would show it at q: document, sticky labels, controls.
vec4 pictureAt(vec2 q, float lod) {
  vec4 colour = pageAt(q, lod);
  for (int i = 0; i < 8; i++) {
    if (i >= u_stickyCount) break;
    vec2 local = (q - u_stickyBox[i].xy) / u_stickyBox[i].zw;
    if (local.x >= 0.0 && local.y >= 0.0 && local.x <= 1.0 && local.y <= 1.0) {
      colour = over(textureLod(u_sticky, u_stickyUv[i].xy + local * u_stickyUv[i].zw, 0.0), colour);
    }
  }
  return over(textureLod(u_fixed, q / u_view, lod), colour);
}

vec3 lit(vec4 colour) { return colour.rgb + PAPER * (1.0 - colour.a); }

// Energy-normalised Gaussian beam whose width grows with brightness, so lit
// type blooms across the gaps and dark ground keeps its lines.
vec3 beam(float distance, vec3 colour) {
  vec3 sigma = mix(vec3(0.21), vec3(0.43), sqrt(colour));
  return colour * exp(-0.5 * distance * distance / (sigma * sigma)) / (sigma * 2.5066);
}

float hash(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

void main() {
  vec2 q = bendPoint(v_screen);
  vec2 mid = u_view * 0.5;
  vec2 corner = abs(q - mid) - (mid - u_face.x - u_face.y);
  float edge = length(max(corner, 0.0)) + min(max(corner.x, corner.y), 0.0) - u_face.y;
  float face = clamp(0.5 - edge * u_scale, 0.0, 1.0);
  float depth = max(-edge, 0.0);

  // Red and blue land a little apart toward the sides, like a set out of convergence.
  float drift = (v_screen.x / u_view.x - 0.5) * 2.0 * CONVERGE;
  vec3 detail = vec3(lit(pictureAt(q + vec2(drift, 0.0), 0.0)).r, lit(pictureAt(q, 0.0)).g, lit(pictureAt(q - vec2(drift, 0.0), 0.0)).b);
  float rows = q.y / PITCH - 0.5;
  float row = floor(rows);
  float f = rows - row;
  vec3 line = lit(pictureAt(vec2(q.x, (row + (f < 0.5 ? 0.5 : 1.5)) * PITCH), 1.0));
  vec3 colour = pow(mix(detail, line, COARSE), vec3(2.2));
  colour = beam(f, colour) + beam(1.0 - f, colour);

  float stripe = mod(floor(gl_FragCoord.x / u_stripe), 3.0);
  vec3 mask = vec3(MASK_DARK);
  if (stripe < 0.5) mask.r = MASK_LIGHT;
  else if (stripe < 1.5) mask.g = MASK_LIGHT;
  else mask.b = MASK_LIGHT;
  colour *= mask;

  vec2 uv = clamp((q - u_face.x) / (u_view - 2.0 * u_face.x), 0.0, 1.0);

  // Halation: light scattered inside the glass around bright detail, breathing
  // slowly while the tube is alive.
  vec3 glow = pow(lit(pictureAt(q, 3.0)), vec3(2.2)) * 0.5 + pow(lit(pictureAt(q, 5.0)), vec3(2.2)) * 0.5;
  float breathe = 1.0 + u_alive * 0.16 * sin(u_time * 1.3);
  colour += max(glow - 0.1, 0.0) * vec3(0.62, 0.6, 0.57) * breathe;

  // Life: the brightness flickers frame to frame over a slower unsteady wobble,
  // and a hum bar rolls down the face. A frame differs from the last by under
  // 6%: well inside the 10% of WCAG's general flash threshold, even on white.
  float frame = floor(u_time * 30.0);
  float waver = (hash(vec2(frame, 7.0)) - 0.5) * 0.04 + (sin(u_time * 23.0) + sin(u_time * 37.7)) * 0.009;
  float bar = exp(-pow((uv.y - fract(u_time / 9.0) * 1.3 + 0.15) / 0.09, 2.0));
  colour *= 1.0 + u_alive * (waver - 0.07 * bar);

  vec2 e = uv * (1.0 - uv);
  colour *= pow(clamp(16.0 * e.x * e.y, 0.0, 1.0), 0.2);
  // The glass is thick: its edge shades the phosphor just inside it.
  colour *= 1.0 - 0.42 * exp(-depth / 16.0);

  vec3 screen = pow(clamp(colour, 0.0, 1.0), vec3(1.0 / 2.2));
  float light = clamp(1.0 - v_screen.y / u_view.y * 1.3, 0.0, 1.0);
  screen += exp(-depth / 1.4) * mix(0.01, 0.06, light);
  vec2 s = (v_screen / u_view - vec2(0.27, 0.16)) * vec2(1.7, 2.6);
  screen += exp(-dot(s, s)) * 0.028;

  // The bezel is a recessed frame: dark at the outside, lifting toward the lip
  // of the glass, lit a little from above.
  vec2 outside = min(v_screen, u_view - v_screen);
  float rise = clamp(min(outside.x, outside.y) / max(u_face.x, 1.0), 0.0, 1.0);
  vec3 bezel = PAPER * (0.55 + 0.6 * rise * rise) * (0.9 + 0.3 * light) + exp(-max(edge, 0.0) / 2.2) * 0.03;
  float grain = hash(gl_FragCoord.xy + u_alive * frame * vec2(17.0, 31.0)) - 0.5;
  outColour = vec4(mix(bezel, screen, face) + grain * (1.0 + u_alive) / 255.0, 1.0);
}`;

const LEVELS = 6;

const compile = (gl, type, source) => {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  return shader;
};

export const createTube = (canvas) => {
  const gl = canvas.getContext('webgl2', {
    alpha: false, antialias: false, depth: false, stencil: false,
    preserveDrawingBuffer: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true,
  });
  if (!gl) return null;
  const program = gl.createProgram();
  gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
  gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return null;
  gl.useProgram(program);

  gl.bindVertexArray(gl.createVertexArray());
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a_position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

  const uniforms = Object.fromEntries(['page', 'fixed', 'sticky', 'view', 'scroll', 'tile', 'layers', 'bend', 'face', 'scale', 'stripe', 'stickyCount', 'stickyBox', 'stickyUv', 'time', 'alive']
    .map((name) => [name, gl.getUniformLocation(program, `u_${name}`)]));
  gl.uniform1i(uniforms.page, 0);
  gl.uniform1i(uniforms.fixed, 1);
  gl.uniform1i(uniforms.sticky, 2);

  const textures = { page: null, fixed: null, sticky: null };
  const stale = new Set();

  const make = (unit, target, allocate, mipmapped) => {
    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(target, texture);
    allocate();
    gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, mipmapped ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  };
  const levels = (width, height) => Math.min(LEVELS, 1 + Math.floor(Math.log2(Math.max(width, height, 1))));

  // Sizes are backing pixels. Each texture is remade only when its size changes.
  const sizes = {};
  const allocate = ({ width, height, layerHeight, layers, atlasWidth, atlasHeight }) => {
    const page = `${width}x${layerHeight}x${layers}`;
    if (sizes.page !== page) {
      if (textures.page) gl.deleteTexture(textures.page);
      textures.page = make(0, gl.TEXTURE_2D_ARRAY, () => gl.texStorage3D(gl.TEXTURE_2D_ARRAY, levels(width, layerHeight), gl.RGBA8, width, layerHeight, layers), true);
      sizes.page = page;
    }
    const fixed = `${width}x${height}`;
    if (sizes.fixed !== fixed) {
      if (textures.fixed) gl.deleteTexture(textures.fixed);
      textures.fixed = make(1, gl.TEXTURE_2D, () => gl.texStorage2D(gl.TEXTURE_2D, levels(width, height), gl.RGBA8, width, height), true);
      sizes.fixed = fixed;
    }
    const sticky = `${atlasWidth}x${atlasHeight}`;
    if (sizes.sticky !== sticky) {
      if (textures.sticky) gl.deleteTexture(textures.sticky);
      textures.sticky = make(2, gl.TEXTURE_2D, () => gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, Math.max(1, atlasWidth), Math.max(1, atlasHeight)), false);
      sizes.sticky = sticky;
    }
  };

  const upload = (name, source, x, y, layer = 0) => {
    const target = name === 'page' ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
    gl.activeTexture(gl.TEXTURE0 + ['page', 'fixed', 'sticky'].indexOf(name));
    gl.bindTexture(target, textures[name]);
    if (name === 'page') gl.texSubImage3D(target, 0, x, y, layer, source.width, source.height, 1, gl.RGBA, gl.UNSIGNED_BYTE, source);
    else gl.texSubImage2D(target, 0, x, y, gl.RGBA, gl.UNSIGNED_BYTE, source);
    if (name !== 'sticky') stale.add(name);
  };

  const draw = (frame) => {
    for (const name of stale) {
      const target = name === 'page' ? gl.TEXTURE_2D_ARRAY : gl.TEXTURE_2D;
      gl.activeTexture(gl.TEXTURE0 + ['page', 'fixed'].indexOf(name));
      gl.bindTexture(target, textures[name]);
      gl.generateMipmap(target);
    }
    stale.clear();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D_ARRAY, textures.page);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textures.fixed);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textures.sticky);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uniforms.view, ...frame.view);
    gl.uniform1f(uniforms.scroll, frame.scroll);
    gl.uniform3f(uniforms.tile, ...frame.tile);
    gl.uniform1f(uniforms.layers, frame.layers);
    gl.uniform3f(uniforms.bend, ...frame.bend);
    gl.uniform2f(uniforms.face, ...frame.face);
    gl.uniform1f(uniforms.scale, frame.scale);
    gl.uniform1f(uniforms.stripe, frame.stripe);
    gl.uniform1f(uniforms.time, frame.time);
    gl.uniform1f(uniforms.alive, frame.alive ? 1 : 0);
    const count = Math.min(8, frame.stickies.length);
    gl.uniform1i(uniforms.stickyCount, count);
    if (count) {
      gl.uniform4fv(uniforms.stickyBox, new Float32Array(frame.stickies.flatMap((sticky) => sticky.box)));
      gl.uniform4fv(uniforms.stickyUv, new Float32Array(frame.stickies.flatMap((sticky) => sticky.uv)));
    }
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const destroy = () => gl.getExtension('WEBGL_lose_context')?.loseContext();

  return { gl, maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE), allocate, upload, draw, destroy };
};
