// Star Talents (user sent a 232-photo handout of the reference's Talent screen: "make the same in the Skill tab; it is
// universal for every class"). Four constellations with the reference's structure (node counts, max levels, links,
// prerequisites, branch-point gates) and our own names, art and effects. Rules in `Talents` (pure, tested by
// scripts/test-talents.mjs); the screen is below the TALENTS_UI marker. All numbers are placeholders.
const Talents = {
  fromLevel: 400,         // 1 talent point per hero level above this (as in the reference; user 2026-11-25)
  resetPrice: 100,        // prisms for a full reset (free while nothing is spent)
  branches: [
    { id: 'off', name: 'Offensive', sky: 'Falcon', art: 'talent-sky-off' },
    { id: 'def', name: 'Defensive', sky: 'Turtle', art: 'talent-sky-def' },
    { id: 'uni', name: 'Universal', sky: 'World Tree', art: 'talent-sky-uni' },
    { id: 'mas', name: 'Mastery', sky: 'Dragon', art: 'talent-sky-mas' }
  ],
  // key, branch, name, max, x, y (% of the constellation), links, pre [[key, level]], gate [branch, points spent there],
  // fx = [[stat, per level]] (stats of WonderGear.stats bonuses, or proc:* handled in battle), text = effect line.
  // The order is the order of the icon atlas talent-icons (7 x 6).
  list: [
    ['dawn', 'off', 'Dawnfeather', 10, 16, 16, ['sylph'], [], null, [['attack', 8], ['attackPercent', .2]], 'ATK +{attack}, ATK +{attackPercent}%'],
    ['sylph', 'off', 'Sylph Bond', 10, 42, 26, ['dawn', 'plume'], [['dawn', 6]], ['off', 11], [['penetration', 4], ['critDamage', .5]], 'ARP +{penetration}, Crit DMG +{critDamage}%'],
    ['talon', 'off', 'Talon Strike', 10, 79, 14, ['dread'], [], null, [['proc:stun', 1.5]], 'Each hit has a {proc:stun}% chance to stun the foe for 1 s'],
    ['dread', 'off', "Hunter's Dread", 10, 68, 34, ['talon', 'volley'], [['talon', 6]], ['off', 30], [['proc:stunned', 2]], '+{proc:stunned}% damage to stunned foes'],
    ['frost', 'off', 'Frost Echo', 5, 52, 45, ['edge'], [], null, [['elementalAttack', 12]], 'Celestial Arrow gains {elementalAttack} Elemental ATK'],
    ['plume', 'off', 'Radiant Plumage', 10, 24, 54, ['sylph', 'giant'], [['sylph', 6]], ['off', 30], [['attackPercent', .3], ['penetration', 6]], 'ATK +{attackPercent}%, ARP +{penetration}'],
    ['edge', 'off', 'Starforged Edge', 30, 50, 71, ['frost'], [], ['off', 15], [['penetration', 5], ['attack', 4]], 'ARP +{penetration}, ATK +{attack}'],
    ['volley', 'off', 'Skyward Volley', 1, 81, 63, ['dread'], [['dread', 5]], ['off', 40], [['elementalAttack', 60], ['proc:stun', 3]], 'Celestial Arrow +{elementalAttack} Elemental ATK, stun chance +{proc:stun}%'],
    ['giant', 'off', 'Giantbane', 1, 31, 80, ['plume'], [['plume', 5]], ['off', 40], [['proc:boss', 10]], '+{proc:boss}% damage to bosses'],
    ['swift', 'def', 'Swiftstep', 10, 45, 22, ['mist'], [], null, [['dodge', .4]], 'Dodge +{dodge}%'],
    ['shell', 'def', 'Shellguard', 15, 80, 16, ['stone'], [], null, [['health', 60], ['defense', 2]], 'HP +{health}, DEF +{defense}'],
    ['mist', 'def', 'Mistveil', 10, 20, 41, ['swift', 'tide'], [['swift', 6]], ['def', 11], [['dodge', .3], ['block', .2]], 'Dodge +{dodge}%, Block +{block}%'],
    ['wingward', 'def', 'Wingward', 30, 49, 49, [], [], ['def', 15], [['healthPercent', .15], ['defensePercent', .15]], 'HP +{healthPercent}%, DEF +{defensePercent}%'],
    ['stone', 'def', 'Stonehide', 10, 71, 42, ['shell', 'spirit'], [['shell', 6]], ['def', 11], [['defensePercent', .3]], 'DEF +{defensePercent}%'],
    ['spirit', 'def', 'Steadfast Spirit', 5, 82, 60, ['stone', 'resolve'], [['stone', 6]], ['def', 30], [['critResistance', 1]], 'Crit RES +{critResistance}%'],
    ['tide', 'def', 'Tidal Renewal', 10, 18, 67, ['mist', 'coral'], [['mist', 6]], ['def', 30], [['proc:regen', .5]], 'Restores {proc:regen}% of max HP every 10 s in battle'],
    ['coral', 'def', 'Coral Bulwark', 1, 45, 77, ['tide'], [['tide', 5]], ['def', 40], [['damageReduction', 5]], 'DMG reduction +{damageReduction}%'],
    ['resolve', 'def', 'Ancient Resolve', 1, 66, 84, ['spirit'], [['spirit', 5]], ['def', 40], [['block', 5], ['damageReduction', 2]], 'Block +{block}%, DMG reduction +{damageReduction}%'],
    ['quake', 'uni', 'Rootquake Roar', 30, 18, 14, ['heartwood'], [], ['off', 6], [['attack', 5], ['penetration', 2], ['accuracy', .2]], 'ATK +{attack}, ARP +{penetration}, Accuracy +{accuracy}'],
    ['heartwood', 'uni', 'Heartwood Bow', 25, 34, 34, ['quake', 'thorn'], [['quake', 9]], ['off', 11], [['attackPercent', .3], ['attack', 6]], 'ATK +{attackPercent}%, ATK +{attack}'],
    ['thorn', 'uni', 'Thornlash', 10, 20, 52, ['heartwood', 'sunsap'], [['heartwood', 9]], ['off', 18], [['proc:lash', 2]], 'Each hit has a {proc:lash}% chance to lash the foe for 60% more'],
    ['sunsap', 'uni', 'Sunsap Blade', 25, 14, 70, ['thorn', 'grove'], [['thorn', 10]], ['off', 30], [['elementalAttack', 10]], 'Elemental ATK +{elementalAttack}'],
    ['grove', 'uni', 'Grove Master', 10, 38, 82, ['sunsap'], [['sunsap', 10]], ['off', 40], [['damageBonus', .6]], 'DMG bonus +{damageBonus}%'],
    ['leaves', 'uni', 'Breath of Leaves', 30, 81, 14, ['elder'], [], ['def', 6], [['health', 60], ['defense', 2], ['dodge', .1]], 'HP +{health}, DEF +{defense}, Dodge +{dodge}%'],
    ['elder', 'uni', 'Elder Bark', 25, 64, 34, ['leaves', 'rider', 'ever'], [['leaves', 9]], ['def', 11], [['healthPercent', .3], ['health', 80]], 'HP +{healthPercent}%, HP +{health}'],
    ['rider', 'uni', 'Mooncrown Rider', 30, 50, 53, ['elder'], [['elder', 9]], ['def', 18], [['defense', 4], ['speed', .2]], 'DEF +{defense}, Speed +{speed}'],
    ['ever', 'uni', 'Evergreen Ward', 10, 80, 52, ['elder', 'moonsap'], [['elder', 9]], ['def', 18], [['defensePercent', .3]], 'DEF +{defensePercent}%'],
    ['moonsap', 'uni', 'Moonsap Mail', 25, 85, 70, ['ever', 'bloom'], [['ever', 10]], ['def', 30], [['elementalDefense', 10]], 'Elemental DEF +{elementalDefense}'],
    ['bloom', 'uni', 'Undying Bloom', 10, 61, 82, ['moonsap'], [['moonsap', 10]], ['def', 40], [['damageReduction', .5]], 'DMG reduction +{damageReduction}%'],
    ['ember', 'mas', 'Dragonfire Affinity', 10, 71, 5, ['relic'], [], null, [['elementalAttack', 8]], 'Elemental ATK +{elementalAttack}'],
    ['relic', 'mas', 'Wyrm Relic', 10, 38, 15, ['ember', 'scale'], [['ember', 4]], null, [['attack', 10], ['critDamage', 1]], 'ATK +{attack}, Crit DMG +{critDamage}%'],
    ['scale', 'mas', 'Fearless Scale', 10, 59, 32, ['relic', 'roar'], [['relic', 6]], null, [['crit', .3]], 'Crit +{crit}%'],
    ['roar', 'mas', 'Endless Roar', 10, 84, 30, ['scale', 'wrath'], [['scale', 8]], null, [['accuracy', .5]], 'Accuracy +{accuracy}'],
    ['wrath', 'mas', 'Blazing Wrath', 10, 75, 51, ['roar'], [['roar', 10]], null, [['damageBonus', .5]], 'DMG bonus +{damageBonus}%'],
    ['heartgem', 'mas', 'Dragon Heartgem', 30, 30, 32, ['sovereign'], [], null, [['defense', 4], ['defensePercent', .1]], 'DEF +{defense}, DEF +{defensePercent}%'],
    ['sovereign', 'mas', 'Sky Sovereign', 30, 50, 48, ['heartgem', 'forged'], [['heartgem', 12]], null, [['attackPercent', .15], ['healthPercent', .15], ['defensePercent', .15]], 'ATK +{attackPercent}%, HP +{healthPercent}%, DEF +{defensePercent}%'],
    ['forged', 'mas', 'Wyrmforged Set', 30, 62, 66, ['sovereign'], [['sovereign', 16]], null, [['health', 100]], 'HP +{health}'],
    ['soul', 'mas', 'Emberheart Soul', 20, 14, 70, ['plate'], [], null, [['elementalDefense', 8]], 'Elemental DEF +{elementalDefense}'],
    ['plate', 'mas', 'Wyrmscale Plate', 20, 27, 55, ['soul', 'totem'], [['soul', 4]], null, [['health', 80], ['healthPercent', .1]], 'HP +{health}, HP +{healthPercent}%'],
    ['totem', 'mas', 'Ancestral Totem', 10, 41, 74, ['plate', 'aegis'], [['plate', 6]], null, [['critResistance', .5], ['health', 40]], 'Crit RES +{critResistance}%, HP +{health}'],
    ['aegis', 'mas', 'Flame Aegis', 10, 54, 90, ['totem', 'cinder'], [['totem', 8]], null, [['block', .5], ['dodge', .2]], 'Block +{block}%, Dodge +{dodge}%'],
    ['cinder', 'mas', 'Cinder Barrier', 10, 77, 80, ['aegis'], [['aegis', 10]], null, [['damageReduction', .4]], 'DMG reduction +{damageReduction}%']
  ].map(([key, branch, name, max, x, y, links, pre, gate, fx, text], n) => ({ key, branch, name, max, x, y, links, pre, gate, fx, text, n })),
  get byKey() { const m = {}; for (const t of this.list) m[t.key] = t; Object.defineProperty(this, 'byKey', { value: m }); return m; },
  of(save) { const v = save && save.heroTalents; return v && typeof v === 'object' ? v : {}; },
  level(save, key) { const n = this.of(save)[key]; return Number.isSafeInteger(n) && n > 0 ? n : 0; },
  heroLevel(save) { return typeof WonderProgress !== 'undefined' ? WonderProgress.level(save.xp || 0) : (save.level || 1); },
  earned(save) { return Math.max(0, this.heroLevel(save) - this.fromLevel); },
  spent(save, branch) { return this.list.reduce((a, t) => a + (!branch || t.branch === branch ? this.level(save, t.key) : 0), 0); },
  left(save) { return Math.max(0, this.earned(save) - this.spent(save)); },
  maxPoints(branch) { return this.list.reduce((a, t) => a + (!branch || t.branch === branch ? t.max : 0), 0); },
  // What stands between a talent and its next level: [] = can be learned now.
  blocks(save, key) {
    const t = this.byKey[key], out = []; if (!t) return ['unknown'];
    if (this.level(save, key) >= t.max) out.push('max');
    for (const [k, lv] of t.pre) if (this.level(save, k) < lv) out.push('pre');
    if (t.gate && this.spent(save, t.gate[0]) < t.gate[1]) out.push('gate');
    if (this.left(save) < 1) out.push('points');
    return out;
  },
  open(save, key) { const b = this.blocks(save, key); return !b.includes('pre') && !b.includes('gate'); },
  // Spends up to `count` points on one talent; returns the levels added.
  learn(save, key, count = 1) {
    let added = 0;
    while (added < count && !this.blocks(save, key).length) { save.heroTalents = { ...this.of(save), [key]: this.level(save, key) + 1 }; added++; }
    return added;
  },
  reset(save) {
    if (!this.spent(save)) return { ok: false, why: 'Nothing to reset' };
    if ((save.scales || 0) < this.resetPrice) return { ok: false, why: 'Not enough prisms' };
    save.scales -= this.resetPrice; const back = this.spent(save); delete save.heroTalents; return { ok: true, back };
  },
  // Total of every stat at a level; `value(t, stat, lv)`.
  value(t, stat, lv) { const f = t.fx.find(x => x[0] === stat); return f ? Math.round(f[1] * lv * 100) / 100 : 0; },
  describe(t, lv) { return t.text.replace(/\{([^}]+)\}/g, (_, s) => { const v = this.value(t, s, lv); return Number.isInteger(v) ? String(v) : v.toFixed(1).replace(/\.0$/, ''); }); },
  bonus(save) { const b = {}; for (const t of this.list) { const lv = this.level(save, t.key); if (lv) for (const [s, v] of t.fx) if (!s.startsWith('proc:')) b[s] = (b[s] || 0) + v * lv; } return b; },
  procs(save) { const p = {}; for (const t of this.list) { const lv = this.level(save, t.key); if (lv) for (const [s, v] of t.fx) if (s.startsWith('proc:')) p[s.slice(5)] = (p[s.slice(5)] || 0) + v * lv; } return p; },
  learnedCount(save, branch) { return this.list.filter(t => t.branch === branch && this.level(save, t.key) > 0).length; },
  valid(v) { return v === undefined || !!v && typeof v === 'object' && !Array.isArray(v) && Object.entries(v).every(([k, n]) => Object.hasOwn(this.byKey, k) && Number.isSafeInteger(n) && n >= 0 && n <= this.byKey[k].max); }
};
if (typeof module !== 'undefined') module.exports = { Talents };

