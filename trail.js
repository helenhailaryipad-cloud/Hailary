// Wayfarer Quests (user photos of the reference's Adventure Quest, all three tabs): a daily list of tasks counted by
// trailTick() hooks across the game, reset 00:00 UTC. Silver / Gold / Diamond are NOT paywalls: they are the same kinds
// of task with higher goals and bigger rewards (reference: EXP Forest 2 / 3, World Boss 5 / 12 / 20), all free; Gold and
// Diamond also hold "spend prisms / gold" goals (the reference's top-up goals are left out: no real money). One counter
// per task, each tab has its own goal and its own claim. Claims pay Wayfarer EXP, which fills a DAILY chest track
// (the reference showed 8,300 EXP with every chest open). Star Rites tickets come in small amounts from every claim,
// universal Starlit Vouchers from dungeon guardians (Trail.dungeonTickets) and the boss wheel. Numbers are placeholders.
// Pure rules first (node scripts/test-trail.mjs), UI below TRAIL_UI.
const Trail = {
  // Task kinds: [key, text, screen]. Goals per tab below; 0 = not in that tab.
  kinds: [
    ['dungeon', 'Defeat dungeon guardians', 'dungeons'],
    ['wheel', 'Spin the boss treasure wheel', 'dungeons'],
    ['expdun', 'Clear the EXP Forest', 'expLobby'],
    ['arcade', 'Play the featured mini game', 'games'],
    ['fish', 'Cast at Moonwater Lake', 'fishing'],
    ['carnage', 'Earn Carnage Points in Cloud War', 'cityCloudWar'],
    ['guildsign', 'Sign in at your guild', 'cityGuild'],
    ['guildhit', 'Strike the Guild Boss', 'cityGuild'],
    ['flower', 'Send flowers to friends', 'citySocial'],
    ['chat', 'Send a message in the chat', 'citySocial'],
    ['contest', 'Fight in the Sky Contest', 'cityContest'],
    ['siege', 'Attack in Pet Siege', 'siege'],
    ['summon', 'Summon pets', 'citySummon'],
    ['pull', 'Pull in Star Rites', 'rites'],
    ['goldspend', 'Spend gold', 'fashion'],
    ['prisms', 'Spend prisms', 'rites']
  ],
  goals: {
    s: { dungeon: 2, wheel: 1, expdun: 1, arcade: 1, fish: 3, carnage: 300, guildsign: 1, guildhit: 1, flower: 3, chat: 1, contest: 1, siege: 1, summon: 5, pull: 10, goldspend: 5000 },
    g: { dungeon: 3, wheel: 3, expdun: 2, fish: 6, carnage: 800, guildhit: 2, flower: 5, contest: 2, summon: 20, pull: 30, goldspend: 20000, prisms: 300 },
    d: { dungeon: 5, wheel: 5, fish: 10, carnage: 1200, guildhit: 3, flower: 10, contest: 4, summon: 40, pull: 60, goldspend: 50000, prisms: 1280 }
  },
  // Reward of one task in each tab. rite = tickets of the running Star Rite.
  tiers: [
    { id: 's', name: 'Silver', give: { exp: 100, coins: 20, rite: 30, prisms: 10, gold: 1000 } },
    { id: 'g', name: 'Gold', give: { exp: 150, coins: 30, rite: 50, prisms: 20, gold: 1500 } },
    { id: 'd', name: 'Diamond', give: { exp: 200, coins: 40, rite: 80, prisms: 40, gold: 2000, items: { stonebag: 1 } } }
  ],
  // Daily Wayfarer EXP chests (Silver alone is 1,500 a day; all three tabs about 5,000).
  track: [[300, { voucher: 20 }], [600, { items: { chest1: 1 } }], [1000, { gold: 2000 }], [1500, { rite: 60 }], [2000, { items: { stonebag: 1 } }],
    [2500, { prisms: 30 }], [3000, { items: { chest2: 1 } }], [3500, { voucher: 50 }], [4000, { items: { shardbag: 1 } }], [4500, { rite: 120 }],
    [5000, { items: { gembox: 1 } }], [6000, { prisms: 60, items: { chest3: 1 } }]],
  dungeonTickets: 20,
  // Wayfarer Shop (user photo of the reference's Adventure Shop: six wares for adventure coins, one at -30%, "automatically
  // refreshes when all items are sold out", manual refresh 100). Coins come from every claim (give.coins) and are kept
  // across days in v.coins; the six wares in v.shop. A ware: [kind, id, n, price]. Frames / bubbles are copies of the
  // theme avatar frames and chat bubbles (a repeat raises its tier, like the reference's "T6 Relic (Owned)").
  shopRefresh: 100, shopSlots: 6, shopOff: .3,
  wares: [['frame', 'sr', 1, 900], ['frame', 'ssr', 1, 1400], ['bubble', 'sr', 1, 900], ['bubble', 'ssr', 1, 1400],
    ['item', 'chest2', 1, 300], ['item', 'chest3', 1, 700], ['item', 'petegg', 1, 600], ['item', 'gembox', 2, 400], ['item', 'wish', 3, 300],
    ['item', 'sealbag', 2, 350], ['item', 'shardbag', 2, 250], ['voucher', '', 100, 400], ['voucher', '', 250, 900]],

  get quests() { return this.kinds; },
  // A fresh set of six wares; frames and bubbles are picked from the theme list by rarity.
  stock(rng = Math.random) {
    const pool = this.wares.slice(), out = [], themes = typeof WonderGear !== 'undefined' ? WonderGear.avatarFrames : [];
    while (out.length < this.shopSlots && pool.length) {
      const [kind, id, n, price] = pool.splice(Math.floor(rng() * pool.length), 1)[0];
      let ware = { kind, id, n, price, sold: false, off: false };
      if (kind === 'frame' || kind === 'bubble') { const list = themes.filter(f => f.rar === id); if (!list.length) continue; ware.id = list[Math.floor(rng() * list.length)].id; ware.rar = id; }
      out.push(ware);
    }
    const k = Math.floor(rng() * out.length); if (out[k]) { out[k].off = true; out[k].price = Math.round(out[k].price * (1 - this.shopOff) / 10) * 10; }
    return out;
  },
  shop(s, rng = Math.random, now = Date.now()) { const v = this.state(s, now); if (!Array.isArray(v.shop) || !v.shop.length) v.shop = this.stock(rng); v.coins ??= 0; return v.shop; },
  // Gives one ware; frames and bubbles add a copy through the Supreme state (first copy activates and wears it).
  grant(s, w) {
    if (w.kind === 'item') return this.pay(s, { items: { [w.id]: w.n } });
    if (w.kind === 'voucher') return this.pay(s, { voucher: w.n });
    const g = WonderGear, store = g.decoKinds[w.kind].store, v = g.supremeState(s);
    v[store][w.id] = (v[store][w.id] || 0) + w.n; if (!v[w.kind]) v[w.kind] = w.id; g.supremePack(s, v);
    return { deco: { kind: w.kind, id: w.id, tier: g.decoTier(s, w.kind, w.id) } };
  },
  buy(s, i, rng = Math.random, now = Date.now()) {
    const v = this.state(s, now), shop = this.shop(s, rng, now), w = shop[i];
    if (!w || w.sold || v.coins < w.price) return null;
    v.coins -= w.price; w.sold = true; const out = this.grant(s, w);
    if (shop.every(x => x.sold)) v.shop = this.stock(rng);
    return out;
  },
  refresh(s, rng = Math.random, now = Date.now()) { const v = this.state(s, now); this.shop(s, rng, now); if (v.coins < this.shopRefresh) return false; v.coins -= this.shopRefresh; v.shop = this.stock(rng); return true; },
  goal(tier, key) { return this.goals[tier]?.[key] || 0; },
  list(tier) { return this.kinds.filter(k => this.goal(tier, k[0])); },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  season(now = Date.now()) { return new Date(now).toISOString().slice(0, 7); },
  nextDay(now = Date.now()) { return (Math.floor(now / 864e5) + 1) * 864e5; },
  // pass and season stay in old saves (the first version sold a monthly pass); they are kept but no longer used.
  state(s, now = Date.now()) {
    const day = this.day(now), season = this.season(now);
    let v = s.trail;
    if (!v) v = s.trail = { day, c: {}, got: { s: [], g: [], d: [] }, season, exp: 0, ms: [], pass: {} };
    if (v.day !== day) { v.day = day; v.c = {}; v.got = { s: [], g: [], d: [] }; v.exp = 0; v.ms = []; }
    if (v.season !== season) v.season = season;
    return v;
  },
  tick(s, key, n = 1, now = Date.now()) { if (!this.kinds.some(q => q[0] === key) || !(n > 0)) return; const v = this.state(s, now); v.c[key] = (v.c[key] || 0) + Math.round(n); },
  done(s, key, tier = 's', now = Date.now()) { const g = this.goal(tier, key), v = this.state(s, now); return !!g && (v.c[key] || 0) >= g; },
  hasPass() { return true; },
  // Pays a reward object into the save. rite tickets go to the running Star Rite.
  pay(s, give) {
    const out = {};
    if (give.coins) { const v = s.trail || this.state(s); v.coins = (v.coins || 0) + give.coins; out.coins = give.coins; }
    if (give.gold) { s.gold = (s.gold || 0) + give.gold; out.gold = give.gold; }
    if (give.prisms) { s.scales = (s.scales || 0) + give.prisms; out.prisms = give.prisms; }
    if (give.voucher && typeof Rites !== 'undefined') { Rites.addVouchers(s, give.voucher); out.voucher = give.voucher; }
    if (give.rite && typeof Rites !== 'undefined') { const v = Rites.state(s), id = Rites.rite(v.ev.period).id; v.t[id] = (v.t[id] || 0) + give.rite; out.rite = give.rite; out.riteId = id; }
    for (const [k, n] of Object.entries(give.items || {})) { s.bag ??= {}; s.bag[k] = (s.bag[k] || 0) + n; (out.items ??= {})[k] = n; }
    return out;
  },
  claim(s, key, tier, now = Date.now()) {
    const v = this.state(s, now), t = this.tiers.find(x => x.id === tier);
    if (!t || !this.done(s, key, tier, now) || v.got[tier].includes(key)) return null;
    v.got[tier].push(key); const out = this.pay(s, t.give);
    if (t.give.exp) { v.exp += t.give.exp; out.exp = t.give.exp; }
    return out;
  },
  claimAll(s, tier, now = Date.now()) { const all = []; for (const [key] of this.list(tier)) { const r = this.claim(s, key, tier, now); if (r) all.push(r); } return all; },
  readyIn(s, tier, now = Date.now()) { const v = this.state(s, now); return this.list(tier).filter(([key]) => this.done(s, key, tier, now) && !v.got[tier].includes(key)).length; },
  ready(s, now = Date.now()) { const v = this.state(s, now); return this.tiers.reduce((n, t) => n + this.readyIn(s, t.id, now), 0) + this.track.filter((m, i) => v.exp >= m[0] && !v.ms.includes(i)).length; },
  milestone(s, i, now = Date.now()) { const v = this.state(s, now), m = this.track[i]; if (!m || v.exp < m[0] || v.ms.includes(i)) return null; v.ms.push(i); return this.pay(s, m[1]); },
  valid(v) {
    if (v === undefined) return true;
    const int = n => Number.isSafeInteger(n) && n >= 0 && n <= 1e12, keys = this.kinds.map(q => q[0]), obj = o => !!o && typeof o === 'object' && !Array.isArray(o);
    return obj(v) && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && /^\d{4}-\d{2}$/.test(v.season) && obj(v.c) && Object.entries(v.c).every(([k, n]) => keys.includes(k) && int(n))
      && obj(v.got) && ['s', 'g', 'd'].every(t => Array.isArray(v.got[t]) && v.got[t].every(k => keys.includes(k))) && int(v.exp)
      && Array.isArray(v.ms) && v.ms.every(i => Number.isInteger(i) && i >= 0 && i < this.track.length) && (v.pass === undefined || obj(v.pass))
      && (v.coins === undefined || int(v.coins)) && (v.shop === undefined || Array.isArray(v.shop) && v.shop.length <= this.shopSlots && v.shop.every(w => obj(w)
        && ['frame', 'bubble', 'item', 'voucher'].includes(w.kind) && typeof w.id === 'string' && int(w.n) && w.n > 0 && int(w.price) && typeof w.sold === 'boolean'));
  }
};
// The one hook the rest of the game calls: trailTick('dungeon') etc. Safe before a save exists.
function trailTick(key, n = 1) { try { if (typeof S !== 'undefined' && S) Trail.tick(S, key, n); } catch { } }
// Gold and prisms spent anywhere count for the "Spend" goals: save() calls this, which compares with the last balance.
let trailPurse = null;
function trailSpend() {
  try {
    if (typeof S === 'undefined' || !S) return; const now = { gold: S.gold || 0, prisms: S.scales || 0 };
    if (trailPurse) { if (now.gold < trailPurse.gold) Trail.tick(S, 'goldspend', trailPurse.gold - now.gold); if (now.prisms < trailPurse.prisms) Trail.tick(S, 'prisms', trailPurse.prisms - now.prisms); }
    trailPurse = now;
  } catch { }
}

