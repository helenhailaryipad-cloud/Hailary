'use strict';
function adventureHub(){const a=S.adventure||globalThis.WonderAdventure.fresh(),ready=globalThis.WonderAdventure.quests.filter(q=>!a.claimed.includes(q.id)&&globalThis.WonderAdventure.progress(S,q)>=q.target).length;return `<section class="adventure-hub"><button onclick="go('quests')">${uiIcon('quests','hub-art-icon')}<span>QUEST JOURNAL</span><strong>Earn more gold</strong><small>${ready?ready+' rewards ready':'Permanent quests · no deadline'}</small></button><button onclick="openBossWheel()">${uiIcon('gold','hub-art-icon')}<span>BOSS TREASURE</span><strong>${a.pending} free spins</strong><small>One spin for every boss victory</small></button></section>`;}
function questBoard(){const W=globalThis.WonderAdventure,a=S.adventure||W.fresh(),wins=S.dungeonWins||0,daily=W.dailyForge(S);$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">GOLD FOR YOUR NEXT WONDER</p><h1>Quest Journal</h1></div><button onclick="go('more')">Back to More</button></div>${sectionArtwork('scene-quests','An illustrated quest journal and treasures')}<p class="quest-intro">Permanent quests · No deadlines · Progress saved</p><div class="quest-list"><article class="quest-card"><div><small>DAILY · RESETS AT 00:00 UTC</small><h2>Forge keeper</h2><p>Earn one synthesis stone per dungeon boss, up to two per day.</p><strong>${daily.wins} / 2 victories · ${daily.claimed} claimed</strong></div><button class="primary" ${daily.claimed===2?'disabled':''} onclick="${daily.wins>daily.claimed?'claimForgeQuest()':"go('dungeons')"}">${daily.wins>daily.claimed?'Claim '+(daily.wins-daily.claimed===1?'1 stone':'2 stones'):daily.claimed===2?'Claimed today':'Go to dungeons'}</button></article>${W.quests.map(q=>{const done=a.claimed.includes(q.id),n=Math.min(q.target,W.progress(S,q)),ready=n>=q.target;return `<article class="quest-card ${done?'quest-done':''}"><div>${uiIcon(({wins:'dungeons',unique:'quests',defense:'castle',merge:'dragon',spins:'gold'})[q.kind],'quest-art-icon')}<small>${done?'COMPLETED':ready?'REWARD READY':'ADVENTURE QUEST'}</small><h2>${q.name}</h2><p>${q.desc}</p><div class="progress"><b style="width:${n/q.target*100}%"></b></div><p class="quest-progress">${fmt(n)} / ${fmt(q.target)} · <strong>${fmt(q.gold)} gold</strong></p></div><button class="primary" ${done||!ready?'disabled':''} onclick="claimQuest('${q.id}')">${done?'Claimed':ready?'Claim gold':'In progress'}</button></article>`}).join('')}<article class="quest-card contract-card"><div>${uiIcon('gold','quest-art-icon')}<small>REPEATABLE · NO LIMIT</small><h2>Guild bounty</h2><p>Defeat any 3 bosses. Repeat for another 900 gold.</p><p>${Math.max(0,wins-a.contracts*3)} / 3 victories · <strong>900 gold</strong></p></div><button class="primary" ${Math.floor(wins/3)<=a.contracts?'disabled':''} onclick="claimContract()">Claim bounty</button></article></div>`;}
function claimForgeQuest(){const n=WonderAdventure.claimForge(S);if(n){save();questBoard();toast('Synthesis stones +'+n)}}
function claimQuest(id){const gold=globalThis.WonderAdventure.claim(S,id);if(!gold)return;save();questBoard();toast('+'+fmt(gold)+' gold · Quest complete');}
function claimContract(){if(!globalThis.WonderAdventure.contract(S))return;save();questBoard();toast('+900 gold · Guild bounty complete');}
let bossWheelSequence=0;
function openBossWheel(){const W=globalThis.WonderAdventure,a=S.adventure||W.fresh();bossWheelSequence++;modal(`<div class="boss-wheel-panel"><p class="eyebrow">BOSS TREASURE · FREE REWARDS</p><h2>Wheel of Wonder</h2><div class="boss-wheel-wrap"><canvas class="wheel-sparks" aria-hidden="true"></canvas><div class="wheel-pointer" aria-hidden="true"></div><div class="boss-wheel" id="bossWheel" style="--sector:${360/W.wheel.length}deg" aria-hidden="true">${W.wheel.map((r,i)=>`<span style="--slice:${i}">${uiIcon(r.gold?'gold':r.tickets?'wishes':r.gem?'gem':'crystals','wheel-reward-icon')}${r.gold||r.tickets||r.synthesis||r.stone||r.gem}</span>`).join('')}<div class="wheel-center" aria-hidden="true"></div></div></div><p id="bossWheelResult" class="wheel-result" role="status">${a.pending?a.pending+(a.pending===1?' free spin ready':' free spins ready'):'Defeat a dungeon boss to earn a spin.'}</p><button id="bossSpin" class="primary" ${a.pending<1?'disabled':''} onclick="spinBossWheel()">Spin for free</button><button onclick="$('#modal').close();go('dungeons')">Explore dungeons</button><details class="wheel-odds"><summary>Reward chances</summary><p>All ${W.wheel.length} sectors have an equal chance. No entry cost or paid spins. Rewards save immediately.</p><div>${W.wheel.map(r=>`<span>${r.label} · 1/${W.wheel.length}</span>`).join('')}</div></details></div>`);}
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
    if (sequence !== bossWheelSequence || !wheel.isConnected || !wheel.closest('dialog').open) return;
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
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  wheel.querySelector('.wheel-winner')?.classList.remove('wheel-winner');
  result.classList.remove('wheel-reveal');
  result.textContent = 'Your reward is on its way…';
  const previous = Number(wheel.dataset.rotation || 0);
  const landing = 360 - (prize.index + .5) * 360 / globalThis.WonderAdventure.wheel.length;
  const angle = previous + 1440 + (landing - previous % 360 + 360) % 360;
  wheel.dataset.rotation = String(angle);
  let finished = false;
  function reveal(event) {
    if (event && (event.target !== wheel || event.propertyName !== '--wheel-angle')) return;
    if (finished) return;
    finished = true;
    wheel.removeEventListener('transitionend', reveal);
    if (seq !== bossWheelSequence || !wheel.isConnected || !$('#modal').open) return;
    wheel.children[prize.index].classList.add('wheel-winner');
    result.textContent = 'You won ' + prize.label + '!';
    result.classList.add('wheel-reveal');
    const remaining = S.adventure.pending;
    button.disabled = remaining === 0;
    button.innerHTML = uiIcon('gift') + (remaining ? 'Next free spin · ' + remaining : 'All rewards collected');
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
