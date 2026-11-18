import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync('src/jungle.js','utf8')+';globalThis.T=Trek',context);const T=context.T;
let g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:0,z:.8,hp:6,kind:0}];T.step(g,.05,()=>.5);assert.equal(g.score,50);assert.equal(g.foes.length,0);
g=T.create();g.paused=true;T.step(g,.05);assert.equal(g.time,0);g.paused=false;g.shield=5;T.hit(g);assert.equal(g.hp,3);assert.equal(g.shield,0);T.hit(g);assert.equal(g.hp,3);g.hurt=0;T.hit(g);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;g.drops=[{x:0,z:.84,kind:'wings'}];T.step(g,.01);assert.equal(g.boost,9);assert.equal(g.drops.length,0);
g=T.create();g.row=999;g.hazardAt=999;g.hazards=[{x:0,age:0}];for(let i=0;i<30;i++)T.step(g,.05);assert.equal(g.hp,3);for(let i=0;i<4;i++)T.step(g,.05);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;g.time=89.99;T.step(g,.02);assert.equal(g.ended,true);assert.equal(g.time,90);T.step(g,.05);assert.equal(g.time,90);
g=T.create();for(let i=0;i<1800&&g.running;i++){g.target=Math.sin(i*.03);T.step(g,.05,()=>.5);assert.ok(g.foes.length<40);assert.ok(g.bolts.length<60);assert.ok(Number.isFinite(g.x))}assert.ok(g.ended);// Arrows aim at the nearest barrel, even one lane over; a Boom barrel warns, then charges, and breaking it calls the charge off.
g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:.62,z:.5,hp:6,kind:0},{x:-1.24,z:.1,hp:60,kind:0}];assert.equal(T.aim(g).x,.62);for(let i=0;i<12&&g.score===0;i++)T.step(g,.05,()=>.5);assert.equal(g.score,50);
g=T.create();g.row=999;g.shot=999;g.hazardAt=0;g.foes=[{x:0,z:.3,hp:900,kind:0}];T.step(g,.05,()=>.5);assert.ok(g.foes[0].boom);assert.equal(g.hazards[0].x,0);
for(let i=0;i<30;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,3);assert.ok(!g.foes[0].dash);for(let i=0;i<6;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,2);assert.ok(g.foes.length===0||g.foes[0].dash);
g=T.create();g.row=999;g.shot=999;g.hazardAt=0;g.foes=[{x:0,z:.3,hp:900,kind:0}];T.step(g,.05,()=>.5);g.foes[0].dead=true;for(let i=0;i<50;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,3);assert.equal(g.hazards.length,0);
// Five lanes; a fire lane with no barrel snaps to the lane Reina stands in.
assert.equal(T.lanes.length,5);assert.equal(T.lane(.4),.62);assert.equal(T.lane(-2),-1.24);
// Live ranking: rivals are fixed for a day, earn their score over the run, and the gap is to the leader.
{const day=Date.UTC(2026,10,18,12),r=T.rivals(['Nyra','Kael','Pip'],day);assert.deepEqual(r.map(x=>x.final),T.rivals(['Nyra','Kael','Pip'],day+3600000).map(x=>x.final));
 assert.ok(r.every(x=>x.final>=1500&&x.final<=3500&&x.final%50===0));
 const start=T.standing(r,0,0);assert.equal(start.rank,1);assert.equal(start.gap,0);
 const end=T.standing(r,0,90);assert.equal(end.rank,4);assert.equal(end.gap,Math.max(...r.map(x=>x.final)));
 const top=T.standing(r,99999,90);assert.equal(top.rank,1);assert.equal(top.gap,0);assert.equal(top.of,4);}
console.log('PASS Jungle: swept hits, shield, invulnerability, buffs, hazard warning, aimed shots, Boom charge, timer, bounded simulation');
