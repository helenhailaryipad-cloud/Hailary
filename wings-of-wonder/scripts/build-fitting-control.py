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
    frame.putalpha(ImageChops.multiply(frame.getchannel('A'),ImageChops.invert(polygon([(224,103),(238,96),(253,99),(270,104),(278,110),(278,120),(265,141),(250,153),(247,167),(226,164),(222,145),(218,132)],(500,800)))))
    frame.save(OUT/f'fit-control-hair-{i}.webp',lossless=True)
    frame.save(ROOT/'scripts/hosting-art'/f'fit-control-hair-{i}.avif',quality=75,speed=8)
    hairs[i]=frame

# Individually traced openings remove the old face, circlet, earrings and ears.
# Hair uses the same eye anchors as the immutable master, never a replacement head.
openings={
3:[(21,53),(53,63),(58,57),(75,54),(96,52),(104,24),(116,45),(121,59),(135,64),(136,91),(128,110),(109,122),(89,122),(72,111),(59,97),(49,103),(38,98),(43,86),(32,75)],
4:[(41,62),(69,70),(86,59),(98,42),(110,43),(121,51),(128,57),(134,67),(134,95),(127,111),(110,121),(92,118),(79,110),(70,99),(68,108),(58,117),(52,114),(50,104),(54,94),(49,84)],
5:[(22,56),(54,66),(62,56),(80,54),(90,37),(103,35),(118,47),(123,61),(132,69),(131,96),(124,112),(105,125),(87,121),(70,111),(60,98),(56,107),(50,108),(42,103),(46,91),(36,81)],
6:[(14,75),(44,80),(60,82),(77,73),(94,59),(111,45),(126,46),(134,61),(138,78),(139,106),(130,127),(114,140),(95,137),(75,124),(64,110),(59,120),(47,131),(40,128),(44,118),(49,112),(44,104),(33,96)],
7:[(14,53),(43,65),(55,57),(65,49),(76,28),(91,27),(101,47),(105,66),(116,83),(120,87),(116,106),(100,119),(81,122),(65,116),(51,105),(48,95),(40,104),(29,105),(29,95),(33,88),(25,79)],
8:[(37,46),(60,55),(73,45),(82,31),(95,24),(109,31),(117,45),(118,62),(111,79),(99,90),(84,88),(70,78),(64,71),(59,81),(53,88),(48,85),(49,75),(51,70),(43,62)],
9:[(12,59),(43,68),(57,68),(75,56),(89,39),(103,34),(117,41),(128,53),(129,67),(128,91),(119,113),(104,126),(88,123),(74,115),(60,104),(56,94),(51,108),(44,113),(36,109),(39,97),(37,88),(27,80)],
10:[(1,92),(29,98),(43,88),(55,71),(65,62),(78,60),(98,63),(113,71),(123,85),(124,105),(116,129),(102,145),(86,153),(67,149),(50,139),(40,127),(35,137),(26,145),(22,136),(28,126),(27,118),(13,109)]
}
eyes=[(81.38,79.2,118.19,88),(79.44,112,118.19,120.53),(82.34,75.35,122.06,83.72),(94.94,79.17,125.94,86.67),(81.38,78.4,117.22,86.4),(84.28,88.14,124,98.34),(77.5,74.94,110.44,82.83),(83.31,58.1,110.44,65.1),(79.89,82.76,118.39,90.38),(68.34,109.98,105.61,117.6)]
for i,opening in openings.items():
    source=Image.open(OUT/f'hair-style-{i}.webp').convert('RGBA')
    source.putalpha(ImageChops.multiply(source.getchannel('A'),ImageChops.invert(polygon(opening,source.size))))
    eye=eyes[i-1];scale=30.5/(eye[2]-eye[0])
    hair=source.resize((round(source.width*scale),round(source.height*scale)),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(500,800))
    frame.alpha_composite(hair,(round(239-eye[0]*scale),round(104-eye[1]*scale)))
    frame.putalpha(ImageChops.multiply(frame.getchannel('A'),ImageChops.invert(polygon([(224,103),(238,96),(253,99),(270,104),(278,110),(278,120),(265,141),(250,153),(247,167),(226,164),(222,145),(218,132)],(500,800)))))
    frame.save(OUT/f'fit-control-hair-{i}.webp',lossless=True)
    frame.save(ROOT/'scripts/hosting-art'/f'fit-control-hair-{i}.avif',quality=85,speed=8)
    hairs[i]=frame
contact=Image.new('RGB',(1250,800),'#223b54')
for index,hairid in enumerate(hairs):
    result=body.copy();result.alpha_composite(layers['grove']);result.alpha_composite(Image.open(OUT/'fit-control-hand.webp'));result.alpha_composite(hairs[hairid]);result.thumbnail((250,400));contact.paste(result,(250*(index%5),400*(index//5)),result)
contact.save('/tmp/fitting-hairs.jpg')
print('Built ten hair-only layers registered to one intact face and body.')

# These garments cover the legs. The body source remains intact; the renderer
# occludes skin beneath trousers/closed skirts so toes cannot protrude from shoes.
coverage={'frostlace':650,'dawnpetal':400,'nightbloom':400,'sunweave':450,'emberveil':420,'willow':450,'stardust':400,'pearl':450,'sapphire':400}
for id in ['dawnpetal','nightbloom','sunweave','tidal','emberveil','willow','stardust','pearl','sapphire']:
    path=SRC/(id+'.png')
    if not path.exists():continue
    layer=Image.open(path).convert('RGBA').resize(SIZE,Image.Resampling.LANCZOS)
    # Remove invisible resampling specks in the transparent area around clothes.
    layer.putalpha(layer.getchannel('A').point(lambda a: 0 if a < 3 else a))
    layers[id]=save(id,layer)
for id,layer in layers.items():
    icon=layer.crop(layer.getbbox());icon.thumbnail((128,146),Image.Resampling.LANCZOS)
    frame=Image.new('RGBA',(144,160));frame.alpha_composite(icon,((144-icon.width)//2,(160-icon.height)//2))
    frame.save(OUT/f'fit-icon-{id}.webp',lossless=True)
    frame.save(ROOT/'scripts/hosting-art'/f'fit-icon-{id}.avif',quality=80,speed=8)
contact=Image.new('RGB',(500*4,800*3),'#223b54')
from PIL import ImageFont
for index,(id,layer) in enumerate(layers.items()):
    result=body.copy()
    if id in coverage:result.paste((0,0,0,0),(0,coverage[id],500,800))
    result.alpha_composite(layer);result.alpha_composite(Image.open(OUT/'fit-control-hand.webp'));result.alpha_composite(hairs[(index%10)+1]);contact.paste(result,((index%4)*500,(index//4)*800),result)
    ImageDraw.Draw(contact).text(((index%4)*500+10,(index//4)*800+10),id,fill='white')
contact.save('/tmp/fitting-wardrobe.jpg')
# Combinations must keep face and hands identical and all visible art in frame.
for id,layer in layers.items():
 for hairid,hair in hairs.items():
    result=body.copy();result.alpha_composite(layer);result.alpha_composite(Image.open(OUT/'fit-control-hand.webp'));result.alpha_composite(hair)
    for point in [(239,104),(267,112),(247,145),(240,126),(250,136)]:
       assert result.getpixel(point)==body.getpixel(point),(id,hairid,point)
print(f'Checked fixed face pixels in {len(layers)*len(hairs)} dressed combinations.')
