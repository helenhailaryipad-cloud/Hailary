#!/usr/bin/env python3
"""Fashion Bow cards: every bow laid diagonally, filling the card (like the reference's weapon cards), in ONE atlas
src/assets/generated/fashion-bows.webp (+ AVIF copy for the hosted bundle), 10 columns of 200 px, in the order of
FX_BOW_IDS in src/app.js. Bows 0 and 11 (the Leaflight bow) and -1 (Frostglass) come from clean item paintings in
scripts/art-source/fashion-cards/bow-{original,frost}.webp; the others from weapon-style-<n>.

    python3 scripts/build-fashion-bows.py
"""
import re, json
from pathlib import Path
from PIL import Image
OUT = Path('src/assets/generated'); SRC = Path('scripts/art-source'); T = 200; COLS = 10; PAD = 10
ids = json.loads(re.search(r"const FX_BOW_IDS=(\[[^\]]*\])", Path('src/app.js').read_text()).group(1))
def source(n):
    if n in (0, 11): return Image.open(SRC/'fashion-cards/bow-original.webp')
    if n == -1: return Image.open(SRC/'fashion-cards/bow-frost.webp')
    hi = SRC/f'bows/bow-{n}.webp'
    return Image.open(hi if hi.exists() else OUT/f'weapon-style-{n}.webp')
rows = (len(ids) + COLS - 1) // COLS
atlas = Image.new('RGBA', (COLS*T, rows*T))
for i, n in enumerate(ids):
    im = source(n).convert('RGBA'); im = im.crop(im.getbbox())
    im = im.rotate(-38, resample=Image.Resampling.BICUBIC, expand=True); im = im.crop(im.getbbox())
    k = (T - 2*PAD) / max(im.size); im = im.resize((max(1, round(im.width*k)), max(1, round(im.height*k))), Image.Resampling.LANCZOS)
    atlas.alpha_composite(im, ((i % COLS)*T + (T-im.width)//2, (i // COLS)*T + (T-im.height)//2))
atlas.save(OUT/'fashion-bows.webp', quality=78, method=6)
atlas.save(Path('scripts/hosting-art')/'fashion-bows.avif', quality=30)
print('fashion-bows', atlas.size, len(ids), (OUT/'fashion-bows.webp').stat().st_size, (Path('scripts/hosting-art')/'fashion-bows.avif').stat().st_size)
