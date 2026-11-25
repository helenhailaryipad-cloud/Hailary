// Logic tests for the Wishwell (src/wishwell.js on top of src/rites.js): coins, goals (tickets of the next rite), tasks, market, validation.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync('src/rites.js', 'utf8').split('// RITES_UI')[0] + ';' + fs.readFileSync('src/wishwell.js', 'utf8').split('// WISHWELL_UI')[0] + ';globalThis.R=Rites;globalThis.W=Wishwell', ctx);
const R = ctx.R, W = ctx.W; let ok = 0; const t = (c, m) => { if (!c) throw Error('FAIL ' + m); ok++; };
let seed = 3; const rng = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const T0 = R.anchor + 2 * 864e5, s = {};
const cur = R.rite(R.period(T0)), next = R.rite(R.period(T0) + 1);
s.rites = undefined; R.state(s, T0); s.rites.t[cur.id] = 10000;
const v0 = W.state(s, T0); t(v0.coins === 0 && W.due(s, T0) === 0, 'fresh well');
t(R.pull(s, 10, rng, T0).ok !== false, 'ten pulls'); let v = W.state(s, T0); t(v.coins === 10 && v.dayPulls === 10, 'a coin per pull, today counted');
t(W.claimTask(s, 'p10', T0) === 30 && v.coins === 40 && W.claimTask(s, 'p10', T0) === 0 && W.claimTask(s, 'p30', T0) === 0, 'tasks pay once, need their goal');
R.pull(s, 1, rng, T0, true); t(W.claimTask(s, 'free', T0) === 10, 'free pull task');
t(W.due(s, T0) === 0 && W.goalState(s, 15, T0) === 'open', 'no goal before 15 pulls');
R.pull(s, 1, rng, T0); R.pull(s, 1, rng, T0); R.pull(s, 1, rng, T0); R.pull(s, 1, rng, T0); // 15 pulls in all (10 + free + 4)
t(W.goalState(s, 15, T0) === 'ready' && W.due(s, T0) === 400, 'goal 15 ready, tickets of the next rite waiting');
const n0 = R.tickets(s, next.id); t(W.claimGoal(s, 15, T0) === 400 && R.tickets(s, next.id) === n0 + 400 && W.claimGoal(s, 15, T0) === 0, 'claimed once, by hand');
R.pull(s, 10, rng, T0); R.pull(s, 10, rng, T0); t(W.due(s, T0) === 740, 'goal 30 reached, waits for a claim (nothing paid automatically)');
const before = R.tickets(s, next.id), T1 = R.ends(R.period(T0)) + 1000;
t(W.leftover(s, T1).length === 1 && W.due(s, T1) === 740, 'unclaimed goal of the finished rite waits in the well');
const c = W.claimAll(s, T1); t(c.cur === 740 && R.tickets(s, next.id) === before + 740 && W.due(s, T1) === 0 && W.claimAll(s, T1).cur === 0, 'claimed once in the next rite');
v = W.state(s, T1); t(v.dayPulls === 0 || v.day !== W.day(T0), 'new day resets tasks');
s.wishwell.coins = 1000; t(W.buy(s, 'next', T1).ok && W.left(s, W.wares[0], T1) === W.wares[0].limit - 1, 'market buy with limits');
for (let i = 0; i < 20; i++) W.buy(s, 'next', T1); t(W.left(s, W.wares[0], T1) === 0 && !W.buy(s, 'next', T1).ok, 'sold out');
t(W.buy(s, 'orb', T1).ok, 'orb ware');
t(W.valid(s.wishwell) && W.valid(undefined) && !W.valid({ ...s.wishwell, coins: -1 }) && !W.valid({ ...s.wishwell, done: ['nope'] }) && R.valid(s.rites), 'validation');
// Altar tiers, values, record, auto-purchase (Star Rites)
const s2 = {}, T2 = R.anchor + 864e5; R.state(s2, T2); const rt = R.rite(R.period(T2)); s2.rites.t[rt.id] = 6000;
for (let i = 0; i < 6; i++) R.pull(s2, 10, rng, T2);
t(R.tierOpen(s2, 'ord', T2) === 1 && R.tierOpen(s2, 'rare', T2) === 0, 'a selection every 60 pulls');
const got = R.tierTake(s2, 'ord', 0, rng, T2); t(got && R.tierOpen(s2, 'ord', T2) === 0 && R.tierLeft(s2, 'ord', 0, T2) === R.tiers[2].items[0][3] - 1 && R.tierTake(s2, 'ord', 0, rng, T2) === null, 'selection taken once, limit counted');
t(s2.rites.log.length === 50 && R.value({ kind: 'wings' }) > R.value({ kind: 'item', id: 'exp1' }), 'record and values');
s2.rites.t[rt.id] = 0; s2.scales = 600; s2.rites.auto = true; const pr = R.pull(s2, 10, rng, T2); t(pr.ok && s2.scales === 100 && pr.value > 0, 'auto-purchase with prisms');
t(R.valid(s2.rites), 'rites still valid');
const s3 = { scales: 0, owned: [] }, T3 = R.anchor + 864e5; R.state(s3, T3); const pid = R.featuredPet(R.period(T3));
const g3 = R.cashGrant(s3, 1, T3); t(g3 && s3.scales === 300 && s3.owned.includes(pid) && s3.petSpares[pid] === 3 && R.cashGrant(s3, 1, T3) === null, 'prism pack: prisms, tickets, pet copies, once per rite');
t(R.packs.length === 10 && R.packs[9] === 500 && R.valid(s3.rites), 'ten ticket packs 50..500');
console.log('Wishwell:', ok, 'checks passed');
