#!/usr/bin/env python3
"""Fashion room garment cards: Reina wearing each dress, head to thighs (like the reference's close cards).
Input: scripts/art-source/fashion-cards/<id>.png from scripts/render-fashion-cards.mjs (not committed, regenerate).
Output: one atlas src/assets/generated/fashion-cards.webp (+ AVIF copy for the hosted bundle), 10 columns of 200 px,
in the order of FX_CARD_IDS in src/app.js.

    node scripts/render-fashion-cards.mjs && python3 scripts/build-fashion-cards.py
"""
import re, json
from pathlib import Path
from PIL import Image
SRC = Path('scripts/art-source/fashion-cards'); OUT = Path('src/assets/generated'); T = 200; COLS = 10
ids = json.loads(re.search(r"const FX_CARD_IDS=(\[[^\]]*\])", Path('src/app.js').read_text()).group(1).replace("'", '"'))
rows = (len(ids) + COLS - 1) // COLS
atlas = Image.new('RGBA', (COLS*T, rows*T))
for i, n in enumerate(ids):
    im = Image.open(SRC/f'{n}.png').convert('RGBA'); x0, y0, x1, y1 = im.getbbox(); H = y1 - y0; s = int(.60*H); cx = (x0+x1)//2
    c = im.crop((cx - s//2, y0, cx + s//2, y0 + s)).resize((T, T), Image.Resampling.LANCZOS)
    atlas.alpha_composite(c, ((i % COLS)*T, (i // COLS)*T))
atlas.save(OUT/'fashion-cards.webp', quality=72, method=6)
atlas.save(Path('scripts/hosting-art')/'fashion-cards.avif', quality=26)
print('fashion-cards', atlas.size, (OUT/'fashion-cards.webp').stat().st_size, (Path('scripts/hosting-art')/'fashion-cards.avif').stat().st_size)
