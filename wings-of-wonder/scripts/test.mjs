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
for(const id of DUNGEONS.map(d=>d.id)){const sample=defaults(),r=globalThis.WonderGear,eq=r.state(sample);sample.equipment=eq;const before=JSON.parse(JSON.stringify(eq)),t=r.bossLootTables[id],reward=r.bossLoot(sample,id,()=>.99);if(!reward.entry||eq.items.length!==before.items.length+3||reward.entries.map(e=>r.gearRank(e)).join()!==r.bossDropRanks.join()||reward.entries.map(e=>e.stars).join()!=='2,1,0'||reward.entries.some(e=>r.catalog[e.template].tier!==r.bossGearTier(sample)||e.enhance!==0))throw Error('Boss item quality');if(reward.entries.some(e=>!t.slots.includes(r.catalog[e.template].slot))||JSON.stringify(eq.equipped)!==JSON.stringify(before.equipped))throw Error('Boss pool or automatic replacement');for(const m of r.materialDefs)if(eq.materials[m.id]!==before.materials[m.id]+(t[m.id]||0))throw Error('Boss materials doubled');if(!valid(sample))throw Error('Boss gear not saveable');for(const [lvl,tier] of [[44,1],[45,2],[49,2],[50,3],[95,3],[100,4],[1500,31]]){const hero=defaults();hero.xp=(lvl-1)*WonderProgress.xpPerLevel;const prize=r.bossLoot(hero,id,()=>.7);if(r.catalog[prize.entry.template].tier!==tier)throw Error('Boss reward level band '+id+' at '+lvl);}}
{const hero=defaults(),r=WonderGear;hero.xp=1499*WonderProgress.xpPerLevel;const rolls=[.95,1/30,0];const reward=r.bossLoot(hero,'mistwood',()=>rolls.shift());if(r.catalog[reward.entry.template].tier!==3)throw Error('T3 must remain available at level cap');
 // Quality ladder: five Orange pieces of one tier and family make a 2-Star Red of the chosen slot.
 hero.xp=49*WonderProgress.xpPerLevel;const orange=Array.from({length:5},(_,i)=>r.addDrop(hero,2,['boots','crown','armor','bow','bracers'][i],2));orange[2].enhance=6;orange[4].gems=2;
 const ids=orange.map(e=>e.uid),ring=r.addDrop(hero,2,'spiritluck',2).uid,purple=r.addDrop(hero,2,'bow',1).uid,low=r.addDrop(hero,1,'bow',2).uid,before=JSON.stringify(hero);
 for(const bad of [[...ids.slice(1),ring],[...ids.slice(1),purple],[...ids.slice(1),low],[...ids.slice(1),ids[1]],[...ids,ids[0]],[],[hero.equipment.equipped.bow]])if(r.craftGear(hero,'bow',2,3,bad).ok||JSON.stringify(hero)!==before)throw Error('Invalid craft spent pieces '+bad);
 if(r.craftGear(hero,'bow',2,2,ids).ok||r.craftGear(hero,'nope',2,3,ids).ok||r.craftChance(3,5)!==1||r.craftChance(3,2)!==.4||r.craftChance(4,4)!==0||r.perform(hero,ids[0],'star').ok)throw Error('Recipe rules');
 const made=r.craftGear(hero,'bow',2,3,ids);
 if(!made.ok||!made.success||made.entry.template!=='bow-t2'||made.entry.rank!==3||made.entry.stars!==2||made.entry.enhance!==6||made.entry.gems!==2||hero.equipment.items.some(i=>ids.includes(i.uid))||!valid(JSON.parse(JSON.stringify(hero))))throw Error('2-Star Red crafting failed');
 if(r.detail(made.entry).star.attack!==Math.round(r.detail(made.entry).base.attack*r.gearRanks[3].bonus*100)/100)throw Error('Quality bonus');
 // Fewer pieces lower the chance; a failed try loses them.
 const few=[r.addDrop(hero,2,'boots',2).uid,r.addDrop(hero,2,'boots',2).uid],count=hero.equipment.items.length,fail=r.craftGear(hero,'boots',2,3,few,()=>.5);
 if(!fail.ok||fail.success||fail.chance!==.4||hero.equipment.items.length!==count-2)throw Error('Failed craft');
 const lucky=[r.addDrop(hero,2,'boots',2).uid],win=r.craftGear(hero,'boots',2,3,lucky,()=>.1);if(!win.success||win.entry.template!=='boots-t2')throw Error('Lucky craft');
 // Higher steps need exact counts and materials; pieces from before the ladder keep their stars and their bonus.
 const reds=Array.from({length:5},()=>{const e=r.addDrop(hero,2,'armor',2);e.rank=3;return e.uid});
 if(r.craftGear(hero,'armor',2,4,reds.slice(0,4)).ok)throw Error('3-Star Red needs five');const red3=r.craftGear(hero,'armor',2,4,reds).entry;if(red3.stars!==3||red3.rank!==4)throw Error('3-Star Red');
 const pair=[red3.uid,(()=>{const e=r.addDrop(hero,2,'crown',2);e.rank=4;e.stars=3;return e.uid})()];hero.equipment.materials.essence=19;
 if(r.craftGear(hero,'crown',2,5,pair).ok)throw Error('Dark Gold needs essence');hero.equipment.materials.essence=20;const gold4=r.craftGear(hero,'crown',2,5,pair).entry;if(gold4.stars!==4||hero.equipment.materials.essence!==0)throw Error('Dark Gold');
 const old={uid:900,template:'bow-t1',enhance:0,stars:3,gems:0};if(r.gearRank(old)!==4||r.gearRank({stars:0})!==0||r.detail(old).star.attack!==Math.round(r.detail(old).base.attack*.36*100)/100)throw Error('Old stars must read as the same quality bonus');
 for(const bad of [{rank:3,stars:3},{rank:10,stars:5},{rank:-1,stars:0},{rank:1.5,stars:1}]){const eq=JSON.parse(JSON.stringify(hero.equipment));Object.assign(eq.items[0],bad);if(r.valid(eq))throw Error('Bad rank accepted')}
 // Auto devour: the Maw eats Blue and Purple drops at once, Orange stays; Relic and finer are never food.
 const auto=defaults();auto.autoDevour=true;const fed=r.bossLoot(auto,'mistwood',()=>.5);if(fed.entries.length!==1||r.gearRank(fed.entry)!==2||!(fed.devoured>0)||auto.devour!==fed.devoured||!valid(auto)||valid({...auto,autoDevour:1}))throw Error('Auto devour');
 // Rare drops are rolled after the sure ones: a 2-Star Red piece and bag items, each with its own chance.
 const lucky2=defaults(),eggs=r.bagCount(lucky2,'petegg'),all=r.bossLoot(lucky2,'mistwood',()=>0);if(all.rare.length!==r.bossRare.length||r.gearRank(all.entry)!==3||all.entries.length!==4||r.bagCount(lucky2,'petegg')!==eggs+1||r.bagCount(lucky2,'chest3')!==1||!valid(lucky2))throw Error('Rare drops');
 if(r.bossLoot(defaults(),'mistwood',()=>.99).rare.length)throw Error('Rare drops must be rare');
 S=lucky2;dungeonLoot();if(!document.querySelector('#modalBody').innerHTML.includes('2-Star Red piece')||!document.querySelector('#modalBody').innerHTML.includes('8%')||!bossDropMarkup(all).includes('Rare drop: 2-Star Red piece'))throw Error('Rare drop windows');
 const relic=r.addDrop(auto,1,'bow',7);if(r.devourable(auto).some(e=>e.uid===relic.uid)||r.devourGear(auto,[relic.uid]).ok)throw Error('Relic must not be devoured');}
{const s=defaults(),a=WonderAdventure;for(let i=0;i<5;i++)if(!a.spendStamina(s,0))throw Error('Missing daily entry');if(a.spendStamina(s,0)||!a.spendStamina(s,86400000))throw Error('Stamina reset');for(let tier=1;tier<=WonderGear.maxTier;tier++){if(DUNGEONS.filter(d=>d.tier===tier).length!==5)throw Error('Boss count');}if(visibleDungeons().length>7)throw Error('Future bosses exposed');}
const fullSample=defaults(),rules=globalThis.WonderGear,fullEq=rules.fresh(fullSample);fullSample.equipment=fullEq;while(fullEq.items.length<80)fullEq.items.push({uid:fullEq.nextId++,template:'bow-t1',enhance:0,stars:0,gems:0});const oldCrystal=fullEq.materials.stone,oldCount=fullEq.items.length,converted=rules.bossLoot(fullSample,'sunspire',()=>.99);if(!converted.converted||converted.entry||fullEq.items.length!==oldCount||fullEq.materials.stone!==oldCrystal+55+30||converted.stone!==85||!valid(fullSample))throw Error('Full bag boss conversion');
stopGame();S=defaults();launchBattle('dungeon','mistwood');game.stage=2;game.cleared=2;battleEnemy();const countBeforeBoss=rules.state(S).items.length;game.enemy.hp=1;battleDamage(99999);if(![3,4].includes(S.equipment.items.length-countBeforeBoss))throw Error('Boss equipment missing');const paidBoss=JSON.stringify(S);endBattle(true);if(JSON.stringify(S)!==paidBoss)throw Error('Boss loot duplicate claim');
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
 // Gear Crafting keeps Equipment, Necklace & Amulet and Rings apart, and its screen crafts by taps.
 {const T=defaults();T.equipment=r.state(T);const add=(slot,rank=2)=>r.addDrop(T,1,slot,rank).uid;
  const armour=[add('crown'),add('armor'),add('boots'),add('bow'),add('bracers')],neck=[add('necklace'),add('amulet'),add('necklace'),add('amulet'),add('amulet')],rings=[add('spiritluck'),add('spiritguard')];
  if(r.gearGroups.length!==3||r.craftInputs(T,'Equipment',1,3).map(e=>e.uid).join()!==armour.join()||r.craftInputs(T,'Rings',1,3).length!==2||r.craftInputs(T,'Equipment',1,4).length)throw Error('Craft pool by family');
  if(r.craftGear(T,'bow',1,3,[...armour.slice(0,4),neck[0]]).ok||r.craftGear(T,'necklace',1,3,armour).ok)throw Error('Families must not mix');
  const keep=S;S=T;craftRank=3;
  for(const g of r.gearGroups){craftFilter(3,null,g);const html=document.querySelector('#main').innerHTML;if(!html.includes('loom-kinds')||!html.includes('2-Star Red')||!html.includes('At least 1 piece'))throw Error('Crafting screen '+g)}
  craftFilter(3,null,'Equipment');craftSelect('boots');craftAdd();if(craftInputs.length!==5||!document.querySelector('#main').innerHTML.includes('Success rate: 100%'))throw Error('Add fills the recipe');
  craftAdd(craftInputs[0]);if(craftInputs.length!==4||!document.querySelector('#main').innerHTML.includes('Success rate: 80%'))throw Error('Tap removes a piece');
  craftAdd();craftCommit();const boots=r.state(S).items.find(e=>e.template==='boots-t1'&&e.rank===3);if(!boots||r.craftInputs(S,'Equipment',1,3).length||!document.querySelector('#modalBody').innerHTML.includes('Crafted'))throw Error('Synthesize');
  craftFilter(3,null,'Necklace & Amulet');craftBatchRun();if(!r.state(S).items.some(e=>e.template==='necklace-t1'&&e.rank===3)||r.craftInputs(S,'Necklace & Amulet',1,3).length)throw Error('Batch');
  craftFilter(5,null,'Equipment');if(!document.querySelector('#main').innerHTML.includes('4-Star Dark Gold')||!document.querySelector('#main').innerHTML.includes('At least 2 pieces'))throw Error('Dark Gold page');
  openEquipment(boots.uid);if(!document.querySelector('#modalBody').innerHTML.includes('2-Star Red · T1'))throw Error('Item card shows quality');
  S=keep}
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

