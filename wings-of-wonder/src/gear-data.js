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
// ---- Quality ladder ----------------------------------------------------------------------------------------------
// Dungeon guardians drop Blue, Purple and Orange pieces. Orange (2 stars) is the first quality that is crafted on:
// five Orange pieces of one tier and family make a 2-Star Red, and so on up the ladder (`need` pieces of the quality
// below, plus `mats`). Blue and Purple are food for the Glimmer Maw. `bonus` is the share of base stats a quality adds.
// A piece stores its place as the optional field `rank`; pieces from before the ladder are read from their stars.
const gearRanks=[
 {id:'blue',name:'Blue',stars:0,color:'#58b7ff',bonus:0},
 {id:'purple',name:'Purple',stars:1,color:'#b784ff',bonus:.12},
 {id:'orange',name:'Orange',stars:2,color:'#ffa94a',bonus:.24},
 {id:'red2',name:'2-Star Red',stars:2,color:'#ff5d6c',bonus:.3,need:5,flex:true},
 {id:'red3',name:'3-Star Red',stars:3,color:'#ff5d6c',bonus:.36,need:5},
 {id:'gold4',name:'4-Star Dark Gold',stars:4,color:'#e0a02c',bonus:.48,need:2,mats:{essence:20}},
 {id:'pink5',name:'5-Star Pink',stars:5,color:'#ff7ac8',bonus:.6,need:1,mats:{gem:10}},
 {id:'relic5',name:'5-Star Relic',stars:5,color:'#ff4fa0',bonus:.72,need:3,mats:{gem:12,essence:20}},
 {id:'rainbow',name:'Rainbow',stars:5,color:'#8fe8ff',bonus:.84,need:1,mats:{gem:15,synthesis:3}},
 {id:'god',name:'Divine Rainbow',stars:5,color:'#ffe27a',bonus:.96,need:1,mats:{gem:25,synthesis:5}}
];
const legacyRanks=[0,1,2,4,5,6],gearCraftFrom=3,gearNoDevour=7,bossDropRanks=[2,1,0];
// Rare guardian drops, each rolled on its own after the three sure pieces. The chances are real and shown in the lobby.
const bossRare=[{kind:'gear',rank:3,chance:.08},{kind:'item',id:'gembox',chance:.1},{kind:'item',id:'petegg',chance:.05},{kind:'item',id:'chest3',chance:.02}];
function gearRank(entry){return Number.isInteger(entry.rank)?entry.rank:legacyRanks[entry.stars]??0}
function fresh(save){const eq={version:1,nextId:15,items:[],equipped:{},materials:{stone:60,shard:12,gem:4,essence:8,synthesis:0}};for(let i=0;i<slots.length;i++){const slot=slots[i],legacy={bow:'bow',crown:'crown',armor:'armor',boots:'boots',spiritluck:'ring',amulet:'charm'}[slot.id];const entry={uid:i+1,template:slot.id+'-t1',enhance:legacy?(save.upgrades?.[legacy]||0):0,stars:0,gems:0};eq.items.push(entry);eq.equipped[slot.id]=entry.uid}for(const [j,id]of ['bow-t3','boots-t3','spiritguard-t3','spiritluck-t1'].entries())eq.items.push({uid:11+j,template:id,enhance:0,stars:0,gems:0});return eq}
function valid(eq){if(eq===undefined)return true;return !!eq&&eq.version===1&&Number.isSafeInteger(eq.nextId)&&eq.nextId>0&&eq.nextId<1e9&&Array.isArray(eq.items)&&eq.items.length<=80+slots.length&&new Set(eq.items.map(i=>i?.uid)).size===eq.items.length&&eq.items.every(i=>i&&(i.stored===undefined||typeof i.stored==='boolean')&&Number.isSafeInteger(i.uid)&&i.uid>0&&i.uid<eq.nextId&&typeof i.template==='string'&&Object.hasOwn(catalog,i.template)&&Number.isInteger(i.enhance)&&i.enhance>=0&&i.enhance<=20&&Number.isInteger(i.stars)&&i.stars>=0&&i.stars<=5&&Number.isInteger(i.gems)&&i.gems>=0&&i.gems<=3&&(i.rank===undefined||Number.isInteger(i.rank)&&i.rank>=0&&i.rank<gearRanks.length&&gearRanks[i.rank].stars===i.stars))&&!!eq.equipped&&Object.keys(eq.equipped).length===10&&slots.every(slot=>eq.equipped[slot.id]===null||eq.items.some(i=>!i.stored&&i.uid===eq.equipped[slot.id]&&catalog[i.template].slot===slot.id))&&!!eq.materials&&materialDefs.every(m=>(m.id==='synthesis'&&eq.materials.synthesis===undefined)||Number.isSafeInteger(eq.materials[m.id])&&eq.materials[m.id]>=0&&eq.materials[m.id]<=1e9)}
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
function detail(entry){const t=catalog[entry.template],base={},enhancement={},star={},gem={},perfect={};for(const [key,n]of Object.entries(t.base)){base[key]=round(n*t.factor);star[key]=round(base[key]*gearRanks[gearRank(entry)].bonus)}for(const [key,n]of Object.entries(t.enhanceBonus))enhancement[key]=round(n*entry.enhance);if(entry.gems){const key=t.offense?'attack':'health';gem[key]=entry.gems*(t.offense?18:75);gem[t.offense?'penetration':'defense']=entry.gems*(t.offense?4:9)}if(t.grade){if(t.offense){perfect.attackPercent=round(t.grade*1.5);perfect.damageBonus=t.grade}else{perfect.healthPercent=round(t.grade*1.2);perfect.defensePercent=round(t.grade*1.5);perfect.damageReduction=round(t.grade*.6)}}if(t.slot==='spiritguard')perfect.expBonus=entry.stars*3;if(t.slot==='crown'&&t.grade>=2)perfect.block=t.grade*1.5;const total={};for(const section of [base,enhancement,star,gem,perfect])for(const [key,n]of Object.entries(section))total[key]=round((total[key]||0)+n);return {template:t,base,enhancement,star,gem,perfect,total,power:Math.round((total.attack||0)*5+(total.defense||0)*4+(total.health||0)/3+(total.crit||0)*10+(total.speed||0)+(total.penetration||0)*3+(total.attackPercent||0)*20+(total.healthPercent||0)*10+(total.defensePercent||0)*15+(total.damageBonus||0)*20+(total.damageReduction||0)*25+(total.block||0)*15+attributePower(total))}}
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
 {id:'aftershock',name:'Aftershock',kind:'atk',text:'After Reina is hit, the next bolt of this pet deals double damage.'},
 // Third shelf (user photos 2026-11-22 of the reference's common skills; original names, same ideas).
 {id:'power',name:'Fierce Spirit',kind:'atk',text:'This pet\'s ATK +7%: its bolts deal 7% more damage.'},
 {id:'aim',name:'True Aim',kind:'atk',text:'Guardians and bosses can no longer turn this pet\'s bolts aside: +10% damage against them.'},
 {id:'keen',name:'Keen Eye',kind:'atk',text:'This pet\'s bolts have a 7% chance to be critical and deal 150% damage.'},
 {id:'bash',name:'Stunning Bash',kind:'atk',text:'This pet\'s bolts have a 15% chance to stun the enemy, delaying its next attack by 1 second.'},
 {id:'ambush',name:'Ambush',kind:'atk',text:'This pet deals 7% more damage.'},
 {id:'toxin',name:'Toxic Blade',kind:'atk',text:'After a bolt lands there is a 10% chance to poison the enemy: it loses 1% of its maximum health every second for 5 seconds.'},
 {id:'waver',name:'Wavering Tide',kind:'atk',text:'This pet\'s final damage varies between 90% and 120%.'},
 {id:'duelist',name:'Duelist\'s Art',kind:'atk',text:'In Star Duel fights Reina deals 4% more damage for every deployed pet with this talent.'},
 {id:'sturdy',name:'Oak Heart',kind:'def',text:'Pet vigour +6%, shared with Reina: Reina gains HP +3%.',stat:['healthPercent',3]},
 {id:'steady',name:'Steadfast',kind:'def',text:'When a power strike hits Reina there is a 10% chance she shrugs it off with no damage. Once every 15 seconds.'},
 {id:'bulwark',name:'Bulwark',kind:'def',text:'Reina takes 8% less damage from power strikes.'},
 {id:'anchor',name:'Unshaken',kind:'def',text:'Enemies have 2.5% less Crit Rate against Reina.',stat:['critResistance',2.5]},
 {id:'thorn',name:'Thorn Echo',kind:'def',text:'When Reina takes damage there is a 20% chance to strike back for 10% of her ATK.'}
];
const talentOdds={keen:.07,bash:.15,toxin:.1,steady:.1,thorn:.2},talentNums={keenMul:1.5,aim:1.1,power:1.07,ambush:1.07,poisonShare:.01,poisonSecs:5,stun:1,steadyEvery:15,bulwark:.08,thorn:.1,duelist:.04};
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
function guardTalents(s){const team=petTeam(s),all=talentState(s).slots.flatMap((v,slot)=>team[slot]?v.cells:[]),n=id=>all.filter(x=>x===id).length;return {mend:n('mend'),stand:n('stand'),steady:n('steady'),bulwark:n('bulwark'),thorn:n('thorn'),duelist:n('duelist')}}
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
 if(have.has('power'))dmg*=talentNums.power;
 if(have.has('ambush'))dmg*=talentNums.ambush;
 if(have.has('aim')&&ctx.boss)dmg*=talentNums.aim;
 if(have.has('keen')&&rng()<talentOdds.keen){dmg*=talentNums.keenMul;ctx.crit=true}
 if(have.has('waver'))dmg*=.9+rng()*.3;
 if(have.has('bash')&&!ctx.riposte&&rng()<talentOdds.bash)ctx.stun=true;
 if(have.has('toxin')&&!ctx.riposte&&rng()<talentOdds.toxin)ctx.poison=true;
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
 if(!validSummon(s.summon))return false;
 if(!validContest(s.contest))return false;
 if(!validCloud(s.cloud))return false;
 if(!validSocial(s.social))return false;
 if(!validGuild(s.guild))return false; if(!validDuel(s.duel))return false;
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
 for(const [key,n] of Object.entries(guildBonus(save)))b[key]=(b[key]||0)+n;
 const cards=globalThis.MoonwaterFish.totals(save.fishCards);
 const lv=globalThis.WonderProgress.level(save.xp),d=petTeamAttack(save),w=[40,120,180,240][Number(save.wings[1])];const attack=Math.round((85+lv*7+d+(b.attack||0))*(1+(b.attackPercent||0)/100))+(cards.attack||0)+bowBonus,defense=Math.round((52+lv*4+w+(b.defense||0))*(1+(b.defensePercent||0)/100))+(cards.defense||0),health=Math.round((900+lv*75+(b.health||0))*(1+(b.healthPercent||0)/100))+(cards.health||0),crit=round(Math.min(75,8+(b.crit||0))),speed=100+(b.speed||0),penetration=round(b.penetration||0),damageBonus=round(b.damageBonus||0),damageReduction=round(Math.min(50,b.damageReduction||0)),block=round(Math.min(40,b.block||0)),expBonus=round(b.expBonus||0);const accuracy=round(100+(b.accuracy||0)),dodge=round(Math.min(30,b.dodge||0)),critDamage=round(165+(b.critDamage||0)),critResistance=round(Math.min(30,b.critResistance||0)),shieldHealth=Math.round(b.shieldHealth||0)+(cards.shieldHealth||0),elementalAttack=Math.round(b.elementalAttack||0)+(cards.elementalAttack||0),elementalDefense=Math.round(b.elementalDefense||0)+(cards.elementalDefense||0),armor=round(100-10000/(100+defense*.35)),attackInterval=round(100/speed),healing=Math.round(health*.25);
