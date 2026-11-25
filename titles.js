// Titles (user photo of the reference's Title screen: "Celebrity Titles" earned for 1st place, a big title plate over
// the hero, CP and stats, "Title Anecdote", Activate / Activatable). Own names, plates drawn in CSS (no new pictures:
// the hosted bundle is nearly full). Two kinds: Celebrity titles for a No.1 finish in an event ranking (granted where
// that ranking pays out, see titleGrant calls), Achievement titles for milestones (checked from the save by
// Titles.check). A title arrives as "Activatable" with a letter in the Mail; Activate turns its stats on for good; one
// activated title can be worn: its plate replaces the aura plate over Reina on the home screen.
// Rules are pure (node scripts/test-titles.mjs); the screen is below TITLES_UI. All numbers are placeholders.
const Titles = {
  cats: [['celeb', 'Celebrity Titles'], ['feat', 'Achievement Titles']],
  list: [
    { id: 'meadow', cat: 'celeb', name: 'Meadow Champion', look: 'flame', motif: '🌼', how: '1st place in a Burrow Blitz daily ranking', stats: { attack: 300, defense: 100, health: 6000, penetration: 100 } },
    { id: 'sweetheart', cat: 'celeb', name: 'Blossom Sweetheart', look: 'rose', motif: '💗', how: '1st place in a Blossom Vow daily ranking', stats: { attack: 300, defense: 100, health: 6000, penetration: 100 } },
    { id: 'lagoon', cat: 'celeb', name: 'Lagoon Star', look: 'tide', motif: '🐚', how: '1st place in a Lagoon Gala event', stats: { attack: 350, defense: 120, health: 7000, penetration: 120 } },
    { id: 'arcade', cat: 'celeb', name: 'Arcade Legend', look: 'flame', motif: '🎯', how: '1st place in a featured mini game turn', stats: { attack: 350, defense: 120, health: 7000, penetration: 120 } },
    { id: 'siege', cat: 'celeb', name: 'Siege Breaker', look: 'gold', motif: '🏰', how: '1st place in a Pet Siege week', stats: { attack: 400, defense: 150, health: 8000, penetration: 150 } },
    { id: 'duel', cat: 'celeb', name: 'Star Duel Champion', look: 'star', motif: '⚔️', how: '1st place in a Star Duel season', stats: { attack: 600, defense: 200, health: 12000, penetration: 200 } },
    { id: 'slayer', cat: 'feat', name: 'Guardian Slayer', look: 'frost', motif: '🗡️', how: 'Defeat 50 dungeon guardians', stats: { attack: 150, health: 3000 }, check: s => (s.dungeonWins || 0) >= 50 },
    { id: 'harvester', cat: 'feat', name: 'Swift Harvester', look: 'leaf', motif: '🍓', how: 'Clear Harvest Pairs in 1:30 or less', stats: { attack: 100, health: 2000, defense: 50 }, check: s => s.pairsBest > 0 && s.pairsBest <= 90 },
    { id: 'virtuoso', cat: 'feat', name: 'Crystal Virtuoso', look: 'frost', motif: '💎', how: 'Score 8,000 in Crystal Cascade', stats: { attack: 100, health: 2000, penetration: 50 }, check: s => (s.cascadeBest || 0) >= 8000 },
    { id: 'burrow', cat: 'feat', name: 'Burrow Ace', look: 'leaf', motif: '🐹', how: 'Score 700 in Burrow Blitz', stats: { attack: 100, health: 2000, defense: 50 }, check: s => (s.burrow?.all || 0) >= 700 },
    { id: 'orbs', cat: 'feat', name: 'Orb Sage', look: 'star', motif: '🔮', how: 'Collect all ten Wish Orbs', stats: { attack: 200, health: 4000, penetration: 100 }, check: s => Object.keys(s.rites?.orbs || {}).length >= 10 },
    { id: 'halo', cat: 'feat', name: 'Halo Keeper', look: 'rose', motif: '✨', how: 'Own all four Star Rites auras', stats: { attack: 250, health: 5000, defense: 100 }, check: s => Object.keys(s.rites?.auras || {}).length >= 4 },
    { id: 'sunwing', cat: 'feat', name: 'Aurelian Bearer', look: 'gold', motif: '🪽', how: 'Own the Aurelian Sunwings', stats: { attack: 500, health: 10000, penetration: 200 }, check: s => (s.reinaFashion?.wingSkins || []).includes('fashion-wing-32') }
  ],
  byId(id) { return this.list.find(t => t.id === id); },
  state(s) { return s.titles || (s.titles = { got: {}, on: [], worn: '' }); },
  status(s, id) { const v = s.titles; return !v?.got?.[id] ? 'locked' : v.on.includes(id) ? (v.worn === id ? 'worn' : 'active') : 'ready'; },
  // Grants a title (once). Returns the title when it is new.
  grant(s, id, now = Date.now()) { const t = this.byId(id), v = this.state(s); if (!t || v.got[id]) return null; v.got[id] = now; return t; },
  // Achievement titles whose milestone is met. Returns the newly granted ones.
  check(s, now = Date.now()) { return this.list.filter(t => t.check && !s.titles?.got?.[t.id] && t.check(s)).map(t => this.grant(s, t.id, now)).filter(Boolean); },
  activate(s, id) { const v = this.state(s); if (!v.got[id] || v.on.includes(id)) return false; v.on.push(id); if (!v.worn) v.worn = id; return true; },
  wear(s, id) { const v = this.state(s); if (id && !v.on.includes(id)) return false; v.worn = id || ''; return true; },
  // Stats of every activated title (worn or not), added in WonderGear stats().
  bonus(s) { const b = {}; for (const id of s.titles?.on || []) for (const [k, n] of Object.entries(this.byId(id)?.stats || {})) b[k] = (b[k] || 0) + n; return b; },
  cp(t) { const x = t.stats; return Math.round((x.attack || 0) * 10 + (x.defense || 0) * 8 + (x.health || 0) * .5 + (x.penetration || 0) * 9); },
  valid(v) {
    if (v === undefined) return true;
    const ids = this.list.map(t => t.id);
    return !!v && typeof v === 'object' && !!v.got && typeof v.got === 'object' && Object.entries(v.got).every(([k, n]) => ids.includes(k) && Number.isSafeInteger(n) && n >= 0)
      && Array.isArray(v.on) && new Set(v.on).size === v.on.length && v.on.every(id => v.got[id] !== undefined) && typeof v.worn === 'string' && (v.worn === '' || v.on.includes(v.worn));
  }
};
if (typeof module !== 'undefined') module.exports = { Titles };

