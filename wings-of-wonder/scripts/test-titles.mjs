// Logic tests for the Titles (src/titles.js): grant once, achievements from the save, activate / wear, bonus, validation.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync('src/titles.js', 'utf8').split('// TITLES_UI')[0] + ';globalThis.T=Titles', ctx); const T = ctx.T;
let ok = 0; const t = (c, m) => { if (!c) throw Error('FAIL ' + m); ok++; };
const s = {};
t(T.status(s, 'meadow') === 'locked' && T.valid(undefined), 'fresh');
t(T.grant(s, 'meadow', 5) && !T.grant(s, 'meadow', 6) && T.status(s, 'meadow') === 'ready', 'granted once, activatable');
t(Object.keys(T.bonus(s)).length === 0, 'no stats before activation');
t(T.activate(s, 'meadow') && !T.activate(s, 'meadow') && T.status(s, 'meadow') === 'worn' && T.bonus(s).attack === 300 && T.bonus(s).health === 6000, 'activate: stats on, first one worn');
t(!T.activate(s, 'duel') && !T.wear(s, 'duel'), 'cannot activate or wear what she has not got');
s.dungeonWins = 50; s.pairsBest = 80; const got = T.check(s, 9).map(x => x.id); t(got.includes('slayer') && got.includes('harvester') && !got.includes('virtuoso') && T.check(s, 10).length === 0, 'achievements from the save, once');
T.activate(s, 'slayer'); t(T.wear(s, 'slayer') && s.titles.worn === 'slayer' && T.bonus(s).attack === 450 && T.wear(s, '') && s.titles.worn === '', 'wear / take off; all activated titles count');
t(T.valid(s.titles) && !T.valid({ got: { nope: 1 }, on: [], worn: '' }) && !T.valid({ got: {}, on: ['meadow'], worn: '' }) && !T.valid({ got: { meadow: 1 }, on: [], worn: 'meadow' }), 'validation');
t(T.cp(T.byId('meadow')) > 0 && new Set(T.list.map(x => x.id)).size === T.list.length, 'cp and unique ids');
console.log('Titles: ' + ok + ' checks passed');
