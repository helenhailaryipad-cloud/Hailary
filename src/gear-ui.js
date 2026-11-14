'use strict';
let bagTab='gear',bagSort='slot',gearActionLock=false;
const eqRules=()=>globalThis.WonderGear;
function equipmentStamp(e){return [e.template,e.enhance,e.stars,e.gems].join(':')}
function equipmentIcon(index,extra=''){return `<span class="equipment-art ${extra}" style="--icon-x:${(index%4)*100/3}%;--icon-y:${Math.floor(index/4)*50}%"></span>`}
function gearArt(template){
  return `<img class="gear-illustration" alt="" src="assets/generated/gear-${template.slot}-t${eqRules().artTier(template.tier)}.webp?v=2">`;
}
function equipmentCell(entry,{compact=false,equipped=false,warehouse=false,forge=false}={}){const r=eqRules(),t=r.catalog[entry.template];
 const action=forge?`selectForgePiece(${entry.uid})`:warehouse?`transferGear(${entry.uid},${!entry.stored})`:`openEquipment(${entry.uid})`;
 const purpose=warehouse?(entry.stored?'Withdraw ':'Deposit '):'';
 return `<button data-tier="${t.tier}" data-stars="${entry.stars}" class="equipment-cell rarity-${t.grade} slot-${t.slot} ${equipped?'is-worn':''} ${compact?'compact-cell':''}" style="--rarity:${t.color}" aria-label="${purpose}${t.name}, Tier ${t.tier}, ${entry.stars} stars, enhance ${entry.enhance}${equipped?', equipped':''}" onclick="${action}"><span class="gear-tier">T${t.tier}</span><span class="gear-stars">${uiIcon('star','badge-icon')}${entry.stars}</span>${gearArt(t)}${entry.enhance>0?`<span class="gear-enhance">+${entry.enhance}</span>`:''}${equipped?`<span class="worn-dot">${uiIcon('check','badge-icon')}</span>`:''}${entry.gems?`<span class="gear-gems ${equipped?'worn-gems':''}">${uiIcon('gem','badge-icon')}${entry.gems}</span>`:''}</button>`}
