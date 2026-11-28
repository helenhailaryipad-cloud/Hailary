'use strict';
const BOT_SKILL={nyra:{label:'Expert explorer',skill:.91,power:11600,rate:1.3,merge:1830,clears:49,defenses:21},kael:{label:'Castle champion',skill:.96,power:15300,rate:1.6,merge:1050,clears:62,defenses:44},pip:{label:'Merge specialist',skill:.76,power:4900,rate:.7,merge:3260,clears:15,defenses:8},vesper:{label:'Competitive ranger',skill:.88,power:9700,rate:1.1,merge:2240,clears:41,defenses:19},briar:{label:'Learning the ropes',skill:.32,power:1600,rate:.25,merge:430,clears:3,defenses:1},orin:{label:'Casual stargazer',skill:.48,power:2850,rate:.45,merge:890,clears:9,defenses:4}};
let rankingMode='power',rankingEntries=[],rankingTimer=0;
function portrait(id,cls=''){const index=['reina','nyra','kael','pip','vesper','briar','orin','guest'].indexOf(id);const n=index<0?7:index;return `<span role="img" aria-label="${id==='reina'?'REINA':ADVENTURERS.find(b=>b.id===id)?.name||'Adventurer'} portrait" class="portrait-badge ${cls}" style="--portrait-x:${n%4};--portrait-y:${Math.floor(n/4)}"></span>`;}
function rankingRows(now=Date.now()){const rows=ADVENTURERS.map(b=>{const v=botSnapshot(b,now);return {id:b.id,name:b.name,power:v.power,level:v.level,clears:v.clears,defenses:v.defenses,merge:v.mergeBest,ai:true,activity:v.activity,skill:BOT_SKILL[b.id].label};});for(const [i,e]of rankingEntries.entries())if(rankingMode==='power'&&!e.isSelf)rows.push({id:'online-'+i,name:e.name,power:e.power,level:e.level,clears:0,defenses:0,merge:0,online:true,activity:'Published hero profile'});rows.push({id:'reina',name:S.name,power:stats().power,level:level(),clears:S.dungeonWins||0,defenses:S.defenseWins||0,merge:S.mergeBest||0,self:true,activity:'Your current adventure'});return rows.sort((a,b)=>(b[rankingMode]||0)-(a[rankingMode]||0)||b.power-a.power||a.id.localeCompare(b.id));}
function rankingMarkup(compact=false){const previous=rankingMode;if(compact)rankingMode='power';const unit={power:'power',clears:'bosses',defenses:'wins',merge:'points'}[rankingMode];const html=rankingRows().map((e,i)=>`<div class="ranking-row ${e.self?'ranking-self':''}"><strong class="rank-number">${i<3?uiIcon('laurel','rank-medal')+'<em>'+(i+1)+'</em>':i+1}</strong>${portrait(e.ai?e.id:e.self?'reina':'guest')}<div><strong>${esc(e.name)} <small class="player-kind">${e.ai?'AI':e.self?'YOU':'PLAYER'}</small></strong><small>Lv.${e.level} · ${e.ai?esc(e.skill):e.self?'Your hero':'Published profile'}</small>${compact?'':`<small class="rank-activity">${esc(e.activity)}</small>`}</div><b>${fmt(e[rankingMode]||0)}<small>${unit}</small></b></div>`).join('');rankingMode=previous;return html;}
function refreshRankings(){if(screen!=='rankings'||!$('.rk-room'))return;const top=$('#rankingList')?.scrollTop||0;rankings(true);const l=$('#rankingList');if(l)l.scrollTop=top}
function setRankingMode(mode){if(!['power','clears','defenses','merge'].includes(mode))return;rankingMode=mode;rankings();}
// Hall of Wonders (user: "too much of the wrong stuff"): one full-screen room, no app header / sub-tabs / prototype
// notes: back, title, four category tabs, a podium for the top three, the rest as a list, her own place pinned.
function rankings(quiet=false){if(!quiet)clearInterval(rankingTimer);const unit={power:'Power',clears:'Bosses',defenses:'Wins',merge:'Points'}[rankingMode],rows=rankingRows(),me=rows.findIndex(e=>e.self);
 const tag=e=>`<small class="rk-tag">${e.ai?'AI':e.self?'YOU':'PLAYER'}</small>`,face=e=>portrait(e.ai?e.id:e.self?'reina':'guest','rk-face');
 const pod=[1,0,2].map(i=>{const e=rows[i];return e?`<div class="rk-pod p${i+1} ${e.self?'me':''}">${face(e)}<i class="rk-medal">${i+1}</i><b>${esc(e.name)}</b>${tag(e)}<span>${fmt(e[rankingMode]||0)}</span><u></u></div>`:''}).join('');
 const row=(e,i)=>`<div class="rk-row ${e.self?'me':''}"><em>${i+1}</em>${face(e)}<div><b>${esc(e.name)} ${tag(e)}</b><small>Lv.${e.level} · ${e.ai?esc(e.skill):e.self?'Your hero':'Published profile'}</small></div><strong>${fmt(e[rankingMode]||0)}</strong></div>`;
 $('#main').innerHTML=`<section class="rk-room" style="--rk-bg:url('${artPath('scene-ranking')}')"><div class="rk-top"><button class="rk-back" data-back onclick="go('home')" aria-label="Back">‹</button><h1>Hall of Wonders</h1></div>
  <div class="rk-tabs">${[['power','Power'],['clears','Dungeons'],['defenses','Castle'],['merge','Merge']].map(([id,label])=>`<button class="${rankingMode===id?'on':''}" onclick="setRankingMode('${id}')">${uiIcon({power:'power',clears:'dungeons',defenses:'castle',merge:'dragon'}[id])}<span>${label}</span></button>`).join('')}</div>
  <div class="rk-podium">${pod}</div>
  <div class="rk-board"><p class="rk-head"><span>Rank</span><span>Adventurer</span><span>${unit}</span></p><div class="rk-list" id="rankingList">${rows.slice(3).map((e,i)=>e.self?'':row(e,i+3)).join('')}</div>${me>=0?`<div class="rk-mine">${row(rows[me],me)}</div>`:''}</div></section>`;
 if(!quiet){rankingTimer=setInterval(refreshRankings,5000);loadRankingPlayers()}}
