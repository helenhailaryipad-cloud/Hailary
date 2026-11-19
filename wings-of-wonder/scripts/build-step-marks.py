#!/usr/bin/env python3
"""Footsteps: cut the single largest mark out of each trail picture (comp-step-<id>.webp).

The trail pictures show three marks along a diagonal, which suits a card. On Reina the game lays single marks out
itself, in a straight track behind her legs, so it needs one mark alone: comp-step-<id>-mark.webp.
Run from wings-of-wonder: python3 scripts/build-step-marks.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

OUT = Path('src/assets/generated')

def components(mask):
    """Connected regions of a small boolean mask, as lists of (y, x)."""
    seen = np.zeros(mask.shape, bool); found = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        stack = [(y0, x0)]; seen[y0, x0] = True; part = []
        while stack:
            y, x = stack.pop(); part.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    v, u = y+dy, x+dx
                    if 0 <= v < mask.shape[0] and 0 <= u < mask.shape[1] and mask[v, u] and not seen[v, u]:
                        seen[v, u] = True; stack.append((v, u))
        found.append(part)
    return sorted(found, key=len, reverse=True)

for path in sorted(OUT.glob('comp-step-*.webp')):
    if path.stem.endswith('-mark'): continue
    a = np.array(Image.open(path).convert('RGBA'))
    parts = components(a[..., 3] > 90)
    big = np.array(parts[0]); y0, x0 = big.min(0); y1, x1 = big.max(0)
    pad = 10; y0, x0 = max(0, y0-pad), max(0, x0-pad); y1, x1 = min(a.shape[0], y1+pad+1), min(a.shape[1], x1+pad+1)
    keep = np.zeros(a.shape[:2], bool); keep[y0:y1, x0:x1] = True
    # The next mark of the trail may reach into this box: drop every other sizeable region, keep small sparkles.
    for part in parts[1:]:
        if len(part) > 260:
            p = np.array(part); keep[p[:, 0].min()-4:p[:, 0].max()+5, p[:, 1].min()-4:p[:, 1].max()+5] = False
    a[..., 3] = np.where(keep, a[..., 3], 0); a[a[..., 3] == 0] = 0
    cut = Image.fromarray(a).crop((x0, y0, x1, y1)); cut = cut.crop(cut.getbbox())
    cut.save(OUT/(path.stem+'-mark.webp'), quality=90, method=6)
    print(path.stem, cut.size)
