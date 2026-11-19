// Jungle Trek: world-space combat and perspective rendering share one coordinate system.
const Trek = {
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  far:-.13,          // where barrels appear: farther away and smaller than the old horizon
  length:63,         // seconds in one run
  lastRow:43,        // no new rows after this, so the field clears for the boss
  bossAt:46,bossHp:3600,
  create:()=>({kind:'jungle',running:true,ended:false,paused:false,x:0,target:0,hp:3,score:0,time:0,shot:0,row:0,wave:0,hazardAt:7,hurt:0,boost:0,shield:0,rocket:0,rocketShot:0,laser:0,chain:0,chainShot:0,frost:0,lean:0,pets:[0,0],arrows:1,power:0,dropCount:0,foes:[],bolts:[],drops:[],sparks:[],hazards:[],arcs:[],blasts:[],texts:[],kills:0}),
  // Simulated rivals for the live ranking: final scores fixed for one UTC day, earned evenly over the run.
  rivals(names,now){const day=new Date(now===undefined?Date.now():now).toISOString().slice(0,10);
    return names.map(name=>{let h=2166136261;for(const ch of name+day)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return {name,final:2400+(h%45)*50}})},
  standing(rivals,score,time){const now=rivals.map(r=>Math.floor(r.final*Math.min(1,time/this.length)/50)*50),lead=Math.max(score,...now);
    return {rank:1+now.filter(s=>s>score).length,of:rivals.length+1,gap:lead-score}},
  hit(g){if(g.hurt>0)return;if(g.shield>0){g.shield=0;g.hurt=.7;g.shieldBreak=.5;return}g.hp=Math.max(0,g.hp-1);g.hurt=1.3},
  burst(g,x,z,color){for(let i=0;i<12;i++)g.sparks.push({x,z,vx:(Math.random()-.5)*1.8,vz:(Math.random()-.5)*.45,life:.6,color})},
  say(g,text,x,z){(g.texts??=[]).push({text,x,z,life:1.3})},
  // Five lanes of barrels across the clearing.
  lanes:[-1.24,-.62,0,.62,1.24],
  lane(x){return this.lanes.reduce((best,at)=>Math.abs(at-x)<Math.abs(best-x)?at:best)},
  // Arrows fly at the barrel that is closest to Reina, weighing distance ahead against sideways reach.
  aim(g){let best=null,score=-Infinity;
    for(const f of g.foes){if(f.dead||f.z>.82||f.z<-.06)continue;const value=f.z-Math.abs(f.x-g.x)*.45+(f.boss?.15:0);if(value>score){score=value;best=f}}
    return best},
  // Bonuses, in the order they drop; one that is already maxed or not needed turns into another.
  dropOrder:['multi','wings','laser','shield','power','chain','rocket','frost','heart'],
  nextDrop(g){let kind=this.dropOrder[g.dropCount++%this.dropOrder.length];
    if(kind==='multi'&&g.arrows>=4)kind='rocket';if(kind==='power'&&g.power>=3)kind='wings';if(kind==='heart'&&g.hp>=3)kind='shield';return kind},
  collect(g,kind){
    if(kind==='heart'){g.hp=Math.min(3,g.hp+1);this.say(g,'+1 Life',g.x,.72)}
    else if(kind==='shield'){g.shield=9;this.say(g,'Shield',g.x,.72)}
    else if(kind==='multi'){g.arrows=Math.min(4,g.arrows+1);this.say(g,'Arrows ×'+g.arrows,g.x,.72)}
    else if(kind==='power'){g.power=Math.min(3,g.power+1);this.say(g,'Power +'+g.power,g.x,.72)}
    else if(kind==='rocket'){g.rocket=10;this.say(g,'Rockets!',g.x,.72)}
    else if(kind==='laser'){g.laser=6;this.say(g,'Sun beam!',g.x,.72)}
    else if(kind==='chain'){g.chain=9;this.say(g,'Chain lightning!',g.x,.72)}
    else if(kind==='frost'){g.frost=8;this.say(g,'Frost!',g.x,.72)}
    else{g.boost=9;this.say(g,'SPD +200%',g.x,.72)}
    this.burst(g,g.x,.85,'#b9eaff')},
  damage(g,f,amount){if(f.dead)return;f.hp-=amount;f.flash=.09;if(f.hp<=0)this.kill(g,f)},
  kill(g,f){f.dead=true;g.kills++;this.burst(g,f.x,f.z,'#ffd584');
    if(f.boss){g.score+=1000;g.kills+=4;g.bossDown=true;g.endAt=g.time+1.4;g.blasts.push({x:f.x,z:f.z,life:.6,big:true});this.say(g,'Boss defeated!',0,.45);return}
    g.score+=50;
    if(g.kills%4===0)g.drops.push({x:f.x,z:f.z,kind:this.nextDrop(g)});
    // Storm barrel: lightning jumps to the three nearest barrels; a barrel it breaks carries the chain on.
    if(f.type==='elec'){const near=g.foes.filter(o=>!o.dead&&!o.boss&&Math.abs(o.x-f.x)<1.35&&Math.abs(o.z-f.z)<.34).sort((a,b)=>Math.hypot(a.x-f.x,(a.z-f.z)*3)-Math.hypot(b.x-f.x,(b.z-f.z)*3)).slice(0,3);
      for(const o of near){g.arcs.push({x1:f.x,z1:f.z,x2:o.x,z2:o.z,life:.3});this.damage(g,o,45)}}
    // Bomb barrel: one blast for everything close by.
    if(f.type==='bomb'){g.blasts.push({x:f.x,z:f.z,life:.4});for(const o of g.foes)if(!o.dead&&Math.abs(o.x-f.x)<.78&&Math.abs(o.z-f.z)<.18)this.damage(g,o,o.boss?60:90)}},
  step(g,dt,rng=Math.random){
    if(!g.running||g.paused||g.ended)return;
    dt=this.clamp(dt,0,.05);g.time=Math.min(this.length,g.time+dt);g.hurt-=dt;g.boost-=dt;g.shield-=dt;g.rocket-=dt;g.laser-=dt;g.chain-=dt;g.frost-=dt;g.shot-=dt;g.rocketShot-=dt;g.chainShot-=dt;g.row-=dt;g.hazardAt-=dt;g.shieldBreak-=dt;
    g.x+=(g.target-g.x)*Math.min(1,dt*14);
    // Only for the picture: she leans into a turn and the two pets trail after her.
    g.lean+=(this.clamp((g.target-g.x)*2.4,-1,1)-g.lean)*Math.min(1,dt*10);g.pets[0]+=(g.x-g.pets[0])*Math.min(1,dt*6.5);g.pets[1]+=(g.x-g.pets[1])*Math.min(1,dt*4.5);
    // A new row every 2.2 s: most lanes hold a barrel; some are storm or bomb barrels. Barrels grow sturdier.
    if(g.row<=0&&g.time<this.lastRow){g.wave++;const tier=Math.floor(g.time/12.6);
      this.lanes.forEach((x,lane)=>{if(rng()<.3)return;const hp=30+tier*10+g.wave*4+((lane*2+g.wave)%3)*10,roll=rng();   // sturdier every row, to keep up with weapon bonuses
        g.foes.push({x,z:this.far,hp,max:hp,kind:(g.wave+lane)%5,flash:0,type:g.wave>1&&roll<.13?'elec':g.wave>2&&roll<.25?'bomb':''})});
      g.row=2.2;
    }
    // The guardian of the trail arrives for the last stretch.
    if(g.time>=this.bossAt&&!g.bossSpawned){g.bossSpawned=true;g.foes.push({boss:true,x:0,z:this.far,hp:this.bossHp,max:this.bossHp,kind:0,flash:0});this.say(g,'Boss incoming!',0,.4);g.hazardAt=Math.min(g.hazardAt,4)}
    const boss=g.foes.find(f=>f.boss&&!f.dead);
    if(g.shot<=0){const target=this.aim(g);let vx=0;
      if(target){const time=Math.max(.08,(.84-target.z)/1.095);vx=this.clamp((target.x-g.x)/time,-3.2,3.2)}
      for(let i=0;i<g.arrows;i++)g.bolts.push({x:g.x+(i-(g.arrows-1)/2)*.17,z:.84,vx});
      g.shot=g.boost>0?.065:.13}
    if(g.rocket>0&&g.rocketShot<=0){g.bolts.push({x:g.x,z:.84,vx:0,rocket:true});g.rocketShot=.55}
    // Sun beam: burns everything straight ahead of her. Chain lightning: a bolt to the aimed barrel that jumps to two more.
    if(g.laser>0)for(const f of g.foes){if(f.dead||f.z>.84||f.z<this.far||Math.abs(f.x-g.x)>(f.boss?.5:.26))continue;f.burn=(f.burn||0)+dt*110;if(f.burn>=4){const n=Math.floor(f.burn);f.burn-=n;this.damage(g,f,n)}}
    if(g.chain>0&&g.chainShot<=0){const t=this.aim(g);g.chainShot=.4;
      if(t){g.arcs.push({x1:g.x,z1:.84,x2:t.x,z2:t.z,life:.24,hero:true});
        const near=g.foes.filter(o=>o!==t&&!o.dead&&Math.abs(o.x-t.x)<1.35&&Math.abs(o.z-t.z)<.34).sort((a,b)=>Math.hypot(a.x-t.x,(a.z-t.z)*3)-Math.hypot(b.x-t.x,(b.z-t.z)*3)).slice(0,2);
        for(const o of near)g.arcs.push({x1:t.x,z1:t.z,x2:o.x,z2:o.z,life:.24});
        this.damage(g,t,26);for(const o of near)this.damage(g,o,16)}}
    const slow=g.frost>0?.45:1;   // frost slows every barrel
    for(const f of g.foes){
      if(f.boss){if(f.z<.3)f.z+=dt*.115;else f.x=Math.sin(g.time*.8)*.8;f.flash-=dt;continue}
      f.z+=dt*(f.dash?1.5:.115)*slow;f.flash-=dt;if(f.z>=.88&&!f.passed){f.passed=true;if(Math.abs(f.x-g.x)<.3)this.hit(g)}}
    for(const b of g.bolts){const old=b.z;
      if(b.rocket){const t=this.aim(g);if(t)b.vx=this.clamp((t.x-b.x)*5,-2.6,2.6);b.z-=dt*.78}else b.z-=dt*.98;
      b.x+=(b.vx||0)*dt;if(Math.abs(b.x)>1.9)b.dead=true;
      const f=g.foes.filter(f=>!f.dead&&f.z<.91&&Math.abs(f.x-b.x)<(f.boss?.5:.3)&&f.z>=b.z-.025&&f.z<=old+.025).sort((a,b)=>b.z-a.z)[0];
      if(!f)continue;b.dead=true;
      if(b.rocket){g.blasts.push({x:b.x,z:f.z,life:.35});for(const o of g.foes)if(!o.dead&&Math.abs(o.x-b.x)<.55&&Math.abs(o.z-f.z)<.13)this.damage(g,o,60)}
      else this.damage(g,f,6+g.power*2+(g.frost>0?3:0))}
    // Danger lanes: a Rush barrel marks its lane red, then charges down it (break it first to call it off);
    // otherwise a lane of fire or light strikes where Reina stands. The boss strikes more often.
    if(g.hazardAt<=0){let foe=null;
      if(!boss&&Math.floor(g.time/6.2)%2===0)for(const f of g.foes)if(!f.dead&&!f.boom&&!f.boss&&f.z<.5&&f.z>0&&(!foe||Math.abs(f.x-g.x)<Math.abs(foe.x-g.x)))foe=f;
      if(foe)foe.boom=true;
      g.hazards.push({x:foe?foe.x:this.lane(g.x),age:0,laser:!foe&&!boss&&Math.floor(g.time/7)%2===0,foe,breath:!!boss});g.hazardAt=boss?3.4:6.2}
    for(const h of g.hazards){h.age+=dt;
      if(h.foe){if(h.foe.dead&&h.age<1.6){h.age=9;this.say(g,'Defused',h.x,h.foe.z);continue}if(h.age>=1.6)h.foe.dash=true}
      if(h.age>=1.6&&h.age<2.3&&Math.abs(g.x-h.x)<.31)this.hit(g)}
    // Bonuses are picked up as soon as they touch Reina, anywhere on her figure.
    for(const d of g.drops){d.z+=dt*.16;if(d.z>=.64&&d.z<=1.02&&Math.abs(d.x-g.x)<.52){d.dead=true;this.collect(g,d.kind)}}
    for(const p of g.sparks){p.life-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt}
    for(const t of g.texts)t.life-=dt,t.z-=dt*.05;
    for(const a of g.arcs)a.life-=dt;for(const e of g.blasts)e.life-=dt;
    g.foes=g.foes.filter(f=>!f.dead&&f.z<1.16);g.bolts=g.bolts.filter(b=>!b.dead&&b.z>this.far);g.drops=g.drops.filter(d=>!d.dead&&d.z<1.1);g.sparks=g.sparks.filter(p=>p.life>0);g.hazards=g.hazards.filter(h=>h.age<2.5);g.texts=g.texts.filter(t=>t.life>0);g.arcs=g.arcs.filter(a=>a.life>0);g.blasts=g.blasts.filter(e=>e.life>0);
    if(g.hp<=0||g.time>=this.length||g.endAt&&g.time>=g.endAt){g.ended=true;g.running=false}
  }
};
// The picture is drawn in a 480x800 space and rendered at the screen's real resolution, so nothing is stretched.
function trekSharp(canvas){
  const box=canvas.getBoundingClientRect(),k=Trek.clamp((box.width||480)*(globalThis.devicePixelRatio||1)/480,1,2.5),w=Math.round(480*k),h=Math.round(800*k);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h}
  const c=canvas.getContext('2d');c.setTransform(w/480,0,0,h/800,0,0);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';return c}