vm.runInContext(`
{const r=WonderGear,T0=Date.UTC(2026,10,18,12),day=864e5;   // a Wednesday
 S=defaults();if(S.summon!==undefined||!valid(S)||r.summonLevel(S).level!==1||r.summonState(S,T0).gala.basic!==0)throw Error('Fresh summon record');
 // Basic: a Wish Ticket first, then wishes; every draw counts for the Festival; Rare and finer leave a mark.
 if(r.summonDraw(S,'basic',3).ok||r.summonDraw(S,'nope',1).ok||JSON.stringify(r.summonPay(S,'basic',1))!=='{"tickets":50}')throw Error('Draw sizes and payment');
 r.bagAdd(S,'wish',1);let wishes=S.tickets,draw=r.summonDraw(S,'basic',1,()=>.5,T0);
 if(!draw.ok||draw.pay.item!=='wish'||r.bagCount(S,'wish')||S.tickets!==wishes||draw.results[0].rarity!=='Rare'||S.summon.marks.r!==1||S.summon.gala.basic!==1)throw Error('Ticket draw');
 draw=r.summonDraw(S,'basic',10,()=>.99,T0);if(S.tickets!==wishes-500||draw.results.some(x=>x.rarity!=='Super Rare')||S.summon.marks.s!==10||S.summon.gala.basic!==11||draw.results.filter(x=>x.spare).length!==9||!valid(JSON.parse(JSON.stringify(S))))throw Error('Ten draws for wishes');
 S.tickets=0;if(r.summonDraw(S,'basic',1,Math.random,T0).ok)throw Error('Unaffordable basic draw');
 // Advanced: Star Orbs or prisms; guarantees and the Summon Level.
 if(r.summonPay(S,'advanced',1)||r.summonDraw(S,'advanced',1,Math.random,T0).ok)throw Error('Advanced needs orbs or prisms');
 S.scales=30*45;const got=[];for(let i=0;i<45;i++)got.push(r.summonDraw(S,'advanced',1,()=>0,T0).results[0].rarity);
 if(S.scales!==0||got.slice(0,9).some(x=>x!=='Rare')||got[9]!=='Epic'||got[19]!=='Epic'||got[39]!=='Super Rare'||got.filter(x=>x==='Super Rare').length!==1||got[40]!=='Rare')throw Error('Guarantees '+got.join());
 if(S.summon.adv!==45||r.summonLevel(S).level!==5||r.summonLevel(S).into!==5||S.summon.gala.basic!==11)throw Error('Summon Level');
 // The Festival: quests for today's Basic summons pay Star Orbs and tokens; orbs pay for Advanced draws.
 if(!r.galaClaim(S,0,T0)||r.galaClaim(S,0,T0)||r.galaClaim(S,1,T0)||S.summon.orbs!==1||S.summon.gala.tokens!==5)throw Error('Festival quest');
 const adv=S.summon.adv;if(!r.summonDraw(S,'advanced',1,()=>0,T0).ok||S.summon.orbs!==0||S.summon.adv!==adv+1)throw Error('Orb draw');
 if(r.galaReward(S,0,Math.random,T0))throw Error('Milestone before its tokens');
 S.summon.gala.tokens=80;const eggs=r.bagCount(S,'petegg'),prize=r.galaReward(S,0,Math.random,T0),pet=r.galaReward(S,2,()=>0,T0);
 if(prize.id!=='petegg'||r.bagCount(S,'petegg')!==eggs+1||r.galaReward(S,0,Math.random,T0)||pet.rarity!=='Epic'||!S.owned.includes(pet.id)||r.galaReward(S,4,Math.random,T0))throw Error('Milestones');
 let next=r.summonState(S,T0+day);if(next.gala.basic!==0||next.gala.claimed.length||next.gala.tokens!==80||next.gala.got.length!==2)throw Error('Quests reset daily, tokens stay');
 next=r.summonState(S,Date.UTC(2026,11,1,1));if(next.gala.tokens!==0||next.gala.got.length||next.adv!==adv+1||next.marks.s!==11)throw Error('A new month starts a new Festival');
 if(r.galaEnds(T0)!==Date.UTC(2026,11,1))throw Error('Festival end');
 // Mark Shop: marks of the pet's rarity, a weekly limit, and the Summon Level opens finer pets.
 const rare=r.familiars.find(p=>p.rarity==='Rare'&&!S.owned.includes(p.id)),royal=r.familiars.find(p=>p.rarity==='Super Rare'),common=r.familiars.find(p=>p.rarity==='Common');
 if(r.markOffer(S,common.id,T0)||r.buyMarkPet(S,common.id,T0).ok||r.markOffer(S,royal.id,T0).why!=='Summon Lv. 10'||r.buyMarkPet(S,royal.id,T0).ok)throw Error('Shop rules');
 S.summon.marks.r=19;if(r.buyMarkPet(S,rare.id,T0).ok)throw Error('Not enough marks');
 S.summon.marks.r=100;for(let i=0;i<r.markLimit;i++)if(!r.buyMarkPet(S,rare.id,T0).ok)throw Error('Buying a pet');
 if(!S.owned.includes(rare.id)||r.petSpares(S,rare.id)!==r.markLimit-1||S.summon.marks.r!==100-r.markLimit*r.markPrice||r.buyMarkPet(S,rare.id,T0).ok||r.markOffer(S,rare.id,T0).why!=='Sold out this week')throw Error('Weekly limit');
 if(r.markOffer(S,rare.id,T0+5*day).left!==r.markLimit||r.markOffer(S,rare.id,T0+4*day).left!==0)throw Error('Restock on Monday');
 S.summon.adv=95;if(r.markOffer(S,royal.id,T0).why!=='Not enough marks')throw Error('Royal marks short');S.summon.marks.s=20;if(r.markOffer(S,royal.id,T0).why||!r.buyMarkPet(S,royal.id,T0).ok)throw Error('Summon Level opens Super Rare');
 if(!valid(JSON.parse(JSON.stringify(S))))throw Error('Summon save');
 for(const bad of [{adv:-1},{orbs:1.5},{pityE:99},{marks:{r:1,e:1}},{marks:{r:1,e:1,s:-1}},{shop:{week:'x',bought:{}}},{shop:{week:'2026-11-16',bought:{nope:1}}},{shop:{week:'2026-11-16',bought:{[rare.id]:9}}},{gala:{...S.summon.gala,claimed:[0,0]}},{gala:{...S.summon.gala,got:[9]}},{gala:{...S.summon.gala,season:'2026-10'}}])
  if(valid({...S,summon:{...S.summon,...bad}}))throw Error('Invalid summon accepted '+JSON.stringify(bad));
 // The room: Home > Summon opens it; four pages; the Pets room's own Summon page uses the same rule.
 if(!cityGroups.flat().some(x=>x[1]==='Summon'&&x[2]==='citySummon'))throw Error('Home Summon icon');
 S=defaults();S.tickets=600;summonPage='Basic';openScreen('citySummon');let html=$('#main').innerHTML;
 if(!html.includes('Basic Summon')||!html.includes("summonDo('basic',10)")||!html.includes('well-skip'))throw Error('Basic page');
 summonDo('basic',10);if(S.tickets!==100||!S.summon||r.summonState(S).gala.basic!==10||!$('#modalBody').innerHTML.includes('Basic Summon')||!$('#modalBody').innerHTML.includes('sum-reveal'))throw Error('Draw from the room');
 summonSkipToggle();summonDo('basic',1);if($('#modalBody').innerHTML.includes('sum-reveal')||S.tickets!==50)throw Error('Skip');
 summonGo('Gala');html=$('#main').innerHTML;if(!html.includes('galaTake(0)')||!html.includes('Perform Basic Summon 80 times')||!html.includes('mile'))throw Error('Festival page');
 galaTake(0);if(r.summonState(S).orbs!==1||!$('#main').innerHTML.includes('Claimed'))throw Error('Claim on the page');
 summonGo('Advanced');html=$('#main').innerHTML;if(!html.includes('Summon Level')||!html.includes('Guaranteed')||html.includes("summonDo('advanced',1)\\" disabled"))throw Error('Advanced page');
 summonDo('advanced',1);if(r.summonState(S).orbs!==0||S.summon.adv!==1)throw Error('Advanced draw from the room');
 summonGo('Shop');markFilter='Epic';citySummon();html=$('#main').innerHTML;if(!html.includes('Spirit Mark Shop')||(html.match(/shop-card/g)||[]).length!==10||!html.includes('Summon Lv. 5'))throw Error('Mark Shop page');
 const one=r.familiars.find(p=>p.rarity==='Rare');markFilter='All';S.summon.marks.r=40;markAsk(one.id);if(!$('#modalBody').innerHTML.includes("markBuy('"+one.id+"')"))throw Error('Shop card');
 markBuy(one.id);if(r.summonState(S).marks.r!==20||!S.owned.includes(one.id))throw Error('Buy from the shop');
 summonLeave();if(summonPage!=='Advanced'||screen!=='citySummon')throw Error('Shop returns to Advanced');summonLeave();if(screen!=='home')throw Error('Back to the city');
}
`,context);
console.log('PASS: Summon room: Basic and Advanced wells, guarantees, Summon Level, Spirit Marks and the Mark Shop, Summon Festival quests and milestones.');