const advanced={accuracy,dodge,critDamage,critResistance,shieldHealth,elementalAttack,elementalDefense,armor,attackInterval,healing};
return {attack,defense,health,crit,speed,penetration,damageBonus,damageReduction,block,expBonus,...advanced,level:lv,power:Math.floor(attack*5+defense*4+health/3+crit*10+speed+penetration*3+damageBonus*20+damageReduction*25+block*15+attributePower({...advanced,accuracy:accuracy-100,critDamage:critDamage-165}))}}
function cost(entry,action){const t=catalog[entry.template];if(action==='enhance')return entry.enhance>=20?null:{gold:150+entry.enhance*100,stone:2+Math.floor(entry.enhance/4)};if(action==='gem')return entry.gems>=3?null:{gold:150*(entry.gems+1),gem:1};if(action==='craft')return t.tier>=maxTier?null:{gold:500*(t.grade+1),essence:3*(t.grade+1),stone:5*(t.grade+1),synthesis:t.tier};return null}
function equipped(eq,uid){return Object.values(eq.equipped).includes(uid)}
// Crafting keeps three families apart: a piece is only made from spare pieces of its own family and tier.
const gearGroups=['Equipment','Necklace & Amulet','Rings'];
function gearGroup(template){const slot=catalog[template]?.slot||'';return ['necklace','amulet'].includes(slot)?gearGroups[1]:slot.startsWith('spirit')?gearGroups[2]:gearGroups[0]}
function craftRecipe(rank){const r=gearRanks[rank];return r?.need?{need:r.need,flex:!!r.flex,mats:r.mats||{}}:null}
// Spare pieces that can go into a craft of quality `rank` at `tier` in the family `group`: any slot of that family.
function craftInputs(save,group,tier,rank){const eq=state(save);return eq.items.filter(e=>!e.starter&&!e.stored&&!equipped(eq,e.uid)&&catalog[e.template].tier===tier&&gearGroup(e.template)===group&&gearRank(e)===rank-1)}
// "The more gear added, the higher the success rate": a flexible recipe works with fewer pieces at a lower chance.
function craftChance(rank,count){const r=craftRecipe(rank);if(!r||count<1)return 0;return r.flex?Math.min(1,count/r.need):count>=r.need?1:0}
// Makes one piece for `slotId` at `tier` and quality `rank` out of the pieces `uids`. The pieces and materials are
// spent even when the craft fails. The new piece keeps the highest enhancement and gems among the pieces put in.
function craftGear(save,slotId,tier,rank,uids,rng=Math.random){
 const recipe=craftRecipe(rank),template=slotId+'-t'+tier;
 if(!recipe||!Object.hasOwn(catalog,template))return {ok:false,error:'Unknown recipe.'};
 const eq=state(save),pool=new Set(craftInputs(save,gearGroup(template),tier,rank).map(e=>e.uid)),ids=Array.isArray(uids)?[...new Set(uids)]:[];
 if(!ids.length||ids.length!==uids.length||ids.length>recipe.need||ids.some(id=>!pool.has(id)))return {ok:false,error:'Put in spare '+gearRanks[rank-1].name+' pieces of this tier and kind.'};
 if(!recipe.flex&&ids.length<recipe.need)return {ok:false,error:'At least '+recipe.need+' pieces.'};
 if(materialDefs.some(m=>(recipe.mats[m.id]||0)>eq.materials[m.id]))return {ok:false,error:'Not enough materials.'};
 const used=eq.items.filter(e=>ids.includes(e.uid)),chance=craftChance(rank,ids.length),success=chance>=1||rng()<chance;
 eq.items=eq.items.filter(e=>!ids.includes(e.uid));for(const m of materialDefs)eq.materials[m.id]-=recipe.mats[m.id]||0;save.equipment=eq;
 if(!success)return {ok:true,success:false,chance};
 const entry={uid:eq.nextId++,template,enhance:Math.max(...used.map(e=>e.enhance)),stars:gearRanks[rank].stars,gems:Math.max(...used.map(e=>e.gems)),rank};
 eq.items.push(entry);return {ok:true,success:true,chance,entry};
}
function perform(save,uid,action,donors=[]){const eq=state(save);const i=eq.items.find(e=>e.uid===uid);if(!i)return {ok:false,error:'Item not found.'};if(i.stored)return {ok:false,error:'Withdraw this item first.'};if(action==='star')return {ok:false,error:'Stars are made in Gear Crafting.'};if(action==='equip'||action==='craft'){
 if(action==='craft'&&i.starter)return {ok:false,error:'Use a spare item for tier synthesis.'};
 const target=catalog[i.template].tier+(action==='craft'?1:0);
 if(target<=maxTier&&target>unlockedTier(save))return {ok:false,error:'T'+target+' unlocks at hero level '+requiredLevel(target)+'.'};
}if(action==='equip'){const t=catalog[i.template];if(eq.equipped[t.slot]===uid)return {ok:false,error:'Already equipped.'};save.equipment=eq;eq.equipped[t.slot]=uid;return {ok:true,entry:i}}const price=cost(i,action);if(!price)return {ok:false,error:'This upgrade is already complete.'};if((price.gold||0)>save.gold||materialDefs.some(m=>(price[m.id]||0)>eq.materials[m.id]))return {ok:false,error:'Not enough gold or materials.'};save.equipment=eq;save.gold-=price.gold||0;for(const m of materialDefs)eq.materials[m.id]-=price[m.id]||0;if(action==='enhance')i.enhance++;else if(action==='gem')i.gems++;else if(action==='craft'){const t=catalog[i.template];i.template=t.slot+'-t'+(t.tier+1)}return {ok:true,entry:i}}
function salvage(save,uid){const eq=state(save),i=eq.items.find(e=>e.uid===uid);if(i?.starter)return {ok:false,error:'Keep your basic equipment set.'};if(i?.stored)return {ok:false,error:'Withdraw this item first.'};if(!i||equipped(eq,uid))return {ok:false,error:'Equipped items cannot be salvaged.'};const t=catalog[i.template];save.equipment=eq;eq.items=eq.items.filter(e=>e.uid!==uid);eq.materials.stone+=3+t.grade*3+i.enhance;eq.materials.shard+=i.stars;eq.materials.gem+=i.gems;save.gold+=50*(t.grade+1);return {ok:true}}
function addDrop(save,tier=1,slotId=null,rank=0){const eq=state(save);if(eq.items.length>=80){save.equipment=eq;eq.materials.stone+=5;return {converted:true}}const allowed=tiers.filter(t=>t.tier<=tier),t=allowed[allowed.length-1],slot=slots.find(s=>s.id===slotId)||slots[Math.floor(Math.random()*slots.length)],entry={uid:eq.nextId++,template:slot.id+'-t'+t.tier,enhance:0,stars:gearRanks[rank].stars,gems:0};if(rank)entry.rank=rank;save.equipment=eq;eq.items.push(entry);return entry}
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
// A guardian drops three pieces of one tier: Orange, Purple and Blue (`bossDropRanks`). With Auto devour on, the Blue
// and Purple ones go straight to the Maw. `entry` is the best piece that stayed in the bag.
function bossLoot(save,id,random=Math.random){
 const table=bossLootTables[id];if(!table)return null;
 const eq=state(save);save.equipment=eq;const materials=Object.fromEntries(materialDefs.map(m=>[m.id,table[m.id]||0]));
 for(const m of materialDefs)eq.materials[m.id]+=materials[m.id];
 const tier=rollBossTier(save,random),entries=[];let converted=false;
 for(const rank of bossDropRanks){
  const slot=table.slots[Math.min(table.slots.length-1,Math.max(0,Math.floor(random()*table.slots.length)))],drop=addDrop(save,tier,slot,rank);
  if(drop.converted){converted=true;materials.stone+=5}else entries.push(drop);
 }
 if(converted){eq.materials.stone+=15;materials.stone+=15}
 const rare=[];
 for(const r of bossRare){
  if(!(random()<r.chance))continue;
  if(r.kind==='item'){bagAdd(save,r.id,1);rare.push(r)}
  else{const drop=addDrop(save,tier,table.slots[Math.floor(Math.random()*table.slots.length)],r.rank);if(!drop.converted){entries.unshift(drop);rare.push(r)}}
 }
 let devoured=0;
 if(save.autoDevour){const food=entries.filter(e=>gearRank(e)<2);if(food.length){devoured=devourGear(save,food.map(e=>e.uid)).gained||0;for(const e of food)entries.splice(entries.indexOf(e),1)}}
 return {...materials,entry:entries[0]||null,entries,converted,devoured,rare};
}
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
function devourWorth(entry){const t=catalog[entry.template];return 10*t.tier+15*t.grade+8*gearRank(entry)+2*entry.enhance}
function devourState(s){let into=Number.isSafeInteger(s.devour)?s.devour:0,level=0;const total=into;while(level<devourMax&&into>=devourNeed(level)){into-=devourNeed(level);level++}return {level,into,need:level>=devourMax?0:devourNeed(level),total}}
function devourBonus(s){const level=devourState(s).level;return {attack:level*devourStep.attack,health:level*devourStep.health,defense:level*devourStep.defense}}
// Relic and finer pieces are never food.
function devourable(s){const eq=state(s);return eq.items.filter(e=>!e.stored&&!e.starter&&!equipped(eq,e.uid)&&gearRank(e)<gearNoDevour)}
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
 return counts(s.bag,k=>Object.hasOwn(bagItemById,k))&&counts(s.vault,vaultKeyOk)&&(s.devour===undefined||Number.isSafeInteger(s.devour)&&s.devour>=0&&s.devour<=1e12)&&(s.autoDevour===undefined||typeof s.autoDevour==='boolean');
}
// ---- Summon --------------------------------------------------------------------------------------------------------
// Two wells. Basic: a Wish Ticket from the bag or wishes. Advanced: a Star Orb or prisms (save.scales); it has a
// Summon Level and two guarantees. Rare and finer pets also leave Spirit Marks, the money of the Mark Shop. The
// Festival pays Star Orbs and tokens for Basic summons made today; tokens open the month's milestones.
// Optional save field `summon`; every number here is a placeholder.
const summonWells={
 basic:{name:'Basic Summon',unit:50,odds:[['Common',.45],['Rare',.35],['Epic',.16],['Super Rare',.04]]},
 advanced:{name:'Advanced Summon',unit:30,odds:[['Rare',.5],['Epic',.38],['Super Rare',.12]]}
};
const summonPity={epic:10,top:40},summonLevelStep=10,summonLevelMax=20,summonDupGold=100;
const markKinds=[['Rare','r','Rare Mark'],['Epic','e','Epic Mark'],['Super Rare','s','Royal Mark']],markKey=Object.fromEntries(markKinds.map(([rarity,key])=>[rarity,key]));
const markPrice=20,markLimit=3,markNeed={Rare:1,Epic:5,'Super Rare':10};
const galaQuests=[10,20,30,40,50,60,70,80].map((need,i)=>({need,orbs:[1,1,2,2,2,2,2,3][i],tokens:i<6?5:10}));
const galaMilestones=[{at:20,item:'petegg',n:1},{at:45,item:'sealbag',n:2},{at:80,pet:'Epic'},{at:120,item:'chest3',n:1},{at:180,pet:'Super Rare'}];
const utcDay=now=>new Date(now).toISOString().slice(0,10);
function utcWeek(now){const d=new Date(now);d.setUTCDate(d.getUTCDate()-(d.getUTCDay()+6)%7);return utcDay(d)}   // Monday
function galaEnds(now){const d=new Date(now);return Date.UTC(d.getUTCFullYear(),d.getUTCMonth()+1,1)}
// The record as of `now`: the shop restocks on Monday, quests reset at 00:00 UTC, the Festival season is a month.
function summonState(s,now=Date.now()){
 const v=s.summon||{},day=utcDay(now),week=utcWeek(now),season=day.slice(0,7),g=v.gala||{},fresh=g.season===season,today=fresh&&g.day===day;
 return {adv:v.adv||0,pityE:v.pityE||0,pityS:v.pityS||0,orbs:v.orbs||0,marks:{r:0,e:0,s:0,...v.marks},
  shop:v.shop?.week===week?{week,bought:{...v.shop.bought}}:{week,bought:{}},
  gala:{season,day,basic:today?g.basic:0,claimed:today?[...g.claimed]:[],tokens:fresh?g.tokens:0,got:fresh?[...g.got]:[]}};
}
function summonLevel(s){const adv=s.summon?.adv||0,level=Math.min(summonLevelMax,1+Math.floor(adv/summonLevelStep));return {level,into:level>=summonLevelMax?summonLevelStep:adv%summonLevelStep,need:summonLevelStep,max:level>=summonLevelMax}}
// What a draw would be paid with: tickets or orbs first, then the currency. null when she cannot afford it.
function summonPay(s,kind,count){
 const well=summonWells[kind];if(!well||![1,10].includes(count))return null;
 if(kind==='basic')return bagCount(s,'wish')>=count?{item:'wish',n:count}:s.tickets>=count*well.unit?{tickets:count*well.unit}:null;
 return (s.summon?.orbs||0)>=count?{orbs:count}:s.scales>=count*well.unit?{scales:count*well.unit}:null;
}
function summonPet(s,rarity,rng){
 const pool=familiars.filter(p=>p.rarity===rarity),p=pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))],spare=s.owned.includes(p.id);
 if(spare){addPetSpare(s,p.id);s.gold+=summonDupGold}else s.owned.push(p.id);
 return {id:p.id,rarity,spare};
}
function summonDraw(s,kind,count=1,rng=Math.random,now=Date.now()){
 const pay=summonPay(s,kind,count);if(!pay)return {ok:false,error:summonWells[kind]?'Not enough to summon.':'Unknown summon.'};
 const v=summonState(s,now),well=summonWells[kind],results=[];
 if(pay.item){const bag=bagOf(s);if(bag[pay.item]>pay.n)bag[pay.item]-=pay.n;else delete bag[pay.item];s.bag=bag}
 if(pay.tickets)s.tickets-=pay.tickets;if(pay.scales)s.scales-=pay.scales;if(pay.orbs)v.orbs-=pay.orbs;
 for(let i=0;i<count;i++){
  let roll=rng(),rarity=well.odds[well.odds.length-1][0];
  for(const [name,chance] of well.odds){if(roll<chance){rarity=name;break}roll-=chance}
  if(kind==='advanced'){
   v.adv++;v.pityE++;v.pityS++;
   if(v.pityS>=summonPity.top)rarity='Super Rare';else if(v.pityE>=summonPity.epic&&rarity==='Rare')rarity='Epic';
   if(rarity==='Super Rare')v.pityS=0;if(rarity!=='Rare')v.pityE=0;
  }else v.gala.basic++;
  if(markKey[rarity])v.marks[markKey[rarity]]++;
  results.push(summonPet(s,rarity,rng));
 }
 s.summon=v;return {ok:true,results,pay};
}
// Mark Shop: a chosen pet for Spirit Marks of its rarity, a few of each a week, opened by the Summon Level.
function markOffer(s,id,now=Date.now()){
 const p=familiarById[id],key=markKey[p?.rarity];if(!key)return null;
 const v=summonState(s,now),left=markLimit-(v.shop.bought[id]||0),level=summonLevel(s).level,need=markNeed[p.rarity];
 return {key,price:markPrice,left,need,have:v.marks[key],why:level<need?'Summon Lv. '+need:left<1?'Sold out this week':v.marks[key]<markPrice?'Not enough marks':''};
}
function buyMarkPet(s,id,now=Date.now()){
 const offer=markOffer(s,id,now);if(!offer||offer.why)return {ok:false,error:offer?.why||'Not sold here.'};
 const v=summonState(s,now);v.marks[offer.key]-=offer.price;v.shop.bought[id]=(v.shop.bought[id]||0)+1;
 const spare=s.owned.includes(id);if(spare)addPetSpare(s,id);else s.owned.push(id);
 s.summon=v;return {ok:true,spare};
}
function galaClaim(s,n,now=Date.now()){
 const q=galaQuests[n],v=summonState(s,now);if(!q||v.gala.claimed.includes(n)||v.gala.basic<q.need)return false;
 v.gala.claimed.push(n);v.orbs+=q.orbs;v.gala.tokens+=q.tokens;s.summon=v;return true;
}
function galaReward(s,n,rng=Math.random,now=Date.now()){
 const m=galaMilestones[n],v=summonState(s,now);if(!m||v.gala.got.includes(n)||v.gala.tokens<m.at)return null;
 v.gala.got.push(n);s.summon=v;
 if(m.item){bagAdd(s,m.item,m.n);return {kind:'item',id:m.item,n:m.n}}
 return {kind:'pet',...summonPet(s,m.pet,rng)};
}
function validSummon(v){
 if(v===undefined)return true;
 const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9,list=(a,max)=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(n=>Number.isInteger(n)&&n>=0&&n<max),date=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x);
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&[v.adv,v.pityE,v.pityS,v.orbs].every(int)&&v.pityE<=summonPity.epic&&v.pityS<=summonPity.top
  &&!!v.marks&&Object.keys(v.marks).length===3&&markKinds.every(([,key])=>int(v.marks[key]))
  &&!!v.shop&&date(v.shop.week)&&!!v.shop.bought&&typeof v.shop.bought==='object'&&!Array.isArray(v.shop.bought)&&Object.entries(v.shop.bought).every(([id,n])=>Object.hasOwn(familiarById,id)&&Number.isInteger(n)&&n>0&&n<=markLimit)
  &&!!v.gala&&date(v.gala.day)&&v.gala.season===v.gala.day.slice(0,7)&&int(v.gala.basic)&&int(v.gala.tokens)&&list(v.gala.claimed,galaQuests.length)&&list(v.gala.got,galaMilestones.length);
}
// ---- Sky Contest: Totem War ----------------------------------------------------------------------------------------
// Three factions of five fight over three totems for three minutes. Reina leads one faction; everyone else is an AI
// adventurer scaled to her. Every 30 seconds each fighter's kills, assists and totem hits turn into points, raised
// by 20% for every totem the faction holds at that moment. Points open quests during the fight and decide the final
// ranking. Rewards are paid for two fights a UTC day (later fights are practice). Optional save field `contest`
// {medals, day, runs, best, wins}. Every number is a placeholder.
const warFactions=[{id:'ember',name:'Ember',color:'#ff7a4a'},{id:'tide',name:'Tide',color:'#5aa8ff'},{id:'gale',name:'Gale',color:'#63d98a'}];
const warTotems=[{x:18,y:26},{x:82,y:26},{x:50,y:70}],warHomes=[{x:8,y:10},{x:92,y:10},{x:50,y:92}];   // percent of the field picture
const warRules={length:180,tally:30,step:.5,team:5,kill:10,assist:5,hit:2,flag:.2,totemHp:600,respawn:6,speed:11,reach:9,daily:2,hero:1.25};
const warNames=['Nyra','Kael','Pip','Vesper','Briar','Orin','Lumi','Thane','Sable','Wren','Juno','Corin','Maeve','Dax'];
const warQuests=[{at:60,medals:5,item:'exp1',n:1},{at:150,medals:10,item:'gold1',n:1},{at:300,medals:20,item:'wish',n:1}];
const warRanks=[{to:1,medals:35,items:{chest2:1,wish:2}},{to:3,medals:30,items:{chest1:2,wish:1}},{to:6,medals:25,items:{chest1:1,wish:1}},{to:10,medals:20,items:{chest1:1}},{to:15,medals:15,items:{exp1:1}}];
const contestShop=[{id:'wish',price:15},{id:'exp2',price:20},{id:'sealbag',price:40},{id:'gembox',price:50},{id:'chest2',price:60},{id:'petegg',price:80},{id:'gearbox',price:90},{id:'chest3',price:200}];
function contestState(s,now=Date.now()){const v=s.contest||{},day=utcDay(now);return {medals:v.medals||0,day,runs:v.day===day?v.runs:0,best:v.best||0,wins:v.wins||0}}
function warNew(faction=0,rng=Math.random){
 const g={time:0,nextTally:warRules.tally,over:false,faction,scores:[0,0,0],log:[],claimed:[],lastTally:null,
  totems:warTotems.map((t,i)=>({...t,owner:i,hp:warRules.totemHp,dmg:[0,0,0]})),fighters:[]};
 let name=0;
 for(let f=0;f<3;f++)for(let n=0;n<warRules.team;n++){
  const hero=f===faction&&n===0,power=hero?warRules.hero:.8+rng()*.35,home=warHomes[f];
  g.fighters.push({id:g.fighters.length,faction:f,hero,name:hero?'Reina':warNames[name++],face:hero?0:1+(name-1)%6,power,maxhp:Math.round(900*power),hp:Math.round(900*power),atk:Math.round(60*power),
   x:home.x+(n-2)*3,y:home.y,target:f,order:null,dead:0,kills:0,assists:0,hits:0,pending:{kills:0,assists:0,hits:0},points:0,hurtBy:[]});
 }
 return g;
}
const warHeld=(g,f)=>g.totems.filter(t=>t.owner===f).length;
const warHero=g=>g.fighters.find(f=>f.hero);
function warOrder(g,totem){if(Number.isInteger(totem)&&totem>=0&&totem<3&&!g.over){warHero(g).order=totem;return true}return false}
// Where an AI fighter goes: mostly to an enemy totem (the weakest one), sometimes home to defend.
function warThink(g,f,rng){
 const foes=g.totems.map((t,i)=>i).filter(i=>g.totems[i].owner!==f.faction),mine=g.totems.map((t,i)=>i).filter(i=>g.totems[i].owner===f.faction);
 if(!foes.length)return mine[Math.floor(rng()*mine.length)];
 if(mine.length&&rng()<.3)return mine[Math.floor(rng()*mine.length)];
 return rng()<.6?foes.slice().sort((a,b)=>g.totems[a].hp-g.totems[b].hp)[0]:foes[Math.floor(rng()*foes.length)];
}
function warTally(g){
 const rows=[];
 for(const f of g.fighters){
  const p=f.pending,base=p.kills*warRules.kill+p.assists*warRules.assist+p.hits*warRules.hit,held=warHeld(g,f.faction),gain=Math.round(base*(1+warRules.flag*held));
  f.points+=gain;g.scores[f.faction]+=gain;if(f.hero)g.lastTally={...p,base,held,gain};
  f.pending={kills:0,assists:0,hits:0};rows.push(gain);
 }
 return rows;
}
// One step of the fight (warRules.step seconds).
function warStep(g,rng=Math.random){
 if(g.over)return g;
 const dt=warRules.step;g.time=Math.round((g.time+dt)*10)/10;
 for(const f of g.fighters){
  if(f.dead>0){f.dead-=dt;if(f.dead<=0){f.dead=0;f.hp=f.maxhp;f.hurtBy=[];const home=warHomes[f.faction];f.x=home.x;f.y=home.y;f.target=f.hero&&f.order!==null?f.order:warThink(g,f,rng)}continue}
  if(f.hero&&f.order!==null)f.target=f.order;else if(rng()<.04)f.target=warThink(g,f,rng);
  const t=g.totems[f.target],dx=t.x-f.x,dy=t.y-f.y,far=Math.hypot(dx,dy),spot=warRules.reach*.55;
  if(far>spot){const move=Math.min(far-spot,warRules.speed*dt);f.x+=dx/far*move;f.y+=dy/far*move}
 }
 for(const f of g.fighters){
  if(f.dead>0)continue;
  const t=g.totems[f.target];if(Math.hypot(t.x-f.x,t.y-f.y)>warRules.reach)continue;
  const foes=g.fighters.filter(o=>o.faction!==f.faction&&!o.dead&&Math.hypot(o.x-f.x,o.y-f.y)<=warRules.reach*1.6);
  if(foes.length){
   const o=foes.sort((a,b)=>a.hp-b.hp)[0],hit=Math.round(f.atk*dt*(.8+rng()*.4));o.hp-=hit;if(!o.hurtBy.includes(f.id))o.hurtBy.push(f.id);
   if(o.hp<=0){o.hp=0;o.dead=warRules.respawn;f.kills++;f.pending.kills++;
    for(const id of o.hurtBy)if(id!==f.id){const a=g.fighters[id];a.assists++;a.pending.assists++}
    g.log.unshift(f.name+' defeated '+o.name);g.log.length=Math.min(g.log.length,6)}
  }else if(t.owner!==f.faction){
   const hit=Math.round(f.atk*dt);t.hp-=hit;t.dmg[f.faction]+=hit;f.hits++;f.pending.hits++;
   if(t.hp<=0){const taker=t.dmg.indexOf(Math.max(...t.dmg));g.log.unshift(warFactions[taker].name+' took the '+warFactions[g.totems.indexOf(t)].name+' totem');g.log.length=Math.min(g.log.length,6);t.owner=taker;t.hp=warRules.totemHp;t.dmg=[0,0,0]}
  }else if(t.hp<warRules.totemHp)t.hp=Math.min(warRules.totemHp,t.hp+Math.round(f.atk*dt*.25));
 }
 if(g.time>=g.nextTally){warTally(g);g.nextTally+=warRules.tally}
 if(g.time>=warRules.length)g.over=true;
 return g;
}
function warStanding(g){const list=g.fighters.slice().sort((a,b)=>b.points-a.points||a.id-b.id);return {list,rank:list.findIndex(f=>f.hero)+1}}
const warRankPrize=rank=>warRanks.find(r=>rank<=r.to)||warRanks[warRanks.length-1];
// Quest rewards go to the bag as soon as her points reach them (only in a rewarded fight).
function warQuestsDue(s,g,paid){
 const hero=warHero(g),out=[];
 warQuests.forEach((q,n)=>{if(hero.points>=q.at&&!g.claimed.includes(n)){g.claimed.push(n);if(paid){const v=contestState(s);v.medals+=q.medals;s.contest=v;bagAdd(s,q.item,q.n)}out.push(q)}});
 return out;
}
function warStart(s,now=Date.now()){const v=contestState(s,now),paid=v.runs<warRules.daily;if(paid){v.runs++;s.contest=v}return paid}
function warSettle(s,g,paid,now=Date.now()){
 if(!g.over||g.settled)return null;g.settled=true;
 const {rank}=warStanding(g),hero=warHero(g),prize=warRankPrize(rank),v=contestState(s,now),won=g.scores[g.faction]===Math.max(...g.scores);
 v.best=Math.max(v.best,hero.points);
 if(paid){v.medals+=prize.medals;if(rank===1)v.wins++;for(const [id,n] of Object.entries(prize.items))bagAdd(s,id,n)}
 s.contest=v;return {rank,points:hero.points,prize:paid?prize:null,won};
}
function buyContest(s,id){
 const ware=contestShop.find(w=>w.id===id),v=contestState(s);if(!ware||v.medals<ware.price)return false;
 v.medals-=ware.price;s.contest=v;bagAdd(s,id,1);return true;
}
function validContest(v){const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;return v===undefined||!!v&&typeof v==='object'&&!Array.isArray(v)&&[v.medals,v.runs,v.best,v.wins].every(int)&&v.runs<=warRules.daily&&typeof v.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.day)}
// ---- Cloud War: rounds, Carnage Points, Point Rewards, Cloud Shop --------------------------------------------------
// A round lasts one UTC hour; when it ends the defenders of every territory return, and each territory keeps the
// faction that took it (`held`). Defeating a defender earns Carnage Points (up to `carnageCap` a UTC day) and as many
// Cloud Tokens. Optional save field `cloud {round, held, day, carnage, claimed, tokens}`; numbers are placeholders.
const cloudRules={roundMs:36e5,carnageCap:1200,territories:24,factions:4};
const cloudPointRewards=[{at:150,items:{chest1:1}},{at:300,items:{wish:1}},{at:600,items:{chest2:1}},{at:900,items:{gembox:1}},{at:1200,items:{chest3:1}}];
const cloudShop=[{id:'stonebag',price:60},{id:'wish',price:80},{id:'exp2',price:120},{id:'shardbag',price:150},{id:'gearbox',price:260},{id:'chest2',price:300},{id:'petegg',price:400},{id:'chest3',price:900}];
// Ownership reward: once a round for every city her faction holds, by the city's rank; shown as a chest on the map.
const cloudOwnReward={Capital:{chest2:1,wish:1},Fortress:{chest1:1,shardbag:1},Island:{chest1:1}};
const cloudRound=now=>new Date(now).toISOString().slice(0,13);
const cloudRoundEnds=now=>(Math.floor(now/cloudRules.roundMs)+1)*cloudRules.roundMs;
function cloudState(s,now=Date.now()){
 const v=s.cloud||{},day=utcDay(now),today=v.day===day;
 const round=v.round||cloudRound(now);
 return {round,held:{...v.held},day,carnage:today?v.carnage:0,claimed:today?[...v.claimed]:[],tokens:v.tokens||0,got:v.round===cloudRound(now)?[...(v.got||[])]:[]};
}
// True when a new round began since the save was last touched; `owners` are the territories taken in the old round.
function cloudNewRound(s,owners={},now=Date.now()){
 const v=cloudState(s,now),round=cloudRound(now);if(s.cloud?.round===round)return false;
 for(const [i,f] of Object.entries(owners))if(Number.isInteger(f)&&f>=0&&f<cloudRules.factions)v.held[i]=f;
 v.round=round;v.got=[];s.cloud=v;return true;
}
function cloudGain(s,points,now=Date.now()){
 const v=cloudState(s,now),gain=Math.max(0,Math.min(Math.round(points),cloudRules.carnageCap-v.carnage));
 v.carnage+=gain;v.tokens+=gain;s.cloud=v;return gain;
}
function cloudClaim(s,n,now=Date.now()){
 const r=cloudPointRewards[n],v=cloudState(s,now);if(!r||v.claimed.includes(n)||v.carnage<r.at)return null;
 v.claimed.push(n);s.cloud=v;for(const [id,k] of Object.entries(r.items))bagAdd(s,id,k);return r.items;
}
// The caller knows the city is held by her faction (the owner comes from this round's fights or `held`).
function cloudOwnTake(s,index,rank,now=Date.now()){
 const items=cloudOwnReward[rank],v=cloudState(s,now);
 if(!items||!Number.isInteger(index)||index<0||index>=cloudRules.territories||v.got.includes(index))return null;
 v.got.push(index);v.round=cloudRound(now);s.cloud=v;for(const [id,n] of Object.entries(items))bagAdd(s,id,n);return items;
}
function buyCloud(s,id){const w=cloudShop.find(w=>w.id===id),v=cloudState(s);if(!w||v.tokens<w.price)return false;v.tokens-=w.price;s.cloud=v;bagAdd(s,id,1);return true}
function validCloud(v){
 if(v===undefined)return true;
 const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.round==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(v.round)&&typeof v.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.day)
  &&int(v.carnage)&&v.carnage<=cloudRules.carnageCap&&int(v.tokens)&&Array.isArray(v.claimed)&&new Set(v.claimed).size===v.claimed.length&&v.claimed.every(n=>Number.isInteger(n)&&n>=0&&n<cloudPointRewards.length)
  &&(v.got===undefined||Array.isArray(v.got)&&new Set(v.got).size===v.got.length&&v.got.every(n=>Number.isInteger(n)&&n>=0&&n<cloudRules.territories))&&!!v.held&&typeof v.held==='object'&&!Array.isArray(v.held)&&Object.entries(v.held).every(([i,f])=>/^\d+$/.test(i)&&Number(i)<cloudRules.territories&&Number.isInteger(f)&&f>=0&&f<cloudRules.factions);
}
// ---- Social: chat, friends, flowers, mail and thank-you notes ------------------------------------------------------
// There are no other players: everyone here is an AI adventurer and is labelled so. Optional save field `social`
// {day, sent[], got, hearts{id:n}, friends[], requests[], blocked[], recent[], mail[], nextId, chat[]}. Placeholders.
const socialFolk=[
 {id:'nyra',name:'Nyra',face:'nyra',lv:4},{id:'kael',name:'Kael',face:'kael',lv:9},{id:'pip',name:'Pip',face:'pip',lv:-3},
 {id:'vesper',name:'Vesper',face:'vesper',lv:6},{id:'briar',name:'Briar',face:'briar',lv:1},{id:'orin',name:'Orin',face:'orin',lv:12},
 {id:'wren',name:'Wren',face:'guest',lv:-1},{id:'juno',name:'Juno',face:'guest',lv:3},{id:'lumi',name:'Lumi',face:'guest',lv:7},{id:'thane',name:'Thane',face:'guest',lv:-5}
];
const socialRules={friendsMax:20,giftsPerDay:10,flowerHeart:10,heartPoints:100,hearts:5,receiveGold:20,mailMax:30,chatKeep:30,chatEvery:25e3,liveDaily:30,liveMax:160};
const socialById=Object.fromEntries(socialFolk.map(f=>[f.id,f]));
// Channels of the chat sheet (reference: System, Squad, Globe, X-server, Guild, Faction). Squad = her first three
// friends; 'Squad' is the team line, 'p:<id>' a talk with one member. Old saves used World / Cross-server.
const chatChannels=['System','Squad','Globe','X-server','Guild','Faction'],chatOld={World:'Globe','Cross-server':'X-server'};
const factionLines=['Galewing, gather at Larkspire for the next round!','Two Holy City defenders left, push now!','Embercrest is weak at Ashvault, let us take it.',
 'Who holds Kitewatch? The chest is up.','Ride with me to the Golden Boss.','Remember: 80 points open a city.','Our roads are almost lit, one more island!'];
