#!/usr/bin/env python3
"""VIP / SVIP art (image model, art-source/patron/) -> patron-banner 1536x1024 q92, patron-badge 512 px q95."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'scripts/art-source/patron', ROOT / 'src/assets/generated'
Image.open(SRC / 'banner.webp').convert('RGB').resize((1536, 1024), Image.LANCZOS).save(OUT / 'patron-banner.webp', quality=92, method=6)
b = Image.open(SRC / 'badge.webp').convert('RGBA'); b = b.crop(b.getchannel('A').point(lambda a: 255 if a > 8 else 0).getbbox())
side = max(b.size); sq = Image.new('RGBA', (side, side)); sq.alpha_composite(b, ((side - b.width) // 2, (side - b.height) // 2))
sq.resize((512, 512), Image.LANCZOS).save(OUT / 'patron-badge.webp', quality=95, method=6)
print('patron-banner, patron-badge')
