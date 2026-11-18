// Harvest Pairs: tap two identical ingredients that a line with at most two turns can join.
// Five boards, each larger than the last; the clock runs from the first board to the last.
const Pairs = {
  // columns, rows, different ingredients
  stages: [[2, 2, 2], [4, 3, 3], [4, 4, 4], [6, 5, 5], [6, 6, 6]],
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
  reward(seconds) { return { gold: 300 + (seconds <= 60 ? 200 : 0), xp: 30 }; },
  clock(seconds) { const s = Math.floor(seconds); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
};
const PAIRS_NAMES = ['Sun Peach', 'Moon Berries', 'Spotcap', 'Lucky Clover', 'Crystal Plum', 'Honey Acorn', 'Lotus Bud', 'Starfruit'];

function showPairs() {
  const best = S.pairsBest ? Pairs.clock(S.pairsBest) : '—';
  $('#main').innerHTML = `<section class="pairs-screen">
    <div class="pairs-banner"><img class="pairs-cover" src="${artPath('pairs-cover')}" alt=""><img class="pairs-host" src="${reinaLookPath(false)}" alt="Reina"><h1>Harvest Pairs</h1></div>
    <div class="pairs-bar"><span>Stage <b id="pairsStage">1</b> / ${Pairs.stages.length}</span><span>Time <b id="pairsTime">0:00</b></span></div>
    <div class="pairs-field"><div class="pairs-board" id="pairsBoard"></div>
      <div class="pairs-panel" id="pairsPanel"><h2>Harvest Pairs</h2>
        <p>Tap two matching ingredients to collect them. They must be joined by a line with no more than two turns.</p>
        <p>Clear all five baskets as fast as you can.</p>
        <p class="pairs-prize">${uiIcon('gold')}300 gold · ${uiIcon('exp')}30 XP · +200 gold under one minute</p>
        <small>Best time · ${best}</small>
        <button class="primary" onclick="startPairs()">Start</button></div></div>
    <button class="pairs-exit" onclick="go('games')" aria-label="Leave Harvest Pairs">‹</button>
  </section>`;
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
      + `<svg class="pairs-line" viewBox="0 0 ${cols + .8} ${rows + .8}" aria-hidden="true"><polyline id="pairsLine" points=""></polyline></svg>`;
    $('#pairsStage').textContent = g.stage + 1;
  }
  function countdown(n) {
    if (game !== g) return;
    g.locked = true; panel.hidden = false;
    panel.innerHTML = `<small>${g.stage ? 'Basket cleared' : 'Get ready'}</small><strong class="pairs-count">${n}</strong>`;
    if (n > 1) setTimeout(() => countdown(n - 1), 600);
    else setTimeout(() => { if (game !== g) return; panel.hidden = true; g.locked = false; last = performance.now(); }, 600);
  }
  function finish() {
    if (g.rewarded) return; g.rewarded = true;
    const seconds = Math.round(g.time * 10) / 10, prize = Pairs.reward(seconds), record = !S.pairsBest || seconds < S.pairsBest;
    if (record) S.pairsBest = seconds;
    const got = gain(prize.gold, 0, prize.xp);
    panel.hidden = false;
    panel.innerHTML = `<small>${record ? 'NEW BEST TIME' : 'HARVEST COMPLETE'}</small><h2>${Pairs.clock(seconds)}</h2><p>Best time · ${Pairs.clock(S.pairsBest)}</p><p class="pairs-prize">${uiIcon('gold')}${prize.gold} gold · ${uiIcon('exp')}${got.xp} XP</p><button class="primary" onclick="startPairs()">Play again</button><button onclick="go('games')">Mini Games</button>`;
  }
  board.onclick = event => {
    const tile = event.target.closest('.pairs-tile'); if (!tile) return;
    const result = Pairs.tap(g, +tile.dataset.i); if (!result) return;
    if ('select' in result) { board.querySelectorAll('.pairs-tile').forEach(el => el.setAttribute('aria-pressed', +el.dataset.i === result.select)); return; }
    // Show both tiles joined, then collect them.
    g.locked = true;
    for (const i of [result.a, result.b]) board.querySelector(`[data-i="${i}"]`)?.classList.add('matched');
    $('#pairsLine').setAttribute('points', result.line.map(([x, y]) => cell(x, y).join(',')).join(' '));
    setTimeout(() => {
      if (game !== g) return;
      if (result.cleared) {
        if (Pairs.advance(g)) { draw(); countdown(2); } else { draw(); finish(); }
        return;
      }
      if (!Pairs.hint(g.board)) { Pairs.reshuffle(g.board); toast('No moves left · ingredients shuffled'); }
      draw(); g.locked = false;
    }, 260);
  };
  function frame(now) {
    if (game !== g || !board.isConnected) return;
    // The clock only runs while the board can be played; a hidden page does not count.
    if (!g.locked && !document.hidden && !g.ended) g.time += Math.min(.25, (now - last) / 1000);
    last = now;
    const text = Pairs.clock(g.time); if (text !== shown) { shown = text; $('#pairsTime').textContent = text; }
    if (!g.ended) loop = requestAnimationFrame(frame);
  }
  $('#pairsTime').textContent = '0:00'; draw(); countdown(3); loop = requestAnimationFrame(frame);
}
