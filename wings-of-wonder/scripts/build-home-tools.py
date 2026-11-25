#!/usr/bin/env python3
"""Home screen round tools above the Quest Board (image model, clean, no painted "!": the notice is drawn by the game
only when something is due, cityDue in app.js): tool-rewards.webp, tool-upgrade.webp (112 px, + AVIF copies).

    python3 scripts/build-home-tools.py
"""
from pathlib import Path
from PIL import Image
SRC = Path('scripts/art-source/ui'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
for src, name in (('tool-chest', 'tool-rewards'), ('tool-up', 'tool-upgrade'), ('tool-elf', 'hud-broadcast')):  # hud-broadcast had a painted "!"
    im = Image.open(SRC/f'{src}.webp').convert('RGBA'); im = im.crop(im.getbbox()); im.thumbnail((112, 112), Image.Resampling.LANCZOS)
    im.save(OUT/f'{name}.webp', quality=86, method=6); im.save(HOST/f'{name}.avif', quality=50)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)
