#!/usr/bin/env python3
"""Art of Star Talents (image model; sources in scripts/art-source/talents):
  talent-icons.webp      7 x 6 atlas of round icons (128 px), in the order of Talents.list (src/talents.js);
                         cut from three 4 x 4 sheets icons1..3 (cells in reading order, the last six unused)
  talent-sky-<branch>.webp  720 x 1080 starry constellation backgrounds: off Falcon, def Turtle, uni World Tree, mas Dragon
Hosting AVIF copies go to scripts/hosting-art.

    python3 scripts/build-talent-art.py
"""
from pathlib import Path
from PIL import Image, ImageDraw
import numpy as np

SRC = Path('scripts/art-source/talents'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
def save(im, name, q=84, aq=34):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)

T = 128; cells = []
for sheet in ('icons1', 'icons2', 'icons3'):
    sh = Image.open(SRC/f'{sheet}.webp').convert('RGB'); cw, ch = sh.width//4, sh.height//4
    for n in range(16):
        c = sh.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch)); a = np.array(c).astype(int).sum(2) > 90
        ys, xs = np.nonzero(a); cx, cy = (xs.min()+xs.max())/2, (ys.min()+ys.max())/2; r = max(xs.max()-xs.min(), ys.max()-ys.min())/2
        icon = c.crop((int(cx-r), int(cy-r), int(cx+r), int(cy+r))).resize((T, T), Image.Resampling.LANCZOS).convert('RGBA')
        m = Image.new('L', (T*4, T*4), 0); ImageDraw.Draw(m).ellipse((6, 6, T*4-6, T*4-6), fill=255); icon.putalpha(m.resize((T, T), Image.Resampling.LANCZOS))
        cells.append(icon)
atlas = Image.new('RGBA', (7*T, 6*T))
for n in range(42): atlas.alpha_composite(cells[n], ((n % 7)*T, (n//7)*T))
save(atlas, 'talent-icons', 86, 40)
for b in ('off', 'def', 'uni', 'mas'):
    save(Image.open(SRC/f'{b}.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS), f'talent-sky-{b}', 78, 30)
