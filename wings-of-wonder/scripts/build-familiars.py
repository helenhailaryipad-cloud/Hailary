#!/usr/bin/env python3
"""Familiars (pets d4-d53): sharp art from the high-resolution repaints.

The 50 familiars were 512 px paintings and looked soft on the Pets stage. They were repainted at 1024 px by the image
model from the old paintings (same designs); the sources are scripts/art-source/familiars/familiar-<n>.webp.
This trims each one, centres it on a square with a small margin and writes src/assets/generated/familiar-<n>.webp
(720 px) plus the smaller AVIF copy the hosted bundle embeds (scripts/hosting-art).

    python3 scripts/build-familiars.py            # all
    python3 scripts/build-familiars.py 4 12       # some
"""
import sys
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/familiars'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
SIZE, MARGIN = 720, .03

def build(n):
    a = np.array(Image.open(SRC/f'familiar-{n}.webp').convert('RGBA'))
    a[..., 3] = np.where(a[..., 3] < 20, 0, a[..., 3]); a[a[..., 3] == 0] = 0          # no stray haze, no hidden colour
    im = Image.fromarray(a); im = im.crop(im.getbbox())
    side = round(max(im.size)*(1+2*MARGIN)); square = Image.new('RGBA', (side, side))
    square.alpha_composite(im, ((side-im.width)//2, (side-im.height)//2))
    square = square.resize((SIZE, SIZE), Image.Resampling.LANCZOS)
    square.save(OUT/f'familiar-{n}.webp', quality=88, method=6); square.save(HOST/f'familiar-{n}.avif', quality=44, speed=4)

for n in [int(x) for x in sys.argv[1:]] or range(4, 54):
    build(n); print('familiar', n)
