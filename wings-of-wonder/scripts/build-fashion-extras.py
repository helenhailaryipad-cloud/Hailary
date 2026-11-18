"""Wings and bows of the second fashion collection.

Sources are full-canvas paintings on transparency (scripts/art-source/wings,
scripts/art-source/bows). This trims them, sizes them like the first
collection (larger, since wings are now drawn bigger) and prints the grip
position of each bow for the wardrobe catalog in src/app.js.

    python3 scripts/build-fashion-extras.py
"""
from pathlib import Path
import importlib.util
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fit', ROOT/'scripts/build-fitting-v2.py'); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)
SRC = ROOT/'scripts/art-source'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'

def trim(path, floor=24):
    a = fit.arr(Image.open(path)); a[..., 3] = np.where(a[..., 3] < floor, 0, a[..., 3])   # drop faint haze
    keep = fit.keep_big(a[..., 3] > 0, 60); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    im = fit.img(fit.clean_rgb(a)); return im.crop(im.getbbox())
def save(name, im, quality):
    im.save(OUT/(name+'.webp'), quality=92, method=6); im.save(HOST/(name+'.avif'), quality=quality, speed=4)

for n in range(11, 21):
    w = trim(SRC/'wings'/f'wing-{n}.webp'); w = w.resize((860, round(w.height*860/w.width)), Image.Resampling.LANCZOS)
    save(f'fashion-wing-{n}', w, 58)
grips = {}
for n in range(14, 24):
    b = trim(SRC/'bows'/f'bow-{n}.webp'); b = b.resize((round(b.width*560/b.height), 560), Image.Resampling.LANCZOS)
    save(f'weapon-style-{n}', b, 62)
    a = np.array(b)[..., 3] > 128; band = a[int(b.height*.46):int(b.height*.54)]
    xs = np.nonzero(band)[1]; xs = xs[xs > b.width*.3]          # skip the bowstring on the left
    grips[n] = round(float(xs.mean())/b.width, 2)
print('bow grip x fractions:', grips)
