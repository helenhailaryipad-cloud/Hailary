// Jungle Trek: world-space combat and perspective rendering share one coordinate system.
const Trek = {
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
  create:()=>({kind:'jungle',running:true,ended:false,paused:false,x:0,target:0,hp:3,score:0,time:0,shot:0,row:0,wave:0,hazardAt:7,hurt:0,boost:0,shield:0,foes:[],bolts:[],drops:[],sparks:[],hazards:[],kills:0}),
  hit(g){if(g.hurt>0)return;if(g.shield>0){g.shield=0;g.hurt=.7;return}g.hp=Math.max(0,g.hp-1);g.hurt=1.3},
  burst(g,x,z,color){for(let i=0;i<12;i++)g.sparks.push({x,z,vx:(Math.random()-.5)*1.8,vz:(Math.random()-.5)*.45,life:.6,color})},
  step(g,dt,rng=Math.random){
    if(!g.running||g.paused||g.ended)return;
    dt=this.clamp(dt,0,.05);g.time=Math.min(90,g.time+dt);g.hurt-=dt;g.boost-=dt;g.shield-=dt;g.shot-=dt;g.row-=dt;g.hazardAt-=dt;
    g.x+=(g.target-g.x)*Math.min(1,dt*14);
    if(g.row<=0&&g.time<84){g.wave++;const gap=g.wave%4===0?Math.floor(rng()*3):-1;
      for(let lane=0;lane<3;lane++){if(lane===gap)continue;const hp=30+Math.floor(g.time/18)*30+(lane===g.wave%3?0:30);g.foes.push({x:lane-1,z:.02,hp,max:hp,kind:(g.wave+lane)%5,flash:0})}g.row=2.8;
    }
    if(g.shot<=0){for(const dx of (g.boost>0?[-.19,0,.19]:[0]))g.bolts.push({x:g.x+dx,z:.84});g.shot=g.boost>0?.065:.13}
    for(const f of g.foes){f.z+=dt*.115;f.flash-=dt;if(f.z>=.88&&!f.passed){f.passed=true;if(Math.abs(f.x-g.x)<.36)this.hit(g)}}
    for(const b of g.bolts){const old=b.z;b.z-=dt*.98;const f=g.foes.filter(f=>!f.dead&&f.z<.91&&Math.abs(f.x-b.x)<.32&&f.z>=b.z-.025&&f.z<=old+.025).sort((a,b)=>b.z-a.z)[0];if(f){b.dead=true;f.hp-=6;f.flash=.09;if(f.hp<=0){f.dead=true;g.score+=50;g.kills++;this.burst(g,f.x,f.z,'#ffd584');if(g.kills%4===0)g.drops.push({x:f.x,z:f.z,kind:g.kills%12===0?'heart':g.kills%8===0?'shield':'wings'})}}}
    if(g.hazardAt<=0){g.hazards.push({x:Math.round(g.x),age:0,laser:Math.floor(g.time/7)%2===0});g.hazardAt=6.2}
    for(const h of g.hazards){h.age+=dt;if(h.age>=1.6&&h.age<2.3&&Math.abs(g.x-h.x)<.34)this.hit(g)}
    for(const d of g.drops){d.z+=dt*.16;if(d.z>=.83&&Math.abs(d.x-g.x)<.42){d.dead=true;if(d.kind==='heart')g.hp=Math.min(3,g.hp+1);else if(d.kind==='shield')g.shield=9;else g.boost=9;this.burst(g,g.x,.85,'#b9eaff')}}
    for(const p of g.sparks){p.life-=dt;p.x+=p.vx*dt;p.z+=p.vz*dt}
    g.foes=g.foes.filter(f=>!f.dead&&f.z<1.16);g.bolts=g.bolts.filter(b=>!b.dead&&b.z>0);g.drops=g.drops.filter(d=>!d.dead&&d.z<1.1);g.sparks=g.sparks.filter(p=>p.life>0);g.hazards=g.hazards.filter(h=>h.age<2.5);
    if(g.hp<=0||g.time>=90){g.ended=true;g.running=false}
  }
};
function showJungle(){
  $('#main').innerHTML=`<section class="jungle-screen"><div class="jungle-field"><canvas id="trekField" width="480" height="800" tabindex="0" aria-label="Jungle Trek. Drag left and right or use arrow keys. Automatic shooting. Escape pauses."></canvas><div id="trekHud" class="trek-top"><div><small>CURRENT SCORE</small><strong id="trekScore">0</strong><small id="trekBest">BEST ${fmt(S.jungleBest||0)}</small></div><div class="trek-clock"><small>JUNGLE TREK</small><strong id="trekTime">01:30</strong></div><div><span id="trekLives" aria-label="3 lives">♥ ♥ ♥</span><button id="trekPause" onclick="pauseJungle()" aria-label="Pause run">Ⅱ</button></div></div><div class="trek-buffs" id="trekBuffs"></div><div class="trek-controls"><button onclick="go('games')" aria-label="Exit Jungle Trek">‹</button><span>DRAG TO MOVE · AUTO FIRE</span></div><div class="jungle-overlay" id="trekPanel"><small>WINGS OF WONDER</small><h2>Jungle Trek</h2><p>Break the barrels. Collect magical wings.<br>Dodge the red lanes and survive 90 seconds.</p><p class="trek-instruction">Drag left or right · 3 lives</p><button class="primary" onclick="startJungle()">Start adventure</button><button onclick="go('games')">Back to Mini Games</button></div></div></section>`;
  const g=Trek.create();g.running=false;g.foes=[{x:-1,z:.3,hp:120,max:120,kind:0},{x:0,z:.5,hp:60,max:60,kind:1},{x:1,z:.39,hp:90,max:90,kind:3}];
  const canvas=$('#trekField');['battle-castle','reina-t3','d0','d1','guard-forest','guard-astral','guard-ember','emberpeak','fashion-wing-5'].forEach(artBitmap);
  let ticks=0;function preview(){if(!canvas.isConnected||game?.kind==='jungle')return;drawJungle(canvas.getContext('2d'),g);if(++ticks<90)requestAnimationFrame(preview)}preview();
}
function pauseJungle(force){const g=game;if(g?.kind!=='jungle'||!g.running)return;g.paused=force===undefined?!g.paused:force;const p=$('#trekPanel');p.hidden=!g.paused;if(g.paused)p.innerHTML='<h2>Trail paused</h2><p>Your adventure is waiting.</p><button class="primary" onclick="pauseJungle(false)">Continue</button><button onclick="go(\'games\')">Leave run</button>';$('#trekPause').textContent=g.paused?'▶':'Ⅱ'}
function startJungle(){
  if(game?.running)return;const canvas=$('#trekField');if(!canvas)return;const ctx=canvas.getContext('2d'),g=game=Trek.create();$('#trekPanel').hidden=true;canvas.focus({preventScroll:true});let pointer=null,origin=0,start=0,last=performance.now(),hud=-1;
  canvas.onpointerdown=e=>{if(pointer!==null||g.paused)return;e.preventDefault();pointer=e.pointerId;origin=e.clientX;start=g.x;g.touch=true;canvas.setPointerCapture(pointer)};
  canvas.onpointermove=e=>{if(pointer===e.pointerId&&!g.paused){const r=canvas.getBoundingClientRect();g.target=Trek.clamp(start+(e.clientX-origin)/r.width*3.5,-1.25,1.25)}};
  canvas.onpointercancel=canvas.onpointerup=()=>{pointer=null;g.touch=false};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','a','d'].includes(e.key)){e.preventDefault();g.target=Trek.clamp(g.target+(['ArrowLeft','a'].includes(e.key)?-.3:.3),-1.25,1.25)}else if(e.key==='Escape'){e.preventDefault();pauseJungle()}};
  function finish(){if(g.rewarded)return;g.rewarded=true;S.jungleBest=Math.max(S.jungleBest||0,g.score);const gold=Math.min(800,g.kills*12),xp=Math.min(80,g.kills*2);gain(gold,0,xp);save();const p=$('#trekPanel');p.hidden=false;p.innerHTML=`<small>${g.hp?'TRAIL COMPLETE':'ADVENTURE ENDED'}</small><h2>${fmt(g.score)} points</h2><p>Personal best · ${fmt(S.jungleBest)}<br>${gold} gold · ${xp} base XP</p><button class="primary" onclick="startJungle()">Play again</button><button onclick="go('games')">Mini Games</button>`}
  function frame(now){if(game!==g||!canvas.isConnected)return;const dt=Math.min(.05,(now-last)/1000);last=now;if(document.hidden&&!g.paused)pauseJungle(true);Trek.step(g,dt);drawJungle(ctx,g);
    const stamp=[Math.ceil(g.time),g.hp,g.score,Math.ceil(g.boost),Math.ceil(g.shield),g.paused].join();if(stamp!==hud){hud=stamp;$('#trekScore').textContent=fmt(g.score);const t=Math.ceil(90-g.time);$('#trekTime').textContent=String(Math.floor(t/60)).padStart(2,'0')+':'+String(t%60).padStart(2,'0');$('#trekLives').innerHTML=[0,1,2].map(i=>`<b style="color:${i<g.hp?'#ff6179':'#344e62'}">♥</b>`).join(' ');$('#trekLives').setAttribute('aria-label',g.hp+' lives');$('#trekBuffs').innerHTML=(g.boost>0?`<span>ARCANE WINGS<br><b>RAPID ×3 · ${Math.ceil(g.boost)}s</b></span>`:'')+(g.shield>0?`<span>SHIELD · ${Math.ceil(g.shield)}s</span>`:'')}
    if(g.ended){finish();return}loop=requestAnimationFrame(frame)
  }loop=requestAnimationFrame(frame);
}
function drawJungle(c,g){
  const W=480,H=800,P=(x,z)=>({x:240+x*(27+z*z*137),y:119+z*z*651,s:.14+z*z*1.1});
  const poly=(pts,fill)=>{c.fillStyle=fill;c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fill()};
  const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill()};
  let bg=c.createLinearGradient(0,0,0,H);bg.addColorStop(0,'#387f97');bg.addColorStop(.28,'#256b64');bg.addColorStop(1,'#173e37');c.fillStyle=bg;c.fillRect(0,0,W,H);
  const landscape=artBitmap('battle-castle');if(landscape?.naturalWidth){c.globalAlpha=.42;c.drawImage(landscape,240,0,480,300,0,50,480,265);c.globalAlpha=1}
  poly([P(-1.55,0),P(1.55,0),P(1.55,1.1),P(-1.55,1.1)],'#8f9c6b');
  const path=c.createLinearGradient(0,140,0,800);path.addColorStop(0,'#79a18a');path.addColorStop(.5,'#b2b98a');path.addColorStop(1,'#89976b');poly([P(-1.35,0),P(1.35,0),P(1.35,1.1),P(-1.35,1.1)],path);
  // Scrolling ground, fern banks and trees retain their world position during approach.
  for(let i=0;i<62;i++){const z=(i/62+g.time*.115)%1.12,side=i%2?-1:1,p=P(side*(1.5+(i%5)*.24),z),q=P(Math.sin(i*7.1)*1.2,z);ellipse(q.x,q.y,12*p.s,2*p.s,'#546f4a25');
    if(i%3===0){ellipse(p.x,p.y,33*p.s,9*p.s,'#122d3499');poly([{x:p.x-19*p.s,y:p.y},{x:p.x-12*p.s,y:p.y-20*p.s},{x:p.x+12*p.s,y:p.y-23*p.s},{x:p.x+25*p.s,y:p.y-4*p.s}],'#526b79')}
    else{c.strokeStyle=i%2?'#3b8d67':'#75a970';c.lineWidth=2*p.s;for(let j=-3;j<=3;j++){c.beginPath();c.moveTo(p.x,p.y);c.quadraticCurveTo(p.x+j*10*p.s,p.y-26*p.s,p.x+j*12*p.s,p.y-12*p.s);c.stroke()}}
  }
  for(let i=0;i<12;i++){let z=(i/12+g.time*.115)%1.15,p=P(i%2?2.15:-2.15,z);c.strokeStyle='#224e48';c.lineWidth=12*p.s;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(p.x+12*p.s,p.y-190*p.s);c.stroke();for(let j=0;j<4;j++)ellipse(p.x+(j-1)*22*p.s,p.y-(160+j%2*25)*p.s,48*p.s,21*p.s,j%2?'#216054':'#2c7460')}
  for(const h of g.hazards){const active=h.age>=1.6;poly([P(h.x-.43,.03),P(h.x+.43,.03),P(h.x+.43,1.1),P(h.x-.43,1.1)],active?(h.laser?'#b040d36e':'#ff5d256e'):`rgba(245,54,65,${.22+Math.sin(h.age*18)*.07})`);if(active){const a=P(h.x,.05),b=P(h.x,1.1);c.save();c.shadowBlur=20;c.shadowColor=h.laser?'#ec6aff':'#ff9d36';c.strokeStyle=h.laser?'#edbaff':'#ffdf89';c.lineWidth=h.laser?9:18;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(b.x,b.y);c.stroke();c.restore()}else{const p=P(h.x,.72);c.fillStyle='#ffe8b4';c.font='bold 28px sans-serif';c.textAlign='center';c.fillText('!',p.x,p.y)}}
  for(const f of [...g.foes].sort((a,b)=>a.z-b.z)){const p=P(f.x,f.z),w=88*p.s,h=61*p.s;ellipse(p.x,p.y+8*p.s,w*.58,h*.21,'#0b30375c');
    const wood=c.createLinearGradient(p.x-w/2,0,p.x+w/2,0);wood.addColorStop(0,'#92623c');wood.addColorStop(.25,'#e9b378');wood.addColorStop(.65,'#be8850');wood.addColorStop(1,'#805538');c.fillStyle=wood;c.fillRect(p.x-w/2,p.y-h,w,h);ellipse(p.x-w/2,p.y-h/2,8*p.s,h/2,'#805a3c');ellipse(p.x+w/2,p.y-h/2,7*p.s,h/2,'#a77a50');c.strokeStyle='#825333';c.lineWidth=p.s;for(let j=1;j<4;j++){c.beginPath();c.moveTo(p.x-w/2,p.y-h+j*h/4);c.lineTo(p.x+w/2,p.y-h+j*h/4);c.stroke()}c.fillStyle='#4d5d61';c.fillRect(p.x-w*.4,p.y-h,7*p.s,h);c.fillRect(p.x+w*.3,p.y-h,7*p.s,h);
    const art=['guard-forest','guard-ember','guard-astral','emberpeak','guard-forest'][f.kind];drawArtSprite(c,art,p.x,p.y-h+7*p.s,92*p.s,77*p.s);
    c.save();c.textAlign='center';c.font=`900 ${Math.max(12,28*p.s)}px sans-serif`;c.shadowColor='#66412e';c.shadowBlur=3;c.fillStyle='#fff6dc';c.fillText(Math.max(0,f.hp),p.x,p.y-h*.3);c.restore();if(f.flash>0){c.globalAlpha=.65;ellipse(p.x,p.y-h*.5,w*.45,h*.45,'#fff5ac');c.globalAlpha=1}
  }
  c.save();c.globalCompositeOperation='lighter';for(const b of g.bolts){const p=P(b.x,b.z);const glow=c.createRadialGradient(p.x,p.y,0,p.x,p.y,17*p.s);glow.addColorStop(0,'#fff2b7');glow.addColorStop(.22,'#e483ff');glow.addColorStop(1,'#843aff00');ellipse(p.x,p.y,17*p.s,25*p.s,glow);ellipse(p.x,p.y-6*p.s,3*p.s,8*p.s,'#fff0c8')}c.restore();
  for(const d of g.drops){const p=P(d.x,d.z);ellipse(p.x,p.y-15*p.s,21*p.s,21*p.s,'#c7a1ff77');c.fillStyle='#fff6d3';c.font=`bold ${24*p.s}px sans-serif`;c.textAlign='center';c.fillText(d.kind==='heart'?'♥':d.kind==='shield'?'◇':'W',p.x,p.y-7*p.s)}
  const hero=P(g.x,.88),floor=hero.y+40;ellipse(hero.x,floor-2,46,12,'#102f3980');drawArtSprite(c,'d0',hero.x-65,floor+4,65,70);drawArtSprite(c,'d1',hero.x+65,floor+4,65,70);
  c.save();if(g.hurt>0)c.globalAlpha=.5+Math.sin(g.hurt*30)*.25;if(g.boost>0)drawArtSprite(c,'fashion-wing-5',hero.x,floor-32,218,133);drawArtSprite(c,'reina-t3',hero.x,floor,92,132);c.restore();if(g.shield>0){c.strokeStyle='#8eebff';c.lineWidth=3;c.beginPath();c.ellipse(hero.x,floor-65,49,72,0,0,7);c.stroke()}
  for(const a of g.sparks){const p=P(a.x,a.z);c.globalAlpha=Math.min(1,a.life*2);c.fillStyle=a.color;c.fillRect(p.x,p.y,6*p.s,3*p.s)}c.globalAlpha=1;
  // A translucent thumb guide stays below combat and never intercepts input.
  ellipse(240,729,37,37,'#153f432c');c.strokeStyle='#d1efe52c';c.lineWidth=2;c.beginPath();c.arc(240,729,37,0,7);c.stroke();ellipse(240+(g.target-g.x)*35,729,17,17,g.touch?'#c7fff655':'#dafff225');
  if(g.hurt>0){c.strokeStyle='#ff596a88';c.lineWidth=9;c.strokeRect(4,4,472,792)}
}