function loadoutCell(eq,slot,compact=false){
 const entry=eq.items.find(i=>i.uid===eq.equipped[slot.id]);
 if(entry)return equipmentCell(entry,{equipped:true,compact});
 return `<span class="empty-gear-slot">${slot.name}</span>`;
}
function equipBasicGear(){
 eqRules().equipBasicSet(S);
 save();
 bag();
}
function equipmentSlotsMarkup(){const r=eqRules(),eq=r.state(S);return r.slots.map(slot=>loadoutCell(eq,slot,true)).join('')}
function bag(){const r=eqRules(),eq=r.state(S),st=stats(),d=item(S.dragon),w=item(S.wings);renderHeroReadout(st);const half=(start)=>r.slots.slice(start,start+5).map(slot=>`<div class="doll-slot">${loadoutCell(eq,slot)}<small>${slot.name}</small></div>`).join('');$('#main').innerHTML=`<div class="bag-top"><div><p class="eyebrow">YOUR EQUIPMENT</p><h1>Equipment</h1></div><button onclick="go('home')">← Hero</button></div>${sectionArtwork('scene-equipment','Enchanted equipment and upgrade crystals')}<div class="bag-layout"><section class="doll-panel"><div class="doll-left">${half(0)}</div><div class="bag-doll"><div class="bag-wings" data-tier="${visualTier(w)}">${wingArt(w)}</div><img class="bag-avatar" src="${reinaLookPath(false)}" alt="Your equipped ranger"><div class="bag-pet" data-tier="${visualTier(d)}">${dragonSVG(d)}</div></div><div class="doll-right">${half(5)}</div></section><div class="equipment-companions"><button class="equip-special" onclick="filter='wings';openScreen('collection')"><span class="tiny-art">${wingArt(w)}</span><span class="companion-caption"><small>Wings</small><strong>${w.name}</strong></span><b>›</b></button><div class="doll-actions"><button onclick="autoEquipBest()">Equip best</button><button onclick="openHeroStats()">All stats</button></div><button class="equip-special" onclick="filter='dragon';openScreen('collection')"><span class="tiny-art">${dragonSVG(d)}</span><span class="companion-caption"><small>Pet · Lv. ${WonderGear.petLevel(S,d.id)}</small><strong>${d.name}</strong></span><b>›</b></button></div><section class="inventory-panel"><div class="inventory-head"><h2>Your treasures</h2><span>${eq.items.length} equipment pieces</span></div><div class="inventory-materials">${r.materialDefs.map(m=>`<button class="material-summary" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b></button>`).join('')}</div><div class="tabs bag-tabs">${[['gear','Gear'],['materials','Materials'],['all','All']].map(([id,label])=>`<button class="${bagTab===id?'active':''}" onclick="bagTab='${id}';bag()">${label}</button>`).join('')}</div><div class="inventory-scroll"><div class="inventory-grid" id="inventoryGrid">${inventoryMarkup(eq)}</div></div><div class="inventory-footer"><button onclick="equipBasicGear()">Equip basic T1</button><span>Tap any item to compare or enhance.</span><div class="row"><button onclick="bagSort=bagSort==='slot'?'power':'slot';bag()">Sort: ${bagSort==='slot'?'slot':'power'}</button>${typeof location!=='undefined'&&new URLSearchParams(location.search).get('debug')==='1'?'<button onclick="equipmentGift()">Test chest</button>':''}</div></div></section></div>`}
function inventoryMarkup(eq){const r=eqRules();let html='';if(bagTab!=='materials'){const items=eq.items.filter(e=>!e.stored).sort((a,b)=>bagSort==='power'?r.detail(b).power-r.detail(a).power:r.slots.findIndex(s=>s.id===r.catalog[a.template].slot)-r.slots.findIndex(s=>s.id===r.catalog[b.template].slot)||r.detail(b).power-r.detail(a).power);html+=items.map(e=>`<div class="inventory-piece">${equipmentCell(e,{equipped:r.equipped(eq,e.uid),forge:screen==='forge'})}<small>${r.catalog[e.template].name}</small></div>`).join('')}if(bagTab!=='gear')html+=r.materialDefs.map(m=>`<button class="material-cell" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" style="--rarity:${m.color}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b><small>${m.name}</small></button>`).join('');return html}
function statValue(key,value){return fmt(Math.round(value*100)/100)+(eqRules().percentKeys.has(key)?'%':'')}
function statLines(values){return Object.entries(values).filter(([,n])=>n!==0).map(([key,n])=>`<div class="gear-stat-line"><span>${statIcon(key,'stat-art')}${eqRules().labels[key]||key}</span><b>+${Number.isInteger(n)?fmt(n):n.toFixed(2)}${eqRules().percentKeys.has(key)?'%':''}</b></div>`).join('')||'<p class="gear-empty">No bonus yet.</p>'}
function equipmentCompare(eq,entry){const t=eqRules().catalog[entry.template],current=stats(),candidate=eqRules().stats({...S,equipment:{...eq,equipped:{...eq.equipped,[t.slot]:entry.uid}}});const rows=['power','attack','defense','health','crit','speed','penetration','damageBonus','damageReduction','block','expBonus','accuracy','dodge','critDamage','critResistance','shieldHealth','elementalAttack','elementalDefense'].filter(k=>candidate[k]!==current[k]).map(k=>{const diff=Math.round((candidate[k]-current[k])*100)/100;return `<div class="compare-row ${diff>0?'better':'worse'}"><span>${statIcon(k,'stat-art')}${k==='power'?'Hero Power':eqRules().labels[k]||k}</span><span>${heroStatValue(k,current)} → <b>${heroStatValue(k,candidate)}</b></span><em>${diff>0?'+':''}${Number.isInteger(diff)?fmt(diff):diff}${eqRules().percentKeys.has(k)?' pp':''}</em></div>`});return rows.length?rows:['<p class="gear-empty">Same total hero stats as your current item.</p>']}
function priceText(price){if(!price)return 'Maximum reached';const r=eqRules();return Object.entries(price).map(([key,n])=>`${fmt(n)} ${key==='gold'?'gold':r.materialDefs.find(m=>m.id===key)?.name.toLowerCase()}`).join(' + ')}
function openEquipment(uid, view='summary', page=0){
 const rules=eqRules(), eq=rules.state(S), item=eq.items.find(entry=>entry.uid===uid);
 if(!item)return;
 const detail=rules.detail(item), template=detail.template, worn=rules.equipped(eq,uid);
 const allowed=template.tier<=rules.unlockedTier(S), stamp=equipmentStamp(item);
 const groups={total:'Total stats',base:'Base stats',enhancement:'Enhancement',star:'Star bonuses',perfect:'Perfect bonuses',gem:'Socketed gems'};
 for(const group of Object.keys(groups)){
  if(!Object.values(detail[group]).some(Number))delete groups[group];
 }
 if(!worn&&allowed)groups.compare='Compare equipped';
 groups.upgrades='Upgrade options';
 if(view!=='summary'&&!Object.hasOwn(groups,view))view='summary';
 let content='',pages=1;
 if(view==='summary'){
  const primary=Object.keys(detail.base).filter(key=>detail.base[key]).slice(0,2);
  content=primary.map(key=>statLines({[key]:detail.total[key]})).join('');
 }else if(view==='upgrades'){
  const options=[['enhance','Enhance'],['star','Add star'],['gem','Socket gem'],['craft','Craft next tier']];
  pages=options.length;
  page=Math.max(0,Math.min(page,pages-1));
  const [action,label]=options[page],price=rules.cost(item,action);
  const locked=action==='craft'&&template.tier+1>rules.unlockedTier(S);
  const available=price&&!locked&&S.gold>=(price.gold||0)&&rules.materialDefs.every(m=>eq.materials[m.id]>=(price[m.id]||0));
  const canSelectDonors=action==='star'&&price;
  content=`<strong>${label}</strong><p>${locked?'Requires Lv. '+rules.requiredLevel(template.tier+1):priceText(price)}</p>
   <button ${!available&&!canSelectDonors?'disabled':''} onclick="equipmentAction(${uid},'${action}','${stamp}')">${label}</button>`;
 }else{
  const entries=view==='compare'?equipmentCompare(eq,item):
   Object.entries(detail[view]).filter(([,value])=>value!==0).map(([key,value])=>statLines({[key]:value}));
  const perPage=window.innerHeight<430?3:6;
  pages=Math.max(1,Math.ceil(entries.length/perPage));
  page=Math.max(0,Math.min(page,pages-1));
  content=entries.slice(page*perPage,(page+1)*perPage).join('');
 }
 const pager=pages>1?`<div class="sheet-pager">
  <button aria-label="Previous" ${page===0?'disabled':''} onclick="openEquipment(${uid},'${view}',${page-1})">‹</button>
  <span>${page+1} / ${pages}</span>
  <button aria-label="Next" ${page===pages-1?'disabled':''} onclick="openEquipment(${uid},'${view}',${page+1})">›</button></div>`:'';
 const heading=`<div class="gear-detail-header" data-tier="${template.tier}" data-stars="${item.stars}" style="--rarity:${template.color}">
  <div class="detail-item-icon slot-${template.slot}">${gearArt(template)}<span>T${template.tier}</span></div>
  <div class="gear-heading"><h2>${template.name}${item.enhance?' +'+item.enhance:''}</h2>
  <p>${worn?'Equipped · ':''}${template.rarity} · ${item.stars}/5 stars</p>
  <p class="item-power">Power <strong>${fmt(detail.power)}</strong></p></div></div>`;
 const actions=worn?'':`<div class="sheet-actions"><button ${allowed?'':'disabled'} onclick="equipmentAction(${uid},'equip','${stamp}')">${allowed?'Equip item':'Requires Lv. '+rules.requiredLevel(template.tier)}</button>
 <button onclick="confirmSalvage(${uid})">Salvage</button></div>`;
 if(view==='summary'){
  modal(`<section class="sheet-card">${heading}<div class="item-sheet">
   <div class="sheet-values">${content}</div>${actions}
   <div class="quick-gear-links"><button onclick="openEquipment(${uid},'total')">Details</button>
   <button onclick="openEquipment(${uid},'upgrades')">Upgrade</button></div>
   </div></section>`);
  $('#modal').classList.add('gear-modal');
  return;
 }
 const menu=`<div class="sheet-menu" id="gearSections" role="group" aria-label="Item details" hidden>
  ${Object.entries(groups).map(([key,label])=>`<button type="button" aria-pressed="${key===view}" onclick="openEquipment(${uid},'${key}');document.getElementById('gearSectionButton').focus()">${label}</button>`).join('')}</div>`;
 const trigger=`<button type="button" id="gearSectionButton" aria-expanded="false" aria-controls="gearSections" onclick="toggleEquipmentMenu()">${groups[view]} <span aria-hidden="true">▴</span></button>`;
 modal(menu+`<section class="sheet-card">${heading}<div class="item-sheet"><div class="sheet-controls">${trigger}${pager}</div>
 <div class="sheet-values">${content}</div>${actions}</div></section>`);
 $('#modal').classList.add('gear-modal');
}
function toggleEquipmentMenu(){
 const menu=$('#gearSections'),trigger=$('#gearSectionButton');
 menu.hidden=!menu.hidden;
 trigger.setAttribute('aria-expanded',String(!menu.hidden));
 if(menu.hidden)trigger.focus();
 else menu.querySelector('[aria-pressed="true"]').focus({preventScroll:true});
}
const gearDialog=document.querySelector('#modal');
let gearPressOutside=false;
gearDialog.addEventListener('pointerdown',event=>{
 gearPressOutside=!event.target.closest('.sheet-card,.sheet-menu');
});
gearDialog.addEventListener('click',event=>{
 if(!gearDialog.classList.contains('gear-modal'))return;
 if(gearPressOutside&&!event.target.closest('.sheet-card,.sheet-menu'))gearDialog.close();
 else if(event.target.closest('.sheet-card')&&!event.target.closest('button')&&!$('#gearSections').hidden)toggleEquipmentMenu();
 gearPressOutside=false;
});
gearDialog.addEventListener('cancel',event=>{
 if(gearDialog.classList.contains('gear-modal')&&!$('#gearSections').hidden){
  event.preventDefault();
  toggleEquipmentMenu();
 }
});
function refreshEquipmentSurface(){if(screen==='cityBag')cityBag();else if(['inventory','forge','warehouse'].includes(screen))gearWorkspace();else if(screen==='bag')bag();else if(screen==='home')home();wallet()}
function equipmentAction(uid,action,expected){if(gearActionLock)return;if(action==='star'){$('#modal').close();openStarForge(uid);return}const eq=eqRules().state(S),entry=eq.items.find(i=>i.uid===uid);if(!entry||equipmentStamp(entry)!==expected){toast('This item changed. Open it again.');return}gearActionLock=true;try{const result=eqRules().perform(S,uid,action);if(!result.ok){toast(result.error);return}save();refreshEquipmentSurface();$('#modal').close();openEquipment(uid);toast(action==='equip'?'Item equipped':action==='craft'?'Next tier crafted. All upgrades kept.':'Equipment improved')}finally{setTimeout(()=>gearActionLock=false,220)}}
function autoEquipBest(){const r=eqRules(),eq=r.state(S),changed=new Set();for(let pass=0;pass<3;pass++){let improved=false;for(const slot of r.slots){let bestUid=eq.equipped[slot.id],bestPower=r.stats({...S,equipment:eq}).power;for(const candidate of eq.items.filter(i=>!i.stored&&r.catalog[i.template].tier<=r.unlockedTier(S)&&r.catalog[i.template].slot===slot.id)){const power=r.stats({...S,equipment:{...eq,equipped:{...eq.equipped,[slot.id]:candidate.uid}}}).power;if(power>bestPower){bestPower=power;bestUid=candidate.uid}}if(bestUid!==eq.equipped[slot.id]){eq.equipped[slot.id]=bestUid;changed.add(slot.id);improved=true}}if(!improved)break}if(changed.size){S.equipment=eq;save();bag();toast(changed.size+' equipment slots improved')}else {const locked=eq.items.filter(i=>!i.stored&&r.catalog[i.template].tier>r.unlockedTier(S)).map(i=>r.catalog[i.template].tier);toast(locked.length?'Best available gear equipped. T'+Math.min(...locked)+' requires Lv. '+r.requiredLevel(Math.min(...locked))+'.':'Your strongest items are already equipped')}}
function confirmSalvage(uid){const r=eqRules(),eq=r.state(S),entry=eq.items.find(i=>i.uid===uid);if(!entry||r.equipped(eq,uid))return;const t=r.catalog[entry.template];modal(`<p class="eyebrow">SALVAGE SPARE EQUIPMENT</p><h2>${t.name}</h2><p>This spare item will become ${3+t.grade*3+entry.enhance} enhancement crystals and ${50*(t.grade+1)} gold. Socketed gems and ${entry.stars} star shards are recovered.</p><p class="rules">This item will be removed. Equipped items are protected.</p><button onclick="openEquipment(${uid})">Keep item</button> <button class="primary" onclick="salvageEquipment(${uid})">Salvage this item</button>`)}
function salvageEquipment(uid){if(gearActionLock)return;gearActionLock=true;try{const result=eqRules().salvage(S,uid);if(!result.ok){toast(result.error);return}save();$('#modal').close();refreshEquipmentSurface();toast('Spare equipment salvaged')}finally{setTimeout(()=>gearActionLock=false,220)}}
function equipmentGift(){const r=eqRules(),eq=r.state(S);S.equipment=eq;eq.materials.stone+=100;eq.materials.shard+=30;eq.materials.gem+=6;eq.materials.essence+=20;r.addDrop(S,3);save();bag();toast('Test chest: crystals, shards, gems, essence and one Epic item')}
function materialInfo(id){const m=eqRules().materialDefs.find(m=>m.id===id);if(!m)return;modal(`<p class="eyebrow">CRAFTING MATERIAL</p><div class="material-large">${equipmentIcon(m.icon)}</div><h2>${m.name}</h2><p>${({stone:'Used to enhance equipment. Earn crystals in dungeons and mini-games.',shard:'Used to add stars. Earn shards from dungeon and Castle Defense victories.',gem:'Socket into equipment for attack, piercing, health or defense. Earn gems by clearing dungeons.',synthesis:'Earn up to two per day from Forge keeper, find them in wishes or the boss wheel, or buy one in Gear Crafting.',essence:'Craft the next equipment tier while preserving all upgrades. Earn essence from dungeon bosses.'})[id]}</p><p>Owned: ${fmt(eqRules().state(S).materials[id])}</p>`)}
const HERO_STAT_GROUPS={
basic:['attack','health','penetration','defense','accuracy','dodge','crit','critResistance','shieldHealth','speed'],
advanced:['damageBonus','damageReduction','critDamage','block','elementalAttack','elementalDefense','armor','attackInterval','healing','expBonus']
};
const HERO_STAT_HELP={
attack:'Base damage for arrows and skills. Improved by your weapon and dragon.',
health:'Maximum health. Improved by levels and armor.',
penetration:'Each point increases outgoing damage by 0.1%, up to 35%.',
defense:'Reduces every incoming hit. Its effective reduction is shown as Armor.',
accuracy:'Counters enemy dodge. Your hit chance is Accuracy minus enemy Dodge, capped at 100%. Celestial Arrow always hits.',
dodge:'Chance to evade regular strikes. Accuracy above 100% counters Dodge. Windstep and moving out of danger also evade strikes.',
crit:'Chance for an automatic arrow to critically strike, before enemy Crit RES. Maximum 75%.',
critResistance:'Reduces enemy critical chance by this many percentage points. Maximum 30%.',
shieldHealth:'A barrier at the start of each dungeon, EXP dungeon or friendly spar. Absorbs damage before HP and lasts through all three halls. Guardian Ring upgrades increase it.',
speed:'100 Speed gives one automatic arrow per second. Higher Speed reduces the attack interval.',
damageBonus:'Percentage bonus to all outgoing damage.',
damageReduction:'Additional percentage reduction after defense. Maximum 50%.',
critDamage:'Total damage of a critical arrow compared with a normal arrow. Bracers improve it.',
block:'Chance to halve incoming damage. Maximum 40%.',
elementalAttack:'Extra damage added to Celestial Arrow. Necklace and Amulet upgrades increase it.',
elementalDefense:'Extra defense against power strikes, applied after normal defense.',
armor:'Effective reduction from DEF. DMG Reduction and Block apply separately afterwards.',
attackInterval:'Seconds between automatic arrows before ally effects.',
healing:'Maximum HP restored by Healing Bloom, equal to 25% of maximum health.',
expBonus:'Percentage bonus applied to earned Adventure EXP.'
};
function heroStatValue(key,st){return key==='attackInterval'?st[key].toFixed(2)+'s':(Number.isInteger(st[key])?fmt(st[key]):st[key].toFixed(2).replace(/0+$/,'').replace(/\.$/,''))+(eqRules().percentKeys.has(key)?'%':'')}
function heroAttributesMarkup(group='basic',st=stats()){
return `<div class="hero-attribute-tabs" role="tablist" aria-label="Hero attributes">${[['basic','Basic Attributes'],['advanced','Advanced Stats']].map(([id,label])=>`<button role="tab" aria-selected="${id===group}" onclick="showHeroStatTab('${id}')">${label}</button>`).join('')}</div><div class="hero-attribute-grid" role="tabpanel" aria-label="${group==='basic'?'Basic Attributes':'Advanced Stats'}">${HERO_STAT_GROUPS[group].map(key=>`<button class="hero-attribute" onclick="explainHeroStat('${key}')"><span>${statIcon(key,'stat-art')}${eqRules().labels[key]}</span><b>${heroStatValue(key,st)}</b></button>`).join('')}</div><div class="hero-stat-explanation" id="heroStatExplanation" aria-live="polite">Tap an attribute to see how it works.</div>`;
}
function showHeroStatTab(group){if(!Object.hasOwn(HERO_STAT_GROUPS,group))return;const panel=$('#heroAttributes');if(panel)panel.innerHTML=heroAttributesMarkup(group)}
function explainHeroStat(key){if(!Object.hasOwn(HERO_STAT_HELP,key))return;$('#heroStatExplanation').innerHTML=`<strong>${eqRules().labels[key]}</strong><span>${HERO_STAT_HELP[key]}</span>`}
function openHeroStats(){const st=stats();modal(`<div class="hero-stats-dialog"><p class="eyebrow">YOUR COMPLETE ATTRIBUTES</p><h2>${esc(S.name)} · Level ${level()}</h2><div class="hero-stats-power">${statIcon('power')}<span>Combat Power</span><b>${fmt(st.power)}</b></div><div id="heroAttributes">${heroAttributesMarkup('basic',st)}</div><p class="rules">Your equipped gear, enhancements, stars and gems contribute to these totals.</p></div>`)}

