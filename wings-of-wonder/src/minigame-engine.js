/* Mini-game simulation and presentation. All gameplay uses simulation time. */
'use strict';
function miniEvent(g,x,y,text,color='#fff0bc'){if(!motionAllowed())return;g.miniFX=g.miniFX||[];g.miniFX.push({x,y,text,color,life:.85});if(g.miniFX.length>28)g.miniFX.shift();}
function tickMiniFX(g,dt){tickImpacts(g,dt);g.miniFX=(g.miniFX||[]).filter(p=>(p.life-=dt)>0);if(g.banner)g.banner.life=Math.max(0,g.banner.life-dt);}
function drawMiniFX(c,g){paintImpacts(c,g);if(!motionAllowed())return;c.save();c.textAlign='center';c.font='bold 19px WonderStory';for(const p of g.miniFX||[]){c.globalAlpha=Math.min(1,p.life*3);c.lineWidth=4;c.strokeStyle='#26362c';c.fillStyle=p.color;const y=p.y-35-(.85-p.life)*32;c.strokeText(p.text,p.x,y);c.fillText(p.text,p.x,y);}c.restore();}
// ---- Castle Defense ("Guard the Grove") ----------------------------------------------------------------------
// Painted, animated defenders and foes (td-* atlases from scripts/build-defense-art.py), painted effects drawn with
// 'screen' on black (td-fx), suns that pop out of fallen foes and float down from the sky, popping damage numbers.
// Rules and numbers are unchanged; everything below the simulation only draws. Visual randomness uses tdRand(), never
// Math.random(), so the simulation's random sequence (and the balance test) stays the same.
// Atlas layout, must match build-defense-art.py: defenders 4 x 2 cells of 240 x 280, feet at (100, 274), figure 262 tall;
// foes 4 x 3 cells of 224 (feet 112, 218); boss 4 x 1 cells of 288 (feet 144, 282); fx 4 x 2 cells of 256.
const TD_ART={units:['td-reina','td-nyra','td-kael'],cw:240,ch:280,fx:100,fy:274,fh:262,foe:224,boss:288};
// Cell of td-fx: 0 starburst, 1 fire blast, 2 ice shatter, 3 ring, 4 sparkles, 5 death poof, 6 ice bolt, 7 sun comet.
const TD_FX={star:0,fire:1,ice:2,ring:3,spark:4,poof:5,bolt:6,comet:7};
// Shot / cast animation: seconds of the 4 frames (row 1); frame 2 is the release.
const TD_SHOT=[[0,.12,.36,.5,.62],[0,.06,.14,.3,.5],[0,.06,.14,.3,.5]];
// Where the arrow / spell leaves, relative to the defender's feet, in px at the drawn size (110 px tall).
const TD_MUZZLE=[[43,-87],[40,-84],[49,-82]];
const TD_SUN_VALUE=25,TD_DROP_SUN=.3,TD_DROP_VALUE=15;      // placeholders: energy of a sky sun / dropped sun, drop chance
const TD_FOE_TINT=[['#9be36a','#f4e27a','#5f8f2e'],['#c99bff','#ffd2ff','#6a3fb0'],['#ff9a4a','#ffd36a','#b8361c']];
let tdSeed=20261124,tdKeep=null;const tdSil=new Map();
function tdRand(){tdSeed=(Math.imul(tdSeed,1664525)+1013904223)>>>0;return tdSeed/4294967296;}
// Every picture of the screen is fetched and decoded when the game opens (and once from the Mini Games hub), so a
// defender never appears as an empty space when it is built (user: "everything must be preloaded").
const DEFENSE_ART=['td-reina','td-nyra','td-kael','td-foes','td-boss','td-fx','td-sun','battle-castle','ui-icons','stat-icons','utility-icons','emberpeak','nyra','kael','ui-btn-gold','ui-btn-violet','ui-result-ribbon','ui-result-burst'];
function defensePreload(){if(tdKeep||typeof Image!=='function')return;tdKeep=DEFENSE_ART.map(id=>{const im=artBitmap(id);im?.decode?.().catch(()=>{});return im;});}
function tdReady(id){const im=artBitmap(id);return im?.complete&&im.naturalWidth?im:null;}
function tdFx(g,kind,x,y,size,life,o={}){if(!motionAllowed())return;(g.tfx??=[]).push({k:TD_FX[kind],x,y,size,life,max:life,delay:o.delay||0,grow:o.grow??1.5,rot:o.rot??tdRand()*6.28,spin:o.spin??(tdRand()-.5)*2,alpha:o.alpha??.9,sq:o.sq||1});if(g.tfx.length>70)g.tfx.shift();}
function tdBurst(g,x,y,n,colors,o={}){if(!motionAllowed())return;g.parts??=[];for(let i=0;i<n&&g.parts.length<220;i++){const a=(o.dir??0)+(o.spread??6.28)*(tdRand()-.5)+(o.dir==null?Math.PI:0),sp=(o.speed||160)*(.45+tdRand()*.8);g.parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-(o.lift??60),life:(o.life||.6)*(.7+tdRand()*.5),max:o.life||.6,size:(o.size||4)*(.6+tdRand()*.8),color:colors[i%colors.length],kind:o.kind||'spark',rot:tdRand()*6.28,vr:(tdRand()-.5)*14,grav:o.grav??260});}}
// Floating texts: kind hit (damage), big (sun damage), ice, score (+20), energy (+12 with a sun), bad (-1), info.
function tdText(g,x,y,text,kind='hit'){if(!motionAllowed()){miniEvent(g,x,y,text);return;}(g.dtx??=[]).push({x:x+(tdRand()-.5)*(kind==='hit'||kind==='ice'||kind==='big'?18:0),y,text:String(text),kind,life:kind==='info'||kind==='score'?1.25:kind==='energy'?1.35:.8,age:0});if(g.dtx.length>40)g.dtx.shift();}
function defenseHit(g,shot){const target=g.enemies.find(e=>e.id===shot.target&&e.hp>0&&!e.escaped);if(!target)return;target.hp-=shot.damage;target.hurt=.16;target.kb=shot.type===2?10:shot.type===1?5:6;
 const hx=target.x,hy=target.y-(target.boss?50:30);
 if(shot.type===0){tdFx(g,'star',hx-6,hy,62,.32,{grow:1.3});tdBurst(g,hx-8,hy,6,['#fff6c8','#ffd76a'],{speed:180,life:.35,size:3,grav:120});}
 else if(shot.type===1){tdFx(g,'ice',hx,hy,92,.45,{grow:1.35});tdBurst(g,hx,hy,7,['#e6fbff','#8fdcff','#ffffff'],{speed:150,life:.5,size:5,kind:'shard',grav:300});}
 else{tdFx(g,'fire',hx,hy+4,128,.55,{grow:1.4});tdFx(g,'ring',hx,hy+18,70,.45,{grow:2.4,sq:.45,alpha:.8});tdBurst(g,hx,hy,10,['#ffe08a','#ff9a3c','#fff3c4'],{speed:220,life:.6,size:4,grav:200});}
 tdText(g,hx,hy-(target.boss?40:30),Math.round(shot.damage),shot.type===2?'big':shot.type===1?'ice':'hit');
 if(shot.type===1)target.slow=2.8;if(shot.type===2){for(const e of g.enemies){if(e!==target&&e.hp>0&&Math.hypot(e.x-target.x,e.y-target.y)<60){e.hp-=shot.damage*.55;e.hurt=.16;e.kb=6;}}}}
