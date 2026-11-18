"""Mounted (cat-rider) wardrobe layers.

Same idea as build-fitting-v2.py, for the riding pose: every outfit and every
hairstyle is a painting of ONE fixed base (bald Reina in a bodysuit on the
Silver Tabby, scripts/art-source/mounted/base.webp). A layer is the set of
pixels that differ from that base, so base + dress layer + hair layer always
line up. Sources are 1024 x 1024; the game frame is rows 44..980 (1024 x 936,
the proportions of the old riding portrait).

    python3 scripts/build-mounted.py            # everything
    python3 scripts/build-mounted.py emberveil 9  # some dresses / hairs
Review /tmp/mounted.png before committing.
"""
from pathlib import Path
import importlib.util, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fit', ROOT/'scripts/build-fitting-v2.py'); fit = importlib.util.module_from_spec(spec); spec.loader.exec_module(fit)
arr, img, dilate, erode, flood, components, keep_big, fill_holes, diff, skin_like, suit_mask = (fit.arr, fit.img, fit.dilate, fit.erode, fit.flood, fit.components, fit.keep_big, fit.fill_holes, fit.diff, fit.skin_like, fit.suit_mask)
SRC = ROOT/'scripts/art-source/mounted'; OUT = ROOT/'src/assets/generated'; HOST = ROOT/'scripts/hosting-art'
TOP, BOTTOM = 44, 980
DRESSES = ['leaflight', 'grove', 'frostlace', 'emberveil', 'dawnpetal', 'nightbloom', 'sunweave', 'tidal', 'willow', 'stardust', 'pearl', 'sapphire']
HAIRS = list(range(1, 12))
WARM_HAIR = {1, 2, 4, 6}      # chestnut, copper, gold: hair tones close to skin outlines

def box(x0, y0, x1, y1):
    m = np.zeros((1024, 1024), bool); m[y0:y1, x0:x1] = True; return m
def save(name, a, quality):
    im = img(fit.clean_rgb(a)).crop((0, TOP, 1024, BOTTOM))
    im.save(OUT/(name+'.webp'), lossless=True); im.save(HOST/(name+'.avif'), quality=quality, speed=4); return im

B = arr(Image.open(SRC/'base.webp'))
solid = B[..., 3] > 128
# Her head: everything opaque above the collar line, left of the bow.
HEAD = solid & box(405, 50, 562, 168)
RIDER = box(150, 150, 760, 830)                   # where clothes may appear
HAIRZONE = box(290, 0, 650, 520)
SUIT = keep_big(suit_mask(B) & box(410, 190, 580, 440), 400)

def region(P, allow, core_thr, noise=150):
    d = diff(P, B)
    core = keep_big(dilate(erode((d > core_thr) & allow, 1), 1), noise)
    faint = (d > 6) & ((d > 12) | ~(skin_like(P) & skin_like(B)))
    grown = core.copy()
    for _ in range(12): grown |= dilate(grown, 1) & faint & allow
    return core | (dilate(erode(grown, 2), 2) & grown), d

def build_dress(name):
    P = arr(Image.open(SRC/f'dress-{name}.webp'))
    m, d = region(P, RIDER & ~HEAD, 22)
    m |= dilate(SUIT, 6) & RIDER & ~HEAD            # the bodysuit never shows
    m = fill_holes(m, 200) & (P[..., 3] > 100)
    out = P.copy(); out[..., 3] = np.where(m, 255, 0)
    return save('fit-control-mount-'+name, out, 60)

yy, xx = np.mgrid[0:1024, 0:1024]
# Inner face (brows, eyes, nose, mouth) as a soft ellipse. Inside it the whole face comes from
# the hairstyle painting, so a fringe is never cut and eyes are never half old, half new.
FACE_SOFT = np.clip((1-np.sqrt(((xx-505)/46.0)**2+((yy-130)/38.0)**2))*5.5, 0, 1)*HEAD

def build_hair(i):
    P = arr(Image.open(SRC/f'hair-{i}.webp'))
    d0 = diff(P, B)
    same_skin = skin_like(P) & skin_like(B) & (d0 < 45)     # her skin, merely re-shaded
    m, d = region(P, HAIRZONE & ~same_skin, 26, 40)
    # Only hair that hangs from the head (plus earrings on the ears), never stray repaint noise.
    m = flood(m, [(x, y) for y, x in zip(*np.nonzero(m & dilate(HEAD, 8)))])
    m = fill_holes(m, 120) & (P[..., 3] > 100)
    # On her skin, hairline-thin specks are re-drawn jaw and ear outlines, not hair:
    # keep thin pieces only when they are wisps attached to real hair.
    on_head = m & HEAD; thick = dilate(erode(on_head, 2), 2) & on_head
    hairbody = (m & ~HEAD) | thick
    for c in components(on_head & ~thick):
        if c.sum() < 400 and not (dilate(c, 1) & hairbody).any(): m &= ~c
    if i not in WARM_HAIR:
        # Skin and skin-outline tones on her head are never this hair (gold ornaments are kept).
        R, G, Bl = P[..., 0], P[..., 1], P[..., 2]
        m &= ~(HEAD & (yy > 128) & (R-G > 25) & (G >= Bl-5) & (R > 90) & (G-Bl < 70))   # jaw and neck only
    out = P.copy(); out[..., 3] = np.maximum(np.where(m, 255, 0), FACE_SOFT*255*(P[..., 3] > 100))
    return save('fit-control-mounthair-'+str(i), out, 60)

if __name__ == '__main__':
    only = set(sys.argv[1:]); want = lambda n: not only or str(n) in only
    base = save('fit-control-mount-base', B, 62)
    for n in DRESSES:
        if want(n): build_dress(n)
    for i in HAIRS:
        if want(i): build_hair(i)
    sheet = Image.new('RGB', (1024*4, 936*3), '#dfe9ef')
    for k, n in enumerate(DRESSES):
        look = base.copy(); look.alpha_composite(Image.open(OUT/f'fit-control-mount-{n}.webp').convert('RGBA'))
        look.alpha_composite(Image.open(OUT/f'fit-control-mounthair-{HAIRS[k % 11]}.webp').convert('RGBA'))
        sheet.paste(look, ((k % 4)*1024, (k//4)*936), look)
    sheet.save('/tmp/mounted.png'); print('Built mounted layers; review /tmp/mounted.png')
