"""Pixel-accurate wardrobe layers (v2).

The older fitting layers were cut with hand-traced polygons, which left hard
edges, slivers of the base bodysuit and a pasted polygonal hand. This builder
derives each layer per pixel instead:

* Dresses painted on the fixed base body (Emerald Leaves, Leaflight) are
  extracted as "every pixel that differs from the base body". Compositing the
  layer over the unchanged body reproduces the original painting exactly, so
  the neck, shoulders and the hand on the hip need no masks at all.
* The hand that rests on the hip is matted from the base body by colour
  (skin vs. bodysuit) for garment-only art that covers the hip.
* Hair layers cut from head portraits get their polygon gaps next to the
  ear/temple filled with hair colour and stray remnants removed.

Requires Pillow (with WebP + AVIF) and NumPy. Run from the project root:
    python3 scripts/build-fitting-v2.py
Review the contact sheets it writes to /tmp before committing changed assets.
"""
from pathlib import Path
from collections import deque
import re
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts/art-source'
OUT = ROOT / 'src/assets/generated'
HOST = ROOT / 'scripts/hosting-art'
FRAME = (500, 800)
BODY_SIZE = (500, 750)
BODY_Y = 40

# ---------- helpers ----------
def arr(im): return np.array(im.convert('RGBA')).astype(np.float32)
def img(a): return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')
def to_frame(im):
    im = im.convert('RGBA')
    if im.size == FRAME: return im
    if im.size != BODY_SIZE: im = im.resize(BODY_SIZE, Image.Resampling.LANCZOS)
    fr = Image.new('RGBA', FRAME); fr.alpha_composite(im, (0, BODY_Y)); return fr
def dilate(m, r=1): return np.array(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MaxFilter(2*r+1))) > 127
def erode(m, r=1): return np.array(Image.fromarray((m*255).astype(np.uint8)).filter(ImageFilter.MinFilter(2*r+1))) > 127
def flood(mask, seeds):
    h, w = mask.shape; out = np.zeros_like(mask, bool); q = deque()
    for x, y in seeds:
        if 0 <= x < w and 0 <= y < h and mask[y, x] and not out[y, x]: out[y, x] = True; q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):
            nx, ny = x+dx, y+dy
            if 0 <= nx < w and 0 <= ny < h and mask[ny, nx] and not out[ny, nx]: out[ny, nx] = True; q.append((nx, ny))
    return out
def components(mask):
    seen = np.zeros_like(mask, bool)
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]: continue
        c = flood(mask & ~seen, [(x, y)]); seen |= c; yield c
def keep_big(mask, minarea):
    out = np.zeros_like(mask)
    for c in components(mask):
        if c.sum() >= minarea: out |= c
    return out
def fill_holes(mask, maxarea):
    out = mask.copy()
    for c in components(~mask):
        if c.sum() <= maxarea and not (c[0].any() or c[-1].any() or c[:, 0].any() or c[:, -1].any()): out |= c
    return out
def path_points(d):
    toks = re.findall(r'[MLQHVZ]|-?\d+\.?\d*', d); subs = []; pts = []; i = 0; cur = (0, 0); cmd = None
    while i < len(toks):
        if toks[i] in 'MLQHVZ': cmd = toks[i]; i += 1
        if cmd == 'Z':
            if pts: subs.append(pts); pts = []
            continue
        if cmd == 'M':
            if pts: subs.append(pts); pts = []
            cur = (float(toks[i]), float(toks[i+1])); i += 2; pts.append(cur); cmd = 'L'
        elif cmd == 'L': cur = (float(toks[i]), float(toks[i+1])); i += 2; pts.append(cur)
        elif cmd == 'H': cur = (float(toks[i]), cur[1]); i += 1; pts.append(cur)
        elif cmd == 'V': cur = (cur[0], float(toks[i])); i += 1; pts.append(cur)
        elif cmd == 'Q':
            c = (float(toks[i]), float(toks[i+1])); e = (float(toks[i+2]), float(toks[i+3])); i += 4
            for t in np.linspace(0, 1, 13)[1:]:
                pts.append(((1-t)**2*cur[0]+2*(1-t)*t*c[0]+t*t*e[0], (1-t)**2*cur[1]+2*(1-t)*t*c[1]+t*t*e[1]))
            cur = e
    if pts: subs.append(pts)
    return subs
def path_mask(d, size):
    m = Image.new('L', size, 0); dr = ImageDraw.Draw(m)
    for s in path_points(d): dr.polygon(s, fill=255)
    return np.array(m) > 127
