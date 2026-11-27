'use strict';
// Prism Bazaar: the top-up store (2026-11-27, user photos of the reference's Top-up / Daily Pack / MegaPack tabs).
// Own names and art. Real money buys PRISMS only (premium); every prism pack also gifts Moon Pearls, the middle
// currency (x`pearlsPerPrism`, like the reference's blue diamonds). Moon Pearls are also earned in play (Wayfarer
// tasks, dungeon guardians) and spent on the last realm's entries and on rite tickets (`pearlTicket` pearls a ticket).
// Gacha tickets are never sold for money directly (MONETIZATION RULE): packs carry them only as a bonus.
// Real payment is NOT connected: price buttons open an info card; `Topup.grant` is ready for the day it is.
// Optional save fields: S.pearls (number), S.topup {week, bought{id:n}, first[], rebate} (`Topup.valid`).
// Bazaar Coupons (a prepaid balance like the reference's Universal Ticket) were built and removed the same day (user:
// "we do not need them"); `S.coupons` and `topup.spent` still validate for saves from that build.
// All numbers are placeholders.
const Topup = {
  pearlsPerPrism: 100, pearlTicket: 100, guardianPearls: 200,
  prismPacks: [
    { id: 'p1', prisms: 60, eur: 1.09 }, { id: 'p2', prisms: 300, eur: 5.49 }, { id: 'p3', prisms: 680, eur: 10.99 },
    { id: 'p4', prisms: 1280, eur: 20.99 }, { id: 'p5', prisms: 1980, eur: 31.99 }, { id: 'p6', prisms: 3280, eur: 54.99 },
    { id: 'p7', prisms: 6480, eur: 104.99 }],
  // weekly packs (reset Monday 00:00 UTC); value = what the contents are worth in prisms
  weekly: [
    { id: 'w1', eur: 1.09, was: 3, value: 1688, limit: 4, prisms: 120, double: true, pearls: 12000, rite: 50, items: { sealbag: 1, wish: 2 } },
    { id: 'w2', eur: 5.49, was: 10, value: 2188, limit: 4, prisms: 600, double: true, pearls: 60000, rite: 150, items: { gembox: 1, shardbag: 1 } },
    { id: 'w3', eur: 10.99, was: 20, value: 2888, limit: 2, prisms: 680, pearls: 68000, rite: 200, items: { chest3: 1, petegg: 1 } },
    { id: 'w4', eur: 20.99, was: 40, value: 8888, limit: 1, prisms: 1280, pearls: 128000, rite: 300, items: { chest3: 2, gearbox: 2, exp2: 2 } },
    { id: 'w5', eur: 31.99, was: 60, value: 12888, limit: 1, prisms: 1980, pearls: 198000, rite: 400, items: { chest3: 3, petegg: 2, gembox: 3 } }],
  // Triple Treat: three cheap caches with a 1000% rebate, once a week each; all three bought = Grand Rebate bonus
  caches: [
    { id: 'bubble', name: 'Bubble Cache', what: 'a random chat bubble', eur: 1.09, was: 10, prisms: 120, pearls: 6000, items: { sealbag: 1 } },
    { id: 'frame', name: 'Frame Cache', what: 'a random avatar frame', eur: 2.09, was: 20, prisms: 240, pearls: 24000, items: { sealbag: 1 } },
    { id: 'mount', name: 'Mount Cache', what: 'a mount she does not own yet', eur: 3.19, was: 30, prisms: 360, pearls: 36000, items: { sealbag: 2 } }],
  cacheAll: { eur: 5.49, off: 86 },
  grandRebate: { items: { chest3: 1, gearbox: 1, exp2: 10, gembox: 4 } },
  week(now = Date.now()) { return Math.floor((Math.floor(now / 864e5) + 3) / 7); },
  weekEnds(now = Date.now()) { return (Topup.week(now) * 7 + 4) * 864e5; },
  state(s, now = Date.now()) {
    const w = Topup.week(now); let v = s.topup;
    if (!v || v.week !== w) v = s.topup = { week: w, bought: {}, first: v?.first || [], ...(v?.spent ? { spent: v.spent } : {}) };
    v.bought ??= {}; v.first ??= []; return v;
  },
  pack(id) { return Topup.prismPacks.find(p => p.id === id) || Topup.weekly.find(p => p.id === id) || Topup.caches.find(p => p.id === id) || (id === 'all' ? { id: 'all', ...Topup.cacheAll } : null); },
  limit(id) { const w = Topup.weekly.find(p => p.id === id); return w ? w.limit : Topup.caches.some(p => p.id === id) ? 1 : Infinity; },
  left(s, id, now) { const l = Topup.limit(id); return l === Infinity ? Infinity : Math.max(0, l - (Topup.state(s, now).bought[id] || 0)); },
  allLeft(s, now) { return Topup.caches.every(c => Topup.left(s, c.id, now) > 0); },
  // what a pack contains (prism packs gift pearls; the first buy of each prism pack doubles its prisms)
  contents(s, id, now) {
    const p = Topup.pack(id); if (!p) return null;
    if (id === 'all') return Topup.caches.reduce((o, c) => Topup.add(o, Topup.contents(s, c.id, now)), {});
    if (p.id.startsWith('p')) { const first = !Topup.state(s, now).first.includes(id); return { prisms: p.prisms * (first ? 2 : 1), pearls: p.prisms * Topup.pearlsPerPrism }; }
    return { prisms: p.prisms * (p.double ? 2 : 1), pearls: p.pearls, rite: p.rite || 0, items: { ...(p.items || {}) }, cache: Topup.caches.some(c => c.id === id) ? id : undefined };
  },
  add(a, b) { const o = { ...a }; for (const [k, v] of Object.entries(b)) { if (k === 'items') { o.items = { ...(o.items || {}) }; for (const [i, n] of Object.entries(v)) o.items[i] = (o.items[i] || 0) + n; } else if (k === 'cache') o.caches = [...(o.caches || []), v]; else if (v) o[k] = (o[k] || 0) + v; } return o; },
  // pays a pack (called only once a real payment succeeded); returns what was given, or null
  grant(s, id, rng = Math.random, now = Date.now()) {
    const p = Topup.pack(id), v = Topup.state(s, now); if (!p) return null;
    if (id === 'all' ? !Topup.allLeft(s, now) : Topup.left(s, id, now) < 1) return null;
    const c = Topup.contents(s, id, now), out = { ...c, got: [] };
    s.scales = (s.scales || 0) + (c.prisms || 0); s.pearls = (s.pearls || 0) + (c.pearls || 0);
    if (c.rite && (typeof Rites !== 'undefined')) { const r = Rites.state(s, now), rite = Rites.rite(Rites.period(now)); r.t[rite.id] = (r.t[rite.id] || 0) + c.rite; }
    for (const [i, n] of Object.entries(c.items || {})) if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, i, n);
    for (const k of [...(c.caches || []), ...(c.cache ? [c.cache] : [])]) out.got.push(Topup.openCache(s, k, rng));
    if (id === 'all') { for (const x of Topup.caches) v.bought[x.id] = (v.bought[x.id] || 0) + 1; for (const [i, n] of Object.entries(Topup.grandRebate.items)) if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, i, n); out.rebate = true; }
    else { v.bought[id] = (v.bought[id] || 0) + 1; if (id.startsWith('p') && !v.first.includes(id)) v.first.push(id); }
    if (Topup.caches.some(x => x.id === id) && Topup.allBought(s, now) && !v.rebate) { for (const [i, n] of Object.entries(Topup.grandRebate.items)) if (globalThis.WonderGear?.bagAdd) WonderGear.bagAdd(s, i, n); v.rebate = true; out.rebate = true; }
    if (id === 'all') v.rebate = true;
    Topup.festRecord(s, p.eur, now, c.prisms || 0);
    return out;
  },
  allBought(s, now) { return Topup.caches.every(c => Topup.left(s, c.id, now) < 1); },
  openCache(s, kind, rng = Math.random) {
    const g = globalThis.WonderGear;
    if (kind === 'mount') { const all = (typeof mounts !== 'undefined' ? mounts : []).filter(m => m.id !== 'silver-tabby' && !(s.mountsOwned || []).includes(m.id)); if (!all.length) { s.pearls = (s.pearls || 0) + 30000; return { kind, pearls: 30000 }; } const m = all[Math.floor(rng() * all.length)]; s.mountsOwned = [...(s.mountsOwned || []), m.id]; return { kind, id: m.id, name: m.name }; }
    if (!g?.decoKinds?.[kind]) return { kind };
    const list = g.decoKinds[kind].list, d = list[Math.floor(rng() * list.length)], v = g.supremeState(s), store = g.decoKinds[kind].store;
    v[store][d.id] = (v[store][d.id] || 0) + 1; if (!v[kind]) v[kind] = d.id; g.supremePack(s, v); return { kind, id: d.id, name: d.name };
  },
  // pearls -> tickets of the running rite
  pearlSwap(s, n, now = Date.now()) {
    if (!Number.isInteger(n) || n < 1 || (s.pearls || 0) < n * Topup.pearlTicket || !(typeof Rites !== 'undefined')) return false;
    s.pearls -= n * Topup.pearlTicket; const r = Rites.state(s, now), rite = Rites.rite(Rites.period(now)); r.t[rite.id] = (r.t[rite.id] || 0) + n; return true;
  },
  valid(v) {
    const ids = [...Topup.prismPacks, ...Topup.weekly, ...Topup.caches].map(p => p.id);
    return v === undefined || (!!v && typeof v === 'object' && Number.isSafeInteger(v.week) && !!v.bought && typeof v.bought === 'object'
      && Object.entries(v.bought).every(([k, n]) => ids.includes(k) && Number.isInteger(n) && n >= 0 && n <= 999)
      && (v.first === undefined || Array.isArray(v.first) && v.first.every(k => /^p[1-7]$/.test(k))) && (v.rebate === undefined || typeof v.rebate === 'boolean')
      && (v.spent === undefined || Number.isSafeInteger(v.spent) && v.spent >= 0));
  },
};

