#!/usr/bin/env python3
"""Painted avatar frames of the Supreme Sets (image model; sources scripts/art-source/frames/<set id>.webp, the inside
of each ring is transparent). Packed into src/assets/generated/comp-avatar-frames.webp, a 4 x 2 atlas of 256 px tiles
in the order of supremeSets (ember frost jade star mermaid icequeen love), plus an AVIF copy for hosting.

    python3 scripts/build-avatar-frames.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/frames'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); T = 256
IDS = ['ember', 'frost', 'jade', 'star', 'mermaid', 'icequeen', 'love']
atlas = Image.new('RGBA', (4*T, 2*T))
for n, i in enumerate(IDS):
    a = np.array(Image.open(SRC/f'{i}.webp').convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 20, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    im = Image.fromarray(a); im = im.crop(im.getbbox()); side = max(im.size)
    sq = Image.new('RGBA', (side, side)); sq.alpha_composite(im, ((side-im.width)//2, (side-im.height)//2))
    atlas.alpha_composite(sq.resize((T, T), Image.Resampling.LANCZOS), ((n % 4)*T, (n//4)*T))
atlas.save(OUT/'comp-avatar-frames.webp', quality=88, method=6); atlas.save(HOST/'comp-avatar-frames.avif', quality=45)
print('comp-avatar-frames', (OUT/'comp-avatar-frames.webp').stat().st_size, (HOST/'comp-avatar-frames.avif').stat().st_size)
