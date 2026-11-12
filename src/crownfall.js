'use strict';
const VALE_HELP='Drag from a teal castle to another castle, or tap the two in order. Half the garrison marches. Reinforce allies or outnumber defenders to capture a keep. Owned castles recruit up to 60 troops. Defeat the ruby army to win.';
const VALE_ARMIES=['keep-stone','keep-jade','keep-ruby'];
const VALE_COLORS=['#67645e','#16615c','#973944'];
function createVale(){
 const map=[[95,300,1,34],[196,150,0,8],[203,432,0,10],[361,284,0,14],[511,146,0,10],[519,425,0,8],[625,295,2,30]];
 const keeps=map.map(([x,y,side,n])=>({x,y,side,n,recruit:0,pulse:0}));
 return {kind:'vale',running:true,ended:false,clock:0,keeps,units:[],selected:-1,aim:null,aiDelay:3.8};
}
function orderVale(g,from,to,side){
 const home=g.keeps[from],dest=g.keeps[to];
 if(g.ended||!home||!dest||home===dest||home.side!==side||home.n<2)return false;
 const count=Math.floor(home.n/2),distance=Math.hypot(dest.x-home.x,dest.y-home.y);
 home.n-=count;
 for(let i=0;i<count;i++)g.units.push({from,to,side,age:-Math.floor(i/3)*.14,travel:distance/82,lane:(i%3-1)*5});
 return true;
}
function advanceVale(g,dt){
 g.clock+=dt;g.aiDelay-=dt;
 for(const k of g.keeps){
  k.pulse=Math.max(0,k.pulse-dt);
  if(!k.side||k.n>=60)continue;
  k.recruit+=dt;
  if(k.recruit>=1.2){k.n++;k.recruit-=1.2;}
 }
 if(g.aiDelay<=0){
  g.aiDelay=2.6+Math.random()*1.2;
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
 g.units=g.units.filter(u=>{
  u.age+=dt;if(u.age<u.travel)return true;
  const k=g.keeps[u.to];
  if(k.side===u.side)k.n++;
  else if(k.n>0)k.n--;
  else {k.side=u.side;k.n=1;k.recruit=0;k.pulse=.8;}
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
  c.save();c.translate(x,y);if((dx<0)===(u.side===1))c.scale(-1,1);
  drawArtSprite(c,u.side===1?'lancer-jade':'lancer-ruby',0,-bob,23,27);c.restore();
 }
 g.keeps.forEach((k,i)=>{
  if(k.pulse>0||i===g.selected){softLight(c,k.x,k.y-12,55,'255,216,117',.8);c.strokeStyle='#ffdf8b';c.lineWidth=3;c.beginPath();c.ellipse(k.x,k.y+1,47,14,0,0,2*Math.PI);c.stroke();}
  drawArtSprite(c,VALE_ARMIES[k.side],k.x,k.y+5,96,92);
  c.fillStyle=VALE_COLORS[k.side];c.strokeStyle='#ffe3a0';c.lineWidth=2;c.beginPath();c.roundRect(k.x-24,k.y+1,48,28,10);c.fill();c.stroke();c.fillStyle='white';c.textAlign='center';c.font='bold 21px WonderStory';c.fillText(k.n,k.x,k.y+22);
 });
}
function endVale(won){
 const g=game;if(!g||g.kind!=='vale'||g.ended)return;
 g.running=false;g.ended=true;g.aim=null;
 const xp=won?gain(450,85,70).xp:0;
 modal((won?artImage('vale-crown','Victory crown','vale-victory-crown'):'')+'<h2>'+(won?'The vale is yours':'The campaign has ended')+'</h2>'+(won?'<p>450 gold · 85 wishes · '+xp+' XP</p>':'')+'<button onclick="$(\'#modal\').close();openScreen(\'vale\')">Play again</button><button onclick="$(\'#modal\').close();openScreen(\'games\')">Mini Games</button>');
}
function startVale(){
 gameShell('Crownfall Vale','BATTLE FOR THE SEVEN KEEPS','<p id="valeStatus" aria-live="polite"></p>');
 game=createVale();$('#gameHelp').textContent=VALE_HELP;
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
  paintGameHTML('#valeStatus',g.selected<0?'Drag from a teal castle to send half its troops.':'Choose a castle to reinforce or capture.');
  paintGameHTML('#hud','<strong>Jade · '+g.keeps.filter(k=>k.side===1).length+'</strong><strong>Ruby · '+g.keeps.filter(k=>k.side===2).length+'</strong>');
  if(result)endVale(result===1);
 },drawVale);
}
