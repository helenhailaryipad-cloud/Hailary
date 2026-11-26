#!/usr/bin/env python3
"""Prism icon for the Boss Roulette fields (image model on black: scripts/art-source/ui/prism.webp) -> transparent
src/assets/generated/ui-prism.webp (128 px) + AVIF copy. The diamond is kept opaque, the glow around it gets
alpha from brightness.

    python3 scripts/build-prism-icon.py
"""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
ROOT = Path(__file__).resolve().parents[1]
src = Image.open(ROOT/'scripts/art-source/ui/prism.webp').convert('RGB').resize((512, 512), Image.Resampling.LANCZOS)
a = np.asarray(src).astype(np.float32)
glow = a.max(axis=2)
mask = Image.new('L', (512, 512), 0)
ImageDraw.Draw(mask).polygon([(256, 17), (404, 239), (250, 472), (101, 239)], fill=255)
mask = np.asarray(mask.filter(ImageFilter.GaussianBlur(2))).astype(np.float32)
alpha = np.maximum(mask, np.clip((glow - 18) * 1.25, 0, 255))
rgb = np.where(alpha[..., None] > 0, np.clip(a * 255 / np.maximum(alpha[..., None], 1), 0, 255), 0)
rgb = np.where(mask[..., None] > 200, a, rgb)
im = Image.fromarray(np.dstack([rgb, alpha]).astype(np.uint8), 'RGBA')
im = im.crop(im.getbbox()).resize((128, 128), Image.Resampling.LANCZOS)
im.save(ROOT/'src/assets/generated/ui-prism.webp', quality=82, method=6)
im.save(ROOT/'scripts/hosting-art/ui-prism.avif', quality=40, speed=6)
print((ROOT/'src/assets/generated/ui-prism.webp').stat().st_size, (ROOT/'scripts/hosting-art/ui-prism.avif').stat().st_size)
