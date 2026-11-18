import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math});vm.runInContext(fs.readFileSync('src/pairs.js','utf8').split('\nconst PAIRS_NAMES')[0]+';globalThis.P=Pairs',context);const P=context.P;
// Seeded generator so every run checks the same boards.
let seed=7;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
// Path rules on a 4 x 3 board (ids; -1 is empty).
const board=cells=>({cols:4,rows:3,cells});
assert.ok(P.path(board([1,1,2,3, 2,3,4,4, 5,5,6,6]),0,1),'neighbours join');
assert.equal(P.path(board([1,2,1,3, 2,3,4,4, 5,5,6,6]),0,2).length,4,'top row joins around the outside with two turns');
assert.equal(P.path(board([9,2,3,4, 5,6,7,8, 2,3,4,9]),5,6),null,'different ingredients never join');
assert.equal(P.path(board([2,3,4,5, 6,1,7,8, 9,7,1,6]),5,10),null,'a pair walled in on all sides cannot join');
assert.ok(P.path(board([2,3,4,5, 6,1,-1,8, 9,7,1,6]),5,10),'one free cell opens a one-turn path');
assert.equal(P.path(board([1,2,3,4, 5,6,7,8, 9,3,2,1]),0,11),null,'opposite corners need three turns');
assert.equal(P.path(board([1,-1,-1,-1, 5,6,7,-1, 9,3,2,1]),0,11).length,3,'a cleared edge leaves one turn');
assert.equal(P.path(board([1,2,3,4, 5,6,7,8, 9,3,2,1]),0,0),null,'a tile does not pair with itself');
// Every stage deals an even, pair-complete, fully clearable board.
for(let round=0;round<40;round++)for(let stage=0;stage<P.stages.length;stage++){
 const [cols,rows,kinds]=P.stages[stage],b=P.deal(stage,[0,1,2,3,4,5,6,7],rng);
 assert.equal(b.cells.length,cols*rows);const count={};for(const k of b.cells)count[k]=(count[k]||0)+1;
 assert.equal(Object.keys(count).length,kinds);assert.ok(Object.values(count).every(n=>n%2===0),'ingredients come in pairs');
 assert.ok(P.solvable(b),'dealt board can be cleared');
}
// A full run: taps select, match, advance through five stages and end exactly once.
const g=P.create(rng);assert.equal(P.tap(g,0),null,'locked during the countdown');g.locked=false;
let taps=0;while(!g.ended&&taps++<400){
 let move=P.hint(g.board);if(!move){assert.ok(P.reshuffle(g.board,rng));move=P.hint(g.board)}
 assert.deepEqual({...P.tap(g,move[0])},{select:move[0]});
 const r=P.tap(g,move[1]);assert.ok(r.line.length>=2&&r.line.length<=4,'at most two turns');
 if(r.cleared)P.advance(g,rng);
}
assert.ok(g.ended&&!g.running&&g.stage===4);assert.equal(P.tap(g,0),null,'no taps after the end');
// Selecting the same tile again clears the selection; a tile that cannot join becomes the new selection.
const h=P.create(rng);h.locked=false;h.board={cols:2,rows:2,cells:[1,2,2,1]};
assert.equal(P.tap(h,0).select,0);assert.equal(P.tap(h,0).select,-1);assert.equal(P.tap(h,0).select,0);assert.equal(P.tap(h,1).select,1);
assert.deepEqual({...P.reward(59.9)},{gold:500,xp:30});assert.deepEqual({...P.reward(60.1)},{gold:300,xp:30});assert.equal(P.clock(75.9),'1:15');
// Reshuffle keeps the same tiles in the same occupied slots.
const stuck={cols:2,rows:2,cells:[1,2,2,1]};stuck.cells=[1,-1,-1,1];assert.ok(P.hint(stuck));
// Two rewarded runs per UTC day, counted on completion; the count resets with the date.
const save={},noon=Date.UTC(2026,10,18,12),next=noon+86400000;
assert.equal(P.runsLeft(save,noon),2);P.useRun(save,noon);assert.equal(P.runsLeft(save,noon),1);P.useRun(save,noon);P.useRun(save,noon);assert.equal(P.runsLeft(save,noon),0);
assert.equal(P.runsLeft(save,next),2);P.useRun(save,next);assert.deepEqual({...save.pairsDaily},{day:'2026-11-19',runs:1});
// Rival times are fixed within a day, labelled AI, and the player is ranked among them by time.
const names=['Nyra','Kael','Pip'],r1=P.rivals(names,noon),r2=P.rivals(names,noon+3600000);
assert.deepEqual(r1.map(r=>r.seconds),r2.map(r=>r.seconds));assert.ok(r1.every(r=>r.ai&&r.seconds>=41&&r.seconds<99));
const table=P.ranking(names,1,noon);assert.equal(table.length,4);assert.ok(table[0].you);assert.equal(P.ranking(names,0,noon).length,3);
console.log('PASS Pairs: path rules, solvable deals, full five-stage run, selection, rewards, daily runs, ranking');
