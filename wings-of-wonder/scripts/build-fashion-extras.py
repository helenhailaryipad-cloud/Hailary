"""Wings and bows of the second fashion collection.

Sources are full-canvas paintings on transparency (scripts/art-source/wings,
scripts/art-source/bows). This trims them, sizes them like the first
collection (larger, since wings are now drawn bigger) and prints the grip
position of each bow for the wardrobe catalog in src/app.js.

    python3 scripts/build-fashion-extras.py
"""
import re
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

for n in range(11, 28):
    w = trim(SRC/'wings'/f'wing-{n}.webp'); w = w.resize((860, round(w.height*860/w.width)), Image.Resampling.LANCZOS)
    save(f'fashion-wing-{n}', w, 58)
grips = {}
for n in range(14, 40):
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
bg = Image.open(SRC/'trek/bg.webp').convert('RGB').resize((900, 1350), Image.Resampling.LANCZOS)   # the field is drawn up to 1200 px wide
save('trek-bg', bg, 55)
barrel = trim(SRC/'trek/barrel.webp'); barrel = barrel.resize((360, round(barrel.height*360/barrel.width)), Image.Resampling.LANCZOS)
save('trek-barrel', barrel, 70)
sheet = Image.open(SRC/'trek/pickups.webp').convert('RGBA'); cw = sheet.width//3
for n in range(3):
    a = fit.arr(sheet.crop((n*cw, 0, (n+1)*cw, sheet.height))); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    keep = fit.keep_big(a[..., 3] > 0, 4000); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    orb = fit.img(fit.clean_rgb(a)); orb = orb.crop(orb.getbbox()); orb.thumbnail((200, 200), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (208, 208)); tile.alpha_composite(orb, ((208-orb.width)//2, (208-orb.height)//2)); save(f'trek-pickup-{n+1}', tile, 70)

# Tier guardians (bosses 7-31): repainted at high resolution from the old 240 px sprites, same designs.
for n in range(7, 32):
    g = trim(SRC/'guardians'/f'guardian-t{n}.webp'); g.thumbnail((600, 600), Image.Resampling.LANCZOS)
    save(f'guardian-t{n}', g, 46)   # 25 images: keep the hosted bundle well under its limit
# Canvas battles crop each guardian to the bounds stored in art-meta.js: keep them in step with the art.
meta = Path('src/art-meta.js'); text = meta.read_text()
for n in range(7, 32):
    im = Image.open(OUT/f'guardian-t{n}.webp').convert('RGBA'); x0, y0, x1, y1 = im.getchannel('A').point(lambda a: 255 if a > 24 else 0).getbbox()
    text = re.sub(r'"guardian-t%d": \{"bounds": \[[0-9, ]+\]\}' % n, '"guardian-t%d": {"bounds": [%d, %d, %d, %d]}' % (n, x0, y0, x1-x0, y1-y0), text)
meta.write_text(text)

# Jungle Trek second set: three more bonus orbs, bomb, storm crystal, rocket (3 x 2 sheet).
sheet = Image.open(SRC/'trek/extras.webp').convert('RGBA'); cw, ch = sheet.width//3, sheet.height//2
for n, name in enumerate(['trek-pickup-4', 'trek-pickup-5', 'trek-pickup-6', 'trek-bomb', 'trek-elec', 'trek-rocket']):
    a = fit.arr(sheet.crop(((n % 3)*cw, (n//3)*ch, (n % 3+1)*cw, (n//3+1)*ch))); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    keep = fit.keep_big(a[..., 3] > 0, 300); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    cut = fit.img(fit.clean_rgb(a)); cut = cut.crop(cut.getbbox()); cut.thumbnail((200, 200), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (208, 208)); tile.alpha_composite(cut, ((208-cut.width)//2, (208-cut.height)//2)); save(name, tile, 70)
# Third sheet: sun beam, chain lightning and frost orbs. The painted halo around each orb is faded out at its rim.
sheet = Image.open(SRC/'trek/orbs2.webp').convert('RGBA'); cw = sheet.width//3
for n, name in enumerate(['trek-pickup-7', 'trek-pickup-8', 'trek-pickup-9']):
    a = fit.arr(sheet.crop((n*cw, 0, (n+1)*cw, sheet.height))); a[..., 3] = (np.clip((a[..., 3].astype(float)-170)/70, 0, 1)*255).astype(np.uint8)
    keep = fit.keep_big(a[..., 3] > 0, 300); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    cut = fit.img(fit.clean_rgb(a)); cut = cut.crop(cut.getbbox()); cut.thumbnail((200, 200), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (208, 208)); tile.alpha_composite(cut, ((208-cut.width)//2, (208-cut.height)//2)); save(name, tile, 70)
# Reward chests (closed and open) and the four painted frames of the bow-shot flash.
sheet = Image.open(SRC/'trek/chests.webp').convert('RGBA'); cw = sheet.width//2
for n, name in enumerate(['trek-chest', 'trek-chest-open']):
    a = fit.arr(sheet.crop((n*cw, 0, (n+1)*cw, sheet.height))); a[..., 3] = np.where(a[..., 3] < 24, 0, a[..., 3])
    cut = fit.img(fit.clean_rgb(a)); cut = cut.crop(cut.getbbox()); cut.thumbnail((300, 300), Image.Resampling.LANCZOS); save(name, cut, 70)
sheet = Image.open(SRC/'trek/shotfx.webp').convert('RGBA'); solid = (np.array(sheet)[..., 3] > 20).sum(0) > 0
runs, start = [], None   # the four frames are the four widest runs of painted columns
for x, on in enumerate(list(solid)+[False]):
    if on and start is None: start = x
    if not on and start is not None:
        if runs and start-runs[-1][1] < 40: runs[-1][1] = x
        else: runs.append([start, x])
        start = None
runs = sorted(sorted(runs, key=lambda r: r[0]-r[1])[:4])
strip = Image.new('RGBA', (4*192, 192)); cuts = []
for x0, x1 in runs:
    cut = sheet.crop((x0, 0, x1, sheet.height)); box = Image.fromarray(((np.array(cut)[..., 3] > 20)*255).astype(np.uint8)).getbbox(); cuts.append(cut.crop(box))
k = 186/max(max(c.size) for c in cuts)   # one scale for all four, so the flash really grows
for n, cut in enumerate(cuts):
    cut = cut.resize((max(1, round(cut.width*k)), max(1, round(cut.height*k))), Image.Resampling.LANCZOS)
    strip.alpha_composite(cut, (n*192+(192-cut.width)//2, (192-cut.height)//2))
save('trek-shot', fit.img(fit.clean_rgb(fit.arr(strip))), 70)
