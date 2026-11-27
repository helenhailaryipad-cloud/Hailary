'use strict';
// Challenge: the stage campaign behind the home "Challenge" icon (user photos of the reference's chapter map, 2026-11-27).
// Nine stages a chapter on a painted map; stage 5 is a boss card, stage 9 the gate. Power opens a stage. Idle loot
// fills a chest by the hour (up to IDLE_CAP_H), better the further she has cleared. Battle Pass rows per chapter,
// daily Assignments, Clearance Objective milestones, a Training Bonus on idle XP. All numbers are placeholders.
// Stages cleared stay in S.exploreCleared (old field); the rest in optional S.challenge.
const Challenge = {
  stages: 9,
  themes: [
    { id: 'blossom', name: 'Blossom Vale' }, { id: 'frost', name: 'Frostcrown Peaks' },
    { id: 'amber', name: 'Amber Canyon' }, { id: 'moon', name: 'Moonlit Grove' }],
  idleCapH: 24,
  passPrice: 300,
  // per hour of idle loot, by stages cleared
  rate(cleared) { return { gold: 120 + 12 * cleared, xp: 40 + 4 * cleared, stone: 2 + Math.floor(cleared / 9) }; },
  // the benefit rises once a chapter: it is shown as "Benefit: <stage>" with how many stages to the next rise
  benefitStage(cleared) { return Math.floor(cleared / 9) * 9; },
  bonusPct(cleared) { return Math.min(50, 2 * Math.floor(cleared / 9)); },   // Training Bonus on idle XP
  power(i) { return 1500 + 35 * i; },
  easy: 1.3,                                       // power at least this times the need: "Easy Clear"
  stageLoot(i) { const boss = i % 9 === 4, gate = i % 9 === 8; return { gold: 150 + 15 * i, xp: 60 + 6 * i, items: gate ? { chest2: 1, wish: 1 } : boss ? { chest1: 1 } : {} }; },
  // Battle Pass: one row per chapter cleared (free and pass columns)
  passRow(ch) { return { free: { gold: 500 + 100 * ch, items: { chest1: 1 } }, pass: { prisms: 60, items: { chest2: 1, wish: 1 } } }; },
  objectives: [9, 27, 54, 90, 135, 180, 270, 360].map((at, i) => ({ at, prisms: 50 + 25 * i, items: { [i % 2 ? 'chest3' : 'chest2']: 1 } })),
  tasks: [
    { id: 'win1', name: 'Clear 1 stage', kind: 'clears', n: 1, gold: 300, prisms: 10 },
    { id: 'win3', name: 'Clear 3 stages', kind: 'clears', n: 3, gold: 600, prisms: 20 },
    { id: 'idle', name: 'Collect idle loot', kind: 'idles', n: 1, gold: 300, prisms: 10 }],
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  state(s, now = Date.now()) {
    const v = s.challenge ??= {}; v.idleAt ??= now; v.pf ??= []; v.pp ??= []; v.obj ??= [];
    const d = Challenge.day(now); if (!v.day || v.day.d !== d) v.day = { d, clears: 0, idles: 0, got: [] };
    return v;
  },
  idle(s, now = Date.now()) {
    const v = Challenge.state(s, now), ms = Math.max(0, Math.min(Challenge.idleCapH * 3600e3, now - v.idleAt)), h = ms / 3600e3, cl = s.exploreCleared || 0, r = Challenge.rate(Challenge.benefitStage(cl));
    return { ms, full: ms >= Challenge.idleCapH * 3600e3, gold: Math.floor(r.gold * h), xp: Math.floor(r.xp * h * (1 + Challenge.bonusPct(cl) / 100)), stone: Math.floor(r.stone * h) };
  },
  claimIdle(s, now = Date.now()) {
    const v = Challenge.state(s, now), g = Challenge.idle(s, now); if (g.ms < 60e3) return null;
    s.gold += g.gold; const xp = globalThis.WonderProgress?.award ? WonderProgress.award(s, g.xp) : g.xp;
    if (g.stone && globalThis.WonderGear?.state) { const eq = WonderGear.state(s); s.equipment = eq; eq.materials.stone += g.stone; }
    v.idleAt = now; v.day.idles++; return { ...g, xp };
  },
  give(s, r) {
    s.gold += r.gold || 0; s.scales = (s.scales || 0) + (r.prisms || 0);
    if (r.xp && globalThis.WonderProgress?.award) WonderProgress.award(s, r.xp);
    for (const [id, n] of Object.entries(r.items || {})) if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, id, n);
  },
  // a stage won (index = the stage she was on)
  win(s, index, now = Date.now()) {
    if (index !== (s.exploreCleared || 0)) return null;
    const v = Challenge.state(s, now), r = Challenge.stageLoot(index); Challenge.give(s, r);
    s.exploreCleared = index + 1; v.day.clears++; return r;
  },
  chaptersDone(s) { return Math.floor((s.exploreCleared || 0) / 9); },
  passClaim(s, ch, col) {
    const v = Challenge.state(s), list = col === 'p' ? v.pp : v.pf;
    if (ch < 0 || ch >= Challenge.chaptersDone(s) || list.includes(ch) || (col === 'p' && !v.pass)) return null;
    const r = Challenge.passRow(ch + 1)[col === 'p' ? 'pass' : 'free']; Challenge.give(s, r); list.push(ch); return r;
  },
  passBuy(s) { const v = Challenge.state(s); if (v.pass || (s.scales || 0) < Challenge.passPrice) return false; s.scales -= Challenge.passPrice; v.pass = true; return true; },
  objClaim(s, i) {
    const v = Challenge.state(s), o = Challenge.objectives[i];
    if (!o || v.obj.includes(i) || (s.exploreCleared || 0) < o.at) return null; Challenge.give(s, o); v.obj.push(i); return o;
  },
  taskDone(s, t) { const v = Challenge.state(s); return (v.day[t.kind] || 0) >= t.n; },
  taskClaim(s, id) {
    const v = Challenge.state(s), t = Challenge.tasks.find(x => x.id === id);
    if (!t || v.day.got.includes(id) || !Challenge.taskDone(s, t)) return null; Challenge.give(s, t); v.day.got.push(id); return t;
  },
  due(s, now = Date.now()) {
    const v = Challenge.state(s, now), ch = Challenge.chaptersDone(s), cl = s.exploreCleared || 0;
    return {
      idle: Challenge.idle(s, now).ms >= 3600e3,
      pass: Array.from({ length: ch }, (_, i) => i).some(i => !v.pf.includes(i) || (v.pass && !v.pp.includes(i))),
      obj: Challenge.objectives.some((o, i) => cl >= o.at && !v.obj.includes(i)),
      task: Challenge.tasks.some(t => Challenge.taskDone(s, t) && !v.day.got.includes(t.id)),
    };
  },
  valid(v) {
    const int = n => Number.isSafeInteger(n) && n >= 0, ints = a => Array.isArray(a) && a.length < 10000 && a.every(int) && new Set(a).size === a.length;
    return v === undefined || (!!v && typeof v === 'object' && (v.idleAt === undefined || int(v.idleAt)) && (v.pf === undefined || ints(v.pf)) && (v.pp === undefined || ints(v.pp))
      && (v.obj === undefined || ints(v.obj)) && (v.pass === undefined || typeof v.pass === 'boolean') && (v.skip === undefined || typeof v.skip === 'boolean')
      && (v.day === undefined || (!!v.day && /^\d{4}-\d{2}-\d{2}$/.test(v.day.d) && int(v.day.clears) && int(v.day.idles) && Array.isArray(v.day.got) && v.day.got.every(x => Challenge.tasks.some(t => t.id === x)))));
  },
};
globalThis.Challenge = Challenge;

