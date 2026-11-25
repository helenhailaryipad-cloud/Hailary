#!/usr/bin/env python3
"""Art of the Social room (citySocial): the Friends banner and eight small icons.

Sources: scripts/art-source/social/{banner,icons}.webp (image model). Output in src/assets/generated (+ AVIF copies in
scripts/hosting-art); the comp- prefix puts them into pack-comp.js in the chat preview:
  comp-social-banner.webp  900 x 600
  comp-social-icons.webp   4 x 3 atlas of 160 px tiles (see below)

    python3 scripts/build-social-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np
from collections import deque
def label(m):
    lab = np.zeros(m.shape, int); sizes = []; h, w = m.shape
    for y0, x0 in zip(*np.nonzero(m)):
        if lab[y0, x0]: continue
        sizes.append(0); k = len(sizes); lab[y0, x0] = k; q = deque([(y0, x0)])
        while q:
            y, x = q.popleft(); sizes[-1] += 1
            for Y, X in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                if 0 <= Y < h and 0 <= X < w and m[Y, X] and not lab[Y, X]: lab[Y, X] = k; q.append((Y, X))
    return lab, sizes

SRC = Path('scripts/art-source/social'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); TILE = 140
def save(im, name, q, aq):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)
save(Image.open(SRC/'banner.webp').convert('RGB').resize((900, 600), Image.Resampling.LANCZOS), 'comp-social-banner', 78, 40)
# Icons: one painting per icon (icon-0..8.webp; user: "polish them, nothing cut off"), each trimmed to its own alpha
# and fitted into a 160 px tile with a margin, 4 x 3 atlas: flowers, heart, empty heart, letter, open letter with coin,
# thank-you scroll, chat bubble, gift, friends ledger (Management). The old 4 x 2 sheet icons.webp is no longer used.
TILE = 160; atlas = Image.new('RGBA', (4*TILE, 3*TILE))
for n in range(9):
    a = np.array(Image.open(SRC/f'icon-{n}.webp').convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a); cut = cut.crop(cut.getbbox()); cut.thumbnail((TILE-14, TILE-14), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cut, ((n % 4)*TILE+(TILE-cut.width)//2, (n//4)*TILE+(TILE-cut.height)//2))
save(atlas, 'comp-social-icons', 88, 55)
