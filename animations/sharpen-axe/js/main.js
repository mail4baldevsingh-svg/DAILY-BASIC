// Frame driver. The renderer calls window.renderFrame(i) for each output frame.

const IMG = {};
let CNV, GRAIN, OUT, OCTX;
let LABELS = [];
let CAM = { x: W / 2, y: H / 2, z: 1, r: 0, sx: 0, sy: 0 };

async function setup() {
  CNV = createCanvas(W, H, WEBGL);
  pixelDensity(1);
  setAttributes('preserveDrawingBuffer', true);
  angleMode(DEGREES);
  brush.scaleBrushes(4.5);
  noLoop();
  for (const n of ['forest', 'tree', 'office', 'night', 'warm', 'workshop', 'graph']) IMG[n] = await loadImage(`assets/plates/${n}.png`);
  GRAIN = makeGrain();
  OUT = document.createElement('canvas'); OUT.width = W; OUT.height = H;
  OCTX = OUT.getContext('2d');
  await Promise.all([document.fonts.load(`100px ${FONT_BIG}`), document.fonts.load(`100px ${FONT_HAND}`)]);
  window.READY = true;
}

const sceneAt = (t) => SCENES.find((s) => t >= s.t0 && t < s.t1) ?? SCENES[SCENES.length - 1];

function draw() {
  const t = window.T ?? 0;
  SEED = boilIndex(t);
  LABELS = [];
  brushDirty = false;
  brush.noFill();
  background(PAPER);
  const sc = sceneAt(t), S = SCENE_FNS[sc.id], lt = t - sc.t0;
  CAM = { x: W / 2, y: H / 2, z: 1, r: 0, sx: 0, sy: 0, ...(S.cam ? S.cam(t, lt) : {}) };
  push();
  translate(-W / 2, -H / 2);
  push();
  translate(W / 2 + CAM.sx, PANEL_CY + CAM.sy);
  rotate(CAM.r);
  scale(CAM.z);
  translate(-CAM.x, -CAM.y);
  S.draw(t, lt);
  pop();
  if (S.screen) S.screen(t, lt);
  drawCutFlash(t);
  pop();
  flushInk();
}

// A two-frame paper flash on scene cuts keeps hard cuts punchy.
function drawCutFlash(t) {
  for (const s of SCENES) {
    if (s.t0 <= 0 || s.noFlash) continue;
    const d = t - s.t0;
    if (d >= 0 && d < 0.09) { nativeBegin(); noStroke(); fill(255, 250, 235, 200 * (1 - d / 0.09)); rect(0, 0, W, H); }
  }
}

window.renderFrame = async (i, quality = 0.92) => {
  const t = i / FPS;
  window.T = t;
  await redraw();
  OCTX.globalCompositeOperation = 'source-over';
  OCTX.filter = 'saturate(1.3) contrast(1.06)';
  OCTX.drawImage(CNV.elt, 0, 0, W, H);
  OCTX.filter = 'none';
  OCTX.globalCompositeOperation = 'multiply';
  OCTX.drawImage(GRAIN, 0, 0);
  OCTX.globalCompositeOperation = 'source-over';
  SEED = boilIndex(t);
  drawLabels(OCTX, CAM);
  if (SPLIT) {
    drawVideoPanel(OCTX, await loadVideoFrame(i));
    drawSeam(OCTX);
  }
  const S = SCENE_FNS[sceneAt(t).id];
  if (S.overlay) S.overlay(OCTX, t, t - sceneAt(t).t0);
  drawHeadline(OCTX, t);
  drawCaptions(OCTX, t);
  return OUT.toDataURL('image/jpeg', quality);
};
window.renderTime = (t, q) => window.renderFrame(Math.round(t * FPS), q);

// Original video frames (pre-cropped to the panel by ffmpeg, see README)
function loadVideoFrame(i) {
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => resolve(null);
    im.src = `source-frames/v_${String(i).padStart(5, '0')}.jpg`;
  });
}
