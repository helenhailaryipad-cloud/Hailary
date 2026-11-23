import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});
vm.runInContext(fs.readFileSync('src/rites.js','utf8').split('\n// RITES_UI')[0]+';globalThis.R=Rites',context);
vm.runInContext(fs.readFileSync('src/trail.js','utf8').split('\n// TRAIL_UI')[0]+';globalThis.T=Trail',context);const T=context.T,R=context.R;
const T0=Date.UTC(2026,10,23,10),day=864e5;
// Counters and the daily reset.
const s={gold:0,scales:0};T.tick(s,'dungeon',1,T0);T.tick(s,'nope',5,T0);assert.equal(s.trail.c.dungeon,1);assert.equal(s.trail.c.nope,undefined);
assert.equal(T.claim(s,'dungeon','s',T0),null,'not done yet');T.tick(s,'dungeon',1,T0);assert.ok(T.done(s,'dungeon',T0));
// Silver claim: Wayfarer EXP, rite tickets of the running rite, prisms, gold; once only.
const r=T.claim(s,'dungeon','s',T0);assert.equal(r.exp,100);assert.equal(s.trail.exp,100);assert.equal(s.gold,1000);assert.equal(R.tickets(s,R.rite(R.period(T0)).id),R.welcome+30);
assert.equal(T.claim(s,'dungeon','s',T0),null,'once');
// Gold and Diamond need the month's pass.
assert.equal(T.claim(s,'dungeon','g',T0),null);s.scales=5000;assert.ok(T.buyPass(s,'g',T0));assert.equal(s.scales,5000-680);assert.ok(T.claim(s,'dungeon','g',T0));assert.equal(s.bag.stonebag,1);
assert.equal(T.buyPass(s,'g',T0),false,'bought once');
// Ready count, claim all, milestones.
for(const [k,,n] of T.quests)T.tick(s,k,n,T0);assert.ok(T.ready(s,T0)>=11+11);const all=T.claimAll(s,'s',T0);assert.equal(all.length,11);assert.equal(s.trail.exp,1200);
assert.ok(T.milestone(s,0,T0));assert.equal(T.milestone(s,0,T0),null);assert.equal(T.milestone(s,1,T0),null,'1500 not reached');
// Next day: counters and claims reset, EXP and passes stay; next month: EXP, milestones and passes reset.
T.state(s,T0+day);assert.deepEqual(JSON.parse(JSON.stringify(s.trail.c)),{});assert.equal(s.trail.exp,1200);assert.ok(T.hasPass(s,'g',T0+day));
T.state(s,Date.UTC(2026,11,1,1));assert.equal(s.trail.exp,0);assert.ok(!T.hasPass(s,'g',Date.UTC(2026,11,1,1)));
// Validation.
assert.ok(T.valid(s.trail));assert.ok(!T.valid({...s.trail,c:{zzz:1}}));assert.ok(!T.valid({...s.trail,ms:[99]}));assert.ok(!T.valid({...s.trail,pass:{x:true}}));
console.log('PASS Trail: counters and daily reset, Silver claim with EXP and rite tickets, passes for Gold / Diamond, claim all, milestones, monthly season, validation');
