#!/usr/bin/env python3
"""Blossom Vow art (image model, sources in scripts/art-source/vow/):
  comp-vow-bg      blossom trees, red carpet and rose arch (768 x 1152), the backdrop of every tab
  comp-vow-icons   atlas 4 x 2 of 192 px in the order of Vow.icons (src/vow.js): rose, ring, box, lock, crystal,
                   bond point token, event badge, bouquet
  comp-vow-icon    the event badge alone (160 px), home promo icon
  comp-vow-badges  three winged rank emblems 1-3 (3 x 192 px)
  comp-vow-nav     atlas 3 x 2 of 160 px: rings, scroll, pavilion, sword and rose, spyglass, gift (bottom nav, Ranking Reward)
  comp-vow-shrine  blossom shrine of the Oath Ceremony (512 px)
  comp-vow-couple  Reina and an original AI partner under the tree (Oath Witness, 900 x 600)
Writes WebP into src/assets/generated and AVIF copies into scripts/hosting-art.

    python3 scripts/build-vow-art.py
"""
from pathlib import Path
from PIL import Image
SRC = Path('scripts/art-source/vow'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')


def clean(im):
    """Blank the colour under fully transparent pixels (smaller files)."""
    im = im.convert('RGBA'); px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            if px[x, y][3] < 4: px[x, y] = (0, 0, 0, 0)
    return im


def cell(sheet, box, size, pad=.04):
    """Cut one icon out of a sheet cell: tight box around its opaque pixels, centred on a square."""
    c = sheet.crop(box); bb = c.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox() or (0, 0, c.width, c.height)
    c = c.crop(bb); side = int(max(c.size) * (1 + 2 * pad)); sq = Image.new('RGBA', (side, side))
    sq.paste(c, ((side - c.width) // 2, (side - c.height) // 2)); return sq.resize((size, size), Image.Resampling.LANCZOS)


def atlas(sheet, cols, rows, size):
    w, h = sheet.width // cols, sheet.height // rows; out = Image.new('RGBA', (cols * size, rows * size))
    for r in range(rows):
        for c in range(cols): out.alpha_composite(cell(sheet, (c * w, r * h, (c + 1) * w, (r + 1) * h), size), (c * size, r * size))
    return out


def save(im, name, q=80, aq=36):
    if im.mode == 'RGBA': im = clean(im)
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)


icons = Image.open(SRC/'icons.webp').convert('RGBA')
save(Image.open(SRC/'bg.webp').convert('RGB').resize((768, 1152), Image.Resampling.LANCZOS), 'comp-vow-bg', 78, 34)
save(atlas(icons, 4, 2, 192), 'comp-vow-icons')
save(cell(icons, (768, 512, 1152, 1024), 160), 'comp-vow-icon')
save(atlas(Image.open(SRC/'badges.webp').convert('RGBA'), 3, 1, 192), 'comp-vow-badges')
save(atlas(Image.open(SRC/'nav.webp').convert('RGBA'), 3, 2, 160), 'comp-vow-nav')
save(Image.open(SRC/'shrine.webp').convert('RGBA').resize((512, 512), Image.Resampling.LANCZOS), 'comp-vow-shrine')
save(Image.open(SRC/'couple.webp').convert('RGB').resize((900, 600), Image.Resampling.LANCZOS), 'comp-vow-couple', 78, 34)
