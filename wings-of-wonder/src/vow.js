// Blossom Vow (user photos of the reference's couple event, no text; own names and art). Reina bonds with ONE AI
// friend for the event (2 days, user) and they send each other Red Roses, Blossom Rings and Heart Roseboxes. A gift gives
// intimacy, Love Lock EXP (a lasting level with small stats) and, only between the two bonded partners when the
// gifting is mutual, Bond Points x2 for the team. Bond Points, the daily Oath Goal and purchase counts reset at 00:00
// UTC; each day's couple ranking (20 slots, simulated AI couples) closes at 21:00 UTC and pays once by mail. Oath Test:
// dungeon guardians drop gifts; Oath Witness: a short bouquet-catching scene and +15% EXP the next day if her couple was
// No.1. All numbers are placeholders. Rules first (pure, tested by scripts/test-vow.mjs), the screen below VOW_UI.
const Vow = {
  eventDays: 2, anchor: Date.UTC(2026, 10, 23), closeHour: 21, ceremony: [21 * 60 + 10, 21 * 60 + 30],
  gifts: { rose: { name: 'Red Rose', pts: 120, lock: 29, card: 'b' }, ring: { name: 'Blossom Ring', pts: 520, lock: 99, card: 'p' }, box: { name: 'Heart Rosebox', pts: 1314, lock: 199, card: 'o' } },
  giftIds: ['rose', 'ring', 'box'],
  // Own items kept in S.vow (everything else in a reward is a bag item or gold). Order = comp-vow-icons atlas.
  icons: ['rose', 'ring', 'box', 'lock', 'crystal', 'point', 'badge', 'bouquet'],
  names: { rose: 'Red Rose', ring: 'Blossom Ring', box: 'Heart Rosebox', crystal: 'Heart Crystal', lock: 'Love Lock', point: 'Bond Point', bouquet: 'Bouquet' },
  freeRoses: 3, msgMax: 20, sendMax: 99, mutual: 2, replyOdds: .6, replyRing: .15,
  topNeed: 10000, rankNeed: 1314, partNeed: 520, slots: 20, topSlots: 3,
  lockStep: 150, lockMax: 30, lockStats: { attack: 12, health: 120, defense: 6 },
  expBuff: 15, dropDaily: 10, dropOdds: { rose: 1, ring: .15, box: .04 },
  venueSecs: 25, venueDaily: 12, venueCeremony: 24, venueGive: { rose: .35 }, venueCrystals: 2,
  goals: [{ at: 520, give: { rose: 2, crystal: 3, exp1: 2, gold1: 1 } }, { at: 1314, give: { ring: 1, crystal: 5, chest1: 2, stonebag: 2 } },
    { at: 5200, give: { ring: 2, crystal: 8, chest2: 1, shardbag: 2 } }, { at: 13140, give: { box: 1, crystal: 12, chest3: 1, gembox: 2 } }],
  ranks: [{ from: 1, to: 1, give: { crystal: 35, box: 2, chest3: 2, exp2: 3 } }, { from: 2, to: 3, give: { crystal: 25, box: 1, chest3: 1, exp2: 2 } },
    { from: 4, to: 10, give: { crystal: 15, ring: 2, chest2: 2, exp2: 1 } }, { from: 11, to: 20, give: { crystal: 10, ring: 1, chest2: 1, exp1: 3 } }],
  part: { give: { crystal: 10, rose: 3 } },
  // Bond Gift shop (gold / prisms / heart crystals) and the Oath Ceremony packs (prisms only). Limits are per UTC day.
  wares: [{ id: 'rose', item: 'rose', n: 1, cost: { gold: 2000 }, limit: 10 }, { id: 'ring', item: 'ring', n: 1, cost: { prisms: 60 }, limit: 5 },
    { id: 'box', item: 'box', n: 1, cost: { prisms: 150 }, limit: 3 }, { id: 'ringc', item: 'ring', n: 1, cost: { crystal: 30 }, limit: 5 },
    { id: 'boxc', item: 'box', n: 1, cost: { crystal: 80 }, limit: 2 }],
  packs: [{ id: 'p1', name: 'Petal Pack', limit: 1, price: 60, was: 600, give: { rose: 10, ring: 1, crystal: 10, chest1: 2 } },
    { id: 'p2', name: 'Promise Pack', limit: 3, price: 198, was: 990, give: { rose: 15, ring: 3, crystal: 20, chest2: 1 } },
    { id: 'p3', name: 'Vow Pack', limit: 5, price: 680, was: 3400, give: { ring: 8, box: 2, crystal: 40, chest2: 2 } },
    { id: 'p4', name: 'Eternal Pack', limit: 5, price: 1280, was: 3200, give: { ring: 5, box: 5, crystal: 60, chest3: 1 } }],
  aiNames: ['Aster', 'Briar', 'Cael', 'Dara', 'Elio', 'Faye', 'Gwyn', 'Hale', 'Isra', 'Jory', 'Kestrel', 'Lark', 'Mira', 'Nyx', 'Oren', 'Pell', 'Quinn', 'Rhea',
    'Sol', 'Teo', 'Una', 'Vey', 'Wren', 'Xyla', 'Yori', 'Zane', 'Arlo', 'Bree', 'Cato', 'Dune', 'Elowen', 'Fen', 'Gale', 'Hollis', 'Ione', 'Jace', 'Kaia', 'Lio', 'Maren', 'Niko'],
  aiCouples: 20,
  // ---- clock ----
  period(now = Date.now()) { return Math.floor((now - this.anchor) / (this.eventDays * 864e5)); },
  starts(p) { return this.anchor + p * this.eventDays * 864e5; },
  ends(p) { return this.starts(p + 1); },
  day(t) { return Math.floor(t / 864e5); },
  closeAt(d) { return d * 864e5 + this.closeHour * 36e5; },
  closed(now) { return now >= this.closeAt(this.day(now)); },
  inCeremony(now) { const m = Math.floor(now % 864e5 / 6e4); return m >= this.ceremony[0] && m < this.ceremony[1]; },
  mix(a, b) { let h = (a * 2654435761 + b * 40503 + 97) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; },
  hash(s) { let h = 7; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 2147483647; return h; },
  // ---- state (S.vow, optional) ----
  fresh(now) {
    const d = this.day(now);
    return { period: this.period(now), day: d, partner: null, bond: 0, pts: 0, back: 0, sends: 0, gifts: { rose: this.freeRoses, ring: 0, box: 0 }, crystal: 0, lock: 0,
      goal: [], buys: {}, drops: 0, venue: 0, paid: -1, last: null, buff: -1, log: [] };
  },
  // Team score: only mutual gifting inside the team counts, and then double for both (her sends + the partner's).
  team(v) { return v.pts > 0 && v.back > 0 ? this.mutual * (v.pts + v.back) : 0; },
  // The score of the day; after 21:00 UTC the ranking is closed and the score stays as it was at the close.
  score(v) { return v.frozen ?? this.team(v); },
  // Bring a save up to now. Pays (returns `due`) the ranking of a closed day once: after 21:00, or when a new day starts.
  roll(saved, now = Date.now()) {
    let v = saved ? JSON.parse(JSON.stringify(saved)) : this.fresh(now), due = null;
    const settle = () => { if (v.paid === v.day) return; const sc = this.score(v), rank = sc ? this.rankOf(sc, v.day) : 0, give = this.rewardFor(rank, sc);
      v.paid = v.day; v.last = { day: v.day, rank, score: sc }; if (rank === 1) v.buff = v.day + 1; if (give) due = { day: v.day, rank, score: sc, give }; };
    if (v.day !== this.day(now)) {
      if (v.day < this.day(now)) settle();
      v.day = this.day(now); v.pts = 0; v.back = 0; v.sends = 0; delete v.frozen; v.goal = []; v.buys = {}; v.drops = 0; v.venue = 0;
      v.gifts.rose = Math.min(9999, v.gifts.rose + this.freeRoses);
    }
    if (v.period !== this.period(now)) { v.period = this.period(now); v.partner = null; v.bond = 0; delete v.moved; }
    if (this.closed(now)) settle();
    return { v, due };
  },
  rewardFor(rank, score) { const t = this.ranks.find(r => rank >= r.from && rank <= r.to); return t ? t.give : score >= this.partNeed ? this.part.give : null; },
  // ---- partner ----
  bond(v, id) { if (v.partner || !id) return false; v.partner = id; v.bond = 0; return true; },
  // Bond Transfer: once per event she may pass her vow to another partner for a fee (heart crystals or prisms).
  // Today's Bond Points stay with her; the new partner starts with no bond and no return gifts yet.
  transferCost: { crystal: 30, prisms: 120 },
  transfer(v, id, pay, wallet) {
    if (!v.partner || !id || id === v.partner || v.moved) return { ok: false, err: v.moved ? 'once' : 'who' };
    const c = this.transferCost[pay]; if (!c) return { ok: false, err: 'pay' };
    if (pay === 'crystal') { if (v.crystal < c) return { ok: false, err: 'crystal' }; v.crystal -= c; }
    else { if ((wallet.scales || 0) < c) return { ok: false, err: 'prisms' }; wallet.scales -= c; }
    const from = v.partner; v.partner = id; v.bond = 0; v.back = 0; v.moved = true; return { ok: true, from };
  },
  // One send: n gifts of a kind to `to` (the partner or any friend), with a short message. Applies everything.
  send(v, to, gift, n = 1, msg = '', now = Date.now()) {
    const g = this.gifts[gift]; n = Math.floor(n);
    if (!g) return { ok: false, err: 'gift' }; if (!to) return { ok: false, err: 'who' };
    if (!(n >= 1 && n <= this.sendMax)) return { ok: false, err: 'count' }; if ((v.gifts[gift] || 0) < n) return { ok: false, err: 'few' };
    const clean = String(msg || '').replace(/[<>]/g, '').slice(0, this.msgMax), lv0 = this.lockLevel(v.lock).lv, before = this.score(v);
    v.gifts[gift] -= n; v.lock = Math.min(1e9, v.lock + g.lock * n);
    let reply = null;
    if (to === v.partner) {
      if (this.closed(now) && v.frozen === undefined) v.frozen = this.team(v);
      const k = v.sends++, r = this.mix(v.day * 13 + this.hash(to), k);
      if (k === 0 || r < this.replyOdds) { reply = r < this.replyOdds * this.replyRing ? 'ring' : 'rose'; v.back += this.gifts[reply].pts; }
      v.pts += g.pts * n; v.bond = Math.min(1e9, v.bond + g.pts * n + (reply ? this.gifts[reply].pts : 0));
    }
    v.log.unshift({ t: now, to, gift, n, msg: clean }); v.log = v.log.slice(0, 10);
    return { ok: true, intim: g.pts * n, lockExp: g.lock * n, gained: this.score(v) - before, reply, partner: to === v.partner, lockUp: this.lockLevel(v.lock).lv - lv0, msg: clean };
  },
  // ---- Love Lock ----
  lockLevel(exp) { let lv = 0, left = exp; while (lv < this.lockMax && left >= (lv + 1) * this.lockStep) { left -= (lv + 1) * this.lockStep; lv++; } return { lv, into: left, need: lv < this.lockMax ? (lv + 1) * this.lockStep : 0 }; },
  lockBonus(lv) { return Object.fromEntries(Object.entries(this.lockStats).map(([k, n]) => [k, n * lv])); },
  bonus(save) { const v = save && save.vow; return v && Number.isInteger(v.lock) ? this.lockBonus(this.lockLevel(v.lock).lv) : {}; },
  buffOn(v, now = Date.now()) { return !!v && v.buff === this.day(now) ? this.expBuff : 0; },
  // ---- goals, shop, packs, drops, venue ----
  claimGoal(v, i) { const g = this.goals[i]; if (!g || v.goal.includes(i) || this.score(v) < g.at) return null; v.goal.push(i); return g.give; },
  // Adds the event's own items to v and returns the rest (bag items and gold) for the caller.
  take(v, give) { const rest = {}; for (const [k, n] of Object.entries(give || {})) { if (this.gifts[k]) v.gifts[k] = Math.min(9999, v.gifts[k] + n); else if (k === 'crystal') v.crystal = Math.min(1e6, v.crystal + n); else rest[k] = n; } return rest; },
  left(v, id) { const w = this.wares.find(x => x.id === id) || this.packs.find(x => x.id === id); return w ? Math.max(0, w.limit - (v.buys[id] || 0)) : 0; },
  // wallet = the save ({gold, scales}); pays the price and returns what the ware gives.
  buy(v, id, wallet) {
    const w = this.wares.find(x => x.id === id), p = this.packs.find(x => x.id === id); if (!w && !p) return { ok: false, err: 'ware' };
    if (!this.left(v, id)) return { ok: false, err: 'limit' };
    const cost = w ? w.cost : { prisms: p.price };
    if ((cost.gold || 0) > wallet.gold) return { ok: false, err: 'gold' }; if ((cost.prisms || 0) > wallet.scales) return { ok: false, err: 'prisms' }; if ((cost.crystal || 0) > v.crystal) return { ok: false, err: 'crystal' };
    wallet.gold -= cost.gold || 0; wallet.scales -= cost.prisms || 0; v.crystal -= cost.crystal || 0; v.buys[id] = (v.buys[id] || 0) + 1;
    return { ok: true, give: w ? { [w.item]: w.n } : { ...p.give } };
  },
  off(p) { return Math.round((1 - p.price / p.was) * 100); },
  // A dungeon guardian win during the event: a rose, sometimes a ring or a box, up to dropDaily a day.
  drop(v, rng = Math.random) { if (v.drops >= this.dropDaily) return null; v.drops++; const got = {}; for (const [k, p] of Object.entries(this.dropOdds)) if (rng() < p) got[k] = 1; this.take(v, got); return got; },
  venueCap(now) { return this.inCeremony(now) ? this.venueCeremony : this.venueDaily; },
  // A caught bouquet: a rose or heart crystals, up to the day's cap (then it is only for fun).
  venueCatch(v, now = Date.now(), rng = Math.random) { if (v.venue >= this.venueCap(now)) return null; v.venue++; const got = rng() < this.venueGive.rose ? { rose: 1 } : { crystal: this.venueCrystals }; this.take(v, got); return got; },
  // ---- simulated AI couples and the daily ranking ----
  progress(d, now) { return Math.min(1, Math.max(0, (now - d * 864e5) / (this.closeHour * 36e5))); },
  couples(d, now = Date.now()) {
    // Every AI adventurer is in at most one couple a day: a shuffled name list, taken two by two.
    const f = this.progress(d, now), order = this.aiNames.map((_, i) => i).sort((a, b) => this.mix(d * 7 + 1, a) - this.mix(d * 7 + 1, b));
    return Array.from({ length: this.aiCouples }, (_, i) => ({ names: [this.aiNames[order[2 * i]], this.aiNames[order[2 * i + 1]]], ai: true,
      score: Math.round((300 + Math.pow(this.mix(d * 7 + 3, i), 1.8) * 16000) * Math.pow(f, .8)) }));
  },
  // Twenty slots: 1-3 need topNeed, 4-20 need rankNeed. Couples that miss the top need fill the slots from 4 on.
  board(d, now = Date.now(), mine = null) {
    const all = this.couples(d, now); if (mine && mine.score > 0) all.push(mine);
    all.sort((a, b) => b.score - a.score || (a.me ? 1 : 0) - (b.me ? 1 : 0));
    const top = all.filter(c => c.score >= this.topNeed).slice(0, this.topSlots), rest = all.filter(c => !top.includes(c) && c.score >= this.rankNeed).slice(0, this.slots - this.topSlots);
    return Array.from({ length: this.slots }, (_, i) => ({ no: i + 1, need: i < this.topSlots ? this.topNeed : this.rankNeed, couple: i < this.topSlots ? top[i] || null : rest[i - this.topSlots] || null }));
  },
  rankOf(score, d, now = this.closeAt(d)) { const row = this.board(d, now, { me: true, score }).find(r => r.couple && r.couple.me); return row ? row.no : 0; },
  valid(v) {
    const int = (n, m = 1e9) => Number.isInteger(n) && n >= 0 && n <= m, obj = o => !!o && typeof o === 'object' && !Array.isArray(o), id = x => typeof x === 'string' && /^[a-z]{1,16}$/.test(x);
    const allBuys = [...this.wares, ...this.packs];
    return obj(v) && Number.isInteger(v.period) && Number.isInteger(v.day) && (v.partner === null || id(v.partner)) && int(v.bond) && int(v.pts) && int(v.back) && int(v.sends, 1e5)
      && (v.frozen === undefined || int(v.frozen)) && (v.moved === undefined || v.moved === true) && obj(v.gifts) && this.giftIds.every(k => int(v.gifts[k], 9999)) && Object.keys(v.gifts).length === 3 && int(v.crystal, 1e6) && int(v.lock)
      && Array.isArray(v.goal) && new Set(v.goal).size === v.goal.length && v.goal.every(i => int(i, this.goals.length - 1))
      && obj(v.buys) && Object.entries(v.buys).every(([k, n]) => { const w = allBuys.find(x => x.id === k); return !!w && int(n, w.limit); })
      && int(v.drops, this.dropDaily) && int(v.venue, this.venueCeremony) && Number.isInteger(v.paid) && Number.isInteger(v.buff)
      && (v.last === null || obj(v.last) && Number.isInteger(v.last.day) && int(v.last.rank, this.slots) && int(v.last.score))
      && Array.isArray(v.log) && v.log.length <= 10 && v.log.every(l => obj(l) && Number.isFinite(l.t) && id(l.to) && !!this.gifts[l.gift] && int(l.n, this.sendMax) && typeof l.msg === 'string' && l.msg.length <= this.msgMax);
  }
};