function defenseDeath(g,e){const kind=g.wave%3,[c1,c2,c3]=TD_FOE_TINT[kind],y=e.y-(e.boss?48:28),big=e.boss?2.1:1;
 (g.dead??=[]).push({x:e.x,y:e.y,boss:e.boss,kind,t:0,id:e.id});
 tdFx(g,'poof',e.x,y,120*big,.75,{grow:1.5});tdFx(g,'star',e.x,y,110*big,.4,{grow:1.6,delay:.03});tdFx(g,'ring',e.x,e.y+14,80*big,.55,{grow:2.6,sq:.42,alpha:.85});
 if(e.boss){tdFx(g,'fire',e.x,y,260,.9,{grow:1.5});tdFx(g,'ring',e.x,y,120,.8,{grow:4,delay:.12});tdFx(g,'spark',e.x,y,220,1,{grow:1.6,delay:.15});g.shake=Math.max(g.shake||0,.55);}
 else g.shake=Math.max(g.shake||0,.12);
 tdBurst(g,e.x,y,e.boss?26:13,[c1,c2,c3,'#ffffff'],{speed:e.boss?320:230,life:.85,size:e.boss?9:6.5,kind:'shard',grav:520,lift:140});
 tdBurst(g,e.x,y,e.boss?22:12,[c2,'#fff6d0'],{speed:e.boss?300:200,life:.6,size:3,grav:90});
 if(!e.boss&&tdRand()<TD_DROP_SUN||e.boss)defenseDropSun(g,e.x,y,e.boss?3:1);}
function defenseDropSun(g,x,y,n=1){g.drops??=[];for(let i=0;i<n;i++)g.drops.push({x,y,vx:(tdRand()-.5)*120+(i-(n-1)/2)*70,vy:-210-tdRand()*80,floor:Math.min(470,y+44+tdRand()*14),age:0,life:9,value:TD_DROP_VALUE,landed:false});}
function defenseBuilt(g,t){t.born=g.clock;tdFx(g,'ring',t.x,t.y+21,90,.6,{grow:2.2,sq:.4});tdFx(g,'spark',t.x,t.y-30,150,.7,{grow:1.3});tdBurst(g,t.x,t.y,14,['#fff3b8','#ffd76a','#ffffff'],{speed:150,life:.7,size:3,grav:-40,lift:90});tdText(g,t.x,t.y-70,'Built!','info');}
function defenseUpgraded(g,t){t.born=g.clock;tdFx(g,'ring',t.x,t.y+21,100,.7,{grow:2.5,sq:.4});tdFx(g,'star',t.x,t.y-45,150,.5,{grow:1.4});tdBurst(g,t.x,t.y+10,18,['#fff3b8','#ffd76a','#b6ff9a'],{speed:120,life:.9,size:3.5,grav:-120,lift:40,dir:-Math.PI/2,spread:1.4});tdText(g,t.x,t.y-74,'Level '+t.level+'!','info');}
function tickGroveSun(g,dt){
 if(g.sun){
  g.sun.age+=dt;
  g.sun.y=Math.min(g.sun.floor,88+g.sun.age*29);
  if(g.sun.age>=10)g.sun=null;
 }else if(g.active){
  g.sunDelay=(g.sunDelay??3)-dt;
  if(g.sunDelay<=0){
   g.sun={x:420+Math.random()*225,y:88,floor:225+Math.random()*105,age:0};
   g.sunDelay=6+Math.random()*5;
  }
 }
 for(const s of g.drops||[]){s.age+=dt;if(!s.landed){s.vy+=520*dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.x=Math.max(120,Math.min(700,s.x));if(s.y>=s.floor&&s.vy>0){s.y=s.floor;if(s.vy>120)s.vy*=-.38;else{s.vy=0;s.landed=true;}s.vx*=.5;}}}
 g.drops=(g.drops||[]).filter(s=>s.age<s.life);
 for(const f of g.sunFly||[])f.t+=dt;g.sunFly=(g.sunFly||[]).filter(f=>f.t<.7);
}
function collectGroveSun(g,x,y){
 if(g.ended||gamePaused)return false;
 const near=s=>Math.hypot(x-s.x,y-(s.y-6))<=48;let sun=null,value=TD_SUN_VALUE;
 if(g.sun&&near(g.sun)){sun=g.sun;g.sun=null;}
 else{const d=(g.drops||[]).find(near);if(!d)return false;sun=d;value=d.value;g.drops=g.drops.filter(s=>s!==d);}
 g.energy+=value;
 if(motionAllowed()){tdFx(g,'spark',sun.x,sun.y-6,170,.7,{grow:1.5});tdFx(g,'star',sun.x,sun.y-6,120,.35,{grow:1.6});tdFx(g,'ring',sun.x,sun.y-6,80,.5,{grow:2.4,alpha:.8});
  tdBurst(g,sun.x,sun.y-6,16,['#fff7c2','#ffd45a','#ffae3c'],{speed:200,life:.6,size:3.5,grav:60});(g.sunFly??=[]).push({x:sun.x,y:sun.y-6,t:0});}
 tdText(g,sun.x,sun.y-30,'+'+value+' energy','energy');updateDefenseHUD();return true;
}
function drawSunOrb(c,x,y,r,t,alpha=1){const im=tdReady('td-sun');c.save();c.globalAlpha=alpha;
 const pulse=1+Math.sin(t*4)*.06;softLight(c,x,y,r*2.3*pulse,'255,196,72',.55);softLight(c,x,y,r*1.3,'255,240,190',.5);
 if(im){c.translate(x,y);c.rotate(t*.6);c.drawImage(im,-r*pulse,-r*pulse,r*2*pulse,r*2*pulse);}else drawArtSprite(c,'grove-sun',x,y+r,r*2,r*2);c.restore();}