// Top-up Fest (user photos of the reference's FestEvent Top-up tab, 2026-11-27): rewards for paying players on top of
// what they buy. Single Top-up: one transaction of at least a price pays that row (highest row it reaches, up to
// `limit` times a festival). Multi-Day: the festival's total opens rows. Daily: today's total opens rows (00:00 UTC).
// Festival = `festDays` UTC days from `festAnchor`. Counted only from `Topup.grant` (real payment NOT connected), so
// nothing moves until payments exist. Optional save field S.fest {p, sn{i:n}, sg{i:n}, m, mg[], d, dc, dg[]} (cents).
Object.assign(Topup, {
  festDays: 6, festAnchor: Date.UTC(2026, 10, 27),
  festSingle: [
    { eur: 1.09, limit: 3, give: { pearls: 3000, items: { chest2: 5, setAurora: 2 } } },
    { eur: 5.49, limit: 3, give: { pearls: 8000, items: { chest2: 5, setAurora: 4, awakenCore: 4 } } },
    { eur: 10.99, limit: 3, give: { pearls: 15000, items: { gearbox: 1, chest3: 3, setStar: 3 } } }],
  festMulti: [20.99, 31.99, 47.99, 54.99, 69.99, 78.99, 104.99, 173.09, 255.99].map((eur, i) => ({ eur, give: { pearls: 10000 * (i + 1), items: { chest3: 2 + i, awakenCore: 5 + 3 * i, ...(i > 2 ? { setStar: i } : {}), ...(i > 4 ? { setMoon: i - 3 } : {}), ...(i > 6 ? { setSun: i - 5 } : {}) } } })),
  festDaily: [1.09, 3.18, 5.49, 10.99, 20.99, 46.19, 54.99, 104.99, 173.09, 255.99, 345.99].map((eur, i) => ({ eur, give: { pearls: 2000 * (i + 1), items: { chest2: 1 + i, setAurora: 2 + i, ...(i > 2 ? { awakenCore: 2 * i } : {}), ...(i > 5 ? { gearbox: i - 4 } : {}), ...(i > 7 ? { setSun: 1 } : {}) } } })),
  festPeriod(now = Date.now()) { return Math.floor((now - Topup.festAnchor) / (Topup.festDays * 864e5)); },
  festEnds(now = Date.now()) { return Topup.festAnchor + (Topup.festPeriod(now) + 1) * Topup.festDays * 864e5; },
  festState(s, now = Date.now()) {
    const p = Topup.festPeriod(now), d = Math.floor(now / 864e5); let f = s.fest;
    if (!f || f.p !== p) f = s.fest = { p, sn: {}, sg: {}, m: 0, mg: [], d, dc: 0, dg: [] };
    if (f.d !== d) { f.d = d; f.dc = 0; f.dg = []; }
    return f;
  },
  festRecord(s, eur, now = Date.now()) {
    const f = Topup.festState(s, now), c = Math.round(eur * 100);
    f.m += c; f.dc += c;
    let i = -1; Topup.festSingle.forEach((r, k) => { if (c >= Math.round(r.eur * 100)) i = k; });
    if (i >= 0 && (f.sn[i] || 0) < Topup.festSingle[i].limit) f.sn[i] = (f.sn[i] || 0) + 1;
  },
  festPay(s, give) { s.pearls = (s.pearls || 0) + (give.pearls || 0); for (const [i, n] of Object.entries(give.items || {})) globalThis.WonderGear?.bagAdd?.(s, i, n); },
  festClaim(s, kind, i, now = Date.now()) {
    const f = Topup.festState(s, now);
    if (kind === 's') { const r = Topup.festSingle[i]; if (!r || (f.sg[i] || 0) >= (f.sn[i] || 0)) return false; f.sg[i] = (f.sg[i] || 0) + 1; Topup.festPay(s, r.give); return true; }
    const list = kind === 'm' ? Topup.festMulti : Topup.festDaily, got = kind === 'm' ? f.mg : f.dg, have = kind === 'm' ? f.m : f.dc, r = list[i];
    if (!r || got.includes(i) || have < Math.round(r.eur * 100)) return false; got.push(i); Topup.festPay(s, r.give); return true;
  },
  festDue(s, now = Date.now()) {
    const f = s.fest; if (!f || f.p !== Topup.festPeriod(now)) return false;
    return Topup.festSingle.some((r, i) => (f.sg[i] || 0) < (f.sn[i] || 0)) || Topup.festMulti.some((r, i) => !f.mg.includes(i) && f.m >= Math.round(r.eur * 100)) || (f.d === Math.floor(now / 864e5) && Topup.festDaily.some((r, i) => !f.dg.includes(i) && f.dc >= Math.round(r.eur * 100)));
  },
  festValid(f) {
    const n = (v, max) => Number.isSafeInteger(v) && v >= 0 && v <= max, map = o => !!o && typeof o === 'object' && Object.entries(o).every(([k, v]) => /^\d$/.test(k) && n(v, 3));
    const idx = (a, len) => Array.isArray(a) && a.length <= len && a.every(i => Number.isInteger(i) && i >= 0 && i < len);
    return f === undefined || !!f && Number.isSafeInteger(f.p) && map(f.sn) && map(f.sg) && n(f.m, 1e9) && idx(f.mg, Topup.festMulti.length) && Number.isSafeInteger(f.d) && n(f.dc, 1e9) && idx(f.dg, Topup.festDaily.length);
  }
});

