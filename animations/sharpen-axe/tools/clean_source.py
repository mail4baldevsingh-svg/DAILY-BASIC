"""Remove the Instagram watermark (icon + @handle) from the split-layout source frames,
and replace the Instagram logo outro at the end with a slow push-in on the last shot.

    python tools/clean_source.py <raw-frames-dir> <out-dir> [--report]

The watermark sits either top-right (handle right-aligned under the icon) or lower-left
(handle left-aligned), switching every few seconds. Each frame is assigned a placement by
matching the icon's edges (so its magenta and faded variants count too); padded boxes around
the icon and handle are then rebuilt with texture-aware inpainting (FSR, opencv-contrib).
"""
import glob
import os
import sys
from multiprocessing import Pool

import cv2
import numpy as np

SRC, DST = sys.argv[1], sys.argv[2]
REPORT = '--report' in sys.argv
os.makedirs(DST, exist_ok=True)

ICON = (748, 85, 48, 47)              # icon box at the top-right spot, panel pixels
TEXT_W, TEXT_H, TEXT_DY = 226, 22, 79  # handle text under the icon
CANON = {'tr': (748, 85), 'll': (69, 540)}
REGIONS = {'tr': (690, 30, 180, 170), 'll': (10, 470, 180, 190)}
STRONG = 0.5


def load(i):
    return cv2.imread(os.path.join(SRC, f'v_{i:05d}.jpg'))


def edges(gray):
    g = cv2.GaussianBlur(gray, (3, 3), 0)
    return cv2.magnitude(cv2.Sobel(g, cv2.CV_32F, 1, 0), cv2.Sobel(g, cv2.CV_32F, 0, 1))


n = len(glob.glob(os.path.join(SRC, 'v_*.jpg')))
x, y, w, h = ICON
pad = 4
tmpl = edges(cv2.cvtColor(load(180), cv2.COLOR_BGR2GRAY))[y - pad:y + h + pad, x - pad:x + w + pad]


def find_icon(img):
    e = edges(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY))
    best = (-1, None, None)
    for name, (rx, ry, rw, rh) in REGIONS.items():
        _, score, _, loc = cv2.minMaxLoc(cv2.matchTemplate(e[ry:ry + rh, rx:rx + rw], tmpl, cv2.TM_CCOEFF_NORMED))
        if score > best[0]:
            best = (score, name, (rx + loc[0] + pad, ry + loc[1] + pad))
    return best


def canonical(det):
    score, name, loc = det
    cx, cy = CANON[name]
    return name if score >= STRONG and abs(loc[0] - cx) <= 4 and abs(loc[1] - cy) <= 4 else None


hits = [canonical(find_icon(load(i))) for i in range(n)]
placements = []
for i in range(n):
    if hits[i]:
        placements.append({hits[i]})
        continue
    prev = next((hits[j] for j in range(i - 1, -1, -1) if hits[j]), None)
    nxt = next((hits[j] for j in range(i + 1, n) if hits[j]), None)
    placements.append({p for p in (prev, nxt) if p})

# Outro: the source ends on a black Instagram logo card
lum = [cv2.cvtColor(load(i), cv2.COLOR_BGR2GRAY).mean() for i in range(n)]
outro = next((i for i in range(n // 2, n) if all(l < 12 for l in lum[i:i + 6])), n)

if REPORT:
    runs, cur = [], None
    for i in range(n):
        key = tuple(sorted(placements[i])) + (('match',) if hits[i] else ())
        if cur is None or key != cur[0]:
            cur = [key, i, i]; runs.append(cur)
        else:
            cur[2] = i
    for key, a, b in runs:
        print(f'{a:5d}-{b:5d}  {key}')
    print('outro starts at frame', outro)
    sys.exit(0)


def rects(name):
    """Padded boxes around the icon and the handle (video compression smears the
    magenta icon's colour a few pixels past its edge)."""
    ix, iy = CANON[name]
    tx = ix + w - TEXT_W if name == 'tr' else ix - 2
    return [(ix - 9, iy - 9, w + 18, h + 18), (tx - 6, iy + TEXT_DY - 6, TEXT_W + 14, TEXT_H + 12)]


def clean(i):
    img = load(i)
    if placements[i]:
        known = np.full(img.shape[:2], 255, np.uint8)
        for name in placements[i]:
            for bx, by, bw, bh in rects(name):
                known[by:by + bh, bx:bx + bw] = 0
        out = img.copy()
        cv2.xphoto.inpaint(img, known, out, cv2.xphoto.INPAINT_FSR_FAST)
        img = out
    cv2.imwrite(os.path.join(DST, f'v_{i:05d}.jpg'), img, [cv2.IMWRITE_JPEG_QUALITY, 92])


with Pool(os.cpu_count()) as pool:
    pool.map(clean, range(outro))

# Replace the logo card with a slow push-in on the last clean frame
last = cv2.imread(os.path.join(DST, f'v_{outro - 1:05d}.jpg'))
H, W = last.shape[:2]
for k, i in enumerate(range(outro, n)):
    z = 1 + 0.05 * (k + 1) / (n - outro)
    cw, ch = int(W / z), int(H / z)
    x0, y0 = (W - cw) // 2, int((H - ch) * 0.35)
    frame = cv2.resize(last[y0:y0 + ch, x0:x0 + cw], (W, H), interpolation=cv2.INTER_CUBIC)
    cv2.imwrite(os.path.join(DST, f'v_{i:05d}.jpg'), frame, [cv2.IMWRITE_JPEG_QUALITY, 92])

print(f'inpainted frames 0-{outro - 1}, replaced outro from frame {outro} ({n - outro} frames)')