function equipmentRewardHtml(reward){if(!reward)return '';return eqRules().materialDefs.filter(m=>reward[m.id]>0).map(m=>`<span class="reward">${equipmentIcon(m.icon)}${reward[m.id]} ${m.name.toLowerCase()}${reward[m.id]>1?'s':''}</span>`).join('')}
function bossLootPreview(id){const r=eqRules(),t=r.bossLootTables[id];if(!t)return '';return `<div class="boss-loot-preview"><strong>Guaranteed boss loot</strong><p>1 equipment item · ${r.bossGearLabel(S)} · T${r.bossGearTier(S)} wearable at Lv. ${Math.max(1,r.requiredLevel(r.bossGearTier(S)))} · ${t.stars}${uiIcon('star','inline-art')} · +${t.enhance}</p><small>${t.slots.map(id=>r.slots.find(s=>s.id===id).name).join(' · ')}</small><small>${t.stone} crystals · ${t.shard} star shards · ${t.gem} ${t.gem===1?'gem':'gems'} · ${t.essence} forge essence</small></div>`;}
function bossDropMarkup(reward){if(!reward.entry)return '';const r=eqRules(),eq=r.state(S),e=reward.entry,t=r.catalog[e.template],power=stats().power,next=r.stats({...S,equipment:{...eq,equipped:{...eq.equipped,[t.slot]:e.uid}}}).power,diff=next-power;return `<section class="boss-drop-card" style="--loot-color:${t.color}"><p class="eyebrow">BOSS EQUIPMENT FOUND</p><div class="boss-drop-heading"><span class="boss-drop-icon">${gearArt(t)}</span><div><h3>${t.name}</h3><strong>T${t.tier} · ${e.stars}${uiIcon('star','inline-art')} · +${e.enhance}</strong><p class="loot-power">${diff>0?'+'+fmt(diff)+' hero power if equipped':diff<0?'Your equipped item is stronger. Salvage this for materials.':'Same hero power. Compare its attributes.'}</p></div></div><div class="row"><button class="primary" onclick="openEquipment(${e.uid})">Compare / Equip / Enhance</button><button onclick="$('#modal').close();openScreen('bag')">Open Equipment</button></div><small>Crystals enhance · Shards add stars · Gems add attributes · Essence crafts higher tiers</small></section>`;}
function characterSheet(){
 const st=stats();
 $('#main').innerHTML=`<section class="character-folio"><div class="folio-portrait"><img src="${reinaLookPath(false)}" alt="REINA"><h1>${esc(S.name)}</h1><strong>Level ${level()} · ${fmt(st.power)} Power</strong></div><div id="heroAttributes">${heroAttributesMarkup('basic',st)}</div></section>`;
}
let forgeUid=null,forgeMode='star',forgeDonors=[];
function openStarForge(uid){forgeUid=uid;forgeMode='star';forgeDonors=[];openScreen('forge')}
function setForgeMode(mode){forgeMode=mode;forgeDonors=[];gearWorkspace()}
function toggleForgeDonor(uid){
 if(forgeDonors.includes(uid))forgeDonors=forgeDonors.filter(id=>id!==uid);
 else if(forgeDonors.length<eqRules().starGearCount)forgeDonors.push(uid);
 gearWorkspace();
}
function forgeStar(uid,stamp){
 const r=eqRules(),e=r.state(S).items.find(i=>i.uid===uid);
 if(!e||equipmentStamp(e)!==stamp)return;
 const result=r.perform(S,uid,'star',forgeDonors);
 if(!result.ok){toast(result.error);return}
 forgeDonors=[];save();wallet();gearWorkspace();toast('Star added · T'+r.catalog[e.template].tier);
}
function starRecipe(e,eq){
 const r=eqRules(),t=r.catalog[e.template],price=r.cost(e,'star'),eligible=r.starDonors(eq,e);
 const title='<h2>'+t.name+' · T'+t.tier+'</h2>';
 if(!price)return '<section class="forge-recipe">'+title+'<p>Maximum stars · 5 / 5</p></section>';
 forgeDonors=forgeDonors.filter(id=>eligible.some(d=>d.uid===id));
 const unlocked=t.tier<=r.unlockedTier(S),ready=unlocked&&forgeDonors.length===r.starGearCount&&S.gold>=price.gold&&eq.materials.shard>=price.shard;
 return `<section class="forge-recipe">${title}<p>${e.stars} → ${e.stars+1} stars · T${t.tier}</p><h3>Select gear to consume · ${forgeDonors.length} / ${r.starGearCount}</h3><p>${eligible.length} spare T${t.tier} items in bag · Gold ${fmt(S.gold)} / ${price.gold} · Star shards ${eq.materials.shard} / ${price.shard}</p><div class="forge-resources">${eligible.map(d=>`<button class="forge-piece" aria-label="${r.catalog[d.template].name}, ${d.stars} stars, +${d.enhance}" aria-pressed="${forgeDonors.includes(d.uid)}" onclick="toggleForgeDonor(${d.uid})" style="--rarity:${t.color}">${gearArt(r.catalog[d.template])}<b>${forgeDonors.includes(d.uid)?'✓ ':''}${d.stars}★</b></button>`).join('')}</div><button class="primary" ${ready?'':'disabled'} onclick="forgeStar(${e.uid},'${equipmentStamp(e)}')">${unlocked?'Consume 4 items · Add star':'Requires Lv. '+r.requiredLevel(t.tier)}</button></section><h3>Select equipment to upgrade</h3>`;
}
function selectForgePiece(uid){forgeUid=uid;forgeDonors=[];gearWorkspace()}
function buyForgeStone(){if(!eqRules().buyStone(S))return;save();wallet();gearWorkspace();toast('Synthesis stone +1')}
function synthesizePiece(uid,stamp){
 const r=eqRules(),e=r.state(S).items.find(i=>i.uid===uid);
 if(!e||equipmentStamp(e)!==stamp)return;
 const result=r.perform(S,uid,'craft');
 if(!result.ok){toast(result.error);return}
 save();wallet();gearWorkspace();toast(r.catalog[e.template].name+' crafted')
}
function forgeRecipe(pieces,eq){
 const r=eqRules(),e=pieces.find(i=>i.uid===forgeUid)||pieces[0];
 if(!e)return '';
 if(forgeMode==='star')return starRecipe(e,eq);
 const source=r.catalog[e.template],price=r.cost(e,'craft'),next=r.catalog[source.slot+'-t'+(source.tier+1)];
 const icon=t=>`<span class="forge-piece" style="--rarity:${t.color}">${gearArt(t)}<b>T${t.tier}</b></span>`;
 const store=`<p>Forge keeper: up to 2 stones daily · Wishes: 10% · Boss wheel: 1 stone on the stone segment.</p><button ${S.gold<r.stonePrice?'disabled':''} onclick="buyForgeStone()">Buy 1 stone · ${fmt(r.stonePrice)} gold</button>`;
 if(!next)return `<section class="forge-recipe">${icon(source)}<h2>${source.name} · Maximum tier</h2>${store}</section>`;
 const required=r.requiredLevel(next.tier),ready=level()>=required&&Object.entries(price).every(([k,n])=>(k==='gold'?S.gold:eq.materials[k])>=n);
 const resources=Object.entries(price).map(([k,n])=>{const m=r.materialDefs.find(m=>m.id===k),owned=k==='gold'?S.gold:eq.materials[k];return `<div class="forge-resource ${owned<n?'short':''}">${m?equipmentIcon(m.icon):uiIcon('gold')}<span>${m?m.name:'Gold'}</span><b>${fmt(owned)} / ${fmt(n)}</b>${owned<n?`<small>Need ${fmt(n-owned)} more</small>`:''}</div>`}).join('');
 return `<section class="forge-recipe"><div class="forge-product">${icon(source)}<span aria-hidden="true">→</span>${icon(next)}<div><h2>${next.name}</h2><p>T${source.tier} → T${next.tier} · Requires Lv. ${required}</p></div></div><h3>In bag / required</h3><div class="forge-resources">${resources}</div><button class="primary" ${ready?'':'disabled'} onclick="synthesizePiece(${e.uid},'${equipmentStamp(e)}')">Synthesize T${next.tier}</button>${store}</section><h3>Select equipment</h3>`;
}
function gearWorkspace(){
 const r=eqRules(),eq=r.state(S);
 const titles={inventory:'Bag',forge:'Gear Crafting',warehouse:'Warehouse'};
 const pieces=eq.items.filter(e=>!e.stored);
 const card=e=>`<div class="inventory-piece">${equipmentCell(e,{equipped:r.equipped(eq,e.uid),forge:screen==='forge'})}<small>${r.catalog[e.template].name}</small></div>`;
 const storage=e=>`<div class="inventory-piece">${equipmentCell(e,{warehouse:true})}</div>`;
 let content='';
 if(screen==='warehouse'){
  const stored=eq.items.filter(e=>e.stored),spares=pieces.filter(e=>!r.equipped(eq,e.uid));
  content=`<section class="warehouse-pane"><h2>Stored gear · ${stored.length}</h2><div class="work-grid">${stored.map(storage).join('')||'<p>Your vault is empty.</p>'}</div></section><section class="warehouse-pane"><h2>Bag · ${spares.length}</h2><div class="work-grid">${spares.map(storage).join('')||'<p>No spare gear to deposit.</p>'}</div></section>`;
 }else{
  content=(screen==='forge'?`<div class="tabs">${[['star','Add star'],['tier','Raise tier']].map(([id,label])=>`<button class="${forgeMode===id?'active':''}" onclick="setForgeMode('${id}')">${label}</button>`).join('')}</div>`+forgeRecipe(pieces,eq):'')+'<div class="work-grid">'+pieces.map(card).join('')+'</div>';
  if(screen==='inventory')content+='<h2>Materials</h2><div class="work-grid">'+r.materialDefs.map(m=>`<button class="storage-slot material-cell" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<strong>${m.name}</strong><small>${fmt(eq.materials[m.id])}</small></button>`).join('')+'</div>';
 }
 $('#main').innerHTML=`<div class="topline"><h1>${titles[screen]}</h1></div><section class="gear-workspace">${content}</section>`;
}
function transferGear(uid,stored){
 const eq=eqRules().state(S),entry=eq.items.find(e=>e.uid===uid);
 if(!entry||eqRules().equipped(eq,uid)||Boolean(entry.stored)===stored)return;
 if(stored)entry.stored=true;else delete entry.stored;
 S.equipment=eq;save();gearWorkspace();
}

function reinaCharacter(records=false){
 const st=stats(),progress=WonderProgress,cap=level()===progress.maxLevel;
 const xp=cap?progress.xpPerLevel:S.xp%progress.xpPerLevel;
 const rows=[['ATK','attack'],['HP','health'],['ARP','penetration'],['DEF','defense'],['Accuracy','accuracy'],['Dodge','dodge'],['Crit','crit'],['RSL','critResistance'],['Shield HP','shieldHealth'],['Sparring Point','sparWins']];
 const attributes=rows.map(([label,key])=>`<div>${statIcon(key==='sparWins'?'attack':key,'stat-art')}<span>${label}</span><b>${key==='sparWins'?fmt(S.sparWins||0):heroStatValue(key,st)}</b></div>`).join('');
 const history=[['Dungeon victories',S.dungeonWins],['Sparring victories',S.sparWins],['Castle Defense victories',S.defenseWins],['Best Dragon Merge score',S.mergeBest]];
 $('#main').innerHTML=`<section class="reina-sheet"><header><strong>${records?'Achievements':'Character'}</strong><h1>Lv. ${level()} &nbsp;${esc(S.name)}</h1></header>
 <div class="reina-display"><div class="reina-plinth"></div><div class="reina-sheet-wings">${artImage(S.wings,'')}</div><img class="reina-figure" src="${reinaLookPath(false)}" alt="Reina"><div class="reina-familiar">${dragonSVG(item(S.dragon))}</div>
 <aside><button onclick="go('profile')">${uiIcon('hero')}Profile</button><button onclick="go('fashion')">${uiIcon('equipment')}Fashion</button><button onclick="go('settings')">${uiIcon('settings')}Settings</button></aside></div>
 <button class="reina-power" aria-label="Combat power and all attributes" onclick="openHeroStats()">${statIcon('power')}${fmt(st.power)}</button>
 <section class="reina-values">${records?`<div class="reina-records">${history.map(([name,n])=>`<div>${name}<b>${fmt(n||0)}</b></div>`).join('')}</div>`:`<div class="reina-exp"><b>EXP</b><div role="progressbar" aria-label="Level experience" aria-valuenow="${xp}" aria-valuemax="${progress.xpPerLevel}"><i style="width:${100*xp/progress.xpPerLevel}%"></i><span>${cap?'MAX':xp+' / '+progress.xpPerLevel}</span></div></div><div class="reina-grid">${attributes}</div><button class="reina-details" onclick="openHeroStats()">All attributes ›</button>`}</section>
 <div class="reina-sheet-nav"><button aria-label="Back to city" onclick="go('home')">‹</button><button aria-pressed="${!records}" onclick="reinaCharacter()">${uiIcon('hero')}Character</button><button aria-pressed="${records}" onclick="reinaCharacter(true)">${uiIcon('laurel')}Achievements</button></div></section>`;
}

