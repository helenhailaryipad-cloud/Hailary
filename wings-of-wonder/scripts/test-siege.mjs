import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});vm.runInContext(fs.readFileSync('src/siege.js','utf8').split('\n// SIEGE_UI')[0]+';globalThis.G=Siege',context);const G=context.G;
let seed=3;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;const T0=G.anchor+3600e3;
const {v}=G.roll(undefined,T0,500);assert.ok(G.valid(v));assert.equal(v.base,500);
// Defenders are stable for the week, castellans are stronger than guards.
const d0=G.defender(v,2,0),d1=G.defender(v,2,1);assert.equal(JSON.stringify(G.defender(v,2,0)),JSON.stringify(d0));assert.ok(d0.cp>d1.cp);assert.equal(d0.pets.length,5);
// An attack takes HP, scores points, rests the pets for the day.
const team=[{id:'d0',atk:300},{id:'d4',atk:200}];const r=G.attack(v,2,1,team,T0,rng);
assert.ok(r.ok&&r.dmg>0);assert.equal(v.points,r.pts);assert.equal(v.hp['2:1'],100-r.dmg);assert.equal(v.tries['2:1'],1);
assert.equal(G.attack(v,2,1,[{id:'d0',atk:300}],T0,rng).err,'used','a pet attacks once a day');
assert.equal(G.attack(v,2,1,Array.from({length:6},(_,i)=>({id:'x'+i,atk:1})),T0,rng).err,'team');
// Breaking a defender gives the bonus; a broken defender cannot be attacked.
const b=G.attack(v,3,2,[{id:'d9',atk:1e6}],T0,rng);assert.ok(b.broke);assert.equal(b.pts,b.dmg+G.breakBonus);assert.equal(G.attack(v,3,2,[{id:'d10',atk:5}],T0,rng).err,'broken');
assert.equal(G.cityLeft(v,3),4);
// Quests and point rewards.
assert.ok(G.claimQuest(v,'attack'));assert.equal(G.claimQuest(v,'attack'),null);assert.ok(G.claimQuest(v,'break'));
v.points=120;assert.ok(G.claimPoint(v,0));assert.ok(G.claimPoint(v,1));assert.equal(G.claimPoint(v,2),null);
// Next UTC day: pets rest no more, quests reset, HP stays.
const n=G.roll(v,T0+864e5,500).v;assert.equal(n.used.length,0);assert.equal(n.qdone.length,0);assert.equal(n.hp['3:2'],0);
// Event end pays the ranking and starts fresh.
const e=G.roll(v,G.ends(v.period)+1000,500);assert.equal(e.v.points,0);assert.ok(e.due&&e.due.rank>=1);assert.ok(G.valid(e.v));
assert.ok(e.due.faction>=1&&e.due.faction<=4&&Object.keys(e.due.give).length>0,'end pays the faction place');
// A new UTC day settles yesterday's faction battle once: a win or a loss reward.
const dd=G.roll(v,T0+864e5,500);assert.ok(dd.daily&&(dd.daily.give===G.daily.win||dd.daily.give===G.daily.lose));assert.equal(G.roll(dd.v,T0+864e5+60e3,500).daily,null);
// Higher faction place, larger personal reward; four factions ranked 1-4.
assert.ok(G.scaled({chest2:2},1).chest2>G.scaled({chest2:2},4).chest2);assert.equal(G.factionPoints(100,v.period,T0+864e5).map(f=>f.rank).join(),'1,2,3,4');
assert.ok(!G.valid({...v,hp:{'9:9':5}}));assert.ok(G.field(v.period,T0+5*864e5).every(x=>x.ai));
console.log('PASS Siege: defenders, attacks and points, daily pet rest, breaks and bonus, quests, point rewards, day roll, event end, faction place and daily battle rewards, validation');
