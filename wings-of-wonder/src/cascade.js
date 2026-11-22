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
  lineScore: [0, 100, 300, 500, 800],
  bursts: ['', 'Spark!', 'Twin Burst!', 'Triple Nova!', 'Arcane Cascade!'],
  linesPerLevel: 10,
  // Chests: score thresholds reached during the run; each opens a bag item.
  chests: [{ at: 1500, item: 'chest1', name: 'Oak Chest' }, { at: 4000, item: 'chest2', name: 'Moon Chest' }, { at: 8000, item: 'chest3', name: 'Winged Chest' }],
  dailyRuns: 2, goldCap: 800, xpCap: 80,
  lockDelay: .5,
  speed(level) { return Math.max(.07, .8 - (level - 1) * .07); },
  // Rotate a shape's cells k quarter turns clockwise inside its box (3 x 3, or 4 x 4 for the beam, 2 x 2 square stays).
  cells(kind, rot) {
    let c = this.shapes[kind].map(p => p.slice()); const n = kind === 0 ? 4 : 3;
    if (kind === 1) return c;
    for (let i = 0; i < ((rot % 4) + 4) % 4; i++) c = c.map(([x, y]) => [n - 1 - y, x]);
    return c;
  },
  // A seven-crystal bag, shuffled, so every shape comes once in each seven.
  bag(rng = Math.random) { const a = [0, 1, 2, 3, 4, 5, 6]; for (let i = 6; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
  create(rng = Math.random) {
    const g = { grid: Array.from({ length: this.rows }, () => Array(this.cols).fill(-1)), queue: [], score: 0, lines: 0, level: 1, combo: -1, over: false, rng, piece: null, fall: 0, lock: 0, opened: 0, events: [] };
    this.refill(g); this.spawn(g); return g;
  },
  refill(g) { while (g.queue.length < 7) g.queue.push(...this.bag(g.rng)); },
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
      const level = 1 + Math.floor(g.lines / this.linesPerLevel); if (level > g.level) { g.level = level; g.events.push({ type: 'level', level }); }
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
function showCascade() {
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
function openCascade() {
  cascadeStop();
  $('#main').innerHTML = `<section class="cas-screen" style="--cover:url('${artPath('cascade-cover')}')">
    <div class="cas-top"><button class="cas-back" data-back onclick="cascadeQuit()" aria-label="Back to the lobby">‹</button>
      <span>Score<b id="casScore">0</b></span><span>Level<b id="casLevel">1</b></span><span>Rows<b id="casLines">0</b></span></div>
    <div class="cas-main"><div class="cas-well" id="casWell"><canvas id="casCanvas"></canvas><div class="cas-pops" id="casPops"></div></div>
      <div class="cas-side"><small>Next</small><canvas id="casNext"></canvas>
        <small>Chests</small><div class="cas-chests">${Cascade.chests.map((c, i) => `<span id="casChest${i}"><i class="cas-chest c${i}"></i><b>${fmt(c.at)}</b></span>`).join('')}</div>
        <small>Best</small><b class="cas-best">${fmt(S.cascadeBest || 0)}</b></div></div>
    <div class="cas-pad"><button data-act="left" aria-label="Move left">${denPlain}◀</button><button data-act="rot" aria-label="Turn">${denPlain}⟳</button><button data-act="soft" aria-label="Fall faster">${denPlain}▼</button><button data-act="hard" aria-label="Drop">${denPlain}⤓</button><button data-act="right" aria-label="Move right">${denPlain}▶</button></div>
  </section>`;
  startCascade();
}
function cascadeQuit() { const g = game; if (g?.cascade && !g.state.over && g.state.score > 0) { if (!confirm('Leave this run? It counts as finished.')) return; cascadeFinish(g, true); return; } cascadeStop(); showCascade(); }
function cascadeKey(e) {
  const g = game; if (!g?.cascade || g.state.over) return; const k = e.key;
  if (k === 'ArrowLeft') cascadeAct('left'); else if (k === 'ArrowRight') cascadeAct('right'); else if (k === 'ArrowUp' || k === 'x') cascadeAct('rot');
  else if (k === 'ArrowDown') cascadeAct('soft'); else if (k === ' ') cascadeAct('hard'); else return; e.preventDefault();
}
function cascadeAct(act) {
  const g = game; if (!g?.cascade || g.state.over || g.countdown > 0) return; const s = g.state;
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
const CASCADE_HUES = ['#ff5a4a', '#4fa8ff', '#4fd87a', '#b77aff', '#ffcf3a', '#3fe0d8', '#ff8ac8'];
// React to what the rules report: shards and rings for bursts, pop-ups, chests.
function cascadeEvents(g) {
  const s = g.state;
  for (const e of s.events.splice(0)) {
    if (e.type === 'burst') {
      for (const [n, y] of e.rows.entries()) for (let x = 0; x < Cascade.cols; x++) {
        const kind = e.cells[n][x];
        for (let k = 0; k < 3; k++) g.shards.push({ x: x + .5, y: y + .5, vx: (Math.random() - .5) * 14, vy: -4 - Math.random() * 9, rot: Math.random() * 6, vr: (Math.random() - .5) * 14, life: 1.1 + Math.random() * .5, kind, size: .35 + Math.random() * .35 });
        g.sparks.push({ x: x + .5, y: y + .5, life: .6, hue: CASCADE_HUES[kind] });
      }
      g.rings.push(...e.rows.map(y => ({ y: y + .5, life: .7 })));
      g.flashRows = e.rows.map(y => ({ y, life: .35 }));
      g.shake = Math.max(g.shake, e.count >= 3 ? .45 : .2);
      cascadePop('<b>' + e.name + '</b>', 'burst b' + e.count);
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
  const g = game = { cascade: true, running: true, state: Cascade.create(), shards: [], sparks: [], rings: [], flashRows: [], shake: 0, countdown: 2.4, turnFx: 0 };
  const canvas = $('#casCanvas'), next = $('#casNext'), well = $('#casWell'), tiles = new Image(); tiles.src = artPath('cascade-tiles');
  const fit = () => {
    const box = well.getBoundingClientRect(), cell = Math.floor(Math.min(box.width / Cascade.cols, box.height / Cascade.rows)), dpr = Math.min(2.5, devicePixelRatio || 1);
    g.cell = cell; canvas.style.width = cell * Cascade.cols + 'px'; canvas.style.height = cell * Cascade.rows + 'px'; canvas.width = cell * Cascade.cols * dpr; canvas.height = cell * Cascade.rows * dpr; g.dpr = dpr;
    const nb = next.getBoundingClientRect(); next.width = nb.width * dpr; next.height = nb.height * dpr;
  };
  fit(); g.fit = fit;
  // Touch: a tap turns, a sideways drag moves one cell per cell width, a quick swipe down drops, a slow drag down falls faster.
  let touch = null;
  well.onpointerdown = e => { touch = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0, down: 0 }; well.setPointerCapture?.(e.pointerId); };
  well.onpointermove = e => {
    if (!touch || !g.cell) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y;
    while (Math.abs(dx - touch.moved * g.cell) >= g.cell * .9) { const step = dx > touch.moved * g.cell ? 1 : -1; touch.moved += step; cascadeAct(step > 0 ? 'right' : 'left'); }
    while (dy - touch.down * g.cell >= g.cell && Math.abs(dy) > Math.abs(dx)) { touch.down++; cascadeAct('soft'); }
  };
  well.onpointerup = e => {
    if (!touch) return; const dx = e.clientX - touch.x, dy = e.clientY - touch.y, ms = performance.now() - touch.t;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && ms < 300) cascadeAct('rot');
    else if (dy > 60 && dy > Math.abs(dx) * 1.5 && ms < 260) cascadeAct('hard');
    touch = null;
  };
  // Buttons: left / right / soft repeat while held.
  for (const b of document.querySelectorAll('.cas-pad button')) {
    const act = b.dataset.act; let rep = 0;
    b.onpointerdown = e => { e.preventDefault(); cascadeAct(act); if (act === 'left' || act === 'right' || act === 'soft') { clearInterval(rep); let n = 0; rep = setInterval(() => { if (++n > 3) cascadeAct(act); }, 55); } };
    b.onpointerup = b.onpointerleave = b.onpointercancel = () => clearInterval(rep);
  }
  document.addEventListener('keydown', cascadeKey);
  cascadePop('Ready!', 'level');
  let last = performance.now();
  const frame = now => {
    if (game !== g || !g.running || !document.body.contains(canvas)) { cascadeLoop = 0; return; }
    const dt = Math.min(.05, (now - last) / 1000); last = now;
    if (!document.hidden && !g.paused) {
      if (g.countdown > 0) { g.countdown -= dt; if (g.countdown <= 0) cascadePop('Go!', 'level'); }
      else if (!g.state.over) { Cascade.step(g.state, dt); cascadeEvents(g); }
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
function cascadeDraw(g, canvas, next, tiles, dt) {
  const c = canvas.getContext('2d'), s = g.state, k = g.cell * g.dpr, W = Cascade.cols * k, H = Cascade.rows * k;
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, canvas.width, canvas.height);
  g.shake = Math.max(0, g.shake - dt); const sx = g.shake ? (Math.random() - .5) * k * .5 * g.shake : 0, sy = g.shake ? (Math.random() - .5) * k * .5 * g.shake : 0;
  c.translate(sx, sy);
  // well: dark glass with faint grid
  const bg = c.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, 'rgba(20,14,48,.78)'); bg.addColorStop(1, 'rgba(36,18,70,.9)'); c.fillStyle = bg; c.fillRect(0, 0, W, H);
  c.strokeStyle = 'rgba(190,170,255,.08)'; c.lineWidth = 1;
  for (let x = 1; x < Cascade.cols; x++) { c.beginPath(); c.moveTo(x * k, 0); c.lineTo(x * k, H); c.stroke(); }
  for (let y = 1; y < Cascade.rows; y++) { c.beginPath(); c.moveTo(0, y * k); c.lineTo(W, y * k); c.stroke(); }
  // settled crystals
  for (let y = 0; y < Cascade.rows; y++) for (let x = 0; x < Cascade.cols; x++) { const v = s.grid[y][x]; if (v >= 0) cascadeGem(c, tiles, v, x * k, y * k, k, s.over ? .55 : 1); }
  // ghost and falling piece
  if (!s.over && s.piece) {
    const cells = Cascade.cells(s.piece.kind, s.piece.rot), gy = Cascade.ghost(s);
    c.strokeStyle = CASCADE_HUES[s.piece.kind]; c.lineWidth = Math.max(1, k * .06);
    for (const [cx, cy] of cells) if (gy + cy >= 0) { c.globalAlpha = .45; c.strokeRect((s.piece.x + cx) * k + k * .08, (gy + cy) * k + k * .08, k * .84, k * .84); c.globalAlpha = 1; }
    const glow = .5 + .5 * Math.sin(performance.now() / 160);
    c.save(); c.shadowColor = CASCADE_HUES[s.piece.kind]; c.shadowBlur = k * (.35 + glow * .35);
    for (const [cx, cy] of cells) if (s.piece.y + cy >= 0) cascadeGem(c, tiles, s.piece.kind, (s.piece.x + cx) * k, (s.piece.y + cy) * k, k);
    c.restore();
  }
  // burst effects: row flash, rings, sparks, flying shards
  for (const f of g.flashRows) { f.life -= dt; c.fillStyle = `rgba(255,250,220,${Math.max(0, f.life / .35) * .85})`; c.fillRect(0, f.y * k, W, k); }
  g.flashRows = g.flashRows.filter(f => f.life > 0);
  for (const r of g.rings) { r.life -= dt; const t = 1 - r.life / .7; c.strokeStyle = `rgba(255,236,160,${Math.max(0, r.life / .7)})`; c.lineWidth = k * .18 * (1 - t) + 1; c.beginPath(); c.ellipse(W / 2, r.y * k, W * (.2 + t * .7), k * (.4 + t * 1.6), 0, 0, Math.PI * 2); c.stroke(); }
  g.rings = g.rings.filter(r => r.life > 0);
  for (const p of g.sparks) { p.life -= dt; const t = 1 - p.life / .6; c.fillStyle = p.hue; c.globalAlpha = Math.max(0, p.life / .6); c.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = (i % 2 ? .25 : .9) * k * (.4 + t); c.lineTo(p.x * k + Math.cos(a) * rr, p.y * k + Math.sin(a) * rr); } c.fill(); c.globalAlpha = 1; }
  g.sparks = g.sparks.filter(p => p.life > 0);
  for (const p of g.shards) { p.life -= dt; p.vy += 22 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; const sz = p.size * k; c.save(); c.translate(p.x * k, p.y * k); c.rotate(p.rot); cascadeGem(c, tiles, p.kind, -sz / 2, -sz / 2, sz, Math.max(0, Math.min(1, p.life))); c.restore(); }
  g.shards = g.shards.filter(p => p.life > 0 && p.y < Cascade.rows + 4);
  if (g.slam) { g.slam.life -= dt; c.fillStyle = `rgba(255,255,255,${Math.max(0, g.slam.life) * 1.2})`; c.fillRect(0, H - k * .2, W, k * .2); if (g.slam.life <= 0) g.slam = null; }
  if (g.countdown > 0) { c.fillStyle = 'rgba(10,6,30,.45)'; c.fillRect(0, 0, W, H); c.fillStyle = '#ffe9a0'; c.font = `900 ${k * 2.6}px Georgia,serif`; c.textAlign = 'center'; c.fillText(String(Math.ceil(g.countdown / .8)), W / 2, H / 2 + k); }
  // next three
  const n = next.getContext('2d'), nk = Math.min(next.width / 4.6, next.height / 9.6); n.clearRect(0, 0, next.width, next.height);
  s.queue.slice(0, 3).forEach((kind, i) => { const cells = Cascade.cells(kind, 0), minX = Math.min(...cells.map(p => p[0])), maxX = Math.max(...cells.map(p => p[0])), minY = Math.min(...cells.map(p => p[1])), w = (maxX - minX + 1) * nk;
    for (const [cx, cy] of cells) cascadeGem(n, tiles, kind, (next.width - w) / 2 + (cx - minX) * nk, i * nk * 3.2 + (cy - minY) * nk + nk * .3, nk); });
  $('#casScore').textContent = fmt(s.score); $('#casLevel').textContent = s.level; $('#casLines').textContent = s.lines;
}
function cascadeFinish(g, quit = false) {
  if (g.done) return; g.done = true; g.running = false; cascadeStop();
  const s = g.state, record = s.score > (S.cascadeBest || 0), paid = Cascade.runsLeft(S) > 0 && s.score > 0;
  if (record) S.cascadeBest = s.score;
  let prize = null;
  if (paid) { Cascade.useRun(S); prize = Cascade.reward(s); for (const id of prize.items) WonderGear.bagAdd(S, id, 1); const got = gain(prize.gold, 0, prize.xp); prize.xp = got.xp; } else save();
  bagArtVars?.();
  const chests = Cascade.chests.map((c, i) => `<div class="cas-rchest ${i < s.opened ? 'won' : ''}" style="--d:${.5 + i * .45}s"><i class="cas-chest ${i < s.opened ? 'open' : ''} c${i}"></i><small>${i < s.opened ? c.name : fmt(c.at)}</small></div>`).join('');
  popup(`<div class="cas-result"><p class="cas-rhead">${quit ? 'RUN ENDED' : record ? 'NEW BEST SCORE' : 'THE WELL IS FULL'}</p><h2 class="cas-rscore">${fmt(s.score)}</h2>
    <p>Level ${s.level} · ${s.lines} rows burst · Best ${fmt(S.cascadeBest || 0)}</p><div class="cas-rchests">${chests}</div>
    ${prize ? `<div class="bag-gains"><span class="bag-gain" style="--rarity:#ffcf5a">${uiIcon('gold')}<b>+${prize.gold}</b><small>Gold</small></span><span class="bag-gain" style="--rarity:#8fd0ff">${uiIcon('exp')}<b>+${prize.xp}</b><small>XP</small></span>${prize.items.map(id => `<span class="bag-gain" style="--rarity:${bagHue(WonderGear.bagItemById[id].rarity)}">${bagIcon(id)}<b>×1</b><small>${WonderGear.bagItemById[id].name}</small></span>`).join('')}</div>` : '<p class="cas-practice">Practice run · rewards return tomorrow</p>'}
    <div class="den-actions"><button class="den-gold" onclick="$('#modal').close();openCascade()">${denPlain}Play again</button><button class="duel-blue" onclick="$('#modal').close();showCascade()">${denPlain}Lobby</button></div></div>`);
  if (record && !quit) setTimeout(() => confettiBurst?.(), 300);
}
function confettiBurst() {
  const box = document.querySelector('#modal'); if (!box) return;
  for (let i = 0; i < 26; i++) { const b = document.createElement('i'); b.className = 'cas-confetti'; b.style.cssText = `left:${10 + Math.random() * 80}%;--dx:${(Math.random() - .5) * 220}px;--hue:${CASCADE_HUES[i % 7]};animation-delay:${Math.random() * .3}s`; box.appendChild(b); setTimeout(() => b.remove(), 1800); }
}