function drawGroveSun(c,g){
 if(g.ended)return;const now=g.clock;
 if(g.sun){const {x,y,age}=g.sun,sway=Math.sin(age*1.7)*10,fade=age>8.5?.4+.6*Math.abs(Math.sin(age*9)):1;
  c.save();c.globalAlpha=.18*fade;c.fillStyle='#3a2a10';c.beginPath();c.ellipse(x,g.sun.floor+30,22,6,0,0,Math.PI*2);c.fill();c.restore();
  drawSunOrb(c,x+sway,y,30,now,fade);}
 for(const s of g.drops||[]){const left=s.life-s.age,fade=left<2?.4+.6*Math.abs(Math.sin(s.age*9)):1,bob=s.landed?Math.sin(s.age*3.2)*4-6:0;
  drawSunOrb(c,s.x,s.y+bob-8,24,now+s.x,fade);}
 for(const f of g.sunFly||[]){const k=Math.min(1,f.t/.7),e=k*k,x=f.x+(696-f.x)*e,y=f.y+(500-f.y)*e-Math.sin(k*Math.PI)*90;drawSunOrb(c,x,y,22*(1-k*.6),now,1-k*.4);}
}
function updateDefense(dt){const g=game;if(!g||g.ended||gamePaused)return;g.clock+=dt;if(typeof defenseClockTick==='function')defenseClockTick(g);tickGroveSun(g,dt);tickMiniFX(g,dt);tickDefenseFx(g,dt);if(g.active&&g.left>0){g.incomingLane??=Math.floor(Math.random()*3);g.spawn-=dt;if(g.spawn<=0){const boss=g.wave===8&&g.left===1,maxhp=(45+g.wave*17)*(boss?4:1);g.enemies.push({id:++g.id,x:745,y:150+g.incomingLane*130,hp:maxhp,maxhp,speed:17+g.wave*2.8,slow:0,boss,hurt:0,born:g.clock});g.left--;g.incomingLane=null;g.spawn=.7+Math.random()*.7;}}
for(const e of g.enemies){e.hurt=Math.max(0,(e.hurt||0)-dt);e.kb=Math.max(0,(e.kb||0)-dt*45);e.slow=Math.max(0,e.slow-dt);if(e.hp>0){e.x-=e.speed*dt*(e.slow>0?.45:1);if(e.x<70){e.hp=0;e.escaped=true;g.hp-=e.boss?3:1;g.crystalFlash=.35;g.shake=Math.max(g.shake||0,.3);tdText(g,64,e.y-20,'−'+(e.boss?3:1)+' crystal','bad');tdFx(g,'fire',58,e.y-20,110,.5);tdFx(g,'ring',42,270,140,.6,{grow:2,alpha:.7});}}}g.crystalFlash=Math.max(0,(g.crystalFlash||0)-dt);
// Hits settle on arrival, once per projectile, before choosing fresh targets.
for(const shot of g.shots){shot.elapsed=(shot.elapsed||0)+dt;const target=g.enemies.find(e=>e.id===shot.target&&e.hp>0);if(target){shot.x2=target.x;shot.y2=target.y-(target.boss?50:30);}if(shot.elapsed>=shot.duration)defenseHit(g,shot);}g.shots=g.shots.filter(s=>s.elapsed<s.duration);
for(const e of g.enemies)if(e.hp<=0&&!e.escaped){g.energy+=12;g.kills++;const pts=defensePoints(g,e);g.score=(g.score||0)+pts;defenseDeath(g,e);tdText(g,e.x,e.y-(e.boss?100:72),'+'+pts,'score');tdText(g,e.x+26,e.y-(e.boss?70:46),'+12','energy');if(!g.targetAt&&g.score>=DEFENSE_TARGET)defenseTarget(g);}g.enemies=g.enemies.filter(e=>e.hp>0);
for(const t of g.towers){t.cd-=dt;if(t.cd>0)continue;const cfg=TOWERS[t.type],target=g.enemies.filter(e=>e.y===t.y&&e.x>t.x-20&&e.x-t.x<cfg.range).sort((a,b)=>a.x-b.x)[0];if(!target)continue;t.cd=cfg.rate/(1+(t.level-1)*.1);t.shotAt=g.clock;t.targetId=target.id;const damage=cfg.damage*(1+(t.level-1)*.55)*g.damageBonus,m=TD_MUZZLE[t.type];g.shots.push({x1:t.x+m[0],y1:t.y+16+m[1],x2:target.x,y2:target.y-(target.boss?50:30),target:target.id,damage,color:cfg.color,type:t.type,elapsed:0,windup:t.type===0?.4:.15,duration:(t.type===0?.4:.15)+.18+Math.abs(target.x-t.x)/900});}
if(g.hp<=0){g.hp=0;updateDefenseHUD();endDefense(false);return;}if(g.active&&g.left===0&&g.enemies.length===0){g.active=false;g.shots=[];g.cleared=g.wave;g.energy+=55;g.banner={text:'WAVE CLEARED · +55 ENERGY',life:2.2};tdFx(g,'spark',360,250,420,1.1,{grow:1.4});if(g.wave===8){endDefense(true);return;}toast('Wave cleared · +55 energy');}updateDefenseHUD();}
function tickDefenseFx(g,dt){
 for(const f of g.tfx||[]){if(f.delay>0)f.delay-=dt;else f.life-=dt;}g.tfx=(g.tfx||[]).filter(f=>f.life>0);
 for(const p of g.parts||[]){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.grav*dt;p.vx*=Math.exp(-1.8*dt);p.rot+=p.vr*dt;}g.parts=(g.parts||[]).filter(p=>p.life>0);
 for(const p of g.dtx||[])p.age+=dt;g.dtx=(g.dtx||[]).filter(p=>p.age<p.life);
 for(const d of g.dead||[])d.t+=dt;g.dead=(g.dead||[]).filter(d=>d.t<.42);
 g.shake=Math.max(0,(g.shake||0)-dt);
}
// ---- drawing ----
function tdSilhouette(im,sx,sy,sw,sh,color){if(typeof document==='undefined'||typeof document.createElement!=='function')return null;const key=im.src+'|'+sx+'|'+sy+'|'+color;let cv=tdSil.get(key);if(!cv){cv=document.createElement('canvas');if(!cv.getContext)return null;cv.width=sw;cv.height=sh;const x=cv.getContext('2d');x.drawImage(im,sx,sy,sw,sh,0,0,sw,sh);x.globalCompositeOperation='source-in';x.fillStyle=color;x.fillRect(0,0,sw,sh);tdSil.set(key,cv);}return cv;}
// One cell of an atlas, feet at (x, floor); flash 0..1 lays a white silhouette over it, ice 0..1 a frosty one.
function tdCell(c,im,col,row,cw,ch,fx,fy,x,floor,scale,o={}){const sx=col*cw,sy=row*ch,w=cw*scale,h=ch*scale,dx=-fx*scale,dy=-fy*scale;
 c.save();c.translate(x,floor);if(o.sx||o.sy)c.scale(o.sx||1,o.sy||1);if(o.alpha!=null)c.globalAlpha*=o.alpha;c.drawImage(im,sx,sy,cw,ch,dx,dy,w,h);
 if(o.ice>0){const s=tdSilhouette(im,sx,sy,cw,ch,'#9fe6ff');if(s){c.globalAlpha*=o.ice;c.drawImage(s,dx,dy,w,h);c.globalAlpha/=o.ice;}}
 if(o.flash>0){const s=tdSilhouette(im,sx,sy,cw,ch,o.flashColor||'#ffffff');if(s){c.globalAlpha*=o.flash;c.drawImage(s,dx,dy,w,h);}}c.restore();}
