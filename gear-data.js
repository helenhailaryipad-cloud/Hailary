/* Shared, deterministic equipment rules used by the browser and cloud. */
globalThis.WonderGear=(()=>{
const slots=[
{id:'bow',name:'Weapon',item:'Bow',icon:0,base:{attack:28,penetration:8,accuracy:2},enhance:{attack:24,penetration:2,accuracy:.3},offense:true},
{id:'crown',name:'Helmet',item:'Helm',icon:1,base:{health:100,defense:5,critResistance:1},enhance:{health:130,defense:2,critResistance:.4}},
{id:'armor',name:'Armor',item:'Raiment',icon:2,base:{health:120,defense:15,elementalDefense:8},enhance:{defense:18,health:20,elementalDefense:3}},
{id:'leggings',name:'Legguards',item:'Legguards',icon:3,base:{health:95,defense:12,elementalDefense:6},enhance:{health:35,defense:6,elementalDefense:2}},
{id:'boots',name:'Boots',item:'Boots',icon:4,base:{health:55,defense:5,speed:2,dodge:2},enhance:{speed:3,health:15,dodge:.35}},
{id:'bracers',name:'Bracers',item:'Bracers',icon:5,base:{health:45,defense:9,critDamage:3},enhance:{defense:7,health:20,critDamage:.6}},
{id:'necklace',name:'Necklace',item:'Necklace',icon:6,base:{attack:15,penetration:5,elementalAttack:8},enhance:{attack:10,penetration:3,elementalAttack:3},offense:true},
{id:'amulet',name:'Amulet',item:'Amulet',icon:7,base:{attack:10,health:60,penetration:3,elementalAttack:6},enhance:{health:90,attack:4,elementalAttack:2},offense:true},
{id:'spiritguard',name:'Guardian Ring',item:'Spirit Ring',icon:8,base:{defense:10,expBonus:5,shieldHealth:60},enhance:{defense:4,shieldHealth:20}},
{id:'spiritluck',name:'Fortune Ring',item:'Spirit Ring',icon:8,base:{crit:2,health:30},enhance:{crit:2}}
];
const tiers=[
  {tier:1,rarity:'Common',color:'#bcc3c8',prefix:'Dewlight',factor:1,grade:0},
  {tier:2,rarity:'Rare',color:'#79e7a0',prefix:'Fernsilver',factor:1.35,grade:0},
  {tier:3,rarity:'Epic',color:'#65b5ff',prefix:'Moonveil',factor:1.7,grade:1},
  {tier:4,rarity:'Epic',color:'#ba89ff',prefix:'Tideglass',factor:2.1,grade:1},
  {tier:5,rarity:'Legendary',color:'#ffc15a',prefix:'Sunforge',factor:2.5,grade:2},
  {tier:6,rarity:'Legendary',color:'#ff8c70',prefix:'Emberthorn',factor:2.85,grade:2},
  {tier:7,rarity:'Legendary',color:'#889dff',prefix:'Starfall',factor:3.2,grade:2},
  {tier:8,rarity:'Mythic',color:'#ff6b91',prefix:'Dawnfire',factor:3.6,grade:3}
];
const levelsPerTier=50;
const maxTier=1+Math.floor(globalThis.WonderProgress.maxLevel/levelsPerTier);
const requiredLevel=tier=>(tier-1)*levelsPerTier;
const unlockedTier=save=>1+Math.floor(globalThis.WonderProgress.level(save.xp||0)/levelsPerTier);
const artTier=tier=>tier<=8?tier:1+(tier-1)%8;
for(let tier=9;tier<=maxTier;tier++){
  const style=tiers[artTier(tier)-1];
  tiers.push({...style,tier,rarity:'Mythic',grade:3,prefix:style.prefix+' Ascendant '+tier,
    factor:3.6+(tier-8)*.4,color:'hsl('+((tier*137)%360)+' 90% 73%)'});
}
const catalog=Object.fromEntries(slots.flatMap(slot=>tiers.map(t=>{const id=slot.id+'-t'+t.tier;return[id,{...t,id,slot:slot.id,name:t.prefix+' '+slot.item,icon:slot.icon,base:slot.base,enhanceBonus:slot.enhance,offense:!!slot.offense}]})));
const labels={attack:'ATK',defense:'DEF',health:'HP',crit:'Crit Rate',accuracy:'Accuracy',dodge:'Dodge',critDamage:'Crit DMG',critResistance:'Crit RES',shieldHealth:'Shield HP',elementalAttack:'Elemental ATK',elementalDefense:'Elemental DEF',armor:'Armor',attackInterval:'Attack Interval',healing:'Healing Bloom',speed:'Speed',penetration:'Armor Piercing',attackPercent:'ATK Bonus',healthPercent:'HP Bonus',defensePercent:'DEF Bonus',damageBonus:'DMG Bonus',damageReduction:'DMG Reduction',block:'Block',expBonus:'Adventure EXP'};
const percentKeys=new Set(['crit','attackPercent','healthPercent','defensePercent','damageBonus','damageReduction','block','expBonus','accuracy','dodge','critDamage','critResistance','armor']);
const materialDefs=[{id:'stone',name:'Enhancement Crystal',icon:9,color:'#69dfff'},{id:'shard',name:'Star Shard',icon:10,color:'#d9a1ff'},{id:'gem',name:'Sky Gem',icon:9,color:'#8df5d1'},{id:'essence',name:'Forge Essence',icon:11,color:'#ffc470'},{id:'synthesis',name:'Synthesis Stone',icon:10,color:'#ff9bba'}];
const round=n=>Math.round(n*100)/100;
function fresh(save){const eq={version:1,nextId:15,items:[],equipped:{},materials:{stone:60,shard:12,gem:4,essence:8,synthesis:0}};for(let i=0;i<slots.length;i++){const slot=slots[i],legacy={bow:'bow',crown:'crown',armor:'armor',boots:'boots',spiritluck:'ring',amulet:'charm'}[slot.id];const entry={uid:i+1,template:slot.id+'-t1',enhance:legacy?(save.upgrades?.[legacy]||0):0,stars:0,gems:0};eq.items.push(entry);eq.equipped[slot.id]=entry.uid}for(const [j,id]of ['bow-t3','boots-t3','spiritguard-t3','spiritluck-t1'].entries())eq.items.push({uid:11+j,template:id,enhance:0,stars:0,gems:0});return eq}
function valid(eq){if(eq===undefined)return true;return !!eq&&eq.version===1&&Number.isSafeInteger(eq.nextId)&&eq.nextId>0&&eq.nextId<1e9&&Array.isArray(eq.items)&&eq.items.length<=80+slots.length&&new Set(eq.items.map(i=>i?.uid)).size===eq.items.length&&eq.items.every(i=>i&&(i.stored===undefined||typeof i.stored==='boolean')&&Number.isSafeInteger(i.uid)&&i.uid>0&&i.uid<eq.nextId&&typeof i.template==='string'&&Object.hasOwn(catalog,i.template)&&Number.isInteger(i.enhance)&&i.enhance>=0&&i.enhance<=20&&Number.isInteger(i.stars)&&i.stars>=0&&i.stars<=5&&Number.isInteger(i.gems)&&i.gems>=0&&i.gems<=3)&&!!eq.equipped&&Object.keys(eq.equipped).length===10&&slots.every(slot=>eq.equipped[slot.id]===null||eq.items.some(i=>!i.stored&&i.uid===eq.equipped[slot.id]&&catalog[i.template].slot===slot.id))&&!!eq.materials&&materialDefs.every(m=>(m.id==='synthesis'&&eq.materials.synthesis===undefined)||Number.isSafeInteger(eq.materials[m.id])&&eq.materials[m.id]>=0&&eq.materials[m.id]<=1e9)}
function equipBasicSlot(eq,slot){
 const template=slot.id+'-t1';
 const current=eq.items.find(i=>i.uid===eq.equipped[slot.id]);
 if(current?.template===template)return;
 let basic=eq.items.find(i=>i.template===template&&!i.stored)||eq.items.find(i=>i.template===template);
 if(!basic){
  basic={uid:eq.nextId++,template,enhance:0,stars:0,gems:0,starter:true};
  eq.items.push(basic);
 }
 if(basic.stored)basic.stored=false;
 eq.equipped[slot.id]=basic.uid;
}
function equipBasicSet(save){
 const eq=state(save);
 for(const slot of slots)equipBasicSlot(eq,slot);
 save.equipment=eq;
}
function repairLoadout(save){
 const eq=save.equipment;
 if(!eq)return;
 const limit=unlockedTier(save);
 for(const slot of slots){
  const worn=eq.items.find(i=>i.uid===eq.equipped[slot.id]);
  if(!worn||catalog[worn.template].tier>limit)equipBasicSlot(eq,slot);
 }
}
function state(save){const eq=save.equipment||fresh(save);eq.materials.synthesis??=0;return eq}
const stonePrice=1000;
function buyStone(save){if(save.gold<stonePrice)return false;const eq=state(save);save.equipment=eq;save.gold-=stonePrice;eq.materials.synthesis++;return true}
function attributePower(t){return (t.accuracy||0)*12+(t.dodge||0)*18+(t.critDamage||0)*8+(t.critResistance||0)*15+(t.shieldHealth||0)/3+(t.elementalAttack||0)*3+(t.elementalDefense||0)*3}
function detail(entry){const t=catalog[entry.template],base={},enhancement={},star={},gem={},perfect={};for(const [key,n]of Object.entries(t.base)){base[key]=round(n*t.factor);star[key]=round(base[key]*entry.stars*.12)}for(const [key,n]of Object.entries(t.enhanceBonus))enhancement[key]=round(n*entry.enhance);if(entry.gems){const key=t.offense?'attack':'health';gem[key]=entry.gems*(t.offense?18:75);gem[t.offense?'penetration':'defense']=entry.gems*(t.offense?4:9)}if(t.grade){if(t.offense){perfect.attackPercent=round(t.grade*1.5);perfect.damageBonus=t.grade}else{perfect.healthPercent=round(t.grade*1.2);perfect.defensePercent=round(t.grade*1.5);perfect.damageReduction=round(t.grade*.6)}}if(t.slot==='spiritguard')perfect.expBonus=entry.stars*3;if(t.slot==='crown'&&t.grade>=2)perfect.block=t.grade*1.5;const total={};for(const section of [base,enhancement,star,gem,perfect])for(const [key,n]of Object.entries(section))total[key]=round((total[key]||0)+n);return {template:t,base,enhancement,star,gem,perfect,total,power:Math.round((total.attack||0)*5+(total.defense||0)*4+(total.health||0)/3+(total.crit||0)*10+(total.speed||0)+(total.penetration||0)*3+(total.attackPercent||0)*20+(total.healthPercent||0)*10+(total.defensePercent||0)*15+(total.damageBonus||0)*20+(total.damageReduction||0)*25+(total.block||0)*15+attributePower(total))}}
const companionTypes={
 elf:{name:'Elf',title:'Dreamveil',art:'familiar-46',icon:'hud-pet',growth:{attack:6,health:60,penetration:0.2,defense:2}},
 mount:{name:'Mount',title:'Silver Tabby',art:'reina-silver-tabby',icon:'silver-tabby-icon',growth:{attack:3,health:120,penetration:0.1,defense:5}},
 cloak:{name:'Cloak',title:'Moonveil Mantle',art:'gear-armor-t3',icon:'gear-armor-t3',growth:{attack:2,health:80,elementalAttack:3,elementalDefense:3}},
 back:{name:'Back Accessory',title:'Adventurer’s Satchel',art:'hud-bag',icon:'hud-bag',growth:{attack:3,health:65,penetration:0.1,defense:2}},
 footprint:{name:'Footprint',title:'Starlit Steps',art:'reina-walk',icon:'gear-boots-t3',growth:{attack:2,health:50,elementalAttack:2,elementalDefense:2}},
 tail:{name:'Tail',title:'Fox Tail',art:'comp-tail-fox',icon:'comp-icon-tail-fox',growth:{attack:2,health:55,defense:2}}
};
// Appearances for each companion slot. The first one of every slot is free; the rest are bought
// once with gold and listed in save.companionSkins as "slot:id". They change looks only, never stats.
const companionSkinPrice={elf:800,cloak:600,back:500,footprint:300,tail:500};
const companionSkins=Object.fromEntries(Object.entries({"elf": [["dreamveil", "Dreamveil"], ["bluebell", "Bluebell"], ["firefly", "Firefly Pixie"], ["rosebud", "Rosebud Sprite"], ["snowdrop", "Snowdrop Sylph"], ["sunny", "Sunbeam Sprite"], ["moonmoth", "Moon Moth"], ["leafling", "Leafling"], ["bubble", "Bubble Nymph"], ["starwisp", "Starwisp"], ["mushroom", "Mushroom Gnome"], ["candy", "Candy Pixie"], ["cloudlet", "Cloud Cherub"], ["acorn", "Acorn Sprite"], ["lotus", "Lotus Fairy"], ["spark", "Thunder Spark"], ["crystal", "Crystal Fairy"], ["honeybee", "Honeybee Fairy"], ["peach", "Peach Blossom"], ["lavender", "Lavender Dream"], ["prism", "Rainbow Prism"]], "cloak": [["moonveil", "Moonveil Mantle"], ["rosepetal", "Rose Petal Cape"], ["leafweave", "Emerald Leaf Cloak"], ["phoenix", "Phoenix Flame Cape"], ["frostfur", "Frost Crystal Mantle"], ["starnight", "Starry Night Cloak"], ["royal", "Royal Crimson Cape"], ["sunray", "Golden Sun Mantle"], ["oceanwave", "Ocean Wave Cape"], ["ravenfeather", "Shadow Raven Cloak"], ["butterfly", "Butterfly Wing Cape"], ["sakura", "Sakura Blossom Cape"], ["autumnleaf", "Autumn Leaf Cloak"], ["rainbowsilk", "Rainbow Silk Cape"], ["dragonscale", "Dragon Scale Mantle"], ["owlfeather", "Snow Owl Cloak"], ["amethyst", "Amethyst Crystal Cape"], ["peacock", "Peacock Feather Cloak"], ["honeycomb", "Honeycomb Amber Cape"], ["cloudmist", "Cloud Mist Mantle"]], "back": [["satchel", "Adventurer’s Satchel"], ["quiver", "Elven Quiver"], ["lute", "Songbird Lute"], ["lanternstaff", "Lantern Staff"], ["spellbooks", "Spellbook Pack"], ["twinblades", "Twin Blades"], ["crystalhalo", "Crystal Halo"], ["bunnypack", "Bunny Backpack"], ["harp", "Golden Harp"], ["banner", "Sky Garden Banner"]], "footprint": [["stars", "Starlit Steps"], ["petals", "Petal Path"], ["embers", "Ember Trail"], ["snow", "Snowflake Steps"], ["leaves", "Leaf Dance"], ["ripples", "Ripple Walk"], ["sparks", "Spark Steps"], ["hearts", "Heart Beats"], ["moons", "Moon Glow"], ["paws", "Rainbow Paws"]], "tail": [["fox", "Fox Tail"], ["kitsune", "Kitsune Tails"], ["tabby", "Tabby Tail"], ["dragon", "Drake Tail"], ["wolf", "Wolf Tail"], ["squirrel", "Squirrel Tail"], ["peacock", "Peacock Train"], ["phoenix", "Phoenix Plumes"], ["imp", "Imp Tail"], ["unicorn", "Unicorn Tail"]]}).map(([key,list])=>[key,list.map(([id,name],i)=>({id,name,cost:i?companionSkinPrice[key]:0}))]));
function companionSkin(save,key){
 const list=companionSkins[key];if(!list)return null;
 return list.find(skin=>skin.id===save.companions?.[key]?.skin)||list[0];
}
function ownsCompanionSkin(save,key,id){
 const skin=companionSkins[key]?.find(skin=>skin.id===id);
 return !!skin&&(skin.cost===0||!!save.companionSkins?.includes(key+':'+id));
}
// Returns true when the skin is now in use; buys it first if needed and affordable.
function useCompanionSkin(save,key,id){
 const skin=companionSkins[key]?.find(skin=>skin.id===id);if(!skin)return false;
 if(!ownsCompanionSkin(save,key,id)){
  if(save.gold<skin.cost)return false;
  save.gold-=skin.cost;save.companionSkins=[...(save.companionSkins||[]),key+':'+id];
 }
 (save.companions??={})[key]={...companionState(save,key),skin:id,equipped:true,hidden:false};return true;
}
function validCompanionSkins(list){
 if(list===undefined)return true;
 return Array.isArray(list)&&list.length<=80&&new Set(list).size===list.length&&list.every(entry=>{
  if(typeof entry!=='string')return false;const [key,id]=entry.split(':');
  return entry===key+':'+id&&!!companionSkins[key]?.some(skin=>skin.id===id&&skin.cost>0);});
}
function companionState(save,key){
 return {level:1,tier:1,form:0,hidden:false,equipped:false,...save.companions?.[key]};
}
function validCompanions(data){
 if(data===undefined)return true;
 return data!==null&&typeof data==='object'&&!Array.isArray(data)&&Object.entries(data).every(([key,v])=>
  Object.hasOwn(companionTypes,key)&&v&&Number.isInteger(v.level)&&v.level>=1&&v.level<=100&&Number.isInteger(v.tier)&&v.tier>=1&&v.tier<=10&&Number.isInteger(v.form)&&v.form>=0&&v.form<=2&&typeof v.hidden==='boolean'&&typeof v.equipped==='boolean'&&(v.skin===undefined||!!companionSkins[key]?.some(skin=>skin.id===v.skin)));
}
function companionPoints(v){return v.level-1+(v.tier-1)*5}
function improveCompanion(save,key,tier){
 if(!Object.hasOwn(companionTypes,key))return false;
 const v=companionState(save,key);
 if(tier){
  const eq=state(save),price=5*v.tier;
  if(v.tier>=10||v.level<v.tier*5||eq.materials.shard<price)return false;
  eq.materials.shard-=price;save.equipment=eq;v.tier++;
 }else{
  if(v.level>=100||save.gold<100*v.level)return false;
  save.gold-=100*v.level;v.level++;
 }
 (save.companions??={})[key]=v;return true;
}
function bonuses(save){const eq=state(save),sum={};
 for(const [key,type] of Object.entries(companionTypes)){
  const points=companionPoints(companionState(save,key));
  if(points)for(const [stat,n] of Object.entries(type.growth))sum[stat]=round((sum[stat]||0)+n*points);
 }
for(const slot of slots){const uid=eq.equipped[slot.id];const e=eq.items.find(i=>i.uid===uid);if(e&&catalog[e.template].tier<=unlockedTier(save))for(const [key,n]of Object.entries(detail(e).total))sum[key]=round((sum[key]||0)+n)}return sum}
const petStarts={d0:1,d1:3,d2:5,d3:8};
const familiarGroups=[
 ['Common','#9bcda1',1,65,'Leafcurl|Cinderpip|Shellkin|Ripplefin|Plumwing|Bellvine|Mossprism|Sandfrill|Coralfan|Pebbledrake'],
 ['Rare','#7cbfee',3,135,'Coaljaw|Frostglass|Thorncoil|Stormimp|Lavacrest|Runewing|Copperjaw|Moonshade|Venomfrill|Comettail'],
 ['Epic','#bd9be5',5,195,'Crescentwing|Quartz Hydra|Riftclaw|Bloomwing|Tideglass|Cinder Crown|Hourglass Wisp|Lanternjaw|Glyphwing|Mirrorwyrm'],
 ['Super Rare','#f3bf70',8,285,'Eclipse Halo|Nebula Leviathan|Pearl Seraph|Inferno Mask|Emerald Void|Amethyst Hydra|Mooncoil|Obsidian Flare|Aurora Ribbon|Starborn'],
 ['Fairies','#c5aced',3,145,'Bluebell|Firefly Pixie|Dreamveil|Bubblewing|Leafmask|Wishstar|Frost Sylph|Lunamoth|Rosewing|Prism Fae']
];
const familiars=familiarGroups.flatMap(([family,color,start,base,names],group)=>names.split('|').map((name,i)=>{
 const index=4+group*10+i,id='d'+index;
 petStarts[id]=start;
 return {id,name,family,color,type:'dragon',title:group===4?'FAE SPIRIT':'DRAGON SPIRIT',accent:color,rarity:group===4?'Rare':family,power:base+i*2,cost:800+base*12+i*30,portrait:'assets/generated/familiar-'+index+'.webp?v=sharp3'};
}));
const familiarById=Object.fromEntries(familiars.map(p=>[p.id,p]));
const petCap=20;
function petLevel(s,id){return s.petLevels?.[id]??petStarts[id]}
function emberCost(s){return s.owned.includes('d1')?10*(1+(s.emberStars||0)):50}
function evolveEmber(s){
 const cost=emberCost(s),stars=s.emberStars||0;
 if(stars>=6||(s.emberShards||0)<cost)return false;
 s.emberShards-=cost;
 if(s.owned.includes('d1'))s.emberStars=stars+1;else s.owned.push('d1');
 return true;
}
// Assist slots come in pages of twelve; a page opens when Reina reaches its level.
const assistPages=[1,50,150,300];
function assistSlots(s){const lv=globalThis.WonderProgress.level(s.xp||0);return 12*assistPages.filter(n=>lv>=n).length}
// Spare copies: a summon that lands on a pet she already has adds one. Six spare copies of one rarity can be
// synthesized into a random pet of the next rarity (a new pet, or a spare copy of it if she has it already).
const synthChain={Rare:'Common',Epic:'Rare','Super Rare':'Epic'},synthNeed=6;
function petSpares(s,id){const n=s.petSpares?.[id];return Number.isInteger(n)&&n>0?n:0}
function addPetSpare(s,id,n=1){if(Object.hasOwn(familiarById,id))(s.petSpares??={})[id]=petSpares(s,id)+n}
function synthesizePet(s,tier,ids,rng=Math.random){
 const from=synthChain[tier];if(!from||!Array.isArray(ids)||ids.length!==synthNeed)return null;
 const use={};for(const id of ids){if(familiarById[id]?.rarity!==from)return null;use[id]=(use[id]||0)+1}
 if(Object.entries(use).some(([id,n])=>petSpares(s,id)<n))return null;
 for(const [id,n] of Object.entries(use)){const left=petSpares(s,id)-n;if(left)s.petSpares[id]=left;else delete s.petSpares[id]}
 const pool=familiars.filter(p=>p.rarity===tier),p=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],isNew=!s.owned.includes(p.id);
 if(isNew)s.owned.push(p.id);else addPetSpare(s,p.id);
 return {id:p.id,isNew};
}
function petAttack(s,id){return (familiarById[id]?.power??[60,150,190,280][Number(id.slice(1))])+12*(petLevel(s,id)-petStarts[id])+30*(id==='d1'?s.emberStars||0:s.petStars?.[id]||0)}
function petTeam(s){
 const used=new Set([s.dragon]);
 function slots(source,n){
  return Array.from({length:n},(_,i)=>{
   const id=source?.[i];
   if(!Object.hasOwn(petStarts,id)||!s.owned.includes(id)||used.has(id))return null;
   used.add(id);return id;
  });
 }
 return [s.dragon,...slots(s.petPartners,2),...slots(s.petAssist,assistSlots(s))];
}
function badgeRank(s,id){
 const n=s.petBadges?.[id];
 return Number.isInteger(n)&&n>=0&&n<=20?n:0;
}
function petTeamAttack(s){
 return petTeam(s).reduce((sum,id,slot)=>id?sum+petAttack(s,id)+badgeRank(s,id)*5+(slot<3?petGearBonus(s,slot).atk:0):sum,0);
}
// ---- Pet talents and pet gear. Both belong to the three Primary Pet SLOTS, so they stay when a pet is replaced. ----
// Talents: each slot has fifteen cells (six open at first). Learn inscribes a random talent the slot does not have:
// into an empty open cell, or over a random unlocked one. Seals pay for everything.
const talentCells=15,talentFree=6,talentLearn=60,talentBook=50,talentScroll=400,talentTopScroll=1000,talentSupremeAt=12,talentStart=300;
const petHit=.35,petPace=2.4;
const petTalents=[
 {id:'fang',name:'Keen Fang',kind:'atk',text:'This pet\'s bolts deal 25% more damage.'},
 {id:'surge',name:'Wild Surge',kind:'atk',text:'Each bolt of this pet deals between 90% and 150% of its damage.'},
 {id:'haste',name:'Quick Wing',kind:'atk',text:'This pet strikes 15% more often.'},
 {id:'star',name:'Star Strike',kind:'atk',text:'This pet\'s bolts have a 20% chance to deal double damage.'},
 {id:'pounce',name:'First Pounce',kind:'atk',text:'The first bolt of this pet in every hall deals triple damage.'},
 {id:'bite',name:'Last Bite',kind:'atk',text:'This pet deals 40% more damage to enemies below 30% health.'},
 {id:'giant',name:'Giant Hunter',kind:'atk',text:'This pet deals 30% more damage to bosses.'},
 {id:'bond',name:'Bonded Might',kind:'atk',text:'Reina gains ATK +3%.',stat:['attackPercent',3]},
 {id:'mend',name:'Mending Breath',kind:'def',text:'Every 15 seconds of a fight Reina restores 2% of her maximum health.'},
 {id:'stand',name:'Last Stand',kind:'def',text:'When Reina falls below 30% health she restores 15% at once. Once every 60 seconds.'},
 {id:'hide',name:'Thick Hide',kind:'def',text:'Reina gains HP +4%.',stat:['healthPercent',4]},
 {id:'scale',name:'Scale Guard',kind:'def',text:'Reina gains DEF +4%.',stat:['defensePercent',4]},
 {id:'ward',name:'Spirit Ward',kind:'def',text:'Reina takes 2% less damage.',stat:['damageReduction',2]},
 {id:'step',name:'Lucky Step',kind:'def',text:'Reina gains Dodge +2%.',stat:['dodge',2]},
 {id:'dawn',name:'Dawn Barrier',kind:'def',text:'Reina gains Shield HP +80.',stat:['shieldHealth',80]},
 {id:'stone',name:'Stone Skin',kind:'def',text:'Reina gains Block +3%.',stat:['block',3]},
 // Second shelf of the shop. `top` talents are stronger, cost more, and never come from Learn: only from a scroll.
 {id:'venom',name:'Venom Fang',kind:'atk',text:'Each bolt this pet has already landed in the run adds 6% damage to its next ones, up to 30%.'},
 {id:'flux',name:'Tidal Flux',kind:'atk',text:'Every third bolt of this pet deals 60% more damage.'},
 {id:'apexfury',name:'Apex Fury',kind:'atk',top:true,text:'This pet\'s bolts deal 50% more damage.'},
 {id:'apexstar',name:'Apex Star',kind:'atk',top:true,text:'This pet\'s bolts have a 30% chance to deal triple damage.'},
 {id:'loyal',name:'Loyal Heart',kind:'def',text:'Reina gains Crit Rate +2%.',stat:['crit',2]},
 {id:'swift',name:'Swift Bond',kind:'def',text:'Reina gains Speed +4.',stat:['speed',4]},
 {id:'calm',name:'Calm Mind',kind:'def',text:'Reina gains Crit RES +3%.',stat:['critResistance',3]},
 {id:'apexaegis',name:'Apex Aegis',kind:'def',top:true,text:'Reina takes 5% less damage.',stat:['damageReduction',5]},
 // Counter talents: they answer a hit on Reina.
 {id:'riposte',name:'Riposte',kind:'def',text:'When Reina is hit, this pet strikes back at once for 60% of a bolt. Once every 3 seconds.'},
 {id:'aftershock',name:'Aftershock',kind:'atk',text:'After Reina is hit, the next bolt of this pet deals double damage.'}
];
const riposteShare=.6,riposteEvery=3;
const talentPrice=id=>talentById[id]?.top?talentTopScroll:talentScroll;
const talentById=Object.fromEntries(petTalents.map(t=>[t.id,t]));
const talentSupreme={name:'Dragon\'s Roar',text:'Every fifth bolt of this pet deals triple damage. Awakens when '+talentSupremeAt+' talents are inscribed in this slot.'};
function talentState(s){
 const t=s.petTalents||{};
 return {seals:t.seals??talentStart,books:t.books??0,slots:[0,1,2].map(i=>{const v=t.slots?.[i]||{};
  return {open:v.open??talentFree,cells:Array.from({length:talentCells},(_,n)=>v.cells?.[n]??null),locks:[...(v.locks||[])],target:v.target||''}})};
}
function validTalents(t){
 if(t===undefined)return true;
 if(!t||typeof t!=='object'||Array.isArray(t)||!Number.isSafeInteger(t.seals)||t.seals<0||!Number.isInteger(t.books)||t.books<0||t.books>9999||!Array.isArray(t.slots)||t.slots.length!==3)return false;
 return t.slots.every(v=>v&&Number.isInteger(v.open)&&v.open>=talentFree&&v.open<=talentCells&&Array.isArray(v.cells)&&v.cells.length===talentCells
  &&v.cells.every((id,n)=>id===null||Object.hasOwn(talentById,id)&&n<v.open)&&new Set(v.cells.filter(Boolean)).size===v.cells.filter(Boolean).length
  &&Array.isArray(v.locks)&&new Set(v.locks).size===v.locks.length&&v.locks.every(n=>Number.isInteger(n)&&n>=0&&n<v.open&&v.cells[n])
  &&(v.target===''||Object.hasOwn(talentById,v.target)));
}
const talentSlot=n=>Number.isInteger(n)&&n>=0&&n<3;
function talentIds(s,slot){return talentSlot(slot)?talentState(s).slots[slot].cells.filter(Boolean):[]}
function supremeReady(s,slot){return talentIds(s,slot).length>=talentSupremeAt}
function addSeals(s,n){const t=talentState(s);t.seals+=Math.max(0,Math.round(n));s.petTalents=t;return t.seals}
function openCellCost(open){return open>=talentCells?null:50*(open-talentFree+1)}
function openTalentCell(s,slot){
 if(!talentSlot(slot))return false;const t=talentState(s),v=t.slots[slot],cost=openCellCost(v.open);
 if(cost===null||t.seals<cost)return false;t.seals-=cost;v.open++;s.petTalents=t;return true;
}
function learnCost(s,slot){return Math.round(talentLearn*(1+.5*talentState(s).slots[slot].locks.length))}
// What a Learn would do: which talent, into which cell, and what it would overwrite. Null when nothing can change.
function rollTalent(s,slot,rng=Math.random){
 const v=talentState(s).slots[slot],pool=petTalents.filter(t=>!t.top&&!v.cells.includes(t.id));if(!pool.length)return null;
 const empty=v.cells.findIndex((id,n)=>n<v.open&&!id),free=v.cells.map((id,n)=>n).filter(n=>n<v.open&&!v.locks.includes(n));
 if(empty<0&&!free.length)return null;
 const weights=pool.map(t=>t.id===v.target?4:1),total=weights.reduce((a,b)=>a+b,0);let at=rng()*total,pick=pool[pool.length-1];
 for(let i=0;i<pool.length;i++){at-=weights[i];if(at<0){pick=pool[i];break}}
 const cell=empty>=0?empty:free[Math.min(free.length-1,Math.floor(rng()*free.length))];
 return {id:pick.id,cell,replaces:v.cells[cell]};
}
function keepTalent(s,slot,roll){
 if(!talentSlot(slot)||!roll||!Object.hasOwn(talentById,roll.id))return false;const t=talentState(s),v=t.slots[slot];
 if(!Number.isInteger(roll.cell)||roll.cell<0||roll.cell>=v.open||v.locks.includes(roll.cell)||v.cells.includes(roll.id))return false;
 v.cells[roll.cell]=roll.id;s.petTalents=t;return true;
}
// Learn: pays seals (and one Prophecy Book when `prophecy`). With prophecy the result is only shown: keepTalent applies it.
function learnTalent(s,slot,rng=Math.random,prophecy=false){
 if(!talentSlot(slot))return null;const t=talentState(s),cost=learnCost(s,slot);
 if(t.seals<cost||prophecy&&t.books<1)return null;
 const roll=rollTalent(s,slot,rng);if(!roll)return null;
 t.seals-=cost;if(prophecy)t.books--;s.petTalents=t;
 if(prophecy)return {...roll,held:true};
 keepTalent(s,slot,roll);return roll;
}
function lockTalent(s,slot,cell){
 if(!talentSlot(slot))return false;const t=talentState(s),v=t.slots[slot];if(!v.cells[cell])return false;
 v.locks=v.locks.includes(cell)?v.locks.filter(n=>n!==cell):[...v.locks,cell];s.petTalents=t;return true;
}
function forgetTalent(s,slot,cell){
 if(!talentSlot(slot))return false;const t=talentState(s),v=t.slots[slot];if(!v.cells[cell])return false;
 v.cells[cell]=null;v.locks=v.locks.filter(n=>n!==cell);s.petTalents=t;return true;
}
function setTalentTarget(s,slot,id){
 if(!talentSlot(slot)||id!==''&&(!Object.hasOwn(talentById,id)||talentById[id].top))return false;const t=talentState(s);t.slots[slot].target=id;s.petTalents=t;return true;
}
// Talent Shop: a scroll inscribes one chosen talent into the first empty open cell of a slot.
function buyTalentScroll(s,slot,id){
 if(!talentSlot(slot)||!Object.hasOwn(talentById,id))return false;const t=talentState(s),v=t.slots[slot],cell=v.cells.findIndex((x,n)=>n<v.open&&!x);
 if(t.seals<talentPrice(id)||cell<0||v.cells.includes(id))return false;t.seals-=talentPrice(id);v.cells[cell]=id;s.petTalents=t;return true;
}
function buyTalentBook(s){const t=talentState(s);if(t.seals<talentBook||t.books>=9999)return false;t.seals-=talentBook;t.books++;s.petTalents=t;return true}
const sealRates={Common:20,Rare:50,Epic:120,'Super Rare':300},sealGold={gold:1000,seals:100};
function buySeals(s){if(s.gold<sealGold.gold)return false;s.gold-=sealGold.gold;addSeals(s,sealGold.seals);return true}
// Fragment exchange: every spare copy of one rarity becomes seals.
function exchangeSpares(s,rarity){
 const rate=sealRates[rarity];if(!rate)return 0;let copies=0;
 for(const p of familiars)if(p.rarity===rarity&&petSpares(s,p.id)){copies+=petSpares(s,p.id);delete s.petSpares[p.id]}
 if(copies)addSeals(s,copies*rate);return copies*rate;
}
function talentBonus(s){
 const sum={},team=petTeam(s);talentState(s).slots.forEach((v,slot)=>{if(team[slot])for(const id of v.cells){const stat=talentById[id]?.stat;if(stat)sum[stat[0]]=(sum[stat[0]]||0)+stat[1]}});
 return sum;
}
// How many slots hold each healing talent (they add up).
function guardTalents(s){const team=petTeam(s),all=talentState(s).slots.flatMap((v,slot)=>team[slot]?v.cells:[]);return {mend:all.filter(id=>id==='mend').length,stand:all.filter(id=>id==='stand').length}}
// Pet gear: eight pieces per slot, each with a level (0 = not forged). Ten levels make a tier; crossing into a new
// tier costs shards as well as gold. The set bonus follows the lowest tier among the eight.
const petGearPieces=[{id:'horn',name:'Horn Caps',stat:'atk'},{id:'muzzle',name:'Fang Guard',stat:'atk'},{id:'claw',name:'Claw Gauntlet',stat:'atk'},{id:'collar',name:'Jewelled Collar',stat:'hp'},
 {id:'plate',name:'Chest Plate',stat:'hp'},{id:'brace',name:'Wing Brace',stat:'def'},{id:'ring',name:'Tail Ring',stat:'def'},{id:'orb',name:'Spirit Orb',stat:'atk'}];
const petGearMax=100,petGearStep={atk:4,hp:30,def:6},petGearSetStep=4;
function petGearLevels(s,slot){return petGearPieces.map((_,i)=>{const n=s.petGear?.[slot]?.[i];return Number.isInteger(n)&&n>0&&n<=petGearMax?n:0})}
const petGearTier=level=>level?1+Math.floor((level-1)/10):0;
function petGearCost(level){return level>=petGearMax?null:{gold:200+level*60,shard:level>0&&level%10===0?4+2*level/10:0}}
function petGearBonus(s,slot){
 const levels=petGearLevels(s,slot),sum={atk:0,hp:0,def:0};levels.forEach((n,i)=>{const stat=petGearPieces[i].stat;sum[stat]+=n*petGearStep[stat]});
 const tier=Math.min(...levels.map(petGearTier));return {...sum,tier,dmg:tier*petGearSetStep};
}
function upgradePetGear(s,slot,piece){
 if(!talentSlot(slot)||!petGearPieces[piece])return false;const levels=petGearLevels(s,slot),cost=petGearCost(levels[piece]);if(!cost||s.gold<cost.gold)return false;
 const eq=state(s);if(eq.materials.shard<cost.shard)return false;
 if(cost.shard){eq.materials.shard-=cost.shard;s.equipment=eq}
 s.gold-=cost.gold;levels[piece]++;s.petGear=[0,1,2].map(i=>i===slot?levels:petGearLevels(s,i));return true;
}
function validPetGear(g){return g===undefined||Array.isArray(g)&&g.length===3&&g.every(row=>Array.isArray(row)&&row.length===petGearPieces.length&&row.every(n=>Number.isInteger(n)&&n>=0&&n<=petGearMax))}
// Damage of one bolt of the pet in `slot`. ctx: first bolt of the hall, enemy health ratio, boss, this pet's bolt number.
function petBolt(s,slot,id,ctx={},rng=Math.random){
 const have=new Set(talentIds(s,slot)),gear=petGearBonus(s,slot);
 let dmg=(petAttack(s,id)+gear.atk)*petHit*(1+gear.dmg/100);
 if(have.has('fang'))dmg*=1.25;
 if(have.has('surge'))dmg*=.9+rng()*.6;
 if(have.has('star')&&rng()<.2)dmg*=2;
 if(have.has('pounce')&&ctx.first)dmg*=3;
 if(have.has('bite')&&ctx.enemyRatio<.3)dmg*=1.4;
 if(have.has('giant')&&ctx.boss)dmg*=1.3;
 if(have.has('venom'))dmg*=1+Math.min(5,Math.max(0,(ctx.count||1)-1))*.06;
 if(have.has('flux')&&ctx.count>0&&ctx.count%3===0)dmg*=1.6;
 if(have.has('apexfury'))dmg*=1.5;
 if(have.has('apexstar')&&rng()<.3)dmg*=3;
 if(have.has('aftershock')&&ctx.charged)dmg*=2;
 if(ctx.riposte)dmg*=riposteShare;
 if(have.size>=talentSupremeAt&&ctx.count>0&&ctx.count%5===0)dmg*=3;
 return Math.round(dmg);
}
function petBoltPace(s,slot){return petPace/(talentIds(s,slot).includes('haste')?1.15:1)}
function validPets(s){
 if(!validCompanions(s.companions)||!validCompanionSkins(s.companionSkins))return false;
 // A worn paid appearance must be owned.
 for(const [key,v] of Object.entries(s.companions||{}))if(v.skin!==undefined&&!ownsCompanionSkin(s,key,v.skin))return false;
 for(const [ranks,max] of [[s.petBadges,20],[s.petStars,6]]){
  if(ranks!==undefined&&(!ranks||typeof ranks!=='object'||Array.isArray(ranks)||!Object.entries(ranks).every(([id,n])=>Object.hasOwn(petStarts,id)&&s.owned?.includes(id)&&Number.isInteger(n)&&n>=0&&n<=max)))return false;
 }
 if(!validTalents(s.petTalents)||!validPetGear(s.petGear))return false;
 if(!validBag(s))return false;
 if(s.emberShards!==undefined&&(!Number.isSafeInteger(s.emberShards)||s.emberShards<0))return false;
 if(s.petSpares!==undefined&&(!s.petSpares||typeof s.petSpares!=='object'||Array.isArray(s.petSpares)||!Object.entries(s.petSpares).every(([id,n])=>Object.hasOwn(familiarById,id)&&Number.isInteger(n)&&n>0&&n<=9999)))return false;
 if(s.emberStars!==undefined&&(!Number.isInteger(s.emberStars)||s.emberStars<0||s.emberStars>6||!s.owned?.includes('d1')))return false;
 return s.petLevels===undefined||(s.petLevels!==null&&typeof s.petLevels==='object'&&!Array.isArray(s.petLevels)&&Object.entries(s.petLevels).every(([id,n])=>Object.hasOwn(petStarts,id)&&s.owned?.includes(id)&&Number.isInteger(n)&&n>=petStarts[id]&&n<=petCap))}
function trainPet(s,id){
 if(!Object.hasOwn(petStarts,id)||!s.owned.includes(id))return false;
 const level=petLevel(s,id),cost=level*100;
 if(level>=petCap||s.gold<cost)return false;
 s.gold-=cost;(s.petLevels??={})[id]=level+1;return true;
}
const fashionTraits=Object.freeze({hair:30,clothing:5,weapon:6,wings:12});
function stats(save){const b=bonuses(save);
 const look=save.reinaFashion?.equipped||0;
 if((look&1)||save.atelier?.hair)b.health=(b.health||0)+fashionTraits.hair;
 if(look&2)b.defense=(b.defense||0)+fashionTraits.clothing;
 if((look&4)||save.atelier?.weapon)b.attack=(b.attack||0)+fashionTraits.weapon;
 if(/^(?:w[0-3]|fashion-wing-(?:[1-9]|1\d|20))$/.test(save.reinaFashion?.wingSkin))b.shieldHealth=(b.shieldHealth||0)+fashionTraits.wings;
 const bowBonus=['roseguard','starfall','lilyveil','emberleaf'].reduce((total,id)=>{
   const rank=save.fashionBows?.[id];
   return Number.isSafeInteger(rank)&&rank>0 ? total+rank*20 : total;
 },0);
 // Pet talents that strengthen Reina, and the gear of every slot that has a pet in it.
 for(const [key,n] of Object.entries(talentBonus(save)))b[key]=(b[key]||0)+n;
 petTeam(save).slice(0,3).forEach((id,slot)=>{if(!id)return;const gear=petGearBonus(save,slot);b.health=(b.health||0)+gear.hp;b.defense=(b.defense||0)+gear.def});
 for(const [key,n] of Object.entries(devourBonus(save)))b[key]=(b[key]||0)+n;
 const cards=globalThis.MoonwaterFish.totals(save.fishCards);
 const lv=globalThis.WonderProgress.level(save.xp),d=petTeamAttack(save),w=[40,120,180,240][Number(save.wings[1])];const attack=Math.round((85+lv*7+d+(b.attack||0))*(1+(b.attackPercent||0)/100))+(cards.attack||0)+bowBonus,defense=Math.round((52+lv*4+w+(b.defense||0))*(1+(b.defensePercent||0)/100))+(cards.defense||0),health=Math.round((900+lv*75+(b.health||0))*(1+(b.healthPercent||0)/100))+(cards.health||0),crit=round(Math.min(75,8+(b.crit||0))),speed=100+(b.speed||0),penetration=round(b.penetration||0),damageBonus=round(b.damageBonus||0),damageReduction=round(Math.min(50,b.damageReduction||0)),block=round(Math.min(40,b.block||0)),expBonus=round(b.expBonus||0);const accuracy=round(100+(b.accuracy||0)),dodge=round(Math.min(30,b.dodge||0)),critDamage=round(165+(b.critDamage||0)),critResistance=round(Math.min(30,b.critResistance||0)),shieldHealth=Math.round(b.shieldHealth||0)+(cards.shieldHealth||0),elementalAttack=Math.round(b.elementalAttack||0)+(cards.elementalAttack||0),elementalDefense=Math.round(b.elementalDefense||0)+(cards.elementalDefense||0),armor=round(100-10000/(100+defense*.35)),attackInterval=round(100/speed),healing=Math.round(health*.25);
const advanced={accuracy,dodge,critDamage,critResistance,shieldHealth,elementalAttack,elementalDefense,armor,attackInterval,healing};
return {attack,defense,health,crit,speed,penetration,damageBonus,damageReduction,block,expBonus,...advanced,level:lv,power:Math.floor(attack*5+defense*4+health/3+crit*10+speed+penetration*3+damageBonus*20+damageReduction*25+block*15+attributePower({...advanced,accuracy:accuracy-100,critDamage:critDamage-165}))}}
function cost(entry,action){const t=catalog[entry.template];if(action==='enhance')return entry.enhance>=20?null:{gold:150+entry.enhance*100,stone:2+Math.floor(entry.enhance/4)};if(action==='star')return entry.stars>=5?null:{gold:200*(entry.stars+1),shard:3*(entry.stars+1)};if(action==='gem')return entry.gems>=3?null:{gold:150*(entry.gems+1),gem:1};if(action==='craft')return t.tier>=maxTier?null:{gold:500*(t.grade+1),essence:3*(t.grade+1),stone:5*(t.grade+1),synthesis:t.tier};return null}
function equipped(eq,uid){return Object.values(eq.equipped).includes(uid)}
const starGearCount=4;
// Crafting keeps three families apart: a piece only takes spare pieces of its own family and tier.
const gearGroups=['Equipment','Necklace & Amulet','Rings'];
function gearGroup(template){const slot=catalog[template]?.slot||'';return ['necklace','amulet'].includes(slot)?gearGroups[1]:slot.startsWith('spirit')?gearGroups[2]:gearGroups[0]}
function starDonors(eq,item){
 return eq.items.filter(e=>e.uid!==item.uid&&!e.starter&&!e.stored&&!equipped(eq,e.uid)&&catalog[e.template].tier===catalog[item.template].tier&&gearGroup(e.template)===gearGroup(item.template));
}
function perform(save,uid,action,donors=[]){const eq=state(save);const i=eq.items.find(e=>e.uid===uid);if(!i)return {ok:false,error:'Item not found.'};if(i.stored)return {ok:false,error:'Withdraw this item first.'};if(action==='equip'||action==='craft'||action==='star'){
 if(action==='craft'&&i.starter)return {ok:false,error:'Use a spare item for tier synthesis.'};
 const target=catalog[i.template].tier+(action==='craft'?1:0);
 if(target<=maxTier&&target>unlockedTier(save))return {ok:false,error:'T'+target+' unlocks at hero level '+requiredLevel(target)+'.'};
}if(action==='equip'){const t=catalog[i.template];if(eq.equipped[t.slot]===uid)return {ok:false,error:'Already equipped.'};save.equipment=eq;eq.equipped[t.slot]=uid;return {ok:true,entry:i}}const price=cost(i,action);if(!price)return {ok:false,error:'This upgrade is already complete.'};if((price.gold||0)>save.gold||materialDefs.some(m=>(price[m.id]||0)>eq.materials[m.id]))return {ok:false,error:'Not enough gold or materials.'};if(action==='star'){
 const eligible=new Set(starDonors(eq,i).map(e=>e.uid));
 if(!Array.isArray(donors)||donors.length!==starGearCount||new Set(donors).size!==starGearCount||donors.some(id=>!eligible.has(id)))return {ok:false,error:'Select four spare items of the same tier and kind.'};
 eq.items=eq.items.filter(e=>!donors.includes(e.uid));
}save.equipment=eq;save.gold-=price.gold||0;for(const m of materialDefs)eq.materials[m.id]-=price[m.id]||0;if(action==='enhance')i.enhance++;else if(action==='star')i.stars++;else if(action==='gem')i.gems++;else if(action==='craft'){const t=catalog[i.template];i.template=t.slot+'-t'+(t.tier+1)}return {ok:true,entry:i}}
function salvage(save,uid){const eq=state(save),i=eq.items.find(e=>e.uid===uid);if(i?.starter)return {ok:false,error:'Keep your basic equipment set.'};if(i?.stored)return {ok:false,error:'Withdraw this item first.'};if(!i||equipped(eq,uid))return {ok:false,error:'Equipped items cannot be salvaged.'};const t=catalog[i.template];save.equipment=eq;eq.items=eq.items.filter(e=>e.uid!==uid);eq.materials.stone+=3+t.grade*3+i.enhance;eq.materials.shard+=i.stars;eq.materials.gem+=i.gems;save.gold+=50*(t.grade+1);return {ok:true}}
function addDrop(save,tier=1,slotId=null){const eq=state(save);if(eq.items.length>=80){save.equipment=eq;eq.materials.stone+=5;return {converted:true}}const allowed=tiers.filter(t=>t.tier<=tier),t=allowed[allowed.length-1],slot=slots.find(s=>s.id===slotId)||slots[Math.floor(Math.random()*slots.length)],entry={uid:eq.nextId++,template:slot.id+'-t'+t.tier,enhance:0,stars:0,gems:0};save.equipment=eq;eq.items.push(entry);return entry}
const bossLootTables={
mistwood:{slots:['bow','boots','bracers'],enhance:1,stars:1,stone:12,shard:3,gem:1,essence:2},
moonfall:{slots:['crown','necklace','spiritguard'],enhance:1,stars:1,stone:16,shard:4,gem:1,essence:3},
emberpeak:{slots:['armor','leggings','amulet'],enhance:2,stars:1,stone:20,shard:5,gem:1,essence:4},
coral:{slots:['necklace','spiritluck','boots'],enhance:2,stars:1,stone:24,shard:6,gem:2,essence:5},
frost:{slots:['armor','crown','leggings'],enhance:2,stars:2,stone:28,shard:7,gem:2,essence:6},
honey:{slots:['bracers','amulet','spiritguard'],enhance:2,stars:2,stone:32,shard:8,gem:2,essence:7},
storm:{slots:['bow','boots','necklace'],enhance:3,stars:2,stone:38,shard:10,gem:3,essence:9},
crystal:{slots:['crown','spiritluck','amulet'],enhance:3,stars:3,stone:44,shard:12,gem:3,essence:11},
sunspire:{slots:slots.map(s=>s.id),enhance:4,stars:4,stone:55,shard:15,gem:4,essence:14}
};
const guardianNames=['Jade Antlerwolf','Sapphire Bastion','Ruby Gryphon','Gilded Serpent','Amethyst Dreamwing','Coral Hydra','Glacier Mammoth','Ember Mantis','Mossback Tusk','Moonveil Fox','Pearlclaw','Obsidian Minotaur','Voltfang Wyvern','Rosewood Hart','Ivory Sphinx','Astral Scorpion','Mistborn Qilin','Copperhide','Tide Leviathan','Crystal Owl','Storm Chimera','Lava Basilisk','Diamond Lion','Aurora Phoenix','Celestial Dragon'];
const tierGuardians=guardianNames.map((name,index)=>{
 const tier=index+7,id='guardian-t'+tier;
 const source=bossLootTables[['storm','crystal','sunspire'][index%3]];
 bossLootTables[id]={...source};
 return {name,id,tier};
});
const artworkIds=Object.keys(bossLootTables);
const encounters=[];
for(let tier=1;tier<=maxTier;tier++){
 const originals=tier===1?artworkIds.slice(0,4):[artworkIds[tier+2]];
 for(let slot=0;slot<5;slot++){
  const original=originals[slot];
  const art=original||artworkIds[(tier*5+slot*7)%artworkIds.length];
  const id=original||'trial-'+tier+'-'+(slot+1);
  if(!original)bossLootTables[id]={...bossLootTables[art]};
  encounters.push({id,art,tier,slot});
 }
}
// At level 50 and beyond, the next wearable tier joins the ongoing loot pool.
function bossGearTier(save){
 const level=globalThis.WonderProgress.level(save.xp||0);
 return level<50?(level>=45?2:1):Math.min(maxTier,unlockedTier(save)+1);
}
function bossGearLabel(save){
 const top=bossGearTier(save);
 return top<3?'T'+top:'T2–T'+top;
}
function rollBossTier(save,random){
 const top=bossGearTier(save);
 if(top<3)return top;
 const roll=random();
 if(roll<.5)return unlockedTier(save);
 if(roll<.8)return top;
 return 2+Math.min(top-2,Math.floor(random()*(top-1)));
}
function bossLoot(save,id,random=Math.random){const table=bossLootTables[id];if(!table)return null;const eq=state(save);save.equipment=eq;const materials=Object.fromEntries(materialDefs.map(m=>[m.id,table[m.id]||0]));for(const m of materialDefs)eq.materials[m.id]+=materials[m.id];const tier=rollBossTier(save,random),slot=table.slots[Math.min(table.slots.length-1,Math.max(0,Math.floor(random()*table.slots.length)))],drop=addDrop(save,tier,slot);if(drop.converted){eq.materials.stone+=15;materials.stone+=20;}else{drop.enhance=table.enhance;drop.stars=table.stars;}return {...materials,entry:drop.converted?null:drop,converted:!!drop.converted};}
function grant(save,type,won,score=0){const eq=state(save);save.equipment=eq;let stones=type==='dungeon'?(won?12:3):type==='defense'?(won?8:2):type==='spar'?(won?2:0):Math.min(7,Math.floor(score/180));eq.materials.stone+=stones;let shard=won&&(type==='dungeon'||type==='defense')?3:0;eq.materials.shard+=shard;if(won&&type==='dungeon'){eq.materials.essence+=2;eq.materials.gem+=1}return {stone:stones,shard,gem:won&&type==='dungeon'?1:0,essence:won&&type==='dungeon'?2:0}}
// ---- Bag ---------------------------------------------------------------------------------------------------------
// Things Reina carries besides equipment. Stacks live in the optional save field `bag` {id:n}; what is put away in
// the warehouse lives in `vault` {key:n} with keys "i:<item>" and "m:<material>". All numbers are placeholders.
const bagCapacity=150,bagStackMax=99999,bagStarter={exp1:3,gold1:2,chest1:1,stam:1,petegg:1};
const bagRarity={b:['Common','#58b7ff'],p:['Rare','#b784ff'],o:['Epic','#ffa94a'],r:['Legendary','#ff5d6c']};
const bagItems=[
 {id:'exp1',name:'Dew of Wisdom',kind:'Experience',rarity:'b',text:'A drop of morning wisdom. Gives Reina 150 XP.',give:{xp:150}},
 {id:'exp2',name:'Star of Wisdom',kind:'Experience',rarity:'p',text:'A fallen star of knowledge. Gives Reina 1,500 XP.',give:{xp:1500}},
 {id:'gold1',name:'Coin Pouch',kind:'Treasure',rarity:'b',text:'A small pouch of coins. Gives 500 gold.',give:{gold:500}},
 {id:'gold2',name:'Coin Coffer',kind:'Treasure',rarity:'o',text:'A coffer filled to the brim. Gives 5,000 gold.',give:{gold:5000}},
 {id:'chest1',name:'Oak Chest',kind:'Chest',rarity:'b',text:'Gold, enhancement crystals and one small surprise.',give:{gold:300,stone:10},pick:['exp1','gold1','stam']},
 {id:'chest2',name:'Moon Chest',kind:'Chest',rarity:'p',text:'Gold, crystals, star shards, one piece of equipment and a surprise.',give:{gold:800,stone:20,shard:5,gear:0},pick:['exp1','wish','sealbag']},
 {id:'chest3',name:'Winged Chest',kind:'Chest',rarity:'r',text:'A rich haul: gold, gems, forge essence, fine equipment, a Star of Wisdom and a rare surprise.',give:{gold:2000,gem:3,essence:5,gear:1,item:{exp2:1}},pick:['petegg','wish','gembox']},
 {id:'gearbox',name:"Armourer's Crate",kind:'Chest',rarity:'o',text:'One piece of equipment of the tier Reina can wear.',give:{gear:0}},
 {id:'stam',name:'Vigor Tonic',kind:'Tonic',rarity:'b',text:'Restores 1 boss stamina spent today.',give:{stamina:1}},
 {id:'wish',name:'Wish Ticket',kind:'Ticket',rarity:'p',text:'Worth 50 wishes: one pet summon.',give:{tickets:50}},
 {id:'petegg',name:'Pet Egg',kind:'Pet',rarity:'o',pet:true,text:'Hatches into one random pet. A pet she already has becomes a spare copy.',give:{pet:1}},
 {id:'sealbag',name:'Seal Satchel',kind:'Pet',rarity:'p',pet:true,text:'Holds 50 talent seals for the Pet Talent room.',give:{seals:50}},
 {id:'shardbag',name:'Star Shard Pouch',kind:'Bundle',rarity:'p',text:'Holds 10 star shards.',give:{shard:10}},
 {id:'stonebag',name:'Crystal Bundle',kind:'Bundle',rarity:'b',text:'Holds 20 enhancement crystals.',give:{stone:20}},
 {id:'gembox',name:'Jewel Box',kind:'Bundle',rarity:'o',text:'Holds 3 sky gems.',give:{gem:3}},
 {id:'essence',name:'Essence Vial',kind:'Bundle',rarity:'p',text:'Holds 5 forge essence.',give:{essence:5}}
];
const bagItemById=Object.fromEntries(bagItems.map(i=>[i.id,i]));
const bagOf=s=>s.bag||{...bagStarter},vaultOf=s=>s.vault||{};
function bagCount(s,id){const n=bagOf(s)[id];return Number.isInteger(n)&&n>0?n:0}
function bagAdd(s,id,n=1){if(!Object.hasOwn(bagItemById,id)||!(n>0))return 0;const bag=bagOf(s);bag[id]=Math.min(bagStackMax,(bag[id]||0)+Math.round(n));s.bag=bag;return bag[id]}
function bagStacks(s){const bag=bagOf(s);return bagItems.filter(i=>bag[i.id]>0).map(i=>({id:i.id,n:bag[i.id],item:i}))}
// Places taken in the bag: every stack and every piece of equipment that is not in the warehouse.
function bagUsed(s){return bagStacks(s).length+state(s).items.filter(e=>!e.stored).length+materialDefs.filter(m=>state(s).materials[m.id]>0).length}
function vaultCount(s,key){const n=vaultOf(s)[key];return Number.isInteger(n)&&n>0?n:0}
function vaultKeyOk(key){return typeof key==='string'&&(key.startsWith('i:')?Object.hasOwn(bagItemById,key.slice(2)):key.startsWith('m:')&&materialDefs.some(m=>m.id===key.slice(2)))}
// Moves a whole stack between the bag and the warehouse.
function vaultMove(s,key,store){
 if(!vaultKeyOk(key))return false;
 const id=key.slice(2),vault={...vaultOf(s)},item=key[0]==='i',eq=state(s),bag=bagOf(s);
 const here=item?bag[id]||0:eq.materials[id]||0,there=vault[key]||0,n=store?here:there;
 if(!n)return false;
 if(store)vault[key]=there+n;else delete vault[key];
 if(item){if(store)delete bag[id];else bag[id]=Math.min(bagStackMax,here+n);s.bag=bag}
 else{eq.materials[id]=store?0:here+n;s.equipment=eq}
 s.vault=vault;return true;
}
function eggPet(s,rng){
 const roll=rng(),tier=roll<.04?'Super Rare':roll<.2?'Epic':roll<.55?'Rare':'Common',pool=familiars.filter(p=>p.rarity===tier),p=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
 const had=s.owned.includes(p.id);if(had)addPetSpare(s,p.id);else s.owned.push(p.id);
 return {kind:'pet',id:p.id,spare:had};
}
// Opens or drinks `count` of one stack. Returns what Reina gained, as a list the UI can show.
function useBagItem(s,id,count=1,rng=Math.random){
 const item=bagItemById[id],have=bagCount(s,id);count=Math.min(have,Math.max(1,Math.floor(count)));
 if(!item||!have)return {ok:false,error:'Nothing to use.'};
 const eq=state(s),sum={},note=(key,n)=>{if(n)sum[key]=(sum[key]||0)+n},gains=[];let used=0;
 for(;used<count;used++){
  const g=item.give||{};
  if(g.stamina){const a=globalThis.WonderAdventure,day=a.dailyDungeon(s);if(!day.spent)break;a.state(s).dungeonDay={...day,spent:day.spent-1};note('stamina',1)}
  if(g.xp)note('xp',globalThis.WonderProgress.award(s,g.xp));
  if(g.gold){s.gold+=g.gold;note('gold',g.gold)}
  if(g.tickets){s.tickets+=g.tickets;note('tickets',g.tickets)}
  if(g.seals){addSeals(s,g.seals);note('seals',g.seals)}
  for(const m of materialDefs)if(g[m.id]){eq.materials[m.id]+=g[m.id];s.equipment=eq;note('m:'+m.id,g[m.id])}
  if(g.gear!==undefined){const drop=addDrop(s,Math.min(maxTier,unlockedTier(s)+g.gear));if(drop.converted)note('m:stone',5);else gains.push({kind:'gear',uid:drop.uid,template:drop.template})}
  if(g.pet)gains.push(eggPet(s,rng));
  for(const [other,n] of Object.entries(g.item||{})){bagAdd(s,other,n);note('i:'+other,n)}
  if(item.pick){const other=item.pick[Math.min(item.pick.length-1,Math.floor(rng()*item.pick.length))];bagAdd(s,other,1);note('i:'+other,1)}
 }
 if(!used)return {ok:false,error:item.give?.stamina?'Stamina is already full.':'Nothing to use.'};
 const bag=bagOf(s);if(bag[id]>used)bag[id]-=used;else delete bag[id];s.bag=bag;
 for(const [key,n] of Object.entries(sum))gains.unshift(key.startsWith('m:')?{kind:'material',id:key.slice(2),n}:key.startsWith('i:')?{kind:'item',id:key.slice(2),n}:{kind:key,n});
 return {ok:true,used,gains};
}
// ---- Devour: spare equipment feeds the Glimmer Maw; its level strengthens Reina ----------------------------------
const devourStep={attack:6,health:60,defense:5},devourMax=200;
function devourNeed(level){return 40+level*20}
function devourWorth(entry){const t=catalog[entry.template];return 10*t.tier+15*t.grade+8*entry.stars+2*entry.enhance}
function devourState(s){let into=Number.isSafeInteger(s.devour)?s.devour:0,level=0;const total=into;while(level<devourMax&&into>=devourNeed(level)){into-=devourNeed(level);level++}return {level,into,need:level>=devourMax?0:devourNeed(level),total}}
function devourBonus(s){const level=devourState(s).level;return {attack:level*devourStep.attack,health:level*devourStep.health,defense:level*devourStep.defense}}
function devourable(s){const eq=state(s);return eq.items.filter(e=>!e.stored&&!e.starter&&!equipped(eq,e.uid))}
// Feeds spare pieces to the Maw. Stars and gems on them come back as shards and gems, as with salvage.
function devourGear(s,uids){
 const eq=state(s),ok=new Set(devourable(s).map(e=>e.uid)),ids=[...new Set(uids)];
 if(!ids.length||!ids.every(id=>ok.has(id)))return {ok:false,error:'Only spare equipment from the bag can be devoured.'};
 const before=devourState(s);let gained=0;
 for(const e of eq.items.filter(e=>ids.includes(e.uid))){gained+=devourWorth(e);eq.materials.shard+=e.stars;eq.materials.gem+=e.gems}
 eq.items=eq.items.filter(e=>!ids.includes(e.uid));s.equipment=eq;s.devour=before.total+gained;
 return {ok:true,gained,levels:devourState(s).level-before.level};
}
function validBag(s){
 const counts=(o,ok)=>o===undefined||!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,n])=>ok(k)&&Number.isInteger(n)&&n>0&&n<=1e9);
 return counts(s.bag,k=>Object.hasOwn(bagItemById,k))&&counts(s.vault,vaultKeyOk)&&(s.devour===undefined||Number.isSafeInteger(s.devour)&&s.devour>=0&&s.devour<=1e12);
}
return Object.freeze({gearGroups,gearGroup,bagCapacity,bagStarter,bagRarity,bagItems,bagItemById,bagCount,bagAdd,bagStacks,bagUsed,vaultCount,vaultMove,useBagItem,devourStep,devourMax,devourNeed,devourWorth,devourState,devourBonus,devourable,devourGear,validBag,riposteShare,riposteEvery,talentCells,talentFree,talentLearn,talentBook,talentScroll,talentTopScroll,talentPrice,talentSupremeAt,talentSupreme,petTalents,talentState,talentIds,supremeReady,addSeals,openCellCost,openTalentCell,learnCost,rollTalent,keepTalent,learnTalent,lockTalent,forgetTalent,setTalentTarget,buyTalentScroll,buyTalentBook,sealRates,sealGold,buySeals,exchangeSpares,talentBonus,guardTalents,petGearPieces,petGearMax,petGearStep,petGearSetStep,petGearLevels,petGearTier,petGearCost,petGearBonus,upgradePetGear,petBolt,petBoltPace,petHit,petPace,assistPages,assistSlots,synthChain,synthNeed,petSpares,addPetSpare,synthesizePet,fashionTraits,companionTypes,companionSkins,companionSkin,ownsCompanionSkin,useCompanionSkin,companionState,companionPoints,improveCompanion,petTeam,petTeamAttack,badgeRank,familiars,emberCost,evolveEmber,petLevel,petAttack,petCap,validPets,trainPet,slots,tiers,stonePrice,buyStone,maxTier,requiredLevel,unlockedTier,artTier,catalog,labels,percentKeys,materialDefs,fresh,valid,repairLoadout,equipBasicSet,state,detail,bonuses,stats,cost,equipped,perform,salvage,addDrop,grant,starGearCount,starDonors,tierGuardians,encounters,bossGearTier,bossGearLabel,bossLoot,bossLootTables});
})();