vm.runInContext(`
{const r=WonderGear,w=r.warRules,T0=Date.UTC(2026,10,21,12),day=864e5;
 let seed=11;const rng=()=>(seed=(seed*16807)%2147483647)/2147483647;
 // A fresh fight: three factions of five, each holding its own totem; Reina leads the chosen faction.
 let g=r.warNew(1,rng);if(g.fighters.length!==15||g.fighters.filter(f=>f.hero).length!==1||r.warHero(g).faction!==1||g.totems.map(t=>t.owner).join()!=='0,1,2'||r.warHeld(g,1)!==1)throw Error('New fight');
 // Points come every 30 s: kills, assists and totem hits, plus 20% for each totem the faction holds.
 const h=r.warHero(g);h.pending={kills:3,assists:2,hits:10};g.totems[0].owner=1;r.warTally(g);
 if(h.points!==Math.round((3*w.kill+2*w.assist+10*w.hit)*(1+2*w.flag))||g.lastTally.held!==2||g.scores[1]!==h.points||h.pending.kills)throw Error('Tally formula');
 // A full fight: tallies at 30, 60 ... 180 s; every point of a faction is the sum of its fighters.
 g=r.warNew(0,rng);let tallies=0;while(!g.over){const before=g.nextTally;r.warStep(g,rng);if(g.nextTally!==before)tallies++}
 if(g.time!==w.length||tallies!==w.length/w.tally||[0,1,2].some(f=>g.scores[f]!==g.fighters.filter(x=>x.faction===f).reduce((n,x)=>n+x.points,0)))throw Error('Full fight');
 if(!g.fighters.some(f=>f.kills)||!g.fighters.some(f=>f.hits)||g.totems.some(t=>!(t.hp>0&&t.hp<=w.totemHp)))throw Error('Fighting happened');
 // Orders: Reina goes where she is sent; a totem falls to the faction that damaged it most.
 g=r.warNew(0,rng);if(!r.warOrder(g,2)||r.warOrder(g,5))throw Error('Order');const me=r.warHero(g);let near=99;
 for(let i=0;i<40;i++){r.warStep(g,rng);if(!me.dead)near=Math.min(near,Math.hypot(me.x-r.warTotems[2].x,me.y-r.warTotems[2].y))}
 if(near>w.reach||me.target!==2)throw Error('Reina must go to her totem');
 g=r.warNew(0,rng);for(const f of g.fighters)if(f.faction!==1){f.x=r.warTotems[2].x;f.y=r.warTotems[2].y;f.target=2;f.order=2}
 for(const f of g.fighters)if(f.faction===2||f.faction===1&&f.id%2){f.dead=99}
 for(let i=0;i<60&&g.totems[2].owner===2;i++)r.warStep(g,()=>.5);if(g.totems[2].owner!==0)throw Error('Totem capture');
 // Quests pay once into the bag; the ranking pays medals and items; two rewarded fights a day.
 S=defaults();if(!r.warStart(S,T0)||!r.warStart(S,T0)||r.warStart(S,T0)||r.contestState(S,T0).runs!==2||r.contestState(S,T0+day).runs!==0)throw Error('Daily fights');
 g=r.warNew(0,rng);r.warHero(g).points=160;const wishes=r.bagCount(S,'wish'),q=r.warQuestsDue(S,g,true);
 if(q.length!==2||r.contestState(S).medals!==15||r.warQuestsDue(S,g,true).length)throw Error('Quests');
 r.warHero(g).points=400;r.warQuestsDue(S,g,false);if(r.contestState(S).medals!==15||r.bagCount(S,'wish')!==wishes)throw Error('Practice pays nothing');
 if(r.warSettle(S,g,true))throw Error('Settle before the end');
 g.over=true;for(const f of g.fighters)if(!f.hero)f.points=10;const res=r.warSettle(S,g,true);
 if(res.rank!==1||res.prize!==r.warRanks[0]||r.contestState(S).medals!==50||r.contestState(S).wins!==1||r.contestState(S).best!==400||r.bagCount(S,'chest2')!==1||r.warSettle(S,g,true))throw Error('Ranking reward');
 if(r.warRankPrize(15)!==r.warRanks[4]||r.warRankPrize(5).medals!==25)throw Error('Rank bands');
 if(r.buyContest(S,'chest3')||!r.buyContest(S,'wish')||r.contestState(S).medals!==35||!valid(JSON.parse(JSON.stringify(S))))throw Error('Contest Shop');
 for(const bad of [{medals:-1},{runs:3},{day:'x'},{best:1.5}])if(valid({...S,contest:{...S.contest,...bad}}))throw Error('Invalid contest accepted '+JSON.stringify(bad));
 // Screens: Gameplay > Sky Contest > Totem War lobby, fight, result, shop, and back.
 S=defaults();openScreen('cityGameplay');playSection=4;cityGameplay();if(!$('#main').innerHTML.includes('Totem War')||!$('#main').innerHTML.includes('gp-banner'))throw Error('Sky Contest list');
 contestGo('War');let html=$('#main').innerHTML;if(!html.includes('Reward Preview')||!html.includes('warPick(2)')||!html.includes('contestEnter()'))throw Error('Lobby');
 warPick(2);contestEnter();if(contestPage!=='Fight'||warGame.faction!==2||!warPaid||!$('#main').innerHTML.includes('tw-totem'))throw Error('Enter');
 warSend(0);if(r.warHero(warGame).order!==0)throw Error('Send Reina');warSend(-1);if(r.warHero(warGame).order!==null)throw Error('Auto');
 for(let i=0;i<400&&!warGame.over;i++)warTick();if(!warGame.settled||!$('#modalBody').innerHTML.includes('points')||r.contestState(S).runs!==1)throw Error('Fight ends and settles');
 contestGo('Shop');if(!$('#main').innerHTML.includes('Contest Shop'))throw Error('Shop page');contestAsk('wish');if(!$('#modalBody').innerHTML.includes("contestBuy('wish')"))throw Error('Shop card');
 contestLeave();if(contestPage!=='War')throw Error('Shop returns to the lobby');contestLeave();if(screen!=='cityGameplay'||playSection!==4)throw Error('Lobby returns to Sky Contest');
}
`,context);
console.log('PASS: Sky Contest Totem War: tally formula, full fight, orders, totem capture, quests, ranking, daily fights, shop and screens.');

