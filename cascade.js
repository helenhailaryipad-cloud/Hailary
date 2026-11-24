// Crystal Cascade: figures of four magic crystals fall into a 10 x 20 well. Move and turn them; a full row bursts.
// The run ends when the stack reaches the top. Score opens up to three chests; two rewarded runs a UTC day.
// Rules first (pure, tested by scripts/test-cascade.mjs), the screen below the CASCADE_UI marker.
const Cascade = {
  cols: 10, rows: 20, kinds: 7,
  // Shapes as cells in a 4 x 4 box, spawn rotation. Each shape has its own crystal (kind = index).
  shapes: [
    [[0, 1], [1, 1], [2, 1], [3, 1]],          // 0 long beam (ruby)
    [[1, 0], [2, 0], [1, 1], [2, 1]],          // 1 square (sapphire)
    [[1, 0], [0, 1], [1, 1], [2, 1]],          // 2 crown (emerald)
    [[1, 0], [2, 0], [0, 1], [1, 1]],          // 3 step right (amethyst)
    [[0, 0], [1, 0], [1, 1], [2, 1]],          // 4 step left (topaz)
    [[0, 0], [0, 1], [1, 1], [2, 1]],          // 5 hook left (aqua)
    [[2, 0], [0, 1], [1, 1], [2, 1]]           // 6 hook right (rose)
  ],
  names: ['Ruby Ember', 'Sapphire Frost', 'Emerald Leaf', 'Amethyst Star', 'Topaz Sun', 'Aqua Tide', 'Rose Moon'],
  lineScore: [0, 100, 400, 900, 1600],   // several rows at once pay much more (placeholder)
  bursts: ['', 'Spark!', 'Twin Burst!', 'Triple Nova!', 'Arcane Cascade!'],
  linesPerLevel: 10,
  // Chests: score thresholds reached during the run; each opens a bag item.
  chests: [{ at: 1500, item: 'chest1', name: 'Oak Chest' }, { at: 4000, item: 'chest2', name: 'Moon Chest' }, { at: 8000, item: 'chest3', name: 'Winged Chest' }],
  dailyRuns: 2, goldCap: 800, xpCap: 80,
  lockDelay: .5,
  // Level 1 is gentle: slower fall and only the simple shapes (no zig-zag steps); from level 2 all seven.
  easyShapes: [0, 1, 2, 5, 6],
  speed(level) { return level === 1 ? 1 : Math.max(.07, .8 - (level - 2) * .07); },
  // Rotate a shape's cells k quarter turns clockwise inside its box (3 x 3, or 4 x 4 for the beam, 2 x 2 square stays).
  cells(kind, rot) {
    let c = this.shapes[kind].map(p => p.slice()); const n = kind === 0 ? 4 : 3;
    if (kind === 1) return c;
    for (let i = 0; i < ((rot % 4) + 4) % 4; i++) c = c.map(([x, y]) => [n - 1 - y, x]);
    return c;
  },
  // A seven-crystal bag, shuffled, so every shape comes once in each seven.
  bag(rng = Math.random, level = 2) { const a = level === 1 ? this.easyShapes.slice() : [0, 1, 2, 3, 4, 5, 6]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  create(rng = Math.random) {
    const g = { grid: Array.from({ length: this.rows }, () => Array(this.cols).fill(-1)), queue: [], score: 0, lines: 0, level: 1, combo: -1, over: false, rng, piece: null, fall: 0, lock: 0, opened: 0, events: [] };
    this.refill(g); this.spawn(g); return g;
  },
  refill(g) { while (g.queue.length < 7) g.queue.push(...this.bag(g.rng, g.level)); },
  spawn(g) {
    const kind = g.queue.shift(); this.refill(g);
    g.piece = { kind, rot: 0, x: kind === 1 ? 3 : 3, y: kind === 0 ? -1 : 0 };
    g.fall = 0; g.lock = 0;
    if (!this.fits(g, g.piece)) { g.over = true; g.events.push({ type: 'over' }); }
  },
  fits(g, p) {
    return this.cells(p.kind, p.rot).every(([cx, cy]) => {
      const x = p.x + cx, y = p.y + cy;
      return x >= 0 && x < this.cols && y < this.rows && (y < 0 || g.grid[y][x] < 0);
    });
  },
  move(g, dx) { if (g.over) return false; const p = { ...g.piece, x: g.piece.x + dx }; if (!this.fits(g, p)) return false; g.piece = p; if (this.landed(g)) g.lock = 0; return true; },
  // Turn with small kicks: in place, one or two cells aside, or one cell up.
  rotate(g, dir = 1) {
    if (g.over || g.piece.kind === 1) return false;
    for (const [kx, ky] of [[0, 0], [-1, 0], [1, 0], [-2, 0], [2, 0], [0, -1]]) {
      const p = { ...g.piece, rot: g.piece.rot + dir, x: g.piece.x + kx, y: g.piece.y + ky };
      if (this.fits(g, p)) { g.piece = p; g.lock = 0; return true; }
    }
    return false;
  },
  landed(g) { return !this.fits(g, { ...g.piece, y: g.piece.y + 1 }); },
  ghost(g) { let y = g.piece.y; while (this.fits(g, { ...g.piece, y: y + 1 })) y++; return y; },
  soft(g) { if (g.over || this.landed(g)) return false; g.piece.y++; g.score += 1; g.fall = 0; this.chestCheck(g); return true; },
  hard(g) {
    if (g.over) return 0; const y = this.ghost(g), rows = y - g.piece.y; g.piece.y = y; g.score += rows * 2;
    g.events.push({ type: 'slam', kind: g.piece.kind, x: g.piece.x, y }); this.place(g); return rows;
  },
  // Fix the piece into the well, burst full rows, score, level, next piece.
  place(g) {
    const p = g.piece; let top = false;
    for (const [cx, cy] of this.cells(p.kind, p.rot)) { const x = p.x + cx, y = p.y + cy; if (y < 0) top = true; else g.grid[y][x] = p.kind; }
    const full = []; g.grid.forEach((row, y) => { if (row.every(c => c >= 0)) full.push(y); });
    if (full.length) {
      g.events.push({ type: 'burst', rows: full, cells: full.map(y => g.grid[y].slice()), count: full.length, name: this.bursts[full.length] });
      g.grid = g.grid.filter((_, y) => !full.includes(y)); while (g.grid.length < this.rows) g.grid.unshift(Array(this.cols).fill(-1));
      g.combo++; const gain = this.lineScore[full.length] * g.level + (g.combo > 0 ? 50 * g.combo * g.level : 0);
      g.score += gain; g.lines += full.length; g.events.push({ type: 'score', gain, combo: g.combo });
      const level = 1 + Math.floor(g.lines / this.linesPerLevel); if (level > g.level) { if (g.level === 1) g.queue = g.queue.slice(0, 2); g.level = level; this.refill(g); g.events.push({ type: 'level', level }); }
      if (g.grid.every(r => r.every(c => c < 0))) { g.score += 1000 * g.level; g.events.push({ type: 'clear' }); }
    } else g.combo = -1;
    this.chestCheck(g);
    if (top) { g.over = true; g.events.push({ type: 'over' }); return; }
    this.spawn(g);
  },
  chestCheck(g) { while (g.opened < this.chests.length && g.score >= this.chests[g.opened].at) { g.events.push({ type: 'chest', n: g.opened }); g.opened++; } },
  // Time passes: gravity, then the lock delay once the piece rests.
  step(g, dt, softHeld = false) {
    if (g.over) return;
    if (this.landed(g)) { g.lock += dt; if (g.lock >= this.lockDelay) this.place(g); return; }
    g.fall += dt; const every = softHeld ? Math.min(.04, this.speed(g.level)) : this.speed(g.level);
    while (g.fall >= every && !this.landed(g)) { g.fall -= every; g.piece.y++; if (softHeld) g.score += 1; }
    if (softHeld) this.chestCheck(g);
  },
  reward(g) { return { gold: Math.min(this.goldCap, Math.round(g.score / 10)), xp: Math.min(this.xpCap, 10 + g.lines * 2), items: this.chests.slice(0, g.opened).map(c => c.item) }; },
  day(now = Date.now()) { return new Date(now).toISOString().slice(0, 10); },
  runsLeft(save, now) { const d = save.cascadeDaily; return Math.max(0, this.dailyRuns - (d && d.day === this.day(now) ? d.runs : 0)); },
  useRun(save, now) { const today = this.day(now), d = save.cascadeDaily; save.cascadeDaily = { day: today, runs: (d && d.day === today ? d.runs : 0) + 1 }; }
};
// CASCADE_UI ---------------------------------------------------------------------------------------------------------
let cascadeLoop = 0;
function cascadeTile(kind) { return '<i class="cas-gem" style="background-position:' + (kind % 4) / 3 * 100 + '% ' + Math.floor(kind / 4) * 100 + '%"></i>'; }
function showCascade() { if (typeof screenChangedAt !== "undefined") screenChangedAt = Date.now(); cascadePreload();
  cascadeStop();
  const left = Cascade.runsLeft(S);
  $('#main').innerHTML = `<section class="cas-lobby" style="background-image:url('${artPath('cascade-cover')}')">
    <h1>Crystal Cascade</h1><p class="cas-sub">A magic falling-crystal puzzle</p>
    <div class="cas-card"><ul>
      <li>Figures of four magic crystals fall into the well. Move them, turn them, drop them.</li>
      <li>Fill a whole row and it bursts into sparkling shards. More rows at once, bigger magic: ${Cascade.bursts.slice(1).join(' · ')}</li>
      <li>Every ten rows the level rises and the crystals fall faster.</li>
      <li>Score opens chests: ${Cascade.chests.map(c => fmt(c.at)).join(' · ')}.</li>
      <li>Rewards for ${Cascade.dailyRuns} runs a day: gold (score ÷ 10, up to ${Cascade.goldCap}), XP and the chests you opened.</li>
      <li>Swipe left or right to move, tap to turn, swipe down to drop. Or use the buttons.</li></ul>
      <p class="cas-runs">Rewarded runs today: <b>${left} / ${Cascade.dailyRuns}</b> · Best score <b>${fmt(S.cascadeBest || 0)}</b></p>
      <div class="cas-chestrow">${Cascade.chests.map((c, i) => `<span><i class="cas-chest c${i}"></i><small>${fmt(c.at)}</small></span>`).join('')}</div>
      <button class="cas-play" onclick="openCascade()">${denPlain}Play</button></div>
    <button class="cas-back" data-back onclick="go('games')" aria-label="Back to Mini Games">‹</button></section>`;
}
function cascadeStop() { if (cascadeLoop) cancelAnimationFrame(cascadeLoop); cascadeLoop = 0; if (game?.cascade) game.running = false; document.removeEventListener('keydown', cascadeKey); }
const casBp = n => `${(n % 4) * 100 / 3}% ${Math.floor(n / 4) * 100}%`;
function cascadeArtVars() { const r = document.documentElement; if (!r?.style?.setProperty || r.style.getPropertyValue('--cas-pad')) return; r.style.setProperty('--cas-pad', 'url("' + artPath('cascade-pad') + '")'); r.style.setProperty('--cas-stats', 'url("' + artPath('cascade-stats') + '")'); }
// Every picture of the game screen, its pause card and result window is fetched and decoded on the lobby, so nothing
// pops in later (user: "the buttons load only when I press pause").
const CASCADE_ART = ['cascade-pad', 'cascade-stats', 'cascade-tiles', 'cascade-chests', 'cascade-cover', 'cascade-fx', 'ui-btn-gold', 'ui-btn-violet', 'ui-result-ribbon', 'ui-result-burst'];
let cascadeKeep = null;
function cascadePreload() { if (cascadeKeep || typeof Image !== 'function') return; cascadeKeep = CASCADE_ART.map(id => { const i = new Image(); i.decoding = 'async'; i.src = artPath(id); i.decode?.().catch(() => {}); return i; }); }
function openCascade() { if (typeof screenChangedAt !== "undefined") screenChangedAt = Date.now(); cascadePreload(); cascadeArtVars();
  cascadeStop();
  const stat = (id, label, val, n) => `<div class="cas-stat"><i class="cas-sico" style="--n:${n}"></i><small>${label}</small><b id="${id}">${val}</b></div>`;
  $('#main').innerHTML = `<section class="cas-screen" style="--cover:url('${artPath('cascade-cover')}')"><div class="cas-motes"></div>
    <div class="cas-top"><button class="cas-back" data-back onclick="cascadeQuit()" aria-label="Back to the lobby">‹</button>
      <h1>Crystal Cascade</h1><button class="cas-pause" id="casPause" onclick="cascadePause()" style="--bp:${casBp(5)}" aria-label="Pause">${denPlain}</button></div>
    <div class="cas-main">
      <div class="cas-col">${stat('casScore', 'Score', 0, 0)}<div class="cas-stat"><i class="cas-sico" style="--n:1"></i><small>Level</small><b id="casLevel">1</b><i class="cas-lvbar"><u id="casLvBar"></u></i></div>${stat('casLines', 'Rows', 0, 2)}${stat('casBest', 'Best', fmt(S.cascadeBest || 0), 3)}</div>
      <div class="cas-well" id="casWell"><div class="cas-frame"><canvas id="casCanvas"></canvas></div><div class="cas-pops" id="casPops"></div></div>
      <div class="cas-col"><div class="cas-stat cas-nextbox"><small>Next</small><canvas id="casNext"></canvas></div>
        <div class="cas-stat"><small>Chests</small><div class="cas-chests">${Cascade.chests.map((c, i) => `<span id="casChest${i}"><i class="cas-chest c${i}"></i><b>${fmt(c.at)}</b></span>`).join('')}</div></div></div>
    </div>
    <div class="cas-pad">${[['left', 0, 'Move left', 'Left'], ['rot', 1, 'Turn', 'Turn'], ['hard', 2, 'Drop', 'Drop'], ['soft', 4, 'Fall faster', 'Faster'], ['right', 3, 'Move right', 'Right']].map(([act, n, label, cap]) => `<div class="cas-key"><button data-act="${act}" class="${act === 'hard' ? 'drop' : ''}" style="--bp:${casBp(n)}" aria-label="${label}">${denPlain}</button><small>${cap}</small></div>`).join('')}</div>
    <div class="cas-menu" id="casMenu" hidden></div>
  </section>`;
  startCascade();
}
// Pause and leave use one card over the well (no browser confirm(): the chat preview blocks it, so Back did nothing).
function cascadePause(force) { const g = game; if (!g?.cascade || g.state.over || g.done) return; g.paused = force ?? !g.paused; $('#casPause')?.style.setProperty('--bp', casBp(g.paused ? 6 : 5)); $('#casWell')?.classList.toggle('paused', g.paused); cascadeMenu(g.paused ? 'pause' : ''); }
function cascadeMenu(kind) {
  const m = $('#casMenu'); if (!m) return; m.hidden = !kind; if (!kind) return;
  const b = (t, c, js) => `<button class="wr-btn ${c}" onclick="${js}">${denPlain}<span>${t}</span></button>`;
  m.innerHTML = kind === 'leave'
    ? `<div class="cas-menucard"><h2>Leave this run?</h2><p>Your score so far counts as a finished run.</p>${b('Keep playing', 'gold', 'cascadePause(false)')}${b('Leave', 'violet', 'cascadeLeave()')}</div>`
    : `<div class="cas-menucard"><h2>Paused</h2>${b('Resume', 'gold', 'cascadePause(false)')}${b('Restart', 'violet', 'cascadeRestart()')}${b('Lobby', 'violet', 'cascadeQuit()')}</div>`;
}
function cascadeQuit() { const g = game; if (g?.cascade && !g.done && !g.state.over && g.state.score > 0) { g.paused = true; $('#casPause')?.style.setProperty('--bp', casBp(6)); $('#casWell')?.classList.add('paused'); cascadeMenu('leave'); return; } cascadeStop(); showCascade(); }
function cascadeLeave() { const g = game; cascadeMenu(''); if (g?.cascade && !g.done) { cascadeFinish(g, true); return; } cascadeStop(); showCascade(); }
function cascadeRestart() { const g = game; cascadeMenu(''); if (g?.cascade && !g.done && g.state.score > 0) { cascadeMenu('leave'); return; } openCascade(); }
function cascadeKey(e) {
  const g = game; if (!g?.cascade || g.state.over) return; const k = e.key;
  if (k === 'ArrowLeft') cascadeAct('left'); else if (k === 'ArrowRight') cascadeAct('right'); else if (k === 'ArrowUp' || k === 'x') cascadeAct('rot');
  else if (k === 'ArrowDown') cascadeAct('soft'); else if (k === ' ') cascadeAct('hard'); else return; e.preventDefault();
}
function cascadeAct(act) {
  const g = game; if (!g?.cascade || g.state.over || g.countdown > 0 || g.paused) return; const s = g.state;
  if (act === 'left') Cascade.move(s, -1); else if (act === 'right') Cascade.move(s, 1); else if (act === 'rot') { if (Cascade.rotate(s)) g.turnFx = .18; }
  else if (act === 'soft') Cascade.soft(s); else if (act === 'hard') Cascade.hard(s);
  cascadeEvents(g);
}
// Pop-ups queue up so two never cover each other: each one starts at least 0.6 s after the one before.
let cascadePopAt = 0;
function cascadePop(text, cls = '') {
  const now = performance.now(), wait = Math.max(0, cascadePopAt - now); cascadePopAt = now + wait + 750;
  setTimeout(() => { const box = $('#casPops'); if (!box) return; for (const old of box.querySelectorAll('.cas-pop')) old.classList.add('leave'); const el = document.createElement('div'); el.className = 'cas-pop ' + cls; el.innerHTML = text; box.appendChild(el); setTimeout(() => el.remove(), 1700); }, wait);
}
// A finger held still on the well: wait, then one row every CASCADE_HOLD_MS.
const CASCADE_HOLD_WAIT = 220, CASCADE_HOLD_MS = 38, CASCADE_SWEEP = 3.2, CASCADE_REPEAT_WAIT = 160, CASCADE_REPEAT_MS = 50;
const CASCADE_HUES = ['#ff5a4a', '#4fa8ff', '#4fd87a', '#b77aff', '#ffcf3a', '#3fe0d8', '#ff8ac8'];
// React to what the rules report: shards and rings for bursts, pop-ups, chests.
function cascadeEvents(g) {
  const s = g.state;
  for (const e of s.events.splice(0)) {
    if (e.type === 'burst') {
      for (const [n, y] of e.rows.entries()) for (let x = 0; x < Cascade.cols; x++) {
        const kind = e.cells[n][x];
        for (let k = 0; k < 2; k++) g.shards.push({ x: x + .5, y: y + .5, vx: (Math.random() - .5) * 14, vy: -4 - Math.random() * 9, rot: Math.random() * 6, vr: (Math.random() - .5) * 14, life: 1.1 + Math.random() * .5, kind, size: .35 + Math.random() * .35 });
      }
      g.rings.push(...e.rows.map(y => ({ y: y + .5, life: .7 })));
      g.beams.push(...e.rows.map((y, i) => ({ y: y + .5, life: .6 + i * .05, max: .6 + i * .05, big: e.count })));
      cascadeBlast(g, e);
      if (e.count >= 3) g.rays = { y: (e.rows[0] + e.rows[e.rows.length - 1]) / 2 + .5, life: 1.1, max: 1.1 };
      g.whiteout = Math.max(g.whiteout || 0, e.count >= 4 ? .25 : e.count >= 3 ? .1 : 0);
      g.flashRows = e.rows.map(y => ({ y, life: .35 }));
      g.shake = Math.max(g.shake, e.count >= 3 ? .45 : .2);
      cascadePop('<b>' + e.name + '</b><small>+' + fmt(Cascade.lineScore[e.count] * s.level) + '</small>', 'burst b' + e.count);
      navigator.vibrate?.(e.count >= 4 ? [40, 30, 60] : 25);
    } else if (e.type === 'score' && e.combo > 0) cascadePop('Combo ×' + (e.combo + 1), 'combo');
    else if (e.type === 'level') { cascadePop('Level ' + e.level + '<small>The crystals fall faster</small>', 'level'); }
    else if (e.type === 'clear') cascadePop('Crystal Clear!<small>+' + fmt(1000 * s.level) + '</small>', 'level');
    else if (e.type === 'chest') {
      const c = Cascade.chests[e.n]; cascadePop('<i class="cas-chest open c' + e.n + '"></i>' + c.name + ' unlocked!', 'chest');
      $('#casChest' + e.n)?.classList.add('got');
    } else if (e.type === 'slam') g.slam = { kind: e.kind, life: .25 };
    else if (e.type === 'over') { setTimeout(() => cascadeFinish(g), 900); g.overFx = 1; }
  }
}
function startCascade() {
  const g = game = { cascade: true, running: true, state: Cascade.create(), shards: [], sparks: [], rings: [], flashRows: [], beams: [], motes: [], fx: [], rays: null, whiteout: 0, shake: 0, countdown: 2.4, turnFx: 0 };
  const canvas = $('#casCanvas'), next = $('#casNext'), well = $('#casWell'), frameBox = well, tiles = new Image(); tiles.src = artPath('cascade-tiles'); g.fxImg = new Image(); g.fxImg.src = artPath('cascade-fx');
  const fit = () => {
    const box = well.getBoundingClientRect(), cell = Math.floor(Math.min((box.width - 18) / Cascade.cols, (box.height - 18) / Cascade.rows)), dpr = Math.min(2.5, devicePixelRatio || 1);
    g.cell = cell; canvas.style.width = cell * Cascade.cols + 'px'; canvas.style.height = cell * Cascade.rows + 'px'; canvas.width = cell * Cascade.cols * dpr; canvas.height = cell * Cascade.rows * dpr; g.dpr = dpr;
    const nb = next.getBoundingClientRect(); next.width = nb.width * dpr; next.height = nb.height * dpr;
  };
  fit(); g.fit = fit;
  // Touch: a tap turns, a sideways drag moves one cell per cell width, a quick swipe down drops, a slow drag down falls faster.
  let touch = null;
  // Holding a finger still on the well (user: "when I hold, it should go down faster") makes the piece fall fast until
  // the finger lifts; a hold never turns the piece.
  const holdEnd = () => { if (touch) { clearTimeout(touch.hold); clearInterval(touch.rep); clearInterval(touch.slide); } };
  // After a sideways drag, a finger that rests keeps sliding the piece that way (one cell every CASCADE_REPEAT_MS);
  // the finger's origin moves with it, so dragging back still works.
  const slideOn = () => { if (!touch || touch.slide) return; touch.slide = setInterval(() => {
    if (!touch || !touch.dir || touch.held || performance.now() - touch.last < CASCADE_REPEAT_WAIT) return;
    cascadeAct(touch.dir > 0 ? 'right' : 'left'); touch.moved += touch.dir; touch.x -= touch.dir * g.cell; }, CASCADE_REPEAT_MS); };
  well.onpointerdown = e => { e.preventDefault(); holdEnd(); touch = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, down: 0, held: false };
    touch.hold = setTimeout(() => { if (!touch || touch.moved) return; touch.held = true; touch.rep = setInterval(() => cascadeAct('soft'), CASCADE_HOLD_MS); }, CASCADE_HOLD_WAIT);
    try { well.setPointerCapture(e.pointerId); } catch {} };
  well.onpointermove = e => {
    if (!touch || !g.cell) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    if (Math.abs(dx) > 12 && !touch.held) clearTimeout(touch.hold);
    while (Math.abs(dx - touch.moved * g.cell) >= g.cell * .9) { const step = dx > touch.moved * g.cell ? 1 : -1; touch.moved += step; touch.dir = step; touch.last = performance.now(); cascadeAct(step > 0 ? 'right' : 'left'); slideOn(); }
    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) touch.dir = 0;
    while (dy - touch.down * g.cell >= g.cell && Math.abs(dy) > Math.abs(dx)) { touch.down++; cascadeAct('soft'); }
  };
  well.onpointercancel = () => { holdEnd(); touch = null; };
  well.onpointerup = e => {
    if (!touch) return; holdEnd(); if (touch.held) { touch = null; return; } const dx = e.clientX - touch.x, dy = e.clientY - touch.y, ms = performance.now() - touch.t;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && ms < 300) cascadeAct('rot');
    else if (dy > 60 && dy > Math.abs(dx) * 1.5 && ms < 260) cascadeAct('hard');
    touch = null;
  };
  // Buttons: left / right / soft repeat while held.
  for (const b of document.querySelectorAll('.cas-pad button')) {
    const act = b.dataset.act; let rep = 0;
    // A held button keeps going (user: "when I hold my finger it should keep moving, not tap again"): the finger is
    // captured so a small slide off the button does not stop it; after CASCADE_REPEAT_WAIT it repeats.
    b.onpointerdown = e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} b.classList.add('held'); cascadeAct(act); if (act === 'left' || act === 'right' || act === 'soft') { clearInterval(rep); clearTimeout(b.wait); const ms = act === 'soft' ? CASCADE_HOLD_MS : CASCADE_REPEAT_MS; b.wait = setTimeout(() => { rep = setInterval(() => cascadeAct(act), ms); }, act === 'soft' ? 120 : CASCADE_REPEAT_WAIT); } };
    b.onpointerup = b.onpointercancel = b.onlostpointercapture = () => { clearInterval(rep); clearTimeout(b.wait); b.classList.remove('held'); };
    b.oncontextmenu = e => e.preventDefault();
  }
  document.addEventListener('keydown', cascadeKey);
  cascadePop('Ready!', 'level');
  let last = performance.now();
  const frame = now => {
    if (game !== g || !g.running || !document.body.contains(canvas)) { cascadeLoop = 0; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden) {
      if (g.countdown > 0) { g.countdown -= dt; if (g.countdown <= 0) cascadePop('Go!', 'level'); }
      else if (!g.state.over && !g.paused) { Cascade.step(g.state, dt); cascadeEvents(g); }
      cascadeDraw(g, canvas, next, tiles, dt);
    }
    cascadeLoop = requestAnimationFrame(frame);
  };
  cascadeLoop = requestAnimationFrame(frame);
}
function cascadeGem(c, tiles, kind, x, y, size, alpha = 1) {
  c.globalAlpha = alpha;
  if (tiles.complete && tiles.naturalWidth) { const w = tiles.naturalWidth / 4, h = tiles.naturalHeight / 2; c.drawImage(tiles, (kind % 4) * w, Math.floor(kind / 4) * h, w, h, x, y, size, size); }
  else { c.fillStyle = CASCADE_HUES[kind]; c.fillRect(x + 1, y + 1, size - 2, size - 2); }
  c.globalAlpha = 1;
}
// Painted bursts (user: "beautiful explosions and glow, not silly little balls; more rows, a bigger blast"): sprites
// from cascade-fx (0 starburst, 1 crystal blast, 2 light streak, 3 ring; drawn additively, black = nothing).
// Positions are in cells; size in cells; delay in seconds.
function cascadeBlast(g, e) {
  const n = e.count, mid = (e.rows[0] + e.rows[e.rows.length - 1]) / 2 + .5, W = Cascade.cols, add = (kind, x, y, size, life, delay = 0, grow = 1.6) => g.fx.push({ kind, x, y, size, life, max: life, delay, grow, rot: Math.random() * 6.3, spin: (Math.random() - .5) * 2 });
  for (const y of e.rows) {
    add(2, W / 2, y + .5, W * 1.7, .55, 0, 1.25);                                   // streak along the row
  }
  // crystal blasts: 3 + rows of them, spread over the cleared rows and across the well, the middle ones first
  for (let i = 0, m = 2 + n; i <= m; i++) { const x = .9 + (W - 1.8) * i / m, y = e.rows[i % n] + .5; add(1, x, y, 2.3 + n * .2, .6, Math.abs(x - W / 2) * .025, 1.6); }
  for (let i = 0; i < n; i++) add(0, 1.5 + Math.random() * (W - 3), e.rows[i] + .5, 2.6 + n * .35, .75, .1 + Math.random() * .2, 1.4);
  add(3, W / 2, mid, 2.5, .6, 0, 2.6 + n * .6);                                        // shock ring
  if (n >= 2) add(1, W / 2, mid, W * (.4 + n * .1), .85, .12, 1.5);                      // big central blast
  if (n >= 3) { add(3, W / 2, mid, 3, .8, .15, 4 + n); add(0, W / 2, mid, W * .9, .9, .1, 1.3); }
  if (n >= 4) { add(0, W / 2, mid, W * 1.2, 1.1, .3, 1.2); for (let i = 0; i < 5; i++) add(0, 1 + Math.random() * (W - 2), mid + (Math.random() - .5) * 5, 3, .8, .45 + i * .1, 1.4); }
}
function cascadeDrawFx(c, g, fxImg, k, dt) {
  if (!fxImg?.complete || !fxImg.naturalWidth) { g.fx = []; return; }
  const S = fxImg.naturalWidth / 2; c.save(); c.globalCompositeOperation = 'screen';
  for (const f of g.fx) {
    if (f.delay > 0) { f.delay -= dt; continue; }
    f.life -= dt; const t = 1 - Math.max(0, f.life) / f.max, a = t < .15 ? t / .15 : Math.max(0, 1 - (t - .15) / .85), sz = f.size * k * (.35 + (f.grow - .35) * (1 - Math.pow(1 - t, 3)));
    c.globalAlpha = a * (f.size > 6 ? .55 : .7); c.save(); c.translate(f.x * k, f.y * k);
    if (f.kind === 2) { c.drawImage(fxImg, 0, S, S, S, -sz / 2, -sz / 2, sz, sz); }
    else { c.rotate(f.rot + f.spin * t); c.drawImage(fxImg, (f.kind % 2) * S, Math.floor(f.kind / 2) * S, S, S, -sz / 2, -sz / 2, sz, sz); }
    c.restore();
  }
  c.restore(); g.fx = g.fx.filter(f => f.life > 0);
}
function cascadeDraw(g, canvas, next, tiles, dt) {
  const c = canvas.getContext('2d'), s = g.state, k = g.cell * g.dpr, W = Cascade.cols * k, H = Cascade.rows * k;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
  g.shake = Math.max(0, g.shake - dt); const sx = g.shake ? (Math.random() - .5) * k * .5 * g.shake : 0, sy = g.shake ? (Math.random() - .5) * k * .5 * g.shake : 0;
  c.translate(sx, sy);
  // well: dark glass with faint grid
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#1a1240'); bg.addColorStop(.6, '#24145a'); bg.addColorStop(1, '#30175e'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  // a slowly turning rune circle and soft cell wells
  const now = performance.now() / 1000; c.save(); c.translate(W / 2, H * .58); c.rotate(now * .05); c.strokeStyle = 'rgba(200,170,255,.10)'; c.lineWidth = Math.max(1, k * .06);
  for (const rr of [W * .42, W * .34]) { c.beginPath(); c.arc(0, 0, rr, 0, Math.PI * 2); c.stroke(); }
  for (let i = 0; i < 12; i++) { c.rotate(Math.PI / 6); c.beginPath(); c.moveTo(W * .34, 0); c.lineTo(W * .42, 0); c.stroke(); } c.restore();
  c.fillStyle = 'rgba(255,255,255,.035)'; for (let y = 0; y < Cascade.rows; y++) for (let x = 0; x < Cascade.cols; x++) if ((x + y) % 2 === 0) c.fillRect(x * k, y * k, k, k);
  const high = s.grid.findIndex(r => r.some(v => v >= 0)); if (high >= 0 && high < 5 && !s.over) { const a = (5 - high) / 5 * (.35 + .25 * Math.sin(now * 6)); const dg = c.createLinearGradient(0, 0, 0, k * 4); dg.addColorStop(0, `rgba(255,70,90,${a})`); dg.addColorStop(1, 'rgba(255,70,90,0)'); c.fillStyle = dg; c.fillRect(0, 0, W, k * 4); }
  // settled crystals (lit cells are collected for the light sweep below)
  const lit = [];
  for (let y = 0; y < Cascade.rows; y++) for (let x = 0; x < Cascade.cols; x++) { const v = s.grid[y][x]; if (v >= 0) { cascadeGem(c, tiles, v, x * k, y * k, k, s.over ? .55 : 1); lit.push([x * k, y * k]); } }
  // ghost and falling piece
  if (!s.over && s.piece) {
    const cells = Cascade.cells(s.piece.kind, s.piece.rot), gy = Cascade.ghost(s);
    c.strokeStyle = CASCADE_HUES[s.piece.kind]; c.fillStyle = CASCADE_HUES[s.piece.kind]; c.lineWidth = Math.max(1, k * .07);
    for (const [cx, cy] of cells) if (gy + cy >= 0) { c.globalAlpha = .16; c.fillRect((s.piece.x + cx) * k + k * .06, (gy + cy) * k + k * .06, k * .88, k * .88); c.globalAlpha = .6; c.strokeRect((s.piece.x + cx) * k + k * .08, (gy + cy) * k + k * .08, k * .84, k * .84); c.globalAlpha = 1; }
    // a faint beam from the piece down to where it will land
    const minX = Math.min(...cells.map(p => p[0])), maxX = Math.max(...cells.map(p => p[0])), lb = c.createLinearGradient(0, s.piece.y * k, 0, gy * k); lb.addColorStop(0, 'rgba(255,255,255,0)'); lb.addColorStop(1, CASCADE_HUES[s.piece.kind] + '33');
    c.fillStyle = lb; c.fillRect((s.piece.x + minX) * k, (s.piece.y + 1) * k, (maxX - minX + 1) * k, Math.max(0, gy - s.piece.y) * k);
    const glow = .5 + .5 * Math.sin(performance.now() / 160);
    c.save(); c.shadowColor = CASCADE_HUES[s.piece.kind]; c.shadowBlur = k * (.35 + glow * .35);
    for (const [cx, cy] of cells) if (s.piece.y + cy >= 0) { cascadeGem(c, tiles, s.piece.kind, (s.piece.x + cx) * k, (s.piece.y + cy) * k, k); lit.push([(s.piece.x + cx) * k, (s.piece.y + cy) * k]); }
    c.restore();
  }
  // Light sweeping across the crystals (user: "light should pass over them"): a bright diagonal band, clipped to the
  // occupied cells, crosses the well every CASCADE_SWEEP seconds; a few crystals twinkle.
  if (lit.length && !s.over) {
    const ux = .876, uy = .482, D = W * ux + H * uy, bw = k * 1.6, pos = (now % CASCADE_SWEEP) / CASCADE_SWEEP * (D + bw * 4) - bw * 2;
    const sg = c.createLinearGradient(ux * (pos - bw), uy * (pos - bw), ux * (pos + bw), uy * (pos + bw));
    sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(.42, 'rgba(255,250,230,.16)'); sg.addColorStop(.5, 'rgba(255,255,255,.55)'); sg.addColorStop(.58, 'rgba(255,250,230,.16)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    c.save(); c.beginPath(); for (const [x, y] of lit) c.rect(x + k * .05, y + k * .05, k * .9, k * .9); c.clip(); c.globalCompositeOperation = 'lighter'; c.fillStyle = sg; c.fillRect(0, 0, W, H); c.restore();
    g.twinkles = (g.twinkles || []).filter(t => (t.life -= dt) > 0);
    if (Math.random() < dt * 3 && g.twinkles.length < 6) { const [x, y] = lit[Math.floor(Math.random() * lit.length)]; g.twinkles.push({ x: x + k * (.25 + Math.random() * .5), y: y + k * (.2 + Math.random() * .4), life: .7 }); }
    c.save(); c.globalCompositeOperation = 'lighter';
    for (const t of g.twinkles) { const a = Math.sin(t.life / .7 * Math.PI), r = k * .32 * a; c.fillStyle = `rgba(255,255,255,${a * .9})`; c.beginPath(); for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * .18 : r; c.lineTo(t.x + Math.cos(an) * rr, t.y + Math.sin(an) * rr); } c.fill(); }
    c.restore();
  }
  // burst effects (user: "rows should burst with beautiful light"): a beam of light runs out from the middle of the
  // row, the row glows white, glowing motes rise, rays fan out on three or more rows, the well flashes.
  c.save(); c.globalCompositeOperation = 'lighter';
  for (const b of g.beams) { b.life -= dt; const t = 1 - b.life / b.max, reach = Math.min(1, t * 3.2), a = Math.max(0, b.life / b.max) * (b.big >= 3 ? .3 : .5), y = b.y * k, hh = k * (.55 + (b.big - 1) * .12) * (1 - t * .6);
    const hg = c.createLinearGradient(W / 2 - W * .6 * reach, 0, W / 2 + W * .6 * reach, 0); hg.addColorStop(0, 'rgba(255,240,200,0)'); hg.addColorStop(.5, `rgba(255,255,255,${a})`); hg.addColorStop(1, 'rgba(255,240,200,0)');
    const vg = c.createLinearGradient(0, y - hh * 2.4, 0, y + hh * 2.4); vg.addColorStop(0, 'rgba(255,200,255,0)'); vg.addColorStop(.5, `rgba(255,220,150,${a * .55})`); vg.addColorStop(1, 'rgba(160,200,255,0)');
    c.fillStyle = vg; c.fillRect(0, y - hh * 2.4, W, hh * 4.8); c.fillStyle = hg; c.fillRect(0, y - hh / 2, W, hh);
    c.fillStyle = `rgba(255,255,255,${a})`; c.fillRect(W / 2 - W * .55 * reach, y - k * .05, W * 1.1 * reach, k * .1); }
  g.beams = g.beams.filter(b => b.life > 0);
  if (g.rays) { const r = g.rays; r.life -= dt; const a = Math.max(0, r.life / r.max); c.save(); c.translate(W / 2, r.y * k); c.rotate(now * .9); for (let i = 0; i < 14; i++) { c.rotate(Math.PI / 7); const rg = c.createLinearGradient(0, 0, 0, -H); rg.addColorStop(0, `rgba(255,240,190,${a * .55})`); rg.addColorStop(1, 'rgba(255,240,190,0)'); c.fillStyle = rg; c.beginPath(); c.moveTo(-k * .35, 0); c.lineTo(0, -H); c.lineTo(k * .35, 0); c.fill(); } c.restore(); if (r.life <= 0) g.rays = null; }
  for (const m of g.motes) { m.life -= dt; m.vy -= 1.5 * dt; m.x += m.vx * dt; m.y += m.vy * dt; const a = Math.max(0, Math.min(1, m.life / .5)), rr = k * .22 * (.6 + a * .6); const mg = c.createRadialGradient(m.x * k, m.y * k, 0, m.x * k, m.y * k, rr); mg.addColorStop(0, `rgba(255,255,255,${a})`); mg.addColorStop(.35, m.hue + 'cc'); mg.addColorStop(1, m.hue + '00'); c.fillStyle = mg; c.beginPath(); c.arc(m.x * k, m.y * k, rr, 0, Math.PI * 2); c.fill(); }
  g.motes = g.motes.filter(m => m.life > 0);
  c.restore();
  for (const f of g.flashRows) { f.life -= dt; const a = Math.max(0, f.life / .35); const fg = c.createLinearGradient(0, f.y * k, 0, (f.y + 1) * k); fg.addColorStop(0, `rgba(255,255,255,${a * .25})`); fg.addColorStop(.5, `rgba(255,252,235,${a})`); fg.addColorStop(1, `rgba(255,255,255,${a * .5})`); c.fillStyle = fg; c.fillRect(0, f.y * k, W, k); }
  g.flashRows = g.flashRows.filter(f => f.life > 0);
  for (const r of g.rings) { r.life -= dt; const t = 1 - r.life / .7; c.strokeStyle = `rgba(255,236,160,${Math.max(0, r.life / .7)})`; c.lineWidth = k * .18 * (1 - t) + 1; c.beginPath(); c.ellipse(W / 2, r.y * k, W * (.2 + t * .7), k * (.4 + t * 1.6), 0, 0, Math.PI * 2); c.stroke(); }
  g.rings = g.rings.filter(r => r.life > 0);
  for (const p of g.sparks) { p.life -= dt; const t = 1 - p.life / .6; c.fillStyle = p.hue; c.globalAlpha = Math.max(0, p.life / .6); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = (i % 2 ? .25 : .9) * k * (.4 + t); c.lineTo(p.x * k + Math.cos(a) * rr, p.y * k + Math.sin(a) * rr); } c.fill(); c.globalAlpha = 1; }
  g.sparks = g.sparks.filter(p => p.life > 0);
  for (const p of g.shards) { p.life -= dt; p.vy += 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; const sz = p.size * k; c.save(); c.translate(p.x * k, p.y * k); c.rotate(p.rot); c.shadowColor = CASCADE_HUES[p.kind]; c.shadowBlur = k * .4; cascadeGem(c, tiles, p.kind, -sz / 2, -sz / 2, sz, Math.max(0, Math.min(1, p.life))); c.restore(); }
  g.shards = g.shards.filter(p => p.life > 0 && p.y < Cascade.rows + 4);
  cascadeDrawFx(c, g, g.fxImg, k, dt);
  if (g.whiteout > 0) { g.whiteout = Math.max(0, g.whiteout - dt); c.fillStyle = `rgba(255,250,235,${g.whiteout * .9})`; c.fillRect(0, 0, W, H); }
  if (g.slam) { g.slam.life -= dt; c.fillStyle = `rgba(255,255,255,${Math.max(0, g.slam.life) * 1.2})`; c.fillRect(0, H - k * .2, W, k * .2); if (g.slam.life <= 0) g.slam = null; }
  if (g.countdown > 0) { c.fillStyle = 'rgba(10,6,30,.45)'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffe9a0'; c.font = `900 ${k * 2.6}px Georgia,serif`; c.textAlign = 'center'; c.fillText(String(Math.ceil(g.countdown / .8)), W / 2, H / 2 + k); }
  // next three
  const n = next.getContext('2d'), nk = Math.min(next.width / 4.6, next.height / 9.6); n.clearRect(0, 0, next.width, next.height);
  s.queue.slice(0, 3).forEach((kind, i) => { const cells = Cascade.cells(kind, 0), minX = Math.min(...cells.map(p => p[0])), maxX = Math.max(...cells.map(p => p[0])), minY = Math.min(...cells.map(p => p[1])), w = (maxX - minX + 1) * nk;
    for (const [cx, cy] of cells) cascadeGem(n, tiles, kind, (next.width - w) / 2 + (cx - minX) * nk, i * nk * 3.2 + (cy - minY) * nk + nk * .3, nk); });
  $('#casScore').textContent = fmt(s.score); $('#casLevel').textContent = s.level; $('#casLines').textContent = s.lines; const lb = $('#casLvBar'); if (lb) lb.style.width = (s.lines % Cascade.linesPerLevel) / Cascade.linesPerLevel * 100 + '%';
  if (g.paused) { c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = 'rgba(10,6,30,.6)'; c.fillRect(0, 0, canvas.width, canvas.height); }
}
function cascadeFinish(g, quit = false) {
  if (g.done) return; g.done = true; g.running = false; cascadeStop();
  const s = g.state, record = s.score > (S.cascadeBest || 0), paid = Cascade.runsLeft(S) > 0 && s.score > 0;
  if (record) S.cascadeBest = s.score;
  if (typeof arcadeScore === 'function') arcadeScore('cascade', s.score);
  let prize = null;
  if (paid) { Cascade.useRun(S); prize = Cascade.reward(s); for (const id of prize.items) WonderGear.bagAdd(S, id, 1); const got = gain(prize.gold, 0, prize.xp); prize.xp = got.xp; } else save();
  bagArtVars?.();
  const chests = Cascade.chests.map((c, i) => `<div class="cas-rchest ${i < s.opened ? 'won' : ''}" style="--d:${1 + i * .4}s"><i class="cas-chest ${i < s.opened ? 'open' : ''} c${i}"></i><small>${i < s.opened ? c.name : fmt(c.at)}</small></div>`).join('');
  const tile = (icon, n, name, hue, i) => `<span class="wr-prize" style="--rarity:${hue};--d:${1.5 + i * .15}s">${icon}<b>${n}</b><small>${name}</small></span>`;
  const prizes = prize ? `<div class="wr-prizes">${[tile(uiIcon('gold'), '+' + fmt(prize.gold), 'Gold', '#ffcf5a', 0), tile(uiIcon('exp'), '+' + prize.xp, 'XP', '#8fd0ff', 1), ...prize.items.map((id, i) => tile(bagIcon(id), '×1', WonderGear.bagItemById[id].name, bagHue(WonderGear.bagItemById[id].rarity), i + 2))].join('')}</div>` : '<p class="wr-practice">Practice run · rewards return tomorrow</p>';
  resultShow({ win: !quit && s.score > 0, title: quit ? 'Run Ended' : record ? 'New Record!' : 'Well Is Full', kicker: record && !quit ? 'Best score ever' : '', stars: s.opened, score: s.score,
    body: `<p class="wr-line">Level ${s.level} · ${s.lines} rows burst · Best ${fmt(S.cascadeBest || 0)}</p><div class="wr-chests cas-rchests">${chests}</div>${prizes}`,
    buttons: [['Play again', 'gold', 'openCascade()'], ['Lobby', 'violet', 'showCascade()']] });
}
function confettiBurst() {
  const box = document.querySelector('#modal'); if (!box) return;
  for (let i = 0; i < 26; i++) { const b = document.createElement('i'); b.className = 'cas-confetti'; b.style.cssText = `left:${10 + Math.random() * 80}%;--dx:${(Math.random() - .5) * 220}px;--hue:${CASCADE_HUES[i % 7]};animation-delay:${Math.random() * .3}s`; box.appendChild(b); setTimeout(() => b.remove(), 1800); }
}
