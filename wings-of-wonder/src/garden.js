'use strict';
// Sky Garden (2026-11-27, user: "let's make a garden", then "do it your way"). Own design: six garden beds (three open,
// the rest for gold), eight seeds bought with gold that grow on the real clock, watering (5 free a UTC day) that cuts
// the time left, watering AI friends' gardens for a bonus, harvest -> gold / XP / materials / bag items, Garden EXP and
// chests for total harvests. All numbers are placeholders. Optional save field S.garden (Garden.valid).
const Garden = {
  beds: 6,
  openFree: 3,
  bedPrice: [0, 0, 0, 2000, 5000, 10000],
  waterDaily: 5,
  waterCut: 0.25,          // a watering takes 25% of the time left (at least 10 minutes), once per planting
  waterMin: 10 * 60e3,
  friendDaily: 5,          // friend gardens watered a day
  friendGift: { gold: 60, gexp: 5 },
  // seeds: id, name, minutes, price (gold), harvest
  seeds: [
    { id: 'sunpetal', name: 'Sunpetal', min: 30, price: 50, give: { gold: 180, xp: 20 }, gexp: 5 },
    { id: 'moonbell', name: 'Moonbell', min: 60, price: 90, give: { gold: 220, xp: 45, stone: 6 }, gexp: 8 },
    { id: 'dewleaf', name: 'Dewleaf', min: 120, price: 140, give: { xp: 80, stone: 15, items: { exp1: 1 } }, gexp: 12 },
    { id: 'starberry', name: 'Starberry', min: 180, price: 200, give: { gold: 300, gem: 2 }, gexp: 16 },
    { id: 'emberroot', name: 'Emberroot', min: 240, price: 260, give: { gold: 200, essence: 4, items: { shardbag: 1 } }, gexp: 20 },
    { id: 'lotus', name: 'Dream Lotus', min: 360, price: 380, give: { xp: 200, items: { sealbag: 1 } }, gexp: 28, rare: { petegg: 0.2 } },
    { id: 'wishblossom', name: 'Wishblossom', min: 480, price: 500, give: { gold: 200, items: { wish: 1 } }, gexp: 36, rare: { chest2: 0.25 } },
    { id: 'goldmelon', name: 'Goldmelon', min: 480, price: 450, give: { gold: 1600 }, gexp: 36, rare: { gold2: 0.3 } },
  ],
  // the shop shows a seed once the garden reaches its level (index 0..7 -> garden level)
  seedLevel: [1, 1, 2, 3, 4, 5, 6, 6],
  levelExp(lv) { return 60 * lv; },
  chests: [{ at: 5, id: 'chest1' }, { at: 15, id: 'chest2' }, { at: 30, id: 'chest2' }, { at: 60, id: 'chest3' }, { at: 100, id: 'chest3' }],
  // Farm (user: "a simple pretty farm where they open in turn: hens 1-6, then cows, then sheep"): animals are bought one
  // by one in this order; each brings its goods on its own clock, tap to collect. farm = [{k, at}] in buying order.
  animals: [
    { k: 'hen', name: 'Hen', good: 'Egg basket', min: 60, price: i => 500 * (i + 1), give: { gold: 80, xp: 15 }, gexp: 2 },
    { k: 'cow', name: 'Cow', good: 'Fresh milk', min: 180, price: i => 4000 + 1500 * i, give: { gold: 260, stone: 6, xp: 30 }, gexp: 5 },
    { k: 'sheep', name: 'Sheep', good: 'Soft wool', min: 360, price: i => 9000 + 3000 * i, give: { gold: 420, essence: 3, xp: 50 }, gexp: 8 },
  ],
  perKind: 6,
  nextAnimal(s) { const n = (Garden.state(s).farm || []).length; if (n >= Garden.animals.length * Garden.perKind) return null; const a = Garden.animals[Math.floor(n / Garden.perKind)], i = n % Garden.perKind; return { ...a, i, cost: a.price(i) }; },
  buyAnimal(s, now = Date.now()) { const v = Garden.state(s, now), a = Garden.nextAnimal(s); if (!a || s.gold < a.cost) return null; s.gold -= a.cost; v.farm.push({ k: a.k, at: now + a.min * 60e3 }); return a; },
  animal(k) { return Garden.animals.find(a => a.k === k); },
  collect(s, idx, now = Date.now()) {
    const v = Garden.state(s, now), f = v.farm[idx]; if (!f || now < f.at) return null; const a = Garden.animal(f.k);
    Garden.give(s, a.give); f.at = now + a.min * 60e3; v.exp += a.gexp; v.goods = (v.goods || 0) + 1; return a;
  },
  collectAll(s, now = Date.now()) { const v = Garden.state(s, now), sum = { gold: 0, xp: 0, stone: 0, essence: 0, n: 0 };
    v.farm.forEach((f, i) => { if (now >= f.at) { const a = Garden.collect(s, i, now); for (const k of ['gold', 'xp', 'stone', 'essence']) sum[k] += a.give[k] || 0; sum.n++; } }); return sum; },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  seed(id) { return Garden.seeds.find(x => x.id === id); },
  state(s, now = Date.now()) {
    const v = s.garden ??= {};
    v.open ??= Garden.openFree; v.plots ??= Array.from({ length: Garden.beds }, () => null); v.exp ??= 0; v.harvests ??= 0; v.got ??= []; v.farm ??= [];
    const d = Garden.day(now); if (!v.today || v.today.d !== d) v.today = { d, water: 0, friends: [] };
    return v;
  },
  level(s) { const v = Garden.state(s); let lv = 1, e = v.exp; while (e >= Garden.levelExp(lv)) { e -= Garden.levelExp(lv); lv++; } return { lv, exp: e, need: Garden.levelExp(lv) }; },
  unlocked(s, i) { return Garden.level(s).lv >= Garden.seedLevel[i]; },
  left(p, now = Date.now()) { return p ? Math.max(0, p.at - now) : 0; },
  ripe(p, now = Date.now()) { return !!p && now >= p.at; },
  buyBed(s) { const v = Garden.state(s), i = v.open, price = Garden.bedPrice[i]; if (i >= Garden.beds || s.gold < price) return false; s.gold -= price; v.open++; return true; },
  plant(s, bed, id, now = Date.now()) {
    const v = Garden.state(s, now), sd = Garden.seed(id), i = Garden.seeds.indexOf(sd);
    if (!sd || bed < 0 || bed >= v.open || v.plots[bed] || !Garden.unlocked(s, i) || s.gold < sd.price) return false;
    s.gold -= sd.price; v.plots[bed] = { seed: id, at: now + sd.min * 60e3, set: now }; return true;
  },
  water(s, bed, now = Date.now()) {
    const v = Garden.state(s, now), p = v.plots[bed];
    if (!p || p.w || Garden.ripe(p, now) || v.today.water >= Garden.waterDaily) return 0;
    const cut = Math.max(Garden.waterMin, Garden.left(p, now) * Garden.waterCut); p.at = Math.max(now, p.at - cut); p.w = 1; v.today.water++; return cut;
  },
  harvest(s, bed, now = Date.now(), rng = Math.random) {
    const v = Garden.state(s, now), p = v.plots[bed]; if (!Garden.ripe(p, now)) return null;
    const sd = Garden.seed(p.seed), out = { ...sd.give, items: { ...(sd.give.items || {}) } };
    for (const [id, ch] of Object.entries(sd.rare || {})) if (rng() < ch) out.items[id] = (out.items[id] || 0) + 1;
    Garden.give(s, out); v.plots[bed] = null; v.harvests++; v.exp += sd.gexp; return { seed: sd, ...out };
  },
  give(s, r) {
    s.gold += r.gold || 0;
    if (r.xp && globalThis.WonderProgress?.award) WonderProgress.award(s, r.xp);
    if ((r.stone || r.gem || r.essence) && globalThis.WonderGear?.state) { const eq = WonderGear.state(s); s.equipment = eq; for (const k of ['stone', 'gem', 'essence']) if (r[k]) eq.materials[k] = (eq.materials[k] || 0) + r[k]; }
    for (const [id, n] of Object.entries(r.items || {})) if (n && globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, id, n);
  },
  friendWater(s, id, now = Date.now()) {
    const v = Garden.state(s, now); if (v.today.friends.includes(id) || v.today.friends.length >= Garden.friendDaily) return null;
    v.today.friends.push(id); s.gold += Garden.friendGift.gold; v.exp += Garden.friendGift.gexp; return Garden.friendGift;
  },
  chestClaim(s, i) { const v = Garden.state(s), c = Garden.chests[i]; if (!c || v.got.includes(i) || v.harvests < c.at) return null; if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, c.id, 1); v.got.push(i); return c; },
  due(s, now = Date.now()) { const v = Garden.state(s, now); return v.farm.some(f => now >= f.at) || v.plots.some(p => Garden.ripe(p, now)) || Garden.chests.some((c, i) => v.harvests >= c.at && !v.got.includes(i)); },
  valid(v) {
    const int = n => Number.isSafeInteger(n) && n >= 0;
    return v === undefined || (!!v && typeof v === 'object' && (v.open === undefined || int(v.open) && v.open <= Garden.beds)
      && (v.plots === undefined || Array.isArray(v.plots) && v.plots.length === Garden.beds && v.plots.every(p => p === null || !!p && !!Garden.seed(p.seed) && int(p.at) && (p.set === undefined || int(p.set)) && (p.w === undefined || p.w === 1)))
      && (v.farm === undefined || Array.isArray(v.farm) && v.farm.length <= Garden.animals.length * Garden.perKind && v.farm.every((f, i) => !!f && f.k === Garden.animals[Math.floor(i / Garden.perKind)].k && int(f.at))) && (v.goods === undefined || int(v.goods))
      && (v.exp === undefined || int(v.exp)) && (v.harvests === undefined || int(v.harvests))
      && (v.got === undefined || Array.isArray(v.got) && v.got.every(i => int(i) && i < Garden.chests.length) && new Set(v.got).size === v.got.length)
      && (v.today === undefined || !!v.today && /^\d{4}-\d{2}-\d{2}$/.test(v.today.d) && int(v.today.water) && Array.isArray(v.today.friends) && v.today.friends.length <= Garden.friendDaily));
  },
};
globalThis.Garden = Garden;

