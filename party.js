// Splash Party (user photos of the reference's "Pet Party" event): an event mini-game on a 4 x 4 board. Swipe up,
// down, left or right: all pets slide, two identical pets that meet merge into the next of eleven tiers (our own
// familiar paintings) and give synthesis points. Each move costs 1 stamina (recovers over time, back to full at 00:00
// UTC, Stamina Potions add more). Party Fireworks, Party Cake and the Magic Wand help; each item has a limit per
// round. A full board with no moves is a deadlock: use an item or start a new round (that finalizes the score). The
// event lasts a week: the best round score ranks Reina against AI adventurers, the total points of all rounds open the
// Heavenly Gifts track (Basic free, Advanced and Heavenly unlocked for prisms), tiers reached pay achievements, and the
// final rank pays personal rewards when the event ends. Event items are cleared when it ends. All numbers are
// placeholders. Rules first (pure, tested by scripts/test-party.mjs), the screen below the PARTY_UI marker.
const Party = {
  size: 4, maxTier: 11,
  // Tier ladder: our familiars, small and cute first (ids are WonderGear pet ids, art familiar-<n>).
  tiers: [['d47', 'Bubblewing'], ['d4', 'Leafcurl'], ['d5', 'Cinderpip'], ['d6', 'Shellkin'], ['d8', 'Plumwing'], ['d11', 'Sandfrill'],
    ['d15', 'Frostglass'], ['d22', 'Venomfrill'], ['d27', 'Bloomwing'], ['d36', 'Pearl Seraph'], ['d43', 'Starborn']],
  points(tier) { return 10 * tier; },           // making a tier-n pet: +10 x n (tier 2 = +20, as in the reference's gallery)
  eventDays: 7, anchor: Date.UTC(2026, 10, 23),
  staminaMax: 200, regenMs: 5 * 60e3, potionStamina: 5,
  itemIds: ['fire', 'cake', 'wand', 'potion'],
  items: { fire: { name: 'Party Fireworks', text: 'Clears every pet of the lowest tier on the board.' },
    cake: { name: 'Party Cake', text: 'Turns every tier 1 pet on the board into tier 2.' },
    wand: { name: 'Magic Wand', text: 'Tap a pet: it rises one tier.' },
    potion: { name: 'Stamina Potion', text: '+5 stamina.' } },
  roundLimit: { fire: 3, cake: 3, wand: 3, potion: 10 },
  starter: { fire: 1, cake: 1, wand: 1, potion: 5 },
  // Heavenly Gifts (user photos of the whole reference track): 21 rows from 1 to 72,000 total points. Each row: Basic =
  // one material (x6, or x3 for rarer ones), Advanced = the same material doubled, Heavenly = two special items x1.
  track: [[1, 'exp1', 6, 'chest1', 'potion'], [2000, 'stonebag', 6, 'shardbag', 'gembox'], [4000, 'sealbag', 6, 'chest2', 'essence'],
    [6000, 'gold1', 6, 'gembox', 'sealbag'], [8000, 'exp2', 6, 'wish', 'chest2'], [10000, 'shardbag', 6, 'fire', 'cake'],
    [12000, 'potion', 3, 'potion', 'wand'], [14000, 'stonebag', 6, 'gembox', 'essence'], [16000, 'essence', 3, 'petegg', 'chest2'],
    [18000, 'gold2', 3, 'wish', 'sealbag'], [22000, 'fire', 1, 'fire', 'potion'], [26000, 'sealbag', 6, 'chest3', 'shardbag'],
    [30000, 'exp2', 6, 'gembox', 'wish'], [34000, 'shardbag', 6, 'chest3', 'essence'], [38000, 'stonebag', 6, 'petegg', 'gembox'],
    [42000, 'gold2', 6, 'wish', 'chest3'], [46000, 'exp2', 6, 'petegg', 'sealbag'], [52000, 'gembox', 3, 'chest3', 'wish'],
    [58000, 'essence', 3, 'petegg', 'gembox'], [64000, 'sealbag', 3, 'petegg', 'chest3'], [72000, 'cake', 1, 'petegg', 'potion']]
    .map(([at, m, n, h1, h2]) => ({ at, b: { [m]: n }, a: { [m]: n * 2 }, h: h1 === h2 ? { [h1]: 2 } : { [h1]: h1 === 'potion' ? 5 : 1, [h2]: h2 === 'potion' ? 5 : 1 } })),
  unlock: { a: 680, h: 1280 }, refund: { a: 60, h: 300 }, value: { a: 7000, h: 29000 },   // prisms (real money is not built)
  packs: [
    { id: 'p1', name: 'Event Pack I', price: 30, limit: 1, give: { potion: 20, gold: 2000 } },
    { id: 'p2', name: 'Event Pack II', price: 120, limit: 2, give: { potion: 20, fire: 1, gold: 5000 } },
    { id: 'p3', name: 'Event Pack III', price: 400, limit: 3, give: { potion: 30, fire: 2, cake: 2, gold: 12000 } },
    { id: 'p4', name: 'Event Pack IV', price: 600, limit: 3, give: { potion: 40, fire: 3, cake: 4, wand: 2, gold: 20000 } }],
  // Personal rewards by final rank, each with a minimum best score.
  ranks: [{ from: 1, to: 1, min: 8000, give: { petegg: 2, chest3: 2, wish: 3 } }, { from: 2, to: 3, min: 5000, give: { petegg: 1, chest3: 1, wish: 2 } },
    { from: 4, to: 5, min: 3000, give: { chest2: 2, wish: 1 } }, { from: 6, to: 10, min: 1000, give: { chest2: 1, chest1: 2 } }],
  // Achievements: a tier reached in a single round, once per event.
  achieve: { 2: { exp1: 3 }, 3: { gold1: 3 }, 4: { stonebag: 2 }, 5: { shardbag: 1 }, 6: { chest1: 2 }, 7: { chest2: 1 }, 8: { wish: 2 }, 9: { gembox: 1 }, 10: { petegg: 1 }, 11: { chest3: 2, wand: 1 } },
  aiNames: ['Lyra', 'Bram', 'Kael', 'Nyra', 'Orin', 'Pip', 'Sela', 'Thorne', 'Wren', 'Ysolde', 'Corwin', 'Fenna', 'Galen', 'Ilsa', 'Juno', 'Lorcan', 'Mira', 'Niamh',
    'Oska', 'Perrin', 'Quill', 'Rhea', 'Soren', 'Tamsin', 'Ulla', 'Vale', 'Wilder', 'Xan', 'Yara', 'Zephyr', 'Aster', 'Briar', 'Cael', 'Dara', 'Elio', 'Faye', 'Gwyn', 'Hale', 'Isra', 'Jory'],

  // ---- event clock ----
  period(now = Date.now()) { return Math.floor((now - this.anchor) / (this.eventDays * 864e5)); },
  ends(period) { return this.anchor + (period + 1) * this.eventDays * 864e5; },
  day(t) { return Math.floor(t / 864e5); },

  // ---- board ----
  empty() { return Array(this.size * this.size).fill(0); },
  lines(dir) {
    const n = this.size, out = [];
    for (let a = 0; a < n; a++) {
      const line = [];
      for (let b = 0; b < n; b++) {
        if (dir === 'left') line.push(a * n + b); else if (dir === 'right') line.push(a * n + (n - 1 - b));
        else if (dir === 'up') line.push(b * n + a); else line.push((n - 1 - b) * n + a);
      }
      out.push(line);
    }
    return out;
  },
  // Slide toward dir; returns the new board, whether anything moved, merges [{at, tier}] and points.
  slide(board, dir) {
    const next = board.slice(), merges = []; let moved = false, points = 0;
    for (const line of this.lines(dir)) {
      const vals = line.map(i => board[i]).filter(Boolean), res = [];
      for (let k = 0; k < vals.length; k++) {
        if (k + 1 < vals.length && vals[k] === vals[k + 1] && vals[k] < this.maxTier) {
          const t = vals[k] + 1; res.push(t); merges.push({ at: line[res.length - 1], tier: t }); points += this.points(t); k++;
        } else res.push(vals[k]);
      }
      line.forEach((i, k) => { const v = res[k] || 0; if (next[i] !== v) moved = true; next[i] = v; });
    }
    return { board: next, moved, merges, points };
  },
  canMove(board) { return ['left', 'right', 'up', 'down'].some(d => this.slide(board, d).moved); },
  spawn(board, rng = Math.random) {
    const free = board.map((v, i) => v ? -1 : i).filter(i => i >= 0); if (!free.length) return -1;
    const at = free[Math.floor(rng() * free.length)]; board[at] = rng() < .1 ? 2 : 1; return at;
  },
  newRound(rng = Math.random) { const board = this.empty(); this.spawn(board, rng); this.spawn(board, rng); return { board, score: 0, top: Math.max(...board), used: {}, over: false }; },

  // ---- save state (S.party, optional) ----
  fresh(now = Date.now(), rng = Math.random) {
    return { period: this.period(now), stamina: this.staminaMax, stamAt: now, best: 0, bestAt: 0, total: 0, reach: 0, items: { ...this.starter },
      round: this.newRound(rng), track: { b: [], a: [], h: [] }, unlock: { a: false, h: false }, packs: {}, ach: [] };
  },
  // Bring a saved state up to now: a new event week starts fresh (event items cleared) and reports the final result
  // of the old one (`due`, paid by the screen); stamina recovers and refills at 00:00 UTC.
  roll(saved, now = Date.now(), rng = Math.random) {
    let v = saved ? JSON.parse(JSON.stringify(saved)) : null, due = null;
    const cur = this.period(now);
    if (v && v.period !== cur) {
      if (v.best > 0) { const rank = this.rankOf(v.best, v.bestAt, v.period, this.ends(v.period)), tier = this.rankTier(rank, v.best); due = { period: v.period, rank, best: v.best, give: tier ? tier.give : null }; }
      const stam = v.stamina; v = this.fresh(now, rng); v.stamina = Math.max(stam, 0);
    }
    if (!v) v = this.fresh(now, rng);
    if (this.day(now) !== this.day(v.stamAt) && v.stamina < this.staminaMax) { v.stamina = this.staminaMax; v.stamAt = now; }
    if (v.stamina < this.staminaMax) { const k = Math.floor((now - v.stamAt) / this.regenMs); if (k > 0) { v.stamina = Math.min(this.staminaMax, v.stamina + k); v.stamAt += k * this.regenMs; } }
    else v.stamAt = now;
    return { v, due };
  },
  nextStamina(v, now = Date.now()) { return v.stamina >= this.staminaMax ? 0 : Math.max(0, v.stamAt + this.regenMs - now); },
  // One swipe. Returns {ok, err, merges, points, spawned, over}.
  swipe(v, dir, now = Date.now(), rng = Math.random) {
    const r = v.round; if (r.over) return { ok: false, err: 'deadlock' };
    if (v.stamina < 1) return { ok: false, err: 'stamina' };
    const s = this.slide(r.board, dir); if (!s.moved) return { ok: false, err: 'still' };
    if (v.stamina >= this.staminaMax) v.stamAt = now;
    v.stamina--; r.board = s.board; r.score += s.points; v.total += s.points;
    for (const m of s.merges) r.top = Math.max(r.top, m.tier);
    v.reach = Math.max(v.reach, r.top);
    if (r.score > v.best) { v.best = r.score; v.bestAt = now; }
    const spawned = this.spawn(r.board, rng); r.over = !this.canMove(r.board);
    return { ok: true, merges: s.merges, points: s.points, spawned, over: r.over };
  },
  useItem(v, id, arg) {
    const r = v.round, lim = this.roundLimit[id];
    if (!this.itemIds.includes(id) || (v.items[id] || 0) < 1) return { ok: false, err: 'none' };
    if ((r.used[id] || 0) >= lim) return { ok: false, err: 'limit' };
    if (id === 'potion') v.stamina += this.potionStamina;
    else if (id === 'fire') { const low = Math.min(...r.board.filter(Boolean)); if (!Number.isFinite(low)) return { ok: false, err: 'empty' }; r.board = r.board.map(t => t === low ? 0 : t); }
    else if (id === 'cake') { if (!r.board.includes(1)) return { ok: false, err: 'nothing' }; r.board = r.board.map(t => t === 1 ? 2 : t); r.top = Math.max(r.top, 2); }
    else if (id === 'wand') { const t = r.board[arg]; if (!Number.isInteger(arg) || !t || t >= this.maxTier) return { ok: false, err: 'pick' }; r.board[arg] = t + 1; r.top = Math.max(r.top, t + 1); }
    v.items[id]--; r.used[id] = (r.used[id] || 0) + 1; v.reach = Math.max(v.reach, r.top);
    if (id !== 'potion') r.over = !this.canMove(r.board);
    return { ok: true };
  },
  restart(v, rng = Math.random) { v.round = this.newRound(rng); },
  // ---- rewards ----
  trackOpen(v, row) { return v.total >= this.track[row].at; },
  trackClaim(v, col, row) {
    if (!this.track[row] || !['b', 'a', 'h'].includes(col) || v.track[col].includes(row) || !this.trackOpen(v, row) || (col !== 'b' && !v.unlock[col])) return null;
    v.track[col].push(row); return this.track[row][col];
  },
  unlockCol(v, s, col) { const p = this.unlock[col]; if (!p || v.unlock[col] || (s.scales || 0) < p) return false; s.scales -= p - (this.refund[col] || 0); v.unlock[col] = true; return true; },
  // Everything a column holds, and what it holds in the rows already open (the offer window shows both).
  colGifts(v, col, openOnly) { const out = {}; this.track.forEach((row, i) => { if (openOnly && !this.trackOpen(v, i)) return; for (const [k, n] of Object.entries(row[col])) out[k] = (out[k] || 0) + n; }); return out; },
  buyPack(v, s, id) { const p = this.packs.find(x => x.id === id); if (!p || (v.packs[id] || 0) >= p.limit || (s.scales || 0) < p.price) return null; s.scales -= p.price; v.packs[id] = (v.packs[id] || 0) + 1; return p.give; },
  achClaim(v, tier) { if (!this.achieve[tier] || v.ach.includes(tier) || v.reach < tier) return null; v.ach.push(tier); return this.achieve[tier]; },
  // Split a reward into event items (into S.party.items), gold and bag items.
  split(give) { const ev = {}, bag = {}; let gold = 0; for (const [k, n] of Object.entries(give || {})) { if (this.itemIds.includes(k)) ev[k] = n; else if (k === 'gold') gold += n; else bag[k] = n; } return { ev, bag, gold }; },
  // ---- AI field (simulated, labelled AI) ----
  mix(a, b) { let h = (a * 2654435761 + b * 40503) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; },
  field(period, now = Date.now()) {
    const start = this.ends(period) - this.eventDays * 864e5, f = Math.min(1, Math.max(0, (now - start) / (this.eventDays * 864e5 * .75)));
    return this.aiNames.map((name, i) => { const fin = Math.round(400 + Math.pow(this.mix(period + 99, i), 2.2) * 9600); return { name, ai: true, score: Math.round(fin * Math.pow(f, .7) / 10) * 10, at: start + i * 6e5 }; })
      .filter(x => x.score > 0).sort((a, b) => b.score - a.score || a.at - b.at);
  },
  // Rank by best round score; ties go to whoever got there first.
  rankOf(best, bestAt, period, now = Date.now()) { if (!best) return 0; return 1 + this.field(period, now).filter(x => x.score > best || (x.score === best && x.at <= bestAt)).length; },
  rankTier(rank, best) { return this.ranks.find(t => rank >= t.from && rank <= t.to && best >= t.min) || null; },
  valid(v) {
    const int = (n, max = 1e9) => Number.isInteger(n) && n >= 0 && n <= max, obj = o => !!o && typeof o === 'object' && !Array.isArray(o), r = v && v.round;
    return obj(v) && Number.isInteger(v.period) && int(v.stamina, 1e5) && Number.isFinite(v.stamAt) && int(v.best) && Number.isFinite(v.bestAt) && int(v.total, 1e10) && int(v.reach, this.maxTier)
      && obj(v.items) && Object.entries(v.items).every(([k, n]) => this.itemIds.includes(k) && int(n, 1e5))
      && obj(r) && Array.isArray(r.board) && r.board.length === this.size * this.size && r.board.every(t => int(t, this.maxTier)) && int(r.score) && int(r.top, this.maxTier) && typeof r.over === 'boolean'
      && obj(r.used) && Object.entries(r.used).every(([k, n]) => this.itemIds.includes(k) && int(n, 1e3))
      && obj(v.track) && ['b', 'a', 'h'].every(c => Array.isArray(v.track[c]) && v.track[c].every(i => int(i, this.track.length - 1)) && new Set(v.track[c]).size === v.track[c].length)
      && obj(v.unlock) && typeof v.unlock.a === 'boolean' && typeof v.unlock.h === 'boolean'
      && obj(v.packs) && Object.entries(v.packs).every(([k, n]) => this.packs.some(p => p.id === k) && int(n, 99))
      && Array.isArray(v.ach) && v.ach.every(t => Object.hasOwn(this.achieve, t)) && new Set(v.ach).size === v.ach.length;
  }
};

