#!/usr/bin/env python3
"""Icons of the Bag: the sixteen stackable items and the Glimmer Maw of the Devour room.

Sources are paintings in scripts/art-source/bag. items.webp is a 4 x 4 sheet in the order of bagItems (gear-data.js);
each icon is cut from its cell, trimmed and set on a 160 px tile of the atlas comp-bag-items.webp. The Maw becomes
comp-bag-maw.webp (480 px). The comp- prefix puts both into pack-comp.js in the chat preview (no extra files).

    python3 scripts/build-bag-icons.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/bag'); OUT = Path('src/assets/generated'); TILE = 160

def clean(image, floor=40):
    a = np.array(image.convert('RGBA')); a[..., 3] = np.where(a[..., 3] < floor, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a); return cut.crop(cut.getbbox())

sheet = Image.open(SRC/'items.webp').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//4
atlas = Image.new('RGBA', (4*TILE, 4*TILE))
for n in range(16):
    cut = clean(sheet.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch))); cut.thumbnail((TILE-8, TILE-8), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cut, ((n % 4)*TILE+(TILE-cut.width)//2, (n//4)*TILE+(TILE-cut.height)//2))
atlas.save(OUT/'comp-bag-items.webp', quality=90, method=6); print('comp-bag-items', atlas.size, (OUT/'comp-bag-items.webp').stat().st_size)
maw = clean(Image.open(SRC/'maw.webp'), 60); maw.thumbnail((480, 480), Image.Resampling.LANCZOS)
maw.save(OUT/'comp-bag-maw.webp', quality=88, method=6); print('comp-bag-maw', maw.size, (OUT/'comp-bag-maw.webp').stat().st_size)
