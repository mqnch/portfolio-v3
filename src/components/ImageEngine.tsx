"use client";

import { useEffect, useRef } from "react";

export type PixelMode = "halftone" | "filled";

/**
 * Per-image render specification. Each photo can declare its own look (horizon
 * line, how calm the sky is, brightness/bloom, etc.). Anything omitted falls
 * back to DEFAULT_TUNING, and values are smoothly interpolated during the
 * dissolve between two images. Add new images by declaring one of these.
 */
export type ImageTuning = {
  src: string;
  /** Multiplier on pixel radius. Values >1 make cells overlap. */
  pixelScale?: number;
  /** Brightness gamma; <1 lifts dim detail so more of the image reads. */
  gamma?: number;
  /** Minimum dot radius (cell units) so even dark cells stay visible. */
  minDot?: number;
  /**
   * Solid dot radius (cell units) applied only to the very darkest cells so
   * true-black regions render as dark ink instead of bare white paper. 0 keeps
   * the default behaviour (black areas show the paper through).
   */
  darkFill?: number;
  /**
   * How much per-cell size variation the dark fill keeps (0 = flat solid,
   * 1 = strong). A little keeps some halftone texture in the dark areas.
   */
  darkFillTexture?: number;
  /** Additive glow on bright cells (city lights bloom). */
  glow?: number;
  twinkle?: boolean;
  drift?: boolean;
  /** Normalized height of the horizon (0 = bottom, 1 = top); sky is above it. */
  horizon?: number;
  /** Half-width of the soft feather band around the horizon (normalized). */
  horizonSoftness?: number;
  /** 0 = sky twinkles fully, 1 = only bright sky cells twinkle (calm sky). */
  skyTwinkleCalm?: number;
  /** 0 = sky drifts fully, 1 = sky drift fully damped (still sky). */
  skyDriftDamp?: number;
  /** Vertical crop anchor for object-cover: 0 = bottom, 0.5 = center, 1 = top/sky. */
  focusY?: number;
  /** Color saturation multiplier; 1 = unchanged, >1 = richer color. */
  saturation?: number;
};

const DEFAULT_TUNING = {
  pixelScale: 4,
  gamma: 0.55,
  minDot: 0.001,
  darkFill: 0,
  darkFillTexture: 0,
  glow: 0.5,
  twinkle: true,
  drift: true,
  horizon: 0.48,
  horizonSoftness: 0.06,
  skyTwinkleCalm: 1,
  skyDriftDamp: 0.78,
  focusY: 0.5,
  saturation: 1,
} satisfies Omit<Required<ImageTuning>, "src">;

type ResolvedTuning = {
  pixelScale: number;
  gamma: number;
  minDot: number;
  darkFill: number;
  darkFillTexture: number;
  glow: number;
  twinkle: number;
  drift: number;
  horizon: number;
  horizonSoftness: number;
  skyTwinkleCalm: number;
  skyDriftDamp: number;
  focusY: number;
  saturation: number;
};

function resolveTuning(t: ImageTuning): ResolvedTuning {
  return {
    pixelScale: t.pixelScale ?? DEFAULT_TUNING.pixelScale,
    gamma: t.gamma ?? DEFAULT_TUNING.gamma,
    minDot: t.minDot ?? DEFAULT_TUNING.minDot,
    darkFill: t.darkFill ?? DEFAULT_TUNING.darkFill,
    darkFillTexture: t.darkFillTexture ?? DEFAULT_TUNING.darkFillTexture,
    glow: t.glow ?? DEFAULT_TUNING.glow,
    twinkle: (t.twinkle ?? DEFAULT_TUNING.twinkle) ? 1 : 0,
    drift: (t.drift ?? DEFAULT_TUNING.drift) ? 1 : 0,
    horizon: t.horizon ?? DEFAULT_TUNING.horizon,
    horizonSoftness: t.horizonSoftness ?? DEFAULT_TUNING.horizonSoftness,
    skyTwinkleCalm: t.skyTwinkleCalm ?? DEFAULT_TUNING.skyTwinkleCalm,
    skyDriftDamp: t.skyDriftDamp ?? DEFAULT_TUNING.skyDriftDamp,
    focusY: t.focusY ?? DEFAULT_TUNING.focusY,
    saturation: t.saturation ?? DEFAULT_TUNING.saturation,
  };
}