let cityBagFilter='Common',cityBagOrder='slot';
function cityBagPick(mode){
 const r=eqRules(),eq=r.state(S),spares=mode==='Convert',devour=mode==='Devour';
 const choices=eq.items.filter(e=>!e.stored&&(spares?!e.starter&&!r.equipped(eq,e.uid):devour||r.equipped(eq,e.uid)));
 const pick=e=>{
  const action=spares?`confirmSalvage(${e.uid})`:devour?`$('#modal').close();openStarForge(${e.uid})`:`openEquipment(${e.uid},'upgrades',${mode==='Gem'?2:mode==='Star'?1:0})`;
  return `<button aria-label="${r.catalog[e.template].name}" onclick="${action}">${gearArt(r.catalog[e.template])}</button>`;
 };
 modal(`<h2>${mode}</h2><p>${spares?'Select spare gear to convert into materials.':devour?'Select the item to strengthen with spare equipment.':'Choose equipped gear.'}</p><div class="satchel-choice">${choices.map(pick).join('')||'No eligible equipment.'}</div>`);
}
function cityBag(){
 const r=eqRules(),eq=r.state(S),pet=item(S.dragon);
 const rails=start=>r.slots.slice(start,start+5).map(slot=>loadoutCell(eq,slot)).join('');
 const gear=eq.items.filter(e=>!e.stored).sort((a,b)=>cityBagOrder==='power'?r.detail(b).power-r.detail(a).power:r.catalog[a.template].slot.localeCompare(r.catalog[b.template].slot)||a.uid-b.uid);
 const cells=[];
 if(['Common','ALL'].includes(cityBagFilter))cells.push(...gear.map(e=>equipmentCell(e,{equipped:r.equipped(eq,e.uid)})));
 if(['Materials','ALL'].includes(cityBagFilter))cells.push(...r.materialDefs.map(m=>`<button class="satchel-stack" style="--rarity:${m.color}" aria-label="${m.name}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b></button>`));
 if(['Pet','ALL'].includes(cityBagFilter))cells.push(...S.owned.map(item).filter(it=>it?.type==='dragon').map(it=>`<button class="satchel-stack" aria-label="${it.name}" onclick="selectedPetId='${it.id}';chooseSectionPage('collection')">${dragonSVG(it)}<b>Lv.${r.petLevel(S,it.id)}</b></button>`));
 const wallet=[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([icon,n])=>`<span>${uiIcon(icon)}${new Intl.NumberFormat('en',{notation:'compact'}).format(n)}</span>`).join('');
 $('#main').innerHTML=`<section class="satchel"><div class="satchel-top"><strong>Bag</strong>${wallet}</div><h1>Lv. ${level()} &nbsp;${esc(S.name)}</h1>
 <div class="satchel-stage"><div class="satchel-rail">${rails(0)}</div><div class="satchel-model"><div class="satchel-wings">${artImage(S.wings,'')}</div><img src="${reinaLookPath(false)}" alt="Reina"></div><div class="satchel-rail">${rails(5)}</div></div>
 <div class="satchel-actions"><button aria-label="Equipped wings" onclick="chooseSectionPage('wings')">${artImage(S.wings,'')}</button>${[['gem','Gem'],['star','Star'],['equipment','Enhance']].map(([i,n])=>`<button onclick="cityBagPick('${n}')">${uiIcon(i)}${n}</button>`).join('')}<button aria-label="Equipped pet" onclick="selectedPetId=S.dragon;chooseSectionPage('collection')">${dragonSVG(pet)}</button></div>
 <div class="satchel-tabs">${['Common','Materials','Pet','ALL'].map(t=>`<button aria-pressed="${t===cityBagFilter}" onclick="cityBagFilter='${t}';cityBag()">${t}</button>`).join('')}</div>
 <div class="satchel-scroll"><div class="satchel-grid">${cells.join('')}</div></div>
 <div class="satchel-foot"><span>Capacity: ${eq.items.length}/80</span><button onclick="cityBagPick('Convert')">Convert</button><button onclick="cityBagPick('Devour')">Devour</button><button onclick="cityBagOrder=cityBagOrder==='slot'?'power':'slot';cityBag();toast('Sorted by '+cityBagOrder)">Sort</button></div>
 ${satchelNav()}</section>`;
}

function satchelNav(){return ` <div class="satchel-nav"><button aria-label="Back to city" onclick="go('home')">‹</button>${[['hud-bag','Bag',"go('cityBag')"],['hud-forge','Gear Crafting',"go('cityCraft')"],['hud-shop','Warehouse',"go('warehouse')"],['hud-summon','Devour',"cityBagPick('Devour')"]].map(([icon,n,action])=>`<button onclick="${action}">${artImage(icon,'')}${n}</button>`).join('')}</div>`;}
let craftBand=1,craftTier=null,craftGroup='Equipment',craftTarget=null,craftInputs=[];
function craftFilter(band,tier,group){
 craftBand=band;craftTier=tier;craftGroup=group;craftTarget=null;craftInputs=[];cityCraft();
}
function craftSelect(uid){craftTarget=uid;craftInputs=[];cityCraft()}
function craftAdd(uid){
 const r=eqRules(),eq=r.state(S),e=eq.items.find(x=>x.uid===craftTarget);
 if(!e)return;
 const allowed=r.starDonors(eq,e).map(x=>x.uid);
 if(uid===undefined)craftInputs=allowed.slice(0,r.starGearCount);
 else if(craftInputs.includes(uid))craftInputs=craftInputs.filter(x=>x!==uid);
 else if(allowed.includes(uid)&&craftInputs.length<r.starGearCount)craftInputs.push(uid);
 cityCraft();
}
function craftCommit(stamp){
 const r=eqRules(),e=r.state(S).items.find(x=>x.uid===craftTarget);
 if(!e||equipmentStamp(e)!==stamp)return;
 const result=r.perform(S,e.uid,'star',craftInputs);
 if(!result.ok){toast(result.error);return}
 save();craftInputs=[];cityCraft();toast('Star added');
}
function craftBatch(targetIds){
 const r=eqRules(),trial=JSON.parse(JSON.stringify(S));
 let count=0;
 for(const uid of targetIds){
  const eq=r.state(trial),item=eq.items.find(x=>x.uid===uid);
  if(!item||item.stars!==craftBand-1)continue;
  const donors=r.starDonors(eq,item).sort((a,b)=>a.stars-b.stars||a.enhance-b.enhance||a.gems-b.gems).slice(0,r.starGearCount);
  if(!r.perform(trial,uid,'star',donors.map(x=>x.uid)).ok)continue;
  count++;
 }
 if(!count){toast('Not enough spare gear or materials.');return}
 if(!confirm('Upgrade '+count+' items using '+count*r.starGearCount+' spare items, '+(S.gold-trial.gold)+' gold and '+(r.state(S).materials.shard-trial.equipment.materials.shard)+' shards?'))return;
 S.gold=trial.gold;S.equipment=trial.equipment;save();craftInputs=[];cityCraft();
}
function cityCraft(){
 const r=eqRules(),eq=r.state(S),pieces=eq.items.filter(e=>!e.stored);
 const group=t=>['necklace','amulet'].includes(t.slot)?'Necklace & Amulet':t.slot.startsWith('spirit')?'Rings':'Equipment';
 const family=pieces.filter(e=>group(r.catalog[e.template])===craftGroup&&e.stars===craftBand-1);
 const tiers=[...new Set(family.map(e=>r.catalog[e.template].tier))].sort((a,b)=>b-a);
 if(!tiers.includes(craftTier))craftTier=tiers.find(t=>t<=r.unlockedTier(S))??tiers[0]??null;
 const choices=family.filter(e=>r.catalog[e.template].tier===craftTier),e=choices.find(x=>x.uid===craftTarget)||choices[0];
 craftTarget=e?.uid??null;
 const donors=e?r.starDonors(eq,e):[],price=e?r.cost(e,'star'):null;
 craftInputs=craftInputs.filter(id=>donors.some(x=>x.uid===id));
 const ready=e&&craftTier<=r.unlockedTier(S)&&craftInputs.length===r.starGearCount&&S.gold>=price.gold&&eq.materials.shard>=price.shard;
 const tile=(entry,action,active=false)=>{const t=r.catalog[entry.template];return `<button class="loom-item" aria-label="${t.name}, ${entry.stars} stars" aria-pressed="${active}" style="--edge:${t.color}" onclick="${action}">${gearArt(t)}<b>T${t.tier}</b><small>★${entry.stars}</small></button>`};
 const groups=['Equipment','Necklace & Amulet','Rings'];
 $('#main').innerHTML=`<section class="satchel loom"><div class="satchel-top"><strong>Gear Crafting</strong>${[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>`<span>${uiIcon(i)}${fmt(n)}</span>`).join('')}</div><div class="loom-body"><aside>${[1,2,3,4,5].map(n=>`<button aria-pressed="${craftBand===n}" onclick="craftFilter(${n},null,craftGroup)">${n}-Star Gear</button>${craftBand===n?tiers.map(t=>`<button class="loom-tier" aria-pressed="${t===craftTier}" onclick="craftFilter(craftBand,${t},craftGroup)">T${t} Gear</button>`).join(''):''}`).join('')}</aside><div class="loom-work">${e?`<div class="loom-orbit"><div>${gearArt(r.catalog[e.template])}</div></div><h2>${r.catalog[e.template].name}</h2><strong>${e.stars} → ${craftBand} ★ · T${craftTier}</strong><p>${craftTier>r.unlockedTier(S)?'Requires Lv. '+r.requiredLevel(craftTier):'Success rate: 100% with all materials'}</p><div class="loom-inputs">${Array.from({length:r.starGearCount},(_,i)=>{const d=donors.find(x=>x.uid===craftInputs[i]);return d?tile(d,'craftAdd('+d.uid+')',true):'<span>+</span>'}).join('')}</div><p>${craftInputs.length} / ${r.starGearCount} spare items · ${priceText(price)}</p><div class="loom-options">${donors.map(x=>tile(x,'craftAdd('+x.uid+')',craftInputs.includes(x.uid))).join('')}</div><div class="loom-buttons"><button onclick="craftBatch([${choices.map(x=>x.uid).join(',')}])">Batch</button><button onclick="craftAdd()" ${donors.length?'':'disabled'}>Add</button><button onclick="craftCommit('${equipmentStamp(e)}')" ${ready?'':'disabled'}>Synthesize</button></div><div class="loom-options">${choices.map(x=>tile(x,'craftSelect('+x.uid+')',x===e)).join('')}</div>`:'<p>No matching equipment in your bag.</p>'}</div></div><div class="satchel-tabs">${groups.map(g=>`<button aria-pressed="${g===craftGroup}" onclick="craftFilter(craftBand,null,'${g}')">${g}</button>`).join('')}</div>${satchelNav()}</section>`;
}

