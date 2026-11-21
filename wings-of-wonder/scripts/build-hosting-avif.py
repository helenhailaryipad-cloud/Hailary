#!/usr/bin/env python3
"""Build-time AVIF copies (scripts/hosting-art) of large pictures that had none, so the hosted bundle stays under its
size limit. The game keeps loading the .webp URLs; scripts/build.mjs swaps in the AVIF bytes by file name.

    python3 scripts/build-hosting-avif.py
"""
from pathlib import Path
from PIL import Image

HOST = Path('scripts/hosting-art')
FILES = ['src/assets/generated/comp-pet-talents.webp', 'src/assets/generated/comp-bag-items.webp', 'src/assets/generated/comp-pet-gear.webp',
         'src/assets/generated/comp-bag-maw.webp', 'src/assets/generated/comp-pet-misc.webp']
saved = 0
for name in FILES:
    src = Path(name); out = HOST/(src.stem+'.avif'); Image.open(src).save(out, quality=55)
    saved += src.stat().st_size-out.stat().st_size; print(src.name, src.stat().st_size, '->', out.stat().st_size)
print('saved', saved)
