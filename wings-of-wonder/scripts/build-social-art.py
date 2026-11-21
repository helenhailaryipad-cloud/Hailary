#!/usr/bin/env python3
"""Art of the Social room (citySocial): the Friends banner and eight small icons.

Sources: scripts/art-source/social/{banner,icons}.webp (image model). Output in src/assets/generated (+ AVIF copies in
scripts/hosting-art); the comp- prefix puts them into pack-comp.js in the chat preview:
  comp-social-banner.webp  900 x 600
  comp-social-icons.webp   4 x 2 atlas of 140 px tiles: flowers, heart, empty heart, letter, open letter with coin,
                           thank-you scroll, chat bubble, gift

    python3 scripts/build-social-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/social'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); TILE = 140
def save(im, name, q, aq):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)
save(Image.open(SRC/'banner.webp').convert('RGB').resize((900, 600), Image.Resampling.LANCZOS), 'comp-social-banner', 78, 40)
sheet = Image.open(SRC/'icons.webp').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//2; atlas = Image.new('RGBA', (4*TILE, 2*TILE))
for n in range(8):
    a = np.array(sheet.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch))); a[..., 3] = np.where(a[..., 3] < 70, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a); cut = cut.crop(cut.getbbox()); cut.thumbnail((TILE-6, TILE-6), Image.Resampling.LANCZOS)
    atlas.alpha_composite(cut, ((n % 4)*TILE+(TILE-cut.width)//2, (n//4)*TILE+(TILE-cut.height)//2))
save(atlas, 'comp-social-icons', 88, 55)
