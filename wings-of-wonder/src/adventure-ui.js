'use strict';
function adventureHub(){const a=S.adventure||globalThis.WonderAdventure.fresh(),ready=globalThis.WonderAdventure.quests.filter(q=>!a.claimed.includes(q.id)&&globalThis.WonderAdventure.progress(S,q)>=q.target).length;return `<section class="adventure-hub"><button onclick="go('quests')">${uiIcon('quests','hub-art-icon')}<span>QUEST JOURNAL</span><strong>Earn more gold</strong><small>${ready?ready+' rewards ready':'Permanent quests · no deadline'}</small></button><button onclick="openBossWheel()">${uiIcon('gold','hub-art-icon')}<span>BOSS TREASURE</span><strong>${a.pending} free spins</strong><small>Spins for bosses defeated today</small></button></section>`;}
function questBoard(){const W=globalThis.WonderAdventure,a=S.adventure||W.fresh(),wins=S.dungeonWins||0,daily=W.dailyForge(S);$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">GOLD FOR YOUR NEXT WONDER</p><h1>Quest Journal</h1></div><button onclick="go('more')">Back to More</button></div>${sectionArtwork('scene-quests','An illustrated quest journal and treasures')}<p class="quest-intro">Permanent quests · No deadlines · Progress saved</p><div class="quest-list"><article class="quest-card"><div><small>DAILY · RESETS AT 00:00 UTC</small><h2>Forge keeper</h2><p>Earn one synthesis stone per dungeon boss, up to two per day.</p><strong>${daily.wins} / 2 victories · ${daily.claimed} claimed</strong></div><button class="primary" ${daily.claimed===2?'disabled':''} onclick="${daily.wins>daily.claimed?'claimForgeQuest()':"go('dungeons')"}">${daily.wins>daily.claimed?'Claim '+(daily.wins-daily.claimed===1?'1 stone':'2 stones'):daily.claimed===2?'Claimed today':'Go to dungeons'}</button></article>${W.quests.map(q=>{const done=a.claimed.includes(q.id),n=Math.min(q.target,W.progress(S,q)),ready=n>=q.target;return `<article class="quest-card ${done?'quest-done':''}"><div>${uiIcon(({wins:'dungeons',unique:'quests',defense:'castle',merge:'dragon',spins:'gold'})[q.kind],'quest-art-icon')}<small>${done?'COMPLETED':ready?'REWARD READY':'ADVENTURE QUEST'}</small><h2>${q.name}</h2><p>${q.desc}</p><div class="progress"><b style="width:${n/q.target*100}%"></b></div><p class="quest-progress">${fmt(n)} / ${fmt(q.target)} · <strong>${fmt(q.gold)} gold</strong></p></div><button class="primary" ${done||!ready?'disabled':''} onclick="claimQuest('${q.id}')">${done?'Claimed':ready?'Claim gold':'In progress'}</button></article>`}).join('')}<article class="quest-card contract-card"><div>${uiIcon('gold','quest-art-icon')}<small>REPEATABLE · NO LIMIT</small><h2>Guild bounty</h2><p>Defeat any 3 bosses. Repeat for another 900 gold.</p><p>${Math.max(0,wins-a.contracts*3)} / 3 victories · <strong>900 gold</strong></p></div><button class="primary" ${Math.floor(wins/3)<=a.contracts?'disabled':''} onclick="claimContract()">Claim bounty</button></article></div>`;}
function claimForgeQuest(){const n=WonderAdventure.claimForge(S);if(n){save();questBoard();toast('Synthesis stones +'+n)}}
function claimQuest(id){const gold=globalThis.WonderAdventure.claim(S,id);if(!gold)return;save();questBoard();toast('+'+fmt(gold)+' gold · Quest complete');}
function claimContract(){if(!globalThis.WonderAdventure.contract(S))return;save();questBoard();toast('+900 gold · Guild bounty complete');}
let bossWheelSequence=0;
// Boss Roulette screen (user photos of the reference's boss roulette). Light room: title, the wheel with "Claimed"
// ribbons, Attempts, Spin, Skip, then the daily boss-kill milestones that give attempts. Rules in WonderAdventure.
let bossWheelFrom='home',bossWheelAngle=0,bossWheelMsg='';
function openBossWheel(){bossWheelMsg='';if(screen!=='bossWheel')bossWheelFrom=screen==='dungeon'?'dungeons':screen;$('#modal').open&&$('#modal').close();go('bossWheel')}
function bwIcon(r){return r.kind==='prism'?`<img class="bw-ic" src="${artPath('ui-prism')}" alt="">`:r.kind==='voucher'&&typeof riteVoucherIcon==='function'?riteVoucherIcon('bw-ic'):uiIcon(r.kind==='wish'?'wishes':r.kind==='gold'?'gold':'crystals','bw-ic')}
function bwRows(){const W=globalThis.WonderAdventure,a=W.wheelToday(S),k=W.bossKills(S);
 return W.WHEEL_STEPS.map((n,i)=>({n,i,got:a.wheelGot.includes(i),ready:k>=n})).sort((x,y)=>(x.got-y.got)||(y.ready-x.ready)||(x.n-y.n)).map(r=>`<div class="bw-row ${r.got?'got':r.ready?'ready':''}"><i class="bw-skull">${uiIcon('dungeons')}</i><span>Defeat ${r.n} boss${r.n>1?'es':''} today <b>(${Math.min(k,r.n)}/${r.n})</b></span>${r.got?'<em>Claimed</em>':r.ready?`<button class="bw-obtain" onclick="bossStep(${r.i})">${denPlain}Obtain</button>`:'<em class="no">+1 spin</em>'}</div>`).join('');}
function showBossWheel(){const W=globalThis.WonderAdventure,a=W.wheelToday(S),open=a.wheelOpen,left=W.wheel.length-open.length;bossWheelSequence++;
 $('#main').innerHTML=`<section class="bw-room boss-wheel-panel"><div class="bw-top"><button data-back aria-label="Back" onclick="go(bossWheelFrom||'home')">‹</button><h1><small>Defeat guardians</small>Win great rewards</h1><button class="bw-help" onclick="bossWheelRules()">${denPlain}?</button></div>
 <div class="boss-wheel-wrap"><canvas class="wheel-sparks" aria-hidden="true"></canvas><div class="wheel-pointer" aria-hidden="true"></div><div class="boss-wheel ${a.wheelSkip?'skip':''}" id="bossWheel" data-rotation="${bossWheelAngle}" style="--sector:${360/W.wheel.length}deg;--wheel-angle:${bossWheelAngle}deg">${W.wheel.map((r,i)=>`<span class="${open.includes(i)?'opened':''} k-${r.kind}" style="--slice:${i}" onclick="bossField(${i})">${bwIcon(r)}<b>${r.prisms||r.voucher||r.wish||r.stone||r.gold}</b></span>`).join('')}<div class="wheel-center" aria-hidden="true"></div></div></div>
 <div class="bw-spinbar"><span class="bw-att">Attempts: <b>${a.pending}</b></span><button id="bossSpin" class="bw-spin ${a.pending&&left?'due':''}" ${a.pending<1||!left?'disabled':''} onclick="spinBossWheel()">${denPlain}${left?'Spin':'All claimed'}</button><label class="bw-skip"><input type="checkbox" ${a.wheelSkip?'checked':''} onchange="S.adventure.wheelSkip=this.checked;save()">Skip</label></div>
 <p id="bossWheelResult" class="bw-result" role="status">${bossWheelMsg?bossWheelMsg+' ':''}${left?`${W.wheel.filter((r,i)=>r.prisms&&!open.includes(i)).length} prism fields left today`:'Every field claimed. New wheel at 00:00 UTC.'}</p>
 <div class="bw-head"><span>Spin Chances</span><small>Bosses today: <b>${W.bossKills(S)}</b></small>${energyChip()}</div>
 <div class="bw-list">${bwRows()}</div><p class="bw-note">Dungeon guardians count, 3-${W.ENERGY_BOSS} energy each by tier (${W.staminaLimit} free a day = ${W.staminaLimit/W.ENERGY_BOSS} guardians). Bosses, chances and the wheel reset at 00:00 UTC.</p></section>`;}
function bossStep(i){if(WonderAdventure.stepClaim(S,i)){save();showBossWheel();toast('+1 spin')}}
function bossField(i){const r=WonderAdventure.wheel[i],info={prism:['Prisms','Currency','Precious gems for the Rite Shop, Elite Sale and more.'],voucher:['Starlit Vouchers','Draw token','Swap 1:1 for tickets of the running Star Rite.'],wish:['Wish Ticket','Summon ticket','One pet summon in Basic Summon.'],stone:['Crystals','Material','Used to enhance equipment.'],gold:['Gold','Currency','Spend it in shops and on upgrades.']}[r.kind];
 popup(`<div class="bw-item"><div class="bw-item-head">${bwIcon(r)}<div><h2>${info[0]}</h2><p>Amount: <b>${r.prisms||r.voucher||r.wish||r.stone||r.gold}</b></p><p>Type: <b>${info[1]}</b></p></div></div><p>${info[2]}</p>${(S.adventure?.wheelOpen||[]).includes(i)?'<p class="bw-claimed">Claimed today</p>':''}</div>`);$('#modal').classList.add('bw-pop')}
function bossWheelRules(){popup(`<div class="bw-item"><h2>Boss Roulette</h2><p>Every dungeon guardian you defeat today counts. A guardian costs 3-${WonderAdventure.ENERGY_BOSS} energy by tier (T1-3 3 ... T9+ ${WonderAdventure.ENERGY_BOSS}; the Try-out guardian is free once a day); ${WonderAdventure.staminaLimit} energy is free each day (${WonderAdventure.staminaLimit/WonderAdventure.ENERGY_BOSS} guardians), more is sold for prisms (+ in the energy chip). Reaching 1, 2, 3 ... 30 bosses gives one spin each: tap Obtain.</p><p>A spin never lands on a field you have already claimed today. Three fields hold 88 prisms, so opening the whole wheel gives 264 prisms.</p><p>Bosses, spin chances and the wheel reset at 00:00 UTC; unused spins stay.</p></div>`);$('#modal').classList.add('bw-pop')}
function trailWheelSparks(wheel, sequence) {
  const canvas = wheel.parentElement.querySelector('.wheel-sparks');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const {width, height} = canvas.getBoundingClientRect();
  if (!width || !height) return;
  const density = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * density);
  canvas.height = Math.round(height * density);
  ctx.scale(density, density);
  const start = performance.now();
  const sparks = Array.from({length: 84}, (_, i) => ({
    born: (i / 84) ** 1.4 * 2180, angle: i * 2.4 + Math.random() * .24,
    life: 330 + Math.random() * 470, size: width * (.004 + Math.random() * .005),
    gold: i % 4 !== 0
  }));
  function draw(now) {
    ctx.clearRect(0, 0, width, height);
    if (sequence !== bossWheelSequence || !wheel.isConnected || (wheel.closest('dialog')&&!wheel.closest('dialog').open)) return;
    const elapsed = now - start;
    for (const spark of sparks) {
      const t = (elapsed - spark.born) / spark.life;
      if (t <= 0 || t >= 1) continue;
      const angle = spark.angle + .36 * t;
      const radius = width * (.416 + .086 * t);
      const x = width * .508 + radius * Math.cos(angle);
      const y = height * .495 + radius * Math.sin(angle);
      const r = spark.size * (1 - .42 * t);
      const tint = spark.gold ? '255,202,90' : '105,247,193';
      const glow = ctx.createRadialGradient(x,y,0,x,y,r);
      glow.addColorStop(0,'#fff9db');
      glow.addColorStop(.24,'rgba(' + tint + ',.96)');
      glow.addColorStop(1,'rgba(' + tint + ',0)');
      ctx.globalAlpha = Math.sin(Math.PI * t) ** .65;
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (elapsed < 3000) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}
function spinBossWheel() {
  const button = $('#bossSpin');
  if (!button || button.disabled) return;
  const prize = globalThis.WonderAdventure.spin(S);
  if (!prize) return;
  button.disabled = true;
  save();
  const seq = ++bossWheelSequence, wheel = $('#bossWheel'), result = $('#bossWheelResult');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches || !!S.adventure.wheelSkip;
  wheel.querySelector('.wheel-winner')?.classList.remove('wheel-winner');
  result.classList.remove('wheel-reveal');
  result.textContent = 'Your reward is on its way…';
  const previous = Number(wheel.dataset.rotation || 0);
  const landing = 360 - (prize.index + .5) * 360 / globalThis.WonderAdventure.wheel.length;
  const angle = previous + 1440 + (landing - previous % 360 + 360) % 360;
  wheel.dataset.rotation = String(angle); bossWheelAngle = angle; wheel.classList.toggle('skip', !!S.adventure.wheelSkip);
  let finished = false;
  function reveal(event) {
    if (event && (event.target !== wheel || event.propertyName !== '--wheel-angle')) return;
    if (finished) return;
    finished = true;
    wheel.removeEventListener('transitionend', reveal);
    if (seq !== bossWheelSequence || !wheel.isConnected) return;
    wheel.children[prize.index].classList.add('wheel-winner', 'opened');
    bossWheelMsg = 'You won ' + prize.label + '!'; result.textContent = bossWheelMsg;
    if (typeof wallet === 'function') wallet();
    setTimeout(() => { if (wheel.isConnected && screen === 'bossWheel') showBossWheel(); }, 1500);
    result.classList.add('wheel-reveal');
    const remaining = S.adventure.pending;
    button.disabled = remaining === 0;

  }
  wheel.style.setProperty('--wheel-angle', angle + 'deg');
  if (reduced) reveal();
  else {
    wheel.addEventListener('transitionend', reveal);
    trailWheelSparks(wheel, seq);
    setTimeout(reveal, 3100);
  }
}
function drawDungeonCreature(c,g){if(g.enemy.boss){drawMajesticBoss(c,g);return;}const row=Math.max(0,DUNGEONS.findIndex(d=>d.id===g.source))%3;if(!drawMotionSprite(c,'enemy-motion',row,520,290,260,230,g.clock))drawArtSprite(c,['guard-forest','guard-astral','guard-ember'][row],520,290,235,215);}
// Boss energy chip and shop (rules in WonderAdventure: 300 free a day, 20 per guardian, 10 for 60 prisms, a Secret
// Shop deal on some days).
function energyChip(){const A=WonderAdventure,ex=S.adventure?.energyExtra||0;return `<span class="en-chip">${uiIcon('exp')}<b>${A.energyFree(S)}</b>/${A.energyCap(S)}${ex?` <i>+${ex}</i>`:''}<button class="en-plus" onclick="energyShop()" aria-label="Get energy">${denPlain}+</button></span>`}
function energyShop(){const A=WonderAdventure,b=A.ENERGY_BUY,ex=S.adventure?.energyExtra||0,deal=A.dealOn()&&S.adventure?.energyDeal!==WonderProgress.day();
 const row=(n,label)=>`<div class="en-row"><span>${uiIcon('exp')}<b>+${n*b.n}</b><small>${label}</small></span><button class="en-buy" ${(S.scales||0)<n*b.price?'disabled':''} onclick="energyBuy(${n})">${denPlain}<img src="${artPath('ui-prism')}" alt="">${fmt(n*b.price)}</button></div>`;
 popup(`<div class="en-shop"><h2>Boss Energy</h2><p>Free today <b>${A.energyFree(S)}/${A.energyCap(S)}</b> · bought <b>${ex}</b> · 3-${A.ENERGY_BOSS} per guardian by tier. Free energy refills at 00:00 UTC; bought energy stays.</p>${row(1,'energy')}${row(2,'one guardian')}${row(10,'five guardians')}${row(30,'fifteen guardians')}${deal?`<div class="en-row deal"><span>${uiIcon('exp')}<b>+${A.ENERGY_DEAL.n}</b><small>Secret Shop deal today · −90%</small></span><button class="en-buy" onclick="go('rites');setTimeout(()=>typeof riteGo==='function'&&riteGo('shop'),60)">${denPlain}Open</button></div>`:''}<p class="en-have">You have <img src="${artPath('ui-prism')}" alt=""><b>${fmt(S.scales||0)}</b> prisms</p></div>`);$('#modal').classList.add('bw-pop')}
function energyBuy(n){const got=WonderAdventure.buyEnergy(S,n);if(!got){toast('Not enough prisms');return}save();wallet();toast('+'+got+' energy');energyShop();if(screen==='dungeons'||screen==='cityHunting'||screen==='bossWheel')render()}
function energyDeal(){const got=WonderAdventure.buyDeal(S);if(!got){toast('Not available');return}save();wallet();toast('+'+got+' energy');render()}
