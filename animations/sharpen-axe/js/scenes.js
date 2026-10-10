// Scenes. Each has cam(t, lt) -> camera, draw(t, lt) in world space, and optional
// screen(t, lt) (native, screen space) and overlay(ctx, t, lt) (Canvas2D text).

// Axe swing angle for a list of strike times. Raise (ease out), then chop (ease in).
function swing(t, strikes, o = {}) {
  const up = o.up ?? -140, hit = o.hit ?? 14, hold = o.hold ?? 0.07;
  let prev = -Infinity, next = Infinity;
  for (const s of strikes) { if (s <= t) prev = s; else { next = s; break; } }
  let phi;
  if (next === Infinity) {
    phi = mix(hit, o.rest ?? hit, easeInOut(seg(t, prev + hold + 0.05, prev + hold + 0.5)));
  } else if (prev === -Infinity) {
    const k = seg(t, next - (o.first ?? 0.45), next);
    phi = mix(o.startPhi ?? up, hit, easeIn(k));
  } else {
    const span = next - prev, k = (t - prev) / span, h = Math.min(hold / span, 0.25);
    if (k < h) phi = hit;
    else if (k < 0.6) phi = mix(hit, up, easeOut((k - h) / (0.6 - h)));
    else phi = mix(up, hit, easeIn((k - 0.6) / 0.4));
  }
  return { phi, prev, since: t - prev, count: strikes.filter((s) => s <= t).length };
}
// Punch-in zoom + shake on impacts
function impactCam(c, t, times, zAmp = 0.04, shake = 12) {
  c.sx = c.sx ?? 0; c.sy = c.sy ?? 0; c.z = c.z ?? 1; c.r = c.r ?? 0;
  for (const s of times) {
    const d = t - s;
    if (d < 0 || d > 0.6) continue;
    const e = Math.exp(-d * 10);
    c.z += zAmp * e;
    c.sx += Math.sin(d * 90 + s * 7) * shake * e;
    c.sy += Math.cos(d * 77 + s * 3) * shake * e;
  }
  return c;
}
function drawSun(x, y, r, t, col = PAL.marigold) { layer(() => {
  for (let i = 0; i < 10; i++) {
    const a = i * 36 + t * 25;
    const p = rot([r * 1.3, 0], a), q = rot([r * 1.75, 0], a);
    inkLine(x + p[0], y + p[1], x + q[0], y + q[1], { brush: 'marker', color: '#e98f2b', w: 1.6, seed: 300 + i });
  }
  shape(ellipsePts(x, y, r, r, 24), col, { w: 1.2, seed: 310 });
  paint(ellipsePts(x - r * 0.3, y - r * 0.3, r * 0.35, r * 0.3, 12), '#fff3c4', { alpha: 200, seed: 311 });
}); }
// "THAK!" style onomatopoeia pop
function popLabel(text, x, y, t, at, opts = {}) {
  const d = t - at;
  if (d < 0 || d > (opts.life ?? 0.45)) return;
  const k = easeBack(seg(d, 0, 0.12));
  const fade = 1 - seg(d, (opts.life ?? 0.45) - 0.12, opts.life ?? 0.45);
  label(text, x, y, opts.size ?? 72, opts.col ?? YELLOW, { k, alpha: fade, rot: opts.rot ?? 0, family: opts.family });
}
function strikeFx(x, y, d, seed, big) {
  if (d < 0 || d > 0.6) return;
  layer(() => chips(x, y, d, seed, big));
  if (d < 0.16) burst(x, y, 30 + d * 300, 80 + d * 520 * (big ? 1.4 : 1), big ? 12 : 8, seed, { w: big ? 2.2 : 1.6, a0: 90, span: 360 });
}
function speedLines(cx, cy, r, a0, a1, seed, col = INK) {
  for (let i = 0; i < 4; i++) {
    const rr2 = r + i * 26, pts = [];
    for (let k = 0; k <= 6; k++) { const a = mix(a0, a1, k / 6); pts.push([cx + Math.cos(deg(a)) * rr2, cy + Math.sin(deg(a)) * rr2]); }
    ink(pts, { closed: false, w: 0.9, color: col, seed: seed + i, curve: 0.6 });
  }
}
function tintScreen(col, a, mode = MULTIPLY) {
  if (a <= 0) return;
  nativeBegin();
  blendMode(mode); noStroke(); fill(hexA(col, a)); rect(0, 0, W, H); blendMode(BLEND);
}
function circleWriteOn(cx, cy, rx, ry, k, col, seed) {
  if (k <= 0) return;
  const pts = [];
  const n = Math.max(2, Math.round(28 * k));
  for (let i = 0; i <= n; i++) { const a = deg(-120 + (i / 28) * 380); pts.push([cx + Math.cos(a) * rx * (1 + 0.04 * Math.sin(i)), cy + Math.sin(a) * ry]); }
  ink(pts, { closed: false, brush: 'marker', color: col, w: 2.4, seed, curve: 0.5 });
}

