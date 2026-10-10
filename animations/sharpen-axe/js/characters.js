// Character rig, axe and tree. Characters are drawn live every frame:
// layered flat paint + boiling p5.brush ink, so they read as hand-drawn.

const SPEC_A = { // the tired, busy one
  skin: PAL.skinA, turban: PAL.rust, top: PAL.indigo, pants: PAL.cream, shoe: PAL.brown,
  stache: 'droop', beard: false, seed: 11,
};
const SPEC_B = { // the one who sharpens
  skin: PAL.skinB, turban: PAL.saffron, top: PAL.green, pants: PAL.cream, shoe: PAL.brown,
  stache: 'curl', beard: true, seed: 23,
};
const officeOf = (spec, shirt, tie) => ({ ...spec, top: shirt, tie, pants: '#5b6670', seed: spec.seed + 100 });
const GRAY = (spec) => ({ ...spec, skin: '#b9b2a8', turban: '#8d9499', top: '#a3abb1', pants: '#7d868c', shoe: '#5d666d', tie: '#8d9499' });

const dir = (a) => [Math.cos(deg(a)), Math.sin(deg(a))];
const add = (p, q, k = 1) => [p[0] + q[0] * k, p[1] + q[1] * k];

// ---------------------------------------------------------------- axe
// Axe in local coords: handle along +x from the butt, head at the end, blade on +y.
function drawAxe(x, y, a, s, opts = {}) {
  const L = 200;
  const sharp = !!opts.sharp, seed = opts.seed ?? 61;
  const toW = (pts) => xf(pts, x, y, a, s);
  shape(toW(limbPts(0, 0, L + 8, 0, 17, 15)), '#b07a46', { w: 0.9, seed });
  const head = [[L - 26, -20], [L + 6, -20], [L + 8, 6], [L + 20, 30], [L + 26, 47], [L - 8, 54], [L - 44, 47], [L - 34, 26], [L - 26, 6]];
  shape(toW(head), sharp ? '#b8c4cc' : '#7d8084', { w: 1.1, seed: seed + 1 });
  if (sharp) {
    ink(toW([[L + 24, 44], [L - 8, 51], [L - 42, 44]]), { closed: false, color: '#ffffff', brush: 'marker', w: 1.1, seed: seed + 2 });
    paint(toW([[L - 20, -12], [L + 2, -12], [L + 4, 4], [L - 18, 4]]), '#eef3f5', { alpha: 200, seed: seed + 3 });
  } else {
    // chipped, rusty edge
    ink(toW([[L + 24, 46], [L + 12, 51], [L + 4, 46], [L - 6, 53], [L - 16, 47], [L - 28, 52], [L - 42, 46]]), { closed: false, w: 0.9, curve: 0.05, seed: seed + 2 });
    for (const [px, py, r] of [[L - 10, 20, 6], [L + 4, 32, 4], [L - 26, 34, 5]]) paint(toW(ellipsePts(px, py, r, r * 0.8, 10)), '#9a5a32', { alpha: 210, seed: seed + px });
  }
  return toW([[L - 8, 54]])[0]; // blade tip, world coords
}

