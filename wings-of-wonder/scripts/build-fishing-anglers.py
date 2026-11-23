#!/usr/bin/env python3
"""Fishing anglers (image model): Reina on the pier (edit of leaflight/master.png) and a 3 x 1 sheet of three AI
anglers. Writes comp-fish-reina and comp-fish-folk-1..3 (trimmed), and prints each rod tip as fractions of the image
(the fishing page draws the line from there to the float).

    python3 scripts/build-fishing-anglers.py
"""
from pathlib import Path
from PIL import Image
import numpy as np
SRC = Path('scripts/art-source/fishing'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
def trim(im):
    a = np.array(im.convert('RGBA')); a[a[..., 3] < 24] = 0; im = Image.fromarray(a); return im.crop(im.getbbox())
def tip(im):  # rightmost opaque pixel in the top fifth = the rod tip
    a = np.array(im)[..., 3] > 100; h = a.shape[0]; ys, xs = np.nonzero(a[:max(4, h//5)])
    i = xs.argmax(); return round(xs[i]/im.width, 3), round(ys[i]/im.height, 3)
def save(name, im, h):
    im = im.resize((round(im.width*h/im.height), h), Image.Resampling.LANCZOS)
    im.save(OUT/(name+'.webp'), quality=88, method=6); im.save(HOST/(name+'.avif'), quality=40); print(name, im.size, tip(im))
save('comp-fish-reina', trim(Image.open(SRC/'reina.png')), 520)
sheet = Image.open(SRC/'folk.png').convert('RGBA'); w = sheet.width//3
for n in range(3): save(f'comp-fish-folk-{n+1}', trim(sheet.crop((n*w, 0, (n+1)*w, sheet.height))), 300)