let petPage='Formation',petFocus=null,emblemFilter='All';
const petPages=['Formation','Gallery','Assist','Badge'];
function petTab(page,id){
 petPage=page;petFocus=id||petFocus||S.dragon;if(page==='Badge'&&id)emblemFilter='All';cityPet();
}
function setPetTeam(team){
 S.dragon=team[0];S.petPartners=team.slice(1,3);S.petAssist=team.slice(3);
 save();cityPet();
}
function assignPet(slot,id){
 const team=WonderGear.petTeam(S);
 if(!Number.isInteger(slot)||slot<0||slot>=team.length)return;
 if(id===null&&slot===0)return;
 if(id!==null&&(!S.owned.includes(id)||item(id)?.type!=='dragon'))return;
 const previous=team.indexOf(id);
 if(previous===0&&slot!==0&&!team[slot]){toast('Choose another pet for this slot.');return}
 if(id&&previous>=0)team[previous]=team[slot];
 team[slot]=id;
 if(!team[0]){team[0]=id;team[slot]=null}
 $('#modal').close();petFocus=team[slot]||team[0];setPetTeam(team);
}
function recommendPets(){
 const ids=ITEMS.filter(p=>p.type==='dragon'&&S.owned.includes(p.id)).map(p=>p.id);
 const power=id=>WonderGear.petAttack(S,id)+5*WonderGear.badgeRank(S,id);
 ids.sort((a,b)=>power(b)-power(a));
 const primary=ids.slice(0,3),assist=WonderGear.petTeam(S).slice(3).map(id=>primary.includes(id)?null:id);
 petFocus=primary[0];setPetTeam([...Array.from({length:3},(_,i)=>primary[i]||null),...assist]);
}
function petTile(id,click,label,selected=false){
 if(!id)return '<button class="spirit-empty" onclick="'+click+'" aria-label="'+label+'">+<small>'+label+'</small></button>';
 const p=item(id);
 return '<button class="spirit-card" style="--edge:'+p.color+'" aria-pressed="'+selected+'" onclick="'+click+'"><small>'+p.rarity+'</small>'+dragonSVG(p)+'<b>'+p.name+'</b><small>'+label+'</small></button>';
}
function pickPet(slot){
 const team=WonderGear.petTeam(S),owned=ITEMS.filter(p=>p.type==='dragon'&&S.owned.includes(p.id));
 modal('<h2>'+ (slot<3?'Primary Pet':'Pet Assist')+'</h2><div class="spirit-picker">'+owned.map(p=>petTile(p.id,"assignPet("+slot+",'"+p.id+"')",team.includes(p.id)?'Deployed':'Select',team[slot]===p.id)).join('')+'</div>'+(slot&&team[slot]?'<button onclick="assignPet('+slot+',null)">Remove</button>':''));
}
function petFeed(){
 if(WonderGear.trainPet(S,petFocus)){save();cityPet()}
}
function petUnlock(){
 const p=item(petFocus);
 if(S.owned.includes(p.id)||S.gold<p.cost)return;
 S.gold-=p.cost;S.owned.push(p.id);save();cityPet();
}
function starPet(){
 const stars=S.petStars?.[petFocus]||0,price=10*(stars+1);
 if(petFocus==='d1'){
  if(!WonderGear.evolveEmber(S))return;
 }else{
  const eq=WonderGear.state(S);
  if(!S.owned.includes(petFocus)||stars>=6||eq.materials.shard<price)return;
  eq.materials.shard-=price;S.equipment=eq;(S.petStars??={})[petFocus]=stars+1;
 }
 save();cityPet();
}
function forgePetBadge(){
 const rank=WonderGear.badgeRank(S,petFocus),price=5*(rank+1);
 if(!S.owned.includes(petFocus)||rank>=20)return;
 const eq=WonderGear.state(S);
 if(eq.materials.shard<price)return;
 eq.materials.shard-=price;S.equipment=eq;(S.petBadges??={})[petFocus]=rank+1;save();cityPet();
}
function cityPet(){
 const rules=WonderGear,team=rules.petTeam(S),pets=ITEMS.filter(p=>p.type==='dragon');
 if(!petFocus||petPage==='Formation'&&!team.slice(0,3).includes(petFocus))petFocus=S.dragon;
 if(petPage==='Badge'&&emblemFilter!=='All'&&item(petFocus).rarity!==emblemFilter)petFocus=pets.find(p=>p.rarity===emblemFilter)?.id||S.dragon;
 const p=item(petFocus),owned=S.owned.includes(p.id),lv=rules.petLevel(S,p.id),atk=rules.petAttack(S,p.id),rank=rules.badgeRank(S,p.id);
 const switchTo=(page,id)=>"petTab('"+page+"','"+id+"')";
 const strip=(list,page)=>'<div class="spirit-strip">'+list.map(q=>petTile(q.id,switchTo(page,q.id),S.owned.includes(q.id)?'Lv. '+rules.petLevel(S,q.id):'Locked',q.id===p.id)).join('')+'</div>';
 const portrait='<div class="spirit-model">'+dragonSVG(p)+'</div>';
 const title='<h2>'+p.name+'</h2><span>'+p.rarity+' · Lv. '+lv+'</span>';
 const primary=team.slice(0,3).map((id,i)=>'<div>'+petTile(id,id?switchTo('Formation',id):'pickPet('+i+')',id?'Lv. '+rules.petLevel(S,id):'Deploy',id===p.id)+(id?'<button class="spirit-link" onclick="pickPet('+i+')">Replace</button>':'')+'</div>').join('');
 let body;
 if(petPage==='Formation'){
  const other=team.slice(0,3).filter(id=>id&&id!==p.id);
  body='<div class="spirit-scene"><div class="spirit-value">⚔ '+fmt(rules.petTeamAttack(S))+'</div><button class="spirit-recommend" onclick="recommendPets()">Recommended<br>Lineup</button><div class="spirit-flanks">'+other.map(id=>dragonSVG(item(id))).join('')+'</div>'+portrait+'</div><section class="spirit-panel">'+title+'<progress max="'+rules.petCap+'" value="'+lv+'"></progress><p>ATK '+fmt(atk)+'　·　Badge ATK +'+rank*5+'</p><button class="spirit-gold" onclick="petFeed()" '+(lv>=rules.petCap||S.gold<lv*100?'disabled':'')+'>'+(lv>=rules.petCap?'Max level':'Fast Feed · '+fmt(lv*100)+' gold')+'</button></section><div class="spirit-lineup">'+primary+'</div>';
 }else if(petPage==='Assist'){
  body='<div class="spirit-value">⚔ '+fmt(rules.petTeamAttack(S))+'</div><section class="spirit-panel"><h2>Primary Pet</h2><div class="spirit-lineup">'+primary+'</div></section><section class="spirit-panel spirit-support"><h2>Pet Assist</h2><div class="spirit-assists">'+team.slice(3).map((id,i)=>petTile(id,'pickPet('+(i+3)+')',id?'Replace':'Assign')).join('')+'</div></section><p>Deployed pets contribute their full ATK.</p>';
 }else if(petPage==='Gallery'){
  const stars=p.id==='d1'?S.emberStars||0:S.petStars?.[p.id]||0;
  const shards=p.id==='d1'?S.emberShards||0:rules.state(S).materials.shard;
  const starControl=owned?'<p>'+('★'.repeat(stars))+('☆'.repeat(6-stars))+'</p><button class="spirit-gold" onclick="starPet()" '+(stars>=6||shards<10*(stars+1)?'disabled':'')+'>'+ (stars>=6?'Max stars':'Star-up · '+10*(stars+1)+(p.id==='d1'?' Ember shards':' shards'))+'</button> ':'';
  body='<header>'+title+'</header>'+portrait+'<section class="spirit-panel"><h2>ATK '+fmt(atk)+'</h2><p>'+p.title+' · '+(team.includes(p.id)?'Deployed':owned?'Collected':'Uncollected')+'</p>'+starControl+'<button class="spirit-gold" onclick="'+(owned?"petTab('Badge','"+p.id+"')":"petUnlock()")+'" '+(!owned&&S.gold<p.cost?'disabled':'')+'>'+(owned?'View Badge':'Unlock · '+fmt(p.cost)+' gold')+'</button> <button class="spirit-link" onclick="filter=\'dragon\';go(\'collection\')">Pet Summon</button></section>'+strip(pets,'Gallery');
 }else{
  const shards=rules.state(S).materials.shard,cost=5*(rank+1);
  body='<header><h2>Level '+rank+' · '+p.name+' Badge</h2><span>Exclusive Pet · '+p.name+'</span></header>'+portrait+'<section class="spirit-panel"><h2>Badge Forge</h2><p>Bonus ATK +'+rank*5+(rank<20?' → +'+(rank+1)*5:'')+'</p><progress value="'+Math.min(shards,cost)+'" max="'+cost+'"></progress><button class="spirit-gold" onclick="forgePetBadge()" '+(!owned||rank>=20||shards<cost?'disabled':'')+'>'+(rank>=20?'Max level':owned?'Forge · '+shards+'/'+cost+' shards':'Unlock pet in Gallery')+'</button></section>'+strip(pets.filter(q=>emblemFilter==='All'||q.rarity===emblemFilter),'Badge')+'<div class="spirit-filters">'+['All',...new Set(pets.map(q=>q.rarity))].map(f=>'<button aria-pressed="'+(emblemFilter===f)+'" onclick="emblemFilter=\''+f+'\';cityPet()">'+f+'</button>').join('')+'</div>';
 }
 $('#main').innerHTML='<section class="spirit-room" data-page="'+petPage+'"><strong class="spirit-ribbon">'+petPage+'</strong><div class="spirit-body">'+body+'</div><div class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+petPages.map((page,i)=>'<button aria-pressed="'+(page===petPage)+'" onclick="petTab(\''+page+'\')">'+artImage(['hud-pet','hud-bag','hud-companion','hud-forge'][i],'')+page+'</button>').join('')+'</div></section>';
}

let companionKey='elf',companionMode='Upgrade';
const companionForms=['Classic','Moonlight','Sunfire'];
function companionModes(key){
 if(key==='back')return ['Morphing'];
 return ['elf','mount'].includes(key)?['Upgrade','Tier-up','Morphing','Equip']:['Upgrade','Morphing'];
}
function companionTab(key,mode){
 if(!WonderGear.companionTypes[key])return;
 companionKey=key;
 companionMode=companionModes(key).includes(mode)?mode:companionModes(key)[0];
 cityCompanion();
}
function companionAction(action,arg){
 const r=WonderGear,key=companionKey,v=r.companionState(S,key);
 if(action==='upgrade'||action==='tier'){
  if(!r.improveCompanion(S,key,action==='tier'))return;
 }else{
  if(action==='form'&&Number.isInteger(arg)&&arg>=0&&arg<=2&&v.level>=[1,5,10][arg])v.form=arg;
  else if(action==='hide')v.hidden=!v.hidden;
  else if(action==='equip'){
   if(key==='mount'){S.mountId=currentMount()?'':mounts[0].id;delete S.ridingSilverTabby}
   else v.equipped=!v.equipped;
  }else return;
  (S.companions??={})[key]=v;
 }
 save();cityCompanion();
}
function cityCompanionEffects(){
 return ['elf','back','cloak','footprint'].map(key=>{
  const v=WonderGear.companionState(S,key);
  if(!v.equipped||v.hidden)return '';
  return '<span aria-hidden="true" class="city-companion-effect fx-'+key+' form-'+v.form+'">'+(key==='footprint'?'<i></i><i></i><i></i>':key==='cloak'?'<span class="moonveil-cloak"></span>':artImage(WonderGear.companionTypes[key].art,''))+'</span>';
 }).join('');
}
function cityCompanion(){
 const r=WonderGear,key=companionKey,t=r.companionTypes[key],v=r.companionState(S,key);
 const labels={attack:'ATK',health:'HP',defense:'DEF',penetration:'ARP %',elementalAttack:'ELEM. ATK',elementalDefense:'ELEM. DEF'};
 const tier=companionMode==='Tier-up'||key==='back'&&v.level>=v.tier*5&&v.tier<10,points=r.companionPoints(v);
 const price=tier?v.tier*5:v.level*100,balance=tier?r.state(S).materials.shard:S.gold;
 const equipped=key==='mount'?!!currentMount():v.equipped;
 const statRows=Object.entries(t.growth).map(([k,n])=>'<div><b>'+labels[k]+'</b><span>'+fmtCompanion(n*points)+'</span><em>↑ '+fmtCompanion(n*(tier?5:1))+'</em></div>').join('');
 const modes=companionModes(key),nav=Object.entries(r.companionTypes).map(([k,x])=>'<button aria-pressed="'+(k===key)+'" onclick="companionTab(\''+k+'\')">'+artImage(x.icon,'')+x.name+'</button>').join('');
 const equip='<button class="spirit-gold" onclick="companionAction(\'equip\')">'+(equipped?(key==='mount'?'Dismount':'Unequip'):(key==='mount'?'Ride':'Equip'))+'</button>';
 const upgrade='<small>'+ (tier?'Tier '+v.tier+' · Requires Lv. '+v.tier*5:'Lv. '+v.level+' / 100')+'</small><progress value="'+(tier?Math.min(v.level,v.tier*5):v.level)+'" max="'+(tier?v.tier*5:100)+'"></progress><button class="spirit-gold" onclick="companionAction(\''+(tier?'tier':'upgrade')+'\')" '+(balance<price||(tier?v.tier>=10||v.level<v.tier*5:v.level>=100)?'disabled':'')+'>'+(tier?'Tier up':'Upgrade')+'</button><small>'+fmt(price)+(tier?' shards':' gold')+'</small>';
 const forms=companionForms.map((name,i)=>'<button aria-pressed="'+(v.form===i)+'" class="form-'+i+'" onclick="companionAction(\'form\','+i+')" '+(v.level<[1,5,10][i]?'disabled':'')+'>'+artImage(t.icon,'')+'<small>'+name+(v.level<[1,5,10][i]?' · Lv.'+[1,5,10][i]:'')+'</small></button>').join('');
 const preview=key==='cloak'?'<div class="moonveil-cloak" role="img" aria-label="Moonveil Mantle"><i>✦</i></div>':key==='footprint'?'<div class="step-marks"><i></i><i></i><i></i></div><img src="'+reinaLookPath(false)+'" alt="Reina">':artImage(t.art,t.title);
 $('#main').innerHTML='<section class="spirit-room companion-room"><div class="satchel-top"><strong>'+t.name+'</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div><header><h2>Lv.'+v.level+' '+t.title+'</h2><b class="spirit-value">⚔ '+fmt(Object.values(t.growth).reduce((a,b)=>a+b,0)*points)+'</b></header><div class="companion-show">'+(key==='mount'?'':'<label><input type="checkbox" '+(v.hidden?'checked':'')+' onchange="companionAction(\'hide\')"> Hide</label>')+'<div class="companion-object form-'+v.form+'">'+preview+'</div></div><div class="companion-forms">'+forms+'</div><section class="companion-stats"><div>'+statRows+'</div><div>'+(companionMode==='Equip'?equip:companionMode==='Morphing'&&key!=='back'?equip:upgrade)+(key==='back'?equip:'')+'</div></section><div class="companion-modes">'+modes.map(m=>'<button aria-pressed="'+(m===companionMode)+'" onclick="companionTab(\''+key+'\',\''+m+'\')">'+m+'</button>').join('')+'</div><div class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+nav+'</div></section>';
}
function fmtCompanion(n){return Number(n.toFixed(1)).toLocaleString('en-US')}