def poly_mask(points, size=FRAME):
    m = Image.new('L', size, 0); ImageDraw.Draw(m).polygon(points, fill=255); return np.array(m) > 127
def diff(p, b):
    """Largest channel difference with both images composited on mid grey."""
    def comp(a): al = a[..., 3:4]/255; return a[..., :3]*al + 128*(1-al)
    return np.abs(comp(p)-comp(b)).max(-1)
def save(name, im, quality=80):
    im.save(OUT/(name+'.webp'), lossless=True)
    im.save(HOST/(name+'.avif'), quality=quality, speed=4)   # compact copy for the hosted bundle
    return im
def suit_mask(a):
    R, G, B, A = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
    return (A > 128) & (R-G < 40) & (R > 150) & (R-B > 20) & (R-B < 75)
def bodysuit(a):
    """The torso bodysuit only: the largest cream region (not eye whites or highlights)."""
    best = None
    for c in components(dilate(erode(suit_mask(a), 1), 1)):
        if best is None or c.sum() > best.sum(): best = c
    return best
def skin_like(a):
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    return (a[..., 3] > 128) & (R-G > 42) & (R > 170) & (G-B > 10) & (G > 120)

body_hi = Image.open(SRC/'fitting-control/base-v2.png').convert('RGBA')
body = to_frame(Image.open(OUT/'fit-control-body.webp'))
B = arr(body)

# ---------- hand resting on the hip ----------
def build_hand():
    suit = suit_mask(B); yy, xx = np.mgrid[0:800, 0:500]
    roi = (xx >= 186) & (xx <= 252) & (yy >= 274) & (yy <= 328)
    R, G = B[..., 0], B[..., 1]
    # pale anti-aliased pixels touching the bodysuit are suit, not hand
    pale = dilate(suit, 1) & (R-G < 52) & (R > 190)
    hand = flood((B[..., 3] > 40) & ~dilate(erode(suit, 1), 1) & ~pale & roi, [(215, 300)])
    wrist = 204-(yy-280)*0.28                      # soft start inside any cuff
    fade = np.clip((xx-(wrist-7))/7, 0, 1)
    out = B.copy(); out[..., 3] = np.where(hand, B[..., 3], 0)*fade
    return save('fit-control-hand', img(out))

# ---------- outfits painted on the fixed base body ----------
def painted_layer(P, Bb, allow=None):
    """Split a full-figure painting made on the base body into the garment
    layer and the body pixels it hides.

    Garment = every pixel that differs from the base body, followed outwards
    through faint differences (sheer cloth over skin). The head is never
    repainted. Wherever the painting is empty but the base body is not (a calf
    wider than its boot, bare toes), the body must be hidden: that is `erase`.
    Compositing body-minus-erase plus the garment reproduces the painting.
    """
    H, W = P.shape[:2]; k = W/500; r = lambda v: max(1, round(v*k))
    yy = np.mgrid[0:H, 0:W][0]
    head = (Bb[..., 3] > 40) & (yy < (148-BODY_Y)*H/750 + (BODY_Y if H == 800 else 0))
    ok = ~head if allow is None else (allow & ~head)
    d = diff(P, Bb)
    core = keep_big(dilate(erode((d > 20) & ok, 1), 1), int(150*k*k))
    grown = core.copy()
    # Faint differences on bare skin are repaint noise, not cloth: only follow
    # them when they are clear (a shadow the garment casts) or not skin at all.
    faint = (d > 5) & ((d > 12) | ~(skin_like(P) & skin_like(Bb)))
    for _ in range(r(12)): grown |= dilate(grown, 1) & faint & ok
    m = core | (dilate(erode(grown, r(1.5)), r(1.5)) & grown)     # no hairline tendrils
    m |= dilate(bodysuit(Bb), r(5)) & (P[..., 3] > 0) & ok          # the bodysuit never shows
    m |= dilate(m, r(5)) & (Bb[..., 3] < 8) & (P[..., 3] > 0) & ok  # soft outer edges stay soft
    m = fill_holes(m, int(150*k*k))
    # Real hidden areas are several pixels wide; one-pixel rims where the two
    # silhouettes merely anti-alias differently are left alone.
    raw = (Bb[..., 3] > 0) & (P[..., 3] < 60) & dilate(m, r(10)) & ok
    solid = keep_big(dilate(erode(raw, r(1)), r(1)) & raw, int(12*k*k))
    erase = dilate(solid, r(1)) & raw
    # Around boots and shoes the body's own soft outline would glow beside the leather.
    low = yy > (H*0.55)
    erase |= raw & low & dilate(m, r(3))
    return m, erase
