// Wishwell (user sent photos of the reference's "Adventure Goals" behind its Snowland icon: pulls in today's gacha turn
// into tickets for the NEXT one). Own name, art and wording. It sits on top of Star Rites (src/rites.js):
// - Goals (user photo of the reference's Adventure Goals): pulls in the running rite earn tickets of the NEXT rite at
//   15 / 30 / 60 / 135 pulls (400 / 740 / 1,240 / 1,240 = 3,620), claimed by hand (Claim, or tap the well for all).
//   Goals reached but not claimed when the rite ends can still be claimed from the well during the next rite (they then
//   pay tickets of the rite that is running, which was the "next" one). There is no percentage carry-over (user: they
//   are not returns, they are tickets for the next gacha). Rites keeps the finished event's pulls in `S.rites.prev`.
// - Wish Coins: one per pull, plus daily Tasks; spent in the Wish Market (limits per rite).
// Rules are pure (node scripts/test-wishwell.mjs); the screen is below WISHWELL_UI. All numbers are placeholders.
const Wishwell = {
  coinPerPull: 1,
  goals: [{ at: 15, n: 400 }, { at: 30, n: 740 }, { at: 60, n: 1240 }, { at: 135, n: 1240 }],
  tasks: [
    { id: 'free', name: 'Make today\'s free pull', goal: 1, coins: 10, kind: 'free' },
    { id: 'p1', name: 'Pull once today', goal: 1, coins: 10, kind: 'pulls' },
    { id: 'p10', name: 'Pull 10 times today', goal: 10, coins: 30, kind: 'pulls' },
    { id: 'p30', name: 'Pull 30 times today', goal: 30, coins: 60, kind: 'pulls' },
    { id: 'p60', name: 'Pull 60 times today', goal: 60, coins: 100, kind: 'pulls' }
  ],
  wares: [
    { id: 'next', name: 'Next Rite Tickets', n: 100, price: 30, limit: 10, kind: 'next' },
    { id: 'cur', name: 'Current Rite Tickets', n: 100, price: 40, limit: 5, kind: 'cur' },
    { id: 'wish', name: 'Wish Ticket', n: 1, price: 15, limit: 10, kind: 'item' },
    { id: 'chest2', name: 'Moon Chest', n: 1, price: 25, limit: 5, kind: 'item' },
    { id: 'gembox', name: 'Jewel Box', n: 1, price: 40, limit: 3, kind: 'item' },
    { id: 'petegg', name: 'Pet Egg', n: 1, price: 60, limit: 2, kind: 'item' },
    { id: 'chest3', name: 'Winged Chest', n: 1, price: 90, limit: 1, kind: 'item' },
    { id: 'orb', name: 'Wish Orb', n: 1, price: 150, limit: 1, kind: 'orb' }
  ],
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  // The save part with the clocks applied. New pulls since the last look are counted for coins and today's tasks.
  state(s, now = Date.now()) {
    const r = Rites.state(s, now), today = this.day(now);
    const v = s.wishwell || (s.wishwell = { day: today, dayPulls: 0, done: [], coins: 0, seen: { period: r.ev.period, pulls: 0 }, bp: r.ev.period, buys: {} });
    if (v.day !== today) { v.day = today; v.dayPulls = 0; v.done = []; }
    let fresh = 0;
    if (r.prev && v.seen.period === r.prev.period) fresh += Math.max(0, r.prev.pulls - v.seen.pulls) + r.ev.pulls;
    else if (v.seen.period === r.ev.period) fresh += Math.max(0, r.ev.pulls - v.seen.pulls);
    else fresh += r.ev.pulls;
    if (fresh) { v.coins += fresh * this.coinPerPull; v.dayPulls += fresh; }
    v.seen = { period: r.ev.period, pulls: r.ev.pulls };
    if (v.bp !== r.ev.period) { v.bp = r.ev.period; v.buys = {}; }
    // Goal claims: `g` for the running rite, `pg` for the one before. Goals the old rules paid automatically (they are
    // in the rite's `got`) count as claimed.
    if (!v.g || v.g.p !== r.ev.period) {
      v.pg = v.g && v.g.p === r.ev.period - 1 ? v.g : null;
      v.g = { p: r.ev.period, got: (r.ev.got || []).filter(at => this.goals.some(x => x.at === at)) };
    }
    return v;
  },
  goalState(s, at, now = Date.now()) {
    const v = this.state(s, now), r = Rites.state(s, now);
    return v.g.got.includes(at) ? 'got' : r.ev.pulls >= at ? 'ready' : 'open';
  },
  claimGoal(s, at, now = Date.now()) {
    const m = this.goals.find(x => x.at === at); if (!m || this.goalState(s, at, now) !== 'ready') return 0;
    const v = this.state(s, now), r = Rites.state(s, now), next = Rites.rite(r.ev.period + 1);
    v.g.got.push(at); r.t[next.id] = (r.t[next.id] || 0) + m.n; return m.n;
  },
  // Reached but unclaimed goals of the finished rite (paid in tickets of the running rite).
  leftover(s, now = Date.now()) {
    const v = this.state(s, now), r = Rites.state(s, now);
    if (!v.pg || !r.prev || r.prev.period !== v.pg.p) return [];
    return this.goals.filter(m => r.prev.pulls >= m.at && !v.pg.got.includes(m.at));
  },
  // Tickets waiting in the well: ready goals of this rite + leftovers of the last one.
  due(s, now = Date.now()) {
    return this.goals.filter(m => this.goalState(s, m.at, now) === 'ready').reduce((a, m) => a + m.n, 0) + this.leftover(s, now).reduce((a, m) => a + m.n, 0);
  },
  claimAll(s, now = Date.now()) {
    const v = this.state(s, now), r = Rites.state(s, now), cur = Rites.rite(r.ev.period), out = { next: 0, cur: 0 };
    for (const m of this.leftover(s, now)) { v.pg.got.push(m.at); r.t[cur.id] = (r.t[cur.id] || 0) + m.n; out.cur += m.n; }
    for (const m of this.goals) out.next += this.claimGoal(s, m.at, now);
    return out;
  },
  progress(s, t, now = Date.now()) { const v = this.state(s, now); return t.kind === 'free' ? (Rites.state(s, now).ev.free === this.day(now) ? 1 : 0) : v.dayPulls; },
  claimTask(s, id, now = Date.now()) {
    const t = this.tasks.find(x => x.id === id), v = this.state(s, now);
    if (!t || v.done.includes(id) || this.progress(s, t, now) < t.goal) return 0;
    v.done.push(id); v.coins += t.coins; return t.coins;
  },
  left(s, w, now = Date.now()) { return w.limit - (this.state(s, now).buys[w.id] || 0); },
  buy(s, id, now = Date.now(), rng = Math.random) {
    const w = this.wares.find(x => x.id === id), v = this.state(s, now);
    if (!w) return { ok: false, why: 'Unknown ware' };
    if (this.left(s, w, now) < 1) return { ok: false, why: 'Sold out for this rite' };
    if (v.coins < w.price) return { ok: false, why: 'Not enough Wish Coins' };
    const r = Rites.state(s, now), p = r.ev.period;
    v.coins -= w.price; v.buys[w.id] = (v.buys[w.id] || 0) + 1;
    if (w.kind === 'next' || w.kind === 'cur') { const rite = Rites.rite(w.kind === 'next' ? p + 1 : p); r.t[rite.id] = (r.t[rite.id] || 0) + w.n; return { ok: true, tickets: w.n, rite }; }
    if (w.kind === 'orb') { const missing = Rites.orbs.filter(o => !r.orbs[o[0]]), pool = missing.length ? missing : Rites.orbs, o = pool[Math.floor(rng() * pool.length)]; const got = Rites.give(s, r, { kind: 'orb', id: o[0], name: o[1], rarity: 'epic' }); return { ok: true, orb: o[1], got }; }
    if (typeof WonderGear !== 'undefined') WonderGear.bagAdd(s, w.id, w.n); else { s.bag = s.bag || {}; s.bag[w.id] = (s.bag[w.id] || 0) + w.n; }
    return { ok: true, item: w.id };
  },
  valid(v) {
    if (v === undefined) return true;
    const int = n => Number.isSafeInteger(n) && n >= 0 && n <= 1e9;
    const gl = g => g === undefined || g === null || !!g && typeof g === 'object' && Number.isSafeInteger(g.p) && Array.isArray(g.got) && g.got.length <= this.goals.length && g.got.every(at => this.goals.some(m => m.at === at));
    return !!v && typeof v === 'object' && /^\d{4}-\d{2}-\d{2}$/.test(v.day) && int(v.dayPulls) && Array.isArray(v.done) && v.done.every(id => this.tasks.some(t => t.id === id))
      && int(v.coins) && !!v.seen && Number.isSafeInteger(v.seen.period) && int(v.seen.pulls) && (v.claimed === undefined || Number.isSafeInteger(v.claimed)) && Number.isSafeInteger(v.bp) && gl(v.g) && gl(v.pg)
      && !!v.buys && typeof v.buys === 'object' && Object.entries(v.buys).every(([k, n]) => this.wares.some(w => w.id === k) && int(n));
  }
};
if (typeof module !== 'undefined') module.exports = { Wishwell };

