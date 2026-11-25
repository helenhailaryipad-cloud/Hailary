#!/usr/bin/env python3
"""Art of Burrow Blitz (image model; sources in scripts/art-source/burrow):
  burrow-critters.webp  4 x 2 atlas (cells 256 x 288, feet on the bottom edge) in the order of Burrow.critters:
                        Acorn Vole, Berry Hamster, Sunbloom Hamster, Lucky Gemkit, Frost Imp, Icicle Bat, Hail Golem, Snow Wisp
  burrow-bg.webp        720 x 1080 meadow (field and lobby)
  burrow-hole.webp      one burrow, trimmed
  burrow-frost.webp     540 x 810 ice frame for the freeze
  burrow-cover.webp     960 x 640 mini-game cover (Reina from leaflight/master.png as the reference)
Hosting AVIF copies go to scripts/hosting-art.

    python3 scripts/build-burrow-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/burrow'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')

def trimmed(img):
    a = np.array(img.convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 20, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    im = Image.fromarray(a); return im.crop(im.getbbox())

def save(im, name, q=86, aq=36):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)

W, H = 256, 288; atlas = Image.new('RGBA', (4*W, 2*H))
for n in range(8):
    g = trimmed(Image.open(SRC/f'critter-{n+1}.webp')); g.thumbnail((W-12, H-6), Image.Resampling.LANCZOS)
    atlas.alpha_composite(g, ((n % 4)*W+(W-g.width)//2, (n//4)*H+H-g.height))
save(atlas, 'burrow-critters')
save(Image.open(SRC/'bg.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS), 'burrow-bg', 80, 32)
h = trimmed(Image.open(SRC/'hole.webp')); h.thumbnail((320, 320), Image.Resampling.LANCZOS); save(h, 'burrow-hole')
# Front lip (user: "they must come out of the pit itself, not the middle"): the rim below the opening's centre line,
# without the dark opening, drawn over the critter. The opening = the dark area joined to the centre.
from collections import deque
a = np.array(h).astype(int); hh, ww = a.shape[:2]; dark = a[..., :3].mean(2) < 75; seen = np.zeros((hh, ww), bool); q = deque([(hh//2, ww//2)]); seen[hh//2, ww//2] = True
while q:
    y, x = q.popleft()
    for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        Y, X = y+dy, x+dx
        if 0 <= Y < hh and 0 <= X < ww and dark[Y, X] and not seen[Y, X]: seen[Y, X] = True; q.append((Y, X))
ys, xs = np.nonzero(seen); print('opening x %.3f-%.3f y %.3f-%.3f' % (xs.min()/ww, xs.max()/ww, ys.min()/hh, ys.max()/hh))
rim = a.copy(); rim[seen] = 0; rim[:int((ys.min()+ys.max())/2), :] = 0
save(Image.fromarray(rim.astype('uint8'), 'RGBA'), 'burrow-rim')
save(Image.open(SRC/'frost.webp').convert('RGBA').resize((540, 810), Image.Resampling.LANCZOS), 'burrow-frost', 80, 32)
if (SRC/'cover.webp').exists(): save(Image.open(SRC/'cover.webp').convert('RGB').resize((960, 640), Image.Resampling.LANCZOS), 'burrow-cover', 80, 32)
# Hit sparks: the cascade-fx sheet (painted on black for additive drawing) with its brightness turned into alpha, so
# the DOM pop-ups need no blend mode (blend modes do not reach through the field's stacking context).
fx = np.array(Image.open('src/assets/generated/cascade-fx.webp').convert('RGB').resize((384, 384), Image.Resampling.LANCZOS)).astype(float)
al = fx.max(2); rgb = np.where(al[..., None] > 0, fx / np.maximum(al[..., None], 1) * 255, 0)
save(Image.fromarray(np.dstack([rgb, al]).clip(0, 255).astype('uint8'), 'RGBA'), 'burrow-fx', 82, 40)
