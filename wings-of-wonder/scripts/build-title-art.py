#!/usr/bin/env python3
"""Title emblems (image model with src/assets/generated/logo-v2.webp as the style reference:
scripts/art-source/titles/mark-<id>.webp, painted wordmarks with the title's name and themed decoration) -> one atlas
src/assets/generated/title-marks.webp (4 columns x Titles.markRows rows, cells 360 x 216, order Titles.markOrder in
src/titles.js) and its AVIF copy in scripts/hosting-art.

    python3 scripts/build-title-art.py
"""
from pathlib import Path
import re
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'scripts/art-source/titles'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
js = (ROOT/'src/titles.js').read_text()
IDS = [x.strip().strip("'") for x in re.search(r"markOrder: \[([^\]]+)\]", js).group(1).split(',')]
ROWS = int(re.search(r"markRows: (\d+)", js).group(1))
CW, CH = 360, 216
atlas = Image.new('RGBA', (CW*4, CH*ROWS))
for i, k in enumerate(IDS):
    im = Image.open(SRC/f'mark-{k}.webp').convert('RGBA'); a = np.array(im)
    a[a[..., 3] < 20] = 0; a[a[..., 3] == 0, :3] = 0
    im = Image.fromarray(a); im = im.crop(im.getbbox())
    im.thumbnail((CW - 8, CH - 8), Image.Resampling.LANCZOS)
    atlas.alpha_composite(im, ((i % 4)*CW + (CW - im.width)//2, (i//4)*CH + (CH - im.height)//2))
atlas.save(OUT/'title-marks.webp', quality=84, method=4)
atlas.save(HOST/'title-marks.avif', quality=26, speed=6)
print('title-marks', atlas.size, (OUT/'title-marks.webp').stat().st_size, (HOST/'title-marks.avif').stat().st_size)
