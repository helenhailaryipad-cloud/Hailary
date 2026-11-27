'use strict';
// Resource Realms (2026-11-27, user: "in that game there are very many different dungeons that each give something").
// Own design: eight daily dungeons, each pays ONE kind of resource. Ten floors each (power need rises), 2 free entries
// a UTC day per realm (+ up to 3 bought with prisms), a first clear of a floor pays double, any cleared floor can be
// swept. A lost fight keeps the entry. Optional save field S.realms {day, used{id:n}, bought{id:n}, best{id:floor}}.
// All numbers are placeholders.
const Realms = {
  free: 2, buyMax: 3, buyPrice: 30, floors: 10,
  list: [
    { id: 'gold', name: 'Gold Vault', gives: 'Gold', base: 1200, art: 'guardian-t9', reward: f => ({ gold: 1500 + 700 * f }) },
    { id: 'crystal', name: 'Crystal Mine', gives: 'Crystals', base: 1300, art: 'guardian-t12', reward: f => ({ stone: 20 + 10 * f }) },
    { id: 'gem', name: 'Gem Grotto', gives: 'Gems', base: 1500, art: 'guardian-t15', reward: f => ({ gem: 2 + f }) },
    { id: 'essence', name: 'Essence Spring', gives: 'Essence', base: 1600, art: 'guardian-t18', reward: f => ({ essence: 4 + 2 * f, synthesis: f >= 5 ? 1 : 0 }) },
    { id: 'shard', name: 'Starfall Ruins', gives: 'Star shards', base: 1700, art: 'guardian-t21', reward: f => ({ shard: 3 + 2 * f }) },
    { id: 'seal', name: 'Seal Sanctum', gives: 'Talent seals', base: 1800, art: 'guardian-t24', reward: f => ({ seals: 40 + 20 * f }) },
    { id: 'beast', name: 'Beast Lair', gives: 'Pet eggs', base: 2000, art: 'guardian-t27', reward: f => ({ gold: 300 * f, items: { petegg: f >= 6 ? 2 : 1 } }) },
    { id: 'wish', name: 'Wish Garden', gives: 'Wishes', base: 2200, art: 'guardian-t30', reward: f => ({ tickets: 30 + 15 * f }) },
  ],
  get(id) { return Realms.list.find(r => r.id === id); },
  need(id, f) { return Math.round(Realms.get(id).base * Math.pow(1.25, f - 1)); },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  state(s, now = Date.now()) {
    const v = s.realms ??= {}; v.best ??= {};
    const d = Realms.day(now); if (v.day !== d) { v.day = d; v.used = {}; v.bought = {}; }
    v.used ??= {}; v.bought ??= {}; return v;
  },
  left(s, id, now) { const v = Realms.state(s, now); return Realms.free + (v.bought[id] || 0) - (v.used[id] || 0); },
  buy(s, id, now) { const v = Realms.state(s, now); if (!Realms.get(id) || (v.bought[id] || 0) >= Realms.buyMax || (s.scales || 0) < Realms.buyPrice) return false; s.scales -= Realms.buyPrice; v.bought[id] = (v.bought[id] || 0) + 1; return true; },
  open(s, id, f) { return f >= 1 && f <= Realms.floors && f <= (Realms.state(s).best[id] || 0) + 1; },
  give(s, r) {
    s.gold += r.gold || 0; s.tickets = (s.tickets || 0) + (r.tickets || 0);
    if (r.seals && globalThis.WonderGear?.addSeals) WonderGear.addSeals(s, r.seals);
    if (globalThis.WonderGear?.state) { const eq = WonderGear.state(s); s.equipment = eq; for (const k of ['stone', 'shard', 'gem', 'essence', 'synthesis']) if (r[k]) eq.materials[k] = (eq.materials[k] || 0) + r[k]; }
    for (const [id, n] of Object.entries(r.items || {})) if (n && globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, id, n);
  },
  double(r) { const o = {}; for (const [k, v] of Object.entries(r)) o[k] = k === 'items' ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b * 2])) : v * 2; return o; },
  // fight a floor: wins when power reaches the need; a loss keeps the entry
  fight(s, id, f, power, now = Date.now()) {
    const v = Realms.state(s, now), R = Realms.get(id);
    if (!R || !Realms.open(s, id, f) || Realms.left(s, id, now) < 1) return null;
    if (power < Realms.need(id, f)) return { win: false };
    v.used[id] = (v.used[id] || 0) + 1; const first = f > (v.best[id] || 0); if (first) v.best[id] = f;
    const r = first ? Realms.double(R.reward(f)) : R.reward(f); Realms.give(s, r); return { win: true, first, reward: r };
  },
  sweep(s, id, now = Date.now()) {
    const v = Realms.state(s, now), f = v.best[id] || 0, R = Realms.get(id);
    if (!R || !f || Realms.left(s, id, now) < 1) return null;
    v.used[id] = (v.used[id] || 0) + 1; const r = R.reward(f); Realms.give(s, r); return { floor: f, reward: r };
  },
  due(s, now) { return Realms.list.some(r => Realms.left(s, r.id, now) > 0 && (Realms.state(s, now).best[r.id] || 0) > 0); },
  valid(v) {
    const int = n => Number.isSafeInteger(n) && n >= 0, map = (m, max) => m === undefined || (!!m && typeof m === 'object' && Object.entries(m).every(([k, n]) => !!Realms.get(k) && int(n) && n <= max));
    return v === undefined || (!!v && typeof v === 'object' && (v.day === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v.day)) && map(v.used, 99) && map(v.bought, Realms.buyMax) && map(v.best, Realms.floors));
  },
};
globalThis.Realms = Realms;