const guildLines=['Guild boss in ten minutes, do not forget.','Thanks for the donation!','Who needs a Star Shard Pouch?','Welcome to our new member!'];
const quizBook=[{q:'Which colour is the Holy City of Galewing?',a:'gold'},{q:'How many cities does one faction hold?',a:'six'},{q:'What does a Pet Egg hatch into?',a:'a pet'},
 {q:'Which quality comes after Orange?',a:'red'},{q:'How many pieces make a 2-Star Red?',a:'five'},{q:'What eats Blue and Purple gear?',a:'the maw'}];
const chatLines=['Anyone up for the Moonfall guardian?','Just hatched a Pet Egg, it was an Epic!','Cloud War round starts soon, Galewing gather at Larkspire!',
 'Tip: Blue and Purple gear is great food for the Glimmer Maw.','Who has a spare Star Shard Pouch to trade?','The Jungle Trek dragon finally fell, three chests!',
 'Good luck on your summons today!','Five Orange pieces make a 2-Star Red, do not devour them.','Harvest Pairs under a minute, new record!',
 'Totem War tip: hold two totems and your points grow.','Thanks for the flowers, friend!','Mind the Golden Boss, it hits hard.',
 'Is the Summon Festival worth it? Star Orbs are nice.','Fishing at dawn gives the rarest catches, I think.','Let us clear the EXP trial together.'];