// Top-up Fest, second part (user photos 2026-11-27): MegaPack (any top-up during the festival), Fortune (days with at
// least `fortuneEur`), Double Fortune (days with at least 6.59 / 15.99, a reward per day + a final row), and three
// rebates: Top-up Meow (cumulative thresholds give paws; a paw draws a random share of a prism pool, the last draw
// empties it), Lucky Kitten (each single top-up of at least `kittenEur` gives a paw, smaller pool) and Lucky Roulette
// (a single top-up of a tier gives a spin; the spin multiplies that tier's prisms as a rebate). Placeholders.
Object.assign(Topup, {
  mega: { give: { pearls: 1300, items: { chest2: 5, setAurora: 10, awakenCore: 5 } }, frame: true },
  fortuneEur: 1.09,
  fortune: [1, 2, 3, 4, 5].map(d => ({ days: d, give: { pearls: 2000 * d, items: { setAurora: 4 + 2 * d, awakenCore: 4 + 2 * d } }, cache: d === 5 ? ['frame', 'bubble'] : null })),
  double: [
    { eur: 6.59, day: { pearls: 3000, items: { awakenCore: 6 } }, end: { items: { gearbox: 1, setStar: 5, chest3: 2 } } },
    { eur: 15.99, day: { pearls: 8000, items: { setStar: 2, awakenCore: 10 } }, end: { items: { gearbox: 3, setMoon: 4, setSun: 1 } } }],
  doubleDays: 6,
  meowSteps: [3.18, 5.49, 10.99, 20.99, 31.99, 47.99, 54.99, 69.99, 78.99, 104.99, 130.99, 173.09, 209.99, 255.99, 299.99, 345.99, 399.99],
  meowPool: 9683, kittenPool: 3888, kittenEur: 10.99, kittenMax: 9,
  wheel: [1.1, 1.3, 1.5, 1.7, 1.8, 1.9, 2, 2.1], wheelOdds: [30, 25, 16, 11, 7, 5, 4, 2],
  wheelTiers: [{ eur: 1.09, n: 3 }, { eur: 5.49, n: 3 }, { eur: 10.99, n: 3 }, { eur: 20.99, n: 3 }, { eur: 31.99, n: 1 }, { eur: 54.99, n: 1 }, { eur: 104.99, n: 1 }],
  festDay(now = Date.now()) { return Math.floor((now - Topup.festAnchor) / 864e5) - Topup.festPeriod(now) * Topup.festDays; },
  festFill(f) {
    f.dm ??= {}; f.a ??= false; f.mg1 ??= false; f.fg ??= []; f.wg ??= [[], []]; f.we ??= [false, false];
    f.mp ??= 0; f.mu ??= 0; f.mpool ??= Topup.meowPool; f.kp ??= 0; f.ku ??= 0; f.kpool ??= Topup.kittenPool;
    f.rc ??= {}; f.ru ??= {}; f.rl ??= []; return f;
  },
  festRecordMore(s, eur, now, prisms) {
    const f = Topup.festFill(Topup.festState(s, now)), c = Math.round(eur * 100), d = Topup.festDay(now);
    f.a = true; f.dm[d] = (f.dm[d] || 0) + c;
    f.mp = Topup.meowSteps.filter(x => f.m >= Math.round(x * 100)).length;
    if (c >= Math.round(Topup.kittenEur * 100) && f.kp < Topup.kittenMax) f.kp++;
    let t = -1; Topup.wheelTiers.forEach((x, i) => { if (c >= Math.round(x.eur * 100)) t = i; });
    if (t >= 0 && (f.rc[t] || 0) < Topup.wheelTiers[t].n) f.rc[t] = (f.rc[t] || 0) + 1;
  },
  daysAt(f, eur) { return Object.values(f.dm || {}).filter(v => v >= Math.round(eur * 100)).length; },
  festGrant(s, give, cache) {
    Topup.festPay(s, give);
    const got = []; for (const k of cache || []) got.push(Topup.openCache(s, k)); return got;
  },
  megaClaim(s, now) { const f = Topup.festFill(Topup.festState(s, now)); if (!f.a || f.mg1) return false; f.mg1 = true; Topup.festGrant(s, Topup.mega.give, ['frame']); return true; },
  fortuneClaim(s, i, now) { const f = Topup.festFill(Topup.festState(s, now)), r = Topup.fortune[i]; if (!r || f.fg.includes(i) || Topup.daysAt(f, Topup.fortuneEur) < r.days) return false; f.fg.push(i); Topup.festGrant(s, r.give, r.cache); return true; },
  doubleClaim(s, k, day, now) {
    const f = Topup.festFill(Topup.festState(s, now)), t = Topup.double[k]; if (!t) return false; const have = Topup.daysAt(f, t.eur);
    if (day === 'end') { if (f.we[k] || have < Topup.doubleDays) return false; f.we[k] = true; Topup.festPay(s, t.end); return true; }
    if (!Number.isInteger(day) || day < 0 || day >= Topup.doubleDays || f.wg[k].includes(day) || have < day + 1) return false;
    f.wg[k].push(day); Topup.festPay(s, t.day); return true;
  },
  // A paw draws a random share of what is left; the paw that is the last one the pool allows takes everything.
  pawDraw(s, kind, rng = Math.random, now) {
    const f = Topup.festFill(Topup.festState(s, now)), meow = kind === 'meow', max = meow ? Topup.meowSteps.length : Topup.kittenMax;
    const have = meow ? f.mp - f.mu : f.kp - f.ku, pool = meow ? f.mpool : f.kpool, used = meow ? f.mu : f.ku;
    if (have < 1 || pool < 1) return 0;
    const left = max - used, n = left <= 1 ? pool : Math.max(1, Math.min(pool, Math.floor(pool / left * (.3 + 1.4 * rng()))));
    if (meow) { f.mu++; f.mpool -= n; } else { f.ku++; f.kpool -= n; }
    s.scales = (s.scales || 0) + n; return n;
  },
  wheelSpin(s, t, rng = Math.random, now) {
    const f = Topup.festFill(Topup.festState(s, now)), tier = Topup.wheelTiers[t]; if (!tier || (f.ru[t] || 0) >= (f.rc[t] || 0)) return null;
    let roll = rng() * Topup.wheelOdds.reduce((a, b) => a + b, 0), i = 0; while (roll >= Topup.wheelOdds[i]) { roll -= Topup.wheelOdds[i]; i++; }
    const pack = Topup.prismPacks.find(p => p.eur === tier.eur), base = pack ? pack.prisms : Math.round(tier.eur * 60), got = Math.round(base * Topup.wheel[i]);
    f.ru[t] = (f.ru[t] || 0) + 1; s.scales = (s.scales || 0) + got; f.rl.unshift([base, Topup.wheel[i], got]); f.rl.length = Math.min(f.rl.length, 10);
    return { index: i, mult: Topup.wheel[i], base, got };
  }
});
{
  const rec = Topup.festRecord, due = Topup.festDue, val = Topup.festValid;
  Topup.festRecord = (s, eur, now = Date.now(), prisms = 0) => { rec(s, eur, now); Topup.festRecordMore(s, eur, now, prisms); };
  Topup.festDue = (s, now = Date.now()) => {
    if (due(s, now)) return true; const f = s.fest; if (!f || f.p !== Topup.festPeriod(now)) return false; Topup.festFill(f);
    return (f.a && !f.mg1) || Topup.fortune.some((r, i) => !f.fg.includes(i) && Topup.daysAt(f, Topup.fortuneEur) >= r.days) || f.mp > f.mu || f.kp > f.ku || Object.keys(f.rc).some(t => (f.ru[t] || 0) < f.rc[t])
      || Topup.double.some((t, k) => Array.from({ length: Topup.doubleDays }, (_, d) => d).some(d => !f.wg[k].includes(d) && Topup.daysAt(f, t.eur) > d));
  };
  Topup.festValid = f => {
    if (!val(f) || f === undefined) return f === undefined;
    const n = (v, max) => v === undefined || Number.isSafeInteger(v) && v >= 0 && v <= max, ix = (a, len) => a === undefined || Array.isArray(a) && a.length <= len && a.every(i => Number.isInteger(i) && i >= 0 && i < len);
    const map = (o, keyMax, vMax) => o === undefined || !!o && typeof o === 'object' && Object.entries(o).every(([k, v]) => /^\d+$/.test(k) && +k <= keyMax && Number.isSafeInteger(v) && v >= 0 && v <= vMax);
    return map(f.dm, Topup.festDays, 1e9) && (f.a === undefined || typeof f.a === 'boolean') && (f.mg1 === undefined || typeof f.mg1 === 'boolean') && ix(f.fg, Topup.fortune.length)
      && (f.wg === undefined || Array.isArray(f.wg) && f.wg.length === 2 && f.wg.every(a => ix(a, Topup.doubleDays))) && (f.we === undefined || Array.isArray(f.we) && f.we.length === 2 && f.we.every(b => typeof b === 'boolean'))
      && n(f.mp, Topup.meowSteps.length) && n(f.mu, Topup.meowSteps.length) && n(f.mpool, Topup.meowPool) && n(f.kp, Topup.kittenMax) && n(f.ku, Topup.kittenMax) && n(f.kpool, Topup.kittenPool)
      && map(f.rc, 9, 9) && map(f.ru, 9, 9) && (f.rl === undefined || Array.isArray(f.rl) && f.rl.length <= 10 && f.rl.every(r => Array.isArray(r) && r.length === 3 && r.every(v => typeof v === 'number' && v >= 0 && v < 1e7)));
  };
}
globalThis.Topup = Topup;

