"""Animation sheets for the pets (user: "animate the three pets beside her").

Every pet (d0-d3 and familiars 4-53) has three frames: 0 = its painting, 1 = idle breath, 2 = attack (image-model
edits, `art-source/pet-anim/<id>-<f>.webp`). Each frame is aligned on the ground line of frame 0 and placed with the
SAME transform that made the pet's game picture (familiars: bbox crop centred in a square with a 3% margin, as in
build-familiars.py; d0-d3: the whole picture), so the sheet lines up exactly with `familiar-<n>` / `d<n>`.
A cell is that square plus `PAD` (15%) on every side, so a lunge or a magic burst is not cut off:
sheet `pet-anim-<id>` = 3 cells of `CELL` px side by side; the pet's square sits at (PADPX, PADPX, SQ, SQ) in a cell.

    python3 scripts/build-pet-anim.py [ids...]
"""
import sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC, OUT = ROOT/'scripts/art-source', ROOT/'src/assets/generated'
CELL, PAD, MARGIN = 640, .15, .03
SQ = round(CELL/(1+2*PAD)); PADPX = (CELL-SQ)//2

def clean(im):
    a = np.array(im.convert('RGBA')); a[..., 3] = np.where(a[..., 3] < 20, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    return Image.fromarray(a)

def build(pid):
    if pid.startswith('d'):
        f0 = clean(Image.open(OUT/f'{pid}.webp').resize((1024, 1024), Image.Resampling.LANCZOS))
        sq = (0, 0, 1024)                                   # x, y, side of the square in the 1024 frame
    else:
        f0 = clean(Image.open(SRC/f'familiars/{pid}.webp'))
        b = f0.getbbox(); w, h = b[2]-b[0], b[3]-b[1]; side = round(max(w, h)*(1+2*MARGIN))
        sq = (b[0]-(side-w)//2, b[1]-(side-h)//2, side)
    ground = f0.getbbox()[3]
    frames = [f0] + [clean(Image.open(SRC/f'pet-anim/{pid}-{f}.webp').resize((1024, 1024), Image.Resampling.LANCZOS)) for f in (1, 2)]
    k = SQ/sq[2]
    sheet = Image.new('RGBA', (CELL*3, CELL))
    for i, fr in enumerate(frames):
        bb = fr.getbbox(); dy = ground-bb[3] if i else 0     # same ground line as frame 0
        big = Image.new('RGBA', (2048, 2048)); big.alpha_composite(fr, (512, 512+dy))
        x0, y0 = 512+sq[0]-PADPX/k, 512+sq[1]-PADPX/k          # the cell's box in `big`
        part = big.crop((round(x0), round(y0), round(x0+CELL/k), round(y0+CELL/k))).resize((CELL, CELL), Image.Resampling.LANCZOS)
        sheet.alpha_composite(part, (i*CELL, 0))
    sheet.save(OUT/f'pet-anim-{pid}.webp', quality=93, alpha_quality=100, method=6)

if __name__ == '__main__':
    ids = sys.argv[1:] or ['d0', 'd1', 'd2', 'd3'] + [f'familiar-{n}' for n in range(4, 54)]
    for pid in ids:
        if (SRC/f'pet-anim/{pid}-2.webp').exists(): build(pid); print(pid, flush=True)
        else: print(pid, 'missing frames')
    print('cell', CELL, 'square', SQ, 'pad', PADPX)
