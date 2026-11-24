'use strict';
const VALE_HELP='Drag between buildings to send half the garrison, or tap the source and destination. Tap your own building and choose Upgrade to spend local troops. Villages recruit fastest, castles hold the largest armies, and towers fire at marching enemies. Capture the ruby strongholds and defeat their remaining troops.';
const VALE_COLORS=['#554f46','#09645e','#9f3044'];
const VALE_ROLES={castle:'Castle',village:'Village',tower:'Tower'};
const VALE_MAPS=[
 {name:'Willow Meadow',grace:25,pace:13,enemyRecruit:.28,sites:[
 [100,285,1,44,'castle'],[230,405,1,12,'village'],[315,185,0,3,'tower'],[466,353,0,4,'village'],[620,235,2,9,'castle']]},
 {name:'Briar Crossing',grace:12,pace:7,enemyRecruit:.72,sites:[
 [85,300,1,32,'castle'],[205,145,0,5,'village'],[215,425,0,5,'tower'],[355,270,0,8,'village'],[490,140,2,6,'village'],[510,420,0,8,'tower'],[635,285,2,22,'castle']]},
 {name:'The Starwatch Pass',grace:6,pace:4,enemyRecruit:.93,sites:[
 [93,395,1,35,'castle'],[116,165,1,7,'village'],[255,294,0,6,'tower'],[352,133,0,10,'village'],[390,424,0,8,'village'],[483,269,2,9,'tower'],[600,407,2,10,'village'],[622,147,2,29,'castle']]},
 {name:'Crownspire Siege',grace:4,pace:3.2,enemyRecruit:1,sites:[
 [85,266,1,40,'castle'],[192,128,1,8,'tower'],[180,422,0,7,'village'],[330,245,0,8,'village'],[427,420,0,9,'tower'],[462,125,2,12,'village'],[551,284,2,9,'tower'],[641,412,2,36,'castle']]}
];
let valeReplay=null;
function createVale(stage=0){
 const level=VALE_MAPS[stage],keeps=level.sites.map(([x,y,side,n,type])=>({x,y,side,n,type,tier:1,recruit:0,pulse:0,hit:0,reload:0}));
 return {kind:'vale',stage,running:true,ended:false,clock:0,keeps,units:[],shots:[],chips:[],selected:-1,aim:null,aiDelay:level.grace};
}
function upgradeVale(g,index,side){
 const k=g.keeps[index];if(g.ended||!k||k.side!==side||k.tier>=3)return false;
 const cost=k.tier===1?8:16;if(k.n<cost+1)return false;
 k.n-=cost;k.tier++;k.pulse=.65;valeFx(g,'upgrade',k.x,k.y-10,side,'Tier '+['I','II','III'][k.tier-1]+'!');return true;
}
function playerUpgradeVale(){
 if(game?.kind==='vale'&&!gamePaused)upgradeVale(game,game.selected,1);
}
function unitPosition(g,u){
 const a=g.keeps[u.from],b=g.keeps[u.to],t=Math.max(0,Math.min(1,u.age/u.travel));
 const dx=b.x-a.x,dy=b.y-a.y,d=u.travel*82;
 return {x:a.x+dx*t-u.lane*dy/d,y:a.y+dy*t+u.lane*dx/d};
}
function valeChips(g,x,y){
 if(!motionAllowed()||g.chips.length>=96)return;
 for(let i=0;i<4;i++)g.chips.push({x,y,vx:(Math.random()-.5)*110,vy:-30-Math.random()*65,age:0,spin:Math.random()*6});
}
// Battle effects (render only): flashes, rings, rays, sparks and floating words. g.fx entries live VALE_FX[kind].life s.
const VALE_FX={send:{life:.55},clash:{life:.45},capture:{life:1.3},upgrade:{life:1.1},zap:{life:.3}};
const VALE_RGB=['230,220,190','80,235,190','255,95,120'];
function valeFx(g,kind,x,y,side,text){
 if(!motionAllowed())return;(g.fx||(g.fx=[])).push({kind,x,y,side,text,t0:g.clock});if(g.fx.length>60)g.fx.shift();
 const n={send:6,clash:9,capture:28,upgrade:16,zap:5}[kind];g.sparks||(g.sparks=[]);
 for(let i=0;i<n&&g.sparks.length<260;i++){const a=Math.random()*Math.PI*2,v=(kind==='capture'?90:50)+Math.random()*(kind==='capture'?170:90);
  g.sparks.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-(kind==='upgrade'?80:30),age:0,life:.45+Math.random()*.5,rgb:kind==='upgrade'?'255,220,120':VALE_RGB[side]||VALE_RGB[0],r:1.6+Math.random()*2.2});}
}
function drawValeFx(c,g){
 c.save();c.globalCompositeOperation='lighter';
 for(const f of g.fx||[]){
  const age=g.clock-f.t0,life=VALE_FX[f.kind].life,k=age/life;if(k<0||k>1)continue;const rgb=f.kind==='upgrade'?'255,215,120':VALE_RGB[f.side]||VALE_RGB[0],fade=1-k;
  if(f.kind==='send'){c.strokeStyle=`rgba(${rgb},${.8*fade})`;c.lineWidth=3*fade+1;c.beginPath();c.ellipse(f.x,f.y+4,18+46*k,6+15*k,0,0,7);c.stroke();softLight(c,f.x,f.y-14,40,rgb,.5*fade);}
  if(f.kind==='clash'||f.kind==='zap'){const r=(f.kind==='zap'?16:30)*(.4+k);softLight(c,f.x,f.y,r*1.6,f.kind==='zap'?'190,130,255':'255,235,180',fade);
   c.strokeStyle=`rgba(255,250,230,${fade})`;c.lineWidth=2.4;c.beginPath();for(let i=0;i<4;i++){const a=i*Math.PI/4+f.t0*3;c.moveTo(f.x-Math.cos(a)*r,f.y-Math.sin(a)*r);c.lineTo(f.x+Math.cos(a)*r,f.y+Math.sin(a)*r);}c.stroke();}
  if(f.kind==='capture'){
   const pillar=c.createLinearGradient(0,f.y-170,0,f.y+20);pillar.addColorStop(0,`rgba(${rgb},0)`);pillar.addColorStop(.7,`rgba(${rgb},${.55*fade})`);pillar.addColorStop(1,`rgba(255,255,255,${.7*fade})`);
   c.fillStyle=pillar;const w=34*(1-k*.5);c.fillRect(f.x-w/2,f.y-170,w,190);
   c.save();c.translate(f.x,f.y-10);c.rotate(age*1.4);for(let i=0;i<12;i++){c.rotate(Math.PI/6);c.fillStyle=`rgba(${rgb},${.35*fade})`;c.beginPath();c.moveTo(0,-6);c.lineTo(90+60*k,-2);c.lineTo(90+60*k,2);c.lineTo(0,6);c.fill();}c.restore();
   for(const d of [0,.18]){const kk=Math.max(0,k-d)/(1-d);c.strokeStyle=`rgba(${rgb},${.9*(1-kk)})`;c.lineWidth=5*(1-kk)+1;c.beginPath();c.ellipse(f.x,f.y+6,20+110*kk,7+36*kk,0,0,7);c.stroke();}
   softLight(c,f.x,f.y-16,120*(1-k*.4),rgb,fade);if(k<.25)softLight(c,f.x,f.y-16,70,'255,255,255',1-k*4);}
  if(f.kind==='upgrade'){for(const d of [0,.25]){const kk=Math.max(0,k-d)/(1-d);c.strokeStyle=`rgba(255,220,120,${1-kk})`;c.lineWidth=3;c.beginPath();c.ellipse(f.x,f.y+4-60*kk,40-10*kk,13-3*kk,0,0,7);c.stroke();}softLight(c,f.x,f.y-30,70,'255,215,120',fade);}
 }
 for(const p of g.sparks||[]){const fade=1-p.age/p.life;softLight(c,p.x,p.y,p.r*5,p.rgb,fade*.8);c.fillStyle=`rgba(255,255,255,${fade})`;c.beginPath();c.arc(p.x,p.y,p.r*.7,0,7);c.fill();}
 c.restore();
 for(const f of g.fx||[]){if(!f.text)continue;const age=g.clock-f.t0,life=VALE_FX[f.kind].life,k=age/life;if(k<0||k>1)continue;
  const sc=k<.15?.6+k/.15*.5:1.1-(k-.15)*.12;c.save();c.translate(f.x,f.y-70-40*k);c.scale(sc,sc);c.globalAlpha=k>.7?(1-k)/.3:1;c.textAlign='center';c.font='bold 26px WonderStory';c.lineWidth=5;c.strokeStyle='#2a1406';c.strokeText(f.text,0,0);
  c.fillStyle=f.kind==='upgrade'?'#ffe08a':f.side===1?'#bfffe8':'#ffd0d8';c.fillText(f.text,0,0);c.restore();}
}
function tickValeFx(g,dt){
 for(const p of g.sparks||[]){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=140*dt;p.vx*=.97;}
 if(g.sparks)g.sparks=g.sparks.filter(p=>p.age<p.life);
 if(g.fx)g.fx=g.fx.filter(f=>g.clock-f.t0<VALE_FX[f.kind].life);
}
function tickValeTowers(g,dt){
 for(const k of g.keeps){
  if(k.type!=='tower'||!k.side)continue;
  k.reload-=dt;if(k.reload>0)continue;
  const target=g.units.find(u=>{if(u.side===k.side||u.age<0||u.marked)return false;const pos=unitPosition(g,u);return Math.hypot(pos.x-k.x,pos.y-k.y)<95+k.tier*22;});
  if(!target)continue;
  target.marked=true;k.reload=2.35-.43*k.tier;
  g.shots.push({x:k.x,y:k.y-56,target,age:0,arcane:k.tier===3});
 }
 for(const shot of g.shots){
  shot.age+=dt;
  if(shot.age>=.2&&!shot.target.dead){
   shot.target.dead=true;const p=unitPosition(g,shot.target);valeChips(g,p.x,p.y-8);valeFx(g,'zap',p.x,p.y-10,shot.target.side);
  }
 }
 g.shots=g.shots.filter(s=>s.age<.2);
}
function orderVale(g,from,to,side){
 const home=g.keeps[from],dest=g.keeps[to];
 if(g.ended||!home||!dest||home===dest||home.side!==side||home.n<2)return false;
 const count=Math.floor(home.n/2),distance=Math.hypot(dest.x-home.x,dest.y-home.y);
 home.n-=count;
 valeFx(g,'send',home.x,home.y,side);
 for(let i=0;i<count;i++)g.units.push({from,to,side,age:-Math.floor(i/3)*.14,travel:distance/82,lane:(i%3-1)*5});
 return true;
}
function advanceVale(g,dt){
 g.clock+=dt;g.aiDelay-=dt;
 for(const k of g.keeps){
  k.hit=Math.max(0,k.hit-dt);k.pulse=Math.max(0,k.pulse-dt);
  if(!k.side||k.n>=({castle:65,village:40,tower:25}[k.type]+(k.tier-1)*15))continue;
  k.recruit+=dt*({castle:1,village:1.55,tower:.55}[k.type])*(1+.45*(k.tier-1))*(k.side===2?VALE_MAPS[g.stage].enemyRecruit:1);
  if(k.recruit>=1.2){k.n++;k.recruit-=1.2;}
 }
 if(g.aiDelay<=0){
  g.aiDelay=VALE_MAPS[g.stage].pace+Math.random()*1.2;
  if(g.stage>=2){const i=g.keeps.findIndex(k=>k.side===2&&k.tier<3&&k.n>=28);if(i>=0)upgradeVale(g,i,2);}
  let best=null;
  g.keeps.forEach((a,i)=>{if(a.side!==2||a.n<8)return;
   g.keeps.forEach((b,j)=>{if(i===j)return;
    const incoming=g.units.reduce((sum,u)=>sum+(u.to===j?(u.side===2?1:-1):0),0);
    const margin=b.side===2?-incoming-b.n:a.n/2-b.n+incoming;
    if(b.side===2&&margin<=0||b.side!==2&&incoming>b.n)return;
    const value=margin-Math.hypot(a.x-b.x,a.y-b.y)/36+(b.side===1?3:0);
    if(!best||value>best.value)best={i,j,value};
   });
  });
  if(best)orderVale(g,best.i,best.j,2);
 }
 tickValeTowers(g,dt);tickValeFx(g,dt);
 for(const p of g.chips){p.age+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=200*dt;}
 g.chips=g.chips.filter(p=>p.age<.38);
 g.units=g.units.filter(u=>{
  if(u.dead)return false;
  u.age+=dt;if(u.age<u.travel||u.marked)return true;
  const k=g.keeps[u.to];
  if(k.side!==u.side&&k.hit<.10){k.hit=.25;valeChips(g,k.x,k.y-23);valeFx(g,'clash',k.x+(Math.random()-.5)*30,k.y-26,u.side);}
  if(k.side===u.side)k.n++;
  else if(k.n>0)k.n--;
  else {const lost=k.side===1;k.side=u.side;k.n=1;k.recruit=0;k.pulse=.8;valeFx(g,'capture',k.x,k.y-6,u.side,u.side===1?'Captured!':lost?'Lost!':'Taken!');}
  return false;
 });
 if(g.selected>=0&&g.keeps[g.selected].side!==1){g.selected=-1;g.aim=null;}
 const alive=side=>g.keeps.some(k=>k.side===side)||g.units.some(u=>u.side===side);
 return !alive(2)?1:!alive(1)?2:0;
}
function drawVale(){
 const g=game,c=$('#game').getContext('2d');
 c.fillStyle='#819d61';c.fillRect(0,0,720,520);drawArtScene(c,'crownfall-vale',720,520,1);
 const origin=g.keeps[g.selected];
 if(origin&&g.aim){c.save();c.strokeStyle='#ffdf88';c.lineWidth=4;c.setLineDash([9,7]);c.lineDashOffset=-g.clock*18;c.beginPath();c.moveTo(origin.x,origin.y);c.lineTo(g.aim.x,g.aim.y);c.stroke();c.restore();}
 for(const u of g.units){
  if(u.age<0)continue;
  const a=g.keeps[u.from],b=g.keeps[u.to],t=u.age/u.travel,dx=b.x-a.x,dy=b.y-a.y,d=u.travel*82;
  const x=a.x+dx*t-u.lane*dy/d,y=a.y+dy*t+u.lane*dx/d;
  const bob=motionAllowed()?2*Math.abs(Math.sin(12*u.age+u.lane)):0;
  softLight(c,x,y-6,15,VALE_RGB[u.side],.45);
  c.save();c.translate(x,y);if((dx<0)===(u.side===1))c.scale(-1,1);
  drawArtSprite(c,u.side===1?'lancer-jade':'lancer-ruby',0,-bob,23,27);c.restore();
 }
 g.keeps.forEach((k,i)=>{
  if(k.pulse>0||i===g.selected){softLight(c,k.x,k.y-12,55,'255,216,117',.8);c.strokeStyle='#ffdf8b';c.lineWidth=3;c.beginPath();c.ellipse(k.x,k.y+1,47,14,0,0,2*Math.PI);c.stroke();}
  const pop=motionAllowed()?1+.10*Math.sin(Math.PI*k.hit/.25):1;
  drawArtSprite(c,'vale-'+k.type+k.tier,k.x,k.y+5,94*pop,90*pop);
  c.fillStyle=VALE_COLORS[k.side];c.fillRect(k.x-30,k.y-65,21,16);
  c.fillStyle='#fff5cf';c.textAlign='center';c.font='bold 13px WonderStory';c.fillText(['I','II','III'][k.tier-1],k.x-20,k.y-52);
  c.fillStyle=VALE_COLORS[k.side];c.strokeStyle='#ffe3a0';c.lineWidth=2;c.beginPath();c.roundRect(k.x-24,k.y+1,48,28,10);c.fill();c.stroke();c.fillStyle='white';c.textAlign='center';c.font='bold 21px WonderStory';c.fillText(k.n,k.x,k.y+22);
 });
 for(const s of g.shots){
  const p=unitPosition(g,s.target),t=Math.min(1,s.age/.2),dx=p.x-s.x,dy=p.y-10-s.y;
  c.save();c.translate(s.x+dx*t,s.y+dy*t);c.rotate(Math.atan2(dy,dx));
  if(s.arcane){softLight(c,0,0,13,'174,115,255');c.strokeStyle='#f3d9ff';}
  else c.strokeStyle='#633820';
  c.lineWidth=s.arcane?4:2.6;c.beginPath();c.moveTo(-14,0);c.lineTo(2,0);c.stroke();
  c.fillStyle=s.arcane?'#fff4ff':'#ffe2a1';c.beginPath();c.moveTo(5,0);c.lineTo(-2,-3);c.lineTo(-2,3);c.fill();c.restore();
 }
 drawValeFx(c,g);
 for(const p of g.chips){c.save();c.translate(p.x,p.y);c.rotate(p.spin+p.age*7);c.globalAlpha=1-p.age/.38;c.fillStyle=p.spin>3?'#ffde95':'#8a5937';c.fillRect(-3,-1,7,2);c.restore();}

}
// Stars for a won level by time (seconds): under VALE_STARS[0] three, under VALE_STARS[1] two, else one. Placeholders.
const VALE_STARS=[90,150];
function endVale(won){
 const g=game;if(!g||g.kind!=='vale'||g.ended)return;
 g.running=false;g.ended=true;g.aim=null;
 if(won)S.valeChapter=Math.max(S.valeChapter||0,Math.min(VALE_MAPS.length-1,g.stage+1));
 const xp=won?gain(450,85,70).xp:0,t=Math.round(g.clock),stars=won?(t<VALE_STARS[0]?3:t<VALE_STARS[1]?2:1):0;
 const held=g.keeps.filter(k=>k.side===1).length,tile=(icon,n,name,hue,i)=>`<span class="wr-prize" style="--rarity:${hue};--d:${1.4+i*.15}s">${icon}<b>${n}</b><small>${name}</small></span>`;
 const buttons=[];if(won&&g.stage+1<VALE_MAPS.length)buttons.push(['Next level','gold','replayVale('+(g.stage+1)+')']);
 buttons.push(['Replay',won&&buttons.length?'violet':'gold','replayVale('+g.stage+')'],['Mini Games','violet',"openScreen('games')"]);
 resultShow({win:won,title:won?'Victory!':'Defeat',kicker:'Level '+(g.stage+1)+' · '+VALE_MAPS[g.stage].name,stars,
  body:(won?artImage('vale-crown','Victory crown','wr-crown'):'')+`<p class="wr-line">Time ${Math.floor(t/60)}:${String(t%60).padStart(2,'0')} · Buildings held ${held} / ${g.keeps.length}${won?' · ★★★ under '+VALE_STARS[0]+' s':''}</p>`+
   (won?`<div class="wr-prizes">${tile(uiIcon('gold'),'+450','Gold','#ffcf5a',0)}${tile(uiIcon('wishes'),'+85','Wishes','#ff9ad8',1)}${tile(uiIcon('exp'),'+'+xp,'XP','#8fd0ff',2)}</div>`:'<p class="wr-practice">The ruby army holds the vale. Try another route!</p>'),
  buttons});
}
function replayVale(stage){valeReplay=stage;$('#modal').close?.();openScreen('vale');}
function startVale(){
 const stage=valeReplay??S.valeChapter??0;valeReplay=null;
 gameShell('Crownfall Vale','Level '+(stage+1)+' · '+VALE_MAPS[stage].name,'<p id="valeStatus" aria-live="polite"></p><button id="valeUpgrade" class="idle" disabled onclick="playerUpgradeVale()">Choose your building to upgrade</button>');
 game=createVale(stage);$('#gameHelp').textContent=VALE_HELP;
 const canvas=$('#game'),g=game;let pointer=null;
 const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*720/r.width,y:(e.clientY-r.top)*520/r.height};};
 const hit=p=>g.keeps.findIndex(k=>Math.abs(k.x-p.x)<=49&&p.y>=k.y-89&&p.y<=k.y+31);
 const active=()=>!gamePaused&&!g.ended&&game===g;
 canvas.addEventListener('pointerdown',e=>{
  if(!active()||pointer!==null)return;
  const p=point(e),i=hit(p);if(i<0)return;
  if(g.selected>=0&&i!==g.selected){orderVale(g,g.selected,i,1);g.selected=-1;g.aim=null;return;}
  if(g.keeps[i].side!==1)return;
  g.selected=i;g.aim=p;pointer=e.pointerId;canvas.setPointerCapture(pointer);
 });
 canvas.addEventListener('pointermove',e=>{if(active()&&pointer===e.pointerId)g.aim=point(e);});
 canvas.addEventListener('pointerup',e=>{
  if(pointer!==e.pointerId)return;pointer=null;g.aim=null;if(!active())return;
  const i=hit(point(e));if(i!==g.selected){orderVale(g,g.selected,i,1);g.selected=-1;}
 });
 canvas.addEventListener('pointercancel',()=>{pointer=null;g.aim=null;g.selected=-1;});
 gameLoop(dt=>{
  const result=advanceVale(g,dt);
  const k=g.keeps[g.selected],btn=$('#valeUpgrade'),cost=k?.tier===1?8:16;
  btn.disabled=!k||k.tier===3||k.n<=cost;btn.classList.toggle('idle',!k);
  paintGameHTML('#valeUpgrade',!k?'Choose your building to upgrade':k.tier===3?'Fully upgraded':'Upgrade · '+cost+' troops');
  paintGameHTML('#valeStatus',k?VALE_ROLES[k.type]+' · Tier '+k.tier+' / 3 · '+({castle:'Large garrison',village:'Fast recruitment',tower:'Fires on passing enemies'}[k.type]):'Drag to march · tap yours to upgrade');
  paintGameHTML('#hud','<strong>Lv. '+(stage+1)+' · '+VALE_MAPS[stage].name+'</strong><strong>Jade '+g.keeps.filter(k=>k.side===1).length+' · Ruby '+g.keeps.filter(k=>k.side===2).length+'</strong>');
  if(result)endVale(result===1);
 },drawVale);
}
