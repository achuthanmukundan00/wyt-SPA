// Hero CRT filter: single-pass WebGL2 port of the CRT filter from crtview by
// Mattias Gustavsson (https://github.com/mattiasgustavsson/crtview), used here
// under the MIT License alternative. Copyright (c) 2016 Mattias Gustavsson.
//
// The ghosting/accumulate history, frame overlay and original/postprocess
// crossfade are omitted: one static hero texture, no frame history to persist.
// The image shader is capped at 30 FPS and pauses when inactive, hidden or
// reduced-motion is requested. The page-level SVG pass supplies shared phosphor
// raster, beam wobble and grain to the composed native DOM.
import './third-party-notices.js';

const VERT = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0., 1.); }`;

// Combined CSS grade brightness(.75) saturate(.45) as one matrix.
const FRAG = `#version 300 es
precision highp float;
precision highp sampler2D;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform vec2 u_img;
uniform float u_time;
out vec4 fragColor;

const mat3 GRADE = mat3(
  0.4252, 0.0877, 0.0877,
  0.2950, 0.6325, 0.2950,
  0.0298, 0.0298, 0.3673
);

vec2 curve(vec2 uv) {
  uv = (uv - 0.5) * 2.0;
  uv *= 1.1;
  uv.x *= 1.0 + pow((abs(uv.y) / 5.0), 2.0);
  uv.y *= 1.0 + pow((abs(uv.x) / 4.0), 2.0);
  uv = (uv / 2.0) + 0.5;
  uv = uv * 0.92 + 0.04;
  return uv;
}

