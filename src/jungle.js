// A short forest run. Coordinates are shared by simulation, drawing and touch input.
function showJungle() {
  $('#main').innerHTML = `<section class="jungle-screen"><div class="jungle-heading"><button onclick="go('games')">‹ Mini Games</button><h1>Jungle Trek</h1></div><div class="jungle-field"><canvas id="trekField" width="400" height="540" tabindex="0" aria-label="Jungle trail. Drag or use the arrow keys to move."></canvas><div class="jungle-hud" id="trekHud"></div><div class="jungle-overlay" id="trekPanel"><h2>Jungle Trek</h2><p>Drag left or right. Reina fires automatically. Defeat the guardian at the end of the trail.</p><small>Personal best · ${fmt(S.jungleBest || 0)}</small><button class="primary" onclick="startJungle()">Start run</button></div></div></section>`;
}
function startJungle() {
  if (game?.running) return;
  const canvas = $('#trekField'), ctx = canvas.getContext('2d');
  const g = game = {kind:'jungle',running:true,ended:false,x:200,target:200,hp:3,score:0,time:0,
    shot:0,spawn:0,hurt:0,foes:[],arrows:[],seeds:[],boss:false,volley:1};
  $('#trekPanel').hidden = true;
  canvas.focus({preventScroll:true});
  let pointer=null;
  function steer(e) {
    const r=canvas.getBoundingClientRect();
    g.target=Math.max(28, Math.min(372, (e.clientX-r.left)*400/r.width));
  }
  canvas.onpointerdown=e=>{if(pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);steer(e)};
  canvas.onpointermove=e=>{if(pointer===e.pointerId)steer(e)};
  canvas.onpointercancel=canvas.onpointerup=()=>{pointer=null};
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight'].includes(e.key)){e.preventDefault();g.target=Math.max(28,Math.min(372,g.target+(e.key==='ArrowLeft'?-38:38)))}};
  function finish(won) {
    g.ended=true;g.running=false;
    S.jungleBest=Math.max(S.jungleBest||0,g.score);save();
    const panel=$('#trekPanel');panel.hidden=false;
    panel.innerHTML=`<h2>${won?'Guardian defeated':'Trail ended'}</h2><p>Score · ${g.score} &nbsp; Best · ${S.jungleBest}</p><button class="primary" onclick="startJungle()">Run again</button><button onclick="go('games')">Mini Games</button>`;
  }
  function damage() {if(g.hurt<=0){g.hp--;g.hurt=1.1}}
  function spawn(boss) {
    const elite=!boss&&Math.random()<.23;
    g.foes.push({x:boss?200:32+Math.random()*336,y:-28,hp:boss?18:elite?3:1,
      points:boss?500:elite?60:20,art:boss?'emberpeak':elite?'guard-astral':'guard-forest',boss,elite});
  }
  const sky=artBitmap('scene-exp');
  let last=performance.now();
  function frame(now) {
    if(game!==g||!g.running)return;
    const dt=Math.min(.05,(now-last)/1000);last=now;
    g.time+=dt;g.hurt-=dt;g.shot-=dt;g.spawn-=dt;
    g.x+=Math.sign(g.target-g.x)*Math.min(Math.abs(g.target-g.x),dt*470);
    if(g.time<32&&g.spawn<=0){spawn(false);g.spawn=.85+Math.random()*.38}
    if(g.time>=32&&!g.boss){spawn(true);g.boss=true}
    if(g.shot<=0){g.arrows.push({x:g.x,y:448});g.shot=.24}
    for(const f of g.foes){
      if(f.boss){f.y=Math.min(102,f.y+dt*66);f.x=200+Math.sin(g.time*1.15)*128;
        if((g.volley-=dt)<=0){g.volley=1.15;const slope=(g.x-f.x)/Math.max(100,468-f.y);
          for(const spread of [-.32,0,.32])g.seeds.push({x:f.x,y:f.y,vx:(slope+spread)*175})}}
      else f.y+=dt*(f.elite?80:99+g.time*.7);
      if(!f.boss&&Math.abs(f.y-469)<25&&Math.abs(f.x-g.x)<27){damage();f.gone=true}
    }
    for(const a of g.arrows){a.y-=dt*440;
      const f=g.foes.find(f=>!f.gone&&Math.abs(f.x-a.x)<(f.boss?37:21)&&Math.abs(f.y-a.y)<(f.boss?36:24));
      if(f){a.gone=true;if(--f.hp<=0){f.gone=true;g.score+=f.points;if(f.boss){finish(true);return}}}}
    for(const s of g.seeds){s.x+=s.vx*dt;s.y+=175*dt;if(Math.hypot(s.x-g.x,s.y-469)<21){damage();s.gone=true}}
    g.foes=g.foes.filter(f=>!f.gone&&f.y<570);g.arrows=g.arrows.filter(a=>!a.gone&&a.y>-12);g.seeds=g.seeds.filter(s=>!s.gone&&s.y<560);
    if(!g.hp){finish(false);return}
    ctx.fillStyle='#244e44';ctx.fillRect(0,0,400,540);
    if(sky?.naturalWidth){const w=sky.naturalHeight*400/540;ctx.drawImage(sky,(sky.naturalWidth-w)/2,0,w,sky.naturalHeight,0,0,400,540)}
    ctx.fillStyle='#5743229c';ctx.beginPath();ctx.moveTo(155,0);ctx.lineTo(245,0);ctx.lineTo(430,540);ctx.lineTo(-30,540);ctx.fill();
    ctx.fillStyle='#e6d89988';for(let i=0;i<12;i++){const y=(i*49+g.time*104)%550;const side=i%2?1:-1;ctx.beginPath();ctx.ellipse(200+side*(43+y*.34),y,2+y*.007,2,0,0,7);ctx.fill()}
    for(const f of g.foes){const size=f.boss?96:f.elite?64:52;drawArtSprite(ctx,f.art,f.x,f.y+size/2,size,size);
      if(f.boss){ctx.fillStyle='#302138';ctx.fillRect(f.x-30,f.y-size/2,60,5);ctx.fillStyle='#ffc768';ctx.fillRect(f.x-30,f.y-size/2,60*f.hp/18,5)}}
    ctx.strokeStyle='#fff0a8';ctx.lineWidth=3;for(const a of g.arrows){ctx.beginPath();ctx.moveTo(a.x,a.y+10);ctx.lineTo(a.x,a.y-6);ctx.lineTo(a.x-3,a.y);ctx.stroke()}
    ctx.fillStyle='#fb7666';for(const s of g.seeds){ctx.beginPath();ctx.arc(s.x,s.y,6,0,7);ctx.fill()}
    ctx.globalAlpha=g.hurt>0?.65:1;drawArtSprite(ctx,'reina-t3',g.x,509,80,84);ctx.globalAlpha=1;
    $('#trekHud').textContent='HP '+g.hp+'/3   ·   Score '+g.score+'   ·   '+(g.boss?'Guardian':Math.ceil(32-g.time)+'s to guardian');
    loop=requestAnimationFrame(frame);
  }
  loop=requestAnimationFrame(frame);
}