type ImageEngineProps = {
  /** The image to show plus its per-image look. Changing it dissolves over. */
  image: ImageTuning;
  /** Target edge length of a cell in CSS pixels. */
  cellSize?: number;
  mode?: PixelMode;
  className?: string;
};

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
uniform sampler2D uTex2;
uniform vec2 uGrid;
uniform vec2 uUVScale;
uniform vec2 uUVOffset;
uniform vec2 uUVScale2;
uniform vec2 uUVOffset2;
uniform float uProgress;
uniform float uStagger;
uniform float uCapture;
uniform float uTime;
uniform float uPixelScale;
uniform float uGamma;
uniform float uMinDot;
uniform float uDarkFillFrom;
uniform float uDarkFillTo;
uniform float uDarkFillTexFrom;
uniform float uDarkFillTexTo;
uniform float uGlow;
uniform float uSaturation;
uniform float uMode;
uniform float uAA;
uniform float uCellAspect;
uniform float uTwinkle;
uniform float uDrift;
// Per-image tuning, kept separately for the outgoing (From) and current (To)
// image so each keeps its own horizon. uHorizon is the normalized height
// (0 = bottom, 1 = top) where sky begins; above it twinkle/drift are calmed.
uniform float uHorizonFrom;
uniform float uHorizonTo;
uniform float uHorizonSoftFrom;
uniform float uHorizonSoftTo;
uniform float uSkyTwinkleCalmFrom;
uniform float uSkyTwinkleCalmTo;
uniform float uSkyDriftDampFrom;
uniform float uSkyDriftDampTo;
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

vec3 sampleCell(vec2 cell, float drift, out float b) {
  vec2 center = (cell + 0.5) / uGrid;
  vec2 uvA = center * uUVScale + uUVOffset;
  vec2 uvB = center * uUVScale2 + uUVOffset2;
  vec3 colA = texture2D(uTex, uvA).rgb;
  vec3 colB = texture2D(uTex2, uvB).rgb;
  // Per-cell staggered dissolve: each cell flips to the new image at a
  // slightly different point in the transition, so the image emerges as a
  // pixel-by-pixel dissolve rather than a flat crossfade.
  float delay = hash(cell) * uStagger;
  float localMix = smoothstep(delay, delay + (1.0 - uStagger), uProgress);
  vec3 col = mix(colA, colB, localMix);
  float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(gray), col, uSaturation);
  float luma = dot(col, vec3(0.2126, 0.7152, 0.0722));
  luma = pow(luma, uGamma);
  // Above the horizon (sky) twinkle is calmed toward only-bright-cells so it
  // stays still; below it (ocean) everything keeps full shimmer. Each image
  // keeps its OWN horizon and we blend the two by the same per-cell dissolve
  // mix, so the calm boundary never slides up/down during a transition — a
  // cell adopts the new image's horizon exactly when it flips to that image.
  float cellY = (cell.y + 0.5) / uGrid.y;        // 0 = bottom/ocean, 1 = top/sky
  // smoothstep over a feather band around the horizon so the calm/active sky
  // transition is gradual instead of a hard, jagged line.
  float skyFrom = smoothstep(uHorizonFrom - uHorizonSoftFrom, uHorizonFrom + uHorizonSoftFrom, cellY);
  float skyTo = smoothstep(uHorizonTo - uHorizonSoftTo, uHorizonTo + uHorizonSoftTo, cellY);
  float calmFrom = mix(1.0, smoothstep(0.4, 0.9, luma), uSkyTwinkleCalmFrom);
  float twWFrom = mix(1.0, calmFrom, skyFrom);
  float calmTo = mix(1.0, smoothstep(0.4, 0.9, luma), uSkyTwinkleCalmTo);
  float twWTo = mix(1.0, calmTo, skyTo);
  float twW = mix(twWFrom, twWTo, localMix);
  float tw = 1.0 + uTwinkle * 0.6 * twW * sin(uTime * 2.4 + hash(cell) * 6.2831);
  b = clamp(luma * tw * drift, 0.0, 1.0);
  return col;
}