// GARDEN_UI
let gardenTimer = 0, gardenPick = -1, gardenTab = 'beds';
const gdArt = n => artPath('garden-' + n);
const gdClock = ms => { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s / 60) % 60; return h ? h + 'h ' + String(m).padStart(2, '0') + 'm' : m + 'm ' + String(s % 60).padStart(2, '0') + 's'; };
function gdStage(p, now = Date.now()) {
  if (Garden.ripe(p, now)) return gdArt(p.seed);
  const t = 1 - Garden.left(p, now) / Math.max(1, p.at - (p.set || p.at - 1));
  return gdArt(t < .5 ? 'sprout' : 'young');
}
function gdBed(i, v, now) {
  if (i >= v.open) return `<button class="gd-bed locked" onclick="gardenBuyBed(${i})">${denPlain}<img class="gd-soil" src="${gdArt('plot')}" alt=""><span class="gd-lock">🔒<b>${i === v.open ? fmt(Garden.bedPrice[i]) + ' gold' : 'Locked'}</b></span></button>`;
  const p = v.plots[i];
  if (!p) return `<button class="gd-bed" onclick="gardenSeeds(${i})">${denPlain}<img class="gd-soil" src="${gdArt('plot')}" alt=""><span class="gd-plus">+</span><small class="gd-tag">Plant</small></button>`;
  const ripe = Garden.ripe(p, now), sd = Garden.seed(p.seed);
  return `<button class="gd-bed ${ripe ? 'ripe' : ''}" onclick="gardenTap(${i})">${denPlain}<img class="gd-soil" src="${gdArt('plot')}" alt=""><img class="gd-plant" src="${gdStage(p, now)}" alt="${sd.name}">${ripe ? '<small class="gd-tag ready">Harvest!</small>' : `<small class="gd-tag" data-left="${i}">${gdClock(Garden.left(p, now))}</small>${p.w ? '<i class="gd-wet">💧</i>' : ''}`}</button>`;
}
function showGarden() {
  clearInterval(gardenTimer);
  const v = Garden.state(S), now = Date.now(), L = Garden.level(S), chest = Garden.chests.find((c, i) => !v.got.includes(i));
  const ci = Garden.chests.indexOf(chest), chestReady = chest && v.harvests >= chest.at;
  $('#main').innerHTML = `<section class="gd-room ${gardenTab === 'farm' ? 'farm' : ''}" style="--gdbg:url('${gdArt(gardenTab === 'farm' ? 'farm-bg' : 'bg')}');--gdfence:url('${gdArt('farm-fence')}')">
   <div class="gd-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="gd-title"><b>Sky Garden</b><small>Garden Lv. ${L.lv} · <i style="--p:${Math.round(L.exp / L.need * 100)}%"></i> ${L.exp}/${L.need}</small></div><span class="gd-gold">${uiIcon('gold')}${fmt(S.gold)}</span></div>
   <div class="gd-tabs"><button class="${gardenTab === 'beds' ? 'on' : ''}" onclick="gardenTab='beds';showGarden()">${denPlain}🌱 Garden</button><button class="${gardenTab === 'farm' ? 'on' : ''}" onclick="gardenTab='farm';showGarden()">${denPlain}🐔 Farm${v.farm.some(f => now >= f.at) ? '<i></i>' : ''}</button></div>
   ${gardenTab === 'farm' ? gdFarm(v, now) : `<div class="gd-beds">${Array.from({ length: Garden.beds }, (_, i) => gdBed(i, v, now)).join('')}</div>`}
   <div class="gd-bar">
    <span class="gd-pill"><img src="${gdArt('can')}" alt="">Water <b>${Garden.waterDaily - v.today.water}/${Garden.waterDaily}</b></span>
    <button class="gd-btn" onclick="gardenFriends()">${denPlain}Friends' gardens <b>${v.today.friends.length}/${Garden.friendDaily}</b></button>
    ${chest ? `<button class="gd-btn ${chestReady ? 'due' : ''}" onclick="gardenChest(${ci})">${denPlain}${bagIcon(chest.id)}<span>${Math.min(v.harvests, chest.at)}/${chest.at}</span></button>` : ''}
    <button class="gd-help" onclick="gardenRules()">${denPlain}?</button>
   </div>
  </section>`;
  bagArtVars();
  gardenTimer = setInterval(() => {
    if (screen !== 'garden' || !document.querySelector('.gd-room')) { clearInterval(gardenTimer); return; }
    const v2 = Garden.state(S), t = Date.now(); let redo = false;
    document.querySelectorAll('[data-left]').forEach(el => { const p = v2.plots[+el.dataset.left]; if (!p || Garden.ripe(p, t)) redo = true; else el.textContent = gdClock(Garden.left(p, t)); });
    document.querySelectorAll('[data-farm]').forEach(el => { const f = v2.farm[+el.dataset.farm]; if (!f || t >= f.at) redo = true; else el.textContent = gdClock(f.at - t); });
    if (redo) showGarden();
  }, 1000);
}
function gardenSeeds(bed) {
  const L = Garden.level(S);
  popup(`<div class="gd-pop"><h2>Choose a seed</h2><p>It grows while you are away. Harvest when it is ripe.</p><div class="gd-seeds">${Garden.seeds.map((sd, i) => { const ok = Garden.unlocked(S, i), cash = S.gold >= sd.price;
    return `<button class="gd-seed ${ok ? '' : 'off'}" ${ok && cash ? `onclick="gardenPlant(${bed},'${sd.id}')"` : 'disabled'}>${denPlain}<img src="${gdArt(sd.id)}" alt=""><b>${sd.name}</b><small>${sd.min >= 60 ? sd.min / 60 + ' h' : sd.min + ' min'} · ${gdGive(sd)}</small><em>${ok ? uiIcon('gold') + fmt(sd.price) : 'Garden Lv. ' + Garden.seedLevel[i]}</em></button>`; }).join('')}</div><p class="gd-note">Garden Lv. ${L.lv}: harvests raise it and open new seeds.</p></div>`); $('#modal').classList.add('bw-pop');
}
function gdGive(sd) {
  const g = sd.give, out = [];
  if (g.gold) out.push(fmt(g.gold) + ' gold'); if (g.xp) out.push(g.xp + ' XP'); if (g.stone) out.push(g.stone + ' crystals'); if (g.gem) out.push(g.gem + ' gems'); if (g.essence) out.push(g.essence + ' essence');
  for (const id of Object.keys(g.items || {})) out.push(WonderGear.bagItemById[id].name);
  for (const id of Object.keys(sd.rare || {})) out.push('maybe ' + WonderGear.bagItemById[id].name);
  return out.join(', ');
}
function gardenPlant(bed, id) { if (!Garden.plant(S, bed, id)) { toast('Not enough gold'); return; } save(); wallet(); $('#modal').close(); showGarden(); toast(Garden.seed(id).name + ' planted'); }
function gardenTap(bed) {
  const v = Garden.state(S), p = v.plots[bed]; if (!p) return gardenSeeds(bed);
  if (Garden.ripe(p)) {
    const r = Garden.harvest(S, bed); if (!r) return; save(); wallet(); showGarden();
    resultShow({ title: 'Harvest!', kicker: r.seed.name, win: true, body: `<img class="gd-win" src="${gdArt(r.seed.id)}" alt=""><div class="bag-gains">${typeof chGains === 'function' ? chGains(r) : ''}</div>`, buttons: [['Lovely', 'gold', '']] });
    return;
  }
  const sd = Garden.seed(p.seed), canWater = !p.w && v.today.water < Garden.waterDaily;
  popup(`<div class="gd-pop"><div class="gd-head"><img src="${gdArt(sd.id)}" alt=""><div><h2>${sd.name}</h2><p>Ripe in <b>${gdClock(Garden.left(p))}</b></p><p>${gdGive(sd)}</p></div></div>
   <button class="gd-big" ${canWater ? '' : 'disabled'} onclick="gardenWater(${bed})">${denPlain}<img src="${gdArt('can')}" alt="">${p.w ? 'Already watered' : canWater ? 'Water (−25% time)' : 'No water left today'}</button></div>`); $('#modal').classList.add('bw-pop');
}
function gardenWater(bed) { const cut = Garden.water(S, bed); if (!cut) return; save(); $('#modal').close(); showGarden(); toast('Watered · ' + gdClock(cut) + ' sooner'); }
function gardenBuyBed(i) {
  const v = Garden.state(S); if (i !== v.open) { toast('Open the bed before it first'); return; }
  popup(`<div class="gd-pop"><h2>New garden bed</h2><p>Open bed ${i + 1} for <b>${fmt(Garden.bedPrice[i])}</b> gold?</p><button class="gd-big" onclick="gardenBedBuy()">${denPlain}${uiIcon('gold')} ${fmt(Garden.bedPrice[i])}</button></div>`); $('#modal').classList.add('bw-pop');
}
function gardenBedBuy() { if (!Garden.buyBed(S)) { toast('Not enough gold'); return; } save(); wallet(); $('#modal').close(); showGarden(); toast('New bed open'); }
function gardenFriends() {
  const v = Garden.state(S), friends = (WonderGear.socialState(S).friends || []).map(id => WonderGear.socialById[id]).filter(Boolean);
  popup(`<div class="gd-pop"><h2>Friends' gardens</h2><p>Water a friend's garden: <b>+${Garden.friendGift.gold} gold</b> and Garden EXP. ${v.today.friends.length}/${Garden.friendDaily} today. (All friends are AI.)</p>
   ${friends.length ? friends.map(f => { const done = v.today.friends.includes(f.id); return `<div class="gd-friend">${portrait(f.face, 'gd-face')}<span><b>${esc(f.name)}</b> <small>AI</small><small>${1 + (f.id.length * 7) % 5} beds growing</small></span><button class="gd-mini" ${done || v.today.friends.length >= Garden.friendDaily ? 'disabled' : ''} onclick="gardenFriendWater('${f.id}')">${denPlain}${done ? 'Watered ✓' : 'Water'}</button></div>`; }).join('') : '<p>Add friends in the Social room first.</p>'}</div>`); $('#modal').classList.add('bw-pop');
}
function gardenFriendWater(id) { if (!Garden.friendWater(S, id)) return; save(); wallet(); showGarden(); gardenFriends(); toast('+' + Garden.friendGift.gold + ' gold'); }
function gardenChest(i) {
  const v = Garden.state(S), c = Garden.chests[i];
  if (v.harvests >= c.at) { if (!Garden.chestClaim(S, i)) return; save(); showGarden(); resultShow({ title: 'Garden chest!', kicker: c.at + ' harvests', win: true, body: `<div class="bag-gains">${cloudItems({ [c.id]: 1 })}</div>`, buttons: [['Confirm', 'gold', '']] }); return; }
  popup(`<div class="gd-pop"><h2>Harvest chests</h2>${Garden.chests.map((x, j) => `<div class="gd-friend"><span class="gd-ci">${bagIcon(x.id)}</span><span><b>${x.at} harvests</b><small>${WonderGear.bagItemById[x.id].name}</small></span><em>${v.got.includes(j) ? '✓' : Math.min(v.harvests, x.at) + '/' + x.at}</em></div>`).join('')}</div>`); $('#modal').classList.add('bw-pop');
}
function gardenRules() {
  popup(`<div class="gd-pop"><h2>Sky Garden</h2><p>Tap an empty bed and plant a seed bought with gold. Seeds grow on the real clock, even while you play elsewhere or are away.</p><p>Water a growing plant once to make it ripen 25% sooner (at least 10 minutes). You have ${Garden.waterDaily} waterings a day; they refill at 00:00 UTC.</p><p>Harvest gives gold, XP, crystals, gems and bag items, and raises your Garden level, which opens new seeds. Every few harvests a chest waits for you.</p><p>Water up to ${Garden.friendDaily} friends' gardens a day for a small gift.</p></div>`); $('#modal').classList.add('bw-pop');
}