function drawDefender(c,g,t){const im=tdReady(TD_ART.units[t.type]),floor=t.y+16,H=110,s=H/TD_ART.fh,age=g.clock-(t.shotAt??-100),seq=TD_SHOT[t.type];
 const born=t.born!=null?g.clock-t.born:9,pop=born<.45?1+Math.sin(born/.45*Math.PI)*.18*(1-born/.45)-(born<.12?(.12-born)*2:0):1;
 if(!im){if(t.type===0)return drawReina(c,{clock:g.clock,heroShotAt:t.shotAt??-100,spriteIdle:true},t.x,floor,72,105);return drawArtSprite(c,['reina','nyra','kael'][t.type],t.x,floor,70,105);}
 let row=0,col=Math.floor(g.clock*5+t.lane*1.3+(t.col||0)*.7)%4;
 if(motionAllowed()&&age>=0&&age<seq[4]){row=1;col=age<seq[1]?0:age<seq[2]?1:age<seq[3]?2:3;}else if(!motionAllowed())col=0;
 const breath=motionAllowed()&&!row?Math.sin(g.clock*2.6+t.lane+(t.col||0))*.012:0;
 // charge glow at the staff / bow while winding up
 if(row===1&&age<seq[2]+.05){const m=TD_MUZZLE[t.type],k=Math.min(1,age/Math.max(.05,seq[2]));softLight(c,t.x+m[0],floor+m[1],18+k*26,t.type===1?'150,220,255':t.type===2?'255,190,80':'255,236,160',.35+k*.45);}
 tdCell(c,im,col,row,TD_ART.cw,TD_ART.ch,TD_ART.fx,TD_ART.fy,t.x,floor,s*pop,{sy:1+breath,sx:1-breath*.5,flash:born<.3?(.3-born)/.3*.9:0,flashColor:'#fff4c0'});}
function drawFoe(c,g,e){const boss=e.boss,im=tdReady(boss?'td-boss':'td-foes'),kind=g.wave%3,floor=e.y+22,kb=e.kb||0,hurt=e.hurt>0?e.hurt/.16:0,slowed=e.slow>0;
 const pace=motionAllowed()?(slowed?3.5:8):0,frame=Math.floor((g.clock*pace+e.id*.37))%4,bob=motionAllowed()&&!boss&&kind===1?Math.sin(g.clock*3+e.id)*4:0,enter=e.born!=null?Math.min(1,(g.clock-e.born)/.35):1;
 c.save();c.globalAlpha=.32;c.fillStyle='#1d3324';c.beginPath();c.ellipse(e.x+kb,e.y+20,boss?44:27,boss?11:8,0,0,Math.PI*2);c.fill();c.restore();
 if(!im){if(boss)drawArtSprite(c,'emberpeak',e.x+kb,floor,110,105);else if(!drawMotionSprite(c,'enemy-motion',kind,e.x+kb,floor,85,83,g.clock+e.id*.17))drawArtSprite(c,['guard-forest','guard-astral','guard-ember'][kind],e.x+kb,floor,75,80);return;}
 const sq=hurt*.09,o={sx:1+sq,sy:1-sq*.8,flash:hurt*.5,ice:slowed?.2+Math.sin(g.clock*5)*.06:0,alpha:enter};
 if(boss)tdCell(c,im,frame,0,TD_ART.boss,TD_ART.boss,TD_ART.boss/2,TD_ART.boss-6,e.x+kb,floor+6,132/TD_ART.boss,o);
 else tdCell(c,im,frame,kind,TD_ART.foe,TD_ART.foe,TD_ART.foe/2,TD_ART.foe-6,e.x+kb,floor-bob,90/TD_ART.foe,o);
 if(slowed&&motionAllowed()){c.save();c.globalCompositeOperation='screen';drawFxCell(c,TD_FX.spark,e.x+kb,e.y-12,boss?110:70,.35,g.clock);c.restore();}
 // health bar
 const w=boss?78:48,y=e.y-(boss?112:68),k=Math.max(0,e.hp/e.maxhp);c.save();c.fillStyle='#1b120cd0';tdRound(c,e.x-w/2-2,y-2,w+4,10,5);c.fill();
 const hp=c.createLinearGradient(0,y,0,y+6);hp.addColorStop(0,boss?'#ffd48a':'#d8ff9e');hp.addColorStop(1,boss?'#e0602a':'#46b04a');c.fillStyle=hp;tdRound(c,e.x-w/2,y,Math.max(4,w*k),6,3);c.fill();
 if(hurt>0){c.fillStyle=`rgba(255,255,255,${hurt*.7})`;tdRound(c,e.x-w/2,y,Math.max(4,w*k),6,3);c.fill();}c.restore();}
function drawFxCell(c,k,x,y,size,alpha,rot=0,sq=1){const im=tdReady('td-fx');if(!im)return;const S=im.naturalWidth/4;c.save();c.globalAlpha=alpha;c.translate(x,y);if(sq!==1)c.scale(1,sq);c.rotate(rot);c.drawImage(im,(k%4)*S,Math.floor(k/4)*S,S,S,-size/2,-size/2,size,size);c.restore();}
function tdRound(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);}
function drawDefenseFx(c,g){
 // a soft dark bed under blasts so the glow reads on the bright meadow
 c.save();for(const f of g.tfx||[]){if(f.delay>0||(f.k!==TD_FX.fire&&f.k!==TD_FX.poof))continue;const t=1-f.life/f.max,a=Math.max(0,1-t)*.3,r=f.size*.42*(.6+t*.6),gr=c.createRadialGradient(f.x,f.y,0,f.x,f.y,r);gr.addColorStop(0,`rgba(50,14,30,${a})`);gr.addColorStop(1,'rgba(50,14,30,0)');c.fillStyle=gr;c.fillRect(f.x-r,f.y-r,r*2,r*2);}c.restore();
 c.save();c.globalCompositeOperation='screen';
 for(const f of g.tfx||[]){if(f.delay>0)continue;const t=1-f.life/f.max,a=(t<.12?t/.12:Math.max(0,1-(t-.12)/.88))*f.alpha,sz=f.size*(.45+(f.grow-.45)*(1-Math.pow(1-t,3)));
  drawFxCell(c,f.k,f.x,f.y,sz,a,f.k===TD_FX.ring?0:f.rot+f.spin*t,f.sq);}
 for(const p of g.parts||[])if(p.kind==='spark'){const a=Math.min(1,p.life/p.max*1.6);c.globalAlpha=a;c.strokeStyle=p.color;c.lineWidth=p.size*.7;c.lineCap='round';c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x-p.vx*.04,p.y-p.vy*.04);c.stroke();}
 c.restore();
 for(const p of g.parts||[])if(p.kind==='shard'){const a=Math.min(1,p.life/p.max*1.8);c.save();c.globalAlpha=a;c.translate(p.x,p.y);c.rotate(p.rot);c.fillStyle=p.color;c.beginPath();c.moveTo(0,-p.size);c.lineTo(p.size*.55,0);c.lineTo(0,p.size*.9);c.lineTo(-p.size*.5,0);c.closePath();c.fill();c.globalAlpha=a*.6;c.fillStyle='#ffffff';c.beginPath();c.moveTo(0,-p.size);c.lineTo(p.size*.55,0);c.lineTo(0,-p.size*.1);c.closePath();c.fill();c.restore();}
}
// Fallen foes: the sprite flares white, swells and fades while the burst plays.
function drawDefenseDead(c,g){for(const d of g.dead||[]){const im=tdReady(d.boss?'td-boss':'td-foes');if(!im)continue;const k=d.t/.42,s=1+k*.35,o={sx:s,sy:s*(1-k*.25),flash:Math.min(1,.6+k),alpha:1-k};
 if(d.boss)tdCell(c,im,0,0,TD_ART.boss,TD_ART.boss,TD_ART.boss/2,TD_ART.boss-6,d.x,d.y+28,132/TD_ART.boss,o);else tdCell(c,im,0,d.kind,TD_ART.foe,TD_ART.foe,TD_ART.foe/2,TD_ART.foe-6,d.x,d.y+22,90/TD_ART.foe,o);}}
