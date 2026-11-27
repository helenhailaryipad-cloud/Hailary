'use strict';
// Resource Realms (2026-11-27, user: "in that game there are very many different dungeons that each give something";
// then twelve photos of the reference's boss halls). Own design and names: eight realms, each pays ONE kind of
// resource. Ten floors, four bosses on each floor (power need rises with floor and boss). An entry sends Reina through
// the floor's ready bosses (the chosen one first, then focused ones); every defeat fills her Rage by `rage`, at 100 she
// leaves. A defeated boss respawns after `respawnMs`. The first defeat of each boss pays double; when all four bosses
// of a floor have fallen once, the next floor opens. Merge spends several entries on one run for that many times the
// loot. Sweep repeats the best fully cleared floor. 2 free entries a UTC day per realm (+ up to 3 bought with prisms).
// Bosses too strong for her power are skipped; a run that defeats nobody keeps its entries.
// Optional save field S.realms {day, used{id:n}, bought{id:n}, best{id:floor}, beat{id:{floor:mask}},
// dead{id:{"f.b":time}}, focus["id:f.b"], log[{t,id,f,k,m,r}]}. All numbers are placeholders.
const Realms = {
  free: 2, buyMax: 3, buyPrice: 30, floors: 10, bosses: 4, rage: 25, respawnMs: 10 * 60e3, logMax: 20, focusMax: 12,
  share: [.2, .25, .25, .3],
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
  // the boss pictures the game already has; realms draw their floor bosses from them in turn
  pool: [['mistwood', 'Thornwing Guardian'], ['guardian-t7', 'Jade Antlerwolf'], ['moonfall', 'The Hollow Moon'], ['guardian-t8', 'Sapphire Bastion'],
    ['emberpeak', 'Ashen Crown'], ['guardian-t9', 'Ruby Gryphon'], ['coral', 'Pearlfin Empress'], ['guardian-t10', 'Gilded Serpent'],
    ['frost', 'Snowbell Matriarch'], ['guardian-t11', 'Amethyst Dreamwing'], ['honey', 'Honeythorn King'], ['guardian-t12', 'Coral Hydra'],
    ['storm', 'Tempest Roc'], ['guardian-t13', 'Glacier Mammoth'], ['crystal', 'Prism Antler'], ['guardian-t14', 'Ember Mantis'],
    ['sunspire', 'Aurelion the Dawnkeeper'], ['guardian-t15', 'Mossback Tusk'], ['guardian-t16', 'Moonveil Fox'], ['guardian-t17', 'Pearlclaw'],
    ['guardian-t18', 'Obsidian Minotaur'], ['guardian-t19', 'Voltfang Wyvern'], ['guardian-t20', 'Rosewood Hart'], ['guardian-t21', 'Ivory Sphinx'],
    ['guardian-t22', 'Astral Scorpion'], ['guardian-t23', 'Mistborn Qilin'], ['guardian-t24', 'Copperhide'], ['guardian-t25', 'Tide Leviathan'],
    ['guardian-t26', 'Crystal Owl'], ['guardian-t27', 'Storm Chimera'], ['guardian-t28', 'Lava Basilisk'], ['guardian-t29', 'Diamond Lion'],
    ['guardian-t30', 'Aurora Phoenix'], ['guardian-t31', 'Celestial Dragon']],
  get(id) { return Realms.list.find(r => r.id === id); },
  index(id) { return Realms.list.findIndex(r => r.id === id); },
  need(id, f, b = 0) { return Math.round(Realms.get(id).base * Math.pow(1.25, f - 1) * (1 + .1 * b)); },
  boss(id, f, b) {
    const ri = Realms.index(id), p = Realms.pool[(ri * 7 + (f - 1) * 4 + b) % Realms.pool.length];
    return { art: p[0], name: p[1], b, f, key: f + '.' + b, need: Realms.need(id, f, b), lv: ri * 20 + f * 10 + b * 3 };
  },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  raw(s) { const v = s.realms ??= {}; v.best ??= {}; v.beat ??= {}; v.dead ??= {}; v.focus ??= []; v.log ??= []; return v; },
  state(s, now = Date.now()) {
    const v = Realms.raw(s);
    const d = Realms.day(now); if (v.day !== d) { v.day = d; v.used = {}; v.bought = {}; }
    v.used ??= {}; v.bought ??= {};
    for (const [id, m] of Object.entries(v.dead)) { for (const [k, t] of Object.entries(m)) if (now - t >= Realms.respawnMs || t > now + 6e4) delete m[k]; if (!Object.keys(m).length) delete v.dead[id]; }
    return v;
  },
  left(s, id, now) { const v = Realms.state(s, now); return Realms.free + (v.bought[id] || 0) - (v.used[id] || 0); },
  total(s, id, now) { return Realms.free + (Realms.state(s, now).bought[id] || 0); },
  buy(s, id, now) { const v = Realms.state(s, now); if (!Realms.get(id) || (v.bought[id] || 0) >= Realms.buyMax || (s.scales || 0) < Realms.buyPrice) return false; s.scales -= Realms.buyPrice; v.bought[id] = (v.bought[id] || 0) + 1; return true; },
  open(s, id, f) { return f >= 1 && f <= Realms.floors && f <= (Realms.raw(s).best[id] || 0) + 1; },
  mask(s, id, f) { const v = Realms.raw(s); return f <= (v.best[id] || 0) ? 15 : (v.beat[id]?.[f] || 0); },
  respawn(s, id, f, b, now = Date.now()) { const t = Realms.state(s, now).dead[id]?.[f + '.' + b]; return t ? t + Realms.respawnMs : 0; },
  alive(s, id, f, b, now = Date.now()) { return !Realms.respawn(s, id, f, b, now); },
  focused(s, id, f, b) { return Realms.raw(s).focus.includes(id + ':' + f + '.' + b); },
  toggleFocus(s, id, f, b) {
    const v = Realms.raw(s), k = id + ':' + f + '.' + b, i = v.focus.indexOf(k);
    if (i >= 0) { v.focus.splice(i, 1); return false; }
    if (v.focus.length >= Realms.focusMax) v.focus.shift(); v.focus.push(k); return true;
  },
  // the loot of one boss: its share of the floor reward (an item only from the last, strongest boss)
  part(id, f, b) {
    const r = Realms.get(id).reward(f), o = {};
    for (const [k, n] of Object.entries(r)) { if (k === 'items') { if (b === Realms.bosses - 1) o.items = { ...n }; } else if (n) o[k] = Math.max(1, Math.round(n * Realms.share[b])); }
    return o;
  },
  scale(r, m) { const o = {}; for (const [k, v] of Object.entries(r)) o[k] = k === 'items' ? Object.fromEntries(Object.entries(v).map(([a, b]) => [a, b * m])) : v * m; return o; },
  double(r) { return Realms.scale(r, 2); },
  add(a, b) { const o = { ...a }; for (const [k, v] of Object.entries(b)) { if (k === 'items') { o.items = { ...(o.items || {}) }; for (const [i, n] of Object.entries(v)) o.items[i] = (o.items[i] || 0) + n; } else o[k] = (o[k] || 0) + v; } return o; },
  give(s, r) {
    s.gold += r.gold || 0; s.tickets = (s.tickets || 0) + (r.tickets || 0);
    if (r.seals && globalThis.WonderGear?.addSeals) WonderGear.addSeals(s, r.seals);
    if (globalThis.WonderGear?.state) { const eq = WonderGear.state(s); s.equipment = eq; for (const k of ['stone', 'shard', 'gem', 'essence', 'synthesis']) if (r[k]) eq.materials[k] = (eq.materials[k] || 0) + r[k]; }
    for (const [id, n] of Object.entries(r.items || {})) if (n && globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, id, n);
  },
  // the order Reina fights in: the chosen boss, then focused ones, then the rest
  order(s, id, f, pick, now = Date.now()) {
    const all = [0, 1, 2, 3].filter(b => Realms.alive(s, id, f, b, now));
    return all.sort((a, b) => (b === pick) - (a === pick) || Realms.focused(s, id, f, b) - Realms.focused(s, id, f, a) || a - b);
  },
  run(s, id, f, pick, power, merge = 1, now = Date.now()) {
    const v = Realms.state(s, now), R = Realms.get(id);
    if (!R || !Realms.open(s, id, f) || !Number.isInteger(merge) || merge < 1 || merge > Realms.left(s, id, now)) return null;
    const order = Realms.order(s, id, f, pick, now), kills = [], strong = []; let rage = 0, total = {};
    for (const b of order) {
      if (rage >= 100) break;
      if (power < Realms.need(id, f, b)) { strong.push(b); continue; }
      const first = !(Realms.mask(s, id, f) & (1 << b)), r = Realms.scale(first ? Realms.double(Realms.part(id, f, b)) : Realms.part(id, f, b), merge);
      kills.push({ b, first, reward: r }); total = Realms.add(total, r); rage = Math.min(100, rage + Realms.rage);
      (v.dead[id] ??= {})[f + '.' + b] = now;
      if (f > (v.best[id] || 0)) (v.beat[id] ??= {})[f] = (v.beat[id][f] || 0) | (1 << b);
    }
    if (!kills.length) return { win: false, strong, ready: order.length };
    v.used[id] = (v.used[id] || 0) + merge; Realms.give(s, total);
    let cleared = false; if (f > (v.best[id] || 0) && v.beat[id]?.[f] === 15) { v.best[id] = f; delete v.beat[id][f]; cleared = true; }
    if (v.beat[id] && !Object.keys(v.beat[id]).length) delete v.beat[id];
    v.log.unshift({ t: now, id, f, k: kills.length, m: merge, r: total }); v.log.length = Math.min(v.log.length, Realms.logMax);
    return { win: true, kills, strong, rage, reward: total, cleared, merge };
  },
  sweep(s, id, merge = 1, now = Date.now()) {
    const v = Realms.state(s, now), f = v.best[id] || 0, R = Realms.get(id);
    if (!R || !f || !Number.isInteger(merge) || merge < 1 || merge > Realms.left(s, id, now)) return null;
    v.used[id] = (v.used[id] || 0) + merge; const r = Realms.scale(R.reward(f), merge); Realms.give(s, r);
    v.log.unshift({ t: now, id, f, k: 0, m: merge, r }); v.log.length = Math.min(v.log.length, Realms.logMax);
    return { floor: f, reward: r, merge };
  },
  // simulated AI adventurers in the realm (labelled AI in the UI); changes every ten minutes
  crowd(id, now = Date.now()) { const n = Math.floor(now / 6e5) * 31 + Realms.index(id) * 17; return (n * 2654435761 >>> 0) % 9; },
  aiLog(id, now = Date.now(), n = 8) {
    const names = ['Lumi', 'Kestrel', 'Nyra', 'Orin', 'Sable', 'Tamsin', 'Wren', 'Faye', 'Bram', 'Ivo', 'Mirel', 'Juno'];
    return Array.from({ length: n }, (_, i) => { const slot = Math.floor(now / 9e4) - i, h = (slot * 2654435761 + Realms.index(id) * 97) >>> 0;
      return { t: slot * 9e4 + (h % 9e4), who: names[h % names.length], f: 1 + (h >>> 4) % Realms.floors, b: (h >>> 9) % 4 }; });
  },
  due(s, now) { return Realms.list.some(r => Realms.left(s, r.id, now) > 0 && (Realms.state(s, now).best[r.id] || 0) > 0); },
  valid(v) {
    const int = n => Number.isSafeInteger(n) && n >= 0, obj = o => !!o && typeof o === 'object' && !Array.isArray(o);
    const map = (m, max) => m === undefined || (obj(m) && Object.entries(m).every(([k, n]) => !!Realms.get(k) && int(n) && n <= max));
    const nested = (m, ok) => m === undefined || (obj(m) && Object.entries(m).every(([k, x]) => !!Realms.get(k) && obj(x) && Object.entries(x).every(ok)));
    const rew = r => obj(r) && Object.entries(r).every(([k, n]) => k === 'items' ? obj(n) && Object.values(n).every(int) : ['gold', 'stone', 'gem', 'essence', 'synthesis', 'shard', 'seals', 'tickets'].includes(k) && int(n));
    return v === undefined || (obj(v) && (v.day === undefined || /^\d{4}-\d{2}-\d{2}$/.test(v.day)) && map(v.used, 99) && map(v.bought, Realms.buyMax) && map(v.best, Realms.floors)
      && nested(v.beat, ([f, m]) => /^\d+$/.test(f) && +f >= 1 && +f <= Realms.floors && int(m) && m <= 15)
      && nested(v.dead, ([k, t]) => /^\d+\.[0-3]$/.test(k) && Number.isFinite(t) && t >= 0 && t <= 1e15)
      && (v.focus === undefined || Array.isArray(v.focus) && v.focus.length <= Realms.focusMax && v.focus.every(k => typeof k === 'string' && /^[a-z]+:\d+\.[0-3]$/.test(k) && !!Realms.get(k.split(':')[0])))
      && (v.log === undefined || Array.isArray(v.log) && v.log.length <= Realms.logMax && v.log.every(e => obj(e) && Number.isFinite(e.t) && !!Realms.get(e.id) && int(e.f) && e.f <= Realms.floors && int(e.k) && e.k <= 4 && int(e.m) && e.m <= 99 && rew(e.r))));
  },
};
globalThis.Realms = Realms;