vm.runInContext(`
{const r=WonderGear,T0=Date.UTC(2026,10,21,21,10),hour=36e5,day=864e5;
 S=defaults();if(S.cloud!==undefined||!valid(S)||r.cloudRound(T0)!=='2026-11-21T21'||r.cloudRoundEnds(T0)!==Date.UTC(2026,10,21,22))throw Error('Round clock');
 // Carnage Points are capped per UTC day and pay the same number of Cloud Tokens.
 if(r.cloudGain(S,390,T0)!==390||r.cloudGain(S,1000,T0)!==810||r.cloudGain(S,30,T0)!==0||r.cloudState(S,T0).carnage!==1200||r.cloudState(S,T0).tokens!==1200)throw Error('Carnage cap');
 if(r.cloudState(S,T0+day).carnage!==0||r.cloudState(S,T0+day).tokens!==1200)throw Error('Daily reset keeps tokens');
 // Point Rewards: each step once a day, into the bag.
 const oak=r.bagCount(S,'chest1');if(!r.cloudClaim(S,0,T0)||r.cloudClaim(S,0,T0)||r.bagCount(S,'chest1')!==oak+1||r.cloudClaim(S,9,T0))throw Error('Point reward');
 const T=defaults();r.cloudGain(T,200,T0);if(r.cloudClaim(T,2,T0)||!r.cloudClaim(T,0,T0))throw Error('Reward before its points');
 // Cloud Shop takes tokens.
 const tokens=r.cloudState(S).tokens;if(!r.buyCloud(S,'chest3')||r.cloudState(S).tokens!==tokens-900||r.bagCount(S,'chest3')!==1||r.buyCloud(S,'nope'))throw Error('Cloud Shop');
 S.cloud.tokens=10;if(r.buyCloud(S,'wish'))throw Error('Shop without tokens');
 // A new round keeps territories taken in the old one.
 const C=defaults();if(!r.cloudNewRound(C,{},T0)||r.cloudNewRound(C,{},T0+60000))throw Error('First round');
 if(!r.cloudNewRound(C,{3:2,7:0,99:1},T0+hour)||C.cloud.held[3]!==2||C.cloud.held[7]!==0||Object.keys(C.cloud.held).length!==3)throw Error('Held territories');
 if(!valid(JSON.parse(JSON.stringify(S))))throw Error('Cloud save');
 for(const bad of [{carnage:1201},{tokens:-1},{round:'x'},{claimed:[0,0]},{claimed:[7]},{held:{30:1}},{held:{3:4}}])if(valid({...S,cloud:{...S.cloud,...bad}}))throw Error('Invalid cloud accepted '+JSON.stringify(bad));
 // The map: round clock, Carnage Points, owners and bosses left on every territory, the tool bar and its windows.
 S=defaults();cloudCount=4;openScreen('cloudWar');let html=$('#main').innerHTML;
 if(!html.includes('This round ends in')||!html.includes('Carnage Points')||!html.includes('Boss: 10')||!html.includes('cloudShopShow()')||!html.includes('cloudPointsShow()'))throw Error('Cloud War map');
 S.cloudWarHits={6:[0,0,0,0,9,9,9,9,9,9]};if(cloudAlive(6)!==4)throw Error('Bosses left');
 S.cloudWarHits={6:[9,9,9,9,9,0,0,0,0,0]};if(cloudOwner(6)!==0)throw Error('80 points take a territory');
 S.cloud.round='2026-01-01T00';cloudRoundCheck();if(S.cloudWarHits||S.cloud.held[6]!==0||cloudOwner(6)!==0||cloudAlive(6)!==10)throw Error('Round refresh');
 // Roads: dashed into other factions' lands, lit only between two open cities of one faction; foreign cities are not attacked.
 S.cloud.held={};S.cloudWarHits={};let board=cloudFourBoard(cloudTerritories());
 if(!board.includes('stroke-dasharray="3 7"')||board.includes('stroke="#ffd86b" stroke-width="5.5"'))throw Error('Roads before opening');
 for(const i of [0,1])S.cloudWarHits[i]=[9,9,9,9,9,0,0,0,0,0];board=cloudFourBoard(cloudTerritories());
 if(!board.includes('stroke="#ffd86b" stroke-width="5.5"')||cloudOpen(0)!==2)throw Error('A road between two open cities lights up');
 cloudTerritory(7);if(!$('#modalBody').innerHTML.includes('cloud-foreign')||$('#modalBody').innerHTML.includes('cloudStrike(7'))throw Error('Foreign city is look-only');
 cloudTerritory(3);if(!$('#modalBody').innerHTML.includes('cloudStrike(3'))throw Error('Own city can be attacked');
 cloudPointsShow();if(!$('#modalBody').innerHTML.includes('Point Rewards'))throw Error('Point Rewards window');
 r.cloudGain(S,160);cloudPointsShow();if(!$('#modalBody').innerHTML.includes('cloudTake(0)'))throw Error('Claim button');cloudTake(0);if(!r.cloudState(S).claimed.includes(0))throw Error('Claim');
 cloudShopShow();if(!$('#modalBody').innerHTML.includes("cloudBuy('wish')"))throw Error('Shop window');
 cloudStatusShow();if(!$('#modalBody').innerHTML.includes('Galewing (you)'))throw Error('Status window');
 cloudRankShow();if(!$('#modalBody').innerHTML.includes('AI'))throw Error('Rankings window');
 cloudTerritory(6);if(!$('#modalBody').innerHTML.includes('Carnage Points today')||!$('#modalBody').innerHTML.includes('Moon Chest'))throw Error('Territory window');
}
`,context);
console.log('PASS: Cloud War: rounds keep held territories, Carnage cap, Point Rewards, Cloud Shop, map labels and windows.');
