#!/usr/bin/env python3
"""Splash Party art (image model): the beach-party lobby (scripts/art-source/party/bg.webp) and a 2 x 2 sheet of the
four event items in the order of Party.itemIds (fire, cake, wand, potion). Writes comp-party-bg and comp-party-items
(256 px tiles, each icon trimmed and centred), plus AVIF copies for hosting.

    python3 scripts/build-party-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/party'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
bg = Image.open(SRC/'bg.webp').convert('RGB').resize((768, 1152), Image.Resampling.LANCZOS)
bg.save(OUT/'comp-party-bg.webp', quality=84, method=6); bg.save(HOST/'comp-party-bg.avif', quality=34)
sheet = Image.open(SRC/'items.webp').convert('RGBA'); cw, ch = sheet.width//2, sheet.height//2; T = 256
atlas = Image.new('RGBA', (2*T, 2*T))
for n in range(4):
    c = sheet.crop(((n % 2)*cw, (n//2)*ch, (n % 2+1)*cw, (n//2+1)*ch)); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a)
    c = c.crop(c.getbbox()); c.thumbnail((T-20, T-20), Image.Resampling.LANCZOS)
    atlas.alpha_composite(c, ((n % 2)*T+(T-c.width)//2, (n//2)*T+(T-c.height)//2))
atlas.save(OUT/'comp-party-items.webp', quality=88, method=6); atlas.save(HOST/'comp-party-items.avif', quality=40)
for f in ['comp-party-bg', 'comp-party-items']: print(f, (OUT/(f+'.webp')).stat().st_size, (HOST/(f+'.avif')).stat().st_size)
