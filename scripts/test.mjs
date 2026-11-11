import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const elements=new Map();function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',disabled:false,setAttribute(name,value){this[name]=String(value)},classList:{add(){},remove(){},toggle(){}},close(){this.open=false},showModal(){this.open=true},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:720,height:520}}});return elements.get(key)}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Blob,URL,Promise,document:{body:{dataset:{}},querySelector:el,addEventListener(){},createElement:()=>({click(){}})},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},fetch:async()=>({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/gear-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/world.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);
vm.runInContext(`
const namedLegacy={...defaults(),name:'Reyna',gold:1234,xp:456};const legacyBefore=JSON.stringify({...namedLegacy,name:'REINA'});correctHeroName(namedLegacy);if(JSON.stringify(namedLegacy)!==legacyBefore)throw Error('Name correction must preserve progress');if(correctHeroName({...defaults(),name:'Nyra'}).name!=='Nyra')throw Error('Keep custom hero names');if(comparable({...defaults(),name:'REINA'})!==comparable(correctHeroName({...defaults(),name:'Reyna'})))throw Error('Name correction must not create cloud conflict');
S=defaults();home();const progressBeforeIntro=JSON.stringify(S);const introPrefs=new Map(),originalGet=localStorage.getItem,originalSet=localStorage.setItem;localStorage.getItem=k=>introPrefs.get(k)||null;localStorage.setItem=(k,v)=>introPrefs.set(k,String(v));chooseIntro('2d');if(storedIntroStyle()!=='2d'||screen!=='home'||JSON.stringify(S)!==progressBeforeIntro)throw Error('2D return preserves adventure');openScreen('intro');chooseIntro('3d');if(storedIntroStyle()!=='3d'||screen!=='home'||JSON.stringify(S)!==progressBeforeIntro)throw Error('3D intro choice preserves adventure');localStorage.getItem=originalGet;localStorage.setItem=originalSet;
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
for(let i=0;i<6000&&!game.ended;i++){battleSkill('burst');if(game.hp<game.maxhp*.72)battleSkill('heal');if(game.telegraph>0&&game.telegraph<.65)battleSkill('dodge');updateBattle(1/60)}if(!game.won||game.cleared!==3||S.dungeonWins!==1)throw Error('Dungeon cannot be cleared');const dg=S.gold;endBattle(true);if(S.gold!==dg)throw Error('Dungeon duplicated reward');
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
const catalogRules=globalThis.WonderGear;const gearSave={...save,equipment:catalogRules.fresh(save)};gearSave.equipment.items[0].enhance=4;assert.equal((await worker.fetch(req('/api/save','PUT',{save:gearSave,revision:2}),env)).status,200);const gearHall=(await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries;assert.equal(gearHall[0].power,catalogRules.stats(gearSave).power);const invalidGear=JSON.parse(JSON.stringify(gearSave));invalidGear.equipment.equipped.crown=invalidGear.equipment.equipped.bow;assert.equal((await worker.fetch(req('/api/save','PUT',{save:invalidGear,revision:3}),env)).status,400);
console.log('PASS: cloud equipment validation and exact client/server power parity.');
console.log('PASS: authenticated saves, user isolation, revision conflicts, input validation, origin protection, opt-in leaderboard.');