// PARTY_UI
let partyView = 'lobby', partyTimer = 0, partyFx = null, partyWandArmed = false, partyTouch = null;
function partyArt(t) { const id = Party.tiers[t - 1][0]; return artPath('familiar-' + id.slice(1)); }
function partyIconPos(id) { const n = Party.itemIds.indexOf(id); return (n % 2) * 100 + '% ' + Math.floor(n / 2) * 100 + '%'; }
function partyIcon(id, n) { return `<i class="pp-ico" style="background-image:url('${artPath('comp-party-items')}');background-position:${partyIconPos(id)}"></i>${n !== undefined ? `<b>${fmt(n)}</b>` : ''}`; }
function partyGiftTile(id, n) {
  if (Party.itemIds.includes(id)) return `<span class="pp-gift">${partyIcon(id, n)}</span>`;
  if (id === 'gold') return `<span class="pp-gift gold">${uiIcon('gold')}<b>${fmt(n)}</b></span>`;
  const it = WonderGear.bagItemById[id];
  return `<span class="pp-gift" title="${it ? it.name : id}">${typeof bagIcon === 'function' ? bagIcon(id) : ''}<b>${fmt(n)}</b><small>${it ? it.name : id}</small></span>`;
}
function partyGifts(give) { if (typeof bagArtVars === 'function') bagArtVars(); return Object.entries(give || {}).map(([k, n]) => partyGiftTile(k, n)).join(''); }
// State with the clock applied; pays the final result of a finished event week once.
function partyState() {
  const { v, due } = Party.roll(S.party, Date.now());
  if (due && due.give) { partyPay(due.give, v); if (WonderGear.socialNote) WonderGear.socialNote(S, `Splash Party ended: rank ${due.rank}, rewards sent to the bag.`); toast('Splash Party rewards: rank ' + due.rank); }
  S.party = v; return v;
}
function partyPay(give, v = S.party) {
  const { ev, bag, gold } = Party.split(give);
  for (const [k, n] of Object.entries(ev)) v.items[k] = (v.items[k] || 0) + n;
  for (const [k, n] of Object.entries(bag)) WonderGear.bagAdd(S, k, n);
  if (gold) S.gold += gold;
}
function partyClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + 'd ' : '') + h + 'h ' + String(m).padStart(2, '0') + 'm ' + String(s % 60).padStart(2, '0') + 's'; }
function partyStop() { clearInterval(partyTimer); partyTimer = 0; }
function partyTick() {
  if (screen !== 'party') return partyStop();
  const v = S.party; if (!v) return;
  const t = document.querySelector('.pp-time'); if (t) t.textContent = partyClock(Party.ends(v.period) - Date.now());
  const st = document.querySelector('.pp-stam small'); if (st) { const n = Party.nextStamina(v); st.textContent = n ? '+1 in ' + Math.ceil(n / 60000) + 'm' : 'Full'; }
}
// After a page reload (the chat preview reloads when a new version is published) go straight back to the board if it
// was open, so a running round never looks lost.
let partyFirstShow = true;
function partyMark(view) { try { localStorage.setItem('wow-party-view', view); } catch {} }
function showParty() {
  if (partyFirstShow) { partyFirstShow = false; let was = ''; try { was = localStorage.getItem('wow-party-view') || ''; } catch {}
    if (was === 'board') { partyState(); save(); return partyPlay(); } }
  partyMark('lobby');
  partyView = 'lobby'; partyWandArmed = false; const v = partyState(); save();
  const rank = Party.rankOf(v.best, v.bestAt, v.period), claim = partyClaimable(v);
  const crew = [5, 8, 10, 3, 1].map((t, i) => `<img class="pp-pet pp-pet${i}" src="${partyArt(t)}" alt="${Party.tiers[t - 1][1]}">`).join('');
  $('#main').innerHTML = `<section class="pp-room" style="--ppbg:url('${artPath('comp-party-bg')}')">
   <div class="pp-top"><button data-back aria-label="Back" onclick="go('games')">‹</button><span class="pp-time">${partyClock(Party.ends(v.period) - Date.now())}</span><span class="pp-wallet">${uiIcon('crystals')}<b>${fmt(S.scales || 0)}</b></span></div>
   <h1 class="pp-title">Splash Party</h1>
   <div class="pp-score"><span>My Point: <b>${fmt(v.best)}</b></span><span>My Rank: <b>${rank || 'None'}</b></span></div>
   <button class="pp-side pp-help" onclick="partyRules()">${denPlain}?</button>
   <button class="pp-side pp-gifts" onclick="partyTrack()">${denPlain}<i>🎁</i><small>Heavenly Gifts</small>${claim.track ? '<em></em>' : ''}</button>
   <div class="pp-passes"><button class="a ${v.unlock.a ? 'on' : ''}" onclick="partyUnlock('a')">${denPlain}<img src="${partyArt(10)}" alt=""><span>Advanced<br>benefits</span>${v.unlock.a ? '<b>✓</b>' : ''}</button><button class="h ${v.unlock.h ? 'on' : ''}" onclick="partyUnlock('h')">${denPlain}<img src="${partyArt(11)}" alt=""><span>Heavenly<br>gifts</span>${v.unlock.h ? '<b>✓</b>' : ''}</button></div>
   <div class="pp-crew">${crew}</div>
   <button class="pp-start" onclick="partyPlay()">${denPlain}${v.round.score || v.round.board.filter(Boolean).length > 2 ? 'Continue' : 'Start game'}</button>
   <div class="pp-bar"><button onclick="partyRewardsPop()">${denPlain}<i>🏅</i><small>Rewards</small></button><button onclick="partyRankPop()">${denPlain}<i>🏆</i><small>Rank</small></button>
    <button onclick="partyPacksPop()">${denPlain}<i>💎</i><small>Gift Pack</small></button><button onclick="partyAchPop()">${denPlain}<i>⭐</i><small>Achievements</small>${claim.ach ? '<em></em>' : ''}</button></div>
  </section>`;
  partyStop(); partyTimer = setInterval(partyTick, 1000); partyTick();
}
function partyClaimable(v) { return { track: Party.track.some((row, i) => Party.trackOpen(v, i) && (!v.track.b.includes(i) || (v.unlock.a && !v.track.a.includes(i)) || (v.unlock.h && !v.track.h.includes(i)))), ach: Object.keys(Party.achieve).some(t => v.reach >= +t && !v.ach.includes(+t)) }; }
function partyPlay() { screenChangedAt = Date.now(); partyView = 'board'; partyMark('board'); partyBoard(); }
function partyBoard(fx = null) {
  const v = S.party, r = v.round, merged = new Set((fx?.merges || []).map(m => m.at));
  const cells = r.board.map((t, i) => `<div class="pp-cell">${t ? `<button class="pp-tile t${t} ${merged.has(i) ? 'pop' : ''} ${fx?.spawned === i ? 'new' : ''} ${partyWandArmed ? 'pick' : ''}" onclick="partyTileTap(${i})" aria-label="${Party.tiers[t - 1][1]}">${denPlain}<img src="${partyArt(t)}" alt=""><b>${t}</b></button>` : ''}</div>`).join('');
  const items = Party.itemIds.map(id => `<button class="pp-item ${partyWandArmed && id === 'wand' ? 'armed' : ''}" onclick="partyItem('${id}')" aria-label="${Party.items[id].name}">${denPlain}${partyIcon(id, v.items[id] || 0)}<small>${r.used[id] || 0}/${Party.roundLimit[id]}</small></button>`).join('');
  $('#main').innerHTML = `<section class="pp-room pp-play" style="--ppbg:url('${artPath('comp-party-bg')}')">
   <div class="pp-top"><button data-back aria-label="Back" onclick="showParty()">‹</button><span class="pp-time">${partyClock(Party.ends(v.period) - Date.now())}</span><span class="pp-wallet">${partyIcon('potion')}<b>${v.stamina}</b></span></div>
   <div class="pp-hud"><span>Score<b>${fmt(r.score)}</b></span><span>Best<b>${fmt(v.best)}</b></span><span>Top pet<b>${r.top ? Party.tiers[r.top - 1][1] : '—'}</b></span><span class="${v.stamina ? '' : 'pp-zero'}">Stamina<b>${v.stamina}/${Party.staminaMax}</b></span></div>
   <div class="pp-board" id="ppBoard">${cells}${r.over ? `<div class="pp-dead"><h2>Deadlock!</h2><p>No moves left. Use an item or start a new round (your score ${fmt(r.score)} is kept as a result).</p><button onclick="partyRestart()">${denPlain}New round</button></div>` : ''}</div>
   ${fx?.points ? `<div class="pp-float">+${fx.points}</div>` : ''}
   <p class="pp-hint">${partyWandArmed ? 'Tap a pet to raise it one tier.' : 'Swipe on the board (or use the arrow keys) to move all pets.'}</p>
   <div class="pp-items">${items}</div>
   <div class="pp-bar pp-gamebar"><button onclick="partyGallery()">${denPlain}<i>📖</i><small>Gallery</small></button><button onclick="partyAskRestart()">${denPlain}<i>↻</i><small>New round</small></button><button onclick="partyRules()">${denPlain}<i>?</i><small>Rules</small></button></div>
  </section>`;
  const b = $('#ppBoard'); if (b) { b.addEventListener('pointerdown', partyDown); b.addEventListener('pointerup', partyUp); b.addEventListener('pointercancel', () => partyTouch = null); }
  partyStop(); partyTimer = setInterval(partyTick, 1000);
}
function partyDown(e) { partyTouch = { x: e.clientX, y: e.clientY }; }
function partyUp(e) {
  if (!partyTouch) return; const dx = e.clientX - partyTouch.x, dy = e.clientY - partyTouch.y; partyTouch = null;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
  partyMove(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
}
function partyMove(dir) {
  if (screen !== 'party' || partyView !== 'board') return;
  const v = S.party, res = Party.swipe(v, dir);
  if (!res.ok) { if (res.err === 'stamina') partyNoStamina(); return; }
  save(); partyBoard(res);
  const top = res.merges.reduce((m, x) => Math.max(m, x.tier), 0);
  if (top >= 6 && top === v.round.top && res.merges.some(m => m.tier === top)) toast(Party.tiers[top - 1][1] + ' joined the party!');
}
// Out of stamina: say so plainly and offer the potion (if the round limit allows) or the wait.
function partyNoStamina() {
  const v = S.party, have = v.items.potion || 0, used = v.round.used.potion || 0, lim = Party.roundLimit.potion, next = Party.nextStamina(v);
  const can = have > 0 && used < lim, midnight = Math.ceil((Math.floor(Date.now() / 864e5) + 1) * 864e5 - Date.now());
  popup(`<h2>Out of stamina</h2><p class="pp-p">Every move costs 1 stamina. You have 0.</p><ul class="pp-rules"><li>+1 stamina in ${Math.max(1, Math.ceil(next / 60000))} min (one every 5 minutes)</li><li>Full ${Party.staminaMax} at 00:00 UTC, in ${partyClock(midnight)}</li><li>Stamina Potion: +${Party.potionStamina} (you have ${have}, used ${used}/${lim} this round)</li></ul>
   <div class="pp-row">${can ? `<button class="primary" onclick="document.querySelector('#modal').close();partyItem('potion')">${denPlain}Drink a potion (+${Party.potionStamina})</button>` : ''}<button onclick="document.querySelector('#modal').close()">${denPlain}Wait</button></div>${have ? '' : '<p class="pp-p">More potions: Heavenly Gifts and Gift Packs.</p>'}`);
}
function partyKey(e) { if (screen === 'party' && partyView === 'board' && !document.querySelector('#modal[open]')) { const d = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[e.key]; if (d) { e.preventDefault(); partyMove(d); } } }
if (typeof document !== 'undefined' && document.addEventListener) document.addEventListener('keydown', partyKey);
function partyItem(id) {
  const v = S.party;
  if (id === 'wand') { if ((v.items.wand || 0) < 1) return toast('No Magic Wand'); partyWandArmed = !partyWandArmed; return partyBoard(); }
  const res = Party.useItem(v, id);
  if (!res.ok) return toast({ none: 'None left: Heavenly Gifts and Gift Packs give more', limit: 'Limit for this round reached', empty: 'The board is empty', nothing: 'No tier 1 pets on the board' }[res.err] || 'Cannot use now');
  save(); partyBoard(); toast(Party.items[id].name + ' used');
}
function partyTileTap(i) {
  if (!partyWandArmed) return;
  const res = Party.useItem(S.party, 'wand', i); partyWandArmed = false;
  if (!res.ok) { partyBoard(); return toast(res.err === 'limit' ? 'Limit for this round reached' : 'This pet cannot rise'); }
  save(); partyBoard({ merges: [{ at: i, tier: S.party.round.board[i] }] });
}
function partyAskRestart() { popup(`<h2>New round?</h2><p class="pp-p">Your score of this round (${fmt(S.party.round.score)}) stays as a result. Synthesis points and item uses start again; stamina is kept.</p><div class="pp-row"><button class="primary" onclick="partyRestart()">${denPlain}New round</button><button onclick="document.querySelector('#modal').close()">${denPlain}Keep playing</button></div>`); }
function partyRestart() { document.querySelector('#modal')?.close?.(); Party.restart(S.party); save(); partyBoard(); }
function partyRules() {
  popup(`<h2>Splash Party</h2><ol class="pp-rules"><li>Swipe up, down, left or right: every pet on the board slides.</li><li>Each move costs 1 stamina. It recovers over time (+1 every 5 minutes) and refills to ${Party.staminaMax} at 00:00 UTC. Stamina Potions add more.</li>
  <li>Two identical pets that meet merge into the next tier and give synthesis points (tier n: +${Party.points(1)} x n).</li><li>Party Fireworks, Party Cake and the Magic Wand make merging easier; each item has a limit per round.</li>
  <li>When the board is full and nothing can move, it is a deadlock: use an item or start a new round.</li><li>A new round keeps the old score as a result. The ranking uses your best round score; whoever reached it first ranks higher on a tie.</li>
  <li>All points of all rounds open the Heavenly Gifts. Tier achievements pay once per event.</li><li>The event lasts ${Party.eventDays} days. Personal rewards are sent when it ends; event items are cleared then.</li><li>Everyone else on the ranking is an AI adventurer.</li></ol>`);
}
function partyTrack() {
  const v = S.party, col = (row, c, i) => { const got = v.track[c].includes(i), open = Party.trackOpen(v, i), locked = c !== 'b' && !v.unlock[c];
    return `<button class="pp-cellg ${c} ${got ? 'got' : ''} ${open && !got && !locked ? 'ready' : ''}" onclick="partyTrackTap('${c}',${i})">${denPlain}${partyGifts(row[c])}${locked ? '<i class="pp-lock">🔒</i>' : got ? '<i class="pp-tick">✓</i>' : ''}</button>`; };
  popup(`<div class="pp-track"><h2>Heavenly Gifts</h2><div class="pp-thead"><span>Basic</span><button onclick="partyUnlock('a')" ${v.unlock.a ? 'disabled' : ''}>${denPlain}Advanced ${v.unlock.a ? '✓' : '🔒 ' + Party.unlock.a}</button><button onclick="partyUnlock('h')" ${v.unlock.h ? 'disabled' : ''}>${denPlain}Heavenly ${v.unlock.h ? '✓' : '🔒 ' + Party.unlock.h}</button></div>
   <div class="pp-tlist">${Party.track.map((row, i) => `<div class="pp-trow ${Party.trackOpen(v, i) ? 'open' : ''} ${Party.track[i + 1] && Party.trackOpen(v, i + 1) ? 'next' : ''}">${col(row, 'b', i)}<span class="pp-at ${Party.trackOpen(v, i) ? 'on' : ''}"><i>${fmt(row.at)}</i></span>${col(row, 'a', i)}${col(row, 'h', i)}</div>`).join('')}</div>
   <p class="pp-total">Total points earned: <b>${fmt(v.total)}</b> · unlocks cost prisms</p></div>`);
}
function partyTrackTap(c, i) {
  const v = S.party; if (c !== 'b' && !v.unlock[c]) return partyUnlock(c);
  const give = Party.trackClaim(v, c, i); if (!give) return toast(Party.trackOpen(v, i) ? 'Already claimed' : 'Reach ' + fmt(Party.track[i].at) + ' total points');
  partyPay(give); save(); partyTrack(); toast('Gift claimed');
}
// The offer window of a locked column (reference: big art, Value, "All available rewards after purchase", "Current
// level rewards after purchase", "Returned immediately after purchase", price button). Our price is in prisms.
function partyUnlock(c) {
  const v = S.party; if (v.unlock[c]) return partyTrack();
  const name = c === 'a' ? 'Advanced Benefits' : 'Heavenly Gifts', open = Party.colGifts(v, c, true);
  popup(`<div class="pp-offer ${c}" style="--ppbg:url('${artPath('comp-party-bg')}')"><img class="pp-offer-pet" src="${partyArt(c === 'a' ? 10 : 11)}" alt="">
   <span class="pp-value">Value ${uiIcon('crystals')} ${fmt(Party.value[c])}</span><h2>${name}</h2>
   <div class="pp-offer-box"><small>All available rewards after purchase</small><div class="pp-gl pp-scroll">${partyGifts(Party.colGifts(v, c, false))}</div>
    <small>Current level rewards after purchase</small><div class="pp-gl pp-scroll">${Object.keys(open).length ? partyGifts(open) : '<p class="pp-p">Reach 1 point first</p>'}</div></div>
   <p class="pp-refund">Returned immediately after purchase ${uiIcon('crystals')} <b>${Party.refund[c]}</b></p>
   <button class="primary pp-buy" onclick="partyUnlockBuy('${c}')">${denPlain}${uiIcon('crystals')} ${fmt(Party.unlock[c])}</button></div>`);
}
function partyUnlockBuy(c) {
  const v = S.party; if (!Party.unlockCol(v, S, c)) return toast('Not enough prisms (' + Party.unlock[c] + ')');
  save(); wallet(); partyTrack(); toast((c === 'a' ? 'Advanced benefits' : 'Heavenly gifts') + ' unlocked');
}
function partyPacksPop() {
  const v = S.party;
  popup(`<h2>Gift Pack</h2><div class="pp-packs">${Party.packs.map(p => { const n = v.packs[p.id] || 0; return `<div class="pp-pack"><div><b>${p.name}</b><small>Event purchase limit: ${n}/${p.limit}</small></div><div class="pp-gl">${partyGifts(p.give)}</div><button class="primary" ${n >= p.limit ? 'disabled' : ''} onclick="partyBuyPack('${p.id}')">${denPlain}${n >= p.limit ? 'Sold out' : uiIcon('crystals') + ' ' + p.price}</button></div>`; }).join('')}</div><p class="pp-p">Packs cost prisms (real-money payment is not built).</p>`);
}
function partyBuyPack(id) { const give = Party.buyPack(S.party, S, id); if (!give) return toast('Not enough prisms or sold out'); partyPay(give); save(); wallet(); partyPacksPop(); toast('Pack bought'); }
function partyRankPop() {
  const v = S.party, list = Party.field(v.period).map(x => ({ ...x, me: false }));
  if (v.best) list.push({ name: S.name || 'Reina', score: v.best, at: v.bestAt, me: true });
  list.sort((a, b) => b.score - a.score || a.at - b.at);
  const row = (x, i) => `<div class="pp-rk ${x.me ? 'me' : ''}"><b>${i + 1}</b><span>${x.me ? (S.name || 'Reina') : x.name + ' <small>AI</small>'}</span><em>${fmt(x.score)}</em></div>`;
  const pod = [1, 0, 2].map(i => list[i] ? `<div class="pp-pod p${i + 1}"><i>${i + 1}</i><b>${list[i].me ? (S.name || 'Reina') : list[i].name}</b><small>${list[i].me ? '' : 'AI · '}${fmt(list[i].score)}</small></div>` : `<div class="pp-pod p${i + 1}"><i>${i + 1}</i><b>Vacant</b></div>`).join('');
  const myRank = Party.rankOf(v.best, v.bestAt, v.period);
  popup(`<h2>Rankings</h2><div class="pp-podium">${pod}</div><div class="pp-rlist">${list.slice(3, 30).map((x, i) => row(x, i + 3)).join('') || '<p class="pp-p">No one on the leaderboard yet</p>'}</div>
   <div class="pp-mine"><b>${myRank || 'None'}</b><span>${S.name || 'Reina'}</span><em>Point: ${fmt(v.best)}</em></div>`);
}
function partyRewardsPop() {
  const v = S.party, rank = Party.rankOf(v.best, v.bestAt, v.period);
  popup(`<h2>Personal rewards</h2><div class="pp-packs">${Party.ranks.map(t => `<div class="pp-pack"><div><b>No.${t.from}${t.to > t.from ? '~' + t.to : ''}</b><small>Best score at least ${fmt(t.min)}</small></div><div class="pp-gl">${partyGifts(t.give)}</div></div>`).join('')}</div>
   <p class="pp-total">My Rank: <b>${rank || 'None'}</b> · My Point: <b>${fmt(v.best)}</b></p><p class="pp-p">Sent to the bag automatically when the event ends (in ${partyClock(Party.ends(v.period) - Date.now())}).</p>`);
}
let partyAchTab = 'ach';
function partyAchPop(tab = partyAchTab) {
  partyAchTab = tab; const v = S.party;
  const ach = Object.entries(Party.achieve).map(([t, give]) => { t = +t; const done = v.reach >= t, got = v.ach.includes(t);
    return `<div class="pp-ach"><span class="pp-achpet"><img src="${partyArt(t)}" alt=""><b>${t}</b></span><div><small>${Party.tiers[t - 1][1]} synthesized once in a single game (${done ? 1 : 0}/1)</small><div class="pp-gl">${partyGifts(give)}</div></div>
     <button class="${got ? 'got' : done ? 'ready' : 'undone'}" ${got || !done ? 'disabled' : ''} onclick="partyAchClaim(${t})">${denPlain}${got ? 'Claimed' : done ? 'Claim' : 'Undone'}</button></div>`; }).join('');
  const gal = Party.tiers.slice(0, -1).map((x, i) => `<div class="pp-gal"><span class="pp-achpet"><img src="${partyArt(i + 1)}" alt=""><b>${i + 1}</b></span><i>+</i><span class="pp-achpet"><img src="${partyArt(i + 1)}" alt=""><b>${i + 1}</b></span><i>➜</i><span class="pp-achpet"><img src="${partyArt(i + 2)}" alt=""><b>${i + 2}</b></span><em>Point +${Party.points(i + 2)}<small>${Party.tiers[i + 1][1]}</small></em></div>`).join('');
  popup(`<h2>${tab === 'ach' ? 'Achievements' : 'Gallery'}</h2><div class="pp-achlist">${tab === 'ach' ? ach : gal}</div>
   <div class="pp-tabs"><button aria-pressed="${tab === 'ach'}" onclick="partyAchPop('ach')">${denPlain}Achievements</button><button aria-pressed="${tab === 'gal'}" onclick="partyAchPop('gal')">${denPlain}Gallery</button></div>`);
}
function partyGallery() { partyAchPop('gal'); }
function partyAchClaim(t) { const give = Party.achClaim(S.party, t); if (!give) return; partyPay(give); save(); partyAchPop('ach'); toast('Achievement reward claimed'); }
