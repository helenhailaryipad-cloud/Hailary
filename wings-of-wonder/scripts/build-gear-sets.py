#!/usr/bin/env python3
"""Equipment art: every slot is ONE design in eight tier colourways (user 2026-11-21: sets of all tiers should look
alike and differ a little and by colour, as in the reference game).

Sources: scripts/art-source/gear/<slot>.webp, a 4 x 2 sheet in tier order (ivory-green, silver-emerald, silver-indigo,
pearl-violet, gold-white, bronze-crimson, midnight-silver, crimson-rose gold). Cell edges are moved to the nearest
empty column or row so parts that reach over the nominal grid line are not clipped. All eight pieces of a slot are
scaled by the SAME factor, so the tiers keep one size. Output: src/assets/generated/gear-<slot>-t<n>.webp (192 px) and
the build-time AVIF copy in scripts/hosting-art.

    python3 scripts/build-gear-sets.py [slot ...]
"""
import sys
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/gear'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); SIZE = 192
SLOTS = ['bow', 'crown', 'armor', 'leggings', 'boots', 'bracers', 'necklace', 'amulet', 'spiritguard', 'spiritluck']

def gap(filled, near, reach):
    """Index of the empty line closest to `near` (within `reach`), or `near` itself when the shapes touch."""
    for d in range(reach):
        for i in (near-d, near+d):
            if 0 <= i < len(filled) and not filled[i]: return i
    return near

def build(slot):
    a = np.array(Image.open(SRC/f'{slot}.webp').convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 60, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    h, w = a.shape[:2]; rows = [0, gap(a[..., 3].any(axis=1), h//2, h//8), h]; cuts = []
    for n in range(8):
        band = a[rows[n//4]:rows[n//4+1]]; filled = band[..., 3].any(axis=0); c = n % 4
        left = 0 if c == 0 else gap(filled, c*w//4, w//16); right = w if c == 3 else gap(filled, (c+1)*w//4, w//16)
        cut = Image.fromarray(band[:, left:right]); cuts.append(cut.crop(cut.getbbox()))
    scale = (SIZE-8)/max(max(c.size) for c in cuts)
    for n, cut in enumerate(cuts):
        cut = cut.resize((max(1, round(cut.width*scale)), max(1, round(cut.height*scale))), Image.Resampling.LANCZOS)
        tile = Image.new('RGBA', (SIZE, SIZE)); tile.alpha_composite(cut, ((SIZE-cut.width)//2, (SIZE-cut.height)//2))
        tile.save(OUT/f'gear-{slot}-t{n+1}.webp', quality=90, method=6); tile.save(HOST/f'gear-{slot}-t{n+1}.avif', quality=60)
    print(slot, [c.size for c in cuts])

for slot in sys.argv[1:] or SLOTS: build(slot)
