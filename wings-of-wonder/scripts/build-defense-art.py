#!/usr/bin/env python3
"""Art of Castle Defense ("Guard the Grove"; image model, sources in scripts/art-source/defense):
  td-reina.webp, td-nyra.webp, td-kael.webp  4 x 2 atlases of the three defenders (cells TD_CW x TD_CH):
      row 0 = idle loop, row 1 = shot / cast. Every frame is scaled alike and set so the feet stand on the same
      point of the cell (x = TD_FX, y = TD_FY), so the frames do not jump.
  td-foes.webp   4 x 3 walk cycles (forest dragon, astral wraith, ember dragon), facing left, cells FOE_C x FOE_C
  td-boss.webp   4 x 1 walk cycle of the boss, cells BOSS_C x BOSS_C
  td-fx.webp     4 x 2 effects on black (drawn with 'screen'): starburst, fire blast, ice shatter, ring /
                 sparkles, death poof, ice bolt, sun comet (256 px cells)
  td-sun.webp    the sun energy pickup (160 px)
The numbers here must match TD_ART in src/minigame-engine.js. Hosting AVIF copies go to scripts/hosting-art.

    python3 scripts/build-defense-art.py
"""
from pathlib import Path
from PIL import Image
import numpy as np

SRC = Path('scripts/art-source/defense'); OUT = Path('src/assets/generated'); HOST = Path('scripts/hosting-art')
TD_CW, TD_CH, TD_FX, TD_FY, TD_H = 240, 280, 100, 274, 262      # defender cells, foot point, tallest frame height
FOE_C, BOSS_C = 224, 288

def clean(im, cut=28):
    a = np.array(im.convert('RGBA')); a[..., 3] = np.where(a[..., 3] < cut, 0, a[..., 3]); a[a[..., 3] == 0] = 0
    return Image.fromarray(a)

def save(im, name, q=80, aq=34):
    im.save(OUT/f'{name}.webp', quality=q, method=6); im.save(HOST/f'{name}.avif', quality=aq)
    print(name, im.size, (OUT/f'{name}.webp').stat().st_size, (HOST/f'{name}.avif').stat().st_size)

def main_parts(im, keep=.03, k=4):
    """Drop specks that belong to a neighbouring frame of the sheet: label the (4x smaller, dilated) alpha mask and
    keep only parts with at least `keep` of the largest part's area."""
    a = np.array(im); al = a[..., 3]; h, w = al.shape; H, W = (h+k-1)//k, (w+k-1)//k
    m = np.zeros((H*k, W*k), bool); m[:h, :w] = al > 40; m = m.reshape(H, k, W, k).any((1, 3))
    d = m.copy(); d[1:] |= m[:-1]; d[:-1] |= m[1:]; d[:, 1:] |= m[:, :-1]; d[:, :-1] |= m[:, 1:]
    lab = np.zeros((H, W), int); sizes = [0]; n = 0
    for y0 in range(H):
        for x0 in range(W):
            if d[y0, x0] and not lab[y0, x0]:
                n += 1; stack = [(y0, x0)]; lab[y0, x0] = n; s = 0
                while stack:
                    y, x = stack.pop(); s += 1
                    for yy, xx in ((y+1, x), (y-1, x), (y, x+1), (y, x-1)):
                        if 0 <= yy < H and 0 <= xx < W and d[yy, xx] and not lab[yy, xx]: lab[yy, xx] = n; stack.append((yy, xx))
                sizes.append(s)
    if n == 0: return im
    big = max(sizes); ok = np.array([s >= keep*big for s in sizes]); ok[0] = False
    # a part that touches the cell edge and is not the figure itself spills over from the neighbouring frame
    edge = set(lab[0]) | set(lab[-1]) | set(lab[:, 0]) | set(lab[:, -1])
    for i in edge:
        if i and sizes[i] != big: ok[i] = False
    full = np.repeat(np.repeat(ok[lab], k, 0), k, 1)[:h, :w]
    a[..., 3] = np.where(full, al, 0); a[a[..., 3] == 0] = 0
    return Image.fromarray(a)

