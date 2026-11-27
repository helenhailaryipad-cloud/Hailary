#!/usr/bin/env python3
"""Prism Bazaar art (2026-11-27): Moon Pearl icon, seven prism piles, three Triple Treat caches, the store banner.
Sources (image model) in scripts/art-source/topup/; output in src/assets/generated/ at full quality."""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parent.parent
SRC, OUT = ROOT / 'scripts/art-source/topup', ROOT / 'src/assets/generated'

def trimmed(path, size):
    im = Image.open(path).convert('RGBA')
    box = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox() or (0, 0, *im.size)
    im = im.crop(box); w, h = im.size; side = int(max(w, h) * 1.08)
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0)); sq.paste(im, ((side - w) // 2, (side - h) // 2))
    return sq.resize((size, size), Image.LANCZOS)

def save(im, name, q=95):
    im.save(OUT / f'{name}.webp', quality=q, method=6); print(name, im.size)

save(trimmed(SRC / 'pearl.webp', 256), 'ui-pearl')
for i in range(1, 8): save(trimmed(SRC / f'p{i}.webp', 512), f'topup-pile-{i}')
for k in ('bubble', 'frame', 'mount'): save(trimmed(SRC / f'cache-{k}.webp', 512), f'topup-cache-{k}')
save(trimmed(SRC / 'coupon.webp', 256), 'topup-coupon')
for i in range(1, 7): save(trimmed(SRC / f'c{i}.webp', 512), f'topup-coupons-{i}')
save(Image.open(SRC / 'banner.webp').convert('RGB').resize((1536, 1024), Image.LANCZOS), 'topup-banner', 92)
