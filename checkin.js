// Daily Blessings (user photos of the reference's "Daily Check-in" behind its benefits icon): a 30-day calendar of
// rewards, one claim per UTC day; sign-ins in the cycle unlock five milestone chests (2 / 7 / 14 / 21 / 28 days);
// a Blessing Pass (prisms, never real money) doubles the marked days, also the ones already claimed this cycle.
// A cycle is one calendar month (UTC; user: "it is really a monthly calendar"): 28-31 days. Own name, art and wording. Rules are pure
// (node scripts/test-checkin.mjs); the screen is below CHECKIN_UI. All numbers are placeholders.
const Blessings = {
  cycleDays: 31, passPrice: 300,
  // Day n (1-30): [kind, amount, doubled by the pass]. kind = gold | prisms | wishes | a bag item id.
  days: [
    ['stam', 2, 0], ['gold', 2000, 1], ['wish', 1, 0], ['prisms', 20, 0], ['exp1', 2, 1], ['gold', 3000, 1],
    ['stam', 2, 0], ['gold', 2000, 1], ['stonebag', 1, 0], ['prisms', 20, 0], ['exp1', 2, 1], ['gold', 3000, 1],
    ['stam', 2, 0], ['gold', 2000, 1], ['wish', 1, 0], ['prisms', 20, 0], ['shardbag', 1, 1], ['gold', 3000, 1],
    ['stam', 2, 0], ['gold', 2000, 1], ['sealbag', 1, 0], ['prisms', 20, 0], ['exp2', 1, 1], ['gold', 3000, 1],
    ['stam', 2, 0], ['gold', 2000, 1], ['chest2', 1, 0], ['prisms', 30, 0], ['gembox', 1, 1], ['chest3', 1, 0], ['wish', 2, 1]
  ],
  milestones: [[2, 'wish', 2], [7, 'chest2', 1], [14, 'petegg', 1], [21, 'chest3', 1], [28, 'prisms', 200]],
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  // Cycle = months since year 0 (UTC); length = days in that month.
  cycle(now = Date.now()) { const d = new Date(now); return d.getUTCFullYear() * 12 + d.getUTCMonth(); },
  ends(c) { return Date.UTC(Math.floor(c / 12), c % 12 + 1, 1); },
  length(c) { return new Date(this.ends(c) - 1).getUTCDate(); },
  monthName(c) { return new Date(Date.UTC(Math.floor(c / 12), c % 12, 1)).toLocaleString('en-GB', { month: 'long', timeZone: 'UTC' }); },
  state(s, now = Date.now()) {
    const c = this.cycle(now); let v = s.blessings;
    if (!v || v.cycle !== c) v = s.blessings = { cycle: c, n: 0, last: '', got: [], pass: false };
    return v;
  },
  ready(s, now = Date.now()) { const v = this.state(s, now); return v.last !== this.day(now) && v.n < this.length(v.cycle); },
  // Today's claim: the next day of the calendar (missed days are not lost, the calendar just moves on one per day).
  claim(s, now = Date.now()) {
    if (!this.ready(s, now)) return null;
    const v = this.state(s, now), d = this.days[v.n], n = d[1] * (d[2] && v.pass ? 2 : 1);
    v.n++; v.last = this.day(now); return { day: v.n, give: { [d[0]]: n } };
  },
  milestone(s, at, now = Date.now()) {
    const v = this.state(s, now), m = this.milestones.find(x => x[0] === at);
    if (!m || v.n < at || v.got.includes(at)) return null;
    v.got.push(at); return { give: { [m[1]]: m[2] } };
  },
  // The pass doubles the marked days; marked days already claimed this cycle are paid once more at purchase.
  buyPass(s, now = Date.now()) {
    const v = this.state(s, now);
    if (v.pass) return { ok: false, why: 'The Blessing Pass is already active this cycle' };
    if ((s.scales || 0) < this.passPrice) return { ok: false, why: 'Not enough prisms' };
    s.scales -= this.passPrice; v.pass = true; const give = {};
    for (let i = 0; i < v.n; i++) { const d = this.days[i]; if (d[2]) give[d[0]] = (give[d[0]] || 0) + d[1]; }
    return { ok: true, give };
  },
  valid(v) {
    return v === undefined || !!v && typeof v === 'object' && Number.isSafeInteger(v.cycle) && Number.isInteger(v.n) && v.n >= 0 && v.n <= this.cycleDays
      && typeof v.last === 'string' && Array.isArray(v.got) && v.got.every(a => this.milestones.some(m => m[0] === a)) && typeof v.pass === 'boolean';
  }
};
if (typeof module !== 'undefined') module.exports = { Blessings };