// ---------------------------------------------------------------- person
// pose: { x, y, s, face, lean, bob, phi (axe angle), axeSharp, hands:{l,r}, legs, expr, look, armsUp }
function drawPerson(spec, pose) {
  const s = pose.s ?? 1, face = pose.face ?? 1;
  push();
  translate(pose.x, pose.y);
  scale(face * s, s);
  const sd = spec.seed;
  const lean = pose.lean ?? 0, bob = pose.bob ?? 0;
  const hip = [0, -200 + bob];
  const T = (p) => { const q = rot(p, lean); return [hip[0] + q[0], hip[1] + q[1]]; }; // torso local -> person local
  const shF = T([22, -168]), shB = T([-16, -172]);
  const headC = add(T([14, -250]), [0, 0]);
  const legs = pose.legs ?? { mode: 'stand' };

  // ---- legs
  let feet;
  if (legs.mode === 'walk') {
    const ph = legs.phase ?? 0, sw = Math.sin(ph) * 46;
    feet = [[-6 - sw, 0], [6 + sw, 0]];
  } else if (legs.mode === 'sit' || legs.mode === 'none') {
    feet = null;
  } else {
    const sp = legs.spread ?? 26;
    feet = [[-sp - 4, 0], [sp + 4, 0]];
  }
  if (feet) layer(() => {
    const hips = [add(hip, [-16, 6]), add(hip, [18, 6])];
    for (let i = 0; i < 2; i++) {
      const f = feet[i], hp = hips[i];
      const knee = ik(hp[0], hp[1], f[0], f[1] - 22, 102, 102, i ? -1 : -1);
      shape(limbPts(hp[0], hp[1], knee[0], knee[1], 48, 42), spec.pants, { w: 1, seed: sd + 1 + i, noInk: true });
      shape(limbPts(knee[0], knee[1], f[0], f[1] - 20, 42, 34), spec.pants, { w: 1, seed: sd + 3 + i, noInk: true });
      ink([[hp[0] - 20, hp[1]], [knee[0] - 20, knee[1]], [f[0] - 16, f[1] - 22]], { closed: false, w: 0.9, seed: sd + 5 + i });
      ink([[hp[0] + 22, hp[1]], [knee[0] + 20, knee[1]], [f[0] + 16, f[1] - 22]], { closed: false, w: 0.9, seed: sd + 7 + i });
      shape(ellipsePts(f[0] + 16, f[1] - 12, 34, 15, 16), spec.shoe, { w: 1, seed: sd + 9 + i });
    }
  }); else if (legs.mode === 'sit') layer(() => {
    // seated: thighs forward
    const hp = add(hip, [10, 10]);
    shape(limbPts(hp[0] - 10, hp[1], hp[0] + 105, hp[1] + 6, 52, 46), spec.pants, { w: 1, seed: sd + 1 });
    shape(limbPts(hp[0] + 105, hp[1] + 6, hp[0] + 112, hp[1] + 112, 44, 36), spec.pants, { w: 1, seed: sd + 2 });
  });

  // ---- arms (computed now, drawn around the torso depending on pose)
  let hands = null, axeA = null;
  if (pose.phi !== undefined) {
    axeA = pose.phi;
    const d = dir(axeA), mid = [(shF[0] + shB[0]) / 2, (shF[1] + shB[1]) / 2];
    const G = add(mid, d, 128);
    hands = { b: add(G, d, -20), f: add(G, d, 24), butt: add(G, d, -46) };
  } else if (pose.hands) {
    hands = { b: pose.hands.b, f: pose.hands.f };
  } else {
    hands = { b: add(shB, [-14, 168]), f: add(shF, [16, 166]) };
  }
  const drawArm = (sh, hand, k, bend) => layer(() => {
    const el = ik(sh[0], sh[1], hand[0], hand[1], 92, 88, bend);
    shape(limbPts(sh[0], sh[1], el[0], el[1], 40, 36), spec.top, { w: 1, seed: sd + 20 + k });
    shape(limbPts(el[0], el[1], hand[0], hand[1], 36, 30), spec.top, { w: 1, seed: sd + 22 + k });
    shape(ellipsePts(hand[0], hand[1], 19, 18, 14), spec.skin, { w: 0.9, seed: sd + 24 + k });
  });
  const axeBehind = axeA !== undefined && axeA !== null && (axeA < -95 || axeA > 200);
  const drawAxeAndArms = () => {
    if (axeA !== null) layer(() => drawAxe(hands.butt[0], hands.butt[1], axeA, pose.axeScale ?? 1.25, { sharp: pose.axeSharp, seed: sd + 30 }));
    drawArm(shB, hands.b, 0, pose.bendB ?? 1);
    drawArm(shF, hands.f, 1, pose.bendF ?? 1);
  };
  if (!pose.armsFront && axeA === null) drawArm(shB, hands.b, 0, pose.bendB ?? -1);

  // ---- torso (kurta / shirt)
  layer(() => {
  const kurta = [[-44, -182], [40, -182], [64, -158], [62, -60], [84, 30], [-82, 30], [-62, -60], [-62, -160]].map(T);
  shape(kurta, spec.top, { w: 1.1, seed: sd + 40 });
  if (spec.tie) {
    shape([[16, -178], [34, -178], [30, -150], [40, -70], [25, -50], [12, -70], [20, -150]].map(T), spec.tie, { w: 0.8, seed: sd + 41 });
    shape([[-6, -186], [24, -170], [52, -186], [26, -160]].map(T), '#f5f1e8', { w: 0.8, seed: sd + 42 });
  } else {
    ink([[22, -180], [24, -140]].map(T), { closed: false, w: 0.8, seed: sd + 43 });
    for (const yy of [-160, -146]) paint(ellipsePts(...T([30, yy]), 4, 4, 8), INK, { flat: true });
  }
  });

  if (axeBehind) drawAxeAndArms();

  // ---- head
  const tilt = pose.headTilt ?? 0;
  push();
  translate(headC[0], headC[1]); rotate(lean * 0.4 + tilt);
  drawHead(spec, pose.expr ?? {}, sd);
  pop();

  if (axeA !== null && !axeBehind) drawAxeAndArms();
  else if (axeA === null) {
    if (pose.armsFront) drawArm(shB, hands.b, 0, pose.bendB ?? -1);
    drawArm(shF, hands.f, 1, pose.bendF ?? -1);
  }
  pop();
  return { headC };
}

