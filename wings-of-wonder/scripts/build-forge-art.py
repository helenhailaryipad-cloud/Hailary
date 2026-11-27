#!/usr/bin/env python3
"""Forge material icons (image model, sources in art-source/forge/) -> assets/generated/forge-<id>.webp, 384 px q95."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'scripts/art-source/forge', ROOT / 'src/assets/generated'
for src in sorted(SRC.glob('*.webp')):
    im = Image.open(src).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox() or (0, 0, *im.size)
    im = im.crop(box); side = int(max(im.size) * 1.08)
    sq = Image.new('RGBA', (side, side)); sq.alpha_composite(im, ((side - im.width) // 2, (side - im.height) // 2))
    sq = sq.resize((384, 384), Image.LANCZOS)
    px = sq.load()
    for y in range(384):
        for x in range(384):
            if px[x, y][3] == 0: px[x, y] = (0, 0, 0, 0)
    sq.save(OUT / f'forge-{src.stem}.webp', quality=95, method=6)
    print('forge-' + src.stem)