const TD_TEXT={hit:['#ffffff','#ffe9a0','#3a2410',20],ice:['#f2fdff','#7fd6ff','#0f2c4a',20],big:['#fff6c4','#ff9a2c','#4a1606',25],score:['#fffbe0','#ffc93c','#4a2a06',27],energy:['#fffbe0','#ffd54a','#5a3204',21],bad:['#ffe2dc','#ff5a4a','#3a0806',24],info:['#ffffff','#b8ff8a','#123a14',23]};
function drawDefenseTexts(c,g){if(!motionAllowed()){drawMiniFX(c,g);return;}c.save();c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 for(const p of g.dtx||[]){const [top,bottom,edge,size]=TD_TEXT[p.kind]||TD_TEXT.hit,k=p.age/p.life,inK=Math.min(1,p.age/.14),pop=inK<1?.4+inK*.9-(inK>.75?(inK-.75)*.8:0):1+Math.max(0,.08-(p.age-.14)*.5),rise=(1-Math.pow(1-k,2.2))*(p.kind==='hit'||p.kind==='ice'||p.kind==='big'?34:42),a=k<.65?1:1-(k-.65)/.35;
  const y=Math.max(70,p.y-rise);c.save();c.translate(Math.max(54,Math.min(666,p.x)),y);c.scale(pop,pop);c.globalAlpha=a;c.font=`900 ${size}px WonderDisplay, Georgia, serif`;
  let x0=0;if(p.kind==='energy'){const w=c.measureText(p.text).width;x0=size*.55;drawSunOrb(c,-w/2-size*.15,0,size*.42,g.clock,a);}
  const gr=c.createLinearGradient(0,-size/2,0,size/2);gr.addColorStop(0,top);gr.addColorStop(1,bottom);
  c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=6;c.shadowOffsetY=2;c.lineWidth=size*.28;c.strokeStyle=edge;c.strokeText(p.text,x0,0);c.shadowColor='transparent';
  c.fillStyle=gr;c.fillText(p.text,x0,0);c.restore();}
 c.restore();}
function drawDefenseBanner(c,g){const b=g.banner;if(!b||b.life<=0)return;b.max??=b.life;const t=b.max-b.life,inK=Math.min(1,t/.35),a=Math.min(1,b.life/.4),[title,sub]=b.text.split(' · ');
 const pop=motionAllowed()?(inK<1?.6+inK*.55-(inK>.7?(inK-.7)*.5:0):1):1;c.save();c.globalAlpha=a;
 const y=210,band=c.createLinearGradient(0,y-46,0,y+46);band.addColorStop(0,'rgba(30,20,60,0)');band.addColorStop(.25,'rgba(36,22,64,.78)');band.addColorStop(.75,'rgba(36,22,64,.78)');band.addColorStop(1,'rgba(30,20,60,0)');
 c.fillStyle=band;c.fillRect(0,y-46,720,92);const line=c.createLinearGradient(0,0,720,0);line.addColorStop(0,'rgba(255,215,120,0)');line.addColorStop(.5,'rgba(255,225,140,.95)');line.addColorStop(1,'rgba(255,215,120,0)');
 c.fillStyle=line;c.fillRect(60,y-34,600,2);c.fillRect(60,y+32,600,2);
 if(motionAllowed()){c.save();c.globalCompositeOperation='screen';drawFxCell(c,TD_FX.star,360,y-4,320*pop,.35*a,t*.4);c.restore();}
 c.translate(360,y-(sub?8:0));c.scale(pop,pop);c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.font='900 38px WonderDisplay, Georgia, serif';
 const gr=c.createLinearGradient(0,-20,0,20);gr.addColorStop(0,'#fffbe2');gr.addColorStop(.55,'#ffd76a');gr.addColorStop(1,'#e88a1e');c.lineWidth=9;c.strokeStyle='#3a1d06';c.strokeText(title,0,0);c.fillStyle=gr;c.fillText(title,0,0);
 if(sub){c.font='800 19px WonderDisplay, Georgia, serif';c.lineWidth=5;c.strokeStyle='#2a1640';c.strokeText(sub,0,30);c.fillStyle='#f2e6ff';c.fillText(sub,0,30);}c.restore();}
function drawIncoming(c,g){if(!(g.active&&g.left>0&&g.spawn<=.9&&g.incomingLane!=null))return;const y=150+130*g.incomingLane,p=motionAllowed()?.5+.5*Math.sin(g.clock*10):1;
 c.save();const edge=c.createLinearGradient(600,0,720,0);edge.addColorStop(0,'rgba(255,60,40,0)');edge.addColorStop(1,`rgba(255,70,40,${.25+.3*p})`);c.fillStyle=edge;c.fillRect(600,y-52,120,92);
 c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';
 for(let i=0;i<3;i++){const x=700-i*22-(motionAllowed()?(g.clock*40)%22:0);c.globalAlpha=(1-i*.28)*(.6+.4*p);c.fillStyle='#ffe2a0';c.strokeStyle='#6a1206';c.lineWidth=3;c.beginPath();c.moveTo(x,y-14);c.lineTo(x-12,y-2);c.lineTo(x,y+10);c.lineTo(x-5,y-2);c.closePath();c.stroke();c.fill();}
 c.globalAlpha=1;c.font='900 17px WonderDisplay, Georgia, serif';c.lineWidth=5;c.strokeStyle='#4a0c04';c.strokeText('INCOMING!',650,y-36);const gr=c.createLinearGradient(0,y-44,0,y-28);gr.addColorStop(0,'#fff3d0');gr.addColorStop(1,'#ff7a4a');c.fillStyle=gr;c.fillText('INCOMING!',650,y-36);c.restore();}