const chatReplies=['Hello! Nice to meet you.','Good luck out there!','Haha, same here.','See you in the dungeon!','Sounds good to me.','Thank you, friend!','On my way!'];
const thankLines=['With your help I cleared the EXP trial and got great rewards. Thank you!','Your arrows saved me at the Moonfall gate. Thanks!',
 'We took a city in Cloud War thanks to you!','Thank you for the flowers, here is a little something back.'];
const hashOf=str=>{let h=7;for(const c of String(str))h=(h*31+c.charCodeAt(0))%2147483647;return h};
function socialState(s,now=Date.now()){
 const v=s.social||{},day=utcDay(now),today=v.day===day;
 return {day,sent:today?[...(v.sent||[])]:[],got:today?v.got||0:0,hearts:{...v.hearts},friends:v.friends?[...v.friends]:['nyra','kael','pip','vesper'],
  requests:v.requests?[...v.requests]:['briar','wren'],blocked:[...(v.blocked||[])],recent:[...(v.recent||[])],mail:(v.mail||[]).map(m=>({...m,items:{...m.items}})),
  nextId:v.nextId||1,chat:(v.chat||[]).map(c=>({...c,ch:chatOld[c.ch]||c.ch})),sys:(v.sys||[]).map(n=>({...n})),xblock:!!v.xblock,stamp:v.day||'',live:v.live&&v.live.day===day?v.live.n:0};
}
function heartsOf(s,id){const pts=socialState(s).hearts[id]||0;return Math.min(socialRules.hearts,pts/socialRules.heartPoints)}
function mailSend(v,m,now){v.mail.unshift({id:v.nextId++,kind:m.kind||'mail',title:m.title,text:m.text,from:m.from,items:m.items||{},t:now,read:false,claimed:!Object.keys(m.items||{}).length});
 while(v.mail.length>socialRules.mailMax){const old=[...v.mail].reverse().findIndex(x=>x.claimed);v.mail.splice(old>=0?v.mail.length-1-old:v.mail.length-1,1)}}
