"""Animation sheets for the Cloud War defenders (user: "the enemies are static, animate them").

Each defender (tier guardian t7 ... t16) has four frames: 0 = the original painting, 1 = idle breath, 2 = wind-up,
3 = attack lunge. Frames 1-3 are image-model edits of the original (`art-source/cloud/foes/t<n>-<f>.webp`).
All frames are aligned on the ground line (bottom of the opaque area) and cut from one common box, so they line up
when played; sheet `cloud-foe-t<n>` = 4 cells of 640 x 640 side by side, WebP q93.
Writes CLOUD_FOE_META {n: [x, y, w, h]} = frame 0's opaque box inside a cell, used to draw the sheet at the size the
old static sprite had.

    python3 scripts/build-cloud-foes.py
"""
import json, re
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC, OUT = ROOT/'scripts/art-source', ROOT/'src/assets/generated'
FOES, CELL = [7, 8, 9, 10, 12, 13, 14, 16], 640

def box(im):
    a = np.array(im)[..., 3] > 24
    ys, xs = np.nonzero(a)
    return xs.min(), ys.min(), xs.max()+1, ys.max()+1

meta = {}
for n in FOES:
    frames = [Image.open(SRC/f'guardians/guardian-t{n}.webp').convert('RGBA')]
    frames += [Image.open(SRC/f'cloud/foes/t{n}-{f}.webp').convert('RGBA').resize((1024, 1024), Image.Resampling.LANCZOS) for f in (1, 2, 3)]
    ground = box(frames[0])[3]
    placed = []
    for im in frames:   # same ground line for every frame
        b = box(im); c = Image.new('RGBA', (1024, 1200)); c.alpha_composite(im, (0, ground-b[3]+80)); placed.append(c)
    boxes = [box(c) for c in placed]
    u = (min(b[0] for b in boxes), min(b[1] for b in boxes), max(b[2] for b in boxes), max(b[3] for b in boxes))
    side = max(u[2]-u[0], u[3]-u[1]); k = (CELL-16)/side
    sheet = Image.new('RGBA', (CELL*4, CELL))
    for i, c in enumerate(placed):
        part = c.crop(u); part = part.resize((round(part.width*k), round(part.height*k)), Image.Resampling.LANCZOS)
        ox, oy = (CELL-part.width)//2, CELL-8-part.height
        sheet.alpha_composite(part, (i*CELL+ox, oy))
        if i == 0:
            b = box(part); meta[n] = [ox+int(b[0]), oy+int(b[1]), int(b[2]-b[0]), int(b[3]-b[1])]
    sheet.save(OUT/f'cloud-foe-t{n}.webp', quality=93, alpha_quality=100, method=6)
    print(n, meta[n])
line = 'const CLOUD_FOE_META='+json.dumps({str(k): v for k, v in meta.items()}, separators=(',', ':'))+';'
p = ROOT/'src/gear-ui.js'; s = p.read_text()
p.write_text(re.sub(r'const CLOUD_FOE_META=\{.*?\};', lambda m: line, s, count=1))
print(line)
