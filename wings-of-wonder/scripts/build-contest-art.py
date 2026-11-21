#!/usr/bin/env python3
"""Art of the Sky Contest (cityContest): the Totem War key art, its battlefield and eight small pictures.

Sources are paintings in scripts/art-source/contest. Output in src/assets/generated (+ AVIF copies in
scripts/hosting-art); the comp- prefix puts everything into pack-comp.js in the chat preview:
  comp-war-key.webp    720 x 1080  lobby picture (three champions)
  comp-war-field.webp  720 x 864   battlefield: rows 8%..88% of the painting. The three daises sit at
                                   (18,26) (82,26) (50,70) percent, which is warTotems in gear-data.js
  comp-war-icons.webp  4 x 2 atlas of 160 px tiles: Ember / Tide / Gale totem, contest medal,
                                   Ember / Tide / Gale emblem, crown

    python3 scripts/build-contest-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/contest'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); TILE = 160
def save(im, name, q, aq):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)
save(Image.open(SRC/'key.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS), 'comp-war-key', 80, 42)
field = Image.open(SRC/'field.webp').convert('RGB'); h = field.height
save(field.crop((0, round(h*.08), field.width, round(h*.88))).resize((720, 864), Image.Resampling.LANCZOS), 'comp-war-field', 80, 42)
sheet = Image.open(SRC/'sheet.webp').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//2; atlas = Image.new('RGBA', (4*TILE, 2*TILE))
for n in range(8):
    a = np.array(sheet.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch))); a[..., 3] = np.where(a[..., 3] < 70, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a); cut = cut.crop(cut.getbbox()); cut.thumbnail((TILE-6, TILE-6), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cut, ((n % 4)*TILE+(TILE-cut.width)//2, (n//4)*TILE+(TILE-cut.height)//2))
save(atlas, 'comp-war-icons', 90, 55)
