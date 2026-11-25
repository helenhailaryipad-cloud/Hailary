// Titles (user photos of the reference's Title screen, opened from the Character page: categories Celebrity / Event /
// Romance / Ranking, an overview "Source of Title" with counts, a big painted title emblem over the hero, CP and stats,
// "Title Anecdote", Activate (Activatable) then Equip (Forever)). Own names and emblems: each title is a painted wordmark
// in the style of the game logo (image model with logo-v2 as the style reference, scripts/art-source/titles/
// mark-<id>.webp -> atlas title-marks by scripts/build-title-art.py; user: "beautiful, in the style of our game, varied,
// for some merit"). Celebrity = No.1 in a daily event, Ranking = No.1 in a weekly / season ranking (granted where those
// rankings pay, titleGrant), Romance = Blossom Vow milestones, Event = achievements from the save (Titles.check). A new
// title arrives "Activatable" with a letter in the Mail; Activate turns its stats on for good; one is worn over Reina.
// Rules are pure (node scripts/test-titles.mjs); the screen is below TITLES_UI. All numbers are placeholders.
const Titles = {
  cats: [['celeb', 'Celebrity Titles'], ['event', 'Event Titles'], ['romance', 'Romance Titles'], ['rank', 'Ranking Titles']],
  list: [
    { id: 'meadow', cat: 'celeb', name: 'Meadow Champion', look: 'flame', motif: '🌼', how: '1st place in a Burrow Blitz daily ranking', stats: { attack: 300, defense: 100, health: 6000, penetration: 100 } },
    { id: 'sweetheart', cat: 'romance', name: 'Blossom Sweetheart', look: 'rose', motif: '💗', how: '1st place in a Blossom Vow daily ranking', stats: { attack: 300, defense: 100, health: 6000, penetration: 100 } },
    { id: 'lagoon', cat: 'celeb', name: 'Lagoon Star', look: 'tide', motif: '🐚', how: '1st place in a Lagoon Gala event', stats: { attack: 350, defense: 120, health: 7000, penetration: 120 } },
    { id: 'arcade', cat: 'celeb', name: 'Arcade Legend', look: 'flame', motif: '🎯', how: '1st place in a featured mini game turn', stats: { attack: 350, defense: 120, health: 7000, penetration: 120 } },
    { id: 'siege', cat: 'rank', name: 'Siege Breaker', look: 'gold', motif: '🏰', how: '1st place in a Pet Siege week', stats: { attack: 400, defense: 150, health: 8000, penetration: 150 } },
    { id: 'duel', cat: 'rank', name: 'Star Duel Champion', look: 'star', motif: '⚔️', how: '1st place in a Star Duel season', stats: { attack: 600, defense: 200, health: 12000, penetration: 200 } },
    { id: 'slayer', cat: 'event', name: 'Guardian Slayer', look: 'frost', motif: '🗡️', how: 'Defeat 50 dungeon guardians', stats: { attack: 150, health: 3000 }, check: s => (s.dungeonWins || 0) >= 50 },
    { id: 'harvester', cat: 'event', name: 'Swift Harvester', look: 'leaf', motif: '🍓', how: 'Clear Harvest Pairs in 1:30 or less', stats: { attack: 100, health: 2000, defense: 50 }, check: s => s.pairsBest > 0 && s.pairsBest <= 90 },
    { id: 'virtuoso', cat: 'event', name: 'Crystal Virtuoso', look: 'frost', motif: '💎', how: 'Score 8,000 in Crystal Cascade', stats: { attack: 100, health: 2000, penetration: 50 }, check: s => (s.cascadeBest || 0) >= 8000 },
    { id: 'burrow', cat: 'event', name: 'Burrow Ace', look: 'leaf', motif: '🐹', how: 'Score 700 in Burrow Blitz', stats: { attack: 100, health: 2000, defense: 50 }, check: s => (s.burrow?.all || 0) >= 700 },
    { id: 'orbs', cat: 'event', name: 'Orb Sage', look: 'star', motif: '🔮', how: 'Collect all ten Wish Orbs', stats: { attack: 200, health: 4000, penetration: 100 }, check: s => Object.keys(s.rites?.orbs || {}).length >= 10 },
    { id: 'halo', cat: 'event', name: 'Halo Keeper', look: 'rose', motif: '✨', how: 'Own all four Star Rites auras', stats: { attack: 250, health: 5000, defense: 100 }, check: s => Object.keys(s.rites?.auras || {}).length >= 4 },
    { id: 'sunwing', cat: 'event', name: 'Aurelian Bearer', look: 'gold', motif: '🪽', how: 'Own the Aurelian Sunwings', stats: { attack: 500, health: 10000, penetration: 200 }, check: s => (s.reinaFashion?.wingSkins || []).includes('fashion-wing-32') },
    { id: 'angler', cat: 'event', name: 'Master Angler', look: 'tide', motif: '🎣', how: 'Catch 15 different kinds of fish', stats: { attack: 120, health: 2500, defense: 60 }, check: s => Object.keys(s.fishCards || {}).length >= 15 },
    { id: 'winged', cat: 'event', name: 'Sky Wingmaster', look: 'frost', motif: '🕊️', how: 'Own 15 pairs of wings', stats: { attack: 150, health: 3000, penetration: 60 }, check: s => (s.reinaFashion?.wingSkins || []).length >= 15 },
    { id: 'beast', cat: 'event', name: 'Beast Whisperer', look: 'leaf', motif: '🐾', how: 'Collect 20 pets', stats: { attack: 150, health: 3000, defense: 80 }, check: s => (s.owned || []).filter(id => /^d\d+$/.test(id)).length >= 20 },
    { id: 'faithful', cat: 'event', name: 'Faithful Wayfarer', look: 'star', motif: '🏮', how: 'Sign in on 28 days of one month', stats: { attack: 120, health: 2500, defense: 60 }, check: s => (s.blessings?.n || 0) >= 28 },
    { id: 'patron', cat: 'event', name: 'Golden Patron', look: 'gold', motif: '💰', how: 'Hold 500,000 gold at once', stats: { attack: 120, health: 2500, penetration: 60 }, check: s => (s.gold || 0) >= 500000 },
    { id: 'cloud', cat: 'event', name: 'Storm Conqueror', look: 'frost', motif: '⚡', how: 'Earn 1,200 Carnage Points in one Cloud War day', stats: { attack: 200, health: 4000, penetration: 80 }, check: s => (s.cloud?.carnage || 0) >= 1200 },
    { id: 'bond', cat: 'romance', name: 'Blossom Bond', look: 'rose', motif: '🌸', how: 'Bond with a partner in Blossom Vow', stats: { attack: 299, defense: 120, health: 5200, penetration: 120 }, check: s => !!s.vow?.partner },
    { id: 'eternal', cat: 'romance', name: 'Eternal Vow', look: 'rose', motif: '💍', how: 'Raise the Love Lock to level 5', stats: { attack: 450, defense: 160, health: 8000, penetration: 160 }, check: s => typeof Vow !== 'undefined' && Number.isInteger(s.vow?.lock) && Vow.lockLevel(s.vow.lock).lv >= 5 },
    { id: 'dragonheart', cat: 'event', name: 'Dragonheart', look: 'flame', motif: '🐉', how: 'Defeat 300 dungeon guardians', stats: { attack: 400, health: 8000, defense: 150 }, check: s => (s.dungeonWins || 0) >= 300 }
  ],
  // Painted emblems (atlas title-marks, 4 columns, one cell per title in this order).
  markOrder: ['meadow', 'lagoon', 'arcade', 'siege', 'duel', 'sweetheart', 'bond', 'eternal', 'slayer', 'dragonheart', 'harvester', 'virtuoso', 'burrow', 'orbs', 'halo', 'sunwing', 'angler', 'winged', 'beast', 'faithful', 'patron', 'cloud'],
  markRows: 6,
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
  total(s) { return this.bonus(s); },
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
let titleSel = '', titleCat = '', titleFrom = 'home';
// Grants a title, mails the letter and shows a note. Safe to call from any ranking pay-out.
function titleLetter(t) { if (WonderGear.mailGift) WonderGear.mailGift(S, { title: 'Title earned: ' + t.name, from: 'Hall of Wonders', text: t.how + '. Open your Titles to activate "' + t.name + '" and gain its stats for good.', items: {} }); }
function titleGrant(id) {
  if (typeof S === 'undefined') return null;
  const t = Titles.grant(S, id); if (!t) return null;
  titleLetter(t); if (WonderGear.socialNote) WonderGear.socialNote(S, 'New title: ' + t.name + '!');
  if (typeof toast === 'function') setTimeout(() => toast('New title: ' + t.name + ' · activate it in Titles'), 600);
  return t;
}
function titlesCheck() { if (typeof S === 'undefined') return; const got = Titles.check(S); for (const t of got) { titleLetter(t); if (typeof toast === 'function') setTimeout(() => toast('New title: ' + t.name), 600); } if (got.length) save(); }
// The painted emblem of a title (falls back to lettering when it has no picture).
function titlePlate(t, cls = '') {
  const n = Titles.markOrder.indexOf(t.id);
  if (n < 0) return `<span class="tt-plate tt-${t.look} ${cls}"><b data-t="${esc(t.name)}">${esc(t.name)}</b></span>`;
  return `<span class="tt-mark ${cls}" role="img" aria-label="${esc(t.name)}" style="--mx:${(n % 4) / 3 * 100}%;--my:${Math.floor(n / 4) / (Titles.markRows - 1) * 100}%;--marks:url('${artPath('title-marks')}')"></span>`;
}
function titleStatRows(stats, all = false) {
  const names = { attack: ['ATK', 'attack'], health: ['HP', 'health'], defense: ['DEF', 'defense'], penetration: ['ARP', 'accuracy'] };
  return Object.keys(names).filter(k => all || k in stats).map(k => `<li><span>${uiIcon(names[k][1], 'tt-ico')}${names[k][0]}</span><b>${fmt(stats[k] || 0)}</b></li>`).join('');
}
function openTitles(from = 'home') { titleFrom = from; titleSel = ''; titleCat = ''; go('titles'); }
function titleGo(id) { titleSel = id; showTitles(); }
function titleCatGo(c) { titleCat = titleCat === c ? '' : c; titleSel = ''; showTitles(); }
function titleDue() { return typeof S !== 'undefined' && Titles.list.some(t => Titles.status(S, t.id) === 'ready'); }
function showTitles() {
  titlesCheck();
  const v = Titles.state(S), pick = Titles.byId(titleSel), hasReady = c => Titles.list.some(t => t.cat === c && Titles.status(S, t.id) === 'ready');
  const side = Titles.cats.map(([c, label]) => `<button class="tt-cat ${titleCat === c ? 'on' : ''}" onclick="titleCatGo('${c}')">${denPlain}<span>${label}</span><i>${titleCat === c ? '▴' : '▾'}</i>${hasReady(c) ? '<em></em>' : ''}</button>` + (titleCat === c ? Titles.list.filter(t => t.cat === c).map(t => { const s = Titles.status(S, t.id); return `<button class="tt-item s-${s} ${pick && t.id === pick.id ? 'on' : ''}" onclick="titleGo('${t.id}')">${denPlain}<span>${esc(t.name)}</span>${s === 'ready' ? '<em></em>' : s === 'worn' ? '<small>Equipped</small>' : ''}</button>`; }).join('') : '')).join('');
  let main;
  if (!pick) {
    const tot = Titles.total(S);
    const src = Titles.cats.map(([c, label]) => { const all = Titles.list.filter(t => t.cat === c), got = all.filter(t => v.got[t.id]).length; return `<li><span>◆ ${label}</span><b>${got}/${all.length}</b></li>`; }).join('');
    main = `<div class="tt-main s-overview"><div class="tt-hero"><img src="${reinaWorldLookPath()}" alt="Reina"></div>
      <p class="tt-cp">⚔ ${fmt(Titles.cp({ stats: tot }))}</p><ul class="tt-stats">${titleStatRows(tot, true)}</ul>
      <div class="tt-anec"><h3>📜 Source of Title</h3><ul class="tt-src">${src}</ul></div></div>`;
  } else {
    const st = Titles.status(S, pick.id);
    const action = st === 'locked' ? '<p class="tt-state off">Not obtained yet</p>' : st === 'ready' ? `<button class="tt-btn" onclick="titleActivate('${pick.id}')">${denPlain}Activate</button><p class="tt-state">Activatable</p>`
      : st === 'active' ? `<button class="tt-btn" onclick="titleWear('${pick.id}')">${denPlain}Equip</button><p class="tt-state">Forever</p>` : `<button class="tt-btn alt" onclick="titleWear('')">${denPlain}Unequip</button><p class="tt-state">Equipped · Forever</p>`;
    main = `<div class="tt-main s-${st}">${titlePlate(pick, 'big')}<div class="tt-hero"><img src="${reinaWorldLookPath()}" alt="Reina"></div>
      <p class="tt-cp">⚔ ${fmt(Titles.cp(pick))}</p><ul class="tt-stats">${titleStatRows(pick.stats)}</ul>
      <div class="tt-anec"><h3>📜 Title Anecdote</h3><p>${esc(pick.how)}</p></div>${action}</div>`;
  }
  $('#main').innerHTML = `<section class="tt-room">
   <div class="tt-head"><button class="tt-back" data-back onclick="go('${titleFrom === 'character' ? 'character' : 'home'}')" aria-label="Back">‹</button><h1>Title</h1><span class="tt-count">${v.on.length}/${Titles.list.length} activated</span></div>
   <div class="tt-body"><div class="tt-side">${side}</div>${main}</div></section>`;
}
function titleActivate(id) { if (!Titles.activate(S, id)) return; save(); toast(Titles.byId(id).name + ' activated'); showTitles(); }
function titleWear(id) { if (!Titles.wear(S, id)) return; save(); toast(id ? Titles.byId(id).name + ' equipped' : 'Title unequipped'); showTitles(); }
// The worn title over Reina on the home screen (replaces the aura plate); tapping it opens the Titles.
function titleHome() { const t = Titles.byId(S.titles?.worn); return t ? `<button class="city-title" onclick="openTitles('home')" aria-label="Title: ${esc(t.name)}">${denPlain}${titlePlate(t)}</button>` : ''; }
