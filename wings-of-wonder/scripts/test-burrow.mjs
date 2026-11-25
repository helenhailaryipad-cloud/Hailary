// Logic tests for Burrow Blitz (src/burrow.js): spawning, taps, freeze, streak, clock, rewards, daily roll.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync('src/burrow.js', 'utf8').split('// BURROW_UI')[0] + ';globalThis.Burrow=Burrow', ctx);
const B = ctx.Burrow; let ok = 0; const t = (c, m) => { if (!c) throw Error('FAIL ' + m); ok++; };
let seed = 7; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
let g = B.create(rng), shown = 0, ended = false;
for (let i = 0; i < 2000 && !ended; i++) for (const e of B.step(g, .05, rng)) { if (e.type === 'show') shown++; if (e.type === 'end') ended = true; }
t(ended && g.left === 0 && g.ended, 'run ends when the clock is out'); t(shown > 60 && shown < 220, 'critters appear at a sane pace: ' + shown);
t(B.critters.length === 8 && B.critters.filter(c => c.bad).length === 4, 'eight critters, four frost');
// taps
g = B.create(rng); g.up = [{ id: 1, hole: 3, kind: 0, age: .1, stay: 1, hit: false }, { id: 2, hole: 4, kind: 4, age: .1, stay: 1, hit: false }, { id: 3, hole: 5, kind: 2, age: .1, stay: 1, hit: false }];
let r = B.tap(g, 3); t(r.good && r.pts === 2 && g.score === 2 && g.combo === 1, 'friendly tap scores');
t(B.tap(g, 3) === null, 'a tapped critter cannot be tapped twice'); t(B.tap(g, 7) === null, 'an empty burrow does nothing');
r = B.tap(g, 5); t(r.time === 4 && g.left === B.length + 4, 'Sunbloom adds time');
r = B.tap(g, 4); t(r.bad && g.frozen === B.freeze && g.combo === 0 && r.lost === 2, 'frost critter freezes and breaks the streak');
g.up.push({ id: 4, hole: 6, kind: 1, age: 0, stay: 1, hit: false }); t(B.tap(g, 6) === null, 'no taps while frozen');
B.step(g, B.freeze + .01, () => .99); t(g.frozen === 0, 'freeze wears off');
t(B.mult(7) === 1 && B.mult(8) === 2 && B.mult(32) === 5 && B.mult(99) === 5, 'streak multiplier');
g = B.create(rng); g.combo = 5; g.lastHit = 0; const ev = B.step(g, B.comboWindow + .1, () => .99); t(g.combo === 0 && ev.some(e => e.type === 'break'), 'streak breaks after the window');
// rewards and day
t(B.pointReward(750).from === 700 && B.pointReward(450).from === 400 && B.pointReward(0).from === 0, 'point brackets');
t(B.rankReward(1).label === 'No.1' && B.rankReward(2).to === 3 && B.rankReward(50).to > 1e6, 'rank brackets');
const names = Array.from({ length: 40 }, (_, i) => 'AI' + i), day = '2026-11-25';
const f = B.field(day, names); t(f.length === 40 && f.every((x, i) => !i || x.score <= f[i - 1].score), 'field sorted');
t(B.field(day, names, .1).length < 10, 'AI finish through the day'); t(B.rankOf(day, names, 99999) === 1 && B.rankOf(day, names, 1) === 41, 'rank');
const now = Date.parse('2026-11-25T10:00:00Z'); let { v, due } = B.roll(undefined, now); t(v.day === day && !due && B.runsLeft(v) === 1, 'fresh day');
v.runs = 1; v.best = 800; v.all = 800; t(B.runsLeft(v) === 0 && B.canBuy(v), 'attempt used, extra can be bought'); v.extra = 1; t(B.runsLeft(v) === 1 && !B.canBuy(v), 'extra attempt');
t(B.valid(v) && B.valid(undefined) && !B.valid({ ...v, extra: 2 }) && !B.valid({ ...v, best: 900 }) && !B.valid({ ...v, day: 'x' }), 'validation');
({ v, due } = B.roll(v, now + 864e5, names)); t(due && due.best === 800 && due.reward && v.best === 0 && v.runs === 0 && v.all === 800, 'next day pays the ranking once');
t(B.roll(v, now + 864e5 + 1000, names).due === null, 'paid only once');
console.log('Burrow Blitz:', ok, 'checks passed');
