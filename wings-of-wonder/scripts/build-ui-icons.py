#!/usr/bin/env python3
"""Shared UI icons painted for the game. Today: the Back button (src/assets/generated/ui-back.webp, 192 px).

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
