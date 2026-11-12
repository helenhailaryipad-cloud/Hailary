'use strict';
const BOT_SKILL={nyra:{label:'Expert explorer',skill:.91,power:11600,rate:1.3,merge:1830,clears:49,defenses:21},kael:{label:'Castle champion',skill:.96,power:15300,rate:1.6,merge:1050,clears:62,defenses:44},pip:{label:'Merge specialist',skill:.76,power:4900,rate:.7,merge:3260,clears:15,defenses:8},vesper:{label:'Competitive ranger',skill:.88,power:9700,rate:1.1,merge:2240,clears:41,defenses:19},briar:{label:'Learning the ropes',skill:.32,power:1600,rate:.25,merge:430,clears:3,defenses:1},orin:{label:'Casual stargazer',skill:.48,power:2850,rate:.45,merge:890,clears:9,defenses:4}};
let rankingMode='power',rankingEntries=[],rankingTimer=0;
function portrait(id,cls=''){const index=['reina','nyra','kael','pip','vesper','briar','orin','guest'].indexOf(id);const n=index<0?7:index;return `<span role="img" aria-label="${id==='reina'?'REINA':ADVENTURERS.find(b=>b.id===id)?.name||'Adventurer'} portrait" class="portrait-badge ${cls}" style="--portrait-x:${n%4};--portrait-y:${Math.floor(n/4)}"></span>`;}
function rankingRows(now=Date.now()){const rows=ADVENTURERS.map(b=>{const v=botSnapshot(b,now);return {id:b.id,name:b.name,power:v.power,level:v.level,clears:v.clears,defenses:v.defenses,merge:v.mergeBest,ai:true,activity:v.activity,skill:BOT_SKILL[b.id].label};});for(const [i,e]of rankingEntries.entries())if(rankingMode==='power'&&!e.isSelf)rows.push({id:'online-'+i,name:e.name,power:e.power,level:e.level,clears:0,defenses:0,merge:0,online:true,activity:'Published hero profile'});rows.push({id:'reina',name:S.name,power:stats().power,level:level(),clears:S.dungeonWins||0,defenses:S.defenseWins||0,merge:S.mergeBest||0,self:true,activity:'Your current adventure'});return rows.sort((a,b)=>(b[rankingMode]||0)-(a[rankingMode]||0)||b.power-a.power||a.id.localeCompare(b.id));}
function rankingMarkup(compact=false){const previous=rankingMode;if(compact)rankingMode='power';const unit={power:'power',clears:'bosses',defenses:'wins',merge:'points'}[rankingMode];const html=rankingRows().map((e,i)=>`<div class="ranking-row ${e.self?'ranking-self':''}"><strong class="rank-number">${i<3?uiIcon('laurel','rank-medal')+'<em>'+(i+1)+'</em>':i+1}</strong>${portrait(e.ai?e.id:e.self?'reina':'guest')}<div><strong>${esc(e.name)} <small class="player-kind">${e.ai?'AI':e.self?'YOU':'PLAYER'}</small></strong><small>Lv.${e.level} · ${e.ai?esc(e.skill):e.self?'Your hero':'Published profile'}</small>${compact?'':`<small class="rank-activity">${esc(e.activity)}</small>`}</div><b>${fmt(e[rankingMode]||0)}<small>${unit}</small></b></div>`).join('');rankingMode=previous;return html;}
function refreshRankings(){if(screen!=='rankings')return;const el=$('#rankingList');if(el)el.innerHTML=rankingMarkup();const stamp=$('#rankingUpdate');if(stamp)stamp.textContent='Live simulation · Updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function setRankingMode(mode){if(!['power','clears','defenses','merge'].includes(mode))return;rankingMode=mode;rankings();}
function rankings(){clearInterval(rankingTimer);$('#main').innerHTML=`<div class="topline"><h1>Hall of Wonders</h1><button onclick="go('more')">${uiIcon('back')}Back</button></div>${sectionArtwork('scene-ranking','The golden tournament trophy and winners podiums')}<p class="ranking-intro">Meet the champions. Catch the leaders.</p><p class="rules">AI rivals have different skills and keep progressing. Your hero is marked YOU.</p><div class="tabs ranking-tabs">${[['power','Power'],['clears','Dungeons'],['defenses','Castle'],['merge','Merge']].map(([id,label])=>`<button class="${rankingMode===id?'active':''}" onclick="setRankingMode('${id}')">${uiIcon({power:'power',clears:'dungeons',defenses:'castle',merge:'dragon'}[id])}${label}</button>`).join('')}</div><section class="panel ranking-panel"><p id="rankingUpdate" class="rules"></p><div id="rankingList">${rankingMarkup()}</div></section><button onclick="publishProfile()">${uiIcon('upload')}Share my hero</button><p class="rules">Free prototype ranking. Test gifts are allowed. Other players currently publish power only; other categories show AI and your local hero.</p>`;refreshRankings();rankingTimer=setInterval(refreshRankings,5000);loadRankingPlayers();}
async function loadRankingPlayers(){try{const r=await fetch('/api/leaderboard');if(r.ok){const body=await r.json();rankingEntries=body.entries||[];if(screen==='rankings')refreshRankings();}}catch{} }
const ART_FX={arrow:0,impact:1,heal:2,wind:3,fire:4,claw:5,victory:6,wheel:7};
function drawRasterFX(c,name,x,y,width,height=width,angle=0){const im=artBitmap('combat-fx');if(!im?.complete||!im.naturalWidth)return false;const n=ART_FX[name]??0,w=im.naturalWidth/4,h=im.naturalHeight/2;c.save();c.translate(x,y);c.rotate(angle);c.globalCompositeOperation='lighter';c.shadowColor='#ffe2aa';c.shadowBlur=16;c.drawImage(im,(n%4)*w,Math.floor(n/4)*h,w,h,-width/2,-height/2,width,height);c.restore();return true;}
function reinaFrame(g){const h=g.crawl?.hero,moving=!!h&&Math.hypot(h.tx-h.x,h.ty-h.y)>2,age=(g.clock||0)-(g.heroShotAt??-100);const shooting=age>=0&&age<.6,walking=moving&&!shooting;return {moving:walking,shooting,id:walking?'reina-walk':'reina-shoot',frame:walking?Math.floor((g.clock||0)*9)%6:Math.min(5,Math.floor(Math.max(0,age)/.1))};}
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
// Lower only the bow side of the painted pose. Both halves meet at the shoulder.
function drawAimedRanger(c,image,rect,w,h){
 const [x,y,sw,sh]=rect,cut=Math.round(sw*bowPivot),pivot=w*cut/sw;
 c.drawImage(image,x,y,cut,sh,-w/2,-h,pivot,h);
 c.save();c.translate(pivot-w/2,0);c.transform(1,bowSlope,0,1,0,0);
 c.drawImage(image,x+cut,y,sw-cut,sh,0,-h,w-pivot,h);c.restore();
}
function drawReina(c,g,x,floor,width,height){const pose=reinaFrame(g),costume=equippedRanger(),aim=pose.shooting&&g.crawl?.enemy&&motionAllowed()?dungeonBowAim(g):null;
 if(costume!=='reina'){
  const lift=motionAllowed()&&pose.moving?Math.abs(Math.sin(g.clock*9))*3:0;
  c.save();c.translate(x,floor-lift);
  if(aim)c.scale(aim.facing,1);else if(pose.moving&&g.crawl.hero.tx<x)c.scale(-1,1);
  if(!aim&&motionAllowed()&&pose.shooting)c.rotate(Math.sin(pose.frame*Math.PI/5)*-.035);
  const image=artBitmap(costume),bounds=globalThis.WonderArtMeta[costume]?.bounds;
  if(aim&&bounds&&image?.complete&&image.naturalWidth){const scale=Math.min(width/bounds[2],height/bounds[3]);drawAimedRanger(c,image,bounds,bounds[2]*scale,bounds[3]*scale);c.restore();return true;}
  const drawn=drawArtSprite(c,costume,0,0,width,height);c.restore();if(drawn)return true;
 }
 if(!motionAllowed()||(!pose.moving&&!pose.shooting)){if(!g.spriteIdle&&!g.crawl)return drawArtSprite(c,'reina',x,floor,width,height);pose.id='reina-shoot';pose.frame=0;}if(g.crawl&&!pose.moving&&motionAllowed())pose.frame=3;const im=artBitmap(pose.id),m=globalThis.WonderArtMeta?.[pose.id],rect=m?.frames?.[pose.frame];if(!im?.complete||!im.naturalWidth||!rect)return drawArtSprite(c,'reina',x,floor,width,height);const box=g.crawl?dungeonReinaBox(pose,rect,width,height):reinaSpriteBox(rect,width,height,m.maxFrameHeight);c.save();c.translate(x,floor);if(aim)c.scale(aim.facing,1);else if(pose.moving&&g.crawl.hero.tx<x)c.scale(-1,1);if(g.evade>0)c.globalAlpha=.55;if(aim)drawAimedRanger(c,im,rect,box.w,box.h);else c.drawImage(im,...rect,-box.w/2,-box.h,box.w,box.h);c.restore();return true;}
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