// Head in local coords (centre 0,0, facing +x)
function drawHead(spec, e, sd) {
  const R = 64;
  layer(() => {
  // neck
  shape(limbPts(-6, 40, -2, 78, 40, 44), spec.skin, { w: 0.8, seed: sd + 50, noInk: true });
  if (spec.beard) shape([[-40, 10], [-30, 52], [10, 82], [52, 70], [74, 30], [60, 40], [20, 46], [-10, 30]], '#2e2219', { w: 0.9, seed: sd + 51 });
  shape(ellipsePts(0, 0, R, R * 1.02, 26), spec.skin, { w: 1.1, seed: sd + 52 });
  if (spec.beard) shape([[-42, 12], [-28, 56], [12, 84], [54, 72], [76, 34], [56, 46], [24, 50], [-6, 34]], '#3a2b20', { w: 0.9, seed: sd + 53 });
  // ear
  shape(ellipsePts(-32, 6, 13, 17, 12), spec.skin, { w: 0.9, seed: sd + 54 });
  });
  layer(() => {
  // turban
  const tb = [[-66, 2], [-74, -40], [-50, -92], [0, -116], [52, -100], [76, -52], [72, -14], [52, -22], [0, -30], [-44, -14]];
  shape(tb, spec.turban, { w: 1.2, seed: sd + 55, curve: 0.45 });
  ink([[-60, -30], [-10, -70], [50, -88]], { closed: false, w: 0.8, seed: sd + 56 });
  ink([[-62, -10], [0, -48], [64, -50]], { closed: false, w: 0.8, seed: sd + 57 });
  // nose
  shape(ellipsePts(62, 10, 14, 13, 12), spec.skin, { w: 0.9, seed: sd + 58 });
  });
  layer(() => {
  // eyes
  const ey = e.eyes ?? 'open', lx = e.look ?? 0;
  for (const ex of [26, 52]) {
    const x = ex + lx;
    if (ey === 'closed' || (ey === 'wink' && ex === 26)) ink([[x - 9, -4], [x, 2], [x + 9, -4]], { closed: false, w: 1, seed: sd + ex });
    else if (ey === 'half') {
      solid(ellipsePts(x, 0, 6, 5, 10), INK);
      inkLine(x - 10, -4, x + 10, -4, { w: 1, seed: sd + ex });
    } else if (ey === 'wide') {
      shape(ellipsePts(x, -4, 11, 13, 14), '#ffffff', { w: 0.9, seed: sd + ex });
      solid(ellipsePts(x + 2, -2, 5, 6, 10), INK);
    } else solid(ellipsePts(x, -4, 6, 8, 12), INK);
    if (ey === 'wink' && ex === 52) inkLine(x - 9, -16, x + 9, -12, { w: 0.8, seed: sd + 66 });
    if (e.bags) ink([[x - 8, 12], [x, 15], [x + 8, 12]], { closed: false, w: 0.6, color: '#8a5a4a', seed: sd + ex + 1 });
  }
  // brows
  const br = e.brow ?? 'calm';
  const browY = { calm: [-24, -24], up: [-32, -30], tired: [-18, -26], angry: [-28, -18], sly: [-22, -30] }[br];
  inkLine(16, browY[0], 34, browY[0] - (br === 'tired' ? -4 : 2), { w: 1.4, brush: 'marker', seed: sd + 60 });
  inkLine(44, browY[1], 62, browY[1] + (br === 'tired' ? 4 : br === 'angry' ? -4 : -2), { w: 1.4, brush: 'marker', seed: sd + 61 });
  // cheek
  paint(ellipsePts(30, 22, 13, 9, 12), '#e98a7a', { alpha: 120, seed: sd + 62 });
  // mouth
  const m = e.mouth ?? 'smile';
  if (m === 'open' || m === 'pant') {
    const h = m === 'pant' ? 14 : 18;
    shape(ellipsePts(50, 44, 13, h, 14), '#7a2b22', { w: 0.9, seed: sd + 63 });
    if (m === 'pant') paint(ellipsePts(50, 54, 7, 6, 10), '#e0707a', { seed: sd + 64 });
  } else if (m === 'grin') {
    shape([[30, 38], [72, 34], [62, 56], [40, 56]], '#ffffff', { w: 0.9, seed: sd + 63 });
  } else if (m === 'frown') {
    ink([[36, 50], [50, 42], [64, 50]], { closed: false, w: 1, seed: sd + 63 });
  } else if (m === 'flat') {
    inkLine(38, 46, 62, 46, { w: 1, seed: sd + 63 });
  } else {
    ink([[34, 40], [50, 50], [66, 38]], { closed: false, w: 1, seed: sd + 63 });
  }
  // moustache
  const st = spec.stache === 'curl'
    ? [[30, 28], [50, 22], [70, 28], [86, 18], [84, 32], [68, 38], [50, 32], [34, 38], [20, 30], [18, 18]]
    : [[28, 26], [50, 20], [72, 26], [78, 44], [66, 36], [50, 32], [34, 36], [22, 44]];
  shape(st, '#2e2219', { w: 0.8, seed: sd + 65, curve: 0.3 });
  });
  if (e.sweat) layer(() => {
    const k = (e.sweat * 3) % 1;
    drop(-44, -10 + k * 40, 9, '#9fd3e8');
    drop(74, -40 + ((k + 0.5) % 1) * 40, 7, '#9fd3e8');
  });
}

