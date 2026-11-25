// Star Rites: our gacha (user, after reading her notes on the reference's gachas: "our own names, our own great prizes").
// Four rites take turns, two weeks each (Rites.list, from Rites.anchor). Each rite has its own ticket; tickets never
// expire. A pull costs 50 tickets (x10 = 500, same odds). Prizes, rarest first: the rite's exclusive WINGS (grand prize,
// guaranteed by pull 300 of the event), the rite's AURA (a ring of light at her feet, real stats, copies raise its
// tier), one of ten WISH ORBS (a collection with set bonuses at 4 / 7 / 10), then bag items. Luck: within 15 pulls an
// orb or better is certain; it resets when one drops. Pull milestones of the event pay tickets of the NEXT rite (so
// the circle feeds itself), two rites also return their own tickets, Starfall Vault lets her pick a prize at 360 / 720
// / 800 instead, Celestial Bloom pays prisms on its Petal Path. Duplicates turn into stardust for the Dust Shop.
// Every number here is a placeholder. Rules are pure (node scripts/test-rites.mjs); the UI is below RITES_UI.
const Rites = {
  anchor: Date.UTC(2026, 10, 23), eventDays: 14, cost: 50,
  list: [
    { id: 'moon', name: 'Moonwell Rite', ticket: 'Moon Sigil', wings: 'fashion-wing-28', wingName: 'Moonwell Seraph', icon: 0, extra: 'returns', hue: '#b9a6ff' },
    { id: 'ember', name: 'Dragon Hoard', ticket: 'Ember Scale', wings: 'fashion-wing-29', wingName: 'Dragonfire Crest', icon: 1, extra: 'returns', hue: '#ff8a4a' },
    { id: 'star', name: 'Starfall Vault', ticket: 'Star Key', wings: 'fashion-wing-30', wingName: 'Starfall Comet', icon: 2, extra: 'choice', hue: '#5fd6c0' },
    { id: 'bloom', name: 'Celestial Bloom', ticket: 'Bloom Charm', wings: 'fashion-wing-31', wingName: 'Celestial Bloom', icon: 3, extra: 'petals', hue: '#ff8ac8' }
  ],
  auras: { moon: 'Moonveil Halo', ember: 'Dragonfire Ring', star: 'Starfall Circle', bloom: 'Bloom Garden' },
  orbs: [['flame', 'Flame Orb'], ['tide', 'Tide Orb'], ['leaf', 'Leaf Orb'], ['storm', 'Storm Orb'], ['frost', 'Frost Orb'],
    ['sun', 'Sun Orb'], ['moon', 'Moon Orb'], ['star', 'Star Orb'], ['bloom', 'Bloom Orb'], ['shadow', 'Shadow Orb']],
  // Chance of each tier for one pull; the rest is a common item.
  odds: { ultra: .0005, wings: .003, aura: .012, orb: .07, rare: .25 },
  // The ultra prize of every rite (user: "golden wings on the main screen, something that will hardly ever drop but
  // everyone wants"): 0.05% a pull, no pity, never sold, never in a selection. Strong lasting stats once owned.
  ultra: { id: 'fashion-wing-32', name: 'Aurelian Sunwings', stats: { attack: 2400, health: 24000, penetration: 1200, defense: 1200, defensePercent: 10, attackPercent: 5 } },
  rare: ['chest2', 'gembox', 'petegg', 'sealbag', 'wish'],
  common: ['exp1', 'gold1', 'shardbag', 'stonebag', 'chest1'],
  luckMax: 15, grandAt: 300, auraTiers: 5,
  // Milestones of one event, by pulls made in it. next = tickets of the next rite, cur = tickets of this rite back,
  // orb = a new orb, prisms, pick = choose a prize. The extra rows depend on the rite (Rites.list[].extra).
  steps: [{ at: 15, next: 400 }, { at: 30, next: 740 }, { at: 60, next: 1240 }, { at: 135, next: 1240 }, { at: 240, next: 1240, orb: 1 }],
  extras: {
    returns: [{ at: 120, cur: 750 }, { at: 250, cur: 1750 }],
    choice: [{ at: 360, pick: 1 }, { at: 720, pick: 1 }, { at: 800, pick: 1 }],
    petals: [{ at: 50, prisms: 100 }, { at: 100, prisms: 200 }, { at: 200, prisms: 400 }]
  },
  // Ticket packs for prisms, once each per event, each step dearer (user photos of the reference's Secret Shop: 500
  // tickets for 50, 100 ... 450 crystals), all cheaper than the 1:1 exchange; and the Dust Shop. Tickets are NEVER sold
  // for real money directly (user): when payments come, money buys prism packs with tickets only as a bonus.
  packs: [50, 100, 150, 200, 250, 300, 350, 400, 450], packTickets: 500,
  dust: { ultra: 1000, wings: 300, aura: 100, orb: 20, pull: 40, orbBuy: 300 },
  welcome: 1000,
  // Altar tiers (user photos of the reference's gacha: three reward rows, each pays "a selection reward" every N pulls of
  // the event; every item has its own limit per event, shown as left / limit). Items: [kind, id, n, limit].
  tiers: [
    { id: 'legend', name: 'Legendary', every: 500, items: [['wings', '', 1, 1], ['aura', '', 1, 2], ['orb', '', 1, 2], ['item', 'chest3', 2, 3], ['item', 'gembox', 3, 3]] },
    { id: 'rare', name: 'Rare', every: 240, items: [['item', 'chest2', 2, 4], ['item', 'petegg', 1, 3], ['item', 'sealbag', 2, 4], ['item', 'wish', 5, 4], ['item', 'gembox', 1, 4], ['item', 'essence', 2, 4]] },
    { id: 'ord', name: 'Ordinary', every: 60, items: [['item', 'exp1', 5, 12], ['item', 'gold1', 5, 12], ['item', 'shardbag', 2, 10], ['item', 'stonebag', 3, 10], ['item', 'chest1', 2, 10], ['item', 'stam', 3, 8]] }
  ],
  // Prism value of each prize, shown on the result card and as "This pull's value".
  values: { ultra: 20000, wings: 3000, aura: 1200, orb: 300, chest3: 400, gembox: 240, petegg: 300, chest2: 160, sealbag: 120, wish: 60, essence: 90, exp1: 20, gold1: 30, shardbag: 60, stonebag: 40, chest1: 50, stam: 30, exp2: 120, gold2: 200, gearbox: 150 },
  value(r) { return (this.values[r.kind === 'item' ? r.id : r.kind] || 20) * (r.n || 1); },
  logMax: 50,
  auraStats: { attack: 150, health: 1500, attackPercent: 3, healthPercent: 3 },
  orbStats: { attack: 40, health: 400 },
  orbSets: [[4, { attackPercent: 2 }], [7, { attackPercent: 2, healthPercent: 3 }], [10, { damageBonus: 5 }]],

  period(now = Date.now()) { return Math.floor((now - this.anchor) / (this.eventDays * 864e5)); },
  rite(period) { const n = this.list.length; return this.list[((period % n) + n) % n]; },
  ends(period) { return this.anchor + (period + 1) * this.eventDays * 864e5; },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  orbName(id) { return (this.orbs.find(o => o[0] === id) || [, id])[1]; },
  milestones(rite) { return [...this.steps, ...(this.extras[rite.extra] || [])].sort((a, b) => a.at - b.at); },

  // The save part, with the event clock applied: a new event starts a fresh counter (tickets stay).
  state(s, now = Date.now()) {
    const p = this.period(now);
    let v = s.rites;
    if (!v) { v = s.rites = { t: {}, auras: {}, aura: '', orbs: {}, dust: 0, ev: null }; v.t[this.rite(p).id] = this.welcome; }
    // The finished event's pull count stays in `prev` for the Wishwell carry-over (src/wishwell.js).
    if (v.ev && v.ev.period !== p && v.ev.pulls > 0) v.prev = { period: v.ev.period, pulls: v.ev.pulls };
    if (!v.ev || v.ev.period !== p) v.ev = { period: p, pulls: 0, luck: 0, got: [], picks: 0, grand: false, packs: [], free: '' };
    return v;
  },
  tickets(s, id) { return (s.rites?.t?.[id]) || 0; },
  freeReady(s, now = Date.now()) { return this.state(s, now).ev.free !== this.day(now); },

  // One prize. Luck and the grand guarantee are checked before chance.
  roll(v, rite, rng) {
    const ev = v.ev, forceGrand = !ev.grand && ev.pulls + 1 >= this.grandAt, forceLuck = ev.luck + 1 >= this.luckMax;
    let tier;
    if (forceGrand) tier = 'wings';
    else {
      const r = rng(), o = this.odds;
      const u = o.ultra; tier = r < u ? 'ultra' : r < u + o.wings ? 'wings' : r < u + o.wings + o.aura ? 'aura' : r < u + o.wings + o.aura + o.orb ? 'orb' : r < u + o.wings + o.aura + o.orb + o.rare ? 'rare' : 'common';
      if (forceLuck && (tier === 'rare' || tier === 'common')) tier = rng() < .15 ? 'aura' : 'orb';
    }
    ev.pulls++; ev.luck = tier === 'rare' || tier === 'common' ? ev.luck + 1 : 0;
    if (tier === 'ultra') return { kind: 'ultra', id: this.ultra.id, name: this.ultra.name, rarity: 'ultra' };
    if (tier === 'wings') { ev.grand = true; return { kind: 'wings', id: rite.wings, name: rite.wingName, rarity: 'legend' }; }
    if (tier === 'aura') return { kind: 'aura', id: rite.id, name: this.auras[rite.id], rarity: 'mythic' };
    if (tier === 'orb') { const o = this.orbs[Math.floor(rng() * this.orbs.length)]; return { kind: 'orb', id: o[0], name: o[1], rarity: 'epic' }; }
    const pool = this[tier]; return { kind: 'item', id: pool[Math.floor(rng() * pool.length)], n: 1, rarity: tier };
  },
  // Gives one prize to the save. Returns what was added (duplicates become stardust).
  give(s, v, r) {
    if (r.kind === 'ultra') {
      s.reinaFashion ??= { owned: 0, equipped: 0 }; const own = s.reinaFashion.wingSkins || [];
      if (own.includes(r.id)) { v.dust += this.dust.ultra; r.dust = this.dust.ultra; } else s.reinaFashion.wingSkins = [...own, r.id];
    } else if (r.kind === 'wings') {
      s.reinaFashion ??= { owned: 0, equipped: 0 }; const own = s.reinaFashion.wingSkins || [];
      if (own.includes(r.id)) { v.dust += this.dust.wings; r.dust = this.dust.wings; }
      else s.reinaFashion.wingSkins = [...own, r.id];
    } else if (r.kind === 'aura') {
      const c = v.auras[r.id] || 0; if (c >= this.auraTiers) { v.dust += this.dust.aura; r.dust = this.dust.aura; } else v.auras[r.id] = c + 1;
      if (!v.aura) v.aura = r.id;
    } else if (r.kind === 'orb') {
      if (v.orbs[r.id]) { v.dust += this.dust.orb; r.dust = this.dust.orb; } v.orbs[r.id] = (v.orbs[r.id] || 0) + 1;
    } else if (r.kind === 'item') { s.bag ??= {}; s.bag[r.id] = (s.bag[r.id] || 0) + r.n; }
    return r;
  },
  // Pays every milestone the counter has passed. Returns the list of paid rows.
  settle(s, v, rite, rng) {
    const next = this.rite(v.ev.period + 1), paid = [];
    for (const m of this.milestones(rite)) {
      if (v.ev.pulls < m.at || v.ev.got.includes(m.at)) continue;
      v.ev.got.push(m.at); const row = { at: m.at };
      if (m.next) { v.t[next.id] = (v.t[next.id] || 0) + m.next; row.next = m.next; row.nextId = next.id; }
      if (m.cur) { v.t[rite.id] = (v.t[rite.id] || 0) + m.cur; row.cur = m.cur; }
      if (m.prisms) { s.scales = (s.scales || 0) + m.prisms; row.prisms = m.prisms; }
      if (m.orb) { const missing = this.orbs.filter(o => !v.orbs[o[0]]), o = (missing.length ? missing : this.orbs)[Math.floor(rng() * (missing.length || this.orbs.length))]; row.orb = this.give(s, v, { kind: 'orb', id: o[0], name: o[1], rarity: 'epic' }); }
      if (m.pick) row.pick = 1;
      paid.push(row);
    }
    return paid;
  },
  picksOpen(s) { const v = s.rites; if (!v?.ev) return 0; const rite = this.rite(v.ev.period); return this.milestones(rite).filter(m => m.pick && v.ev.got.includes(m.at)).length - v.ev.picks; },
  // count = 1 or 10; free = the daily free pull.
  pull(s, count, rng = Math.random, now = Date.now(), free = false) {
    const v = this.state(s, now), rite = this.rite(v.ev.period);
    if (free) { if (count !== 1 || v.ev.free === this.day(now)) return { ok: false, err: 'free' }; v.ev.free = this.day(now); }
    else {
      const need = this.cost * count, short = need - this.tickets(s, rite.id);
      // Auto-purchase: the missing tickets are bought 1:1 with prisms when she turned it on.
      if (short > 0 && v.auto && (s.scales || 0) >= short) { s.scales -= short; v.t[rite.id] = (v.t[rite.id] || 0) + short; }
      if (this.tickets(s, rite.id) < need) return { ok: false, err: 'tickets', need };
      v.t[rite.id] -= need;
    }
    const results = []; for (let i = 0; i < count; i++) results.push(this.give(s, v, this.roll(v, rite, rng)));
    const paid = this.settle(s, v, rite, rng);
    this.record(v, results, now);
    return { ok: true, results, paid, rite, value: results.reduce((a, r) => a + this.value(r), 0) };
  },
  record(v, results, now = Date.now()) { v.log = [...results.map(r => ({ t: now, kind: r.kind, id: r.id, n: r.n || 1, rarity: r.rarity })), ...(v.log || [])].slice(0, this.logMax); },
  // Altar tiers: selections earned = pulls / every; each item has a per-event limit.
  tierOpen(s, tid, now = Date.now()) { const v = this.state(s, now), t = this.tiers.find(x => x.id === tid); return Math.floor(v.ev.pulls / t.every) - ((v.ev.sel || {})[tid] || 0); },
  tierLeft(s, tid, i, now = Date.now()) { const v = this.state(s, now), t = this.tiers.find(x => x.id === tid); return t.items[i][3] - ((v.ev.taken || {})[tid + ':' + i] || 0); },
  // What an altar item means for this rite and save (wings of the running rite, its aura, an orb she lacks first).
  tierPrize(s, tid, i, rng = Math.random) {
    const v = s.rites, rite = this.rite(v.ev.period), [kind, id, n] = this.tiers.find(x => x.id === tid).items[i];
    if (kind === 'wings') return { kind, id: rite.wings, name: rite.wingName, rarity: 'legend' };
    if (kind === 'aura') return { kind, id: rite.id, name: this.auras[rite.id], rarity: 'mythic' };
    if (kind === 'orb') { const missing = this.orbs.filter(o => !v.orbs[o[0]]), pool = missing.length ? missing : this.orbs, o = pool[Math.floor(rng() * pool.length)]; return { kind, id: o[0], name: o[1], rarity: 'epic' }; }
    return { kind: 'item', id, n, rarity: tid === 'ord' ? 'common' : 'rare' };
  },
  tierTake(s, tid, i, rng = Math.random, now = Date.now()) {
    const v = this.state(s, now), t = this.tiers.find(x => x.id === tid);
    if (!t || !t.items[i] || this.tierOpen(s, tid, now) < 1 || this.tierLeft(s, tid, i, now) < 1) return null;
    if (t.items[i][0] === 'wings' && (s.reinaFashion?.wingSkins || []).includes(this.rite(v.ev.period).wings)) return null;
    v.ev.sel = { ...(v.ev.sel || {}), [tid]: ((v.ev.sel || {})[tid] || 0) + 1 }; v.ev.taken = { ...(v.ev.taken || {}), [tid + ':' + i]: ((v.ev.taken || {})[tid + ':' + i] || 0) + 1 };
    const r = this.give(s, v, this.tierPrize(s, tid, i, rng)); this.record(v, [r], now); return r;
  },
  grandProgress(s, now = Date.now()) { const v = this.state(s, now); return v.ev.grand ? 100 : Math.min(100, v.ev.pulls / this.grandAt * 100); },
  // Starfall Vault picks: wings of any rite she lacks, an aura copy of any rite, or an orb of her choice.
  choose(s, kind, id) {
    if (this.picksOpen(s) <= 0) return null; const v = s.rites;
    let r = null;
    if (kind === 'wings') { const rt = this.list.find(x => x.wings === id); if (!rt || (s.reinaFashion?.wingSkins || []).includes(id)) return null; r = { kind, id, name: rt.wingName, rarity: 'legend' }; }
    else if (kind === 'aura') { if (!this.auras[id] || (v.auras[id] || 0) >= this.auraTiers) return null; r = { kind, id, name: this.auras[id], rarity: 'mythic' }; }
    else if (kind === 'orb') { if (!this.orbs.some(o => o[0] === id)) return null; r = { kind, id, name: this.orbName(id), rarity: 'epic' }; }
    if (!r) return null; v.ev.picks++; return this.give(s, v, r);
  },
  buyPack(s, i, now = Date.now()) {
    const v = this.state(s, now), price = this.packs[i], rite = this.rite(v.ev.period);
    if (price === undefined || v.ev.packs.includes(i) || (s.scales || 0) < price) return null;
    s.scales -= price; v.ev.packs.push(i); v.t[rite.id] = (v.t[rite.id] || 0) + this.packTickets; return { tickets: this.packTickets, rite };
  },
  // 1 prism = 1 ticket of the running rite.
  exchange(s, n, now = Date.now()) {
    const v = this.state(s, now), rite = this.rite(v.ev.period);
    if (!(n > 0) || (s.scales || 0) < n) return null; s.scales -= n; v.t[rite.id] = (v.t[rite.id] || 0) + n; return n;
  },
  dustBuy(s, what, id, now = Date.now()) {
    const v = this.state(s, now), rite = this.rite(v.ev.period);
    if (what === 'pull') { if (v.dust < this.dust.pull) return null; v.dust -= this.dust.pull; v.t[rite.id] = (v.t[rite.id] || 0) + this.cost; return { tickets: this.cost }; }
    if (what === 'orb') { if (v.dust < this.dust.orbBuy || !this.orbs.some(o => o[0] === id)) return null; v.dust -= this.dust.orbBuy; return this.give(s, v, { kind: 'orb', id, name: this.orbName(id), rarity: 'epic' }); }
    return null;
  },
  // Starlit Vouchers: universal tickets (boss wheel, dungeon guardians) kept in v.v, swapped 1:1 for tickets of the
  // running rite whenever she likes, so she can save them for the rite she wants.
  vouchers(s) { return s.rites?.v || 0; },
  addVouchers(s, n, now = Date.now()) { if (!(n > 0)) return 0; const v = this.state(s, now); v.v = (v.v || 0) + n; return n; },
  redeem(s, n, now = Date.now()) {
    const v = this.state(s, now), rite = this.rite(v.ev.period); n = Math.floor(n);
    if (!(n > 0) || (v.v || 0) < n) return null; v.v -= n; v.t[rite.id] = (v.t[rite.id] || 0) + n; return { n, rite };
  },
  wear(s, id) { const v = s.rites; if (!v || (id && !v.auras[id])) return false; v.aura = id || ''; return true; },
  auraTier(s, id) { return Math.min(this.auraTiers, s.rites?.auras?.[id] || 0); },
  orbCount(s) { return Object.keys(s.rites?.orbs || {}).length; },
  // Stats: every owned aura (tier x the base), every orb, and the set bonuses.
  bonus(s) {
    const out = {}, add = (o, k = 1) => { for (const [key, n] of Object.entries(o)) out[key] = Math.round(((out[key] || 0) + n * k) * 100) / 100; };
    const v = s.rites; if (!v) return out;
    for (const id of Object.keys(this.auras)) { const t = this.auraTier(s, id); if (t) add(this.auraStats, 1 + (t - 1) * .5); }
    const n = this.orbCount(s); add(this.orbStats, n);
    for (const [k, b] of this.orbSets) if (n >= k) add(b);
    if ((s.reinaFashion?.wingSkins || []).includes(this.ultra.id)) add(this.ultra.stats);
    return out;
  },
  valid(v) {
    if (v === undefined) return true;
    const int = n => Number.isSafeInteger(n) && n >= 0 && n <= 1e9, obj = o => !!o && typeof o === 'object' && !Array.isArray(o);
    if (!obj(v) || !obj(v.t) || !obj(v.auras) || !obj(v.orbs) || !int(v.dust) || typeof v.aura !== 'string' || !(v.v === undefined || int(v.v))) return false;
    if (!Object.entries(v.t).every(([k, n]) => this.list.some(r => r.id === k) && int(n))) return false;
    if (!Object.entries(v.auras).every(([k, n]) => Object.hasOwn(this.auras, k) && int(n) && n >= 1 && n <= this.auraTiers)) return false;
    if (!Object.entries(v.orbs).every(([k, n]) => this.orbs.some(o => o[0] === k) && int(n) && n >= 1)) return false;
    if (v.aura && !v.auras[v.aura]) return false;
    if (!(v.auto === undefined || typeof v.auto === 'boolean') || !(v.log === undefined || Array.isArray(v.log) && v.log.length <= this.logMax)) return false;
    if (v.prev !== undefined && !(obj(v.prev) && Number.isSafeInteger(v.prev.period) && int(v.prev.pulls))) return false;
    const e = v.ev; if (e === null || e === undefined) return true;
    return obj(e) && Number.isSafeInteger(e.period) && int(e.pulls) && int(e.luck) && e.luck < this.luckMax && Array.isArray(e.got) && e.got.every(int)
      && int(e.picks) && typeof e.grand === 'boolean' && Array.isArray(e.packs) && e.packs.every(i => Number.isInteger(i) && i >= 0 && i < this.packs.length) && typeof e.free === 'string';
  }
};

