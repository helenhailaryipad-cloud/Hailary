import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const elements=new Map();function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',disabled:false,style:{setProperty(){}},setAttribute(name,value){this[name]=String(value)},classList:{add(){},remove(){},toggle(){}},close(){this.open=false},showModal(){this.open=true},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:720,height:520}}});return elements.get(key)}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Blob,URL,Promise,document:{body:{dataset:{},classList:{add(){},remove(){},contains(){return false}}},querySelector:el,addEventListener(){},createElement:()=>({click(){}})},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},fetch:async()=>({ok:false}),setTimeout:()=>0,clearTimeout(){},setInterval:()=>0,clearInterval(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/art-meta.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/generated-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/progression-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/fish-catalog.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/gear-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-data.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/adventure-ui.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/boss-art.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/dungeon-crawl.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/exp-dungeon.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/world.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/arena.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/game-polish.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/minigame-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/wardrobe-engine.js','utf8'),context);
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);
vm.runInContext(`
S=defaults();S.gold=30000;openScreen('fashion');
if(reinaDresses.length!==20)throw Error('Clothing catalog');
for(const dress of reinaDresses){
  clothingPreview=dress.id;
  if(!reinaLookPath(false,2,dress.id).includes('#registered-'))throw Error('Old body renderer remains');
  const balance=S.gold;
  wearOutfit('reina',dress.id,false);wearOutfit('reina',dress.id,false);
  if(S.gold!==balance-dress.gold||!ownsOutfit(dress.id)||currentDress()!==dress.id||!valid(S))throw Error('Outfit purchase or ownership');
  if(!reinaLookPath(true).includes('#mounted-'+fittedDressId(dress.id)+'-'))throw Error('Mounted outfit');
}
S=defaults();
S=defaults();S.gold=30000;openScreen('fashion');
if(!['Dresses','Hair','Weapons'].every(tab=>document.querySelector('#nav').innerHTML.includes('>'+tab+'<')))throw Error('Fashion tabs');
wearOutfit('reina','pearl',false);
for(const category of ['Hair','Weapons']){
  changeFashionTab(category);
  const set=styleSets[category];
  if(set.names.filter(Boolean).length!==21)throw Error('Missing fashion styles');
  if(category==='Weapons'){
    // 12 and 13 are the compositor's legacy and original bows, never purchasable styles.
    for(const reserved of [12,13]){stylePick=reserved;const gold=S.gold;wearStyle();if(S.gold!==gold||S.atelier?.weapon===reserved)throw Error('Reserved bow number sold');}
    stylePick=14;if(!styleFittingRoom(set).includes('Aurora Arc'))throw Error('New bow preview');
  }
  for(let n=1;n<=10;n++){
    stylePick=n;
    const before=S.gold;
    if(!styleFittingRoom(set).includes(set.names[n-1]))throw Error('Style preview');
    wearStyle();wearStyle();
    if(S.gold!==before-set.price||currentDress()!=='pearl'||wornStyle(set)!==n)throw Error('Independent style purchase');
  }
}
if(!reinaLookPath(false).includes('#registered-pearl-10-10'))throw Error('Registered body with weapon');
S=normalizeAdventure(JSON.parse(JSON.stringify(S)));
if(!valid(S)||S.atelier.hair!==10||S.atelier.weapon!==10)throw Error('Style persistence');
changeFashionTab('Hair');stylePick=0;wearStyle();
if(S.atelier.weapon!==10||currentDress()!=='pearl'||S.atelier.hair!==0)throw Error('Independent reset');
S=defaults();S.gold=10000;openScreen('fashion');
if(!document.querySelector('#main').innerHTML.includes('#registered-grove-1-0')||document.querySelector('#main').innerHTML.includes('Layered fitting'))throw Error('Registered body must be the main Fashion view');
const savedOwned=['pearl','nightbloom'];S.costumes={owned:[...savedOwned],equipped:{reina:'pearl'}};
changeFashionTab('Dresses');wearRegisteredLook('frostlace',1);const afterDress=S.gold;wearRegisteredLook('frostlace',1);
if(afterDress!==8800||S.gold!==afterDress||!savedOwned.every(id=>ownsOutfit(id)))throw Error('Preserve owned dresses and single purchase');
changeFashionTab('Hair');wearRegisteredLook('frostlace',2);const afterHair=S.gold;wearRegisteredLook('frostlace',2);
if(afterHair!==8400||S.gold!==afterHair||currentDress()!=='frostlace')throw Error('Independent registered hair purchase');
S=normalizeAdventure(JSON.parse(JSON.stringify(S)));
if(S.reinaLayers.dress!=='frostlace'||S.reinaLayers.hair!==2||!valid(S)||!reinaLookPath(false).includes('#registered-frostlace-2-'))throw Error('Registered appearance persistence');
changeFashionTab('Dresses');wearRegisteredLook('base',2);
if(S.reinaLayers.dress!=='frostlace'||S.reinaLayers.hair!==2||S.gold!==afterHair)throw Error('Technical swimsuit must not be equippable');
if(fittingDresses.some(([id])=>id==='base'))throw Error('No swimsuit in Fashion');
if(fittedDressId('base')!=='grove')throw Error('Legacy swimsuit must migrate to a complete outfit');
changeFashionTab('Hair');wearRegisteredLook('base',0);
if(S.reinaLayers.hair!==2||S.reinaLayers.dress!=='frostlace'||S.gold!==afterHair)throw Error('Bald selection must be rejected');
S.reinaLayers.hair=0;if(registeredLook().hair!==1)throw Error('Legacy bald appearance must use a hairstyle');
if(fittingHairs.some(([id])=>id===0))throw Error('No bald option in Fashion');
S=defaults();
const namedLegacy={...defaults(),name:'Reyna',gold:1234,xp:456};const legacyBefore=JSON.stringify({...namedLegacy,name:'REINA'});normalizeAdventure(namedLegacy);if(JSON.stringify(namedLegacy)!==legacyBefore)throw Error('Name correction must preserve progress');if(normalizeAdventure({...defaults(),name:'Nyra'}).name!=='Nyra')throw Error('Keep custom hero names');if(comparable({...defaults(),name:'REINA'})!==comparable(normalizeAdventure({...defaults(),name:'Reyna'})))throw Error('Name correction must not create cloud conflict');
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
stopGame();S.xp=44*WonderProgress.xpPerLevel;
const frostGate=DUNGEONS.find(d=>d.id==='frost');
if(!bossEntryButton(frostGate).includes('disabled'))throw Error('Missing boss lock');
launchBattle('dungeon','frost');if(game?.running)throw Error('Locked boss entered');
S.xp=49*WonderProgress.xpPerLevel;launchBattle('dungeon','frost');
if(game?.source!=='frost'||bossEntryButton(frostGate).includes('disabled'))throw Error('Boss failed to unlock');
stopGame();S.xp=1500;launchBattle('dungeon','mistwood');gamePaused=true;const cd=game.burstCD;battleSkill('burst');if(game.burstCD!==cd)throw Error('Paused skill executed');gamePaused=false;
const dungeonRun=game;for(let i=0;i<12000&&!dungeonRun.ended;i++){if(game.crawl?.exitReady)walkDungeon();battleSkill('burst');if(!game)break;if(game.hp<game.maxhp*.72)battleSkill('heal');if(game.telegraph>0&&game.telegraph<.65)battleSkill('dodge');updateBattle(1/60)}if(game!==null||screen!=='dungeons'||!dungeonRun.won||dungeonRun.cleared!==3||S.dungeonWins!==1)throw Error('Dungeon cannot be cleared');const dg=S.gold;endBattle(true);if(S.gold!==dg)throw Error('Dungeon duplicated reward');
launchBattle('spar','pip');game.enemy.hp=1;battleDamage(100);if(!game.won||S.sparWins!==1)throw Error('AI spar does not complete');const sg=S.gold;endBattle(true);if(S.gold!==sg)throw Error('Spar duplicated reward');
launchBattle('dungeon','moonfall');game.cleared=1;const early=S.gold;finishEarly();if(S.gold!==early+60||!game.ended)throw Error('Dungeon finish routing');
const oldSave=defaults();delete oldSave.dungeonWins;delete oldSave.sparWins;if(!valid(oldSave))throw Error('Old saves rejected');if(valid({...oldSave,dungeonWins:-1}))throw Error('Invalid dungeon wins accepted');
`,context);

