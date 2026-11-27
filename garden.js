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
  waterMin: 30e3,             // at least 30 s sooner
  friendDaily: 5,          // friend gardens watered a day
  friendGift: { gold: 60, gexp: 5 },
  // seeds: id, name, minutes, price (gold), harvest
  // feed crops (user: "carrot, potato ... wheat the simplest and fastest, for hens"): harvest goes to the barn as feed
  seeds: [
    { id: 'wheat', name: 'Wheat', min: 1, price: 10, give: { feed: { wheat: 3 } }, gexp: 1, lv: 1, regrow: true },   // planted once, grows again by itself (user)
    { id: 'carrot', name: 'Carrot', min: 5, price: 30, give: { feed: { carrot: 3 } }, gexp: 2, lv: 1 },
    { id: 'potato', name: 'Potato', min: 15, price: 50, give: { feed: { potato: 3 } }, gexp: 3, lv: 2 },
    { id: 'corn', name: 'Corn', min: 90, price: 80, give: { feed: { corn: 3 } }, gexp: 5, lv: 3 },
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
  feeds: [{ id: 'wheat', name: 'Wheat', eats: 'hen' }, { id: 'carrot', name: 'Carrot', eats: 'cow' }, { id: 'potato', name: 'Potato', eats: 'sheep' }, { id: 'corn', name: 'Corn', eats: 'pig' }],
  levelExp(lv) { return 60 * lv; },
  chests: [{ at: 5, id: 'chest1' }, { at: 15, id: 'chest2' }, { at: 30, id: 'chest2' }, { at: 60, id: 'chest3' }, { at: 100, id: 'chest3' }],
  // Farm (user: "a simple pretty farm where they open in turn: hens 1-6, then cows, then sheep"): animals are bought one
  // by one in this order; each brings its goods on its own clock, tap to collect. farm = [{k, at}] in buying order.
  animals: [
    { k: 'hen', prod: 'egg', eat: 'wheat', name: 'Hen', good: 'Egg basket', min: 60, price: i => 500 * (i + 1), give: { gold: 80, xp: 15 }, gexp: 2 },
    { k: 'cow', prod: 'milk', eat: 'carrot', name: 'Cow', good: 'Fresh milk', min: 180, price: i => 4000 + 1500 * i, give: { gold: 260, stone: 6, xp: 30 }, gexp: 5 },
    { k: 'sheep', prod: 'wool', eat: 'potato', name: 'Sheep', good: 'Soft wool', min: 360, price: i => 9000 + 3000 * i, give: { gold: 420, essence: 3, xp: 50 }, gexp: 8 },
    { k: 'pig', prod: 'truffle', eat: 'corn', name: 'Piglet', good: 'Truffle basket', min: 480, price: i => 16000 + 4000 * i, give: { gold: 650, gem: 2, xp: 70 }, gexp: 12 },
  ],
  perKind: 6,
  nextAnimal(s) { const n = (Garden.state(s).farm || []).length; if (n >= Garden.animals.length * Garden.perKind) return null; const a = Garden.animals[Math.floor(n / Garden.perKind)], i = n % Garden.perKind; return { ...a, i, cost: a.price(i) }; },
  buyAnimal(s, now = Date.now()) { const v = Garden.state(s, now), a = Garden.nextAnimal(s); if (!a || s.gold < a.cost) return null; s.gold -= a.cost; v.farm.push({ k: a.k, at: now + a.min * 60e3 }); return a; },
  animal(k) { return Garden.animals.find(a => a.k === k); },
  collect(s, idx, now = Date.now()) {
    const v = Garden.state(s, now), f = v.farm[idx]; if (!f || !f.at || now < f.at) return null; const a = Garden.animal(f.k);
    Garden.give(s, a.give); f.at = 0; v.exp += a.gexp; v.goods = (v.goods || 0) + 1; v.store[a.prod] = (v.store[a.prod] || 0) + 1; Garden.feed(s, idx, now); return a;
  },
  // an animal works only when fed: one portion of its food starts its clock; at = 0 means hungry
  hungry(f) { return !!f && !f.at; },
  feed(s, idx, now = Date.now()) {
    const v = Garden.state(s, now), f = v.farm[idx]; if (!Garden.hungry(f)) return false; const a = Garden.animal(f.k);
    if (!(v.feed[a.eat] > 0)) return false; v.feed[a.eat]--; f.at = now + a.min * 60e3; return true;
  },
  collectAll(s, now = Date.now()) { const v = Garden.state(s, now), sum = { gold: 0, xp: 0, stone: 0, essence: 0, n: 0 };
    v.farm.forEach((f, i) => { if (Garden.hungry(f)) Garden.feed(s, i, now); else if (now >= f.at) { const a = Garden.collect(s, i, now); for (const k of ['gold', 'xp', 'stone', 'essence']) sum[k] += a.give[k] || 0; sum.n++; } }); return sum; },
  // Workshops and orders (user: "like FarmVille: lots to craft so the player stays busy"). Crops (barn feed) and animal
  // goods (store) are made into products in workshops (a queue of 3 jobs each, one after another, collect when done);
  // the Order Board asks for mixes of goods and pays gold, Garden EXP and now and then prisms. Goods can also be sold.
  goods: {
    wheat: { name: 'Wheat', sell: 2 }, carrot: { name: 'Carrot', sell: 4 }, potato: { name: 'Potato', sell: 6 }, corn: { name: 'Corn', sell: 10 },
    egg: { name: 'Egg basket', sell: 20 }, milk: { name: 'Milk', sell: 45 }, wool: { name: 'Wool', sell: 80 }, truffle: { name: 'Truffles', sell: 140 },
    flour: { name: 'Flour', sell: 12 }, cornmeal: { name: 'Cornmeal', sell: 28 }, bread: { name: 'Bread', sell: 60 }, cake: { name: 'Carrot cake', sell: 110 },
    butter: { name: 'Butter', sell: 110 }, cheese: { name: 'Cheese', sell: 170 }, yarn: { name: 'Yarn', sell: 190 }, scarf: { name: 'Scarf', sell: 420 },
    pie: { name: 'Potato pie', sell: 200 }, soup: { name: 'Truffle soup', sell: 360 },
  },
  shopsList: [
    { id: 'mill', name: 'Mill', lv: 1, price: 800, recipes: [{ out: 'flour', min: 2, need: { wheat: 3 } }, { out: 'cornmeal', min: 6, need: { corn: 2 } }] },
    { id: 'bakery', name: 'Bakery', lv: 2, price: 2500, recipes: [{ out: 'bread', min: 8, need: { flour: 2, egg: 1 } }, { out: 'cake', min: 20, need: { flour: 1, carrot: 2, egg: 2 } }] },
    { id: 'dairy', name: 'Dairy', lv: 3, price: 5000, recipes: [{ out: 'butter', min: 10, need: { milk: 2 } }, { out: 'cheese', min: 25, need: { milk: 3 } }] },
    { id: 'loom', name: 'Weaver', lv: 4, price: 8000, recipes: [{ out: 'yarn', min: 15, need: { wool: 2 } }, { out: 'scarf', min: 40, need: { yarn: 2 } }] },
    { id: 'kitchen', name: 'Kitchen', lv: 5, price: 12000, recipes: [{ out: 'pie', min: 30, need: { potato: 3, flour: 1, butter: 1 } }, { out: 'soup', min: 45, need: { truffle: 1, potato: 2, milk: 1 } }] },
  ],
  queue: 3, orderSlots: 6, orderWait: 2 * 60e3,
  have(s, id) { const v = Garden.state(s); return Garden.feeds.some(f => f.id === id) ? v.feed[id] || 0 : v.store[id] || 0; },
  take(s, id, n) { const v = Garden.state(s), box = Garden.feeds.some(f => f.id === id) ? v.feed : v.store; box[id] = (box[id] || 0) - n; },
  put(s, id, n) { const v = Garden.state(s), box = Garden.feeds.some(f => f.id === id) ? v.feed : v.store; box[id] = (box[id] || 0) + n; },
  shop(id) { return Garden.shopsList.find(x => x.id === id); },
  buyShop(s, id) { const v = Garden.state(s), w = Garden.shop(id); if (!w || v.shops[id] || Garden.level(s).lv < w.lv || s.gold < w.price) return false; s.gold -= w.price; v.shops[id] = { jobs: [] }; return true; },
  // jobs run one after another: a new job starts when the last one in the queue ends (or now)
  make(s, id, r, now = Date.now()) {
    const v = Garden.state(s, now), w = Garden.shop(id), q = v.shops[id], rc = w?.recipes[r];
    if (!q || !rc || q.jobs.length >= Garden.queue || Object.entries(rc.need).some(([k, n]) => Garden.have(s, k) < n)) return false;
    for (const [k, n] of Object.entries(rc.need)) Garden.take(s, k, n);
    const start = Math.max(now, ...q.jobs.map(j => j.at)); q.jobs.push({ r, at: start + rc.min * 60e3 }); return true;
  },
  collectShop(s, id, now = Date.now()) {
    const v = Garden.state(s, now), w = Garden.shop(id), q = v.shops[id]; if (!q) return [];
    const done = q.jobs.filter(j => now >= j.at); q.jobs = q.jobs.filter(j => now < j.at);
    for (const j of done) { Garden.put(s, w.recipes[j.r].out, 1); v.exp += 2; } return done.map(j => w.recipes[j.r].out);
  },
  sell(s, id, n = 1) { const g = Garden.goods[id]; n = Math.min(n, Garden.have(s, id)); if (!g || n < 1) return 0; Garden.take(s, id, n); s.gold += g.sell * n; return g.sell * n; },
  // the goods she can make or grow now decide what orders ask for
  known(s) {
    const v = Garden.state(s), L = Garden.level(s).lv, ids = new Set();
    Garden.seeds.forEach((sd, i) => { if (sd.give.feed && L >= Garden.seedLv(i)) Object.keys(sd.give.feed).forEach(k => ids.add(k)); });
    for (const f of v.farm) ids.add(Garden.animal(f.k).prod);
    for (const w of Garden.shopsList) if (v.shops[w.id]) w.recipes.forEach(rc => { if (Object.keys(rc.need).every(k => ids.has(k) || Garden.goods[k])) ids.add(rc.out); });
    return [...ids].filter(id => Garden.goods[id]);
  },
  newOrder(s, n, now = Date.now()) {
    const ids = Garden.known(s); let h = (n * 2654435761) >>> 0; const rnd = () => (h = (h * 1103515245 + 12345) >>> 0) / 4294967296;
    const kinds = 1 + Math.floor(rnd() * Math.min(3, ids.length)), need = {}, pool = [...ids];
    for (let i = 0; i < kinds && pool.length; i++) { const id = pool.splice(Math.floor(rnd() * pool.length), 1)[0]; const cheap = Garden.goods[id].sell < 30; need[id] = cheap ? 3 + Math.floor(rnd() * 6) : 1 + Math.floor(rnd() * 3); }
    const worth = Object.entries(need).reduce((a, [k, c]) => a + Garden.goods[k].sell * c, 0);
    return { need, gold: Math.round(worth * 1.6 + 40), gexp: 4 + Math.round(worth / 40), prisms: n % 5 === 4 ? 10 : 0, at: now };
  },
  board(s, now = Date.now()) {
    const v = Garden.state(s, now);
    while (v.orders.length < Garden.orderSlots) v.orders.push(Garden.newOrder(s, v.oseq++, now));
    return v.orders;
  },
  deliver(s, i, now = Date.now()) {
    const v = Garden.state(s, now), o = Garden.board(s, now)[i]; if (!o || now < o.at || Object.entries(o.need).some(([k, n]) => Garden.have(s, k) < n)) return null;
    for (const [k, n] of Object.entries(o.need)) Garden.take(s, k, n);
    s.gold += o.gold; s.scales = (s.scales || 0) + o.prisms; v.exp += o.gexp; v.odone++;
    v.orders[i] = { ...Garden.newOrder(s, v.oseq++, now), at: now + Garden.orderWait }; return o;
  },
  skipOrder(s, i, now = Date.now()) { const v = Garden.state(s, now); Garden.board(s, now); if (!v.orders[i] || now < v.orders[i].at) return false; v.orders[i] = { ...Garden.newOrder(s, v.oseq++, now), at: now + Garden.orderWait }; return true; },
  canDeliver(s, o, now = Date.now()) { return now >= o.at && Object.entries(o.need).every(([k, n]) => Garden.have(s, k) >= n); },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  seed(id) { return Garden.seeds.find(x => x.id === id); },
  state(s, now = Date.now()) {
    const v = s.garden ??= {};
    v.open ??= Garden.openFree; v.plots ??= Array.from({ length: Garden.beds }, () => null); v.exp ??= 0; v.harvests ??= 0; v.got ??= []; v.farm ??= []; v.feed ??= {}; v.store ??= {}; v.shops ??= {}; v.orders ??= []; v.oseq ??= 0; v.odone ??= 0;
    const d = Garden.day(now); if (!v.today || v.today.d !== d) v.today = { d, water: 0, friends: [] };
    return v;
  },
  level(s) { const v = Garden.state(s); let lv = 1, e = v.exp; while (e >= Garden.levelExp(lv)) { e -= Garden.levelExp(lv); lv++; } return { lv, exp: e, need: Garden.levelExp(lv) }; },
  seedLv(i) { const sd = Garden.seeds[i]; return sd.lv ?? Garden.seedLevel[i - Garden.feeds.length]; },
  unlocked(s, i) { return Garden.level(s).lv >= Garden.seedLv(i); },
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
    Garden.give(s, out); v.plots[bed] = sd.regrow ? { seed: sd.id, at: now + sd.min * 60e3, set: now } : null; v.harvests++; v.exp += sd.gexp; return { seed: sd, ...out };
  },
  give(s, r) {
    s.gold += r.gold || 0;
    if (r.feed) { const v = Garden.state(s); for (const [k, n] of Object.entries(r.feed)) v.feed[k] = (v.feed[k] || 0) + n; }
    if (r.xp && globalThis.WonderProgress?.award) WonderProgress.award(s, r.xp);
    if ((r.stone || r.gem || r.essence) && globalThis.WonderGear?.state) { const eq = WonderGear.state(s); s.equipment = eq; for (const k of ['stone', 'gem', 'essence']) if (r[k]) eq.materials[k] = (eq.materials[k] || 0) + r[k]; }
    for (const [id, n] of Object.entries(r.items || {})) if (n && globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, id, n);
  },
  friendWater(s, id, now = Date.now()) {
    const v = Garden.state(s, now); if (v.today.friends.includes(id) || v.today.friends.length >= Garden.friendDaily) return null;
    v.today.friends.push(id); s.gold += Garden.friendGift.gold; v.exp += Garden.friendGift.gexp; return Garden.friendGift;
  },
  chestClaim(s, i) { const v = Garden.state(s), c = Garden.chests[i]; if (!c || v.got.includes(i) || v.harvests < c.at) return null; if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, c.id, 1); v.got.push(i); return c; },
  due(s, now = Date.now()) { const v = Garden.state(s, now); return v.farm.some(f => f.at ? now >= f.at : v.feed[Garden.animal(f.k).eat] > 0) || Object.values(v.shops).some(q => q.jobs.some(j => now >= j.at)) || v.orders.some(o => Garden.canDeliver(s, o, now)) || v.plots.some(p => Garden.ripe(p, now)) || Garden.chests.some((c, i) => v.harvests >= c.at && !v.got.includes(i)); },
  valid(v) {
    const int = n => Number.isSafeInteger(n) && n >= 0;
    return v === undefined || (!!v && typeof v === 'object' && (v.open === undefined || int(v.open) && v.open <= Garden.beds)
      && (v.plots === undefined || Array.isArray(v.plots) && v.plots.length === Garden.beds && v.plots.every(p => p === null || !!p && !!Garden.seed(p.seed) && int(p.at) && (p.set === undefined || int(p.set)) && (p.w === undefined || p.w === 1)))
      && (v.farm === undefined || Array.isArray(v.farm) && v.farm.length <= Garden.animals.length * Garden.perKind && v.farm.every((f, i) => !!f && f.k === Garden.animals[Math.floor(i / Garden.perKind)].k && int(f.at))) && (v.goods === undefined || int(v.goods))
      && (v.store === undefined || !!v.store && typeof v.store === 'object' && Object.entries(v.store).every(([k, n]) => !!Garden.goods[k] && int(n)))
      && (v.shops === undefined || !!v.shops && typeof v.shops === 'object' && Object.entries(v.shops).every(([k, q]) => !!Garden.shop(k) && !!q && Array.isArray(q.jobs) && q.jobs.length <= Garden.queue && q.jobs.every(j => int(j.r) && j.r < Garden.shop(k).recipes.length && int(j.at))))
      && (v.orders === undefined || Array.isArray(v.orders) && v.orders.length <= Garden.orderSlots && v.orders.every(o => !!o && !!o.need && Object.entries(o.need).every(([k, n]) => !!Garden.goods[k] && int(n)) && int(o.gold) && int(o.gexp) && int(o.prisms) && int(o.at)))
      && (v.oseq === undefined || int(v.oseq)) && (v.odone === undefined || int(v.odone))
      && (v.feed === undefined || !!v.feed && typeof v.feed === 'object' && Object.entries(v.feed).every(([k, n]) => Garden.feeds.some(x => x.id === k) && int(n)))
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
  clearInterval(gardenTimer); const keep = document.querySelector('.gd-farmscroll,.gd-workscroll')?.scrollTop;
  const v = Garden.state(S), now = Date.now(), L = Garden.level(S), chest = Garden.chests.find((c, i) => !v.got.includes(i));
  const ci = Garden.chests.indexOf(chest), chestReady = chest && v.harvests >= chest.at;
  $('#main').innerHTML = `<section class="gd-room ${gardenTab === 'farm' ? 'farm' : ''} ${gardenTab === 'work' || gardenTab === 'orders' ? 'work' : ''}" style="--gdbg:url('${gdArt(gardenTab === 'farm' ? 'farm-bg' : gardenTab === 'work' || gardenTab === 'orders' ? 'work-bg' : 'bg')}');--gdfence:url('${gdArt('farm-fence')}')">
   <div class="gd-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="gd-title"><b>Sky Garden</b><small>Garden Lv. ${L.lv} · <i style="--p:${Math.round(L.exp / L.need * 100)}%"></i> ${L.exp}/${L.need}</small></div><span class="gd-gold">${uiIcon('gold')}${fmt(S.gold)}</span></div>
   <div class="gd-tabs"><button class="${gardenTab === 'beds' ? 'on' : ''}" onclick="gardenTab='beds';showGarden()">${denPlain}🌱 Garden</button><button class="${gardenTab === 'farm' ? 'on' : ''}" onclick="gardenTab='farm';showGarden()">${denPlain}🐔 Farm${v.farm.some(f => now >= f.at) ? '<i></i>' : ''}</button><button class="${gardenTab === 'work' ? 'on' : ''}" onclick="gardenTab='work';showGarden()">${denPlain}🛠 Workshop${Object.values(v.shops).some(q => q.jobs.some(j => now >= j.at)) ? '<i></i>' : ''}</button><button class="${gardenTab === 'orders' ? 'on' : ''}" onclick="gardenTab='orders';showGarden()">${denPlain}📜 Orders${Garden.board(S, now).some(o => Garden.canDeliver(S, o, now)) ? '<i></i>' : ''}</button></div>
   ${gardenTab === 'work' ? gdWork(v, now) : gardenTab === 'orders' ? gdOrders(v, now) : gardenTab === 'farm' ? gdFarm(v, now) : `<div class="gd-beds">${Array.from({ length: Garden.beds }, (_, i) => gdBed(i, v, now)).join('')}</div>`}
   <div class="gd-bar">
    <span class="gd-pill"><img src="${gdArt('can')}" alt="">Water <b>${Garden.waterDaily - v.today.water}/${Garden.waterDaily}</b></span>
    <button class="gd-btn" onclick="gardenFriends()">${denPlain}Friends' gardens <b>${v.today.friends.length}/${Garden.friendDaily}</b></button>
    ${chest ? `<button class="gd-btn ${chestReady ? 'due' : ''}" onclick="gardenChest(${ci})">${denPlain}${bagIcon(chest.id)}<span>${Math.min(v.harvests, chest.at)}/${chest.at}</span></button>` : ''}
    <button class="gd-help" onclick="gardenRules()">${denPlain}?</button>
   </div>
  </section>`;
  bagArtVars(); if (keep != null) { const sc = document.querySelector('.gd-farmscroll,.gd-workscroll'); if (sc) sc.scrollTop = keep; }
  gardenTimer = setInterval(() => {
    if (screen !== 'garden' || !document.querySelector('.gd-room')) { clearInterval(gardenTimer); return; }
    const v2 = Garden.state(S), t = Date.now(); let redo = false;
    document.querySelectorAll('[data-left]').forEach(el => { const p = v2.plots[+el.dataset.left]; if (!p || Garden.ripe(p, t)) redo = true; else el.textContent = gdClock(Garden.left(p, t)); });
    document.querySelectorAll('[data-job]').forEach(el => { const ms = +el.dataset.job - t; if (ms <= 0) redo = true; else el.textContent = gdClock(ms); });
    document.querySelectorAll('[data-farm]').forEach(el => { const f = v2.farm[+el.dataset.farm]; if (!f || t >= f.at) redo = true; else el.textContent = gdClock(f.at - t); });
    if (redo) showGarden();
  }, 1000);
}
function gardenSeeds(bed) {
  const L = Garden.level(S);
  popup(`<div class="gd-pop"><h2>Choose a seed</h2><p>It grows while you are away. Harvest when it is ripe.</p><div class="gd-seeds">${Garden.seeds.map((sd, i) => { const ok = Garden.unlocked(S, i), cash = S.gold >= sd.price;
    return `<button class="gd-seed ${ok ? '' : 'off'} ${sd.regrow ? 'regrow' : ''}" ${ok && cash ? `onclick="gardenPlant(${bed},'${sd.id}')"` : 'disabled'}>${denPlain}<img src="${gdArt(sd.id)}" alt=""><b>${sd.name}${sd.regrow ? ' <i class="gd-again">♻ plant once</i>' : ''}</b><small>${sd.min >= 60 ? sd.min / 60 + ' h' : sd.min + ' min'}${sd.regrow ? ', again and again' : ''} · ${gdGive(sd)}</small><em>${ok ? uiIcon('gold') + fmt(sd.price) : 'Garden Lv. ' + Garden.seedLv(i)}</em></button>`; }).join('')}</div><p class="gd-note">Garden Lv. ${L.lv}: harvests raise it and open new seeds.</p></div>`); $('#modal').classList.add('bw-pop');
}
function gdGive(sd) {
  const g = sd.give, out = [];
  for (const [k, n] of Object.entries(g.feed || {})) { const an = Garden.animal(Garden.feeds.find(x => x.id === k).eats); out.push(n + ' ' + k + ' (feed for ' + (an.k === 'sheep' ? 'sheep' : an.name.toLowerCase() + 's') + ')'); }
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
    resultShow({ title: 'Harvest!', kicker: r.seed.name, win: true, body: `<img class="gd-win" src="${gdArt(r.seed.id)}" alt=""><div class="bag-gains">${gdFeedTiles(r.feed)}${typeof chGains === 'function' ? chGains(r) : ''}</div>`, buttons: [['Lovely', 'gold', '']] });
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
  popup(`<div class="gd-pop"><h2>Sky Garden</h2><p>Tap an empty bed and plant a seed bought with gold. Wheat is planted once and grows again by itself every minute. Seeds grow on the real clock, even while you play elsewhere or are away.</p><p>Water a growing plant once to make it ripen 25% sooner (at least 10 minutes). You have ${Garden.waterDaily} waterings a day; they refill at 00:00 UTC.</p><p>Harvest gives gold, XP, crystals, gems and bag items, and raises your Garden level, which opens new seeds. Every few harvests a chest waits for you.</p><p>Water up to ${Garden.friendDaily} friends' gardens a day for a small gift.</p><p>Animals' goods go to the barn. Build workshops (Mill, Bakery, Dairy, Weaver, Kitchen) and turn crops and goods into products, three jobs in a row each. The Order Board asks for goods and pays gold and Garden EXP; every 5th order pays prisms. Anything can be sold in the barn.</p></div>`); $('#modal').classList.add('bw-pop');
}

// Farm view: pens on the painted terraces of a tall map that scrolls (user: "not all on one page, let it scroll").
const GD_PENS = [[17.5, 13], [31.5, 14], [47.5, 15], [64.5, 17]];
// Farm view: three pens (hens, cows, sheep), six places each, opened in order.
function gdFarm(v, now) {
  const next = Garden.nextAnimal(S), ready = v.farm.filter(f => f.at ? now >= f.at : v.feed[Garden.animal(f.k).eat] > 0).length;
  const pens = Garden.animals.map((a, ai) => {
    const base = ai * Garden.perKind, have = v.farm.slice(base, base + Garden.perKind), open = v.farm.length >= base;
    const slots = Array.from({ length: Garden.perKind }, (_, i) => {
      const idx = base + i, f = v.farm[idx];
      if (f && Garden.hungry(f)) { const has = v.feed[a.eat] > 0; return `<button class="gd-ani hungry" onclick="gardenFeed(${idx})">${denPlain}<img class="gd-good" src="${gdArt('i-' + a.eat)}" alt=""><img class="gd-beast" src="${gdArt(a.k)}" alt="${a.name}" style="--d:${(idx * .37) % 2}s"><small class="gd-tag ${has ? 'feed' : 'need'}">${has ? 'Feed' : 'Hungry'}</small></button>`; }
      if (f) { const ok = now >= f.at; return `<button class="gd-ani ${ok ? 'ready' : ''}" onclick="gardenCollect(${idx})">${denPlain}<img class="gd-beast" src="${gdArt(a.k)}" alt="${a.name}" style="--d:${(idx * .37) % 2}s">${ok ? `<img class="gd-good" src="${gdArt({ hen: 'egg', cow: 'milk', sheep: 'wool', pig: 'truffle' }[a.k])}" alt="">` : `<small class="gd-tag" data-farm="${idx}">${gdClock(f.at - now)}</small>`}</button>`; }
      if (next && idx === v.farm.length) return `<button class="gd-ani buy" onclick="gardenBuyAnimal()">${denPlain}<img class="gd-beast ghost" src="${gdArt(a.k)}" alt=""><small class="gd-tag">+ ${fmt(next.cost)}</small></button>`;
      return `<span class="gd-ani empty"></span>`;
    }).join('');
    return `<div class="gd-pen ${open ? '' : 'shut'}" style="top:${GD_PENS[ai][0]}%;height:${GD_PENS[ai][1]}%"><div class="gd-pen-head"><b>${a.k === 'sheep' ? 'Sheep' : a.name + 's'}</b><small>${have.length}/${Garden.perKind} · eats ${a.eat} · ${a.good} every ${a.min >= 60 ? a.min / 60 + ' h' : a.min + ' min'}</small></div><div class="gd-pen-row">${slots}</div>${open ? '' : `<p class="gd-shut">🔒 Opens after 6 ${Garden.animals[ai - 1].k === 'sheep' ? 'sheep' : Garden.animals[ai - 1].name.toLowerCase() + 's'}</p>`}</div>`;
  }).join('');
  const barn = `<div class="gd-barn">${Garden.feeds.map(x => `<button class="gd-feedchip" onclick="gardenTab='beds';showGarden()" title="Grow ${x.name} in the Garden">${denPlain}<img src="${gdArt('i-' + x.id)}" alt="">${v.feed[x.id] || 0}</button>`).join('')}</div>`;
  return `${barn}<div class="gd-farmwrap"><div class="gd-farmscroll"><div class="gd-farmmap" style="--gdfarm:url('${gdArt('farm-bg')}')">${pens}</div></div>${ready ? `<button class="gd-collect" onclick="gardenCollectAll()">${denPlain}Collect all · ${ready}</button>` : ''}</div>`;
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
function gardenCollectAll() { const r = Garden.collectAll(S); save(); wallet(); showGarden(); toast(r.n ? r.n + ' goods collected · +' + fmt(r.gold) + ' gold' : 'Animals fed'); }

function gdFeedTiles(feed) { return Object.entries(feed || {}).map(([k, n]) => `<span class="bag-gain" style="--rarity:#e8b84a"><img class="bag-ico" src="${gdArt('i-' + k)}" alt=""><b>+${n}</b><small>${Garden.feeds.find(x => x.id === k).name}</small></span>`).join(''); }
function gardenFeed(idx) {
  const v = Garden.state(S), f = v.farm[idx], a = Garden.animal(f.k);
  if (!Garden.feed(S, idx)) { toast('No ' + a.eat + ' in the barn: grow it in the Garden'); return; }
  save(); showGarden(); toast(a.name + ' fed · ' + a.good + ' in ' + gdClock(a.min * 60e3));
}

// Workshop and Order Board views
const gdGood = id => gdArt({ wheat: 'i-wheat', carrot: 'i-carrot', potato: 'i-potato', corn: 'i-corn' }[id] || id);
function gdNeed(need) { return Object.entries(need).map(([k, n]) => { const h = Garden.have(S, k); return `<span class="gd-need ${h >= n ? 'ok' : ''}" title="${Garden.goods[k].name}"><img src="${gdGood(k)}" alt="">${h}/${n}</span>`; }).join(''); }
function gdStoreStrip(v) {
  const ids = Object.keys(Garden.goods).filter(k => Garden.have(S, k) > 0);
  return `<div class="gd-store"><button class="gd-btn" onclick="gardenBarn()">${denPlain}🏠 Barn · sell</button>${ids.map(k => `<span class="gd-chip"><img src="${gdGood(k)}" alt="">${Garden.have(S, k)}</span>`).join('')}</div>`;
}
function gdWork(v, now) {
  const L = Garden.level(S).lv;
  const cards = Garden.shopsList.map(w => {
    const q = v.shops[w.id];
    if (!q) return `<div class="gd-shop locked"><img class="gd-house" src="${gdArt(w.id)}" alt=""><div class="gd-shop-body"><b>${w.name}</b>${L < w.lv ? `<p>Opens at Garden Lv. ${w.lv}</p>` : `<button class="gd-mini2" onclick="gardenShopBuy('${w.id}')">${denPlain}Build · ${fmt(w.price)} gold</button>`}<div class="gd-recipes">${w.recipes.map(rc => `<span class="gd-rc-peek"><img src="${gdGood(rc.out)}" alt="">${Garden.goods[rc.out].name}</span>`).join('')}</div></div></div>`;
    const slots = Array.from({ length: Garden.queue }, (_, i) => { const j = q.jobs[i]; if (!j) return '<span class="gd-slot"></span>'; const ok = now >= j.at, out = w.recipes[j.r].out; return `<button class="gd-slot ${ok ? 'ready' : ''}" onclick="gardenShopCollect('${w.id}')">${denPlain}<img src="${gdGood(out)}" alt="">${ok ? '<small>Collect</small>' : `<small data-job="${j.at}">${gdClock(j.at - now)}</small>`}</button>`; }).join('');
    const recs = w.recipes.map((rc, r) => { const can = q.jobs.length < Garden.queue && Object.entries(rc.need).every(([k, n]) => Garden.have(S, k) >= n);
      return `<div class="gd-rc"><img class="gd-out" src="${gdGood(rc.out)}" alt=""><div><b>${Garden.goods[rc.out].name}</b><small>${rc.min} min</small><div class="gd-needs">${gdNeed(rc.need)}</div></div><button class="gd-mini2" ${can ? '' : 'disabled'} onclick="gardenMake('${w.id}',${r})">${denPlain}Make</button></div>`; }).join('');
    return `<div class="gd-shop"><img class="gd-house" src="${gdArt(w.id)}" alt=""><div class="gd-shop-body"><b>${w.name}</b><div class="gd-slots">${slots}</div><div class="gd-recipes">${recs}</div></div></div>`;
  }).join('');
  return `${gdStoreStrip(v)}<div class="gd-workscroll">${cards}</div>`;
}
function gdOrders(v, now) {
  const board = Garden.board(S, now);
  const cards = board.map((o, i) => {
    if (now < o.at) return `<div class="gd-order wait"><img src="${gdArt('board')}" alt=""><small>New order in</small><b data-job="${o.at}">${gdClock(o.at - now)}</b></div>`;
    const ok = Garden.canDeliver(S, o, now);
    return `<div class="gd-order ${ok ? 'ready' : ''}"><div class="gd-needs">${gdNeed(o.need)}</div><div class="gd-pay"><span>${uiIcon('gold')}${fmt(o.gold)}</span><span>🌱 +${o.gexp}</span>${o.prisms ? `<span><img src="${artPath('ui-prism')}" alt="">${o.prisms}</span>` : ''}</div><div class="gd-obtns"><button class="gd-mini2" ${ok ? '' : 'disabled'} onclick="gardenDeliver(${i})">${denPlain}Deliver</button><button class="gd-skip" onclick="gardenSkipOrder(${i})" title="Swap for another order">${denPlain}↻</button></div></div>`;
  }).join('');
  return `${gdStoreStrip(v)}<div class="gd-workscroll"><p class="gd-ohead">Order Board · ${v.odone} delivered · every 5th order pays prisms</p><div class="gd-orders">${cards}</div></div>`;
}
function gardenShopBuy(id) { if (!Garden.buyShop(S, id)) { toast('Not enough gold'); return; } save(); wallet(); showGarden(); toast(Garden.shop(id).name + ' built!'); }
function gardenMake(id, r) { if (!Garden.make(S, id, r)) { toast('Not enough goods'); return; } save(); showGarden(); toast(Garden.goods[Garden.shop(id).recipes[r].out].name + ' started'); }
function gardenShopCollect(id) { const out = Garden.collectShop(S, id); if (!out.length) { toast('Still working…'); return; } save(); showGarden(); toast('+' + out.map(k => Garden.goods[k].name).join(', ')); }
function gardenDeliver(i) { const o = Garden.deliver(S, i); if (!o) return; save(); wallet(); showGarden(); resultShow({ title: 'Order delivered!', kicker: 'Order Board', win: true, body: `<div class="bag-gains">${chGains({ gold: o.gold, prisms: o.prisms })}</div><p class="wr-note">+${o.gexp} Garden EXP</p>`, buttons: [['Lovely', 'gold', '']] }); }
function gardenSkipOrder(i) { if (Garden.skipOrder(S, i)) { save(); showGarden(); } }
function gardenBarn() {
  const ids = Object.keys(Garden.goods).filter(k => Garden.have(S, k) > 0);
  popup(`<div class="gd-pop"><h2>Barn</h2><p>Everything you have grown, collected and made. Sell what you do not need.</p>${ids.length ? ids.map(k => `<div class="gd-friend"><span class="gd-ci"><img src="${gdGood(k)}" alt="" style="width:40px;height:40px;object-fit:contain"></span><span><b>${Garden.goods[k].name}</b><small>×${Garden.have(S, k)} · ${Garden.goods[k].sell} gold each</small></span><button class="gd-mini" onclick="gardenSell('${k}',1)">${denPlain}Sell 1</button><button class="gd-mini" onclick="gardenSell('${k}',${Garden.have(S, k)})">${denPlain}All</button></div>`).join('') : '<p>The barn is empty.</p>'}</div>`); $('#modal').classList.add('bw-pop');
}
function gardenSell(id, n) { const g = Garden.sell(S, id, n); if (!g) return; save(); wallet(); showGarden(); gardenBarn(); toast('+' + g + ' gold'); }
