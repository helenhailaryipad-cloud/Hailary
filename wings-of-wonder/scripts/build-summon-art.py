#!/usr/bin/env python3
"""Art of the Summon room (citySummon): two well backgrounds, the Mark Shop banner and six small icons.

Sources are paintings in scripts/art-source/summon. Output in src/assets/generated, with build-time AVIF copies in
scripts/hosting-art; the comp- prefix puts everything into pack-comp.js in the chat preview:
  comp-summon-oracle.webp  720 x 1080  Advanced Summon (the Star Oracle)
  comp-summon-glade.webp   720 x 1080  Basic Summon and the Festival
  comp-summon-stall.webp   900 x 600   Mark Shop banner
  comp-summon-icons.webp   3 x 2 atlas of 144 px tiles: Star Orb, Rare / Epic / Royal Mark, Festival token, level card

    python3 scripts/build-summon-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/summon'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); TILE = 144
for name, size in (('oracle', (720, 1080)), ('glade', (720, 1080)), ('stall', (900, 600))):
    im = Image.open(SRC/f'{name}.webp').convert('RGB').resize(size, Image.Resampling.LANCZOS)
    im.save(OUT/f'comp-summon-{name}.webp', quality=80, method=6); im.save(HOST/f'comp-summon-{name}.avif', quality=42)
    print(name, (OUT/f'comp-summon-{name}.webp').stat().st_size, (HOST/f'comp-summon-{name}.avif').stat().st_size)
sheet = Image.open(SRC/'icons.webp').convert('RGBA'); cw, ch = sheet.width//3, sheet.height//2; atlas = Image.new('RGBA', (3*TILE, 2*TILE))
for n in range(6):
    a = np.array(sheet.crop(((n % 3)*cw, (n//3)*ch, (n % 3+1)*cw, (n//3+1)*ch))); a[..., 3] = np.where(a[..., 3] < 70, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a); cut = cut.crop(cut.getbbox()); cut.thumbnail((TILE-6, TILE-6), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cut, ((n % 3)*TILE+(TILE-cut.width)//2, (n//3)*TILE+(TILE-cut.height)//2))
atlas.save(OUT/'comp-summon-icons.webp', quality=90, method=6); atlas.save(HOST/'comp-summon-icons.avif', quality=55); print('icons', atlas.size, (OUT/'comp-summon-icons.webp').stat().st_size)