function drawPlatform(c,g,x,y,lane,col,occupied){const t=g.clock,can=!g.ended&&g.energy>=TOWERS[g.choice].cost&&g.selected<0;c.save();
 if(occupied){const gr=c.createRadialGradient(x,y+21,4,x,y+21,40);gr.addColorStop(0,'rgba(255,236,170,.55)');gr.addColorStop(1,'rgba(255,220,140,0)');c.fillStyle=gr;c.beginPath();c.ellipse(x,y+21,42,15,0,0,Math.PI*2);c.fill();c.strokeStyle='rgba(255,228,150,.85)';c.lineWidth=2;c.beginPath();c.ellipse(x,y+21,34,12,0,0,Math.PI*2);c.stroke();c.restore();return;}
 const pulse=motionAllowed()?.5+.5*Math.sin(t*2.4+col+lane):1,gr=c.createRadialGradient(x,y+21,2,x,y+21,38);gr.addColorStop(0,`rgba(255,246,200,${can?.42:.18})`);gr.addColorStop(1,'rgba(255,240,180,0)');
 c.fillStyle=gr;c.beginPath();c.ellipse(x,y+21,38,14,0,0,Math.PI*2);c.fill();c.strokeStyle=can?`rgba(255,226,140,${.55+.35*pulse})`:'rgba(240,240,210,.35)';c.lineWidth=2;c.beginPath();c.ellipse(x,y+21,33,12,0,0,Math.PI*2);c.stroke();
 c.setLineDash([5,6]);c.lineDashOffset=motionAllowed()?-t*12:0;c.lineWidth=1.4;c.beginPath();c.ellipse(x,y+21,24,8.5,0,0,Math.PI*2);c.stroke();c.setLineDash([]);
 c.globalAlpha=can?.75+.25*pulse:.45;drawAtlasIcon(c,'plus',x,y+19-(motionAllowed()?pulse*3:0),can?26:22);c.restore();}
function drawDefenseCrystal(c,g){const t=g.clock,f=g.crystalFlash>0?g.crystalFlash/.35:0;softLight(c,44,262,70+Math.sin(t*2)*6,f>0?'255,90,80':'190,255,200',f>0?.7:.35);
 c.save();if(f>0)c.translate((tdRand()-.5)*6*f,0);c.shadowColor=f>0?'#ff6b68':'#e6ffb4';c.shadowBlur=f>0?24:10;drawAtlasIcon(c,'castle',42,262,88);c.restore();
 // crystal health: twelve small gems under the castle
 c.save();for(let i=0;i<12;i++){const x=12+(i%6)*12,y=318+Math.floor(i/6)*12,on=i<g.hp;c.fillStyle=on?(g.hp<=4?'#ff7a6a':'#9ef0c0'):'#29372d';c.strokeStyle='#1a120a';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y-5);c.lineTo(x+4.5,y);c.lineTo(x,y+5);c.lineTo(x-4.5,y);c.closePath();c.fill();c.stroke();}c.restore();}
function drawDefenseShots(c,g){for(const s of g.shots){if(s.elapsed<s.windup)continue;const t=Math.min(1,(s.elapsed-s.windup)/(s.duration-s.windup)),arc=s.type===2?Math.sin(t*Math.PI)*35:0,x=s.x1+(s.x2-s.x1)*t,y=s.y1+(s.y2-s.y1)*t-arc,angle=Math.atan2(s.y2-s.y1-(s.type===2?Math.cos(t*Math.PI)*35*Math.PI:0),s.x2-s.x1);
  if(s.type===0){softLight(c,x-8,y,22,'255,230,150',.45);drawSpell(c,'arrow',x,y,70,38,g.clock,angle);continue;}
  if(!tdReady('td-fx')){drawSpell(c,s.type===2?'fire':'wind',x,y,55,38,g.clock,angle);continue;}
  const size=s.type===2?96:84,shift=s.type===2?.26:.38;c.save();c.globalCompositeOperation='screen';softLight(c,x,y,s.type===2?34:26,s.type===2?'255,170,60':'140,220,255',.5);
  drawFxCell(c,s.type===2?TD_FX.comet:TD_FX.bolt,x-Math.cos(angle)*size*shift,y-Math.sin(angle)*size*shift,size,1,angle);c.restore();}}
function drawDefenseTop(c,g){const top=c.createLinearGradient(0,0,0,58);top.addColorStop(0,'rgba(48,30,18,.94)');top.addColorStop(1,'rgba(70,44,24,.86)');c.fillStyle=top;c.fillRect(0,0,720,56);
 const line=c.createLinearGradient(0,0,720,0);line.addColorStop(0,'rgba(255,214,120,.2)');line.addColorStop(.5,'rgba(255,226,150,1)');line.addColorStop(1,'rgba(255,214,120,.2)');c.fillStyle=line;c.fillRect(0,55,720,2);
 c.save();c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.font='900 22px WonderDisplay, Georgia, serif';c.lineWidth=5;c.strokeStyle='#2a1606';c.strokeText('THE WHISPERING GROVE',360,20);const gr=c.createLinearGradient(0,10,0,30);gr.addColorStop(0,'#fff6d6');gr.addColorStop(1,'#f2c46a');c.fillStyle=gr;c.fillText('THE WHISPERING GROVE',360,20);
 c.font='700 15px WonderStory, Georgia, serif';c.fillStyle='#f6e8c8';c.fillText(g.active?'Wave '+g.wave+' · '+(g.left+g.enemies.length)+' enemies remaining':g.ended?'':'Choose a defender, then tap a glowing platform',360,43);
 // wave pips
 for(let i=0;i<8;i++){const x=18+i*15,y=28,done=i<g.cleared,now=g.active&&i===g.wave-1;c.fillStyle=done?'#ffd76a':now?'#ff9a5a':'#5a4030';c.strokeStyle='#1d1006';c.lineWidth=1.5;c.beginPath();c.arc(x,y,5,0,Math.PI*2);c.fill();c.stroke();}
 c.restore();}
function drawDefense(){const c=$('#game').getContext('2d'),g=game;c.clearRect(0,0,720,520);c.save();if(g.shake>0&&motionAllowed()){const k=g.shake*14;c.translate((tdRand()-.5)*k,(tdRand()-.5)*k);}
 c.fillStyle='#86bf86';c.fillRect(-20,-20,760,560);drawArtScene(c,'battle-castle',720,520,1);
 for(let l=0;l<3;l++){const y=150+l*130;for(let col=0;col<3;col++)drawPlatform(c,g,150+col*105,y,l,col,g.towers.some(t=>t.lane===l&&t.col===col));}
 const selected=g.towers[g.selected];if(selected){const cfg=TOWERS[selected.type],w=Math.min(720-selected.x+20,cfg.range+20);c.save();const band=c.createLinearGradient(selected.x,0,selected.x+w,0);band.addColorStop(0,'rgba(255,231,161,.22)');band.addColorStop(1,'rgba(255,231,161,.04)');c.fillStyle=band;tdRound(c,selected.x-20,selected.y-46,w,86,14);c.fill();c.strokeStyle='rgba(255,232,168,.7)';c.setLineDash([8,7]);c.lineWidth=2;c.stroke();c.restore();}
 drawDefenseCrystal(c,g);
 // draw back to front: lanes top to bottom, so lower figures overlap upper ones
 const items=[...g.towers.map((t,i)=>({y:t.y,f:()=>{if(i===g.selected){c.save();c.strokeStyle='#fff2b7';c.lineWidth=3;c.shadowColor='#ffe08a';c.shadowBlur=10;c.beginPath();c.ellipse(t.x,t.y+21,39,15,0,0,Math.PI*2);c.stroke();c.restore();}drawDefender(c,g,t);drawLevelPips(c,t);}})),...g.enemies.map(e=>({y:e.y+.5,f:()=>drawFoe(c,g,e)}))].sort((a,b)=>a.y-b.y);
 for(const it of items)it.f();
 drawDefenseDead(c,g);drawIncoming(c,g);drawDefenseShots(c,g);drawDefenseFx(c,g);drawGroveSun(c,g);paintImpacts(c,g);drawDefenseTexts(c,g);drawBattleAtmosphere(c,g);c.restore();
 drawDefenseTop(c,g);drawDefenseBanner(c,g);
 if(g.ended){c.fillStyle='rgba(16,30,36,.55)';c.fillRect(0,0,720,520);}}