// New UTC day: the daily courier letter and one or two thank-you notes from friends. Returns how many arrived.
function socialTick(s,now=Date.now(),rng=Math.random){
 const v=socialState(s,now);if(v.stamp===v.day){return 0}
 const first=!s.social;
 if(first)mailSend(v,{title:'Welcome to Sky Garden',from:'Kiki',text:'Letters, rewards and anything that did not fit in your bag arrive here. Claim them whenever you like.',items:{chest1:1}},now);
 mailSend(v,{title:'Daily Courier',from:'Kiki',text:'Here is today\'s little parcel from the courier guild.',items:{exp1:1,gold1:1}},now);
 const notes=1+(rng()<.5?1:0);
 for(let i=0;i<notes&&v.friends.length;i++){const f=v.friends[Math.floor(rng()*v.friends.length)];mailSend(v,{kind:'note',title:'Thank-you Note',from:socialById[f].name,text:thankLines[Math.floor(rng()*thankLines.length)],items:{stonebag:1}},now)}
 v.stamp=v.day;s.social=socialPack(v);return 1+notes+(first?1:0);
}
function socialPack(v){const out={day:v.day,sent:v.sent,got:v.got,hearts:v.hearts,friends:v.friends,requests:v.requests,blocked:v.blocked,recent:v.recent,mail:v.mail,nextId:v.nextId,chat:v.chat};if(v.sys.length)out.sys=v.sys;if(v.xblock)out.xblock=true;if(v.live)out.live={day:v.day,n:v.live};return out}
// A line in the System channel about something that happened to her (a victory, a summon, a craft...).
function socialNote(s,text,now=Date.now()){const v=socialState(s,now);v.sys.push({text:String(text).replace(/[<>]/g,'').slice(0,120),t:now});v.sys=v.sys.slice(-20);s.social=socialPack(v)}
function chatBlockX(s,on){const v=socialState(s);v.xblock=!!on;s.social=socialPack(v);return v.xblock}
const squadOf=s=>{const v=socialState(s);return v.friends.filter(id=>!v.blocked.includes(id)).slice(0,3)};
// Flowers: up to ten sent and ten received a day. Gift All does both for every friend.
function sendFlower(s,id,now=Date.now()){
 const v=socialState(s,now);if(!v.friends.includes(id)||v.sent.includes(id)||v.sent.length>=socialRules.giftsPerDay)return false;
 v.sent.push(id);v.hearts[id]=Math.min(socialRules.hearts*socialRules.heartPoints,(v.hearts[id]||0)+socialRules.flowerHeart);s.social=socialPack({...v,day:v.day});return true;
}
function giftAll(s,now=Date.now()){
 let sent=0;for(const id of socialState(s,now).friends)if(sendFlower(s,id,now))sent++;
 const v=socialState(s,now),got=Math.max(0,Math.min(socialRules.giftsPerDay,v.friends.length)-v.got);
 v.got+=got;s.gold+=got*socialRules.receiveGold;for(const id of v.friends.slice(0,got))v.hearts[id]=Math.min(socialRules.hearts*socialRules.heartPoints,(v.hearts[id]||0)+socialRules.flowerHeart);
 s.social=socialPack(v);return {sent,got,gold:got*socialRules.receiveGold};
}
function friendAnswer(s,id,yes){const v=socialState(s);if(!v.requests.includes(id))return false;v.requests=v.requests.filter(x=>x!==id);if(yes&&v.friends.length<socialRules.friendsMax&&!v.friends.includes(id))v.friends.push(id);s.social=socialPack(v);return true}
function friendAdd(s,id){const v=socialState(s);if(!socialById[id]||v.friends.includes(id)||v.blocked.includes(id)||v.friends.length>=socialRules.friendsMax)return false;v.friends.push(id);v.requests=v.requests.filter(x=>x!==id);s.social=socialPack(v);return true}
function friendBlock(s,id,on=true){const v=socialState(s);if(!socialById[id])return false;v.blocked=v.blocked.filter(x=>x!==id);v.friends=v.friends.filter(x=>x!==id||!on);if(on)v.blocked.push(id);s.social=socialPack(v);return true}
function mailClaim(s,ids){
 const v=socialState(s),got={};let n=0;
 for(const m of v.mail)if(ids.includes(m.id)&&!m.claimed){m.claimed=true;m.read=true;n++;for(const [id,k] of Object.entries(m.items)){bagAdd(s,id,k);got[id]=(got[id]||0)+k}}
 s.social=socialPack(v);return {n,got};
}
function mailDelete(s,ids){const v=socialState(s),before=v.mail.length;v.mail=v.mail.filter(m=>!(ids.includes(m.id)&&m.claimed));s.social=socialPack(v);return before-v.mail.length}
function mailRead(s,id){const v=socialState(s),m=v.mail.find(m=>m.id===id);if(!m)return null;m.read=true;s.social=socialPack(v);return m}
// The chat feed: AI lines come every 25 s, picked from the clock, so they are the same after a reload; her own lines
// and the answers to them are kept (`chat`, last 30).
// The feed of one channel. AI lines come every 25 s, picked from the clock (same after a reload); her own lines and
// the answers are kept (`chat`, last 30). Lines: {ch,from,text,t,kind} with kind chat / roll / quiz / sys, and for
// X-server a server number and a faction (`srv`, `fac`).
function chatFeed(s,channel,now=Date.now(),count=24){
 channel=chatOld[channel]||channel;
 const v=socialState(s,now),out=[],slot=Math.floor(now/socialRules.chatEvery),pool=socialFolk.filter(f=>!v.blocked.includes(f.id));
 const mix=k=>{const h=Math.imul(hashOf(channel+k),2654435761)>>>0;return [h,Math.imul(h^(h>>>15),2246822519)>>>0]};
 if(channel==='System'){
  out.push({ch:'System',from:'sys',kind:'sys',text:'Welcome to Sky Garden! Everyone in this chat is an AI adventurer.',t:0});
  for(const n of v.sys)out.push({ch:'System',from:'sys',kind:'sys',text:n.text,t:n.t});
 }else if(channel==='X-server'&&v.xblock){return []}
 else if(!channel.startsWith('p:')){
  const squad=squadOf(s);
  for(let k=slot-count+1;k<=slot;k++){
   const [h,g]=mix(k),t=k*socialRules.chatEvery;
   if(channel==='Squad'){if(!squad.length||h%2)continue;out.push({ch:channel,kind:'chat',from:squad[g%squad.length],text:chatLines[(h>>>7)%chatLines.length],t});continue}
   const f=pool[g%pool.length];
   if(channel==='Guild'){
    if(h%3===0)out.push({ch:channel,kind:'chat',from:f.id,text:guildLines[(h>>>7)%guildLines.length],t});
    else{const roll=1+(h>>>5)%99,top=h%3===1;out.push({ch:channel,kind:'roll',from:f.id,roll,text:top?'rolled highest this round! Bonus: T'+(1+(g>>>4)%8)+'·'+slots[(g>>>9)%slots.length].name+' ('+gearRanks[2+(g>>>13)%3].name+')':'rolled '+roll+' this round',t})}
   }else if(channel==='X-server'){
    const q=quizBook[Math.floor(k/24)%quizBook.length];
    if(k%24===0)out.push({ch:channel,kind:'quiz',from:'sys',text:q.q,t});
    else if(k%24<4)out.push({ch:channel,kind:'chat',from:f.id,srv:10+g%90,fac:g%4,text:(h%4?q.a:quizBook[(h>>>3)%quizBook.length].a),t});
    else if(k%24===4)out.push({ch:channel,kind:'quiz',from:'sys',text:'The riddle has come to an end. The answer was: '+q.a+'. Thanks for playing, adventurers!',t});
    else out.push({ch:channel,kind:'chat',from:f.id,srv:10+g%90,fac:g%4,text:chatLines[(h>>>7)%chatLines.length],t});
   }else if(channel==='Faction')out.push({ch:channel,kind:'chat',from:f.id,text:factionLines[(h>>>7)%factionLines.length],t});
   else out.push({ch:channel,kind:'chat',from:f.id,text:chatLines[(h>>>7)%chatLines.length],t});
  }
 }
 for(const c of v.chat)if(c.ch===channel)out.push({kind:'chat',...c});
 return out.sort((a,b)=>a.t-b.t).slice(-count);
}
function chatSay(s,channel,text,now=Date.now(),rng=Math.random){
 channel=chatOld[channel]||channel;
 const clean=String(text).replace(/[<>]/g,'').trim().slice(0,80);if(!clean||channel==='System')return null;
 const v=socialState(s,now),me={ch:channel,from:'me',text:clean,t:now};v.chat.push(me);
 const to=channel.startsWith('p:')?channel.slice(2):null,squad=squadOf(s),pool=channel==='Squad'&&squad.length?squad.map(id=>socialById[id]):socialFolk.filter(f=>!v.blocked.includes(f.id));
 const who=to||pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))].id;
 const reply={ch:channel,from:who,text:chatReplies[Math.floor(rng()*chatReplies.length)],t:now+1500};v.chat.push(reply);
 if(to&&!v.recent.includes(to))v.recent.unshift(to);v.recent=v.recent.slice(0,10);
 v.chat=v.chat.slice(-socialRules.chatKeep);s.social=socialPack(v);return {me,reply};
}
// Live replies: in the in-chat preview an AI adventurer may answer her own message with a line written by Claude
// (the page asks; the rules only count and store). At most `liveDaily` a UTC day; anything else keeps the stock reply.
function chatLiveLeft(s,now=Date.now()){return Math.max(0,socialRules.liveDaily-socialState(s,now).live)}
function chatLiveSet(s,t,text,now=Date.now()){
 const v=socialState(s,now),c=v.chat.find(x=>x.t===t&&x.from!=='me'),clean=String(text).replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,socialRules.liveMax);
 if(!c||!clean||v.live>=socialRules.liveDaily)return false;c.text=clean;c.live=true;v.live++;s.social=socialPack(v);return true;
}
function validSocial(v){
 if(v===undefined)return true;
 const ids=a=>Array.isArray(a)&&new Set(a).size===a.length&&a.every(x=>Object.hasOwn(socialById,x)),int=n=>Number.isSafeInteger(n)&&n>=0;
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&typeof v.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v.day)&&ids(v.sent)&&v.sent.length<=socialRules.giftsPerDay&&int(v.got)&&v.got<=socialRules.giftsPerDay
  &&!!v.hearts&&typeof v.hearts==='object'&&Object.entries(v.hearts).every(([k,n])=>Object.hasOwn(socialById,k)&&int(n)&&n<=socialRules.hearts*socialRules.heartPoints)
  &&ids(v.friends)&&v.friends.length<=socialRules.friendsMax&&ids(v.requests)&&ids(v.blocked)&&ids(v.recent)&&int(v.nextId)
  &&Array.isArray(v.mail)&&v.mail.length<=socialRules.mailMax&&v.mail.every(m=>m&&int(m.id)&&m.id<v.nextId&&['mail','note'].includes(m.kind)&&[m.title,m.text,m.from].every(x=>typeof x==='string'&&x.length<=300)&&Number.isFinite(m.t)&&typeof m.read==='boolean'&&typeof m.claimed==='boolean'&&!!m.items&&Object.entries(m.items).every(([k,n])=>Object.hasOwn(bagItemById,k)&&int(n)&&n<=99))
  &&(v.xblock===undefined||v.xblock===true)&&(v.sys===undefined||Array.isArray(v.sys)&&v.sys.length<=20&&v.sys.every(n=>n&&typeof n.text==='string'&&n.text.length<=120&&Number.isFinite(n.t)))&&Array.isArray(v.chat)&&v.chat.length<=socialRules.chatKeep&&v.chat.every(c=>c&&typeof c.ch==='string'&&c.ch.length<=20&&(c.from==='me'||Object.hasOwn(socialById,c.from))&&typeof c.text==='string'&&c.text.length<=(c.from==='me'?80:socialRules.liveMax)&&(c.live===undefined||c.live===true)&&Number.isFinite(c.t))
  &&(v.live===undefined||!!v.live&&typeof v.live.day==='string'&&Number.isInteger(v.live.n)&&v.live.n>=0&&v.live.n<=socialRules.liveDaily);
}
// ---- Guild ---------------------------------------------------------------------------------------------------------
// One guild at a time: join one of the AI guilds or found her own. Every member besides Reina is an AI adventurer.
// Optional save field `guild` {id, name, crest, role, lv, fund, contrib, coins, academy{stat:lv}, note, speaker, members,
// day, signed, gold, gems, hits, dmg, bossDone, box, reserved, envGot{}, envSent, week, bought{}}. Saves from the first
// pass hold `exp` and `skills{atk,hp,def}` instead of `lv` and `academy`; guildState() reads both. Daily counters reset
// at 00:00 UTC, the shop on Monday. All numbers are placeholders.
const guildRules={createGold:2000,maxLevel:10,memberBase:20,memberStep:10,levelExp:1000,
 signFund:200,signContrib:20,signCoins:20,signActivity:200,aiActivity:100,
 goldDonate:1000,goldTimes:3,goldFund:1000,goldGain:50,gemDonate:50,gemTimes:1,gemFund:1500,gemGain:150,
 bossHits:3,bossHp:60000,bossCoins:100,reserveFund:300,academyCost:100,academyPerLevel:5,noteMax:120,speakerMax:60,
 envCost:100,envShares:5,envSendMax:3,envGain:50};
const guildUpFund=lv=>2000*lv*lv;
const guildSignBoxes=[{at:300,items:{chest1:1}},{at:500,items:{chest2:1,wish:1}}];
const guildAcademy=[{key:'attack',name:'ATK',step:40},{key:'health',name:'HP',step:400},{key:'penetration',name:'ARP',step:12},{key:'defense',name:'DEF',step:30},
 {key:'dodge',name:'Dodge',step:.2},{key:'accuracy',name:'Accuracy',step:.2},{key:'attackPercent',name:'ATK%',step:.5},{key:'healthPercent',name:'HP Bonus',step:.5},
 {key:'damageBonus',name:'DMG Bonus',step:.3},{key:'defensePercent',name:'DEF Bonus',step:.5},{key:'elementalAttack',name:'ELEM. ATK',step:20},{key:'elementalDefense',name:'ELEM. DEF',step:20}];
const guildAcademyKeys=new Set(guildAcademy.map(a=>a.key)),guildOldSkills={atk:'attack',hp:'health',def:'defense'};
const guildList=[{id:'dawn',name:'Dawnfeather',crest:0,exp:4200,members:['nyra','kael','wren','juno','lumi']},{id:'moon',name:'Moonbloom',crest:1,exp:2300,members:['vesper','briar','thane']},
 {id:'star',name:'Starwhisper',crest:2,exp:6900,members:['orin','pip','lumi','wren','juno','thane']}];
// Other AI guilds that only appear in the ranking.
const guildRivals=[{id:'thorn',name:'Thornveil',crest:3,lv:6},{id:'silver',name:'Silverbough',crest:1,lv:5},{id:'lark',name:'Lark Haven',crest:0,lv:3},{id:'ember',name:'Emberglade',crest:2,lv:7},{id:'mist',name:'Mistral Crown',crest:3,lv:4}];
const guildCrests=4,guildRoles=['Leader','Elder','Member'];
const guildNoteText='Welcome! Check in every day, donate and fight the Guild Beast together.',guildSpeakerText='The brave adventurer has logged in and signed in!';
const guildShop=[{id:'stonebag',price:40,lv:1,limit:5},{id:'wish',price:60,lv:1,limit:3},{id:'exp2',price:90,lv:2,limit:3},{id:'shardbag',price:120,lv:3,limit:3},
 {id:'chest2',price:200,lv:4,limit:2},{id:'gembox',price:260,lv:5,limit:2},{id:'petegg',price:400,lv:6,limit:1},{id:'chest3',price:800,lv:8,limit:1}];
