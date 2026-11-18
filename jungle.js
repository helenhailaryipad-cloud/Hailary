// Jungle Trek: world-space combat and perspective rendering share one coordinate system.
const Trek = {
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  create:()=>({kind:'jungle',running:true,ended:false,paused:false,x:0,target:0,hp:3,score:0,time:0,shot:0,row:0,wave:0,hazardAt:7,hurt:0,boost:0,shield:0,foes:[],bolts:[],drops:[],sparks:[],hazards:[],kills:0}),
  // Simulated rivals for the live ranking: final scores fixed for one UTC day, earned evenly over the run.
  rivals(names,now){const day=new Date(now===undefined?Date.now():now).toISOString().slice(0,10);
    return names.map(name=>{let h=2166136261;for(const ch of name+day)h=Math.imul(h^ch.charCodeAt(0),16777619)>>>0;return {name,final:1500+(h%41)*50}})},
  standing(rivals,score,time){const now=rivals.map(r=>Math.floor(r.final*Math.min(1,time/90)/50)*50),lead=Math.max(score,...now);
    return {rank:1+now.filter(s=>s>score).length,of:rivals.length+1,gap:lead-score}},
  hit(g){if(g.hurt>0)return;if(g.shield>0){g.shield=0;g.hurt=.7;return}g.hp=Math.max(0,g.hp-1);g.hurt=1.3},
  burst(g,x,z,color){for(let i=0;i<12;i++)g.sparks.push({x,z,vx:(Math.random()-.5)*1.8,vz:(Math.random()-.5)*.45,life:.6,color})},
  say(g,text,x,z){(g.texts??=[]).push({text,x,z,life:1.3})},
  // Five lanes of barrels across the clearing.
  lanes:[-1.24,-.62,0,.62,1.24],
  lane(x){return this.lanes.reduce((best,at)=>Math.abs(at-x)<Math.abs(best-x)?at:best)},
  // Arrows fly at the barrel that is closest to Reina, weighing distance ahead against sideways reach.
  aim(g){let best=null,score=-Infinity;
    for(const f of g.foes){if(f.dead||f.z>.82||f.z<.03)continue;const value=f.z-Math.abs(f.x-g.x)*.45;if(value>score){score=value;best=f}}
    return best},
  step(g,dt,rng=Math.random){
    if(!g.running||g.paused||g.ended)return;
    dt=this.clamp(dt,0,.05);g.time=Math.min(90,g.time+dt);g.hurt-=dt;g.boost-=dt;g.shield-=dt;g.shot-=dt;g.row-=dt;g.hazardAt-=dt;
    g.x+=(g.target-g.x)*Math.min(1,dt*14);
    // A new row every 2.2 s: most lanes hold a barrel, and barrels grow sturdier as the run goes on.
    if(g.row<=0&&g.time<84){g.wave++;const tier=Math.floor(g.time/18);
      this.lanes.forEach((x,lane)=>{if(rng()<.3)return;const hp=30+tier*20+((lane*2+g.wave)%3)*10;g.foes.push({x,z:.02,hp,max:hp,kind:(g.wave+lane)%5,flash:0})});
      g.row=2.2;
    }
    if(g.shot<=0){const target=this.aim(g);let vx=0;
      if(target){const time=Math.max(.08,(.84-target.z)/1.095);vx=this.clamp((target.x-g.x)/time,-3.2,3.2)}
      for(const dx of (g.boost>0?[-.19,0,.19]:[0]))g.bolts.push({x:g.x+dx,z:.84,vx});
      g.shot=g.boost>0?.065:.13}
    for(const f of g.foes){f.z+=dt*(f.dash?1.5:.115);f.flash-=dt;if(f.z>=.88&&!f.passed){f.passed=true;if(Math.abs(f.x-g.x)<.3)this.hit(g)}}
    for(const b of g.bolts){const old=b.z;b.z-=dt*.98;b.x+=(b.vx||0)*dt;if(Math.abs(b.x)>1.9)b.dead=true;
      const f=g.foes.filter(f=>!f.dead&&f.z<.91&&Math.abs(f.x-b.x)<.3&&f.z>=b.z-.025&&f.z<=old+.025).sort((a,b)=>b.z-a.z)[0];
      if(f){b.dead=true;f.hp-=6;f.flash=.09;
        if(f.hp<=0){f.dead=true;g.score+=50;g.kills++;this.burst(g,f.x,f.z,'#ffd584');
          if(g.kills%4===0)g.drops.push({x:f.x,z:f.z,kind:g.kills%12===0?'heart':g.kills%8===0?'shield':'wings'})}}}
    // Danger lanes: a Boom barrel marks its lane red, then charges down it (break it first to call it off);
    // every other time a lane of fire or light strikes where Reina stands.
    if(g.hazardAt<=0){let foe=null;
      if(Math.floor(g.time/6.2)%2===0)for(const f of g.foes)if(!f.dead&&!f.boom&&f.z<.5&&(!foe||Math.abs(f.x-g.x)<Math.abs(foe.x-g.x)))foe=f;
      if(foe)foe.boom=true;
      g.hazards.push({x:foe?foe.x:this.lane(g.x),age:0,laser:!foe&&Math.floor(g.time/7)%2===0,foe});g.hazardAt=6.2}
    for(const h of g.hazards){h.age+=dt;
      if(h.foe){if(h.foe.dead&&h.age<1.6){h.age=9;this.say(g,'Defused',h.x,h.foe.z);continue}if(h.age>=1.6)h.foe.dash=true}
      if(h.age>=1.6&&h.age<2.3&&Math.abs(g.x-h.x)<.31)this.hit(g)}
    for(const d of g.drops){d.z+=dt*.16;if(d.z>=.83&&Math.abs(d.x-g.x)<.42){d.dead=true;
      if(d.kind==='heart'){g.hp=Math.min(3,g.hp+1);this.say(g,'+1 Life',g.x,.72)}else if(d.kind==='shield'){g.shield=9;this.say(g,'Shield',g.x,.72)}else{g.boost=9;this.say(g,'SPD +200%',g.x,.72)}
      this.burst(g,g.x,.85,'#b9eaff')}}
    for(const p of g.sparks){p.life-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt}
    for(const t of g.texts||[]){t.life-=dt;t.z-=dt*.05}
    g.foes=g.foes.filter(f=>!f.dead&&f.z<1.16);g.bolts=g.bolts.filter(b=>!b.dead&&b.z>0);g.drops=g.drops.filter(d=>!d.dead&&d.z<1.1);g.sparks=g.sparks.filter(p=>p.life>0);g.hazards=g.hazards.filter(h=>h.age<2.5);g.texts=(g.texts||[]).filter(t=>t.life>0);
    if(g.hp<=0||g.time>=90){g.ended=true;g.running=false}
  }
};
function showJungle(){
  $('#main').innerHTML=`<section class="jungle-screen"><div class="jungle-field"><canvas id="trekField" width="480" height="800" tabindex="0" aria-label="Jungle Trek. Drag left and right or use arrow keys. Automatic shooting. Escape pauses."></canvas><div id="trekHud" class="trek-top"><div><small>CURRENT SCORE</small><strong id="trekScore">0</strong><small id="trekBest">BEST ${fmt(S.jungleBest||0)}</small><span class="trek-rank" id="trekRank"></span></div><div class="trek-clock"><small>JUNGLE TREK</small><strong id="trekTime">01:30</strong></div><div><span id="trekLives" aria-label="3 lives">♥ ♥ ♥</span><button id="trekPause" onclick="pauseJungle()" aria-label="Pause run">Ⅱ</button></div></div><div class="trek-buffs" id="trekBuffs"></div><div class="trek-controls"><button onclick="go('games')" aria-label="Exit Jungle Trek">‹</button><span>DRAG TO MOVE · AUTO FIRE</span></div><div class="jungle-overlay" id="trekPanel"><small>WINGS OF WONDER</small><h2>Jungle Trek</h2><p>Break the barrels. Collect magical wings.<br>Dodge the red lanes and survive 90 seconds.</p><p class="trek-instruction">Drag left or right · 3 lives</p><button class="primary" onclick="startJungle()">Start adventure</button><button onclick="go('games')">Back to Mini Games</button></div></div></section>`;
  const g=Trek.create();g.running=false;g.foes=[{x:-1.24,z:.3,hp:120,max:120,kind:0},{x:-.62,z:.22,hp:60,max:60,kind:2},{x:0,z:.5,hp:60,max:60,kind:1},{x:.62,z:.39,hp:90,max:90,kind:3},{x:1.24,z:.22,hp:100,max:100,kind:4}];
  const canvas=$('#trekField');['trek-bg','trek-barrel','trek-pickup-1','trek-pickup-2','trek-pickup-3','reina-t3','d0','d1','guard-forest','guard-astral','guard-ember','emberpeak','fashion-wing-5'].forEach(artBitmap);if(typeof registeredCombatBitmap==='function')registeredCombatBitmap();
  let ticks=0;function preview(){if(!canvas.isConnected||game?.kind==='jungle')return;drawJungle(canvas.getContext('2d'),g);if(++ticks<90)requestAnimationFrame(preview)}preview();
}
function pauseJungle(force){const g=game;if(g?.kind!=='jungle'||!g.running)return;g.paused=force===undefined?!g.paused:force;const p=$('#trekPanel');p.hidden=!g.paused;if(g.paused)p.innerHTML='<h2>Trail paused</h2><p>Your adventure is waiting.</p><button class="primary" onclick="pauseJungle(false)">Continue</button><button onclick="go(\'games\')">Leave run</button>';$('#trekPause').textContent=g.paused?'▶':'Ⅱ'}
function startJungle(){
  if(game?.running)return;const canvas=$('#trekField');if(!canvas)return;const ctx=canvas.getContext('2d'),g=game=Trek.create();$('#trekPanel').hidden=true;canvas.focus({preventScroll:true});let pointer=null,origin=0,start=0,last=performance.now(),hud=-1;const rivals=Trek.rivals(typeof ADVENTURERS==='undefined'?[]:ADVENTURERS.map(a=>a.name));
  canvas.onpointerdown=e=>{if(pointer!==null||g.paused)return;e.preventDefault();pointer=e.pointerId;origin=e.clientX;start=g.x;g.touch=true;const r=canvas.getBoundingClientRect();g.stick={x:(e.clientX-r.left)/r.width*480,y:(e.clientY-r.top)/r.height*800};canvas.setPointerCapture(pointer)};
  canvas.onpointermove=e=>{if(pointer===e.pointerId&&!g.paused){const r=canvas.getBoundingClientRect();g.target=Trek.clamp(start+(e.clientX-origin)/r.width*3.5,-1.25,1.25)}};
  canvas.onpointercancel=canvas.onpointerup=()=>{pointer=null;g.touch=false};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();g.target=Trek.clamp(g.target+(['ArrowLeft','a'].includes(e.key)?-.3:.3),-1.25,1.25)}else if(e.key==='Escape'){e.preventDefault();pauseJungle()}};
  function finish(){if(g.rewarded)return;g.rewarded=true;S.jungleBest=Math.max(S.jungleBest||0,g.score);const gold=Math.min(800,g.kills*12),xp=Math.min(80,g.kills*2);gain(gold,0,xp);save();const p=$('#trekPanel');p.hidden=false;p.innerHTML=`<small>${g.hp?'TRAIL COMPLETE':'ADVENTURE ENDED'}</small><h2>${fmt(g.score)} points</h2><p>Personal best · ${fmt(S.jungleBest)}<br>${gold} gold · ${xp} base XP<br>Rank ${Trek.standing(rivals,g.score,90).rank} of ${rivals.length+1} · rivals are simulated AI adventurers</p><button class="primary" onclick="startJungle()">Play again</button><button onclick="go('games')">Mini Games</button>`}
  function frame(now){if(game!==g||!canvas.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden&&!g.paused)pauseJungle(true);Trek.step(g,dt);drawJungle(ctx,g);
    const stamp=[Math.ceil(g.time),g.hp,g.score,Math.ceil(g.boost),Math.ceil(g.shield),g.paused].join();if(stamp!==hud){hud=stamp;$('#trekScore').textContent=fmt(g.score);const place=Trek.standing(rivals,g.score,g.time);$('#trekRank').innerHTML=`Ranking <b>${place.rank}</b><br>Gap to leader <b>${fmt(place.gap)}</b>`;const t=Math.ceil(90-g.time);$('#trekTime').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('#trekLives').innerHTML=[0,1,2].map(i=>`<b style="color:${i<g.hp?'#ff6179':'#344e62'}">♥</b>`).join(' ');$('#trekLives').setAttribute('aria-label',g.hp+' lives');$('#trekBuffs').innerHTML=[['trek-pickup-1',g.boost,'Wings'],['trek-pickup-2',g.shield,'Shield']].map(([art,left,name])=>`<span class="${left>0?'on':''}"><img src="${artPath(art)}" alt="${name}"><b>${left>0?Math.ceil(left):''}</b></span>`).join('')}
    if(g.ended){finish();return}loop=requestAnimationFrame(frame)
  }loop=requestAnimationFrame(frame);
}
function drawJungle(c,g){
  // A high camera behind the hero: far rows are smaller but stay readable.
  const W=480,H=800,P=(x,z)=>({x:240+x*(100+z*58),y:150+Math.pow(Math.max(0,z),1.35)*585,s:.46+z*.62});
  const ready=id=>{const image=artBitmap(id);return image?.complete&&image.naturalWidth?image:null};
  const poly=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill()};
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
  const glow=(x,y,r,stops)=>{const grad=c.createRadialGradient(x,y,0,x,y,r);stops.forEach(([at,color])=>grad.addColorStop(at,color));ellipse(x,y,r,r,grad)};
  const star=(x,y,r,color)=>{c.fillStyle=color;c.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,d=i%2?r*.28:r;c.lineTo(x+Math.cos(a)*d,y+Math.sin(a)*d)}c.closePath();c.fill()};
  const bg=ready('trek-bg');
  if(bg){const k=Math.max(W/bg.naturalWidth,H/bg.naturalHeight),w=bg.naturalWidth*k,h=bg.naturalHeight*k;c.drawImage(bg,(W-w)/2,(H-h)/2,w,h)}
  else{const sky=c.createLinearGradient(0,0,0,H);sky.addColorStop(0,'#3c8a7a');sky.addColorStop(.2,'#4f9a5c');sky.addColorStop(1,'#3f8447');c.fillStyle=sky;c.fillRect(0,0,W,H)}
  // Soft light patches drift toward the hero, so the ground feels like it is moving.
  for(let i=0;i<9;i++){const z=(i/9+g.time*.115)%1.1,p=P(Math.sin(i*5.3)*1.5,z);ellipse(p.x,p.y,62*p.s,15*p.s,i%2?'#fff8c414':'#0f3a2a1c')}
  for(const h of g.hazards){const active=h.age>=1.6,lane=[P(h.x-.31,h.foe?h.foe.z:0),P(h.x+.31,h.foe?h.foe.z:0),P(h.x+.31,1.12),P(h.x-.31,1.12)];
    if(!active){poly(lane,`rgba(255,40,44,${.42+Math.sin(h.age*16)*.12})`);const p=P(h.x,.7);c.save();c.textAlign='center';c.font='900 34px sans-serif';c.fillStyle='#fff3d0';c.shadowColor='#7a1010';c.shadowBlur=6;c.fillText('!',p.x,p.y);c.restore();continue}
    const grad=c.createLinearGradient(0,150,0,H);if(h.laser){grad.addColorStop(0,'#c56bff66');grad.addColorStop(1,'#8f3dffb0')}else{grad.addColorStop(0,'#ff7a2a70');grad.addColorStop(1,'#ff3a1cc0')}poly(lane,grad);
    c.save();c.globalCompositeOperation='lighter';for(let i=0;i<9;i++){const z=((i/9+g.time*(h.laser?.9:.45))%1)*1.08,p=P(h.x+Math.sin(i*3.1+g.time*5)*.3,z),r=(h.laser?16:24)*p.s;glow(p.x,p.y-r*.5,r,h.laser?[[0,'#ffffffcc'],[.4,'#d58bffaa'],[1,'#8f3dff00']]:[[0,'#fff3b0dd'],[.35,'#ff9d36bb'],[1,'#ff3a1c00']])}c.restore()}
  const barrel=ready('trek-barrel');
  for(const f of [...g.foes].sort((a,b)=>a.z-b.z)){const p=P(f.x,f.z),w=100*p.s,h=barrel?w*barrel.naturalHeight/barrel.naturalWidth:74*p.s;
    ellipse(p.x,p.y+3*p.s,w*.5,11*p.s,'#0c2a1f66');
    if(barrel)c.drawImage(barrel,p.x-w/2,p.y-h,w,h);else{c.fillStyle='#b87f4a';c.fillRect(p.x-w/2,p.y-h,w,h)}
    const art=f.boom?'emberpeak':['guard-forest','guard-ember','guard-astral','guard-ember','guard-forest'][f.kind];drawArtSprite(c,art,p.x,p.y-h*.78,(f.boom?118:92)*p.s,(f.boom?100:80)*p.s);
    if(f.boom){c.save();c.textAlign='center';c.font=`900 ${Math.max(12,24*p.s)}px Arial,sans-serif`;c.lineWidth=4;c.strokeStyle='#7a1010';c.fillStyle='#ffd0c0';c.strokeText('Boom',p.x+w*.55,p.y-h*1.5);c.fillText('Boom',p.x+w*.55,p.y-h*1.5);c.restore()}
    c.save();c.textAlign='center';c.textBaseline='middle';c.font=`900 ${Math.max(13,30*p.s)}px Arial,sans-serif`;c.lineWidth=Math.max(2,5*p.s);c.strokeStyle='#5b3418';c.fillStyle='#fff6dc';c.strokeText(Math.max(0,f.hp),p.x,p.y-h*.4);c.fillText(Math.max(0,f.hp),p.x,p.y-h*.4);c.restore();
    if(f.flash>0){c.save();c.globalCompositeOperation='lighter';glow(p.x,p.y-h*.5,w*.75,[[0,'#fffbe0ee'],[.3,'#ffd765aa'],[1,'#ff8a2a00']]);star(p.x,p.y-h*.5,w*.7,'#fff6c488');c.restore()}
  }
  // Arrows of light: a violet teardrop with a golden tip and a short sparkle trail.
  for(const b of g.bolts){const p=P(b.x,b.z),r=13*p.s,y=p.y-12*p.s;
    glow(p.x,y,r*1.7,[[0,'#c66bffaa'],[.6,'#8a3dff44'],[1,'#8a3dff00']]);
    const body=c.createLinearGradient(0,y-r*1.3,0,y+r);body.addColorStop(0,'#fff3b8');body.addColorStop(.35,'#ffb347');body.addColorStop(.7,'#d95bff');body.addColorStop(1,'#7a2fe0');
    c.fillStyle=body;c.beginPath();c.moveTo(p.x,y-r*1.35);c.bezierCurveTo(p.x+r*.95,y-r*.2,p.x+r*.75,y+r,p.x,y+r);c.bezierCurveTo(p.x-r*.75,y+r,p.x-r*.95,y-r*.2,p.x,y-r*1.35);c.fill();
    ellipse(p.x-r*.2,y-r*.25,r*.16,r*.32,'#ffffffcc');
    if((Math.floor(b.z*36)+Math.floor(g.time*18))%4===0)star(p.x+Math.sin(b.z*70)*r*1.2,y+r*1.5,r*.45,'#f6d8ffdd')}
  c.save();c.globalCompositeOperation='lighter';
  for(const a of g.sparks){const p=P(a.x,a.z),r=(4+a.life*14)*p.s;glow(p.x,p.y-20*p.s,r,[[0,'#ffffffee'],[.4,a.color],[1,'#ffffff00']])}
  c.restore();
  for(const d of g.drops){const p=P(d.x,d.z),icon=ready({wings:'trek-pickup-1',shield:'trek-pickup-2',heart:'trek-pickup-3'}[d.kind]),size=58*p.s,bob=Math.sin(g.time*6+d.x)*4*p.s;
    ellipse(p.x,p.y+2*p.s,size*.4,7*p.s,'#0c2a1f55');c.save();c.globalCompositeOperation='lighter';glow(p.x,p.y-size*.55+bob,size*.8,[[0,'#ffffff66'],[1,'#ffffff00']]);c.restore();
    if(icon)c.drawImage(icon,p.x-size/2,p.y-size*1.05+bob,size,size);else{c.fillStyle='#fff6d3';c.font=`bold ${24*p.s}px sans-serif`;c.textAlign='center';c.fillText(d.kind==='heart'?'♥':d.kind==='shield'?'◇':'W',p.x,p.y-7*p.s)}}
  const hero=P(g.x,.88),floor=hero.y+44;
  ellipse(hero.x,floor-2,62,13,'#0c2a1f77');drawArtSprite(c,'d0',hero.x-84,floor+2,70,76);drawArtSprite(c,'d1',hero.x+84,floor+2,70,76);
  c.save();if(g.hurt>0)c.globalAlpha=.55+Math.sin(g.hurt*30)*.25;
  if(g.boost>0){c.save();c.globalCompositeOperation='lighter';glow(hero.x,floor-110,190,[[0,'#b9a4ff55'],[1,'#6a4dff00']]);c.restore();drawArtSprite(c,'fashion-wing-5',hero.x,floor-50,330,200)}
  // Reina as dressed in Fashion: the same assembled portrait the battles use.
  const look=typeof registeredCombatBitmap==='function'?registeredCombatBitmap():null;
  if(look){const iw=(look.naturalWidth||look.width)/2,ih=(look.naturalHeight||look.height)/2,h=172,w=h*500/740,u=w/500,v=h/740;c.drawImage(look,hero.x-w/2-(iw-500)/2*u,floor-h-(ih-800+40)*v,iw*u,ih*v)}
  else drawArtSprite(c,'reina-t3',hero.x,floor,110,160);
  c.restore();
  if(g.shield>0){c.save();c.globalCompositeOperation='lighter';c.strokeStyle='#9eefff';c.lineWidth=4;c.shadowColor='#6ad8ff';c.shadowBlur=16;c.beginPath();c.ellipse(hero.x,floor-96,72,108,0,0,7);c.stroke();c.restore()}
  for(const t of g.texts||[]){const p=P(t.x,t.z);c.save();c.globalAlpha=Math.min(1,t.life*2);c.textAlign='center';c.font='900 22px Arial,sans-serif';c.lineWidth=4;c.strokeStyle='#2b2a6a';c.fillStyle=t.text==='Defused'?'#b6ff9e':'#bfe4ff';c.strokeText(t.text,p.x,p.y-150);c.fillText(t.text,p.x,p.y-150);c.restore()}
  // A translucent thumb stick appears under the finger and never intercepts input.
  const stick=g.touch&&g.stick?g.stick:{x:240,y:742};ellipse(stick.x,stick.y,40,40,'#12322f38');c.strokeStyle='#e4fff238';c.lineWidth=2;c.beginPath();c.arc(stick.x,stick.y,40,0,7);c.stroke();ellipse(stick.x+Trek.clamp((g.target-g.x)*60,-24,24),stick.y,18,18,g.touch?'#d6fff866':'#dafff22b');
  if(g.hurt>0){const edge=c.createRadialGradient(240,400,250,240,400,520);edge.addColorStop(0,'#ff3b4a00');edge.addColorStop(1,'#ff3b4a99');c.fillStyle=edge;c.fillRect(0,0,W,H)}
}
