#!/usr/bin/env python3
"""Star Rites art (image model, scripts/art-source/rites and wings/wing-28..31): the four exclusive wings
(fashion-wing-28..31, same treatment as build-fashion-extras.py), four auras (comp-rites-aura-<id>), four hall
backgrounds (comp-rites-bg-<id>) and the 4 x 4 icon atlas comp-rites-icons (tickets, ten Wish Orbs, luck chest,
stardust). Writes WebP into src/assets/generated and AVIF copies into scripts/hosting-art.

    python3 scripts/build-rites-art.py
"""
from pathlib import Path
import importlib.util
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fit', ROOT/'scripts/build-fitting-v2.py'); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)
SRC = ROOT/'scripts/art-source'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
def trim(im, floor=24):
    a = fit.arr(im); a[..., 3] = np.where(a[..., 3] < floor, 0, a[..., 3])
    keep = fit.keep_big(a[..., 3] > 0, 60); a[..., 3] = np.where(fit.dilate(keep, 2), a[..., 3], 0)
    im = fit.img(fit.clean_rgb(a)); return im.crop(im.getbbox())
def save(name, im, q=88, aq=50):
    im.save(OUT/(name+'.webp'), quality=q, method=6); im.save(HOST/(name+'.avif'), quality=aq, speed=4)
    print(name, im.size, (OUT/(name+'.webp')).stat().st_size, (HOST/(name+'.avif')).stat().st_size)

for n in range(28, 33):   # exclusive wings (32 = Aurelian Sunwings, the ultra prize): keep a WebP source like the others, then the same size as wing 11-27
    src = SRC/'wings'/f'wing-{n}.webp'
    if not src.exists(): Image.open(SRC/'wings'/f'wing-{n}.png').save(src, quality=95, method=6)
    w = trim(Image.open(src)); w = w.resize((860, round(w.height*860/w.width)), Image.Resampling.LANCZOS)
    w.save(OUT/f'fashion-wing-{n}.webp', quality=92, method=6); w.save(HOST/f'fashion-wing-{n}.avif', quality=40, speed=4)
    print(f'fashion-wing-{n}', w.size)
for k in ('moon', 'ember', 'star', 'bloom'):
    a = trim(Image.open(SRC/'rites'/f'aura-{k}.png'), 10); a = a.resize((640, round(a.height*640/a.width)), Image.Resampling.LANCZOS)
    save(f'comp-rites-aura-{k}', a, 86, 50)
    b = Image.open(SRC/'rites'/f'bg-{k}.png').convert('RGB').resize((720, 1080), Image.Resampling.LANCZOS)
    save(f'comp-rites-bg-{k}', b, 78, 34)
# Icons: each of the 16 cells trimmed to its icon and centred in a 192 px tile.
sheet = Image.open(SRC/'rites'/'icons.png').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//4; T = 192
atlas = Image.new('RGBA', (T*4, T*4))
for i in range(16):
    c = sheet.crop(((i % 4)*cw, (i//4)*ch, (i % 4+1)*cw, (i//4+1)*ch)); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox())
    c.thumbnail((T-14, T-14), Image.Resampling.LANCZOS); atlas.alpha_composite(c, ((i % 4)*T+(T-c.width)//2, (i//4)*T+(T-c.height)//2))
save('comp-rites-icons', atlas, 88, 50)
# Wayfarer Quests banner (trail.js): a camp with a treasure chest, no characters.
b = Image.open(SRC/'trail'/'banner.png').convert('RGB'); b = b.resize((960, 640), Image.Resampling.LANCZOS)
save('comp-trail-banner', b, 78, 34)
# Starlit Voucher (universal rite ticket) icon.
v = Image.open(SRC/'rites'/'voucher.png').convert('RGBA'); a = np.array(v); a[a[..., 3] < 24] = 0; v = Image.fromarray(a); v = v.crop(v.getbbox()); v.thumbnail((176, 176), Image.Resampling.LANCZOS)
c = Image.new('RGBA', (192, 192)); c.alpha_composite(v, ((192-v.width)//2, (192-v.height)//2)); save('comp-rites-voucher', c, 88, 50)
# Wayfarer Coin (trail.js shop currency).
c = Image.open(SRC/'trail'/'coin.png').convert('RGBA'); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox()); c.thumbnail((120, 120), Image.Resampling.LANCZOS)
t = Image.new('RGBA', (128, 128)); t.alpha_composite(c, ((128-c.width)//2, (128-c.height)//2)); save('comp-trail-coin', t, 88, 50)
# Secret Shop banner (raccoon merchant, title over the calm left side) -> comp-secret-shop 900 x 600.
ss = Image.open(SRC/'rites'/'secret-shop.webp').convert('RGB').resize((900, 600), Image.Resampling.LANCZOS)
ss.save(OUT/'comp-secret-shop.webp', quality=78, method=6); ss.save(HOST/'comp-secret-shop.avif', quality=28); print('comp-secret-shop', ss.size)