const skinPages=[
 {name:'Wings',title:'Sunset Wings',icon:'w3',art:['w3','w0','w2'],stats:['health','defense','dodge','critResistance']},
 {name:'Soulforge',title:'Abyssal Arrow',icon:'hud-skin',art:['arrow'],stats:['attack','penetration','accuracy','dodge']},
 {name:'Holy Weapon',title:'Verdant Bow',icon:'gear-bow-t1',art:['gear-bow-t1','gear-bow-t3','gear-bow-t7'],stats:['attack','penetration','accuracy','crit','critResistance']},
 {name:'Pet Aura',title:'Moonlight Aura',icon:'hud-pet',art:['aura'],stats:['attack','health','penetration','defense','accuracy']},
 {name:'Radiance',title:'Starlight',icon:'hud-dream',art:['radiance'],stats:['health','defense','dodge','critResistance']},
 {name:'Shield',title:'Antique Shield',icon:'hud-reinforce',art:['shield'],stats:['attack','health','penetration','defense','shieldHealth']},
 {name:'Spectral Dragon',title:'Frostglass',icon:'familiar-15',art:['familiar-15','familiar-24','familiar-35'],stats:['attack','health','penetration','defense','elementalDefense']}
];
let skinTab=0,skinMode='Upgrade',skinVariant=0,skinHidden=false;
function switchSkin(index,mode,variant){
 if(index!==skinTab)skinHidden=false;
 skinTab=index;skinMode=mode;skinVariant=variant;citySkin();
}
function skinArtwork(page,variant){
 const id=page.art[variant]||page.art[0];
 if(id==='radiance')return '<img src="'+reinaLookPath(false)+'" alt="Reina">';
 if(id==='aura')return dragonSVG(item(S.dragon));
 if(id==='arrow')return '<span class="skin-arrow"><i></i></span>';
 if(id==='shield')return '<span class="skin-shield"><i>✧</i></span>';
 return artImage(id,page.title);
}
function citySkin(){
 const page=skinPages[skinTab],st=stats(),morph=skinMode==='Morphing';
 const labels={health:'HP',attack:'ATK',defense:'DEF',accuracy:'Accuracy',dodge:'Dodge',crit:'Crit',critResistance:'RSL',shieldHealth:'Shield HP',penetration:'ARP',elementalDefense:'Elem. DEF'};
 const statsList=page.stats.map(key=>'<div><b>'+labels[key]+'</b><span>'+fmtCompanion(st[key])+(['accuracy','dodge','crit','critResistance','penetration'].includes(key)?'%':'')+'</span></div>').join('');
 const nav=skinPages.map((p,i)=>'<button aria-pressed="'+(i===skinTab)+'" onclick="switchSkin('+i+',\'Upgrade\',0)">'+artImage(p.icon,'')+p.name+'</button>').join('');
 const variants=[0,1,2].map(i=>'<button aria-pressed="'+(skinVariant===i)+'" onclick="switchSkin('+skinTab+',\'Morphing\','+i+')">'+artImage(page.art.length>1?page.art[i]:page.icon,'','form-'+(page.art.length>1?0:i))+'<small>'+(['Classic','Moonlight','Sunfire'][i])+'</small></button>').join('');
 const skillIcons=['gear-spiritguard-t3','gear-amulet-t3','gear-spiritluck-t6','gear-amulet-t7','gear-spiritguard-t5'];
 const strip=skillIcons.map(id=>artImage(id,'')).join('')+'<span></span>'+['gear-spiritguard-t1','gear-spiritguard-t3','gear-spiritguard-t7'].map(id=>artImage(id,'')).join('');
 const scroll=$('.skin-scroll')?.scrollLeft||0;
 $('#main').innerHTML='<section class="spirit-room companion-room skin-room"><div class="satchel-top"><strong>'+page.name+'</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div><header><h2>'+page.title+'</h2><b class="spirit-value" title="Hero combat power">⚔ '+fmt(st.power)+'</b></header><div class="companion-show"><label><input type="checkbox" '+(skinHidden?'checked':'')+' onchange="skinHidden=this.checked;citySkin()"> Hide</label><div class="companion-object skin-object skin-art-'+skinTab+' form-'+(page.art.length===1?skinVariant:0)+'">'+(skinHidden?'':skinArtwork(page,skinVariant))+'</div><button class="skin-transform" onclick="switchSkin('+skinTab+',\'Morphing\',skinVariant)">Transform</button></div><div class="'+(morph?'companion-forms':'skin-skills')+'">'+(morph?variants:strip)+'</div><section class="companion-stats"><div><small>Hero attributes</small>'+statsList+'</div><div><small>'+ (morph?'Appearance preview':'Upgrade preview')+'</small><strong>'+(morph?['Classic','Moonlight','Sunfire'][skinVariant]:page.name)+'</strong>'+(morph?'':'<progress value="0" max="1"></progress><button class="spirit-gold" disabled>Upgrade</button>')+'</div></section><div class="companion-modes">'+['Upgrade','Morphing'].map(m=>'<button aria-pressed="'+(m===skinMode)+'" onclick="switchSkin('+skinTab+',\''+m+'\',0)">'+m+'</button>').join('')+'</div><div class="spirit-nav skin-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button><div class="skin-scroll">'+nav+'</div></div></section>';
 const rail=$('.skin-scroll');
 if(rail){rail.scrollLeft=scroll;rail.querySelector?.('[aria-pressed=true]')?.scrollIntoView?.({block:'nearest',inline:'nearest'})}
}

const smithPages={
 Forge:['Enhance','Upgrade','Identify','Advance'],
 Gem:['Embed','Refine','Engrading'],
 Set:['Aurora Set','Star Set','Moon Set','Sun Set'],
 Awaken:['Awaken','Gear Evolution','Enchant','Deify'],
 Exalt:['Exalt','Hallow']
};
let smithPage='Forge',smithMode='Identify',smithUid=null;
function smithTab(page,mode){
 smithPage=page;smithMode=mode||smithPages[page][0];cityForge();
}
function cityForge(){
 const r=eqRules(),eq=r.state(S),pieces=eq.items.filter(e=>!e.stored);
 const e=pieces.find(x=>x.uid===smithUid)||pieces.find(x=>x.uid===eq.equipped.bow)||pieces[0];
 const sub=smithMode,page=smithPage;
 const details=e?r.detail(e):null;
 const tile=x=>{const t=r.catalog[x.template];return '<span class="smith-item" style="--edge:'+t.color+'">'+gearArt(t)+'<b>T'+t.tier+'</b><small>★ '+x.stars+'</small></span>'};
 const rows=obj=>Object.entries(obj).map(([k,n])=>'<span>'+ (r.labels[k]||k)+' <b>'+fmtCompanion(n)+'</b></span>').join('');
 const material=(id)=>{const m=r.materialDefs.find(x=>x.id===id);return '<span class="smith-material">'+equipmentIcon(m.icon)+'<small>'+fmt(eq.materials[id])+'</small></span>'};
 let scene='',panel='',action=sub;
 if(e){
  smithUid=e.uid;
  const t=r.catalog[e.template];
  if(page==='Forge'){
   scene='<strong>Score '+fmt(details.power)+'</strong>';
   panel='<h3>'+ (sub==='Identify'?'Tier-up conditions':sub)+'</h3><p>T'+t.tier+' · '+t.name+'</p><h3>Tier '+t.tier+' Stats</h3><div class="smith-bars">'+Object.entries(details.total).map(([k,n])=>'<div>'+ (r.labels[k]||k)+' <b>'+fmtCompanion(n)+'</b><hr></div>').join('')+'</div>';action=sub==='Identify'?'Free':sub;
  }else if(page==='Gem'){
   scene=Array.from({length:6},(_,i)=>'<div class="smith-socket s'+i+'">'+(i<e.gems?artImage('crystal','Gem'):'◇')+'<small>'+(i<e.gems?'Sky Gem':'Empty')+'</small></div>').join('');
   panel='<h3>'+sub+'</h3><p>'+e.gems+' embedded · '+fmt(eq.materials.gem)+' Sky Gems</p>';action=sub==='Embed'?'Quick Embed':sub;
  }else if(page==='Set'){
   scene='<div class="smith-supplies">'+material('shard')+'<i>◇</i><i>◇</i></div>';
   panel='<h3>'+sub+'</h3><div class="smith-pieces"><span>1 Piece<br>ATK %</span><span>2 Pieces<br>ATK · ARP</span><span>4 Pieces<br>HP · DEF</span></div>';action='Obtain';
  }else if(page==='Awaken'){
   scene='<div class="smith-supplies">'+material('essence')+'</div>';
   panel='<h3>'+sub+' Stats</h3><div class="smith-summary">'+rows(details.base)+'</div>';
  }else{
   scene='<div class="smith-sides">'+material('shard')+material('essence')+'</div>';
   panel='<h3>Basic Bonus</h3><div class="smith-summary">'+rows(details.base)+'</div><h3>Enhancement Bonus</h3><div class="smith-summary">'+(rows(details.enhancement)||'0')+'</div><h3>Set Bonus</h3>';
  }
 }
 const rail=pieces.map(x=>'<button aria-pressed="'+(e===x)+'" onclick="smithUid='+x.uid+';cityForge()"><small>'+r.catalog[x.template].name+'</small>'+tile(x)+'<small>+'+x.enhance+'</small></button>').join('');
 const icons=['hud-forge','hud-gems','hud-gear','hud-reinforce','hud-rank'];
 const old=$('.smith-rail')?.scrollLeft||0;
 $('#main').innerHTML='<section class="spirit-room companion-room smith-room" data-forge="'+page+'"><div class="satchel-top"><strong>Forge</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div><div class="smith-scene"><div class="smith-rune"></div>'+scene+(e?tile(e):'No equipment')+'</div><div class="smith-panel">'+panel+'</div><div><button class="spirit-gold" disabled>'+action+'</button></div><div class="smith-rail">'+rail+'</div><div class="companion-modes">'+smithPages[page].map(m=>'<button aria-pressed="'+(m===sub)+'" onclick="smithTab(\''+page+'\',\''+m+'\')">'+m+'</button>').join('')+'</div><div class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+Object.keys(smithPages).map((p,i)=>'<button aria-pressed="'+(p===page)+'" onclick="smithTab(\''+p+'\')">'+artImage(icons[i],'')+p+'</button>').join('')+'</div></section>';
 const strip=$('.smith-rail');if(strip)strip.scrollLeft=old;
}

