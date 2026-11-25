// Pet Siege (user photos of the reference's pet siege event, no text): Reina's faction (Moonwing, ally) besieges five
// cities of an enemy faction (Sunmane). Each city has a castellan and four guards, all AI adventurers with a defensive
// lineup of five pets. She sends up to five of her own pets (each pet may attack once per UTC day); the fight runs on
// its own; points = % of the defender's HP removed (+10 for breaking it). Defender HP stays down for the event week.
// Point Rewards, three daily Siege Quests, Rankings against AI, a Report of her attacks, ranking rewards at the end.
// All numbers are placeholders. Rules first (pure, tested by scripts/test-siege.mjs), the screen below SIEGE_UI.
const Siege = {
  eventDays: 7, anchor: Date.UTC(2026, 10, 23), teamSize: 5, breakBonus: 10,
  ally: 'Moonwing', enemy: 'Sunmane',
  // City positions are percentages on the painted map (comp-siege-map).
  cities: [{ id: 'dragon', name: 'Dragon Keep', x: 45, y: 24, k: 1.35 }, { id: 'shield', name: 'Shield Hold', x: 79, y: 34, k: 1.1 },
    { id: 'banner', name: 'Banner Fort', x: 23, y: 45, k: .95 }, { id: 'beast', name: 'Beast Den', x: 77, y: 61, k: .85 },
    { id: 'tower', name: 'Challenge Tower', x: 22, y: 78, k: 1.6 }],
  // Pedestals in the city hall (comp-siege-hall): castellan first, then four guards.
  spots: [[50, 23], [20, 43], [79, 43], [20, 69], [79, 69]],
  names: ['Kylan', 'Miraj', 'Zenko', 'Quill', 'Ravel', 'Orsa', 'Tamsin', 'Brann', 'Ysolde', 'Corin', 'Faela', 'Gideon', 'Halle', 'Ivo', 'Juno',
    'Lorne', 'Maeve', 'Nim', 'Osric', 'Perra', 'Rook', 'Sable', 'Tiber', 'Ulla', 'Varek'],
  hpPerCp: 8, dmgPerAtk: 6,
  pointRewards: [{ at: 50, give: { chest1: 1, shardbag: 1 } }, { at: 100, give: { chest1: 1, shardbag: 1 } }, { at: 200, give: { chest1: 3, shardbag: 2 } },
    { at: 300, give: { chest2: 2, gembox: 1, shardbag: 2 } }, { at: 400, give: { chest2: 2, gembox: 1, shardbag: 2 } },
    { at: 600, give: { chest3: 1, gembox: 3, shardbag: 3 } }, { at: 800, give: { chest3: 1, petegg: 1, gembox: 5, shardbag: 4 } }],
  quests: [{ id: 'attack', text: 'Start 1 challenge today', need: 1, give: { exp1: 3, sealbag: 1 } },
    { id: 'break', text: 'Break an arena once today', need: 1, give: { stonebag: 2, shardbag: 1 } },
    { id: 'points', text: 'Earn 10 points today', need: 10, give: { stonebag: 1, gembox: 1 } }],
  ranks: [{ from: 1, to: 1, give: { petegg: 2, chest3: 2 } }, { from: 2, to: 3, give: { petegg: 1, chest3: 1 } }, { from: 4, to: 10, give: { chest2: 2, gembox: 2 } },
    { from: 11, to: 999, give: { chest2: 1, gembox: 1 } }],
  // Four factions take part (user photos: the higher her faction ranks, the better her personal reward). Moonwing is hers,
  // Sunmane the enemy she besieges; Tidefin and Stormhorn are simulated. factionMul scales the personal reward counts by
  // her faction's final place; factionRewards are paid on top; daily: a win or loss of her faction's daily battle.
  factions: ['Moonwing', 'Sunmane', 'Tidefin', 'Stormhorn'],
  factionMul: [1.5, 1.25, 1, .8],
  factionRewards: [{ give: { chest3: 2, petegg: 1 } }, { give: { chest3: 1, chest2: 1 } }, { give: { chest2: 2 } }, { give: { chest2: 1 } }],
  daily: { win: { gembox: 2, shardbag: 1 }, lose: { gembox: 1 } },
  aiNames: ['Aster', 'Briar', 'Cael', 'Dara', 'Elio', 'Faye', 'Gwyn', 'Hale', 'Isra', 'Jory', 'Kestrel', 'Lark', 'Mira', 'Nyx', 'Oren', 'Pell', 'Quinn', 'Rhea',
    'Sol', 'Teo', 'Una', 'Vey', 'Wren', 'Xyla', 'Yori', 'Zane', 'Arlo', 'Bree', 'Cato', 'Dune'],
  // ---- clock ----
  period(now = Date.now()) { return Math.floor((now - this.anchor) / (this.eventDays * 864e5)); },
  ends(p) { return this.anchor + (p + 1) * this.eventDays * 864e5; },
  day(t) { return Math.floor(t / 864e5); },
  mix(a, b) { let h = (a * 2654435761 + b * 40503 + 97) >>> 0; h ^= h >>> 15; h = Math.imul(h, 2246822519) >>> 0; h ^= h >>> 13; return (h >>> 0) / 4294967296; },
  // ---- defenders (deterministic per event week) ----
  defender(v, c, slot) {
    const city = this.cities[c], r = this.mix(v.period * 31 + c, slot), name = this.names[(c * 5 + slot + v.period * 3) % this.names.length];
    const factor = city.k * (slot === 0 ? 1.4 : .6 + r * .35), cp = Math.max(60, Math.round(v.base * factor));
    const pets = Array.from({ length: 5 }, (_, i) => 'd' + (4 + Math.floor(this.mix(v.period * 7 + c * 5 + slot, i) * 50)));
    return { c, slot, key: c + ':' + slot, name, role: slot === 0 ? 'castellan' : 'guard', cp, pets, hp: v.hp[c + ':' + slot] ?? 100, tries: v.tries[c + ':' + slot] || 0 };
  },
  cityLeft(v, c) { return [0, 1, 2, 3, 4].filter(s => (v.hp[c + ':' + s] ?? 100) > 0).length; },
  // ---- state (S.siege, optional) ----
  fresh(now, base) { return { period: this.period(now), base: Math.max(60, Math.round(base || 60)), points: 0, hp: {}, tries: {}, claimed: [], day: this.day(now), used: [], today: { attacks: 0, breaks: 0, pts: 0 }, qdone: [], report: [] }; },
  // Bring a save up to now: a new event week pays the old ranking (`due`) and starts fresh; a new UTC day frees the pets.
  roll(saved, now = Date.now(), base = 60) {
    let v = saved ? JSON.parse(JSON.stringify(saved)) : null, due = null;
    if (v && v.period !== this.period(now)) {
      const end = this.ends(v.period), fr = this.factionRank(v.points, v.period, end), extra = this.factionRewards[fr - 1].give;
      if (v.points > 0) { const rank = this.rankOf(v.points, v.period, end), t = this.rankTier(rank); due = { rank, points: v.points, faction: fr, give: this.mergeGive(t ? this.scaled(t.give, fr) : {}, extra) }; }
      else due = { rank: 0, points: 0, faction: fr, give: extra };
      v = null;
    }
    let daily = null;
    if (v && this.day(now) !== v.day) { const win = this.dayWin(v.period, v.day, v.today.pts); daily = { win, day: v.day, give: win ? this.daily.win : this.daily.lose }; }
    if (!v) v = this.fresh(now, base);
    if (this.day(now) !== v.day) { v.day = this.day(now); v.used = []; v.today = { attacks: 0, breaks: 0, pts: 0 }; v.qdone = []; }
    return { v, due, daily };
  },
  // One attack: team = [{id, atk}], up to five pets not used today. Returns the result and applies it.
  attack(v, c, slot, team, now = Date.now(), rng = Math.random) {
    const d = this.defender(v, c, slot);
    if (!this.cities[c] || slot < 0 || slot > 4) return { ok: false, err: 'target' };
    if (d.hp <= 0) return { ok: false, err: 'broken' };
    if (!team.length || team.length > this.teamSize || new Set(team.map(p => p.id)).size !== team.length) return { ok: false, err: 'team' };
    if (team.some(p => v.used.includes(p.id))) return { ok: false, err: 'used' };
    const pool = d.cp * this.hpPerCp, hits = team.map(p => Math.max(1, p.atk) * this.dmgPerAtk * (.88 + rng() * .24)), total = hits.reduce((a, b) => a + b, 0);
    const dmg = Math.min(d.hp, Math.round(total / pool * 100)), broke = dmg >= d.hp, pts = dmg + (broke ? this.breakBonus : 0);
    v.hp[d.key] = d.hp - dmg; v.tries[d.key] = d.tries + 1; v.points += pts; v.used.push(...team.map(p => p.id));
    v.today.attacks++; v.today.pts += pts; if (broke) v.today.breaks++;
    const shares = hits.map(h => Math.round(h / total * 100));
    v.report.unshift({ t: now, c, slot, name: d.name, dmg, pts, broke }); v.report = v.report.slice(0, 20);
    return { ok: true, d, dmg, broke, pts, shares, hpBefore: d.hp, hpAfter: d.hp - dmg };
  },
  claimPoint(v, i) { const r = this.pointRewards[i]; if (!r || v.claimed.includes(i) || v.points < r.at) return null; v.claimed.push(i); return r.give; },
  questDone(v, q) { return q.id === 'attack' ? v.today.attacks >= q.need : q.id === 'break' ? v.today.breaks >= q.need : v.today.pts >= q.need; },
  questProgress(v, q) { return Math.min(q.need, q.id === 'attack' ? v.today.attacks : q.id === 'break' ? v.today.breaks : v.today.pts); },
  claimQuest(v, id) { const q = this.quests.find(x => x.id === id); if (!q || v.qdone.includes(id) || !this.questDone(v, q)) return null; v.qdone.push(id); return q.give; },
  // ---- simulated AI: faction totals and the personal ranking ----
  progress(p, now) { const start = this.ends(p) - this.eventDays * 864e5; return Math.min(1, Math.max(0, (now - start) / (this.eventDays * 864e5 * .8))); },
  allyAi(p, now) { return Math.round(3200 * Math.pow(this.progress(p, now), .8)); },
  field(p, now = Date.now()) { const f = this.progress(p, now); return this.aiNames.map((name, i) => ({ name, ai: true, points: Math.round((80 + Math.pow(this.mix(p + 5, i), 1.8) * 1300) * Math.pow(f, .75)) })).filter(x => x.points > 0).sort((a, b) => b.points - a.points); },
  rankOf(points, p, now = Date.now()) { return points ? 1 + this.field(p, now).filter(x => x.points >= points).length : 0; },
  rankTier(rank) { return this.ranks.find(t => rank >= t.from && rank <= t.to) || null; },
  // ---- the four factions ----
  factionPoints(myPoints, p, now = Date.now()) {
    const f = Math.pow(this.progress(p, now), .8);
    return this.factions.map((name, i) => ({ name, i, points: i === 0 ? myPoints + this.allyAi(p, now) : Math.round((2600 + this.mix(p * 11 + i, 4) * 1500) * f) }))
      .sort((a, b) => b.points - a.points || a.i - b.i).map((x, k) => ({ ...x, rank: k + 1 }));
  },
  factionRank(myPoints, p, now = Date.now()) { return this.factionPoints(myPoints, p, now).find(x => x.i === 0).rank; },
  scaled(give, factionRank) { const m = this.factionMul[factionRank - 1] ?? 1; return Object.fromEntries(Object.entries(give).map(([k, n]) => [k, Math.max(1, Math.round(n * m))])); },
  mergeGive(a, b) { const o = { ...a }; for (const [k, n] of Object.entries(b || {})) o[k] = (o[k] || 0) + n; return o; },
  // Her faction's daily battle against Sunmane: Moonwing's AI share for the day plus her own points that day.
  dayScore(p, day) { return { ally: Math.round(420 + this.mix(p * 17 + day, 1) * 260), enemy: Math.round(480 + this.mix(p * 17 + day, 2) * 300) }; },
  dayWin(p, day, myPts) { const d = this.dayScore(p, day); return d.ally + myPts >= d.enemy; },
  valid(v) {
    const int = (n, m = 1e9) => Number.isInteger(n) && n >= 0 && n <= m, obj = o => !!o && typeof o === 'object' && !Array.isArray(o), key = k => /^[0-4]:[0-4]$/.test(k);
    return obj(v) && Number.isInteger(v.period) && int(v.base) && int(v.points) && Number.isInteger(v.day)
      && obj(v.hp) && Object.entries(v.hp).every(([k, n]) => key(k) && int(n, 100)) && obj(v.tries) && Object.entries(v.tries).every(([k, n]) => key(k) && int(n, 1e4))
      && Array.isArray(v.claimed) && v.claimed.every(i => int(i, this.pointRewards.length - 1)) && Array.isArray(v.used) && v.used.length <= 200 && v.used.every(x => typeof x === 'string' && x.length < 12)
      && obj(v.today) && ['attacks', 'breaks', 'pts'].every(k => int(v.today[k])) && Array.isArray(v.qdone) && v.qdone.every(id => this.quests.some(q => q.id === id))
      && Array.isArray(v.report) && v.report.length <= 20 && v.report.every(r => obj(r) && int(r.dmg, 100) && int(r.pts, 200) && int(r.c, 4) && int(r.slot, 4) && typeof r.name === 'string');
  }
};

