#!/usr/bin/env python3
"""Painted chat bubbles (image model; sources scripts/art-source/bubbles/<id>.webp). Packed into
src/assets/generated/comp-chat-bubbles.webp, a 4 x 6 atlas of 256 x 160 tiles in the order: the seven Supreme Set
bubbles (supremeSets), then WonderGear.chatBubbles; plus an AVIF copy for hosting. A tile is stretched over a chat
line, so each bubble is fitted to the whole tile (not letter-boxed).

    python3 scripts/build-chat-bubbles.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/bubbles'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art'); W, H = 256, 160
IDS = ['ember', 'frost', 'jade', 'star', 'mermaid', 'icequeen', 'love',
       'starmoon', 'inferno', 'arcade', 'fairy', 'lantern', 'seaside', 'idol', 'ocean', 'hourglass',
       'rose', 'dragonling', 'pumpkin', 'harvest', 'pirate', 'clockwork', 'holly']
atlas = Image.new('RGBA', (4*W, 6*H))
for n, i in enumerate(IDS):
    im = Image.open(SRC/f'{i}.webp').convert('RGBA'); im = im.crop(im.getbbox())
    pad = Image.new('RGBA', (im.width + im.width//40, im.height + im.height//25)); pad.alpha_composite(im, (im.width//80, im.height//50))
    atlas.alpha_composite(pad.resize((W, H), Image.Resampling.LANCZOS), ((n % 4)*W, (n//4)*H))
atlas.save(OUT/'comp-chat-bubbles.webp', quality=86, method=6); atlas.save(HOST/'comp-chat-bubbles.avif', quality=36)
print('comp-chat-bubbles', (OUT/'comp-chat-bubbles.webp').stat().st_size, (HOST/'comp-chat-bubbles.avif').stat().st_size)
