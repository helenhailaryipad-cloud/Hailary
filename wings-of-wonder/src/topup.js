'use strict';
// Prism Bazaar: the top-up store (2026-11-27, user photos of the reference's Top-up / Daily Pack / MegaPack tabs).
// Own names and art. Real money buys PRISMS only (premium); every prism pack also gifts Moon Pearls, the middle
// currency (x`pearlsPerPrism`, like the reference's blue diamonds). Moon Pearls are also earned in play (Wayfarer
// tasks, dungeon guardians) and spent on the last realm's entries and on rite tickets (`pearlTicket` pearls a ticket).
// Gacha tickets are never sold for money directly (MONETIZATION RULE): packs carry them only as a bonus.
// Real payment is NOT connected: price buttons open an info card; `Topup.grant` is ready for the day it is.
// Optional save fields: S.pearls (number), S.topup {week, bought{id:n}, first[]} (`Topup.valid`).
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
    if (!v || v.week !== w) v = s.topup = { week: w, bought: {}, first: v?.first || [] };
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
      && (v.first === undefined || Array.isArray(v.first) && v.first.every(k => /^p[1-7]$/.test(k))) && (v.rebate === undefined || typeof v.rebate === 'boolean'));
  },
};
globalThis.Topup = Topup;

// TOPUP_UI
let topupTab = 'prisms', topupTimer = 0;
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
  const tabs = [['cache', 'Triple Treat', 'gift'], ['weekly', 'Weekly Packs', 'chest'], ['prisms', 'Prisms', 'crystals'], ['tickets', 'Tickets', 'wishes']];
  let body = '';
  if (topupTab === 'prisms') body = `<div class="tp-grid">${Topup.prismPacks.map((p, i) => { const first = !Topup.state(S).first.includes(p.id);
    return `<button class="tp-card" onclick="topupAsk('${p.id}')">${denPlain}${first ? '<i class="tp-x2">First buy ×2</i>' : ''}<b class="tp-amt">${prismIcon()}${fmt(p.prisms)}</b><img class="tp-pile" src="${artPath('topup-pile-' + (i + 1))}" alt=""><small class="tp-gift">Gift: ${pearlIcon()} × ${fmt(p.prisms * Topup.pearlsPerPrism)}</small><span class="tp-price">${euro(p.eur)}</span></button>`; }).join('')}</div>`;
  else if (topupTab === 'weekly') body = `<p class="tp-note">Weekly packs · new stock in <b data-tpclock>${tpLeftClock()}</b></p><div class="tp-week">${Topup.weekly.map((w, i) => { const left = Topup.left(S, w.id), c = Topup.contents(S, w.id);
    return `<div class="tp-wk tp-wk${i + 1} ${left ? '' : 'out'}"><p class="tp-val">Value ${prismIcon()}${fmt(w.value)}</p>${w.double ? '<i class="tp-x2">2×!</i>' : ''}<div class="tp-wtiles">${tpTiles(c)}</div><s>${euro(w.was)}</s><button class="tp-buy" ${left ? '' : 'disabled'} onclick="topupAsk('${w.id}')">${denPlain}${left ? euro(w.eur) : 'Sold out'}</button><small>${w.limit - left}/${w.limit}</small></div>`; }).join('')}</div>`;
  else if (topupTab === 'cache') { const allBought = Topup.allBought(S);
    body = `<p class="tp-note">Each cache once a week · new stock in <b data-tpclock>${tpLeftClock()}</b></p>${Topup.caches.map((c, i) => { const left = Topup.left(S, c.id);
      return `<div class="tp-cache tp-c${i + 1} ${left ? '' : 'out'}"><div class="tp-cbox"><img src="${artPath('topup-cache-' + c.id)}" alt=""><b>${c.name}</b><small>${c.what}</small></div><div class="tp-cright"><div class="tp-ctiles">${tpTiles({ prisms: c.prisms * 2, pearls: c.pearls, items: c.items })}</div><p><s>Usual price ${euro(c.was)}</s></p><button class="tp-buy" ${left ? '' : 'disabled'} onclick="topupAsk('${c.id}')">${denPlain}${left ? euro(c.eur) : 'Bought'}</button><i class="tp-rebate">Rebate<br>1000%</i></div></div>`; }).join('')}
     <div class="tp-grand"><div><b>Buy all three caches</b><small>and claim the Grand Rebate</small></div><div class="tp-ctiles">${tpTiles({ items: Topup.grandRebate.items })}</div></div>
     <button class="tp-all" ${Topup.allLeft(S) ? '' : 'disabled'} onclick="topupAsk('all')">${denPlain}${allBought ? 'All bought this week' : euro(Topup.cacheAll.eur) + ' · all three'}<i>${Topup.cacheAll.off}% off</i></button>`; }
  else body = `<div class="tp-swap"><h3>Moon Pearls → rite tickets</h3><p>Swap pearls for tickets of the running rite, ${Rites.rite(Rites.period()).name}: ${pearlIcon()} ${fmt(Topup.pearlTicket)} = 1 ticket. Tickets are never sold for money; prisms and pearls buy them.</p>
     <div class="tp-swaprow">${[1, 10, 50].map(n => `<button class="tp-buy" ${(S.pearls || 0) < n * Topup.pearlTicket ? 'disabled' : ''} onclick="topupSwap(${n})">${denPlain}${pearlIcon()}${fmt(n * Topup.pearlTicket)} → ${n}</button>`).join('')}</div>
     <p class="tp-small">Ticket packs for prisms are in the Star Rites Secret Shop.</p><button class="tp-link" onclick="riteView='shop';go('rites')">${denPlain}Open the Secret Shop ›</button></div>`;
  $('#main').innerHTML = `<section class="tp-room" data-tab="${topupTab}">
   <div class="tp-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="tp-ribbon">Prism Bazaar</div>
    <span class="tp-chip">${uiIcon('gold')}${fmt(S.gold)}</span><span class="tp-chip">${pearlIcon()}${fmt(S.pearls || 0)}</span><span class="tp-chip">${prismIcon()}${fmt(S.scales || 0)}</span></div>
   <div class="tp-banner" style="--tpb:url('${artPath('topup-banner')}')"><h1>${topupTab === 'prisms' ? 'Prism Top-up' : topupTab === 'weekly' ? 'Weekly Packs' : topupTab === 'cache' ? 'Triple Treat' : 'Tickets'}</h1></div>
   <div class="tp-body">${body}</div>
   <div class="tp-nav">${tabs.map(([id, name, icon]) => `<button class="${id === topupTab ? 'on' : ''}" onclick="topupTab='${id}';showTopup()">${denPlain}${id === 'cache' ? '<i class="tp-badge">2×</i>' : ''}${uiIcon(icon)}<span>${name}</span></button>`).join('')}</div>
  </section>`;
  topupTimer = setInterval(() => { if (screen !== 'topup') return clearInterval(topupTimer); document.querySelectorAll('[data-tpclock]').forEach(e => e.textContent = tpLeftClock()); }, 30000);
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
