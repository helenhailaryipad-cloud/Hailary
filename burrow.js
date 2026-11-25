// Burrow Blitz (user sent photos of the reference's "Max Combo": tap the friendly critters that pop out of twelve
// burrows, never the frost critters, keep the combo going). Own names and art. Rules in `Burrow` (pure, tested by
// scripts/test-burrow.mjs); the screen is below the BURROW_UI marker. All numbers are placeholders.
const Burrow = {
  length: 60,          // seconds of a run
  holes: 12,           // 3 columns zig-zag, 4 per column
  freeze: 3,           // seconds frozen after tapping a frost critter
  comboWindow: 2,      // the streak breaks when no friendly critter is tapped for this long
  // Order = atlas order of burrow-critters. pts = points, time = seconds added, bad = freezes, w = spawn weight.
  critters: [
    { id: 'vole', name: 'Acorn Vole', pts: 2, w: 44 },
    { id: 'berry', name: 'Berry Hamster', pts: 4, w: 22 },
    { id: 'sun', name: 'Sunbloom Hamster', time: 4, w: 5 },
    { id: 'gem', name: 'Lucky Gemkit', pts: 20, w: 3 },
    { id: 'imp', name: 'Frost Imp', bad: true, w: 7 },
    { id: 'bat', name: 'Icicle Bat', bad: true, w: 7 },
    { id: 'golem', name: 'Hail Golem', bad: true, w: 6 },
    { id: 'wisp', name: 'Snow Wisp', bad: true, w: 6 }
  ],
  // Points of a friendly tap are multiplied by the streak: x1 up to 7 in a row, x2 from 8, ... x5 from 32.
  mult(combo) { return 1 + Math.min(4, Math.floor(combo / 8)); },
  // Pace over the run: critters come faster, stay shorter and more are up at once.
  pace(t) { const f = Math.min(1, Math.max(0, t / this.length)); return { every: .62 - .3 * f, stay: 1.3 - .5 * f, most: 3 + Math.round(2 * f) }; },
  create(rng = Math.random) { return { kind: 'burrow', running: true, ended: false, t: 0, left: this.length, score: 0, combo: 0, best: 0, hits: 0, misses: 0, frozen: 0, lastHit: 0, next: .4, up: [], seq: 0, events: [] }; },
  pick(rng) { const total = this.critters.reduce((a, c) => a + c.w, 0); let r = rng() * total; for (let n = 0; n < this.critters.length; n++) { r -= this.critters[n].w; if (r < 0) return n; } return 0; },
  // Advances the clock. Spawns into empty burrows, sends critters home when their time is up. Returns events.
  step(g, dt, rng = Math.random) {
    if (g.ended) return [];
    const ev = []; g.t += dt; g.left -= dt;
    if (g.frozen > 0) g.frozen = Math.max(0, g.frozen - dt);
    if (g.combo && g.t - g.lastHit > this.comboWindow) { ev.push({ type: 'break', combo: g.combo }); g.combo = 0; }
    for (const c of g.up) c.age += dt;
    const gone = g.up.filter(c => c.age >= c.stay); g.up = g.up.filter(c => !gone.includes(c));
    for (const c of gone) ev.push({ type: 'hide', id: c.id, hole: c.hole });
    const p = this.pace(g.t); g.next -= dt;
    while (g.next <= 0 && g.left > .5) {
      g.next += p.every * (.75 + rng() * .5);
      if (g.up.length >= p.most) continue;
      const free = [...Array(this.holes).keys()].filter(h => !g.up.some(c => c.hole === h)); if (!free.length) continue;
      const hole = free[Math.floor(rng() * free.length)], kind = this.pick(rng), c = { id: ++g.seq, hole, kind, age: 0, stay: p.stay * (this.critters[kind].pts >= 20 ? .8 : 1) * (.85 + rng() * .3), hit: false };
      g.up.push(c); ev.push({ type: 'show', id: c.id, hole, kind });
    }
    if (g.left <= 0) { g.left = 0; g.ended = true; g.running = false; ev.push({ type: 'end' }); }
    return ev;
  },
  // A tap on a burrow. Null when nothing happens (frozen, empty burrow, critter already tapped).
  tap(g, hole) {
    if (g.ended || g.frozen > 0) return null;
    const c = g.up.find(x => x.hole === hole && !x.hit); if (!c) return null;
    const k = this.critters[c.kind]; c.hit = true; c.stay = Math.min(c.stay, c.age + .28);
    if (k.bad) { g.frozen = this.freeze; const lost = g.combo; g.combo = 0; g.misses++; return { bad: true, id: c.id, hole, kind: c.kind, lost }; }
    g.combo++; g.best = Math.max(g.best, g.combo); g.hits++; g.lastHit = g.t;
    const mult = this.mult(g.combo), pts = (k.pts || 0) * mult; g.score += pts; if (k.time) g.left += k.time;
    return { good: true, id: c.id, hole, kind: c.kind, pts, mult, time: k.time || 0, combo: g.combo };
  },
  // Rewards. Every rewarded attempt pays by its points (Point Rewards); the best rewarded score of the UTC day ranks
  // against the AI field and the place is paid by mail when the day is over (Ranking Rewards).
  pointRewards: [
    { from: 700, gold: 900, items: { exp2: 1, wish: 1 } },
    { from: 600, gold: 700, items: { exp1: 4 } },
    { from: 500, gold: 500, items: { exp1: 3 } },
    { from: 400, gold: 350, items: { exp1: 2 } },
    { from: 0, gold: 200, items: { exp1: 1 } }
  ],
  rankRewards: [
    { to: 1, label: 'No.1', items: { chest3: 1, wish: 3, exp2: 1 } },
    { to: 3, label: 'No.2 - No.3', items: { chest2: 1, wish: 2 } },
    { to: 10, label: 'No.4 - No.10', items: { chest2: 1, wish: 1 } },
    { to: 1e9, label: 'Participation', items: { chest1: 1 } }
  ],
  pointReward(score) { return this.pointRewards.find(r => score >= r.from); },
  rankReward(rank) { return this.rankRewards.find(r => rank <= r.to); },
  stars(score) { return score >= 700 ? 3 : score >= 600 ? 2 : score >= 400 ? 1 : 0; },
  freeRuns: 1, extraRuns: 1, extraPrice: 50,   // extra attempt: once a UTC day, prisms
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  // Daily record, with the day applied. `due` = yesterday's (or older) ranking to pay once.
  roll(v, now = Date.now(), names = []) {
    const today = this.day(now);
    if (!v) return { v: { day: today, runs: 0, extra: 0, best: 0, all: 0 }, due: null };
    if (v.day === today) return { v, due: null };
    let due = null;
    if (v.best > 0) { const rank = this.rankOf(v.day, names, v.best, 1); due = { day: v.day, best: v.best, rank, reward: this.rankReward(rank) }; }
    return { v: { day: today, runs: 0, extra: 0, best: 0, all: v.all || 0 }, due };
  },
  runsLeft(v) { return Math.max(0, this.freeRuns + (v.extra || 0) - (v.runs || 0)); },
  canBuy(v) { return (v.extra || 0) < this.extraRuns; },
  hash(s) { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return h / 4294967296; },
  // AI adventurers of a UTC day; they finish their runs through the day (frac 0..1 of the day gone).
  field(day, names, frac = 1) {
    const n = names.length;
    return names.map((name, i) => ({ name, ai: true, score: Math.round(260 + Math.pow(this.hash(name + day), 1.7) * 1200), at: (i + .5) / n * .92 }))
      .filter(x => x.at <= frac).sort((a, b) => b.score - a.score);
  },
  rankOf(day, names, best, frac = 1) { return best > 0 ? 1 + this.field(day, names, frac).filter(x => x.score >= best).length : 0; },
  valid(v) {
    return v === undefined || !!v && typeof v === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && ['runs', 'extra', 'best', 'all'].every(k => Number.isSafeInteger(v[k]) && v[k] >= 0)
      && v.extra <= this.extraRuns && v.runs <= this.freeRuns + this.extraRuns && v.best <= v.all;
  }
};
if (typeof module !== 'undefined') module.exports = { Burrow };

