#!/usr/bin/env python3
"""Challenge chapter map art (image model, scripts/art-source/challenge): four chapter backgrounds
(challenge-bg-<theme>, 1024 x 1536, the painted S-path carries the stage markers, positions in CH_TRAILS in
src/challenge.js), stage markers (flag, boss card, gate orb), the chibi Reina (edit of leaflight/master.png) and the
tool icons. Full resolution, high quality (user rule 2026-11-27).

    python3 scripts/build-challenge-art.py
"""
from pathlib import Path
import numpy as np
from PIL import Image
ROOT = Path(__file__).resolve().parents[1]; SRC = ROOT/'scripts/art-source/challenge'; OUT = ROOT/'src/assets/generated'
for t in ('blossom', 'frost', 'amber', 'moon'):
    Image.open(SRC/f'bg-{t}.webp').convert('RGB').save(OUT/f'challenge-bg-{t}.webp', quality=92, method=6)
for n, side in [('flag', 384), ('boss', 384), ('gate', 384), ('chest', 384), ('pass', 320), ('assign', 320), ('objective', 320),
                ('training', 320), ('bonus', 320), ('power', 320), ('chibi', 512)]:
    a = np.array(Image.open(SRC/f'{n}.webp').convert('RGBA')); a[a[..., 3] < 16] = 0; im = Image.fromarray(a); im = im.crop(im.getbbox())
    f = side/max(im.size); im = im.resize((round(im.width*f), round(im.height*f)), Image.Resampling.LANCZOS)
    im.save(OUT/f'challenge-{n}.webp', quality=95, method=6); print(n, im.size, (OUT/f'challenge-{n}.webp').stat().st_size)