void main() {
  vec2 frag = vUv * uGrid;
  vec2 baseCell = floor(frag);

  // Capture path: bake only the per-cell interpolated photo color (the same
  // mix() the halftone derives its luma from) into an offscreen texture. Used
  // when a transition is interrupted so the half-dissolved pixel field becomes
  // the new "from" image. No halftone/glow/twinkle/drift here — the next pass
  // re-derives those from this color field.
  if (uCapture > 0.5) {
    vec2 center = (baseCell + 0.5) / uGrid;
    vec2 uvA = center * uUVScale + uUVOffset;
    vec2 uvB = center * uUVScale2 + uUVOffset2;
    vec3 colA = texture2D(uTex, uvA).rgb;
    vec3 colB = texture2D(uTex2, uvB).rgb;
    float delay = hash(baseCell) * uStagger;
    float localMix = smoothstep(delay, delay + (1.0 - uStagger), uProgress);
    vec3 col = mix(colA, colB, localMix);
    float gray = dot(col, vec3(0.2126, 0.7152, 0.0722));
    col = mix(vec3(gray), col, uSaturation);
    gl_FragColor = vec4(col, 1.0);
    return;
  }

  // One continuous, domain-warped drift value for this fragment (centered on ~0.5).
  // Strongly damp it above the horizon so the sky stays still; ocean keeps full drift.
  // Each image's own horizon is used, blended by this base cell's dissolve mix so
  // the damping boundary doesn't slide during a transition.
  float baseDelay = hash(baseCell) * uStagger;
  float baseMix = smoothstep(baseDelay, baseDelay + (1.0 - uStagger), uProgress);
  float skyDampFrom = 1.0 - uSkyDriftDampFrom * smoothstep(uHorizonFrom - uHorizonSoftFrom, uHorizonFrom + uHorizonSoftFrom, vUv.y);
  float skyDampTo = 1.0 - uSkyDriftDampTo * smoothstep(uHorizonTo - uHorizonSoftTo, uHorizonTo + uHorizonSoftTo, vUv.y);
  float skyDamp = mix(skyDampFrom, skyDampTo, baseMix);
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
      // Dark fill: give ONLY the very darkest cells a solid dot so true-black
      // regions read as dark ink instead of showing the white paper through.
      // Blend per cell by the dissolve (not globally) so a cell takes the new
      // image's fill the instant it flips, instead of flashing white first.
      float cellDelay = hash(cell) * uStagger;
      float cellMix = smoothstep(cellDelay, cellDelay + (1.0 - uStagger), uProgress);
      float darkFillHere = mix(uDarkFillFrom, uDarkFillTo, cellMix);
      // Keep the fill dot solid (fully covers the cell) so no white paper shows
      // through — that keeps the dark areas dark. The reach extends across the
      // whole shadow range (not just pure black) so dim foreground reads dark.
      float fillMask = 1.0 - smoothstep(0.0, 0.32, b);
      radius += darkFillHere * fillMask;
      vec2 d = frag - (cell + 0.5);
      d.y *= uCellAspect;
      float dist = length(d) - radius;
      float c = 1.0 - smoothstep(-uAA, uAA, dist);
      if (c > bestCover) {
        bestCover = c;
        // Texture the fill by varying each dot's darkness a little per cell
        // (charcoal grain) rather than its size, so it reads as textured but
        // stays dark instead of letting the bright paper through.
        float darkFillTex = mix(uDarkFillTexFrom, uDarkFillTexTo, cellMix);
        float grain = darkFillTex * 0.22 * hash(cell + 13.7) * fillMask;
        bestCol = col + uGlow * b * b + grain;
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
  image,
  cellSize = 2,
  mode = "halftone",
  className,
}: ImageEngineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live-tunable draw mode read by the render loop without re-initializing GL.
  // Per-image look lives in the engine's from/to tuning instead.
  const configRef = useRef({ mode });
  useEffect(() => {
    configRef.current = { mode };
  }, [mode]);

  // Imperative handle to the persistent engine so a separate effect can trigger
  // image transitions without tearing down the WebGL context.
  const engineRef = useRef<{
    transitionTo: (tuning: ImageTuning) => void;
    applyTuning: (tuning: ImageTuning) => void;
  } | null>(null);
  const imageRef = useRef(image);
  const loadedSrcRef = useRef<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const TRANSITION_MS = 1100;
    const STAGGER = 0.6;

    const gl = canvas.getContext("webgl", {
      premultipliedAlpha: false,
      antialias: true,
    }) as WebGLRenderingContext | null;

    // ---- Fallback: no WebGL -> just paint the image (cover) on a 2D canvas. ----
    if (!gl) {
      const ctx = canvas.getContext("2d");
      let currentImg: HTMLImageElement | null = null;
      const paint = () => {
        if (!ctx) return;
        const rect = container.getBoundingClientRect();
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const cssW = Math.max(1, rect.width);
        const cssH = Math.max(1, rect.height);
        canvas.width = Math.max(1, Math.ceil(cssW * dpr));
        canvas.height = Math.max(1, Math.ceil(cssH * dpr));
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        if (!currentImg || !currentImg.complete || !currentImg.naturalWidth) return;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const ir = currentImg.naturalWidth / currentImg.naturalHeight;
        const cr = cssW / cssH;
        let dw = cssW;
        let dh = cssH;
        if (ir > cr) dw = cssH * ir;
        else dh = cssW / ir;
        ctx.drawImage(currentImg, (cssW - dw) / 2, (cssH - dh) / 2, dw, dh);
      };
      const load = (s: string) => {
        const next = new Image();
        next.onload = () => {
          currentImg = next;
          paint();
        };
        next.src = s;
      };
      load(imageRef.current.src);
      loadedSrcRef.current = imageRef.current.src;
      engineRef.current = {
        transitionTo: (tuning) => load(tuning.src),
        applyTuning: () => {},
      };
      const ro = new ResizeObserver(paint);
      ro.observe(container);
      return () => {
        ro.disconnect();
        engineRef.current = null;
      };
    }

    // ---- WebGL path ----
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;
    // texFrom (unit 0) is the outgoing image, texTo (unit 1) is the current /
    // incoming image. We dissolve from -> to as uProgress goes 0 -> 1.
    // texFrom is just a pointer: normally it points at uploadTexFrom (a real
    // photo), but when a transition is interrupted it points at snapshotTex (the
    // baked half-dissolved pixel field) so the in-progress dissolve continues
    // instead of snapping the outgoing image to its fully-resolved state.
    let texFrom: WebGLTexture | null = null;
    let uploadTexFrom: WebGLTexture | null = null;
    let texTo: WebGLTexture | null = null;
    // Offscreen target used to bake the live dissolve when interrupted. Two
    // snapshot textures are ping-ponged so a back-to-back interruption can read
    // the previous snapshot (as texFrom) while writing the new one, instead of
    // sampling and rendering the same texture (a feedback loop).
    let fbo: WebGLFramebuffer | null = null;
    let snapshotTexA: WebGLTexture | null = null;
    let snapshotTexB: WebGLTexture | null = null;
    let snapshotW = 0;
    let snapshotH = 0;
    // When true, texFrom points at snapshotTex which is already in screen space,
    // so its cover-UV must be identity rather than computed from aspectFrom.
    let fromIsSnapshot = false;
    let raf = 0;
    let textureReady = false;
    const uniforms: Record<string, WebGLUniformLocation | null> = {};

    const view = {
      cols: 1,
      rows: 1,
      sxA: 1, syA: 1, oxA: 0, oyA: 0,
      sxB: 1, syB: 1, oxB: 0, oyB: 0,
      aa: 0.02,
      cellAspect: 1,
    };

    // Transition state advanced inside the render loop.
    const transition = { progress: 1, active: false, start: 0 };

    // Per-image look for the outgoing (from) and current (to) images. Scalar
    // params are lerped by transition.progress so the look morphs with the
    // dissolve. Initialized to the first image's resolved tuning.
    let tuningFrom = resolveTuning(imageRef.current);
    let tuningTo = tuningFrom;

    // The image element currently shown (the "to" texture's source), kept so we
    // can re-upload it into the "from" texture when a new transition begins.
    let currentImg: HTMLImageElement | null = null;
    let aspectFrom = 1;
    let aspectTo = 1;
    let loadToken = 0;

    const u = (name: string) => uniforms[name];

    const coverUV = (imageAspect: number, cssW: number, cssH: number, focusY = 0.5) => {
      const canvasAspect = cssW / cssH;
      const ratio = canvasAspect / imageAspect;
      let sx: number;
      let sy: number;
      if (ratio > 1) {
        sx = 1;
        sy = 1 / ratio;
      } else {
        sx = ratio;
        sy = 1;
      }
      return { sx, sy, ox: (1 - sx) / 2, oy: (1 - sy) * focusY };
    };

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      canvas.width = Math.max(1, Math.ceil(cssW * dpr));
      canvas.height = Math.max(1, Math.ceil(cssH * dpr));
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      gl.viewport(0, 0, canvas.width, canvas.height);

      const cols = Math.max(1, Math.round(cssW / cellSize));
      const rows = Math.max(1, Math.round(cssH / cellSize));
      view.cols = cols;
      view.rows = rows;

      if (fromIsSnapshot) {
        // The snapshot already baked the cover transform; sample it 1:1.
        view.sxA = 1; view.syA = 1; view.oxA = 0; view.oyA = 0;
        // Keep the snapshot texture matched to the (possibly new) canvas size.
        ensureSnapshotSize();
      } else {
        const a = coverUV(aspectFrom, cssW, cssH, tuningFrom.focusY);
        view.sxA = a.sx; view.syA = a.sy; view.oxA = a.ox; view.oyA = a.oy;
      }
      const b = coverUV(aspectTo, cssW, cssH, tuningTo.focusY);
      view.sxB = b.sx; view.syB = b.sy; view.oxB = b.ox; view.oyB = b.oy;

      const cellPxW = canvas.width / cols;
      const cellPxH = canvas.height / rows;
      view.aa = 1 / cellPxW;
      view.cellAspect = cellPxH / cellPxW;
    };

    const uploadImage = (tex: WebGLTexture | null, unit: number, image: TexImageSource) => {
      if (!tex) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    const placeholder = (tex: WebGLTexture | null, unit: number) => {
      if (!tex) return;
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([10, 10, 12]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    const allocSnapshot = (tex: WebGLTexture | null) => {
      if (!tex) return;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, snapshotW, snapshotH, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    };

    // (Re)allocate both snapshot color textures to match the current canvas
    // backing size. Cheap no-op when the size is unchanged.
    const ensureSnapshotSize = () => {
      if (!fbo || !snapshotTexA || !snapshotTexB) return;
      if (snapshotW === canvas.width && snapshotH === canvas.height) return;
      snapshotW = canvas.width;
      snapshotH = canvas.height;
      allocSnapshot(snapshotTexA);
      allocSnapshot(snapshotTexB);
    };

    // Bake the current dissolve (texFrom -> texTo at the live progress) into a
    // snapshot texture via the shader's capture path and return it. Writes to
    // whichever snapshot is NOT currently the source so back-to-back
    // interruptions never read and write the same texture. Outputs only the
    // per-cell mixed photo color, so the next pass re-derives the halftone.
    const captureCurrent = (): WebGLTexture | null => {
      if (!program || !fbo || !snapshotTexA || !snapshotTexB) return null;
      const writeTex = texFrom === snapshotTexA ? snapshotTexB : snapshotTexA;
      gl.useProgram(program);
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, writeTex, 0);
      gl.viewport(0, 0, snapshotW, snapshotH);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texFrom);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texTo);
      gl.uniform1i(u("uTex"), 0);
      gl.uniform1i(u("uTex2"), 1);
      gl.uniform1f(u("uCapture"), 1);
      gl.uniform1f(u("uProgress"), transition.progress);
      gl.uniform1f(u("uStagger"), STAGGER);
      {
        const p = transition.progress;
        const sat = tuningFrom.saturation + (tuningTo.saturation - tuningFrom.saturation) * p;
        gl.uniform1f(u("uSaturation"), sat);
      }
      gl.uniform2f(u("uGrid"), view.cols, view.rows);
      gl.uniform2f(u("uUVScale"), view.sxA, view.syA);
      gl.uniform2f(u("uUVOffset"), view.oxA, view.oyA);
      gl.uniform2f(u("uUVScale2"), view.sxB, view.syB);
      gl.uniform2f(u("uUVOffset2"), view.oxB, view.oyB);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      gl.uniform1f(u("uCapture"), 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      return writeTex;
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
        "uTex2",
        "uGrid",
        "uUVScale",
        "uUVOffset",
        "uUVScale2",
        "uUVOffset2",
        "uProgress",
        "uStagger",
        "uCapture",
        "uTime",
        "uPixelScale",
        "uGamma",
        "uMinDot",
        "uDarkFillFrom",
        "uDarkFillTo",
        "uDarkFillTexFrom",
        "uDarkFillTexTo",
        "uGlow",
        "uSaturation",
        "uMode",
        "uAA",
        "uCellAspect",
        "uTwinkle",
        "uDrift",
        "uHorizonFrom",
        "uHorizonTo",
        "uHorizonSoftFrom",
        "uHorizonSoftTo",
        "uSkyTwinkleCalmFrom",
        "uSkyTwinkleCalmTo",
        "uSkyDriftDampFrom",
        "uSkyDriftDampTo",
        "uBg",
      ]) {
        uniforms[name] = gl.getUniformLocation(program, name);
      }

      uploadTexFrom = gl.createTexture();
      texTo = gl.createTexture();
      texFrom = uploadTexFrom;
      fromIsSnapshot = false;
      placeholder(uploadTexFrom, 0);
      placeholder(texTo, 1);
      gl.uniform1i(u("uTex"), 0);
      gl.uniform1i(u("uTex2"), 1);

      // Offscreen target for baking the live dissolve when interrupted.
      fbo = gl.createFramebuffer();
      snapshotTexA = gl.createTexture();
      snapshotTexB = gl.createTexture();
      snapshotW = 0;
      snapshotH = 0;

      resize();
      return true;
    };

    const draw = (timeMs: number) => {
      if (!program) return;
      const cfg = configRef.current;
      gl.useProgram(program);

      if (transition.active) {
        const t = (timeMs - transition.start) / TRANSITION_MS;
        if (t >= 1) {
          transition.progress = 1;
          transition.active = false;
        } else {
          const c = t <= 0 ? 0 : t;
          transition.progress = c * c * (3 - 2 * c); // smoothstep ease
        }
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texFrom);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texTo);
      gl.uniform1i(u("uTex"), 0);
      gl.uniform1i(u("uTex2"), 1);

      // Interpolate per-image look between the outgoing and current image so
      // the horizon line, sky calm, brightness, etc. morph along with the
      // dissolve rather than popping at the swap.
      const p = transition.progress;
      const lerp = (a: number, b: number) => a + (b - a) * p;

      gl.uniform1f(u("uTime"), reduced ? 0 : timeMs * 0.001);
      gl.uniform1f(u("uPixelScale"), lerp(tuningFrom.pixelScale, tuningTo.pixelScale));
      gl.uniform1f(u("uGamma"), lerp(tuningFrom.gamma, tuningTo.gamma));
      gl.uniform1f(u("uMinDot"), lerp(tuningFrom.minDot, tuningTo.minDot));
      // darkFill is blended per cell in the shader (by the dissolve), not lerped
      // globally, so dark areas don't flash white before filling in.
      gl.uniform1f(u("uDarkFillFrom"), tuningFrom.darkFill);
      gl.uniform1f(u("uDarkFillTo"), tuningTo.darkFill);
      gl.uniform1f(u("uDarkFillTexFrom"), tuningFrom.darkFillTexture);
      gl.uniform1f(u("uDarkFillTexTo"), tuningTo.darkFillTexture);
      gl.uniform1f(u("uGlow"), lerp(tuningFrom.glow, tuningTo.glow));
      gl.uniform1f(u("uSaturation"), lerp(tuningFrom.saturation, tuningTo.saturation));
      gl.uniform1f(u("uMode"), cfg.mode === "filled" ? 1 : 0);
      gl.uniform1f(u("uTwinkle"), reduced ? 0 : lerp(tuningFrom.twinkle, tuningTo.twinkle));
      gl.uniform1f(u("uDrift"), reduced ? 0 : lerp(tuningFrom.drift, tuningTo.drift));
      // Horizon and sky calm are NOT lerped — each image keeps its own value and
      // the shader blends them per cell by the dissolve so the horizon snaps with
      // the pixels rather than sliding.
      gl.uniform1f(u("uHorizonFrom"), tuningFrom.horizon);
      gl.uniform1f(u("uHorizonTo"), tuningTo.horizon);
      gl.uniform1f(u("uHorizonSoftFrom"), tuningFrom.horizonSoftness);
      gl.uniform1f(u("uHorizonSoftTo"), tuningTo.horizonSoftness);
      gl.uniform1f(u("uSkyTwinkleCalmFrom"), tuningFrom.skyTwinkleCalm);
      gl.uniform1f(u("uSkyTwinkleCalmTo"), tuningTo.skyTwinkleCalm);
      gl.uniform1f(u("uSkyDriftDampFrom"), tuningFrom.skyDriftDamp);
      gl.uniform1f(u("uSkyDriftDampTo"), tuningTo.skyDriftDamp);
      gl.uniform1f(u("uProgress"), transition.progress);
      gl.uniform1f(u("uStagger"), STAGGER);
      gl.uniform1f(u("uCapture"), 0);
      gl.uniform2f(u("uGrid"), view.cols, view.rows);
      gl.uniform2f(u("uUVScale"), view.sxA, view.syA);
      gl.uniform2f(u("uUVOffset"), view.oxA, view.oyA);
      gl.uniform2f(u("uUVScale2"), view.sxB, view.syB);
      gl.uniform2f(u("uUVOffset2"), view.oxB, view.oyB);
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

    const transitionTo = (tuning: ImageTuning) => {
      const token = ++loadToken;
      const resolved = resolveTuning(tuning);
      const next = new Image();
      next.onload = () => {
        if (token !== loadToken) return; // superseded by a newer request
        const newAspect = next.naturalWidth / next.naturalHeight;

        if (!currentImg) {
          // First image: fill both textures so there is nothing to dissolve.
          aspectFrom = newAspect;
          aspectTo = newAspect;
          fromIsSnapshot = false;
          texFrom = uploadTexFrom;
          uploadImage(uploadTexFrom, 0, next);
          uploadImage(texTo, 1, next);
          currentImg = next;
          tuningFrom = resolved;
          tuningTo = resolved;
          transition.progress = 1;
          transition.active = false;
          textureReady = true;
          resize();
          start();
          return;
        }

        if (transition.active && !reduced) {
          // Interrupted mid-dissolve: bake the current half-dissolved pixel
          // field into snapshotTex and dissolve THAT into the new image, so the
          // outgoing image keeps morphing from where it was instead of snapping
          // to its fully-resolved state. captureCurrent() reads the live
          // texFrom/texTo/UVs, so run it before we overwrite any of them.
          ensureSnapshotSize();
          const baked = captureCurrent();

          // The new "from" look is the look interpolated to where the dissolve
          // currently sits (scalar lerp; the per-cell-blended params are
          // approximated the same way since the snapshot already baked them).
          const p = transition.progress;
          const blend = (a: number, b: number) => a + (b - a) * p;
          tuningFrom = {
            pixelScale: blend(tuningFrom.pixelScale, tuningTo.pixelScale),
            gamma: blend(tuningFrom.gamma, tuningTo.gamma),
            minDot: blend(tuningFrom.minDot, tuningTo.minDot),
            darkFill: blend(tuningFrom.darkFill, tuningTo.darkFill),
            darkFillTexture: blend(tuningFrom.darkFillTexture, tuningTo.darkFillTexture),
            glow: blend(tuningFrom.glow, tuningTo.glow),
            twinkle: blend(tuningFrom.twinkle, tuningTo.twinkle),
            drift: blend(tuningFrom.drift, tuningTo.drift),
            horizon: blend(tuningFrom.horizon, tuningTo.horizon),
            horizonSoftness: blend(tuningFrom.horizonSoftness, tuningTo.horizonSoftness),
            skyTwinkleCalm: blend(tuningFrom.skyTwinkleCalm, tuningTo.skyTwinkleCalm),
            skyDriftDamp: blend(tuningFrom.skyDriftDamp, tuningTo.skyDriftDamp),
            focusY: blend(tuningFrom.focusY, tuningTo.focusY),
            saturation: blend(tuningFrom.saturation, tuningTo.saturation),
          };

          // Point unit 0 at the baked snapshot (screen space -> identity UV,
          // handled in resize via fromIsSnapshot).
          fromIsSnapshot = true;
          texFrom = baked;
          aspectTo = newAspect;
          uploadImage(texTo, 1, next);
          currentImg = next;
          tuningTo = resolved;
          resize();

          transition.progress = 0;
          transition.active = true;
          transition.start = performance.now();
          start();
          return;
        }

        // Settled (or reduced motion): move the current image into "from" and
        // load the new one into "to" for a fresh dissolve.
        fromIsSnapshot = false;
        texFrom = uploadTexFrom;
        aspectFrom = aspectTo;
        uploadImage(uploadTexFrom, 0, currentImg);
        aspectTo = newAspect;
        uploadImage(texTo, 1, next);
        currentImg = next;
        tuningFrom = tuningTo;
        tuningTo = resolved;
        resize();

        if (reduced) {
          transition.progress = 1;
          transition.active = false;
          draw(0);
        } else {
          transition.progress = 0;
          transition.active = true;
          transition.start = performance.now();
          start();
        }
      };
      next.src = tuning.src;
    };

    // Apply tuning to the currently shown image without a dissolve (used when
    // only the look changed, e.g. tweaking values for the same image).
    const applyTuning = (tuning: ImageTuning) => {
      const resolved = resolveTuning(tuning);
      tuningFrom = resolved;
      tuningTo = resolved;
      resize();
      if (reduced) draw(0);
    };

    const ok = init();
    if (!ok) return;

    transitionTo(imageRef.current);
    loadedSrcRef.current = imageRef.current.src;
    engineRef.current = { transitionTo, applyTuning };

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(0);
    });
    ro.observe(container);

    const onLost = (e: Event) => {
      e.preventDefault();
      cancelAnimationFrame(raf);
      textureReady = false;
      fromIsSnapshot = false;
      // Force a fresh, instant load of the current image on restore.
      currentImg = null;
    };
    const onRestored = () => {
      if (init()) transitionTo(imageRef.current);
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      engineRef.current = null;
      loadToken++;
      if (program) gl.deleteProgram(program);
      if (buffer) gl.deleteBuffer(buffer);
      if (uploadTexFrom) gl.deleteTexture(uploadTexFrom);
      if (texTo) gl.deleteTexture(texTo);
      if (snapshotTexA) gl.deleteTexture(snapshotTexA);
      if (snapshotTexB) gl.deleteTexture(snapshotTexB);
      if (fbo) gl.deleteFramebuffer(fbo);
    };
  }, [cellSize]);

  // React to image changes: dissolve to a new photo when the src changes, or
  // apply tuning live when only the look changed for the same photo. Never
  // tears down the WebGL context.
  useEffect(() => {
    imageRef.current = image;
    if (!engineRef.current) return; // initial load handled by the engine effect
    if (loadedSrcRef.current === image.src) {
      engineRef.current.applyTuning(image);
      return;
    }
    loadedSrcRef.current = image.src;
    engineRef.current.transitionTo(image);
  }, [image]);

  return (
    <div ref={containerRef} className={`relative h-full w-full overflow-hidden ${className ?? ""}`}>
      <canvas ref={canvasRef} className="block h-full w-full" aria-hidden="true" />
    </div>
  );
}