def save_painted(name, P, m, erase):
    out = P.copy(); out[..., 3] = np.where(m, P[..., 3], 0)
    layer = save('fit-control-'+name, to_frame(img(out)), 72)
    icon = layer.crop(layer.getbbox()); icon.thumbnail((128, 146), Image.Resampling.LANCZOS)
    tile = Image.new('RGBA', (144, 160)); tile.alpha_composite(icon, ((144-icon.width)//2, (160-icon.height)//2))
    if name != 'leaflight': save('fit-icon-'+name, tile)     # wardrobe card picture
    e = np.zeros_like(P); e[..., 3] = np.where(erase, 255, 0)
    save('fit-control-'+name+'-erase', to_frame(img(e)), 50)
    return layer

def build_grove():      # Emerald Leaves, painted at 500 x 750
    P = arr(to_frame(Image.open(SRC/'fitting-control/a.png')))
    m, erase = painted_layer(P, B)
    m[146:153, 208:215] = False     # retouch: a stray stub poking above the collar rim
    return save_painted('grove', P, m, erase)

def build_frostlace():  # Amethyst Lace, painted at 500 x 750
    P = arr(to_frame(Image.open(SRC/'fitting-control/b.png')))
    return save_painted('frostlace', P, *painted_layer(P, B))

PAINTED = ['emberveil', 'dawnpetal', 'nightbloom', 'sunweave', 'tidal', 'willow', 'stardust', 'pearl', 'sapphire']
def build_painted(name):  # repainted on the base body at 1024 x 1536
    P = arr(Image.open(SRC/'fitting-control/painted'/(name+'.png')))
    return save_painted(name, P, *painted_layer(P, arr(body_hi)))

# ---------- Leaflight: painted on the base body at 1024 x 1536, with hair and bow ----------
LEAF = {
 'dress': 'M351 270 Q369 268 391 287 Q413 323 450 338 Q493 354 542 358 Q577 357 598 338 L592 297 L603 299 Q624 329 625 362 L616 414 L594 476 L612 530 L623 583 Q640 616 647 655 L672 730 L688 798 L703 868 L708 944 L707 1010 L700 1078 L690 1108 L699 1248 L700 1536 H70 V1130 L123 1004 L166 908 L185 836 L215 778 L270 750 L285 700 L310 627 L363 583 L408 542 L435 490 L426 445 L408 412 L395 389 Q397 355 384 318 L369 290 Z',
 'bow': 'M766 93 H897 V1173 H675 V1058 L694 1035 L733 979 L769 912 L787 848 L788 812 L774 789 L749 771 L757 742 L782 729 L788 589 L778 578 L764 552 L777 515 L801 481 L822 438 L831 387 L830 337 L803 265 L781 215 L763 181 Z',
 'hairBack': 'M350 100 L430 140 L444 218 L419 290 L405 358 L401 416 L369 470 L337 509 L305 541 L310 579 L291 613 L286 665 L290 736 L177 742 L171 627 L216 592 L230 549 L264 499 L306 432 L322 365 L337 293 L348 238 L340 182 Z',
 'hairFront': 'M315 0 H640 V260 H540 L548 231 Q558 234 568 234 Q552 216 565 192 Q579 165 564 137 Q541 124 517 91 Q499 66 478 69 Q455 70 442 94 Q426 119 413 124 L370 106 Q364 109 374 119 L399 143 L404 170 L377 162 L337 134 Z',
}
def build_leaflight():
    master = Image.open(SRC/'leaflight/master.png').convert('RGBA')
    M, Bh = arr(master), arr(body_hi); d = diff(M, Bh); H, W = d.shape
    R, G, Bl = M[..., 0], M[..., 1], M[..., 2]
    purple = (Bl > G+6) & (R > G-5) & (d > 30)
    hair_seed = dilate(erode(purple, 2), 4)
    lilac = dilate((Bl > G+6) & (R > G-5) & (d > 12), 2)
    bow = dilate(path_mask(LEAF['bow'], (W, H)), 2)
    # The bowstring crosses the skirt edge; keep a band around it out of the dress.
    yy, xx = np.mgrid[0:H, 0:W]
    sx0, sy0, sx1, sy1 = 375.49*W/500, (123.5-BODY_Y)*H/750, 336.43*W/500, (567.83-BODY_Y)*H/750
    string = (np.abs(xx-(sx0+(yy-sy0)*(sx1-sx0)/(sy1-sy0))) < 7) & (yy > sy0) & (yy < sy1)
    zone = dilate(path_mask(LEAF['dress'], (W, H)), 5) & ~bow & ~string
    dress, erase = painted_layer(M, Bh, zone & ~hair_seed & ~lilac)
    save_painted('leaflight', M, dress, erase)
    # Lavender Braid: every hair pixel of the same painting, drawn in front.
    hzone = dilate(path_mask(LEAF['hairBack'], (W, H)) | path_mask(LEAF['hairFront'], (W, H)), 8) & ~bow
    # Hair is everything painted there except skin (the braid shades the arm)
    # and the gold dress straps it crosses.
    skinish = (R-G > 35) & (G-Bl > 8) & (G-Bl < 58) & (R > 120)
    strap = dilate(zone, 14) & (((R-Bl > 60) & (R > 150)) | ((G > R+5) & (G > Bl+5)))
    cand = dilate(erode((d > 14) & hzone & ~dress & ~skinish & ~strap, 1), 1)
    hair = np.zeros_like(cand)
    for c in components(cand):
        if c.sum() >= 300 and (c & purple).sum() > 0.2*c.sum(): hair |= c
    hair = fill_holes(hair, 200) & ~dress & ~dilate(strap, 1)
    hair |= dilate(hair, 1) & (d > 8) & hzone & ~dress & ~skinish & ~strap
    ho = M.copy(); ho[..., 3] = np.where(hair, M[..., 3], 0)
    save('fit-control-hair-11', to_frame(img(ho)))

LEAF['grip'] = 'M746 639 Q767 633 784 644 Q798 638 813 647 Q839 655 837 680 Q840 701 820 718 Q800 733 781 721 Q761 712 752 692 Q741 675 746 639 Z'
def build_leaf_bow():
    """Leafwind bow and the fingers gripping it; the renderer clips them by path."""
    master = Image.open(SRC/'leaflight/master.png').convert('RGBA'); M = arr(master); H, W = M.shape[:2]
    keep = dilate(path_mask(LEAF['bow'], (W, H)) | path_mask(LEAF['grip'], (W, H)), 4)
    M[..., 3] = np.where(keep, M[..., 3], 0)
    save('fit-control-bow-11', to_frame(img(M)))

# ---------- portrait hair: fill polygon gaps, drop remnants ----------
OPENINGS = {
 3: [(21,53),(53,63),(58,57),(75,54),(96,52),(104,24),(116,45),(121,59),(135,64),(136,91),(128,110),(109,122),(89,122),(72,111),(59,97),(49,103),(38,98),(43,86),(32,75)],
 9: [(12,59),(43,68),(57,68),(75,56),(89,39),(103,34),(117,41),(128,53),(129,67),(128,91),(119,113),(104,126),(88,123),(74,115),(60,104),(56,94),(51,108),(44,113),(36,109),(39,97),(37,88),(27,80)],
 10: [(1,92),(29,98),(43,88),(55,71),(65,62),(78,60),(98,63),(113,71),(123,85),(124,105),(116,129),(102,145),(86,153),(67,149),(50,139),(40,127),(35,137),(26,145),(22,136),(28,126),(27,118),(13,109)],
}
EYES = {3: (82.34, 75.35, 122.06, 83.72), 9: (79.89, 82.76, 118.39, 90.38), 10: (68.34, 109.98, 105.61, 117.6)}
REMNANTS = {10: [(200, 115)]}          # seeds of stray hair fragments to delete
def build_hair(i):
    src = Image.open(OUT/f'hair-style-{i}.webp').convert('RGBA')
    eye = EYES[i]; scale = 30.5/(eye[2]-eye[0]); ox, oy = round(239-eye[0]*scale), round(104-eye[1]*scale)
    opening = poly_mask([(x*scale+ox, y*scale+oy) for x, y in OPENINGS[i]])
    # Rebuild the traced layer from the portrait exactly as build-fitting-control.py
    # does, so this step never depends on its own earlier output.
    def soft_poly(points, size):
        m = Image.new('L', (size[0]*4, size[1]*4)); ImageDraw.Draw(m).polygon([(x*4, y*4) for x, y in points], fill=255)
        return m.resize(size, Image.Resampling.LANCZOS)
    from PIL import ImageChops
    src.putalpha(ImageChops.multiply(src.getchannel('A'), ImageChops.invert(soft_poly(OPENINGS[i], src.size))))
    scaled = src.resize((round(src.width*scale), round(src.height*scale)), Image.Resampling.LANCZOS)
    hair = Image.new('RGBA', FRAME); hair.alpha_composite(scaled, (ox, oy))
    face = [(224,103),(238,96),(253,99),(270,104),(278,110),(278,120),(265,141),(250,153),(247,167),(226,164),(222,145),(218,132)]
    hair.putalpha(ImageChops.multiply(hair.getchannel('A'), ImageChops.invert(soft_poly(face, FRAME))))
    A = arr(hair); alpha = A[..., 3] > 60
    for seed in REMNANTS.get(i, []):
        near = [(seed[0]+dx, seed[1]+dy) for dx in range(-3, 4) for dy in range(-3, 4)]
        A[flood(alpha, near)] = 0
    alpha = A[..., 3] > 60
    yy = np.mgrid[0:800, 0:500][0]
    # Where the old portrait face was cut away but the fixed head does not
    # reach, the background showed through: that is hair behind the ear/temple.
    # stray specks left by the soft polygon edge (earrings are far larger)
    for c in components(A[..., 3] > 20):
        if c.sum() < 30: A[c] = 0
    alpha = A[..., 3] > 60
    # Only gaps that sit between hair and the head/ear are hair; anything
    # open to the background outside the hairstyle's silhouette stays empty.
    solid = B[..., 3] >= 128
    def look(mask, dx, dy, reach=10):
        out = np.zeros_like(mask)
        for k in range(1, reach+1): out |= np.roll(np.roll(mask, dy*k, 0), dx*k, 1)
        return out
    up, down, left, right = look(alpha, 0, 1), look(alpha, 0, -1), look(alpha, 1, 0), look(alpha, -1, 0)
    bup, bdown, bleft, bright = look(solid, 0, 1), look(solid, 0, -1), look(solid, 1, 0), look(solid, -1, 0)
    between = (up & (down | bdown)) | (down & bup) | (left & (right | bright)) | (right & bleft)
    gap = dilate(opening, 3) & ~alpha & ~solid & between & (yy < 124)
    known = alpha.copy(); col = A.copy()
    for _ in range(40):
        todo = gap & ~known & dilate(known, 1)
        if not todo.any(): break
        acc = np.zeros_like(col); cnt = np.zeros(col.shape[:2], np.float32)
        for dx in (-1, 0, 1):
            for dy in (-1, 0, 1):
                k = np.roll(np.roll(known, dy, 0), dx, 1); c = np.roll(np.roll(col, dy, 0), dx, 1)
                acc += c*k[..., None]; cnt += k
        col[todo] = acc[todo]/cnt[todo][:, None]; known |= todo
    filled = gap & known
    col[filled, :3] *= 0.86; col[filled, 3] = 255
    A[filled] = col[filled]
    rim = dilate(filled, 2) & (A[..., 3] > 60) & (B[..., 3] < 128)  # no dotted seam around the fill
    A[rim, 3] = 255
    return save(f'fit-control-hair-{i}', img(A))

if __name__ == '__main__':
    import sys
    only = set(sys.argv[1:])
    want = lambda n: not only or n in only
    if want('grove'): build_grove()
    if want('frostlace'): build_frostlace()
    if want('leaflight'): build_leaflight(); build_leaf_bow()
    for name in PAINTED:
        if want(name): build_painted(name)
    for i in (3, 9, 10):
        if want('hair'): build_hair(i)
    names = ['leaflight', 'grove', 'frostlace'] + PAINTED
    sheet = Image.new('RGB', (500*6, 800*2), '#dfe9ef')
    for i, name in enumerate(names):
        er = np.array(Image.open(OUT/f'fit-control-{name}-erase.webp').convert('RGBA'))[..., 3] > 127
        bb = B.copy(); bb[er, 3] = 0
        look = img(bb); look.alpha_composite(Image.open(OUT/f'fit-control-{name}.webp').convert('RGBA'))
        look.alpha_composite(Image.open(OUT/f'fit-control-hair-{(3, 9, 10, 11)[i % 4]}.webp').convert('RGBA'))
        sheet.paste(look, ((i % 6)*500, (i//6)*800), look)
    sheet.save('/tmp/fitting-v2.png')
    print('Built pixel-accurate layers; review /tmp/fitting-v2.png')
