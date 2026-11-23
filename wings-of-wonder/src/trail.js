// Wayfarer Quests (user photos of the reference's Adventure Quest: a list of daily tasks, each paying "adventure EXP"
// plus resources and a few gacha tickets, a track of chests across the top, and three reward tabs Silver / Gold /
// Diamond). Our version: twelve daily tasks counted by trailTick() hooks across the game, reset 00:00 UTC. Each done
// task can be claimed once per tab: Silver is free, Gold and Diamond need the month's Wayfarer Pass (prisms; real money
// is not built). Silver claims fill Wayfarer EXP for the month (UTC calendar month), whose milestones pay chests,
// tickets and pets. Star Rites tickets come in small amounts from here and from dungeon guardians (Trail.dungeonTickets)
// so the free player gets a few pulls a day. All numbers are placeholders. Pure rules first (node scripts/test-trail.mjs),
// UI below TRAIL_UI.
const Trail = {
  // [key, text, target, screen]
  quests: [
    ['dungeon', 'Defeat dungeon guardians', 2, 'dungeons'],
    ['expdun', 'Clear the EXP Forest', 2, 'expLobby'],
    ['arcade', 'Play the featured mini game', 1, 'games'],
    ['fish', 'Cast at Moonwater Lake', 5, 'fishing'],
    ['carnage', 'Earn Carnage Points in Cloud War', 300, 'cityCloudWar'],
    ['guildsign', 'Sign in at your guild', 1, 'cityGuild'],
    ['guildhit', 'Strike the Guild Boss', 3, 'cityGuild'],
    ['flower', 'Send flowers to friends', 5, 'citySocial'],
    ['contest', 'Fight in the Sky Contest', 2, 'cityContest'],
    ['siege', 'Attack in Pet Siege', 1, 'siege'],
    ['summon', 'Summon pets', 5, 'citySummon'],
    ['pull', 'Pull in Star Rites', 10, 'rites']
  ],
  // Reward of one task in each tab. rite = tickets of the running Star Rite.
  tiers: [
    { id: 's', name: 'Silver', give: { exp: 100, rite: 30, prisms: 10, gold: 1000 } },
    { id: 'g', name: 'Gold', give: { rite: 50, prisms: 20, items: { stonebag: 1 } }, price: 680 },
    { id: 'd', name: 'Diamond', give: { rite: 80, prisms: 40, items: { gembox: 1 } }, price: 1280 }
  ],
  // Wayfarer EXP milestones for the month (12 tasks x 100 = 1,200 a day).
  track: [[600, { rite: 200 }], [1500, { items: { chest2: 1 } }], [3000, { prisms: 100 }], [4500, { items: { petegg: 1 } }],
    [6000, { rite: 400 }], [8000, { items: { wish: 3 } }], [10000, { items: { chest3: 1 } }], [13000, { prisms: 300 }],
    [16000, { rite: 800 }], [20000, { items: { chest3: 2 } }], [25000, { prisms: 600 }], [30000, { rite: 1500, items: { petegg: 2 } }]],
  dungeonTickets: 20,

  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  season(now = Date.now()) { return new Date(now).toISOString().slice(0, 7); },
  seasonEnds(now = Date.now()) { const d = new Date(now); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1); },
  state(s, now = Date.now()) {
    const day = this.day(now), season = this.season(now);
    let v = s.trail;
    if (!v) v = s.trail = { day, c: {}, got: { s: [], g: [], d: [] }, season, exp: 0, ms: [], pass: {} };
    if (v.day !== day) { v.day = day; v.c = {}; v.got = { s: [], g: [], d: [] }; }
    if (v.season !== season) { v.season = season; v.exp = 0; v.ms = []; v.pass = {}; }
    return v;
  },
  tick(s, key, n = 1, now = Date.now()) { if (!this.quests.some(q => q[0] === key) || !(n > 0)) return; const v = this.state(s, now); v.c[key] = (v.c[key] || 0) + n; },
  done(s, key, now = Date.now()) { const q = this.quests.find(x => x[0] === key), v = this.state(s, now); return (v.c[key] || 0) >= q[2]; },
  hasPass(s, tier, now = Date.now()) { return tier === 's' || !!this.state(s, now).pass[tier]; },
  // Pays a reward object into the save. rite tickets go to the running Star Rite.
  pay(s, give) {
    const out = {};
    if (give.gold) { s.gold = (s.gold || 0) + give.gold; out.gold = give.gold; }
    if (give.prisms) { s.scales = (s.scales || 0) + give.prisms; out.prisms = give.prisms; }
    if (give.rite && typeof Rites !== 'undefined') { const v = Rites.state(s), id = Rites.rite(v.ev.period).id; v.t[id] = (v.t[id] || 0) + give.rite; out.rite = give.rite; out.riteId = id; }
    for (const [k, n] of Object.entries(give.items || {})) { s.bag ??= {}; s.bag[k] = (s.bag[k] || 0) + n; (out.items ??= {})[k] = n; }
    return out;
  },
  claim(s, key, tier, now = Date.now()) {
    const v = this.state(s, now), t = this.tiers.find(x => x.id === tier);
    if (!t || !this.done(s, key, now) || v.got[tier].includes(key) || !this.hasPass(s, tier, now)) return null;
    v.got[tier].push(key); const out = this.pay(s, t.give);
    if (t.give.exp) { v.exp += t.give.exp; out.exp = t.give.exp; }
    return out;
  },
  claimAll(s, tier, now = Date.now()) { const all = []; for (const [key] of this.quests) { const r = this.claim(s, key, tier, now); if (r) all.push(r); } return all; },
  ready(s, now = Date.now()) { const v = this.state(s, now); let n = 0; for (const t of this.tiers) if (this.hasPass(s, t.id, now)) for (const [key] of this.quests) if (this.done(s, key, now) && !v.got[t.id].includes(key)) n++; return n + this.track.filter((m, i) => v.exp >= m[0] && !v.ms.includes(i)).length; },
  milestone(s, i, now = Date.now()) { const v = this.state(s, now), m = this.track[i]; if (!m || v.exp < m[0] || v.ms.includes(i)) return null; v.ms.push(i); return this.pay(s, m[1]); },
  buyPass(s, tier, now = Date.now()) { const v = this.state(s, now), t = this.tiers.find(x => x.id === tier); if (!t?.price || v.pass[tier] || (s.scales || 0) < t.price) return false; s.scales -= t.price; v.pass[tier] = true; return true; },
  valid(v) {
    if (v === undefined) return true;
    const int = n => Number.isSafeInteger(n) && n >= 0 && n <= 1e9, keys = this.quests.map(q => q[0]), obj = o => !!o && typeof o === 'object' && !Array.isArray(o);
    return obj(v) && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && /^\d{4}-\d{2}$/.test(v.season) && obj(v.c) && Object.entries(v.c).every(([k, n]) => keys.includes(k) && int(n))
      && obj(v.got) && ['s', 'g', 'd'].every(t => Array.isArray(v.got[t]) && v.got[t].every(k => keys.includes(k))) && int(v.exp)
      && Array.isArray(v.ms) && v.ms.every(i => Number.isInteger(i) && i >= 0 && i < this.track.length) && obj(v.pass) && Object.keys(v.pass).every(k => k === 'g' || k === 'd');
  }
};
// The one hook the rest of the game calls: trailTick('dungeon') etc. Safe before a save exists.
function trailTick(key, n = 1) { try { if (typeof S !== 'undefined' && S) Trail.tick(S, key, n); } catch { } }