// BURROW_UI
const BURROW_ART = ['burrow-bg', 'burrow-hole', 'burrow-rim', 'burrow-critters', 'burrow-frost', 'burrow-fx', 'ui-btn-gold', 'ui-btn-violet', 'ui-result-ribbon', 'ui-result-burst'];
let burrowArtCache = [];
function burrowPreload() { if (burrowArtCache.length) return; burrowArtCache = BURROW_ART.map(id => { const i = new Image(); i.src = artPath(id); i.decode?.().catch(() => {}); return i; }); }
function burrowNames() { return typeof Party !== 'undefined' ? Party.aiNames : ADVENTURERS.map(a => a.name); }
// Today's record; a finished day's ranking reward goes out by mail once.
function burrowState() {
  const { v, due } = Burrow.roll(S.burrow, Date.now(), burrowNames());
  if (due) {
    const mail = { ...due.reward.items }, label = due.rank <= 10 ? 'No.' + due.rank : 'participation';
    if (WonderGear.mailGift) WonderGear.mailGift(S, { title: 'Burrow Blitz: ' + label, from: 'Meadow Warden', text: 'The Burrow Blitz ranking of ' + due.day + ' is closed. Your best: ' + fmt(due.best) + ' points, place ' + label + '.', items: mail });
    else for (const [k, n] of Object.entries(mail)) WonderGear.bagAdd(S, k, n);
    if (WonderGear.socialNote) WonderGear.socialNote(S, 'Burrow Blitz: ranking reward (' + label + ') sent by mail.');
    if (typeof toast === 'function') toast('Burrow Blitz reward (' + label + ') sent by mail');
  }
  if (S.burrow !== v) { S.burrow = v; save(); }
  return v;
}
const bbCritter = (n, cls = '') => `<i class="bb-crit ${cls}" style="--cx:${n % 4};--cy:${n >> 2}"></i>`;
const bbFrac = () => (Date.now() % 864e5) / 864e5;
function burrowBoard(v, rows = 99) {
  const list = Burrow.field(v.day, burrowNames(), bbFrac()).slice(0, rows);
  return list.map((r, i) => `<li><span class="bb-rk r${i + 1}">${i + 1}</span><span>${esc(r.name)} <small>AI</small></span><b>${fmt(r.score)}</b></li>`).join('');
}
function showBurrow() {
  burrowPreload(); bagArtVars?.();
  const v = burrowState(), left = Burrow.runsLeft(v), rank = Burrow.rankOf(v.day, burrowNames(), v.best, bbFrac());
  $('#main').innerHTML = `<section class="bb-room bb-lobby" style="--bb-bg:url('${artPath('burrow-bg')}');--bb-crit:url('${artPath('burrow-critters')}');--bb-hole:url('${artPath('burrow-hole')}')">
    <h1 class="bb-title"><span>Burrow Blitz</span></h1>
    <div class="bb-scene">
      <i class="bb-light"></i>
      <span class="bb-deco d1"><img src="${artPath('burrow-hole')}" alt="">${bbCritter(3)}</span>
      <span class="bb-deco d2"><img src="${artPath('burrow-hole')}" alt="">${bbCritter(1)}</span>
      <span class="bb-deco d3"><img src="${artPath('burrow-hole')}" alt="">${bbCritter(5)}</span>
      <img class="bb-host" src="${reinaLookPath(false)}" alt="Reina">
    </div>
    <div class="bb-mid"><div class="bb-ranks"><h2>Rankings</h2><ol>${burrowBoard(v)}</ol><p>My points <b>${fmt(v.best)}</b><span>${rank ? 'No.' + rank : 'None'}</span></p></div>
    <div class="bb-rules"><h2><span>Rules</span></h2>
      <p>${bbCritter(1, 'mini')}<span><b>Tap friendly critters</b> fast</span></p>
      <p>${bbCritter(4, 'mini')}<span><b>Frost critters</b> freeze you ${Burrow.freeze} s</span></p>
      <p><i class="bb-x">×5</i><span><b>Keep the streak:</b> up to ×5 points</span></p></div></div>
    <div class="bb-play">
      <p class="bb-tries">Attempts left: <b>${left}/${Burrow.freeRuns + (v.extra || 0)}</b><button class="bb-plus" onclick="burrowBuy()" aria-label="Buy an attempt">${denPlain}+</button></p>
      <button class="bb-go" onclick="openBurrowBoard()">${denPlain}${left ? 'Challenge' : 'Practice'}</button>
      ${left ? '' : '<small class="bb-prac">Practice runs pay nothing and do not rank</small>'}
    </div>
    <div class="bb-tools">
      <button onclick="burrowScoring()">${denPlain}<span class="bb-tool">${bbCritter(1)}</span><span>Scoring Rules</span></button>
      <button onclick="burrowRankRewards()">${denPlain}<span class="bb-tool"><img src="${artPath('hud-rank')}" alt=""></span><span>Ranking Rewards</span></button>
      <button onclick="burrowPointRewards()">${denPlain}<span class="bb-tool">${bagIcon('chest2')}</span><span>Point Rewards</span></button>
    </div>
    <button class="bb-back" data-back onclick="go('games')" aria-label="Back to Mini Games">‹</button>
  </section>`;
}
function bbPop(title, body, foot = '') {
  popup(`<div class="bb-pop" style="--bb-crit:url('${artPath('burrow-critters')}')"><div class="bb-pop-head"><h2>${title}</h2><button class="bb-pop-x" onclick="$('#modal').close()" aria-label="Close">${denPlain}×</button></div><div class="bb-pop-body">${body}</div>${foot ? `<p class="bb-pop-foot">${foot}</p>` : ''}</div>`);
}
function burrowScoring() {
  bbPop('Scoring Rules', Burrow.critters.map((c, n) => `<div class="bb-row ${c.bad ? 'bad' : ''}"><span class="bb-name">${c.name}</span><span class="bb-face">${bbCritter(n)}</span><b>${c.bad ? 'Freeze ' + Burrow.freeze + ' s' : c.time ? 'Time +' + c.time + ' s' : 'Points +' + c.pts}</b></div>`).join('')
    + `<div class="bb-row"><span class="bb-name">Streak</span><span class="bb-face"><i class="bb-x">×5</i></span><b>×2 from 8, up to ×5 from 32</b></div>`,
  'The streak breaks if you tap a frost critter or tap nothing for ' + Burrow.comboWindow + ' seconds.');
}
function bbItems(items, gold) { return (gold ? `<span class="bb-item">${uiIcon('gold')}<b>${fmt(gold)}</b></span>` : '') + Object.entries(items).map(([id, n]) => `<span class="bb-item" title="${esc(WonderGear.bagItemById[id].name)}" style="--rarity:${bagHue(WonderGear.bagItemById[id].rarity)}">${bagIcon(id)}<b>${n}</b></span>`).join(''); }
function bbBadge(i, label) { return `<span class="bb-badge ${i < 3 ? 'top' : ''}">${i < 3 ? `<b>${i + 1}</b>` : `<small>${label}</small>`}</span>`; }
function burrowRankRewards() {
  bagArtVars?.();
  bbPop('Ranking Rewards', Burrow.rankRewards.map((r, i) => `<div class="bb-row rw">${bbBadge(i === 0 ? 0 : 3, i === 1 ? '2-3' : i === 2 ? '4-10' : 'All')}<span class="bb-name">${r.label}</span><span class="bb-items">${bbItems(r.items)}</span></div>`).join(''),
    'Your best rewarded score of the UTC day ranks. The reward comes by mail when the day is over.');
}
function burrowPointRewards() {
  bagArtVars?.();
  bbPop('Point Rewards', Burrow.pointRewards.map((r, i, a) => `<div class="bb-row rw">${bbBadge(i, String(i + 1))}<span class="bb-name">Points<br><em>${r.from}${i ? '-' + (a[i - 1].from - 1) : '+'}</em></span><span class="bb-items">${bbItems(r.items, r.gold)}</span></div>`).join(''),
    'Paid at the end of every rewarded attempt.');
}
function burrowBuy() {
  const v = burrowState();
  if (!Burrow.canBuy(v)) { toast('The extra attempt of today is already bought'); return; }
  bbPop('Extra Attempt', `<p class="bb-buy">One more rewarded attempt today for <b>${uiIcon('crystals')}${Burrow.extraPrice} prisms</b>.<br><small>You have ${fmt(S.scales || 0)} prisms.</small></p>`,
    `<button class="bb-pop-btn" onclick="burrowBuyNow()">${denPlain}Buy for ${Burrow.extraPrice}</button>`);
}
function burrowBuyNow() {
  const v = burrowState();
  if (!Burrow.canBuy(v) || (S.scales || 0) < Burrow.extraPrice) { toast('Not enough prisms'); return; }
  S.scales -= Burrow.extraPrice; v.extra++; save(); $('#modal').close(); toast('Extra attempt ready'); showBurrow();
}
// Mini Games hub: the daily challenge strip under the featured game.
function burrowStrip() {
  const v = burrowState(), left = Burrow.runsLeft(v);
  return `<button class="mg-daily" onclick="go('burrow')" style="--bb-crit:url('${artPath('burrow-critters')}')">${denPlain}<span class="mg-dl-art">${artImage('burrow-cover', 'Burrow Blitz')}</span><span class="mg-dl-text"><i>DAILY CHALLENGE</i><b>Burrow Blitz</b><small>Tap the critters, dodge the frost</small></span><span class="mg-dl-side"><em>${left ? left + ' attempt' + (left > 1 ? 's' : '') + ' left' : 'Done today'}</em><small>Best today ${fmt(v.best)}</small></span></button>`;
}
// The run.
const BB_SPOTS = [...Array(12).keys()].map(i => { const col = [0, 1, 2][i % 3], row = Math.floor(i / 3); return { x: [18, 50, 82][col], y: 10 + (row * 2 + (col === 1 ? 1 : 0)) * 11.6 }; });
let burrowGame = null;
function openBurrowBoard() {
  if (typeof screenChangedAt !== 'undefined') screenChangedAt = Date.now();
  if (game?.running) return;
  burrowPreload();
  const v = burrowState(), paid = Burrow.runsLeft(v) > 0, top = Burrow.field(v.day, burrowNames(), bbFrac()).slice(0, 3);
  $('#main').innerHTML = `<section class="bb-room bb-run" style="--bb-bg:url('${artPath('burrow-bg')}');--bb-crit:url('${artPath('burrow-critters')}');--bb-fx:url('${artPath('burrow-fx')}')">
    <div class="bb-top"><h1 class="bb-plate">Burrow Blitz</h1><div class="bb-bar"><i id="bbBar"></i><b id="bbTime">${Burrow.length}s</b></div></div>
    <div class="bb-hud">
      <div class="bb-left"><div class="bb-pts"><small>Current Points</small><b id="bbScore">0</b></div>
        <button class="bb-sr" onclick="this.parentElement.classList.toggle('open')">${denPlain}Scoring Rules <i>▾</i></button>
        <div class="bb-srl">${Burrow.critters.slice(0, 5).map((c, n) => `<p class="${c.bad ? 'bad' : ''}">${bbCritter(n, 'mini')}<b>${c.bad ? 'Freeze ' + Burrow.freeze + 's' : c.time ? 'Time +' + c.time + 's' : 'Points +' + c.pts}</b></p>`).join('')}<p class="bad">${bbCritter(5, 'mini')}${bbCritter(6, 'mini')}${bbCritter(7, 'mini')}<b>Freeze</b></p></div></div>
      <span class="bb-combo" id="bbCombo"></span><div class="bb-top3">${['First', 'Second', 'Third'].map((t, i) => `<p><span>${t} Place</span><b>${top[i] ? fmt(top[i].score) : '—'}</b></p>`).join('')}</div>
    </div>
    <div class="bb-field" id="bbField">${BB_SPOTS.map((p, i) => `<div class="bb-hole" data-h="${i}" style="--x:${p.x};--y:${p.y};z-index:${Math.round(p.y)}"><img class="bb-back" src="${artPath('burrow-hole')}" alt="" draggable="false"><span class="bb-pit"><i class="bb-crit"></i></span><img class="bb-front" src="${artPath('burrow-rim')}" alt="" draggable="false"></div>`).join('')}</div>
    <div class="bb-banner" id="bbBanner"></div>
    <div class="bb-frost" id="bbFrost" style="--bb-frost:url('${artPath('burrow-frost')}')"><b>Frozen!</b><small id="bbFrostT"></small></div>
    ${paid ? '' : '<p class="bb-practice">Practice</p>'}
    <button class="bb-back" data-back onclick="go('burrow')" aria-label="Leave the run">‹</button>
  </section>`;
  startBurrow(paid);
}
function startBurrow(paid) {
  if (paid) { const v = burrowState(); v.runs++; save(); }
  const g = game = burrowGame = Burrow.create(); g.paid = paid; g.wait = true;
  const field = $('#bbField'), holes = [...field.querySelectorAll('.bb-hole')], banner = $('#bbBanner');
  const say = (html, cls = '', ms = 900) => { banner.className = 'bb-banner show ' + cls; banner.innerHTML = html; clearTimeout(banner.t); if (ms) banner.t = setTimeout(() => { banner.className = 'bb-banner'; }, ms); };
  let last = performance.now(), shown = -1, lastScore = -1;
  const countdown = n => { if (game !== g) return; if (n) { say(`<b class="bb-cd">${n}</b>`, 'cd', 0); setTimeout(() => countdown(n - 1), 650); } else { say('<span>Challenge starts!</span>', 'go', 1000); g.wait = false; last = performance.now(); } };
  countdown(3);
  const fx = (hole, frame, cls) => { const f = document.createElement('i'); f.className = 'bb-fx f' + frame + ' ' + cls; hole.append(f); setTimeout(() => f.remove(), 650); };
  const float = (hole, text, cls) => { const f = document.createElement('b'); f.className = 'bb-float ' + cls; f.textContent = text; hole.append(f); setTimeout(() => f.remove(), 900); };
  const hit = h => {
    if (g.wait || (typeof gamePaused !== 'undefined' && gamePaused)) return;
    const r = Burrow.tap(g, h); if (!r) return;
    const hole = holes[h], crit = hole.querySelector('.bb-crit'); crit.classList.add(r.bad ? 'struck' : 'tapped');
    if (r.bad) {
      fx(hole, 1, 'ice'); float(hole, 'Freeze!', 'bad'); field.classList.add('shake'); setTimeout(() => field.classList.remove('shake'), 400);
      $('#bbFrost').classList.add('on'); if (r.lost >= 3) say(`<span>Streak lost · ${r.lost}</span>`, 'lost');
      navigator.vibrate?.(60);
    } else {
      fx(hole, r.kind === 3 ? 0 : 3, r.kind === 3 ? 'big' : ''); float(hole, r.time ? '+' + r.time + 's' : '+' + r.pts, r.time ? 'time' : r.kind === 3 ? 'gold' : '');
      const c = $('#bbCombo'); c.innerHTML = `<b>${r.combo}</b> Combo${r.mult > 1 ? ` <i>×${r.mult}</i>` : ''}`; c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop');
      if (r.combo % 8 === 0 && r.mult > 1 && Burrow.mult(r.combo - 1) < r.mult) say(`<span>Streak ×${r.mult}!</span>`, 'up');
    }
  };
  field.onpointerdown = e => { const h = e.target.closest('.bb-hole'); if (h) { e.preventDefault(); hit(+h.dataset.h); } };
  function frame(now) {
    if (game !== g || !field.isConnected) return;
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    if (!g.wait && !document.hidden && !(typeof gamePaused !== 'undefined' && gamePaused)) {
      for (const e of Burrow.step(g, dt)) {
        if (e.type === 'show') { const crit = holes[e.hole].querySelector('.bb-crit'); crit.className = 'bb-crit'; crit.style.setProperty('--cx', e.kind % 4); crit.style.setProperty('--cy', e.kind >> 2); crit.dataset.id = e.id; void crit.offsetWidth; crit.classList.add('up'); }
        else if (e.type === 'hide') { const crit = holes[e.hole].querySelector('.bb-crit'); if (crit.dataset.id == e.id) crit.classList.remove('up'); }
        else if (e.type === 'break') { const c = $('#bbCombo'); c.innerHTML = ''; }
        else if (e.type === 'end') { burrowFinish(g); return; }
      }
      $('#bbFrost').classList.toggle('on', g.frozen > 0); if (g.frozen > 0) $('#bbFrostT').textContent = g.frozen.toFixed(1) + 's';
    }
    const sec = Math.ceil(g.left); if (sec !== shown) { shown = sec; $('#bbTime').textContent = sec + 's'; $('#bbBar').parentElement.classList.toggle('low', sec <= 10); }
    $('#bbBar').style.width = Math.min(100, g.left / Burrow.length * 100) + '%';
    if (g.score !== lastScore) { lastScore = g.score; $('#bbScore').textContent = fmt(g.score); }
    loop = requestAnimationFrame(frame);
  }
  loop = requestAnimationFrame(frame);
}
function burrowFinish(g) {
  if (g.done) return; g.done = true; g.running = false; g.ended = true;
  const banner = $('#bbBanner'); if (banner) { banner.className = 'bb-banner show go'; banner.innerHTML = '<span>Time\'s up!</span>'; }
  $('#bbFrost')?.classList.remove('on');
  let prize = null, rank = 0; const v = burrowState();
  if (g.paid) {
    v.best = Math.max(v.best, g.score); v.all = Math.max(v.all || 0, g.score);
    prize = Burrow.pointReward(g.score); for (const [id, n] of Object.entries(prize.items)) WonderGear.bagAdd(S, id, n);
    const got = gain(prize.gold, 0, 0); rank = Burrow.rankOf(v.day, burrowNames(), v.best, bbFrac());
  } else save();
  setTimeout(() => {
    if (game !== g && game) return;
    bagArtVars?.();
    const tile = (icon, n, name, hue, i) => `<span class="wr-prize" style="--rarity:${hue};--d:${1.5 + i * .15}s">${icon}<b>${n}</b><small>${name}</small></span>`;
    const prizes = prize ? `<div class="wr-prizes">${[tile(uiIcon('gold'), '+' + fmt(prize.gold), 'Gold', '#ffcf5a', 0), ...Object.entries(prize.items).map(([id, n], i) => tile(bagIcon(id), '×' + n, WonderGear.bagItemById[id].name, bagHue(WonderGear.bagItemById[id].rarity), i + 1))].join('')}</div>` : '<p class="wr-practice">Practice run · no reward, no ranking</p>';
    const record = g.paid && g.score >= v.best && g.score > 0;
    resultShow({ win: g.score > 0, title: record ? 'New Best!' : 'Time\'s Up!', kicker: g.paid ? (rank ? 'Today\'s place · No.' + rank : '') : 'Practice', stars: Burrow.stars(g.score), score: g.score,
      body: `<p class="wr-line">Max streak ${g.best} · ${g.hits} critters · ${g.misses} frozen · Best today ${fmt(v.best)}</p>${prizes}`,
      buttons: [[Burrow.runsLeft(v) ? 'Play again' : 'Practice', 'gold', 'openBurrowBoard()'], ['Lobby', 'violet', 'go(\'burrow\')']] });
  }, 1100);
}