// Battle hooks (dungeons and the EXP dungeon): stun, extra lash, boss and stunned-foe damage on Reina's hits; regen.
function heroTalentHit(g, damage) {
  if (typeof S === 'undefined' || !g || g.ended || !g.enemy || g.enemy.hp <= 0) return;
  const p = g.heroProcs ??= Talents.procs(S); let extra = 0;
  if (p.boss && g.enemy.boss) extra += damage * p.boss / 100;
  if (p.stunned && (g.stunUntil || 0) > g.clock) extra += damage * p.stunned / 100;
  if (p.lash && Math.random() < p.lash / 100) { extra += damage * .6; g.particles?.push({ text: 'THORNLASH', x: (g.crawl?.enemy.x || 300) - 40, y: (g.crawl?.enemy.y || 200) - 160, color: '#9dff8a', life: .9 }); }
  if (extra > 0 && typeof battleDamage === 'function') battleDamage(Math.round(extra));
  if (p.stun && Math.random() < p.stun / 100) { g.enemyCD = Math.max(0, g.enemyCD || 0) + 1; g.stunUntil = g.clock + 1; g.particles?.push({ text: 'STUNNED', x: (g.crawl?.enemy.x || 300) - 30, y: (g.crawl?.enemy.y || 200) - 140, color: '#fff3a0', life: 1 }); }
}
function heroTalentTick(g, dt) {
  if (typeof S === 'undefined' || !g || g.ended || g.hp <= 0) return;
  const p = g.heroProcs ??= Talents.procs(S); if (!p.regen) return;
  g.regenCD = (g.regenCD ?? 10) - dt;
  if (g.regenCD <= 0) { g.regenCD = 10; if (g.hp < g.maxhp) { const heal = Math.round(g.maxhp * p.regen / 100); g.hp = Math.min(g.maxhp, g.hp + heal); g.particles?.push({ text: '+' + heal, x: (g.crawl?.hero.x || 200) - 20, y: (g.crawl?.hero.y || 300) - 130, color: '#7dffc0', life: 1 }); } }
}

