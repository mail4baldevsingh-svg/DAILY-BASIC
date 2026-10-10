// Canvas2D pass on top of the painted frame: paper grain, captions, headline, world labels.

const FONT_BIG = 'LuckiestGuy';
const FONT_HAND = 'Kalam';
const CAP_Y = SPLIT ? SPLIT_Y : 1505;
const YELLOW = '#ffd23f';

function makeGrain() {
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data, R = rng(99);
  const gw = 28, gh = 50, grid = [];
  for (let i = 0; i < (gw + 1) * (gh + 1); i++) grid.push(R());
  const low = (u, v) => {
    const gx = u * gw, gy = v * gh, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy;
    const a = grid[iy * (gw + 1) + ix], b = grid[iy * (gw + 1) + ix + 1], c2 = grid[(iy + 1) * (gw + 1) + ix], e = grid[(iy + 1) * (gw + 1) + ix + 1];
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    return mix(mix(a, b, sx), mix(c2, e, sx), sy);
  };
  for (let y = 0; y < H; y++) {
    for (let xx = 0; xx < W; xx++) {
      const u = xx / W, v = y / H;
      const lf = low(Math.min(u, 0.9999), Math.min(v, 0.9999));
      const fine = R();
      const dx = u - 0.5, dy = (v - 0.5) * 1.2, r = Math.sqrt(dx * dx + dy * dy) / 0.72;
      const vig = 1 - 0.22 * clamp((r - 0.55) / 0.45, 0, 1) ** 2;
      const val = (255 - fine * 16 - lf * 16) * vig;
      const i = (y * W + xx) * 4;
      d[i] = val; d[i + 1] = val * 0.985; d[i + 2] = val * 0.955; d[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  return c;
}

function setFont(ctx, size, family = FONT_BIG) { ctx.font = `${size}px ${family}`; }

// Outlined cartoon text with drop shadow. Returns width.
function outlined(ctx, text, x, y, size, fillCol, opts = {}) {
  ctx.save();
  setFont(ctx, size, opts.family ?? FONT_BIG);
  ctx.textAlign = opts.align ?? 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.miterLimit = 2;
  const lw = opts.lw ?? size * 0.2;
  ctx.globalAlpha = opts.alpha ?? 1;
  if (opts.shadow !== false) {
    ctx.fillStyle = 'rgba(30,20,12,0.55)';
    ctx.strokeStyle = 'rgba(30,20,12,0.55)'; ctx.lineWidth = lw;
    ctx.strokeText(text, x + size * 0.04, y + size * 0.1); ctx.fillText(text, x + size * 0.04, y + size * 0.1);
  }
  ctx.strokeStyle = opts.stroke ?? INK; ctx.lineWidth = lw;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fillCol;
  ctx.fillText(text, x, y);
  const w = ctx.measureText(text).width;
  ctx.restore();
  return w;
}
function measureW(ctx, text, size, family = FONT_BIG) { ctx.save(); setFont(ctx, size, family); const w = ctx.measureText(text).width; ctx.restore(); return w; }

// Hand-drawn wobbly underline/highlight swash under text
function swash(ctx, x0, x1, y, h, col, seed, k = 1) {
  const R = rng(seed + SEED);
  ctx.save(); ctx.fillStyle = col; ctx.beginPath();
  const xe = mix(x0, x1, k);
  ctx.moveTo(x0, y + rr(R, -3, 3));
  for (let i = 1; i <= 8; i++) ctx.lineTo(mix(x0, xe, i / 8), y + rr(R, -4, 4));
  for (let i = 8; i >= 0; i--) ctx.lineTo(mix(x0, xe, i / 8) + rr(R, -3, 3), y + h + rr(R, -4, 4));
  ctx.closePath(); ctx.fill(); ctx.restore();
}

// ---------------------------------------------------------------- captions
function drawCaptions(ctx, t) {
  const line = CAPTION_LINES.find((l) => t >= l.t0 - 0.02 && t < l.t1);
  if (!line) return;
  const size = SPLIT ? 98 : 104, gap = 34;
  const words = line.words.map((w) => w[0].toUpperCase());
  let total = words.reduce((n, w) => n + measureW(ctx, w, size), 0) + gap * (words.length - 1);
  const scaleFit = Math.min(1, 960 / total);
  const k = line.t0 < 0.05 ? 1 : easeBack(seg(t, line.t0 - 0.02, line.t0 + 0.12));
  const R = rng(Math.round(line.t0 * 100));
  const tiltA = rr(R, -2.2, 2.2);
  ctx.save();
  ctx.translate(W / 2, CAP_Y + (1 - k) * 40);
  ctx.rotate(deg(tiltA));
  ctx.scale(scaleFit * (0.6 + 0.4 * k), scaleFit * (0.6 + 0.4 * k));
  ctx.globalAlpha = clamp(k * 1.5, 0, 1);
  let x = -total / 2;
  const boil = rng(SEED * 13 + 1);
  line.words.forEach((w, i) => {
    const ww = measureW(ctx, words[i], size);
    const spoken = t >= w[1];
    const active = spoken && (i === line.words.length - 1 || t < line.words[i + 1][1]);
    const pop = active ? 1 + 0.14 * Math.exp(-(t - w[1]) * 14) + 0.05 : 1;
    const col = active ? YELLOW : (w[2] && spoken ? YELLOW : '#ffffff');
    ctx.save();
    ctx.translate(x + ww / 2 + rr(boil, -1.5, 1.5), rr(boil, -1.5, 1.5));
    ctx.scale(pop, pop);
    if (active) ctx.rotate(deg(-2));
    outlined(ctx, words[i], 0, 0, size, col, { alpha: spoken ? 1 : 0.92 });
    ctx.restore();
    x += ww + gap;
  });
  ctx.restore();
}

// ---------------------------------------------------------------- headline
const HOOK_END = 3.6;
function drawHeadline(ctx, t) {
  if (t > SCENES.find((s) => s.id === 'tarot').t0 - 0.1) return;
  if (t < HOOK_END + 0.3) {
    // the hook: lands word by word in the first second
    const lines = [['10', 'GHANTE', 'KAAM...'], ['FIR', 'BHI', 'TARAKKI', 'NAHI?']];
    const cols = ['#ffffff', YELLOW];
    const sizes = SPLIT ? [94, 88] : [104, 96];
    let n = 0;
    const out = seg(t, HOOK_END, HOOK_END + 0.3);
    lines.forEach((ws, li) => {
      const y = (SPLIT ? 215 : 330) + li * (SPLIT ? 110 : 122);
      const tw = ws.reduce((a, w) => a + measureW(ctx, w, sizes[li]), 0) + 22 * (ws.length - 1);
      const fit = Math.min(1, 980 / tw);
      let x = W / 2 - (tw * fit) / 2;
      ws.forEach((w) => {
        const at = li === 0 ? -1 : 0.35 + (n - 3) * 0.12; n++;
        const k = li === 0 ? 1 : easeBack(seg(t, at, at + 0.18));
        const ww = measureW(ctx, w, sizes[li]) * fit;
        if (k > 0) {
          ctx.save();
          ctx.translate(x + ww / 2, y - out * 60);
          ctx.rotate(deg(li ? 2 : -2));
          ctx.scale(k * fit * (1 + 0.06 * Math.sin(t * 9 + n)), k * fit);
          outlined(ctx, w, 0, 0, sizes[li], cols[li], { alpha: 1 - out });
          ctx.restore();
        }
        x += ww + 22 * fit;
      });
    });
    if (out <= 0) return;
  }
  // persistent title
  const k = easeBack(seg(t, HOOK_END + 0.1, HOOK_END + 0.4));
  if (k <= 0) return;
  ctx.save();
  ctx.translate(W / 2, SPLIT ? 195 : 300);
  ctx.scale(k * (SPLIT ? 0.8 : 1), k * (SPLIT ? 0.8 : 1));
  const w1 = measureW(ctx, 'SHARPEN YOUR ', 70), w2 = measureW(ctx, 'AXE', 70);
  const x0 = -(w1 + w2) / 2;
  swash(ctx, x0 + w1 - 14, x0 + w1 + w2 + 14, -30, 64, '#d64933', 5);
  outlined(ctx, 'SHARPEN YOUR ', x0, 0, 70, '#ffffff', { align: 'left' });
  outlined(ctx, 'AXE', x0 + w1, 0, 70, YELLOW, { align: 'left' });
  ctx.restore();
}

// ---------------------------------------------------------------- world labels
// Scenes push labels in world coordinates; they are drawn with the scene camera.
function label(text, x, y, size, col, opts = {}) { LABELS.push({ text, x, y, size, col, ...opts }); }
function drawLabels(ctx, cam) {
  ctx.save();
  ctx.translate(W / 2 + cam.sx, PANEL_CY + cam.sy);
  ctx.rotate(deg(cam.r));
  ctx.scale(cam.z, cam.z);
  ctx.translate(-cam.x, -cam.y);
  for (const L of LABELS) {
    if ((L.k ?? 1) <= 0) continue;
    ctx.save();
    let ly = L.y;
    if (SPLIT) {
      const screenY = (L.y - cam.y) * cam.z + PANEL_CY + cam.sy, minY = 255 + L.size * 0.3;
      if (screenY < minY) ly += (minY - screenY) / cam.z;
    }
    ctx.translate(L.x, ly);
    ctx.rotate(deg(L.rot ?? 0));
    const sc = (L.k ?? 1) * (L.scale ?? 1);
    ctx.scale(sc, sc);
    if (L.swash) {
      const w = measureW(ctx, L.text, L.size, L.family ?? FONT_BIG);
      swash(ctx, -w / 2 - 18, w / 2 + 18, -L.size * 0.42, L.size * 0.84, L.swash, 9, L.swashK ?? 1);
    }
    outlined(ctx, L.text, 0, 0, L.size, L.col, { family: L.family, alpha: L.alpha ?? 1, lw: L.lw, stroke: L.stroke, shadow: L.shadow });
    ctx.restore();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- split layout
const VID = { x: 108, y: SPLIT_Y, w: 864, h: 720 };
function wobblyPath(ctx, pts, seed, amt) {
  const R = rng(seed);
  ctx.beginPath();
  pts.forEach((p, i) => {
    const q = pts[(i + 1) % pts.length];
    for (let k = 0; k < 6; k++) {
      const x = mix(p[0], q[0], k / 6) + rr(R, -amt, amt), y = mix(p[1], q[1], k / 6) + rr(R, -amt, amt);
      if (i === 0 && k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
  });
  ctx.closePath();
}
function drawVideoPanel(ctx, img) {
  ctx.save();
  ctx.fillStyle = PAPER;
  ctx.fillRect(0, SPLIT_Y, W, H - SPLIT_Y);
  ctx.globalCompositeOperation = 'multiply';
  ctx.drawImage(GRAIN, 0, SPLIT_Y, W, H - SPLIT_Y, 0, SPLIT_Y, W, H - SPLIT_Y);
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(42,32,24,0.35)';
  ctx.fillRect(VID.x + 12, VID.y + 16, VID.w, VID.h);
  if (img) ctx.drawImage(img, VID.x, VID.y, VID.w, VID.h);
  ctx.strokeStyle = INK; ctx.lineWidth = 7; ctx.lineJoin = 'round';
  wobblyPath(ctx, [[VID.x, VID.y], [VID.x + VID.w, VID.y], [VID.x + VID.w, H + 30], [VID.x, H + 30]], SEED * 31 + 5, 2.2);
  ctx.stroke();
  // little doodles in the paper margins
  ctx.fillStyle = PAL.marigold; ctx.strokeStyle = INK; ctx.lineWidth = 3;
  for (const [x, y, r] of [[54, 1330, 18], [1026, 1460, 16], [52, 1640, 12], [1030, 1270, 11]]) {
    const R = rng(SEED * 11 + x);
    ctx.beginPath();
    for (let i = 0; i < 8; i++) { const a = deg(-90 + i * 45), rad = i % 2 ? r * 0.32 : r; ctx.lineTo(x + Math.cos(a) * rad + rr(R, -1, 1), y + Math.sin(a) * rad + rr(R, -1, 1)); }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  ctx.restore();
}
// Torn paper edge where the animation page overlaps the video
function drawSeam(ctx) {
  const R = rng(SEED * 17 + 9);
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-10, SPLIT_Y - 6);
  ctx.lineTo(W + 10, SPLIT_Y - 6);
  const edge = [];
  for (let x = W + 10; x >= -10; x -= 22) edge.push([x, SPLIT_Y + 10 + rr(R, -7, 7)]);
  for (const [x, y] of edge) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fillStyle = '#ece1c9';
  ctx.shadowColor = 'rgba(42,32,24,0.4)'; ctx.shadowOffsetY = 6; ctx.shadowBlur = 8;
  ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath();
  edge.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.strokeStyle = INK; ctx.lineWidth = 5; ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}
