import fs from 'node:fs';import {createRequire} from 'node:module';const require=createRequire(import.meta.url);const {createCanvas,loadImage,Path2D}=require('@napi-rs/canvas');import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const elements=new Map();function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',disabled:false,style:{setProperty(){}},setAttribute(name,value){this[name]=String(value)},classList:{add(){},remove(){},toggle(){}},close(){this.open=false},showModal(){this.open=true},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:720,height:520}}});return elements.get(key)}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Blob,URL,Promise,document:{body:{dataset:{},classList:{add(){},remove(){},contains(){return false}}},querySelector:el,addEventListener(){},createElement:()=>({click(){}})},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},fetch:async()=>({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/art-meta.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/generated-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/progression-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/fish-catalog.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/boss-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/dungeon-crawl.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/exp-dungeon.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/world.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/arena.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/game-polish.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/minigame-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/wardrobe-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);

context.Path2D=Path2D;context.document.createElement=tag=>tag==='canvas'?createCanvas(500,800):({click(){}});
context.loadImage=loadImage;context.root=process.cwd();
vm.runInContext(`styleImage=url=>loadImage(url.startsWith('data:')?url:root+'/src/'+url.split('?')[0]);`,context);
// Exercise the real compositor and decoded artwork, not only selection state.
const dresses=vm.runInContext('fittingDresses.map(x=>x[0])',context);
const body=await loadImage('src/assets/generated/fit-control-body.webp');
const reference=createCanvas(1000,1600),rctx=reference.getContext('2d');rctx.drawImage(body,0,80,1000,1500);
const samples=[[244,139],[239,145],[218,300]];
const pixel=(ctx,x,y)=>[...ctx.getImageData(x*2,y*2,1,1).data];
let checked=0;
for(const dress of dresses)for(let hair=1;hair<=11;hair++){
 const canvas=await vm.runInContext(`composeWardrobeCanvas('${dress}',${hair})`,context),ctx=canvas.getContext('2d');
 assert.equal(canvas.width,1000);assert.equal(canvas.height,1600);
 for(const [x,y] of samples){const got=pixel(ctx,x,y),want=pixel(rctx,x,y);assert.ok(got.every((v,i)=>Math.abs(v-want[i])<=3),`${dress}/${hair} changes protected anatomy at ${x},${y}: ${got} versus ${want}`);}
 checked++;
}
// Compound inverse paths must not carve a diagonal bridge into the sleeve.
const pearl=await vm.runInContext("composeWardrobeCanvas('pearl',2)",context),pctx=pearl.getContext('2d');
const garment=await loadImage('src/assets/generated/fit-control-pearl.webp');
const expected=createCanvas(1000,1600),ectx=expected.getContext('2d');ectx.drawImage(garment,0,0,1000,1600);
for(const [x,y]of [[145,223],[163,257],[179,282]])assert.ok(pixel(pctx,x,y).every((v,i)=>Math.abs(v-pixel(ectx,x,y)[i])<=3),'Kimono sleeve must stay intact');
const noBow=await vm.runInContext("composeWardrobeCanvas('leaflight',2,0)",context),withBow=await vm.runInContext("composeWardrobeCanvas('leaflight',2,11)",context);
assert.ok(pixel(withBow.getContext('2d'),360,300)[3]>pixel(noBow.getContext('2d'),360,300)[3],'Leaflight bowstring must render');
console.log(`PASS: ${checked} decoded dress/hair renders, fixed anatomy, intact kimono sleeve, visible bowstring.`);
function assertUnclipped(canvas,label){
 const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
 for(const [x,y,width,height] of [[0,0,w,1],[0,h-1,w,1],[0,0,1,h],[w-1,0,1,h]]){
  const data=ctx.getImageData(x,y,width,height).data;
  for(let i=3;i<data.length;i+=4)assert.ok(data[i]<200,`${label} has opaque artwork clipped at canvas edge`);
 }
}
const wingSheet=createCanvas(1250,800),ws=wingSheet.getContext('2d');ws.fillStyle='#223b54';ws.fillRect(0,0,1250,800);
for(let wings=1;wings<=10;wings++){
 const c=await vm.runInContext(`composeWardrobeCanvas('leaflight',11,11,'fashion-wing-${wings}')`,context);
 assertUnclipped(c,`Wings ${wings}`);ws.drawImage(c,(wings-1)%5*250,Math.floor((wings-1)/5)*400,250,400);
 ws.fillStyle='white';ws.font='14px sans-serif';ws.fillText(`Wings ${wings}`,(wings-1)%5*250+5,Math.floor((wings-1)/5)*400+390);
 // An identical protected face proves wings remain behind the body.
 for(const [x,y]of samples)assert.ok(pixel(c.getContext('2d'),x,y).every((v,i)=>Math.abs(v-pixel(rctx,x,y)[i])<=3),`Wings ${wings} cover anatomy`);
}
const weaponRenders=new Map();
const weaponSheet=createCanvas(1750,800),bs=weaponSheet.getContext('2d');bs.fillStyle='#223b54';bs.fillRect(0,0,1750,800);
for(let weapon=1;weapon<=13;weapon++){
 const c=await vm.runInContext(`composeWardrobeCanvas('pearl',2,${weapon})`,context);
 weaponRenders.set(weapon,c.toBuffer('image/png'));
 assertUnclipped(c,`Weapon ${weapon}`);bs.drawImage(c,(weapon-1)%7*250,Math.floor((weapon-1)/7)*400,250,400);
 bs.fillStyle='white';bs.font='14px sans-serif';bs.fillText(`Weapon ${weapon}`,(weapon-1)%7*250+5,Math.floor((weapon-1)/7)*400+390);
}
assert.deepEqual(weaponRenders.get(13),weaponRenders.get(11),'Classic gold uses full-resolution gold bow');
assert.deepEqual(weaponRenders.get(12),weaponRenders.get(2),'Classic ice uses full-resolution ice bow');
fs.writeFileSync('/tmp/wardrobe-wing-review.png',wingSheet.toBuffer('image/png'));
fs.writeFileSync('/tmp/wardrobe-weapon-review.png',weaponSheet.toBuffer('image/png'));
console.log('PASS: 10 wing and 13 weapon renders, protected anatomy and no opaque canvas-edge clipping.');
