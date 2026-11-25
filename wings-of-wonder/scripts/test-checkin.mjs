// Logic tests for Daily Blessings (src/checkin.js): one claim a day, milestones, pass doubling, new cycle, validation.
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = vm.createContext({}); vm.runInContext(fs.readFileSync('src/checkin.js', 'utf8').split('// CHECKIN_UI')[0] + ';globalThis.B=Blessings', ctx);
const B = ctx.B; let ok = 0; const t = (c, m) => { if (!c) throw Error('FAIL ' + m); ok++; };
t(B.days.length === B.cycleDays, '30 calendar days');
const T = B.anchor + 3 * 864e5 + 3600e3, s = { scales: 1000 };
let r = B.claim(s, T); t(r && r.day === 1 && r.give.stam === 2, 'day 1 claimed'); t(B.claim(s, T + 1000) === null, 'once a day');
r = B.claim(s, T + 864e5); t(r.day === 2 && r.give.gold === 2000, 'next day continues the calendar');
t(B.milestone(s, 2, T + 864e5).give.wish === 2 && B.milestone(s, 2, T + 864e5) === null && B.milestone(s, 7, T + 864e5) === null, 'milestone once, only when reached');
const p = B.buyPass(s, T + 864e5); t(p.ok && p.give.gold === 2000 && s.scales === 1000 - B.passPrice && !B.buyPass(s, T + 864e5).ok, 'pass pays claimed marked days once');
for (let d = 2; d < 6; d++) B.claim(s, T + d * 864e5); t(s.blessings.n === 6, 'six days');
t(B.valid(s.blessings) && B.valid(undefined) && !B.valid({ ...s.blessings, n: 31 }) && !B.valid({ ...s.blessings, got: [3] }), 'validation');
const v2 = B.state(s, B.ends(B.cycle(T)) + 10); t(v2.n === 0 && !v2.pass && v2.got.length === 0, 'new cycle starts fresh');
console.log('Daily Blessings:', ok, 'checks passed');