// TRAIL_UI ------------------------------------------------------------------------------------------------------
let trailTab = 's', trailPage = 'quests';
function trailCoin(cls = '') { return `<img class="tq-coin ${cls}" src="${artPath('comp-trail-coin')}" alt="Wayfarer Coin">`; }
function trailNav() { return `<div class="tq-nav">${[['quests', 'Quests'], ['shop', 'Wayfarer Shop']].map(([id, name]) => `<button class="${trailPage === id ? 'on' : ''}" onclick="trailPage='${id}';cityTrail()">${denPlain}${name}</button>`).join('')}</div>`; }
function trailWareArt(w) {
  if (w.kind === 'frame') return typeof frameArt === 'function' ? frameArt(w.id, true, 'tq-ware-frame') : '';
  if (w.kind === 'bubble') return typeof bubbleArt === 'function' ? bubbleArt(w.id, 'Hi!') : '';
  if (w.kind === 'voucher') return typeof riteVoucherIcon === 'function' ? riteVoucherIcon('big') : '';
  return typeof bagIcon === 'function' ? bagIcon(w.id) : '';
}
function trailWareName(w) {
  const g = WonderGear;
  if (w.kind === 'frame' || w.kind === 'bubble') { const f = g.avatarFrames.find(x => x.id === w.id); return (f ? f.name : w.id) + (w.kind === 'frame' ? ' Frame' : ' Bubble'); }
  if (w.kind === 'voucher') return 'Starlit Vouchers';
  return g.bagItems.find(b => b.id === w.id)?.name || w.id;
}
function trailWareNote(w) {
  if (w.kind === 'frame' || w.kind === 'bubble') { const c = WonderGear.decoCopies(S, w.kind, w.id); const t = WonderGear.decoTier(S, w.kind, w.id); return c ? `<b class="own">Owned${t ? ' · T' + t : ''} · next T${t + 1}</b>` : '<b class="new">Not owned</b>'; }
  return `<b>×${fmt(w.n)}</b>`;
}
function trailShopPage() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const v = Trail.state(S), shop = Trail.shop(S);
  return `<div class="tq-shop"><div class="tq-shop-head"><h2>Wayfarer Shop</h2><span class="tq-wallet">${trailCoin()}<b>${fmt(v.coins)}</b></span><button class="tq-obtain" onclick="trailObtain()">${denPlain}Obtain</button></div>
   <p class="tq-shop-note">Daily tasks pay Wayfarer Coins · spend them here</p>
   <div class="tq-wares">${shop.map((w, i) => `<button class="tq-ware r-${w.rar || w.kind} ${w.sold ? 'sold' : ''}" ${w.sold ? 'disabled' : ''} onclick="trailBuy(${i})">${denPlain}<b class="nm">${trailWareName(w)}</b>${w.off ? `<em class="off">-${Math.round(Trail.shopOff * 100)}%</em>` : ''}<span class="art">${trailWareArt(w)}</span><small>${trailWareNote(w)}</small>${w.sold ? '<i class="stamp">Sold out</i>' : ''}<span class="price">${trailCoin()}${fmt(w.price)}</span></button>`).join('')}</div>
   <div class="tq-refresh"><span>Automatically refreshes when all items are sold out</span><button onclick="trailRefresh()">${denPlain}${trailCoin()}${Trail.shopRefresh} ⟳</button></div></div>`;
}
function trailBuy(i) {
  const v = Trail.state(S), w = Trail.shop(S)[i]; if (!w || w.sold) return;
  if (v.coins < w.price) return toast('Not enough Wayfarer Coins (' + fmt(w.price) + ')');
  const name = trailWareName(w), out = Trail.buy(S, i); if (!out) return; save(); cityTrail();
  toast(out.deco ? name + (out.deco.tier ? ' · tier ' + out.deco.tier : ' · activated') : name + ' · in the bag');
}
function trailRefresh() { if (!Trail.refresh(S)) return toast('Refresh needs ' + Trail.shopRefresh + ' Wayfarer Coins'); save(); cityTrail(); }
function trailObtain() { popup(`<div class="tq-pop"><h2>Wayfarer Coins</h2><div class="tq-gifts big">${trailCoin('big')}</div><p>Every finished daily task pays coins when you claim it: Silver ${Trail.tiers[0].give.coins}, Gold ${Trail.tiers[1].give.coins}, Diamond ${Trail.tiers[2].give.coins}. Coins never expire.</p><button class="primary" onclick="$('#modal').close();trailPage='quests';cityTrail()">${denPlain}Go to the quests</button></div>`); }
function trailGive(out) {
  const bits = [];
  if (out.exp) bits.push(`<span class="tq-r exp"><b>EXP</b><small>${fmt(out.exp)}</small></span>`);
  if (out.rite && typeof riteIcon === 'function') { const rite = out.riteId ? Rites.list.find(r => r.id === out.riteId) : Rites.rite(Rites.period()); bits.push(`<span class="tq-r">${riteIcon(rite.icon)}<small>${fmt(out.rite)}</small></span>`); }
  if (out.voucher && typeof riteVoucherIcon === 'function') bits.push(`<span class="tq-r">${riteVoucherIcon()}<small>${fmt(out.voucher)}</small></span>`);
  if (out.coins) bits.push(`<span class="tq-r">${trailCoin()}<small>${fmt(out.coins)}</small></span>`);
  if (out.prisms) bits.push(`<span class="tq-r">${uiIcon('crystals')}<small>${fmt(out.prisms)}</small></span>`);
  if (out.gold) bits.push(`<span class="tq-r">${uiIcon('gold')}<small>${fmt(out.gold)}</small></span>`);
  for (const [k, n] of Object.entries(out.items || {})) bits.push(`<span class="tq-r">${typeof bagIcon === 'function' ? bagIcon(k) : k}<small>${n}</small></span>`);
  return bits.join('');
}
function cityTrail() {
  if (typeof bagArtVars === 'function') bagArtVars(); trailSpend();
  const v = Trail.state(S), tier = Trail.tiers.find(t => t.id === trailTab), next = Trail.track.findIndex((m, i) => !v.ms.includes(i));
  const rows = Trail.list(tier.id).map(([key, text, dest]) => {
    const target = Trail.goal(tier.id, key), n = Math.min(target, v.c[key] || 0), done = n >= target, got = v.got[tier.id].includes(key);
    const btn = got ? `<button class="tq-btn got" disabled>${denPlain}Claimed</button>` : done ? `<button class="tq-btn claim" onclick="trailClaim('${key}')">${denPlain}Claim</button>` : `<button class="tq-btn go" onclick="go('${dest}')">${denPlain}Go</button>`;
    return { got, done, html: `<article class="tq-row ${got ? 'got' : done ? 'done' : ''}"><h3>${text} <em class="${done ? '' : 'no'}">(${fmt(n)}/${fmt(target)})</em></h3><div class="tq-gifts">${trailGive(tier.give)}</div>${btn}</article>` };
  }).sort((a, b) => (a.got - b.got) || (b.done - a.done)).map(r => r.html).join('');
  const body = trailPage === 'shop' ? trailShopPage() : null;
  $('#main').innerHTML = `<section class="tq-room tq-${tier.id} ${body ? 'tq-on-shop' : ''}" style="--tqbg:url('${artPath('comp-trail-banner')}')">
   <div class="tq-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><span class="tq-wallet">${uiIcon('gold')}<b>${fmt(S.gold)}</b></span><span class="tq-wallet">${uiIcon('crystals')}<b>${fmt(S.scales || 0)}</b></span></div>
   <div class="tq-banner"><h1>Wayfarer Quests</h1><p>New tasks and chests in ${riteClock(Trail.nextDay() - Date.now())}</p></div>
   ${body ? body + trailNav() + '</section>' : `<div class="tq-track"><span class="tq-exp"><b>${fmt(v.exp)}</b><small>Wayfarer EXP</small></span><div class="tq-ms">${Trail.track.map((m, i) => `<button class="${v.ms.includes(i) ? 'got' : v.exp >= m[0] ? 'ready' : ''} ${i === next ? 'next' : ''}" onclick="trailMilestone(${i})">${denPlain}<i>${trailGive(m[1])}</i><small>${fmt(m[0])}</small></button>`).join('')}</div></div>
   <div class="tq-list">${rows}</div>
   <div class="tq-tabs">${Trail.tiers.map(t => { const r = Trail.readyIn(S, t.id); return `<button class="${t.id === trailTab ? 'on' : ''} ${t.id}" onclick="trailTab='${t.id}';cityTrail()">${denPlain}${t.name} Quests${r ? `<em>${r}</em>` : ''}</button>`; }).join('')}<button class="all" onclick="trailClaimAll()">${denPlain}Claim all</button></div>
   ${trailNav()}</section>`}`;
  const nx = document.querySelector('.tq-ms .next'); if (nx?.scrollIntoView) nx.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function trailClaim(key) { const out = Trail.claim(S, key, trailTab); if (!out) return; save(); cityTrail(); trailGot([out]); }
function trailClaimAll() { const all = Trail.claimAll(S, trailTab); if (!all.length) return toast('Nothing to claim yet'); save(); cityTrail(); trailGot(all); }
function trailMilestone(i) { const v = Trail.state(S); if (v.ms.includes(i)) return toast('Already claimed'); const out = Trail.milestone(S, i); if (!out) return toast('Reach ' + fmt(Trail.track[i][0]) + ' Wayfarer EXP'); save(); cityTrail(); trailGot([out]); }
function trailGot(list) {
  const sum = {}; for (const o of list) for (const [k, n] of Object.entries(o)) { if (k === 'items') { sum.items ??= {}; for (const [i, c] of Object.entries(n)) sum.items[i] = (sum.items[i] || 0) + c; } else if (k === 'riteId') sum.riteId = n; else sum[k] = (sum[k] || 0) + n; }
  popup(`<div class="tq-pop"><h2>You received</h2><div class="tq-gifts big">${trailGive(sum)}</div><button class="primary" onclick="$('#modal').close()">${denPlain}OK</button></div>`);
}
