#!/usr/bin/env python3
"""Icons of the Pets room: talent badges, pet gear pieces, and the seal / book / supreme / scroll items.

Sources are painted sprite sheets (scripts/art-source/pets). Each icon is cut from its grid cell, trimmed and set on a
144 px tile; the tiles are packed into three atlases that the room shows through CSS variables:
  comp-pet-talents.webp  4 x 6: attack (rows 1-2), guard (rows 3-4), second shelf (row 5 attack, row 6 guard),
                         in the order of petTalents
  comp-pet-gear.webp     4 x 2: in the order of petGearPieces
  comp-pet-misc.webp     4 x 1: seal, prophecy book, supreme badge, scroll
The comp- prefix puts them into pack-comp.js in the chat preview (no extra files).

    python3 scripts/build-pet-talents.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/pets'); OUT = Path('src/assets/generated'); TILE = 144

def tiles(name, cols, rows):
    sheet = Image.open(SRC/f'{name}.webp').convert('RGBA'); cw, ch = sheet.width//cols, sheet.height//rows; out = []
    for n in range(cols*rows):
        a = np.array(sheet.crop(((n % cols)*cw, (n//cols)*ch, (n % cols+1)*cw, (n//cols+1)*ch)))
        a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3]); a[a[..., 3] == 0] = 0
        cut = Image.fromarray(a); cut = cut.crop(cut.getbbox()); cut.thumbnail((TILE-6, TILE-6), Image.Resampling.LANCZOS)
        tile = Image.new('RGBA', (TILE, TILE)); tile.alpha_composite(cut, ((TILE-cut.width)//2, (TILE-cut.height)//2)); out.append(tile)
    return out

def atlas(name, icons, cols):
    rows = -(-len(icons)//cols); sheet = Image.new('RGBA', (cols*TILE, rows*TILE))
    for n, icon in enumerate(icons): sheet.alpha_composite(icon, ((n % cols)*TILE, (n//cols)*TILE))
    sheet.save(OUT/f'{name}.webp', quality=90, method=6); print(name, sheet.size, (OUT/f'{name}.webp').stat().st_size)

atlas('comp-pet-talents', tiles('attack', 4, 2)+tiles('guard', 4, 2)+tiles('extra', 4, 2), 4)
atlas('comp-pet-gear', tiles('gear', 4, 2), 4)
atlas('comp-pet-misc', tiles('misc', 4, 1), 4)