const dailyPages=['Daily','Time Limited','Retrieve','Weekly Lucky Bag','Auto Sweep'];
const dailyCards=[
 ['Alliance Arena','scene-castle','EXP',5,20],['Gear Dungeon','scene-dungeons','Material',3,30,'dungeons'],
 ['Elf Dungeon','scene-wonders','Material',2,10],['Training','scene-realm','EXP',1,10],
 ['EXP Forest','scene-exp','EXP',2,10,'expLobby'],['Dusk Hall','battle-dungeon','Material',2,10]
];
const timedCards=[
 ['Elements','scene-exp','Material',1,5,'20:00'],['Dark Hunt','battle-dungeon','Material',10,0,'21:00'],
 ['Max Combo','scene-castle','EXP',1,10,'21:00'],['LostRealm','scene-realm','Material',2,10,'20:45'],
 ['CloudWar','scene-dungeons','EXP',1,10,'19:30']
];
let dailyPage=0;
function dailyOpen(page){dailyPage=page;cityDaily()}
function dailyTokens(ids){return ids.map(id=>'<span class="daily-token">'+artImage(id,id.replace(/^hud-/,'').replaceAll('-',' '))+'</span>').join('')}
function dailyCalendar(){
 modal('<h2>Event Weekly Calendar</h2>'+timedCards.map(([name,,,,,time])=>'<p>'+name+' · '+time+'</p>').join(''));
}
function cityDaily(){
 const page=dailyPage,timed=page===1,exp=WonderProgress.daily(S),activity=Math.min(2,exp.completed||0)*5;
 let list='',foot='';
 const titles=['Daily Must-Do','Daily Must-Do','Resource Retrieval','Weekly Lucky Bag','Sweep'];
 let banner='<h2>'+titles[page]+'</h2>';
 if(page<2){
  banner+='<button class="daily-calendar" onclick="dailyCalendar()">'+artImage('hud-daily','')+'Weekly Calendar</button><div class="daily-milestones"><b>'+activity+'<small>Activeness</small></b>'+[60,120,180,240,300].map(n=>'<span>'+artImage('hud-chest','Reward chest')+'<small>'+n+'</small></span>').join('')+'</div>';
  list=(timed?timedCards:dailyCards).map(([name,art,kind,max,points,dest])=>{
   const done=name==='EXP Forest'?Math.min(max,exp.used):0;
   const action=timed?'<small>Available at<br>'+dest+'</small>':done>=max?'<b>Completed</b>':dest?'<button onclick="go(\''+dest+'\')">Go</button>':'<button disabled>Go</button>';
   return '<article class="daily-task">'+artImage(art,'')+'<i>'+kind+'</i><div><h3>'+name+'</h3><p>Times　'+done+'/'+max+'</p><p>Activity　'+(name==='EXP Forest'?activity:0)+'/'+points+'</p></div><aside>'+action+'</aside></article>';
  }).join('');
  if(!timed)list='<article class="daily-task">'+artImage('fishing-design-compass','')+'<div><h3>Moonwater Fishing</h3><p>Always open</p></div><aside><button onclick="go(\'fishing\')">Go</button></aside></article>'+list;
 }else if(page===3){
  banner+='<div class="daily-jackpot">'+dailyTokens(['gear-armor-t6','hud-prisms','hud-gems'])+'</div><small>Lucky Bag EXP　0 / 55</small>';
  list='<div class="daily-columns"><b>Simple Lucky Bag</b><b>Luxury Lucky Bag</b></div>'+Array.from({length:16},(_,i)=>'<article class="daily-track">'+dailyTokens([['hud-gift','hud-pass','crystal'][i%3]])+'<b>'+ (i+1)+'</b><div>'+dailyTokens(['hud-prisms',i%2?'hud-gift':'hud-gems'])+'</div></article>').join('');
  foot='<span>Luxury Lucky Bag</span><button disabled>€15.99 · Preview</button>';
 }else{
  const sweep=page===4,names=sweep?['Mount Dungeon','Wings Dungeon','Elf Dungeon','Shield Dungeon','Cloak Dungeon']:['Dragon Dungeon','Brawl','Q&A Fun','EXP Forest','Dusk Hall'];
  if(sweep)banner+='<small>Super Dungeon Tickets　0</small>';
  list=names.map((name,i)=>'<article class="daily-resource"><header><b>'+name+(sweep?' (Hell)':'')+'</b><small>'+(sweep?'Challenge attempts　0/2':'Retrieval chances　0')+'</small></header><div>'+dailyTokens([['crystal','hud-gems','hud-prisms'],['hud-pass','w0','w3'],['hud-pet','crystal'],['hud-reinforce','hud-gems'],['gear-armor-t3','hud-pass']][i])+'<button disabled>'+(sweep?'Sweep unavailable':'Retrieve')+'</button></div></article>').join('');
  foot=sweep?'<label><input type="checkbox"> Auto-purchase</label><label><input type="checkbox" checked> Double Raid</label><button disabled>Auto Sweep</button>':'<label><input type="radio" name="retrieval" checked> Diamond · 100%</label><label><input type="radio" name="retrieval"> Gold · 90%</label><button disabled>Retrieve</button>';
 }
 $('#main').innerHTML='<section class="companion-room spirit-room daily-room daily-page-'+page+'"><div class="satchel-top"><strong>Daily</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('')+'</div><header class="daily-banner">'+banner+'</header><div class="daily-list">'+list+'</div>'+(foot?'<div class="daily-foot">'+foot+'</div>':'')+'<nav class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+dailyPages.map((name,i)=>'<button aria-pressed="'+(i===page)+'" onclick="dailyOpen('+i+')">'+artImage(['hud-daily','hud-event','hud-reward','hud-bag','hud-combat'][i],'')+name+'</button>').join('')+'</nav></section>';
}

const playSections=['Material','Challenge','Team Dungeon','Arena','Peak Contest'];
const playMaterials=['Mount Dungeon','Wings','Soulforge','Elf Dungeon'];
const mountTiers=[['Hard',300],['Elite',330],['Nightmare',360],['Hell',380]];
let playSection=0,playMaterial=0,playTier=3;
function cityGameplay(){
 const name=playSections[playSection],material=playMaterials[playMaterial];
 const mount=playSection===0 && playMaterial===0;
 const title=playSection===0?material:name;
 const nav=(names,current,state)=>names.map((n,i)=>`<button aria-pressed="${current===i}" onclick="${state}=${i};cityGameplay()">${n}</button>`).join('');
 const tiers=mountTiers.map(([tier,level],i)=>`<button class="gp-tier" aria-pressed="${playTier===i}" onclick="playTier=${i};cityGameplay()">${artImage('hud-combat','')}<span><b>Mount Dungeon (${tier})</b><small>Unlocks at Lv. ${level}</small></span><i aria-label="Three star slots">☆☆☆</i></button>`).join('');
 const mountPanel=`<div class="gp-tiers">${tiers}</div><div class="gp-rewards"><b>Recommended Level: ${mountTiers[playTier][1]}</b><small>Clear with 3 stars to unlock 2× Sweep.</small><div>${dailyTokens(['hud-pet','hud-gift','hud-prisms','hud-pass'])}</div></div><div class="gp-actions"><button onclick="go('cityDaily');dailyOpen(4)">Auto Sweep</button><button disabled>Dungeon Raid<br><small>Free</small></button><button disabled>Double Sweep<br><small>500 crystals</small></button></div>`;
 const destinations=[null,['Mini Games','games'],['EXP Forest','expLobby'],null,null];
 const dest=destinations[playSection];
 const scene=mount?mountPanel:`<div class="gp-empty">${artImage(['hud-pet','hud-combat','hud-gear','hud-combat','hud-rank'][playSection],'')}${dest?`<button class="spirit-gold" onclick="go('${dest[1]}')">${dest[0]}</button>`:''}</div>`;
 $('#main').innerHTML=`<section class="companion-room spirit-room gp-room"><div class="satchel-top"><strong>${name}</strong>${[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('')}</div><header class="gp-banner"><h2>${title}</h2>${mount?'<small>Mount development materials</small>':''}</header><div class="gp-content">${scene}</div><div class="companion-modes">${playSection===0?nav(playMaterials,playMaterial,'playMaterial'):''}</div><nav class="spirit-nav"><button aria-label="Back to city" onclick="go('home')">‹</button>${nav(playSections,playSection,'playSection')}</nav></section>`;
}