// TALENTS_UI
let skillPage = 'Talents', starBranch = null, starPick = null;
const STAR_ART = ['talent-sky-off', 'talent-sky-def', 'talent-sky-uni', 'talent-sky-mas', 'talent-icons'];
function starIcon(t, cls = '') { return `<i class="tl-ico ${cls}" style="--ix:${t.n % 7};--iy:${Math.floor(t.n / 7)}"></i>`; }
function starVars() { return `--tl-icons:url('${artPath('talent-icons')}');` + Talents.branches.map(b => `--tl-${b.id}:url('${artPath(b.art)}')`).join(';'); }
function citySkill() {
  STAR_ART.forEach(id => { const i = new Image(); i.src = artPath(id); });
  const left = Talents.left(S), br = Talents.branches.find(b => b.id === starBranch);
  const head = `<div class="tl-top"><button class="tl-back" data-back onclick="${br && skillPage === 'Talents' ? 'starGo(null)' : "go('home')"}" aria-label="Back">‹</button>
    <div class="tl-ribbon"><i></i><b>${skillPage === 'Talents' ? 'Talents' : 'Skill'}</b></div>
    <div class="tl-wallet"><span>${uiIcon('gold')}${fmt(S.gold)}</span><span>${uiIcon('crystals')}${fmt(S.scales || 0)}</span></div></div>`;
  let body = '';
  if (skillPage === 'Skill') body = skillList();
  else {
    body = `<div class="tl-bar"><p>Talent Points: <b class="${left ? 'on' : ''}">${left}</b></p><button class="tl-reset" onclick="starResetAsk()">${denPlain}<i>↻</i><span>Reset Talent</span></button></div>`;
    body += br ? starTree(br) : starOverview();
  }
  const tabs = `<div class="tl-nav">${skillPage === 'Talents' && br ? `<div class="tl-branches">${Talents.branches.map(b => `<button class="${b.id === starBranch ? 'on' : ''}" onclick="starGo('${b.id}')">${denPlain}<i class="tl-bico" style="background-image:var(--tl-${b.id})"></i><span>${b.name}</span>${starDot(b.id) ? '<em></em>' : ''}</button>`).join('')}</div>` : ''}
    <div class="tl-pages"><button class="${skillPage === 'Skill' ? 'on' : ''}" onclick="skillGo('Skill')">${denPlain}<i>✦</i><span>Skill</span></button><button class="${skillPage === 'Talents' ? 'on' : ''}" onclick="skillGo('Talents')">${denPlain}<i>✧</i><span>Talents</span>${Talents.left(S) ? '<em></em>' : ''}</button></div></div>`;
  $('#main').innerHTML = `<section class="tl-room ${br && skillPage === 'Talents' ? 'tree' : ''}" style="${starVars()}${br && skillPage === 'Talents' ? `;--tl-sky:var(--tl-${br.id})` : ''}">${head}${body}${tabs}</section>`;
}
function starDot(branch) { return Talents.left(S) > 0 && Talents.list.some(t => t.branch === branch && !Talents.blocks(S, t.key).length); }
function skillGo(p) { skillPage = p; starPick = null; citySkill(); }
function starGo(b) { starBranch = b; starPick = null; citySkill(); }
function starOverview() {
  const pos = { off: 'top', uni: 'left', def: 'right', mas: 'bottom' };
  return `<div class="tl-over"><p class="tl-rule">Gain 1 talent point per level after Lv.${Talents.fromLevel}. Your level: ${Talents.heroLevel(S)}.</p>
    ${Talents.branches.map(b => { const n = Talents.list.filter(t => t.branch === b.id).length; return `<button class="tl-sky ${pos[b.id]}" onclick="starGo('${b.id}')">${denPlain}<i class="tl-skyart" style="background-image:var(--tl-${b.id})"></i><b>${b.name}${starDot(b.id) ? '<em></em>' : ''}</b><small>★ ${Talents.learnedCount(S, b.id)}/${n} · ${Talents.spent(S, b.id)} pts</small></button>`; }).join('')}</div>`;
}
function starTree(br) {
  const nodes = Talents.list.filter(t => t.branch === br.id), seen = new Set();
  const lines = nodes.flatMap(t => t.links.filter(k => Talents.byKey[k]?.branch === br.id).map(k => { const id = [t.key, k].sort().join('-'); if (seen.has(id)) return ''; seen.add(id); const u = Talents.byKey[k], lit = Talents.level(S, t.key) && Talents.level(S, k); return `<line x1="${t.x}" y1="${t.y}" x2="${u.x}" y2="${u.y}" class="${lit ? 'lit' : ''}"/>`; })).join('');
  const node = t => { const lv = Talents.level(S, t.key), st = lv ? 'got' : Talents.open(S, t.key) ? 'can' : 'lock', ready = !Talents.blocks(S, t.key).length;
    return `<button class="tl-node ${st} ${ready ? 'ready' : ''} ${starPick === t.key ? 'pick' : ''} ${lv >= t.max ? 'full' : ''}" style="left:${t.x}%;top:${t.y}%" onclick="starTap('${t.key}')" aria-label="${t.name}">${denPlain}${starIcon(t)}<small>${lv}/${t.max}</small></button>`; };
  return `<div class="tl-tree"><div class="tl-plot"><svg viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>${nodes.map(node).join('')}</div>${starPick ? starCard(Talents.byKey[starPick]) : ''}</div>`;
}
function starTap(key) { starPick = starPick === key ? null : key; citySkill(); }
function starCard(t) {
  if (!t) return '';
  const lv = Talents.level(S, t.key), full = lv >= t.max, b = Talents.blocks(S, t.key), left = Talents.left(S);
  const req = [...t.pre.map(([k, n]) => { const have = Talents.level(S, k); return `<p class="${have >= n ? 'ok' : 'no'}">Prerequisite Talent: ${Talents.byKey[k].name} ${have}/${n}</p>`; }),
    ...(t.gate ? [(() => { const have = Talents.spent(S, t.gate[0]); return `<p class="${have >= t.gate[1] ? 'ok' : 'no'}">${t.gate[0] === 'off' ? 'Offensive' : 'Defensive'} points invested ${have}/${t.gate[1]}</p>`; })()] : [])].join('');
  const fx = lv ? `<h4>Current Effect</h4><p>${Talents.describe(t, lv)}</p>${full ? '<h4>Level maxed already</h4>' : `<h4>Next Level</h4><p>${Talents.describe(t, lv + 1)}</p>`}` : `<h4>Level 1 Effect</h4><p>${Talents.describe(t, 1)}</p><h4>Full Level Effect</h4><p>${Talents.describe(t, t.max)}</p>`;
  const why = b.includes('pre') ? 'Raise the prerequisite talent first' : b.includes('gate') ? 'Invest more points in this constellation side' : b.includes('points') ? 'No talent points left' : '';
  return `<div class="tl-card ${t.y > 55 ? 'up' : 'down'}"><button class="tl-x" onclick="starTap('${t.key}')" aria-label="Close">${denPlain}×</button>
    <div class="tl-chead">${starIcon(t, 'big')}<div><b>${t.name}</b><small>Lv.${lv}/${t.max}</small></div></div>
    ${req ? `<div class="tl-req">${req}</div>` : ''}<div class="tl-fx">${fx}</div>
    <div class="tl-act">${full ? '<span class="tl-max">Max</span>' : `<button class="tl-dist" ${b.length ? 'disabled' : ''} onclick="starLearn('${t.key}',1)">${denPlain}Distribute</button>${t.max - lv >= 5 ? `<button class="tl-dist five" ${b.length ? 'disabled' : ''} onclick="starLearn('${t.key}',5)">${denPlain}+5</button>` : ''}`}
    <small>${why || 'Talent Points: ' + left}</small></div></div>`;
}
function starLearn(key, n) {
  const got = Talents.learn(S, key, n); if (!got) { toast('Cannot learn this talent yet'); return; }
  if (game) game.heroProcs = null; save(); citySkill();
  const el = document.querySelector('.tl-node.pick'); if (el) { el.classList.add('burst'); }
}
function starResetAsk() {
  const spent = Talents.spent(S);
  popup(`<div class="tl-pop"><h2>Reset Talent</h2><p>${spent ? `All <b>${spent}</b> talent points come back. Cost: <b>${uiIcon('crystals')}${Talents.resetPrice} prisms</b> (you have ${fmt(S.scales || 0)}).` : 'No talent points are invested yet.'}</p>
    <div class="tl-pop-act"><button class="tl-pbtn violet" onclick="$('#modal').close()">${denPlain}Cancel</button>${spent ? `<button class="tl-pbtn" onclick="starReset()">${denPlain}Reset</button>` : ''}</div></div>`);
}
function starReset() { const r = Talents.reset(S); $('#modal').close(); if (!r.ok) { toast(r.why); return; } if (game) game.heroProcs = null; save(); toast(r.back + ' talent points returned'); citySkill(); }
// Skill page: Reina's own combat skills (the same for every look and weapon) and what talents add to them.
function skillList() {
  const s = stats(), p = Talents.procs(S);
  const rows = [
    ['Leafwind Volley', 'Basic attack', `Reina looses arrows at the foe in range. ATK ${fmt(s.attack)}, Crit ${s.crit.toFixed?.(1) ?? s.crit}%, Speed ${Math.round(s.speed)}.`, 'gpt'],
    ['Celestial Arrow', 'Skill · cooldown', `A star-charged shot that always hits, with Elemental ATK ${fmt(s.elementalAttack || 0)} added.`, 'star'],
    ['Windstep', 'Evade', 'Tap Reina to dash away from a power strike.', 'wind']
  ];
  const extra = [p.stun && `Talon Strike: ${p.stun}% stun chance per hit`, p.lash && `Thornlash: ${p.lash}% chance of a lash for +60%`, p.boss && `Giantbane: +${p.boss}% damage to bosses`, p.stunned && `Hunter's Dread: +${p.stunned}% to stunned foes`, p.regen && `Tidal Renewal: ${p.regen}% HP every 10 s`].filter(Boolean);
  return `<div class="tl-skills">${rows.map(([n, k, d, i]) => `<div class="tl-skill"><i class="tl-sico ${i}"></i><div><b>${n}</b><small>${k}</small><p>${d}</p></div></div>`).join('')}
    <div class="tl-skill wide"><div><b>Talent effects in battle</b><small>Universal for every class</small><p>${extra.length ? extra.join('<br>') : 'Learn talents in the Talents tab: they work for every outfit and weapon.'}</p></div></div></div>`;
}
