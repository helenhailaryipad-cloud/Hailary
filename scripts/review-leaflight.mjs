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
const combinations=[['leaflight',11,11],['leaflight',11,0],['leaflight',2,3],['pearl',11,11]];
const sheet=createCanvas(2000,800),ctx=sheet.getContext('2d');ctx.fillStyle='#223b54';ctx.fillRect(0,0,2000,800);
for(let i=0;i<combinations.length;i++){
 const [dress,hair,bow]=combinations[i];
 const url=await vm.runInContext(`renderRegisteredLook('${dress}',${hair},${bow})`,context);
 const img=await loadImage(url);ctx.drawImage(img,i*500,0,500,800);
 ctx.fillStyle='white';ctx.font='16px sans-serif';ctx.fillText(combinations[i].join(' / '),i*500+10,790);
}
fs.writeFileSync('/tmp/leaflight-review.png',sheet.toBuffer('image/png'));
console.log('Rendered four mixed sets with the production compositor');
