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
    { id: 's', name: 'Silver', give: { exp: 100, rite: 30, prisms: 10, gold: 1000 } },
    { id: 'g', name: 'Gold', give: { exp: 150, rite: 50, prisms: 20, gold: 1500 } },
    { id: 'd', name: 'Diamond', give: { exp: 200, rite: 80, prisms: 40, gold: 2000, items: { stonebag: 1 } } }
  ],
  // Daily Wayfarer EXP chests (Silver alone is 1,500 a day; all three tabs about 5,000).
  track: [[300, { voucher: 20 }], [600, { items: { chest1: 1 } }], [1000, { gold: 2000 }], [1500, { rite: 60 }], [2000, { items: { stonebag: 1 } }],
    [2500, { prisms: 30 }], [3000, { items: { chest2: 1 } }], [3500, { voucher: 50 }], [4000, { items: { shardbag: 1 } }], [4500, { rite: 120 }],
    [5000, { items: { gembox: 1 } }], [6000, { prisms: 60, items: { chest3: 1 } }]],
  dungeonTickets: 20,

  get quests() { return this.kinds; },
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
      && Array.isArray(v.ms) && v.ms.every(i => Number.isInteger(i) && i >= 0 && i < this.track.length) && (v.pass === undefined || obj(v.pass));
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
let trailTab = 's';
function trailGive(out) {
  const bits = [];
  if (out.exp) bits.push(`<span class="tq-r exp"><b>EXP</b><small>${fmt(out.exp)}</small></span>`);
  if (out.rite && typeof riteIcon === 'function') { const rite = out.riteId ? Rites.list.find(r => r.id === out.riteId) : Rites.rite(Rites.period()); bits.push(`<span class="tq-r">${riteIcon(rite.icon)}<small>${fmt(out.rite)}</small></span>`); }
  if (out.voucher && typeof riteVoucherIcon === 'function') bits.push(`<span class="tq-r">${riteVoucherIcon()}<small>${fmt(out.voucher)}</small></span>`);
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
  $('#main').innerHTML = `<section class="tq-room tq-${tier.id}" style="--tqbg:url('${artPath('comp-trail-banner')}')">
   <div class="tq-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><span class="tq-wallet">${uiIcon('gold')}<b>${fmt(S.gold)}</b></span><span class="tq-wallet">${uiIcon('crystals')}<b>${fmt(S.scales || 0)}</b></span></div>
   <div class="tq-banner"><h1>Wayfarer Quests</h1><p>New tasks and chests in ${riteClock(Trail.nextDay() - Date.now())}</p></div>
   <div class="tq-track"><span class="tq-exp"><b>${fmt(v.exp)}</b><small>Wayfarer EXP</small></span><div class="tq-ms">${Trail.track.map((m, i) => `<button class="${v.ms.includes(i) ? 'got' : v.exp >= m[0] ? 'ready' : ''} ${i === next ? 'next' : ''}" onclick="trailMilestone(${i})">${denPlain}<i>${trailGive(m[1])}</i><small>${fmt(m[0])}</small></button>`).join('')}</div></div>
   <div class="tq-list">${rows}</div>
   <div class="tq-tabs">${Trail.tiers.map(t => { const r = Trail.readyIn(S, t.id); return `<button class="${t.id === trailTab ? 'on' : ''} ${t.id}" onclick="trailTab='${t.id}';cityTrail()">${denPlain}${t.name} Quests${r ? `<em>${r}</em>` : ''}</button>`; }).join('')}<button class="all" onclick="trailClaimAll()">${denPlain}Claim all</button></div>
  </section>`;
  const nx = document.querySelector('.tq-ms .next'); if (nx?.scrollIntoView) nx.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function trailClaim(key) { const out = Trail.claim(S, key, trailTab); if (!out) return; save(); cityTrail(); trailGot([out]); }
function trailClaimAll() { const all = Trail.claimAll(S, trailTab); if (!all.length) return toast('Nothing to claim yet'); save(); cityTrail(); trailGot(all); }
function trailMilestone(i) { const v = Trail.state(S); if (v.ms.includes(i)) return toast('Already claimed'); const out = Trail.milestone(S, i); if (!out) return toast('Reach ' + fmt(Trail.track[i][0]) + ' Wayfarer EXP'); save(); cityTrail(); trailGot([out]); }
function trailGot(list) {
  const sum = {}; for (const o of list) for (const [k, n] of Object.entries(o)) { if (k === 'items') { sum.items ??= {}; for (const [i, c] of Object.entries(n)) sum.items[i] = (sum.items[i] || 0) + c; } else if (k === 'riteId') sum.riteId = n; else sum[k] = (sum[k] || 0) + n; }
  popup(`<div class="tq-pop"><h2>You received</h2><div class="tq-gifts big">${trailGive(sum)}</div><button class="primary" onclick="$('#modal').close()">${denPlain}OK</button></div>`);
}
