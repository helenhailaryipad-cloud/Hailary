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
function bag(){const r=eqRules(),eq=r.state(S),st=stats(),d=item(S.dragon),w=item(S.wings);renderHeroReadout(st);const half=(start)=>r.slots.slice(start,start+5).map(slot=>`<div class="doll-slot">${loadoutCell(eq,slot)}<small>${slot.name}</small></div>`).join('');$('#main').innerHTML=`<div class="bag-top"><div><p class="eyebrow">YOUR EQUIPMENT</p><h1>Equipment</h1></div><button onclick="go('home')">← Hero</button></div>${sectionArtwork('scene-equipment','Enchanted equipment and upgrade crystals')}<div class="bag-layout"><section class="doll-panel"><div class="doll-left">${half(0)}</div><div class="bag-doll"><div class="bag-wings" data-tier="${visualTier(w)}">${wingArt(w)}</div><img class="bag-avatar" src="${artPath(equippedRanger())}" alt="Your equipped ranger"><div class="bag-pet" data-tier="${visualTier(d)}">${dragonSVG(d)}</div></div><div class="doll-right">${half(5)}</div></section><div class="equipment-companions"><button class="equip-special" onclick="filter='wings';openScreen('collection')"><span class="tiny-art">${wingArt(w)}</span><span class="companion-caption"><small>Wings</small><strong>${w.name}</strong></span><b>›</b></button><div class="doll-actions"><button onclick="autoEquipBest()">Equip best</button><button onclick="openHeroStats()">All stats</button></div><button class="equip-special" onclick="filter='dragon';openScreen('collection')"><span class="tiny-art">${dragonSVG(d)}</span><span class="companion-caption"><small>Pet · Lv. ${WonderGear.petLevel(S,d.id)}</small><strong>${d.name}</strong></span><b>›</b></button></div><section class="inventory-panel"><div class="inventory-head"><h2>Your treasures</h2><span>${eq.items.length} equipment pieces</span></div><div class="inventory-materials">${r.materialDefs.map(m=>`<button class="material-summary" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b></button>`).join('')}</div><div class="tabs bag-tabs">${[['gear','Gear'],['materials','Materials'],['all','All']].map(([id,label])=>`<button class="${bagTab===id?'active':''}" onclick="bagTab='${id}';bag()">${label}</button>`).join('')}</div><div class="inventory-scroll"><div class="inventory-grid" id="inventoryGrid">${inventoryMarkup(eq)}</div></div><div class="inventory-footer"><button onclick="equipBasicGear()">Equip basic T1</button><span>Tap any item to compare or enhance.</span><div class="row"><button onclick="bagSort=bagSort==='slot'?'power':'slot';bag()">Sort: ${bagSort==='slot'?'slot':'power'}</button>${typeof location!=='undefined'&&new URLSearchParams(location.search).get('debug')==='1'?'<button onclick="equipmentGift()">Test chest</button>':''}</div></div></section></div>`}
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
function refreshEquipmentSurface(){if(['inventory','forge','warehouse'].includes(screen))gearWorkspace();else if(screen==='bag')bag();else if(screen==='home')home();wallet()}
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
 $('#main').innerHTML=`<section class="character-folio"><div class="folio-portrait"><img src="${artPath(equippedRanger())}" alt="REINA"><h1>${esc(S.name)}</h1><strong>Level ${level()} · ${fmt(st.power)} Power</strong></div><div id="heroAttributes">${heroAttributesMarkup('basic',st)}</div></section>`;
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
