// Background plates painted once with real p5.brush watercolour, then saved as PNGs.
// Watercolour fills cost seconds each in software WebGL, so they are never painted per frame.

function wc(col, op, bleed = 0.2, tex = 0.45, border = 0.35, scatter = true) {
  brush.noStroke();
  brush.fill(col, op);
  brush.fillBleed(bleed);
  brush.fillTexture(tex, border, scatter);
}
function pencil(name, col, w) {
  brush.noFill();
  brush.set(name, col, w);
}
// Band with wavy top/bottom edges (long straight edges bleed into a sawtooth)
function band(y0, y1, amp, seed, x0 = -60, x1 = W + 60) {
  const R = rng(seed), top = [], bot = [];
  const p1 = rr(R, 0, 6), p2 = rr(R, 0, 6);
  for (let x = x0; x <= x1; x += 45) {
    top.push([x, y0 + Math.sin(x * 0.006 + p1) * amp + rr(R, -amp, amp) * 0.4]);
    bot.push([x, y1 + Math.sin(x * 0.007 + p2) * amp + rr(R, -amp, amp) * 0.4]);
  }
  return top.concat(bot.reverse());
}
function bumpyTop(y0, y1, step, amp, seed, x0 = -60, x1 = W + 60) {
  const R = rng(seed), pts = [];
  for (let x = x0; x <= x1; x += step) pts.push([x, y0 - Math.abs(Math.sin(x * 0.013 + seed)) * amp - rr(R, 0, amp * 0.4)]);
  pts.push([x1, y1], [x0, y1]);
  return pts;
}
function crowns(y0, y1, seed, rMin, rMax, x0 = -60, x1 = W + 60) {
  const R = rng(seed), pts = [];
  let x = x0;
  while (x < x1) {
    const r = rr(R, rMin, rMax), cy = y0 + rr(R, -r * 0.3, r * 0.3);
    for (let i = 0; i <= 8; i++) { const a = Math.PI + (i / 8) * Math.PI; pts.push([x + r + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    x += r * 1.6;
  }
  pts.push([x1, y1], [x0, y1]);
  return pts;
}
function grassTufts(seed, n, y0, y1, col) {
  const R = rng(seed);
  pencil('HB', col, 1.2);
  for (let i = 0; i < n; i++) {
    const x = rr(R, -20, W + 20), y = rr(R, y0, y1), s = mix(0.6, 1.4, (y - y0) / (y1 - y0));
    for (let k = -2; k <= 2; k++) brush.line(x + k * 6 * s, y, x + k * 12 * s + rr(R, -5, 5), y - rr(R, 18, 34) * s);
  }
}

const PLATES = {
  forest() {
    background(PAPER);
    wc('#8fbcd0', 200, 0.25); brush.polygon(band(-80, 760, 40, 1));
    wc('#b9d6df', 150, 0.25); brush.polygon(band(260, 930, 50, 2));
    wc('#f7c99b', 190, 0.25); brush.polygon(band(640, 1300, 45, 3));
    wc('#86a99a', 190, 0.15); brush.polygon(bumpyTop(1000, 1320, 40, 80, 3));
    wc('#4f8456', 210, 0.15); brush.polygon(crowns(1110, 1330, 9, 50, 100));
    wc('#2f5d43', 150, 0.15); brush.polygon(crowns(1175, 1330, 21, 35, 70));
    wc('#b7a957', 220, 0.12); brush.polygon([[-60, 1215], [300, 1200], [700, 1225], [W + 60, 1205], [W + 60, H + 60], [-60, H + 60]]);
    wc('#7f9a4c', 190, 0.18); brush.polygon([[-60, 1480], [500, 1450], [W + 60, 1500], [W + 60, H + 60], [-60, H + 60]]);
    wc('#5b7d3f', 160, 0.2); brush.polygon([[-60, 1760], [600, 1730], [W + 60, 1770], [W + 60, H + 60], [-60, H + 60]]);
    pencil('HB', '#3f5f45', 1); const R = rng(4);
    for (let i = 0; i < 14; i++) { const x = rr(R, 0, W); brush.line(x, 1160 + rr(R, 0, 60), x + rr(R, -4, 4), 1270); }
    grassTufts(5, 80, 1240, 1900, '#3f5a2e');
    pencil('2B', '#4e6233', 1.2); brush.spline([[-20, 1212], [300, 1198], [700, 1224], [1100, 1204]], 0.5);
  },
  tree() {
    // On white so it can be multiplied over any plate. Trunk base sits at (540,1700).
    background(255);
    const trunk = [[395, 1712], [452, 1655], [466, 1300], [478, 980], [450, 860], [480, 850], [522, 930], [560, 930], [606, 850], [636, 860], [602, 980], [614, 1300], [628, 1655], [695, 1712]];
    wc(PAL.bark, 235, 0.05, 0.5, 0.45, false); brush.polygon(trunk);
    const clumps = [[540, 560, 250], [370, 650, 175], [710, 640, 175], [450, 420, 180], [640, 410, 170], [540, 290, 140], [300, 520, 120], [780, 500, 120], [460, 760, 150], [630, 770, 150]];
    wc(PAL.leaf1, 210, 0.18); for (const [x, y, r] of clumps) brush.circle(x, y + 30, r, 0.3);
    wc(PAL.leaf2, 190, 0.18); for (const [x, y, r] of clumps) brush.circle(x - 20, y - 10, r * 0.78, 0.35);
    wc(PAL.leaf3, 170, 0.2); for (const [x, y, r] of clumps.slice(3, 8)) brush.circle(x - 40, y - 40, r * 0.5, 0.4);
    pencil('2B', INK, 1.4);
    brush.spline([[452, 1657], [466, 1300], [478, 980], [458, 900]], 0.4);
    brush.spline([[628, 1657], [614, 1300], [602, 980], [622, 900]], 0.4);
    brush.spline([[395, 1712], [452, 1657]], 0.2); brush.spline([[695, 1712], [628, 1657]], 0.2);
    pencil('HB', PAL.barkDark, 1.3); const R = rng(8);
    for (let i = 0; i < 18; i++) { const x = rr(R, 480, 600), y = rr(R, 960, 1640); brush.line(x, y, x + rr(R, -6, 6), y + rr(R, 40, 120)); }
    for (let i = 0; i < 26; i++) { const y = 1000 + i * 25; brush.line(585, y, 608, y - 14); }
    // ink each clump on the side facing away from the canopy centre
    pencil('pen', '#1f3a29', 1.25);
    for (const [x, y, r] of clumps) {
      if (Math.hypot(x - 540, y - 540) < 40) continue;
      const a = Math.atan2(y - 540, x - 540) * 180 / Math.PI;
      brush.arc(x - 10, y + 15, r * 0.82, a - 50, a + 50);
    }
    pencil('pen', '#24402f', 0.8);
    for (const [x, y, r] of clumps.slice(1, 6)) brush.arc(x, y + r * 0.25, r * 0.35, 40, 140);
  },
  office() {
    background(PAPER);
    wc(PAL.officeWall, 160, 0.12); brush.polygon([[-60, -60], [W + 60, -60], [W + 60, 1360], [-60, 1360]]);
    wc('#aeb8bd', 110, 0.1); brush.polygon([[-60, 1080], [W + 60, 1080], [W + 60, 1360], [-60, 1360]]);
    wc('#a8988a', 150, 0.1); brush.polygon([[-60, 1350], [W + 60, 1350], [W + 60, H + 60], [-60, H + 60]]);
    wc('#7f776b', 90, 0.15); brush.polygon([[-60, 1350], [W + 60, 1350], [W + 60, 1430], [-60, 1430]]);
    pencil('HB', '#6d757a', 1.2); brush.line(-20, 1080, W + 20, 1080); brush.line(-20, 1352, W + 20, 1352);
    pencil('HB', '#857a6c', 1);
    for (let i = -6; i <= 6; i++) brush.line(540 + i * 60, 1360, 540 + i * 260, H + 40);
    for (let y of [1480, 1620, 1800]) brush.line(-20, y, W + 20, y);
  },
  night() {
    background('#ddd6ea');
    wc('#3a3a85', 220, 0.18, 0.5, 0.4); brush.polygon([[-60, -60], [W + 60, -60], [W + 60, H + 60], [-60, H + 60]]);
    wc('#1f1d47', 190, 0.25); brush.polygon([[-60, -60], [W + 60, -60], [W + 60, 900], [-60, 1050]]);
    wc('#7a4fa0', 130, 0.3); brush.circle(540, 1000, 420, 0.4);
    wc('#1b1940', 170, 0.25); brush.polygon([[-60, 1500], [W + 60, 1450], [W + 60, H + 60], [-60, H + 60]]);
  },
  warm() {
    background(PAPER);
    wc('#f3b98f', 80, 0.3); brush.circle(600, 1000, 560, 0.4);
    wc(PAL.marigold, 95, 0.3); brush.circle(520, 880, 470, 0.35);
    wc('#e7d2ad', 70, 0.2); brush.polygon([[-60, 1500], [W + 60, 1460], [W + 60, H + 60], [-60, H + 60]]);
  },
  workshop() {
    background('#efe2c8');
    wc('#a36a42', 170, 0.15); brush.polygon([[-60, -60], [W + 60, -60], [W + 60, H + 60], [-60, H + 60]]);
    wc(PAL.marigold, 110, 0.3); brush.circle(540, 900, 430, 0.35);
    wc('#4f311f', 150, 0.25); brush.polygon([[-60, -60], [W + 60, -60], [W + 60, 260], [-60, 360]]);
    wc('#4f311f', 150, 0.25); brush.polygon([[-60, 1560], [W + 60, 1500], [W + 60, H + 60], [-60, H + 60]]);
  },
  graph() {
    background(PAPER);
    wc('#d9e6e3', 90, 0.15); brush.polygon([[60, 380], [W - 60, 360], [W - 50, 1560], [50, 1580]]);
    pencil('HB', '#9db4c4', 1);
    for (let x = 120; x < W - 60; x += 90) brush.line(x, 380, x, 1560);
    for (let y = 420; y < 1580; y += 90) brush.line(60, y, W - 60, y);
  },
};
const PLATE_NAMES = Object.keys(PLATES);