const bountyPages=['AdvQuest','Adventure Shop','Pet Pass'];
const bountyRanks=['Silver Quests','Gold Quests','Diamond Quests'];
const silverObjectives=[
 ['Spend 500 Cloud Tokens in the Cloud Shop',500],
 ['Complete the Elf Dungeon twice',2],
 ['Complete the Mount Dungeon twice',2],
 ['Complete the Cloak Dungeon twice',2]
];
let bountyPage=0,bountyRank=0;
function cityBounty(){
 const title=bountyPage===0?'Adventure Quest':bountyPages[bountyPage];
 const wallet=[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('');
 const track=[500,1000,1500,2000,2500].map((n,i)=>'<div>'+artImage(i<2?'hud-gems':'hud-pass','')+'<small>'+n+'</small></div>').join('');
 const cards=silverObjectives.map(([name,target])=>'<article><header>'+name+' <b>(0/'+target+')</b></header><div>'+dailyTokens(['scene-exp','crystal','hud-prisms','hud-pet','hud-quest'])+'<button disabled>Claim</button></div></article>').join('');
 const journal=bountyPage===0;
 const ranks=bountyRanks.map((name,i)=>'<button aria-pressed="'+(i===bountyRank)+'" onclick="bountyRank='+i+';cityBounty()">'+name+'</button>').join('');
 const nav=bountyPages.map((name,i)=>'<button aria-pressed="'+(bountyPage===i)+'" onclick="bountyPage='+i+';cityBounty()">'+artImage(['hud-quest','hud-shop','hud-pet'][i],'')+name+'</button>').join('');
 const empty='<div class="bounty-empty">'+artImage(journal?'hud-quest':['','hud-shop','hud-pass'][bountyPage],'')+'<strong>'+(journal?bountyRanks[bountyRank]:title)+'</strong></div>';
 $('#main').innerHTML='<section class="companion-room spirit-room bounty-room"><div class="satchel-top"><strong>Bounty</strong>'+wallet+'</div><header class="bounty-banner"><h2>'+title+'</h2>'+artImage(journal?'hud-chest':bountyPage===1?'hud-shop':'hud-pet','')+'</header>'+(journal?'<div class="bounty-track"><b>0<small>Adventure EXP</small></b><section>'+track+'</section></div>':'<div></div>')+'<div class="bounty-list">'+(journal&&bountyRank===0?cards:empty)+'</div><div class="companion-modes">'+(journal?ranks:'')+'</div><nav class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+nav+'</nav></section>';
}

const huntModes=['World Boss','Personal Boss','Eternal Abyss','X-server'];
let huntMode=0,huntFloor=1,huntSlot=0;
function cityHunting(){
 const bosses=DUNGEONS.filter(d=>d.tier===huntFloor),boss=bosses[huntSlot];
 const mode=huntModes[huntMode],world=huntMode===0;
 const wallet=[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('');
 const button=(label,active,action)=>'<button aria-pressed="'+active+'" onclick="'+action+'">'+label+'</button>';
 const modes=huntModes.slice(0,3).map((name,i)=>button(name,huntMode===i,'huntMode='+i+';cityHunting()')).join('');
 const floors=Array.from(new Set(DUNGEONS.map(d=>d.tier))).map(t=>button(t+'F',huntFloor===t,'huntFloor='+t+';huntSlot=0;cityHunting()')).join('');
 const cards=bosses.map((d,i)=>button(artImage(d.art,'')+'<strong>'+d.boss+'</strong><small>Lv. '+d.recommended+'</small>',huntSlot===i,'huntSlot='+i+';cityHunting()')).join('');
 const stamina=WonderAdventure.staminaLimit-WonderAdventure.dailyDungeon(S).spent;
 const preview='<div class="hunt-title"><b>T'+boss.tier+' · '+boss.boss+'</b><small>Recommended level: '+boss.recommended+'</small></div>'+artImage(boss.art,boss.boss,'hunt-hero')+'<button class="hunt-stats" onclick="inspectBoss(\''+boss.id+'\')">'+artImage('hud-quest','')+'Boss Stats</button><aside><strong>Rewards</strong>'+[uiIcon('gold'),uiIcon('wishes'),uiIcon('equipment')].map(x=>'<span>'+x+'</span>').join('')+'</aside>';
 const entry='<div class="hunt-energy">Energy: '+stamina+' / '+WonderAdventure.staminaLimit+'</div><button class="spirit-gold" '+(level()<boss.recommended||stamina<=0?'disabled':'')+' onclick="launchBattle(\'dungeon\',\''+boss.id+'\')">Proceed Now</button>';
 $('#main').innerHTML='<section class="companion-room spirit-room hunt-room"><div class="satchel-top"><strong>'+mode+'</strong>'+wallet+'</div><div class="hunt-scene">'+(world?preview:'<div class="hunt-title">'+mode+'</div>'+artImage(huntMode===3?'hud-clan':'hud-hunting','','hunt-emblem'))+'</div><section class="hunt-picker">'+(world?'<div class="hunt-floors">'+floors+'</div><div class="hunt-cards">'+cards+'</div>'+entry:'')+'</section><div class="companion-modes">'+(huntMode!==3?modes:'')+'</div><nav class="spirit-nav"><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+button('Boss',huntMode!==3,'huntMode=0;cityHunting()')+button('X-server',huntMode===3,'huntMode=3;cityHunting()')+'</nav></section>';
 if(world)for(const rail of document.querySelectorAll('.hunt-floors,.hunt-cards')){
  const selected=rail.querySelector('[aria-pressed=true]');
  rail.scrollLeft=selected.offsetLeft-(rail.clientWidth-selected.offsetWidth)/2;
 }
}

const exploreTrail=[[24,89],[53,80],[74,69],[40,60],[16,49],[56,39],[85,29],[56,18],[25,8]];
// Vertical tangents give each switchback a smooth turn at its marker.
const exploreTrailPath=exploreTrail.reduce((path,[x,y],i)=>{
 if(i===0)return 'M '+x+' '+y;
 const [previousX,previousY]=exploreTrail[i-1];
 const middleY=(previousY+y)/2;
 return path+' C '+previousX+' '+middleY+' '+x+' '+middleY+' '+x+' '+y;
},'');
function exploreStageLabel(index){
 return (Math.floor(index/9)+1)+'-'+(index%9+1);
}
function exploreRequiredPower(index){return 1500+35*index;}
const exploreBosses=['mistwood','moonfall','emberpeak','coral','frost','honey','storm','crystal','sunspire'];
let exploreFight=null;
function leaveExploreFight(){
 if(exploreFight)clearInterval(exploreFight.timer);
 exploreFight=null;
}
function startExploreFight(index){
 if(exploreFight||screen!=='cityExplore'||index!==(S.exploreCleared||0))return;
 const required=exploreRequiredPower(index),power=stats().power;
 if(power<required){toast('More power needed for stage '+exploreStageLabel(index));return;}
 const fight={index,hp:required,damage:Math.ceil(power/7)};
 exploreFight=fight;
 fight.timer=setInterval(()=>strikeExploreBoss(fight),650);
 cityExplore();
}
function strikeExploreBoss(fight){
 if(!fight||fight!==exploreFight||screen!=='cityExplore')return;
 if(fight.index!==(S.exploreCleared||0)){leaveExploreFight();cityExplore();return;}
 fight.hp=Math.max(0,fight.hp-fight.damage);
 if(fight.hp){
  $('#explore-boss-health').value=fight.hp;
  return;
 }
 leaveExploreFight();
 S.exploreCleared=fight.index+1;
 save();
 cityExplore();
 toast(BOSS_NAMES[exploreBosses[fight.index%9]]+' defeated · Stage '+exploreStageLabel(fight.index)+' cleared');
}
function showExploreFight(fight){
 const boss=exploreBosses[fight.index%9];
 $('#main').innerHTML=`<section class="explore-map explore-battle"><div class="explore-enemy"><small>Stage ${exploreStageLabel(fight.index)}</small><h2>${BOSS_NAMES[boss]}</h2><progress id="explore-boss-health" aria-label="Boss health" max="${exploreRequiredPower(fight.index)}" value="${fight.hp}"></progress></div>${artImage(boss,'','explore-guardian')}<div class="explore-actions"><button class="spirit-gold" onclick="strikeExploreBoss(exploreFight)">Strike</button><button onclick="leaveExploreFight();cityExplore()">Back to map</button></div></section>`;
}
function previewExploreStage(index){
 const cleared=S.exploreCleared||0;
 const status=index<cleared?'Cleared':index===cleared?'Next stage':'Clear the previous stage to unlock';
 modal('<h2>Stage '+exploreStageLabel(index)+'</h2><p>'+status+'</p><p>Power required: '+fmt(exploreRequiredPower(index))+'</p>');
}
function exploreDetail(title){
 const cleared=S.exploreCleared||0, chapter=Math.floor(cleared/9)+1;
 const descriptions={
  'Stage Rewards':'Chapter '+chapter+' · '+cleared%9+' / 9 stages cleared',
  'Clear Battle Pass':'Chapter '+chapter+' · '+cleared%9+' / 9 stages cleared',
  'Assignment':'Clear challenge stage '+exploreStageLabel(cleared)+'.',
  'Clearance Objective':'Reach the gate at stage '+chapter+'-9.',
  'Training Bonus':'Chapter '+chapter+' · Training bonus preview'
 };
 modal('<h2>'+title+'</h2><p>'+descriptions[title]+'</p>');
}
function exploreTool(name,art,destination){
 const action=destination?"go('"+destination+"')":"exploreDetail('"+name+"')";
 return '<button onclick="'+action+'">'+artImage(art,'')+'<small>'+name+'</small></button>';
}
function cityExplore(){
 if(exploreFight){showExploreFight(exploreFight);return;}
 const cleared=S.exploreCleared||0, chapter=Math.floor(cleared/9)+1, next=cleared%9;
 const power=stats().power, required=exploreRequiredPower(cleared);
 const markers=exploreTrail.map(([x,y],i)=>{
  const index=cleared-next+i, label=exploreStageLabel(index);
  return `<button class="trail-marker ${i<next?'trail-done':''}" style="left:${x}%;top:${y}%" aria-pressed="${i===next}" aria-label="Preview stage ${label}" onclick="previewExploreStage(${index})">${artImage('explore-marker-'+(i+1),'')}<b>${i<next?'✓ ':''}${label}</b></button>`;
 }).join('');
 const tools=[['Stage Rewards','hud-chest'],['Clear Battle Pass','hud-pass'],['Assignment','hud-quest'],['Clearance Objective','hud-reward'],['Training','hud-upgrade','expLobby']].map(args=>exploreTool(...args)).join('');
 $('#main').innerHTML='<section class="explore-map" aria-label="Challenge chapter '+chapter+'"><div class="trail-field"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="'+exploreTrailPath+'"/></svg>'+markers+'</div><aside class="trail-benefits"><b>Challenge</b><small>Chapter '+chapter+' · '+next+' / 9</small></aside><div class="trail-bonus">'+exploreTool('Training Bonus','hud-upgrade')+'</div><div class="trail-tools">'+tools+'</div><footer><button aria-label="Back to city" onclick="go(\'home\')">‹</button><div class="trail-next"><button class="spirit-gold" onclick="startExploreFight('+cleared+')" '+(power<required?'disabled':'')+'>Fight Boss</button><small>Power needed for the next stage</small><strong class="'+(power<required?'trail-low':'trail-ready')+'">'+fmt(power)+' / '+fmt(required)+'</strong></div>'+exploreTool('Power Up','hud-reinforce','cityForge')+'</footer></section>';
}

const cloudFactions=[
 ['Galewing','Galehaven','Windwatch','#67dfd9'],
 ['Embercrest','Emberhold','Cinderwatch','#ffa2a6'],
 ['Moonveil','Moonspire','Dusk Watch','#dab6ff'],
 ['Thornhart','Thornhaven','Briar Watch','#a5edb0']
];
// Each row places the capital, two strongholds, then three outposts.
const cloudLayouts={
 2:[
  [[16,50],[27,18],[26,77],[12,31],[12,66],[39,85]],
  [[84,50],[73,18],[74,77],[88,31],[88,66],[61,85]]
 ],
 3:[
  [[17,20],[32,16],[10,34],[43,15],[20,27],[6,43]],
  [[83,20],[68,16],[90,34],[57,15],[80,27],[94,43]],
  [[50,81],[19,68],[81,68],[12,52],[88,52],[67,77]]
 ],
 4:[
  [[50,20],[30,19],[70,19],[17,21],[40,13],[81,21]],
  [[86,50],[88,35],[87,62],[90,28],[78,54],[82,69]],
  [[50,86],[30,75],[71,75],[16,69],[42,78],[62,78]],
  [[14,50],[12,35],[13,62],[10,28],[22,48],[22,56]]
 ]
};
const cloudRanks=['Capital','Stronghold','Stronghold','Outpost','Outpost','Outpost'];
const cloudDefenders={
 Outpost:['Guard','Guard','Guard'],
 Stronghold:['Guard','Elite','Guard','Elite','Guard'],
 Capital:['Guard','Elite','Guard','Boss','Guard','Elite','Guard']
};
let cloudCount=3;
function cloudTerritories(){
 return cloudLayouts[cloudCount].flatMap((points,i)=>{
  const [owner,capital,fort,color]=cloudFactions[i];
  const names=[capital,fort,owner+' Keep',owner+' Lookout',owner+' Camp',owner+' Gate'];
  return points.map(([x,y],j)=>({owner,color,x,y,name:names[j],rank:cloudRanks[j]}));
 });
}
function cloudTerritory(index){
 const place=cloudTerritories()[index];
 const portraits=cloudDefenders[place.rank].map((role,i)=>'<span>'+artImage('guardian-t'+(7+i),'')+'<small>'+role+'</small></span>').join('');
 modal('<h2>'+place.name+'</h2><p>'+place.rank+' · '+place.owner+'</p><div class="cloud-guards">'+portraits+'</div><h3>Killing Rewards</h3><p>Territory points · 30</p>'+dailyTokens(['hud-prisms','hud-gems','gear-armor-t6']));
}
function cloudBrief(page){
 const names=['3-Faction War','2-Faction War','4-Faction War','Twin Sanctum','Four Sanctums'];
 const descriptions=['Three capitals command the sky roads.','Two factions compete for the sky island.','Four factions defend their own capitals.','Four factions contest two holy cities.','Four factions contest four holy cities.'];
 const days=[null,10,14,50,90];
 const body='<h2>'+names[page]+'</h2><p>'+descriptions[page]+'</p>'+(days[page]?'<p>Opens on server day '+days[page]+'</p>':'')+(page<3?'<p>Each faction holds three outposts, two strongholds and one capital.</p>':'')+'<div class="cloud-brief-tabs">'+names.map((n,i)=>'<button aria-pressed="'+(i===page)+'" onclick="cloudBrief('+i+')">'+n+'</button>').join('')+'</div>';
 if($('#modal').open)$('#modalBody').innerHTML=body;else modal(body);
}
function cityCloudWar(){
 const nodes=cloudTerritories();
 const symbols={Capital:'♛',Stronghold:'♜',Outpost:'⚑'};
 const markers=nodes.map((p,i)=>`<button class="cloud-place" data-rank="${p.rank}" aria-label="${p.owner}: ${p.name}, ${p.rank}" title="${p.name} · ${p.rank}" style="left:${p.x}%;top:${p.y}%;--banner:${p.color}" onclick="cloudTerritory(${i})"><span class="map-token" aria-hidden="true">${symbols[p.rank]}</span></button>`).join('');
 $('#main').innerHTML='<section class="cloud-war"><div class="cloud-heading"><strong>Cloud War</strong><small>Battle starts at 19:30</small></div><div class="cloud-tabs" role="group" aria-label="Faction count">'+[2,3,4].map(n=>'<button aria-pressed="'+(cloudCount===n)+'" onclick="cloudCount='+n+';cityCloudWar()">'+n+' Factions</button>').join('')+'</div><div class="cloud-field map-'+cloudCount+'"><div class="cloud-map-plane">'+markers+'</div></div><div class="cloud-actions"><button aria-label="Back to city" onclick="go(\'home\')">‹</button><button onclick="cloudBrief('+[3,2,4].indexOf(cloudCount)+')">War Guide</button></div></section>';
}

let eliteTab=0,eliteHero='reina';
function eliteStore(){
 const sale=activeFashionSale(),set=partyWardrobe[sale.hero];
 const tabs=['Outfit Pack','Weapon Pack','Chat Bubble Pack'];
 const names=[['Outfit Pack','Hair Accessory Pack'],['Weapon Pack'],['Chat Bubble Pack','Avatar Pack']][eliteTab];
 const hero=dressedHero(eliteHero,set.id,set.outfit);
 const previews=[[hero,'<div class="elite-hair">'+hero+'</div>'],[artImage('gear-bow-t'+sale.tier,set.outfit+' bow')],['<span class="elite-bubble">Hello!</span>','<span class="elite-frame">'+artImage('reina-avatar','Avatar frame')+'</span>']][eliteTab];
 const select='<label>Try on <select onchange="eliteHero=this.value;eliteStore()">'+[['reina','Reina'],...Object.entries(partyWardrobe).map(([id,v])=>[id,v.label])].map(([id,name])=>'<option value="'+id+'" '+(eliteHero===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>';
 const cards=names.map((name,i)=>{
  const action=name==='Outfit Pack'?'<button onclick="wardrobe(eliteHero,partyWardrobe[activeFashionSale().hero].id)">Try on · All classes</button>':name==='Weapon Pack'?'<button onclick="fashionSale()">Bow upgrades</button>':'';
  return '<article><div class="elite-art">'+previews[i]+'</div><div class="elite-price"><h3>'+name+'</h3><p>'+artImage('crystal','Crystals')+'680</p><del>€31.99</del><strong>€10.99 · Preview</strong>'+action+'</div></article>';
 }).join('');
 $('#main').innerHTML='<section class="elite-store"><header><small>'+set.outfit+' Collection</small><h1>Fashion Elite Sale</h1><span>Rotation ends '+new Date(sale.end).toISOString().slice(0,10)+' UTC</span>'+(eliteTab===0?select:'')+'</header><div class="elite-cards">'+cards+'</div><nav><button aria-label="Back to city" onclick="go(\'home\')">‹</button>'+tabs.map((t,i)=>'<button aria-pressed="'+(i===eliteTab)+'" onclick="eliteTab='+i+';eliteStore()">'+t+'</button>').join('')+'</nav></section>';
}
