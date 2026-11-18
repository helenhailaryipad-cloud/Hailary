import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync('src/jungle.js','utf8')+';globalThis.T=Trek',context);const T=context.T;
let g=T.create();g.row=999;g.hazardAt=999;g.foes=[{x:0,z:.8,hp:6,kind:0}];T.step(g,.05,()=>.5);assert.equal(g.score,50);assert.equal(g.foes.length,0);
g=T.create();g.paused=true;T.step(g,.05);assert.equal(g.time,0);g.paused=false;g.shield=5;T.hit(g);assert.equal(g.hp,3);assert.equal(g.shield,0);T.hit(g);assert.equal(g.hp,3);g.hurt=0;T.hit(g);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;g.drops=[{x:0,z:.84,kind:'wings'}];T.step(g,.01);assert.equal(g.boost,9);assert.equal(g.drops.length,0);
g=T.create();g.row=999;g.hazardAt=999;g.hazards=[{x:0,age:0}];for(let i=0;i<30;i++)T.step(g,.05);assert.equal(g.hp,3);for(let i=0;i<4;i++)T.step(g,.05);assert.equal(g.hp,2);
g=T.create();g.row=999;g.hazardAt=999;g.time=89.99;T.step(g,.02);assert.equal(g.ended,true);assert.equal(g.time,90);T.step(g,.05);assert.equal(g.time,90);
g=T.create();for(let i=0;i<1800&&g.running;i++){g.target=Math.sin(i*.03);T.step(g,.05,()=>.5);assert.ok(g.foes.length<20);assert.ok(g.bolts.length<60);assert.ok(Number.isFinite(g.x))}assert.ok(g.ended);// Live ranking: rivals are fixed for a day, earn their score over the run, and the gap is to the leader.
{const day=Date.UTC(2026,10,18,12),r=T.rivals(['Nyra','Kael','Pip'],day);assert.deepEqual(r.map(x=>x.final),T.rivals(['Nyra','Kael','Pip'],day+3600000).map(x=>x.final));
 assert.ok(r.every(x=>x.final>=900&&x.final<=2500&&x.final%50===0));
 const start=T.standing(r,0,0);assert.equal(start.rank,1);assert.equal(start.gap,0);
 const end=T.standing(r,0,90);assert.equal(end.rank,4);assert.equal(end.gap,Math.max(...r.map(x=>x.final)));
 const top=T.standing(r,99999,90);assert.equal(top.rank,1);assert.equal(top.gap,0);assert.equal(top.of,4);}
console.log('PASS Jungle: swept hits, shield, invulnerability, buffs, hazard warning, timer, bounded simulation');
