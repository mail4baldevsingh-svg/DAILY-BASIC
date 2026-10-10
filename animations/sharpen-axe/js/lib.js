// Shared constants and drawing helpers.
// Native p5 calls draw flat paint; p5.brush draws the ink on top.

const W = 1080, H = 1920;
const FPS = 24;          // output frame rate
const BOIL_FPS = 12;     // hand-drawn "on twos": linework re-rolls 12x per second
const DURATION = 46.4;

const INK = '#2a2018';
const PAPER = '#f4ead5';
const PAL = {
  skyTop: '#a9cbd8', skyLow: '#f6cfa6',
  leaf1: '#2f5d43', leaf2: '#4f8456', leaf3: '#86ad62',
  bark: '#7b4f33', barkDark: '#4f311f', wood: '#e8c48f', woodRing: '#c99a5e',
  skinA: '#d9a07a', skinB: '#c98e66',
  rust: '#c8553d', indigo: '#3e5c8a', marigold: '#f2b632', saffron: '#e9a23b',
  green: '#4f7d5c', cream: '#efe6d2', brown: '#5e3b26',
  red: '#d64933', gold: '#e8b04a', steel: '#9aa7b0', steelLight: '#e7eef2',
  officeWall: '#c9cfd2', officeGray: '#8d979e', officeDark: '#5d666d',
  night1: '#1f1d47', night2: '#4a2f7a', violet: '#7a5bb5',
  teal: '#2f8f8a', white: '#fffaf0',
};