// TRAIL_UI ------------------------------------------------------------------------------------------------------
let trailTab = 's';
function trailGive(out) {
  const bits = [];
  if (out.exp) bits.push(`<span class="tq-r exp"><b>EXP</b><small>${fmt(out.exp)}</small></span>`);
  if (out.rite && typeof riteIcon === 'function') { const rite = out.riteId ? Rites.list.find(r => r.id === out.riteId) : Rites.rite(Rites.period()); bits.push(`<span class="tq-r">${riteIcon(rite.icon)}<small>${fmt(out.rite)}</small></span>`); }
  if (out.prisms) bits.push(`<span class="tq-r">${uiIcon('crystals')}<small>${fmt(out.prisms)}</small></span>`);
  if (out.gold) bits.push(`<span class="tq-r">${uiIcon('gold')}<small>${fmt(out.gold)}</small></span>`);
  for (const [k, n] of Object.entries(out.items || {})) bits.push(`<span class="tq-r">${typeof bagIcon === 'function' ? bagIcon(k) : k}<small>${n}</small></span>`);
  return bits.join('');
}
function cityTrail() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const v = Trail.state(S), tier = Trail.tiers.find(t => t.id === trailTab), pass = Trail.hasPass(S, tier.id), next = Trail.track.findIndex((m, i) => !v.ms.includes(i));
  const rows = Trail.quests.map(([key, text, target, dest]) => {
    const n = Math.min(target, v.c[key] || 0), done = n >= target, got = v.got[tier.id].includes(key);
    const btn = got ? `<button class="tq-btn got" disabled>${denPlain}Claimed</button>` : done ? (pass ? `<button class="tq-btn claim" onclick="trailClaim('${key}')">${denPlain}Claim</button>` : `<button class="tq-btn lock" onclick="trailPassPop('${tier.id}')">${denPlain}🔒 ${tier.name}</button>`) : `<button class="tq-btn go" onclick="go('${dest}')">${denPlain}Go</button>`;
    return `<article class="tq-row ${got ? 'got' : done ? 'done' : ''}"><h3>${text} <em>(${fmt(n)}/${fmt(target)})</em></h3><div class="tq-gifts">${trailGive(tier.give)}</div>${btn}</article>`;
  }).join('');
  $('#main').innerHTML = `<section class="tq-room tq-${tier.id}" style="--tqbg:url('${artPath('comp-trail-banner')}')">
   <div class="tq-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><span class="tq-wallet">${uiIcon('gold')}<b>${fmt(S.gold)}</b></span><span class="tq-wallet">${uiIcon('crystals')}<b>${fmt(S.scales || 0)}</b></span></div>
   <div class="tq-banner"><h1>Wayfarer Quests</h1><p>New tasks every day at 00:00 UTC · season ends in ${riteClock(Trail.seasonEnds() - Date.now())}</p></div>
   <div class="tq-track"><span class="tq-exp"><b>${fmt(v.exp)}</b><small>Wayfarer EXP</small></span><div class="tq-ms">${Trail.track.map((m, i) => `<button class="${v.ms.includes(i) ? 'got' : v.exp >= m[0] ? 'ready' : ''} ${i === next ? 'next' : ''}" onclick="trailMilestone(${i})">${denPlain}<i>${trailGive(m[1])}</i><small>${fmt(m[0])}</small></button>`).join('')}</div></div>
   <div class="tq-list">${rows}</div>
   <div class="tq-tabs">${Trail.tiers.map(t => `<button class="${t.id === trailTab ? 'on' : ''} ${t.id}" onclick="trailTab='${t.id}';cityTrail()">${denPlain}${t.name} Quests${Trail.hasPass(S, t.id) ? '' : ' 🔒'}</button>`).join('')}<button class="all" onclick="trailClaimAll()">${denPlain}Claim all</button></div>
  </section>`;
  const nx = document.querySelector('.tq-ms .next'); if (nx?.scrollIntoView) nx.scrollIntoView({ block: 'nearest', inline: 'center' });
}
function trailClaim(key) { const out = Trail.claim(S, key, trailTab); if (!out) return; save(); cityTrail(); trailGot([out]); }
function trailClaimAll() { if (!Trail.hasPass(S, trailTab)) return trailPassPop(trailTab); const all = Trail.claimAll(S, trailTab); if (!all.length) return toast('Nothing to claim yet'); save(); cityTrail(); trailGot(all); }
function trailMilestone(i) { const v = Trail.state(S); if (v.ms.includes(i)) return toast('Already claimed'); const out = Trail.milestone(S, i); if (!out) return toast('Reach ' + fmt(Trail.track[i][0]) + ' Wayfarer EXP'); save(); cityTrail(); trailGot([out]); }
function trailGot(list) {
  const sum = {}; for (const o of list) for (const [k, n] of Object.entries(o)) { if (k === 'items') { sum.items ??= {}; for (const [i, c] of Object.entries(n)) sum.items[i] = (sum.items[i] || 0) + c; } else if (k === 'riteId') sum.riteId = n; else sum[k] = (sum[k] || 0) + n; }
  popup(`<div class="tq-pop"><h2>You received</h2><div class="tq-gifts big">${trailGive(sum)}</div><button class="primary" onclick="$('#modal').close()">${denPlain}OK</button></div>`);
}
function trailPassPop(tier) {
  const t = Trail.tiers.find(x => x.id === tier);
  popup(`<div class="tq-pop"><h2>${t.name} Wayfarer Pass</h2><p>Unlocks the ${t.name} Quests tab for this month: every finished daily task pays this as well:</p><div class="tq-gifts big">${trailGive(t.give)}</div>
   <p>That is up to ${Trail.quests.length} extra rewards every day until the season ends (${riteClock(Trail.seasonEnds() - Date.now())}).</p>
   <button class="primary" onclick="trailBuy('${tier}')">${denPlain}${uiIcon('crystals')} ${fmt(t.price)}</button></div>`);
}
function trailBuy(tier) { if (!Trail.buyPass(S, tier)) return toast('Not enough prisms'); save(); $('#modal').close(); trailTab = tier; cityTrail(); toast(Trail.tiers.find(x => x.id === tier).name + ' Pass unlocked'); }
