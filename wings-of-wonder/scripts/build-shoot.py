"""Reina's shooting pose (battles): bow arm stretched toward the foe, the other hand drawn back to her cheek.

Same idea as the wardrobe and the mounted pose: one bald base body in the pose
(`art-source/shoot/base.webp`, an image-model edit of base-v2.png) and one painting of
that body per dress (`art-source/shoot/dress-<id>.webp`, the dress painted on the
pose with the image model). Every pixel that differs from the base is the garment
(`painted_layer` of build-fitting-v2.py), so body + layer reproduces the painting.
Hair layers are the standing ones (the head is the same).

Writes, at twice the 500 x 800 frame (1000 x 1600) for sharp battles:
  fit-shoot-body            the base body (1000 x 1500, drawn in the body rect)
  fit-shoot-<id>            garment layer
  fit-shoot-<id>-erase      body pixels the painting hides
  fit-shoot-<id>-hands      both fists, drawn over hair and the bow
and prints SHOOT_META {id: [gripX, gripY, drawX, drawY]} in frame units for app.js.

    python3 scripts/build-shoot.py [ids...]
"""
import importlib.util, json, sys
from pathlib import Path
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fit', ROOT/'scripts/build-fitting-v2.py')
fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)
SRC, OUT = ROOT/'scripts/art-source/shoot', ROOT/'src/assets/generated'
W2, H2, Y2 = 1000, 1600, 80          # 2x frame; the body (500 x 750 at y 40) becomes 1000 x 1500 at y 80

def frame2(im):
    im = im.convert('RGBA').resize((W2, 1500), Image.Resampling.LANCZOS)
    fr = Image.new('RGBA', (W2, H2)); fr.alpha_composite(im, (0, Y2)); return fr
def save(name, im, lossless=False):
    im = fit.img(fit.clean_rgb(fit.arr(im)))
    if lossless: im.save(OUT/(name+'.webp'), lossless=True)
    else: im.save(OUT/(name+'.webp'), quality=93, alpha_quality=100, method=6)
    return im

base = Image.open(SRC/'base.webp').convert('RGBA')
stand = fit.arr(Image.open(ROOT/'scripts/art-source/fitting-control/base-v2.png'))
Bb = fit.arr(base)
# The fist at her cheek (1024 x 1536 painting): only pixels that differ from the standing body are hand,
# so the jaw beside it is never copied over the hair.
CHEEK = [(352, 165), (448, 162), (474, 188), (474, 252), (452, 270), (366, 270), (346, 215)]
GRIP = (880, 215, 1024, 360)

def hands(P):
    H, W = P.shape[:2]
    cheek = fit.poly_mask(CHEEK, (W, H)) & (fit.diff(P, stand) > 22) & (P[..., 3] > 0)
    cheek = fit.keep_big(fit.dilate(fit.erode(cheek, 1), 1), 600)
    cheek = fit.dilate(cheek, 2) & (P[..., 3] > 0) & fit.poly_mask(CHEEK, (W, H))
    yy, xx = np.mgrid[0:H, 0:W]
    x0, y0, x1, y1 = GRIP
    zone = (xx >= x0) & (xx < x1) & (yy >= y0) & (yy < y1) & (P[..., 3] > 0)
    # The fist: the arm's last 80 px. Its right edge, then everything opaque within 80 px of it.
    cols = np.nonzero(zone.any(0))[0]
    right = cols.max() if len(cols) else 990
    grip = zone & (xx > right-80)
    rows = np.nonzero(grip[:, right-40])[0]
    gy = rows.mean() if len(rows) else 287
    cy = np.nonzero(cheek.any(1))[0]; cx = np.nonzero(cheek.any(0))[0]
    draw = (cx.max()-14, cy.mean()) if len(cx) else (446, 212)
    m = cheek | grip
    out = P.copy(); out[..., 3] = np.where(m, P[..., 3], 0)
    to = lambda x, y: [round(float(x)*500/1024, 1), round(40+float(y)*750/1536, 1)]
    return out, to(right-36, gy) + to(*draw)


def build(dress):
    P = fit.arr(Image.open(SRC/f'dress-{dress}.webp'))
    m, erase = fit.painted_layer(P, Bb)
    lay = P.copy(); lay[..., 3] = np.where(m, P[..., 3], 0)
    save('fit-shoot-'+dress, frame2(fit.img(lay)))
    e = np.zeros_like(P); e[..., 3] = np.where(erase, 255, 0)
    save('fit-shoot-'+dress+'-erase', frame2(fit.img(e)), lossless=True)
    hand, meta = hands(P)
    save('fit-shoot-'+dress+'-hands', frame2(fit.img(hand)))
    return meta

if __name__ == '__main__':
    save('fit-shoot-body', base.resize((W2, 1500), Image.Resampling.LANCZOS))
    ids = sys.argv[1:] or sorted(p.stem[6:] for p in SRC.glob('dress-*.webp'))
    meta = {}
    for d in ids:
        meta[d] = build(d); print(d, meta[d], flush=True)
    path = SRC/'meta.json'
    old = json.loads(path.read_text()) if path.exists() else {}
    old.update(meta); path.write_text(json.dumps(old, sort_keys=True))
    line = 'const SHOOT_META='+json.dumps(old, sort_keys=True, separators=(',', ':'))+';'
    app = ROOT/'src/app.js'; text = app.read_text()
    import re
    app.write_text(re.sub(r'const SHOOT_META=\{.*?\};', lambda m: line, text, count=1))
    print('SHOOT_META written to app.js:', len(old), 'dresses')
