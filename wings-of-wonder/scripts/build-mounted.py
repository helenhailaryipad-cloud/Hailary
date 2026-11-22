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
DRESSES = ['leaflight', 'grove', 'frostlace', 'emberveil', 'dawnpetal', 'nightbloom', 'sunweave', 'tidal', 'willow', 'stardust', 'pearl', 'sapphire',
           'aurora', 'rosethorn', 'seafoam', 'ravenwing', 'sunflower', 'frostqueen', 'autumn', 'starlit', 'coral', 'jade', 'phoenix', 'snowqueen', 'peacock', 'galaxy', 'mermaid', 'icequeen', 'sweetheart']
WIDE = set(DRESSES[12:])      # second collection: capes and trains may trail over the cat
HAIRS = list(range(1, 22))
GREY_HAIR = {2, 10, 12, 17}   # pearl, black, silver, white hair: neutral colours are the hair itself
WARM_HAIR = {1, 2, 4, 6, 13, 15, 19}      # chestnut, copper, gold: hair tones close to skin outlines

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
RIDER_WIDE = box(10, 150, 760, 880)
HAIRZONE = box(290, 0, 650, 520)
HAIRZONE_LONG = box(240, 0, 650, 680)             # hair down to the saddle
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
    zone = RIDER_WIDE if name in WIDE else RIDER
    m, d = region(P, zone & ~HEAD, 22)
    m |= dilate(SUIT, 6) & RIDER & ~HEAD            # the bodysuit never shows
    m = fill_holes(m, 200) & (P[..., 3] > 100)
    m = off_the_cat(m, P) & (P[..., 3] > 100)
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
    m, d = region(P, (HAIRZONE_LONG if i >= 12 else HAIRZONE) & ~same_skin, 26, 40)
    # Only hair that hangs from the head (plus earrings on the ears), never stray repaint noise.
    m = flood(m, [(x, y) for y, x in zip(*np.nonzero(m & dilate(HEAD, 8)))])
    m = fill_holes(m, 120) & (P[..., 3] > 100)
    # On her skin, hairline-thin specks are re-drawn jaw and ear outlines, not hair:
    # keep thin pieces only when they are wisps attached to real hair.
    on_head = m & HEAD; thick = dilate(erode(on_head, 2), 2) & on_head
    hairbody = (m & ~HEAD) | thick
    for c in components(on_head & ~thick):
        if c.sum() < 400 and not (dilate(c, 1) & hairbody).any(): m &= ~c
    R = rider_mask(); m &= ~(solid & ~dilate(R, 2) & neutral(B) & neutral(P) & ~HEAD) if i not in GREY_HAIR else True
    if i not in WARM_HAIR:
        # Skin and skin-outline tones on her head are never this hair (gold ornaments are kept).
        R, G, Bl = P[..., 0], P[..., 1], P[..., 2]
        m &= ~(HEAD & (yy > 128) & (R-G > 25) & (G >= Bl-5) & (R > 90) & (G-Bl < 70))   # jaw and neck only
    out = P.copy(); out[..., 3] = np.maximum(np.where(m, 255, 0), FACE_SOFT*255*(P[..., 3] > 100))
    return save('fit-control-mounthair-'+str(i), out, 60)

_cache = {}
def mount_paintings():
    if 'paints' not in _cache: _cache['paints'] = {k: arr(Image.open(SRC/f'ride-{k}.webp')) for k in MOUNTS}
    return _cache['paints']
def rider_mask():
    """The rider herself: the pixels that stay the same in (almost) every mount painting."""
    if 'rider' not in _cache:
        paints = mount_paintings()
        same = sum((diff(P, B) < 26).astype(np.int32) for P in paints.values())
        rider = (same >= len(paints)-2) & (B[..., 3] > 128)
        _cache['rider'] = keep_big(dilate(erode(rider, 2), 2), 3000)
    return _cache['rider']
def neutral(a, spread=30):
    return (a[..., :3].max(-1)-a[..., :3].min(-1)) < spread
def off_the_cat(m, P):
    """Layers were painted on the Silver Tabby, and the painter also re-drew bits of its fur. Those
    grey fur pixels must not travel to other mounts: drop grey pixels that sit on the cat's fur,
    keep only what hangs together with the rider, then close the holes this leaves inside cloth."""
    R = rider_mask()
    fur = solid & ~dilate(R, 2) & neutral(B)
    m = m & ~(fur & neutral(P))
    m = dilate(erode(m, 1), 1) & m
    near = dilate(R, 12); out = np.zeros_like(m)
    for c in components(m):
        if c.sum() >= 150 and (c & near).any(): out |= c
    return fill_holes(out, 5000)

# ---------- extra mounts: the same rider and saddle on a different creature ----------
MOUNTS = ["moon-unicorn", "emerald-stag", "ember-fox", "azure-drake", "golden-gryphon", "frost-wolf", "rose-pegasus", "star-kirin", "amethyst-panther", "sunfire-lion", "cloud-ram", "tide-turtle", "thunder-tiger", "snow-owl", "rainbow-phoenix", "midnight-steed", "honey-bear", "lotus-koi", "moon-rabbit", "bamboo-panda"]
def build_mounts():
    """Each source is the base with only the cat replaced. The rider and saddle are whatever stays the
    same in (almost) every painting; those pixels are copied from the base, so every dress and hair
    layer made for the Silver Tabby lines up exactly on every mount."""
    paints = mount_paintings(); rider = rider_mask()
    soft = np.array(Image.fromarray((erode(rider, 1)*255).astype(np.uint8)).filter(__import__('PIL.ImageFilter', fromlist=['x']).GaussianBlur(1.2))).astype(np.float32)/255
    for k, P in paints.items():
        out = P.copy(); a = soft[..., None]
        out[..., :3] = B[..., :3]*a + P[..., :3]*(1-a); out[..., 3] = np.maximum(P[..., 3], B[..., 3]*soft)
        out[..., 3] = np.where(out[..., 3] < 24, 0, out[..., 3])
        # Shown at a few hundred pixels: stored at 832 x 760 to keep the hosted bundle under its limit.
        full = img(fit.clean_rgb(out)).crop((0, TOP, 1024, BOTTOM)).resize((832, 760), Image.Resampling.LANCZOS)
        full.save(OUT/f'fit-control-ride-{k}.webp', quality=90, method=6); full.save(HOST/f'fit-control-ride-{k}.avif', quality=46, speed=4)
        # Card pictures (whole creature) are built by build-companions.py from art-source/icons.
    return rider

if __name__ == '__main__':
    only = set(sys.argv[1:]); want = lambda n: not only or str(n) in only
    base = save('fit-control-mount-base', B, 62)
    if want('mounts') or not only:
        rider = build_mounts(); Image.fromarray((rider*255).astype(np.uint8)).save('/tmp/mounted-rider-mask.png')
    if only == {'mounts'}: sys.exit()
    for n in DRESSES:
        if want(n): build_dress(n)
    for i in HAIRS:
        if want(i): build_hair(i)
    sheet = Image.new('RGB', (1024*4, 936*((len(DRESSES)+3)//4)), '#dfe9ef')
    for k, n in enumerate(DRESSES):
        look = base.copy(); look.alpha_composite(Image.open(OUT/f'fit-control-mount-{n}.webp').convert('RGBA'))
        look.alpha_composite(Image.open(OUT/f'fit-control-mounthair-{HAIRS[(k*5+11) % len(HAIRS)]}.webp').convert('RGBA'))
        sheet.paste(look, ((k % 4)*1024, (k//4)*936), look)
    sheet.save('/tmp/mounted.png'); print('Built mounted layers; review /tmp/mounted.png')
