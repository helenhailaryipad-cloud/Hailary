#!/usr/bin/env python3
"""Home-screen profile plate (image model, logo-v2 as the style reference: round portrait ring, nameplate band, level
medallion, no text) scripts/art-source/ui/profile-plate.webp -> src/assets/generated/hud-profile.webp (+ AVIF).
Prints the portrait hole, the enamel band and the medallion as % of the plate, used by `.city-status` in stage.css.

    python3 scripts/build-profile-plate.py
"""
from pathlib import Path
import numpy as np
from PIL import Image
from collections import deque

def label(mask):
    lab = np.zeros(mask.shape, int); n = 0; H, W = mask.shape
    for y0, x0 in zip(*np.nonzero(mask)):
        if lab[y0, x0]: continue
        n += 1; lab[y0, x0] = n; q = deque([(y0, x0)])
        while q:
            y, x = q.popleft()
            for yy, xx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; q.append((yy, xx))
    return lab, n

ROOT = Path(__file__).resolve().parents[1]
im = Image.open(ROOT/'scripts/art-source/ui/profile-plate.webp').convert('RGBA'); a = np.array(im)
a[a[..., 3] < 20] = 0; a[a[..., 3] == 0, :3] = 0
im = Image.fromarray(a); im = im.crop(im.getbbox()); W = 1024; im = im.resize((W, round(im.height*W/im.width)), Image.Resampling.LANCZOS)
im.save(ROOT/'src/assets/generated/hud-profile.webp', quality=95, method=6)
im.save(ROOT/'scripts/hosting-art/hud-profile.avif', quality=60, speed=4)
a = np.array(im).astype(int); h, w = a.shape[:2]; pct = lambda x, y: (round(100*x/w, 1), round(100*y/h, 1))
# portrait hole: transparent pixels not connected to the border
lab, n = label(a[..., 3] < 40); border = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
holes = [(lab == i).sum() for i in range(1, n+1)]; big = max((i for i in range(1, n+1) if i not in border), key=lambda i: holes[i-1])
ys, xs = np.nonzero(lab == big); print('hole centre', pct(xs.mean(), ys.mean()), 'diameter % of h', round(100*(ys.max()-ys.min())/h, 1), 'of w', round(100*(xs.max()-xs.min())/w, 1))
# blue enamel: blue-dominant opaque pixels
blue = (a[..., 2] > a[..., 0] + 30) & (a[..., 2] > a[..., 1] + 10) & (a[..., 3] > 200)
lab2, n2 = label(blue); sizes = np.array([(lab2 == i).sum() for i in range(1, n2+1)]); order = np.argsort(sizes)[::-1]
for i in order[:2]:
    ys, xs = np.nonzero(lab2 == i+1); print('blue', pct(xs.min(), ys.min()), pct(xs.max(), ys.max()), 'centre', pct(xs.mean(), ys.mean()))
print('size', im.size, (ROOT/'src/assets/generated/hud-profile.webp').stat().st_size, (ROOT/'scripts/hosting-art/hud-profile.avif').stat().st_size)