// RITES_UI ------------------------------------------------------------------------------------------------------
let ritesTimer = 0, ritesBusy = false;
const RITE_RAR = { ultra: 'Ultra', legend: 'Legendary', mythic: 'Mythic', epic: 'Epic', rare: 'Rare', common: 'Common' };
function ritesArtVars() {
  const root = document.documentElement; if (!root?.style?.setProperty || root.style.getPropertyValue('--rites-icons')) return;
  root.style.setProperty('--rites-icons', 'url("' + artPath('comp-rites-icons') + '")');
}
// Icon atlas 4 x 4: tickets 0-3, orbs 4-13, luck chest 14, stardust 15.
function riteIcon(n, cls = '') { ritesArtVars(); return `<i class="rt-ico ${cls}" style="background-position:${(n % 4) / 3 * 100}% ${Math.floor(n / 4) / 3 * 100}%"></i>`; }
const riteOrbIcon = id => riteIcon(4 + Rites.orbs.findIndex(o => o[0] === id));
const riteTicket = rite => riteIcon(rite.icon);
function riteClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + 'd ' : '') + h + 'h ' + String(m).padStart(2, '0') + 'm'; }
function riteWingArt(rite, cls = 'rt-wings') { return `<img class="${cls}" src="${artPath(rite.wings)}" alt="${rite.wingName}">`; }
function riteAuraArt(id, cls = 'rt-aura') { return `<img class="${cls}" src="${artPath('comp-rites-aura-' + id)}" alt="${Rites.auras[id]}">`; }
function riteStop() { clearInterval(ritesTimer); ritesTimer = 0; }
function riteTick() { if (screen !== 'rites') return riteStop(); const t = document.querySelector('.rt-time b, .ra-time b'); if (t) t.textContent = riteClock(Rites.ends(Rites.period()) - Date.now()); }
function riteWallet() {
  const v = Rites.state(S), rite = Rites.rite(v.ev.period);
  return `<span class="rt-chip" onclick="riteShop()">${riteTicket(rite)}<b>${fmt(Rites.tickets(S, rite.id))}</b><i>+</i></span><span class="rt-chip" onclick="riteVoucher()">${riteVoucherIcon()}<b>${fmt(Rites.vouchers(S))}</b></span><span class="rt-chip" onclick="riteShop()">${uiIcon('crystals')}<b>${fmt(S.scales || 0)}</b></span>`;
}
// The altar (user photos of the reference's gacha): three prizes on show, grand prize progress, three reward tiers with
// a selection chest each, luck bar, Pull x1 / x10 with ticket-or-prism costs and auto-purchase, record, bottom tabs.
function riteTierArt(tid, i) {
  const rite = Rites.rite(Rites.period()), [kind, id] = Rites.tiers.find(t => t.id === tid).items[i];
  return kind === 'wings' ? riteWingArt(rite, '') : kind === 'aura' ? riteAuraArt(rite.id, '') : kind === 'orb' ? riteIcon(4) : bagIcon(id);
}
function showRites() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const v = Rites.state(S), rite = Rites.rite(v.ev.period), ev = v.ev, free = Rites.freeReady(S), picks = Rites.picksOpen(S);
  const owned = (S.reinaFashion?.wingSkins || []).includes(rite.wings), prog = Rites.grandProgress(S);
  const tierRow = t => {
    const open = Rites.tierOpen(S, t.id), more = t.every - ev.pulls % t.every, pct = (ev.pulls % t.every) / t.every * 100;
    const chest = { legend: 'chest3', rare: 'chest2', ord: 'chest1' }[t.id];
    return `<div class="ra-tier t-${t.id}"><p><b>${t.name}</b><span>${open > 0 ? `<em>${open} selection reward${open > 1 ? 's' : ''} ready!</em>` : `Pull <em>${more}</em> more times for a selection reward`}</span></p>
      <div class="ra-row"><div class="ra-items">${t.items.map((it, i) => { const left = Rites.tierLeft(S, t.id, i); return `<button class="ra-it ${left < 1 ? 'out' : ''}" onclick="riteTier('${t.id}')">${denPlain}<span class="ra-ico">${riteTierArt(t.id, i)}${it[2] > 1 ? `<b>${it[2]}</b>` : ''}</span><small>${left}/${it[3]}</small></button>`; }).join('')}</div>
      <button class="ra-chest ${open > 0 ? 'ready' : ''}" style="--p:${open > 0 ? 100 : pct}" onclick="riteTier('${t.id}')" aria-label="${t.name} selection reward">${denPlain}${bagIcon(chest)}</button></div></div>`;
  };
  const prize = (art, label, cls, kind) => `<button class="ra-orb ${cls}" onclick="riteInfo('${kind}')">${denPlain}<span>${art}</span><small>${label}</small>${kind === 'ultra' ? '<em>ULTRA · ' + (Rites.odds.ultra * 100).toFixed(2) + '%</em>' : ''}</button>`;
  $('#main').innerHTML = `<section class="ra-room rt-${rite.id}" style="--rtbg:url('${artPath('comp-rites-bg-' + rite.id)}');--rthue:${rite.hue}">
   <div class="ra-top"><button class="ra-help" onclick="riteRates()">${denPlain}?</button><span class="ra-time">⏱ <b class="rt-time-b">${riteClock(Rites.ends(ev.period) - Date.now())}</b></span><div class="rt-wallet">${riteWallet()}</div></div>
   <div class="ra-head"><h1><small>STAR RITES</small>${rite.name}</h1><button class="ra-rec" onclick="riteRecord()">${denPlain}${uiIcon('book')}<span>Record</span></button></div>
   <div class="ra-show">${prize(riteWingArt(rite, ''), rite.wingName, 'side l', 'wings')}${prize(`<img src="${artPath(Rites.ultra.id)}" alt="">`, Rites.ultra.name, 'mid ultra', 'ultra')}${prize(riteAuraArt(rite.id, ''), Rites.auras[rite.id], 'side r', 'aura')}</div>
   <p class="ra-prog">${owned ? 'Grand prize owned · a repeat gives ' + Rites.dust.wings + ' stardust' : `Grand prize progress: <b>${prog.toFixed(2)}%</b>`}</p>
   <div class="ra-tiers">${Rites.tiers.map(tierRow).join('')}</div>
   <div class="ra-luck"><span>${bagIcon('chest3')}</span><b>Luck</b><i><s style="width:${ev.luck / Rites.luckMax * 100}%"></s><em>${ev.luck}/${Rites.luckMax}</em></i>${picks > 0 ? `<button class="ra-pick" onclick="ritePick()">${denPlain}✨ ${picks}</button>` : ''}</div>
   <div class="ra-btns">
    <div><small>${free ? 'Free today' : riteTicket(rite) + Rites.cost + ' or ' + uiIcon('crystals') + Rites.cost}</small><button class="ra-pull one" onclick="ritePull(1${free ? ',true' : ''})">${denPlain}${free ? 'Free Pull' : 'Pull ×1'}</button></div>
    <div><small>${riteTicket(rite)}${Rites.cost * 10} or ${uiIcon('crystals')}${Rites.cost * 10}</small><button class="ra-pull ten" onclick="ritePull(10)">${denPlain}Pull ×10</button></div>
   </div>
   <label class="ra-auto"><input type="checkbox" ${v.auto ? 'checked' : ''} onchange="riteAuto(this.checked)"><span>Use prisms when tickets run short</span></label>
   <div class="ra-nav"><button class="ra-back" data-back onclick="go('home')" aria-label="Back">‹</button>
    <button class="on">${denPlain}${riteTicket(rite)}<span>Altar</span></button><button onclick="riteShop()">${denPlain}${uiIcon('crystals')}<span>Shop</span></button><button onclick="riteCollection()">${denPlain}${riteIcon(4)}<span>Collection</span></button><button onclick="riteSteps()">${denPlain}${riteIcon(14)}<span>Rewards</span>${picks > 0 ? '<em></em>' : ''}</button><button onclick="riteSchedule()">${denPlain}${uiIcon('calendar')}<span>Rotation</span></button></div>
  </section>`;
  riteStop(); ritesTimer = setInterval(riteTick, 1000);
}
// Prize card (user photos: tap a prize on the altar for a big picture, its CP and Activation Stats).
const RITE_STAT = { attack: 'ATK', health: 'HP', penetration: 'ARP', defense: 'DEF', attackPercent: 'ATK%', healthPercent: 'HP Bonus', defensePercent: 'DEF Bonus' };
function riteCP(st) { return Math.round((st.attack || 0) * 5 + (st.defense || 0) * 4 + (st.health || 0) / 3 + (st.penetration || 0) * 3 + ((st.attackPercent || 0) + (st.healthPercent || 0) + (st.defensePercent || 0)) * 400); }
function riteInfo(kind) {
  const rite = Rites.rite(Rites.period()), own = S.reinaFashion?.wingSkins || [];
  const it = kind === 'ultra' ? { art: `<img src="${artPath(Rites.ultra.id)}" alt="">`, name: Rites.ultra.name, type: 'Wings Skin · Ultra', stats: Rites.ultra.stats, note: `Every pull of every rite has a ${(Rites.odds.ultra * 100).toFixed(2)}% chance. No pity, never sold.`, owned: own.includes(Rites.ultra.id) }
    : kind === 'wings' ? { art: riteWingArt(rite, ''), name: rite.wingName + ' Wings', type: 'Wings Skin · Legendary', stats: null, note: `Exclusive to ${rite.name}. ${(Rites.odds.wings * 100).toFixed(1)}% a pull, certain by pull ${Rites.grandAt}.`, owned: own.includes(rite.wings) }
    : { art: riteAuraArt(rite.id, ''), name: Rites.auras[rite.id], type: 'Aura · Mythic', stats: Rites.auraStats, note: `${(Rites.odds.aura * 100).toFixed(1)}% a pull. Copies raise it up to T${Rites.auraTiers}.`, owned: Rites.auraTier(S, rite.id) > 0 };
  const st = it.stats ? Object.entries(it.stats).map(([k, n]) => `<p class="${/Percent/.test(k) ? 'pct' : ''}">${/Percent/.test(k) ? '★ ' : ''}${RITE_STAT[k] || k} +${/Percent/.test(k) ? n.toFixed(2) + '%' : fmt(n)}</p>`).join('') : '<p>Look only: shown on Reina in every scene.</p>';
  popup(`<div class="ri-card k-${kind}"><div class="ri-stage"><i class="ri-rays"></i>${it.art}${it.stats ? `<b class="ri-cp">⚔ ${fmt(riteCP(it.stats))}</b>` : ''}</div>
   <div class="ri-head"><span class="ri-ico">${it.art}</span><div><b>${it.name}</b><small>Type: <em>${it.type}</em></small></div></div>
   <div class="ri-body"><p>${it.note}</p>${it.stats ? `<p>Activated CP: <em>+${fmt(riteCP(it.stats))}</em></p>` : ''}<h4>◆ Activation Stats</h4>${st}${it.owned ? '<p class="ri-own">✓ Owned</p>' : ''}</div></div>`);
}
function riteAuto(on) { const v = Rites.state(S); v.auto = !!on; save(); toast(on ? 'Missing tickets will be bought with prisms' : 'Auto-purchase off'); }
function riteTier(tid) {
  const t = Rites.tiers.find(x => x.id === tid), open = Rites.tierOpen(S, tid), v = Rites.state(S), more = t.every - v.ev.pulls % t.every;
  const own = (S.reinaFashion?.wingSkins || []).includes(Rites.rite(v.ev.period).wings);
  popup(`<div class="rt-pop ra-tpop"><h2>${t.name} selection</h2><p>${open > 0 ? `Choose <b>${open}</b> reward${open > 1 ? 's' : ''}.` : `Every ${t.every} pulls of this rite open one choice. ${more} to go.`}</p>
   <div class="ra-tgrid">${t.items.map((it, i) => { const left = Rites.tierLeft(S, tid, i), r = Rites.tierPrize(S, tid, i, () => 0), no = left < 1 || (it[0] === 'wings' && own);
    const name = r.kind === 'item' ? WonderGear.bagItemById[r.id].name : r.kind === 'wings' ? r.name + ' Wings' : r.kind === 'orb' ? 'A Wish Orb' : r.name;
    return `<button class="ra-tc ${no ? 'out' : ''}" ${open > 0 && !no ? `onclick="riteTake('${tid}',${i})"` : ''}>${denPlain}<span class="ra-ico">${riteTierArt(tid, i)}${it[2] > 1 ? `<b>${it[2]}</b>` : ''}</span><strong>${name}</strong><small>${no && it[0] === 'wings' && own ? 'Owned' : 'Left ' + left + '/' + it[3]}</small></button>`; }).join('')}</div></div>`);
}
function riteTake(tid, i) { const r = Rites.tierTake(S, tid, i); if (!r) return toast('Not available'); save(); $('#modal').close(); showRites(); riteShow({ results: [r], paid: [], rite: Rites.rite(Rites.period()), value: Rites.value(r), pick: true }); }
function riteRecord() {
  const v = Rites.state(S), log = v.log || [];
  const name = r => r.kind === 'item' ? (WonderGear.bagItemById[r.id]?.name || r.id) + (r.n > 1 ? ' ×' + r.n : '') : r.kind === 'wings' ? (Rites.list.find(x => x.wings === r.id)?.wingName || '') + ' Wings' : r.kind === 'aura' ? Rites.auras[r.id] : Rites.orbName(r.id);
  popup(`<div class="rt-pop"><h2>Pull Record</h2>${log.length ? `<div class="ra-log">${log.map(r => `<p class="r-${r.rarity}"><span>${new Date(r.t).toISOString().slice(5, 16).replace('T', ' ')}</span><b>${name(r)}</b><em>${RITE_RAR[r.rarity] || ''}</em></p>`).join('')}</div>` : '<p>No pulls yet.</p>'}<p><small>The last ${Rites.logMax} prizes.</small></p></div>`);
}
function riteStepText(m, rite) {
  const next = Rites.rite(Rites.period() + 1), bits = [];
  if (m.next) bits.push(riteTicket(next) + fmt(m.next));
  if (m.cur) bits.push(riteTicket(rite) + fmt(m.cur));
  if (m.orb) bits.push(riteIcon(4) + 'new orb');
  if (m.prisms) bits.push(uiIcon('crystals') + fmt(m.prisms));
  if (m.pick) bits.push('✨ prize of your choice');
  return bits.join(' ');
}
function ritePull(count, free = false) {
  if (ritesBusy) return;
  const res = Rites.pull(S, count, Math.random, Date.now(), free);
  if (!res.ok) {
    if (res.err === 'tickets') { const rite = Rites.rite(Rites.period()), short = res.need - Rites.tickets(S, rite.id);
      return popup(`<div class="rt-pop"><h2>Not enough ${rite.ticket}s</h2><p>${count} pull${count > 1 ? 's' : ''} cost ${riteTicket(rite)}${fmt(res.need)}. You need ${fmt(short)} more.</p>
       <div class="rt-row"><button class="primary" onclick="riteExchange(${short},${count})">${denPlain}Exchange ${uiIcon('crystals')}${fmt(short)} prisms and pull</button><button onclick="riteShop()">${denPlain}Ticket packs</button></div></div>`); }
    return toast('The free pull is back tomorrow');
  }
  if (typeof trailTick === 'function') trailTick('pull', res.results.length);
  save(); showRites(); riteShow(res);
}
function riteExchange(n, count) { $('#modal').close(); if (!Rites.exchange(S, n)) return toast('Not enough prisms'); ritePull(count); }
// Result window: cards turn up one by one; legendary and mythic ones get a burst.
function riteCard(r, i) {
  const art = r.kind === 'wings' ? `<img src="${artPath(Rites.list.find(x => x.wings === r.id).wings)}" alt="">` : r.kind === 'aura' ? `<img src="${artPath('comp-rites-aura-' + r.id)}" alt="">` : r.kind === 'orb' ? riteOrbIcon(r.id) : (typeof bagIcon === 'function' ? bagIcon(r.id) : '');
  const name = r.kind === 'item' ? (WonderGear.bagItems.find(b => b.id === r.id)?.name || r.id) : r.kind === 'wings' ? r.name + ' Wings' : r.name;
  return `<div class="rt-card r-${r.rarity}" style="--d:${.12 + i * .11}s"><span class="rt-cart">${art}</span><b>${name}</b><small>${RITE_RAR[r.rarity]}${r.dust ? ' · +' + r.dust + ' dust' : ''}</small></div>`;
}
function riteShow(res) {
  if (typeof bagArtVars === 'function') bagArtVars();
  const big = res.results.find(r => r.rarity === 'legend') || res.results.find(r => r.rarity === 'mythic');
  const value = res.value ?? res.results.reduce((a, r) => a + Rites.value(r), 0), n = res.results.length, rite = res.rite, perfect = big || res.results.some(r => r.rarity === 'epic');
  const paid = res.paid.length ? `<div class="rt-paid"><small>Rewards reached</small>${res.paid.map(p => `<span>${p.at} pulls: ${[p.next ? riteTicket(Rites.list.find(x => x.id === p.nextId)) + fmt(p.next) : '', p.cur ? riteTicket(rite) + fmt(p.cur) : '', p.prisms ? uiIcon('crystals') + fmt(p.prisms) : '', p.orb ? riteOrbIcon(p.orb.id) + p.orb.name : '', p.pick ? '✨ choose a prize' : ''].filter(Boolean).join(' ')}</span>`).join('')}</div>` : '';
  popup(`<div class="rt-result ra-res ${big ? 'big r-' + big.rarity : ''}"><div class="ra-rhead"><i></i><h2>Congratulations</h2></div>${big ? `<div class="rt-burst"><i></i><b>${big.rarity === 'legend' ? 'GRAND PRIZE!' : 'MYTHIC AURA!'}</b></div>` : ''}
   <p class="ra-kicker">${res.pick ? 'Selection reward' : perfect ? 'Splendid pull' : rite.name}</p>
   <div class="rt-cards n${n}">${res.results.map((r, i) => riteCard(r, i).replace('</small></div>', `</small><em class="ra-val">${uiIcon('crystals')}${fmt(Rites.value(r))}</em></div>`)).join('')}</div>${paid}
   <div class="ra-value"><small>This pull's value</small><b>${uiIcon('crystals')}${fmt(value)}</b></div>
   <div class="rt-row ra-rbtn"><button class="ra-confirm" onclick="$('#modal').close()">${denPlain}Confirm</button>${res.pick ? '' : `<button class="ra-again" onclick="$('#modal').close();ritePull(${n})">${denPlain}<span>Try Again</span><small>${riteTicket(rite)}${Rites.cost * n} or ${uiIcon('crystals')}${Rites.cost * n}</small></button>`}</div></div>`);
}
function riteRates() {
  const o = Rites.odds, common = 1 - o.wings - o.aura - o.orb - o.rare, pct = x => (Math.round(x * 1000) / 10).toFixed(1) + '%', rite = Rites.rite(Rites.period());
  popup(`<div class="rt-pop"><h2>Rates · ${rite.name}</h2><table class="rt-rates">
   <tr class="r-legend"><td>Legendary</td><td>${rite.wingName} Wings</td><td>${pct(o.wings)}</td></tr>
   <tr class="r-mythic"><td>Mythic</td><td>${Rites.auras[rite.id]} (aura)</td><td>${pct(o.aura)}</td></tr>
   <tr class="r-epic"><td>Epic</td><td>One of ten Wish Orbs</td><td>${pct(o.orb)}</td></tr>
   <tr class="r-rare"><td>Rare</td><td>${Rites.rare.map(id => WonderGear.bagItems.find(b => b.id === id)?.name).join(', ')}</td><td>${pct(o.rare)}</td></tr>
   <tr class="r-common"><td>Common</td><td>${Rites.common.map(id => WonderGear.bagItems.find(b => b.id === id)?.name).join(', ')}</td><td>${pct(common)}</td></tr></table>
   <p>Luck: an orb or better is certain within ${Rites.luckMax} pulls. The grand prize is certain by pull ${Rites.grandAt} of this rite. One pull or ten, the odds are the same.</p></div>`);
}
function riteSteps() {
  const v = Rites.state(S), rite = Rites.rite(v.ev.period);
  popup(`<div class="rt-pop"><h2>Rewards · ${rite.name}</h2><p>Paid automatically as you reach them. Tickets for <b>${Rites.rite(v.ev.period + 1).name}</b> (the next rite) keep the circle going.</p>
   <ol class="rt-steps">${Rites.milestones(rite).map(m => `<li class="${v.ev.got.includes(m.at) ? 'done' : v.ev.pulls >= m.at ? 'due' : ''}"><b>${m.at}</b><span>${riteStepText(m, rite)}</span><i>${v.ev.got.includes(m.at) ? '✓' : fmt(Math.max(0, m.at - v.ev.pulls)) + ' to go'}</i></li>`).join('')}
    <li class="${v.ev.grand ? 'done' : ''}"><b>${Rites.grandAt}</b><span>${rite.wingName} Wings (grand prize, if not won before)</span><i>${v.ev.grand ? '✓' : fmt(Math.max(0, Rites.grandAt - v.ev.pulls)) + ' to go'}</i></li></ol>
   ${Rites.picksOpen(S) > 0 ? `<button class="primary" onclick="ritePick()">${denPlain}Choose your prize</button>` : ''}</div>`);
}
function ritePick() {
  const v = Rites.state(S), own = S.reinaFashion?.wingSkins || [];
  popup(`<div class="rt-pop"><h2>Choose your Starfall prize</h2><p>${Rites.picksOpen(S)} choice${Rites.picksOpen(S) > 1 ? 's' : ''} open.</p>
   <h3>Wings</h3><div class="rt-pick">${Rites.list.map(r => `<button ${own.includes(r.wings) ? 'disabled' : ''} onclick="riteChoose('wings','${r.wings}')">${denPlain}${riteWingArt(r, '')}<small>${r.wingName}${own.includes(r.wings) ? ' ✓' : ''}</small></button>`).join('')}</div>
   <h3>Auras</h3><div class="rt-pick">${Rites.list.map(r => `<button ${Rites.auraTier(S, r.id) >= Rites.auraTiers ? 'disabled' : ''} onclick="riteChoose('aura','${r.id}')">${denPlain}${riteAuraArt(r.id, '')}<small>${Rites.auras[r.id]} · T${Rites.auraTier(S, r.id)}</small></button>`).join('')}</div>
   <h3>Wish Orbs</h3><div class="rt-pick orbs">${Rites.orbs.map(([id, name]) => `<button onclick="riteChoose('orb','${id}')">${denPlain}${riteOrbIcon(id)}<small>${name}${v.orbs[id] ? ' ✓' : ''}</small></button>`).join('')}</div></div>`);
}
function riteChoose(kind, id) { const r = Rites.choose(S, kind, id); if (!r) return toast('Not available'); save(); showRites(); riteShow({ results: [r], paid: [], rite: Rites.rite(Rites.period()) }); }
function riteShop() {
  const v = Rites.state(S), rite = Rites.rite(v.ev.period);
  popup(`<div class="rt-pop"><h2>Rite Shop</h2><p>Packs refresh with every rite. ${riteTicket(rite)} ${rite.ticket}: <b>${fmt(Rites.tickets(S, rite.id))}</b> · ${uiIcon('crystals')} <b>${fmt(S.scales || 0)}</b></p>
   <div class="rt-packs">${Rites.packs.map((p, i) => `<button ${v.ev.packs.includes(i) ? 'disabled' : ''} onclick="riteBuyPack(${i})">${denPlain}${riteTicket(rite)}<b>${fmt(Rites.packTickets)}</b><small>${v.ev.packs.includes(i) ? 'Bought' : uiIcon('crystals') + p}</small>${p < Rites.packTickets ? `<em>-${Math.round((1 - p / Rites.packTickets) * 100)}%</em>` : ''}</button>`).join('')}</div>
   <div class="rt-vbar">${riteVoucherIcon()}<span><b>${fmt(Rites.vouchers(S))} Starlit Vouchers</b><small>Universal: swap 1:1 for ${rite.ticket}s</small></span><button ${Rites.vouchers(S) ? '' : 'disabled'} onclick="riteRedeem()">${denPlain}Swap all</button></div>
   <div class="rt-row"><button onclick="riteExchangeOnly(${Rites.cost})">${denPlain}${uiIcon('crystals')}${Rites.cost} → ${riteTicket(rite)}${Rites.cost}</button><button onclick="riteExchangeOnly(${Rites.cost * 10})">${denPlain}${uiIcon('crystals')}${Rites.cost * 10} → ${riteTicket(rite)}${Rites.cost * 10}</button></div>
   <h3>Dust Shop · ${riteIcon(15)} ${fmt(v.dust)} stardust</h3><p class="rt-small">Repeats turn into stardust: wings ${Rites.dust.wings}, a full aura ${Rites.dust.aura}, an orb ${Rites.dust.orb}.</p>
   <div class="rt-row"><button ${v.dust < Rites.dust.pull ? 'disabled' : ''} onclick="riteDust('pull')">${denPlain}${riteIcon(15)}${Rites.dust.pull} → ${riteTicket(rite)}${Rites.cost}</button><button ${v.dust < Rites.dust.orbBuy ? 'disabled' : ''} onclick="riteDustOrb()">${denPlain}${riteIcon(15)}${Rites.dust.orbBuy} → an orb you choose</button></div></div>`);
}
function riteVoucherIcon(cls = '') { return `<img class="rt-vico ${cls}" src="${artPath('comp-rites-voucher')}" alt="Starlit Voucher">`; }
// Item card of the universal ticket, like the reference's item tooltips (the .den-item card).
function riteVoucher() {
  const v = Rites.state(S), rite = Rites.rite(v.ev.period), n = Rites.vouchers(S);
  popup(`<div class="den-item rt-vcard"><div class="den-item-head">${riteVoucherIcon('big')}<div><b>Starlit Voucher</b><small>Usable at: any level</small><small>Type: <em>Universal ticket</em></small></div></div>
   <h3>Item Description</h3><p>Won on the boss wheel and from dungeon guardians. Swap it 1:1 for tickets of the Star Rite that is running, whenever you like: save them for the rite you love.</p>
   <p>You have <b>${fmt(n)}</b>. Running now: ${riteTicket(rite)} <b>${rite.name}</b>.</p>
   <div class="rt-row"><button class="primary" ${n ? '' : 'disabled'} onclick="riteRedeem()">${denPlain}Swap ${fmt(n)} for ${rite.ticket}s</button></div></div>`);
}
function riteRedeem() { const r = Rites.redeem(S, Rites.vouchers(S)); if (!r) return toast('No Starlit Vouchers yet'); save(); $('#modal').close(); if (screen === 'rites') showRites(); toast('+' + fmt(r.n) + ' ' + r.rite.ticket + 's'); }
function riteBuyPack(i) { if (!Rites.buyPack(S, i)) return toast('Not enough prisms'); save(); riteShop(); showRitesKeep(); toast('+' + Rites.packTickets + ' tickets'); }
function riteExchangeOnly(n) { if (!Rites.exchange(S, n)) return toast('Not enough prisms'); save(); riteShop(); showRitesKeep(); toast('+' + n + ' tickets'); }
function riteDust(what) { if (!Rites.dustBuy(S, what)) return toast('Not enough stardust'); save(); riteShop(); showRitesKeep(); }
function riteDustOrb() { popup(`<div class="rt-pop"><h2>Choose an orb</h2><div class="rt-pick orbs">${Rites.orbs.map(([id, name]) => `<button onclick="riteDustBuyOrb('${id}')">${denPlain}${riteOrbIcon(id)}<small>${name}${S.rites.orbs[id] ? ' ✓' : ''}</small></button>`).join('')}</div></div>`); }
function riteDustBuyOrb(id) { const r = Rites.dustBuy(S, 'orb', id); if (!r) return toast('Not enough stardust'); save(); showRites(); riteShow({ results: [r], paid: [], rite: Rites.rite(Rites.period()) }); }
// Keeps the room behind a pop-up current without closing the pop-up.
function showRitesKeep() { const top = document.querySelector('.rt-wallet'); if (top) top.innerHTML = riteWallet(); }
function riteCollection() {
  const v = Rites.state(S), n = Rites.orbCount(S), b = Rites.bonus(S), stat = o => Object.entries(o).map(([k, x]) => `${{ attack: 'ATK', health: 'HP', attackPercent: 'ATK %', healthPercent: 'HP %', damageBonus: 'DMG %' }[k] || k} +${fmt(x)}`).join(' · ');
  popup(`<div class="rt-pop rt-coll"><h2>Star Rites Collection</h2>
   <h3>Auras <small>(wear one; every aura you own gives stats)</small></h3><div class="rt-pick">${Rites.list.map(r => { const t = Rites.auraTier(S, r.id); return `<button class="${v.aura === r.id ? 'on' : ''} ${t ? '' : 'locked'}" onclick="riteWear('${r.id}')">${denPlain}${riteAuraArt(r.id, '')}<small>${Rites.auras[r.id]}<br>${t ? 'T' + t + (v.aura === r.id ? ' · worn' : ' · tap to wear') : 'From ' + r.name}</small></button>`; }).join('')}</div>
   <h3>Wish Orbs ${n} / ${Rites.orbs.length}</h3><div class="rt-pick orbs">${Rites.orbs.map(([id, name]) => `<span class="${v.orbs[id] ? '' : 'locked'}">${riteOrbIcon(id)}<small>${name}</small></span>`).join('')}</div>
   <p class="rt-small">Orb set: ${Rites.orbSets.map(([k, o]) => `<b class="${n >= k ? 'on' : ''}">${k}: ${stat(o)}</b>`).join(' · ')}</p>
   <h3>Exclusive wings</h3><div class="rt-pick">${Rites.list.map(r => { const has = (S.reinaFashion?.wingSkins || []).includes(r.wings); return `<span class="${has ? '' : 'locked'}">${riteWingArt(r, '')}<small>${r.wingName}${has ? ' ✓ (Fashion → Wings)' : ''}</small></span>`; }).join('')}</div>
   <p class="rt-total">Total from Star Rites: ${stat(b) || 'nothing yet'}</p></div>`);
}
function riteWear(id) { const v = S.rites; if (!v.auras[id]) return toast('Win this aura in ' + Rites.list.find(r => r.id === id).name); Rites.wear(S, v.aura === id ? '' : id); save(); riteCollection(); }
function riteSchedule() {
  const p = Rites.period();
  popup(`<div class="rt-pop"><h2>Rite rotation</h2><p>Each rite runs ${Rites.eventDays} days; the four take turns. Tickets never expire, so save them for the rite you love.</p>
   <ol class="rt-steps">${[0, 1, 2, 3].map(k => { const r = Rites.rite(p + k); return `<li class="${k ? '' : 'due'}">${riteTicket(r)}<span><b>${r.name}</b> · ${r.wingName} Wings · ${Rites.auras[r.id]}<br><small>${k ? 'Starts in ' + riteClock(Rites.ends(p + k - 1) - Date.now()) : 'Now · ends in ' + riteClock(Rites.ends(p) - Date.now())} · ${fmt(Rites.tickets(S, r.id))} ${r.ticket}s</small></span></li>`; }).join('')}</ol></div>`);
}
function riteRules() {
  popup(`<div class="rt-pop"><h2>Star Rites</h2><ol class="rt-rules"><li>Four rites take turns, ${Rites.eventDays} days each. Each has its own ticket; tickets never expire.</li>
   <li>A pull costs ${Rites.cost} tickets. Ten pulls cost ${Rites.cost * 10}; the odds are the same. One free pull a day.</li>
   <li>Luck rises with every pull: an orb or better is certain within ${Rites.luckMax} pulls.</li>
   <li>The rite's exclusive wings are certain by pull ${Rites.grandAt} of the rite.</li>
   <li>Pull rewards pay tickets of the next rite. Moonwell Rite and Dragon Hoard also return their own tickets; Starfall Vault lets you choose a prize at 360, 720 and 800 pulls; Celestial Bloom pays prisms on its Petal Path.</li>
   <li>Auras and orbs give stats for good. Repeats become stardust for the Dust Shop.</li>
   <li>Tickets come from the free pull, rewards, the Rite Shop (prisms) and the welcome gift.</li></ol></div>`);
}
