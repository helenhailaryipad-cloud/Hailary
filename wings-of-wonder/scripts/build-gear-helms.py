#!/usr/bin/env python3
"""Head-slot equipment art: eight helmets, one per art tier (the slot id stays `crown` for save compatibility).

The source sheet scripts/art-source/gear/helms.webp is 4 x 2 in tier order (Dewlight, Fernsilver, Moonveil, Tideglass,
Sunforge, Emberthorn, Starfall, Dawnfire). Cell edges are moved to the nearest empty column or row, so wings and
crests that reach over the nominal grid line are not clipped. Output: src/assets/generated/gear-crown-t<n>.webp
(192 px) and the build-time AVIF copy in scripts/hosting-art.

    python3 scripts/build-gear-helms.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/gear/helms.webp'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); SIZE = 192
a = np.array(Image.open(SRC).convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 60, 0, a[..., 3]); a[a[..., 3] == 0] = 0
h, w = a.shape[:2]

def gap(filled, near, reach):
    """Index of the empty line closest to `near` (within `reach`), or `near` itself when the shapes touch."""
    for d in range(reach):
        for i in (near-d, near+d):
            if 0 <= i < len(filled) and not filled[i]: return i
    return near

rows = [0, gap(a[..., 3].any(axis=1), h//2, h//8), h]
for n in range(8):
    top, bottom = rows[n//4], rows[n//4+1]; band = a[top:bottom]; filled = band[..., 3].any(axis=0); c = n % 4
    left = 0 if c == 0 else gap(filled, c*w//4, w//16); right = w if c == 3 else gap(filled, (c+1)*w//4, w//16)
    cut = Image.fromarray(band[:, left:right]); cut = cut.crop(cut.getbbox()); cut.thumbnail((SIZE-8, SIZE-8), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (SIZE, SIZE)); tile.alpha_composite(cut, ((SIZE-cut.width)//2, (SIZE-cut.height)//2))
    tile.save(OUT/f'gear-crown-t{n+1}.webp', quality=90, method=6); tile.save(HOST/f'gear-crown-t{n+1}.avif', quality=60)
    print(n+1, (left, right, top, bottom), cut.size, (OUT/f'gear-crown-t{n+1}.webp').stat().st_size, (HOST/f'gear-crown-t{n+1}.avif').stat().st_size)
