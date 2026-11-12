import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const elements=new Map();function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',disabled:false,setAttribute(name,value){this[name]=String(value)},classList:{add(){},remove(){},toggle(){}},close(){this.open=false},showModal(){this.open=true},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:720,height:520}}});return elements.get(key)}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Blob,URL,Promise,document:{body:{dataset:{},classList:{add(){},remove(){},contains(){return false}}},querySelector:el,addEventListener(){},createElement:()=>({click(){}})},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},fetch:async()=>({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/art-meta.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/generated-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/progression-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/boss-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/dungeon-crawl.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/exp-dungeon.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/world.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/arena.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);
vm.runInContext(`
const namedLegacy={...defaults(),name:'Reyna',gold:1234,xp:456};const legacyBefore=JSON.stringify({...namedLegacy,name:'REINA'});correctHeroName(namedLegacy);if(JSON.stringify(namedLegacy)!==legacyBefore)throw Error('Name correction must preserve progress');if(correctHeroName({...defaults(),name:'Nyra'}).name!=='Nyra')throw Error('Keep custom hero names');if(comparable({...defaults(),name:'REINA'})!==comparable(correctHeroName({...defaults(),name:'Reyna'})))throw Error('Name correction must not create cloud conflict');
S=defaults();home();const progressBeforeIntro=JSON.stringify(S);const introPrefs=new Map(),originalGet=localStorage.getItem,originalSet=localStorage.setItem;localStorage.getItem=k=>introPrefs.get(k)||null;localStorage.setItem=(k,v)=>introPrefs.set(k,String(v));chooseIntro('2d');if(storedIntroStyle()!=='2d'||screen!=='home'||document.querySelector('#main').innerHTML.includes('id="intro3d"')||JSON.stringify(S)!==progressBeforeIntro)throw Error('2D return preserves adventure');openScreen('intro');chooseIntro('3d');if(storedIntroStyle()!=='2d'||screen!=='home'||document.querySelector('#main').innerHTML.includes('id="intro3d"')||JSON.stringify(S)!==progressBeforeIntro)throw Error('Retired 3D preference must return to 2D and preserve adventure');localStorage.getItem=originalGet;localStorage.setItem=originalSet;
S=defaults();S.tickets=100000;const initial=S.tickets;
for(let i=0;i<30;i++)roll(10);
if(S.rolls!==300||S.scales!==3000||S.guarantees!==1||S.claimed.length!==5)throw Error('Gacha thresholds');
const ret=400+740+1240+1240+1240;if(S.tickets<initial-15000+ret)throw Error('Milestone return');
const before=S.scales;const candidate=ITEMS.find(i=>!S.owned.includes(i.id));if(candidate){claimReward('scales',candidate.id);if(S.scales!==before-2000||!S.owned.includes(candidate.id))throw Error('Exchange');const after=S.scales;claimReward('scales',candidate.id);if(S.scales!==after)throw Error('Duplicate exchange');}
if(!valid(S))throw Error('Generated save invalid');
S=defaults();openScreen('defense');game.cleared=3;const goldBefore=S.gold;endDefense(false);endDefense(false);if(S.gold!==goldBefore+210)throw Error('Defense reward duplicated');
openScreen('defense');nextWave();for(let i=0;i<300;i++)updateDefense(1/60);if(!game.enemies.length)throw Error('Defense spawning');
openScreen('merge');game.score=320;const mergeBefore=S.gold;endMerge(false);endMerge(false);if(S.gold!==mergeBefore+160)throw Error('Merge reward duplicated');
openScreen('merge');game.balls=[{x:350,y:470,r:17,k:0,vx:0,vy:0,age:3},{x:370,y:470,r:17,k:0,vx:0,vy:0,age:3}];updateMerge(1/60);if(game.score!==20||game.balls.length!==1||game.balls[0].k!==1)throw Error('Egg merge');for(let i=0;i<600;i++)updateMerge(1/60);if(!game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.y<=488))throw Error('Physics unstable');
`,context);

