/* Registered paper-doll compositor. Art is data; anatomy is never re-fitted. */
(function(root){
 'use strict';
 const frame=Object.freeze({width:500,height:800,body:Object.freeze([0,40,500,750]),anchors:Object.freeze({neck:[231,162],back:[240,206],hand:[218,300],grip:[390,375]})});
 const slots=Object.freeze(['wingsBack','hairBack','garmentBack','body','boots','garmentFront','sleeves','handFront','weapon','gripFingers','hairFront','accessoriesFront']);
 const items=new Map();
 function register(item){
  if(!item||!item.id||!['dress','hair','weapon','wings'].includes(item.kind))throw Error('Invalid wardrobe item');
  if(item.frame&&(item.frame[0]!==500||item.frame[1]!==800))throw Error('Wardrobe frame must be 500 x 800');
  if(!Array.isArray(item.layers)||!item.layers.length)throw Error('Missing wardrobe layers');
  for(const layer of item.layers){
   if(!slots.includes(layer.slot)||!layer.asset)throw Error('Invalid wardrobe layer');
   if(layer.slot==='body')throw Error('Items cannot replace the body');
   if(layer.rect&&(!layer.rect.every(Number.isFinite)||layer.rect[2]<=0||layer.rect[3]<=0))throw Error('Invalid layer rectangle');
  }
  if(items.has(item.id))throw Error('Duplicate wardrobe item '+item.id);
  const copy=JSON.parse(JSON.stringify({...item,frame:[500,800]}));
  function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
  items.set(item.id,freeze(copy));return items.get(item.id);
 }
 const full='M0 0 H500 V800 H0 Z';
 function clip(ctx,value,inverse=false){
  if(!value)return;
  let p;
  if(typeof value==='object'){p=new Path2D();p.addPath(new Path2D(value.path),value.matrix);}
  else p=new Path2D(value);
  if(inverse){
   // Keep independent subpaths independent in browser and Skia renderers.
   // Some Canvas implementations join addPath's first contour to (0,0).
   const outer=typeof value==='string'?new Path2D(full+' '+value):new Path2D(full);
   if(typeof value!=='string')outer.addPath(p);
   ctx.clip(outer,'evenodd');
  }else ctx.clip(p);
 }
 async function render({dress,hair,weapon,wings,scale=2,load,createCanvas,body,bodyLayers=[],pad=0}){
  if(!Number.isFinite(scale)||scale<1||scale>4)throw Error('Invalid wardrobe scale');
  const selected=[dress,hair,weapon,wings].filter(Boolean).map(id=>{const it=items.get(id);if(!it)throw Error('Unknown wardrobe item '+id);return it;});
  const layers=[{slot:'body',asset:body,rect:frame.body},...selected.flatMap(it=>it.layers),...bodyLayers];
  const images=new Map(await Promise.all([...new Set([...layers.map(it=>it.asset),...selected.map(it=>it.bodyErase).filter(Boolean)])].map(async id=>[id,await load(id)])));
  // Nothing is returned until the complete dressed scene is decoded.
  // `pad` adds transparent room on both sides (frame units) so large wings are not clipped;
  // the 500 x 800 figure stays centred and the same size.
  const canvas=createCanvas((500+2*pad)*scale,800*scale),ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.translate(pad,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  const coverage=selected.filter(it=>it.kind==='dress').flatMap(it=>it.bodyCoverage||[]);
  // Per-pixel masks of body parts the outfit hides (a calf wider than its boot, bare toes).
  const erase=selected.filter(it=>it.kind==='dress'&&it.bodyErase).map(it=>images.get(it.bodyErase));
  for(const layer of layers.map((it,index)=>({...it,index})).sort((a,b)=>slots.indexOf(a.slot)-slots.indexOf(b.slot)||a.index-b.index)){
   const image=images.get(layer.asset);
   if(layer.slot==='body'&&erase.length){
    // Cut the hidden parts out of the body alone, never out of wings or hair behind it.
    const own=createCanvas(500*scale,800*scale),b=own.getContext('2d');b.scale(scale,scale);
    b.imageSmoothingEnabled=true;b.imageSmoothingQuality='high';
    b.save();for(const mask of coverage)clip(b,mask,true);b.drawImage(image,...(layer.rect||[0,0,500,800]));b.restore();
    b.globalCompositeOperation='destination-out';for(const mask of erase)b.drawImage(mask,0,0,500,800);
    ctx.drawImage(own,0,0,500,800);continue;
   }
   ctx.save();
   if(layer.slot==='body')for(const mask of coverage)clip(ctx,mask,true);
   for(const mask of layer.exclude||[])clip(ctx,mask,true);
   for(const mask of layer.clips||[])clip(ctx,mask);
   if(layer.clip)clip(ctx,layer.clip);
   if(layer.transform){const t=layer.transform;ctx.translate(t.x,t.y);ctx.rotate(t.rotation||0);ctx.scale(t.flipX?-1:1,1);}
   let rect=layer.rect||[0,0,500,800];
   if(layer.fit){const [x,y,w,h]=layer.fit;const k=Math.min(w/image.width,h/image.height);rect=[x+(w-image.width*k)/2,Math.max(layer.minTop??-Infinity,y+(h-image.height*k)/2),image.width*k,image.height*k];}
   if(layer.handle){const h=layer.handle,k=h.height/image.height;rect=[-image.width*k*h.x,-image.height*k*h.y,image.width*k,image.height*k];}
   if(!layer.strokeOnly)ctx.drawImage(image,...rect);
   if(layer.stroke){ctx.strokeStyle=layer.stroke.color;ctx.lineWidth=layer.stroke.width;ctx.stroke(new Path2D(layer.stroke.path));}
   ctx.restore();
  }
  return canvas;
 }
 root.WonderWardrobe=Object.freeze({frame,slots,register,get:id=>items.get(id),list:()=>[...items.values()],render});
})(globalThis);