// CHALLENGE_UI
// Stage spots on each chapter picture (% of the 2:3 map, stage 1 at the bottom), on the painted path.
const CH_TRAILS = {
  blossom: [[50, 90], [66, 80], [46, 71], [26, 62], [44, 53], [68, 45], [56, 35], [38, 25], [52, 12]],
  frost: [[50, 90], [42, 79], [33, 68], [40, 57], [58, 49], [62, 40], [42, 32], [45, 23], [57, 13]],
  amber: [[52, 90], [44, 80], [38, 70], [44, 60], [56, 51], [62, 42], [52, 33], [60, 24], [60, 14]],
  moon: [[55, 90], [48, 79], [38, 70], [42, 60], [55, 51], [60, 42], [48, 33], [42, 24], [55, 14]],
};
let chFight = null, chTimer = 0;
const chArt = n => artPath('challenge-' + n);
const chTheme = cl => Challenge.themes[Math.floor(cl / 9) % Challenge.themes.length];
const chClock = ms => { const s = Math.floor(ms / 1000); return [Math.floor(s / 3600), Math.floor(s / 60) % 60, s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
function chTool(key, art, name, dot, act) { return `<button class="ch-tool" onclick="${act}">${denPlain}<img src="${chArt(art)}" alt="">${dot ? '<em></em>' : ''}<small>${name}</small></button>`; }
function cityExplore() {
  clearInterval(chTimer);
  if (chFight) { chBattle(); return; }
  const cl = S.exploreCleared || 0, ch = Math.floor(cl / 9) + 1, at = cl % 9, base = cl - at, th = chTheme(cl), v = Challenge.state(S), due = Challenge.due(S);
  const power = stats().power, need = Challenge.power(cl), ok = power >= need, easy = power >= need * Challenge.easy, r = Challenge.rate(Challenge.benefitStage(cl)), bonus = Challenge.bonusPct(cl);
  const trail = CH_TRAILS[th.id], marks = trail.map(([x, y], i) => {
    const idx = base + i, kind = i === 8 ? 'gate' : i === 4 ? 'boss' : 'flag', done = i < at;
    return `<button class="ch-mark ${kind} ${done ? 'done' : ''} ${i === at ? 'now' : ''}" style="left:${x}%;top:${y}%" onclick="chStage(${idx})">${denPlain}<img src="${chArt(kind)}" alt=""><b>${ch}-${i + 1}${done ? ' ✓' : ''}</b></button>`;
  }).join('');
  const [hx, hy] = trail[at];
  $('#main').innerHTML = `<section class="ch-room">
   <div class="ch-scroll"><div class="ch-map" style="--chbg:url('${chArt('bg-' + th.id)}')">${marks}<img class="ch-hero" src="${chArt('chibi')}" alt="Reina" style="left:${hx + (hx > 50 ? -10 : 10)}%;top:${hy + 3}%"></div></div>
   <div class="ch-title"><b>Chapter ${ch}</b><small>${th.name} · ${at} / 9</small></div>
   <div class="ch-benefit"><b>Benefit: ${ch > 1 ? (ch - 1) + '-9' : 'start'}</b><span>${uiIcon('gold')}${fmt(r.gold)}/h</span><span><i>EXP</i>${fmt(r.xp)}/h</span><small>(Rises after ${9 - at} more stage${9 - at === 1 ? '' : 's'}.)</small></div>
   <div class="ch-left">${chTool('bonus', 'bonus', 'Training Bonus', false, 'chBonus()')}<span class="ch-exp"><i>EXP</i><b>+${bonus}%</b></span></div>
   <div class="ch-tools"><button class="ch-tool ch-chest" onclick="chIdle()">${denPlain}<img src="${chArt('chest')}" alt="">${due.idle ? '<em></em>' : ''}<small data-idle>${chClock(Challenge.idle(S).ms)}</small></button>
    ${chTool('pass', 'pass', 'Clear Battle Pass', due.pass, 'chPass()')}${chTool('assign', 'assign', 'Assignment', due.task, 'chTasks()')}${chTool('obj', 'objective', 'Clearance Objective', due.obj, 'chObjectives()')}${chTool('train', 'training', 'Training', false, "go('expLobby')")}</div>
   <div class="ch-foot"><button data-back aria-label="Back to city" onclick="go('home')">‹</button>
    <div class="ch-go"><button class="ch-explore" onclick="chExplore()">${denPlain}Explore${easy ? '<i>Easy Clear</i>' : ''}</button><small class="${ok ? 'ok' : 'low'}">${ok ? 'Power ' + fmt(power) + ' / ' + fmt(need) : 'Reach power <b>' + fmt(need) + '</b> to challenge'}</small></div>
    <div class="ch-right">${chTool('up', 'power', 'Power Up', !ok, "go('cityForge')")}<label class="ch-skip"><input type="checkbox" ${v.skip ? 'checked' : ''} onchange="Challenge.state(S).skip=this.checked;save()">Skip</label></div></div>
  </section>`;
  const sc = document.querySelector('.ch-scroll'), me = document.querySelector('.ch-hero'); if (sc && me && sc.scrollTo) sc.scrollTop = Math.max(0, me.offsetTop - sc.clientHeight * .55);
  chTimer = setInterval(() => { const el = document.querySelector('[data-idle]'); if (!el || screen !== 'cityExplore') { clearInterval(chTimer); return; } el.textContent = chClock(Challenge.idle(S).ms); }, 1000);
}
function chStage(idx) {
  const cl = S.exploreCleared || 0, l = Challenge.stageLoot(idx), label = Math.floor(idx / 9) + 1 + '-' + (idx % 9 + 1);
  popup(`<div class="ch-pop"><h2>Stage ${label}</h2><p>${idx < cl ? 'Cleared' : idx === cl ? 'Next stage' : 'Clear the stages before it first'} · power needed <b>${fmt(Challenge.power(idx))}</b></p><p class="ch-sub">First clear rewards</p><div class="bag-gains">${chGains(l)}</div></div>`); $('#modal').classList.add('bw-pop');
}
function chGains(r) {
  let h = '';
  if (r.gold) h += `<span class="bag-gain" style="--rarity:#f0b848">${uiIcon('gold')}<b>+${fmt(r.gold)}</b><small>Gold</small></span>`;
  if (r.prisms) h += `<span class="bag-gain" style="--rarity:#b06af0"><img class="bag-ico" src="${artPath('ui-prism')}" alt=""><b>+${fmt(r.prisms)}</b><small>Prisms</small></span>`;
  if (r.xp) h += `<span class="bag-gain">${uiIcon('exp')}<b>+${fmt(r.xp)}</b><small>XP</small></span>`;
  if (r.stone) h += `<span class="bag-gain" style="--rarity:#5ac8c0">${uiIcon('crystals')}<b>+${fmt(r.stone)}</b><small>Crystals</small></span>`;
  if (r.items && Object.keys(r.items).length) h += cloudItems(r.items);
  return h;
}
function chExplore() {
  const cl = S.exploreCleared || 0, power = stats().power, need = Challenge.power(cl);
  if (power < need) { popup(`<div class="ch-pop"><h2>Not strong enough yet</h2><p>Stage ${Math.floor(cl / 9) + 1}-${cl % 9 + 1} needs power <b>${fmt(need)}</b>; you have ${fmt(power)}.</p><button class="ch-btn" onclick="$('#modal').close();go('cityForge')">${denPlain}Power Up</button></div>`); $('#modal').classList.add('bw-pop'); return; }
  if (Challenge.state(S).skip) { chWin(cl); return; }
  chFight = { idx: cl, start: Date.now(), dur: power >= need * Challenge.easy ? 2600 : 4200 }; chBattle();
}
function chBattle() {
  const f = chFight; if (!f) return; const th = chTheme(f.idx), boss = exploreBosses[f.idx % 9], label = Math.floor(f.idx / 9) + 1 + '-' + (f.idx % 9 + 1);
  $('#main').innerHTML = `<section class="ch-room ch-fight" style="--chbg:url('${chArt('bg-' + th.id)}')"><div class="ch-title"><b>Stage ${label}</b><small>${BOSS_NAMES[boss]}</small></div>
   <div class="ch-hp"><i style="width:100%"></i></div><img class="ch-foe" src="${artPath(boss)}" alt=""><img class="ch-me" src="${reinaLookPath(false)}" alt="Reina"><div class="ch-nums"></div></section>`;
  const bar = document.querySelector('.ch-hp i'), nums = document.querySelector('.ch-nums'), foe = document.querySelector('.ch-foe');
  const tick = () => {
    if (chFight !== f || screen !== 'cityExplore') return;
    const p = Math.min(1, (Date.now() - f.start) / f.dur); if (bar) bar.style.width = (100 - p * 100) + '%';
    if (Math.random() < .35 && nums) { const n = document.createElement('b'); n.textContent = fmt(Math.round(800 + Math.random() * 1800)); n.style.left = 55 + Math.random() * 30 + '%'; n.style.top = 30 + Math.random() * 25 + '%'; nums.append(n); setTimeout(() => n.remove(), 900); foe?.classList.remove('hit'); void foe?.offsetWidth; foe?.classList.add('hit'); }
    if (p < 1) setTimeout(tick, 160); else { chFight = null; chWin(f.idx); }
  };
  setTimeout(tick, 300);
}
function chWin(idx) {
  const r = Challenge.win(S, idx); if (!r) { cityExplore(); return; } save(); 
  cityExplore();
  resultShow({ title: 'Stage cleared!', kicker: 'Stage ' + (Math.floor(idx / 9) + 1) + '-' + (idx % 9 + 1), stars: 3, win: true, body: `<div class="bag-gains">${chGains(r)}</div>`, buttons: [['Continue', 'gold', '']] });
}
function chIdle() {
  const g = Challenge.idle(S), r = Challenge.rate(Challenge.benefitStage(S.exploreCleared || 0));
  popup(`<div class="ch-pop"><h2>Idle Loot</h2><p>Gathered while you were away: <b>${chClock(g.ms)}</b> of ${Challenge.idleCapH}:00:00${g.full ? ' (full!)' : ''}. Per hour now: ${fmt(r.gold)} gold, ${fmt(r.xp)} XP, ${r.stone} crystals; Training Bonus +${Challenge.bonusPct(S.exploreCleared || 0)}% XP.</p><div class="bag-gains">${chGains(g)}</div><button class="ch-btn" ${g.ms < 60e3 ? 'disabled' : ''} onclick="chIdleTake()">${denPlain}Collect</button></div>`); $('#modal').classList.add('bw-pop');
}
function chIdleTake() { const g = Challenge.claimIdle(S); if (!g) return; save(); wallet(); $('#modal').close(); cityExplore(); toast('Idle loot collected'); }
function chBonus() {
  const cl = S.exploreCleared || 0;
  popup(`<div class="ch-pop"><h2>Training Bonus</h2><p>Every chapter you clear adds 2% to the XP of your idle loot (up to 50%). Now: <b>+${Challenge.bonusPct(cl)}%</b>. Next chapter: +${Math.min(50, Challenge.bonusPct(cl) + 2)}%.</p></div>`); $('#modal').classList.add('bw-pop');
}
function chPass() {
  const v = Challenge.state(S), done = Challenge.chaptersDone(S), rows = Math.max(done + 2, 5);
  const row = ch => { const r = Challenge.passRow(ch + 1), open = ch < done, f = v.pf.includes(ch), p = v.pp.includes(ch);
    return `<div class="ch-prow ${open ? 'open' : ''}"><b>Chapter ${ch + 1}</b><div class="ch-cell">${chGains(r.free)}${f ? '<i class="ch-got">✓</i>' : open ? `<button class="ch-mini" onclick="chPassTake(${ch},'f')">${denPlain}Claim</button>` : ''}</div><div class="ch-cell pass">${chGains(r.pass)}${p ? '<i class="ch-got">✓</i>' : open && v.pass ? `<button class="ch-mini" onclick="chPassTake(${ch},'p')">${denPlain}Claim</button>` : '<i class="ch-lock">🔒</i>'}</div></div>`; };
  popup(`<div class="ch-pop wide"><h2>Clear Battle Pass</h2><p>Each chapter you clear opens a row. ${v.pass ? 'Pass active.' : `The Pass column opens for <b>${Challenge.passPrice}</b> prisms.`}</p><div class="ch-phead"><span></span><span>Free</span><span>Pass</span></div><div class="ch-plist">${Array.from({ length: rows }, (_, i) => row(i)).join('')}</div>${v.pass ? '' : `<button class="ch-btn" onclick="chPassBuy()">${denPlain}Unlock Pass · ${Challenge.passPrice} prisms</button>`}</div>`); $('#modal').classList.add('bw-pop');
}
function chPassTake(ch, col) { if (Challenge.passClaim(S, ch, col)) { save(); wallet(); chPass(); toast('Claimed'); } }
function chPassBuy() { if (!Challenge.passBuy(S)) { toast('Not enough prisms'); return; } save(); wallet(); chPass(); }
function chTasks() {
  const v = Challenge.state(S);
  popup(`<div class="ch-pop"><h2>Assignment</h2><p>Today's tasks reset at 00:00 UTC.</p>${Challenge.tasks.map(t => { const n = Math.min(t.n, v.day[t.kind] || 0), got = v.day.got.includes(t.id); return `<div class="ch-task"><span><b>${t.name}</b><small>${n} / ${t.n} · ${fmt(t.gold)} gold · ${t.prisms} prisms</small></span>${got ? '<i class="ch-got">✓</i>' : n >= t.n ? `<button class="ch-mini" onclick="chTaskTake('${t.id}')">${denPlain}Claim</button>` : '<em>In progress</em>'}</div>`; }).join('')}</div>`); $('#modal').classList.add('bw-pop');
}
function chTaskTake(id) { if (Challenge.taskClaim(S, id)) { save(); wallet(); chTasks(); toast('Claimed'); } }
function chObjectives() {
  const v = Challenge.state(S), cl = S.exploreCleared || 0;
  popup(`<div class="ch-pop"><h2>Clearance Objective</h2><p>Big rewards for reaching these stages. Cleared: <b>${cl}</b>.</p>${Challenge.objectives.map((o, i) => { const got = v.obj.includes(i), ok = cl >= o.at; return `<div class="ch-task"><span><b>Clear ${o.at} stages</b><small>${o.prisms} prisms + ${WonderGear.bagItemById[Object.keys(o.items)[0]].name}</small></span>${got ? '<i class="ch-got">✓</i>' : ok ? `<button class="ch-mini" onclick="chObjTake(${i})">${denPlain}Claim</button>` : `<em>${cl} / ${o.at}</em>`}</div>`; }).join('')}</div>`); $('#modal').classList.add('bw-pop');
}
function chObjTake(i) { if (Challenge.objClaim(S, i)) { save(); wallet(); chObjectives(); toast('Claimed'); } }
