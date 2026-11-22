#!/usr/bin/env python3
"""Art of Crystal Cascade (image model; sources in scripts/art-source/cascade):
  cascade-tiles.webp   4 x 2 atlas of square magic crystals (128 px), in the order of Cascade.shapes (+ one spare)
  cascade-chests.webp  4 x 1 atlas: Oak, Moon, Winged chest closed, and the open chest
  cascade-cover.webp   720 x 1080 lobby / mini-game cover
Hosting AVIF copies go to scripts/hosting-art.

    python3 scripts/build-cascade-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/cascade'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')

def trimmed(img):
    a = np.array(img.convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    im = Image.fromarray(a); return im.crop(im.getbbox())

def save(im, name, q=88):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=45)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)

# Tiles: 8 cells of the sheet, each trimmed to its gem and set on a square tile.
sheet = Image.open(SRC/'tiles.webp'); T = 128; cw, ch = sheet.width//4, sheet.height//2; atlas = Image.new('RGBA', (4*T, 2*T))
for n in range(8):
    g = trimmed(sheet.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch))).resize((T, T), Image.Resampling.LANCZOS)
    atlas.alpha_composite(g, ((n % 4)*T, (n//4)*T))
save(atlas, 'cascade-tiles')

# Chests: split the row by the empty columns between the four chests.
row = trimmed(Image.open(SRC/'chests.webp')); a = np.array(row)[..., 3].max(0) > 0; spans = []; start = None
for x, on in enumerate(list(a)+[False]):
    if on and start is None: start = x
    if not on and start is not None:
        if x-start > 20: spans.append((start, x))
        start = None
assert len(spans) == 4, spans
C = 192; atlas = Image.new('RGBA', (4*C, C))
for n, (x0, x1) in enumerate(spans):
    g = trimmed(row.crop((x0, 0, x1, row.height))); g.thumbnail((C-8, C-8), Image.Resampling.LANCZOS)
    atlas.alpha_composite(g, (n*C+(C-g.width)//2, C-g.height-4))
save(atlas, 'cascade-chests')

save(Image.open(SRC/'cover.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS), 'cascade-cover', 82)
# Jungle Trek mini-game cover (art-source/trek/cover.webp) is built the same way.
jt = Image.open("scripts/art-source/trek/cover.webp").convert("RGB").resize((960, 640), Image.Resampling.LANCZOS); save(jt, "cover-jungle", 80)