vm.runInContext(`
S=defaults();S.upgrades.bow=7;S.upgrades.ring=3;const r=globalThis.WonderGear,legacyStats=r.stats(S),eq=r.fresh(S);if(eq.items.find(i=>i.uid===eq.equipped.bow).enhance!==7||eq.items.find(i=>i.uid===eq.equipped.spiritluck).enhance!==3)throw Error('Legacy enhancements lost');S.equipment=eq;if(JSON.stringify(r.stats(S))!==JSON.stringify(legacyStats))throw Error('Migration doubled stats');if(!valid(S))throw Error('Gear save invalid');
S.xp=99*150;const uid=eq.equipped.bow,spare=eq.items.find(i=>i.template==='bow-t3');r.perform(S,spare.uid,'equip');if(eq.equipped.bow!==spare.uid)throw Error('Equip did not replace slot');
r.perform(S,uid,'equip');const oldGold=S.gold,stones=eq.materials.stone;const p=r.cost(eq.items.find(i=>i.uid===uid),'enhance');if(!r.perform(S,uid,'enhance').ok||S.gold!==oldGold-p.gold||eq.materials.stone!==stones-p.stone)throw Error('Enhancement cost');if(eq.items.find(i=>i.uid===spare.uid).enhance!==0)throw Error('Independent enhancement');
S.gold=100000;eq.materials={stone:1000,shard:1000,gem:1000,essence:1000,synthesis:1000};r.perform(S,uid,'star');r.perform(S,uid,'gem');const upgraded=eq.items.find(i=>i.uid===uid),stamp=[upgraded.enhance,upgraded.stars,upgraded.gems].join();if(!r.perform(S,uid,'craft').ok||upgraded.template!=='bow-t2'||[upgraded.enhance,upgraded.stars,upgraded.gems].join()!==stamp||eq.equipped.bow!==uid)throw Error('Craft progression transfer');
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
stopGame();S=defaults();S.xp=99*WonderProgress.xpPerLevel;launchBattle('dungeon','honey');game.stage=2;battleEnemy();game.crawl.hero.x=330;const shieldHP=game.enemy.hp;battleSkill('burst');const shieldHit=shieldHP-game.enemy.hp;game.burstCD=0;game.enemy.hp=game.enemy.maxhp;game.dungeon={...game.dungeon,mechanic:null};const unshieldHP=game.enemy.hp;battleSkill('burst');if(shieldHit>=unshieldHP-game.enemy.hp||shieldHit<1)throw Error('Shield must soften burst damage');
for(const d of DUNGEONS){if(!d.boss||d.enemy.length!==3)throw Error('Incomplete dungeon');}if(DUNGEONS.length!==5*WonderGear.maxTier||new Set(DUNGEONS.map(d=>d.id)).size!==DUNGEONS.length)throw Error('Unique bosses missing');
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
for(const id of DUNGEONS.map(d=>d.id)){const sample=defaults(),r=globalThis.WonderGear,eq=r.state(sample);sample.equipment=eq;const before=JSON.parse(JSON.stringify(eq)),t=r.bossLootTables[id],reward=r.bossLoot(sample,id,()=>.99);if(!reward.entry||eq.items.length!==before.items.length+1||r.catalog[reward.entry.template].tier!==r.bossGearTier(sample)||reward.entry.stars!==t.stars||reward.entry.enhance!==t.enhance)throw Error('Boss item quality');if(!t.slots.includes(r.catalog[reward.entry.template].slot)||JSON.stringify(eq.equipped)!==JSON.stringify(before.equipped))throw Error('Boss pool or automatic replacement');for(const m of r.materialDefs)if(eq.materials[m.id]!==before.materials[m.id]+(t[m.id]||0))throw Error('Boss materials doubled');if(!valid(sample))throw Error('Boss gear not saveable');for(const [lvl,tier] of [[44,1],[45,2],[49,2],[50,3],[95,3],[100,4],[1500,31]]){const hero=defaults();hero.xp=(lvl-1)*WonderProgress.xpPerLevel;const prize=r.bossLoot(hero,id,()=>.7);if(r.catalog[prize.entry.template].tier!==tier)throw Error('Boss reward level band '+id+' at '+lvl);}}
{const hero=defaults(),r=WonderGear;hero.xp=1499*WonderProgress.xpPerLevel;const rolls=[.95,1/30,0];const reward=r.bossLoot(hero,'mistwood',()=>rolls.shift());if(r.catalog[reward.entry.template].tier!==3)throw Error('T3 must remain available at level cap');
 hero.xp=49*WonderProgress.xpPerLevel;hero.gold=99999;const target=r.addDrop(hero,2,'bow'),donors=Array.from({length:4},()=>r.addDrop(hero,2,'boots').uid);const before=JSON.stringify(hero);
 if(r.perform(hero,target.uid,'star',[...donors.slice(1),target.uid]).ok||JSON.stringify(hero)!==before)throw Error('Invalid star sacrifice spent resources');
 if(!r.perform(hero,target.uid,'star',donors).ok||target.template!=='bow-t2'||target.stars!==1||hero.equipment.items.some(i=>donors.includes(i.uid)))throw Error('Same-tier star crafting failed');}
{const s=defaults(),a=WonderAdventure;for(let i=0;i<5;i++)if(!a.spendStamina(s,0))throw Error('Missing daily entry');if(a.spendStamina(s,0)||!a.spendStamina(s,86400000))throw Error('Stamina reset');for(let tier=1;tier<=WonderGear.maxTier;tier++){if(DUNGEONS.filter(d=>d.tier===tier).length!==5)throw Error('Boss count');}if(visibleDungeons().length>7)throw Error('Future bosses exposed');}
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
console.log('PASS: nine boss loot tables, guaranteed gear quality, targeted slots, level-matched tiers, no auto replacement, exact materials, full bag conversion and one-time payout.');
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

vm.runInContext(`
{const fake={crawl:{enemy:{x:520,y:400}},enemy:{boss:true,hp:100}};if(!hitsDungeonEnemy(fake,520,170)||hitsDungeonEnemy(fake,200,170)||hitsDungeonEnemy(fake,520,450))throw Error('Boss body hit bounds');
const reward=mergeReward({score:4000,won:true});if(reward.gold!==1700||reward.wishes!==400||reward.xp!==120)throw Error('Merge reward preview mismatch');
const g={towers:[{type:0,level:2}],selected:0,choice:0,energy:89,ended:false};gamePaused=false;if(defenseControlState(g).canUpgrade)throw Error('Unaffordable upgrade');g.energy=90;if(!defenseControlState(g).canUpgrade||defenseControlState(g).cost!==90)throw Error('Upgrade price');g.towers[0].level=4;if(!defenseControlState(g).max||defenseControlState(g).canUpgrade)throw Error('Max upgrade');
const currentGold=S.gold;game={kind:'battle',ended:false};const original=game;requestFinish();if(!gamePaused||game.ended)throw Error('Retreat must pause');cancelFinish();if(gamePaused||game.ended||S.gold!==currentGold)throw Error('Cancel retreat must preserve run');requestFinish();game={kind:'merge',ended:false};confirmFinish();if(game.ended)throw Error('Stale retreat ended another run');game=null;gamePaused=false;}
`,context);
console.log('PASS: full boss body hitbox, exact merge preview, affordable/MAX upgrades and cancellable identity-safe retreat.');

vm.runInContext(`
{const shoot=WonderArtMeta['reina-shoot'];for(let frame=0;frame<6;frame++){const box=reinaSpriteBox(shoot.frames[frame],72,105,shoot.maxFrameHeight);if(box.h<96||box.h>106)throw Error('TD shooting shrink returned');}const poses=[0,.11,.21,.31,.41,.51].map(clock=>reinaFrame({clock,heroShotAt:0}).frame);if(new Set(poses).size!==6)throw Error('TD must play all shooting frames');
openScreen('defense');game.enemies=[{id:1,x:500,y:150,hp:500,maxhp:500,speed:0,slow:0}];game.towers=[{x:150,y:150,type:0,level:1,cd:0}];updateDefense(1/120);if(game.enemies[0].hp!==500||game.shots.length!==1||game.towers[0].shotAt!==game.clock)throw Error('Damage before projectile arrival');const damage=game.shots[0].damage;for(let i=0;i<132;i++)updateDefense(1/120);if(Math.abs(game.enemies[0].hp-(500-damage))>.001)throw Error('Projectile must hit exactly once');game.enemies=[];for(let i=0;i<120;i++)updateDefense(1/120);if(game.kills!==0)throw Error('Orphan projectile rewarded');
const fixture=()=>[{x:135,y:440,r:17,k:0,vx:-80,vy:0,age:3},{x:155,y:440,r:17,k:0,vx:40,vy:0,age:3},{x:360,y:400,r:30,k:2,vx:5,vy:30,age:3},{x:360,y:400,r:38,k:3,vx:-5,vy:0,age:3},{x:430,y:350,r:23,k:1,vx:0,vy:80,age:3}];
const runs=[];for(const fps of [20,30,60,120]){openScreen('merge');game.balls=fixture();for(let i=0;i<fps*4;i++)updateMerge(1/fps);runs.push({score:game.score,overflow:game.overflow,balls:game.balls.map(b=>[b.x,b.y,b.vx,b.vy,b.k])});for(const b of game.balls)if(!Number.isFinite(b.x+b.y+b.vx+b.vy)||b.x-b.r<101.99||b.x+b.r>618.01||b.y+b.r>487.01)throw Error('Eggs escaped bounds');}for(const run of runs.slice(1)){if(run.score!==runs[0].score||JSON.stringify(run.balls)!==JSON.stringify(runs[0].balls))throw Error('Frame-rate dependent egg simulation');}
openScreen('merge');game.balls=[{x:360,y:450,r:17,k:0,vx:0,vy:0,age:3}];gamePaused=true;const frozen=JSON.stringify(game);updateMerge(.1);if(JSON.stringify(game)!==frozen)throw Error('Paused physics advanced');gamePaused=false;
// Exercise all eight waves with a reproducible affordable build strategy.
const randomBefore=Math.random;let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);S=defaults();openScreen('defense');for(let lane=0;lane<3;lane++){game.energy-=60;game.towers.push({lane,col:0,x:150,y:150+lane*130,type:0,level:1,cd:0,shotAt:-100});}for(let wave=1;wave<=8&&!game.ended;wave++){for(let lane=0;lane<3;lane++)if(!game.towers.some(t=>t.lane===lane&&t.col===1)&&game.energy>=130){game.energy-=130;game.towers.push({lane,col:1,x:255,y:150+lane*130,type:2,level:1,cd:0,shotAt:-100});}for(let lev=1;lev<4;lev++)for(const t of game.towers)if(t.level===lev&&game.energy>=45*lev){game.energy-=45*lev;t.level++;}nextWave();for(let tick=0;tick<120*110&&game.active&&!game.ended;tick++)updateDefense(1/120);}Math.random=randomBefore;if(!game.won||game.cleared!==8||game.energy<0)throw Error('Eight-wave defense balance regression');}
`,context);
console.log('PASS: TD six poses/size, projectile arrival and no orphan payouts, deterministic 20/30/60/120 FPS eggs, wall/stack bounds, paused physics and affordable eight-wave defense victory.');

vm.runInContext(`{const b={x:360,y:470,r:17,k:0,vx:100,vy:0,squash:0};for(let i=0;i<7;i++)constrainEgg(b);if(b.vx!==100)throw Error('Boundary solver must not multiply floor friction');}`,context);
vm.runInContext(`{const root=rangerBackAnchor({left:100,top:20,width:200,height:600},720,1080,{left:100,top:0});if(root.x!==100||Math.abs(root.y-266)>0.001)throw Error('Contained wing back anchor');}`,context);

vm.runInContext(`
stopGame();S=defaults();S.equipment=WonderGear.fresh(S);const extended=stats();
for(const key of ['accuracy','dodge','critDamage','critResistance','shieldHealth','elementalAttack','elementalDefense','armor','attackInterval','healing'])if(!Number.isFinite(extended[key]))throw Error('Missing advanced stat '+key);
const gearBefore=JSON.stringify(S);openHeroStats();showHeroStatTab('advanced');explainHeroStat('armor');if(JSON.stringify(S)!==gearBefore)throw Error('Inspecting stats changed save');
const savedRandom=Math.random;Math.random=()=>.99;
launchBattle('dungeon','mistwood');game.enemy.attack=100;game.stats.defense=0;game.stats.damageReduction=0;game.stats.block=0;game.stats.dodge=0;game.stats.critResistance=100;game.shield=60;const hpBefore=game.hp;
launchEnemyStrike(game,1);if(game.shield!==60||game.hp!==hpBefore)throw Error('Damage before projectile arrival');
const dodgeStartY=game.crawl.hero.y;
battleSkill('dodge');updateCrawl(game,.46);
if(Math.abs(game.crawl.hero.y-dodgeStartY)!==52)throw Error('Dodge must move Reina sideways');if(game.shield!==60||game.hp!==hpBefore)throw Error('In-flight dodge failed');
game.evade=0;
enemyStrike(1);if(game.shield!==0||game.hp!==hpBefore-40)throw Error('Barrier must absorb once and pass remainder to HP');
game.stage=1;battleEnemy();if(game.shield!==0)throw Error('New hall refilled barrier');
game.stats.dodge=100;const dodgeHP=game.hp;Math.random=()=>0;enemyStrike(1);if(game.hp!==dodgeHP)throw Error('Dodge stat inactive');
game.stats.dodge=0;game.stats.critResistance=30;game.stats.elementalDefense=100;game.stats.defense=0;game.stats.block=0;game.stats.damageReduction=0;game.enemy.attack=100;const elementalHP=game.hp;enemyStrike(1,true);if(elementalHP-game.hp!==Math.round(100*100/135))throw Error('Elemental DEF must apply only to power strikes');
Math.random=savedRandom;stopGame();
`,context);
console.log('PASS: advanced stats, read-only inspection, shield spillover and no hall refill, passive dodge and elemental defense.');

vm.runInContext(`
S=defaults(); screen='warehouse';
transferGear(11,true);
S=JSON.parse(JSON.stringify(S));
if (!WonderGear.valid(S.equipment)||!S.equipment.items.find(i=>i.uid===11).stored) throw Error('Warehouse reload');
if (WonderGear.perform(S,11,'equip').ok||WonderGear.salvage(S,11).ok) throw Error('Stored item protection');
transferGear(11,false);
S.xp=99*150;if (!WonderGear.perform(S,11,'equip').ok) throw Error('Withdrawn item must be usable');
transferGear(11,true);
if (S.equipment.items.find(i=>i.uid===11).stored) throw Error('Equipped item deposit');
for(const section of Object.keys(sectionPages)){
 screen=section; nav();
 if(!sectionPages[section].every(([,label])=>document.querySelector('#nav').innerHTML.includes('>'+label+'</button>')))throw Error('Missing section page in '+section);
}
`,context);
console.log('PASS: main sections with detail pages, warehouse persistence and equipped item protection.');

vm.runInContext(`
S=defaults(); startMerge();
const originalDrawEgg=drawEgg, aimDraws=[];
drawEgg=(...args)=>aimDraws.push(args);
const aimCanvas={save(){},restore(){},setLineDash(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},arc(){}};
drawNestAim(aimCanvas,game);
if(aimDraws.length!==1||aimDraws[0][2]!==64)throw Error('Aim must show one ready egg and no ghost egg');
mergeDrop();mergeDrop();
if(game.balls.length!==1)throw Error('Repeated drop creates duplicate eggs');
aimDraws.length=0;drawNestAim(aimCanvas,game);
if(aimDraws.length)throw Error('Ready egg overlaps the dropped egg during cooldown');
drawEgg=originalDrawEgg;stopGame();
`,context);
console.log('PASS: one egg per drop, no ghost egg at landing and no overlapping preview during release.');

vm.runInContext(`
S=defaults();
const catalogue=MoonwaterFish;
if(catalogue.species.length!==100||catalogue.byId.size!==100)throw Error('Incomplete fish collection');
const legacyFish=catalogue.migrateLegacy({'Moonfin Trout':{count:2,kg:4.2}});
if(legacyFish['moonfin-trout'].count!==2||!catalogue.valid(legacyFish))throw Error('Legacy catch migration');
S.fishCards={};
for(const f of catalogue.species){
 const before=stats()[f.bonus.key];
 window.WonderFishAlbum.catch(f.id,f.max);
 window.WonderFishAlbum.catch(f.id,f.min);
 const after=stats()[f.bonus.key],r=S.fishCards[f.id];
 if(after-before!==2*f.bonus.amount||r.count!==2||r.kg!==f.max)throw Error('Wrong stacked card bonus for '+f.name);
}
const restored=JSON.parse(JSON.stringify(S));
if(!valid(restored)||Object.keys(restored.fishCards).length!==100||WonderGear.stats(restored).power!==stats().power)throw Error('Card album did not survive save');
if(valid({...S,fishCards:{unlisted:{count:1,kg:1}}}))throw Error('Unknown species accepted');
`,context);
console.log('PASS: 100 collectable species, legacy catches, exact duplicate stat bonuses and saved card album.');

vm.runInContext(`
S=defaults();S.gold=50000;openScreen('fashion');
if(fittingDresses.length!==22||fittingHairs.length!==21)throw Error('Registered wardrobe incomplete');
for(const {id,outfit} of reinaDresses){
 changeFashionTab('Dresses');clothingPreview=id;
 if(!registeredFashionRoom().includes(outfit==='Moonlit Ballerina'?'Amethyst Lace':outfit))throw Error('Missing garment choice');
 const balance=S.gold;wearRegisteredLook(id,registeredLook().hair);wearRegisteredLook(id,registeredLook().hair);
 if(S.gold!==balance-1200||registeredLook().dress!==id||currentDress()!==id)throw Error('Registered garment purchase '+id);
 for(let hair=1;hair<=10;hair++){
  changeFashionTab('Hair');const before=S.gold,owned=hair===1||styleOwned(styleSets.Hair,hair);
  wearRegisteredLook(id,hair);wearRegisteredLook(id,hair);
  if(S.gold!==before-(owned?0:400)||registeredLook().dress!==id||registeredLook().hair!==hair)throw Error('Independent combination '+id+'/'+hair);
  if(!registeredLookPath().includes('#registered-'+id+'-'+hair+'-0'))throw Error('Wrong composed layer key');
  S=normalizeAdventure(JSON.parse(JSON.stringify(S)));
  if(!valid(S)||registeredLook().dress!==id||registeredLook().hair!==hair)throw Error('Combination did not persist');
 }
}
S=defaults();S.costumes={owned:['pearl'],equipped:{reina:'pearl'}};S.reinaFashion={owned:2,equipped:2};S.atelier={owned:['hair9'],hair:9};
if(registeredLook().dress!=='pearl'||registeredLook().hair!==9)throw Error('Existing wardrobe was reset');
S=defaults();
`,context);
for(const id of ['grove','dawnpetal','frostlace','nightbloom','sunweave','tidal','emberveil','willow','stardust','pearl','sapphire']){
 assert(fs.existsSync('src/assets/generated/fit-control-'+id+'.webp'),'Missing layer '+id);
 assert(fs.existsSync('src/assets/generated/fit-icon-'+id+'.webp'),'Missing icon '+id);
}
for(let hair=1;hair<=10;hair++)assert(fs.existsSync('src/assets/generated/fit-control-hair-'+hair+'.webp'),'Missing hair '+hair);
console.log('PASS: all 100 dress/hair combinations, ownership, independent purchases and saved appearance.');

await vm.runInContext(`(async()=>{
 S=defaults();openScreen('fashion');changeFashionTab('Hair');
 const originalRenderer=renderRegisteredLook,originalLoader=styleImage;
 const pending=new Map();renderRegisteredLook=(dress,hair)=>new Promise(resolve=>pending.set(hair,resolve));styleImage=async src=>({src});
 const before=document.querySelector('#main').innerHTML;
 const older=previewRegisteredHair(3),newer=previewRegisteredHair(8);
 if(document.querySelector('#main').innerHTML!==before)throw Error('Current hair removed before next image was ready');
 pending.get(8)('data:image/png;base64,new');await newer;
 if(stylePick!==8)throw Error('Newest hair did not appear');
 pending.get(3)('data:image/png;base64,old');await older;
 if(stylePick!==8)throw Error('Slow old response replaced new hairstyle');
 const cancelled=previewRegisteredHair(5);changeFashionTab('Dresses');pending.get(5)('data:image/png;base64,cancelled');await cancelled;
 if(fashionCategory!=='Dresses'||stylePick!==null)throw Error('Pending preview changed a different tab');
 renderRegisteredLook=originalRenderer;styleImage=originalLoader;readyRegisteredLooks.clear();S=defaults();
})()`,context);
console.log('PASS: current hairstyle stays visible during loading, rapid selections and tab cancellation.');

vm.runInContext(`
 S=defaults();screen='fashion';const leafGold=S.gold;wearLeaflightSet();
 if(currentDress()!=='leaflight'||registeredLook().hair!==11||S.atelier.weapon!==11)throw Error('Leaflight equip incomplete');
 if(S.gold!==leafGold)throw Error('Free Leaflight charged gold');
 if(!reinaLookPath(true).includes('#mounted-leaflight-11'))throw Error('Mounted Leaflight reverted');
 if(!reinaLookPath(false).includes('leaflight'))throw Error('Standing Leaflight reverted');
 if(!ownsRegisteredDress('leaflight')||!styleOwned(styleSets.Hair,11))throw Error('Leaflight ownership missing');
 S=defaults();
