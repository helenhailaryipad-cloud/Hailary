"""Companion appearances: cloaks, back accessories and tails worn behind Reina, fairy companions and
footstep trails.

Cloaks, back accessories and tails are paintings of the bald base body (art-source/fitting-control/
base-v2.png) wearing the item on her back. The layer is the part of the painting OUTSIDE her
silhouette, drawn behind the body by the wardrobe compositor, so it works under every dress. A band
of colour is bled inwards under the silhouette so no gap opens where an outfit hides part of the body.
Fairies and footsteps are cut from sprite sheets.

    python3 scripts/build-companions.py
"""
from pathlib import Path
import importlib.util, json
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fit', ROOT/'scripts/build-fitting-v2.py'); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)
arr, img, dilate, erode, keep_big, fill_holes, diff = fit.arr, fit.img, fit.dilate, fit.erode, fit.keep_big, fit.fill_holes, fit.diff
SRC = ROOT/'scripts/art-source/companions'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
IDS = json.loads((SRC/'ids.json').read_text())
B = arr(fit.body_hi); BODY = B[..., 3] > 128

def save(name, im, quality=46):
    im.save(OUT/(name+'.webp'), quality=88, method=6); im.save(HOST/(name+'.avif'), quality=quality, speed=4)
def icon(im, size=132):
    cut = im.crop(im.getbbox()); cut.thumbnail((size-8, size-8), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (size, size)); tile.alpha_composite(cut, ((size-cut.width)//2, (size-cut.height)//2)); return tile

def whole_item(path):
    a = arr(Image.open(path)); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    keep = keep_big(a[..., 3] > 0, 200); a[..., 3] = np.where(dilate(keep, 3), a[..., 3], 0)
    return img(fit.clean_rgb(a))
def icon(im, size=168):
    cut = im.crop(im.getbbox()); cut.thumbnail((size-8, size-8), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (size, size)); tile.alpha_composite(cut, ((size-cut.width)//2, (size-cut.height)//2)); return tile

def behind_layer(kind, key):
    P = arr(Image.open(SRC/f'{kind}-{key}.webp')); d = diff(P, B)
    m = (P[..., 3] > 110) & (d > 24) & ~dilate(BODY, 1)
    m = keep_big(dilate(erode(m, 1), 1) & m, 500)
    m = fill_holes(m, 300) & ~BODY & (P[..., 3] > 60)
    out = P.copy(); out[..., 3] = np.where(m, 255, 0)
    art = img(fit.clean_rgb(out, 2))                                   # the item alone, for its card
    # Bleed colour 36 px inwards under her silhouette (hidden by the body, visible only where an outfit erases it).
    known = m.copy(); col = out[..., :3].copy(); col[~known] = 0
    for _ in range(36):
        acc = np.zeros_like(col); cnt = np.zeros(known.shape, np.float32)
        for dy, dx in ((0, 1), (0, -1), (1, 0), (-1, 0)):
            k = np.roll(np.roll(known, dy, 0), dx, 1); acc += np.roll(np.roll(col, dy, 0), dx, 1)*k[..., None]; cnt += k
        todo = ~known & BODY & (cnt > 0)
        col[todo] = acc[todo]/cnt[todo][:, None]; known |= todo
    out[..., :3] = col; out[..., 3] = np.where(known, 255, 0)
    save(f'comp-{kind}-{key}', fit.to_frame(img(fit.clean_rgb(out, 2))))
    # Cards for cloaks and back items use a separate painting of the whole item (art-source/icons):
    # the layer alone has a body-shaped hole in it.
    whole = ROOT/'scripts/art-source/icons'/f'{kind}-{key}.webp'
    save(f'comp-icon-{kind}-{key}', icon(whole_item(whole)) if whole.exists() else icon(art), 55)

def sheet(name, cols, rows, keys, prefix, size):
    for s in range(len(keys)//(cols*rows)):
        im = Image.open(SRC/f'{name}-{s}.webp').convert('RGBA'); cw, ch = im.width//cols, im.height//rows
        for n in range(cols*rows):
            a = arr(im.crop(((n % cols)*cw, (n//cols)*ch, (n % cols+1)*cw, (n//cols+1)*ch))); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
            keep = keep_big(a[..., 3] > 0, 60); a[..., 3] = np.where(dilate(keep, 3), a[..., 3], 0)
            cut = img(fit.clean_rgb(a)); cut = cut.crop(cut.getbbox()); cut.thumbnail((size, size), Image.Resampling.LANCZOS)
            save(f'{prefix}-{keys[s*cols*rows+n]}', cut, 55)

if __name__ == '__main__':
    for kind in ('cloak', 'back', 'tail'):
        for key in IDS[kind]: behind_layer(kind, key)
    # Mount cards: the whole creature without rider or saddle.
    for path in sorted((ROOT/'scripts/art-source/icons').glob('mount-*.webp')):
        save('mount-icon-'+path.stem[6:], icon(whole_item(path), 200), 55)
    sheet('elves', 2, 2, IDS['elf'], 'comp-elf', 300)
    sheet('steps', 3, 2, IDS['step'], 'comp-step', 280)
    print('Built companion art')
