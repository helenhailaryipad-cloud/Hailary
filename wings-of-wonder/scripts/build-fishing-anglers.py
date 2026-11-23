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
def grow(seed, m):  # the opaque region joined to the seed (8-neighbours)
    r = seed.copy()
    while True:
        d = r.copy(); d[1:] |= r[:-1]; d[:-1] |= r[1:]; d[:, 1:] |= r[:, :-1]; d[:, :-1] |= r[:, 1:]
        d[1:, 1:] |= r[:-1, :-1]; d[:-1, :-1] |= r[1:, 1:]; d[1:, :-1] |= r[:-1, 1:]; d[:-1, 1:] |= r[1:, :-1]; d &= m
        if d.sum() == r.sum(): return r
        r = d
# Each angler is the region joined to a point in the middle of its third: the figures overlap the thirds, so a plain
# crop carried slivers of the neighbour (user circled them).
sheet = Image.open(SRC/'folk.png').convert('RGBA'); w = sheet.width//3; A = np.array(sheet); m = A[..., 3] > 24
for n in range(3):
    cx = n*w + w//2; ys = np.nonzero(m[:, cx])[0]; seed = np.zeros_like(m); seed[ys[len(ys)*2//3], cx] = True
    B = A.copy(); B[~grow(seed, m)] = 0; save(f'comp-fish-folk-{n+1}', trim(Image.fromarray(B)), 300)

# The lake surface under the lagoon (image model): shoreline cut off, top edge left opaque (the page fades it).
w = Image.open(SRC/'water.png').convert('RGB'); w = w.crop((0, round(w.height*.05), w.width, w.height)).resize((1200, 760), Image.Resampling.LANCZOS)
w.save(OUT/'comp-fish-water.webp', quality=80, method=6); w.save(HOST/'comp-fish-water.avif', quality=36); print('comp-fish-water', (OUT/'comp-fish-water.webp').stat().st_size)
# Tackle shop icons (image model): 2 x 1 sheet, worms | feed -> comp-fish-tackle (2 x 1 atlas of 256 px tiles).
import numpy as np
sh = Image.open(SRC/'tackle.png').convert('RGBA'); hw = sh.width//2; at = Image.new('RGBA', (512, 256))
for n in range(2):
    c = sh.crop((n*hw, 0, (n+1)*hw, sh.height)); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox()); c.thumbnail((236, 236), Image.Resampling.LANCZOS)
    at.alpha_composite(c, (n*256+(256-c.width)//2, (256-c.height)//2))
at.save(OUT/'comp-fish-tackle.webp', quality=88, method=6); at.save(HOST/'comp-fish-tackle.avif', quality=40); print('comp-fish-tackle', (OUT/'comp-fish-tackle.webp').stat().st_size)