vm.runInContext(`
S=defaults();const playerBefore=JSON.stringify(S);for(const bot of ADVENTURERS){const snap=botSnapshot(bot);if(!Number.isFinite(snap.power)||snap.level<1)throw Error('Bot stats');botResult(bot,snap.seed)}if(JSON.stringify(S)!==playerBefore)throw Error('Bots changed player progression');
stopGame();S.xp=1500;launchBattle('dungeon','mistwood');gamePaused=true;const cd=game.burstCD;battleSkill('burst');if(game.burstCD!==cd)throw Error('Paused skill executed');gamePaused=false;
for(let i=0;i<12000&&!game.ended;i++){if(game.crawl?.exitReady)walkDungeon();battleSkill('burst');if(game.hp<game.maxhp*.72)battleSkill('heal');if(game.telegraph>0&&game.telegraph<.65)battleSkill('dodge');updateBattle(1/60)}if(!game.won||game.cleared!==3||S.dungeonWins!==1)throw Error('Dungeon cannot be cleared');const dg=S.gold;endBattle(true);if(S.gold!==dg)throw Error('Dungeon duplicated reward');
launchBattle('spar','pip');game.enemy.hp=1;battleDamage(100);if(!game.won||S.sparWins!==1)throw Error('AI spar does not complete');const sg=S.gold;endBattle(true);if(S.gold!==sg)throw Error('Spar duplicated reward');
launchBattle('dungeon','moonfall');game.cleared=1;const early=S.gold;finishEarly();if(S.gold!==early+60||!game.ended)throw Error('Dungeon finish routing');
const oldSave=defaults();delete oldSave.dungeonWins;delete oldSave.sparWins;if(!valid(oldSave))throw Error('Old saves rejected');if(valid({...oldSave,dungeonWins:-1}))throw Error('Invalid dungeon wins accepted');
`,context);

