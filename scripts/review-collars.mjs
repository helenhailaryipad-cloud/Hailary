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
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);

context.Path2D=Path2D;context.document.createElement=tag=>tag==='canvas'?createCanvas(500,800):({click(){}});
context.loadImage=loadImage;context.root=process.cwd();
vm.runInContext(`styleImage=url=>loadImage(url.startsWith('data:')?url:root+'/src/'+url.split('?')[0]);`,context);
const names=['dawnpetal','nightbloom','sunweave','tidal','emberveil','willow','stardust','pearl','sapphire','grove','frostlace'];
const sheet=createCanvas(1650,600),ctx=sheet.getContext('2d');ctx.fillStyle='#223b54';ctx.fillRect(0,0,1650,600);
for(let i=0;i<names.length;i++){
 const image=await loadImage(await vm.runInContext(`composeRegisteredReina('${names[i]}',2)`,context));
 const x=(i%6)*275,y=Math.floor(i/6)*300;ctx.drawImage(image,180,120,110,100,x,y,275,250);
 ctx.fillStyle='white';ctx.font='14px sans-serif';ctx.fillText(names[i],x+10,y+280);
}
fs.writeFileSync('/tmp/garment-necks.png',sheet.toBuffer('image/png'));
