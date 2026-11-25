#!/usr/bin/env python3
"""Title plates (image model, scripts/art-source/titles/plate-<id>.png: ornate nameplates without text, one theme
each) -> one atlas src/assets/generated/title-plates.webp (4 x 5 cells of 400 x 150, order Titles.plateOrder in
src/titles.js) and its AVIF copy in scripts/hosting-art. The title name is written over the plate in CSS.

    python3 scripts/build-title-art.py
"""
from pathlib import Path
import re
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'scripts/art-source/titles'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
order = re.search(r"plateOrder: \[([^\]]+)\]", (ROOT/'src/titles.js').read_text()).group(1)
IDS = [x.strip().strip("'") for x in order.split(',')]
CW, CH = 400, 150
atlas = Image.new('RGBA', (CW*4, CH*5))
for i, k in enumerate(IDS):
    src = SRC/f'plate-{k}.webp'
    if not src.exists(): Image.open(SRC/f'plate-{k}.png').save(src, quality=92, method=6)
    im = Image.open(src).convert('RGBA'); a = np.array(im)
    a[a[..., 3] < 20] = 0; a[a[..., 3] == 0, :3] = 0
    im = Image.fromarray(a); im = im.crop(im.getbbox())
    im.thumbnail((CW - 6, CH - 6), Image.Resampling.LANCZOS)
    atlas.alpha_composite(im, ((i % 4)*CW + (CW - im.width)//2, (i//4)*CH + (CH - im.height)//2))
atlas.save(OUT/'title-plates.webp', quality=86, method=6)
atlas.save(HOST/'title-plates.avif', quality=34, speed=4)
print('title-plates', atlas.size, (OUT/'title-plates.webp').stat().st_size, (HOST/'title-plates.avif').stat().st_size)