// TOPUP_UI
let topupTab = 'prisms', topupTimer = 0;
let festTab = 's';
function tpClock(end) { const t = Math.max(0, end - Date.now()), d = Math.floor(t / 864e5), h = Math.floor(t % 864e5 / 36e5), m = Math.floor(t % 36e5 / 6e4); return (d ? d + 'd ' : '') + h + 'h ' + m + 'm'; }
function festClaimGo(kind, i) { if (Topup.festClaim(S, kind, i)) { save(); toast('Top-up Fest reward claimed.'); } showTopup(); }
const pearlIcon = (cls = '') => `<img class="pearl-ico ${cls}" src="${artPath('ui-pearl')}" alt="">`;
const prismIcon = (cls = '') => `<img class="prism-ico ${cls}" src="${artPath('ui-prism')}" alt="">`;
const euro = n => '€' + n.toFixed(2);
function tpLeftClock() { const ms = Math.max(0, Topup.weekEnds() - Date.now()), d = Math.floor(ms / 864e5), h = Math.floor(ms % 864e5 / 36e5), m = Math.floor(ms % 36e5 / 6e4); return d + 'd ' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0'); }
function tpTiles(c) {
  let h = '';
  if (c.prisms) h += `<span class="tp-tile">${prismIcon()}<b>${fmt(c.prisms)}</b></span>`;
  if (c.pearls) h += `<span class="tp-tile">${pearlIcon()}<b>${fmt(c.pearls)}</b></span>`;
  if (c.rite && typeof riteTicket === 'function') h += `<span class="tp-tile">${riteTicket(Rites.rite(Rites.period()))}<b>${fmt(c.rite)}</b></span>`;
  for (const [i, n] of Object.entries(c.items || {})) h += `<span class="tp-tile">${bagIcon(i)}<b>${n}</b></span>`;
  return h;
}
function showTopup() {
  clearInterval(topupTimer); bagArtVars();
  if (!['fest', 'cache', 'weekly', 'prisms'].includes(topupTab)) topupTab = 'prisms';
  const tabs = [['fest', 'Top-up Fest', 'quests'], ['cache', 'Triple Treat', 'gift'], ['weekly', 'Weekly Packs', 'chest'], ['prisms', 'Prisms', 'crystals']];
  let body = '';
  if (topupTab === 'prisms') body = `<div class="tp-grid">${Topup.prismPacks.map((p, i) => { const first = !Topup.state(S).first.includes(p.id);
    return `<button class="tp-card" onclick="topupAsk('${p.id}')">${denPlain}${first ? '<i class="tp-x2">First buy ×2</i>' : ''}<b class="tp-amt">${prismIcon()}${fmt(p.prisms)}</b><img class="tp-pile" src="${artPath('topup-pile-' + (i + 1))}" alt=""><small class="tp-gift">Gift: ${pearlIcon()} × ${fmt(p.prisms * Topup.pearlsPerPrism)}</small><span class="tp-price">${euro(p.eur)}</span></button>`; }).join('')}</div>`;
  else if (topupTab === 'weekly') body = `<p class="tp-note">Weekly packs · new stock in <b data-tpclock>${tpLeftClock()}</b></p><div class="tp-week">${Topup.weekly.map((w, i) => { const left = Topup.left(S, w.id), c = Topup.contents(S, w.id);
    return `<div class="tp-wk tp-wk${i + 1} ${left ? '' : 'out'}"><p class="tp-val"><small>Value</small>${prismIcon()}${fmt(w.value)}</p>${w.double ? '<i class="tp-x2">2×!</i>' : ''}<img class="tp-wpile" src="${artPath('topup-pile-' + (i + 2))}" alt=""><div class="tp-wtiles">${tpTiles(c)}</div><s>${euro(w.was)}</s><button class="tp-buy" ${left ? '' : 'disabled'} onclick="topupAsk('${w.id}')">${denPlain}${left ? euro(w.eur) : 'Sold out'}</button><small>${w.limit - left}/${w.limit}</small></div>`; }).join('')}</div>`;
  else if (topupTab === 'cache') { const allBought = Topup.allBought(S);
    body = `<p class="tp-note">Each cache once a week · new stock in <b data-tpclock>${tpLeftClock()}</b></p>${Topup.caches.map((c, i) => { const left = Topup.left(S, c.id);
      return `<div class="tp-cache tp-c${i + 1} ${left ? '' : 'out'}"><div class="tp-cbox"><img src="${artPath('topup-cache-' + c.id)}" alt=""><b>${c.name}</b><small>${c.what}</small></div><div class="tp-cright"><div class="tp-ctiles">${tpTiles({ prisms: c.prisms * 2, pearls: c.pearls, items: c.items })}</div><p><s>Usual price ${euro(c.was)}</s></p><button class="tp-buy" ${left ? '' : 'disabled'} onclick="topupAsk('${c.id}')">${denPlain}${left ? euro(c.eur) : 'Bought'}</button><i class="tp-rebate">Rebate<br>1000%</i></div></div>`; }).join('')}
     <div class="tp-grand"><div><b>Buy all three caches</b><small>and claim the Grand Rebate</small></div><div class="tp-ctiles">${tpTiles({ items: Topup.grandRebate.items })}</div></div>
     <button class="tp-all" ${Topup.allLeft(S) ? '' : 'disabled'} onclick="topupAsk('all')">${denPlain}${allBought ? 'All bought this week' : euro(Topup.cacheAll.eur) + ' · all three'}<i>${Topup.cacheAll.off}% off</i></button>`; }
  if (topupTab === 'fest') {
    const f = Topup.festState(S), eu = c => euro(c / 100), cl = (kind, i, ok, done) => done ? `<button class="tp-fclaim done" disabled>${denPlain}Claimed</button>` : ok ? `<button class="tp-fclaim on" onclick="festClaimGo('${kind}',${i})">${denPlain}Claim</button>` : `<button class="tp-fclaim" onclick="topupTab='prisms';showTopup()">${denPlain}Top-up</button>`;
    const row = (head, give, btn, note = '') => `<div class="tp-frow"><p class="tp-fhead">${head}</p><div class="tp-fbody"><div class="tp-ctiles">${tpTiles(give)}</div><div class="tp-fact">${btn}${note}</div></div></div>`;
    const ends = festTab === 'd' ? (Math.floor(Date.now() / 864e5) + 1) * 864e5 : Topup.festEnds();
    let list = '';
    if (festTab === 's') list = Topup.festSingle.map((r, i) => row(`Top up <b>${euro(r.eur)}</b> in a single purchase to claim`, r.give, cl('s', i, (f.sg[i] || 0) < (f.sn[i] || 0), (f.sg[i] || 0) >= r.limit), `<small>Limit: ${f.sg[i] || 0}/${r.limit}</small>`)).join('');
    else if (['s', 'm', 'd'].includes(festTab)) { const items = festTab === 'm' ? Topup.festMulti : Topup.festDaily, have = festTab === 'm' ? f.m : f.dc, got = festTab === 'm' ? f.mg : f.dg;
      list = items.map((r, i) => row(`${festTab === 'm' ? 'Top up during the festival' : 'Top up today'} <b class="${have >= Math.round(r.eur * 100) ? 'ok' : 'low'}">${eu(have)}</b>/${euro(r.eur)}`, r.give, cl(festTab, i, have >= Math.round(r.eur * 100), got.includes(i)))).join(''); }
    if (['mega', 'fortune', 'double', 'meow', 'kitten', 'wheel'].includes(festTab)) { list = festMore(f); }
    body = `<div class="tp-fsub">${[['s', 'Single Top-up'], ['m', 'Multi-Day'], ['d', 'Daily Top-up'], ['mega', 'MegaPack'], ['fortune', 'Fortune'], ['double', 'Double Fortune'], ['meow', 'Top-up Meow'], ['kitten', 'Lucky Kitten'], ['wheel', 'Lucky Roulette']].map(([k, n]) => `<button class="${k === festTab ? 'on' : ''}" onclick="festTab='${k}';showTopup()">${denPlain}${n}</button>`).join('')}</div>
     <p class="tp-note">Rewards on top of every prism pack · ${festTab === 'd' ? 'resets' : 'ends'} in <b>${tpClock(ends)}</b>. Real-money payments are not connected yet, so progress stays at ${euro(0)} for now.</p><div class="tp-flist">${list}</div>`;
  }
  if (topupTab === 'prisms') body += `<div class="tp-swap"><h3>Spend Moon Pearls</h3><p>Swap pearls for tickets of the running rite, ${Rites.rite(Rites.period()).name}: ${pearlIcon()} ${fmt(Topup.pearlTicket)} = 1 ticket.</p><div class="tp-swaprow">${[1, 10, 50].map(n => `<button class="tp-buy" ${(S.pearls || 0) < n * Topup.pearlTicket ? 'disabled' : ''} onclick="topupSwap(${n})">${denPlain}${pearlIcon()}${fmt(n * Topup.pearlTicket)} → ${n}</button>`).join('')}</div></div>`;
  $('#main').innerHTML = `<section class="tp-room" data-tab="${topupTab}">
   <div class="tp-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="tp-ribbon">Prism Bazaar</div>
    <span class="tp-chip">${uiIcon('gold') + fmt(S.gold)}</span><span class="tp-chip">${pearlIcon()}${fmt(S.pearls || 0)}</span><span class="tp-chip">${prismIcon()}${fmt(S.scales || 0)}</span></div>
   <div class="tp-banner" style="--tpb:url('${artPath('topup-banner')}')"><h1>${topupTab === 'prisms' ? 'Prism Top-up' : topupTab === 'weekly' ? 'Weekly Packs' : topupTab === 'fest' ? 'Top-up Fest' : 'Triple Treat'}</h1></div>
   <div class="tp-body">${body}</div>
   <div class="tp-nav">${tabs.map(([id, name, icon]) => `<button class="${id === topupTab ? 'on' : ''}" onclick="topupTab='${id}';showTopup()">${denPlain}${id === 'cache' ? '<i class="tp-badge">2×</i>' : ''}${uiIcon(icon)}<span>${name}</span></button>`).join('')}</div>
  </section>`;
  { const row = document.querySelector('.tp-fsub'), on = row?.querySelector?.('.on'); if (row && on) row.scrollLeft = on.offsetLeft - row.clientWidth / 2 + on.offsetWidth / 2; }
  topupTimer = setInterval(() => { if (screen !== 'topup' && screen !== 'festTop') return clearInterval(topupTimer); document.querySelectorAll('[data-tpclock]').forEach(e => e.textContent = tpLeftClock()); }, 30000);
}
function topupAsk(id) {
  const p = Topup.pack(id), c = Topup.contents(S, id);
  popup(`<div class="tp-pop"><h2>${id === 'all' ? 'Triple Treat · all three' : p.name || (p.prisms && id.startsWith('p') ? fmt(p.prisms) + ' prisms' : 'Weekly pack')}</h2>
   <div class="tp-ctiles">${tpTiles(c)}${(c.caches || (c.cache ? [c.cache] : [])).map(k => `<span class="tp-tile"><img src="${artPath('topup-cache-' + k)}" alt=""><b>1</b></span>`).join('')}</div>
   ${id === 'all' ? `<p>Plus the Grand Rebate:</p><div class="tp-ctiles">${tpTiles({ items: Topup.grandRebate.items })}</div>` : ''}
   <p class="tp-small">Price ${euro(p.eur)}. Real-money payments are not connected in this prototype yet, so nothing is charged and nothing is given.</p></div>`);
  $('#modal').classList.add('bw-pop');
}
function topupSwap(n) { if (!Topup.pearlSwap(S, n)) { toast('Not enough Moon Pearls'); return; } save(); wallet(); showTopup(); toast('+' + n + ' rite tickets'); }

// Top-up Fest second part: MegaPack, Fortune, Double Fortune, Top-up Meow, Lucky Kitten, Lucky Roulette (light cards)
function festMore(f) {
  const T = Topup; T.festFill(f);
  const btn = (ok, done, act, label = 'Claim') => done ? `<button class="tp-fclaim done" disabled>${denPlain}Claimed</button>` : ok ? `<button class="tp-fclaim on" onclick="${act}">${denPlain}${label}</button>` : `<button class="tp-fclaim" onclick="topupTab='prisms';showTopup()">${denPlain}Top-up</button>`;
  const row = (head, give, b, extra = '') => `<div class="tp-frow"><p class="tp-fhead">${head}</p><div class="tp-fbody"><div class="tp-ctiles">${tpTiles(give)}${extra}</div><div class="tp-fact">${b}</div></div></div>`;
  const frame = n => `<span class="tp-tile tp-fx">✦<b>${n}</b></span>`;
  if (festTab === 'mega') return `<div class="tp-mega"><h3>MegaPack</h3><p>Top up any amount during the festival to claim an exclusive avatar frame and a chest of forge materials.</p><div class="tp-ctiles">${frame('Frame')}${tpTiles(T.mega.give)}</div>${btn(f.a, f.mg1, 'festGo(()=>Topup.megaClaim(S))')}</div>`;
  if (festTab === 'fortune') { const days = T.daysAt(f, T.fortuneEur); return T.fortune.map((r, i) => row(`Top up at least ${euro(T.fortuneEur)} on <b class="${days >= r.days ? 'ok' : 'low'}">${days}</b>/${r.days} days`, r.give, btn(days >= r.days, f.fg.includes(i), `festGo(()=>Topup.fortuneClaim(S,${i}))`), r.cache ? frame('Frame') + frame('Bubble') : '')).join(''); }
  if (festTab === 'double') return T.double.map((t, k) => { const days = T.daysAt(f, t.eur), today = f.dm[T.festDay()] || 0;
    return `<div class="tp-dbl tp-dbl${k}"><div class="tp-dhead"><b>${euro(t.eur)}</b><span>Topped up ${euro(today / 100)}/${euro(t.eur)} today · ${days}/${T.doubleDays} days</span></div>
     <div class="tp-ddays">${Array.from({ length: T.doubleDays }, (_, d) => `<button class="tp-dday ${f.wg[k].includes(d) ? 'got' : days > d ? 'ok' : ''}" onclick="festGo(()=>Topup.doubleClaim(S,${k},${d}))" ${days > d && !f.wg[k].includes(d) ? '' : 'disabled'}>${denPlain}<span class="tp-ctiles">${tpTiles(t.day)}</span><small>${d + 1} Day${f.wg[k].includes(d) ? ' ✓' : ''}</small></button>`).join('')}</div>
     <div class="tp-dend"><div class="tp-ctiles">${tpTiles(t.end)}</div>${btn(days >= T.doubleDays, f.we[k], `festGo(()=>Topup.doubleClaim(S,${k},'end'))`)}</div></div>`; }).join('');
  if (festTab === 'meow' || festTab === 'kitten') { const meow = festTab === 'meow', pool = meow ? f.mpool : f.kpool, have = meow ? f.mp - f.mu : f.kp - f.ku, max = meow ? T.meowSteps.length : T.kittenMax, used = meow ? f.mu : f.ku;
    const next = meow ? T.meowSteps.find(x => f.m < Math.round(x * 100)) : null;
    return `<div class="tp-cat"><h3>${meow ? 'Top-up Meow' : 'Lucky Kitten'}</h3><p class="tp-catrule">${meow ? 'Each festival top-up total step gives a Lucky Paw' + (next ? ` (next at ${euro(next)}, now ${euro(f.m / 100)})` : '') : `Every single top-up of at least ${euro(T.kittenEur)} gives a Lucky Paw (up to ${T.kittenMax})`}. A paw draws a random share of the prism pool; the last of ${max} draws takes all that is left.</p>
     <p class="tp-catlbl">Prisms left in the pool</p><div class="tp-catnum">${String(pool).padStart(4, '0').split('').map(d => `<b>${d}</b>`).join('')}</div>
     <p class="tp-catlbl">${max - used} draws left to empty the pool</p><button class="tp-fclaim ${have > 0 && pool > 0 ? 'on' : ''}" ${have > 0 && pool > 0 ? '' : 'disabled'} onclick="festPaw('${festTab}')">${denPlain}🐾 ${have}/${Math.max(1, have)} Draw</button></div>`; }
  if (festTab === 'wheel') { const spins = T.wheelTiers.map((t, i) => [t, i, (f.rc[i] || 0) - (f.ru[i] || 0), t.n - (f.rc[i] || 0)]);
    return `<div class="tp-wheelbox"><div class="tp-wheel" id="tpWheel">${T.wheel.map((m, i) => `<i style="--a:${i * 45 + 22.5}deg">${m}</i>`).join('')}<span class="tp-whub">${prismIcon()}</span></div><span class="tp-wptr">▼</span>
      <button class="tp-fclaim" onclick="festNews()">${denPlain}★ Lucky Star</button><p class="tp-catrule">The more you top up, the more the rebate: a single top-up of a tier gives a spin; the spin pays that tier's prisms × the multiplier.</p></div>
      ${spins.map(([t, i, ready, left]) => `<div class="tp-frow"><div class="tp-fbody"><div class="tp-wtier"><b>Top-up ${euro(t.eur)} tier</b><small>${left} rebate chances left${ready > 0 ? ` · ${ready} ready` : ''}</small></div><div class="tp-fact">${ready > 0 ? `<button class="tp-fclaim on" onclick="festSpin(${i})">${denPlain}Spin</button>` : `<button class="tp-fclaim" onclick="topupTab='prisms';showTopup()">${denPlain}Top up</button>`}</div></div></div>`).join('')}`; }
  return '';
}
function festGo(fn) { if (fn()) { save(); toast('Top-up Fest reward claimed.'); } showTopup(); }
function festPaw(kind) { const n = Topup.pawDraw(S, kind); if (n) { save(); toast('Lucky Paw: +' + fmt(n) + ' prisms!'); } showTopup(); }
function festSpin(t) {
  const r = Topup.wheelSpin(S, t); if (!r) return; save();
  const w = document.getElementById('tpWheel'); if (w) { w.style.transition = 'transform 2.4s cubic-bezier(.15,.8,.2,1)'; w.style.transform = `rotate(${1440 - (r.index * 45 + 22.5)}deg)`; }
  setTimeout(() => { showTopup(); resultShow({ title: 'Lucky Roulette', kicker: r.mult + '× rebate', win: true, body: `<div class="bag-gains">${tpTiles({ prisms: r.got })}</div><p class="wr-note">Top-up of ${fmt(r.base)} prisms × ${r.mult} = ${fmt(r.got)} prisms.</p>`, buttons: [['Confirm', 'gold', '']] }); }, 2600);
}
function festNews() {
  const f = Topup.festFill(Topup.festState(S)), names = ['Mawi', 'Orrin', 'Sela', 'Brisk', 'Lumi', 'Tavi', 'Corin', 'Fen'], base = [60, 300, 680, 1280], seed = Topup.festPeriod() * 97 + Math.floor(Date.now() / 36e5);
  const ai = Array.from({ length: 8 }, (_, i) => { const k = (seed * 31 + i * 17) % 997, b = base[k % 4], m = Topup.wheel[k % 8]; return `<p><b>${names[k % names.length]}</b> <i>AI</i> topped up ${fmt(b)} prisms and spun ${m}× for <b>${fmt(Math.round(b * m))}</b> prisms!</p>`; }).join('');
  const mine = f.rl.map(([b, m, g]) => `<p><b>Reina</b> topped up ${fmt(b)} prisms and spun ${m}× for <b>${fmt(g)}</b> prisms!</p>`).join('') || '<p>No spins yet.</p>';
  popup(`<div class="tp-news"><h2>Lucky Star</h2><h3>Server news</h3>${ai}<h3>Your spins</h3>${mine}</div>`); $('#modal').classList.add('bw-pop');
}
