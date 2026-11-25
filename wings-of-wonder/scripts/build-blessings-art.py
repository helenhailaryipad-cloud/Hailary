#!/usr/bin/env python3
"""Art of Daily Blessings (image model; source scripts/art-source/blessings/banner.webp: cliff garden, blank signboard
centred at about 37 % / 42 %, original baby-owl mascot) -> blessings-banner.webp 900 x 600 (+ AVIF copy).

    python3 scripts/build-blessings-art.py
"""
from pathlib import Path
from PIL import Image
OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
im = Image.open('scripts/art-source/blessings/banner.webp').convert('RGB').resize((900, 600), Image.Resampling.LANCZOS)
im.save(OUT/'blessings-banner.webp', quality=80, method=6); im.save(HOST/'blessings-banner.avif', quality=32)
print((OUT/'blessings-banner.webp').stat().st_size, (HOST/'blessings-banner.avif').stat().st_size)
