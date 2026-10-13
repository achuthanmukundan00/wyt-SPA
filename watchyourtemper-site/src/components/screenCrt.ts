const VERTEX_SHADER = `#version 300 es
in vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

// A fixed phosphor mask sits above the composed page, so foreground DOM text
// gets the same coarse scanlines and RGB aperture texture as imagery.
const FRAGMENT_SHADER = `#version 300 es
precision mediump float;
uniform vec2 u_resolution;
uniform float u_pixel_ratio;
out vec4 fragColor;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

vec3 phosphorTint(float column) {
  if (column < 0.5) return vec3(1.0, 0.74, 0.69);
  if (column < 1.5) return vec3(0.74, 1.0, 0.78);
  return vec3(0.73, 0.80, 1.0);
}

void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 screen = pixel / u_pixel_ratio;
  vec2 uv = pixel / u_resolution;
  vec2 bent = (uv - 0.5) * vec2(u_resolution.x / u_resolution.y, 1.0);
  float edge = smoothstep(0.38, 0.82, length(bent));
  float scanline = step(4.8, mod(floor(screen.y), 6.0));
  float column = mod(floor(screen.x), 3.0);
  float grain = hash(floor(screen / vec2(3.0, 6.0)));
  float alpha = clamp(0.06 + scanline * 0.20 + grain * 0.035 + edge * 0.14, 0.0, 0.40);
  vec3 color = mix(phosphorTint(column), vec3(0.0), scanline * 0.85);
  color = mix(color, vec3(1.0), step(0.95, grain) * 0.25);
  fragColor = vec4(color, alpha);
}`;

type Renderer = {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  buffer: WebGLBuffer;
  resolution: WebGLUniformLocation;
  pixelRatio: WebGLUniformLocation;
};

function compile(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type);
  if (!shader) throw new Error('WebGL shader unavailable.');
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(message || 'WebGL shader compilation failed.');
  }
  return shader;
}

function createRenderer(canvas: HTMLCanvasElement): Renderer | null {
  const gl = canvas.getContext('webgl2', {
    alpha: true,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: true,
    powerPreference: 'low-power',
  });
  if (!gl) return null;

  let program: WebGLProgram | null = null;
  let vertex: WebGLShader | null = null;
  let fragment: WebGLShader | null = null;
  try {
    program = gl.createProgram();
    if (!program) throw new Error('WebGL program unavailable.');
    vertex = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.bindAttribLocation(program, 0, 'p');
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || 'WebGL program link failed.');
    }
  } catch {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    if (program) gl.deleteProgram(program);
    return null;
  }

  gl.useProgram(program);
  const resolution = gl.getUniformLocation(program, 'u_resolution');
  const pixelRatio = gl.getUniformLocation(program, 'u_pixel_ratio');
  const buffer = gl.createBuffer();
  if (!resolution || !pixelRatio || !buffer) {
    gl.deleteProgram(program);
    if (buffer) gl.deleteBuffer(buffer);
    return null;
  }
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  return { gl, program, buffer, resolution, pixelRatio };
}

export function initScreenCRT({ storageKey = 'wyt-crt' }: { storageKey?: string } = {}): () => void {
  const root = document.documentElement;
  const button = document.querySelector<HTMLButtonElement>('[data-crt-toggle]');
  const forcedColors = matchMedia('(forced-colors: active)');
  let enabled = true;
  try { enabled = localStorage.getItem(storageKey) !== 'off'; } catch { /* Optional preference. */ }
  root.dataset.crt = enabled ? 'on' : 'off';

  const paintToggle = () => {
    if (!button) return;
    button.setAttribute('aria-pressed', String(enabled));
    button.title = enabled ? 'Turn CRT effect off' : 'Turn CRT effect on';
  };
  const persist = () => {
    try { localStorage.setItem(storageKey, enabled ? 'on' : 'off'); } catch { /* Optional preference. */ }
  };
  const canvas = document.createElement('canvas');
  canvas.id = 'page-crt-shader';
  canvas.className = 'crt-shader-layer';
  canvas.setAttribute('aria-hidden', 'true');
  const renderer = createRenderer(canvas);
  let disposed = false;
  let lost = false;

  const resizeAndDraw = () => {
    if (!renderer || disposed || lost) return;
    const width = Math.max(1, window.innerWidth);
    const height = Math.max(1, window.innerHeight);
    const pixels = width * height;
    const ratio = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt(1_500_000 / pixels));
    const backingWidth = Math.max(1, Math.round(width * ratio));
    const backingHeight = Math.max(1, Math.round(height * ratio));
    if (canvas.width !== backingWidth || canvas.height !== backingHeight) {
      canvas.width = backingWidth;
      canvas.height = backingHeight;
    }
    renderer.gl.viewport(0, 0, canvas.width, canvas.height);
    renderer.gl.uniform2f(renderer.resolution, canvas.width, canvas.height);
    renderer.gl.uniform1f(renderer.pixelRatio, backingWidth / width);
    if (enabled && !forcedColors.matches) renderer.gl.drawArrays(renderer.gl.TRIANGLES, 0, 3);
    else {
      renderer.gl.clearColor(0, 0, 0, 0);
      renderer.gl.clear(renderer.gl.COLOR_BUFFER_BIT);
    }
  };

  const onToggle = () => {
    enabled = !enabled;
    root.dataset.crt = enabled ? 'on' : 'off';
    paintToggle();
    persist();
    resizeAndDraw();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    canvas.remove();
    if (root.dataset.crtRenderer === 'webgl') delete root.dataset.crtRenderer;
  };
  const onMediaChange = () => resizeAndDraw();

  paintToggle();
  button?.addEventListener('click', onToggle);
  if (renderer) {
    canvas.addEventListener('webglcontextlost', onContextLost, { once: true });
    document.body.append(canvas);
    root.dataset.crtRenderer = 'webgl';
    resizeAndDraw();
    window.addEventListener('resize', resizeAndDraw, { passive: true });
    window.visualViewport?.addEventListener('resize', resizeAndDraw, { passive: true });
    forcedColors.addEventListener('change', onMediaChange);
  }

  return () => {
    disposed = true;
    button?.removeEventListener('click', onToggle);
    if (renderer) {
      window.removeEventListener('resize', resizeAndDraw);
      window.visualViewport?.removeEventListener('resize', resizeAndDraw);
      forcedColors.removeEventListener('change', onMediaChange);
      canvas.remove();
      renderer.gl.deleteBuffer(renderer.buffer);
      renderer.gl.deleteProgram(renderer.program);
      if (root.dataset.crtRenderer === 'webgl') delete root.dataset.crtRenderer;
    }
  };
}