// VOW_UI
let vowTab = 'main', vowTimer = 0, vowSel = { gift: 'rose', n: 1, to: '', msg: '' }, vowFind = 'Friends', vowVenue = null;
const vwFolk = () => (typeof WonderGear !== 'undefined' ? WonderGear.socialById : {}) || {};
function vwName(id) { return id === 'me' ? (S.name || 'Reina') : vwFolk()[id]?.name || id; }
function vwFace(id) { return typeof folkFace === 'function' ? folkFace(id) : ''; }
function vwIco(k, cls = '') { const n = Vow.icons.indexOf(k); return `<i class="vw-ico ${cls}" style="background-position:${(n % 4) / 3 * 100}% ${Math.floor(n / 4) * 100}%"></i>`; }
function vwNav(n) { return `<i class="vw-nico" style="background-position:${(n % 3) / 2 * 100}% ${Math.floor(n / 3) * 100}%"></i>`; }
function vwTile(k, n) {
  if (Vow.icons.includes(k)) return `<span class="vw-tile" title="${Vow.names[k]}">${vwIco(k)}<b>${fmt(n)}</b></span>`;
  if (k === 'gold') return `<span class="vw-tile">${uiIcon('gold')}<b>${fmt(n)}</b></span>`;
  const it = WonderGear.bagItemById[k]; return `<span class="vw-tile" title="${it ? it.name : k}">${typeof bagIcon === 'function' ? bagIcon(k) : ''}<b>${fmt(n)}</b></span>`;
}
function vwTiles(give) { if (typeof bagArtVars === 'function') bagArtVars(); return Object.entries(give || {}).map(([k, n]) => vwTile(k, n)).join(''); }
function vwClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)); return String(Math.floor(s / 3600)).padStart(2, '0') + ':' + String(Math.floor(s % 3600 / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function vowLeftLabel(now = Date.now()) { const s = Math.max(0, Vow.ends(Vow.period(now)) - now) / 1000, d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600); return d ? d + ' d ' + h + ' h' : h + ' h ' + Math.floor(s % 3600 / 60) + ' m'; }
function vowCountText(now = Date.now()) { const d = Vow.day(now); return Vow.closed(now) ? 'Ranking closed · new day in ' + vwClock((d + 1) * 864e5 - now) : 'Ranking closes in ' + vwClock(Vow.closeAt(d) - now); }
// State with the clock applied; a closed day's ranking reward is mailed once (event items go straight to S.vow).
function vowState() {
  const { v, due } = Vow.roll(S.vow, Date.now());
  if (due) {
    const rest = Vow.take(v, due.give), mail = {}; for (const [k, n] of Object.entries(rest)) if (WonderGear.bagItemById[k]) mail[k] = Math.min(99, n);
    const label = due.rank ? 'No.' + due.rank : 'participation';
    if (WonderGear.mailGift) WonderGear.mailGift(S, { title: 'Blossom Vow: ' + label, from: 'Blossom Herald', text: 'The couple ranking of the day closed at 21:00 UTC. Your place: ' + label + ' (' + fmt(due.score) + ' Bond Points). Event gifts went straight to your Blossom Vow pouch.', items: mail });
    else for (const [k, n] of Object.entries(rest)) WonderGear.bagAdd(S, k, n);
    if (WonderGear.socialNote) WonderGear.socialNote(S, 'Blossom Vow: ranking reward (' + label + ') sent by mail.');
    if (typeof toast === 'function') toast('Blossom Vow reward (' + label + ') sent by mail');
    if (due.rank === 1 && typeof titleGrant === 'function') titleGrant('sweetheart');
  }
  S.vow = v; return v;
}
function vowPay(give) { const rest = Vow.take(S.vow, give); for (const [k, n] of Object.entries(rest)) { if (k === 'gold') S.gold += n; else WonderGear.bagAdd(S, k, n); } }
function vowStop() { clearInterval(vowTimer); vowTimer = 0; if (vowVenue) { clearInterval(vowVenue.timer); vowVenue = null; } }
function vowTick() {
  if (screen !== 'vow') return vowStop();
  const v = S.vow, now = Date.now(); if (!v) return;
  if (v.day !== Vow.day(now) || (Vow.closed(now) && v.paid !== v.day)) return showVow();
  const c = document.querySelector('.vw-count'); if (c) c.textContent = vowCountText(now);
}
function vowChrome(title, sub, body, extra = '') {
  const v = S.vow, tabs = [['main', 'Blossom Vow', 0], ['goal', 'Oath Goal', 1], ['ceremony', 'Oath Ceremony', 2], ['test', 'Oath Test', 3], ['witness', 'Oath Witness', 4]];
  const goalDot = Vow.goals.some((g, i) => Vow.score(v) >= g.at && !v.goal.includes(i));
  return `<section class="vw-room vw-tab-${vowTab}" style="--vwbg:url('${artPath('comp-vow-bg')}');--vwico:url('${artPath('comp-vow-icons')}');--vwnav:url('${artPath('comp-vow-nav')}');--vwbadge:url('${artPath('comp-vow-badges')}');--vwcouple:url('${artPath('comp-vow-couple')}')">
   <div class="vw-top"><span class="vw-chip">${vwIco('point')}My Point: <b>${fmt(Vow.score(v))}</b></span><span class="vw-wallet"><span>${uiIcon('gold')}${fmt(S.gold)}</span><span><img src="${artPath('hud-prisms')}" alt="">${fmt(S.scales)}</span><span>${vwIco('crystal')}${fmt(v.crystal)}</span></span></div>
   <h1 class="vw-title">${title}</h1>${sub ? `<div class="vw-ribbon">${sub}</div>` : ''}<div class="vw-count">${vowCountText()}</div>
   <button class="vw-help" aria-label="Rules" onclick="vowRules()">${denPlain}?</button>${body}${extra}
   <div class="vw-nav"><button data-back aria-label="Back" onclick="go('home')">‹</button>${tabs.map(([id, t, n]) => `<button class="${vowTab === id ? 'on' : ''}" onclick="vowGo('${id}')">${denPlain}${vwNav(n)}<small>${t}</small>${id === 'goal' && goalDot ? '<em></em>' : ''}</button>`).join('')}</div></section>`;
}
// The atlases as CSS variables on the page root, so pop-ups (outside the room) can use them too.
function vowArtVars() { const r = document.documentElement; if (!r?.style?.setProperty) return; for (const [k, id] of [['--vwico', 'comp-vow-icons'], ['--vwnav', 'comp-vow-nav'], ['--vwbadge', 'comp-vow-badges'], ['--vwcouple', 'comp-vow-couple']]) r.style.setProperty(k, `url('${artPath(id)}')`); }
function vowGo(tab) { if (tab === 'bond') return vowBondPop(); if (tab === 'shop') return vowShopPop(); vowTab = tab; if (typeof screenChangedAt !== 'undefined') screenChangedAt = Date.now(); showVow(); }
function showVow() {
  const v = vowState(); save(); vowStop(); vowArtVars();
  if (vowTab === 'goal') vowGoal(v); else if (vowTab === 'ceremony') vowCeremony(v); else if (vowTab === 'test') vowTest(v); else if (vowTab === 'witness') vowWitness(v);
  else if (vowTab === 'venue') vowVenueView(v); else vowMain(v);
  if (vowTab !== 'venue') vowTimer = setInterval(vowTick, 1000);
}
// The four buttons under the main page all open pop-ups in the same .vp style (user: "some say coming soon, some
// change the page - clean it up, make them consistent").
function vowSubTabs() {
  return `<div class="vw-subs">${[['Partner Bond', 'vowBondPop()'], ['Bond Transfer', 'vowTransferPop()'], ['Bond Gift', 'vowShopPop()'], ['Bond Reward', 'vowRewards()']]
    .map(([t, f]) => `<button onclick="${f}">${denPlain}${t}</button>`).join('')}</div>`;
}
function vowListScroll(el) { el.parentElement?.classList.toggle('end', el.scrollTop + el.clientHeight >= el.scrollHeight - 4); }
function vowMain(v) {
  const me = Vow.score(v), mine = v.partner ? { me: true, names: [S.name || 'Reina', vwName(v.partner)], score: me } : null, rows = Vow.board(v.day, Date.now(), mine);
  const list = rows.map(r => { const c = r.couple, badge = r.no <= 3 ? `<i class="vw-badge" style="background-position:${(r.no - 1) * 50}% 0"><b>${r.no}</b></i>` : `<i class="vw-no">No.${r.no}</i>`;
    return `<div class="vw-row ${c?.me ? 'me' : ''} ${r.no <= 3 ? 'top' : ''}">${badge}<div><b>${c ? esc(c.names[0]) + ' <u>♥</u> ' + esc(c.names[1]) + (c.ai ? ' <small>AI</small>' : '') : 'Vacant'}</b><span>${c ? fmt(c.score) + ' pts' : 'Reach ' + fmt(r.need) + ' Points to get ranked'}</span></div></div>`; }).join('');
  const body = `<div class="vw-stage"><img class="vw-hero" src="${reinaLookPath(false)}" alt="Reina">${v.partner ? `<span class="vw-pair">${vwFace(v.partner)}<b>${esc(vwName(v.partner))} <small>AI</small></b></span>` : ''}</div>
   <button class="vw-gift" onclick="vowRewards()">${denPlain}${vwNav(5)}<small>Ranking Reward</small></button>
   <div class="vw-board"><div class="vw-bhead"><b>Today's couples</b><small>Swipe to see all ${rows.length}</small></div><div class="vw-list" onscroll="vowListScroll(this)">${list}</div><i class="vw-more">▾</i>
    <div class="vw-mine">${mine ? (() => { const r = rows.find(x => x.couple?.me); return r ? `<b>No.${r.no}</b> You ♥ ${esc(vwName(v.partner))} · ${fmt(me)} pts` : `Not ranked yet · ${fmt(me)} / ${fmt(Vow.rankNeed)} pts`; })() : 'Find a partner to join the ranking'}</div></div>
   <div class="vw-cta"><button class="vw-big" onclick="vowFindPop()">${denPlain}${v.partner ? 'Partner: ' + esc(vwName(v.partner)) : 'Searching Partner'}${v.partner ? '' : '<em></em>'}</button><button class="vw-big" onclick="vowSendPop()">${denPlain}Send Oath</button></div>${vowSubTabs()}`;
  $('#main').innerHTML = vowChrome('Blossom Vow', 'Petals bind two hearts', body);
}
function vowGoal(v) {
  const sc = Vow.score(v), closed = Vow.closed(Date.now());
  const rows = Vow.goals.map((g, i) => { const got = v.goal.includes(i), ok = sc >= g.at;
    const btn = got ? '<span class="vw-stamp done">Claimed</span>' : ok ? `<button class="vw-claim" onclick="vowClaimGoal(${i})">${denPlain}Claim</button>` : closed ? '<span class="vw-stamp miss">Missed target</span>' : `<span class="vw-prog">${fmt(sc)}/${fmt(g.at)}</span>`;
    return `<div class="vw-card"><h3>Reach ${fmt(g.at)} Bond Points to claim</h3><div class="vw-cbody"><div class="vw-tiles">${vwTiles(g.give)}</div>${btn}</div></div>`; }).join('');
  $('#main').innerHTML = vowChrome('Oath Goal', 'Daily goals reset at 00:00 UTC', `<div class="vw-cards">${rows}</div>`);
}
function vowClaimGoal(i) { const g = Vow.claimGoal(S.vow, i); if (!g) return; vowPay(g); save(); showVow(); toast('Oath Goal reward claimed'); }
function vowCeremony(v) {
  const rows = Vow.packs.map((p, i) => { const left = Vow.left(v, p.id);
    return `<div class="vw-card"><h3>Pack ${i + 1} · ${p.name} <small>(${left} left today)</small></h3><div class="vw-cbody"><i class="vw-off"><b>${Vow.off(p)}%</b>off!</i><div class="vw-tiles">${vwTiles(p.give)}</div>
     <button class="vw-price" ${left ? '' : 'disabled'} onclick="vowBuy('${p.id}')">${denPlain}${left ? `<span><img src="${artPath('hud-prisms')}" alt="">${fmt(p.price)}</span><s>${fmt(p.was)}</s>` : 'Sold out'}</button></div></div>`; }).join('');
  $('#main').innerHTML = vowChrome('Oath Ceremony', 'Blessings of the blossom shrine', `<img class="vw-shrine" src="${artPath('comp-vow-shrine')}" alt=""><div class="vw-cards">${rows}</div>`);
}
function vowBuy(id) {
  const r = Vow.buy(S.vow, id, S); if (!r.ok) return toast({ limit: 'Sold out for today', gold: 'Not enough gold', prisms: 'Not enough prisms', crystal: 'Not enough heart crystals' }[r.err] || 'Cannot buy');
  vowPay(r.give); save(); showVow(); toast('Bought · added to your pouch and bag');
}
function vowTest(v) {
  const p = v.period, f = t => new Date(t).toISOString().slice(5, 16).replace('T', ' ');
  const body = `<div class="vw-parch"><b class="vw-tag">Event</b><p>Duration: ${f(Vow.starts(p))} — ${f(Vow.ends(p))} UTC</p><p>During the event, defeating dungeon guardians drops love gifts (up to ${Vow.dropDaily} a day, today ${v.drops}/${Vow.dropDaily}).</p>
   <b class="vw-tag">Drop Preview</b><div class="vw-drops">${Vow.giftIds.map(k => `<span class="vw-dcard c-${Vow.gifts[k].card}">${vwIco(k)}<small>${Vow.gifts[k].name}</small><em>${Math.round(Vow.dropOdds[k] * 100)}%</em></span>`).join('')}</div>
   <button class="vw-go" onclick="go('dungeons')">${denPlain}Go challenge</button></div>`;
  $('#main').innerHTML = vowChrome('Oath Test', 'Prove your devotion in battle', body);
}
function vowWitness(v) {
  const cards = [['Until 21:00 UTC the No.1 couple earns the Ceremony Parade.', 0], ['21:10 – 21:30 UTC the Oath Ceremony begins.', 1], ['Join the parade: catch bouquets, send blessings and make wishes for gifts.', 2], [`Next day: EXP +${Vow.expBuff}% if the No.1 couple is yours.`, 3]];
  const buff = Vow.buffOn(v) ? `<p class="vw-buff">EXP +${Vow.expBuff}% is active today!</p>` : '';
  const body = `<div class="vw-photo"><img src="${artPath('comp-vow-couple')}" alt="A couple under the blossom tree"></div>${buff}<div class="vw-wcards">${cards.map(([t, n]) => `<div class="vw-wcard"><i style="background-position:${['27% 16%', '50% 50%', '60% 8%', '92% 24%'][n]}"></i><p>${t}</p></div>`).join('')}</div>
   <button class="vw-go" onclick="vowGo('venue')">${denPlain}Enter the Venue</button>`;
  $('#main').innerHTML = vowChrome('Oath Witness', 'A sincere oath, witnessed by all', body);
}
function vpHead(t) { return `<div class="vp-head"><h2>${t}</h2><span class="vp-petal l"></span><span class="vp-petal r"></span></div>`; }
function vpPair(v, sub) { const p = v.partner; return `<div class="vp-pair"><span class="vp-face me">${portrait('reina')}</span><i>♥</i><span class="vp-face">${p ? vwFace(p) : '<b class="vp-q">?</b>'}</span><p><b>${p ? esc(S.name || 'Reina') + ' &amp; ' + esc(vwName(p)) : 'No partner yet'}</b><small>${sub}</small></p></div>`; }
function vowBondPop() {
  const v = vowState(), p = v.partner, lk = Vow.lockLevel(v.lock), now = Vow.lockBonus(lk.lv), next = Vow.lockBonus(Math.min(Vow.lockMax, lk.lv + 1));
  popup(`<div class="vp vp-bond">${vpHead('Partner Bond')}${vpPair(v, p ? 'Bond this event: ' + fmt(v.bond) + ' intimacy · team ' + fmt(Vow.score(v)) + ' pts' : 'One partner per event')}
   ${p ? `<div class="vp-row"><span>Intimacy</span><span class="vp-hearts big">${vowHearts(p)}</span></div>` : `<button class="vp-wide" onclick="vowFindPop()">${denPlain}Find a partner</button>`}
   <div class="vp-lock">${vwIco('lock', 'big')}<div><b>Love Lock Lv. ${lk.lv}</b><span class="vp-bar"><u style="width:${lk.need ? lk.into / lk.need * 100 : 100}%"></u></span><small>${lk.need ? fmt(lk.into) + ' / ' + fmt(lk.need) + ' EXP to Lv. ' + (lk.lv + 1) : 'Max level'}</small></div></div>
   <div class="vp-stats">${Object.keys(Vow.lockStats).map(k => `<span><small>${{ attack: 'ATK', health: 'HP', defense: 'DEF' }[k]}</small><b>+${fmt(now[k])}</b>${lk.lv < Vow.lockMax ? `<em>▲ ${fmt(next[k])}</em>` : ''}</span>`).join('')}</div>
   <p class="vp-lead">Every gift raises the Love Lock for good: rose +${Vow.gifts.rose.lock}, ring +${Vow.gifts.ring.lock}, rosebox +${Vow.gifts.box.lock} EXP.</p>
   ${p ? `<button class="vp-wide" onclick="vowSendPop()">${denPlain}Send the Oath</button>` : ''}</div>`);
}
let vowMoveTo = '';
function vowTransferPop() {
  const v = vowState(), soc = WonderGear.socialState ? WonderGear.socialState(S) : { friends: [] }, p = v.partner;
  if (!p) return popup(`<div class="vp">${vpHead('Bond Transfer')}${vpPair(v, 'Bond with someone first')}<p class="vp-lead">Bond Transfer passes your vow to another gentleman. Find a partner first.</p><button class="vp-wide" onclick="vowFindPop()">${denPlain}Find a partner</button></div>`);
  const men = vowMen(Object.keys(vwFolk())).filter(id => id !== p); if (!men.includes(vowMoveTo)) vowMoveTo = men.find(id => soc.friends.includes(id)) || men[0] || '';
  const c = Vow.transferCost;
  popup(`<div class="vp vp-move">${vpHead('Bond Transfer')}${vpPair(v, v.moved ? 'Transfer already used this event' : 'Once per event')}
   <p class="vp-lead">Pass your vow to another gentleman. Today's Bond Points stay yours; the new bond starts fresh.</p>
   <div class="vp-who">${men.map(id => `<button class="${id === vowMoveTo ? 'on' : ''}" ${v.moved ? 'disabled' : ''} onclick="vowMoveTo='${id}';vowTransferPop()">${denPlain}${vwFace(id)}<small>${esc(vwName(id))}</small></button>`).join('')}</div>
   ${v.moved ? '<p class="vp-empty">You have already transferred your vow this event. A new event starts with a free choice.</p>' : `<div class="vp-two">
    <button class="vp-pay" onclick="vowTransfer('crystal')">${denPlain}<span>${vwIco('crystal')}${fmt(c.crystal)}</span><small>Heart crystals · you have ${fmt(v.crystal)}</small></button>
    <button class="vp-pay alt" onclick="vowTransfer('prisms')">${denPlain}<span><img src="${artPath('hud-prisms')}" alt="">${fmt(c.prisms)}</span><small>Prisms · you have ${fmt(S.scales || 0)}</small></button></div>`}</div>`);
}
function vowTransfer(pay) {
  const r = Vow.transfer(S.vow, vowMoveTo, pay, S); if (!r.ok) return toast({ once: 'Already transferred this event', who: 'Choose a new partner', crystal: 'Not enough heart crystals', prisms: 'Not enough prisms' }[r.err] || 'Cannot transfer');
  if (WonderGear.socialNote) WonderGear.socialNote(S, 'Blossom Vow passed from ' + vwName(r.from) + ' to ' + vwName(vowMoveTo) + '.');
  save(); document.querySelector('#modal')?.close?.(); showVow(); toast(vwName(vowMoveTo) + ' (AI) is your partner now');
}
function vowShopPop() {
  const v = vowState();
  const rows = Vow.wares.map(w => { const left = Vow.left(v, w.id), [ck, cn] = Object.entries(w.cost)[0], cur = ck === 'gold' ? uiIcon('gold') : ck === 'prisms' ? `<img src="${artPath('hud-prisms')}" alt="">` : vwIco('crystal'), g = Vow.gifts[w.item];
    return `<div class="vp-card"><span class="vp-gico c-${g ? g.card : 'b'}">${vwIco(w.item, 'big')}</span><div class="vp-info"><b>${Vow.names[w.item]}</b><span class="vp-tag">${g ? '♥ +' + fmt(g.pts) + ' · 🔒 +' + g.lock : ''}</span><span class="vp-tag">${left}/${w.limit} left today · you have ${fmt(v.gifts[w.item] || 0)}</span></div><button class="vp-invite vp-price" ${left ? '' : 'disabled'} onclick="vowBuyPop('${w.id}')">${denPlain}${left ? `<span>${cur}${fmt(cn)}</span>` : 'Sold out'}</button></div>`; }).join('');
  popup(`<div class="vp vp-shop">${vpHead('Bond Gift')}<div class="vp-own">${Vow.giftIds.map(k => `<span>${vwIco(k)}<b>${fmt(v.gifts[k])}</b></span>`).join('')}<span>${vwIco('crystal')}<b>${fmt(v.crystal)}</b></span></div>
   <div class="vp-list">${rows}</div><p class="vp-lead">+${Vow.freeRoses} free Red Roses every day · limits reset at 00:00 UTC.</p></div>`);
}
function vowBuyPop(id) {
  const r = Vow.buy(S.vow, id, S); if (!r.ok) return toast({ limit: 'Sold out for today', gold: 'Not enough gold', prisms: 'Not enough prisms', crystal: 'Not enough heart crystals' }[r.err] || 'Cannot buy');
  vowPay(r.give); save(); vowShopPop(); toast('Bought!');
}
function vowSoon(name) { popup(`<div class="vw-pop"><h2>${name}</h2><p class="vw-note">Coming soon.</p></div>`); }
function vowRules() {
  popup(`<div class="vw-pop"><h2>Blossom Vow</h2><ol class="vw-rules"><li>Bond with one AI friend for the event (${Vow.eventDays} days); you two are a team.</li><li>Only mutual gifts inside the team count, and they count double for both.</li>
   <li>Points, Oath Goals and purchase limits reset every day at 00:00 UTC.</li><li>The ranking closes at 21:00 UTC; rewards come by mail. ${fmt(Vow.rankNeed)} points to be listed.</li><li>Everyone else here is an AI adventurer.</li></ol></div>`);
}
function vowRewards() {
  const v = S.vow, rank = Vow.score(v) ? Vow.rankOf(Vow.score(v), v.day, Date.now()) : 0;
  const rows = Vow.ranks.map(t => [t.from === t.to ? 'No.' + t.from : 'No.' + t.from + '–' + t.to, t.give, t.from]).concat([['Reach ' + fmt(Vow.partNeed), Vow.part.give, 99]]);
  popup(`<div class="vp vp-rew">${vpHead('Bond Reward')}<div class="vp-pair one"><p><b>Current reward: ${rank ? 'No.' + rank : 'not ranked'}</b><small>Sent by mail after 21:00 UTC${v.last ? ' · last day: ' + (v.last.rank ? 'No.' + v.last.rank : 'not ranked') + ', ' + fmt(v.last.score) + ' pts' : ''}</small></p></div>
   <div class="vp-list">${rows.map(([t, g, n]) => `<div class="vp-card rw ${n <= 3 ? 'top t' + n : ''}"><span class="vp-rank">${n <= 3 ? `<i class="vw-badge" style="background-position:${(n - 1) * 50}% 0"></i>` : ''}<b>${t}</b></span><div class="vw-tiles">${vwTiles(g)}</div></div>`).join('')}</div></div>`);
}
// Searching Partner (user: "opposite sex; much better, stylish pop-ups"): only young men can bond with Reina
// (`VOW_PARTNER_SEX`). Friends = her male friends, Guild = male guild members, Nearby = every other male AI
// adventurer, Cross-Server = nobody. Each card: portrait in a gold ring, name, level, intimacy hearts, Invite.
const VOW_PARTNER_SEX = 'm', VOW_TAGS = { kael: 'Gallant knight · loves red roses', pip: 'Cheerful tinkerer · loves sweet gifts', orin: 'Silver-haired sage · loves rings',
  vesper: 'Mysterious ranger · loves moonlit walks', thane: 'Quiet wanderer · loves wild flowers' };
function vowMen(ids) { return ids.filter(id => vwFolk()[id]?.sex === VOW_PARTNER_SEX); }
function vowHearts(id) { const soc = WonderGear.socialState ? WonderGear.socialState(S) : { hearts: {} }, h = (soc.hearts?.[id] || 0) / 100; return Array.from({ length: 5 }, (_, i) => `<i class="${h >= i + 1 ? 'on' : h > i ? 'half' : ''}">♥</i>`).join(''); }
function vowFindPop(tab = vowFind) {
  vowFind = tab; const v = S.vow, soc = WonderGear.socialState ? WonderGear.socialState(S) : { friends: [] }, g = WonderGear.guildState ? WonderGear.guildState(S) : null;
  const all = Object.keys(vwFolk()), friends = vowMen(soc.friends), guild = vowMen(g ? g.members : []);
  const ids = tab === 'Friends' ? friends : tab === 'Guild' ? guild : tab === 'Nearby' ? vowMen(all).filter(id => !friends.includes(id)) : [];
  const lv = id => Math.max(1, (typeof level === 'function' ? level() : 1) + (vwFolk()[id]?.lv || 0));
  const empty = tab === 'Guild' && !g ? 'Join a guild to meet its members.' : tab === 'Cross-Server' ? 'Nobody from other realms yet — everyone in Sky Garden is an AI adventurer.' : 'No one here yet. Try another tab.';
  const list = ids.length ? ids.map(id => `<div class="vp-card ${v.partner === id ? 'is' : ''}"><span class="vp-face">${vwFace(id)}</span><div class="vp-info"><b>${esc(vwName(id))}<small>AI</small><em>Lv. ${lv(id)}</em></b><span class="vp-hearts">${vowHearts(id)}</span><span class="vp-tag">${VOW_TAGS[id] || 'Brave adventurer'}</span></div>${v.partner === id ? '<span class="vp-bonded">♥ Bonded</span>' : `<button class="vp-invite" ${v.partner ? 'disabled' : ''} onclick="vowInvite('${id}')">${denPlain}Invite</button>`}</div>`).join('')
    : `<p class="vp-empty">${empty}</p>`;
  const head = v.partner ? `<div class="vp-pair"><span class="vp-face me">${portrait('reina')}</span><i>♥</i><span class="vp-face">${vwFace(v.partner)}</span><p><b>${esc(S.name || 'Reina')} &amp; ${esc(vwName(v.partner))}</b><small>Your vow for this event</small></p></div>`
    : `<p class="vp-lead">Choose a gentleman to share your vow with in this event. Mutual gifts count double!</p>`;
  popup(`<div class="vp vp-find"><div class="vp-head"><h2>Searching Partner</h2><span class="vp-petal l"></span><span class="vp-petal r"></span></div>${head}
   <div class="vp-tabs">${['Friends', 'Nearby', 'Guild', 'Cross-Server'].map(t => `<button class="${t === tab ? 'on' : ''}" onclick="vowFindPop('${t}')">${denPlain}${t}</button>`).join('')}</div>
   <div class="vp-list">${list}</div></div>`);
}
function vowInvite(id) { if (S.vow.partner || vwFolk()[id]?.sex !== VOW_PARTNER_SEX) return; toast('Invitation sent to ' + vwName(id) + '…'); setTimeout(() => vowAccept(id), 1200); }
function vowAccept(id) {
  if (!Vow.bond(S.vow, id)) return; if (WonderGear.socialNote) WonderGear.socialNote(S, vwName(id) + ' accepted your Blossom Vow.');
  save(); if (screen === 'vow') { document.querySelector('#modal')?.close?.(); showVow(); } toast(vwName(id) + ' (AI) accepted! You are a team now.');
}
// Send the Oath: Reina ♥ recipient at the top (tap a face to choose; the partner and her male friends), three gift
// cards, a note, a stepper and a gold Send button that names what is sent and the points it earns.
function vowSendPop() {
  const v = S.vow, soc = WonderGear.socialState ? WonderGear.socialState(S) : { friends: [] }, who = [...new Set([v.partner, ...vowMen(soc.friends)].filter(Boolean))];
  if (!who.includes(vowSel.to)) vowSel.to = v.partner || who[0] || '';
  const k = vowSel.gift, g = Vow.gifts[k], have = v.gifts[k] || 0; vowSel.n = Math.max(1, Math.min(vowSel.n, Math.max(1, have), Vow.sendMax));
  const cards = Vow.giftIds.map(id => { const x = Vow.gifts[id]; return `<button class="vp-gift c-${x.card} ${k === id ? 'on' : ''}" onclick="vowPick('${id}')">${denPlain}<em>×${fmt(v.gifts[id])}</em><i class="vp-i" onclick="event.stopPropagation();vowItem('${id}')">i</i>${vwIco(id, 'big')}<b>${x.name}</b><small>♥ +${fmt(x.pts)}</small><small>🔒 +${x.lock}</small></button>`; }).join('');
  const toTeam = vowSel.to && vowSel.to === v.partner, pts = toTeam ? g.pts * vowSel.n * Vow.mutual : 0;
  popup(`<div class="vp vp-send"><div class="vp-head"><h2>Send the Oath</h2><span class="vp-petal l"></span><span class="vp-petal r"></span></div>
   <div class="vp-pair"><span class="vp-face me">${portrait('reina')}</span><i>♥</i><span class="vp-face">${vowSel.to ? vwFace(vowSel.to) : '<b class="vp-q">?</b>'}</span><p><b>${vowSel.to ? 'To ' + esc(vwName(vowSel.to)) : 'Choose who receives it'}</b><small>${vowSel.to ? (toTeam ? 'Your partner · Bond Points ×' + Vow.mutual : 'A friend · intimacy only') : 'Find a partner first'}</small></p></div>
   ${who.length > 1 ? `<div class="vp-who">${who.map(id => `<button class="${id === vowSel.to ? 'on' : ''}" onclick="vowSel.to='${id}';vowSendPop()">${denPlain}${vwFace(id)}<small>${esc(vwName(id))}${id === v.partner ? ' ♥' : ''}</small></button>`).join('')}</div>` : ''}
   <div class="vp-gifts">${cards}</div>
   <label class="vp-note"><span>✎</span><input id="vwMsg" maxlength="${Vow.msgMax}" placeholder="Write a sweet note…" value="${esc(vowSel.msg)}" oninput="vowSel.msg=this.value;const c=document.querySelector('#vwMsgN');if(c)c.textContent=this.value.length+'/${Vow.msgMax}'"><small id="vwMsgN">${vowSel.msg.length}/${Vow.msgMax}</small></label>
   <div class="vp-foot"><div class="vp-step"><button onclick="vowQty(-1)">${denPlain}−</button><b id="vwN">${vowSel.n}</b><button onclick="vowQty(1)">${denPlain}+</button></div>
    <button class="vp-send" ${!vowSel.to || !have ? 'disabled' : ''} onclick="vowSend()">${denPlain}<span>Send</span><small>${have ? (pts ? '+' + fmt(pts) + ' Bond Points' : '+' + fmt(g.pts * vowSel.n) + ' Intimacy') : 'None left · Bond Gift'}</small></button></div></div>`);
}
function vowPick(k) { vowSel.gift = k; vowSel.n = 1; vowSendPop(); }
function vowQty(d) { const have = S.vow.gifts[vowSel.gift] || 0, n = Math.max(1, Math.min(Vow.sendMax, Math.max(1, have), vowSel.n + d)); if (n !== vowSel.n) { vowSel.n = n; vowSendPop(); } }
function vowItem(k) {
  const g = Vow.gifts[k];
  popup(`<div class="vw-pop"><div class="vw-icard"><div class="vw-ihead c-${g.card}">${vwIco(k, 'big')}<div><b>${g.name}</b><small>Usage Level: Unlimited · Type: Other</small></div></div><h3>Item Description</h3>
   <p class="vw-note">Giving it to your partner during the event earns ${fmt(g.pts)} Bond Points (x${Vow.mutual} when the gifting is mutual), ${fmt(g.pts)} Intimacy and ${g.lock} Love Lock EXP.</p><button class="vw-claim" onclick="vowSendPop()">${denPlain}Back</button></div></div>`);
}
function vowSend() {
  const to = vowSel.to, msg = document.querySelector('#vwMsg')?.value ?? vowSel.msg;
  if (!to) return toast('Please select a player to send');
  const r = Vow.send(S.vow, to, vowSel.gift, vowSel.n, msg);
  if (!r.ok) return toast({ few: 'Not enough ' + Vow.gifts[vowSel.gift].name + 's · buy more in Bond Gift', count: 'Choose how many', who: 'Please select a player to send' }[r.err] || 'Cannot send');
  if (WonderGear.socialGiftHearts) WonderGear.socialGiftHearts(S, to, r.intim);
  if (typeof trailTick === 'function') trailTick('flower');
  vowSel.msg = ''; save(); document.querySelector('#modal')?.close?.(); showVow(); vowBurst(to, r);
}
// The "oath sent" moment: a heart, a ring of petals, the gift and the numbers.
function vowBurst(to, r) {
  const room = document.querySelector('.vw-room'); if (!room || !room.insertAdjacentHTML) return;
  document.querySelector('.vw-burst')?.remove?.();
  const petals = Array.from({ length: 18 }, (_, i) => `<i style="--a:${i * 20}deg;--d:${(i % 3) * .08}s"></i>`).join('');
  room.insertAdjacentHTML('beforeend', `<div class="vw-burst" onclick="this.remove()"><div class="vw-bheart">♥</div><div class="vw-petals">${petals}</div><div class="vw-bcard">${vwIco(S.vow.log[0]?.gift || 'rose', 'big')}
   <b>Oath sent to ${esc(vwName(to))}</b>${r.msg ? `<q>${esc(r.msg)}</q>` : ''}<span>+${fmt(r.intim)} Intimacy · +${r.lockExp} Love Lock EXP${r.gained ? ' · +' + fmt(r.gained) + ' Bond Points' : ''}</span>
   ${r.reply ? `<span class="vw-back">${esc(vwName(to))} (AI) sent a ${Vow.gifts[r.reply].name} back!</span>` : ''}${r.lockUp ? `<span class="vw-back">Love Lock Lv. ${Vow.lockLevel(S.vow.lock).lv}!</span>` : ''}</div></div>`);
  setTimeout(() => document.querySelector('.vw-burst')?.remove?.(), 3600);
}
// A dungeon guardian win during the event (world.js endBattle).
function vowDrop() { if (typeof Vow === 'undefined' || !S) return null; const v = vowState(), got = Vow.drop(v); if (!got) return null; return Object.entries(got).map(([k, n]) => n + ' ' + Vow.names[k]).join(', '); }
// Oath Witness venue: bouquets fall for 25 s; a tap catches one (a rose or heart crystals up to the day's cap).
function vowVenueView(v) {
  const cap = Vow.venueCap(Date.now());
  $('#main').innerHTML = vowChrome('Oath Parade', Vow.inCeremony(Date.now()) ? 'The ceremony is on: double bouquets!' : 'Catch the falling bouquets', `<div class="vw-venue" id="vwVenue"><img class="vw-hero" src="${reinaLookPath(false)}" alt="Reina"></div>
   <div class="vw-vhud"><span>Time <b id="vwT">${Vow.venueSecs}</b></span><span>Caught <b id="vwC">0</b></span><span>Prizes today <b id="vwP">${v.venue}/${cap}</b></span></div>
   <button class="vw-go vw-start" onclick="vowVenueStart()">${denPlain}Start</button>`);
}
function vowVenueStart() {
  const box = document.querySelector('#vwVenue'); if (!box || !box.insertAdjacentHTML) return; document.querySelector('.vw-start')?.remove?.();
  const t0 = Date.now(); let id = 0, caught = 0;
  vowVenue = { caught: 0, timer: setInterval(() => {
    const left = Vow.venueSecs - (Date.now() - t0) / 1000, t = document.querySelector('#vwT'); if (!t || screen !== 'vow') return vowStop();
    t.textContent = Math.max(0, Math.ceil(left));
    if (left <= 0) { const n = vowVenue.caught; vowStop(); save(); popup(`<div class="vw-pop"><h2>Parade over</h2><p class="vw-note">You caught <b>${n}</b> bouquets.</p><button class="vw-claim" onclick="document.querySelector('#modal').close();vowGo('witness')">${denPlain}Back</button></div>`); return; }
    if (Math.random() < .5) { const x = 6 + Math.random() * 80, d = 2.2 + Math.random() * 1.6; id++;
      box.insertAdjacentHTML('beforeend', `<button class="vw-fall" id="vwF${id}" style="left:${x}%;animation-duration:${d}s" onpointerdown="vowCatch(this)">${denPlain}${vwIco('bouquet')}</button>`);
      const me = id; setTimeout(() => document.querySelector('#vwF' + me)?.remove?.(), d * 1000); }
  }, 260) };
}
function vowCatch(el) {
  if (!vowVenue || el.dataset.got) return; el.dataset.got = 1; vowVenue.caught++; const got = Vow.venueCatch(S.vow);
  el.classList.add('got'); el.insertAdjacentHTML('beforeend', `<em>${got ? '+' + Object.entries(got).map(([k, n]) => n + ' ' + Vow.names[k]).join('') : '♥'}</em>`); setTimeout(() => el.remove(), 600);
  const c = document.querySelector('#vwC'); if (c) c.textContent = vowVenue.caught; const p = document.querySelector('#vwP'); if (p) p.textContent = S.vow.venue + '/' + Vow.venueCap(Date.now());
}
