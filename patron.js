'use strict';
// VIP and SVIP (user photos of the reference's VIP room, 2026-11-27: "reward those who pay, not only with extras").
// - VIP 1-10 is free: it rises with Challenge stages cleared (S.exploreCleared, `vipSteps`, 144 = max). Each level is a
//   title with lasting stats (`vipTitles`, through `Patron.bonus` in stats()) and a one-time gift (`vipGift`).
// - SVIP 1-10 is for paying players: every EUR 1 of real top-up gives `perEur` 100 points (`addEur`, called from
//   `Topup.grant`; real payment is NOT connected). Each level raises privileges that are wired into the game
//   (`perks`, read with `perk(s,key)`): EXP bonus, Devour EXP bonus, Daily Blessings x N, Oak Chests per guardian win,
//   boss energy cap, Resource Realm free entries and purchases, extra Boss Sweeps. A per-level "Exclusive Benefits"
//   pack for prisms at a deep discount (once), a daily SVIP gift, the SVIP Shop (weekly limits), an SVIP badge on the
//   home plate (can be hidden). Optional save field S.patron {xp, vip[], packs[], day, hide, shop{week,b{}}}.
// All numbers are placeholders.
const Patron = {
  perEur: 100,
  svipSteps: [300, 1000, 2500, 5000, 10000, 20000, 45000, 90820, 150000, 250000],
  svipNames: ['Rising Petal', 'Rising Petal', 'Rising Petal', 'Starlit Patron', 'Starlit Patron', 'Starlit Patron', 'Starlit Patron', 'Sunwing Patron', 'Sunwing Patron', 'Sunwing Patron'],
  // value at SVIP 0..10
  perks: {
    exp: { text: n => `EXP Bonus +${n}%`, v: [0, 5, 8, 10, 15, 20, 25, 30, 35, 40, 50] },
    devour: { text: n => `Devour EXP Bonus +${n}%`, v: [0, 5, 10, 15, 15, 20, 20, 25, 30, 30, 35] },
    checkin: { text: n => `Daily Blessings ${n}× rewards`, v: [1, 1, 2, 2, 2, 3, 3, 4, 5, 5, 5] },
    chests: { text: n => `Oak Chests per guardian win: ${n}`, v: [1, 1, 2, 3, 3, 3, 4, 4, 5, 5, 6] },
    energy: { text: n => `Boss energy cap +${n}%`, v: [0, 2, 4, 6, 6, 8, 8, 10, 12, 12, 15] },
    realmFree: { text: n => `Resource Realm free entries +${n}`, v: [0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2] },
    realmBuy: { text: n => `Resource Realm purchase attempts +${n}`, v: [0, 0, 0, 0, 1, 1, 1, 1, 1, 2, 2] },
    sweep: { text: n => `Boss Sweeps a day +${n}`, v: [0, 0, 0, 1, 1, 1, 2, 2, 2, 3, 3] }
  },
  packs: [
    { was: 470, price: 68, items: { setAurora: 4, awakenCore: 6, chest2: 2 } },
    { was: 860, price: 108, items: { setAurora: 6, awakenCore: 10, chest3: 1 } },
    { was: 1280, price: 168, items: { setStar: 3, awakenCore: 12, gearbox: 1 } },
    { was: 2160, price: 268, items: { setStar: 5, awakenCore: 16, gearbox: 2 } },
    { was: 3280, price: 388, items: { setMoon: 2, awakenCore: 20, chest3: 3 } },
    { was: 4880, price: 528, items: { setMoon: 3, setStar: 5, gearbox: 3 } },
    { was: 6480, price: 688, items: { setMoon: 4, setSun: 1, awakenCore: 30 } },
    { was: 8888, price: 888, items: { setSun: 2, setMoon: 5, gearbox: 4 } },
    { was: 12888, price: 1288, items: { setSun: 3, awakenCore: 50, chest3: 6 } },
    { was: 18888, price: 1888, items: { setSun: 5, awakenCore: 80, gearbox: 8 } }],
  daily(lv) { return { pearls: 500 * lv, items: { awakenCore: lv, ...(lv >= 4 ? { setAurora: 2 } : {}), ...(lv >= 8 ? { setStar: 1 } : {}) } }; },
  shop: [
    { id: 'ps1', need: 1, item: 'awakenCore', n: 5, price: 40, limit: 5 },
    { id: 'ps2', need: 2, item: 'setAurora', n: 4, price: 60, limit: 5 },
    { id: 'ps3', need: 3, item: 'chest3', n: 1, price: 80, limit: 3 },
    { id: 'ps4', need: 4, item: 'gearbox', n: 1, price: 120, limit: 3 },
    { id: 'ps5', need: 5, item: 'setStar', n: 2, price: 150, limit: 3 },
    { id: 'ps6', need: 7, item: 'setMoon', n: 1, price: 220, limit: 2 },
    { id: 'ps7', need: 9, item: 'setSun', n: 1, price: 380, limit: 1 },
    { id: 'ps8', need: 1, item: 'stam', n: 3, price: 30, limit: 7 }],
  vipSteps: [3, 9, 18, 30, 45, 63, 84, 108, 126, 144],
  vipTitles: ['Wandering Spark', 'Meadow Scout', 'Grove Guardian', 'Cloud Rambler', 'Moonlit Ranger', 'Starbound Seeker', 'Skyward Herald', 'Dawn Warden', 'Crown of Breezes', 'Lord of Wonders'],
  vipStats(lv) { return lv ? { defense: 8 * lv, attackPercent: Math.round(lv * .2 * 100) / 100 } : {}; },
  vipGift(lv) { return { gold: 2000 * lv, items: { awakenCore: lv, chest2: 1 + Math.floor(lv / 3) } }; },
  week(now = Date.now()) { return Math.floor((Math.floor(now / 864e5) + 3) / 7); },
  raw(s) { const p = s.patron || (s.patron = { xp: 0, vip: [], packs: [] }); p.vip ??= []; p.packs ??= []; return p; },
  xp(s) { return s.patron?.xp || 0; },
  level(s) { const x = Patron.xp(s); return Patron.svipSteps.filter(n => x >= n).length; },
  next(s) { return Patron.svipSteps[Patron.level(s)] || null; },
  perk(s, key) { const p = Patron.perks[key]; return p ? p.v[Patron.level(s)] : 0; },
  perkList(lv) { return Object.entries(Patron.perks).filter(([, p]) => p.v[lv] !== p.v[0]).map(([k, p]) => ({ text: p.text(p.v[lv]), up: lv > 0 && p.v[lv] !== p.v[lv - 1] })); },
  addEur(s, eur) { const p = Patron.raw(s); p.xp = Math.min(1e7, p.xp + Math.round(eur * Patron.perEur)); },
  vipLevel(s) { const n = s.exploreCleared || 0; return Patron.vipSteps.filter(x => n >= x).length; },
  vipClaim(s, lv) {
    const p = Patron.raw(s); if (lv < 1 || lv > Patron.vipLevel(s) || p.vip.includes(lv)) return null;
    p.vip.push(lv); const g = Patron.vipGift(lv); s.gold = (s.gold || 0) + g.gold; for (const [i, n] of Object.entries(g.items)) globalThis.WonderGear?.bagAdd?.(s, i, n); return g;
  },
  buyPack(s, lv) {
    const p = Patron.raw(s), pk = Patron.packs[lv - 1]; if (!pk || lv > Patron.level(s) || p.packs.includes(lv) || (s.scales || 0) < pk.price) return false;
    s.scales -= pk.price; p.packs.push(lv); for (const [i, n] of Object.entries(pk.items)) globalThis.WonderGear?.bagAdd?.(s, i, n); return true;
  },
  dailyReady(s, now = Date.now()) { return Patron.level(s) > 0 && s.patron?.day !== Math.floor(now / 864e5); },
  dailyClaim(s, now = Date.now()) {
    if (!Patron.dailyReady(s, now)) return null; const p = Patron.raw(s), g = Patron.daily(Patron.level(s));
    p.day = Math.floor(now / 864e5); s.pearls = (s.pearls || 0) + g.pearls; for (const [i, n] of Object.entries(g.items)) globalThis.WonderGear?.bagAdd?.(s, i, n); return g;
  },
  shopLeft(s, w, now = Date.now()) { const sh = s.patron?.shop; return w.limit - (sh?.week === Patron.week(now) ? sh.b[w.id] || 0 : 0); },
  shopBuy(s, id, now = Date.now()) {
    const w = Patron.shop.find(x => x.id === id); if (!w || Patron.level(s) < w.need || Patron.shopLeft(s, w, now) < 1 || (s.scales || 0) < w.price) return false;
    const p = Patron.raw(s), wk = Patron.week(now); if (p.shop?.week !== wk) p.shop = { week: wk, b: {} };
    s.scales -= w.price; p.shop.b[id] = (p.shop.b[id] || 0) + 1; globalThis.WonderGear?.bagAdd?.(s, w.item, w.n); return true;
  },
  due(s, now = Date.now()) { const v = Patron.vipLevel(s); return Patron.dailyReady(s, now) || Array.from({ length: v }, (_, i) => i + 1).some(l => !(s.patron?.vip || []).includes(l)); },
  bonus(s) { return Patron.vipStats(Patron.vipLevel(s)); },
  valid(p) {
    const lv = a => Array.isArray(a) && a.length <= 10 && a.every(n => Number.isInteger(n) && n >= 1 && n <= 10);
    return p === undefined || !!p && Number.isSafeInteger(p.xp) && p.xp >= 0 && p.xp <= 1e7 && lv(p.vip || []) && lv(p.packs || [])
      && (p.day === undefined || Number.isSafeInteger(p.day)) && (p.hide === undefined || typeof p.hide === 'boolean')
      && (p.shop === undefined || !!p.shop && Number.isSafeInteger(p.shop.week) && !!p.shop.b && Object.entries(p.shop.b).every(([k, n]) => Patron.shop.some(w => w.id === k) && Number.isInteger(n) && n >= 0 && n <= 99));
  }
};
globalThis.Patron = Patron;