// Big paintings drawn small shimmer and look pixelated; halved copies (mipmaps) keep them smooth at any size.
const TREK_MIPS=new WeakMap();
function trekMip(image,want){
  const full=image.naturalWidth||image.width;let levels=TREK_MIPS.get(image);if(!levels){levels=[image];TREK_MIPS.set(image,levels)}
  let i=0;while(full/(2<<i)>=want&&full/(2<<i)>=24)i++;
  for(let n=levels.length;n<=i;n++){const src=levels[n-1],w=Math.max(1,Math.round((src.naturalWidth||src.width)/2)),h=Math.max(1,Math.round((src.naturalHeight||src.height)/2)),copy=document.createElement('canvas');copy.width=w;copy.height=h;const x=copy.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(src,0,0,w,h);levels.push(copy)}
  return levels[i]}
function showJungle(){
  $('#main').innerHTML=`<section class="jungle-screen"><div class="jungle-field"><canvas id="trekField" width="480" height="800" tabindex="0" aria-label="Jungle Trek. Drag left and right or use arrow keys. Automatic shooting. Escape pauses."></canvas><div id="trekHud" class="trek-top"><div><small>CURRENT SCORE</small><strong id="trekScore">0</strong><small id="trekBest">BEST ${fmt(S.jungleBest||0)}</small><span class="trek-rank" id="trekRank"></span></div><div class="trek-clock"><small>JUNGLE TREK</small><strong id="trekTime">01:03</strong></div><div><span id="trekLives" aria-label="3 lives">♥ ♥ ♥</span><button id="trekPause" onclick="pauseJungle()" aria-label="Pause run">Ⅱ</button></div></div><div class="trek-buffs" id="trekBuffs"></div><div class="trek-controls"><button onclick="go('games')" aria-label="Exit Jungle Trek">‹</button><span>DRAG TO MOVE · AUTO FIRE</span></div><div class="jungle-overlay" id="trekPanel"><small>WINGS OF WONDER</small><h2>Jungle Trek</h2><p>Break the barrels and grab the bonuses: more arrows, power, rockets, sun beam, chain lightning, frost, wings, shields.<br>Storm barrels chain lightning, bomb barrels blast their neighbours.<br>Dodge the red lanes and beat the dragon at the end.</p><p class="trek-instruction">Drag left or right · 3 lives · about a minute</p><button class="primary" onclick="startJungle()">Start adventure</button><button onclick="go('games')">Back to Mini Games</button></div></div></section>`;
  const g=Trek.create();g.running=false;g.foes=[{x:-1.24,z:.3,hp:120,max:120,kind:0},{x:-.62,z:.22,hp:60,max:60,kind:2},{x:0,z:.5,hp:60,max:60,kind:1},{x:.62,z:.39,hp:90,max:90,kind:3},{x:1.24,z:.22,hp:100,max:100,kind:4}];
  const canvas=$('#trekField');['trek-bg','trek-barrel','trek-pickup-1','trek-pickup-2','trek-pickup-3','trek-pickup-4','trek-pickup-5','trek-pickup-6','trek-pickup-7','trek-pickup-8','trek-pickup-9','trek-bomb','trek-elec','trek-rocket','reina-t3','d0','d1','guard-forest','guard-astral','guard-ember','emberpeak'].forEach(artBitmap);if(typeof registeredCombatBitmap==='function'){registeredCombatBitmap();registeredCombatBitmap(true)}
  let ticks=0;function preview(){if(!canvas.isConnected||game?.kind==='jungle')return;drawJungle(trekSharp(canvas),g);if(++ticks<90)requestAnimationFrame(preview)}preview();
}
function pauseJungle(force){const g=game;if(g?.kind!=='jungle'||!g.running)return;g.paused=force===undefined?!g.paused:force;const p=$('#trekPanel');p.hidden=!g.paused;if(g.paused)p.innerHTML='<h2>Trail paused</h2><p>Your adventure is waiting.</p><button class="primary" onclick="pauseJungle(false)">Continue</button><button onclick="go(\'games\')">Leave run</button>';$('#trekPause').textContent=g.paused?'▶':'Ⅱ'}
function startJungle(){
  if(game?.running)return;const canvas=$('#trekField');if(!canvas)return;let ctx=trekSharp(canvas);const g=game=Trek.create();$('#trekPanel').hidden=true;canvas.focus({preventScroll:true});let pointer=null,origin=0,start=0,last=performance.now(),hud=-1,frames=0;const rivals=Trek.rivals(typeof ADVENTURERS==='undefined'?[]:ADVENTURERS.map(a=>a.name));
  // The newest finger steers: a touch the browser never reports as lifted can not lock the controls.
  canvas.onpointerdown=e=>{if(g.paused)return;e.preventDefault();pointer=e.pointerId;origin=e.clientX;start=g.x;g.touch=true;const r=canvas.getBoundingClientRect();g.stick={x:(e.clientX-r.left)/r.width*480,y:(e.clientY-r.top)/r.height*800};try{canvas.setPointerCapture(pointer)}catch{}};
  canvas.onpointermove=e=>{if(pointer===e.pointerId&&!g.paused){e.preventDefault();const r=canvas.getBoundingClientRect();g.target=Trek.clamp(start+(e.clientX-origin)/r.width*3.5,-1.25,1.25)}};
  canvas.onpointercancel=canvas.onpointerup=canvas.onlostpointercapture=e=>{if(e.pointerId===pointer){pointer=null;g.touch=false}};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();g.target=Trek.clamp(g.target+(['ArrowLeft','a'].includes(e.key)?-.3:.3),-1.25,1.25)}else if(e.key==='Escape'){e.preventDefault();pauseJungle()}};
  function finish(){if(g.rewarded)return;g.rewarded=true;S.jungleBest=Math.max(S.jungleBest||0,g.score);const gold=Math.min(800,g.kills*12),xp=Math.min(80,g.kills*2);gain(gold,0,xp);save();const p=$('#trekPanel');p.hidden=false;p.innerHTML=`<small>${g.bossDown?'BOSS DEFEATED':g.hp?'TRAIL COMPLETE':'ADVENTURE ENDED'}</small><h2>${fmt(g.score)} points</h2><p>Personal best · ${fmt(S.jungleBest)}<br>${gold} gold · ${xp} base XP<br>Rank ${Trek.standing(rivals,g.score,Trek.length).rank} of ${rivals.length+1} · rivals are simulated AI adventurers</p><button class="primary" onclick="startJungle()">Play again</button><button onclick="go('games')">Mini Games</button>`}
  function frame(now){if(game!==g||!canvas.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden&&!g.paused)pauseJungle(true);if(++frames%40===0)ctx=trekSharp(canvas);Trek.step(g,dt);drawJungle(ctx,g);
    const stamp=[Math.ceil(g.time),g.hp,g.score,Math.ceil(g.boost),Math.ceil(g.shield),Math.ceil(g.rocket),Math.ceil(g.laser),Math.ceil(g.chain),Math.ceil(g.frost),g.arrows,g.power,g.paused].join();if(stamp!==hud){hud=stamp;$('#trekScore').textContent=fmt(g.score);const place=Trek.standing(rivals,g.score,g.time);$('#trekRank').innerHTML=`Ranking <b>${place.rank}</b><br>Gap to leader <b>${fmt(place.gap)}</b>`;const t=Math.ceil(Trek.length-g.time);$('#trekTime').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('#trekLives').innerHTML=[0,1,2].map(i=>`<b style="color:${i<g.hp?'#ff6179':'#344e62'}">♥</b>`).join(' ');$('#trekLives').setAttribute('aria-label',g.hp+' lives');$('#trekBuffs').innerHTML=[['trek-pickup-4',g.arrows>1,'×'+g.arrows,'Arrows'],['trek-pickup-6',g.power>0,'+'+g.power,'Power'],['trek-pickup-1',g.boost>0,Math.ceil(g.boost),'Wings'],['trek-pickup-5',g.rocket>0,Math.ceil(g.rocket),'Rockets'],['trek-pickup-7',g.laser>0,Math.ceil(g.laser),'Sun beam'],['trek-pickup-8',g.chain>0,Math.ceil(g.chain),'Chain lightning'],['trek-pickup-9',g.frost>0,Math.ceil(g.frost),'Frost'],['trek-pickup-2',g.shield>0,Math.ceil(g.shield),'Shield']].map(([art,on,label,name])=>`<span class="${on?'on':''}"><img src="${artPath(art)}" alt="${name}"><b>${on?label:''}</b></span>`).join('')}
    if(g.ended){finish();return}loop=requestAnimationFrame(frame)
  }loop=requestAnimationFrame(frame);
}
function drawJungle(c,g){
  // A high camera behind the hero: far rows are smaller but stay readable.
  const W=480,H=800,FAR=Trek.far,T=g.time,K=c.getTransform?c.getTransform().a:1,P=(x,z)=>{const t=Math.max(0,(z-FAR)/(1-FAR));return {x:240+x*(72+t*98),y:118+Math.pow(t,1.45)*636,s:.27+t*.86}};
  const ready=id=>{const image=artBitmap(id);return image?.complete&&image.naturalWidth?image:null};
  const poly=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill()};
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);c.fill()};
  const glow=(x,y,r,stops)=>{const grad=c.createRadialGradient(x,y,0,x,y,r);stops.forEach(([at,color])=>grad.addColorStop(at,color));ellipse(x,y,r,r,grad)};
  const star=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.28:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}c.closePath();c.fill()};
  const rnd=n=>{const s=Math.sin(n*127.1+3.7)*43758.5453;return s-Math.floor(s)};
  // Smooth pictures: every sprite is taken from the mipmap that fits its size on screen.
  const picture=(image,x,y,w,h)=>c.drawImage(trekMip(image,w*K),x,y,w,h);
  const spriteBox=(image,id,width,height)=>{const full=image.naturalWidth,rect=globalThis.WonderArtMeta?.[id]?.bounds||[0,0,full,image.naturalHeight],scale=Math.min(width/rect[2],height/rect[3]);return {rect,scale,w:rect[2]*scale,h:rect[3]*scale}};
  const sprite=(id,x,floor,width,height)=>{const image=ready(id);if(!image)return false;const full=image.naturalWidth,{rect,scale,w,h}=spriteBox(image,id,width,height),m=trekMip(image,full*scale*K),r=(m.naturalWidth||m.width)/full;c.drawImage(m,rect[0]*r,rect[1]*r,rect[2]*r,rect[3]*r,x-w/2,floor-h,w,h);return true};
  // One tongue of flame: three nested teardrops, dark red outside, yellow in the heart.
  const tongue=(x,y,w,h,sway,alpha)=>{for(const [k,low,high] of [[1,'#ff7a1c','#c81e0c00'],[.72,'#ffb02e','#ff5a1a22'],[.44,'#ffe98a','#ffb02e55'],[.2,'#ffffff','#fff3b0aa']]){const a=w*k,b=h*(k*.72+.28*k*k),s=sway*k,paint=c.createLinearGradient(0,y+a*.3,0,y-b);paint.addColorStop(0,low);paint.addColorStop(.55,k===1?'#e2341499':low);paint.addColorStop(1,high);c.globalAlpha=alpha*(k===1?.9:.95);c.fillStyle=paint;c.beginPath();c.moveTo(x-a/2,y);c.bezierCurveTo(x-a*.66,y-b*.42,x-a*.1+s*.4,y-b*.62,x+s,y-b);c.bezierCurveTo(x+a*.22+s*.3,y-b*.58,x+a*.68,y-b*.4,x+a/2,y);c.quadraticCurveTo(x,y+a*.36,x-a/2,y);c.fill()}c.globalAlpha=1};
  const bg=ready('trek-bg');
  if(bg){const k=Math.max(W/bg.naturalWidth,H/bg.naturalHeight),w=bg.naturalWidth*k,h=bg.naturalHeight*k;c.drawImage(bg,(W-w)/2,(H-h)/2,w,h)}
  else{const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#3c8a7a');sky.addColorStop(.2,'#4f9a5c');sky.addColorStop(1,'#3f8447');c.fillStyle=sky;c.fillRect(0,0,W,H)}
  // Soft light patches drift toward the hero, so the ground feels like it is moving.
  for(let i=0;i<9;i++){const z=FAR+(i/9+T*.1)%1*(1.1-FAR),p=P(Math.sin(i*5.3)*1.5,z);ellipse(p.x,p.y,62*p.s,15*p.s,i%2?'#fff8c414':'#0f3a2a1c')}
  // The dragon: where it stands and where its jaws are, so its fire really leaves its mouth.
  const chief=g.foes.find(f=>f.boss&&!f.dead),dragon=ready('emberpeak');let jaws=null,chiefAt=null;
  if(chief){const p=P(chief.x,chief.z),size=250*p.s,hover=Math.sin(T*2.6)*5*p.s;chiefAt={p,size,hover};
    // The painting looks left; it is mirrored when the lane it breathes on lies to its right.
    const breath=g.hazards.find(h=>h.breath);if(breath)chief.face=breath.face??=breath.x>chief.x+.05?-1:1;const face=chief.face||1;
    if(dragon){const {rect,scale,w,h}=spriteBox(dragon,'emberpeak',size,size);jaws={x:p.x+face*(-w/2+(128-rect[0])*scale),y:p.y+hover-h+(232-rect[1])*scale,z:chief.z}}}
  // Danger lanes. First a red warning, then fire (or a beam of violet light).
  const danger=h=>{const active=h.age>=1.6,top=h.foe?h.foe.z:FAR,lane=[P(h.x-.31,top),P(h.x+.31,top),P(h.x+.31,1.12),P(h.x-.31,1.12)],mouth=h.breath&&jaws&&chief?jaws:null;
    if(!active){poly(lane,`rgba(255,30,40,${.44+Math.sin(h.age*9)*.08})`);const p=P(h.x,.7);c.save();c.textAlign='center';c.font='900 38px Arial,sans-serif';c.lineWidth=6;c.lineJoin='round';c.strokeStyle='#7a1010';c.fillStyle='#fff3d0';c.strokeText('!',p.x,p.y);c.fillText('!',p.x,p.y);c.restore();
      if(mouth){c.save();c.globalCompositeOperation='lighter';const r=(14+h.age*26)*chiefAt.p.s;glow(mouth.x,mouth.y,r*2.2,[[0,'#fff6c0ee'],[.35,'#ff9a2aaa'],[1,'#ff3a1c00']]);c.restore();tongue(mouth.x,mouth.y+r*.5,r*.9,r*1.7,Math.sin(T*14)*r*.2,.9)}
      return}
    const fade=Math.min(1,(h.age-1.6)*7,(2.5-h.age)*5);
    if(h.laser){c.save();c.globalCompositeOperation='lighter';
      for(const [wide,color] of [[.31,'#7a2fe055'],[.21+Math.sin(T*30)*.02,'#b06bff66'],[.11,'#e3b8ff88'],[.04,'#ffffffcc']]){c.globalAlpha=fade;poly([P(h.x-wide,top),P(h.x+wide,top),P(h.x+wide,1.12),P(h.x-wide,1.12)],color)}
      for(let i=0;i<9;i++){const z=((rnd(i)+T*1.4)%1)*1.08,p=P(h.x+(rnd(i+11)-.5)*.5,z);c.globalAlpha=fade;star(p.x,p.y,10*p.s,'#f6e4ffdd')}
      c.globalAlpha=1;c.restore();return}
    // Fire: a glowing bed, then many tongues of flame streaming toward the hero, far ones first.
    const from=mouth?mouth.z+.03:top,start=P(h.x,from),bed=c.createLinearGradient(0,start.y,0,H);bed.addColorStop(0,'#ff8a2a22');bed.addColorStop(.5,'#ff5a1c66');bed.addColorStop(1,'#d92b1299');
    c.save();c.globalAlpha=fade;poly([P(h.x-.31,from),P(h.x+.31,from),P(h.x+.31,1.12),P(h.x-.31,1.12)],bed);
    c.globalCompositeOperation='lighter';for(let i=0;i<5;i++){const p=P(h.x,from+(1.05-from)*(i+.5)/5);c.globalAlpha=fade*.5;glow(p.x,p.y-10*p.s,70*p.s,[[0,'#ffb84a88'],[1,'#ff3a1c00']])}
    c.restore();
    const count=mouth?46:38,list=[];for(let i=0;i<count;i++)list.push([Math.pow((rnd(i)+T*(.85+rnd(i+40)*.3))%1,1.35),i]);list.sort((a,b)=>a[0]-b[0]);
    for(const [q,i] of list){const z=from+(1.1-from)*q,p=P(h.x,z),half=P(h.x+.31,z).x-p.x,pull=mouth?Math.pow(1-Math.min(1,q*3.2),2):0,narrow=mouth?Math.min(1,.12+q*3):1;
      const x=p.x+(rnd(i+9)-.5)*1.7*half*narrow+(mouth?(mouth.x-start.x)*pull:0),y=p.y+(mouth?(mouth.y-start.y)*pull:0),w=(32+rnd(i+20)*24)*p.s*(mouth?Math.min(1,.45+q*2.4):1),tall=w*(2+.45*Math.sin(T*16+i*2.3));
      tongue(x,y,w,tall,Math.sin(T*9+i*1.7)*w*.28,fade*Math.min(1,q*40+.4,(1-q)*6))}
    c.save();c.globalCompositeOperation='lighter';for(let i=0;i<6;i++){const p=P(h.x,from+(1.05-from)*(i+.5)/6);c.globalAlpha=fade*(.45+.15*Math.sin(T*13+i*2));glow(p.x,p.y-26*p.s,62*p.s,[[0,'#ffd27a77'],[.5,'#ff7a2a33'],[1,'#ff3a1c00']])}c.restore();
    // Embers fly up from the fire.
    c.save();c.globalCompositeOperation='lighter';for(let i=0;i<12;i++){const q=(rnd(i+70)+T*.8)%1,z=from+(1.08-from)*rnd(i+90),p=P(h.x+(rnd(i+80)-.5)*.6,z);c.globalAlpha=fade*(1-q);star(p.x+Math.sin(T*5+i)*6,p.y-q*90*p.s-20*p.s,3.2*p.s+1,'#ffe9a0')}c.globalAlpha=1;c.restore()};
  for(const h of g.hazards)if(h.age<1.6)danger(h);
  const barrel=ready('trek-barrel');
  const topper={elec:ready('trek-elec'),bomb:ready('trek-bomb')};
  for(const f of [...g.foes].sort((a,b)=>a.z-b.z)){const p=P(f.x,f.z);
    if(f.boss){const size=250*p.s,hover=Math.sin(T*2.6)*5*p.s;ellipse(p.x,p.y+4*p.s,size*.42-hover,18*p.s,'#0c2a1f77');
      c.save();c.globalCompositeOperation='lighter';glow(p.x,p.y-size*.45,size*.7,[[0,'#ff7a3a44'],[1,'#ff3a1c00']]);c.restore();
      c.save();c.translate(p.x,0);c.scale(f.face||1,1);sprite('emberpeak',0,p.y+hover,size,size);c.restore();
      if(f.flash>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,f.flash/.09);glow(p.x,p.y-size*.45,size*.42,[[0,'#fffbe04d'],[1,'#ff8a2a00']]);c.restore()}
      continue}
    const w=100*p.s,h=barrel?w*barrel.naturalHeight/barrel.naturalWidth:74*p.s;
    ellipse(p.x,p.y+3*p.s,w*.5,11*p.s,'#0c2a1f66');
    if(f.type){c.save();c.globalCompositeOperation='lighter';glow(p.x,p.y-h*.5,w*.8,f.type==='elec'?[[0,'#7fd4ff77'],[1,'#3a8dff00']]:[[0,'#ff9a5a66'],[1,'#ff3a1c00']]);c.restore()}
    if(barrel)picture(barrel,p.x-w/2,p.y-h,w,h);else{c.fillStyle='#b87f4a';c.fillRect(p.x-w/2,p.y-h,w,h)}
    if(f.type&&topper[f.type]){const t=74*p.s,bob=f.type==='elec'?Math.sin(T*9+f.x*3)*2*p.s:0;picture(topper[f.type],p.x-t/2,p.y-h*.86-t+bob,t,t)}
    else{const art=f.boom?'emberpeak':['guard-forest','guard-ember','guard-astral','guard-ember','guard-forest'][f.kind];sprite(art,p.x,p.y-h*.78,(f.boom?118:92)*p.s,(f.boom?100:80)*p.s)}
    if(g.frost>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,g.frost);glow(p.x,p.y-h*.55,w*.72,[[0,'#bfe8ff30'],[.6,'#8fd0ff22'],[1,'#7fc4ff00']]);c.restore()}
    if(f.boom){c.save();c.textAlign='center';c.font=`900 ${Math.max(12,24*p.s)}px Arial,sans-serif`;c.lineWidth=4;c.lineJoin='round';c.strokeStyle='#7a1010';c.fillStyle='#ffd0c0';c.strokeText('Rush',p.x+w*.55,p.y-h*1.5);c.fillText('Rush',p.x+w*.55,p.y-h*1.5);c.restore()}
    c.save();c.textAlign='center';c.textBaseline='middle';c.lineJoin='round';c.font=`900 ${Math.max(11,30*p.s)}px Arial,sans-serif`;c.lineWidth=Math.max(2,5*p.s);c.strokeStyle=f.type==='elec'?'#17406b':f.type==='bomb'?'#6b1a12':'#5b3418';c.fillStyle='#fff6dc';c.strokeText(Math.max(0,f.hp),p.x,p.y-h*.4);c.fillText(Math.max(0,f.hp),p.x,p.y-h*.4);c.restore();
    if(f.flash>0){c.save();c.globalCompositeOperation='lighter';c.globalAlpha=Math.min(1,f.flash/.09);glow(p.x,p.y-h*.5,w*.7,[[0,'#fffbe0aa'],[.3,'#ffd76577'],[1,'#ff8a2a00']]);c.restore()}
  }
  for(const h of g.hazards)if(h.age>=1.6)danger(h);
  const hero=P(g.x,.88),floor=hero.y+44;
  // Sun beam: a column of light from the bow to the far end of the clearing.
  if(g.laser>0){const a=Math.min(1,g.laser*3),pulse=Math.sin(T*34)*.012;c.save();c.globalCompositeOperation='lighter';
    for(const [wide,color] of [[.2,'#3ad8ff55'],[.12+pulse,'#9ff1ffaa'],[.05,'#ffffffee']]){c.globalAlpha=a;const tip=P(g.x,FAR),foot={x:hero.x,y:floor-118};poly([{x:tip.x-wide*40,y:tip.y},{x:tip.x+wide*40,y:tip.y},{x:foot.x+wide*118,y:foot.y},{x:foot.x-wide*118,y:foot.y}],color)}
    for(let i=0;i<7;i++){const q=(i/7+T*2.2)%1,p=P(g.x+(rnd(i+5)-.5)*.16,.84-q*(.84-FAR));c.globalAlpha=a*(1-q*.5);star(p.x,p.y-20*p.s,8*p.s,'#eaffff')}
    c.globalAlpha=a;glow(hero.x,floor-118,46,[[0,'#ffffffdd'],[.4,'#8fe9ffaa'],[1,'#3ad8ff00']]);c.restore()}
  // Bomb and rocket blasts, and the lightning of storm barrels.
  c.save();c.globalCompositeOperation='lighter';
  for(const e of g.blasts){const p=P(e.x,e.z),full=e.big?.6:.4,k=1-e.life/full,r=(e.big?260:120)*p.s*(.35+k*.65);c.globalAlpha=Math.max(0,1-k);glow(p.x,p.y-30*p.s,r,[[0,'#fffbe0ff'],[.3,'#ffb347dd'],[.7,'#ff5a2a88'],[1,'#ff3a1c00']]);c.strokeStyle='#fff3c4';c.lineWidth=4;c.beginPath();c.ellipse(p.x,p.y-10*p.s,r*.9,r*.34,0,0,7);c.stroke()}
  c.globalAlpha=1;c.lineCap='round';
  for(const a of g.arcs){const p1=P(a.x1,a.z1),p2=P(a.x2,a.z2),y1=a.hero?floor-118:p1.y-34*p1.s,x1=a.hero?hero.x:p1.x,y2=p2.y-34*p2.s;c.globalAlpha=Math.min(1,a.life*5);
    for(const [width,color] of [[6,a.hero?'#8a5bff':'#3a9bff'],[2.4,'#eafcff']]){c.strokeStyle=color;c.lineWidth=width;c.lineJoin='round';c.beginPath();c.moveTo(x1,y1);
      for(let i=1;i<8;i++){const t=i/8,jig=(rnd(i*7.3+Math.floor(T*30)*3.1+a.x2*5)-.5)*2*Math.max(14*(p1.s+p2.s)/2,Math.hypot(p2.x-x1,y2-y1)*.07);c.lineTo(x1+(p2.x-x1)*t+jig,y1+(y2-y1)*t+jig*.5)}
      c.lineTo(p2.x,y2);c.stroke()}
    glow(p2.x,y2,36*p2.s,[[0,'#eafcff99'],[1,a.hero?'#8a5bff00':'#3a9bff00']])}
  c.globalAlpha=1;c.restore();
  // Arrows of light: a teardrop with a bright tip and a short sparkle trail; frost turns them icy.
  const rocketArt=ready('trek-rocket'),tones=[['#fff3b8','#ffb347','#d95bff','#7a2fe0','#c66bff'],['#f4ffd0','#b6f25a','#3fc96b','#1f8a4c','#7dff9a'],['#e6fbff','#7fd4ff','#3a8dff','#2447c9','#7fc4ff'],['#fff0d0','#ffb347','#ff5a2a','#c21f1f','#ff8a5a'],['#ffffff','#d6f3ff','#8fd0ff','#4a8fe0','#bfeaff']][g.frost>0?4:g.power||0];
  for(const b of g.bolts){const p=P(b.x,b.z),r=13*p.s,y=p.y-12*p.s;
    if(b.rocket){const size=46*p.s;for(let i=1;i<=4;i++)ellipse(p.x-(b.vx||0)*i*2.4*p.s+Math.sin(T*40+i)*2,y+size*.35+i*9*p.s,(7-i)*p.s,(7-i)*p.s,`rgba(255,${200-i*30},120,${.5-i*.1})`);
      c.save();c.translate(p.x,y);c.rotate(Trek.clamp((b.vx||0)*.22,-.7,.7));if(rocketArt)picture(rocketArt,-size/2,-size*.7,size,size);else{c.fillStyle='#e23b3b';c.fillRect(-4*p.s,-size*.6,8*p.s,size*.8)}c.restore();continue}
    glow(p.x,y,r*1.7,[[0,tones[4]+'aa'],[.6,tones[4]+'44'],[1,tones[4]+'00']]);
    const body=c.createLinearGradient(0,y-r*1.3,0,y+r);body.addColorStop(0,tones[0]);body.addColorStop(.35,tones[1]);body.addColorStop(.7,tones[2]);body.addColorStop(1,tones[3]);
    c.fillStyle=body;c.beginPath();c.moveTo(p.x,y-r*1.35);c.bezierCurveTo(p.x+r*.95,y-r*.2,p.x+r*.75,y+r,p.x,y+r);c.bezierCurveTo(p.x-r*.75,y+r,p.x-r*.95,y-r*.2,p.x,y-r*1.35);c.fill();
    ellipse(p.x-r*.2,y-r*.25,r*.16,r*.32,'#ffffffcc')}
  c.save();c.globalCompositeOperation='lighter';
  for(const a of g.sparks){const p=P(a.x,a.z),r=(3+a.life*10)*p.s;c.globalAlpha=Math.min(1,a.life*2.2);star(p.x,p.y-20*p.s,r,a.color);star(p.x,p.y-20*p.s,r*.5,'#ffffff')}
  c.globalAlpha=1;c.restore();
  const icons={wings:'trek-pickup-1',shield:'trek-pickup-2',heart:'trek-pickup-3',multi:'trek-pickup-4',rocket:'trek-pickup-5',power:'trek-pickup-6',laser:'trek-pickup-7',chain:'trek-pickup-8',frost:'trek-pickup-9'};
  for(const d of g.drops){const p=P(d.x,d.z),icon=ready(icons[d.kind]),size=62*p.s,bob=Math.sin(T*6+d.x)*4*p.s;
    ellipse(p.x,p.y+2*p.s,size*.4,7*p.s,'#0c2a1f55');c.save();c.globalCompositeOperation='lighter';glow(p.x,p.y-size*.55+bob,size*.8,[[0,'#ffffff66'],[1,'#ffffff00']]);c.restore();
    if(icon)picture(icon,p.x-size/2,p.y-size*1.05+bob,size,size);else{c.fillStyle='#fff6d3';c.font=`bold ${24*p.s}px sans-serif`;c.textAlign='center';c.fillText(d.kind==='heart'?'♥':d.kind==='shield'?'◇':'W',p.x,p.y-7*p.s)}}
  // Frost: slow snow over the whole clearing.
  if(g.frost>0){c.save();c.globalAlpha=Math.min(1,g.frost)*.8;for(let i=0;i<26;i++){const y=((rnd(i+200)+T*(.12+rnd(i+230)*.1))%1)*H,x=rnd(i+260)*W+Math.sin(T*1.3+i)*14;star(x,y,2.6+rnd(i+290)*2.6,'#f2fbff')}c.restore()}
  // The two pets hop along a little behind her.
  const pets=g.pets||[g.x,g.x];[['d0',-84],['d1',84]].forEach(([id,dx],i)=>{const at=P(pets[i],.88).x+dx,hop=Math.abs(Math.sin(T*7.5+i*1.9))*7;ellipse(at,floor+1,27-hop,6.5-hop*.3,'#0c2a1f55');sprite(id,at,floor+2-hop,70,76)});
  // Wings bonus: no pasted wings any more; a soft aura and rising motes, and her own wings beat faster.
  if(g.boost>0){const a=Math.min(1,g.boost);c.save();c.globalCompositeOperation='lighter';c.globalAlpha=a;glow(hero.x,floor-96,150,[[0,'#b9a4ff40'],[1,'#6a4dff00']]);
    for(let i=0;i<8;i++){const q=(i/8+T*1.5)%1,x=hero.x+Math.sin(i*4.7)*60,y=floor-24-q*170;c.globalAlpha=a*(1-q)*.7;star(x,y,7*(1-q*.4),'#e6dcff')}c.restore()}
  // Reina as dressed in Fashion: the same assembled portrait the battles use. She bobs as she runs, leans into
  // turns, and her wings are drawn apart from her body so they can beat.
  const wingId=typeof fashionWing==='function'?fashionWing()?.id:'',wingArt=wingId?ready(wingId):null,apart=wingArt&&typeof registeredCombatBitmap==='function'?registeredCombatBitmap(true):null;
  const look=apart||(typeof registeredCombatBitmap==='function'?registeredCombatBitmap():null),step=Math.sin(T*10.5),lift=g.running||T?step*2.4-2.4:0;
  ellipse(hero.x,floor-2,62-lift*-1.5,13,'#0c2a1f77');
  c.save();c.translate(hero.x,floor);c.rotate((g.lean||0)*.11);c.translate(0,lift);c.scale(1-step*.007,1+step*.007);if(g.hurt>0)c.globalAlpha=.82;
  if(look){const iw=(look.naturalWidth||look.width)/2,ih=(look.naturalHeight||look.height)/2,h=172,w=h*500/740,u=w/500,x0=-w/2,y0=-h-40*u;
    if(apart){const fw=wingArt.naturalWidth,fh=wingArt.naturalHeight,k=Math.min(720/fw,600/fh),ww=fw*k*u,wh=fh*k*u,wx=x0+(-135+(720-fw*k)/2)*u,wy=y0+Math.max(-98,-115+(600-fh*k)/2)*u,beat=Math.sin(T*(g.boost>0?15:6.2));
      c.save();c.translate(wx+ww/2,wy+wh*.56);c.scale(1+beat*.06,1-beat*.035);picture(wingArt,-ww/2,-wh*.56,ww,wh);c.restore()}
    picture(look,x0-(iw-500)/2*u,-h-(ih-800+40)*u,iw*u,ih*u)}
  else sprite('reina-t3',0,0,110,160);
  c.restore();
  // Shield: a dome of hexagonal cells that slowly turns, with a band of light sweeping across it.
  if(g.shield>0||g.shieldBreak>0){const broken=!(g.shield>0),k=broken?1+(.5-g.shieldBreak)*1.1:1+Math.sin(T*3)*.012,alpha=broken?Math.max(0,g.shieldBreak/.5):Math.min(1,g.shield/1.2),rx=80*k,ry=106*k,cx=hero.x,cy=floor-92;
    const dome=()=>{c.beginPath();c.ellipse(cx,cy,rx,ry,0,0,Math.PI*2)};
    c.save();c.globalAlpha=alpha;
    const glass=c.createRadialGradient(cx-rx*.32,cy-ry*.36,rx*.08,cx,cy,ry*1.04);glass.addColorStop(0,'#f2ffff2e');glass.addColorStop(.5,'#59d8ff12');glass.addColorStop(.85,'#3aa8ff40');glass.addColorStop(1,'#a8f6ff99');dome();c.fillStyle=glass;c.fill();
    c.save();dome();c.clip();
    // Cells lie on a sphere: a flat honeycomb is bent so it crowds toward the rim, and it drifts sideways.
    const cell=.2,dx=Math.sqrt(3)*cell,drift=(T*.16)%dx,ball=(u,v)=>{const r=Math.hypot(u,v)||1e-6,s=Math.sin(Math.min(r,1.5708))/r;return [cx+u*s*rx,cy+v*s*ry]};
    c.beginPath();
    for(let row=-6;row<=6;row++)for(let col=-7;col<=7;col++){const u0=(col+(row&1)/2)*dx+drift,v0=row*1.5*cell;if(Math.hypot(u0,v0)>1.72)continue;
      for(let n=0;n<6;n++){const a=Math.PI/6+n*Math.PI/3,[x,y]=ball(u0+Math.cos(a)*cell*.94,v0+Math.sin(a)*cell*.94);n?c.lineTo(x,y):c.moveTo(x,y)}c.closePath()}
    c.lineJoin='round';c.fillStyle='#59d8ff14';c.fill();c.lineWidth=1.5;c.strokeStyle='#d6fbff8c';c.stroke();
    const at=(T*.5)%1.7-.35,sweep=c.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry),stop=(p,color)=>sweep.addColorStop(Trek.clamp(p,0,1),color);
    stop(at-.2,'#ffffff00');stop(at-.06,'#9ff1ff66');stop(at,'#ffffffee');stop(at+.06,'#9ff1ff66');stop(at+.2,'#ffffff00');
    c.globalCompositeOperation='lighter';c.fillStyle=sweep;c.globalAlpha=alpha*.3;c.fill();c.globalAlpha=alpha;c.strokeStyle=sweep;c.lineWidth=2.4;c.stroke();
    c.restore();
    // Rim light, a soft outer halo and two highlights make it read as a ball of glass.
    c.globalCompositeOperation='lighter';
    const rim=c.createLinearGradient(cx-rx,cy-ry,cx+rx,cy+ry);rim.addColorStop(0,'#f4ffffee');rim.addColorStop(.5,'#6ad8ff99');rim.addColorStop(1,'#3a8dffcc');
    dome();c.strokeStyle='#6ad8ff33';c.lineWidth=11;c.stroke();dome();c.strokeStyle=rim;c.lineWidth=2.6;c.stroke();
    c.save();c.translate(cx-rx*.42,cy-ry*.52);c.rotate(-.62);ellipse(0,0,rx*.2,ry*.045,'#ffffff59');c.restore();
    c.beginPath();c.ellipse(cx,cy,rx*.86,ry*.88,0,.35,1.25);c.strokeStyle='#bff4ff55';c.lineWidth=3;c.lineCap='round';c.stroke();
    c.restore()}
  const lead=g.foes.find(f=>f.boss);if(lead){const w=236,x=160,y=74,k=Math.max(0,lead.hp/lead.max);c.fillStyle='#1a0d0dcc';c.beginPath();c.roundRect?c.roundRect(x-3,y-3,w+6,20,7):c.rect(x-3,y-3,w+6,20);c.fill();c.fillStyle='#5a1b1b';c.fillRect(x,y,w,14);const bar=c.createLinearGradient(x,0,x+w,0);bar.addColorStop(0,'#ffb347');bar.addColorStop(1,'#ff3a2a');c.fillStyle=bar;c.fillRect(x,y,w*k,14);c.save();c.textAlign='center';c.font='900 13px Arial,sans-serif';c.fillStyle='#fff3d0';c.fillText('ASHEN CROWN · '+Math.max(0,Math.ceil(lead.hp)),x+w/2,y+12);c.restore()}
  for(const t of g.texts||[]){const p=P(t.x,t.z);c.save();c.globalAlpha=Math.min(1,t.life*2);c.textAlign='center';c.lineJoin='round';c.font='900 22px Arial,sans-serif';c.lineWidth=4;c.strokeStyle='#2b2a6a';c.fillStyle=t.text==='Defused'?'#b6ff9e':'#bfe4ff';c.strokeText(t.text,p.x,p.y-150);c.fillText(t.text,p.x,p.y-150);c.restore()}
  // A translucent thumb stick appears under the finger and never intercepts input.
  const stick=g.touch&&g.stick?g.stick:{x:240,y:742};ellipse(stick.x,stick.y,40,40,'#12322f38');c.strokeStyle='#e4fff238';c.lineWidth=2;c.beginPath();c.arc(stick.x,stick.y,40,0,7);c.stroke();ellipse(stick.x+Trek.clamp((g.target-g.x)*60,-24,24),stick.y,18,18,g.touch?'#d6fff866':'#dafff22b');
  if(g.hurt>0){c.save();c.globalAlpha=Math.min(1,g.hurt*1.4);const edge=c.createRadialGradient(240,400,250,240,400,520);edge.addColorStop(0,'#ff3b4a00');edge.addColorStop(1,'#ff3b4a88');c.fillStyle=edge;c.fillRect(0,0,W,H);c.restore()}
}