async function loadRankingPlayers(){try{const r=await fetch('/api/leaderboard');if(r.ok){const body=await r.json();rankingEntries=body.entries||[];if(screen==='rankings')refreshRankings();}}catch{} }
const ART_FX={arrow:0,impact:1,heal:2,wind:3,fire:4,claw:5,victory:6,wheel:7};
function drawRasterFX(c,name,x,y,width,height=width,angle=0){const im=artBitmap('combat-fx');if(!im?.complete||!im.naturalWidth)return false;const n=ART_FX[name]??0,w=im.naturalWidth/4,h=im.naturalHeight/2;c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='lighter';c.shadowColor='#ffe2aa';c.shadowBlur=16;c.drawImage(im,(n%4)*w,Math.floor(n/4)*h,w,h,-width/2,-height/2,width,height);c.restore();return true;}
function reinaFrame(g){const h=g.crawl?.hero,moving=!!h&&Math.hypot(h.tx-h.x,h.ty-h.y)>2,age=(g.clock||0)-(g.heroShotAt??-100);const shooting=!(h?.dodgeUntil>g.clock)&&age>=0&&age<.6,walking=moving&&!shooting;return {moving:walking,shooting,id:walking?'reina-walk':'reina-shoot',frame:walking?Math.floor((g.clock||0)*9)%6:Math.min(5,Math.floor(Math.max(0,age)/.1))};}
function reinaSpriteBox(rect,width,height,referenceHeight=rect[3]){const scale=Math.min(height,width*1.6)/referenceHeight;return {w:rect[2]*scale,h:rect[3]*scale};}
// Pixels above the crown in each shooting frame belong to the raised bow.
const reinaBowOverhead=[32,32,30,33,32,0];
function dungeonReinaBox(pose,rect,width,height){
 const overhead=pose.id==='reina-shoot'?reinaBowOverhead[pose.frame]:0;
 // Match the standing figure's existing crown-to-sole height, anchored at the feet.
 return reinaSpriteBox(rect,width,height*339/371,rect[3]-overhead);
}
// Grip and shaft centerline measured on the release frame of the shooting atlas.
const bowPivot=.60, bowSlope=.12;
function dungeonBowAim(g){
 const hero=g.crawl.hero,enemy=g.crawl.enemy,costume=equippedRanger();
 const rect=globalThis.WonderArtMeta['reina-shoot'].frames[3];
 let box=dungeonReinaBox({id:'reina-shoot',frame:3},rect,135,180);
 const bounds=globalThis.WonderArtMeta[costume]?.bounds;
 if(costume!=='reina'&&bounds){
  const scale=Math.min(135/bounds[2],180/bounds[3]);
  box={w:bounds[2]*scale,h:bounds[3]*scale};
 }
 const facing=enemy.x>=hero.x?1:-1;
 return {x:hero.x+facing*.34*box.w,y:hero.y+5-.728*box.h+(.84-bowPivot)*box.w*bowSlope,facing};
}
// Compose at atlas resolution so the combat shadow follows a single silhouette.
const aimedRangerFrames=new WeakMap();
function drawAimedRanger(c,image,rect,w,h){
 let frame=aimedRangerFrames.get(image);
 if(!frame||frame.rect!==rect){
  const [sx,sy,sw,sh]=rect;
  const canvas=document.createElement('canvas');
  canvas.width=sw;canvas.height=sh;
  const paint=canvas.getContext('2d');
  const bowBottom=Math.round(sh*.56),waist=Math.round(sh*.67);
  paint.drawImage(image,sx,sy,sw,sh,0,0,sw,sh);
  const pivot=Math.round(sw*bowPivot);
  paint.clearRect(pivot,0,sw-pivot,waist);
  for(let x=pivot;x<sw;x++){
   const drop=(x-pivot)*bowSlope;
   const joint=Math.round(bowBottom+drop);
   paint.drawImage(image,sx+x,sy,1,bowBottom,x,drop,1,joint-drop);
   paint.drawImage(image,sx+x,sy+bowBottom,1,waist-bowBottom,x,joint,1,waist-joint);
  }
  frame={rect,canvas};aimedRangerFrames.set(image,frame);
 }
 c.drawImage(frame.canvas,-w/2,-h,w,h);
}
// Shooting pose in fights: seconds it stays after a shot, the string's snap after a release, until the next arrow is nocked.
const REINA_AIM_HOLD=1.4,REINA_SNAP=.09,REINA_RELOAD=.22;
// Where her arrows leave the bow for a figure drawn by drawReina(c,g,x,floor,width,height): the grip of the shooting pose.
function reinaBowPoint(x,floor,width,height){const k=Math.min(width/450,height/740),geo=typeof registeredShootBitmap==='function'?registeredShootBitmap()?.geom:null,[fx,fy]=geo?[geo.gx+12,geo.gy]:[420,330];return [x-250*k+fx*k,floor-740*k-40*k+fy*k]}
function drawReina(c,g,x,floor,width,height){const pose=reinaFrame(g),costume=equippedRanger(),aim=pose.shooting&&g.crawl?.enemy&&motionAllowed()?dungeonBowAim(g):null;
 const registered=typeof registeredCombatBitmap==='function'?registeredCombatBitmap():null;
 if(registered){
  // One complete silhouette: do not warp or cut its head/arm to animate a shot.
  const scale=Math.min(width/450,height/740),w=500*scale,h=740*scale;
  const lift=motionAllowed()&&pose.moving?Math.abs(Math.sin(g.clock*9))*3:0;
  c.save();c.translate(x,floor-lift);
  if(aim)c.scale(aim.facing,1);else if(pose.moving&&g.crawl.hero.tx<x)c.scale(-1,1);
  // The portrait is rendered at 2x: take the whole 500 x 740 figure area, not its top-left quarter.
  // Portraits with wings carry extra room at the sides and top (rendered at 2x): map the
  // 500 x 740 figure area onto the sprite box and let the wings extend beyond it.
  const iw=(registered.naturalWidth||registered.width||1000)/2,ih=(registered.naturalHeight||registered.height||1600)/2;
  const side=(iw-500)/2,top=ih-800,u=w/500,v=h/740;
  // In a fight she takes the shooting pose (registeredShootBitmap: bow arm toward the foe, the other hand at her
  // cheek): the string is drawn back to that hand with an arrow on it; at each release the string snaps straight and
  // the arrow is gone for a moment. Outside a fight she stands as painted, the bow lowered.
  const age=(g.clock||0)-(g.heroShotAt??-100),fight=age>=0&&age<REINA_AIM_HOLD,shoot=fight&&typeof registeredShootBitmap==='function'?registeredShootBitmap():null;
  if(shoot){const im=shoot.image,sw=im.width/2,sh=im.height/2,sside=(sw-500)/2,stop=sh-800,ox=-w/2,oy=-h-40*v,P=([fx,fy])=>[ox+fx*u,oy+fy*v];
   c.drawImage(im,ox-sside*u,oy-stop*v,sw*u,sh*v);
   const geo=shoot.geom,[t0,t1]=geo.tips.map(P),hand=P(geo.hand),grip=P([geo.gx,geo.gy]),snap=age<REINA_SNAP,shake=snap?Math.sin(age*120)*(1-age/REINA_SNAP)*3*u:0;
   const nock=snap?[(t0[0]+t1[0])/2+shake,(t0[1]+t1[1])/2]:hand;
   c.save();c.lineCap='round';c.strokeStyle='#f3ead2';c.lineWidth=Math.max(1,1.6*u);c.shadowColor='#0006';c.shadowBlur=1.5*u;
   c.beginPath();c.moveTo(...t0);c.lineTo(...nock);c.lineTo(...t1);c.stroke();c.shadowBlur=0;
   if(age>REINA_RELOAD){const dx=grip[0]-hand[0],dy=grip[1]-hand[1],len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len,tip=[hand[0]+ux*(len+30*u),hand[1]+uy*(len+30*u)];
    c.strokeStyle='#c9a25a';c.lineWidth=Math.max(1.2,2.2*u);c.beginPath();c.moveTo(hand[0]-ux*6*u,hand[1]-uy*6*u);c.lineTo(...tip);c.stroke();
    c.fillStyle='#e9f6ff';c.beginPath();c.moveTo(tip[0]+ux*11*u,tip[1]+uy*11*u);c.lineTo(tip[0]-uy*4*u,tip[1]+ux*4*u);c.lineTo(tip[0]+uy*4*u,tip[1]-ux*4*u);c.closePath();c.fill();
    c.fillStyle='#7fd3a8';for(const k of [-1,1]){c.beginPath();c.moveTo(hand[0]+ux*2*u,hand[1]+uy*2*u);c.lineTo(hand[0]+ux*14*u-uy*k*5*u,hand[1]+uy*14*u+ux*k*5*u);c.lineTo(hand[0]+ux*18*u,hand[1]+uy*18*u);c.closePath();c.fill()}}
   c.restore();c.restore();return true}
  c.drawImage(registered,-w/2-side*u,-h-(top+40)*v,iw*u,ih*v);c.restore();return true;
 }
 if(costume!=='reina'){
  const lift=motionAllowed()&&pose.moving?Math.abs(Math.sin(g.clock*9))*3:0;
  c.save();c.translate(x,floor-lift);
  if(aim)c.scale(aim.facing,1);else if(pose.moving&&g.crawl.hero.tx<x)c.scale(-1,1);
  if(!aim&&motionAllowed()&&pose.shooting)c.rotate(Math.sin(pose.frame*Math.PI/5)*-.035);
  const image=artBitmap(costume),bounds=globalThis.WonderArtMeta[costume]?.bounds;
  if(aim&&bounds&&image?.complete&&image.naturalWidth){const scale=Math.min(width/bounds[2],height/bounds[3]);drawAimedRanger(c,image,bounds,bounds[2]*scale,bounds[3]*scale);c.restore();return true;}
  const drawn=drawArtSprite(c,costume,0,0,width,height);c.restore();if(drawn)return true;
 }
 if(!motionAllowed()||(!pose.moving&&!pose.shooting)){if(!g.spriteIdle&&!g.crawl)return drawArtSprite(c,'reina',x,floor,width,height);pose.id='reina-shoot';pose.frame=0;}if(g.crawl&&!pose.moving&&motionAllowed())pose.frame=3;const im=artBitmap(pose.id),m=globalThis.WonderArtMeta?.[pose.id],rect=m?.frames?.[pose.frame];if(!im?.complete||!im.naturalWidth||!rect)return drawArtSprite(c,'reina',x,floor,width,height);const box=g.crawl?dungeonReinaBox(pose,rect,width,height):reinaSpriteBox(rect,width,height,m.maxFrameHeight);c.save();c.translate(x,floor);if(aim)c.scale(aim.facing,1);else if(pose.moving&&g.crawl.hero.tx<x)c.scale(-1,1);if(aim)drawAimedRanger(c,im,rect,box.w,box.h);else c.drawImage(im,...rect,-box.w/2,-box.h,box.w,box.h);c.restore();return true;}