function drawLevelPips(c,t){c.save();const w=14+t.level*11,x=t.x-w/2,y=t.y+31;c.fillStyle='rgba(42,26,14,.88)';tdRound(c,x,y,w,14,7);c.fill();c.strokeStyle='#e8c46e';c.lineWidth=1.2;c.stroke();
 for(let i=0;i<t.level;i++){const cx=x+12+i*11,cy=y+7;c.fillStyle='#ffd76a';c.beginPath();for(let k=0;k<10;k++){const r=k%2?2.2:5,a=-Math.PI/2+k*Math.PI/5;c.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}c.closePath();c.fill();}c.restore();}
const MERGE_STEP=1/120;
function constrainEgg(b){if(b.x-b.r<102){b.x=102+b.r;if(b.vx<0)b.vx=-b.vx*.25;}if(b.x+b.r>618){b.x=618-b.r;if(b.vx>0)b.vx=-b.vx*.25;}if(b.y+b.r>487){const impact=b.vy;b.y=487-b.r;if(b.vy>0)b.vy=impact>70?-impact*.18:0;if(impact>70)b.squash=Math.min(.2,impact/1800);}}
function mergePair(g,a,b){const k=a.k+1,r=EGGS[k].r,egg={x:(a.x+b.x)/2,y:(a.y+b.y)/2,k,r,vx:(a.vx+b.vx)*.35,vy:Math.min(-28,(a.vy+b.vy)*.2),age:0,angle:((a.angle||0)+(b.angle||0))/2,spin:0,squash:.2};constrainEgg(egg);g.balls=g.balls.filter(v=>v!==a&&v!==b);g.balls.push(egg);const points=2**k*10;g.score+=points;g.combo=(g.clock-(g.lastMergeAt??-100)<1.4?(g.combo||0)+1:1);g.lastMergeAt=g.clock;egg.pop=1;if(!motionAllowed())miniEvent(g,egg.x,egg.y,'+'+points+(g.combo>1?' · CHAIN '+g.combo:''),EGGS[k].c);if(motionAllowed()){g.fx=g.fx||[];g.bursts=g.bursts||[];g.bursts.push({x:egg.x,y:egg.y,r,c:EGGS[k].c,t:0,big:k>=4,text:'+'+points,chain:g.combo>1?'CHAIN ×'+g.combo:''});const n=12+k*2;for(let i=0;i<n&&g.fx.length<120;i++){const angle=i*Math.PI*2/n+Math.random()*.3,sp=150+Math.random()*170+k*12;g.fx.push({x:egg.x+Math.cos(angle)*r*.6,y:egg.y+Math.sin(angle)*r*.6,vx:Math.cos(angle)*sp,vy:Math.sin(angle)*sp-60,color:EGGS[k].c,life:.55+Math.random()*.35,max:.9,size:3+Math.random()*4+k*.4,star:i%3===0});}for(const old of [a,b])for(let i=0;i<4;i++){const angle=Math.random()*Math.PI*2;g.fx.push({x:old.x,y:old.y,vx:Math.cos(angle)*120,vy:Math.sin(angle)*120-120,color:EGGS[old.k].c,life:.6,max:.6,shard:old.k,size:old.r*.35,rot:Math.random()*6,vr:(Math.random()-.5)*12});}g.shake=Math.max(g.shake||0,k>=4?.35:.15);}if(k===7){endMerge(true);return true;}return false;}
function stepEggPhysics(g,h){for(const b of g.balls){b.age+=h;if(b.y+b.r>=486.9)b.vx*=Math.exp(-3*h);b.vy+=440*h;b.x+=b.vx*h;b.y+=b.vy*h;b.vx*=Math.exp(-.75*h);b.angle=(b.angle||0)+b.vx*h/b.r*.45;b.squash=Math.max(0,(b.squash||0)-h*1.4);b.pop=Math.max(0,(b.pop||0)-h*2.1);constrainEgg(b);}const merged=new Set();for(let pass=0;pass<6;pass++){for(let i=0;i<g.balls.length;i++)for(let j=i+1;j<g.balls.length;j++){const a=g.balls[i],b=g.balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),sum=a.r+b.r;if(d>sum+.05)continue;if(a.k===b.k&&a.k<7&&!merged.has(a)&&!merged.has(b)){if(mergePair(g,a,b))return;merged.add(g.balls[g.balls.length-1]);i=-1;break;}const nx=d>.001?dx/d:1,ny=d>.001?dy/d:0,ia=1/(a.r*a.r),ib=1/(b.r*b.r),mass=ia+ib,over=Math.max(0,sum-d-.02)*.8;a.x-=nx*over*ia/mass;a.y-=ny*over*ia/mass;b.x+=nx*over*ib/mass;b.y+=ny*over*ib/mass;const rel=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rel<0){const impulse=-(1+(rel< -80?.12:0))*rel/mass;a.vx-=impulse*nx*ia;a.vy-=impulse*ny*ia;b.vx+=impulse*nx*ib;b.vy+=impulse*ny*ib;if(rel< -100){a.squash=b.squash=Math.min(.16,-rel/2000);}}}for(const b of g.balls)constrainEgg(b);} }
function updateMerge(dt){const g=game;if(!g||g.ended||gamePaused)return;g.physicsCarry=(g.physicsCarry||0)+Math.min(.1,Math.max(0,dt));let steps=0;while(g.physicsCarry+1e-9>=MERGE_STEP&&steps++<12){g.physicsCarry-=MERGE_STEP;g.clock+=MERGE_STEP;g.cooldown=Math.max(0,g.cooldown-MERGE_STEP);tickMiniFX(g,MERGE_STEP);stepEggPhysics(g,MERGE_STEP);if(g.ended)return;const overflow=g.balls.some(b=>b.age>2&&b.y-b.r<140&&Math.abs(b.vy)<65);g.overflow=overflow?g.overflow+MERGE_STEP:Math.max(0,g.overflow-MERGE_STEP*2);if(g.overflow>=2){endMerge(false);return;}}
g.fx=(g.fx||[]).filter(p=>(p.life-=dt)>0);for(const p of g.fx){p.px=p.x;p.py=p.y;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.shard?520:160)*dt;p.vx*=Math.exp(-2.2*dt);if(p.rot!==undefined)p.rot+=p.vr*dt;}g.bursts=(g.bursts||[]).filter(b=>(b.t+=dt)<1.1);g.shake=Math.max(0,(g.shake||0)-dt);mergeHUD();}
function eggLanding(g){const r=EGGS[g.next].r,x=Math.max(102+r,Math.min(618-r,g.dropX));let y=487-r,contact=null;
 for(const ball of g.balls){
  const dx=x-ball.x,sum=r+ball.r;
  if(Math.abs(dx)>=sum)continue;
  const hitY=ball.y-Math.sqrt(sum*sum-dx*dx);
  if(hitY<y){y=hitY;contact=ball;}
 }
 return {x,y:Math.max(80,y),r,blocked:y<80,match:contact?.k===g.next?contact:null};
}
function drawNestAim(c,g){
 if(g.cooldown>0)return;
 const r=EGGS[g.next].r,x=Math.max(102+r,Math.min(618-r,g.dropX));
 drawEgg(c,x,64,r,g.next);
}
function drawMerge(){const c=$('#game').getContext('2d'),g=game;c.save();if(g.shake>0&&motionAllowed())c.translate((Math.random()-.5)*16*g.shake,(Math.random()-.5)*16*g.shake);c.fillStyle='#17493d';c.fillRect(-20,-20,760,560);drawArtScene(c,'battle-merge',720,520,1);
if(!g.ended)drawNestAim(c,g);
for(const b of motionAllowed()?(g.bursts||[]):[])drawMergeBurst(c,b,'back');for(const b of g.balls){c.save();c.translate(b.x,b.y);const squash=motionAllowed()?(b.squash||0):0,pop=motionAllowed()?(b.pop||0):0,grow=pop?1+Math.sin((1-pop)*Math.PI*2.6)*pop*.32-(pop>.85?(pop-.85)*3.2:0):1;c.rotate(motionAllowed()?Math.max(-.35,Math.min(.35,b.angle||0)):0);c.scale((1+squash)*grow,(1-squash)*grow);if(pop>.2){c.shadowColor=EGGS[b.k].c;c.shadowBlur=40*pop;}drawEgg(c,0,0,b.r,b.k);if(pop>.55){c.globalCompositeOperation='lighter';c.globalAlpha=(pop-.55)*1.6;c.fillStyle='#fff';c.beginPath();c.arc(0,0,b.r*1.02,0,Math.PI*2);c.fill();}c.restore();}if(motionAllowed())drawMergeFx(c,g);drawMiniFX(c,g);drawBattleAtmosphere(c,g);if(g.overflow>0)canvasPill(c,'NEST FULL · '+Math.max(0,2-g.overflow).toFixed(1)+'s',360,119,220,'#822f38ed');c.restore();if(g.ended){c.fillStyle='#16382ab0';c.fillRect(0,0,720,520);canvasPill(c,g.won?'A CELESTIAL WONDER WAS BORN':'A NEST FULL OF DREAMS',360,255,410);}}
// Merge effects: a flash and two shock rings, turning light rays, sparks with trails, shards of the two old eggs.
function drawMergeBurst(c,b){
 const t=b.t,R=b.r,col=b.c;c.save();c.globalCompositeOperation='lighter';
 if(t<.45){const a=1-t/.45,rays=b.big?12:8;c.save();c.translate(b.x,b.y);c.rotate(t*2.4);c.globalAlpha=a*.55;
  for(let i=0;i<rays;i++){c.rotate(Math.PI*2/rays);const g=c.createLinearGradient(0,0,0,-R*(2.2+t*5));g.addColorStop(0,'#fff');g.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=g;c.beginPath();c.moveTo(-R*.14,0);c.lineTo(0,-R*(2.2+t*5));c.lineTo(R*.14,0);c.fill();}c.restore();}
 if(t<.35){const a=1-t/.35,rad=R*(1+t*4.5),g=c.createRadialGradient(b.x,b.y,0,b.x,b.y,rad);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.35,col+'cc');g.addColorStop(1,'rgba(255,255,255,0)');c.globalAlpha=a;c.fillStyle=g;c.beginPath();c.arc(b.x,b.y,rad,0,Math.PI*2);c.fill();}
 for(const [d,w] of [[0,10],[.12,6]]){const tt=t-d;if(tt<0||tt>.55)continue;const a=1-tt/.55;c.globalAlpha=a;c.strokeStyle=d?'#fff':col;c.lineWidth=w*a+1;c.shadowColor=col;c.shadowBlur=18;c.beginPath();c.arc(b.x,b.y,R*(1.05+tt*5.2),0,Math.PI*2);c.stroke();}
 c.restore();
}
function drawMergeFx(c,g){
 for(const b of g.bursts||[])drawMergeBurst(c,b);
 c.save();
 for(const b of g.bursts||[]){const t=b.t,sc=t<.18?.3+t/.18*1.1:t<.3?1.4-(t-.18)/.12*.4:1,a=t>.8?1-(t-.8)/.3:1;c.save();c.globalAlpha=Math.max(0,a);c.translate(b.x,b.y-b.r-18-t*40);c.scale(sc,sc);c.textAlign='center';c.font='900 34px WonderStory';c.lineWidth=7;c.strokeStyle='#3a1a00';c.strokeText(b.text,0,0);const tg=c.createLinearGradient(0,-26,0,4);tg.addColorStop(0,'#fff8d0');tg.addColorStop(1,'#ffc23a');c.fillStyle=tg;c.fillText(b.text,0,0);if(b.chain){c.font='900 20px WonderStory';c.lineWidth=5;c.strokeText(b.chain,0,24);c.fillStyle='#8affd0';c.fillText(b.chain,0,24);}c.restore();}
 for(const p of g.fx||[]){const a=Math.max(0,Math.min(1,p.life/(p.max||.65)));
  if(p.shard!==undefined){c.save();c.globalAlpha=a;c.translate(p.x,p.y);c.rotate(p.rot);c.beginPath();c.moveTo(0,-p.size);c.lineTo(p.size*.8,p.size*.6);c.lineTo(-p.size*.7,p.size*.5);c.closePath();c.clip();drawEgg(c,0,0,p.size*1.2,p.shard);c.restore();continue;}
  c.globalCompositeOperation='lighter';c.globalAlpha=a;
  if(p.px!==undefined){c.strokeStyle=p.color||'#ffe9a0';c.lineWidth=(p.size||4)*.7;c.lineCap='round';c.beginPath();c.moveTo(p.px-(p.x-p.px)*2.5,p.py-(p.y-p.py)*2.5);c.lineTo(p.x,p.y);c.stroke();}
  const s=(p.size||4)*(.6+a*.6);
  if(p.star){c.fillStyle='#fff';c.beginPath();for(let i=0;i<8;i++){const ang=i*Math.PI/4,rr=i%2?s*.35:s*1.6;c.lineTo(p.x+Math.cos(ang)*rr,p.y+Math.sin(ang)*rr);}c.fill();}
  else softLight(c,p.x,p.y,s*2.2,'255,236,190');
 }
 c.restore();
}
