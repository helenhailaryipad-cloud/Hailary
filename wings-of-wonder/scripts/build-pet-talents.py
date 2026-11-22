#!/usr/bin/env python3
"""Icons of the Pets room: talent badges, pet gear pieces, and the seal / book / supreme / scroll items.

Sources are painted sprite sheets (scripts/art-source/pets). Each icon is cut from its grid cell, trimmed and set on a
144 px tile; the tiles are packed into three atlases that the room shows through CSS variables:
  comp-pet-talents.webp  4 x 10: attack (rows 1-2), guard (rows 3-4), second shelf (row 5 attack, row 6 guard), counter (row 7), third shelf (shelf3.webp, 13 tiles),
                         counter talents (row 7: riposte, aftershock),
                         in the order of petTalents
  comp-pet-gear.webp     4 x 2: in the order of petGearPieces
  comp-pet-misc.webp     4 x 1: seal, prophecy book, supreme badge, scroll
Talent badge colour = strength (user 2026-11-22): every common talent is green enamel, the strong Top talents are
red; the build recolours the enamel of each tile by hue and leaves the gold rim and the ivory symbol alone.
The attack / guard kind is a small corner chip drawn in CSS (.tal-atk / .tal-def).
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

import re, colorsys
block = Path('src/gear-data.js').read_text().split('const petTalents=[', 1)[1].split('\n];', 1)[0]
TOP = [bool(re.search(r"top:true", line)) for line in block.splitlines() if re.match(r"\s*\{id:'", line)]

def enamel(tile, hue):
    a = np.array(tile).astype(np.float32)/255; r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    mx, mn = a[..., :3].max(-1), a[..., :3].min(-1); d = mx-mn+1e-6
    h = np.where(mx == r, ((g-b)/d) % 6, np.where(mx == g, (b-r)/d+2, (r-g)/d+4))/6; sat = d/(mx+1e-6)
    red = (h < .055) | (h > .93); green = (h > .24) & (h < .52)
    m = (red | green) & (sat > .3) & (mx > .08) & (al > 0)
    out = a.copy(); idx = np.argwhere(m)
    for y, x in idx:
        v = mx[y, x]; s_ = sat[y, x]; v2 = v*(1.08 if hue < .1 and green[y, x] else .92 if hue > .1 and red[y, x] else 1)
        out[y, x, :3] = colorsys.hsv_to_rgb(hue, s_, min(1, v2))
    return Image.fromarray((out*255).round().astype(np.uint8))

talents = tiles('attack', 4, 2)+tiles('guard', 4, 2)+tiles('extra', 4, 2)+tiles('counter', 2, 1)+tiles('shelf3', 4, 4)[:13]
assert len(talents) == len(TOP), (len(talents), len(TOP))
atlas('comp-pet-talents', [enamel(t, .995 if top else .385) for t, top in zip(talents, TOP)], 4)
atlas('comp-pet-gear', tiles('gear', 4, 2), 4)
atlas('comp-pet-misc', tiles('misc', 4, 1), 4)
