/* Shared, deterministic equipment rules used by the browser and cloud. */
globalThis.WonderGear=(()=>{
const slots=[
{id:'bow',name:'Weapon',item:'Bow',icon:0,base:{attack:28,penetration:8,accuracy:2},enhance:{attack:24,penetration:2,accuracy:.3},offense:true},
{id:'crown',name:'Headwear',item:'Crown',icon:1,base:{health:100,defense:5,critResistance:1},enhance:{health:130,defense:2,critResistance:.4}},
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
 footprint:{name:'Footprint',title:'Starlit Steps',art:'reina-walk',icon:'gear-boots-t3',growth:{attack:2,health:50,elementalAttack:2,elementalDefense:2}}
};
function companionState(save,key){
 return {level:1,tier:1,form:0,hidden:false,equipped:false,...save.companions?.[key]};
}
function validCompanions(data){
 if(data===undefined)return true;
 return data!==null&&typeof data==='object'&&!Array.isArray(data)&&Object.entries(data).every(([key,v])=>
  Object.hasOwn(companionTypes,key)&&v&&Number.isInteger(v.level)&&v.level>=1&&v.level<=100&&Number.isInteger(v.tier)&&v.tier>=1&&v.tier<=10&&Number.isInteger(v.form)&&v.form>=0&&v.form<=2&&typeof v.hidden==='boolean'&&typeof v.equipped==='boolean');
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
 return {id,name,family,color,type:'dragon',title:group===4?'FAE SPIRIT':'DRAGON SPIRIT',accent:color,rarity:group===4?'Rare':family,power:base+i*2,cost:800+base*12+i*30,portrait:'assets/generated/familiar-'+index+'.webp?v=fullbody2'};
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
 return [s.dragon,...slots(s.petPartners,2),...slots(s.petAssist,12)];
}
function badgeRank(s,id){
 const n=s.petBadges?.[id];
 return Number.isInteger(n)&&n>=0&&n<=20?n:0;
}
function petTeamAttack(s){
 return petTeam(s).reduce((sum,id)=>id?sum+petAttack(s,id)+badgeRank(s,id)*5:sum,0);
}
function validPets(s){
 if(!validCompanions(s.companions))return false;
 for(const [ranks,max] of [[s.petBadges,20],[s.petStars,6]]){
  if(ranks!==undefined&&(!ranks||typeof ranks!=='object'||Array.isArray(ranks)||!Object.entries(ranks).every(([id,n])=>Object.hasOwn(petStarts,id)&&s.owned?.includes(id)&&Number.isInteger(n)&&n>=0&&n<=max)))return false;
 }
 if(s.emberShards!==undefined&&(!Number.isSafeInteger(s.emberShards)||s.emberShards<0))return false;
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
 const cards=globalThis.MoonwaterFish.totals(save.fishCards);
 const lv=globalThis.WonderProgress.level(save.xp),d=petTeamAttack(save),w=[40,120,180,240][Number(save.wings[1])];const attack=Math.round((85+lv*7+d+(b.attack||0))*(1+(b.attackPercent||0)/100))+(cards.attack||0)+bowBonus,defense=Math.round((52+lv*4+w+(b.defense||0))*(1+(b.defensePercent||0)/100))+(cards.defense||0),health=Math.round((900+lv*75+(b.health||0))*(1+(b.healthPercent||0)/100))+(cards.health||0),crit=round(Math.min(75,8+(b.crit||0))),speed=100+(b.speed||0),penetration=round(b.penetration||0),damageBonus=round(b.damageBonus||0),damageReduction=round(Math.min(50,b.damageReduction||0)),block=round(Math.min(40,b.block||0)),expBonus=round(b.expBonus||0);const accuracy=round(100+(b.accuracy||0)),dodge=round(Math.min(30,b.dodge||0)),critDamage=round(165+(b.critDamage||0)),critResistance=round(Math.min(30,b.critResistance||0)),shieldHealth=Math.round(b.shieldHealth||0)+(cards.shieldHealth||0),elementalAttack=Math.round(b.elementalAttack||0)+(cards.elementalAttack||0),elementalDefense=Math.round(b.elementalDefense||0)+(cards.elementalDefense||0),armor=round(100-10000/(100+defense*.35)),attackInterval=round(100/speed),healing=Math.round(health*.25);
const advanced={accuracy,dodge,critDamage,critResistance,shieldHealth,elementalAttack,elementalDefense,armor,attackInterval,healing};
return {attack,defense,health,crit,speed,penetration,damageBonus,damageReduction,block,expBonus,...advanced,level:lv,power:Math.floor(attack*5+defense*4+health/3+crit*10+speed+penetration*3+damageBonus*20+damageReduction*25+block*15+attributePower({...advanced,accuracy:accuracy-100,critDamage:critDamage-165}))}}
function cost(entry,action){const t=catalog[entry.template];if(action==='enhance')return entry.enhance>=20?null:{gold:150+entry.enhance*100,stone:2+Math.floor(entry.enhance/4)};if(action==='star')return entry.stars>=5?null:{gold:200*(entry.stars+1),shard:3*(entry.stars+1)};if(action==='gem')return entry.gems>=3?null:{gold:150*(entry.gems+1),gem:1};if(action==='craft')return t.tier>=maxTier?null:{gold:500*(t.grade+1),essence:3*(t.grade+1),stone:5*(t.grade+1),synthesis:t.tier};return null}
function equipped(eq,uid){return Object.values(eq.equipped).includes(uid)}
const starGearCount=4;
function starDonors(eq,item){
 return eq.items.filter(e=>e.uid!==item.uid&&!e.starter&&!e.stored&&!equipped(eq,e.uid)&&catalog[e.template].tier===catalog[item.template].tier);
}
function perform(save,uid,action,donors=[]){const eq=state(save);const i=eq.items.find(e=>e.uid===uid);if(!i)return {ok:false,error:'Item not found.'};if(i.stored)return {ok:false,error:'Withdraw this item first.'};if(action==='equip'||action==='craft'||action==='star'){
 if(action==='craft'&&i.starter)return {ok:false,error:'Use a spare item for tier synthesis.'};
 const target=catalog[i.template].tier+(action==='craft'?1:0);
 if(target<=maxTier&&target>unlockedTier(save))return {ok:false,error:'T'+target+' unlocks at hero level '+requiredLevel(target)+'.'};
}if(action==='equip'){const t=catalog[i.template];if(eq.equipped[t.slot]===uid)return {ok:false,error:'Already equipped.'};save.equipment=eq;eq.equipped[t.slot]=uid;return {ok:true,entry:i}}const price=cost(i,action);if(!price)return {ok:false,error:'This upgrade is already complete.'};if((price.gold||0)>save.gold||materialDefs.some(m=>(price[m.id]||0)>eq.materials[m.id]))return {ok:false,error:'Not enough gold or materials.'};if(action==='star'){
 const eligible=new Set(starDonors(eq,i).map(e=>e.uid));
 if(!Array.isArray(donors)||donors.length!==starGearCount||new Set(donors).size!==starGearCount||donors.some(id=>!eligible.has(id)))return {ok:false,error:'Select four spare items of the same tier.'};
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
return Object.freeze({fashionTraits,companionTypes,companionState,companionPoints,improveCompanion,petTeam,petTeamAttack,badgeRank,familiars,emberCost,evolveEmber,petLevel,petAttack,petCap,validPets,trainPet,slots,tiers,stonePrice,buyStone,maxTier,requiredLevel,unlockedTier,artTier,catalog,labels,percentKeys,materialDefs,fresh,valid,repairLoadout,equipBasicSet,state,detail,bonuses,stats,cost,equipped,perform,salvage,addDrop,grant,starGearCount,starDonors,tierGuardians,encounters,bossGearTier,bossGearLabel,bossLoot,bossLootTables});
})();
