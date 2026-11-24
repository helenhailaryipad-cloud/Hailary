import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});vm.runInContext(fs.readFileSync('src/vow.js','utf8').split('\n// VOW_UI')[0]+';globalThis.V=Vow',context);const V=context.V;
let seed=5;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
const D=V.day(V.anchor)+2,T0=D*864e5+3*36e5;// 03:00 UTC on the third event day
let {v,due}=V.roll(undefined,T0);assert.ok(V.valid(v));assert.equal(due,null);assert.equal(v.gifts.rose,V.freeRoses);
// Without a partner: intimacy and Love Lock EXP, but no Bond Points (one-sided gifts do not count).
let r=V.send(v,'kael','rose',1,'hello',T0);assert.ok(r.ok&&!r.partner);assert.equal(V.score(v),0);assert.equal(v.lock,V.gifts.rose.lock);assert.equal(r.intim,120);
assert.equal(V.send(v,'kael','rose',5,'',T0).err,'few');assert.equal(V.send(v,'kael','gem',1,'',T0).err,'gift');
// One partner per event; mutual gifts count double for both.
assert.ok(V.bond(v,'nyra'));assert.ok(!V.bond(v,'kael'),'one partner per event');
v.gifts.ring=3;r=V.send(v,'nyra','ring',2,'I met you on a beautiful day',T0);assert.ok(r.ok&&r.partner&&r.reply,'the first send is always answered');
assert.equal(r.msg.length,V.msgMax);assert.equal(V.score(v),V.mutual*(1040+V.gifts[r.reply].pts));assert.equal(r.gained,V.score(v));assert.ok(v.bond>0);
// Love Lock levels and stats.
assert.equal(V.lockLevel(0).lv,0);assert.equal(V.lockLevel(V.lockStep).lv,1);assert.equal(V.lockLevel(V.lockStep*3).lv,2);
v.lock=V.lockStep*3;assert.equal(V.bonus({vow:v}).attack,2*V.lockStats.attack);
// Oath Goal needs the day's score; claimed once.
assert.ok(V.claimGoal(v,0));assert.equal(V.claimGoal(v,0),null);
// Shop and packs: limits, wallet.
const w={gold:5000,scales:100};let b=V.buy(v,'rose',w);assert.ok(b.ok);assert.equal(w.gold,3000);assert.equal(V.buy(v,'p2',w).err,'prisms');
b=V.buy(v,'p1',w);assert.ok(b.ok);assert.equal(w.scales,40);assert.equal(V.buy(v,'p1',{gold:0,scales:999}).err,'limit');
const rest=V.take(v,b.give);assert.equal(Object.keys(rest).join(),"chest1");assert.equal(v.crystal,10);
// Drops and the venue are capped per day.
for(let i=0;i<V.dropDaily;i++)assert.ok(V.drop(v,rng).rose);assert.equal(V.drop(v,rng),null);
for(let i=0;i<V.venueDaily;i++)assert.ok(V.venueCatch(v,T0,rng));assert.equal(V.venueCatch(v,T0,rng),null);
assert.ok(V.valid(v));
// Board: 20 slots, AI couples labelled, top three need the high mark.
const board=V.board(D,V.closeAt(D),{me:true,names:['Reina','Nyra'],score:12000});assert.equal(board.length,20);
assert.ok(board.every(x=>!x.couple||x.couple.score>=x.need));assert.ok(board.some(x=>x.couple?.me));assert.ok(V.couples(D).every(c=>c.ai));
assert.equal(V.rankOf(100,D),0,'under 1314 is not listed');
// After 21:00 the day closes: score frozen, ranking paid once.
const T1=V.closeAt(D)+60e3;v.pts=6000;v.back=1000;let o=V.roll(v,T1);assert.ok(o.v.paid===D&&o.v.last.day===D);
const sc=o.v.last.score;assert.equal(sc,14000);assert.equal(V.roll(o.v,T1+1000).due,null,'paid once');
o.v.gifts.rose=2;V.send(o.v,'nyra','rose',1,'',T1);assert.equal(V.score(o.v),sc,'the ranking is closed after 21:00');
// Next day: points, goals and purchases reset; free roses; an EXP buff after a No.1 finish.
let n=V.roll(o.v,(D+1)*864e5+60e3).v;assert.equal(n.pts,0);assert.equal(n.goal.length,0);assert.equal(JSON.stringify(n.buys),"{}");assert.equal(n.frozen,undefined);
if(o.v.last.rank===1)assert.equal(V.buffOn(n,(D+1)*864e5+60e3),V.expBuff);else assert.equal(V.buffOn(n,(D+1)*864e5+60e3),0);
const top={...n,buff:D+1};assert.equal(V.buffOn(top,(D+1)*864e5+5e3),V.expBuff);
// A day that was never opened is settled when she comes back; a new event week frees the partner.
const s2=V.fresh(T0);V.bond(s2,'pip');s2.pts=900;s2.back=120;const late=V.roll(s2,(D+9)*864e5);assert.ok(late.due&&late.due.give,'participation reward');assert.equal(late.v.partner,null);
assert.ok(V.valid(late.v));assert.ok(!V.valid({...n,gifts:{rose:-1,ring:0,box:0}}));assert.ok(!V.valid({...n,buys:{p1:5}}));assert.ok(!V.valid({...n,partner:'<x>'}));
console.log('PASS Vow: one-sided vs mutual gifts, one partner, Love Lock, goals, shop and packs, drops and venue caps, board slots, 21:00 close and single payout, daily reset, EXP buff, partner reset, validation');
