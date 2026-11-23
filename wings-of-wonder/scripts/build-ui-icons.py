#!/usr/bin/env python3
"""Shared UI icons painted for the game. The Back button (src/assets/generated/ui-back.webp, 192 px)
and the checkbox (ui-check-on / ui-check-off, 96 px).

    python3 scripts/build-ui-icons.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/ui'); OUT = Path('src/assets/generated')
a = np.array(Image.open(SRC/'back.webp').convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3]); a[a[..., 3] == 0] = 0
icon = Image.fromarray(a); icon = icon.crop(icon.getbbox()); side = max(icon.size); tile = Image.new('RGBA', (side, side))
tile.alpha_composite(icon, ((side-icon.width)//2, (side-icon.height)//2)); tile = tile.resize((192, 192), Image.Resampling.LANCZOS)
tile.save(OUT/'ui-back.webp', quality=92, method=6); print('ui-back', tile.size, (OUT/'ui-back.webp').stat().st_size)

for name in ('check-on', 'check-off'):
    a = np.array(Image.open(SRC/f'{name}.webp').convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    icon = Image.fromarray(a); icon = icon.crop(icon.getbbox()); side = max(icon.size); tile = Image.new('RGBA', (side, side))
    tile.alpha_composite(icon, ((side-icon.width)//2, (side-icon.height)//2)); tile = tile.resize((96, 96), Image.Resampling.LANCZOS)
    tile.save(OUT/f'ui-{name}.webp', quality=90, method=6); print('ui-'+name, tile.size, (OUT/f'ui-{name}.webp').stat().st_size)
# Home screen "Mini Games" icon (opens the Mini Games hub): art-source/ui/minigames.webp -> comp-minigames-icon (+ AVIF).
import numpy as np
m = np.array(Image.open(SRC/'minigames.webp').convert('RGBA')); m[m[..., 3] < 20] = 0; icon = Image.fromarray(m); icon = icon.crop(icon.getbbox())
icon.thumbnail((240, 240), Image.Resampling.LANCZOS); tile = Image.new('RGBA', (256, 256)); tile.alpha_composite(icon, ((256-icon.width)//2, (256-icon.height)//2))
tile.save(OUT/'comp-minigames-icon.webp', quality=88, method=6); tile.save(Path('scripts/hosting-art')/'comp-minigames-icon.avif', quality=40)
