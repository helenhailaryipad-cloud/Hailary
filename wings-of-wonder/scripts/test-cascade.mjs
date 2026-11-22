import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync('src/cascade.js','utf8').split('\n// CASCADE_UI')[0]+';globalThis.C=Cascade',context);const C=context.C;
let seed=7;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
// Shapes: seven, four crystals each; four turns come back to the start; the square never changes.
assert.equal(C.shapes.length,7);for(let k=0;k<7;k++){assert.equal(C.cells(k,0).length,4);assert.deepEqual(C.cells(k,4),C.cells(k,0),'four turns '+k)}
assert.deepEqual(C.cells(1,1),C.cells(1,0),'square');
// The bag deals every shape once in each seven.
const g=C.create(rng);const firstFive=[g.piece.kind,...g.queue.slice(0,4)];assert.equal([...firstFive].sort().join(),'0,1,2,5,6','level 1 deals only the simple shapes');assert.equal(C.bag(rng,2).length,7);assert.ok(C.speed(1)>C.speed(2));
// Walls stop sideways moves; a hard drop lands on the floor and gives two points a row.
for(let i=0;i<12;i++)C.move(g,-1);assert.ok(C.cells(g.piece.kind,g.piece.rot).some(([x])=>g.piece.x+x===0),'reaches the left wall');assert.equal(C.move(g,-1),false);
const kind=g.piece.kind,ghost=C.ghost(g),rows=C.hard(g);assert.ok(rows>0);assert.equal(g.score,rows*2);
assert.ok(g.grid[C.rows-1].some(c=>c===kind),'the piece rests on the floor');
// A full row bursts: build a well with one gap and drop a beam into it.
const b=C.create(rng);b.grid[19]=[0,0,0,0,-1,0,0,0,0,0];b.grid[18]=[0,0,0,0,-1,0,0,0,0,0];b.grid[17]=[0,0,0,0,-1,0,0,0,0,0];b.grid[16]=[0,0,0,0,-1,0,0,0,0,0];
b.piece={kind:0,rot:1,x:2,y:0};b.events.length=0;assert.ok(C.fits(b,b.piece));C.hard(b);
const burst=b.events.find(e=>e.type==='burst');assert.ok(burst,'four rows burst');assert.equal(burst.count,4);assert.equal(burst.name,'Arcane Cascade!');
assert.ok(b.grid.every(r=>r.every(c=>c<0)),'the well is empty');assert.ok(b.events.some(e=>e.type==='clear'),'Crystal Clear bonus');
assert.equal(b.lines,4);assert.ok(b.score>=800+1000);
// Score opens chests in order, once each.
const c=C.create(rng);c.score=4200;C.chestCheck(c);assert.equal(c.opened,2);C.chestCheck(c);assert.equal(c.events.filter(e=>e.type==='chest').length,2);
// Gravity and the lock delay: with no input a piece falls and settles, and the next one spawns.
const d=C.create(rng);const first=d.piece;for(let t=0;t<300&&d.piece===first;t++)C.step(d,.1);assert.notEqual(d.piece,first,'the piece locked and a new one came');
// Level and speed.
assert.ok(C.speed(5)<C.speed(1));const e=C.create(rng);e.lines=9;e.grid[19]=Array(10).fill(2);e.grid[19][0]=-1;e.piece={kind:0,rot:1,x:-2,y:0};assert.ok(C.fits(e,e.piece));C.hard(e);assert.equal(e.level,2);
// Topping out ends the run.
const f=C.create(rng);for(let y=0;y<20;y++)f.grid[y]=Array(10).fill(3).map((v,x)=>x===9?-1:v);C.spawn(f);assert.ok(f.over);
// Rewards: capped gold, chests opened, two rewarded runs a day.
assert.equal(JSON.stringify(C.reward({score:20000,lines:40,opened:3})),JSON.stringify({gold:800,xp:80,items:['chest1','chest2','chest3']}));
const save={};const now=Date.UTC(2026,10,22,9);assert.equal(C.runsLeft(save,now),2);C.useRun(save,now);C.useRun(save,now);assert.equal(C.runsLeft(save,now),0);assert.equal(C.runsLeft(save,now+864e5),2);
console.log('PASS Cascade: shapes and turns, seven-bag, walls, hard drop, row bursts and names, crystal clear, chests, gravity and lock, levels, top-out, rewards, daily runs');