// TITLES_UI
let titleSel = '', titleCat = 'celeb';
// Grants a title, mails the letter and shows a note. Safe to call from any ranking pay-out.
function titleGrant(id) {
  if (typeof S === 'undefined') return null;
  const t = Titles.grant(S, id); if (!t) return null;
  if (WonderGear.mailGift) WonderGear.mailGift(S, { title: 'Title earned: ' + t.name, from: 'Hall of Wonders', text: t.how + '. Open your Titles to activate "' + t.name + '" and gain its stats for good.', items: {} });
  if (WonderGear.socialNote) WonderGear.socialNote(S, 'New title: ' + t.name + '!');
  if (typeof toast === 'function') setTimeout(() => toast('New title: ' + t.name + ' · activate it in Titles'), 600);
  return t;
}
function titlesCheck() { if (typeof S === 'undefined') return; let n = 0; for (const t of Titles.check(S)) { n++; if (WonderGear.mailGift) WonderGear.mailGift(S, { title: 'Title earned: ' + t.name, from: 'Hall of Wonders', text: t.how + '. Open your Titles to activate "' + t.name + '" and gain its stats for good.', items: {} }); if (typeof toast === 'function') setTimeout(() => toast('New title: ' + t.name), 600); } if (n) save(); }
function titlePlate(t, cls = '') { return `<span class="tt-plate tt-${t.look} ${cls}"><i>${t.motif}</i><b data-t="${esc(t.name)}">${esc(t.name)}</b></span>`; }
function titleStatRows(t) {
  const names = { attack: ['ATK', 'attack'], defense: ['DEF', 'defense'], health: ['HP', 'health'], penetration: ['ARP', 'accuracy'] };
  return Object.entries(t.stats).map(([k, n]) => `<li><span>${uiIcon(names[k]?.[1] || 'power', 'tt-ico')}${names[k]?.[0] || k}</span><b>${fmt(n)}</b></li>`).join('');
}
function titleGo(id) { titleSel = id; showTitles(); }
function titleCatGo(c) { titleCat = titleCat === c ? '' : c; showTitles(); }
function showTitles() {
  titlesCheck();
  const v = Titles.state(S), pick = Titles.byId(titleSel) || Titles.list.find(t => Titles.status(S, t.id) === 'ready') || Titles.byId(v.worn) || Titles.list[0]; titleSel = pick.id;
  const st = Titles.status(S, pick.id), hasReady = c => Titles.list.some(t => t.cat === c && Titles.status(S, t.id) === 'ready');
  const side = Titles.cats.map(([c, label]) => `<button class="tt-cat ${titleCat === c ? 'on' : ''}" onclick="titleCatGo('${c}')">${denPlain}<span>${label}</span><i>${titleCat === c ? '▴' : '▾'}</i>${hasReady(c) ? '<em></em>' : ''}</button>` + (titleCat === c ? Titles.list.filter(t => t.cat === c).map(t => { const s = Titles.status(S, t.id); return `<button class="tt-item s-${s} ${t.id === pick.id ? 'on' : ''}" onclick="titleGo('${t.id}')">${denPlain}<span>${esc(t.name)}</span>${s === 'ready' ? '<em></em>' : s === 'worn' ? '<small>Worn</small>' : ''}</button>`; }).join('') : '')).join('');
  const action = st === 'locked' ? '<p class="tt-state off">Not obtained yet</p>' : st === 'ready' ? `<button class="tt-btn" onclick="titleActivate('${pick.id}')">${denPlain}Activate</button><p class="tt-state">Activatable</p>`
    : st === 'active' ? `<button class="tt-btn" onclick="titleWear('${pick.id}')">${denPlain}Wear</button><p class="tt-state">Activated · stats on</p>` : `<button class="tt-btn alt" onclick="titleWear('')">${denPlain}Take off</button><p class="tt-state">Worn over your head</p>`;
  $('#main').innerHTML = `<section class="tt-room">
   <div class="tt-head"><button class="tt-back" data-back onclick="go('home')" aria-label="Back">‹</button><h1>Titles</h1><span class="tt-count">${v.on.length}/${Titles.list.length} activated</span></div>
   <div class="tt-body"><div class="tt-side">${side}</div>
    <div class="tt-main s-${st}">${titlePlate(pick, 'big')}
     <div class="tt-hero"><img src="${reinaWorldLookPath()}" alt="Reina"></div>
     <p class="tt-cp">⚔ ${fmt(Titles.cp(pick))}</p>
     <ul class="tt-stats">${titleStatRows(pick)}</ul>
     <div class="tt-anec"><h3>📜 Title Story</h3><p>${esc(pick.how)}</p></div>
     ${action}</div></div></section>`;
}
function titleActivate(id) { if (!Titles.activate(S, id)) return; save(); toast(Titles.byId(id).name + ' activated'); showTitles(); }
function titleWear(id) { if (!Titles.wear(S, id)) return; save(); toast(id ? Titles.byId(id).name + ' worn' : 'Title taken off'); showTitles(); }
// The worn title over Reina on the home screen (replaces the aura plate); tapping it opens the Titles.
function titleHome() { const t = Titles.byId(S.titles?.worn); return t ? `<button class="city-title" onclick="go('titles')" aria-label="Titles">${denPlain}${titlePlate(t)}</button>` : ''; }