// WISHWELL_UI
let wellTab = 'goals', wellTimer = 0;
function wellCoin(cls = '') { return `<img class="ww-coin ${cls}" src="${artPath('wishwell-coin')}" alt="Wish Coin">`; }
function wellStop() { clearInterval(wellTimer); wellTimer = 0; }
function wellTick() { if (screen !== 'wishwell') return wellStop(); const t = document.querySelectorAll('[data-ww-clock]'); const ms = Rites.ends(Rites.period()) - Date.now(); t.forEach(el => { el.textContent = riteClock(ms); }); }
function wellGo(tab) { wellTab = tab; showWishwell(); }
function showWishwell() {
  const r = Rites.state(S), v = Wishwell.state(S), p = r.ev.period, rite = Rites.rite(p), next = Rites.rite(p + 1);
  const due = Wishwell.due(S), last = Wishwell.goals[Wishwell.goals.length - 1].at, round = ((p % 4) + 4) % 4 + 1;
  save(); bagArtVars?.();
  const wallet = `<div class="ww-wallet"><span onclick="go('rites')">${riteTicket(rite)}<b>${fmt(Rites.tickets(S, rite.id))}</b><i class="ww-plus">+</i></span><span>${riteTicket(next)}<b>${fmt(Rites.tickets(S, next.id))}</b></span><span onclick="wellGo('shop')">${wellCoin()}<b>${fmt(v.coins)}</b><i class="ww-plus">+</i></span></div>`;
  let body = '';
  if (wellTab === 'goals') {
    const rows = Wishwell.goals.map(m => {
      const st = Wishwell.goalState(S, m.at), pct = Math.min(100, r.ev.pulls / m.at * 100);
      // Four tiles like the reference (4 x 100 = 400 ...).
      const tile = `<span class="ww-tile tk" style="--tk:${next.hue}" title="${next.ticket}">${riteTicket(next)}<b>${fmt(m.n / 4)}</b></span>`.repeat(4);
      return `<div class="ww-row ${st === 'got' ? 'got' : ''}"><p>Pull ${m.at} times in ${rite.name} <em>(${fmt(r.ev.pulls)}/${m.at})</em></p><div class="ww-rbody"><div class="ww-tiles">${tile}</div>${st === 'got' ? '<i class="ww-stamp">Claimed</i>' : st === 'ready' ? `<button class="ww-gold" onclick="wellGoal(${m.at})">${denPlain}Claim</button>` : `<span class="ww-bar"><u style="width:${pct}%"></u></span>`}</div></div>`;
    }).join('');
    const left = Wishwell.leftover(S).reduce((a, m) => a + m.n, 0);
    body = `<div class="ww-claim"><p>Claim countdown <b data-ww-clock>${riteClock(Rites.ends(p) - Date.now())}</b></p><p class="ww-big">${riteTicket(next)}<b>×${fmt(due - left)}</b>${left ? ` ${riteTicket(rite)}<b>×${fmt(left)}</b>` : ''}</p>${due ? `<button class="ww-gold" onclick="wellClaim()">${denPlain}Claim all</button>` : ''}</div>
      <div class="ww-board"><div class="ww-list">${rows}</div><p class="ww-foot">Current round ${round}/4 · time remaining <b data-ww-clock>${riteClock(Rites.ends(p) - Date.now())}</b></p></div>`;
  } else if (wellTab === 'shop') {
    body = `<div class="ww-board shop"><p class="ww-head">Wish Market · ${wellCoin()}${fmt(v.coins)} · limits reset with every rite</p><div class="ww-grid">${Wishwell.wares.map(w => {
      const left = Wishwell.left(S, w), ico = w.kind === 'next' ? riteTicket(next) : w.kind === 'cur' ? riteTicket(rite) : w.kind === 'orb' ? riteIcon(4) : bagIcon(w.id);
      const name = w.kind === 'next' ? next.ticket : w.kind === 'cur' ? rite.ticket : w.name;
      return `<button class="ww-ware ${left < 1 ? 'out' : ''}" onclick="wellBuy('${w.id}')">${denPlain}<span class="ww-wico">${ico}${w.n > 1 ? `<b>×${w.n}</b>` : ''}</span><strong>${name}</strong><small>Left ${left}/${w.limit}</small><em>${wellCoin()}${w.price}</em>${left < 1 ? '<i class="ww-sold">Sold out</i>' : ''}</button>`;
    }).join('')}</div></div>`;
  } else {
    body = `<div class="ww-board tasks"><p class="ww-head">Daily tasks · reset at 00:00 UTC</p><div class="ww-list">${Wishwell.tasks.map(t => {
      const have = Math.min(t.goal, Wishwell.progress(S, t)), done = v.done.includes(t.id), ready = !done && have >= t.goal;
      return `<div class="ww-task"><div><b>${t.name}</b><span class="ww-bar"><u style="width:${have / t.goal * 100}%"></u></span><small>${have}/${t.goal}</small></div><span class="ww-tile">${wellCoin()}<b>${t.coins}</b></span>${done ? '<i class="ww-stamp">Claimed</i>' : `<button class="${ready ? 'ww-gold' : 'ww-go'}" onclick="${ready ? `wellTask('${t.id}')` : "go('rites')"}">${denPlain}${ready ? 'Claim' : 'Go'}</button>`}</div>`;
    }).join('')}</div></div>`;
  }
  const tabs = [['goals', 'Goals'], ['shop', 'Wish Market'], ['tasks', 'Tasks']];
  $('#main').innerHTML = `<section class="ww-room ww-${wellTab}" style="--ww-bg:url('${artPath('wishwell-bg')}')">
    <div class="ww-top"><button class="ww-help" onclick="wellRules()">${denPlain}?</button>${wallet}</div>
    <h1 class="ww-title"><span>Wishwell</span></h1>
    ${wellTab === 'goals' ? `<button class="ww-orb ${due ? 'due' : ''}" onclick="wellClaim()">${denPlain}<b>${Math.round(Math.min(1, r.ev.pulls / last) * 100)}%</b><small>${due ? 'Tap to claim' : 'goals'}</small></button>` : ''}
    ${body}
    <div class="ww-nav"><button class="ww-back" data-back onclick="go('home')" aria-label="Back">‹</button>${tabs.map(([id, n], i) => `<button class="${wellTab === id ? 'on' : ''}" onclick="wellGo('${id}')">${denPlain}<i class="ww-nico n${i}">${i === 0 ? riteTicket(next) : i === 1 ? wellCoin() : '✓'}</i><span>${n}</span>${id === 'tasks' && Wishwell.tasks.some(t => !v.done.includes(t.id) && Wishwell.progress(S, t) >= t.goal) || id === 'goals' && due ? '<em></em>' : ''}</button>`).join('')}</div>
  </section>`;
  wellStop(); wellTimer = setInterval(wellTick, 30000);
}
function wellClaim() {
  const r = Wishwell.claimAll(S), p = Rites.period(); if (!r.next && !r.cur) { toast('Pull in ' + Rites.rite(p).name + ' to reach the goals'); return; }
  save(); toast([r.next && fmt(r.next) + ' ' + Rites.rite(p + 1).ticket, r.cur && fmt(r.cur) + ' ' + Rites.rite(p).ticket].filter(Boolean).join(' + ') + ' added'); showWishwell();
}
function wellGoal(at) { const n = Wishwell.claimGoal(S, at); if (!n) return; save(); toast(fmt(n) + ' ' + Rites.rite(Rites.period() + 1).ticket + ' added'); showWishwell(); }
function wellTask(id) { const n = Wishwell.claimTask(S, id); if (!n) return; save(); toast('+' + n + ' Wish Coins'); showWishwell(); }
function wellBuy(id) {
  const r = Wishwell.buy(S, id); if (!r.ok) { toast(r.why); return; }
  save(); toast(r.tickets ? r.tickets + ' ' + r.rite.ticket + ' added' : r.orb ? r.orb + ' added to your orbs' : WonderGear.bagItemById[r.item].name + ' sent to the bag'); showWishwell();
}
function wellRules() {
  popup(`<div class="ww-pop"><h2>Wishwell</h2><ol>
    <li>Pull ${Wishwell.goals.map(m => m.at).join(', ')} times in the running Star Rite to earn tickets of the next rite (${Wishwell.goals.map(m => fmt(m.n)).join(' / ')}). Claim each goal, or tap the well to claim all.</li>
    <li>Goals reached but not claimed before the rite ends wait in the well during the next rite.</li>
    <li>Each pull also gives a Wish Coin. Daily tasks give more. Spend them in the Wish Market; its limits refresh with every rite.</li></ol></div>`);
}
