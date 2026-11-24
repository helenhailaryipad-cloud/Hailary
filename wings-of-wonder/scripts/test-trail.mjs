import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});
vm.runInContext(fs.readFileSync('src/rites.js','utf8').split('\n// RITES_UI')[0]+';globalThis.R=Rites',context);
vm.runInContext(fs.readFileSync('src/trail.js','utf8').split('\n// TRAIL_UI')[0]+';globalThis.T=Trail',context);const T=context.T,R=context.R;
const T0=Date.UTC(2026,10,23,10),day=864e5;
// One counter per task; each tab has its own goal (Silver lowest, Diamond highest) and its own claim.
const s={gold:0,scales:0};T.tick(s,'dungeon',1,T0);T.tick(s,'nope',5,T0);assert.equal(s.trail.c.dungeon,1);assert.equal(s.trail.c.nope,undefined);
assert.ok(T.goal('s','dungeon')<T.goal('g','dungeon')&&T.goal('g','dungeon')<T.goal('d','dungeon'));
assert.equal(T.claim(s,'dungeon','s',T0),null);T.tick(s,'dungeon',1,T0);assert.ok(T.done(s,'dungeon','s',T0));assert.ok(!T.done(s,'dungeon','g',T0));
const r=T.claim(s,'dungeon','s',T0);assert.equal(r.exp,100);assert.equal(s.gold,1000);assert.equal(R.tickets(s,R.rite(R.period(T0)).id),R.welcome+30);
assert.equal(T.claim(s,'dungeon','s',T0),null,'once');assert.equal(T.claim(s,'dungeon','g',T0),null,'gold goal not met');
T.tick(s,'dungeon',1,T0);assert.ok(T.claim(s,'dungeon','g',T0),'gold tab is free, no pass');T.tick(s,'dungeon',2,T0);assert.ok(T.claim(s,'dungeon','d',T0));assert.equal(s.bag.stonebag,1);
// Tasks only in some tabs.
assert.equal(T.goal('d','guildsign'),0);assert.ok(T.list('s').length>T.list('d').length);assert.equal(T.claim(s,'guildsign','d',T0),null);
// Claim all and the daily chest track.
for(const [k] of T.kinds)T.tick(s,k,1e6,T0);const n=T.readyIn(s,'s',T0);assert.equal(T.claimAll(s,'s',T0).length,n);
T.claimAll(s,'g',T0);T.claimAll(s,'d',T0);assert.ok(s.trail.exp>=5000,'all three tabs fill the day track: '+s.trail.exp);
assert.ok(T.milestone(s,0,T0));assert.equal(T.milestone(s,0,T0),null);assert.equal(R.vouchers(s),20);
// Next day: counters, claims, EXP and chests reset.
T.state(s,T0+day);assert.deepEqual(JSON.parse(JSON.stringify(s.trail.c)),{});assert.equal(s.trail.exp,0);assert.equal(s.trail.ms.length,0);
// Old saves with a bought pass still load.
assert.ok(T.valid({...s.trail,pass:{g:true}}));assert.ok(T.valid(s.trail));assert.ok(!T.valid({...s.trail,c:{zzz:1}}));assert.ok(!T.valid({...s.trail,ms:[99]}));
console.log('PASS Trail: one counter, three free tabs with rising goals, claims, claim all, daily chest track and reset, old pass saves load');