// Guild Beast rewards by damage rank: a piece of the beast's tier in this quality, plus chests and guild coins.
const guildBossRank=[{to:1,rank:3,items:{chest2:1,wish:1}},{to:3,rank:2,items:{chest1:2}},{to:99,rank:1,items:{chest1:1}}];
const guildEnvNotes=['Good luck, everyone!','Thanks for the help against the beast!','A little something for the brave.','Happy hunting, friends!','For our newest members!','May the wind carry you!'];
function guildLevel(exp){let lv=1,left=exp;while(lv<guildRules.maxLevel&&left>=guildRules.levelExp*lv){left-=guildRules.levelExp*lv;lv++}return {lv,into:left,need:lv>=guildRules.maxLevel?0:guildRules.levelExp*lv}}
const guildCap=lv=>guildRules.memberBase+guildRules.memberStep*lv;
const guildClean=(text,max)=>String(text).replace(/[<>]/g,'').replace(/\s+/g,' ').trim().slice(0,max);
function guildState(s,now=Date.now()){
 const g=s.guild;if(!g)return null;
 const day=utcDay(now),today=g.day===day,week=utcWeek(now),academy={};
 for(const [k,n] of Object.entries(g.skills||{}))if(guildOldSkills[k])academy[guildOldSkills[k]]=n;
 Object.assign(academy,g.academy);
 const out={...g,lv:g.lv??guildLevel(g.exp||0).lv,fund:g.fund??0,note:g.note??guildNoteText,speaker:g.speaker??guildSpeakerText,academy,day,signed:today&&g.signed,
  gold:today?g.gold:0,gems:today?g.gems:0,hits:today?g.hits:0,dmg:today?g.dmg:0,bossDone:today&&g.bossDone,box:today?g.box||0:0,reserved:g.role!==0||today&&!!g.reserved,
  envGot:today?{...g.envGot}:{},envSent:today?g.envSent||0:0,week,bought:g.week===week?{...g.bought}:{},members:[...g.members]};
 delete out.skills;delete out.exp;return out;
}
const guildPack=g=>{const out={...g};out.members=[...g.members];if(g.role!==0)delete out.reserved;return out};
const guildFresh=(t,role,members)=>({id:t.id,name:t.name,crest:t.crest,role,lv:t.lv,fund:t.fund||0,contrib:0,coins:0,academy:{},members,day:'',signed:false,gold:0,gems:0,hits:0,dmg:0,bossDone:false,week:'',bought:{}});
function guildJoin(s,id){
 const t=guildList.find(x=>x.id===id);if(!t||s.guild)return false;
 const lv=guildLevel(t.exp);s.guild=guildFresh({...t,lv:lv.lv,fund:lv.into*2},2,[...t.members]);return true;
}
function guildCreate(s,name,crest=0){
 const clean=String(name).replace(/[^A-Za-z0-9 '\-]/g,'').trim().slice(0,16);
 if(s.guild||clean.length<3||s.gold<guildRules.createGold||!Number.isInteger(crest)||crest<0||crest>=guildCrests)return false;
 s.gold-=guildRules.createGold;const friends=(s.social?.friends||['nyra','kael','pip']).slice(0,3);
 s.guild=guildFresh({id:'own',name:clean,crest,lv:1},0,friends);return true;
}
// Leaving keeps nothing: guild coins, contribution and academy levels stay with the guild.
function guildLeave(s){if(!s.guild)return false;delete s.guild;return true}
// In an AI guild the AI leader raises the level as soon as the fund allows it.
function guildGain(g,fund,contrib,coins){g.fund+=fund;g.contrib+=contrib;g.coins+=coins;
 while(g.role===2&&g.lv<guildRules.maxLevel&&g.fund>=guildUpFund(g.lv)){g.fund-=guildUpFund(g.lv);g.lv++}}
function guildUpgrade(s,now=Date.now()){const g=guildState(s,now);if(!g||g.role>1||g.lv>=guildRules.maxLevel||g.fund<guildUpFund(g.lv))return false;g.fund-=guildUpFund(g.lv);g.lv++;s.guild=guildPack(g);return true}
function guildNote(s,text,now=Date.now()){const g=guildState(s,now),t=guildClean(text,guildRules.noteMax);if(!g||g.role>1||!t)return false;g.note=t;s.guild=guildPack(g);return true}
function guildSpeaker(s,text,now=Date.now()){const g=guildState(s,now),t=guildClean(text,guildRules.speakerMax);if(!g||g.role>1||!t)return false;g.speaker=t;s.guild=guildPack(g);return true}
function guildSign(s,now=Date.now()){const g=guildState(s,now),r=guildRules;if(!g||g.signed)return false;g.signed=true;guildGain(g,r.signFund,r.signContrib,r.signCoins);s.guild=guildPack(g);return true}
function guildDonate(s,kind,now=Date.now()){
 const g=guildState(s,now),r=guildRules;if(!g)return false;
 if(kind==='gold'){if(g.gold>=r.goldTimes||s.gold<r.goldDonate)return false;s.gold-=r.goldDonate;g.gold++;guildGain(g,r.goldFund,r.goldGain,r.goldGain)}
 else if(kind==='gems'){if(g.gems>=r.gemTimes||s.scales<r.gemDonate)return false;s.scales-=r.gemDonate;g.gems++;guildGain(g,r.gemFund,r.gemGain,r.gemGain)}
 else return false;
 s.guild=guildPack(g);return true;
}
// AI members: power, the hour they check in, today's contribution. Everything follows from their id and the day.
const guildFolkPower=(id,lv)=>12000+hashOf('pow'+id)%26000+lv*1500;
function guildPower(s,now=Date.now()){const g=guildState(s,now);if(!g)return 0;return stats(s).power+g.members.reduce((n,id)=>n+guildFolkPower(id,g.lv),0)}
function guildRanking(s,now=Date.now()){
 const g=guildState(s,now),mine=g?.id;
 const rows=[...guildList.map(t=>({id:t.id,name:t.name,crest:t.crest,lv:guildLevel(t.exp).lv,members:t.members.length+1,power:t.members.reduce((n,id)=>n+guildFolkPower(id,guildLevel(t.exp).lv),0)+30000})),
  ...guildRivals.map(t=>({...t,members:8+hashOf(t.id)%12,power:t.lv*42000+hashOf('gp'+t.id)%60000}))].filter(x=>x.id!==mine);
 if(g)rows.push({id:g.id,name:g.name,crest:g.crest,lv:g.lv,members:g.members.length+1,power:guildPower(s,now),mine:true});
 return rows.sort((a,b)=>b.power-a.power).map((x,i)=>({...x,rank:i+1}));
}
// Daily sign-in activity: her check-in plus the AI members who have checked in by now; two chests to open.
function guildActivity(s,now=Date.now()){
 const g=guildState(s,now);if(!g)return null;const hours=(now%864e5)/36e5;
 const ai=g.members.filter(id=>hashOf('sign'+id+g.day)%12<=hours).length,points=(g.signed?guildRules.signActivity:0)+ai*guildRules.aiActivity;
 return {points,ai,boxes:guildSignBoxes.map((b,i)=>({...b,ready:points>=b.at,claimed:!!(g.box&1<<i)}))};
}
function guildBoxClaim(s,i,now=Date.now()){
 const a=guildActivity(s,now),b=a?.boxes[i];if(!b||!b.ready||b.claimed)return null;
 const g=guildState(s,now);g.box|=1<<i;s.guild=guildPack(g);for(const [id,n] of Object.entries(b.items))bagAdd(s,id,n);return b.items;
}
// Red envelopes (Surprise Bags): AI members send a few every day, each split into five shares; one is kept for Reina.
// Her own bag costs prisms and is shared out among the AI members.
function guildEnvShares(id,total,n){const w=Array.from({length:n},(_,j)=>1+hashOf(id+'#'+j)%9),sum=w.reduce((a,b)=>a+b,0);return w.map(x=>Math.max(1,Math.round(total*x/sum)))}
function guildEnvelopes(s,now=Date.now()){
 const g=guildState(s,now);if(!g)return [];const r=guildRules,list=[];
 g.members.forEach((id,i)=>{const h=hashOf('env'+id+g.day);if(i>1&&h%3)return;
  const kind=h%4===0?'wishes':'gold',total=kind==='gold'?300+h%5*100:20+h%4*10,eid=id+'-'+g.day,shares=guildEnvShares(eid,total,r.envShares);
  const takers=g.members.filter(x=>x!==id).slice(0,r.envShares-1).map((x,j)=>({id:x,amount:shares[j]}));
  const got=g.envGot[eid];if(got)takers.push({id:'me',amount:got});
  list.push({id:eid,from:id,note:guildEnvNotes[h%guildEnvNotes.length],kind,total,shares:r.envShares,mineShare:shares[r.envShares-1],takers,claimed:!!got,left:r.envShares-takers.length});
 });
 for(let k=0;k<g.envSent;k++){const eid='me'+k+'-'+g.day,shares=guildEnvShares(eid,r.envCost,r.envShares);
  list.push({id:eid,from:'me',note:'From Reina, with love!',kind:'prisms',total:r.envCost,shares:r.envShares,takers:g.members.slice(0,r.envShares).map((x,j)=>({id:x,amount:shares[j]})),claimed:true,own:true,left:0})}
 for(const e of list){const best=[...e.takers].sort((a,b)=>b.amount-a.amount)[0];e.best=best?.id}
 return list;
}
function guildEnvClaim(s,id,now=Date.now()){
 const e=guildEnvelopes(s,now).find(x=>x.id===id);if(!e||e.own||e.claimed)return null;
 const g=guildState(s,now);g.envGot[id]=e.mineShare;s.guild=guildPack(g);
 if(e.kind==='gold')s.gold+=e.mineShare;else s.wishes=(s.wishes||0)+e.mineShare;return {kind:e.kind,amount:e.mineShare};
}
function guildEnvSend(s,now=Date.now()){
 const g=guildState(s,now),r=guildRules;if(!g||g.envSent>=r.envSendMax||(s.scales||0)<r.envCost)return false;
 s.scales-=r.envCost;g.envSent++;guildGain(g,r.envCost,r.envGain,0);s.guild=guildPack(g);return true;
}
// Guild Beast: one a day, of the tier Reina has reached. In her own guild the leader books it first (from the fund);
// AI guilds always have it booked. The AI members' damage grows through the day; her three hits add to it.
const guildBeastTier=s=>Math.min(maxTier,unlockedTier(s));
function guildBossHp(s){const g=guildState(s);return g?guildRules.bossHp*g.lv:0}
function guildReserve(s,now=Date.now()){const g=guildState(s,now);if(!g||g.reserved||g.role!==0||g.fund<guildRules.reserveFund)return false;g.fund-=guildRules.reserveFund;g.reserved=true;s.guild=guildPack(g);return true}
function guildAiDamage(s,now=Date.now()){
 const g=guildState(s,now);if(!g||!g.reserved)return (g?.members||[]).map(id=>({id,dmg:0}));const hp=guildBossHp(s),hours=(now%864e5)/36e5;
 return g.members.map(id=>{const h=hashOf(g.id+id+g.day);return {id,dmg:Math.round(hp*(.08+(h%10)/100)*Math.min(1,hours/20))}});
}
function guildBoss(s,now=Date.now()){
 const g=guildState(s,now);if(!g)return null;const ai=guildAiDamage(s,now),hp=guildBossHp(s),total=ai.reduce((n,x)=>n+x.dmg,0)+g.dmg;
 const board=[...ai,{id:'me',dmg:g.dmg}].sort((a,b)=>b.dmg-a.dmg);
 return {hp,left:Math.max(0,hp-total),dead:total>=hp,board,rank:board.findIndex(x=>x.id==='me')+1,hits:g.hits,done:g.bossDone,reserved:g.reserved,tier:guildBeastTier(s)};
}
function guildHit(s,rng=Math.random,now=Date.now()){
 const g=guildState(s,now);if(!g||!g.reserved||g.hits>=guildRules.bossHits||guildBoss(s,now).dead)return null;
 const dmg=Math.round(stats(s).power*(.8+rng()*.4)*1.5);g.hits++;g.dmg+=dmg;guildGain(g,0,10,10);s.guild=guildPack(g);return dmg;
}
function guildBossClaim(s,rng=Math.random,now=Date.now()){
 const b=guildBoss(s,now),g=guildState(s,now);if(!b||!b.dead||g.bossDone||!g.dmg)return null;
 const prize=guildBossRank.find(x=>b.rank<=x.to);g.bossDone=true;g.coins+=guildRules.bossCoins;s.guild=guildPack(g);
 for(const [id,n] of Object.entries(prize.items))bagAdd(s,id,n);
 const gear=addDrop(s,b.tier,slots[Math.floor(rng()*slots.length)].id,prize.rank);
 return {coins:guildRules.bossCoins,items:prize.items,rank:b.rank,gear:gear.uid?gear:null,quality:prize.rank};
}
function guildBuy(s,id,now=Date.now()){
 const g=guildState(s,now),w=guildShop.find(x=>x.id===id);if(!g||!w||g.lv<w.lv||(g.bought[id]||0)>=w.limit||g.coins<w.price)return false;
 g.coins-=w.price;g.bought[id]=(g.bought[id]||0)+1;s.guild=guildPack(g);bagAdd(s,id,1);return true;
}
// Academy: contribution points raise twelve stats for Reina; the cap grows with the guild level.
const guildAcademyCost=lv=>guildRules.academyCost*(lv+1);
const guildAcademyCap=lv=>lv*guildRules.academyPerLevel;
function guildLearn(s,key,now=Date.now()){
 const g=guildState(s,now);if(!g||!guildAcademyKeys.has(key))return false;const lv=g.academy[key]||0,cost=guildAcademyCost(lv);
 if(lv>=guildAcademyCap(g.lv)||g.contrib<cost)return false;g.contrib-=cost;g.academy[key]=lv+1;s.guild=guildPack(g);return true;
}
function guildBonus(s){const g=s.guild?guildState(s):null;if(!g)return {};const out={};for(const a of guildAcademy){const n=g.academy[a.key]||0;if(n)out[a.key]=Math.round(n*a.step*100)/100}return out}
function validGuild(g){
 if(g===undefined)return true;
 const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e12,date=x=>x===''||typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x),opt=(x,f)=>x===undefined||f(x);
 const levels=(o,keys,max)=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).every(([k,n])=>keys.has(k)&&Number.isInteger(n)&&n>=0&&n<=max);
 const text=max=>x=>typeof x==='string'&&x.length>0&&x.length<=max&&!/[<>]/.test(x);
 return !!g&&typeof g==='object'&&!Array.isArray(g)&&(g.id==='own'||guildList.some(x=>x.id===g.id))&&typeof g.name==='string'&&g.name.length>=3&&g.name.length<=16&&/^[A-Za-z0-9 '\-]+$/.test(g.name)
  &&Number.isInteger(g.crest)&&g.crest>=0&&g.crest<guildCrests&&[0,1,2].includes(g.role)&&[g.contrib,g.coins,g.dmg].every(int)&&opt(g.exp,int)&&opt(g.fund,int)&&date(g.day)&&date(g.week)
  &&opt(g.lv,n=>Number.isInteger(n)&&n>=1&&n<=guildRules.maxLevel)&&(g.lv!==undefined||g.exp!==undefined)
  &&opt(g.note,text(guildRules.noteMax))&&opt(g.speaker,text(guildRules.speakerMax))&&opt(g.box,n=>Number.isInteger(n)&&n>=0&&n<1<<guildSignBoxes.length)
  &&opt(g.reserved,x=>typeof x==='boolean')&&opt(g.envSent,n=>Number.isInteger(n)&&n>=0&&n<=guildRules.envSendMax)
  &&opt(g.envGot,o=>!!o&&typeof o==='object'&&!Array.isArray(o)&&Object.entries(o).length<=20&&Object.entries(o).every(([k,n])=>k.length<=40&&int(n)&&n<=1e5))
  &&typeof g.signed==='boolean'&&typeof g.bossDone==='boolean'&&Number.isInteger(g.gold)&&g.gold>=0&&g.gold<=guildRules.goldTimes&&Number.isInteger(g.gems)&&g.gems>=0&&g.gems<=guildRules.gemTimes
  &&Number.isInteger(g.hits)&&g.hits>=0&&g.hits<=guildRules.bossHits
  &&opt(g.skills,o=>levels(o,new Set(Object.keys(guildOldSkills)),guildRules.maxLevel*2))&&opt(g.academy,o=>levels(o,guildAcademyKeys,guildAcademyCap(guildRules.maxLevel)))
  &&Array.isArray(g.members)&&g.members.length<=20&&new Set(g.members).size===g.members.length&&g.members.every(id=>Object.hasOwn(socialById,id))
  &&!!g.bought&&typeof g.bought==='object'&&Object.entries(g.bought).every(([id,n])=>guildShop.some(w=>w.id===id&&Number.isInteger(n)&&n>0&&n<=w.limit));
}
// ---- Sky Contest: Star Duel ----------------------------------------------------------------------------------------
// A two-week season (UTC days from `duelRules.anchor`): Qualification on days 1-3 (15 one-on-one auto-fights against AI
// adventurers, HP does not recover within a day; points for winning, for the foe's strength and for HP left), the top
// 160 of the field reach the Group stage on day 4 (ten in a group, everyone fights everyone, top two go on), the Peak
// Game on day 5 (32 players, five knock-out rounds, HP carries from match to match, bets on other matches and a
// champion guess), then the results and rewards by mail. Everyone else is an AI adventurer. Optional save field
// `duel` {season, n, w, pts, hp, hpDay, insp, auto, g[], p[], php, bets{round:slot}, guess, done}. Placeholders.
const duelRules={anchor:Date.UTC(2026,10,21),period:14,qualDays:3,groupDay:3,peakDay:4,matches:15,promote:160,field:1200,groupSize:10,peakSize:32,peakRounds:5,
 peakHours:4,inspCost:50,inspStep:6,inspMax:5,winBase:20,winPower:10,winHp:10,lossPts:5,groupWin:3,betStake:1000,betPay:2.5,guessPay:5000};
const duelPart={exp1:1,gold1:1};
const duelRanks=[{to:1,label:'Champion',items:{chest3:2,gembox:2,wish:5}},{to:2,label:'Runner-up',items:{chest3:1,gembox:2,wish:3}},{to:4,label:'Top 4',items:{chest2:2,gembox:1,wish:2}},
 {to:8,label:'Top 8',items:{chest2:1,gembox:1}},{to:16,label:'Top 16',items:{chest2:1,shardbag:1}},{to:32,label:'Top 32',items:{chest1:2,shardbag:1}},{to:160,label:'Top 160',items:{chest1:1,stonebag:1}},
 {to:1e9,label:'Participant',items:{stonebag:1}}];
const duelNames=['Bjorn','Mira','Talon','Seren','Rook','Ilsa','Kestrel','Faye','Corin','Liora','Dax','Nim','Ysolde','Garrick','Pell','Ondine','Marco','Mawi','Sable','Quill'];
function duelSeason(now=Date.now()){
 const r=duelRules,d=Math.floor((now-r.anchor)/864e5),season=Math.floor(d/r.period),day=d-season*r.period,start=r.anchor+season*r.period*864e5;
 const stage=day<r.qualDays?'qual':day===r.groupDay?'group':day===r.peakDay?'peak':'rest';
 return {season,day,start,stage,hours:(now-start-day*864e5)/36e5};
}
// The AI field: final qualification points, power (relative to Reina's) and a name, all from the season and the slot.
const duelMix=n=>{n=Math.imul(n^(n>>>16),0x45d9f3b);n=Math.imul(n^(n>>>16),0x45d9f3b);return (n^(n>>>16))>>>0};
function duelAi(season,i){const h=hashOf('duel'+season+':'+i),u=(h%1000)/1000,m=duelMix(h+i*7919);return {i,name:duelNames[m%duelNames.length]+' S-'+(5000+Math.floor(m/97)%400),pts:Math.round(30+570*u**1.7),pow:.6+u*.6+(h%7)/100}}
function duelField(season){const out=[];for(let i=0;i<duelRules.field;i++)out.push(duelAi(season,i));return out}
function duelState(s,now=Date.now()){
 const se=duelSeason(now),v=s.duel&&s.duel.season===se.season?s.duel:{},today=utcDay(now);
 return {...se,n:v.n||0,w:v.w||0,pts:v.pts||0,hp:v.hpDay===today?v.hp??100:100,hpDay:today,insp:v.insp||0,auto:!!v.auto,g:[...(v.g||[])],p:[...(v.p||[])],php:v.php??100,
  bets:{...v.bets},guess:v.guess,done:v.done||0};
}
function duelPack(s,v){const out={season:v.season,n:v.n,w:v.w,pts:v.pts,hp:v.hp,hpDay:v.hpDay,insp:v.insp,g:v.g,p:v.p,php:v.php,bets:v.bets,done:v.done};if(v.auto)out.auto=true;if(v.guess!==undefined)out.guess=v.guess;s.duel=out}
// Qualification ranking: the AI field gathers its points over the three days.
function duelQualRank(s,now=Date.now()){
 const v=duelState(s,now),r=duelRules,prog=v.stage==='qual'?Math.min(1,(now-v.start)/(r.qualDays*864e5)):1,field=duelField(v.season);
 const ai=field.map(a=>({...a,now:Math.round(a.pts*Math.min(1,prog*(.75+(hashOf('qp'+a.i)%50)/100)))})).sort((a,b)=>b.now-a.now||a.i-b.i);
 const rank=v.n?1+ai.filter(a=>a.now>v.pts).length:0;
 return {rank,top:ai.slice(0,30),qualified:v.n>0&&rank<=r.promote&&v.stage!=='qual',open:v.stage==='qual'};
}
// One duel: turn by turn until one side falls. Inspiration lowers the damage Reina takes.
function duelSim(me,op,rng=Math.random){
 const maxA=me.power*12,maxB=op.power*12;let a=maxA*me.hp,b=maxB*op.hp;const hits=[];
 for(let t=0;t<40&&a>0&&b>0;t++){const mine=t%2===0,dmg=Math.round((mine?me.power*(me.boost||1):op.power)*(2.2+rng()*1.2)*(mine?1:1-(me.red||0)));if(mine)b-=dmg;else a-=dmg;hits.push({mine,dmg,a:Math.max(0,a)/maxA,b:Math.max(0,b)/maxB})}
 const ha=Math.max(0,a)/maxA,hb=Math.max(0,b)/maxB;return {win:ha>0&&(hb<=0||ha>=hb),hp:ha,opHp:hb,hits};
}
const duelRed=v=>v.insp*duelRules.inspStep/100;
const duelBoost=s=>1+guardTalents(s).duelist*talentNums.duelist;
function duelInspire(s,count=1,now=Date.now()){
 const v=duelState(s,now),r=duelRules,n=Math.min(count,r.inspMax-v.insp);if(n<1||(s.scales||0)<n*r.inspCost)return 0;
 s.scales-=n*r.inspCost;v.insp+=n;duelPack(s,v);return n;
}
function duelAuto(s,on,now=Date.now()){const v=duelState(s,now);v.auto=!!on;duelPack(s,v);return v.auto}
function duelAutoBuy(s,now){const v=duelState(s,now);if(v.auto&&v.insp<duelRules.inspMax)duelInspire(s,duelRules.inspMax-v.insp,now)}
function duelQualFight(s,rng=Math.random,now=Date.now()){
 duelAutoBuy(s,now);const v=duelState(s,now),r=duelRules;if(v.stage!=='qual'||v.n>=r.matches)return null;
 if(v.hp<=0)return {tired:true};
 const power=stats(s).power,foe=duelAi(v.season,hashOf('q'+v.season+':'+v.n)%r.field),opPower=Math.max(1,Math.round(power*foe.pow));
 const f=duelSim({power,hp:v.hp/100,red:duelRed(v),boost:duelBoost(s)},{power:opPower,hp:1},rng);
 const pts=f.win?r.winBase+Math.round(r.winPower*Math.min(2,opPower/power))+Math.round(r.winHp*f.hp):r.lossPts;
 v.n++;if(f.win)v.w++;v.pts+=pts;v.hp=Math.round(f.hp*100);duelPack(s,v);for(const [id,k] of Object.entries(duelPart))bagAdd(s,id,k);
 return {...f,pts,foe:{name:foe.name,power:opPower},items:duelPart};
}
// Group stage: Reina (slot 0) and nine AI adventurers ranked near her; a round-robin by the circle method.
function duelGroup(s,now=Date.now()){
 const v=duelState(s,now),q=duelQualRank(s,now),r=duelRules,power=stats(s).power;if(!q.qualified)return null;
 const field=duelField(v.season).sort((a,b)=>b.pts-a.pts||a.i-b.i),near=Math.min(field.length-10,Math.max(0,q.rank-5));
 const members=[{me:true,name:'me',power},...field.slice(near,near+r.groupSize-1).map(a=>({name:a.name,i:a.i,power:Math.round(power*a.pow)}))];
 const rounds=[];const ring=members.map((_,i)=>i);
 for(let k=0;k<r.groupSize-1;k++){const pairs=[];for(let j=0;j<r.groupSize/2;j++)pairs.push([ring[j],ring[r.groupSize-1-j]]);rounds.push(pairs);ring.splice(1,0,ring.pop())}
 const shown=v.stage==='group'?v.g.length:r.groupSize-1,table=members.map(m=>({...m,pts:0,won:0,lost:0}));
 rounds.forEach((pairs,k)=>{if(k>=shown)return;for(const [a,b] of pairs){let aw;
  if(a===0||b===0){const res=v.g[k];aw=a===0?res===1:res!==1}else{const pa=members[a].power,pb=members[b].power;aw=(hashOf('g'+v.season+':'+k+':'+a)%1000)/1000<pa/(pa+pb)}
  const w=aw?a:b,l=aw?b:a;table[w].pts+=r.groupWin;table[w].won++;table[l].lost++}});
 const standing=[...table].sort((x,y)=>y.pts-x.pts||y.power-x.power);
 const next=v.stage==='group'&&v.g.length<r.groupSize-1?rounds[v.g.length].map(p=>p.includes(0)?p[0]===0?p[1]:p[0]:null).find(x=>x!==null):null;
 return {members,table,standing,next,done:v.stage!=='qual'&&v.stage!=='group'||v.g.length>=r.groupSize-1,top2:standing.slice(0,2).some(m=>m.me)};
}
function duelGroupFight(s,rng=Math.random,now=Date.now()){
 duelAutoBuy(s,now);const v=duelState(s,now),gr=duelGroup(s,now);if(v.stage!=='group'||!gr||gr.next===null)return null;
 const foe=gr.members[gr.next],f=duelSim({power:gr.members[0].power,hp:1,red:duelRed(v),boost:duelBoost(s)},{power:foe.power,hp:1},rng);
 v.g.push(f.win?1:0);duelPack(s,v);return {...f,foe:{name:foe.name,power:foe.power}};
}
// Peak Game: 32 players in a knock-out bracket. Reina takes slot 0 if she finished top two of her group.
function duelPeak(s,now=Date.now()){
 const v=duelState(s,now),r=duelRules,gr=v.day>=r.peakDay?duelGroup(s,now):null,inn=!!(gr&&gr.top2&&gr.done),power=stats(s).power;
 const field=duelField(v.season).sort((a,b)=>b.pts-a.pts||a.i-b.i).slice(0,r.peakSize);
 const players=field.map(a=>({name:a.name,i:a.i,power:Math.round(power*a.pow)}));if(inn)players[0]={me:true,name:'me',power};
 const rounds=[];let alive=players.map((_,k)=>k);
 for(let k=0;k<r.peakRounds;k++){
  const herIn=inn&&alive.includes(0),revealed=v.day>r.peakDay||v.stage==='peak'&&(v.hours>=r.peakHours*(k+1)||herIn&&v.p.length>k),matches=[];
  for(let j=0;j<alive.length;j+=2){const a=alive[j],b=alive[j+1],mine=inn&&(a===0||b===0),other=a===0?b:a;let win;
   if(mine)win=v.p.length>k?(v.p[k]===1?0:other):revealed?other:null;
   else{const pa=players[a].power,pb=players[b].power;win=(hashOf('p'+v.season+':'+k+':'+a)%1000)/1000<pa/(pa+pb)?a:b}
   matches.push({a,b,mine,win:revealed||mine?win:null})}
  rounds.push({k,matches,revealed});if(!revealed)break;alive=matches.map(m=>m.win);
 }
 const mineAll=rounds.flatMap(rd=>rd.matches.filter(m=>m.mine)),lostAt=mineAll.findIndex(m=>m.win!==null&&m.win!==0);
 const meAlive=inn&&lostAt<0,myRound=meAlive?rounds.findIndex(rd=>rd.matches.some(m=>m.mine&&m.win===null)):-1;
 const final=rounds.length===r.peakRounds&&rounds[r.peakRounds-1].revealed?rounds[r.peakRounds-1].matches[0].win:null;
 return {players,rounds,inn,meAlive,myRound,lostAt,champion:final,php:v.php};
}
function duelPeakFight(s,rng=Math.random,now=Date.now()){
 duelAutoBuy(s,now);const v=duelState(s,now),pk=duelPeak(s,now);if(v.stage!=='peak'||!pk.inn||pk.myRound<0||v.hours>=duelRules.peakHours*(pk.myRound+1)||v.php<=0)return null;
 const m=pk.rounds[pk.myRound].matches.find(x=>x.a===0||x.b===0),foe=pk.players[m.a===0?m.b:m.a];
 const f=duelSim({power:pk.players[0].power,hp:v.php/100,red:duelRed(v),boost:duelBoost(s)},{power:foe.power,hp:1},rng);
 v.p.push(f.win?1:0);v.php=f.win?Math.max(1,Math.round(f.hp*100)):0;duelPack(s,v);return {...f,foe:{name:foe.name,power:foe.power},round:pk.myRound};
}
// Bets: before a round is revealed, stake gold on one AI player of an AI match; a right guess pays stake x betPay.
function duelBet(s,round,slot,now=Date.now()){
 const v=duelState(s,now),pk=duelPeak(s,now),rd=pk.rounds[round],r=duelRules;if(v.stage!=='peak'||!rd||rd.revealed||Object.hasOwn(v.bets,round)||s.gold<r.betStake)return false;
 const m=rd.matches.find(x=>x.a===slot||x.b===slot);if(!m||m.a===0&&pk.inn||m.b===0&&pk.inn)return false;
 s.gold-=r.betStake;v.bets[round]=slot;duelPack(s,v);return true;
}
function duelGuess(s,slot,now=Date.now()){const v=duelState(s,now),pk=duelPeak(s,now);if(v.day>duelRules.peakDay||v.guess!==undefined||pk.rounds[3]?.revealed||!Number.isInteger(slot)||slot<0||slot>=duelRules.peakSize)return false;v.guess=slot;duelPack(s,v);return true}
// Her place in the season (null while it is still open) and the settlement: bets, the guess, and the rewards by mail.
function duelPlace(s,now=Date.now()){
 const v=duelState(s,now),r=duelRules;if(!v.n)return null;const q=duelQualRank(s,now);if(v.stage==='qual')return null;if(!q.qualified)return q.rank;
 const gr=duelGroup(s,now);if(!gr.done)return null;if(!gr.top2)return Math.min(r.promote,Math.max(33,q.rank));
 const pk=duelPeak(s,now);if(pk.lostAt>=0)return [32,16,8,4,2][pk.lostAt];return pk.champion===0?1:null;
}
function duelSettle(s,now=Date.now()){
 const v=duelState(s,now),r=duelRules,pk=duelPeak(s,now),paid={gold:0,mail:null};
 for(const [k,slot] of Object.entries(v.bets)){const bit=1<<k,rd=pk.rounds[k];if(v.done&bit||!rd?.revealed)continue;const m=rd.matches.find(x=>x.a===slot||x.b===slot);v.done|=bit;if(m&&m.win===slot){const g=Math.round(r.betStake*r.betPay);s.gold+=g;paid.gold+=g}}
 if(v.guess!==undefined&&!(v.done&32)&&pk.champion!==null){v.done|=32;if(pk.champion===v.guess){s.gold+=r.guessPay;paid.gold+=r.guessPay}}
 const place=duelPlace(s,now);
 if(place!==null&&!(v.done&64)&&(v.day>r.peakDay)){const row=duelRanks.find(x=>place<=x.to);v.done|=64;
  const sv=socialState(s,now);mailSend(sv,{title:'Star Duel: '+row.label,from:'Arena Herald',text:'Your Star Duel season ended at place '+place+'. Here are your rewards.',items:row.items},now);s.social=socialPack(sv);paid.mail=row}
 if(v.done!==(s.duel?.season===v.season?s.duel.done||0:0)||paid.gold)duelPack(s,v);return paid;
}
function validDuel(v){
 if(v===undefined)return true;const int=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max,r=duelRules;
 return !!v&&typeof v==='object'&&!Array.isArray(v)&&Number.isInteger(v.season)&&int(v.n,r.matches)&&int(v.w,v.n)&&int(v.pts,1e5)&&int(v.hp,100)&&typeof v.hpDay==='string'&&v.hpDay.length<=10
  &&int(v.insp,r.inspMax)&&(v.auto===undefined||v.auto===true)&&Array.isArray(v.g)&&v.g.length<r.groupSize&&v.g.every(x=>x===0||x===1)&&Array.isArray(v.p)&&v.p.length<=r.peakRounds&&v.p.every(x=>x===0||x===1)
  &&int(v.php,100)&&!!v.bets&&typeof v.bets==='object'&&Object.entries(v.bets).every(([k,x])=>/^[0-4]$/.test(k)&&int(x,r.peakSize-1))&&(v.guess===undefined||int(v.guess,r.peakSize-1))&&int(v.done,127);
}
return Object.freeze({talentOdds,talentNums,duelBoost,duelRules,duelPart,duelRanks,duelSeason,duelAi,duelField,duelState,duelQualRank,duelSim,duelInspire,duelAuto,duelQualFight,duelGroup,duelGroupFight,duelPeak,duelPeakFight,duelBet,duelGuess,duelPlace,duelSettle,validDuel,guildRules,guildUpFund,guildSignBoxes,guildAcademy,guildList,guildRivals,guildCrests,guildRoles,guildShop,guildBossRank,guildLevel,guildCap,guildState,guildJoin,guildCreate,guildLeave,guildUpgrade,guildNote,guildSpeaker,guildSign,guildDonate,guildFolkPower,guildPower,guildRanking,guildActivity,guildBoxClaim,guildEnvelopes,guildEnvClaim,guildEnvSend,guildBeastTier,guildBossHp,guildReserve,guildBoss,guildHit,guildBossClaim,guildBuy,guildAcademyCost,guildAcademyCap,guildLearn,guildBonus,validGuild,socialNote,chatBlockX,squadOf,socialFolk,socialRules,socialById,chatChannels,socialState,heartsOf,socialTick,sendFlower,giftAll,friendAnswer,friendAdd,friendBlock,mailClaim,mailDelete,mailRead,chatFeed,chatSay,chatLiveLeft,chatLiveSet,validSocial,cloudOwnReward,cloudOwnTake,cloudRules,cloudPointRewards,cloudShop,cloudRound,cloudRoundEnds,cloudState,cloudNewRound,cloudGain,cloudClaim,buyCloud,validCloud,warFactions,warTotems,warRules,warQuests,warRanks,contestShop,contestState,warNew,warHeld,warHero,warOrder,warTally,warStep,warStanding,warRankPrize,warQuestsDue,warStart,warSettle,buyContest,validContest,summonWells,summonPity,summonLevelMax,summonDupGold,markKinds,markPrice,markLimit,markNeed,galaQuests,galaMilestones,galaEnds,summonState,summonLevel,summonPay,summonDraw,markOffer,buyMarkPet,galaClaim,galaReward,validSummon,bossRare,gearRanks,gearRank,gearCraftFrom,gearNoDevour,bossDropRanks,craftRecipe,craftInputs,craftChance,craftGear,gearGroups,gearGroup,bagCapacity,bagStarter,bagRarity,bagItems,bagItemById,bagCount,bagAdd,bagStacks,bagUsed,vaultCount,vaultMove,useBagItem,devourStep,devourMax,devourNeed,devourWorth,devourState,devourBonus,devourable,devourGear,validBag,riposteShare,riposteEvery,talentCells,talentFree,talentLearn,talentBook,talentScroll,talentTopScroll,talentPrice,talentSupremeAt,talentSupreme,petTalents,talentState,talentIds,supremeReady,addSeals,openCellCost,openTalentCell,learnCost,rollTalent,keepTalent,learnTalent,lockTalent,forgetTalent,setTalentTarget,buyTalentScroll,buyTalentBook,sealRates,sealGold,buySeals,exchangeSpares,talentBonus,guardTalents,petGearPieces,petGearMax,petGearStep,petGearSetStep,petGearLevels,petGearTier,petGearCost,petGearBonus,upgradePetGear,petBolt,petBoltPace,petHit,petPace,assistPages,assistSlots,synthChain,synthNeed,petSpares,addPetSpare,synthesizePet,fashionTraits,companionTypes,companionSkins,companionSkin,ownsCompanionSkin,useCompanionSkin,companionState,companionPoints,improveCompanion,petTeam,petTeamAttack,badgeRank,familiars,emberCost,evolveEmber,petLevel,petAttack,petCap,validPets,trainPet,slots,tiers,stonePrice,buyStone,maxTier,requiredLevel,unlockedTier,artTier,catalog,labels,percentKeys,materialDefs,fresh,valid,repairLoadout,equipBasicSet,state,detail,bonuses,stats,cost,equipped,perform,salvage,addDrop,grant,tierGuardians,encounters,bossGearTier,bossGearLabel,bossLoot,bossLootTables});
})();
