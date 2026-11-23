#!/usr/bin/env python3
"""Pet Siege art (image model): the valley map with five strongholds and the city hall with five pedestals.
Writes comp-siege-map and comp-siege-hall (768 x 1152) plus AVIF copies. City and pedestal positions are in
Siege.cities / Siege.spots (src/siege.js), as percentages of these pictures.

    python3 scripts/build-siege-art.py
"""
from pathlib import Path
from PIL import Image
SRC = Path('scripts/art-source/siege'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
for n in ('map', 'hall'):
    im = Image.open(SRC/f'{n}.webp').convert('RGB').resize((768, 1152), Image.Resampling.LANCZOS)
    im.save(OUT/f'comp-siege-{n}.webp', quality=82, method=6); im.save(HOST/f'comp-siege-{n}.avif', quality=34)
    print(n, (OUT/f'comp-siege-{n}.webp').stat().st_size, (HOST/f'comp-siege-{n}.avif').stat().st_size)
