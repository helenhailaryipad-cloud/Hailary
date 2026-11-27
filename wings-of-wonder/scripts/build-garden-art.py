#!/usr/bin/env python3
"""Sky Garden art (image model, scripts/art-source/garden): background garden-bg (1024 x 1536), the bed garden-plot,
growth stages garden-sprout / garden-young, the eight ripe plants garden-<seed id> (ids of Garden.seeds), the watering
can garden-can, the home icon garden-icon, and the farm: garden-farm-bg (three terraces), garden-hen / cow / sheep,
their goods garden-egg / milk / wool and the fence garden-farm-fence. Full resolution, high quality (user rule 2026-11-27).

    python3 scripts/build-garden-art.py
"""
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; SRC = ROOT/'scripts/art-source/garden'; OUT = ROOT/'src/assets/generated'
for b in ('bg', 'farm-bg'): Image.open(SRC/f'{b}.webp').convert('RGB').save(OUT/f'garden-{b}.webp', quality=92, method=6)
for n in ['plot', 'sprout', 'young', 'sunpetal', 'moonbell', 'dewleaf', 'starberry', 'emberroot', 'lotus', 'wishblossom', 'goldmelon', 'can', 'icon', 'hen', 'cow', 'sheep', 'egg', 'milk', 'wool', 'farm-fence', 'wheat', 'carrot', 'potato', 'i-wheat', 'i-carrot', 'i-potato', 'pig', 'truffle', 'corn', 'i-corn']:
    a = np.array(Image.open(SRC/f'{n}.webp').convert('RGBA')); a[a[..., 3] < 16] = 0; im = Image.fromarray(a); im = im.crop(im.getbbox())
    side = 1024 if n == 'farm-fence' else 512 if n == 'plot' else 384; f = side/max(im.size); im = im.resize((round(im.width*f), round(im.height*f)), Image.Resampling.LANCZOS)
    im.save(OUT/f'garden-{n}.webp', quality=95, method=6); print(n, im.size)