`,context);
console.log('PASS: Leaflight equip, free ownership and standing/mounted routing.');

vm.runInContext(`{
 S=defaults();screen='fashion';wearLeaflightSet();S.mountId='silver-tabby';
 fashionCategory='Hair';wearRegisteredLook('leaflight',2);
 if(!currentMount()||registeredLook().hair!==2||registeredLook().dress!=='leaflight')throw Error('Hair change reverted mounted outfit');
 if(!reinaLookPath(true).includes('#mounted-leaflight-2'))throw Error('Mounted look does not follow the hairstyle');
 wearLeaflightSet();S.mountId='silver-tabby';fashionCategory='Weapons';stylePick=3;S.gold=10000;wearStyle();
 if(!currentMount()||S.atelier.weapon!==3||registeredLook().dress!=='leaflight')throw Error('Weapon change reverted mounted outfit');
 wearLeaflightSet();S.mountId='silver-tabby';if(!currentMount()||!reinaLookPath(true).includes('#mounted-leaflight-11'))throw Error('Complete riding set broken');
 S.reinaLayers={dress:'emberveil',hair:9};if(!reinaLookPath(true).includes('#mounted-emberveil-9'))throw Error('Mounted look does not follow the dress');

 const meta=document.querySelector('meta[name="wonder-release"]');meta.content='release-a';const first=artPath('fit-control-body');meta.content='release-b';const second=artPath('fit-control-body');
 if(first===second||!second.endsWith('?v=release-b')||!registeredLookPath().includes('?v=release-b#registered-'))throw Error('Stale wardrobe cache');
 delete meta.content;S=defaults();
}`,context);
for(const id of vm.runInContext('fittingDresses.map(x=>x[0])',context))assert(fs.existsSync('src/assets/generated/fit-control-mount-'+id+'.webp'),'Missing mounted dress '+id);
for(const id of vm.runInContext('fittingHairs.map(x=>x[0])',context))assert(fs.existsSync('src/assets/generated/fit-control-mounthair-'+id+'.webp'),'Missing mounted hair '+id);
for(const id of vm.runInContext('fittingDresses.map(x=>x[0])',context))for(const part of ['','-erase'])assert(fs.existsSync('src/assets/generated/fit-control-'+id+part+'.webp'),'Missing dress layer '+id+part);
for(const id of vm.runInContext('fittingHairs.map(x=>x[0])',context))assert(fs.existsSync('src/assets/generated/fit-control-hair-'+id+'.webp'),'Missing hair layer '+id);
for(const id of vm.runInContext('[...wardrobeBackHairs]',context))assert(fs.existsSync('src/assets/generated/fit-control-hair-'+id+'-back.webp'),'Missing back hair '+id);
for(const wing of vm.runInContext('fashionWings.map(x=>x.id)',context))assert(fs.existsSync('src/assets/generated/'+wing+'.webp'),'Missing wings '+wing);
for(const n of vm.runInContext("styleSets.Weapons.names.map((name,i)=>name&&i+1!==11?i+1:0).filter(Boolean)",context))assert(fs.existsSync('src/assets/generated/weapon-style-'+n+'.webp'),'Missing bow '+n);
assert.equal(vm.runInContext("WonderGear.stats({...defaults(),reinaFashion:{wingSkin:'fashion-wing-20'}}).shieldHealth-WonderGear.stats(defaults()).shieldHealth",context),vm.runInContext('WonderGear.fashionTraits.wings',context),'New wings give no bonus');
vm.runInContext(`{
 S=defaults();S.gold=5000;screen='fashion';fashionCategory='Mounts';
 if(mounts.length!==21||chosenMount().id!=='silver-tabby')throw Error('Mount catalog');
 mountPreview='moon-unicorn';if(ownsMount('moon-unicorn'))throw Error('Unbought mount owned');
 const gold=S.gold;rideFashionMount();rideFashionMount();
 if(S.gold!==gold-1500||!ownsMount('moon-unicorn')||currentMount().id!=='moon-unicorn'||!valid(S))throw Error('Mount purchase');
 if(!reinaLookPath(true).endsWith('~moon-unicorn'))throw Error('Mounted look ignores the mount');
 toggleMount();if(currentMount())throw Error('Dismount');toggleMount();if(currentMount().id!=='moon-unicorn')throw Error('Ride forgot the chosen mount');
 S.gold=10;mountPreview='ember-fox';rideFashionMount();if(ownsMount('ember-fox')||currentMount().id!=='moon-unicorn')throw Error('Mount sold without gold');
 mountPreview='silver-tabby';rideFashionMount();if(currentMount().id!=='silver-tabby'||reinaLookPath(true).includes('~'))throw Error('Free tabby');
 S.mountPick='not-a-mount';if(chosenMount().id!=='silver-tabby')throw Error('Unknown mount pick');
 screen='home';S=defaults();
}`,context);
for(const m of vm.runInContext('mounts.slice(1).map(m=>m.id)',context))for(const f of ['fit-control-ride-','mount-icon-'])assert(fs.existsSync('src/assets/generated/'+f+m+'.webp'),'Missing mount art '+f+m);
vm.runInContext(`{
 S=defaults();S.gold=2000;const G=WonderGear,count=Object.fromEntries(Object.entries(G.companionSkins).map(([k,l])=>[k,l.length]));
 if(count.elf!==21||count.cloak!==20||count.back!==10||count.footprint!==10||count.tail!==10)throw Error('Companion catalog');
 if(wardrobeExtrasTag()!=='')throw Error('Fresh save wears an accessory');
 if(!G.useCompanionSkin(S,'cloak','moonveil')||S.gold!==2000)throw Error('First appearance is free');
 if(!G.useCompanionSkin(S,'cloak','royal')||S.gold!==1400||!G.useCompanionSkin(S,'cloak','royal')||S.gold!==1400)throw Error('Appearance bought once');
 if(!G.useCompanionSkin(S,'tail','kitsune')||wardrobeExtrasTag()!=='royal..kitsune')throw Error('Accessory tag');
 if(!registeredLookPath().endsWith('!royal..kitsune')||registeredLookPath(undefined,undefined,0,'','').includes('!'))throw Error('Portrait key ignores accessories');
 S.companions.cloak.hidden=true;if(wardrobeExtrasTag()!=='..kitsune')throw Error('Hidden accessory still drawn');S.companions.cloak.hidden=false;
 S.gold=10;if(G.useCompanionSkin(S,'elf','bluebell')||G.ownsCompanionSkin(S,'elf','bluebell'))throw Error('Appearance sold without gold');
 if(G.useCompanionSkin(S,'cloak','nope')||G.useCompanionSkin(S,'wings','x'))throw Error('Unknown appearance accepted');
 if(!valid(S))throw Error('Valid companion save rejected');
 const forged=JSON.parse(JSON.stringify(S));forged.companions.elf={level:1,tier:1,form:0,hidden:false,equipped:true,skin:'prism'};if(valid(forged))throw Error('Unowned appearance accepted');
 const junk=JSON.parse(JSON.stringify(S));junk.companionSkins=['cloak:royal','cloak:royal'];if(valid(junk))throw Error('Duplicate ownership accepted');
 const before=JSON.stringify(G.stats(defaults())),worn=defaults();G.useCompanionSkin(worn,'tail','fox');if(JSON.stringify(G.stats(worn))!==before)throw Error('Appearance changed stats');
 S=defaults();
}`,context);
for(const [key,list] of Object.entries(vm.runInContext('JSON.parse(JSON.stringify(WonderGear.companionSkins))',context)))for(const skin of list){
 const files=key==='elf'?(skin.id==='dreamveil'?[]:['comp-elf-'+skin.id]):key==='footprint'?['comp-step-'+skin.id]:['comp-'+key+'-'+skin.id,'comp-icon-'+key+'-'+skin.id];
 for(const f of files)assert(fs.existsSync('src/assets/generated/'+f+'.webp'),'Missing companion art '+f);
}
console.log('PASS: companion appearances: catalog, free first look, buy once, no sale without gold, validation, stats unchanged, art present.');
console.log('PASS: 20 extra mounts: purchase once, ride/dismount keeps the choice, no sale without gold, art present.');
console.log('PASS: any dress and hairstyle can ride with its own mounted layers; release-specific wardrobe URLs; second collection art present.');

await vm.runInContext(`(async()=>{
 S=defaults();screen='fashion';changeFashionTab('Wings');
 const originalRenderer=renderRegisteredLook,originalLoader=styleImage;
 const pending=new Map();renderRegisteredLook=(d,h,w,wing)=>new Promise(resolve=>pending.set(wing||String(w),resolve));styleImage=async src=>({src});
 const before=document.querySelector('#main').innerHTML;
 const old=previewRegisteredEquipment('Wings','fashion-wing-2'),newest=previewRegisteredEquipment('Wings','fashion-wing-3');
 if(document.querySelector('#main').innerHTML!==before)throw Error('Wing preview removed current portrait before decode');
 pending.get('fashion-wing-3')('data:image/png;base64,wing3');await newest;
 pending.get('fashion-wing-2')('data:image/png;base64,wing2');await old;
 if(wingPreview!=='fashion-wing-3')throw Error('Stale wings replaced newer selection');
 changeFashionTab('Weapons');const cancelled=previewRegisteredEquipment('Weapons',2);changeFashionTab('Dresses');pending.get('2')('data:image/png;base64,weapon2');await cancelled;
 if(fashionCategory!=='Dresses'||stylePick!==null)throw Error('Pending weapon preview escaped tab cancellation');
 renderRegisteredLook=originalRenderer;styleImage=originalLoader;readyRegisteredLooks.clear();S=defaults();
 if(registeredLookPath().includes('fit-control-body'))throw Error('Technical body used as loading placeholder');
})()`,context);
console.log('PASS: atomic wings/weapons previews, stale requests ignored, technical body never used as placeholder.');
// Pets: spare copies, synthesis, assist pages, and the rebuilt Pets room renders every page.
vm.runInContext(`{
 const r=WonderGear;S=defaults();
 if(r.assistSlots(S)!==12||r.petTeam(S).length!==15)throw Error('A new hero has one page of twelve assist slots');
 S.xp=49*WonderProgress.xpPerLevel;if(r.assistSlots(S)!==24)throw Error('Level 50 opens the second assist page');
 S.xp=299*WonderProgress.xpPerLevel;if(r.assistSlots(S)!==48||r.petTeam(S).length!==51)throw Error('Level 300 opens all four assist pages');
 S=defaults();const commons=r.familiars.filter(p=>p.rarity==='Common').map(p=>p.id),rares=r.familiars.filter(p=>p.rarity==='Rare').map(p=>p.id);
 if(r.synthesizePet(S,'Rare',Array(6).fill(commons[0])))throw Error('Synthesis needs spare copies');
 r.addPetSpare(S,commons[0],4);r.addPetSpare(S,commons[1],2);r.addPetSpare(S,'d0');
 if(S.petSpares.d0!==undefined||!valid(S))throw Error('Only summoned pets have spare copies');
 if(r.synthesizePet(S,'Rare',[...Array(5).fill(commons[0]),commons[1]]))throw Error('Cannot use more copies than she has');
 if(r.synthesizePet(S,'Epic',[...Array(4).fill(commons[0]),commons[1],commons[1]]))throw Error('Six Commons do not make an Epic');
 const made=r.synthesizePet(S,'Rare',[...Array(4).fill(commons[0]),commons[1],commons[1]],()=>0);
 if(!made||made.id!==rares[0]||!made.isNew||!S.owned.includes(rares[0])||Object.keys(S.petSpares).length||!valid(S))throw Error('Six spare Commons make one random Rare and are used up');
 r.addPetSpare(S,commons[2],6);const again=r.synthesizePet(S,'Rare',Array(6).fill(commons[2]),()=>0);
 if(again.isNew||S.petSpares[rares[0]]!==1)throw Error('A pet she already has becomes a spare copy');
 S.petSpares={d0:1};if(valid(S))throw Error('Invalid spare copies accepted');S.petSpares={[commons[0]]:0};if(valid(S))throw Error('Zero spare copies accepted');
 S=defaults();S.gold=5000;openScreen('cityPet');
 for(const page of ['Formation','Gallery','Assist','Badge','Synthesize']){petTab(page);const html=$('#main').innerHTML;if(!html.includes('den-top')||html.includes('<svg class="dragon-'))throw Error('Pets page '+page+' did not render with painted pets');}
 petTab('Formation');const before=r.petLevel(S,'d0');petFeed();if(r.petLevel(S,'d0')!==before+1||S.gold!==4900)throw Error('Fast Feed raises the level for gold');
 if(item('d0').title!=='GROVE DRAGONLING'||item('d0').name!=='Willow')throw Error('Pet titles match their paintings; names are unchanged');
}`,context);
console.log('PASS: pets: assist pages by level, spare copies, six-copy synthesis, validation, rebuilt Pets pages, Fast Feed.');
// Pets fight in the dungeon halls beside Reina.
vm.runInContext(`{
 stopGame();S=defaults();S.owned.push('d1','d37');S.petPartners=['d1','d37'];const keepRandom=Math.random;Math.random=()=>.5;
 startBattle('dungeon','mistwood');const g=game,a=g.crawl;updateCrawl(g,.016);
 if(a.pets.map(p=>p.id).join()!=='d0,d1,d37')throw Error('The three Primary Pets enter the hall with Reina');
 if(!a.pets.every(p=>p.x<a.hero.x))throw Error('Pets stand behind Reina');
 g.enemy.hp=g.enemy.maxhp=1e7;const hp=g.enemy.hp;petSupport(g,5);if(g.enemy.hp!==hp)throw Error('Pets hold fire until the enemy is engaged');
 a.engaged=true;g.stats.damageBonus=0;g.stats.penetration=0;for(const p of a.pets)p.cd=0;petSupport(g,.01);
 const dealt=a.pets.reduce((n,p)=>n+Math.round(WonderGear.petAttack(S,p.id)*PET_HIT),0);
 if(hp-g.enemy.hp!==dealt||a.petShots.length!==3||!g.log.some(x=>x.includes('fight beside REINA')))throw Error('Each pet strikes for 35% of its ATK');
 petSupport(g,.5);if(hp-g.enemy.hp!==dealt)throw Error('Pets wait 2.4 s between bolts');
 a.hero.x=400;a.hero.y=300;for(let i=0;i<120;i++)movePets(g,.016);if(Math.abs(a.pets[0].x-(400+PET_SPOTS[0][0]))>2)throw Error('Pets follow Reina');
 if(petArtId('d2')!=='d2'||petArtId('d37')!=='familiar-37')throw Error('Pet art ids');
 Math.random=keepRandom;stopGame();
}`,context);
console.log('PASS: pets in dungeons: enter with Reina, follow her, hold fire until engaged, strike for 35% ATK every 2.4 s.');
// The Pets tab of Wonders opens the new Pets room; Summon lives inside it; the flat pet drawings are gone.
vm.runInContext(`{
 stopGame();S=defaults();filter='dragon';openScreen('collection');
 if(screen!=='cityPet'||petBack!=='wonders'||!$('#main').innerHTML.includes('den-top'))throw Error('Wonders > Pets opens the Pets room');
 petLeave();if(screen!=='collection'||filter!=='wings')throw Error('Its back arrow returns to Wonders (Wings)');
 chooseSectionPage('collection');if(screen!=='cityPet')throw Error('The Pets section tab opens the Pets room');
 openScreen('home');openScreen('cityPet');if(petBack!=='')throw Error('Opened from the city, it returns to the city');
 petTab('Summon');if(!$('#main').innerHTML.includes('summonPets(10)'))throw Error('Summon page is inside the room');
 S.tickets=500;const had=S.owned.length,keep=Math.random;Math.random=()=>.99;summonPets(10);Math.random=keep;
 if(S.tickets!==0||S.owned.length!==had+1||screen!=='cityPet'||petPage!=='Summon')throw Error('Summoning spends wishes and stays in the room');
 const pulled=S.owned[S.owned.length-1];if(S.petSpares[pulled]!==9||!valid(S))throw Error('Repeats of one pet become spare copies');
 for(const id of ['d0','d1','d2','d3'])if(dragonSVG(item(id)).includes('<svg')||!dragonSVG(item(id)).includes(id+'.webp'))throw Error('Painted art for '+id);
 if(!dragonSVG(item('d1'),5).includes('<svg'))throw Error('Evolution preview keeps its star forms');
}`,context);
console.log('PASS: Wonders > Pets opens the Pets room and returns; Summon inside the room; painted pets replace the flat drawings.');
// Pet talents and pet gear: rules, validation, effect on Reina and on pet bolts, and the three new pages.
vm.runInContext(`{
 const r=WonderGear;stopGame();S=defaults();
 const t0=r.talentState(S);if(t0.seals!==300||t0.books!==0||t0.slots.length!==3||t0.slots[0].open!==6||S.petTalents!==undefined)throw Error('Talents start with 300 seals and six open cells, without touching the save');
 if(r.petTalents.length!==26||new Set(r.petTalents.map(t=>t.id)).size!==26||r.petTalents.filter(t=>t.top).length!==3)throw Error('Twenty-six talents, three of them Top');
 const base=stats().attack;
 let roll=r.learnTalent(S,0,()=>0);if(!roll||roll.id!=='fang'||roll.cell!==0||r.talentState(S).seals!==240||!valid(S))throw Error('Learn inscribes a random talent into the first empty cell for 60 seals');
 r.lockTalent(S,0,0);if(r.learnCost(S,0)!==90)throw Error('Each lock makes Learn 50% dearer');
 for(let i=0;i<5;i++)r.addSeals(S,90),r.learnTalent(S,0,()=>0);
 let v=r.talentState(S).slots[0];if(v.cells.slice(0,6).join()!=='fang,surge,haste,star,pounce,bite')throw Error('Cells fill in order');
 r.addSeals(S,90);roll=r.learnTalent(S,0,()=>0);v=r.talentState(S).slots[0];
 if(roll.cell!==1||roll.replaces!=='surge'||v.cells[0]!=='fang'||v.cells[1]!=='giant')throw Error('A full slot overwrites an unlocked talent, never a locked one');
 r.setTalentTarget(S,0,'bond');r.addSeals(S,500);r.buyTalentBook(S);const held=r.learnTalent(S,0,()=>.2,true);v=r.talentState(S);
 if(!held.held||held.id!=='bond'||v.books!==0||v.slots[0].cells.includes('bond'))throw Error('Prophecy shows the result first; the target is likelier');
 if(!r.keepTalent(S,0,held)||!r.talentState(S).slots[0].cells.includes('bond')||stats().attack<=base)throw Error('Keeping it inscribes it; Bonded Might raises Reina ATK');
 const seals=r.talentState(S).seals;if(r.buyTalentScroll(S,0,'mend'))throw Error('A scroll needs an empty cell');
 if(!r.openTalentCell(S,0)||r.talentState(S).seals!==seals-50||!r.buyTalentScroll(S,0,'mend')||r.talentState(S).slots[0].cells[6]!=='mend')throw Error('Open a cell for seals, then inscribe a scroll');
 if(r.guardTalents(S).mend!==1||r.guardTalents(S).stand!==0)throw Error('Healing talents are counted');
 // Top talents: never from Learn, never a Learn target, dearer scrolls.
 for(let i=0;i<40;i++){const x=r.rollTalent(S,1,Math.random);if(!x||r.petTalents.find(t=>t.id===x.id).top)throw Error('Learn never rolls a Top talent')}
 if(r.setTalentTarget(S,1,'apexfury')||r.talentPrice('apexfury')!==1000||r.talentPrice('fang')!==400)throw Error('Top talents are scroll only and cost more');
 {const had=r.talentState(S).seals;r.addSeals(S,1000);if(!r.buyTalentScroll(S,1,'apexaegis')||r.talentState(S).seals!==had||!r.talentIds(S,1).includes('apexaegis')||!valid(S))throw Error('A Top scroll inscribes its talent')}
 if(!r.forgetTalent(S,0,6)||r.guardTalents(S).mend!==0||!valid(S))throw Error('Forget frees a cell');
 const fam=r.familiars.find(p=>p.rarity==='Common').id;r.addPetSpare(S,fam,3);const before=r.talentState(S).seals;
 if(r.exchangeSpares(S,'Common')!==60||r.talentState(S).seals!==before+60||r.petSpares(S,fam)!==0)throw Error('Spare copies become seals');
 S.gold=1000;if(!r.buySeals(S)||S.gold!==0||r.buySeals(S))throw Error('Gold buys seals');
 for(const bad of [{seals:-1,books:0,slots:r.talentState(S).slots},{seals:1,books:0,slots:[]},{seals:1,books:0,slots:[{open:6,cells:Array(15).fill(null).map((x,i)=>i===9?'fang':null),locks:[],target:''},...r.talentState(S).slots.slice(1)]}]){const keep=S.petTalents;S.petTalents=bad;if(valid(S))throw Error('Invalid talents accepted');S.petTalents=keep}
 // bolts: talents multiply, in order; gear adds pet ATK and a set bonus
 S=defaults();const plain=r.petBolt(S,0,'d0',{count:1},()=>.5);if(plain!==Math.round(r.petAttack(S,'d0')*.35))throw Error('A plain bolt is 35% of pet ATK');
 S.petTalents={seals:0,books:0,slots:[{open:6,cells:['fang','pounce','giant',null,null,null,...Array(9).fill(null)],locks:[],target:''},...r.talentState(S).slots.slice(1)]};
 if(r.petBolt(S,0,'d0',{first:true,boss:true,count:1},()=>.5)!==Math.round(r.petAttack(S,'d0')*.35*1.25*3*1.3)||r.petBolt(S,1,'d0',{first:true,boss:true,count:1},()=>.5)!==plain)throw Error('Talents of a slot shape only that slot');
 if(r.petBoltPace(S,0)!==2.4)throw Error('Pace without Quick Wing');
 S.petTalents.slots[1].cells=['venom','flux','apexfury',null,null,null,...Array(9).fill(null)];
 if(r.petBolt(S,1,'d0',{count:3},()=>.5)!==Math.round(r.petAttack(S,'d0')*.35*1.12*1.6*1.5))throw Error('Venom Fang, Tidal Flux and Apex Fury multiply');
 S.petTalents.slots[1].cells=Array(15).fill(null);
 S.gold=200;const hp=stats().health,team=r.petTeamAttack(S);
 if(!r.upgradePetGear(S,0,0)||S.gold!==0||r.petGearLevels(S,0)[0]!==1||r.petTeamAttack(S)!==team+4||r.upgradePetGear(S,0,0)||!valid(S))throw Error('Forging a horn piece costs gold and adds pet ATK');
 S.gold=1e7;for(let i=0;i<10;i++)r.upgradePetGear(S,0,3);if(r.petGearLevels(S,0)[3]!==10||stats().health!==hp+300)throw Error('Collar adds Reina HP');
 const shards=r.state(S).materials.shard;S.equipment=r.state(S);S.equipment.materials.shard=0;if(r.upgradePetGear(S,0,3))throw Error('A new tier needs shards');
 S.equipment.materials.shard=6;if(!r.upgradePetGear(S,0,3)||r.state(S).materials.shard!==0||r.petGearTier(11)!==2)throw Error('Tier-up spends shards');
 for(let p=0;p<8;p++)while(r.petGearLevels(S,0)[p]<1)r.upgradePetGear(S,0,p);
 if(r.petGearBonus(S,0).tier!==1||r.petGearBonus(S,0).dmg!==4)throw Error('Set bonus follows the lowest tier');
 S.petGear=[[1,2],[],[]];if(valid(S))throw Error('Invalid pet gear accepted');S.petGear=undefined;
 // pages render and act
 S=defaults();S.gold=5000;openScreen('cityPet');petMode='Gear';cityPet();if(!$('#main').innerHTML.includes('den-gearstage'))throw Error('Pet Gear page');
 petGearUp(1);if(r.petGearLevels(S,0)[0]!==1)throw Error('Upgrade button forges the chosen piece');
 talentGo(0);if(petPage!=='Talent'||!$('#main').innerHTML.includes('den-hexes'))throw Error('Pet Talent page');
 const keepRandom=Math.random;Math.random=()=>0;talentLearn();Math.random=keepRandom;if(r.talentIds(S,0).join()!=='fang'||talentCell!==0)throw Error('Learn button inscribes a talent');
 petTab('TalentShop');if(!$('#main').innerHTML.includes('den-wares'))throw Error('Talent Shop page');
 talentWare('haste');if(!$('#modalBody').innerHTML.includes('Quick Wing')||!$('#modalBody').innerHTML.includes('Item Description'))throw Error('Tapping a ware shows its item card first');
 talentBuy('book');if(r.talentState(S).books!==1)throw Error('Shop sells Prophecy Books');
 // Last Stand in a fight
 S.petTalents={seals:0,books:0,slots:[{open:6,cells:['stand',null,null,null,null,null,...Array(9).fill(null)],locks:[],target:''},...r.talentState(S).slots.slice(1)]};
 startBattle('dungeon','mistwood');game.crawl.engaged=true;game.hp=Math.round(game.maxhp*.2);const low=game.hp;petSupport(game,.01);
 if(game.hp!==low+Math.round(game.maxhp*.15))throw Error('Last Stand restores 15% below 30% health');
 game.hp=low;petSupport(game,.01);if(game.hp!==low)throw Error('Last Stand waits 60 seconds');stopGame();
 // Counter talents: Riposte answers a hit on Reina (once every 3 s); Aftershock doubles the pet's next bolt.
 S.petTalents={seals:0,books:0,slots:[{open:6,cells:['riposte','aftershock',null,null,null,null,...Array(9).fill(null)],locks:[],target:''},...r.talentState(S).slots.slice(1)]};
 const keepRand=Math.random;Math.random=()=>.99;startBattle('dungeon','mistwood');{const g=game,a=g.crawl;updateCrawl(g,.016);a.engaged=true;g.enemy.hp=g.enemy.maxhp=1e7;g.enemy.attack=10;g.stats.damageBonus=0;g.stats.penetration=0;g.stats.dodge=0;g.stats.block=0;g.hp=g.maxhp=1e6;
  const bolt=r.petBolt(S,0,'d0',{count:1}),back=r.petBolt(S,0,'d0',{riposte:true}),hp0=g.enemy.hp;enemyStrike(1);if(back!==Math.round((r.petAttack(S,'d0')+r.petGearBonus(S,0).atk)*.35*(1+r.petGearBonus(S,0).dmg/100)*.6))throw Error('A riposte is 60% of a bolt');
  if(hp0-g.enemy.hp!==back||!a.pets[0].charged)throw Error('Riposte strikes back for 60% of a bolt and Aftershock charges');
  enemyStrike(1);if(hp0-g.enemy.hp!==back)throw Error('Riposte waits three seconds');
  const hp1=g.enemy.hp;a.pets[0].cd=0;petSupport(g,.01);if(hp1-g.enemy.hp!==r.petBolt(S,0,'d0',{count:1,charged:true})||r.petBolt(S,0,'d0',{count:1,charged:true})<=bolt||a.pets[0].charged)throw Error('Aftershock doubles the next bolt once');}
 Math.random=keepRand;stopGame();
}`,context);
console.log('PASS: pet talents (learn, lock, prophecy, target, scrolls, exchange), pet gear (tiers, set), bolt maths, pages, Last Stand.');
// Home shows exactly the pets placed in the three Primary Pet slots, each in the spot of its slot.
vm.runInContext(`{
 stopGame();S=defaults();openScreen('home');let html=$('#main').innerHTML;
 if((html.match(/class="city-pet /g)||[]).length!==1||!html.includes('city-pet-0'))throw Error('A new hero has one pet beside her');
 S.owned.push('d12','d37');S.petPartners=[null,'d37'];openScreen('home');html=$('#main').innerHTML;
 if((html.match(/class="city-pet /g)||[]).length!==2||!html.includes('city-pet-2')||html.includes('city-pet-1'))throw Error('An empty slot stays empty on the home screen');
 S.petPartners=['d12','d37'];openScreen('home');html=$('#main').innerHTML;
 if((html.match(/class="city-pet /g)||[]).length!==3||!html.includes('familiar-12')||!html.includes('familiar-37'))throw Error('All three deployed pets stand beside Reina');
}`,context);
console.log('PASS: home screen shows exactly the three Primary Pets, each in the spot of its slot.');

vm.runInContext(`
{const r=WonderGear;S=defaults();
 // A fresh bag holds the starter kit; nothing is written until something changes.
 if(S.bag!==undefined||r.bagCount(S,'exp1')!==r.bagStarter.exp1||!r.bagStacks(S).some(x=>x.id==='petegg'))throw Error('Starter kit');
 const xp=S.xp,gold=S.gold;let use=r.useBagItem(S,'exp1',2);
 if(!use.ok||use.used!==2||S.xp!==xp+300||r.bagCount(S,'exp1')!==r.bagStarter.exp1-2||!valid(S))throw Error('Dew of Wisdom');
 use=r.useBagItem(S,'gold1',99);if(use.used!==r.bagStarter.gold1||S.gold!==gold+500*r.bagStarter.gold1||r.bagCount(S,'gold1')||Object.hasOwn(S.bag,'gold1'))throw Error('Use is capped by the stack');
 if(r.useBagItem(S,'gold1').ok||r.useBagItem(S,'nope').ok||r.bagAdd(S,'nope',1))throw Error('Unknown or empty stack');
 // A chest gives its fixed part and one surprise; the Moon Chest adds a piece of equipment.
 const stone=r.state(S).materials.stone;use=r.useBagItem(S,'chest1',1,()=>0);
 if(S.gold!==gold+1000+300||r.state(S).materials.stone!==stone+10||r.bagCount(S,'exp1')!==r.bagStarter.exp1-1||!use.gains.some(g=>g.kind==='item'&&g.id==='exp1'))throw Error('Oak Chest');
 r.bagAdd(S,'chest2',1);const pieces=r.state(S).items.length;use=r.useBagItem(S,'chest2',1,()=>.99);
 if(r.state(S).items.length!==pieces+1||!use.gains.some(g=>g.kind==='gear')||r.bagCount(S,'sealbag')!==1)throw Error('Moon Chest');
 const seals=r.talentState(S).seals;r.useBagItem(S,'sealbag');if(r.talentState(S).seals!==seals+50)throw Error('Seal Satchel');
 // The egg hatches a pet; one she already has becomes a spare copy.
 const first=r.familiars.find(p=>p.rarity==='Common').id;use=r.useBagItem(S,'petegg',1,()=>.9);
 const hatched=use.gains.find(g=>g.kind==='pet');if(!hatched||hatched.spare||!S.owned.includes(hatched.id))throw Error('Pet Egg');
 r.bagAdd(S,'petegg',1);use=r.useBagItem(S,'petegg',1,()=>.9);if(!use.gains[0].spare||r.petSpares(S,hatched.id)!==1)throw Error('Second egg must give a copy');
 // The tonic only works when stamina was spent today.
 if(r.useBagItem(S,'stam').ok||r.bagCount(S,'stam')!==1)throw Error('Tonic at full stamina');
 WonderAdventure.spendStamina(S);if(!r.useBagItem(S,'stam').ok||WonderAdventure.dailyDungeon(S).spent!==0)throw Error('Vigor Tonic');
 // Warehouse: whole stacks and materials move there and back; stored things cannot be used.
 r.bagAdd(S,'wish',3);const crystals=r.state(S).materials.stone;
 if(!r.vaultMove(S,'i:wish',true)||r.bagCount(S,'wish')||r.vaultCount(S,'i:wish')!==3||r.useBagItem(S,'wish').ok)throw Error('Deposit');
 if(!r.vaultMove(S,'m:stone',true)||r.state(S).materials.stone!==0||r.vaultCount(S,'m:stone')!==crystals||r.vaultMove(S,'m:stone',true)||r.vaultMove(S,'x:stone',true))throw Error('Material deposit');
 S=JSON.parse(JSON.stringify(S));if(!valid(S))throw Error('Bag save');
 r.bagAdd(S,'wish',1);r.vaultMove(S,'i:wish',false);r.vaultMove(S,'m:stone',false);
 if(r.bagCount(S,'wish')!==4||r.vaultCount(S,'i:wish')||r.state(S).materials.stone!==crystals||Object.keys(S.vault).length)throw Error('Withdraw');
 for(const bad of [{bag:{nope:1}},{bag:{exp1:0}},{vault:{'i:nope':1}},{vault:{'m:stone':-1}},{devour:-1},{devour:1.5}])if(valid({...S,...bad}))throw Error('Invalid bag accepted '+JSON.stringify(bad));
 // Devour: only spare pieces from the bag; the Maw's level adds to Reina's stats.
 const eq=r.state(S),worn=eq.equipped.bow,spare=r.devourable(S),before=stats();
 if(spare.some(e=>r.equipped(eq,e.uid)||e.stored)||r.devourGear(S,[worn]).ok||r.devourGear(S,[]).ok)throw Error('Devour must protect worn gear');
 const worth=spare.reduce((n,e)=>n+r.devourWorth(e),0),fed=r.devourGear(S,spare.map(e=>e.uid));
 if(!fed.ok||fed.gained!==worth||S.devour!==worth||r.devourable(S).length)throw Error('Devour');
 const st=r.devourState(S);let need=0;for(let l=0;l<st.level;l++)need+=r.devourNeed(l);
 if(st.level<1||st.into!==worth-need||fed.levels!==st.level)throw Error('Maw level');
 const after=stats();if(after.attack<=before.attack||after.health<=before.health||after.defense<=before.defense)throw Error('Maw bonus');
 if(r.devourBonus(S).attack!==st.level*r.devourStep.attack||!valid(JSON.parse(JSON.stringify(S))))throw Error('Devour save');
 // Screens: bag tabs, item card, use, warehouse taps, Devour room.
 r.bagAdd(S,'chest1',2);r.addPetSpare(S,first,2);r.addDrop(S,1);
 for(const tab of bagTabs){cityBagFilter=tab;openScreen('cityBag');if(!document.querySelector('#main').innerHTML.includes('Capacity: '))throw Error('Bag tab '+tab)}
 cityBagFilter='Pet';cityBag();if(!document.querySelector('#main').innerHTML.includes('2/'+r.synthNeed))throw Error('Pet copies in the bag');
 if(bagTabs.join()!=='Common,Materials,Pet,ALL'||!bagThings('Common').some(t=>t.gear))throw Error('The bag has four tabs; spare equipment is in Common');
 // Gear Crafting keeps Equipment, Necklace & Amulet and Rings apart: a piece only takes spare pieces of its own family.
 {const T=defaults();T.gold=1e6;T.equipment=r.state(T);T.equipment.materials.shard=99;
  const add=slot=>r.addDrop(T,1,slot).uid,bow=add('bow'),armour=[add('crown'),add('armor'),add('boots'),add('bow')],neck=[add('necklace'),add('amulet'),add('necklace'),add('amulet')],rings=[add('spiritluck'),add('spiritguard'),add('spiritluck'),add('spiritguard')];
  const item=r.state(T).items.find(e=>e.uid===bow),names=r.starDonors(r.state(T),item).map(e=>r.gearGroup(e.template));
  if(r.gearGroups.length!==3||!names.length||names.some(n=>n!=='Equipment'))throw Error('Equipment donors must be equipment');
  if(r.perform(T,bow,'star',neck).ok||r.perform(T,bow,'star',[...armour.slice(0,3),rings[0]]).ok)throw Error('Necklaces and rings must not feed equipment');
  if(!r.perform(T,bow,'star',armour).ok||!r.perform(T,neck[0],'star',[neck[1],neck[2],neck[3],add('amulet')]).ok||!r.perform(T,rings[0],'star',[rings[1],rings[2],rings[3],add('spiritguard')]).ok)throw Error('Each family crafts within itself');
  const keep=S;S=T;for(const g of r.gearGroups){craftFilter(1,null,g);const html=document.querySelector('#main').innerHTML;if(!html.includes('loom-kinds'))throw Error('Crafting tabs')}S=keep}
 cityBagFilter='Common';cityBag();const html=document.querySelector('#main').innerHTML;
 if(!html.includes("bagOpen('i:chest1')")||html.includes("bagOpen('p:"))throw Error('Common tab');
 bagOpen('i:chest1');if(!document.querySelector('#modalBody').innerHTML.includes('Oak Chest')||!document.querySelector('#modalBody').innerHTML.includes("bagUse('chest1',2)"))throw Error('Item card');
 bagUse('chest1',1);if(r.bagCount(S,'chest1')!==1||!document.querySelector('#modalBody').innerHTML.includes('You received'))throw Error('Use from the card');
 openScreen('cityVault');const piece=r.devourable(S)[0].uid;
 vaultTap('b','g:'+piece);if(r.state(S).items.find(e=>e.uid===piece).stored||!document.querySelector('#main').innerHTML.includes('Deposit'))throw Error('First tap only chooses');
 vaultTap('b','g:'+piece);if(!r.state(S).items.find(e=>e.uid===piece).stored)throw Error('Second tap deposits');
 vaultTap('v','g:'+piece);vaultTap('v','g:'+piece);if(r.state(S).items.find(e=>e.uid===piece).stored)throw Error('Withdraw by taps');
 vaultTap('b','i:chest1');vaultShift();if(r.vaultCount(S,'i:chest1')!==1)throw Error('Deposit button');
 openScreen('cityDevour');devourToggle(piece);if(!document.querySelector('#main').innerHTML.includes('Chosen: 1'))throw Error('Devour pick');
 devourFeed();if(r.state(S).items.some(e=>e.uid===piece)||!document.querySelector('#main').innerHTML.includes('Glimmer Maw'))throw Error('Devour room');
}
`,context);
console.log('PASS: bag items and chests, warehouse stacks, Devour levels, and the Bag / Warehouse / Devour screens.');
