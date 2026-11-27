#!/usr/bin/env python3
"""Resource Realms art (image model, scripts/art-source/realms): eight realm banners realm-<id> (1536 x 1024 -> 1536 wide
q92) and the hub background realm-hub (1024 x 1536). Full resolution (user rule 2026-11-27).

    python3 scripts/build-realm-art.py
"""
from pathlib import Path
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; SRC = ROOT/'scripts/art-source/realms'; OUT = ROOT/'src/assets/generated'
for n in ['gold', 'crystal', 'gem', 'essence', 'shard', 'seal', 'beast', 'wish', 'hub']:
    Image.open(SRC/f'{n}.webp').convert('RGB').save(OUT/f'realm-{n}.webp', quality=90, method=6); print(n)