// REALMS_UI
let realmPick = null, realmFloor = 1, realmBoss = 0, realmMerge = 1, realmFightGen = 0, realmTimer = 0, realmFrom = 'home', realmOut = null;
const rlArt = id => artPath('realm-' + id);
const rlClock = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const rlAgo = t => { const m = Math.max(0, Math.round((Date.now() - t) / 6e4)); return m < 1 ? 'just now' : m < 60 ? m + ' min ago' : Math.floor(m / 60) + ' h ago'; };
function rlLines(r) {
  const prism = `<img class="bag-ico" src="${artPath('ui-prism')}" alt="">`, out = [];
  const add = (k, icon, name, hue) => { if (r[k]) out.push({ icon, name, n: r[k], hue }); };
  add('gold', uiIcon('gold'), 'Gold', '#f0b848'); add('stone', uiIcon('enhance'), 'Crystals', '#5ac8c0'); add('gem', uiIcon('gem'), 'Gems', '#e05a8a');
  add('essence', uiIcon('craft'), 'Essence', '#8a6af0'); add('synthesis', uiIcon('crystals'), 'Synthesis stone', '#e0a040'); add('shard', uiIcon('star'), 'Star shards', '#6a8ef0');
  add('seals', typeof denIcon === 'function' ? denIcon('misc', 0, 4, 1) : uiIcon('gem'), 'Talent seals', '#b06af0'); add('tickets', uiIcon('wishes'), 'Wishes', '#8a6af0');
  for (const [id, n] of Object.entries(r.items || {})) if (n) out.push({ icon: typeof bagIcon === 'function' ? bagIcon(id) : prism, name: WonderGear.bagItemById?.[id]?.name || id, n, hue: '#c08a40' });
  return out;
}
function rlGains(r) { bagArtVars(); return rlLines(r).map(x => `<span class="bag-gain" style="--rarity:${x.hue}">${x.icon}<b>+${fmt(x.n)}</b><small>${x.name}</small></span>`).join(''); }
function rlPick(id) {
  realmPick = id; realmFloor = Math.min(Realms.floors, (Realms.state(S).best[id] || 0) + 1); realmMerge = 1;
  const order = Realms.order(S, id, realmFloor, -1); realmBoss = order.length ? order[0] : 0;
}
function rlStrip(on) {
  return `<button class="rl-sc gh ${on === 'guardian' ? 'on' : ''}" style="--art:url('${artPath('emberpeak')}')" onclick="go('dungeons')">${denPlain}<i class="rl-red">Equipment</i><b>Guardian Hunt</b></button>` + Realms.list.map(r => { const l = Realms.left(S, r.id);
    return `<button class="rl-sc ${r.id === on ? 'on' : ''}" style="--art:url('${rlArt(r.id)}')" onclick="rlPick('${r.id}');${on === 'guardian' ? "realmFrom='dungeons';go('realms')" : `showRealm('${r.id}')`}">${denPlain}<i class="rl-red">${r.gives}</i><b>${r.name}</b>${l > 0 ? `<em>${l}</em>` : ''}</button>`; }).join('');
}
function showRealms() { if (!realmPick || !Realms.get(realmPick)) rlPick('gold'); showRealm(realmPick); }
function showRealm(id) {
  clearInterval(realmTimer); realmFightGen++;
  const R = Realms.get(id), v = Realms.state(S), now = Date.now(), power = stats().power, best = v.best[id] || 0, left = Realms.left(S, id), tot = Realms.total(S, id);
  const f = realmFloor, lock = !Realms.open(S, id, f), B = Realms.boss(id, f, realmBoss), ok = power >= B.need, mask = Realms.mask(S, id, f);
  realmMerge = Math.max(1, Math.min(realmMerge, Math.max(1, left)));
  const beat = mask & (1 << realmBoss), part = beat ? Realms.part(id, f, realmBoss) : Realms.double(Realms.part(id, f, realmBoss)), foc = Realms.focused(S, id, f, realmBoss);
  const side = (icon, label, act) => `<button class="rl-ic" onclick="${act}">${denPlain}<i>${icon}</i><span>${label}</span></button>`;
  const floors = Array.from({ length: Realms.floors }, (_, i) => { const n = i + 1, o = Realms.open(S, id, n);
    return `<button class="rl-ft ${n === f ? 'on' : ''} ${o ? '' : 'lock'} ${n <= best ? 'done' : ''}" onclick="realmFloor=${n};realmBoss=0;showRealm('${id}')">${denPlain}${n}F${n <= best ? '<i>✓</i>' : ''}</button>`; }).join('');
  const cards = [0, 1, 2, 3].map(b => { const x = Realms.boss(id, f, b), dead = Realms.respawn(S, id, f, b, now), fb = Realms.focused(S, id, f, b), got = mask & (1 << b);
    return `<button class="rl-bc ${b === realmBoss ? 'on' : ''} ${lock ? 'lock' : ''} ${dead ? 'dead' : ''}" onclick="realmBoss=${b};showRealm('${id}')">${denPlain}${lock ? '<i class="rl-tag red">Locked</i>' : fb ? '<i class="rl-tag">Focused</i>' : ''}${!got && !lock ? '<i class="rl-x2">×2</i>' : ''}
     <span class="rl-dia"><img src="${artPath(x.art)}" alt=""></span><i class="rl-lv">${f}F</i><b>${x.name}</b><small>Lv. ${x.lv}</small>
     <em class="${lock ? 'lk' : dead ? 'wait' : power >= x.need ? 'ready' : 'strong'}" ${dead && !lock ? `data-until="${dead}"` : ''}>${lock ? 'Floor ' + (f - 1) + ' first' : dead ? rlClock(dead - now) : power >= x.need ? 'Ready' : 'Too strong'}</em></button>`; }).join('');
  const strip = rlStrip(id);
  const goBtn = lock ? `<button class="rl-go" disabled>${denPlain}Clear ${f - 1}F first</button>` : `<button class="rl-go" onclick="realmGo('${id}')">${denPlain}Proceed Now</button>`;
  $('#main').innerHTML = `<section class="rl-room rl-v2" style="--rlbg:url('${rlArt(id)}')">
   <div class="rl-top"><button data-back aria-label="Back" onclick="go(realmFrom||'home')">‹</button><div class="rl-ribbon">${R.name}</div>
    <span class="rl-chip">${uiIcon('gold')}${fmt(S.gold)}</span><span class="rl-chip"><img src="${artPath('ui-prism')}" alt="">${fmt(S.scales || 0)}</span></div>
   <div class="rl-stage">
    <img class="rl-boss" src="${artPath(B.art)}" alt="">
    <div class="rl-head"><h2>${B.name}</h2><p>Recommended Power: <b class="${ok ? 'ok' : 'low'}">${fmt(B.need)}</b></p></div>
    <div class="rl-side">${side(uiIcon('quests'), 'Boss Stats', `realmStats('${id}')`)}${side(uiIcon('equipment'), 'Loot Records', `realmLoot('${id}')`)}${side(uiIcon('attack'), 'Killing Log', `realmLog('${id}')`)}</div>
    <aside class="rl-rew"><i class="rl-shared ${beat ? '' : 'x2'}">${beat ? 'Per defeat' : 'First ×2'}</i><h3>Rewards</h3>${rlLines(part).map(x => `<span class="rl-rt" style="--rarity:${x.hue}" title="${x.name}">${x.icon}<b>${fmt(x.n)}</b></span>`).join('')}</aside>
    ${lock ? '' : `<label class="rl-focus"><input type="checkbox" ${foc ? 'checked' : ''} onchange="realmFocus('${id}')"><span>Focus</span></label>`}
   </div>
   <div class="rl-panel">
    <div class="rl-floors">${floors}</div>
    <div class="rl-cards">${cards}</div>
    <div class="rl-line"><span>${uiIcon('party')} Adventurers here: <b>${Realms.crowd(id, now)}</b> <small>AI</small></span>
     <span>◆ Entries: <b class="${left ? '' : 'none'}">${left}</b>/${tot}<button class="rl-plus" onclick="realmNotice('${id}')" aria-label="More entries">${denPlain}+</button></span>
     <span class="rl-merge">Merge<button onclick="realmMergeStep(-1)" ${realmMerge > 1 ? '' : 'disabled'}>${denPlain}−</button><b>${realmMerge}</b><button onclick="realmMergeStep(1)" ${realmMerge < left ? '' : 'disabled'}>${denPlain}+</button></span></div>
    <div class="rl-act"><span></span>${goBtn}<button class="rl-sweep" ${best ? '' : 'disabled'} onclick="realmSweep('${id}')">${denPlain}<i>${uiIcon('attack')}</i><span>Sweep${best ? ' ' + best + 'F' : ''}</span></button><button class="rl-help" onclick="realmRules()" aria-label="Rules">${denPlain}?</button></div>
   </div>
   <div class="rl-strip">${strip}</div>
  </section>`;
  const st = document.querySelector('.rl-strip'), on = st?.querySelector('.on'); if (st && on) st.scrollLeft = on.offsetLeft - st.clientWidth / 2 + on.offsetWidth / 2;
  const fl = document.querySelector('.rl-floors'), fo = fl?.querySelector('.on'); if (fl && fo) fl.scrollLeft = fo.offsetLeft - fl.clientWidth / 2 + fo.offsetWidth / 2;
  realmTimer = setInterval(() => {
    if (screen !== 'realms' || !document.querySelector('.rl-v2')) return clearInterval(realmTimer);
    let again = false; document.querySelectorAll('.rl-v2 [data-until]').forEach(e => { const ms = +e.dataset.until - Date.now(); if (ms <= 0) again = true; else e.textContent = rlClock(ms); });
    if (again) showRealm(id);
  }, 1000);
}
function realmFocus(id) { Realms.toggleFocus(S, id, realmFloor, realmBoss); save(); showRealm(id); }
function realmMergeStep(d) { realmMerge = Math.max(1, Math.min(Realms.left(S, realmPick), realmMerge + d)); showRealm(realmPick); }
function rlPop(html) { popup(`<div class="gd-pop rl-pop">${html}</div>`); $('#modal').classList.add('bw-pop'); }
function realmNotice(id) {
  const R = Realms.get(id), v = Realms.state(S), can = Realms.buyMax - (v.bought[id] || 0), left = Realms.left(S, id);
  rlPop(`<h2>Notice</h2><div class="rl-key" style="--art:url('${rlArt(id)}')"><b>${R.name}</b></div>
   <p>${left ? `You have <b>${left}</b> ${left === 1 ? 'entry' : 'entries'} left today.` : 'Today’s free entries are used.'}</p>
   ${can > 0 ? `<p>One more entry costs <b class="ok">${Realms.buyPrice}</b> prisms (${can} of ${Realms.buyMax} left today).</p><button class="gd-big" onclick="realmBuyGo('${id}')">${denPlain}Confirm · <img src="${artPath('ui-prism')}" alt=""> ${Realms.buyPrice}</button>` : '<p>No more entries can be bought today. New entries at 00:00 UTC.</p>'}`);
}
function realmBuy(id) { realmNotice(id); }
function realmBuyGo(id) { if (!Realms.buy(S, id)) { toast('Not enough prisms'); return; } save(); wallet(); $('#modal').close(); showRealm(id); toast('+1 entry'); }
function realmStats(id) {
  const B = Realms.boss(id, realmFloor, realmBoss), mask = Realms.mask(S, id, realmFloor), first = !(mask & (1 << realmBoss));
  rlPop(`<h2>${B.name}</h2><p class="rl-sub">${Realms.get(id).name} · ${realmFloor}F · Lv. ${B.lv}</p>
   <div class="rl-statgrid"><span>HP<b>${fmt(B.need * 30)}</b></span><span>ATK<b>${fmt(Math.round(B.need / 4))}</b></span><span>DEF<b>${fmt(Math.round(B.need / 9))}</b></span><span>Recommended<b>${fmt(B.need)}</b></span></div>
   <p>Respawns ${Realms.respawnMs / 6e4} min after it falls. Each defeat fills Rage by ${Realms.rage}.</p>
   <h3>Drops${first ? ' (first defeat ×2)' : ''}</h3><div class="bag-gains">${rlGains(first ? Realms.double(Realms.part(id, realmFloor, realmBoss)) : Realms.part(id, realmFloor, realmBoss))}</div>`);
}
function realmLoot(id) {
  const log = Realms.state(S).log.filter(e => e.id === id);
  rlPop(`<h2>Loot Records</h2><p class="rl-sub">${Realms.get(id).name} · your last runs</p>${log.length ? `<div class="rl-recs">${log.map(e => `<div><small>${rlAgo(e.t)} · ${e.f}F · ${e.k ? e.k + (e.k === 1 ? ' boss' : ' bosses') : 'Sweep'}${e.m > 1 ? ' · Merge ×' + e.m : ''}</small><div class="bag-gains">${rlGains(e.r)}</div></div>`).join('')}</div>` : '<p>No runs here yet.</p>'}`);
}
function realmLog(id) {
  const mine = Realms.state(S).log.filter(e => e.id === id && e.k).map(e => ({ t: e.t, txt: `<b>Reina</b> defeated ${e.k} ${e.k === 1 ? 'boss' : 'bosses'} on ${e.f}F` }));
  const ai = Realms.aiLog(id).map(e => ({ t: e.t, txt: `<b>${e.who}</b> <small class="ai">AI</small> defeated ${Realms.boss(id, e.f, e.b).name} on ${e.f}F` }));
  rlPop(`<h2>Killing Log</h2><p class="rl-sub">${Realms.get(id).name}</p><div class="rl-kl">${[...mine, ...ai].sort((a, b) => b.t - a.t).slice(0, 12).map(e => `<div><span>${e.txt}</span><small>${rlAgo(e.t)}</small></div>`).join('')}</div>`);
}
function realmRules() {
  rlPop(`<h2>Resource Realms</h2><ul class="rl-rules">
   <li>Every realm gives one treasure. Each floor has four bosses; higher floors pay more.</li>
   <li>Proceed Now spends an entry: Reina fights the chosen boss first, then focused ones, then the rest. Each defeat fills Rage by ${Realms.rage}; at 100 she leaves.</li>
   <li>A defeated boss respawns after ${Realms.respawnMs / 6e4} minutes. Bosses above your power are skipped; a run that defeats nobody keeps its entry.</li>
   <li>The first defeat of every boss pays double. Defeat all four once to open the next floor.</li>
   <li>Merge spends several entries on one run for that many times the loot. Sweep repeats your best cleared floor without a fight.</li>
   <li>${Realms.free} free entries per realm a day (00:00 UTC), up to ${Realms.buyMax} more for ${Realms.buyPrice} prisms each.</li></ul>`);
}
function realmSweep(id) { const out = Realms.sweep(S, id, realmMerge); if (!out) return; save(); wallet(); realmMerge = 1; showRealm(id); resultShow({ title: 'Swept!', kicker: Realms.get(id).name + ' · ' + out.floor + 'F' + (out.merge > 1 ? ' · Merge ×' + out.merge : ''), win: true, body: `<div class="bag-gains">${rlGains(out.reward)}</div>`, buttons: [['Lovely', 'gold', '']] }); }
function realmGo(id) {
  const f = realmFloor, power = stats().power;
  if (Realms.left(S, id) < 1) return realmNotice(id);
  const out = Realms.run(S, id, f, realmBoss, power, realmMerge); if (!out) return showRealm(id);
  if (!out.win) {
    if (!out.ready) return rlPop(`<h2>All bosses are resting</h2><p>Every boss on ${f}F was defeated a moment ago. Come back when a timer runs out, or pick another floor.</p>`);
    return rlPop(`<h2>Too strong for now</h2><p>The ready bosses on ${f}F need power <b>${fmt(Math.min(...out.strong.map(b => Realms.need(id, f, b))))}</b>; you have ${fmt(power)}. Your entry is kept.</p><button class="gd-big" onclick="$('#modal').close();go('cityForge')">${denPlain}Power Up</button>`);
  }
  save(); wallet(); realmMerge = 1; realmRunView(id, f, out);
}
function realmRunView(id, f, out) {
  clearInterval(realmTimer); const gen = ++realmFightGen, R = Realms.get(id), now = Date.now(), killed = out.kills.map(k => k.b);
  realmOut = { id, f, out, gen };
  const rows = [0, 1, 2, 3].map(b => { const x = Realms.boss(id, f, b), dead = !killed.includes(b) && Realms.respawn(S, id, f, b, now), strong = out.strong.includes(b);
    return `<div class="rl-row" id="rlRow${b}"><b>${f}F · ${x.name}</b><em class="${dead || strong ? 'wait' : 'ready'}">${strong ? 'Too strong' : dead ? rlClock(dead - now) : 'Ready'}</em></div>`; }).join('');
  $('#main').innerHTML = `<section class="rl-run" style="--rlbg:url('${rlArt(id)}')">
   <div class="rl-top"><button data-back aria-label="Back" onclick="realmRunEnd(${gen})">‹</button><div class="rl-ribbon">${R.name} · ${f}F</div><button class="rl-skip" onclick="realmRunEnd(${gen})">${denPlain}Skip ›</button></div>
   <div class="rl-arena">
    <div class="rl-blist"><div class="rl-rage"><span>Rage <b id="rlRage">0</b></span><i><b id="rlRageBar"></b></i></div><h4>Boss List</h4>${rows}</div>
    <img class="rl-me" src="${reinaLookPath(false)}" alt="">
    <div class="rl-foe"><div class="rl-hp"><i id="rlHp"></i></div><img id="rlFoe" src="${artPath(Realms.boss(id, f, killed[0]).art)}" alt=""></div>
    <div class="rl-nums" id="rlNums"></div><div class="rl-obtain" id="rlObtain"></div>
    <div class="rl-auto">⚔&#xFE0E; Auto-fighting${out.merge > 1 ? ' · Merge ×' + out.merge : ''}</div>
    <div class="rl-banner" id="rlBanner"></div>
   </div></section>`;
  const power = stats().power, live = () => gen === realmFightGen && screen === 'realms';
  let i = 0, rage = 0;
  const fight = () => {
    if (!live()) return;
    if (i >= out.kills.length) {
      const bn = $('#rlBanner'); if (bn) { bn.textContent = rage >= 100 ? 'Rage is full · leaving the realm' : 'No more bosses ready · leaving'; bn.classList.add('on'); }
      return setTimeout(() => realmRunEnd(gen), 1700);
    }
    const k = out.kills[i], x = Realms.boss(id, f, k.b), row = $('#rlRow' + k.b), foe = $('#rlFoe'), hp = $('#rlHp'), nums = $('#rlNums');
    document.querySelectorAll('.rl-row').forEach(r => r.classList.remove('on')); row?.classList.add('on'); if (row) row.querySelector('em').textContent = 'Fighting'; if (row) row.querySelector('em').className = 'fight';
    if (foe) { foe.src = artPath(x.art); foe.classList.remove('gone'); } if (hp) hp.style.width = '100%';
    const t0 = Date.now(), dur = 1700;
    const hit = () => {
      if (!live()) return;
      const p = Math.min(1, (Date.now() - t0) / dur); if (hp) hp.style.width = (100 - p * 100) + '%';
      if (nums && Math.random() < .55) { const n = document.createElement('b'); n.textContent = fmt(Math.round(power * (.4 + Math.random() * .8))); n.style.left = 52 + Math.random() * 30 + '%'; n.style.top = 22 + Math.random() * 30 + '%'; nums.append(n); setTimeout(() => n.remove(), 900); foe?.classList.remove('hit'); void foe?.offsetWidth; foe?.classList.add('hit'); }
      if (p < 1) return setTimeout(hit, 140);
      foe?.classList.add('gone'); rage = Math.min(100, rage + Realms.rage); const rg = $('#rlRage'), rb = $('#rlRageBar'); if (rg) rg.textContent = rage; if (rb) rb.style.width = rage + '%';
      if (row) { const em = row.querySelector('em'); em.className = 'wait'; em.textContent = rlClock(Realms.respawnMs); row.classList.add('done'); }
      const ob = $('#rlObtain'); if (ob) { for (const l of rlLines(k.reward)) { const d = document.createElement('div'); d.className = 'rl-ob'; d.innerHTML = `Obtain ${l.icon}<b>${l.name}</b> ×${fmt(l.n)}${k.first ? ' <i>first ×2</i>' : ''}`; ob.prepend(d); } while (ob.children.length > 5) ob.lastChild.remove(); }
      i++; setTimeout(fight, 450);
    };
    setTimeout(hit, 250);
  };
  setTimeout(fight, 400);
}
function realmRunEnd(gen) {
  if (!realmOut || gen !== realmOut.gen) return; const { id, f, out } = realmOut; realmOut = null;
  if (out.cleared && realmFloor === f && f < Realms.floors) { realmFloor = f + 1; realmBoss = 0; }
  showRealm(id);
  resultShow({ title: out.cleared ? 'Floor cleared!' : 'Realm run done', kicker: `${Realms.get(id).name} · ${f}F · ${out.kills.length} ${out.kills.length === 1 ? 'boss' : 'bosses'} defeated${out.merge > 1 ? ' · Merge ×' + out.merge : ''}${out.cleared && f < Realms.floors ? ' · ' + (f + 1) + 'F opened' : ''}`,
    stars: Math.min(3, out.kills.length >= 4 ? 3 : out.kills.length >= 2 ? 2 : 1), win: true, body: `<div class="bag-gains">${rlGains(out.reward)}</div>`, buttons: [['Lovely', 'gold', '']] });
}

// Gameplay -> Material page: the realms as a compact grid that opens the realm room
function realmsList() {
  return `<div class="rl-mini">${Realms.list.map(r => `<button class="rl-card sm" style="--art:url('${rlArt(r.id)}')" onclick="rlPick('${r.id}');realmFrom='cityGameplay';go('realms')">${denPlain}<span class="rl-shade"></span><b>${r.name}</b><small>${r.gives}</small><i class="rl-left ${Realms.left(S, r.id) ? '' : 'none'}">${Realms.left(S, r.id)}</i></button>`).join('')}</div>`;
}