// ---------------------------------------------------------------- tree (baked sprite)
const TREE_BASE = [540, 1700], TREE_HALF = 78; // trunk half-width near the cut, plate px
// Draw the tree with its trunk base at (x,y). fall = rotation (deg) of the part above the cut.
function drawTree(img, x, y, s, opts = {}) {
  const fall = opts.fall ?? 0, dirn = opts.fallDir ?? 1, cut = opts.cut ?? 1420;
  const ox = x - TREE_BASE[0] * s, oy = y - TREE_BASE[1] * s;
  const P = (p) => [ox + p[0] * s, oy + p[1] * s];
  const lx = mix(452, 478, (1655 - cut) / 675), rx = mix(628, 602, (1655 - cut) / 675);
  const stump = [[395, 1712], [452, 1655], [lx, cut], [rx, cut], [628, 1655], [695, 1712]].map(P);
  const top = [[lx, cut], [478, 980], [450, 860], [480, 850], [522, 930], [560, 930], [606, 850], [636, 860], [602, 980], [rx, cut]].map(P);
  const pivX = x + (dirn > 0 ? 70 : -70) * s, pivY = oy + cut * s;
  // paper-coloured knockout so the multiplied trunk is not see-through
  solid(stump, '#f2e6cc');
  push(); translate(pivX, pivY); rotate(fall * dirn); translate(-pivX, -pivY); solid(top, '#f2e6cc'); pop();
  nativeBegin();
  blendMode(MULTIPLY);
  image(img, ox, oy + cut * s, W * s, (H - cut) * s, 0, cut, W, H - cut);
  push();
  translate(pivX, pivY); rotate(fall * dirn); translate(-pivX, -pivY);
  image(img, ox, oy, W * s, cut * s, 0, 0, W, cut);
  pop();
  blendMode(BLEND);
  return { cutY: pivY };
}
// Where the axe head meets the target, for a person pose (world coords)
function axeContact(pos, phi, lean, axeScale = 1.25) {
  const hip = [0, -200];
  const T = (p) => { const q = rot(p, lean); return [hip[0] + q[0], hip[1] + q[1]]; };
  const shF = T([22, -168]), shB = T([-16, -172]);
  const mid = [(shF[0] + shB[0]) / 2, (shF[1] + shB[1]) / 2], d = dir(phi);
  const butt = add(mid, d, 128 - 46);
  const tip = rot([(200 + 2) * axeScale, 22 * axeScale], phi);
  const px = butt[0] + tip[0], py = butt[1] + tip[1];
  const face = pos.face ?? 1;
  return [pos.x + face * pos.s * px, pos.y + pos.s * py];
}
// Place a tree so the trunk edge meets the axe at the hit pose
function placeTree(pos, phiHit, leanHit, s) {
  const [cx, cy] = axeContact(pos, phiHit, leanHit);
  const face = pos.face ?? 1;
  const x = cx + face * (TREE_HALF - 14) * s, y = pos.y - 6;
  return { x, y, s, cut: TREE_BASE[1] - (y - cy) / s, contact: [cx, cy] };
}
// The chopped wedge in the trunk. depth 0..1
function drawNotch(x, y, s, depth, side = -1) {
  if (depth <= 0.01) return;
  const d = 150 * s * depth, edge = x + side * TREE_HALF * s;
  const pts = [[edge, y - d * 0.55], [edge - side * d, y], [edge, y + d * 0.22]];
  shape(pts, '#efcf9a', { w: 1, seed: 71, curve: 0.05, wob: 1 });
  paint([[edge, y - d * 0.55], [edge - side * d, y], [edge - side * d * 0.5, y - d * 0.1]], '#c99a5e', { alpha: 220, seed: 72 });
}
// Wood chips flying from a strike
function chips(x, y, t, seed, big = false) {
  const ps = particles(seed, big ? 9 : 4, t, { x, y, angMin: -170, angMax: -100, spMin: big ? 500 : 250, spMax: big ? 950 : 450, lifeMin: 0.35, lifeMax: 0.6, g: 2200 });
  for (const p of ps) {
    const r = big ? 15 : 8;
    shape(xf([[-r, -r * 0.5], [r, -r * 0.4], [r * 0.8, r * 0.5], [-r * 0.9, r * 0.4]], p.x, p.y, p.r[0] * 360 + p.k * 600), '#e6c48c', { w: 0.7, seed: 80 + Math.floor(p.r[1] * 9) });
  }
}
