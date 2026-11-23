import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});vm.runInContext(fs.readFileSync('src/party.js','utf8').split('\n// PARTY_UI')[0]+';globalThis.P=Party',context);const P=context.P;
let seed=11;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
const T0=P.anchor+3600e3,eq=(a,b,m)=>assert.equal(JSON.stringify(a),JSON.stringify(b),m);
// Sliding: pets slide to the wall, two equal ones merge once into the next tier with its points.
let s=P.slide([1,1,1,1, 2,0,2,0, 0,0,0,3, 0,0,0,0],'left');
eq(s.board,[2,2,0,0, 3,0,0,0, 3,0,0,0, 0,0,0,0],'left slide and merges');assert.ok(s.moved);assert.equal(s.points,P.points(2)*2+P.points(3));
eq(P.slide([2,2,4,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],'right').board,[0,0,3,4, 0,0,0,0, 0,0,0,0, 0,0,0,0],'right slide merges the pair nearest the wall');
eq(P.slide([1,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,0,0],'down').board,[0,0,0,0, 0,0,0,0, 0,0,0,0, 2,0,0,0],'down');
assert.equal(P.slide([11,11,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],'left').moved,false,'the top tier does not merge');
assert.equal(P.canMove([1,2,1,2, 2,1,2,1, 1,2,1,2, 2,1,2,1]),false,'deadlock');assert.equal(P.points(2),20);
// Save state: fresh, a swipe costs stamina, merges give points, best and total follow.
const {v}=P.roll(undefined,T0,rng);assert.ok(P.valid(v));assert.equal(v.stamina,P.staminaMax);
v.round.board=[1,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0];const r=P.swipe(v,'left',T0,rng);
assert.ok(r.ok);assert.equal(v.stamina,P.staminaMax-1);assert.equal(v.round.score,20);assert.equal(v.best,20);assert.equal(v.total,20);assert.equal(v.reach,2);
assert.equal(v.round.board.filter(Boolean).length,2,'a new pet arrives after a move');
assert.equal(P.swipe({...v,stamina:0,round:{...v.round,board:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]}},'right',T0,rng).err,'stamina');
// Stamina recovers over time and refills at 00:00 UTC.
const w=JSON.parse(JSON.stringify(v));w.stamina=10;w.stamAt=T0;assert.equal(P.roll(w,T0+P.regenMs*3+1).v.stamina,13);
assert.equal(P.roll(w,T0+864e5).v.stamina,P.staminaMax,'next UTC day refills');
// Items: limits per round, fireworks clear the lowest tier, cake lifts tier 1, wand lifts one pet, potion adds stamina.
const it=P.roll(undefined,T0,rng).v;it.items={fire:5,cake:5,wand:5,potion:20};it.round.board=[1,2,1,3, 0,0,0,0, 0,0,0,0, 0,0,0,0];
assert.ok(P.useItem(it,'fire').ok);eq(it.round.board.slice(0,4),[0,2,0,3]);
it.round.board[0]=1;assert.ok(P.useItem(it,'cake').ok);assert.equal(it.round.board[0],2);
assert.ok(P.useItem(it,'wand',3).ok);assert.equal(it.round.board[3],4);assert.equal(it.reach,4);
const st=it.stamina;assert.ok(P.useItem(it,'potion').ok);assert.equal(it.stamina,st+P.potionStamina);
for(let i=0;i<5;i++)P.useItem(it,'fire');assert.equal(it.round.used.fire,P.roundLimit.fire,'fireworks limit per round');assert.equal(P.useItem(it,'fire').err,'limit');
P.restart(it,rng);assert.equal(it.round.score,0);eq(it.round.used,{},'a new round resets item uses');assert.ok(it.items.fire>0,'items stay');
// Deadlock: a full board with no move is over; a new round keeps the best score.
const d=P.roll(undefined,T0,rng).v;d.round.board=[1,2,1,2, 2,1,2,1, 1,2,1,2, 2,1,2,3];d.round.over=false;d.best=500;
assert.equal(P.swipe(d,'left',T0,rng).ok,false);d.round.over=!P.canMove(d.round.board);assert.ok(d.round.over);assert.equal(P.swipe(d,'left',T0,rng).err,'deadlock');
assert.ok(P.useItem({...d,items:{fire:1}},'fire').ok,'an item can break a deadlock');P.restart(d,rng);assert.equal(d.best,500);
// Heavenly Gifts: rows open with total points; Advanced and Heavenly need an unlock for prisms.
const g=P.roll(undefined,T0,rng).v;g.total=4500;const save={scales:1500};assert.equal(P.track.length,18);assert.equal(P.track.at(-1).at,72000);
assert.ok(P.trackClaim(g,'b',2));assert.equal(P.trackClaim(g,'b',2),null,'once');assert.equal(P.trackClaim(g,'b',3),null,'row not open');
assert.equal(P.trackClaim(g,'a',0),null,'locked column');assert.ok(P.unlockCol(g,save,'a'));assert.equal(save.scales,1500-P.unlock.a+P.refund.a);assert.ok(P.trackClaim(g,'a',0));
assert.equal(P.unlockCol(g,save,'h'),false,'not enough prisms');
// Gift packs: limit per event.
save.scales=5000;assert.ok(P.buyPack(g,save,'p1'));assert.equal(P.buyPack(g,save,'p1'),null);
eq(P.split({potion:2,gold:100,chest1:1}),{ev:{potion:2},bag:{chest1:1},gold:100});
// Achievements: a tier reached once in a round, claimed once per event.
g.reach=5;assert.ok(P.achClaim(g,5));assert.equal(P.achClaim(g,5),null);assert.equal(P.achClaim(g,6),null);
// Ranking against the AI field; the event week ends with personal rewards and a fresh state.
const f=P.field(g.period,T0+5*864e5);assert.ok(f.length>=30&&f.every(x=>x.ai));assert.ok(f[0].score>=f[1].score);
assert.equal(P.rankOf(1e7,T0,g.period,T0),1);assert.equal(P.rankOf(0,0,g.period,T0),0);
const old=P.roll(undefined,T0,rng).v;old.best=99999;old.bestAt=T0;old.items.fire=9;const next=P.roll(old,P.ends(old.period)+1000,rng);
assert.equal(next.v.period,old.period+1);assert.equal(next.v.best,0);assert.equal(next.v.items.fire,P.starter.fire,'event items cleared');assert.equal(next.due.rank,1);assert.ok(next.due.give);
assert.ok(P.valid(next.v));assert.ok(!P.valid({...next.v,round:{...next.v.round,board:[12]}}));assert.ok(!P.valid({...next.v,items:{gold:1}}));
// A long bot game never breaks the rules.
const b=P.roll(undefined,T0,rng).v;b.stamina=5000;let moves=0;for(let i=0;i<4000&&!b.round.over;i++){for(const dir of ['down','left','right','up'])if(P.swipe(b,dir,T0,rng).ok){moves++;break}}
assert.ok(b.round.over&&moves>50&&b.round.top>=6&&P.valid(b),'bot reaches tier '+b.round.top+' in '+moves+' moves, score '+b.round.score);
console.log('PASS Party: slides and merges, deadlock, stamina and daily refill, items and round limits, new round, Heavenly Gifts and unlocks, packs, achievements, AI ranking, event end, bot game (top tier '+b.round.top+', score '+b.round.score+')');
