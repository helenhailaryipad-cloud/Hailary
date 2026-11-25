#!/usr/bin/env python3
"""Cloud War tool icons (image model, light ivory / silver / gold, no disc; user: "small, not black, must not distract
from the map"): scripts/art-source/cloud/tool-<id>.webp -> atlas src/assets/generated/comp-cloud-tools.webp (5 x 1 cells
of 112 px, order TOOLS) + AVIF copy.

    python3 scripts/build-cloud-tools.py
"""
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT/'scripts/art-source/cloud'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
TOOLS = ['shop', 'faction', 'points', 'rank', 'guide']
T = 112
atlas = Image.new('RGBA', (T*len(TOOLS), T))
for i, k in enumerate(TOOLS):
    im = Image.open(SRC/f'tool-{k}.webp').convert('RGBA'); a = np.array(im)
    a[a[..., 3] < 24] = 0; a[a[..., 3] == 0, :3] = 0
    im = Image.fromarray(a); im = im.crop(im.getbbox()); im.thumbnail((T-8, T-8), Image.Resampling.LANCZOS)
    atlas.alpha_composite(im, (i*T + (T-im.width)//2, (T-im.height)//2))
atlas.save(OUT/'comp-cloud-tools.webp', quality=88, method=6)
atlas.save(HOST/'comp-cloud-tools.avif', quality=40, speed=6)
print('comp-cloud-tools', atlas.size, (OUT/'comp-cloud-tools.webp').stat().st_size, (HOST/'comp-cloud-tools.avif').stat().st_size)