// ------------------------------------------------------------------ scene data
const CHOP_STRIKES = [0.45, 1.02, 1.6, 2.2, 2.78, 3.28, 3.78, 4.3];
const BUSY_STRIKES = (() => { const a = []; for (let s = 5.05; s < 6.95; s += 0.27) a.push(+s.toFixed(2)); return a; })();
const FELL_STRIKES = [8.82, 9.5, 10.14, 10.76];
const FALL_T0 = 10.96, FALL_T1 = 11.34;

const A_POS = { x: 250, y: 1385, s: 1.12 };
const B_POS = { x: 830, y: 1385, s: 1.12, face: -1 };
const TREE_A = placeTree(A_POS, 14, 12, 0.8);
const TREE_B = placeTree(B_POS, 14, 10, 0.8);
const cutYOf = (tr) => tr.contact[1];

function personA(t, sw, extra = {}) {
  const tired = seg(t, 1.6, 4.6);
  const lean = mix(-6, 12, clamp((sw.phi + 145) / 159, 0, 1));
  return drawPerson(SPEC_A, {
    ...A_POS, lean, phi: sw.phi, axeSharp: false, legs: { mode: 'stand', spread: 46 },
    expr: { brow: tired > 0.25 ? 'tired' : 'angry', mouth: tired > 0.45 ? 'pant' : 'flat', eyes: tired > 0.65 ? 'half' : 'open', sweat: tired > 0.35 ? t : 0, bags: tired > 0.5 },
    ...extra,
  });
}

