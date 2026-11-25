#!/usr/bin/env python3
"""Art of the Wishwell (image model; sources in scripts/art-source/wishwell):
  wishwell-bg.webp    720 x 1080 glade with the wishing well, the floating bubble (centre at 54 % / 26 % of the picture)
                      and the Wishwell mascot (an arctic fox courier)
  wishwell-coin.webp  128 px Wish Coin
Hosting AVIF copies go to scripts/hosting-art.

    python3 scripts/build-wishwell-art.py
"""
from pathlib import Path
from PIL import Image

SRC = Path('scripts/art-source/wishwell'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
def save(im, name, q=82, aq=32):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)
save(Image.open(SRC/'bg.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS), 'wishwell-bg')
c = Image.open(SRC/'coin.webp').convert('RGBA'); c = c.crop(c.getbbox()); c.thumbnail((128, 128), Image.Resampling.LANCZOS); save(c, 'wishwell-coin', 88, 50)
