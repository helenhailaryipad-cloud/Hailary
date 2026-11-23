import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
const context=vm.createContext({Math,JSON,Date});vm.runInContext(fs.readFileSync('src/rites.js','utf8').split('\n// RITES_UI')[0]+';globalThis.R=Rites',context);const R=context.R;
let seed=7;const rng=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
const T0=R.anchor+3600e3,day=864e5;
// Rotation: four rites, 14 days each; the welcome gift is tickets of the running rite.
assert.equal(R.rite(R.period(T0)).id,'moon');assert.equal(R.rite(1).id,'ember');assert.equal(R.rite(4).id,'moon');assert.equal(R.ends(0)-R.anchor,14*day);
let s={scales:0};R.state(s,T0);assert.equal(R.tickets(s,'moon'),R.welcome);assert.ok(R.valid(s.rites));
// Costs: 50 a pull, 500 for ten; not enough tickets is refused; the free pull once a UTC day.
assert.equal(R.pull(s,10,rng,T0).ok,true);assert.equal(R.tickets(s,'moon'),R.welcome-500);assert.equal(s.rites.ev.pulls,10);
s.rites.t.moon=40;assert.equal(R.pull(s,1,rng,T0).err,'tickets');
assert.equal(R.pull(s,1,rng,T0,true).ok,true);assert.equal(R.pull(s,1,rng,T0,true).err,'free');assert.equal(R.pull(s,1,rng,T0+day,true).ok,true);
// Luck: never more than 14 pulls in a row without an orb or better.
s={scales:0};R.state(s,T0);s.rites.t.moon=1e6;let run=0,worst=0;
for(let i=0;i<600;i++){const r=R.pull(s,1,rng,T0).results[0];run=['orb','aura','wings'].includes(r.kind)?0:run+1;worst=Math.max(worst,run)}
assert.ok(worst<R.luckMax,'luck guarantee, longest dry run '+worst);
// Grand prize: by pull 300 at the latest, once; owned wings repeat into stardust.
const g={scales:0};R.state(g,T0);g.rites.t.moon=1e6;const never=()=>.999;for(let i=0;i<299;i++)R.pull(g,1,never,T0);
assert.ok(!(g.reinaFashion?.wingSkins||[]).includes('fashion-wing-28'));R.pull(g,1,never,T0);assert.ok(g.reinaFashion.wingSkins.includes('fashion-wing-28'));assert.ok(g.rites.ev.grand);
const d0=g.rites.dust;R.give(g,g.rites,{kind:'wings',id:'fashion-wing-28',name:'x',rarity:'legend'});assert.equal(g.rites.dust-d0,R.dust.wings);
// Milestones: tickets of the next rite (15 ... 240 = 4860), the moon rite's own returns, a new orb at 240.
assert.equal(g.rites.t.ember,400+740+1240+1240+1240);assert.ok(g.rites.ev.got.includes(120)&&g.rites.ev.got.includes(250));assert.ok(R.orbCount(g)>=1);
// Starfall Vault: three choices at 360 / 720 / 800.
const st={scales:0};const T2=R.anchor+2*14*day+1000;R.state(st,T2);assert.equal(R.rite(st.rites.ev.period).id,'star');st.rites.t.star=1e6;
for(let i=0;i<36;i++)R.pull(st,10,never,T2);assert.equal(R.picksOpen(st),1);assert.ok(R.choose(st,'wings','fashion-wing-31'));assert.equal(R.picksOpen(st),0);assert.equal(R.choose(st,'orb','sun'),null);
assert.ok(st.reinaFashion.wingSkins.includes('fashion-wing-31'));
// Celestial Bloom: Petal Path pays prisms.
const b={scales:0};const T3=R.anchor+3*14*day+1000;R.state(b,T3);b.rites.t.bloom=1e6;R.pull(b,10,never,T3);for(let i=0;i<5;i++)R.pull(b,10,never,T3);assert.equal(b.scales,100);
// A new rite resets the counter, keeps tickets and collections.
const keep=g.rites.t.ember,orbs=R.orbCount(g);R.state(g,R.ends(0)+1);assert.equal(g.rites.ev.pulls,0);assert.equal(g.rites.t.ember,keep);assert.equal(R.orbCount(g),orbs);
// Shop: packs once per rite, 1:1 exchange, Dust Shop.
const p={scales:2000};R.state(p,T0);assert.ok(R.buyPack(p,0,T0));assert.equal(R.buyPack(p,0,T0),null);assert.equal(p.scales,2000-R.packs[0]);
assert.equal(R.exchange(p,50,T0),50);p.rites.dust=400;assert.ok(R.dustBuy(p,'orb','sun',T0));assert.ok(R.dustBuy(p,'pull',null,T0));assert.equal(p.rites.dust,400-R.dust.orbBuy-R.dust.pull);
// Auras: copies raise the tier (max 5), one can be worn; stats from auras and orbs with set bonuses.
const a={};R.state(a,T0);for(let i=0;i<7;i++)R.give(a,a.rites,{kind:'aura',id:'ember',name:'',rarity:'mythic'});assert.equal(R.auraTier(a,'ember'),5);assert.equal(a.rites.aura,'ember');
assert.ok(R.wear(a,''));assert.equal(R.wear(a,'star'),false);
for(const [id] of R.orbs)R.give(a,a.rites,{kind:'orb',id,name:'',rarity:'epic'});const bo=R.bonus(a);
assert.equal(bo.damageBonus,5);assert.equal(bo.attackPercent,R.auraStats.attackPercent*3+4);assert.ok(bo.attack>0&&bo.health>0);
// Validation.
for(const x of [g,st,b,p,a])assert.ok(R.valid(x.rites),'valid');
assert.ok(!R.valid({...a.rites,aura:'star'}));assert.ok(!R.valid({...a.rites,t:{nope:5}}));assert.ok(!R.valid({...a.rites,auras:{ember:9}}));assert.ok(!R.valid({...a.rites,ev:{...a.rites.ev,luck:15}}));
// Rough rates over many pulls match the table.
const m={scales:0};R.state(m,T0);m.rites.t.moon=1e8;const cnt={};for(let i=0;i<4000;i++)for(const r of R.pull(m,10,rng,T0).results)cnt[r.rarity]=(cnt[r.rarity]||0)+1;
assert.ok(cnt.rare/40000>.22&&cnt.rare/40000<.28,'rare rate '+cnt.rare/40000);
console.log('PASS Rites: rotation, welcome tickets, costs and the free pull, luck within 15, grand prize by 300, next-rite tickets and returns, Starfall choices, Petal Path, new rite keeps tickets, shop and dust, auras and orb sets, validation, rates',JSON.stringify(cnt));
// Starlit Vouchers: universal, swapped 1:1 into the running rite.
const u={};R.state(u,T0);assert.equal(R.addVouchers(u,75,T0),75);assert.equal(R.redeem(u,100,T0),null);const rr=R.redeem(u,75,T0);assert.equal(rr.n,75);assert.equal(R.tickets(u,'moon'),R.welcome+75);assert.equal(R.vouchers(u),0);
assert.ok(R.valid(u.rites));assert.ok(!R.valid({...u.rites,v:-1}));console.log('PASS Rites vouchers');