def frames(path, cols, rows):
    sh = clean(Image.open(path)); cw, ch = sh.width//cols, sh.height//rows
    return [main_parts(sh.crop(((n % cols)*cw, (n//cols)*ch, (n % cols+1)*cw, (n//cols+1)*ch))) for n in range(cols*rows)]

def foot(im):
    """x of the feet (alpha centre of the lowest 12% of the figure) and the bottom row."""
    a = np.array(im)[..., 3] > 40; ys = np.where(a.any(1))[0]; y0, y1 = ys[0], ys[-1]
    band = a[max(y0, y1 - int((y1 - y0)*.12)):y1+1]; xs = np.where(band)[1]
    return float(xs.mean()), int(y1)

def sheet(fr, cols, rows, cw, ch, fx, fy, hmax, wmax=None, per_row=False):
    at = Image.new('RGBA', (cols*cw, rows*ch))
    for r in range(rows):
        row = fr[r*cols:(r+1)*cols] if per_row else fr
        boxes = [f.getbbox() for f in row]
        s = hmax/max(b[3]-b[1] for b in boxes)
        if wmax: s = min(s, wmax/max(b[2]-b[0] for b in boxes))
        for c in range(cols):
            f = fr[r*cols+c]; x, y = foot(f)
            g = f.resize((round(f.width*s), round(f.height*s)), Image.Resampling.LANCZOS)
            cell = Image.new('RGBA', (cw, ch))
            # paste with clipping at the cell edges
            ox, oy = round(fx - x*s), round(fy - y*s)
            src = g.crop((max(0, -ox), max(0, -oy), min(g.width, cw-ox), min(g.height, ch-oy)))
            cell.alpha_composite(src, (max(0, ox), max(0, oy)))
            at.alpha_composite(cell, (c*cw, r*ch))
    return at

for who in ['reina', 'nyra', 'kael']:
    save(sheet(frames(SRC/f'{who}.webp', 4, 2), 4, 2, TD_CW, TD_CH, TD_FX, TD_FY, TD_H), f'td-{who}')
save(sheet(frames(SRC/'foes.webp', 4, 3), 4, 3, FOE_C, FOE_C, FOE_C/2, FOE_C-6, FOE_C-20, FOE_C-10, per_row=True), 'td-foes')
save(sheet(frames(SRC/'boss.webp', 2, 2), 4, 1, BOSS_C, BOSS_C, BOSS_C/2, BOSS_C-6, BOSS_C-24, BOSS_C-12), 'td-boss')

fx = Image.new('RGB', (1024, 512))
for i, name in enumerate(['fxa', 'fxb']):
    fx.paste(Image.open(SRC/f'{name}.webp').convert('RGB').resize((512, 512), Image.Resampling.LANCZOS), (i*512, 0))
# reorder to one row of four per source: fxa -> cells 0-3, fxb -> cells 4-7 (2 x 2 each becomes 4 x 1)
at = Image.new('RGB', (1024, 512))
for i in range(8):
    sx, sy = (i//4)*512 + (i % 2)*256, ((i % 4)//2)*256
    at.paste(fx.crop((sx, sy, sx+256, sy+256)), ((i % 4)*256, (i//4)*256))
at.save(OUT/'td-fx.webp', quality=80, method=6); at.save(HOST/'td-fx.avif', quality=36)
print('td-fx', at.size, (OUT/'td-fx.webp').stat().st_size, (HOST/'td-fx.avif').stat().st_size)

sun = clean(Image.open(SRC/'sun.webp'), 20); sun = sun.crop(sun.getbbox()); sun.thumbnail((160, 160), Image.Resampling.LANCZOS)
save(sun, 'td-sun', 84, 40)
