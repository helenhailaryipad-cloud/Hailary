// Harvest Pairs: tap two identical ingredients that a line with at most two turns can join.
// Six boards, each larger than the last; the clock runs from the first board to the last.
const Pairs = {
  // columns, rows, different ingredients
  stages: [[2, 2, 2], [4, 3, 3], [4, 4, 4], [6, 5, 5], [6, 6, 6], [6, 8, 8]],
  bonusSeconds: 90,
  kinds: 8,
  shuffled(list, rng = Math.random) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  // A board is a flat array of ingredient ids, -1 where a tile was collected.
  deal(stage, picks, rng = Math.random) {
    const [cols, rows, kinds] = this.stages[stage], cells = [];
    for (let i = 0; i < cols * rows / 2; i++) { const kind = picks[i % kinds]; cells.push(kind, kind); }
    const board = { cols, rows, cells: this.shuffled(cells, rng) };
    for (let tries = 0; tries < 50 && !this.solvable(board); tries++) board.cells = this.shuffled(board.cells, rng);
    return board;
  },
  at(board, x, y) {
    // Coordinates include a free ring around the tiles: x in 0..cols+1, y in 0..rows+1.
    if (x < 1 || y < 1 || x > board.cols || y > board.rows) return -1;
    return board.cells[(y - 1) * board.cols + (x - 1)];
  },
  // Shortest polyline from tile a to tile b through free cells with at most two turns, or null.
  path(board, a, b) {
    if (a === b || board.cells[a] < 0 || board.cells[a] !== board.cells[b]) return null;
    const point = i => [i % board.cols + 1, Math.floor(i / board.cols) + 1];
    const [ax, ay] = point(a), [bx, by] = point(b), W = board.cols + 2, H = board.rows + 2;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    // Breadth-first by number of turns: every straight run from a reached cell costs one segment.
    const seen = new Map([[ax + ',' + ay, null]]);
    let frontier = [[ax, ay]];
    for (let segment = 0; segment < 3 && frontier.length; segment++) {
      const next = [];
      for (const [fx, fy] of frontier) for (const [dx, dy] of dirs) {
        for (let x = fx + dx, y = fy + dy; x >= 0 && y >= 0 && x < W && y < H; x += dx, y += dy) {
          const target = x === bx && y === by;
          if (!target && this.at(board, x, y) >= 0) break;
          const key = x + ',' + y;
          if (!seen.has(key)) { seen.set(key, [fx, fy]); next.push([x, y]); }
          if (target) {
            const line = [[bx, by]];
            for (let from = seen.get(key); from; from = seen.get(from[0] + ',' + from[1])) line.push(from);
            return line.reverse();
          }
        }
      }
      frontier = next;
    }
    return null;
  },
  hint(board) {
    for (let a = 0; a < board.cells.length; a++) if (board.cells[a] >= 0)
      for (let b = a + 1; b < board.cells.length; b++) if (board.cells[b] === board.cells[a] && this.path(board, a, b)) return [a, b];
    return null;
  },
  left(board) { return board.cells.filter(kind => kind >= 0).length; },
  // Greedy play-through: true when the board can be cleared without a reshuffle.
  solvable(board) {
    const copy = { ...board, cells: board.cells.slice() };
    for (let move = this.hint(copy); move; move = this.hint(copy)) { copy.cells[move[0]] = -1; copy.cells[move[1]] = -1; }
    return this.left(copy) === 0;
  },
  // Rearrange the remaining tiles in place until a move exists.
  reshuffle(board, rng = Math.random) {
    const slots = board.cells.map((kind, i) => kind >= 0 ? i : -1).filter(i => i >= 0);
    for (let tries = 0; tries < 80; tries++) {
      const kinds = this.shuffled(slots.map(i => board.cells[i]), rng);
      slots.forEach((slot, i) => { board.cells[slot] = kinds[i]; });
      if (this.hint(board)) return true;
    }
    return false;
  },
  create(rng = Math.random) {
    const picks = this.shuffled([...Array(this.kinds).keys()], rng);
    return { kind: 'pairs', running: true, ended: false, stage: 0, picks, board: this.deal(0, picks, rng), picked: -1, time: 0, locked: true, rewarded: false };
  },
  // Returns what happened so the screen can animate it: null, {select}, or {line, a, b, cleared}.
  tap(g, index) {
    if (!g.running || g.ended || g.locked || g.board.cells[index] < 0) return null;
    if (g.picked === index) { g.picked = -1; return { select: -1 }; }
    const line = g.picked >= 0 ? this.path(g.board, g.picked, index) : null;
    if (!line) { g.picked = index; return { select: index }; }
    const a = g.picked; g.board.cells[a] = -1; g.board.cells[index] = -1; g.picked = -1;
    return { line, a, b: index, cleared: this.left(g.board) === 0 };
  },
  advance(g, rng = Math.random) {
    if (g.stage + 1 >= this.stages.length) { g.ended = true; g.running = false; return false; }
    g.stage++; g.board = this.deal(g.stage, g.picks, rng); g.picked = -1; return true;
  },
  reward(seconds) { return { gold: 300 + (seconds <= this.bonusSeconds ? 200 : 0), xp: 30 }; },
  // Two rewarded runs per UTC day; more runs are practice for a better time.
  dailyRuns: 2,
  hintPenalty: 3,
  day(now) { return new Date(now === undefined ? Date.now() : now).toISOString().slice(0, 10); },
  runsLeft(save, now) { const d = save.pairsDaily; return Math.max(0, this.dailyRuns - (d && d.day === this.day(now) ? d.runs : 0)); },
  useRun(save, now) { const today = this.day(now), d = save.pairsDaily; save.pairsDaily = { day: today, runs: (d && d.day === today ? d.runs : 0) + 1 }; },
  // Simulated rival times for the ranking board: fixed for one UTC day, between 1:05 and 2:19.
  rivals(names, now) {
    const today = this.day(now);
    return names.map(name => { let h = 2166136261; for (const ch of name + today) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0; return { name, seconds: 65 + h % 75, ai: true }; });
  },
  ranking(names, best, now) {
    const rows = this.rivals(names, now); if (best) rows.push({ name: 'You', seconds: best, you: true });
    return rows.sort((a, b) => a.seconds - b.seconds);
  },
  clock(seconds) { const s = Math.floor(seconds); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
};
const PAIRS_NAMES = ['Sun Peach', 'Moon Berries', 'Spotcap', 'Lucky Clover', 'Crystal Plum', 'Honey Acorn', 'Lotus Bud', 'Starfruit'];

// Lobby: host, rules, today's rewarded runs and the ranking board.
function showPairs() {
  const left = Pairs.runsLeft(S), best = S.pairsBest ? Pairs.clock(S.pairsBest) : '—';
  $('#main').innerHTML = `<section class="pairs-screen pairs-lobby">
    <img class="pairs-lobby-bg" src="${artPath('pairs-lobby')}" alt="">
    <h1>Harvest Pairs</h1>
    <img class="pairs-lobby-host" src="${reinaLookPath(false)}" alt="Reina">
    <div class="pairs-rules"><h2>Rules</h2><ol>
      <li>Tap two matching ingredients to collect them, one after the other or both at once with two fingers.</li>
      <li>A pair joins only along a line with no more than two turns.</li>
      <li>Clear ${Pairs.stages.length} baskets, each larger than the last, as fast as you can.</li>
      <li>Stuck? Tap Sprout for a hint. Each hint adds ${Pairs.hintPenalty} seconds.</li>
      <li>Reward: 300 gold and 30 XP, plus 200 gold under ${Pairs.clock(Pairs.bonusSeconds)}, for ${Pairs.dailyRuns} runs each day. Leaving a run does not use one.</li>
    </ol></div>
    <p class="pairs-runs">Rewarded runs today: <b>${left} / ${Pairs.dailyRuns}</b> · Best time <b>${best}</b></p>
    <button class="primary pairs-go" onclick="openPairsBoard()">Go challenge</button>
    <button class="pairs-rank" onclick="pairsRanking()"><img src="${artPath('hud-rank')}" alt=""><span>Rankings</span></button>
    <button class="pairs-exit" data-back onclick="go('games')" aria-label="Leave Harvest Pairs">‹</button>
  </section>`;
  preloadPairsArt();
}
function preloadPairsArt() { for (let n = 1; n <= Pairs.kinds; n++) { const image = new Image(); image.src = artPath('pairs-tile-' + n); image.decode?.().catch(() => {}); } }
function pairsRanking() {
  const rows = Pairs.ranking(ADVENTURERS.map(a => a.name), S.pairsBest);
  modal(`<p class="eyebrow">HARVEST PAIRS</p><h2>Today's best times</h2><ol class="pairs-ranking">${rows.map(r => `<li${r.you ? ' class="you"' : ''}><span>${esc(r.you ? S.name : r.name)}${r.ai ? ' <small>AI</small>' : ''}</span><b>${Pairs.clock(r.seconds)}</b></li>`).join('')}</ol><p><small>Rivals marked AI are simulated adventurers, not other players. Their times change each day.${S.pairsBest ? '' : ' Finish a run to enter the board.'}</small></p>`);
}
function openPairsBoard() { if (typeof screenChangedAt !== "undefined") screenChangedAt = Date.now();
  if (game?.running) return;
  $('#main').innerHTML = `<section class="pairs-screen">
    <div class="pairs-banner"><img class="pairs-cover" src="${artPath('pairs-cover')}" alt=""><img class="pairs-host" src="${reinaLookPath(false)}" alt="Reina"><h1>Harvest Pairs</h1></div>
    <div class="pairs-bar"><span>Stage <b id="pairsStage">1</b> / ${Pairs.stages.length}</span><span>Time <b id="pairsTime">0:00</b><i id="pairsPenalty" hidden>+${Pairs.hintPenalty}s</i></span></div>
    <div class="pairs-field"><div class="pairs-board" id="pairsBoard"></div><div class="pairs-panel" id="pairsPanel" hidden></div></div>
    <div class="pairs-foot"><button class="pairs-exit" data-back onclick="go('pairs')" aria-label="Back to the Harvest Pairs lobby">‹</button>
    <button class="pairs-hint" id="pairsHint" aria-label="Hint from Sprout, adds ${Pairs.hintPenalty} seconds"><img src="${artPath('pairs-sprout')}" alt="" draggable="false"></button></div>
  </section>`;
  startPairs();
}
// Effects: an energy bolt runs along the joining line, then both tiles burst into light and sparks.
const PAIRS_SVG = 'http://www.w3.org/2000/svg';
function pairsEnergy(svg, pts) {
  const g = document.createElementNS(PAIRS_SVG, 'g'), d = 'M' + pts.map(p => p.join(',')).join(' L');
  g.setAttribute('class', 'pairs-energy');
  for (const cls of ['glow', 'core']) { const l = document.createElementNS(PAIRS_SVG, 'path'); l.setAttribute('d', d); l.setAttribute('pathLength', '1'); l.setAttribute('class', cls); g.append(l); }
  const orb = document.createElementNS(PAIRS_SVG, 'circle'); orb.setAttribute('r', '.2'); orb.setAttribute('class', 'orb');
  const move = document.createElementNS(PAIRS_SVG, 'animateMotion'); move.setAttribute('dur', '.18s'); move.setAttribute('fill', 'freeze'); move.setAttribute('begin', 'indefinite'); move.setAttribute('path', d);
  orb.append(move); g.append(orb); svg.append(g); try { move.beginElement(); } catch { }
  return g;
}
function pairsBurst(board, tile, b) {
  const x = (+getComputedStyle(tile).getPropertyValue('--x') + .9) / (b.cols + .8) * 100, y = (+getComputedStyle(tile).getPropertyValue('--y') + .9) / (b.rows + .8) * 100;
  const fx = document.createElement('div'); fx.className = 'pairs-burst'; fx.style.left = x + '%'; fx.style.top = y + '%';
  fx.innerHTML = '<i class="flash"></i><i class="ring"></i>' + Array.from({ length: 10 }, (_, k) => `<i class="spark" style="--a:${k * 36 + Math.random() * 20}deg;--d:${.9 + Math.random() * .7}"></i>`).join('');
  board.append(fx); setTimeout(() => fx.remove(), 800);
}
function pairsShower(board) {
  const fx = document.createElement('div'); fx.className = 'pairs-shower';
  fx.innerHTML = '<i class="wave"></i>' + Array.from({ length: 28 }, (_, k) => `<i class="star" style="--a:${k * 360 / 28}deg;--d:${1 + Math.random()};--t:${Math.random() * .25}s"></i>`).join('') + '<b>Basket cleared!</b>';
  board.append(fx); setTimeout(() => fx.remove(), 1300);
}
function pairsConfetti(panel) {
  const hues = ['#ffe27a', '#9af07a', '#ff9ac8', '#8ad0ff', '#ffb35a', '#c8a6ff'];
  for (let i = 0; i < 36; i++) { const c = document.createElement('i'); c.className = 'pairs-confetti'; c.style.cssText = `left:${50 + (Math.random() - .5) * 30}%;--dx:${(Math.random() - .5) * 340}px;--dy:${-120 - Math.random() * 160}px;--hue:${hues[i % hues.length]};animation-delay:${Math.random() * .25}s`; panel.append(c); setTimeout(() => c.remove(), 2200); }
}
function startPairs() {
  if (game?.running || !$('#pairsBoard')) return;
  const g = game = Pairs.create(), board = $('#pairsBoard'), panel = $('#pairsPanel');
  let last = performance.now(), shown = '';
  const cell = (x, y) => [(x === 0 ? .2 : x > g.board.cols ? g.board.cols + .6 : x - .1), (y === 0 ? .2 : y > g.board.rows ? g.board.rows + .6 : y - .1)];
  function draw() {
    const { cols, rows, cells } = g.board;
    board.style.setProperty('--cols', cols); board.style.setProperty('--rows', rows);
    board.innerHTML = cells.map((kind, i) => kind < 0 ? '' : `<button class="pairs-tile" data-i="${i}" aria-pressed="${g.picked === i}" aria-label="${PAIRS_NAMES[kind]}" style="--x:${i % cols};--y:${Math.floor(i / cols)}"><i class="pairs-card"></i><img src="${artPath('pairs-tile-' + (kind + 1))}" alt="" draggable="false"></button>`).join('')
      + `<svg class="pairs-line" id="pairsLines" viewBox="0 0 ${cols + .8} ${rows + .8}" aria-hidden="true"></svg>`;
    $('#pairsStage').textContent = g.stage + 1;
  }
  // Before the first basket: 3-2-1. Between baskets: one short beat, so the pace is not broken.
  function countdown(n, beat = 450) {
    if (game !== g) return;
    g.locked = true; panel.hidden = false; panel.className = 'pairs-panel pairs-gate'; panel.parentElement.classList.add('gating');
    panel.innerHTML = g.stage ? `<small>Basket ${g.stage + 1} of ${Pairs.stages.length}</small>` : `<div class="pairs-dial"><i class="pairs-dial-ring"></i><b class="pairs-dial-n" key="${n}">${n}</b></div><small>Starting soon</small>`;
    if (n > 1) setTimeout(() => countdown(n - 1, beat), beat);
    else setTimeout(() => { if (game !== g) return; panel.hidden = true; panel.parentElement.classList.remove('gating'); g.locked = false; last = performance.now(); }, beat);
  }
  function finish() {
    if (g.rewarded) return; g.rewarded = true;
    const seconds = Math.round(g.time * 10) / 10, record = !S.pairsBest || seconds < S.pairsBest, paid = Pairs.runsLeft(S) > 0;
    if (record) S.pairsBest = seconds;
    if (typeof arcadeScore === 'function') arcadeScore('pairs', seconds);
    let prizeLine = 'Practice run · rewards return tomorrow';
    if (paid) { Pairs.useRun(S); const prize = Pairs.reward(seconds), got = gain(prize.gold, 0, prize.xp); prizeLine = `${uiIcon('gold')}${prize.gold} gold · ${uiIcon('exp')}${got.xp} XP`; } else save();
    panel.hidden = false; panel.className = 'pairs-panel pairs-done';
    setTimeout(() => pairsConfetti(panel), 250);
    panel.innerHTML = `<i class="pairs-rays"></i><small>${record ? 'NEW BEST TIME' : 'HARVEST COMPLETE'}</small><h2>${Pairs.clock(seconds)}</h2><p>Best time · ${Pairs.clock(S.pairsBest)}${g.hints ? ' · Hints used · ' + g.hints : ''}</p><p class="pairs-prize">${prizeLine}</p><button class="primary" onclick="startPairs()">Play again</button><button onclick="go('pairs')">Back to lobby</button>`;
  }
  // Short notes sit in the top bar, never over the tiles.
  function flash(text) { const note = $('#pairsPenalty'); note.textContent = text; note.hidden = false; clearTimeout(note.timer); note.timer = setTimeout(() => { note.hidden = true; }, 1100); }
  // Taps act on touch-down, and nothing waits for an animation: the pair is free the moment it
  // is matched, its tiles and the joining line just fade out on their own.
  function tapTile(tile) {
    const result = Pairs.tap(g, +tile.dataset.i); if (!result) return;
    board.querySelectorAll('.hinted').forEach(el => el.classList.remove('hinted'));
    if ('select' in result) { board.querySelectorAll('.pairs-tile[aria-pressed="true"]').forEach(el => el.setAttribute('aria-pressed', 'false')); if (result.select >= 0) tile.setAttribute('aria-pressed', 'true'); return; }
    const tiles = [result.a, result.b].map(i => board.querySelector(`.pairs-tile[data-i="${i}"]`));
    for (const el of tiles) { el.classList.add('matched'); el.removeAttribute('data-i'); el.disabled = true; }
    const line = pairsEnergy($('#pairsLines'), result.line.map(([x, y]) => cell(x, y)));
    const stage = g.stage;
    if (result.cleared) g.locked = true;
    setTimeout(() => { if (game === g) for (const el of tiles) pairsBurst(board, el, g.board); }, 170);
    if (result.cleared) setTimeout(() => { if (game === g) pairsShower(board); }, 300);
    setTimeout(() => {
      if (game !== g) return;
      if (result.cleared) { if (Pairs.advance(g)) { draw(); countdown(1, 500); } else { draw(); finish(); } return; }
      if (g.stage !== stage) return;
      for (const el of tiles) el.remove(); line.remove();
      if (!Pairs.hint(g.board)) { Pairs.reshuffle(g.board); flash('Shuffled'); draw(); }
    }, result.cleared ? 1100 : 480);
  }
  // Every finger counts: two tiles touched at the same moment with two fingers pair up at once.
  board.onpointerdown = event => { const tile = event.target.closest('.pairs-tile'); if (tile) { event.preventDefault(); tapTile(tile); } };
  board.onclick = event => { const tile = event.target.closest('.pairs-tile'); if (tile && event.detail === 0) tapTile(tile); };   // keyboard
  const hint = $('#pairsHint'), askHint = () => {
    if (game !== g || g.locked || g.ended) return;
    const move = Pairs.hint(g.board); if (!move) return;
    g.time += Pairs.hintPenalty; g.hints = (g.hints || 0) + 1; g.picked = -1;
    board.querySelectorAll('.pairs-tile').forEach(el => { el.setAttribute('aria-pressed', 'false'); el.classList.toggle('hinted', move.includes(+el.dataset.i)); });
    flash('+' + Pairs.hintPenalty + 's');
  };
  hint.onpointerdown = event => { event.preventDefault(); askHint(); };
  hint.onclick = event => { if (event.detail === 0) askHint(); };
  function frame(now) {
    if (game !== g || !board.isConnected) return;
    // The clock only runs while the board can be played; a hidden page does not count.
    if (!g.locked && !document.hidden && !g.ended) g.time += Math.min(.25, (now - last) / 1000);
    last = now;
    const text = Pairs.clock(g.time); if (text !== shown) { shown = text; $('#pairsTime').textContent = text; }
    if (!g.ended) loop = requestAnimationFrame(frame);
  }
  $('#pairsTime').textContent = '0:00'; draw(); countdown(3, 500); loop = requestAnimationFrame(frame);
}
