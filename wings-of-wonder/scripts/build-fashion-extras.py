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

# Harvest Pairs mini-game: eight ingredient tiles cut from one sheet (4 x 2), and its cover.
sheet = Image.open(SRC/'pairs/tiles.webp').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//2
for n in range(8):
    cellimg = sheet.crop(((n % 4)*cw, (n//4)*ch, (n % 4+1)*cw, (n//4+1)*ch))
    a = fit.arr(cellimg); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    keep = fit.keep_big(a[..., 3] > 0, 4000); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)   # only this cell's own icon
    icon = fit.img(fit.clean_rgb(a)); icon = icon.crop(icon.getbbox()); icon.thumbnail((236, 236), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (256, 256)); tile.alpha_composite(icon, ((256-icon.width)//2, (256-icon.height)//2))
    save(f'pairs-tile-{n+1}', tile, 70)
cover = Image.open(SRC/'pairs/cover.webp').convert('RGB').resize((1152, 768), Image.Resampling.LANCZOS)
save('pairs-cover', cover, 55)
lobby = Image.open(SRC/'pairs/lobby.webp').convert('RGB').resize((768, 1152), Image.Resampling.LANCZOS)
save('pairs-lobby', lobby, 55)
sprout = trim(SRC/'pairs/sprout.webp'); sprout.thumbnail((320, 320), Image.Resampling.LANCZOS)
save('pairs-sprout', sprout, 70)

# Jungle Trek: painted clearing, barrel and three power-up orbs.
bg = Image.open(SRC/'trek/bg.webp').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS)
save('trek-bg', bg, 55)
barrel = trim(SRC/'trek/barrel.webp'); barrel = barrel.resize((360, round(barrel.height*360/barrel.width)), Image.Resampling.LANCZOS)
save('trek-barrel', barrel, 70)
sheet = Image.open(SRC/'trek/pickups.webp').convert('RGBA'); cw = sheet.width//3
for n in range(3):
    a = fit.arr(sheet.crop((n*cw, 0, (n+1)*cw, sheet.height))); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    keep = fit.keep_big(a[..., 3] > 0, 4000); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    orb = fit.img(fit.clean_rgb(a)); orb = orb.crop(orb.getbbox()); orb.thumbnail((200, 200), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (208, 208)); tile.alpha_composite(orb, ((208-orb.width)//2, (208-orb.height)//2)); save(f'trek-pickup-{n+1}', tile, 70)