void main() {
  vec2 fragCoord = gl_FragCoord.xy;
  float cover = max(u_res.x / u_img.x, u_res.y / u_img.y);
  vec2 off = (u_res - u_img * cover) * 0.5;
  vec2 q = (fragCoord - off) / (u_img * cover);
  vec2 uv = q;
  uv = curve(uv);
  float x = sin(0.3 * u_time + uv.y * 21.0) * sin(0.7 * u_time + uv.y * 29.0) * sin(0.3 + 0.33 * u_time + uv.y * 31.0) * 0.0017;
  vec3 col;
  col.r = texture(u_tex, vec2(x + uv.x + 0.001, uv.y + 0.001)).x + 0.05;
  col.g = texture(u_tex, vec2(x + uv.x + 0.000, uv.y - 0.002)).y + 0.05;
  col.b = texture(u_tex, vec2(x + uv.x - 0.002, uv.y + 0.000)).z + 0.05;
  col.r += 0.08 * texture(u_tex, 0.75 * vec2(x + 0.025, -0.027) + vec2(uv.x + 0.001, uv.y + 0.001)).x;
  col.g += 0.05 * texture(u_tex, 0.75 * vec2(x + -0.022, -0.02) + vec2(uv.x + 0.000, uv.y - 0.002)).y;
  col.b += 0.08 * texture(u_tex, 0.75 * vec2(x + -0.02, -0.018) + vec2(uv.x - 0.002, uv.y + 0.000)).z;
  col = GRADE * col;
  col = clamp(col * 0.6 + 0.4 * col * col * 1.0, 0.0, 1.0);
  float vig = (0.0 + 1.0 * 16.0 * uv.x * uv.y * (1.0 - uv.x) * (1.0 - uv.y));
  col *= vec3(pow(vig, 0.3));
  // Neutral white balance: no channel push, so whites stay white.
  col *= 1.4;
  // The page-level SVG pass owns the scanline and phosphor-grid pattern.
  col *= 1.0 + 0.01 * sin(110.0 * u_time);
  if (uv.x < 0.0 || uv.x > 1.0) col *= 0.0;
  if (uv.y < 0.0 || uv.y > 1.0) col *= 0.0;
  fragColor = vec4(col, 1.0);
}`;

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL shader unavailable.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(String(message || 'WebGL shader compilation failed.'));
  }
  return shader;
}

export function initHeroCRT(): () => void {
  const root = document.documentElement;
  const box = document.querySelector<HTMLElement>('.threshold-image');
  const img = box?.querySelector('img');
  if (!box || !img) return () => {};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let enabled = root.dataset.crt !== 'off';
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true });
  if (!gl) return () => {};
  let program: WebGLProgram | null = null;
  let vs: WebGLShader | null = null;
  let fs: WebGLShader | null = null;
  try {
    program = gl.createProgram();
    if (!program) throw new Error('WebGL program unavailable.');
    vs = compile(gl, gl.VERTEX_SHADER, VERT);
    fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.bindAttribLocation(program, 0, 'p');
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(String(gl.getProgramInfoLog(program) || 'WebGL program link failed.'));
  } catch {
    if (vs) gl.deleteShader(vs);
    if (fs) gl.deleteShader(fs);
    if (program) gl.deleteProgram(program);
    return () => {};
  }
  gl.useProgram(program);
  const locations = Object.fromEntries(
    ['u_tex', 'u_res', 'u_img', 'u_time'].map(name => [name, gl.getUniformLocation(program, name)])
  ) as Record<string, WebGLUniformLocation | null>;
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const texture = gl.createTexture();
  const photo = new Image();
  photo.decoding = 'async';
  const sourceURL = new URL(img.currentSrc || img.src, location.href).href;
  let disposed = false, raf = 0, visible = true, t0 = 0, lastDraw = 0, lost = false;
  const resize = () => {
    // Exact 2x integer backing store for crisp mask edges. Absurdly large
    // heroes fall back to a pixel budget instead of melting the GPU.
    const px = Math.max(1, box.clientWidth * box.clientHeight);
    const ratio = px * 4 <= 12000000 ? 2 : Math.sqrt(12000000 / px);
    const w = Math.max(1, Math.round(box.clientWidth * ratio)), h = Math.max(1, Math.round(box.clientHeight * ratio));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(locations.u_res, canvas.width, canvas.height);
  };
  const renderStill = () => {
    gl.uniform1f(locations.u_time, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };
  const frame = (now: number) => {
    raf = 0;
    if (disposed || lost || !enabled || document.hidden || !visible || reduced.matches) return;
    if (now - lastDraw >= 1000 / 30) {
      gl.uniform1f(locations.u_time, (now - t0) / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      lastDraw = now;
    }
    raf = requestAnimationFrame(frame);
  };
  const apply = () => { box.dataset.heroCrt = enabled ? 'on' : 'off'; };
  const sync = () => {
    if (lost) { box.dataset.heroCrt = 'off'; return; }
    enabled = root.dataset.crt !== 'off';
    apply();
    cancelAnimationFrame(raf);
    raf = 0;
    if (disposed || !canvas.isConnected || !enabled) return;
    resize();
    if (reduced.matches) { renderStill(); return; }
    if (document.hidden || !visible) return;
    t0 = performance.now();
    raf = requestAnimationFrame(frame);
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    raf = 0;
    box.dataset.heroCrt = 'off';
    canvas.remove();
  };
  canvas.addEventListener('webglcontextlost', onContextLost, { once: true });
  photo.onload = () => {
    if (disposed) return;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, photo);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.uniform2f(locations.u_img, photo.naturalWidth, photo.naturalHeight);
    box.prepend(canvas);
    sync();
  };
  photo.src = sourceURL;
  reduced.addEventListener('change', sync);
  const resizer = new ResizeObserver(() => {
    if (!enabled || disposed) return;
    resize();
    if (reduced.matches) renderStill();
  });
  resizer.observe(box);
  const vis = new IntersectionObserver(entries => {
    const next = entries.some(entry => entry.isIntersecting);
    if (visible === next) return;
    visible = next;
    sync();
  });
  vis.observe(box);
  const preferenceObserver = new MutationObserver(sync);
  preferenceObserver.observe(root, { attributes: true, attributeFilter: ['data-crt'] });
  const onPageHide = () => { cancelAnimationFrame(raf); raf = 0; };
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('pagehide', onPageHide, { once: true });
  window.addEventListener('pageshow', sync);
  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    resizer.disconnect();
    vis.disconnect();
    preferenceObserver.disconnect();
    reduced.removeEventListener('change', sync);
    document.removeEventListener('visibilitychange', sync);
    window.removeEventListener('pagehide', onPageHide);
    window.removeEventListener('pageshow', sync);
    canvas.remove();
  };
}
