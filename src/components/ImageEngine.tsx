"use client";

import { useEffect, useRef, useState } from "react";

export type PixelShape = "dots" | "hex" | "diamond" | "tri";
export type PixelMode = "halftone" | "filled";

type ImageEngineProps = {
  src: string;
  /** Target edge length of a cell in CSS pixels. */
  cellSize?: number;
  initialShape?: PixelShape;
  mode?: PixelMode;
  /** Multiplier on pixel radius. Values >1 make cells overlap. */
  pixelScale?: number;
  /** Brightness gamma; <1 lifts dim detail so more of the image reads. */
  gamma?: number;
  /** Minimum dot radius (cell units) so even dark cells stay visible. */
  minDot?: number;
  /** Additive glow on bright cells (city lights bloom). */
  glow?: number;
  twinkle?: boolean;
  drift?: boolean;
  /** Show the small shape-cycling control for comparison. */
  showShapeToggle?: boolean;
  className?: string;
};

const SHAPES: PixelShape[] = ["dots", "hex", "diamond", "tri"];

function shapeIndex(shape: PixelShape): number {
  switch (shape) {
    case "dots":
      return 0;
    case "diamond":
      return 1;
    case "tri":
      return 2;
    case "hex":
      return 3;
  }
}

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
varying vec2 vUv;

uniform sampler2D uTex;
uniform vec2 uGrid;
uniform vec2 uUVScale;
uniform vec2 uUVOffset;
uniform float uTime;
uniform float uPixelScale;
uniform float uGamma;
uniform float uMinDot;
uniform float uGlow;
uniform float uShape;
uniform float uMode;
uniform float uAA;
uniform float uCellAspect;
uniform float uTwinkle;
uniform float uDrift;
uniform vec3 uBg;

// Hash without sin() — avoids the diagonal alignment artifacts of sin-hashes.
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Smooth 2D value noise.
float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

// Fractal noise: several octaves with a rotation between each so the
// result has no axis-aligned structure. Output roughly in [0, 1].
float fbm(vec2 p) {
  float v = 0.0;
  float amp = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int k = 0; k < 4; k++) {
    v += amp * noise(p);
    p = rot * p * 2.0;
    amp *= 0.5;
  }
  return v;
}

// Domain-warped fbm -> organic, cloud-like, non-repeating motion.
float driftField(vec2 p, float t) {
  vec2 flow = vec2(t * 0.04, t * -0.028);
  vec2 warp = vec2(fbm(p + flow), fbm(p + flow + vec2(5.2, 1.3)));
  return fbm(p + 1.6 * warp);
}