vm.runInContext(`
S=defaults();S.upgrades.bow=7;S.upgrades.ring=3;const r=globalThis.WonderGear,legacyStats=r.stats(S),eq=r.fresh(S);if(eq.items.find(i=>i.uid===eq.equipped.bow).enhance!==7||eq.items.find(i=>i.uid===eq.equipped.spiritluck).enhance!==3)throw Error('Legacy enhancements lost');S.equipment=eq;if(JSON.stringify(r.stats(S))!==JSON.stringify(legacyStats))throw Error('Migration doubled stats');if(!valid(S))throw Error('Gear save invalid');
const uid=eq.equipped.bow,spare=eq.items.find(i=>i.template==='bow-t3');r.perform(S,spare.uid,'equip');if(eq.equipped.bow!==spare.uid)throw Error('Equip did not replace slot');
r.perform(S,uid,'equip');const oldGold=S.gold,stones=eq.materials.stone;const p=r.cost(eq.items.find(i=>i.uid===uid),'enhance');if(!r.perform(S,uid,'enhance').ok||S.gold!==oldGold-p.gold||eq.materials.stone!==stones-p.stone)throw Error('Enhancement cost');if(eq.items.find(i=>i.uid===spare.uid).enhance!==0)throw Error('Independent enhancement');
S.gold=100000;eq.materials={stone:1000,shard:1000,gem:1000,essence:1000};r.perform(S,uid,'star');r.perform(S,uid,'gem');const upgraded=eq.items.find(i=>i.uid===uid),stamp=[upgraded.enhance,upgraded.stars,upgraded.gems].join();if(!r.perform(S,uid,'craft').ok||upgraded.template!=='bow-t3'||[upgraded.enhance,upgraded.stars,upgraded.gems].join()!==stamp||eq.equipped.bow!==uid)throw Error('Craft progression transfer');
S.gold=0;const poor=JSON.stringify(S);if(r.perform(S,uid,'enhance').ok||JSON.stringify(S)!==poor)throw Error('Unaffordable action mutated save');S.gold=100000;if(r.salvage(S,uid).ok)throw Error('Equipped salvage allowed');if(!r.salvage(S,spare.uid).ok||eq.items.some(i=>i.uid===spare.uid))throw Error('Spare salvage failed');
const bad=JSON.parse(JSON.stringify(eq));bad.equipped.armor=bad.equipped.bow;if(r.valid(bad))throw Error('Wrong slot accepted');const dup=JSON.parse(JSON.stringify(eq));dup.items.push({...dup.items[0]});if(r.valid(dup))throw Error('Duplicate uid accepted');const extra=JSON.parse(JSON.stringify(eq));extra.equipped.extra=extra.equipped.bow;if(r.valid(extra))throw Error('Extra equipped bonus accepted');
for(const invalidId of ['toString','constructor','__proto__']){const malicious=r.fresh(S);malicious.items[13].template=invalidId;if(r.valid(malicious))throw Error('Prototype key accepted as gear template')}const full=r.fresh(S);while(full.items.length<80)full.items.push({uid:full.nextId++,template:'bow-t1',enhance:0,stars:0,gems:0});const bagFull={...S,equipment:full};if(!r.addDrop(bagFull,3).converted||full.items.length!==80||!r.valid(full))throw Error('Full bag conversion');if(!valid(S))throw Error('Mutated gear save invalid');
`,context);
vm.runInContext(`
S=defaults();const A=globalThis.WonderAdventure;if(!A.valid(undefined))throw Error('Legacy adventure save rejected');
for(const bad of [null,{...A.fresh(),pending:-1},{...A.fresh(),clears:{bad:1}},{...A.fresh(),claimed:['first','first']}])if(A.valid(bad))throw Error('Malformed adventure accepted');
const savedGold=S.gold;const first=A.victory(S,'mistwood');if(first!==500||A.victory(S,'mistwood')!==0||S.adventure.pending!==2)throw Error('First clear or spin grant');S.dungeonWins=2;S.gold+=first;
if(A.claim(S,'first')!==600||A.claim(S,'first')!==0||A.claim(S,'hunter')!==0)throw Error('Quest duplicate or early claim');
const snapshot=JSON.parse(JSON.stringify(S));if(!valid(snapshot)||snapshot.adventure.pending!==2)throw Error('Pending spins not saved');S=snapshot;
const beforeWheel=S.gold;const prize=A.spin(S,()=>.8);if(prize.gold!==700||S.gold!==beforeWheel+700||S.adventure.pending!==1)throw Error('Wheel prize mismatch');
A.spin(S,()=>.99);const once=JSON.stringify(S);if(A.spin(S)!==null||JSON.stringify(S)!==once)throw Error('Wheel double award');
S.dungeonWins=6;if(A.contract(S)!==900||A.contract(S)!==900||A.contract(S)!==0)throw Error('Repeat contract overpaid');
stopGame();S=defaults();launchBattle('dungeon','honey');game.stage=2;battleEnemy();game.crawl.hero.x=330;const shieldHP=game.enemy.hp;battleSkill('burst');const shieldHit=shieldHP-game.enemy.hp;game.burstCD=0;game.enemy.hp=game.enemy.maxhp;game.dungeon={...game.dungeon,mechanic:null};const unshieldHP=game.enemy.hp;battleSkill('burst');if(shieldHit>=unshieldHP-game.enemy.hp||shieldHit<1)throw Error('Shield must soften burst damage');
for(const d of DUNGEONS){if(!d.boss||d.enemy.length!==3)throw Error('Incomplete dungeon');}if(DUNGEONS.length!==9||new Set(DUNGEONS.map(d=>d.boss)).size!==9)throw Error('Unique bosses missing');
stopGame();S=defaults();launchBattle('dungeon','mistwood');game.stage=2;game.cleared=2;battleEnemy();game.enemy.hp=1;battleDamage(99999);const settled=JSON.stringify(S);endBattle(true);if(S.adventure.pending!==1||S.adventure.clears.mistwood!==1||JSON.stringify(S)!==settled)throw Error('Boss reward duplicated');
stopGame();S=defaults();launchBattle('dungeon','mistwood');game.cleared=1;endBattle(false);if(S.adventure?.pending)throw Error('Loss gave wheel spin');
`,context);
vm.runInContext(`
stopGame();S=defaults();launchBattle('dungeon','mistwood');const startX=game.crawl.hero.x;updateBattle(.2);if(game.crawl.hero.x<=startX)throw Error('Dungeon ranger does not walk');
moveRanger(999,-999);if(game.crawl.hero.tx!==640||game.crawl.hero.ty!==235)throw Error('Movement escapes room bounds');
const h=game.crawl.hero;h.x=638;h.y=316;h.tx=h.x;h.ty=h.y;updateBattle(.01);if(game.stage!==0)throw Error('Locked door skipped guardian');
h.x=280;h.tx=280;battleDamage(999999);if(!game.crawl.exitReady||game.ended||S.adventure?.pending)throw Error('Guardian should open door without boss reward');
for(let i=0;i<180;i++)updateBattle(1/60);if(game.stage!==0)throw Error('Room advanced without entering doorway');
walkDungeon();for(let i=0;i<240&&game.stage===0;i++)updateBattle(1/60);if(game.stage!==1||game.enemy.name!==DUNGEONS[0].enemy[1]||game.crawl.exitReady)throw Error('Next hall did not spawn guardian');
const beforePhysicalDodge=game.hp;game.crawl.danger={x:100,y:300,r:74};game.crawl.hero.x=400;game.crawl.hero.y=300;enemyStrike(2.5,true);if(game.hp!==beforePhysicalDodge)throw Error('Physical dodge failed');
stopGame();
`,context);
vm.runInContext(`
for(const id of DUNGEONS.map(d=>d.id)){const sample=defaults(),r=globalThis.WonderGear,eq=r.state(sample);sample.equipment=eq;const before=JSON.parse(JSON.stringify(eq)),t=r.bossLootTables[id],reward=r.bossLoot(sample,id,()=>.99);if(!reward.entry||eq.items.length!==before.items.length+1||r.catalog[reward.entry.template].tier!==t.tier||reward.entry.stars!==t.stars||reward.entry.enhance!==t.enhance)throw Error('Boss item quality');if(!t.slots.includes(r.catalog[reward.entry.template].slot)||JSON.stringify(eq.equipped)!==JSON.stringify(before.equipped))throw Error('Boss pool or automatic replacement');for(const m of r.materialDefs)if(eq.materials[m.id]!==before.materials[m.id]+t[m.id])throw Error('Boss materials doubled');if(!valid(sample))throw Error('Boss gear not saveable');const next=r.bossLoot(defaults(),id,()=>0);if(t.chance&&r.catalog[next.entry.template].tier!==t.bonusTier)throw Error('Higher-tier roll');}
const fullSample=defaults(),rules=globalThis.WonderGear,fullEq=rules.fresh(fullSample);fullSample.equipment=fullEq;while(fullEq.items.length<80)fullEq.items.push({uid:fullEq.nextId++,template:'bow-t1',enhance:0,stars:0,gems:0});const oldCrystal=fullEq.materials.stone,oldCount=fullEq.items.length,converted=rules.bossLoot(fullSample,'sunspire',()=>.99);if(!converted.converted||converted.entry||fullEq.items.length!==oldCount||fullEq.materials.stone!==oldCrystal+55+20||converted.stone!==75||!valid(fullSample))throw Error('Full bag boss conversion');
stopGame();S=defaults();launchBattle('dungeon','mistwood');game.stage=2;game.cleared=2;battleEnemy();const countBeforeBoss=rules.state(S).items.length;game.enemy.hp=1;battleDamage(99999);if(S.equipment.items.length!==countBeforeBoss+1)throw Error('Boss equipment missing');const paidBoss=JSON.stringify(S);endBattle(true);if(JSON.stringify(S)!==paidBoss)throw Error('Boss loot duplicate claim');
`,context);
vm.runInContext(`
{
const P=WonderProgress,edge={...defaults(),xp:P.xpCap-10};if(P.level(edge.xp)!==1499||P.award(edge,450,50)!==10||P.level(edge.xp)!==1500||P.award(edge,999)!==0)throw Error('Level cap or actualXP');if(P.level(1500)!==11||P.level(1e12)!==1500)throw Error('Legacy level preservation or capped stats');
for(const bad of [null,{day:'2026-11-12',used:3,completed:0},{day:'2026-02-30',used:1,completed:0},{day:'2026-11-12',used:1,completed:-1}])if(P.validDaily(bad))throw Error('Malformed EXP daily save');if(!P.validDaily(undefined))throw Error('Old EXP save rejected');
const dailySave=defaults(),today=Date.UTC(2026,10,12,23,59),tomorrow=Date.UTC(2026,10,13);if(!P.consume(dailySave,today)||!P.consume(dailySave,today)||P.consume(dailySave,today))throw Error('Daily entry limit');dailySave.expDungeon.completed=7;if(!P.consume(dailySave,tomorrow)||dailySave.expDungeon.used!==1||dailySave.expDungeon.completed!==7)throw Error('UTC rollover');if(!valid(JSON.parse(JSON.stringify(dailySave))))throw Error('Daily save reload');
for(const members of [[],['nyra'],['nyra','pip']]){stopGame();S=defaults();expParty=[...members];const expectedXP=expAwardPreview(members.length),beforeGear=JSON.stringify(S.equipment);startExpDungeon();const entered=JSON.stringify(S.expDungeon);startExpDungeon();if(JSON.stringify(S.expDungeon)!==entered||game.expRun.party.length!==members.length)throw Error('Double entry or group snapshot');expParty=[];for(let i=0;i<15000&&!game.ended;i++){if(game.crawl.exitReady)walkDungeon();battleSkill('burst');if(game.hp<game.maxhp*.72)battleSkill('heal');if(game.telegraph>0&&game.telegraph<.7)battleSkill('dodge');updateBattle(1/60);}if(!game.won||S.xp!==expectedXP||S.expDungeon.completed!==1||S.expDungeon.used!==1||S.dungeonWins!==0||S.adventure?.pending||JSON.stringify(S.equipment)!==beforeGear)throw Error('EXP clear rewards or wrong mode');const after=JSON.stringify(S);endBattle(true);if(JSON.stringify(S)!==after)throw Error('EXP duplicate payout');if(!valid(S))throw Error('EXP save rejected');}
stopGame();S=defaults();expParty=[];startExpDungeon();endBattle(false);if(S.xp!==0||S.expDungeon.used!==1||S.expDungeon.completed!==0)throw Error('Failed run reward/entry');startExpDungeon();endBattle(false);const fullDay=JSON.stringify(S);startExpDungeon();if(JSON.stringify(S)!==fullDay||S.expDungeon.used!==2)throw Error('Third EXP attempt accepted');
stopGame();S={...defaults(),xp:P.xpCap};startExpDungeon();if(S.expDungeon||stats().level!==1500)throw Error('Cap consumed entry');stopGame();
}
`,context);
console.log('PASS: level1500 cap, legacy XP, daily UTC rollover, two entries, reload, party XP, frozen groups, full EXP dungeon victories, no gear/wheel exploit and duplicate claims.');
console.log('PASS: nine boss loot tables, guaranteed gear quality, targeted slots, rare tier rolls, no auto replacement, exact materials, full bag conversion and one-time payout.');
console.log('PASS: room movement, clamped controls, locked doors, explicit traversal, guardian spawning and physical boss dodge.');
console.log('PASS: nine bosses, legacy saves, first-clear once, quest claims, repeat contracts, persistent spins, exact wheel payout and duplicate settlement.');

