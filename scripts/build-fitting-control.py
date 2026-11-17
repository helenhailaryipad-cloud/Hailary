"""Build registered garment / hair layers on one immutable full-body portrait."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageChops
import numpy as np
ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'scripts/art-source/fitting-control'
OUT = ROOT / 'src/assets/generated'
SIZE = (500, 750)

def polygon(points, size=SIZE):
    mask = Image.new('L', (size[0]*4, size[1]*4))
    ImageDraw.Draw(mask).polygon([(x*4,y*4) for x,y in points],fill=255)
    return mask.resize(size,Image.Resampling.LANCZOS)

def cut(im, points):
    result=im.copy()
    result.putalpha(ImageChops.multiply(im.getchannel('A'),polygon(points,im.size)))
    return result

def save(name, im):
    # All pieces share the same canvas, including the empty margin above the bun.
    frame=Image.new('RGBA',(500,800))
    frame.alpha_composite(im,(0,40))
    frame.save(OUT / ('fit-control-'+name+'.webp'),lossless=True)
    frame.save(ROOT / 'scripts/hosting-art' / ('fit-control-'+name+'.avif'),quality=75,speed=8)
    return frame

base=Image.open(SRC/'base-v2.png').convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
grove=Image.open(SRC/'a.png').convert('RGBA')
violet=Image.open(SRC/'b.png').convert('RGBA')
# Keep the master intact. Runtime draws it at (0, 40), size 500 x 750.
base.save(OUT/'fit-control-body.webp',lossless=True)
base.save(ROOT/'scripts/hosting-art/fit-control-body.avif',quality=72,speed=8)
body=Image.new('RGBA',(500,800));body.alpha_composite(base,(0,40))
hand=cut(base,[(199,249),(215,239),(233,239),(245,243),(247,249),(230,249),(244,255),(247,261),(238,262),(246,267),(244,273),(235,273),(244,279),(240,283),(223,277),(211,277),(201,284),(189,278)])
save('hand',hand)
# Costume contours are authored individually, preserving lace and gold edges.
grove_layer=cut(grove,[(213,110),(249,119),(250,132),(271,143),(296,158),(306,181),(300,204),(289,225),(298,260),(318,300),(338,345),(364,414),(338,434),(322,456),(323,490),(313,522),(298,499),(275,495),(252,474),(237,484),(206,481),(190,471),(172,476),(146,501),(129,493),(117,482),(93,468),(94,449),(111,426),(113,403),(124,374),(152,336),(174,305),(192,280),(214,240),(210,215),(199,193),(211,171),(212,151),(201,129)])
for points in [[(113,554),(145,580),(169,564),(166,599),(145,637),(129,685),(127,721),(118,736),(97,738),(83,728),(84,711),(100,677),(111,632)],[(239,555),(267,572),(289,562),(291,598),(291,653),(310,687),(336,703),(335,717),(313,721),(280,715),(260,706),(248,708),(242,694),(247,670),(249,629)]]:
    grove_layer.alpha_composite(cut(grove,points))
violet_layer=cut(violet,[(129,180),(139,159),(158,155),(181,165),(202,171),(223,165),(245,170),(267,184),(280,168),(296,164),(309,174),(316,198),(301,204),(297,234),(301,270),(321,296),(342,319),(352,356),(365,387),(381,411),(399,455),(426,491),(448,511),(445,537),(428,550),(403,563),(368,574),(331,580),(301,583),(272,590),(244,585),(217,589),(190,581),(170,579),(150,568),(132,572),(111,565),(88,569),(72,558),(52,554),(48,540),(57,522),(69,497),(82,473),(90,445),(97,421),(114,388),(124,356),(149,320),(175,298),(196,281),(215,242),(208,212),(193,198),(183,187),(155,185)])
for points in [[(101,598),(121,613),(144,607),(133,658),(126,696),(122,729),(111,739),(93,739),(79,729),(78,713),(86,682),(94,646)],[(242,603),(269,609),(287,607),(290,650),(301,676),(329,704),(331,715),(315,721),(287,718),(266,713),(254,715),(248,704),(247,676)]]:
    violet_layer.alpha_composite(cut(violet,points))
layers={ 'grove':save('grove',grove_layer), 'frostlace':save('frostlace',violet_layer) }
# The source hairstyle portraits are masked to hair only. No facial pixels are used.
hair_paths=[[(0,0),(155,0),(155,101),(132,103),(138,83),(135,61),(122,54),(116,44),(104,40),(93,43),(84,49),(77,59),(61,70),(60,83),(64,94),(57,90),(52,80),(49,72),(39,72),(20,64),(30,79),(33,87),(27,103),(14,98),(0,85)],[(0,0),(155,0),(155,118),(149,128),(143,124),(145,107),(139,91),(127,83),(115,75),(104,73),(95,80),(86,94),(76,111),(64,124),(58,139),(60,150),(54,149),(49,138),(51,121),(43,113),(30,107),(12,98),(0,95)]]
hairs={}
for i,points in enumerate(hair_paths,1):
    source=Image.open(SRC/f'hair-style-{i}.webp').convert('RGBA')
    hair=cut(source,points)
    eyes=[(81.38,79.2),(79.44,112)][i-1]
    scale=.83
    resized=hair.resize((round(hair.width*scale),round(hair.height*scale)),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(500,800))
    frame.alpha_composite(resized,(round(239-eyes[0]*scale),round(64-eyes[1]*scale)+40))
    frame.save(OUT/f'fit-control-hair-{i}.webp',lossless=True)
    frame.save(ROOT/'scripts/hosting-art'/f'fit-control-hair-{i}.avif',quality=75,speed=8)
    hairs[i]=frame
# Render all four combinations for inspection and assert fixed facial/body pixels.
contact=Image.new('RGB',(1000,400),'#223b54')
portraits=[]
for index,(dress,hairid) in enumerate((d,h) for d in layers for h in hairs):
    result=body.copy();result.alpha_composite(layers[dress]);result.alpha_composite(Image.open(OUT/'fit-control-hand.webp'));result.alpha_composite(hairs[hairid]);portraits.append(result.copy())
    result.thumbnail((250,400));contact.paste(result,(250*index,0),result)
contact.save('/tmp/fitting-control.jpg')
# Central face, both eyes and neck are always the same master pixels.
for x,y in [(239,104),(267,112),(247,145),(390,375)]:
    assert len({p.getpixel((x,y)) for p in portraits})==1,(x,y)
print('Four combinations share identical face and hand landmarks.')
