// Scenes from the interview onwards.

// ------------------------------------------------------------------ props
function fanPts(cx, cy, r, a0, a1, n = 30) {
  const out = [[cx, cy]];
  for (let i = 0; i <= n; i++) { const a = deg(mix(a0, a1, i / n)); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  return out;
}
function roundRectPts(cx, cy, w, h, r, n = 5) {
  const out = [], cs = [[w / 2 - r, h / 2 - r, 0], [-w / 2 + r, h / 2 - r, 90], [-w / 2 + r, -h / 2 + r, 180], [w / 2 - r, -h / 2 + r, 270]];
  for (const [x, y, a0] of cs) for (let i = 0; i <= n; i++) { const a = deg(a0 + (i / n) * 90); out.push([cx + x + Math.cos(a) * r, cy + y + Math.sin(a) * r]); }
  return out;
}
const uprightRot = (a) => { let r = ((a % 360) + 540) % 360 - 180; if (r > 90) r -= 180; if (r < -90) r += 180; return r; };

function drawMic(x, y, ang, col, tag, seed) {
  const hb = rot([-300, 0], ang), fc = rot([-82, 0], ang);
  layer(() => {
    shape(limbPts(x + hb[0], y + hb[1], x, y, 28, 22), '#36363c', { w: 1, seed });
    shape(xf([[-36, -32], [36, -32], [36, 32], [-36, 32]], x + fc[0], y + fc[1], ang), col, { w: 1, seed: seed + 1, curve: 0.1 });
  });
  layer(() => {
    shape(ellipsePts(x, y, 36, 36, 18), '#7b8186', { w: 1.1, seed: seed + 2 });
    for (const k of [-14, 0, 14]) { const a = rot([k, -30], ang), b = rot([k, 30], ang); inkLine(x + a[0], y + a[1], x + b[0], y + b[1], { w: 0.6, seed: seed + k }); }
  });
  label(tag, x + fc[0], y + fc[1], 22, '#ffffff', { rot: uprightRot(ang), lw: 5, shadow: false });
}
function bubble(cx, cy, w, h, tx, ty, k, seed = 1) {
  if (k <= 0) return;
  const a = Math.atan2(ty - cy, tx - cx), side = a + Math.PI / 2;
  const b0 = [cx + Math.cos(a) * w * 0.3 * k + Math.cos(side) * 40, cy + Math.sin(a) * h * 0.3 * k + Math.sin(side) * 40];
  const b1 = [cx + Math.cos(a) * w * 0.3 * k - Math.cos(side) * 40, cy + Math.sin(a) * h * 0.3 * k - Math.sin(side) * 40];
  const tip = [mix(cx, tx, k), mix(cy, ty, k)];
  layer(() => shape([b0, tip, b1], '#ffffff', { w: 1.3, seed, curve: 0.1 }));
  layer(() => shape(ellipsePts(cx, cy, (w / 2) * k, (h / 2) * k, 32), '#ffffff', { w: 1.5, seed: seed + 1 }));
}
function questionMarks(cx, cy, t, at, seed) {
  for (let i = 0; i < 3; i++) {
    const R = rng(seed + i), k = easeBack(seg(t, at + i * 0.1, at + i * 0.1 + 0.2));
    label('?', cx + (i - 1) * 120 + rr(R, -20, 20), cy - Math.abs(i - 1) * -40 + Math.sin(t * 6 + i) * 10, 90 + i * 10, YELLOW, { k, rot: rr(R, -20, 20) });
  }
}
function burstBg(cx, cy, t, col, n = 26) {
  layer(() => {
    for (let i = 0; i < n; i++) {
      const a = i * (360 / n) + t * 8;
      const p = rot([230, 0], a), q = rot([1500, 0], a);
      inkLine(cx + p[0], cy + p[1], cx + q[0], cy + q[1], { brush: 'marker', color: col, w: 2.6, seed: 1200 + i });
    }
  });
}
function clockPie(cx, cy, r, f3, f1, t) {
  layer(() => shape(ellipsePts(cx, cy, r, r, 44), '#fffaf0', { w: 1.8, seed: 1300 }));
  if (f3 > 0) paint(fanPts(cx, cy, r * 0.9, -90, -90 + 270 * f3), PAL.marigold, { alpha: 245, seed: 1301 });
  if (f1 > 0) paint(fanPts(cx, cy, r * 0.9, 180, 180 + 90 * f1), PAL.red, { alpha: 245, seed: 1302 });
  layer(() => {
    for (let i = 0; i < 12; i++) {
      const a = i * 30, big = i % 3 === 0;
      const p = rot([r * (big ? 0.78 : 0.86), 0], a), q = rot([r * 0.96, 0], a);
      inkLine(cx + p[0], cy + p[1], cx + q[0], cy + q[1], { w: big ? 1.8 : 1, seed: 1310 + i });
    }
    const ha = -90 + 270 * f3 + 90 * f1;
    const h = rot([r * 0.7, 0], ha);
    inkLine(cx, cy, cx + h[0], cy + h[1], { brush: 'marker', w: 2.4, seed: 1330 });
    solid(ellipsePts(cx, cy, 16, 16, 12), INK);
  });
}
function grindstone(cx, cy, r, ang) {
  layer(() => {
    shape([[cx - r * 0.7, cy + r * 0.2], [cx - r * 0.5, cy + r * 0.2], [cx - r * 0.75, cy + r * 1.5], [cx - r * 1.0, cy + r * 1.5]], '#8a5a3c', { w: 1.2, seed: 1400 });
    shape([[cx + r * 0.5, cy + r * 0.2], [cx + r * 0.7, cy + r * 0.2], [cx + r * 1.0, cy + r * 1.5], [cx + r * 0.75, cy + r * 1.5]], '#8a5a3c', { w: 1.2, seed: 1401 });
    shape([[cx - r * 0.9, cy + r * 0.7], [cx + r * 0.9, cy + r * 0.7], [cx + r * 0.8, cy + r * 1.05], [cx - r * 0.8, cy + r * 1.05]], '#5e7e8a', { w: 1.2, seed: 1402 });
  });
  layer(() => {
    shape(ellipsePts(cx, cy, r, r, 40), '#9b9083', { w: 1.6, seed: 1403 });
    paint(ellipsePts(cx, cy, r * 0.8, r * 0.8, 36), '#b5ab9c', { alpha: 200, seed: 1404 });
    shape(ellipsePts(cx, cy, r * 0.18, r * 0.18, 16), '#5e3b26', { w: 1.2, seed: 1405 });
  });
  layer(() => {
    for (let i = 0; i < 14; i++) {
      const a = ang + i * (360 / 14), rr1 = r * (0.3 + (i % 4) * 0.15);
      const p = rot([rr1, 0], a), q = rot([rr1, 0], a + 22);
      inkLine(cx + p[0], cy + p[1], cx + q[0], cy + q[1], { brush: 'HB', w: 1.2, color: '#5d554b', seed: 1410 + i });
    }
    for (let i = 0; i < 4; i++) { const p = rot([r * 0.2, 0], ang + i * 90), q = rot([r * 0.62, 0], ang + i * 90); inkLine(cx + p[0], cy + p[1], cx + q[0], cy + q[1], { w: 1.4, seed: 1430 + i }); }
  });
}
// Sparks off a grinding contact: short hot streaks, grouped by colour
function sparks(x, y, t, dirA, seed, n = 26) {
  const cols = ['#fff6c8', PAL.marigold, '#f07b2c'];
  const groups = [[], [], []];
  for (let i = 0; i < n; i++) {
    const born = Math.floor(t / 0.025) * 0.025 - i * 0.025;
    const R = rng(seed + Math.round(born * 1000));
    const age = t - born, life = rr(R, 0.25, 0.5);
    if (age < 0 || age > life) continue;
    const a = deg(dirA + rr(R, -28, 28)), sp = rr(R, 700, 1300);
    const px = x + Math.cos(a) * sp * age, py = y + Math.sin(a) * sp * age + 900 * age * age;
    const vx = Math.cos(a) * sp, vy = Math.sin(a) * sp + 1800 * age;
    groups[i % 3].push([px, py, px - vx * 0.06, py - vy * 0.06]);
  }
  groups.forEach((g, ci) => g.forEach((l, j) => inkLine(l[0], l[1], l[2], l[3], { brush: 'marker', color: cols[ci], w: 2.6, seed: seed + j })));
}
function rupee(x, y, s, col = INK, seed = 1) {
  ink([[x - 0.32 * s, y - 0.46 * s], [x + 0.34 * s, y - 0.46 * s]], { closed: false, w: 1.3, color: col, seed, curve: 0 });
  ink([[x - 0.32 * s, y - 0.22 * s], [x + 0.34 * s, y - 0.22 * s]], { closed: false, w: 1.3, color: col, seed: seed + 1, curve: 0 });
  ink([[x - 0.32 * s, y - 0.46 * s], [x + 0.02 * s, y - 0.46 * s], [x + 0.24 * s, y - 0.3 * s], [x + 0.04 * s, y - 0.06 * s], [x - 0.3 * s, y - 0.04 * s], [x + 0.28 * s, y + 0.5 * s]], { closed: false, w: 1.3, color: col, seed: seed + 2, curve: 0.35 });
}
function coin(x, y, r, seed) {
  layer(() => {
    shape(ellipsePts(x, y, r, r, 22), PAL.gold, { w: 1.2, seed });
    paint(ellipsePts(x - r * 0.25, y - r * 0.3, r * 0.3, r * 0.22, 10), '#fff3c4', { alpha: 220, seed: seed + 1 });
    rupee(x, y, r * 1.1, '#7a5212', seed + 2);
  });
}
function desk(x0, x1, y, h, col = '#9c8670') {
  layer(() => {
    shape([[x0, y], [x1, y], [x1 + 10, y + 26], [x0 - 10, y + 26]], col, { w: 1.2, seed: 1500 });
    shape([[x0, y + 26], [x1, y + 26], [x1, y + h], [x0, y + h]], '#86705a', { w: 1.2, seed: 1501 });
  });
}
// Background office worker: cheap shapes, two layers per row
function workerBody(x, y, s, sp, seed, t) {
  const bob = Math.sin(t * 9 + seed) * 3 * s;
  shape(xf([[-62, 0], [-58, -98], [-30, -118], [30, -118], [58, -98], [62, 0]], x, y + bob, 0, s), sp.top, { w: 1, seed });
  shape(ellipsePts(x, y - 165 * s + bob, 42 * s, 44 * s, 18), sp.skin, { w: 1, seed: seed + 1 });
  shape(xf([[-46, -8], [-52, -40], [-30, -72], [0, -82], [34, -72], [52, -40], [46, -8], [0, -18]], x, y - 165 * s + bob, 0, s), sp.turban, { w: 1, seed: seed + 2 });
  for (const ex of [-14, 14]) solid(ellipsePts(x + ex * s, y - 160 * s + bob, 5 * s, 3 * s, 8), INK);
  solid(xf([[-20, 0], [20, 0], [16, 7], [-16, 7]], x, y - 140 * s + bob, 0, s), '#3a2b20');
}
function workerDesk(x, y, s, seed, rusty = true) {
  shape(xf([[-58, 0], [58, 0], [50, -82], [-50, -82]], x, y, 0, s), '#8f989e', { w: 1, seed: seed + 3 });
  shape([[x - 135 * s, y], [x + 135 * s, y], [x + 140 * s, y + 30 * s], [x - 140 * s, y + 30 * s]], '#a3917c', { w: 1, seed: seed + 4 });
  if (rusty) {
    // a forgotten, rusty axe on every desk
    shape(xf(limbPts(0, 0, 120, 0, 10, 9), x - 120 * s, y + 14 * s, -4, s), '#9a7b5c', { w: 0.8, seed: seed + 5 });
    shape(xf([[100, -16], [124, -16], [128, 4], [136, 24], [96, 26], [102, 4]], x - 120 * s, y + 14 * s, -4, s), '#8a6a52', { w: 0.8, seed: seed + 6 });
  }
}
function cobweb(x, y, r, seed) {
  for (let i = 0; i < 5; i++) { const a = -90 + i * 22; const p = rot([r, 0], a); inkLine(x, y, x + p[0], y + p[1], { w: 0.5, color: '#6b6b6b', seed: seed + i }); }
  for (const k of [0.4, 0.7, 1]) { const pts = []; for (let i = 0; i < 5; i++) { const p = rot([r * k, 0], -90 + i * 22); pts.push([x + p[0], y + p[1]]); } ink(pts, { closed: false, w: 0.5, color: '#6b6b6b', seed: seed + 10 + k * 10, curve: 0.2 }); }
}
function tag(x, y, text, ang, seed) {
  layer(() => shape(xf([[-70, -26], [60, -26], [80, 0], [60, 26], [-70, 26]], x, y, ang), '#f6ecd2', { w: 1, seed }));
  label(text, x - 4, y + 2, 34, INK, { rot: ang, family: FONT_HAND, stroke: '#f6ecd2', lw: 4, shadow: false });
}
function moonPts(cx, cy, r) {
  const out = [];
  for (let i = 0; i <= 20; i++) { const a = deg(-110 + (i / 20) * 220); out.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
  for (let i = 20; i >= 0; i--) { const a = deg(-80 + (i / 20) * 160); out.push([cx + r * 0.45 + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.9]); }
  return out;
}
function tarotCard(x, y, w, h, ang, sx, faceUp, glow, t, seed) {
  push();
  translate(x, y); rotate(ang); scale(Math.max(Math.abs(sx), 0.02), 1);
  if (glow > 0) for (let i = 3; i >= 1; i--) paint(roundRectPts(0, 0, w + i * 46 * glow, h + i * 46 * glow, 40), PAL.gold, { alpha: 40 * glow, seed: seed + i, flat: true });
  layer(() => {
    shape(roundRectPts(0, 0, w, h, 24), faceUp ? '#f6ecd2' : '#4b2f7d', { w: 1.6, seed });
    ink(roundRectPts(0, 0, w - 40, h - 40, 14), { brush: 'marker', color: PAL.gold, w: 1.1, seed: seed + 1 });
  });
  if (!faceUp) {
    layer(() => {
      sparkle(0, -30, 70, PAL.gold, seed + 2);
      shape(moonPts(0, h * 0.28, 34), '#f6e3a8', { w: 0.9, seed: seed + 3 });
      for (let i = 0; i < 6; i++) { const p = rot([w * 0.32, 0], i * 60 + 30); solid(ellipsePts(p[0], p[1] - 30, 5, 5, 8), PAL.gold); }
    });
  } else {
    layer(() => {
      paint(ellipsePts(0, -h * 0.08, w * 0.34, w * 0.34, 28), '#f7c873', { alpha: 230, seed: seed + 4 });
      for (let i = 0; i < 16; i++) { const p = rot([w * 0.2, 0], i * 22.5), q = rot([w * 0.42, 0], i * 22.5); inkLine(p[0], p[1] - h * 0.08, q[0], q[1] - h * 0.08, { brush: 'marker', color: '#e9962c', w: 1.1, seed: seed + 10 + i }); }
    });
    layer(() => drawAxe(-w * 0.32, h * 0.12, -50, 1.25, { sharp: true, seed: seed + 30 }));
    layer(() => shape(roundRectPts(0, h * 0.37, w * 0.8, 70, 10), '#4b2f7d', { w: 1.1, seed: seed + 5 }));
    sparkle(w * 0.25, -h * 0.3, 22, '#ffffff', seed + 6);
  }
  pop();
}

// ------------------------------------------------------------------ timings
const MIC_IN = [11.72, 11.82, 11.94, 12.04, 12.16];
const FLASHES = [12.2, 12.46, 12.72, 13.02, 13.3, 13.6];
const SECRET = { clock3: 15.15, grind: 16.05, clock1: 18.36, slash: 19.72 };
const SLASH_T = 19.9;

Object.assign(SCENE_FNS, {
  // 11.64 "Sabhi ne interview liya, bhai aisa kaise?"
  interview: {
    cam(t) { const k = easeInOut(seg(t, 11.64, 14.12)); return impactCam({ x: 540, y: mix(990, 930, k), z: mix(1.0, 1.1, k) }, t, FLASHES, 0.012, 5); },
    draw(t) {
      plate(IMG.warm);
      burstBg(540, 880, t, '#eaa64a');
      const tq = onTwos(t);
      drawPerson(SPEC_B, {
        x: 540, y: 1440, s: 1.38, lean: -3, bob: Math.sin(tq * 9) * 4, armsFront: true,
        hands: { b: [-86, -212], f: [92, -206] }, bendB: 1, bendF: -1,
        expr: { brow: 'up', mouth: 'grin', eyes: t < 12.7 ? 'closed' : 'open', look: t > 12.7 ? -4 : 0 },
      });
      const mics = [[-1, 650, PAL.red, 'NEWS'], [1, 600, PAL.indigo, 'LIVE'], [-1, 860, PAL.green, 'TV'], [1, 820, PAL.marigold, '24x7'], [-1, 1040, PAL.violet, 'FM']];
      mics.forEach(([side, ty, col, tg], i) => {
        const k = easeBack(seg(t, MIC_IN[i], MIC_IN[i] + 0.25));
        if (k <= 0) return;
        const target = [540 + side * (180 + (i % 3) * 30), ty + Math.sin(t * 5 + i) * 8];
        const start = [540 + side * 900, ty + 200];
        const x = mix(start[0], target[0], k), y = mix(start[1], target[1], k);
        const ang = Math.atan2(800 - y, 600 - x) * 57.3;
        drawMic(x, y, ang, col, tg, 1100 + i * 10);
      });
      FLASHES.forEach((f, i) => {
        const p = pulse(t, f, 0.16);
        if (p <= 0) return;
        const R = rng(1150 + i);
        layer(() => shape(starPts(rr(R, 120, 960), rr(R, 520, 1200), 70 * p + 20, 14 * p + 6, 8), '#ffffff', { w: 0.8, seed: 1160 + i }));
      });
      const kb = easeBack(seg(t, 12.84, 13.02));
      bubble(540, 560, 800, 230, 300, 700, kb, 1170);
      if (kb > 0) label('BHAI AISA KAISE?!', 540, 560, 74, INK, { k: kb, stroke: '#ffffff', lw: 8, shadow: false, rot: -2 });
      questionMarks(560, 720, t, 13.3, 1180);
    },
    screen(t) { for (const f of FLASHES) { const d = t - f; if (d >= 0 && d < 0.07) tintScreen('#ffffff', 140 * (1 - d / 0.07), BLEND); } },
  },

  // 14.12 "Tab bataya gaya ki main teen ghante apni kulhaadi ki dhaar banaata, aur ek ghanta kaatta hoon, ped kat jaata hai"
  secret: {
    cam(t) {
      if (t < SECRET.clock3) { const k = easeOut(seg(t, 14.12, 15.1)); return { x: 560, y: 900, z: mix(1.0, 1.12, k) }; }
      if (t < SECRET.grind) return { x: 540, y: 960, z: 1.0 + 0.05 * easeOut(seg(t, SECRET.clock3, SECRET.grind)) };
      if (t < SECRET.clock1) { const k = easeInOut(seg(t, SECRET.grind, SECRET.clock1)); return { x: 520, y: 980, z: mix(1.0, 1.18, k), sx: Math.sin(t * 70) * 3, sy: Math.cos(t * 63) * 3 }; }
      if (t < SECRET.slash) return { x: 540, y: 960, z: 1.05 };
      return impactCam({ x: 540, y: 980, z: 1.04 }, t, [SLASH_T], 0.06, 22);
    },
    draw(t) {
      const tq = onTwos(t);
      if (t < SECRET.clock3) {
        plate(IMG.warm);
        drawPerson(SPEC_B, {
          x: 470, y: 1800, s: 2.0, lean: 2, armsFront: true, legs: { mode: 'none' },
          hands: { b: [-30, -170], f: [128, -488 + Math.sin(tq * 10) * 6] }, bendB: 1, bendF: 1,
          expr: { brow: 'sly', mouth: 'smile', eyes: t > 14.35 ? 'wink' : 'open' },
        });
        sparkle(640, 820, 34 * pulse(t, 14.4, 0.45), '#ffffff', 1201);
        popLabel('psst...', 820, 820, t, 14.25, { family: FONT_HAND, size: 64, col: '#ffffff', life: 0.9, rot: -8 });
        return;
      }
      if (t < SECRET.grind || (t >= SECRET.clock1 && t < SECRET.slash)) {
        plate(IMG.warm);
        const k = easeBack(seg(t, SECRET.clock3, SECRET.clock3 + 0.2));
        push(); translate(540, 850); scale(t < SECRET.grind ? k : 1); translate(-540, -850);
        const f3 = t < SECRET.grind ? easeInOut(seg(t, 15.2, 15.9)) : 1;
        const f1 = t >= SECRET.clock1 ? easeInOut(seg(t, 18.62, 19.1)) : 0;
        clockPie(540, 850, 270, f3, f1, t);
        pop();
        if (f3 > 0.3) label('DHAAR', 640, 950, 64, '#ffffff', { k: easeBack(seg(t, 15.5, 15.7)) * (t < SECRET.grind ? 1 : 1), rot: 8 });
        if (f1 > 0.4) label('KAAT', 440, 750, 60, '#ffffff', { k: easeBack(seg(t, 18.85, 19.05)), rot: -8 });
        label(t >= SECRET.clock1 ? '3 GHANTE DHAAR' : '3 GHANTE', 540, 1215, t >= SECRET.clock1 ? 76 : 100, YELLOW, { k: easeBack(seg(t, 15.2, 15.4)), rot: -3 });
        if (t >= SECRET.clock1) label('+ 1 GHANTA KAAT', 540, 1318, 76, '#ff8a6b', { k: easeBack(seg(t, 18.62, 18.82)), rot: 2 });
        return;
      }
      if (t < SECRET.clock1) {
        plate(IMG.workshop);
        const ang = t * 900;
        grindstone(640, 1060, 300, ang);
        const contact = [640 + Math.cos(deg(-145)) * 300, 1060 + Math.sin(deg(-145)) * 300];
        const slide = Math.sin(tq * 14) * 22;
        const a = -20;
        const tip = rot([(200 - 8) * 2.1, 50 * 2.1], a);
        const along = rot([slide, 0], a);
        const butt = [contact[0] - tip[0] + along[0], contact[1] - tip[1] + along[1]];
        layer(() => drawAxe(butt[0], butt[1], a, 2.1, { sharp: t > 17.3, seed: 1250 }));
        layer(() => {
          for (const [hx, hy, k] of [[butt[0] + 90, butt[1] - 30, 0], [butt[0] + 200, butt[1] - 70, 1]]) {
            const hp = add([hx, hy], rot([slide, 0], a));
            shape(limbPts(-80, hp[1] + 160 + k * 40, hp[0], hp[1], 70, 60), SPEC_B.top, { w: 1.1, seed: 1260 + k });
            shape(ellipsePts(hp[0], hp[1], 36, 34, 14), SPEC_B.skin, { w: 1, seed: 1262 + k });
          }
        });
        sparks(contact[0], contact[1], t, -40, 1270, 30);
        const gl = seg(t, 17.6, 18.2);
        if (gl > 0) sparkle(contact[0] + 10, contact[1] + 40, 60 * easeBack(gl) * (1 + 0.15 * Math.sin(t * 30)), '#ffffff', 1290);
        popLabel('SHRRRK!', 320, 700, t, 16.3, { size: 80, life: 0.7, rot: -10, col: '#ffffff' });
        popLabel('SHRRRK!', 820, 760, t, 17.05, { size: 80, life: 0.6, rot: 9, col: '#ffffff' });
        label('DHAAR!', 540, 1310, 140, YELLOW, { k: easeBack(seg(t, 17.66, 17.86)), rot: -4, swash: PAL.red, swashK: seg(t, 17.66, 17.9) });
        return;
      }
      // the one clean strike
      plate(IMG.warm);
      const k = seg(t, SLASH_T, SLASH_T + 0.5);
      const sl = easeOut(k);
      const cut = [[380, 1120], [700, 900]];
      const log = [[400, 760], [680, 760], [690, 1410], [390, 1410]];
      const below = [[390, 1410], [690, 1410], [700, 900], [380, 1120]];
      const above = [[400, 760], [680, 760], [700, 900], [380, 1120]];
      layer(() => shape(below, PAL.bark, { w: 1.3, seed: 1320 }));
      if (t >= SLASH_T) layer(() => shape([[380, 1120], [700, 900], [710, 920], [390, 1140]], PAL.wood, { w: 0.9, seed: 1321 }));
      push(); translate(-170 * sl, 120 * sl + 400 * k * k); rotate(-14 * sl);
      layer(() => {
        shape(t < SLASH_T ? log : above, PAL.bark, { w: 1.3, seed: 1322 });
        shape(ellipsePts(540, 760, 140, 34, 24), PAL.wood, { w: 1.1, seed: 1323 });
        ink(ellipsePts(540, 760, 80, 18, 18), { w: 0.6, color: PAL.woodRing, seed: 1324 });
        for (let i = 0; i < 6; i++) inkLine(430 + i * 45, 820, 432 + i * 45, 960, { brush: 'HB', color: PAL.barkDark, w: 1, seed: 1325 + i });
      });
      pop();
      const sw = seg(t, SLASH_T - 0.1, SLASH_T + 0.04);
      if (sw > 0 && sw < 1) {
        layer(() => drawAxe(mix(-200, 1000, sw) - 300, mix(1250, 820, sw) - 60, -32, 2.0, { sharp: true, seed: 1340 }));
      }
      const fl = 1 - seg(t, SLASH_T, SLASH_T + 0.25);
      if (t >= SLASH_T - 0.04 && fl > 0) {
        paint([[cut[0][0] - 220, cut[0][1] + 140], [cut[1][0] + 260, cut[1][1] - 170], [cut[1][0] + 260, cut[1][1] - 150], [cut[0][0] - 220, cut[0][1] + 165]], '#ffffff', { alpha: 255 * fl, flat: true });
        burst(540, 1010, 120, 320, 14, 1350, { w: 2.2, color: PAL.marigold });
      }
      if (t > SLASH_T) { sparkle(720, 880, 50 * pulse(t, SLASH_T, 0.6), '#ffffff', 1360); sparkle(360, 1150, 34 * pulse(t, SLASH_T + 0.1, 0.5), PAL.marigold, 1361); }
      label('EK HI WAAR!', 540, 640, 116, YELLOW, { k: easeBack(seg(t, SLASH_T + 0.05, SLASH_T + 0.25)), rot: -6, swash: PAL.red });
    },
  },

  // 20.70 "Isi tarah bahut saare log apni skill ko improve nahi karte"
  crowd: {
    cam(t) {
      const out = easeInOut(seg(t, 21.5, 22.3)), inn = easeInOut(seg(t, 22.55, 23.1));
      const z = mix(mix(1.75, 1.0, out), 2.3, inn);
      return { x: mix(540, 470, inn), y: mix(mix(1020, 1000, out), 1060, inn), z };
    },
    draw(t) {
      plate(IMG.office);
      const rows = [700, 1000, 1300], cols = [230, 540, 850];
      const pops = [21.58, 21.8, 22.06];
      rows.forEach((ry, ri) => {
        const visible = cols.map((cx, ci) => (ri === 1 && ci === 1) ? 1 : easeBack(seg(t, pops[ri] + ci * 0.05, pops[ri] + ci * 0.05 + 0.2)));
        layer(() => cols.forEach((cx, ci) => {
          const k = visible[ci]; if (k <= 0.01) return;
          workerBody(cx, ry, 0.95 * k, GRAY(SPEC_A), 1600 + ri * 10 + ci, t);
        }));
        layer(() => cols.forEach((cx, ci) => {
          const k = visible[ci]; if (k <= 0.01) return;
          workerDesk(cx, ry, 0.95 * k, 1700 + ri * 10 + ci);
        }));
      });
      // the centre desk's axe: rusty, cobwebbed, tagged SKILL
      const ax = [540 - 120 * 0.95, 1000 + 14 * 0.95];
      layer(() => cobweb(ax[0] + 110, ax[1] - 14, 40, 1750));
      if (t > 22.5) tag(ax[0] + 20, ax[1] + 70, 'SKILL', -6, 1760);
      const kx = easeBack(seg(t, 23.42, 23.6));
      if (kx > 0) {
        layer(() => {
          inkLine(ax[0] - 30, ax[1] - 70, ax[0] + 180, ax[1] + 90, { brush: 'marker', color: PAL.red, w: 3.5 * kx, seed: 1770 });
          inkLine(ax[0] + 180, ax[1] - 70, ax[0] - 30, ax[1] + 90, { brush: 'marker', color: PAL.red, w: 3.5 * kx, seed: 1771 });
        });
      }
      if (t < 22.5) label('BAHUT SAARE LOG', 540, 560, 84, '#ffffff', { k: easeBack(seg(t, 21.95, 22.15)), rot: -3, swash: PAL.officeDark });
      if (t > 23.1) label('IMPROVE? NAHI!', 470, 900, 54, '#ffffff', { k: easeBack(seg(t, 23.2, 23.4)), rot: -5, swash: PAL.red });
    },
  },

  // 24.36 "8-8 ghante, 10-10 ghante naukri karte hain, fir kehte hain tarakki nahi hoti"
  grind: {
    cam(t) {
      const slump = easeInOut(seg(t, 26.7, 27.2));
      return { x: mix(540, 500, slump), y: mix(960, 930, slump), z: mix(1.02, 1.16, slump) };
    },
    draw(t) {
      plate(IMG.office);
      const tq = onTwos(t);
      // window: days flying by
      const ph = (t - 24.36) * 1.7, sky = ['#9fd0e8', '#f4a46a', '#2b2d5e'][Math.floor(ph * 3) % 3];
      layer(() => {
        shape([[660, 420], [950, 420], [950, 690], [660, 690]], sky, { w: 1.4, seed: 1800 });
        inkLine(805, 422, 805, 688, { w: 1.2, seed: 1801 }); inkLine(662, 555, 948, 555, { w: 1.2, seed: 1802 });
      });
      if (sky === '#2b2d5e') layer(() => shape(moonPts(730, 480, 28), '#f6e3a8', { w: 0.8, seed: 1803 }));
      else layer(() => shape(ellipsePts(880, 490, 32, 32, 16), PAL.marigold, { w: 0.8, seed: 1804 }));
      // wall clock spinning
      layer(() => {
        shape(ellipsePts(280, 560, 115, 115, 30), '#fffaf0', { w: 1.6, seed: 1810 });
        for (let i = 0; i < 12; i++) { const p = rot([92, 0], i * 30), q = rot([106, 0], i * 30); inkLine(280 + p[0], 560 + p[1], 280 + q[0], 560 + q[1], { w: 1, seed: 1811 + i }); }
        const m = rot([90, 0], -90 + (t - 24.36) * 720), h = rot([58, 0], -90 + (t - 24.36) * 60);
        inkLine(280, 560, 280 + m[0], 560 + m[1], { brush: 'marker', w: 1.8, seed: 1830 });
        inkLine(280, 560, 280 + h[0], 560 + h[1], { brush: 'marker', w: 2.4, seed: 1831 });
      });
      const slump = easeInOut(seg(t, 26.75, 27.1));
      const spec = officeOf(SPEC_A, '#c9d6e3', '#b8433a');
      const type = Math.sin(tq * 30) * 8 * (1 - slump);
      drawPerson(spec, {
        x: 420, y: 1460, s: 1.08, lean: 6 + 22 * slump, legs: { mode: 'sit' }, armsFront: true,
        hands: { b: [150, -250 + type], f: [190, -246 - type] }, bendB: 1, bendF: 1, headTilt: 18 * slump,
        expr: { brow: slump > 0.5 ? 'tired' : 'calm', mouth: slump > 0.5 ? 'frown' : 'flat', eyes: slump > 0.5 ? 'closed' : 'half', bags: true },
      });
      desk(180, 960, 1180, 330);
      layer(() => {
        shape([[700, 1180], [720, 990], [900, 980], [895, 1180]], '#59636b', { w: 1.3, seed: 1840 });
        shape([[560, 1176], [760, 1176], [770, 1192], [550, 1192]], '#3e464c', { w: 1, seed: 1841 });
      });
      // paperwork piling up, coffee cups multiplying
      const pile = Math.floor(seg(t, 24.4, 27.5) * 9);
      layer(() => {
        for (let i = 0; i < pile; i++) shape([[220 + (i % 2) * 6, 1176 - i * 16], [360 + (i % 2) * 6, 1176 - i * 16], [362, 1162 - i * 16], [222, 1162 - i * 16]], '#fbf7ee', { w: 0.7, seed: 1850 + i });
        const cups = Math.floor(seg(t, 24.6, 27.5) * 4);
        for (let i = 0; i < cups; i++) shape([[420 + i * 52, 1176], [452 + i * 52, 1176], [456 + i * 52, 1126], [416 + i * 52, 1126]], '#ffffff', { w: 0.8, seed: 1860 + i });
      });
      const k8 = easeBack(seg(t, 24.46, 24.66)), k10 = easeBack(seg(t, 25.32, 25.52));
      label('8-8 GHANTE', 560, 770, 92, '#ffffff', { k: k8 * (1 - seg(t, 25.25, 25.32)), rot: -4, swash: PAL.officeDark });
      label('10-10 GHANTE!', 560, 770, 104, YELLOW, { k: k10 * (1 - seg(t, 26.6, 26.75)), rot: 3, swash: PAL.red, scale: 1 + 0.04 * Math.sin(t * 18) });
      if (t > 27.3) {
        const kc = easeBack(seg(t, 27.4, 27.6));
        layer(() => {
          for (const [cx, cy, r] of [[470, 760, 70], [540, 730, 85], [620, 765, 65], [545, 790, 70]]) shape(ellipsePts(cx, cy, r * kc, r * 0.7 * kc, 16), '#8a9399', { w: 1, seed: 1870 + cx });
        });
        if (t > 27.72) layer(() => { for (let i = 0; i < 5; i++) { const d = ((t * 2 + i * 0.37) % 1); drop(470 + i * 36, 840 + d * 160, 8, '#7fb6d6'); } });
        label('TARAKKI?', 545, 640, 80, '#ffffff', { k: kc, rot: -5, swash: PAL.red });
      }
    },
    screen(t) { tintScreen('#c7ccd0', 60, MULTIPLY); },
  },

  // 28.00 "Aur doosra, wahin ek naya jana aata hai, jo apni skill pe kaam karta hai"
  newguy: {
    cam(t) {
      if (t < 30.36) { const k = easeInOut(seg(t, 28.0, 29.9)); return { x: mix(560, 620, k), y: 980, z: 1.0 }; }
      const k = easeOut(seg(t, 30.36, 30.8));
      return { x: 560, y: 1000, z: mix(1.15, 1.25, k), sx: Math.sin(t * 60) * 1.5, sy: 0 };
    },
    draw(t) {
      plate(IMG.office);
      const tq = onTwos(t);
      const specB = officeOf(SPEC_B, PAL.teal, PAL.marigold);
      if (t < 30.36) {
        // sleepy gray colleague
        drawPerson(GRAY(officeOf(SPEC_A, '#c9d6e3', '#b8433a')), {
          x: 210, y: 1440, s: 0.82, lean: 28, legs: { mode: 'sit' }, armsFront: true, headTilt: 22,
          hands: { b: [150, -250], f: [180, -246] }, bendB: 1, bendF: 1, expr: { brow: 'tired', mouth: 'frown', eyes: 'closed' },
        });
        desk(60, 520, 1220, 300, '#9a948d');
        popLabel('zzz', 330, 900, t, 28.3, { family: FONT_HAND, size: 56, col: '#ffffff', life: 2.0, rot: -10 });
        // the new guy walks in, in full colour
        const wk = easeOut(seg(t, 28.5, 29.85));
        const x = mix(1250, 720, wk);
        const walking = wk < 1;
        const wave = t > 29.9 ? Math.sin(tq * 14) * 18 : 0;
        layer(() => { for (let i = 0; i < 3; i++) paint(ellipsePts(x, 1050, 300 - i * 70, 420 - i * 90, 24), '#fff1b8', { alpha: 60, seed: 1900 + i, flat: true }); });
        drawPerson(specB, {
          x, y: 1420, s: 1.1, face: -1, legs: walking ? { mode: 'walk', phase: tq * 13 } : { mode: 'stand', spread: 24 }, bob: walking ? -Math.abs(Math.sin(tq * 13)) * 10 : 0,
          armsFront: true, hands: t > 29.8 ? { b: [-40, -40 - 170], f: [70 + wave * 0.4, -520 + wave] } : undefined, bendB: -1, bendF: 1,
          expr: { brow: 'up', mouth: 'grin', eyes: 'open' },
        });
        if (t > 29.4) for (let i = 0; i < 4; i++) sparkle(x + [-170, 170, -130, 150][i], 820 + [0, -60, 200, 160][i], 26 * pulse(t, 29.45 + i * 0.12, 0.5), PAL.marigold, 1910 + i);
        label('NAYA JANA', 720, 600, 92, YELLOW, { k: easeBack(seg(t, 29.48, 29.7)), rot: -5, swash: PAL.teal });
        return;
      }
      // working on his skill: sharpening the SKILL axe at his desk
      const slide = Math.sin(tq * 16) * 40;
      drawPerson(specB, {
        x: 330, y: 1480, s: 1.15, lean: 10, legs: { mode: 'sit' }, armsFront: true,
        hands: { b: [190, -262], f: [300 + slide, -300] }, bendB: 1, bendF: 1,
        expr: { brow: 'calm', mouth: 'smile', eyes: 'open', look: 4 },
      });
      desk(120, 1000, 1190, 320);
      layer(() => drawAxe(470, 1165, -6, 1.7, { sharp: t > 31.0, seed: 1950 }));
      layer(() => shape(xf([[-60, -16], [60, -16], [60, 16], [-60, 16]], 790 + slide, 1060, -6), '#7a8a96', { w: 1, seed: 1960 }));
      sparks(800, 1080, t, -60, 1970, 18);
      tag(560, 1240, 'SKILL', -8, 1980);
      if (t > 31.0) sparkle(840, 1150, 40 * (1 + 0.2 * Math.sin(t * 25)), '#ffffff', 1990);
      label('SKILL PE KAAM', 560, 700, 96, YELLOW, { k: easeBack(seg(t, 30.62, 30.82)), rot: -4, swash: PAL.teal });
    },
    screen(t) { if (t < 30.36) tintScreen('#c7ccd0', 50, MULTIPLY); },
  },

  // 32.00 "Thodi mehnat karta hai, uski salary, uski kamai, dekho kahan se kahan pahunch jaati hai"
  growth: {
    cam(t) {
      const tip = growthTip(t);
      const up = easeInOut(seg(t, 35.3, 36.5));
      return { x: 560, y: mix(960, Math.min(960, tip[1] + 380), up), z: mix(1.0, 0.92, up) };
    },
    draw(t) {
      plate(IMG.graph);
      // sky above the chart for the final climb
      layer(() => {
        for (const [cx, cy, r] of [[240, 160, 90], [330, 140, 110], [430, 170, 80], [760, -180, 100], [860, -160, 120], [940, -200, 80]])
          shape(ellipsePts(cx, cy, r, r * 0.6, 18), '#ffffff', { w: 1, seed: 2000 + cx });
      });
      layer(() => {
        ink([[150, 300], [150, 1380], [990, 1380]], { closed: false, w: 2, curve: 0, seed: 2010 });
        shape([[136, 300], [164, 300], [150, 268]], INK, { w: 0.8, seed: 2011 });
        shape([[990, 1366], [990, 1394], [1022, 1380]], INK, { w: 0.8, seed: 2012 });
      });
      const u = growthU(t);
      const pts = [];
      for (let i = 0; i <= 40; i++) { const uu = (i / 40) * u; pts.push(growthPt(uu)); }
      if (u > 0.01) {
        ink(pts, { closed: false, brush: 'marker', color: '#1f8a52', w: 3.2, curve: 0.3, seed: 2020 });
        const tip = growthPt(u), prev = growthPt(Math.max(0, u - 0.02));
        const a = Math.atan2(tip[1] - prev[1], tip[0] - prev[0]) * 57.3;
        layer(() => shape(xf([[0, -34], [60, 0], [0, 34]], tip[0], tip[1], a), '#1f8a52', { w: 1.1, seed: 2021, curve: 0.05 }));
        // he rides the arrow
        const tq = onTwos(t);
        drawPerson(officeOf(SPEC_B, PAL.teal, PAL.marigold), {
          x: tip[0] - 14, y: tip[1] - 30, s: 0.72, lean: -8, armsFront: true,
          hands: { b: [-80, -560 + Math.sin(tq * 12) * 10], f: [90, -570 - Math.sin(tq * 12) * 10] }, bendB: -1, bendF: 1,
          legs: { mode: 'stand', spread: 34 }, expr: { brow: 'up', mouth: 'grin', eyes: u > 0.8 ? 'closed' : 'open' },
        });
      }
      [0.18, 0.34, 0.48, 0.6, 0.7, 0.8, 0.88, 0.95].forEach((cu, i) => {
        const born = growthTimeOf(cu);
        const d = t - born;
        if (d < 0 || d > 0.9) return;
        const p = growthPt(cu);
        coin(p[0] + (i % 2 ? 70 : -70), p[1] - 40 - d * 220, 34 * easeBack(seg(d, 0, 0.15)), 2100 + i * 5);
      });
      label('MEHNAT', 360, 1260, 70, '#ffffff', { k: easeBack(seg(t, 32.7, 32.9)), rot: -4, swash: PAL.officeDark });
      label('SALARY', 600, 1120, 84, '#ffffff', { k: easeBack(seg(t, 33.88, 34.08)), rot: -6, swash: '#1f8a52' });
      label('KAMAI', 740, 900, 84, '#ffffff', { k: easeBack(seg(t, 34.72, 34.92)), rot: -8, swash: '#1f8a52' });
      label('KAHAN SE KAHAN!', 540, growthTip(t)[1] + 260, 100, YELLOW, { k: easeBack(seg(t, 35.76, 35.96)), rot: -5, swash: PAL.red });
    },
  },

  // 36.90 "Tarot aapko har paristhiti ko guide dete hain, apni life ko improve karne ke liye"
  tarot: {
    cam(t) { const k = easeInOut(seg(t, 36.9, 42.4)); return { x: 540, y: mix(980, 930, k), z: mix(1.0, 1.12, k), r: Math.sin(t * 0.9) * 0.8 }; },
    draw(t) {
      plate(IMG.night);
      layer(() => {
        const R = rng(2200);
        for (let i = 0; i < 22; i++) {
          const x = rr(R, 40, 1040), y = rr(R, 380, 1700), ph = rr(R, 0, 6);
          const s = 6 + 10 * (0.5 + 0.5 * Math.sin(t * 4 + ph));
          shape(starPts(x, y, s, s * 0.3, 4), '#fbeec6', { w: 0.5, seed: 2210 + i, wob: 0.3 });
        }
        shape(moonPts(860, 520, 60), '#f6e3a8', { w: 1, seed: 2240 });
      });
      const enter = (i) => easeBack(seg(t, 36.98 + i * 0.1, 36.98 + i * 0.1 + 0.4));
      const fan = easeInOut(seg(t, 37.5, 37.95));
      const cards = [
        { x: mix(540, 260, fan), y: 1000, a: mix(0, -14, fan) },
        { x: mix(540, 820, fan), y: 1000, a: mix(0, 14, fan) },
      ];
      cards.forEach((c, i) => {
        const k = enter(i === 0 ? 0 : 2);
        if (k <= 0) return;
        tarotCard(c.x, mix(2300, c.y, k) + Math.sin(t * 2 + i) * 8, 280, 460, c.a + (1 - k) * 90, 1, false, 0, t, 2300 + i * 40);
      });
      const kc = enter(1);
      if (kc > 0) {
        const rise = easeInOut(seg(t, 37.92, 38.5));
        const flip = seg(t, 38.84, 39.14);
        const sx = Math.cos(flip * Math.PI);
        const glow = seg(t, 37.95, 38.6) * (0.7 + 0.3 * Math.sin(t * 5)) + seg(t, 40.1, 40.6) * 0.6;
        const cy = mix(2300, 960, kc) - rise * 60 + Math.sin(t * 2) * 6;
        tarotCard(540, cy, 330, 540, (1 - kc) * -60, sx, flip > 0.5, glow, t, 2400);
        if (flip > 0.75) label('THE SHARP AXE', 540, cy + 540 * 0.37, 38, '#f6ecd2', { family: FONT_HAND, k: easeOut(seg(t, 39.1, 39.3)), stroke: '#2a1f40', lw: 6, shadow: false });
        if (t > 39.4) {
          for (const p of particles(2500 + Math.floor(t * 4), 10, (t * 4) % 1 / 4 * 3, { x: 540, y: cy, angMin: -120, angMax: -60, spMin: 120, spMax: 320, g: -200, lifeMin: 0.6, lifeMax: 0.75, spread: 0 }))
            sparkle(p.x + (p.r[0] - 0.5) * 400, p.y - 200, 14 * (1 - p.k), PAL.gold, 2600);
        }
      }
      label('TAROT', 540, 470, 120, YELLOW, { k: easeBack(seg(t, 36.98, 37.18)) * (1 - seg(t, 38.7, 38.85)), rot: -3 });
      label('HAR PARISTHITI', 540, 1450, 80, '#ffffff', { k: easeBack(seg(t, 38.08, 38.28)) * (1 - seg(t, 38.75, 38.85)), rot: 2 });
      if (t > 40.3) label('LIFE IMPROVE!', 540, 470, 104, YELLOW, { k: easeBack(seg(t, 40.4, 40.6)), rot: -3, swash: PAL.violet });
    },
  },

  // 42.40 outro card (the audio sting lands at ~42.7)
  outro: {
    cam(t) { return impactCam({ x: 540, y: 960, z: 1.0 + 0.04 * easeInOut(seg(t, 42.4, 46.4)) }, t, [42.72], 0.08, 26); },
    draw(t) {
      plate(IMG.warm);
      burstBg(540, 760, t, '#f0b04f', 20);
      const k = easeBack(seg(t, 42.45, 42.75));
      layer(() => {
        for (let i = 3; i >= 1; i--) paint(ellipsePts(540, 760, 250 + i * 40, 250 + i * 40, 30), '#fff1b8', { alpha: 70, seed: 2700 + i, flat: true });
      });
      push(); translate(540, 760); rotate(-38 + 6 * Math.sin(t * 2.2)); scale(k);
      layer(() => drawAxe(-300, -40, 0, 2.6, { sharp: true, seed: 2710 }));
      pop();
      for (let i = 0; i < 5; i++) sparkle(540 + [-260, 250, 220, -200, 40][i], 760 + [-180, -120, 200, 230, -300][i], 30 * (0.6 + 0.4 * Math.sin(t * 6 + i)) * k, i % 2 ? '#ffffff' : PAL.marigold, 2720 + i);
    },
    overlay(ctx, t) {
      const k1 = easeBack(seg(t, 42.72, 42.92)), k2 = easeBack(seg(t, 42.9, 43.1)), k3 = easeOut(seg(t, 43.5, 43.8));
      const pop = (txt, y, size, col, k, rotA) => {
        if (k <= 0) return;
        ctx.save(); ctx.translate(W / 2, y); ctx.rotate(deg(rotA)); ctx.scale(k, k);
        const fit = Math.min(1, 980 / measureW(ctx, txt, size));
        ctx.scale(fit, fit);
        outlined(ctx, txt, 0, 0, size, col);
        ctx.restore();
      };
      pop('AAJ APNI', 1150, 112, '#ffffff', k1, -3);
      pop('KULHAADI TEZ KI?', 1290, 120, YELLOW, k2, 2);
      if (k3 > 0) {
        ctx.save(); ctx.globalAlpha = k3;
        outlined(ctx, 'Comment mein batao', W / 2, 1410, 56, '#ffffff', { family: FONT_HAND, lw: 9 });
        ctx.restore();
      }
    },
  },
});

// Salary curve: slow at first, then it takes off
const growthPt = (u) => [170 + 760 * Math.min(u, 1) + Math.max(0, u - 1) * 60, 1360 - (0.1 * u + 0.9 * Math.pow(u, 3.2)) * 960];
const GROWTH_KEYS = [[32.1, 0], [33.6, 0.32], [34.6, 0.58], [35.35, 0.78], [36.3, 1.06], [36.9, 1.22]];
function growthU(t) {
  for (let i = 1; i < GROWTH_KEYS.length; i++) {
    const [t0, u0] = GROWTH_KEYS[i - 1], [t1, u1] = GROWTH_KEYS[i];
    if (t <= t1) return mix(u0, u1, i === GROWTH_KEYS.length - 1 ? seg(t, t0, t1) : easeInOut(seg(t, t0, t1)) * 0.5 + seg(t, t0, t1) * 0.5);
  }
  return GROWTH_KEYS[GROWTH_KEYS.length - 1][1];
}
const growthTip = (t) => growthPt(growthU(t));
function growthTimeOf(u) { for (let t = 32.1; t < 36.9; t += 0.02) if (growthU(t) >= u) return t; return 99; }