// SIEGE_UI
let siegeCity = -1, siegeTeam = [], siegeTarget = null, siegeTimer = 0, siegeFight = null;
const sgItem = id => (typeof item === 'function' ? item(id) : null);
function sgPet(id) { const it = sgItem(id); return it && typeof petPicture === 'function' ? petPicture(it) : artPath('familiar-' + id.slice(1)); }
function sgRar(id) { const r = sgItem(id)?.rarity || 'Common'; return ({ Common: 'c', Rare: 'r', Epic: 'e', 'Super Rare': 's', Legendary: 'l' })[r] || 'c'; }
function sgAtk(id) { return WonderGear.petAttack(S, id); }
function sgOwned() { return S.owned.filter(id => sgItem(id)?.type === 'dragon').sort((a, b) => sgAtk(b) - sgAtk(a)); }
function sgBase() { return sgOwned().slice(0, Siege.teamSize).reduce((a, id) => a + sgAtk(id), 0); }
function siegeState() {
  const { v, due, daily } = Siege.roll(S.siege, Date.now(), sgBase());
  if (due && due.give) { siegePay(due.give); const txt = 'Pet Siege ended: ' + (due.rank ? 'rank ' + due.rank + ', ' : '') + Siege.factions[0] + ' placed ' + due.faction + '. Rewards sent to the bag.'; if (WonderGear.socialNote) WonderGear.socialNote(S, txt); toast(txt); if (due.rank === 1 && typeof titleGrant === 'function') titleGrant('siege'); }
  if (daily) { siegePay(daily.give); toast('Pet Siege daily battle ' + (daily.win ? 'won' : 'lost') + ' · reward sent to the bag'); }
  S.siege = v; return v;
}
function siegePay(give) { for (const [k, n] of Object.entries(give || {})) { if (k === 'gold') S.gold += n; else WonderGear.bagAdd(S, k, n); } }
function siegeGifts(give) { return typeof partyGifts === 'function' ? partyGifts(give) : ''; }
function sgClock(ms) { const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60); return (d ? d + 'd ' : '') + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function siegeStop() { clearInterval(siegeTimer); siegeTimer = 0; clearInterval(siegeFight?.timer); }
function siegeTick() { if (screen !== 'siege') return siegeStop(); const t = document.querySelector('.sg-clock'); if (t && S.siege) t.textContent = 'Attack: ' + sgClock(Siege.ends(S.siege.period) - Date.now()); }
function siegeHead(v) {
  const ally = v.points + Siege.allyAi(v.period, Date.now());
  return `<div class="sg-vs"><b class="a">${Siege.ally} (Ally)</b><i>VS</i><b class="e">${Siege.enemy} (Enemy)</b></div>
   <div class="sg-pts"><span>Points: ${fmt(ally)}</span><span class="sg-clock">Attack: ${sgClock(Siege.ends(v.period) - Date.now())}</span><span>Points: 0</span></div>`;
}
function siegeBar(back) {
  const v = S.siege, q = Siege.quests.some(x => Siege.questDone(v, x) && !v.qdone.includes(x.id)), p = Siege.pointRewards.some((r, i) => v.points >= r.at && !v.claimed.includes(i));
  return `<div class="sg-bar"><button data-back aria-label="Back" onclick="${back}">‹</button>${[['📜', 'Rules', 'siegeRules()'], ['📝', 'Report', 'siegeReport()'], ['🎁', 'Reward Preview', 'siegePreview()'],
    ['🗒️', 'Siege Quest', 'siegeQuests()', q], ['💰', 'Point Rewards', 'siegePoints()', p], ['🏆', 'Rankings', 'siegeRanks()']].map(([i, t, f, dot]) => `<button onclick="${f}">${denPlain}<i>${i}</i><small>${t}</small>${dot ? '<em></em>' : ''}</button>`).join('')}</div>`;
}
function showSiege() {
  const v = siegeState(); save(); siegeCity = -1; siegeStop();
  const cities = Siege.cities.map((c, i) => { const left = Siege.cityLeft(v, i);
    return `<button class="sg-city ${left ? '' : 'fallen'}" style="left:${c.x}%;top:calc(50% + ${c.y - 50} * 1.5cqw)" onclick="siegeOpen(${i})">${denPlain}<b>${c.name}</b><em>${left ? 'Enemy' : 'Taken'}</em><span class="sg-seg">${[0, 1, 2, 3, 4].map(s => `<i class="${(v.hp[i + ':' + s] ?? 100) > 0 ? 'on' : ''}"></i>`).join('')}</span></button>`; }).join('');
  $('#main').innerHTML = `<section class="sg-room sg-map" style="--sgbg:url('${artPath('comp-siege-map')}')">${siegeHead(v)}<p class="sg-stage">Your points: <b>${fmt(v.points)}</b> · pets rested today: ${v.used.length}</p>${cities}${siegeBar("go('home')")}</section>`;
  siegeTimer = setInterval(siegeTick, 1000);
}
function siegeOpen(c) {
  const v = S.siege; siegeCity = c; screenChangedAt = Date.now();
  const peds = Siege.spots.map(([x, y], s) => { const d = Siege.defender(v, c, s);
    return `<button class="sg-ped ${d.hp > 0 ? '' : 'down'} ${s ? '' : 'boss'}" style="--x:${x};--y:${y}" onclick="siegeLineup(${c},${s})">${denPlain}<img src="${sgPet(d.pets[0])}" alt=""><span class="sg-hp"><i style="width:${d.hp}%"></i><b>${d.hp}%</b></span><span class="sg-nm"><u>${d.role}</u> ${d.name} <small>AI</small></span></button>`; }).join('');
  $('#main').innerHTML = `<section class="sg-room sg-hall" style="--sgbg:url('${artPath('comp-siege-hall')}')">${siegeHead(v)}<h2 class="sg-title">${Siege.cities[c].name}</h2>${peds}${siegeBar('showSiege()')}</section>`;
  siegeStop(); siegeTimer = setInterval(siegeTick, 1000);
}
function siegeLineup(c, s) {
  const d = Siege.defender(S.siege, c, s);
  popup(`<div class="sg-pop"><h2>Defensive lineup</h2><div class="sg-who"><img src="${sgPet(d.pets[0])}" alt=""><div><b>${d.name} <small>AI</small></b><span>${Siege.enemy} · ${d.role}</span></div><span class="sg-tries"><b>${d.tries}</b><small>Defense Attempts</small></span></div>
   <div class="sg-cp">CP: ${fmt(d.cp)}</div><div class="sg-pets">${d.pets.map(id => `<span class="sg-tile r-${sgRar(id)}"><img src="${sgPet(id)}" alt=""><i style="--hp:${d.hp}%">${d.hp}%</i></span>`).join('')}</div>
   <p class="sg-note">The more HP you take, the more points you earn. Breaking this arena gives ${Siege.breakBonus} extra points.</p>
   ${d.hp > 0 ? `<button class="primary" onclick="siegeForm(${c},${s})">${denPlain}Go challenge</button>` : '<p class="sg-note"><b>This arena is broken.</b></p>'}</div>`);
}
function siegeForm(c, s) {
  document.querySelector('#modal')?.close?.(); siegeTarget = [c, s]; const v = S.siege, d = Siege.defender(v, c, s), own = sgOwned();
  siegeTeam = siegeTeam.filter(id => own.includes(id) && !v.used.includes(id)).slice(0, Siege.teamSize);
  const power = siegeTeam.reduce((a, id) => a + sgAtk(id), 0), slots = Array.from({ length: Siege.teamSize }, (_, i) => siegeTeam[i]);
  $('#main').innerHTML = `<section class="sg-room sg-form" style="--sgbg:url('${artPath('comp-siege-hall')}')">
   <div class="sg-cmp"><span>⚔ ${fmt(power)} <small>your team</small></span><span>${fmt(d.cp)} ⚔ <small>${d.name} · AI</small></span></div>
   <div class="sg-enemy">${d.pets.map(id => `<img src="${sgPet(id)}" alt="">`).join('')}</div>
   <div class="sg-board">${slots.map((id, i) => `<button class="sg-slot ${id ? 'full' : ''}" onclick="${id ? `siegePick('${id}')` : ''}">${denPlain}${id ? `<img src="${sgPet(id)}" alt=""><b>${fmt(sgAtk(id))}</b>` : `<i>${i + 1}</i>`}</button>`).join('')}</div>
   <p class="sg-note">Each pet can only be deployed in one attack per day.</p>
   <div class="sg-roster"><div class="sg-rtop"><b>Offense Formation</b><button onclick="siegeQuick()">${denPlain}Quick deploy</button></div><div class="sg-rgrid">${own.map(id => { const used = v.used.includes(id), on = siegeTeam.includes(id);
      return `<button class="sg-tile r-${sgRar(id)} ${used ? 'used' : ''} ${on ? 'on' : ''}" ${used ? 'disabled' : ''} onclick="siegePick('${id}')">${denPlain}<img src="${sgPet(id)}" alt=""><b>${fmt(sgAtk(id))}</b>${on ? '<em>✓</em>' : used ? '<em class="z">Zz</em>' : ''}</button>`; }).join('')}</div></div>
   <div class="sg-go"><button data-back aria-label="Back" onclick="siegeOpen(${c})">‹</button><button class="sg-gobtn" ${siegeTeam.length ? '' : 'disabled'} onclick="siegeGo()">${denPlain}Go challenge</button></div></section>`;
}
function siegePick(id) { const i = siegeTeam.indexOf(id); if (i >= 0) siegeTeam.splice(i, 1); else if (siegeTeam.length < Siege.teamSize) siegeTeam.push(id); else return toast('Five pets at most'); siegeForm(...siegeTarget); }
function siegeQuick() { const v = S.siege; siegeTeam = sgOwned().filter(id => !v.used.includes(id)).slice(0, Siege.teamSize); siegeForm(...siegeTarget); }
// The fight: both lineups on the arena floor, lunges and damage numbers for a few seconds, then the result card.
function siegeGo() {
  const [c, s] = siegeTarget, v = S.siege, team = siegeTeam.map(id => ({ id, atk: sgAtk(id) })), res = Siege.attack(v, c, s, team);
  if (!res.ok) return toast({ used: 'A pet already attacked today', broken: 'This arena is already broken', team: 'Pick up to five pets' }[res.err] || 'Cannot attack');
  if (typeof trailTick === 'function') trailTick('siege');
  save(); siegeTeam = []; screenChangedAt = Date.now();
  const mine = team.map((p, i) => `<div class="sg-f me f${i}"><img src="${sgPet(p.id)}" alt=""><span class="sg-hp"><i style="width:100%"></i></span></div>`).join('');
  const foe = res.d.pets.map((id, i) => `<div class="sg-f foe f${i}"><img src="${sgPet(id)}" alt=""><span class="sg-hp"><i id="sgFoe${i}" style="width:${res.hpBefore}%"></i></span></div>`).join('');
  $('#main').innerHTML = `<section class="sg-room sg-battle" style="--sgbg:url('${artPath('comp-siege-hall')}')"><div class="sg-count">Battle Ending Countdown: <b id="sgCount">00:59</b></div>
   <div class="sg-field" id="sgField">${foe}${mine}</div><div class="sg-dmg"><b>DMG Stats</b>${team.map((p, i) => `<div><img src="${sgPet(p.id)}" alt=""><span id="sgD${i}">0</span><i><u id="sgB${i}"></u></i></div>`).join('')}</div>
   <button class="sg-skip" onclick="siegeResult()">${denPlain}Skip</button></section>`;
  const total = res.d.cp * Siege.hpPerCp * res.dmg / 100, dur = 5200, t0 = Date.now(); let lastHit = 0;
  siegeFight = { res, team, timer: setInterval(() => {
    const k = Math.min(1, (Date.now() - t0) / dur), cnt = $('#sgCount'); if (!cnt) return clearInterval(siegeFight.timer);
    cnt.textContent = '00:' + String(Math.max(0, Math.round(59 * (1 - k)))).padStart(2, '0');
    for (let i = 0; i < 5; i++) { const b = $('#sgFoe' + i); if (b) b.style.width = Math.max(0, res.hpBefore - res.dmg * k) + '%'; }
    team.forEach((p, i) => { const sh = res.shares[i] / 100; const dv = $('#sgD' + i); if (dv) dv.textContent = fmt(Math.round(total * sh * k)); const bb = $('#sgB' + i); if (bb) bb.style.width = (res.shares[i] * k) + '%'; });
    if (Date.now() - lastHit > 380) { lastHit = Date.now(); const all = document.querySelectorAll('.sg-f.me'), foes = document.querySelectorAll('.sg-f.foe'), a = all[Math.floor(Math.random() * all.length)], f = foes[Math.floor(Math.random() * foes.length)];
      if (a && f) { a.classList.remove('hit'); void a.offsetWidth; a.classList.add('hit'); f.insertAdjacentHTML('beforeend', `<em class="sg-num">-${fmt(Math.round(total / 14 * (.6 + Math.random() * .8)))}</em>`); setTimeout(() => f.querySelector('.sg-num')?.remove(), 700); } }
    if (k >= 1) { clearInterval(siegeFight.timer); setTimeout(siegeResult, 400); }
  }, 60) };
}
function siegeResult() {
  if (!siegeFight) return; clearInterval(siegeFight.timer); const { res, team } = siegeFight; siegeFight = null; if (screen !== 'siege') return;
  popup(`<div class="sg-pop sg-win"><h2 class="sg-victory">${res.broke ? 'VICTORY' : 'BATTLE OVER'}</h2><p class="sg-line">Deal <b>${res.dmg}%</b> damage and gain <b>${res.dmg}</b> points</p>${res.broke ? `<p class="sg-line">Break the arena and gain <b>${Siege.breakBonus}</b> points</p>` : ''}
   <div class="sg-statrow">${team.map((p, i) => `<span><img src="${sgPet(p.id)}" alt=""><i><u style="width:${res.shares[i]}%"></u></i><b>${res.shares[i]}%</b></span>`).join('')}</div>
   <button class="primary" onclick="document.querySelector('#modal').close();siegeOpen(${res.d.c})">${denPlain}Confirm</button></div>`);
}
function siegeRules() {
  popup(`<div class="sg-pop"><h2>Pet Siege</h2><ol class="sg-rules"><li>${Siege.ally} (your faction) attacks the five cities of ${Siege.enemy} for ${Siege.eventDays} days.</li><li>Every city has a castellan and four guards (AI adventurers) with five pets each.</li>
   <li>Pick up to five of your pets and challenge a defender. Each pet may attack once per day (resets at 00:00 UTC).</li><li>Points = the % of the defender's HP you take. Breaking a defender (0% HP) gives ${Siege.breakBonus} extra points. Defenders do not heal during the event.</li>
   <li>Points open Point Rewards; daily Siege Quests pay more. Ranking rewards are sent to the bag when the event ends.</li><li>Everyone else in the event is an AI adventurer.</li></ol></div>`);
}
function siegeReport() {
  const r = S.siege.report;
  popup(`<div class="sg-pop"><h2>Report</h2><div class="sg-list">${r.length ? r.map(x => `<div class="sg-rowr"><b>${Siege.cities[x.c].name}</b><span>${x.name} <small>AI</small> · ${x.dmg}%${x.broke ? ' · broken' : ''}</span><em>+${x.pts}</em></div>`).join('') : '<p class="sg-note">No attacks yet.</p>'}</div></div>`);
}
function siegePoints() {
  const v = S.siege;
  popup(`<div class="sg-pop"><h2>Point Rewards</h2><div class="sg-list">${Siege.pointRewards.map((r, i) => { const got = v.claimed.includes(i), ok = v.points >= r.at;
    return `<div class="sg-prow"><span class="sg-need">Point<b class="${ok ? 'ok' : ''}">${fmt(Math.min(v.points, r.at))}/${fmt(r.at)}</b></span><div class="pp-gl">${siegeGifts(r.give)}</div><button class="${got ? 'got' : ok ? 'ready' : 'undone'}" ${got || !ok ? 'disabled' : ''} onclick="siegeClaim(${i})">${denPlain}${got ? 'Claimed' : ok ? 'Claim' : 'Undone'}</button></div>`; }).join('')}</div></div>`);
}
function siegeClaim(i) { const g = Siege.claimPoint(S.siege, i); if (!g) return; siegePay(g); save(); siegePoints(); toast('Reward claimed'); }
function siegeQuests() {
  const v = S.siege;
  popup(`<div class="sg-pop"><h2>Siege Quest</h2><div class="sg-list">${Siege.quests.map(q => { const got = v.qdone.includes(q.id), ok = Siege.questDone(v, q);
    return `<div class="sg-qrow"><b>${q.text} (${Siege.questProgress(v, q)}/${q.need})</b><div class="pp-gl">${siegeGifts(q.give)}</div><button class="${got ? 'got' : ok ? 'ready' : 'undone'}" ${got || !ok ? 'disabled' : ''} onclick="siegeQuest('${q.id}')">${denPlain}${got ? 'Claimed' : ok ? 'Claim' : 'Undone'}</button></div>`; }).join('')}</div><p class="sg-note">Quests reset at 00:00 UTC.</p></div>`);
}
function siegeQuest(id) { const g = Siege.claimQuest(S.siege, id); if (!g) return; siegePay(g); save(); siegeQuests(); toast('Quest reward claimed'); }
function siegeRanks() {
  const v = S.siege, list = Siege.field(v.period).slice(); if (v.points) list.push({ name: S.name || 'Reina', points: v.points, me: true });
  list.sort((a, b) => b.points - a.points);
  popup(`<div class="sg-pop"><h2>Rankings</h2><div class="sg-list">${list.slice(0, 30).map((x, i) => `<div class="sg-rowr ${x.me ? 'me' : ''}"><b>${i + 1}</b><span>${x.me ? x.name : x.name + ' <small>AI</small>'}</span><em>${fmt(x.points)}</em></div>`).join('')}</div>
   <p class="sg-note">Your rank: <b>${Siege.rankOf(v.points, v.period) || 'None'}</b> · points ${fmt(v.points)}</p></div>`);
}
// Reward Preview (user photos): three tabs - Individual Points Reward (one page per final place of her faction, the
// current place marked), Faction Ranking Reward, Daily Reward (her faction's daily battle won / lost).
let sgPrevTab = 'ind', sgPrevFac = 0;
function sgBadge(n) { return `<i class="sg-badge b${Math.min(n, 4)}">${n}</i>`; }
function siegePreview(tab, fac) {
  const v = S.siege, now = Date.now(), cur = Siege.factionRank(v.points, v.period, now);
  if (tab) sgPrevTab = tab; if (fac) sgPrevFac = fac; if (!sgPrevFac) sgPrevFac = cur;
  const tabs = [['ind', 'Individual Points'], ['fac', 'Faction Ranking'], ['day', 'Daily Reward']].map(([k, t]) => `<button class="${k === sgPrevTab ? 'on' : ''}" onclick="siegePreview('${k}')">${denPlain}${t}</button>`).join('');
  let body = '';
  if (sgPrevTab === 'ind') body = `<div class="sg-ftabs">${Siege.factions.map((_, i) => `<button class="${i + 1 === sgPrevFac ? 'on' : ''}" onclick="siegePreview('ind',${i + 1})">${denPlain}${i + 1 === cur ? '<small>Now</small>' : ''}Faction No.${i + 1}</button>`).join('')}</div>
    <div class="sg-list">${Siege.ranks.map(t => `<div class="sg-prow"><span class="sg-need">${t.from === t.to ? sgBadge(t.from) : `<b>${t.from}-${t.to}</b>`}</span><div class="pp-gl">${siegeGifts(Siege.scaled(t.give, sgPrevFac))}</div></div>`).join('')}</div>
    <p class="sg-note">The higher ${Siege.factions[0]} places, the better your personal reward. ${Siege.factions[0]} is No.${cur} now.</p>`;
  else if (sgPrevTab === 'fac') body = `<div class="sg-list">${Siege.factionPoints(v.points, v.period, now).map(f => `<div class="sg-prow ${f.i === 0 ? 'me' : ''}"><span class="sg-need">${sgBadge(f.rank)}</span><div class="pp-gl">${siegeGifts(Siege.factionRewards[f.rank - 1].give)}</div><em class="sg-fname">${f.name}${f.i === 0 ? '' : ' <small>AI</small>'}<br>${fmt(f.points)}</em></div>`).join('')}</div>
    <p class="sg-note">Paid to every ${Siege.factions[0]} member when the event ends (in ${sgClock(Siege.ends(v.period) - now)}).</p>`;
  else { const d = Siege.dayScore(v.period, v.day), ally = d.ally + v.today.pts;
    body = `<div class="sg-day win"><h3>Rewards on Victory</h3><div class="pp-gl">${siegeGifts(Siege.daily.win)}</div></div><div class="sg-day lose"><h3>Rewards on Defeat</h3><div class="pp-gl">${siegeGifts(Siege.daily.lose)}</div></div>
    <p class="sg-note">Today: ${Siege.ally} ${fmt(ally)} · ${Siege.enemy} ${fmt(d.enemy)} (${ally >= d.enemy ? 'winning' : 'behind'}). Settled at 00:00 UTC.</p>`; }
  popup(`<div class="sg-pop sg-prev"><h2>${sgPrevTab === 'ind' ? 'Individual Point Rewards' : sgPrevTab === 'fac' ? 'Faction Ranking Rewards' : 'Daily Reward'}</h2>${body}<div class="sg-ptabs">${tabs}</div></div>`);
}
