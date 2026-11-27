'use strict';
// Forge: Set and Awaken (user photos of the reference's Forge, 2026-11-27). Both belong to the equipment SLOT, so a
// new piece in the slot keeps them ("changing or transferring gears will not lose Set Stones", "changing gears inherits
// Awaken Level"). Optional save field S.forge {set:{slot:0-4}, aw:{slot:0-20}}. All numbers are placeholders.
// - Sets go in a chain Aurora -> Star -> Moon -> Sun. A slot's set level counts for a set only while the piece worn there
//   is Orange (2★) or finer and of the set's tier or higher. Bonuses at 2 / 4 / 6 pieces of a set, scaled per set.
// - Awaken: +1 level for Awakening Crystals; the cap follows the tier of the piece worn (tier + 2, at most 20).
const Forge = {
  sets: [
    { id: 'aurora', name: 'Aurora', tier: 5, scale: 1, stones: [['setAurora', 4]] },
    { id: 'star', name: 'Star', tier: 8, scale: 2.5, stones: [['setAurora', 4], ['setStar', 3]] },
    { id: 'moon', name: 'Moon', tier: 13, scale: 5, stones: [['setMoon', 3]] },
    { id: 'sun', name: 'Sun', tier: 17, scale: 9, stones: [['setMoon', 3], ['setSun', 2]] }
  ],
  minOrder: 2,
  setBonus: {
    2: { attack: 300, penetration: 200, healthPercent: 1 },
    4: { health: 8000, defense: 260, attackPercent: 1 },
    6: { attack: 250, health: 5000, attackPercent: .5, defensePercent: 1 }
  },
  awakenMax: 20,
  awakenCap(tier) { return Math.min(Forge.awakenMax, Math.max(0, tier + 2)); },
  awakenCost(lv) { return 3 + 2 * lv; },
  awakenStep(tier, offense) { return offense ? { attack: 12 * tier, penetration: 6 * tier } : { health: 150 * tier, defense: 4 * tier }; },
  offense(slot) { return !!WonderGear.slots.find(x => x.id === slot)?.offense; },
  raw(s) { if (!s.forge) s.forge = { set: {}, aw: {} }; s.forge.set ??= {}; s.forge.aw ??= {}; return s.forge; },
  piece(s, slot) {
    const eq = WonderGear.state(s), uid = eq.equipped[slot];
    return uid == null ? null : eq.items.find(e => e.uid === uid) || null;
  },
  tierOf(s, slot) { const p = Forge.piece(s, slot); return p ? WonderGear.catalog[p.template].tier : 0; },
  fits(s, slot, i) {
    const p = Forge.piece(s, slot), r = WonderGear;
    return !!p && r.catalog[p.template].tier >= Forge.sets[i].tier && r.gearOrder(r.gearRank(p)) >= Forge.minOrder;
  },
  level(s, slot) { return s.forge?.set?.[slot] || 0; },
  awakened(s, slot) { return s.forge?.aw?.[slot] || 0; },
  count(s, i) { return WonderGear.slots.filter(x => Forge.level(s, x.id) > i && Forge.fits(s, x.id, i)).length; },
  scaled(o, k) { const out = {}; for (const [key, n] of Object.entries(o)) out[key] = Math.round(n * k * 100) / 100; return out; },
  // Why set i cannot be forged on the slot now ('' when it can).
  setWhy(s, slot, i) {
    const S = Forge.sets[i], lv = Forge.level(s, slot);
    if (lv > i) return 'Forged';
    if (!Forge.piece(s, slot)) return 'Wear a piece first';
    if (lv < i) return 'Please forge ' + Forge.sets[i - 1].name + ' Set first';
    if (!Forge.fits(s, slot, i)) return 'T' + S.tier + ' Orange (2★) or finer can be forged';
    if (S.stones.some(([id, n]) => WonderGear.bagCount(s, id) < n)) return 'Not enough set stones';
    return '';
  },
  take(s, id, n) { const b = s.bag || (s.bag = { ...WonderGear.bagStarter }); b[id] = (b[id] || 0) - n; if (b[id] <= 0) delete b[id]; },
  forge(s, slot, i) {
    if (Forge.setWhy(s, slot, i)) return false;
    for (const [id, n] of Forge.sets[i].stones) Forge.take(s, id, n);
    Forge.raw(s).set[slot] = i + 1; return true;
  },
  awakenWhy(s, slot) {
    const lv = Forge.awakened(s, slot), tier = Forge.tierOf(s, slot);
    if (!tier) return 'Wear a piece first';
    if (lv >= Forge.awakenMax) return 'Fully awakened';
    if (lv >= Forge.awakenCap(tier)) return 'T' + (lv - 1) + ' to awaken';
    if (WonderGear.bagCount(s, 'awakenCore') < Forge.awakenCost(lv)) return 'Not enough Awakening Crystals';
    return '';
  },
  awaken(s, slot) {
    if (Forge.awakenWhy(s, slot)) return false;
    Forge.take(s, 'awakenCore', Forge.awakenCost(Forge.awakened(s, slot)));
    const f = Forge.raw(s); f.aw[slot] = (f.aw[slot] || 0) + 1; return true;
  },
  awakenStats(s, slot, lv = Forge.awakened(s, slot)) {
    const step = Forge.awakenStep(Forge.tierOf(s, slot), Forge.offense(slot)), out = {};
    for (const [k, n] of Object.entries(step)) out[k] = n * lv;
    return out;
  },
  bonus(s) {
    const b = {}, add = o => { for (const [k, n] of Object.entries(o)) b[k] = Math.round(((b[k] || 0) + n) * 100) / 100; };
    if (!s.forge || !s.equipment) return b;
    Forge.sets.forEach((set, i) => { const c = Forge.count(s, i); for (const need of [2, 4, 6]) if (c >= need) add(Forge.scaled(Forge.setBonus[need], set.scale)); });
    for (const x of WonderGear.slots) if (Forge.piece(s, x.id)) add(Forge.awakenStats(s, x.id));
    return b;
  },
  valid(f) {
    const slots = new Set(WonderGear.slots.map(x => x.id)), map = (o, max) => o === undefined || !!o && typeof o === 'object' && !Array.isArray(o) && Object.entries(o).every(([k, n]) => slots.has(k) && Number.isInteger(n) && n >= 0 && n <= max);
    return f === undefined || !!f && typeof f === 'object' && map(f.set, Forge.sets.length) && map(f.aw, Forge.awakenMax);
  }
};
globalThis.Forge = Forge;