// Farm view: three pens (hens, cows, sheep), six places each, opened in order.
function gdFarm(v, now) {
  const next = Garden.nextAnimal(S), ready = v.farm.filter(f => now >= f.at).length;
  const pens = Garden.animals.map((a, ai) => {
    const base = ai * Garden.perKind, have = v.farm.slice(base, base + Garden.perKind), open = v.farm.length >= base;
    const slots = Array.from({ length: Garden.perKind }, (_, i) => {
      const idx = base + i, f = v.farm[idx];
      if (f) { const ok = now >= f.at; return `<button class="gd-ani ${ok ? 'ready' : ''}" onclick="gardenCollect(${idx})">${denPlain}<img class="gd-beast" src="${gdArt(a.k)}" alt="${a.name}" style="--d:${(idx * .37) % 2}s">${ok ? `<img class="gd-good" src="${gdArt(a.k === 'hen' ? 'egg' : a.k === 'cow' ? 'milk' : 'wool')}" alt="">` : `<small class="gd-tag" data-farm="${idx}">${gdClock(f.at - now)}</small>`}</button>`; }
      if (next && idx === v.farm.length) return `<button class="gd-ani buy" onclick="gardenBuyAnimal()">${denPlain}<img class="gd-beast ghost" src="${gdArt(a.k)}" alt=""><small class="gd-tag">+ ${fmt(next.cost)}</small></button>`;
      return `<span class="gd-ani empty"></span>`;
    }).join('');
    return `<div class="gd-pen ${open ? '' : 'shut'}"><div class="gd-pen-head"><b>${a.k === 'sheep' ? 'Sheep' : a.name + 's'}</b><small>${have.length}/${Garden.perKind} · ${a.good} every ${a.min >= 60 ? a.min / 60 + ' h' : a.min + ' min'}</small></div><div class="gd-pen-row">${slots}</div>${open ? '' : `<p class="gd-shut">🔒 Opens after 6 ${Garden.animals[ai - 1].name.toLowerCase()}s</p>`}</div>`;
  }).join('');
  return `<div class="gd-farm">${pens}${ready ? `<button class="gd-collect" onclick="gardenCollectAll()">${denPlain}Collect all · ${ready}</button>` : ''}</div>`;
}
function gardenBuyAnimal() {
  const a = Garden.nextAnimal(S); if (!a) return;
  popup(`<div class="gd-pop"><div class="gd-head"><img src="${gdArt(a.k)}" alt=""><div><h2>${a.name} ${a.i + 1}</h2><p>Brings <b>${a.good}</b> every ${a.min >= 60 ? a.min / 60 + ' h' : a.min + ' min'}: ${fmt(a.give.gold)} gold, ${a.give.xp} XP${a.give.stone ? ', ' + a.give.stone + ' crystals' : ''}${a.give.essence ? ', ' + a.give.essence + ' essence' : ''}.</p></div></div><button class="gd-big" ${S.gold < a.cost ? 'disabled' : ''} onclick="gardenAnimalBuy()">${denPlain}${uiIcon('gold')} ${fmt(a.cost)}</button></div>`); $('#modal').classList.add('bw-pop');
}
function gardenAnimalBuy() { const a = Garden.buyAnimal(S); if (!a) { toast('Not enough gold'); return; } save(); wallet(); $('#modal').close(); showGarden(); toast('Welcome, ' + a.name + ' ' + (a.i + 1) + '!'); }
function gardenCollect(idx) {
  const v = Garden.state(S), f = v.farm[idx], a = Garden.animal(f.k);
  if (Date.now() < f.at) { toast(a.name + ': ' + a.good + ' in ' + gdClock(f.at - Date.now())); return; }
  Garden.collect(S, idx); save(); wallet(); showGarden(); toast('+' + a.give.gold + ' gold · ' + a.good);
}
function gardenCollectAll() { const r = Garden.collectAll(S); if (!r.n) return; save(); wallet(); showGarden(); toast(r.n + ' goods collected · +' + fmt(r.gold) + ' gold'); }
