import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync('src/jungle.js','utf8')+';globalThis.T=Trek',context);const T=context.T;
let g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:0,z:.8,hp:6,kind:0}];T.step(g,.05,()=>.5);assert.equal(g.score,50);assert.equal(g.foes.length,0);
g=T.create();g.paused=true;T.step(g,.05);assert.equal(g.time,0);g.paused=false;g.shield=5;T.hit(g);assert.equal(g.hp,3);assert.equal(g.shield,0);T.hit(g);assert.equal(g.hp,3);g.hurt=0;T.hit(g);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;g.drops=[{x:0,z:.84,kind:'wings'}];T.step(g,.01);assert.equal(g.boost,9);assert.equal(g.drops.length,0);
g=T.create();g.row=999;g.hazardAt=999;g.hazards=[{x:0,age:0}];for(let i=0;i<30;i++)T.step(g,.05);assert.equal(g.hp,3);for(let i=0;i<4;i++)T.step(g,.05);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;assert.equal(T.length,63);g.time=62.99;T.step(g,.02);assert.equal(g.ended,true);assert.equal(g.time,63);T.step(g,.05);assert.equal(g.time,63);
g=T.create();for(let i=0;i<1800&&g.running;i++){g.target=Math.sin(i*.03);T.step(g,.05,()=>.5);assert.ok(g.foes.length<40);assert.ok(g.bolts.length<60);assert.ok(Number.isFinite(g.x))}assert.ok(g.ended);// Arrows aim at the nearest barrel, even one lane over; a Boom barrel warns, then charges, and breaking it calls the charge off.
g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:.62,z:.5,hp:6,kind:0},{x:-1.24,z:.1,hp:60,kind:0}];assert.equal(T.aim(g).x,.62);for(let i=0;i<12&&g.score===0;i++)T.step(g,.05,()=>.5);assert.equal(g.score,50);
g=T.create();g.row=999;g.shot=999;g.hazardAt=0;g.foes=[{x:0,z:.3,hp:900,kind:0}];T.step(g,.05,()=>.5);assert.ok(g.foes[0].boom);assert.equal(g.hazards[0].x,0);
for(let i=0;i<30;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,3);assert.ok(!g.foes[0].dash);for(let i=0;i<6;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,2);assert.ok(g.foes.length===0||g.foes[0].dash);
g=T.create();g.row=999;g.shot=999;g.hazardAt=0;g.foes=[{x:0,z:.3,hp:900,kind:0}];T.step(g,.05,()=>.5);g.foes[0].dead=true;for(let i=0;i<50;i++)T.step(g,.05,()=>.5);assert.equal(g.hp,3);assert.equal(g.hazards.length,0);
// Hit feedback: an arrow that lands leaves a pop and jolts the barrel; a hit on Reina shakes the view; a kill shows +50.
g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:0,z:.8,hp:60,kind:0}];T.step(g,.05,()=>.5);assert.ok(g.pops.length>=1&&g.foes[0].flash>0);for(let i=0;i<10;i++)T.step(g,.05,()=>.5);assert.ok(g.pops.length<=40);
g=T.create();T.hit(g);assert.ok(g.shake>0&&g.hitFlash>0&&g.texts.some(t=>t.text==='−1 ♥'));g=T.create();g.shield=5;T.hit(g);assert.ok(g.shake>0&&g.hp===3&&g.texts.some(t=>t.text==='Blocked!'));
g=T.create();g.foes=[{x:0,z:.5,hp:1}];T.damage(g,g.foes[0],5);assert.ok(g.texts.some(t=>t.text==='+50'&&t.small)&&g.pops.some(e=>e.big));
// Five lanes; a fire lane with no barrel snaps to the lane Reina stands in.
assert.equal(T.lanes.length,5);assert.equal(T.lane(.4),.62);assert.equal(T.lane(-2),-1.24);
// Bonuses are picked up anywhere on her figure, not only at her centre; far ones are not.
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;g.drops=[{x:.45,z:.66,kind:'shield'},{x:.9,z:.7,kind:'heart'},{x:0,z:.4,kind:'wings'}];T.step(g,.01);assert.equal(g.shield,9);assert.equal(g.drops.length,2);
// Weapons: more arrows per volley (capped at four), stronger arrows, rockets with a blast.
g=T.create();g.row=999;g.hazardAt=999;T.collect(g,'multi');T.collect(g,'multi');T.step(g,.01);assert.equal(g.bolts.length,3);for(let i=0;i<5;i++)T.collect(g,'multi');assert.equal(g.arrows,4);
g=T.create();g.row=999;g.hazardAt=999;T.collect(g,'power');g.foes=[{x:0,z:.8,hp:8,kind:0}];T.step(g,.05);assert.equal(g.score,50,'a power arrow deals 8');
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;T.collect(g,'rocket');g.foes=[{x:0,z:.5,hp:60,kind:0},{x:.4,z:.5,hp:60,kind:0},{x:1.24,z:.5,hp:60,kind:0}];for(let i=0;i<20&&g.score<100;i++)T.step(g,.05);assert.equal(g.score,100,'one rocket breaks both close barrels');assert.equal(g.foes.length,1);
assert.equal(T.nextDrop(Object.assign(T.create(),{arrows:4})),'rocket');assert.equal(T.nextDrop(Object.assign(T.create(),{dropCount:8})),'shield','no heart at full health');
assert.deepEqual([...new Set(T.dropOrder)].sort(),['chain','frost','heart','laser','multi','power','rocket','shield','wings']);
// Sun beam burns what is straight ahead, chain lightning jumps to two more barrels, frost slows barrels and adds damage.
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;T.collect(g,'laser');assert.equal(g.laser,6);g.foes=[{x:0,z:.3,hp:40,kind:0},{x:0,z:.6,hp:40,kind:0},{x:.62,z:.5,hp:40,kind:0}];for(let i=0;i<10;i++)T.step(g,.05);assert.equal(g.score,100,'the beam breaks both barrels in its column');assert.equal(g.foes.length,1);assert.equal(g.foes[0].hp,40);
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;T.collect(g,'chain');g.foes=[{x:0,z:.6,hp:100,kind:0},{x:.62,z:.6,hp:100,kind:0},{x:-.62,z:.55,hp:100,kind:0},{x:1.24,z:.6,hp:100,kind:0}];T.step(g,.01);assert.deepEqual(g.foes.map(f=>f.hp),[74,84,84,100]);assert.equal(g.arcs.length,3);
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;g.foes=[{x:1.24,z:.2,hp:999,kind:0}];T.step(g,.05);const pace=g.foes[0].z-.2;T.collect(g,'frost');T.step(g,.05);assert.ok(Math.abs((g.foes[0].z-.2-pace)/pace-.45)<1e-6,'frost slows barrels');
g=T.create();g.row=999;g.hazardAt=999;T.collect(g,'frost');g.foes=[{x:0,z:.8,hp:9,kind:0}];T.step(g,.05);assert.equal(g.score,50,'a frost arrow deals 9');
// She leans into a turn and the pets trail behind (picture only).
g=T.create();g.row=999;g.hazardAt=999;g.target=1;T.step(g,.05);assert.ok(g.lean>0&&g.pets[0]>0&&g.pets[0]<g.x);
// Storm barrel: lightning chains to neighbours and on through other storm barrels. Bomb barrel: one blast nearby.
g=T.create();g.foes=[{x:0,z:.5,hp:1,type:'elec'},{x:.62,z:.5,hp:40,type:'elec'},{x:1.24,z:.5,hp:40},{x:-1.24,z:.1,hp:40}];T.damage(g,g.foes[0],5);assert.deepEqual(g.foes.map(f=>!!f.dead),[true,true,true,false]);assert.equal(g.score,150);assert.ok(g.arcs.length>=2);
g=T.create();g.foes=[{x:0,z:.5,hp:1,type:'bomb'},{x:.62,z:.55,hp:90},{x:1.24,z:.5,hp:90},{x:0,z:.2,hp:90}];T.damage(g,g.foes[0],5);assert.deepEqual(g.foes.map(f=>!!f.dead),[true,true,false,false]);assert.equal(g.blasts.length,1);
// Barrels appear far away; the boss arrives late, can be beaten for a bonus, and the run then ends once.
g=T.create();T.step(g,.01,()=>.9);assert.ok(g.foes.length===5&&g.foes.every(f=>f.z<0));
g=T.create();g.row=999;g.hazardAt=999;g.shot=999;g.time=T.bossAt;T.step(g,.01);const boss=g.foes.find(f=>f.boss);assert.ok(boss&&boss.hp===T.bossHp&&T.bossAt<T.length-12);T.step(g,.01);assert.equal(g.foes.filter(f=>f.boss).length,1);
T.damage(g,boss,T.bossHp);assert.ok(g.bossDown);assert.equal(g.score,1000);for(let i=0;i<40&&g.running;i++)T.step(g,.05);assert.ok(g.ended&&g.time<T.bossAt+3);
// The dragon breathes fire down Reina's lane.
g=T.create();g.row=999;g.shot=999;g.time=T.bossAt;g.hazardAt=999;T.step(g,.01);g.hazardAt=0;g.target=g.x=.62;T.step(g,.01);assert.ok(g.hazards[0].breath&&!g.hazards[0].laser&&g.hazards[0].x===.62);
// Live ranking: rivals are fixed for a day, earn their score over the run, and the gap is to the leader.
{const day=Date.UTC(2026,10,18,12),r=T.rivals(['Nyra','Kael','Pip'],day);assert.deepEqual(r.map(x=>x.final),T.rivals(['Nyra','Kael','Pip'],day+3600000).map(x=>x.final));
 assert.ok(r.every(x=>x.final>=2400&&x.final<=4600&&x.final%50===0));
 const start=T.standing(r,0,0);assert.equal(start.rank,1);assert.equal(start.gap,0);
 const end=T.standing(r,0,63);assert.equal(end.rank,4);assert.equal(end.gap,Math.max(...r.map(x=>x.final)));
 const top=T.standing(r,99999,63);assert.equal(top.rank,1);assert.equal(top.gap,0);assert.equal(top.of,4);}
console.log('PASS Jungle: swept hits, shield, invulnerability, buffs, hazard warning, aimed shots, Rush charge, wide pickup, weapons, storm and bomb barrels, sun beam, chain lightning, frost, boss fire, 63 s timer, bounded simulation');