// ---------------------------------------------------------------- timing
const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
const seg = (t, a, b) => clamp((t - a) / (b - a), 0, 1);
const mix = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeIn = (k) => k * k * k;
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeBack = (k) => { if (k <= 0) return 0; if (k >= 1) return 1; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const easeElastic = (k) => (k === 0 || k === 1) ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
const pulse = (t, at, len) => { const k = (t - at) / len; return k < 0 || k > 1 ? 0 : Math.sin(k * Math.PI); };
const boilIndex = (t) => Math.floor(t * BOIL_FPS + 1e-6);
const onTwos = (t) => boilIndex(t) / BOIL_FPS;   // quantise character motion to 12 fps

// Deterministic RNG (mulberry32)
function rng(seed) {
  let a = (seed * 2654435761) >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rr = (r, a, b) => a + (b - a) * r();

// ---------------------------------------------------------------- geometry
const deg = (d) => (d * Math.PI) / 180;
const rot = (p, a, o = [0, 0]) => {
  const c = Math.cos(deg(a)), s = Math.sin(deg(a));
  const x = p[0] - o[0], y = p[1] - o[1];
  return [o[0] + x * c - y * s, o[1] + x * s + y * c];
};
const xf = (pts, dx, dy, a = 0, sx = 1, sy = sx) =>
  pts.map((p) => { const q = rot([p[0] * sx, p[1] * sy], a); return [q[0] + dx, q[1] + dy]; });

function ellipsePts(cx, cy, rx, ry, n = 28, a0 = 0) {
  const out = [];
  for (let i = 0; i < n; i++) { const a = a0 + (i / n) * Math.PI * 2; out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
function blobPts(cx, cy, r, wob, seed, n = 24) {
  const R = rng(seed); const ph = rr(R, 0, 6.28), ph2 = rr(R, 0, 6.28);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wob * (0.6 * Math.sin(a * 3 + ph) + 0.4 * Math.sin(a * 5 + ph2));
    out.push([cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k]);
  }
  return out;
}
// Tapered capsule from (x1,y1) to (x2,y2)
function limbPts(x1, y1, x2, y2, w1, w2, n = 7) {
  const a = Math.atan2(y2 - y1, x2 - x1), out = [];
  for (let i = 0; i <= n; i++) { const t = -Math.PI / 2 + (i / n) * Math.PI; out.push([x2 + Math.cos(a + t) * w2 / 2, y2 + Math.sin(a + t) * w2 / 2]); }
  for (let i = 0; i <= n; i++) { const t = Math.PI / 2 + (i / n) * Math.PI; out.push([x1 + Math.cos(a + t) * w1 / 2, y1 + Math.sin(a + t) * w1 / 2]); }
  return out;
}
// Subdivide + jitter a polygon so flat fills get a hand-cut edge that boils
function wobble(pts, amt, seed, closed = true, sub = 2) {
  const R = rng(seed), out = [];
  const n = pts.length;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    for (let k = 0; k < sub; k++) {
      const t = k / sub;
      out.push([mix(p[0], q[0], t) + rr(R, -amt, amt), mix(p[1], q[1], t) + rr(R, -amt, amt)]);
    }
  }
  if (!closed) out.push([pts[n - 1][0] + rr(R, -amt, amt), pts[n - 1][1] + rr(R, -amt, amt)]);
  return out;
}
// Two-bone IK, returns elbow point. bend = +1/-1 picks the elbow side.
function ik(sx, sy, hx, hy, l1, l2, bend = 1) {
  const dx = hx - sx, dy = hy - sy;
  let d = Math.hypot(dx, dy);
  d = Math.min(d, l1 + l2 - 0.01);
  const a = Math.atan2(dy, dx);
  const cosA = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
  const b = a + bend * Math.acos(cosA);
  return [sx + Math.cos(b) * l1, sy + Math.sin(b) * l1];
}

// ---------------------------------------------------------------- drawing state
let SEED = 0;         // current boil seed, set every frame
let brushDirty = false;
let _flip = 0;
// p5.brush batches strokes until the colour changes or the frame ends. Before any
// native p5 draw that must sit on top of earlier ink, force the pending ink out.
function flushInk() {
  if (!brushDirty) return;
  _flip ^= 1;
  brush.set('pen', _flip ? '#010203' : '#030201', 0.1);
  brush.line(-9000, -9000, -8999, -9000);
  brushDirty = false;
}
function nativeBegin() { flushInk(); }

// Ink batching: inside layer(fn) outlines are queued and drawn after the layer's fills,
// so a whole layer costs one compositing pass instead of one per part.
let INKQ = null;
function layer(fn) {
  const prev = INKQ;
  INKQ = [];
  fn();
  const q = INKQ;
  INKQ = prev;
  for (const f of q) f();
}
const deferInk = (f) => { if (INKQ) { INKQ.push(f); return true; } return false; };

function hexA(hex, a) { const c = color(hex); c.setAlpha(a); return c; }

// Flat paint: a polygon drawn twice with slightly different wobble at partial alpha,
// so edges get the darker overlap / soft fringe of a watercolour wash.
function paint(pts, col, opts = {}) {
  nativeBegin();
  const a = opts.alpha ?? 255, wob = opts.wob ?? 2.2, seed = (opts.seed ?? 1) * 131 + SEED;
  noStroke();
  if (opts.flat) {
    fill(hexA(col, a)); beginShape(); for (const p of pts) vertex(p[0], p[1]); endShape(CLOSE);
    return;
  }
  const p1 = wobble(pts, wob, seed), p2 = wobble(pts, wob, seed + 7);
  fill(hexA(col, a * 0.62)); beginShape(); for (const p of p1) vertex(p[0], p[1]); endShape(CLOSE);
  fill(hexA(col, a * 0.75)); beginShape(); for (const p of p2) vertex(p[0], p[1]); endShape(CLOSE);
}
function solid(pts, col, a = 255) { paint(pts, col, { alpha: a, flat: true }); }

// Ink outline through p5.brush (boils because SEED changes at 12 fps)
function ink(pts, opts = {}) {
  if (deferInk(() => ink(pts, opts))) return;
  const closed = opts.closed ?? true;
  randomSeed(SEED * 977 + (opts.seed ?? 3));
  brush.set(opts.brush ?? 'pen', opts.color ?? INK, opts.w ?? 1);
  brush.beginShape(opts.curve ?? 0.35);
  for (const p of pts) { if (p[2] === undefined) brush.vertex(p[0], p[1]); else brush.vertex(p[0], p[1], p[2]); }
  if (closed) brush.vertex(pts[0][0], pts[0][1]);
  brush.endShape(false);
  brushDirty = true;
}
function inkLine(x1, y1, x2, y2, opts = {}) {
  if (deferInk(() => inkLine(x1, y1, x2, y2, opts))) return;
  randomSeed(SEED * 977 + (opts.seed ?? 5));
  brush.set(opts.brush ?? 'pen', opts.color ?? INK, opts.w ?? 1);
  brush.line(x1, y1, x2, y2);
  brushDirty = true;
}
function inkSpline(pts, opts = {}) {
  if (deferInk(() => inkSpline(pts, opts))) return;
  randomSeed(SEED * 977 + (opts.seed ?? 7));
  brush.set(opts.brush ?? 'pen', opts.color ?? INK, opts.w ?? 1);
  brush.spline(pts, opts.curve ?? 0.5);
  brushDirty = true;
}
function shape(pts, col, opts = {}) {
  paint(pts, col, opts);
  if (opts.noInk) return;
  ink(pts, { w: opts.w ?? 1, seed: opts.seed, curve: opts.curve, brush: opts.brush, color: opts.inkColor });
}
// Draw a sprite (baked watercolour on white) multiplied onto the page
function sprite(img, x, y, w, h, opts = {}) {
  nativeBegin();
  blendMode(MULTIPLY);
  if (opts.tint) tint(opts.tint);
  image(img, x, y, w ?? img.width, h ?? img.height);
  noTint();
  blendMode(BLEND);
}
function plate(img, opts = {}) {
  nativeBegin();
  if (opts.alpha !== undefined) tint(255, opts.alpha);
  image(img, 0, 0, W, H);
  noTint();
}

// ---------------------------------------------------------------- particles
// Ballistic particles evaluated in closed form so any frame renders on its own.
function particles(seed, count, t, opts) {
  const R = rng(seed), out = [];
  for (let i = 0; i < count; i++) {
    const delay = rr(R, 0, opts.spread ?? 0);
    const ang = deg(rr(R, opts.angMin ?? -180, opts.angMax ?? 0));
    const sp = rr(R, opts.spMin ?? 300, opts.spMax ?? 700);
    const life = rr(R, opts.lifeMin ?? 0.4, opts.lifeMax ?? 0.8);
    const k = t - delay;
    const extra = [R(), R(), R()];
    if (k < 0 || k > life) continue;
    const g = opts.g ?? 1400;
    out.push({
      x: opts.x + Math.cos(ang) * sp * k,
      y: opts.y + Math.sin(ang) * sp * k + 0.5 * g * k * k,
      k: k / life, ang, sp, r: extra,
      vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp + g * k,
    });
  }
  return out;
}

// Comic impact burst: radiating ink dashes
function burst(x, y, r0, r1, n, seed, opts = {}) {
  const R = rng(seed + SEED);
  for (let i = 0; i < n; i++) {
    const a = (opts.a0 ?? 0) + (i / n) * (opts.span ?? 360) + rr(R, -8, 8);
    const ra = r0 * rr(R, 0.85, 1.1), rb = r1 * rr(R, 0.8, 1.15);
    const p = rot([ra, 0], a), q = rot([rb, 0], a);
    inkLine(x + p[0], y + p[1], x + q[0], y + q[1], { w: opts.w ?? 1.6, brush: opts.brush ?? 'marker', color: opts.color ?? INK, seed: i + seed });
  }
}
function starPts(cx, cy, r1, r2, n = 4, a0 = -90) {
  const out = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1; const a = deg(a0 + (i / (n * 2)) * 360); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}
function sparkle(x, y, r, col = PAL.marigold, seed = 1) {
  shape(starPts(x, y, r, r * 0.28, 4), col, { w: 0.8, seed, curve: 0.05, wob: 0.6 });
}
function drop(x, y, r, col = '#9fd3e8', a = 0) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = (i / 16) * Math.PI * 2;
    const k = Math.sin(t / 2);
    pts.push([Math.sin(t) * r * k * 0.95, -Math.cos(t) * r * 1.35 * (0.6 + 0.4 * k) - r * 0.2]);
  }
  shape(xf(pts, x, y, a), col, { w: 0.7, seed: 41, wob: 0.6 });
}