function drawMotionSprite(c,id,row,x,floor,width,height,clock=0,cols=4,rows=3){const im=artBitmap(id);if(!im?.complete||!im.naturalWidth)return false;const frame=motionAllowed()?Math.floor(clock*7)%cols:0,sw=im.naturalWidth/cols,sh=im.naturalHeight/rows,scale=Math.min(width/sw,height/sh),w=sw*scale,h=sh*scale;c.drawImage(im,frame*sw,row*sh,sw,sh,x-w/2,floor-h,w,h);return true;}
function drawGoldenArrow(c,x,y,width,angle){
 c.save();
 c.translate(x,y);
 c.rotate(angle);
 c.scale(width/70,width/70);
 c.globalCompositeOperation='lighter';
 c.shadowColor='#ffc746';
 c.shadowBlur=6;
 const trail=c.createLinearGradient(-54,0,-16,0);
 trail.addColorStop(0,'rgba(255,192,44,0)');
 trail.addColorStop(1,'rgba(255,208,83,.9)');
 c.fillStyle=trail;
 c.fillRect(-54,-1,38,2);
 c.strokeStyle='#ffe17a';
 c.lineWidth=2.4;
 c.beginPath();c.moveTo(-24,0);c.lineTo(22,0);c.stroke();
 c.fillStyle='#fff0a8';
 c.beginPath();c.moveTo(32,0);c.lineTo(17,-5);c.lineTo(20,0);c.lineTo(17,5);c.closePath();c.fill();
 c.fillStyle='#ffcb53';
 for(const side of [-1,1]){
  c.beginPath();c.moveTo(-14,0);c.lineTo(-22,side*5);c.lineTo(-29,side*5);c.lineTo(-24,0);c.closePath();c.fill();
 }
 c.restore();
 return true;
}
function drawManaFireball(c,x,y,width,height,clock,angle) {
  const image=artBitmap('fire-mana-motion');
  if(!image?.complete || !image.naturalWidth) return false;
  const moving=motionAllowed();
  const frame=moving ? Math.floor(clock*12)%4 : 0;
  const cell=image.naturalWidth/2;
  const size=Math.min(width*1.15,height*2);
  c.save();
  c.translate(x,y);
  c.rotate(angle);
  c.globalCompositeOperation='lighter';
  c.shadowColor='#ff813f';
  c.shadowBlur=7;
  c.drawImage(image,(frame%2)*cell,Math.floor(frame/2)*cell,cell,cell,-size*.79,-size*.52,size,size);
  if(moving) {
    c.shadowColor='#ab75ff';
    for(let i=0;i<6;i++) {
      const phase=(clock*1.8+i/6)%1;
      const drift=Math.sin(i*2.4+phase*4)*phase*size*.13;
      c.fillStyle=i%2 ? '#d2aaff' : '#ffcd71';
      c.beginPath();
      c.arc(-size*(.25+phase*.7),drift,Math.max(.3,1.9*(1-phase)),0,Math.PI*2);
      c.fill();
    }
  }
  c.restore();
  return true;
}
function drawSpell(c,name,x,y,w,h,clock,angle=0){if(name==='arrow')return drawGoldenArrow(c,x,y,w,angle);if(name==='fire'&&drawManaFireball(c,x,y,w,h,clock,angle))return true;const row={arrow:0,fire:1,heal:2,wind:3}[name],im=artBitmap('spell-motion');if(row===undefined||!im?.complete||!im.naturalWidth)return drawRasterFX(c,name,x,y,w,h,angle);const sw=im.naturalWidth/4,sh=im.naturalHeight/4,frame=motionAllowed()?Math.floor(clock*12)%4:0;c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='lighter';c.shadowBlur=24;c.shadowColor=row===0?'#ffe18b':row===1?'#ff9854':row===2?'#9dffc3':'#b2f4ff';const glow=c.createRadialGradient(0,0,0,0,0,Math.max(w,h)*.6);glow.addColorStop(0,c.shadowColor+'66');glow.addColorStop(1,c.shadowColor+'00');c.fillStyle=glow;c.fillRect(-w*.7,-h*.7,w*1.4,h*1.4);c.drawImage(im,frame*sw,row*sh,sw,sh,-w/2,-h/2,w,h);c.restore();return true;}
function softLight(c,x,y,r,color,alpha=1){
 c.save();c.globalCompositeOperation='lighter';c.globalAlpha*=alpha;
 const gradient=c.createRadialGradient(x,y,0,x,y,r);
 for(const [stop,opacity] of [[0,.9],[.16,.62],[.42,.22],[.72,.055],[1,0]])
  gradient.addColorStop(stop,'rgba('+color+','+opacity+')');
 c.fillStyle=gradient;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();
}
function drawBattleAtmosphere(c,g){
 if(!motionAllowed())return;
 for(let i=0;i<7;i++){
  const x=(i*103+g.clock*(3+i%3))%720,y=100+((i*71-g.clock*4)%340+340)%340;
  softLight(c,x,y,3+i%4,'255,217,137',.19+.09*Math.sin(g.clock+i));
 }
}
