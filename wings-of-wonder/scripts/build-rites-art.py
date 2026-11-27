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
def save(name, im, q=95, aq=60):
    im.save(OUT/(name+'.webp'), quality=q, method=6); im.save(HOST/(name+'.avif'), quality=aq, speed=4)
    print(name, im.size, (OUT/(name+'.webp')).stat().st_size, (HOST/(name+'.avif')).stat().st_size)

for n in range(28, 33):   # exclusive wings (32 = Aurelian Sunwings, the ultra prize): keep a WebP source like the others, then the same size as wing 11-27
    src = SRC/'wings'/f'wing-{n}.webp'
    if not src.exists(): Image.open(SRC/'wings'/f'wing-{n}.png').save(src, quality=95, method=6)
    w = trim(Image.open(src)); w = w.resize((860, round(w.height*860/w.width)), Image.Resampling.LANCZOS)
    w.save(OUT/f'fashion-wing-{n}.webp', quality=92, method=6); w.save(HOST/f'fashion-wing-{n}.avif', quality=40, speed=4)
    print(f'fashion-wing-{n}', w.size)
for k in ('moon', 'ember', 'star', 'bloom'):
    a = trim(Image.open(SRC/'rites'/f'aura-{k}.png'), 10); a = a.resize((1024, round(a.height*1024/a.width)), Image.Resampling.LANCZOS) if a.width > 1024 else a
    save(f'comp-rites-aura-{k}', a)
    b = Image.open(SRC/'rites'/f'bg-{k}.png').convert('RGB')
    save(f'comp-rites-bg-{k}', b, 92)
# Icons: each of the 16 cells trimmed to its icon and scaled to fill a 256 px tile (full quality, user: "everything is muddy").
RITE_IDS = ['moon', 'ember', 'star', 'bloom']
sheet = Image.open(SRC/'rites'/'icons.png').convert('RGBA'); cw, ch = sheet.width//4, sheet.height//4; T = 256
atlas = Image.new('RGBA', (T*4, T*4))
for i in range(16):
    c = sheet.crop(((i % 4)*cw, (i//4)*ch, (i % 4+1)*cw, (i//4+1)*ch)); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox())
    # Cells 0-3 (tickets) were repainted lighter and cleaner (user: "ugly, very red icons"): ticket-<rite>.png.
    if i < 4 and (SRC/'rites'/f'ticket-{RITE_IDS[i]}.webp').exists():
        c = Image.open(SRC/'rites'/f'ticket-{RITE_IDS[i]}.webp').convert('RGBA'); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox())
    f = (T-12)/max(c.width, c.height); c = c.resize((round(c.width*f), round(c.height*f)), Image.Resampling.LANCZOS); atlas.alpha_composite(c, ((i % 4)*T+(T-c.width)//2, (i//4)*T+(T-c.height)//2))
save('comp-rites-icons', atlas)
# Wayfarer Quests banner (trail.js): a camp with a treasure chest, no characters.
b = Image.open(SRC/'trail'/'banner.png').convert('RGB')
save('comp-trail-banner', b, 92)
# Starlit Voucher (universal rite ticket) icon.
v = Image.open(SRC/'rites'/'voucher.png').convert('RGBA'); a = np.array(v); a[a[..., 3] < 24] = 0; v = Image.fromarray(a); v = v.crop(v.getbbox()); v.thumbnail((368, 368), Image.Resampling.LANCZOS)
c = Image.new('RGBA', (384, 384)); c.alpha_composite(v, ((384-v.width)//2, (384-v.height)//2)); save('comp-rites-voucher', c)
# Wayfarer Coin (trail.js shop currency).
c = Image.open(SRC/'trail'/'coin.png').convert('RGBA'); a = np.array(c); a[a[..., 3] < 24] = 0; c = Image.fromarray(a); c = c.crop(c.getbbox()); c.thumbnail((248, 248), Image.Resampling.LANCZOS)
t = Image.new('RGBA', (256, 256)); t.alpha_composite(c, ((256-c.width)//2, (256-c.height)//2)); save('comp-trail-coin', t)
# Secret Shop banner (raccoon merchant, title over the calm left side) -> comp-secret-shop at the source's full 1536 x 1024.
ss = Image.open(SRC/'rites'/'secret-shop.webp').convert('RGB')
save('comp-secret-shop', ss)