// PATRON_UI ---------------------------------------------------------------------------------------------------------
let patronTab = 'svip', patronPage = 'vip', patronView = 0;
function patronBadge(cls = '') {
  const lv = Patron.level(S); if (!lv || S.patron?.hide) return '';
  return `<span class="pt-badge ${cls}" role="button" onclick="event.stopPropagation();go('patron')"><img src="${artPath('patron-badge')}" alt=""><b>${lv}</b><i>SVIP</i></span>`;
}
// Level strip 1-10: which level the card shows, the player's own level (crown) and what is done (tick).
function ptStrip(view, mine, label, done) { return `<div class="pt-strip">${Array.from({ length: 10 }, (_, i) => i + 1).map(i => `<button class="${i === view ? 'on' : ''} ${i <= mine ? 'got' : ''}" onclick="patronView=${i};showPatron()">${denPlain}${i === mine ? '<i>♛</i>' : done(i) ? '<i>✓</i>' : ''}<small>${label}</small><b>${i}</b></button>`).join('')}</div>`; }
// Home: the SVIP emblem sits where the Rank icon was, right of the power plate (user circled the spot). Rankings stay
// in the city drawer and the More menu. With "Hide SVIP badge" the number is not shown.
function patronHome() {
  const lv = Patron.level(S), hide = S.patron?.hide;
  return `<button class="city-rank pt-home ${lv ? '' : 'zero'}" onclick="go('patron')" aria-label="SVIP ${hide ? '' : lv}"><span class="pt-hemb"><img src="${artPath('patron-badge')}" alt="">${hide ? '' : `<b>${lv}</b>`}</span>${hide ? 'VIP' : 'SVIP' + lv}${Patron.due(S) ? '<i class="tp-dot"></i>' : ''}</button>`;
}
function ptTiles(g) { let h = ''; if (g.gold) h += `<span class="tp-tile">${uiIcon('gold')}<b>${fmt(g.gold)}</b></span>`; if (g.pearls) h += `<span class="tp-tile">${pearlIcon()}<b>${fmt(g.pearls)}</b></span>`; for (const [i, n] of Object.entries(g.items || {})) h += `<span class="tp-tile">${bagIcon(i)}<b>${n}</b></span>`; return h; }
function showPatron() {
  if (typeof bagArtVars === 'function') bagArtVars();
  const lv = Patron.level(S), vlv = Patron.vipLevel(S), p = S.patron || {};
  let body = '', head = '';
  if (patronPage === 'vip') {
    if (patronTab === 'svip') {
      const view = Math.min(10, Math.max(1, patronView || Math.max(1, lv))), pk = Patron.packs[view - 1], bought = (p.packs || []).includes(view), next = Patron.next(S);
      head = `<div class="pt-head"><div class="pt-emb"><img src="${artPath('patron-badge')}" alt=""><b>${lv}</b><i>SVIP</i></div><label class="pt-hide"><input type="checkbox" ${p.hide ? 'checked' : ''} onchange="Patron.raw(S).hide=this.checked;save();showPatron()">Hide SVIP badge</label></div>`;
      body = `<p class="pt-rule">Every €1 of top-up gives ${Patron.perEur} SVIP points</p>
       <div class="pt-bar"><i style="width:${next ? Math.min(100, Patron.xp(S) / next * 100) : 100}%"></i><span>${fmt(Patron.xp(S))}/${next ? fmt(next) : 'max'}</span><button class="pt-go" onclick="topupTab='prisms';go('topup')">${denPlain}Top-up</button></div>
       ${ptStrip(view, lv, 'SVIP', i => (p.packs || []).includes(i))}
       <div class="pt-card"><button class="pt-arr" ${view > 1 ? '' : 'disabled'} onclick="patronView=${view - 1};showPatron()">${denPlain}‹</button><button class="pt-arr r" ${view < 10 ? '' : 'disabled'} onclick="patronView=${view + 1};showPatron()">${denPlain}›</button>
        <p class="pt-lvl">SVIP ${view}${view === lv ? ' · your level' : view < lv ? ' · reached' : ''}</p><h3>${Patron.svipNames[view - 1]}</h3><ul>${Patron.perkList(view).map(t => `<li class="${t.up ? 'up' : ''}">◆ ${t.text}${t.up ? '<em>NEW</em>' : ''}</li>`).join('')}</ul>
        <p class="pt-sub">SVIP ${view} Exclusive Benefits</p><div class="tp-ctiles pt-tiles">${ptTiles(pk)}</div>
        ${bought ? `<b class="pt-stamp">Bought</b>` : `<s>${prismIcon()} ${fmt(pk.was)}</s><button class="pt-buy" ${lv >= view && (S.scales || 0) >= pk.price ? '' : 'disabled'} onclick="patronPack(${view})">${denPlain}${prismIcon()} ${fmt(pk.price)}</button>${lv < view ? `<p class="pt-why">Reach SVIP ${view}</p>` : ''}`}
        <button class="pt-daily ${Patron.dailyReady(S) ? 'on' : ''}" onclick="patronDaily()">${denPlain}<i>🎁</i><span>Daily Pack</span></button></div>`;
    } else {
      const view = Math.min(10, Math.max(1, patronView || Math.max(1, vlv))), got = (p.vip || []).includes(view), st = Patron.vipStats(view), next = Patron.vipSteps[vlv];
      head = `<div class="pt-head"><div class="pt-emb vip"><img src="${artPath('patron-badge')}" alt=""><b>${vlv}</b><i>VIP</i></div></div>`;
      body = `<p class="pt-rule">VIP rises with Challenge stages cleared${vlv >= 10 ? ' · VIP level maxed' : ''}</p>
       <div class="pt-bar"><i style="width:${next ? Math.min(100, (S.exploreCleared || 0) / next * 100) : 100}%"></i><span>${fmt(S.exploreCleared || 0)}/${next || Patron.vipSteps[9]}</span><button class="pt-go" onclick="go('cityExplore')">${denPlain}Go challenge</button></div>
       ${ptStrip(view, vlv, 'VIP', i => (p.vip || []).includes(i))}
       <div class="pt-card"><button class="pt-arr" ${view > 1 ? '' : 'disabled'} onclick="patronView=${view - 1};showPatron()">${denPlain}‹</button><button class="pt-arr r" ${view < 10 ? '' : 'disabled'} onclick="patronView=${view + 1};showPatron()">${denPlain}›</button>
        <p class="pt-lvl vip">VIP ${view}${view === vlv ? ' · your level' : view < vlv ? ' · reached' : ''}</p><h3 class="pt-title">${Patron.vipTitles[view - 1]}</h3><ul>${Object.entries(st).map(([k, n]) => `<li>◆ ${WonderGear.labels[k] || k} <b>+${n}${WonderGear.percentKeys.has(k) ? '%' : ''}</b></li>`).join('')}</ul>
        <p class="pt-sub">VIP ${view} gift</p><div class="tp-ctiles pt-tiles">${ptTiles(Patron.vipGift(view))}</div>
        ${got ? '<b class="pt-stamp">Claimed</b>' : `<button class="pt-buy" ${view <= vlv ? '' : 'disabled'} onclick="patronVip(${view})">${denPlain}${view <= vlv ? 'Claim' : 'Reach VIP ' + view}</button>`}</div>`;
    }
    body += `<div class="pt-seg">${[['vip', 'VIP'], ['svip', 'SVIP']].map(([k, n]) => `<button class="${k === patronTab ? 'on' : ''}" onclick="patronTab='${k}';patronView=0;showPatron()">${denPlain}${n}</button>`).join('')}</div>`;
  } else if (patronPage === 'must') {
    const A = WonderAdventure, rows = [
      ['Sweep Privilege', 'Boss Sweep 10 a day for prisms instead of Moon Pearls', !!S.adventure?.sweepVip, "go('dungeons');sweepVipPop()"],
      ['Blessing Pass', 'Doubles the marked days of the sign-in calendar', !!S.blessings?.pass, "go('blessings')"],
      ['Clear Battle Pass', 'The Pass column of the Challenge chapter rewards', !!S.challenge?.pass, "go('cityExplore')"],
      ['Top-up Fest', 'Rewards on top of every prism pack', false, "go('festTop')"]];
    body = `<div class="pt-must">${rows.map(([n, t, own, act]) => `<div class="tp-frow"><div class="tp-fbody"><div class="tp-wtier"><b>${n}</b><small>${t}</small></div><div class="tp-fact"><button class="tp-fclaim ${own ? 'done' : 'on'}" onclick="${act}">${denPlain}${own ? 'Active' : 'Open'}</button></div></div></div>`).join('')}</div>`;
  } else {
    body = `<p class="tp-note">SVIP Shop · new stock every Monday 00:00 UTC</p><div class="pt-shop">${Patron.shop.map(w => { const left = Patron.shopLeft(S, w), ok = lv >= w.need && left > 0 && (S.scales || 0) >= w.price, it = WonderGear.bagItemById[w.item];
      return `<div class="pt-ware ${lv >= w.need ? '' : 'lock'}"><span class="tp-tile">${bagIcon(w.item)}<b>${w.n}</b></span><small>${it?.name || w.item}</small><em>${lv >= w.need ? left + '/' + w.limit + ' this week' : 'SVIP ' + w.need}</em><button class="tp-fclaim ${ok ? 'on' : ''}" ${ok ? '' : 'disabled'} onclick="patronShop('${w.id}')">${denPlain}${prismIcon()} ${w.price}</button></div>`; }).join('')}</div>`;
  }
  $('#main').innerHTML = `<section class="pt-room"><div class="tp-top"><button data-back aria-label="Back" onclick="go('home')">‹</button><div class="tp-ribbon">${patronPage === 'shop' ? 'SVIP Shop' : 'VIP'}</div>
    <span class="tp-chip">${uiIcon('gold') + fmt(S.gold)}</span><span class="tp-chip">${pearlIcon()}${fmt(S.pearls || 0)}</span><span class="tp-chip">${prismIcon()}${fmt(S.scales || 0)}</span></div>
   <div class="pt-banner" style="--ptb:url('${artPath('patron-banner')}')">${head}</div><div class="pt-body">${body}</div>
   <div class="tp-nav pt-nav">${[['vip', 'VIP', 'rank'], ['must', 'Must-buy', 'quests'], ['shop', 'SVIP Shop', 'gift']].map(([k, n, ic]) => `<button class="${k === patronPage ? 'on' : ''}" onclick="patronPage='${k}';patronView=0;showPatron()">${denPlain}${uiIcon(ic)}<span>${n}</span>${k === 'vip' && Patron.due(S) ? '<i class="tp-dot"></i>' : ''}</button>`).join('')}</div></section>`;
}
function patronPack(lv) { if (Patron.buyPack(S, lv)) { save(); toast('SVIP ' + lv + ' Exclusive Benefits bought.'); } showPatron(); }
function patronVip(lv) { if (Patron.vipClaim(S, lv)) { save(); toast('VIP ' + lv + ' gift claimed: ' + Patron.vipTitles[lv - 1] + '.'); } showPatron(); }
function patronDaily() { const g = Patron.dailyClaim(S); if (g) { save(); resultShow({ title: 'Daily Pack', kicker: 'SVIP ' + Patron.level(S), win: true, body: `<div class="bag-gains">${ptTiles(g)}</div>`, buttons: [['Confirm', 'gold', '']] }); } else toast(Patron.level(S) ? 'Claimed today. Back at 00:00 UTC.' : 'SVIP 1 opens the Daily Pack.'); showPatron(); }
function patronShop(id) { if (Patron.shopBuy(S, id)) { save(); toast('Bought.'); } showPatron(); }