console.log('PASS: legacy gear migration, independent instances, atomic costs, craft transfer, salvage protection, slot validation and full bag drops.');

console.log('PASS: independent AI activity, old saves, dungeon victory, pause skills, sparring, single rewards and finish routing.');

console.log('PASS: wish milestones, guaranteed choice, exchange, duplicate rewards, tower spawning, merge and physics.');
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0000_wonder.sql','utf8').replaceAll('--> statement-breakpoint',''));
const env={DB:{prepare(sql){
 const stmt=db.prepare(sql);let args=[];
 return {bind(...a){args=a;return this},async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){return {meta:{changes:Number(stmt.run(...args).changes)}}}};
}}};
const worker=(await import('../src/server.js')).default;
const save=vm.runInContext('JSON.parse(JSON.stringify(defaults()))',context);
const req=(route,method='GET',body,uid='test-user',origin)=>{const headers={};if(uid)headers['oai-authenticated-user-id']=uid;if(body){headers['Content-Type']='application/json'}if(origin)headers.Origin=origin;return new Request('https://wonder.test'+route,{method,headers,body:body?JSON.stringify(body):undefined})};
assert.equal((await worker.fetch(req('/api/save','GET',null,null),env)).status,401);
assert.deepEqual(await (await worker.fetch(req('/api/save'),env)).json(),{save:null,revision:0});
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:0}),env)).status,200);
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:0}),env)).status,409);
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:1},'test-user','https://evil.test'),env)).status,403);
assert.equal((await worker.fetch(req('/api/save','PUT',{save:{...save,gold:-1},revision:1}),env)).status,400);
assert.equal((await worker.fetch(req('/api/save','PUT',{save:{...save,gold:4200},revision:1}),env)).status,200);
const own=await(await worker.fetch(req('/api/save'),env)).json();assert.equal(own.revision,2);assert.equal(own.save.gold,4200);
assert.equal((await(await worker.fetch(req('/api/save','GET',null,'other-user'),env)).json()).save,null);
assert.equal((await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries.length,0);
assert.equal((await worker.fetch(req('/api/leaderboard','POST',{}),env)).status,200);
assert.equal((await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries.length,1);
const catalogRules=globalThis.WonderGear;const gearSave={...save,equipment:catalogRules.fresh(save)};gearSave.equipment.items[0].enhance=4;assert.equal((await worker.fetch(req('/api/save','PUT',{save:gearSave,revision:2}),env)).status,200);const gearHall=(await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries;assert.equal(gearHall[0].power,catalogRules.stats(gearSave).power);assert.equal(gearHall[0].isSelf,1);assert.equal('user_id' in gearHall[0],false);const invalidGear=JSON.parse(JSON.stringify(gearSave));invalidGear.equipment.equipped.crown=invalidGear.equipment.equipped.bow;assert.equal((await worker.fetch(req('/api/save','PUT',{save:invalidGear,revision:3}),env)).status,400);
const expCloudSave={...gearSave,xp:globalThis.WonderProgress.xpCap,expDungeon:{day:'2026-11-12',used:2,completed:1}};assert.equal((await worker.fetch(req('/api/save','PUT',{save:expCloudSave,revision:3}),env)).status,200);const expCloud=await(await worker.fetch(req('/api/save'),env)).json();assert.deepEqual(expCloud.save.expDungeon,expCloudSave.expDungeon);assert.equal(globalThis.WonderGear.stats(expCloud.save).level,1500);assert.equal((await worker.fetch(req('/api/save','PUT',{save:{...expCloudSave,expDungeon:{...expCloudSave.expDungeon,used:3}},revision:4}),env)).status,400);
console.log('PASS: cloud equipment validation and exact client/server power parity.');
console.log('PASS: authenticated saves, user isolation, revision conflicts, input validation, origin protection, opt-in leaderboard.');

vm.runInContext(`
S=defaults();const beforeArena=JSON.stringify(S),now=Date.UTC(2026,10,12,12),bots=ADVENTURERS.map(b=>botSnapshot(b,now));
if(!(Math.max(...bots.map(b=>b.power))>stats().power&&Math.min(...bots.map(b=>b.power))<stats().power))throw Error('AI skill spread missing');
if(!ADVENTURERS.every(b=>JSON.stringify(botSnapshot(b,now))===JSON.stringify(botSnapshot(b,now))))throw Error('Simulation must be deterministic');
if(!ADVENTURERS.every(b=>botSnapshot(b,now+86400000).power>=botSnapshot(b,now).power))throw Error('AI progress regressed');
rankingEntries=[{name:'Cloud Ranger',power:22222,level:40}];rankingMode='power';const powerRows=rankingRows(now);if(!powerRows.every((e,i)=>i===0||powerRows[i-1].power>=e.power))throw Error('Ranking order');
if(powerRows.filter(e=>e.ai).length!==6||powerRows.filter(e=>e.self).length!==1)throw Error('AI/hero membership');
rankingMode='merge';if(rankingRows(now).some(e=>e.online))throw Error('Unreported online merge scores');
if(JSON.stringify(S)!==beforeArena)throw Error('Simulation changed player save');
rankingMode='power';rankingEntries=[];
openScreen('merge');togglePause();if(!document.querySelector('#pauseBtn').innerHTML.includes('gpt-icon'))throw Error('Pause icon lost');togglePause();if(!document.querySelector('#pauseBtn').innerHTML.includes('gpt-icon'))throw Error('Resume icon lost');
`,context);
console.log('PASS: deterministic AI ranking, varied skill, progress, ordered categories, AI labels, save isolation and persistent pause icons.');

vm.runInContext(`
S=defaults();rankingMode='power';rankingEntries=[{name:S.name,power:22000,level:10,isSelf:0},{name:'My old name',power:23000,level:10,isSelf:1}];if(rankingRows().filter(e=>e.online).length!==1||!rankingRows().some(e=>e.online&&e.name===S.name))throw Error('Same-name player incorrectly hidden');
rankingMode='merge';rankingMarkup(true);if(rankingMode!=='merge')throw Error('Journal changed ranking category');rankingMode='power';rankingEntries=[];
globalThis.Image=function(){};const drawCalls=[],paint={save(){},restore(){},translate(){},scale(){},drawImage(...a){drawCalls.push(a)}};for(const id of ['reina-walk','reina-shoot'])ART_IMAGE_CACHE.set(id,{complete:true,naturalWidth:1200,naturalHeight:800});const animState={clock:0,heroShotAt:-100,crawl:{hero:{x:0,y:0,tx:100,ty:0}}};const beforeAnimation=JSON.stringify(animState);drawReina(paint,animState,100,300,150,200);animState.clock=.2;drawReina(paint,animState,100,300,150,200);if(drawCalls.length!==2||drawCalls[0][1]===drawCalls[1][1]&&drawCalls[0][2]===drawCalls[1][2])throw Error('Walk frames do not advance');animState.clock=0;if(JSON.stringify(animState)!==beforeAnimation)throw Error('Rendering mutated state');animState.crawl=null;animState.heroShotAt=0;drawReina(paint,animState,100,300,150,200);animState.clock=.45;drawReina(paint,animState,100,300,150,200);if(drawCalls[2][1]===drawCalls[3][1]&&drawCalls[2][2]===drawCalls[3][2])throw Error('Shooting frames do not advance');ART_IMAGE_CACHE.clear();delete globalThis.Image;
`,context);
console.log('PASS: same-name players, private self marker, category isolation and changing walk/shoot frames without state mutation.');