const SCENE_FNS = {
  // 0.00 "Bachpan mein ek kahani suni hogi, ki ek jana 8 ghante lekar kulhaadi ped ko maarta rehta tha"
  chop: {
    cam(t) {
      const k = easeInOut(seg(t, 0, 2.2));
      return impactCam({ x: mix(500, 540, k), y: mix(1070, 990, k), z: mix(1.28, 1.03, k), r: 0, sx: 0, sy: 0 }, t, CHOP_STRIKES, 0.035, 10);
    },
    draw(t) {
      plate(IMG.forest);
      drawSun(mix(120, 175, seg(t, 0, 4.86)), mix(640, 560, seg(t, 0, 4.86)), 52, t);
      const tq = onTwos(t);
      const sw = swing(tq, CHOP_STRIKES, { up: -145, hit: 14, startPhi: -60, first: 0.42 });
      drawTree(IMG.tree, TREE_A.x, TREE_A.y, TREE_A.s, { cut: TREE_A.cut });
      const cy = cutYOf(TREE_A);
      layer(() => drawNotch(TREE_A.x, cy, TREE_A.s, 0.05 + sw.count * 0.012, -1));
      personA(t, sw);
      CHOP_STRIKES.forEach((s, i) => {
        strikeFx(TREE_A.contact[0], cy - 4, t - s, 500 + i, false);
        popLabel(i % 2 ? 'THOK!' : 'THAK!', 700 + (i % 2) * 40, 1010 - (i % 3) * 30, t, s, { rot: i % 2 ? 8 : -8, size: 70 });
      });
      const k8 = easeBack(seg(t, 2.2, 2.42));
      label('8 GHANTE', 800, 800, 96, '#ffffff', { k: k8, rot: 7, swash: PAL.red });
    },
  },

  // 4.86 "Uske bawjood bhi busy dikhta tha, ped kat-ta nahi tha"
  busy: {
    cam(t) {
      if (t < 7.0) {
        const k = easeOut(seg(t, 4.86, 5.3));
        return impactCam({ x: mix(540, 470, k), y: mix(990, 1060, k), z: mix(1.03, 1.34, k), r: Math.sin(t * 2.3) * 1.2, sx: 0, sy: 0 }, t, BUSY_STRIKES, 0.02, 8);
      }
      const k = easeOut(seg(t, 7.0, 7.25));
      return { x: TREE_A.contact[0] - 20, y: cutYOf(TREE_A) - 60, z: mix(2.0, 2.35, k), r: -2, sx: 0, sy: 0 };
    },
    draw(t) {
      plate(IMG.forest);
      const sk = easeInOut(seg(t, 4.86, 7.0));
      drawSun(mix(175, 140, sk), mix(560, 1010, sk), 52, t, sk > 0.5 ? '#f08a3c' : PAL.marigold);
      const tq = onTwos(t);
      const sw = t < 7.0 ? swing(tq, BUSY_STRIKES, { up: -120, hit: 14, hold: 0.04, startPhi: 14, first: 0.2 }) : { phi: 14, count: 99 };
      drawTree(IMG.tree, TREE_A.x, TREE_A.y, TREE_A.s, { cut: TREE_A.cut });
      const cy = cutYOf(TREE_A);
      layer(() => drawNotch(TREE_A.x, cy, TREE_A.s, 0.17, -1));
      const shM = [A_POS.x + 30, A_POS.y - 400];
      if (t < 7.0 && sw.phi < -20) speedLines(shM[0], shM[1], 330, sw.phi - 70, sw.phi - 10, 700, '#3a3028');
      personA(t, sw, { expr: { brow: 'tired', mouth: 'pant', eyes: 'half', sweat: t * 1.6, bags: true } });
      if (t < 7.0) {
        BUSY_STRIKES.forEach((s, i) => strikeFx(TREE_A.contact[0], cy - 4, t - s, 600 + i, false));
        // sweat flying off
        layer(() => { for (const p of particles(77 + Math.floor(t * 3), 5, (t * 3) % 1 / 3 * 3, { x: A_POS.x + 70, y: A_POS.y - 560, angMin: -170, angMax: -20, spMin: 200, spMax: 420, g: 1500, lifeMin: 0.5, lifeMax: 0.9 }))
          drop(p.x, p.y, 10, '#9fd3e8', Math.atan2(p.vy, p.vx) * 57.3 + 90); });
        const kb = easeBack(seg(t, 6.22, 6.4));
        label('BUSY!', 560, 640, 120, YELLOW, { k: kb, rot: -8, scale: 1 + 0.05 * Math.sin(t * 20) });
        popLabel('huff... huff...', 470, 700, t, 5.3, { family: FONT_HAND, size: 46, col: '#ffffff', life: 1.1, rot: -5 });
        popLabel('huff... huff...', 470, 700, t, 6.55, { family: FONT_HAND, size: 46, col: '#ffffff', life: 0.5, rot: 4 });
      } else {
        circleWriteOn(TREE_A.contact[0] + 10, cy - 6, 85, 70, seg(t, 7.1, 7.5), PAL.red, 720);
        const kk = easeBack(seg(t, 7.3, 7.5));
        label('SIRF KHAROCH!', 640, cy - 150, 46, '#ffffff', { k: kk, rot: -6, swash: PAL.red, swashK: seg(t, 7.3, 7.6) });
        popLabel('?!', 690, cy - 70, t, 7.62, { size: 60, col: PAL.red, life: 0.7, rot: 10 });
      }
    },
    screen(t) { tintScreen('#f7b37a', 170 * seg(t, 5.0, 7.0) * (t < 7.0 ? 1 : 0.6)); },
  },

  // 8.30 "Doosra jana tha, wo 4 ghante hi kaam karta tha aur ped kaat leta tha"
  fell: {
    cam(t) {
      const k = easeInOut(seg(t, 8.3, 9.0));
      const c = { x: mix(600, 540, k), y: mix(1050, 990, k), z: mix(1.15, 1.03, k), r: 0, sx: 0, sy: 0 };
      if (t > FALL_T0) { const f = easeInOut(seg(t, FALL_T0, FALL_T1)); c.x -= 60 * f; c.y -= 20 * f; c.z -= 0.03 * f; }
      impactCam(c, t, FELL_STRIKES, 0.05, 14);
      return impactCam(c, t, [FALL_T1], 0.08, 34);
    },
    draw(t) {
      push(); translate(W, 0); scale(-1, 1); plate(IMG.forest); pop();
      drawSun(930, 560, 56, t);
      const tq = onTwos(t);
      const sw = swing(tq, FELL_STRIKES, { up: -150, hit: 14, rest: 70, startPhi: 40, first: 0.5 });
      const fall = 92 * easeIn(seg(t, FALL_T0, FALL_T1)) - 4 * Math.sin(seg(t, FALL_T1, FALL_T1 + 0.25) * Math.PI);
      drawTree(IMG.tree, TREE_B.x, TREE_B.y, TREE_B.s, { fall: Math.max(fall, 0), fallDir: -1, cut: TREE_B.cut });
      const cy = cutYOf(TREE_B);
      if (t < FALL_T0) layer(() => drawNotch(TREE_B.x, cy, TREE_B.s, Math.min(0.92, sw.count * 0.23), 1));
      const happy = t > FALL_T1;
      drawPerson(SPEC_B, {
        ...B_POS, face: -1, lean: mix(-4, 10, clamp((sw.phi + 150) / 164, 0, 1)), phi: sw.phi, axeSharp: true, legs: { mode: 'stand', spread: 46 },
        expr: { brow: happy ? 'up' : 'calm', mouth: happy ? 'grin' : 'smile', eyes: happy && t < FALL_T1 + 0.5 ? 'closed' : 'open' },
      });
      FELL_STRIKES.forEach((s, i) => {
        strikeFx(TREE_B.contact[0], cy - 4, t - s, 800 + i, true);
        popLabel('KHACHAK!', 360, 980 - i * 20, t, s, { rot: -8 + i * 5, size: 74 });
      });
      // sharp-axe glint while he works
      if (t < 9.3) sparkle(TREE_B.contact[0] + 40, TREE_B.contact[1] - 40, 30 * pulse(t, 8.4, 0.5));
      const k4 = easeBack(seg(t, 9.34, 9.56));
      label('4 GHANTE', 700, 640, 96, '#ffffff', { k: k4 * (1 - seg(t, FALL_T0, FALL_T0 + 0.1)), rot: 6, swash: PAL.green });
      if (t > FALL_T0) {
        label('TIMBERRR!', 560, 620, 100, YELLOW, { k: easeBack(seg(t, FALL_T0, FALL_T0 + 0.15)), rot: -12 + 4 * Math.sin(t * 30) });
        for (let i = 0; i < 3; i++) inkLine(560 - i * 60, 760 + i * 30, 520 - i * 60, 700 + i * 30, { brush: 'marker', w: 1.4, seed: 900 + i });
      }
      const d = t - FALL_T1;
      if (d > 0) {
        for (let i = 0; i < 9; i++) {
          const R = rng(950 + i), k = easeOut(clamp(d / 0.7, 0, 1));
          const x = mix(60, 460, R()) - k * 40 * R(), y = 1370 - R() * 40 - k * 80 * R(), r = (40 + R() * 50) * (0.4 + k);
          paint(ellipsePts(x, y, r, r * 0.8, 16), '#e9dcc0', { alpha: 230 * (1 - seg(d, 0.6, 0.9)), seed: 960 + i });
        }
        label('DHADAM!', 250, 1180, 120, '#ffffff', { k: easeBack(seg(d, 0, 0.12)), rot: -6, swash: PAL.rust });
      }
    },
  },
};