// ---- FORGE_UI: Set and Awaken pages of the Forge room (light layout, CSS ".fg-*") --------------------------------
let fgSlot = 'bow', fgSet = 0;
// go() resets the Forge to its first page, so open it first and then switch.
function forgeGo(page, mode) { go('cityForge'); smithTab(page, mode); }
const fgStatLine = (k, n) => `<p><span>${WonderGear.labels[k] || k}</span><b>${WonderGear.percentKeys.has(k) ? n + '%' : fmt(Math.round(n))}</b></p>`;
function fgTile(s, slot, note, act) {
  const r = WonderGear, p = Forge.piece(s, slot), t = p ? r.catalog[p.template] : null, q = p ? r.gearRanks[r.gearRank(p)] : null;
  const name = t ? 'T' + t.tier + '·' + (r.slots.find(x => x.id === slot)?.name || slot) : r.slots.find(x => x.id === slot)?.name || slot;
  return `<button class="fg-card ${slot === fgSlot ? 'on' : ''}" onclick="${act}">${typeof denPlain === 'string' ? denPlain : ''}<small>${name}</small><span class="fg-tile" style="--q:${q ? q.color : '#9ab'}">${t ? gearArt(t) + '<b>T' + t.tier + '</b>' + (q.stars ? '<i>' + '★'.repeat(q.stars) + '</i>' : '') : '<em>Empty</em>'}</span><small class="${note[1] || ''}">${note[0]}</small></button>`;
}
function fgFrame(page, mode, body) {
  const icons = ['hud-forge', 'hud-gems', 'hud-gear', 'hud-reinforce', 'hud-rank'];
  const old = document.querySelector('.fg-rail')?.scrollLeft || 0;
  $('#main').innerHTML = `<section class="fg-room"><div class="fg-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><b class="fg-title">Forge</b><span class="fg-chip">${uiIcon('gold')}${fmt(S.gold)}</span><span class="fg-chip">${uiIcon('crystals')}${fmt(S.scales || 0)}</span></div>${body}
   <div class="fg-modes">${smithPages[page].map(m => `<button class="${m === mode ? 'on' : ''}" onclick="smithTab('${page}','${m}')">${denPlain}${m}</button>`).join('')}</div>
   <div class="fg-nav">${Object.keys(smithPages).map((p, i) => `<button class="${p === page ? 'on' : ''}" onclick="smithTab('${p}')">${denPlain}${artImage(icons[i], '')}<span>${p}</span></button>`).join('')}</div></section>`;
  const rail = document.querySelector('.fg-rail'); if (rail) rail.scrollLeft = old;
}
function fgStone(id, have, need) { return `<span class="fg-stone">${bagIcon(id)}<b class="${have < need ? 'low' : ''}">${fmt(have)}/${need}</b></span>`; }
function forgeSetView() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const r = WonderGear, i = fgSet, set = Forge.sets[i], piece = Forge.piece(S, fgSlot), t = piece ? r.catalog[piece.template] : null;
  const why = Forge.setWhy(S, fgSlot, i), forged = Forge.level(S, fgSlot) > i, count = Forge.count(S, i);
  const stones = set.stones.map(([id, n]) => fgStone(id, r.bagCount(S, id), n)).join('') + '<span class="fg-stone lock">🔒</span>'.repeat(Math.max(0, 3 - set.stones.length));
  const cols = [2, 4, 6].map(n => `<div class="fg-col ${count >= n ? 'act' : ''}"><h4>[${n} Pieces]</h4>${Object.entries(Forge.scaled(Forge.setBonus[n], set.scale)).map(([k, v]) => fgStatLine(k, v)).join('')}</div>`).join('');
  const btn = forged ? `<button class="fg-go done" disabled>${denPlain}Forged</button>` : why ? `<button class="fg-go off" disabled>${denPlain}Unforgeable</button>` : `<button class="fg-go" onclick="fgForge()">${denPlain}Forge</button>`;
  const rail = r.slots.map(x => { const w = Forge.setWhy(S, x.id, i); return fgTile(S, x.id, Forge.level(S, x.id) > i ? ['Forged', 'ok'] : w ? [w, w.startsWith('Not enough') ? 'warn' : 'bad'] : ['Can forge ' + set.name + ' Set', 'ok'], `fgSlot='${x.id}';forgeSetView()`); }).join('');
  fgFrame('Set', set.name + ' Set', `<div class="fg-orbit"><span class="fg-big" style="--q:${piece ? r.gearRanks[r.gearRank(piece)].color : '#9ab'}">${t ? gearArt(t) + '<b>T' + t.tier + '</b>' : '<em>Empty</em>'}</span></div>
   <div class="fg-stones">${stones}</div>
   <h3 class="fg-name">[${set.name}] Emperor Set <small>(${count}/6)</small></h3>
   <div class="fg-cols">${cols}</div>
   ${btn}${why && !forged ? `<p class="fg-why">${why}</p>` : ''}
   <p class="fg-note">◆ Changing or transferring gear keeps the set: it belongs to the slot, and no Set Stone is lost.</p>
   <div class="fg-rail">${rail}</div>`);
}
function fgForge() { if (Forge.forge(S, fgSlot, fgSet)) { save(); toast(Forge.sets[fgSet].name + ' Set forged on ' + (WonderGear.slots.find(x => x.id === fgSlot)?.name || fgSlot) + '.'); } forgeSetView(); }
function forgeAwakenView() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const r = WonderGear, piece = Forge.piece(S, fgSlot), t = piece ? r.catalog[piece.template] : null, lv = Forge.awakened(S, fgSlot), why = Forge.awakenWhy(S, fgSlot);
  const now = Forge.awakenStats(S, fgSlot, lv), next = Forge.awakenStats(S, fgSlot, lv + 1);
  const rows = Object.keys(next).map(k => `<p><span>${r.labels[k] || k}</span><b>${fmt(now[k] || 0)}</b><i>➜</i><b class="up">${fmt(next[k])}</b></p>`).join('');
  const rail = r.slots.map(x => { const w = Forge.awakenWhy(S, x.id), a = Forge.awakened(S, x.id), cap = w.endsWith('to awaken') || w.startsWith('Wear'); return fgTile(S, x.id, cap ? [w, 'bad'] : ['Awakening +' + a, 'ok'], `fgSlot='${x.id}';forgeAwakenView()`); }).join('');
  fgFrame('Awaken', 'Awaken', `<div class="fg-orbit aw"><span class="fg-big" style="--q:${piece ? r.gearRanks[r.gearRank(piece)].color : '#9ab'}">${t ? gearArt(t) + '<b>T' + t.tier + '</b>' : '<em>Empty</em>'}</span><span class="fg-awlv">Awakening <b>+${lv}</b></span></div>
   <div class="fg-stones">${fgStone('awakenCore', r.bagCount(S, 'awakenCore'), Forge.awakenCost(lv))}</div>
   <h3 class="fg-name">Awaken Stat</h3><div class="fg-aw">${rows}</div>
   <p class="fg-note">◆ Changing gear keeps the Awaken level: it belongs to the slot. Cap: tier + 2 (at most ${Forge.awakenMax}).</p>
   ${why ? `<button class="fg-go off" disabled>${denPlain}${why === 'Not enough Awakening Crystals' ? 'Awaken' : why}</button><p class="fg-why">${why}</p>` : `<button class="fg-go" onclick="fgAwaken()">${denPlain}Awaken</button>`}
   <div class="fg-rail">${rail}</div>`);
}
function fgAwaken() { if (Forge.awaken(S, fgSlot)) { save(); toast('Awakening +' + Forge.awakened(S, fgSlot) + '.'); } forgeAwakenView(); }