// CHECKIN_UI
let blessTab = 'daily';
function blessPay(give) {
  for (const [k, n] of Object.entries(give)) {
    if (k === 'gold') S.gold += n; else if (k === 'prisms') S.scales = (S.scales || 0) + n; else if (k === 'wishes') S.tickets += n;
    else WonderGear.bagAdd(S, k, n);
  }
}
function blessIcon(k) { return k === 'gold' ? uiIcon('gold') : k === 'prisms' ? uiIcon('crystals') : k === 'wishes' ? uiIcon('wishes') : bagIcon(k); }
function blessName(k) { return k === 'gold' ? 'Gold' : k === 'prisms' ? 'Prisms' : k === 'wishes' ? 'Wishes' : WonderGear.bagItemById[k].name; }
function blessHue(k) { return k === 'gold' ? '#e8a830' : k === 'prisms' ? '#c84a6a' : k === 'wishes' ? '#7a4fc8' : bagHue(WonderGear.bagItemById[k].rarity); }
function blessTile(k, n, cls = '', extra = '') { return `<span class="bl-tile ${cls}" style="--rarity:${blessHue(k)}" title="${blessName(k)}">${blessIcon(k)}<b>${fmt(n)}</b>${extra}</span>`; }
function blessGo(t) { blessTab = t; showBlessings(); }
function showBlessings() {
  bagArtVars?.();
  const v = Blessings.state(S), ready = Blessings.ready(S), left = Blessings.ends(v.cycle) - Date.now();
  const leftTxt = Math.floor(left / 864e5) + 'd ' + Math.floor(left % 864e5 / 36e5) + 'h';
  let body;
  if (blessTab === 'daily') {
    const grid = Blessings.days.slice(0, Blessings.length(v.cycle)).map((d, i) => {
      const got = i < v.n, today = i === v.n && ready, n = d[1] * (d[2] && v.pass ? 2 : 1);
      return `<button class="bl-cell ${got ? 'got' : ''} ${today ? 'today' : ''}" ${today ? 'onclick="blessClaim()"' : ''}>${denPlain}${blessTile(d[0], n, '', d[2] ? `<i class="bl-x2 ${v.pass ? 'on' : ''}">Pass ×2</i>` : '')}<small>Day ${i + 1}</small>${got ? '<i class="bl-tick">✓</i>' : ''}</button>`;
    }).join('');
    const track = Blessings.milestones.map(([at, k, n]) => { const has = v.n >= at, got = v.got.includes(at);
      return `<button class="bl-ms ${has ? 'has' : ''} ${got ? 'got' : ''}" onclick="blessMilestone(${at})">${denPlain}${blessTile(k, n)}${got ? '<i class="bl-tick">✓</i>' : ''}<small>${at} days</small></button>`; }).join('');
    body = `<div class="bl-sheet"><div class="bl-grid">${grid}</div></div>
      <div class="bl-total"><p>${Blessings.monthName(v.cycle)} · signed in <b>${v.n}</b> of ${Blessings.length(v.cycle)} days · next month in ${leftTxt}</p><div class="bl-track"><u style="width:${Math.min(100, v.n / 28 * 100)}%"></u>${track}</div></div>`;
  } else {
    const marked = Blessings.days.slice(0, Blessings.length(v.cycle)).map((d, i) => d[2] ? blessTile(d[0], d[1], i < v.n ? 'dim' : '', `<small class="bl-dn">Day ${i + 1}</small>`) : '').join('');
    body = `<div class="bl-sheet pass"><h2>Blessing Pass</h2><p>Doubles every day marked <i class="bl-x2 on">Pass ×2</i> for the whole month, including the marked days you have already claimed.</p><div class="bl-passgrid">${marked}</div>
      ${v.pass ? '<p class="bl-active">Active until the end of ' + Blessings.monthName(v.cycle) + '</p>' : `<button class="bl-buy" onclick="blessPass()">${denPlain}${uiIcon('crystals')}${Blessings.passPrice}</button>`}</div>`;
  }
  $('#main').innerHTML = `<section class="bl-room" style="--bl-banner:url('${artPath('blessings-banner')}')">
    <div class="bl-head"><h1><span>Daily Blessings</span></h1></div>
    ${body}
    <div class="bl-nav"><button class="bl-back" data-back onclick="go('home')" aria-label="Back">‹</button>
      <button class="${blessTab === 'daily' ? 'on' : ''}" onclick="blessGo('daily')">${denPlain}Daily Sign-in${ready ? '<em></em>' : ''}</button>
      <button class="${blessTab === 'pass' ? 'on' : ''}" onclick="blessGo('pass')">${denPlain}Blessing Pass</button></div>
  </section>`;
}
function blessClaim() {
  const r = Blessings.claim(S); if (!r) return; blessPay(r.give); save();
  const [k, n] = Object.entries(r.give)[0]; toast('Day ' + r.day + ': ' + fmt(n) + ' ' + blessName(k)); showBlessings();
  document.querySelectorAll('.bl-cell.got')[r.day - 1]?.classList.add('pop');
}
function blessMilestone(at) {
  const r = Blessings.milestone(S, at);
  if (!r) { const v = Blessings.state(S); toast(v.got.includes(at) ? 'Already claimed' : 'Sign in ' + (at - v.n) + ' more day' + (at - v.n > 1 ? 's' : '')); return; }
  blessPay(r.give); save(); const [k, n] = Object.entries(r.give)[0]; toast(at + ' days: ' + fmt(n) + ' ' + blessName(k)); showBlessings();
}
function blessPass() { const r = Blessings.buyPass(S); if (!r.ok) { toast(r.why); return; } blessPay(r.give); save(); toast('Blessing Pass active'); showBlessings(); }
