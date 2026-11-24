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
# Result windows of the mini games (Crystal Cascade, Crownfall Vale): ribbon, gold and violet button plates, light burst.
# art-source/ui/result-sheet.webp (three rows: ribbon, gold button, violet button) and result-burst.webp.
sheet = np.array(Image.open(SRC/'result-sheet.webp').convert('RGBA')); sheet[sheet[..., 3] < 20] = 0; H = sheet.shape[0]
for (name, top, bot, w) in (('ui-result-ribbon', 0, .36, 560), ('ui-btn-gold', .36, .68, 360), ('ui-btn-violet', .68, 1, 360)):
    part = Image.fromarray(sheet[int(top*H):int(bot*H)]); part = part.crop(part.getbbox())
    part = part.resize((w, round(part.height*w/part.width)), Image.Resampling.LANCZOS)
    part.save(OUT/f'{name}.webp', quality=86, method=6); part.save(Path('scripts/hosting-art')/f'{name}.avif', quality=40)
    print(name, part.size, (OUT/f'{name}.webp').stat().st_size)
b = np.array(Image.open(SRC/'result-burst.webp').convert('RGBA')); b[b[..., 3] < 16] = 0
burst = Image.fromarray(b).resize((512, 512), Image.Resampling.LANCZOS)
burst.save(OUT/'ui-result-burst.webp', quality=82, method=6); burst.save(Path('scripts/hosting-art')/'ui-result-burst.avif', quality=36)
print('ui-result-burst', (OUT/'ui-result-burst.webp').stat().st_size)