// REALMS_UI
let realmPick = null, realmFloor = 1, realmFightGen = 0;
const rlArt = id => artPath('realm-' + id);
function rlGains(r) {
  const tile = (icon, n, name, hue) => `<span class="bag-gain" style="--rarity:${hue}">${icon}<b>+${fmt(n)}</b><small>${name}</small></span>`;
  let h = typeof chGains === 'function' ? chGains({ gold: r.gold, stone: r.stone, gem: r.gem, essence: r.essence, items: r.items }) : '';
  if (r.shard) h += tile(uiIcon('crystals'), r.shard, 'Star shards', '#6a8ef0');
  if (r.synthesis) h += tile(uiIcon('crystals'), r.synthesis, 'Synthesis stone', '#e0a040');
  if (r.seals) h += tile(typeof denIcon === 'function' ? denIcon('misc', 0, 4, 1) : uiIcon('gem'), r.seals, 'Talent seals', '#b06af0');
  if (r.tickets) h += tile(uiIcon('wishes'), r.tickets, 'Wishes', '#8a6af0');
  return h;
}
function showRealms() {
  if (realmPick) return showRealm(realmPick);
  const v = Realms.state(S), power = stats().power;
  $('#main').innerHTML = `<section class="rl-room" style="--rlbg:url('${rlArt('hub')}')">
   <div class="rl-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="rl-title"><b>Resource Realms</b><small>Each realm gives one treasure · ${Realms.free} free entries a day</small></div><span class="rl-power">⚔&#xFE0E; ${fmt(power)}</span></div>
   <div class="rl-list">${Realms.list.map(r => { const left = Realms.left(S, r.id), best = v.best[r.id] || 0;
     return `<button class="rl-card" onclick="realmPick='${r.id}';realmFloor=Math.min(Realms.floors,(Realms.state(S).best['${r.id}']||0)+1);showRealm('${r.id}')" style="--art:url('${rlArt(r.id)}')">${denPlain}<span class="rl-shade"></span><b>${r.name}</b><small>${r.gives}</small><i class="rl-left ${left ? '' : 'none'}">${left}/${Realms.free + (v.bought[r.id] || 0)}</i><em>Floor ${best}/${Realms.floors}</em></button>`; }).join('')}</div>
  </section>`;
}
function showRealm(id) {
  const R = Realms.get(id), v = Realms.state(S), power = stats().power, best = v.best[id] || 0, left = Realms.left(S, id), f = realmFloor, need = Realms.need(id, f), first = f > best;
  const floors = Array.from({ length: Realms.floors }, (_, i) => { const n = i + 1, ok = Realms.open(S, id, n), done = n <= best;
    return `<button class="rl-floor ${n === f ? 'on' : ''} ${done ? 'done' : ''} ${ok ? '' : 'lock'}" ${ok ? `onclick="realmFloor=${n};showRealm('${id}')"` : 'disabled'}>${denPlain}<b>${n}</b><small>${done ? '✓' : ok ? fmt(Realms.need(id, n)) : '🔒'}</small></button>`; }).join('');
  const r = first ? Realms.double(R.reward(f)) : R.reward(f);
  $('#main').innerHTML = `<section class="rl-room rl-one" style="--rlbg:url('${rlArt(id)}')">
   <div class="rl-top"><button data-back aria-label="Back" onclick="realmPick=null;showRealms()">‹</button><div class="rl-title"><b>${R.name}</b><small>Gives ${R.gives.toLowerCase()} · best floor ${best}/${Realms.floors}</small></div><span class="rl-power">⚔&#xFE0E; ${fmt(power)}</span></div>
   <div class="rl-stage"><img class="rl-boss" src="${artPath(R.art)}" alt=""></div>
   <div class="rl-card2">
    <div class="rl-floors">${floors}</div>
    <div class="rl-info"><b>Floor ${f}</b><span class="${power >= need ? 'ok' : 'low'}">Power ${fmt(power)} / ${fmt(need)}</span>${first ? '<i class="rl-first">First clear ×2</i>' : ''}</div>
    <div class="bag-gains rl-gains">${rlGains(r)}</div>
    <div class="rl-btns"><span class="rl-entries">Entries <b>${left}</b>${(v.bought[id] || 0) < Realms.buyMax ? `<button class="rl-plus" onclick="realmBuy('${id}')" title="+1 entry for ${Realms.buyPrice} prisms">${denPlain}+</button>` : ''}</span>
     <button class="rl-sweep" ${best && left ? '' : 'disabled'} onclick="realmSweep('${id}')">${denPlain}Sweep ${best ? 'F' + best : ''}</button>
     <button class="rl-go" ${left ? '' : 'disabled'} onclick="realmFight('${id}',${f})">${denPlain}Challenge</button></div>
   </div>
  </section>`; bagArtVars();
}
function realmBuy(id) {
  popup(`<div class="gd-pop"><h2>One more entry</h2><p>Buy an extra entry for <b>${Realms.get(id).name}</b> today for <b>${Realms.buyPrice}</b> prisms? (${Realms.buyMax - (Realms.state(S).bought[id] || 0)} left today)</p><button class="gd-big" onclick="realmBuyGo('${id}')">${denPlain}<img src="${artPath('ui-prism')}" alt=""> ${Realms.buyPrice}</button></div>`); $('#modal').classList.add('bw-pop');
}
function realmBuyGo(id) { if (!Realms.buy(S, id)) { toast('Not enough prisms'); return; } save(); wallet(); $('#modal').close(); showRealm(id); toast('+1 entry'); }
function realmSweep(id) { const out = Realms.sweep(S, id); if (!out) return; save(); wallet(); showRealm(id); resultShow({ title: 'Swept!', kicker: Realms.get(id).name + ' · Floor ' + out.floor, win: true, body: `<div class="bag-gains">${rlGains(out.reward)}</div>`, buttons: [['Lovely', 'gold', '']] }); }
function realmFight(id, f) {
  const R = Realms.get(id), power = stats().power;
  if (power < Realms.need(id, f)) { popup(`<div class="gd-pop"><h2>Too strong for now</h2><p>Floor ${f} needs power <b>${fmt(Realms.need(id, f))}</b>; you have ${fmt(power)}. The entry is kept.</p><button class="gd-big" onclick="$('#modal').close();go('cityForge')">${denPlain}Power Up</button></div>`); $('#modal').classList.add('bw-pop'); return; }
  const gen = ++realmFightGen, stage = document.querySelector('.rl-stage'), boss = document.querySelector('.rl-boss');
  document.querySelectorAll('.rl-card2 button').forEach(b => b.disabled = true);
  stage?.insertAdjacentHTML('beforeend', `<div class="rl-hp"><i></i></div><img class="rl-me" src="${reinaLookPath(false)}" alt=""><div class="rl-nums"></div>`);
  const bar = stage?.querySelector('.rl-hp i'), nums = stage?.querySelector('.rl-nums'), t0 = Date.now(), dur = 2400;
  const tick = () => {
    if (gen !== realmFightGen || screen !== 'realms') return;
    const p = Math.min(1, (Date.now() - t0) / dur); if (bar) bar.style.width = (100 - p * 100) + '%';
    if (nums && Math.random() < .4) { const n = document.createElement('b'); n.textContent = fmt(Math.round(power * (.3 + Math.random() * .5))); n.style.left = 45 + Math.random() * 35 + '%'; n.style.top = 15 + Math.random() * 40 + '%'; nums.append(n); setTimeout(() => n.remove(), 900); boss?.classList.remove('hit'); void boss?.offsetWidth; boss?.classList.add('hit'); }
    if (p < 1) return setTimeout(tick, 150);
    const out = Realms.fight(S, id, f, power); if (!out) return showRealm(id); save(); wallet();
    if (f === realmFloor && f < Realms.floors && out.first) realmFloor = f + 1;
    showRealm(id); resultShow({ title: 'Floor cleared!', kicker: R.name + ' · Floor ' + f + (out.first ? ' · first clear ×2' : ''), stars: 3, win: true, body: `<div class="bag-gains">${rlGains(out.reward)}</div>`, buttons: [['Lovely', 'gold', '']] });
  };
  setTimeout(tick, 250);
}

// Gameplay -> Material page: the realms as a compact grid that opens the realm room
function realmsList() {
  const v = Realms.state(S);
  return `<div class="rl-mini">${Realms.list.map(r => `<button class="rl-card sm" style="--art:url('${rlArt(r.id)}')" onclick="realmPick='${r.id}';realmFloor=Math.min(Realms.floors,(Realms.state(S).best['${r.id}']||0)+1);go('realms')">${denPlain}<span class="rl-shade"></span><b>${r.name}</b><small>${r.gives}</small><i class="rl-left ${Realms.left(S, r.id) ? '' : 'none'}">${Realms.left(S, r.id)}</i></button>`).join('')}</div>`;
}