float sdHex(vec2 p, float r) {
  const vec3 k = vec3(-0.8660254, 0.5, 0.5773503);
  p = abs(p);
  p -= 2.0 * min(dot(k.xy, p), 0.0) * k.xy;
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

float sdTri(vec2 p, float r) {
  const float k = 1.7320508;
  p.x = abs(p.x) - r;
  p.y = p.y + r / k;
  if (p.x + k * p.y > 0.0) p = vec2(p.x - k * p.y, -k * p.x - p.y) / 2.0;
  p.x -= clamp(p.x, -2.0 * r, 0.0);
  return -length(p) * sign(p.y);
}

float sd(vec2 d, float radius, float shape) {
  if (shape < 0.5) return length(d) - radius;
  else if (shape < 1.5) return (abs(d.x) + abs(d.y)) - radius;
  else if (shape < 2.5) return sdTri(d, radius);
  return sdHex(d, radius);
}

vec3 sampleCell(vec2 cell, float drift, out float b) {
  vec2 center = (cell + 0.5) / uGrid;
  vec2 uv = center * uUVScale + uUVOffset;
  vec3 col = texture2D(uTex, uv).rgb;
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  luma = pow(luma, uGamma);
  // Above the horizon (sky) only bright cells twinkle so it stays calm;
  // below it (ocean) everything keeps full shimmer for the wave reflections.
  float cellY = (cell.y + 0.5) / uGrid.y;        // 0 = bottom/ocean, 1 = top/sky
  float skyMask = step(0.48, cellY);
  float twW = mix(1.0, smoothstep(0.4, 0.9, luma), skyMask);
  float tw = 1.0 + uTwinkle * 0.6 * twW * sin(uTime * 2.4 + hash(cell) * 6.2831);
  b = clamp(luma * tw * drift, 0.0, 1.0);
  return col;
}

void main() {
  vec2 frag = vUv * uGrid;
  vec2 baseCell = floor(frag);

  // One continuous, domain-warped drift value for this fragment (centered on ~0.5).
  // Strongly damp it above the horizon so the sky stays still; ocean keeps full drift.
  float skyDamp = 1.0 - 0.78 * step(0.48, vUv.y);
  float drift = 1.0 + uDrift * 0.7 * skyDamp * (driftField(frag * 0.045, uTime) - 0.45);

  if (uMode > 0.5) {
    float b;
    vec3 col = sampleCell(baseCell, drift, b);
    gl_FragColor = vec4(col + uGlow * b * b, 1.0);
    return;
  }

  float bestCover = 0.0;
  vec3 bestCol = uBg;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 cell = baseCell + vec2(float(i), float(j));
      if (cell.x < 0.0 || cell.y < 0.0 || cell.x >= uGrid.x || cell.y >= uGrid.y) continue;
      float b;
      vec3 col = sampleCell(cell, drift, b);
      // Fade the minimum-dot floor out for near-black cells so dark
      // corners stop rendering a static grid of tiny dots.
      float radius = 0.5 * uPixelScale * sqrt(b) + uMinDot * smoothstep(0.02, 0.18, b);
      vec2 d = frag - (cell + 0.5);
      d.y *= uCellAspect;
      float dist = sd(d, radius, uShape);
      float c = 1.0 - smoothstep(-uAA, uAA, dist);
      if (c > bestCover) {
        bestCover = c;
        bestCol = col + uGlow * b * b;
      }
    }
  }
  gl_FragColor = vec4(mix(uBg, bestCol, bestCover), 1.0);
}
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error("ImageEngine shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext) {
  const vs = createShader(gl, gl.VERTEX_SHADER, VERT_SRC);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC);
  if (!vs || !fs) return null;
  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error("ImageEngine link error:", gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

export default function ImageEngine({
  src,
  cellSize = 3,
  initialShape = "dots",
  mode = "halftone",
  pixelScale = 3,
  gamma = 0.55,
  minDot = 0.001,
  glow = 0.5,
  twinkle = true,
  drift = true,
  showShapeToggle = true,
  className,
}: ImageEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [shape, setShape] = useState<PixelShape>(initialShape);

  // Live-tunable config read by the render loop without re-initializing GL.
  const configRef = useRef({ shape, mode, pixelScale, gamma, minDot, glow, twinkle, drift });
  useEffect(() => {
    configRef.current = { shape, mode, pixelScale, gamma, minDot, glow, twinkle, drift };
  }, [shape, mode, pixelScale, gamma, minDot, glow, twinkle, drift]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      antialias: true,
    }) as WebGLRenderingContext | null;

    // ---- Fallback: no WebGL -> just paint the image (cover) on a 2D canvas. ----
    if (!gl) {
      const ctx = canvas.getContext("2d");
      const img = new Image();
      const paint = () => {
        if (!ctx) return;
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = Math.max(1, Math.floor(rect.width));
        const cssH = Math.max(1, Math.floor(rect.height));
        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);
        canvas.style.width = `${cssW}px`;
        canvas.style.height = `${cssH}px`;
        if (!img.complete || !img.naturalWidth) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const ir = img.naturalWidth / img.naturalHeight;
        const cr = cssW / cssH;
        let dw = cssW;
        let dh = cssH;
        if (ir > cr) dw = cssH * ir;
        else dh = cssW / ir;
        ctx.drawImage(img, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      };
      img.onload = paint;
      img.src = src;
      const ro = new ResizeObserver(paint);
      ro.observe(container);
      return () => {
        ro.disconnect();
        img.onload = null;
      };
    }

    // ---- WebGL path ----
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    let texture: WebGLTexture | null = null;
    let raf = 0;
    let textureReady = false;
    const uniforms: Record<string, WebGLUniformLocation | null> = {};

    const view = { cols: 1, rows: 1, sx: 1, sy: 1, ox: 0, oy: 0, aa: 0.02, cellAspect: 1 };

    const img = new Image();
    let imgReady = false;

    const u = (name: string) => uniforms[name];

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, Math.floor(rect.width));
      const cssH = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const cols = Math.max(1, Math.round(cssW / cellSize));
      const rows = Math.max(1, Math.round(cssH / cellSize));
      view.cols = cols;
      view.rows = rows;

      const canvasAspect = cssW / cssH;
      const imageAspect = imgReady ? img.naturalWidth / img.naturalHeight : canvasAspect;
      const ratio = canvasAspect / imageAspect;
      if (ratio > 1) {
        view.sx = 1;
        view.sy = 1 / ratio;
      } else {
        view.sx = ratio;
        view.sy = 1;
      }
      view.ox = (1 - view.sx) / 2;
      view.oy = (1 - view.sy) / 2;

      const cellPxW = canvas.width / cols;
      const cellPxH = canvas.height / rows;
      view.aa = 1 / cellPxW;
      view.cellAspect = cellPxH / cellPxW;
    };

    const uploadTexture = () => {
      if (!texture || !imgReady) return;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      textureReady = true;
    };

    const init = () => {
      program = createProgram(gl);
      if (!program) return false;
      gl.useProgram(program);

      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const aPos = gl.getAttribLocation(program, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      for (const name of [
        "uTex",
        "uGrid",
        "uUVScale",
        "uUVOffset",
        "uTime",
        "uPixelScale",
        "uGamma",
        "uMinDot",
        "uGlow",
        "uShape",
        "uMode",
        "uAA",
        "uCellAspect",
        "uTwinkle",
        "uDrift",
        "uBg",
      ]) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }

      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      // 1x1 placeholder until the image loads.
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGB,
        1,
        1,
        0,
        gl.RGB,
        gl.UNSIGNED_BYTE,
        new Uint8Array([10, 10, 12]),
      );
      gl.uniform1i(u("uTex"), 0);

      uploadTexture();
      resize();
      return true;
    };

    const draw = (timeMs: number) => {
      if (!program) return;
      const cfg = configRef.current;
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);

      gl.uniform1f(u("uTime"), reduced ? 0 : timeMs * 0.001);
      gl.uniform1f(u("uPixelScale"), cfg.pixelScale);
      gl.uniform1f(u("uGamma"), cfg.gamma);
      gl.uniform1f(u("uMinDot"), cfg.minDot);
      gl.uniform1f(u("uGlow"), cfg.glow);
      gl.uniform1f(u("uShape"), shapeIndex(cfg.shape));
      gl.uniform1f(u("uMode"), cfg.mode === "filled" ? 1 : 0);
      gl.uniform1f(u("uTwinkle"), cfg.twinkle && !reduced ? 1 : 0);
      gl.uniform1f(u("uDrift"), cfg.drift && !reduced ? 1 : 0);
      gl.uniform2f(u("uGrid"), view.cols, view.rows);
      gl.uniform2f(u("uUVScale"), view.sx, view.sy);
      gl.uniform2f(u("uUVOffset"), view.ox, view.oy);
      gl.uniform1f(u("uAA"), view.aa);
      gl.uniform1f(u("uCellAspect"), view.cellAspect);
      gl.uniform3f(u("uBg"), 0.98039, 0.98039, 0.97255);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    };

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (!textureReady) return;
      if (reduced) {
        draw(0);
      } else {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(loop);
      }
    };

    img.onload = () => {
      imgReady = true;
      uploadTexture();
      resize();
      start();
    };
    img.src = src;

    const ok = init();
    if (!ok) return;
    if (reduced && textureReady) draw(0);

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(container);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      textureReady = false;
    };
    const onRestored = () => {
      if (init()) start();
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      img.onload = null;
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (texture) gl.deleteTexture(texture);
    };
  }, [src, cellSize]);

  return (
    <div ref={containerRef} className={`relative h-full w-full ${className ?? ""}`}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
      {showShapeToggle ? (
        <button
          type="button"
          onClick={() => setShape((s) => SHAPES[(SHAPES.indexOf(s) + 1) % SHAPES.length])}
          aria-label={`Pixel shape: ${shape}. Click to change.`}
          className="absolute bottom-3 right-3 rounded-full border border-faint/40 bg-background/70 px-3 py-1 text-xs text-muted backdrop-blur transition-colors hover:text-foreground"
        >
          {shape}
        </button>
      ) : null}
    </div>
  );
}
