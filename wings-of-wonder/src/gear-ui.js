'use strict';
let bagTab='gear',bagSort='slot',gearActionLock=false;
const eqRules=()=>globalThis.WonderGear;
function equipmentStamp(e){return [e.template,e.enhance,e.stars,e.gems].join(':')}
function equipmentIcon(index,extra=''){return `<span class="equipment-art ${extra}" style="--icon-x:${(index%4)*100/3}%;--icon-y:${Math.floor(index/4)*50}%"></span>`}
function gearArt(template){
  return `<img class="gear-illustration" alt="" src="assets/generated/gear-${template.slot}-t${eqRules().artTier(template.tier)}.webp?v=4">`;
}
function equipmentCell(entry,{compact=false,equipped=false,warehouse=false,forge=false,act=null,pressed=null}={}){const r=eqRules(),t=r.catalog[entry.template],q=r.gearRanks[r.gearRank(entry)];
 const action=act?act:forge?`selectForgePiece(${entry.uid})`:warehouse?`transferGear(${entry.uid},${!entry.stored})`:`openEquipment(${entry.uid})`;
 const purpose=warehouse?(entry.stored?'Withdraw ':'Deposit '):'';
 return `<button data-tier="${t.tier}" data-stars="${entry.stars}" class="equipment-cell rarity-${t.grade} q-${q.id} slot-${t.slot} ${equipped?'is-worn':''} ${compact?'compact-cell':''}" style="--rarity:${q.color}" aria-label="${purpose}${t.name}, Tier ${t.tier}, ${entry.stars} stars, ${q.name}, enhance ${entry.enhance}${equipped?', equipped':''}" ${pressed===null?'':'aria-pressed="'+pressed+'"'} onclick="${action}"><span class="gear-tier">T${t.tier}</span>${entry.stars?`<span class="gear-stars">${uiIcon('star','badge-icon')}${entry.stars}</span>`:''}${gearArt(t)}${entry.enhance>0?`<span class="gear-enhance">+${entry.enhance}</span>`:''}${equipped?`<span class="worn-dot">${uiIcon('check','badge-icon')}</span>`:''}${entry.gems?`<span class="gear-gems ${equipped?'worn-gems':''}">${uiIcon('gem','badge-icon')}${entry.gems}</span>`:''}</button>`}
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
function bag(){const r=eqRules(),eq=r.state(S),st=stats(),d=item(S.dragon),w=item(S.wings);renderHeroReadout(st);const half=(start)=>r.slots.slice(start,start+5).map(slot=>`<div class="doll-slot">${loadoutCell(eq,slot)}<small>${slot.name}</small></div>`).join('');$('#main').innerHTML=`<div class="bag-top"><div><p class="eyebrow">YOUR EQUIPMENT</p><h1>Equipment</h1></div><button onclick="go('home')">Hero</button></div>${sectionArtwork('scene-equipment','Enchanted equipment and upgrade crystals')}<div class="bag-layout"><section class="doll-panel"><div class="doll-left">${half(0)}</div><div class="bag-doll"><div class="bag-wings" data-tier="${visualTier(fashionWing())}">${wingArt(fashionWing())}</div><img class="bag-avatar" src="${reinaLookPath(false)}" alt="Your equipped ranger"><div class="bag-pet" data-tier="${visualTier(d)}">${dragonSVG(d)}</div></div><div class="doll-right">${half(5)}</div></section><div class="equipment-companions"><button class="equip-special" onclick="filter='wings';openScreen('collection')"><span class="tiny-art">${wingArt(w)}</span><span class="companion-caption"><small>Wings</small><strong>${w.name}</strong></span><b>›</b></button><div class="doll-actions"><button onclick="autoEquipBest()">Equip best</button><button onclick="openHeroStats()">All stats</button></div><button class="equip-special" onclick="filter='dragon';openScreen('collection')"><span class="tiny-art">${dragonSVG(d)}</span><span class="companion-caption"><small>Pet · Lv. ${WonderGear.petLevel(S,d.id)}</small><strong>${d.name}</strong></span><b>›</b></button></div><section class="inventory-panel"><div class="inventory-head"><h2>Your treasures</h2><span>${eq.items.length} equipment pieces</span></div><div class="inventory-materials">${r.materialDefs.map(m=>`<button class="material-summary" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b></button>`).join('')}</div><div class="tabs bag-tabs">${[['gear','Gear'],['materials','Materials'],['all','All']].map(([id,label])=>`<button class="${bagTab===id?'active':''}" onclick="bagTab='${id}';bag()">${label}</button>`).join('')}</div><div class="inventory-scroll"><div class="inventory-grid" id="inventoryGrid">${inventoryMarkup(eq)}</div></div><div class="inventory-footer"><button onclick="equipBasicGear()">Equip basic T1</button><span>Tap any item to compare or enhance.</span><div class="row"><button onclick="bagSort=bagSort==='slot'?'power':'slot';bag()">Sort: ${bagSort==='slot'?'slot':'power'}</button>${typeof location!=='undefined'&&new URLSearchParams(location.search).get('debug')==='1'?'<button onclick="equipmentGift()">Test chest</button>':''}</div></div></section></div>`}
function inventoryMarkup(eq){const r=eqRules();let html='';if(bagTab!=='materials'){const items=eq.items.filter(e=>!e.stored).sort((a,b)=>bagSort==='power'?r.detail(b).power-r.detail(a).power:r.slots.findIndex(s=>s.id===r.catalog[a.template].slot)-r.slots.findIndex(s=>s.id===r.catalog[b.template].slot)||r.detail(b).power-r.detail(a).power);html+=items.map(e=>`<div class="inventory-piece">${equipmentCell(e,{equipped:r.equipped(eq,e.uid),forge:screen==='forge'})}<small>${r.catalog[e.template].name}</small></div>`).join('')}if(bagTab!=='gear')html+=r.materialDefs.map(m=>`<button class="material-cell" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" style="--rarity:${m.color}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<b>${fmt(eq.materials[m.id])}</b><small>${m.name}</small></button>`).join('');return html}
function statValue(key,value){return fmt(Math.round(value*100)/100)+(eqRules().percentKeys.has(key)?'%':'')}
function statLines(values){return Object.entries(values).filter(([,n])=>n!==0).map(([key,n])=>`<div class="gear-stat-line"><span>${statIcon(key,'stat-art')}${eqRules().labels[key]||key}</span><b>+${Number.isInteger(n)?fmt(n):n.toFixed(2)}${eqRules().percentKeys.has(key)?'%':''}</b></div>`).join('')||'<p class="gear-empty">No bonus yet.</p>'}
function equipmentCompare(eq,entry){const t=eqRules().catalog[entry.template],current=stats(),candidate=eqRules().stats({...S,equipment:{...eq,equipped:{...eq.equipped,[t.slot]:entry.uid}}});const rows=['power','attack','defense','health','crit','speed','penetration','damageBonus','damageReduction','block','expBonus','accuracy','dodge','critDamage','critResistance','shieldHealth','elementalAttack','elementalDefense'].filter(k=>candidate[k]!==current[k]).map(k=>{const diff=Math.round((candidate[k]-current[k])*100)/100;return `<div class="compare-row ${diff>0?'better':'worse'}"><span>${statIcon(k,'stat-art')}${k==='power'?'Hero Power':eqRules().labels[k]||k}</span><span>${heroStatValue(k,current)} → <b>${heroStatValue(k,candidate)}</b></span><em>${diff>0?'+':''}${Number.isInteger(diff)?fmt(diff):diff}${eqRules().percentKeys.has(k)?' pp':''}</em></div>`});return rows.length?rows:['<p class="gear-empty">Same total hero stats as your current item.</p>']}
function priceText(price){if(!price)return 'Maximum reached';const r=eqRules();return Object.entries(price).map(([key,n])=>`${fmt(n)} ${key==='gold'?'gold':r.materialDefs.find(m=>m.id===key)?.name.toLowerCase()}`).join(' + ')}
function openEquipment(uid, view='summary', page=0){
 const rules=eqRules(), eq=rules.state(S), item=eq.items.find(entry=>entry.uid===uid);
 if(!item)return;
 const detail=rules.detail(item), template=detail.template, worn=rules.equipped(eq,uid);
 const allowed=template.tier<=rules.unlockedTier(S), stamp=equipmentStamp(item), quality=rules.gearRanks[rules.gearRank(item)];
 const groups={total:'Total stats',base:'Base stats',enhancement:'Enhancement',star:'Quality bonus',perfect:'Perfect bonuses',gem:'Socketed gems'};
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
  const options=[['enhance','Enhance'],['star','Gear Crafting'],['gem','Socket gem'],['craft','Craft next tier']];
  pages=options.length;
  page=Math.max(0,Math.min(page,pages-1));
  const [action,label]=options[page],price=rules.cost(item,action);
  const locked=action==='craft'&&template.tier+1>rules.unlockedTier(S);
  const available=price&&!locked&&S.gold>=(price.gold||0)&&rules.materialDefs.every(m=>eq.materials[m.id]>=(price[m.id]||0));
  content=action==='star'?`<strong>Quality · ${quality.name}</strong><p>Finer pieces are made in Gear Crafting out of spare pieces of the quality below.</p>
   <button onclick="equipmentAction(${uid},'star','${stamp}')">Gear Crafting</button>`:`<strong>${label}</strong><p>${locked?'Requires Lv. '+rules.requiredLevel(template.tier+1):priceText(price)}</p>
   <button ${!available?'disabled':''} onclick="equipmentAction(${uid},'${action}','${stamp}')">${label}</button>`;
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
 const heading=`<div class="gear-detail-header" data-tier="${template.tier}" data-stars="${item.stars}" style="--rarity:${quality.color}">
  <div class="detail-item-icon slot-${template.slot}">${gearArt(template)}<span>T${template.tier}</span></div>
  <div class="gear-heading"><h2>${template.name}${item.enhance?' +'+item.enhance:''}</h2>
  <p>${worn?'Equipped · ':''}${quality.name} · T${template.tier}</p>
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
function refreshEquipmentSurface(){if(screen==='cityBag')cityBag();else if(screen==='cityVault')cityVault();else if(screen==='cityDevour')cityDevour();else if(['inventory','forge','warehouse'].includes(screen))gearWorkspace();else if(screen==='bag')bag();else if(screen==='home')home();wallet()}
function equipmentAction(uid,action,expected){if(gearActionLock)return;if(action==='star'){$('#modal').close();go('cityCraft');return}const eq=eqRules().state(S),entry=eq.items.find(i=>i.uid===uid);if(!entry||equipmentStamp(entry)!==expected){toast('This item changed. Open it again.');return}gearActionLock=true;try{const result=eqRules().perform(S,uid,action);if(!result.ok){toast(result.error);return}save();refreshEquipmentSurface();$('#modal').close();openEquipment(uid);toast(action==='equip'?'Item equipped':action==='craft'?'Next tier crafted. All upgrades kept.':'Equipment improved')}finally{setTimeout(()=>gearActionLock=false,220)}}
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
function bossLootPreview(id){const r=eqRules(),t=r.bossLootTables[id];if(!t)return '';const drops=r.bossDropRanks.map(n=>r.gearRanks[n]);return `<div class="boss-loot-preview"><strong>Guaranteed boss loot</strong><p>${drops.length} equipment pieces · ${r.bossGearLabel(S)} · T${r.bossGearTier(S)} wearable at Lv. ${Math.max(1,r.requiredLevel(r.bossGearTier(S)))}</p><p>${drops.map(q=>`<b style="color:${q.color}">${q.name}${q.stars?' '+q.stars+'★':''}</b>`).join(' · ')}</p><small>${t.slots.map(id=>r.slots.find(s=>s.id===id).name).join(' · ')}</small><small>Five Orange pieces make a 2-Star Red in Gear Crafting · Blue and Purple feed the Glimmer Maw</small><small>${t.stone} crystals · ${t.shard} star shards · ${t.gem} ${t.gem===1?'gem':'gems'} · ${t.essence} forge essence</small></div>`;}
// What a guardian can drop, with the real chances of the rare things.
function dungeonLoot(){
 const r=eqRules(),tier=r.bossGearTier(S);bagArtVars();
 const row=(icon,hue,name,note)=>'<div class="loot-row" style="--rarity:'+hue+'"><span>'+icon+'</span><b>'+name+'</b><em>'+note+'</em></div>';
 const piece=(n,note)=>{const q=r.gearRanks[n];return row(gearArt(r.catalog['bow-t'+tier]),q.color,q.name+' piece'+(q.stars?' · '+'★'.repeat(q.stars):''),note)};
 popup('<h2>Guardian drops</h2><p>Every victory gives three pieces of equipment'+(tier>2?' (T2–T'+tier+')':' (T'+tier+')')+' and a chest. Rare drops are rolled each time.</p><div class="loot-list">'
  +r.bossDropRanks.map(n=>piece(n,'always')).join('')+row(bagIcon('chest1'),r.bagRarity.b[1],'Oak Chest','always')
  +r.bossRare.map(x=>x.kind==='gear'?piece(x.rank,Math.round(x.chance*100)+'%'):row(bagIcon(x.id),r.bagRarity[r.bagItemById[x.id].rarity][1],r.bagItemById[x.id].name,Math.round(x.chance*100)+'%')).join('')+'</div>');
}
function bossDropMarkup(reward){
 const rare=(reward.rare||[]).map(x=>x.kind==='gear'?eqRules().gearRanks[x.rank].name+' piece':eqRules().bagItemById[x.id].name);
 const fed=(rare.length?`<p class="boss-rare">Rare drop: ${rare.join(', ')}!</p>`:'')+(reward.devoured?`<p>The Glimmer Maw ate the Blue and Purple pieces: +${fmt(reward.devoured)} essence.</p>`:'');
 if(!reward.entry)return fed;
 const r=eqRules(),eq=r.state(S),e=reward.entry,t=r.catalog[e.template],q=r.gearRanks[r.gearRank(e)],power=stats().power,next=r.stats({...S,equipment:{...eq,equipped:{...eq.equipped,[t.slot]:e.uid}}}).power,diff=next-power;
 return `<section class="boss-drop-card" style="--loot-color:${q.color}"><p class="eyebrow">BOSS EQUIPMENT FOUND</p><div class="boss-drop-row">${(reward.entries||[e]).map(x=>equipmentCell(x,{compact:true})).join('')}</div><div class="boss-drop-heading"><div><h3>${t.name}</h3><strong>${q.name} · T${t.tier}</strong><p class="loot-power">${diff>0?'+'+fmt(diff)+' hero power if equipped':diff<0?'Your equipped item is stronger.':'Same hero power. Compare its attributes.'}</p></div></div>${fed}<div class="row"><button class="primary" onclick="openEquipment(${e.uid})">Compare / Equip / Enhance</button><button onclick="$('#modal').close();openScreen('cityCraft')">Gear Crafting</button></div><small>Five Orange pieces make a 2-Star Red · Blue and Purple feed the Glimmer Maw</small></section>`;
}
function characterSheet(){
 const st=stats();
 $('#main').innerHTML=`<section class="character-folio"><div class="folio-portrait"><img src="${reinaLookPath(false)}" alt="REINA"><h1>${esc(S.name)}</h1><strong>Level ${level()} · ${fmt(st.power)} Power</strong></div><div id="heroAttributes">${heroAttributesMarkup('basic',st)}</div></section>`;
}
let forgeUid=null,forgeMode='tier',forgeDonors=[];
function setForgeMode(mode){forgeMode='tier';forgeDonors=[];gearWorkspace()}
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
  content=(screen==='forge'?`<div class="tabs">${[['tier','Raise tier']].map(([id,label])=>`<button class="${forgeMode===id?'active':''}" onclick="setForgeMode('${id}')">${label}</button>`).join('')}</div>`+forgeRecipe(pieces,eq):'')+'<div class="work-grid">'+pieces.map(card).join('')+'</div>';
  if(screen==='inventory')content+='<h2>Materials</h2><div class="work-grid">'+r.materialDefs.map(m=>`<button class="storage-slot material-cell" aria-label="${m.name}, ${fmt(eq.materials[m.id])}" onclick="materialInfo('${m.id}')">${equipmentIcon(m.icon)}<strong>${m.name}</strong><small>${fmt(eq.materials[m.id])}</small></button>`).join('')+'</div>';
 }
 $('#main').innerHTML=`<div class="topline"><h1>${titles[screen]}</h1></div><section class="gear-workspace">${content}</section>`;
}
function transferGear(uid,stored){
 const eq=eqRules().state(S),entry=eq.items.find(e=>e.uid===uid);
 if(!entry||eqRules().equipped(eq,uid)||Boolean(entry.stored)===stored)return;
 if(stored)entry.stored=true;else delete entry.stored;
 S.equipment=eq;save();refreshEquipmentSurface();
}

function reinaCharacter(records=false){
 const st=stats(),progress=WonderProgress,cap=level()===progress.maxLevel;
 const xp=cap?progress.xpPerLevel:S.xp%progress.xpPerLevel;
 const rows=[['ATK','attack'],['HP','health'],['ARP','penetration'],['DEF','defense'],['Accuracy','accuracy'],['Dodge','dodge'],['Crit','crit'],['RSL','critResistance'],['Shield HP','shieldHealth'],['Sparring Point','sparWins']];
 const attributes=rows.map(([label,key])=>`<div>${statIcon(key==='sparWins'?'attack':key,'stat-art')}<span>${label}</span><b>${key==='sparWins'?fmt(S.sparWins||0):heroStatValue(key,st)}</b></div>`).join('');
 const history=[['Dungeon victories',S.dungeonWins],['Sparring victories',S.sparWins],['Castle Defense victories',S.defenseWins],['Best Dragon Merge score',S.mergeBest]];
 $('#main').innerHTML=`<section class="reina-sheet"><header><strong>${records?'Achievements':'Character'}</strong><h1>Lv. ${level()} &nbsp;${esc(S.name)}</h1></header>
 <div class="reina-display"><div class="reina-plinth"></div><div class="reina-sheet-wings">${artImage(S.wings,'')}</div><img class="reina-figure" src="${reinaLookPath(false)}" alt="Reina"><div class="reina-familiar">${dragonSVG(item(S.dragon))}</div>
 <aside><button onclick="openTitles('character')">${uiIcon('laurel')}Title${typeof titleDue==='function'&&titleDue()?'<em class="reina-dot"></em>':''}</button><button onclick="go('profile')">${uiIcon('hero')}Profile</button><button onclick="go('fashion')">${uiIcon('equipment')}Fashion</button><button onclick="go('settings')">${uiIcon('settings')}Settings</button></aside></div>
 <button class="reina-power" aria-label="Combat power and all attributes" onclick="openHeroStats()">${statIcon('power')}${fmt(st.power)}</button>
 <section class="reina-values">${records?`<div class="reina-records">${history.map(([name,n])=>`<div>${name}<b>${fmt(n||0)}</b></div>`).join('')}</div>`:`<div class="reina-exp"><b>EXP</b><div role="progressbar" aria-label="Level experience" aria-valuenow="${xp}" aria-valuemax="${progress.xpPerLevel}"><i style="width:${100*xp/progress.xpPerLevel}%"></i><span>${cap?'MAX':xp+' / '+progress.xpPerLevel}</span></div></div><div class="reina-grid">${attributes}</div><button class="reina-details" onclick="openHeroStats()">All attributes ›</button>`}</section>
 <div class="reina-sheet-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button><button aria-pressed="${!records}" onclick="reinaCharacter()">${uiIcon('hero')}Character</button><button aria-pressed="${records}" onclick="reinaCharacter(true)">${uiIcon('laurel')}Achievements</button></div></section>`;
}

let cityBagFilter='Common',cityBagOrder='slot',vaultSel='',vaultTab='Common',vaultOrder='slot',devourPicks=[];
const bagUseMany=50,bagPetCapacity=100;
function cityBagPick(mode){
 const r=eqRules(),eq=r.state(S),spares=mode==='Convert';
 const choices=eq.items.filter(e=>!e.stored&&(spares?!e.starter&&!r.equipped(eq,e.uid):r.equipped(eq,e.uid)));
 const pick=e=>{
  const action=spares?`confirmSalvage(${e.uid})`:`openEquipment(${e.uid},'upgrades',${mode==='Gem'?2:mode==='Star'?1:0})`;
  return `<button aria-label="${r.catalog[e.template].name}" onclick="${action}">${gearArt(r.catalog[e.template])}</button>`;
 };
 modal(`<h2>${mode}</h2><p>${spares?'Select spare gear to convert into materials.':'Choose equipped gear.'}</p><div class="satchel-choice">${choices.map(pick).join('')||'No eligible equipment.'}</div>`);
}
// ---- Bag contents: stacks, materials and pet items next to the equipment -------------------------------------------
function bagArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--bag-items'))return;root.style.setProperty('--bag-items','url("'+artPath('comp-bag-items')+'")')}
const bagIcon=id=>{const n=WonderGear.bagItems.findIndex(i=>i.id===id);return '<i class="bag-ico" style="background-position:'+(n%4)/3*100+'% '+Math.floor(n/4)/3*100+'%"></i>'};
const bagHue=k=>WonderGear.bagRarity[k][1];
const bagNum=n=>n>=1e4?new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n):String(n);
const bagNotes={stone:'Used to enhance equipment. Earn crystals in dungeons and mini-games.',shard:'Used to add stars to equipment and pets. Earn shards from dungeon and Castle Defense victories.',gem:'Socket into equipment for attack, piercing, health or defense. Earn gems by clearing dungeons.',synthesis:'Needed to craft the next equipment tier. Earn up to two per day from the Forge keeper, or buy one in Gear Crafting.',essence:'Crafts the next equipment tier while keeping all upgrades. Earn essence from dungeon bosses.'};
const bagTabs=['Common','Materials','Pet','ALL'],vaultTabs=['Common','Materials','ALL'];
// What one tab holds, as tiles. where: 'bag' or 'vault'; petTab: the view has its own Pet tab.
function bagThings(tab,where='bag',petTab=true,order='slot'){
 const r=WonderGear,eq=r.state(S),vault=where==='vault',out=[],all=tab==='ALL';
 const stack=(key,icon,n,hue,name,rank=0)=>out.push({key,n,hue,name,rank,html:icon+'<b>'+bagNum(n)+'</b>'});
 const items=want=>{for(const i of r.bagItems){const n=vault?r.vaultCount(S,'i:'+i.id):r.bagCount(S,i.id);if(n&&want(i))stack('i:'+i.id,bagIcon(i.id),n,bagHue(i.rarity),i.name,'bpor'.indexOf(i.rarity))}};
 if(tab==='Common'||all){
  items(i=>all||!petTab||!i.pet);
  const gear=eq.items.filter(e=>vault?e.stored:!e.stored&&!r.equipped(eq,e.uid)).sort((a,b)=>order==='power'?r.detail(b).power-r.detail(a).power:r.slots.findIndex(s=>s.id===r.catalog[a.template].slot)-r.slots.findIndex(s=>s.id===r.catalog[b.template].slot)||a.uid-b.uid);
  for(const e of gear)out.push({key:'g:'+e.uid,gear:e,name:r.catalog[e.template].name,rank:r.catalog[e.template].grade});
 }
 if(tab==='Materials'||all){
  for(const m of r.materialDefs){const n=vault?r.vaultCount(S,'m:'+m.id):eq.materials[m.id];if(n>0)stack('m:'+m.id,equipmentIcon(m.icon),n,m.color,m.name,1)}
  if(!vault){const t=r.talentState(S);if(t.seals>0)stack('t:seals',denIcon('misc',0,4,1),t.seals,bagHue('p'),'Talent Seal',1);if(t.books>0)stack('t:books',denIcon('misc',1,4,1),t.books,bagHue('o'),'Prophecy Book',2)}
 }
 if((tab==='Pet'||all)&&!vault){
  if(tab==='Pet')items(i=>i.pet);
  for(const p of r.familiars){const n=r.petSpares(S,p.id);if(n)out.push({key:'p:'+p.id,n,hue:bagHue({Common:'b',Rare:'p',Epic:'o'}[p.rarity]||'r'),name:p.name,rank:2,html:'<img src="'+petPicture(p)+'" alt=""><em class="bag-bar"><u style="width:'+Math.min(100,n/r.synthNeed*100)+'%"></u><span>'+n+'/'+r.synthNeed+'</span></em>'})}
  if(S.emberShards>0)stack('t:ember',uiIcon('gem'),S.emberShards,bagHue('r'),'Ember Shard',3);
 }
 return order==='power'?out.map((t,i)=>[t,i]).sort((a,b)=>b[0].rank-a[0].rank||a[1]-b[1]).map(x=>x[0]):out;
}
function bagTile(t,click,pressed=null){
 if(t.gear)return equipmentCell(t.gear,{act:click,pressed});
 return `<button class="satchel-stack bag-tile" style="--rarity:${t.hue}" aria-label="${esc(t.name)}, ${t.n}" ${pressed===null?'':'aria-pressed="'+pressed+'"'} onclick="${click}">${denPlain}${t.html}</button>`;
}
function bagPad(cells,least=18){while(cells.length<least||cells.length%6)cells.push('<span class="bag-empty"></span>');return cells.join('')}
function bagCard(icon,hue,name,type,have,text,buttons=''){
 popup('<div class="den-item"><div class="den-item-head bag-head" style="--rarity:'+hue+'">'+icon+'<div><b>'+esc(name)+'</b><small>Type: <u>'+type+'</u></small><small>You have: '+fmt(have)+'</small></div></div><h3>◆ Item Description</h3><p>'+text+'</p>'+(buttons?'<div class="den-actions">'+buttons+'</div>':'')+'</div>');
}
function bagOpen(key){
 const r=WonderGear,id=key.slice(2),gold=(label,action)=>'<button class="den-gold" onclick="'+action+'">'+denPlain+label+'</button>';
 if(key[0]==='i'){const i=r.bagItemById[id],n=r.bagCount(S,id);if(!i||!n)return;const many=Math.min(n,bagUseMany);
  bagCard(bagIcon(id),bagHue(i.rarity),i.name,i.kind,n,i.text,gold('Use',"bagUse('"+id+"',1)")+(many>1?gold('Use '+many,"bagUse('"+id+"',"+many+")"):''))}
 else if(key[0]==='m'){const m=r.materialDefs.find(m=>m.id===id);if(m)bagCard(equipmentIcon(m.icon),m.color,m.name,'Material',r.state(S).materials[id],bagNotes[id])}
 else if(key==='t:seals')bagCard(denIcon('misc',0,4,1),bagHue('p'),'Talent Seal','Pet material',r.talentState(S).seals,'Pays for learning pet talents and for scrolls in the Talent Shop. Dungeon guardians and Jungle Trek chests give seals.',gold('Pet Talent',"$('#modal').close();go('cityPet');talentGo(0)"));
 else if(key==='t:books')bagCard(denIcon('misc',1,4,1),bagHue('o'),'Prophecy Book','Pet material',r.talentState(S).books,'Shows which talent Learn would inscribe before you decide to keep it.',gold('Pet Talent',"$('#modal').close();go('cityPet');talentGo(0)"));
 else if(key==='t:ember')bagCard(uiIcon('gem'),bagHue('r'),'Ember Shard','Pet material',S.emberShards||0,'Raises the stars of the Ember Drake. Every dungeon victory gives ten.');
 else if(key[0]==='p'){const p=r.familiars.find(p=>p.id===id);if(p)bagCard('<img src="'+petPicture(p)+'" alt="">',bagHue({Common:'b',Rare:'p',Epic:'o'}[p.rarity]||'r'),p.name,p.rarity+' pet copy',r.petSpares(S,id),'A spare copy of a pet Reina already has. Six copies of one rarity can be synthesized into a pet of the next rarity.',gold('Synthesize',"$('#modal').close();go('cityPet');petTab('Synthesize')"))}
}
function bagGain(g){
 const r=WonderGear,cell=(icon,n,name,hue='#58b7ff')=>'<span class="bag-gain" style="--rarity:'+hue+'">'+icon+(n?'<b>+'+bagNum(n)+'</b>':'')+'<small>'+esc(name)+'</small></span>';
 if(g.kind==='gold')return cell(uiIcon('gold'),g.n,'Gold',bagHue('o'));
 if(g.kind==='xp')return cell(uiIcon('exp'),g.n,'XP');
 if(g.kind==='tickets')return cell(uiIcon('wishes'),g.n,'Wishes',bagHue('p'));
 if(g.kind==='seals')return cell(denIcon('misc',0,4,1),g.n,'Talent seals',bagHue('p'));
 if(g.kind==='stamina')return cell(bagIcon('stam'),g.n,'Boss stamina');
 if(g.kind==='material'){const m=r.materialDefs.find(m=>m.id===g.id);return cell(equipmentIcon(m.icon),g.n,m.name,m.color)}
 if(g.kind==='item'){const i=r.bagItemById[g.id];return cell(bagIcon(g.id),g.n,i.name,bagHue(i.rarity))}
 if(g.kind==='gear'){const t=r.catalog[g.template];return cell(gearArt(t),0,'T'+t.tier+' '+t.name,t.color)}
 if(g.kind==='pet'){const p=r.familiars.find(p=>p.id===g.id);return cell('<img src="'+petPicture(p)+'" alt="">',0,p.name+(g.spare?' (copy)':''),bagHue('o'))}
 return '';
}
function bagUse(id,count){
 const r=WonderGear,result=r.useBagItem(S,id,count);
 if(!result.ok){toast(result.error);return}
 save();$('#modal').close();refreshEquipmentSurface();
 const left=r.bagCount(S,id);
 popup('<h2>You received</h2><div class="bag-gains">'+result.gains.map(bagGain).join('')+'</div>'+(left?'<div class="den-actions"><button class="den-gold" onclick="bagUse(\''+id+'\',1)">'+denPlain+'Use another · '+left+' left</button></div>':''));
}
const satchelWallet=()=>[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([icon,n])=>`<span>${uiIcon(icon)}${new Intl.NumberFormat('en',{notation:'compact'}).format(n)}</span>`).join('');
function cityBag(){
 const r=eqRules(),eq=r.state(S),pet=item(S.dragon);bagArtVars();petArtVars();
 const rails=start=>r.slots.slice(start,start+5).map(slot=>loadoutCell(eq,slot)).join('');
 const things=bagThings(cityBagFilter,'bag',true,cityBagOrder),petTab=cityBagFilter==='Pet';
 $('#main').innerHTML=`<section class="satchel"><div class="satchel-top"><strong>Bag</strong>${satchelWallet()}</div><h1>Lv. ${level()} &nbsp;${esc(S.name)}</h1>
 <div class="satchel-stage"><div class="satchel-rail">${rails(0)}</div><div class="satchel-model"><div class="satchel-wings">${artImage(S.wings,'')}</div><img src="${reinaLookPath(false)}" alt="Reina"></div><div class="satchel-rail">${rails(5)}</div></div>
 <div class="satchel-actions"><button aria-label="Equipped wings" onclick="chooseSectionPage('wings')">${artImage(S.wings,'')}</button>${[['gem','Gem'],['star','Star'],['equipment','Enhance']].map(([i,n])=>`<button onclick="cityBagPick('${n}')">${uiIcon(i)}${n}</button>`).join('')}<button aria-label="Equipped pet" onclick="selectedPetId=S.dragon;chooseSectionPage('collection')">${dragonSVG(pet)}</button></div>
 <div class="satchel-tabs">${bagTabs.map(t=>`<button aria-pressed="${t===cityBagFilter}" onclick="cityBagFilter='${t}';cityBag()">${denPlain}${t}</button>`).join('')}</div>
 <div class="satchel-scroll"><div class="satchel-grid">${bagPad(things.map(t=>t.gear?equipmentCell(t.gear):bagTile(t,"bagOpen('"+t.key+"')")))}</div></div>
 <div class="satchel-foot"><span>Capacity: ${petTab?things.length+'/'+bagPetCapacity:r.bagUsed(S)+'/'+r.bagCapacity}</span><button onclick="cityBagPick('Convert')">Convert</button><button onclick="go('cityDevour')">Devour</button><button onclick="cityBagOrder=cityBagOrder==='slot'?'power':'slot';cityBag();toast(cityBagOrder==='power'?'Sorted by rarity':'Sorted by kind')">Sort</button></div>
 ${satchelNav('Bag')}</section>`;
}
// ---- Warehouse: the first tap chooses a thing, the second tap on it moves it ---------------------------------------
function vaultTap(side,key){
 const mark=side+'|'+key;
 if(vaultSel!==mark){vaultSel=mark;cityVault();return}
 vaultShift();
}
function vaultShift(){
 const r=WonderGear,[side,key]=vaultSel.split('|');let done=false;
 if(key?.[0]==='g'){const eq=r.state(S),e=eq.items.find(x=>x.uid===Number(key.slice(2)));if(e&&!r.equipped(eq,e.uid)){if(e.stored)delete e.stored;else e.stored=true;S.equipment=eq;done=true}}
 else if(key)done=r.vaultMove(S,key,side==='b');
 vaultSel='';if(done)save();cityVault();
}
function cityVault(){
 const r=WonderGear;bagArtVars();petArtVars();
 const stored=bagThings('ALL','vault',false,vaultOrder),mine=bagThings(vaultTab,'bag',false,cityBagOrder).filter(t=>!t.key.startsWith('t:'));
 const tile=side=>t=>bagTile(t,"vaultTap('"+side+"','"+t.key+"')",vaultSel===side+'|'+t.key);
 const picked=[...stored.map(t=>['v',t]),...mine.map(t=>['b',t])].find(([side,t])=>side+'|'+t.key===vaultSel);
 if(!picked)vaultSel='';
 $('#main').innerHTML=`<section class="satchel vault"><div class="satchel-top"><strong>Warehouse</strong>${satchelWallet()}</div>
 <div class="satchel-scroll"><div class="satchel-grid">${bagPad(stored.map(tile('v')))}</div></div>
 <div class="vault-hint">${picked?`<span><b>${esc(picked[1].name)}</b></span><button onclick="vaultShift()">${picked[0]==='v'?'Withdraw':'Deposit'}</button>`:'<span>Double tap the item to deposit or withdraw</span>'}<button onclick="vaultOrder=vaultOrder==='slot'?'power':'slot';cityVault()">Warehouse Sort</button></div>
 <div class="satchel-tabs">${vaultTabs.map(t=>`<button aria-pressed="${t===vaultTab}" onclick="vaultTab='${t}';cityVault()">${denPlain}${t}</button>`).join('')}</div>
 <div class="satchel-scroll"><div class="satchel-grid">${bagPad(mine.map(tile('b')))}</div></div>
 <div class="satchel-foot"><span>Capacity: ${r.bagUsed(S)}/${r.bagCapacity}</span><button onclick="cityBagOrder=cityBagOrder==='slot'?'power':'slot';cityVault()">Sort</button></div>
 ${satchelNav('Warehouse')}</section>`;
}
// ---- Devour: spare equipment feeds the Glimmer Maw ------------------------------------------------------------------
function devourToggle(uid){devourPicks=devourPicks.includes(uid)?devourPicks.filter(x=>x!==uid):[...devourPicks,uid];cityDevour()}
// The quick button only picks Blue and Purple pieces: Orange and finer are crafting stock.
const devourFood=()=>WonderGear.devourable(S).filter(e=>WonderGear.gearRank(e)<2).map(e=>e.uid);
function devourAll(){const food=devourFood();devourPicks=food.length===devourPicks.length&&food.every(id=>devourPicks.includes(id))?[]:food;cityDevour()}
function devourAuto(){if(S.autoDevour)delete S.autoDevour;else S.autoDevour=true;save();cityDevour();toast(S.autoDevour?'Blue and Purple drops will go straight to the Maw.':'Auto devour is off.')}
function devourFeed(){
 const r=WonderGear,result=r.devourGear(S,devourPicks);
 if(!result.ok){toast(result.error);return}
 devourPicks=[];save();cityDevour();document.querySelector('.maw-pic')?.classList.add('chomp');
 toast('+'+fmt(result.gained)+' essence'+(result.levels?' · Glimmer Maw is now Lv. '+r.devourState(S).level:''));
}
function devourInfo(){const r=WonderGear;popup('<h2>Devour</h2><p>The Glimmer Maw eats spare equipment from the bag. Every piece gives essence: more for a higher tier, rarity, stars and enhancement.</p><p>Each Maw level gives Reina +'+r.devourStep.attack+' ATK, +'+r.devourStep.health+' HP and +'+r.devourStep.defense+' DEF for good. Stars and gems on a devoured piece come back as star shards and sky gems.</p><p>Blue and Purple pieces are its usual food: the quick button picks only those, and with Auto devour on they are eaten as soon as a guardian drops them. Orange and finer pieces are crafting stock; Relic and above cannot be devoured.</p><p>Equipped pieces, the basic set and pieces in the warehouse are never eaten.</p>')}
function cityDevour(){
 const r=WonderGear,st=r.devourState(S),bonus=r.devourBonus(S),spare=r.devourable(S),food=devourFood();
 devourPicks=devourPicks.filter(id=>spare.some(e=>e.uid===id));
 const gain=spare.filter(e=>devourPicks.includes(e.uid)).reduce((n,e)=>n+r.devourWorth(e),0),after=r.devourState({devour:st.total+gain}).level;
 const stat=(icon,label,n,step)=>`<span>${uiIcon(icon)}${label} <b>+${fmt(n)}</b>${after>st.level?`<em>+${fmt(step*(after-st.level))}</em>`:''}</span>`;
 $('#main').innerHTML=`<section class="satchel maw-room"><div class="satchel-top"><strong>Devour</strong>${satchelWallet()}</div>
 <div class="maw-stage"><button class="maw-help" aria-label="How Devour works" onclick="devourInfo()">${denPlain}?</button><img class="maw-pic" src="${artPath('comp-bag-maw')}" alt="Glimmer Maw"><div class="maw-info"><h2>Glimmer Maw <b>Lv. ${st.level}${after>st.level?' → '+after:''}</b></h2><div class="maw-bar"><i style="width:${st.need?Math.min(100,st.into/st.need*100):100}%"></i>${gain&&st.need?`<u style="width:${Math.min(100,(st.into+gain)/st.need*100)}%"></u>`:''}<span>${st.need?fmt(st.into)+(gain?' + '+fmt(gain):'')+' / '+fmt(st.need):'Highest level'}</span></div><div class="maw-stats">${stat('attack','ATK',bonus.attack,r.devourStep.attack)}${stat('health','HP',bonus.health,r.devourStep.health)}${stat('defense','DEF',bonus.defense,r.devourStep.defense)}</div><button class="maw-auto" aria-pressed="${!!S.autoDevour}" onclick="devourAuto()">${denPlain}<i></i>Auto devour</button></div></div>
 <div class="satchel-scroll">${spare.length?`<div class="satchel-grid">${bagPad(spare.map(e=>equipmentCell(e,{act:'devourToggle('+e.uid+')',pressed:devourPicks.includes(e.uid)})),12)}</div>`:'<p class="maw-none">No spare equipment in the bag. Dungeon guardians and chests drop more.</p>'}</div>
 <div class="satchel-foot"><span>Chosen: ${devourPicks.length} · +${fmt(gain)} essence</span><button onclick="devourAll()" ${food.length?'':'disabled'}>${food.length&&food.length===devourPicks.length&&food.every(id=>devourPicks.includes(id))?'Clear':'Blue & Purple'}</button><button onclick="devourFeed()" ${devourPicks.length?'':'disabled'}>Devour</button></div>
 ${satchelNav('Devour')}</section>`;
}

function satchelNav(here=''){return ` <div class="satchel-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button>${[['hud-bag','Bag',"go('cityBag')"],['hud-forge','Gear Crafting',"go('cityCraft')"],['hud-shop','Warehouse',"go('cityVault')"],['comp-bag-maw','Devour',"go('cityDevour')"]].map(([icon,n,action])=>`<button ${n===here?'aria-current="page"':''} onclick="${action}">${artImage(icon,'')}${n}</button>`).join('')}</div>`;}
// ---- Gear Crafting: pieces of one quality make one piece of the next (WonderGear.gearRanks) --------------------------
let craftRank=3,craftTier=null,craftGroup='Equipment',craftSlot=null,craftInputs=[];
function craftFilter(rank,tier,group){craftRank=rank;craftTier=tier;craftGroup=group;craftInputs=[];cityCraft()}
function craftSelect(slot){craftSlot=slot;cityCraft()}
const craftPool=()=>WonderGear.craftInputs(S,craftGroup,craftTier,craftRank);
const craftPlain=(a,b)=>a.enhance-b.enhance||a.gems-b.gems||a.uid-b.uid;
const craftSource=()=>craftRank===WonderGear.gearCraftFrom?'Orange pieces drop from dungeon guardians.':'Make them one step higher in the list on the left.';
// No uid: fill the empty places with the plainest spare pieces. A uid toggles that piece.
function craftAdd(uid){
 const r=WonderGear,pool=craftPool(),need=r.craftRecipe(craftRank).need;
 if(uid===undefined){craftInputs=[...craftInputs,...pool.filter(e=>!craftInputs.includes(e.uid)).sort(craftPlain).map(e=>e.uid)].slice(0,need);if(!craftInputs.length)toast('No spare '+r.gearRanks[craftRank-1].name+' pieces of T'+craftTier+'. '+craftSource())}
 else if(craftInputs.includes(uid))craftInputs=craftInputs.filter(x=>x!==uid);
 else if(pool.some(e=>e.uid===uid)&&craftInputs.length<need)craftInputs.push(uid);
 if($('#modal').open)$('#modal').close();
 cityCraft();
}
function craftPick(){
 const r=WonderGear,rest=craftPool().filter(e=>!craftInputs.includes(e.uid)).sort(craftPlain);
 popup('<h2>Choose a piece</h2><p>'+r.gearRanks[craftRank-1].name+' · T'+craftTier+' · '+craftGroup+'</p>'+(rest.length?'<div class="loom-pick">'+rest.map(e=>equipmentCell(e,{act:'craftAdd('+e.uid+')'})).join('')+'</div>':'<p>No more spare pieces of this kind. '+craftSource()+'</p>'));
}
function craftShow(entries){
 const r=WonderGear,e=entries[0],t=r.catalog[e.template];
 popup('<h2>Crafted</h2><div class="loom-pick">'+entries.slice(0,12).map(x=>equipmentCell(x,{act:"$('#modal').close();openEquipment("+x.uid+")"})).join('')+'</div><p>'+(entries.length>1?entries.length+' × ':'')+r.gearRanks[r.gearRank(e)].name+' · '+t.name+'</p><p>Tap the piece to compare or equip it.</p>');
}
function craftCommit(){
 const r=WonderGear,result=r.craftGear(S,craftSlot,craftTier,craftRank,craftInputs);
 if(!result.ok){toast(result.error);return}
 if(result.success)r.socialNote(S,'Crafted '+r.gearRanks[craftRank].name+' '+r.catalog[result.entry.template].name+'.');
 craftInputs=[];save();cityCraft();
 if(result.success)craftShow([result.entry]);else toast('The synthesis failed: the pieces are lost.');
}
// Batch: every full recipe the spare pieces allow, for the chosen slot.
function craftBatch(){
 const r=WonderGear,need=r.craftRecipe(craftRank).need,count=Math.floor(craftPool().length/need),t=r.catalog[craftSlot+'-t'+craftTier];
 if(!count){toast('Not enough spare pieces for one full recipe.');return}
 popup('<h2>Batch</h2><p>Make <b>'+count+' × '+r.gearRanks[craftRank].name+' '+t.name+'</b> from '+count*need+' '+r.gearRanks[craftRank-1].name+' pieces of T'+craftTier+'?</p><div class="den-actions"><button class="den-gold" onclick="craftBatchRun()">'+denPlain+'Synthesize all</button></div>');
}
function craftBatchRun(){
 const r=WonderGear,need=r.craftRecipe(craftRank).need,made=[];
 for(let guard=0;guard<60;guard++){
  const pool=craftPool().sort(craftPlain);if(pool.length<need)break;
  const result=r.craftGear(S,craftSlot,craftTier,craftRank,pool.slice(0,need).map(e=>e.uid));
  if(!result.ok||!result.success)break;made.push(result.entry);
 }
 if(!made.length)return;
 craftInputs=[];save();if($('#modal').open)$('#modal').close();cityCraft();craftShow(made);
}
function craftInfo(){
 const r=WonderGear,line=(q,n)=>{const c=r.craftRecipe(n);return '<p><b style="color:'+q.color+'">'+q.name+'</b> · '+(c?c.need+' × '+r.gearRanks[n-1].name+Object.entries(c.mats).map(([id,x])=>' + '+x+' '+r.materialDefs.find(m=>m.id===id).name).join(''):'dungeon guardians')+'</p>'};
 popup('<h2>Gear Crafting</h2><p>Dungeon guardians drop Blue, Purple and Orange pieces. Orange is where crafting starts; Blue and Purple feed the Glimmer Maw.</p><p>A recipe takes spare pieces of one tier and one family (any slot) and gives the piece you chose. It keeps the highest enhancement and gems of the pieces put in.</p><div class="den-tlist loom-ladder">'+r.gearRanks.map(line).join('')+'</div><p>A 2-Star Red can be tried with fewer than five pieces at a lower success rate; a failed try loses the pieces.</p>');
}
function cityCraft(){
 const r=eqRules(),eq=r.state(S);
 if(!r.craftRecipe(craftRank))craftRank=r.gearCraftFrom;
 const rank=r.gearRanks[craftRank],prev=r.gearRanks[craftRank-1],recipe=r.craftRecipe(craftRank);
 const slots=r.slots.filter(s=>r.gearGroup(s.id+'-t1')===craftGroup);
 if(!slots.some(s=>s.id===craftSlot))craftSlot=slots[0].id;
 const open=Math.min(r.maxTier,r.unlockedTier(S)),mine=eq.items.filter(e=>!e.stored&&!e.starter&&r.gearGroup(e.template)===craftGroup&&[craftRank-1,craftRank].includes(r.gearRank(e)));
 const tiers=[...new Set([open,...mine.map(e=>r.catalog[e.template].tier)])].sort((a,b)=>b-a);
 if(!tiers.includes(craftTier))craftTier=[...new Set(mine.filter(e=>r.gearRank(e)===craftRank-1).map(e=>r.catalog[e.template].tier))].sort((a,b)=>b-a)[0]??open;
 const pool=craftPool();craftInputs=craftInputs.filter(id=>pool.some(e=>e.uid===id));
 const target=r.catalog[craftSlot+'-t'+craftTier],count=craftInputs.length,chance=r.craftChance(craftRank,count),least=recipe.flex?1:recipe.need;
 const mats=Object.entries(recipe.mats),ready=chance>0&&mats.every(([id,n])=>eq.materials[id]>=n);
 const pips=q=>q.stars?'<small>'+'★'.repeat(q.stars)+'</small>':'';
 const face=(t,q)=>`<span class="loom-face q-${q.id}" style="--rarity:${q.color}">${gearArt(t)}<b>T${t.tier}</b>${pips(q)}</span>`;
 const places=Array.from({length:recipe.need},(_,i)=>{const e=pool.find(x=>x.uid===craftInputs[i]);return e?equipmentCell(e,{act:'craftAdd('+e.uid+')',pressed:true}):`<button class="loom-plus" aria-label="Add a piece" onclick="craftPick()">${denPlain}+</button>`}).join('');
 const stuff=mats.map(([id,n])=>{const m=r.materialDefs.find(m=>m.id===id),have=eq.materials[id];return `<button class="satchel-stack bag-tile" style="--rarity:${m.color}" aria-label="${m.name}, ${have} of ${n}" onclick="materialInfo('${id}')">${denPlain}${equipmentIcon(m.icon)}<b class="${have<n?'low':''}">${bagNum(have)}/${n}</b></button>`}).join('');
 $('#main').innerHTML=`<section class="satchel loom"><div class="satchel-top"><strong>Gear Crafting</strong>${satchelWallet()}</div>
 <div class="loom-body"><aside>${r.gearRanks.map((q,n)=>r.craftRecipe(n)?`<button aria-pressed="${craftRank===n}" onclick="craftFilter(${n},null,craftGroup)">${denPlain}${q.name}</button>${craftRank===n?tiers.map(t=>`<button class="loom-tier" aria-pressed="${t===craftTier}" onclick="craftFilter(craftRank,${t},craftGroup)">${denPlain}T${t} Gear</button>`).join(''):''}`:'').join('')}</aside>
 <div class="loom-work"><button class="maw-help" aria-label="How crafting works" onclick="craftInfo()">${denPlain}?</button>
 <div class="loom-orbit">${face(target,rank)}</div><h2>${rank.name} · ${target.name}</h2>
 ${chance>0?`<b class="loom-rate">Success rate: ${Math.round(chance*100)}%</b>`:`<b class="loom-rate low">At least ${least} ${least===1?'piece':'pieces'}</b>`}
 ${stuff?`<div class="loom-row">${stuff}</div>`:''}
 <div class="loom-row">${places}</div>
 <p>${count} / ${recipe.need} ${prev.name} · T${craftTier} · any ${craftGroup==='Equipment'?'equipment':craftGroup.toLowerCase()} slot${recipe.flex?'<br>The more gear added, the higher the success rate.':''}${pool.length?'':'<br>'+craftSource()}</p>
 <div class="loom-buttons">${craftRank===r.gearCraftFrom?`<button onclick="craftBatch()" ${pool.length>=recipe.need?'':'disabled'}>${denPlain}Batch</button>`:''}<button onclick="craftAdd()" ${pool.length&&count<recipe.need?'':'disabled'}>${denPlain}Add</button><button onclick="craftCommit()" ${ready?'':'disabled'}>${denPlain}Synthesize</button></div>
 <div class="loom-slots">${slots.map(s=>`<button class="loom-slot" aria-label="${r.catalog[s.id+'-t'+craftTier].name}" aria-pressed="${s.id===craftSlot}" onclick="craftSelect('${s.id}')">${denPlain}${face(r.catalog[s.id+'-t'+craftTier],rank)}<em class="${pool.length>=least?'':'low'}">${pool.length}</em></button>`).join('')}</div>
 </div></div><div class="satchel-tabs loom-kinds">${r.gearGroups.map(g=>`<button aria-pressed="${g===craftGroup}" onclick="craftFilter(craftRank,null,'${g}')">${denPlain}${g}</button>`).join('')}</div>${satchelNav('Gear Crafting')}</section>`;
}
// ---- Summon room: Basic and Advanced wells, the Mark Shop and the Summon Festival (rules: WonderGear.summon*) --------
let summonPage='Basic',summonSkip=false,markFilter='All';
function summonArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--sum-icons'))return;root.style.setProperty('--sum-icons','url("'+artPath('comp-summon-icons')+'")')}
// 0 Star Orb, 1 Rare Mark, 2 Epic Mark, 3 Royal Mark, 4 Festival token, 5 level card
const sumIcon=n=>'<i class="sum-ico" style="background-position:'+(n%3)/2*100+'% '+Math.floor(n/3)*100+'%"></i>';
const markIcon=key=>sumIcon(1+'res'.indexOf(key));
const sumChip=(icon,n,label)=>'<span title="'+label+'">'+icon+bagNum(n)+'</span>';
function summonGo(page){summonPage=page;if(screen==='citySummon')citySummon();else go('citySummon')}
function summonLeave(){if(summonPage==='Shop')summonGo('Advanced');else go('home')}
// The result window. Cards turn up one after another unless Skip is ticked.
function summonShow(title,results,note=''){
 const cards=results.map((x,i)=>'<span class="sum-card" style="animation-delay:'+(i*.13).toFixed(2)+'s">'+petCard(x.id,'',x.spare?'+1 copy':'New!')+'</span>').join('');
 popup('<div class="den-congrats'+(summonSkip?'':' sum-reveal')+'" onclick="$(\'#modal\').close()"><h2>'+title+'</h2><div class="den-picker den-summoned">'+cards+'</div>'+(note?'<p>'+note+'</p>':'')+'<small>Tap anywhere to close</small></div>');
}
function summonDo(kind,count){
 const r=WonderGear,before=r.summonState(S).marks,result=r.summonDraw(S,kind,count);
 if(!result.ok){toast(kind==='basic'?'Not enough wishes or Wish Tickets.':'Not enough prisms or Star Orbs.');return}
 if(typeof trailTick==='function')trailTick('summon',result.results.length);
 const best=result.results.find(x=>x.rarity==='Super Rare');if(best)r.socialNote(S,'Summoned a Super Rare pet: '+r.familiars.find(p=>p.id===best.id).name+'!');
 save();citySummon();
 const after=r.summonState(S).marks,gained=r.markKinds.map(([,key,name])=>after[key]>before[key]?'+'+(after[key]-before[key])+' '+name:'').filter(Boolean);
 summonShow(r.summonWells[kind].name,result.results,gained.length?'Spirit Marks: '+gained.join(' · '):'');
}
function summonSkipToggle(){summonSkip=!summonSkip;citySummon()}
function summonOdds(kind){
 const r=WonderGear,well=r.summonWells[kind];
 popup('<h2>'+well.name+'</h2><div class="den-odds sum-odds">'+well.odds.map(([name,chance])=>'<span class="den-'+petRarity[name][1]+'"><b>'+Math.round(chance*100)+'%</b><small>'+name+'</small></span>').join('')+'</div>'
  +(kind==='basic'?'<p>One draw costs a Wish Ticket from the bag or '+well.unit+' wishes. Every Basic summon counts for the Summon Festival.</p>':'<p>One draw costs a Star Orb or '+well.unit+' prisms. Every '+r.summonPity.epic+' draws give an Epic or finer pet, every '+r.summonPity.top+' a Super Rare one. Each '+10+' draws raise the Summon Level, which opens finer pets in the Mark Shop.</p>')
  +'<p>A pet she already has becomes a spare copy and '+r.summonDupGold+' gold. Rare and finer pets leave a Spirit Mark of their rarity.</p>');
}
function markAsk(id){
 const r=WonderGear,p=r.familiars.find(p=>p.id===id),offer=r.markOffer(S,id);if(!offer)return;
 const owned=S.owned.includes(id);
 popup('<div class="den-item"><div class="den-item-head bag-head" style="--rarity:'+p.color+'"><img src="'+petPicture(p)+'" alt=""><div><b>'+esc(p.name)+'</b><small>Type: <u>'+p.rarity+' pet</u></small><small>This week: '+offer.left+' / '+r.markLimit+'</small></div></div><h3>◆ Item Description</h3><p>'+(owned?'Reina already has this pet: buying gives a spare copy for Synthesize.':'A new pet for the collection.')+' Needs Summon Lv. '+offer.need+'.</p>'
  +(offer.why?'<p class="den-why">'+offer.why+'</p>':'')+'<div class="den-actions"><button class="den-gold" onclick="markBuy(\''+id+'\')" '+(offer.why?'disabled':'')+'>'+denPlain+'Buy · '+markIcon(offer.key)+offer.price+'</button></div></div>');
}
function markBuy(id){
 const result=WonderGear.buyMarkPet(S,id);
 if(!result.ok){toast(result.error);return}
 save();$('#modal').close();citySummon();summonShow('Mark Shop',[{id,spare:result.spare}]);
}
function galaTake(n){if(WonderGear.galaClaim(S,n)){save();citySummon()}}
function galaOpen(n){
 const r=WonderGear,got=r.galaReward(S,n);if(!got)return;
 save();citySummon();
 if(got.kind==='pet')summonShow('Festival reward',[got]);else{bagArtVars();popup('<h2>Festival reward</h2><div class="bag-gains">'+bagGain(got)+'</div>')}
}
function citySummon(){
 const r=WonderGear,v=r.summonState(S),lv=r.summonLevel(S);summonArtVars();bagArtVars();
 if(!['Basic','Advanced','Shop','Gala'].includes(summonPage))summonPage='Basic';
 const tab=summonPage==='Gala'?'Gala':'Summon';
 const nav=`<div class="satchel-nav well-nav"><button data-back aria-label="Back" onclick="summonLeave()">‹</button><button ${tab==='Summon'?'aria-current="page"':''} onclick="summonGo('Basic')">${denPlain}${sumIcon(0)}Summon</button><button ${tab==='Gala'?'aria-current="page"':''} onclick="summonGo('Gala')">${denPlain}${sumIcon(4)}Summon Festival</button></div>`;
 const wishes=sumChip(uiIcon('wishes'),S.tickets,'Wishes'),prisms=sumChip(uiIcon('crystals'),S.scales,'Prisms');
 const top=(title,chips)=>`<div class="satchel-top"><strong>${title}</strong>${chips}</div>`;
 const sr=r.familiars.filter(p=>p.rarity==='Super Rare').sort((a,b)=>b.power-a.power);
 if(summonPage==='Basic'||summonPage==='Advanced'){
  const basic=summonPage==='Basic',kind=basic?'basic':'advanced',well=r.summonWells[kind];
  const draw=n=>{const pay=r.summonPay(S,kind,n);return `<button class="well-draw-${n}" onclick="summonDo('${kind}',${n})" ${pay?'':'disabled'}>${denPlain}<b>Draw ×${n}</b><small>${fmt(n*well.unit)}${basic?uiIcon('wishes'):uiIcon('crystals')} or ${n}${basic?bagIcon('wish'):sumIcon(0)}</small></button>`};
  const crowd=basic?[sr[0],...['Epic','Rare','Common','Epic','Rare'].map((rarity,i)=>r.familiars.filter(p=>p.rarity===rarity)[i*2])]:sr.slice(0,3);
  const stage=basic
   ?`<h2 class="well-title">Basic Summon</h2><p class="well-ribbon">Randomly obtain a <b>Common – Super Rare</b> pet</p><div class="well-crowd">${crowd.map((p,i)=>`<img class="crowd-${i}" src="${petPicture(p)}" alt="${esc(p.name)}">`).join('')}</div>`
   :`<h2 class="well-title">Advanced Summon</h2><button class="well-shop" onclick="summonGo('Shop')">${denPlain}${markIcon('s')}Mark Shop</button><div class="well-orbs">${crowd.map((p,i)=>`<span class="orb-${i}"><img src="${petPicture(p)}" alt="${esc(p.name)}"></span>`).join('')}</div>
    <div class="well-level"><span>Summon Level: <b>${lv.level}</b></span><i><u style="width:${lv.into/lv.need*100}%"></u><em>${lv.max?'max':lv.into+' / '+lv.need}</em></i><span class="well-card">${sumIcon(5)}<b>${lv.level}</b></span>
     <p>Guaranteed <b class="hot">Super Rare</b> after ${r.summonPity.top-v.pityS}</p><p>Guaranteed <b class="warm">Epic or higher</b> after ${r.summonPity.epic-v.pityE}</p></div>`;
  $('#main').innerHTML=`<section class="satchel well well-${kind}" style="background-image:url('${artPath(basic?'comp-summon-glade':'comp-summon-oracle')}')">
  ${top('Summon',(basic?sumChip(bagIcon('wish'),r.bagCount(S,'wish'),'Wish Tickets'):sumChip(sumIcon(0),v.orbs,'Star Orbs'))+wishes+prisms)}
  <div class="well-stage"><button class="maw-help" aria-label="Chances" onclick="summonOdds('${kind}')">${denPlain}?</button>${stage}</div>
  <div class="well-draw">${draw(1)}${draw(10)}<button class="well-skip" aria-pressed="${summonSkip}" onclick="summonSkipToggle()">${denPlain}<i></i>Skip</button></div>
  <div class="well-banners"><button class="ban-adv" aria-pressed="${!basic}" onclick="summonGo('Advanced')">${denPlain}Advanced<br>Summoning</button><button class="ban-basic" aria-pressed="${basic}" onclick="summonGo('Basic')">${denPlain}Basic<br>Summoning</button></div>
  ${nav}</section>`;
  return;
 }
 if(summonPage==='Shop'){
  const kinds=r.markKinds.filter(([rarity])=>markFilter==='All'||markFilter===rarity).reverse();
  const cards=kinds.flatMap(([rarity,key])=>r.familiars.filter(p=>p.rarity===rarity).map(p=>{const o=r.markOffer(S,p.id);
   return `<button class="shop-card den-${petRarity[rarity][1]} ${o.why?'shut':''}" aria-label="${esc(p.name)}" onclick="markAsk('${p.id}')">${denPlain}<small>Limited: ${o.left}/${r.markLimit}</small><img src="${petPicture(p)}" alt=""><b>${esc(p.name)}</b><em>${o.why&&o.why!=='Not enough marks'?o.why:S.owned.includes(p.id)?'gives a copy':'new pet'}</em><span>${markIcon(key)}${o.price}</span></button>`}));
  $('#main').innerHTML=`<section class="satchel well well-mart">
  ${top('Mark Shop',[...r.markKinds].reverse().map(([,key,name])=>sumChip(markIcon(key),v.marks[key],name)).join(''))}
  <div class="mart-banner" style="background-image:url('${artPath('comp-summon-stall')}')"><h2>Spirit Mark Shop</h2><p>Summoning Rare and finer pets leaves Spirit Marks</p><em>Restock every Monday at 00:00 UTC</em></div>
  <div class="satchel-scroll"><p class="mart-note">Summon Level <b>${lv.level}</b> · Rare from Lv. ${r.markNeed.Rare}, Epic from Lv. ${r.markNeed.Epic}, Super Rare from Lv. ${r.markNeed['Super Rare']}</p><div class="mart-grid">${cards.join('')}</div></div>
  <div class="mart-filters">${['All','Super Rare','Epic','Rare'].map(f=>`<button aria-pressed="${f===markFilter}" onclick="markFilter='${f}';citySummon()">${denPlain}${f}</button>`).join('')}</div>
  ${nav}</section>`;
  return;
 }
 const left=Math.max(0,r.galaEnds(Date.now())-Date.now()),days=Math.floor(left/864e5),hours=Math.floor(left%864e5/36e5),mins=Math.floor(left%36e5/6e4),g=v.gala;
 const gift=m=>m.item?bagIcon(m.item):'<img src="'+petPicture(m.pet==='Super Rare'?sr[0]:r.familiars.filter(p=>p.rarity===m.pet)[0])+'" alt="">';
 const miles=r.galaMilestones.map((m,n)=>{const got=g.got.includes(n),ready=!got&&g.tokens>=m.at;
  return `<button class="mile ${got?'got':ready?'ready':''}" aria-label="Reward at ${m.at} tokens" onclick="${ready?'galaOpen('+n+')':"toast('"+(got?'Already taken.':'Needs '+m.at+' Festival tokens.')+"')"}">${denPlain}<span>${gift(m)}${m.pet?'<small>'+m.pet+'</small>':m.n>1?'<small>×'+m.n+'</small>':''}</span><b>${m.at}</b></button>`}).join('');
 const order=r.galaQuests.map((q,n)=>({q,n,state:g.claimed.includes(n)?2:g.basic>=q.need?0:1})).sort((a,b)=>a.state-b.state||a.n-b.n);
 const rows=order.map(({q,n,state})=>`<div class="gala-row ${state===2?'done':''}"><h3>Perform Basic Summon ${q.need} times (<b class="${g.basic>=q.need?'ok':'low'}">${Math.min(g.basic,q.need)}</b>/${q.need})</h3><div><span class="gala-prize">${sumIcon(0)}<b>${q.orbs}</b></span><span class="gala-prize">${sumIcon(4)}<b>${q.tokens}</b></span>${state===0?`<button class="gala-claim" onclick="galaTake(${n})">${denPlain}Claim</button>`:state===1?`<button class="gala-go" onclick="summonGo('Basic')">${denPlain}Summon</button>`:'<em>Claimed</em>'}</div></div>`).join('');
 $('#main').innerHTML=`<section class="satchel well well-gala" style="background-image:url('${artPath('comp-summon-glade')}')">
 ${top('Summon Festival',sumChip(sumIcon(4),g.tokens,'Festival tokens')+sumChip(sumIcon(0),v.orbs,'Star Orbs'))}
 <div class="gala-head"><em>${days} d ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}</em><h2>Claim Star Orbs</h2><p>for the Advanced Summon: a <b>Super Rare</b> pet is guaranteed!</p><div class="well-crowd">${sr.slice(0,4).map((p,i)=>`<img class="gala-${i}" src="${petPicture(p)}" alt="${esc(p.name)}">`).join('')}</div></div>
 <div class="gala-track"><span class="gala-tokens">${sumIcon(4)}<b>${g.tokens}</b></span>${miles}</div>
 <div class="satchel-scroll gala-list">${rows}</div>
 <p class="gala-foot">Quests reset at 00:00 UTC · tokens and rewards reset when the Festival ends</p>
 ${nav}</section>`;
}

// ---- Sky Contest: Totem War (rules: WonderGear.war*). Gameplay > Sky Contest lists the modes; this room has the
// lobby, the fight and the Contest Shop. ------------------------------------------------------------------------------
let contestPage='War',warFaction=0,warGame=null,warPaid=false,warTimer=0,warFast=false;
const contestModes=[['Star Duel','One against one, by rank','#4f8fe0','guardian-t9','Duel'],['Totem War','Three factions, three totems','#3f9a62','guardian-t12',true],['Storm Brawl','Everyone for themselves','#d0553a','guardian-t20',false],['Shadow Hunt','Hunt the season boss','#7a55d0','guardian-t27',false]];
function warArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--war-icons'))return;root.style.setProperty('--war-icons','url("'+artPath('comp-war-icons')+'")')}
// 0-2 totems (Ember, Tide, Gale), 3 medal, 4-6 emblems, 7 crown
const warIcon=n=>'<i class="war-ico" style="background-position:'+(n%4)/3*100+'% '+Math.floor(n/4)*100+'%"></i>';
function contestGo(page){contestPage=page;if(page!=='Fight')warStop();if(screen==='cityContest')cityContest();else go('cityContest')}
function contestLeave(){warStop();if(contestPage==='War'||contestPage==='Duel'){go('cityGameplay');playSection=4;cityGameplay()}else contestGo('War')}
function contestList(){
 return '<div class="sky-list">'+contestModes.map(([name,note,color,art,open])=>`<button class="sky-mode ${open?'':'soon'}" style="--tone:${color}" onclick="${open?(open==='Duel'?"duelGo('Qualification')":"contestGo('War')"):"toast('"+name+" is not open yet.')"}">${denPlain}<b>${name}</b><small>${note}</small><em>${open==='Duel'?'Every two weeks · now: '+duelWindow(WonderGear.duelState(S)):open?'Open every day · '+WonderGear.contestState(S).runs+' / '+WonderGear.warRules.daily+' rewarded fights today':'Coming later'}</em>${bossArtMarkup(art)}</button>`).join('')+'</div>';
}
function warRulesShow(){const w=WonderGear.warRules;popup('<h2>Totem War</h2><p>1. Three factions of '+w.team+' fight for '+w.length/60+' minutes. Reina leads the faction you choose; the other fighters are AI adventurers.</p><p>2. Every '+w.tally+' seconds your deeds turn into points: a defeated enemy '+w.kill+', an assist '+w.assist+', a hit on an enemy totem '+w.hit+'.</p><p>3. Each totem your faction holds at that moment adds '+Math.round(w.flag*100)+'% to those points. A totem falls to the faction that damaged it most.</p><p>4. Tap a totem to send Reina there; Auto lets her choose. She fights by herself.</p><p>5. Points open quest rewards during the fight, and the final ranking gives contest medals. Rewards are paid for '+w.daily+' fights a day; later fights are practice.</p>')}
function warPrizes(items){return Object.entries(items).map(([id,n])=>'<span class="bag-gain" style="--rarity:'+bagHue(WonderGear.bagItemById[id].rarity)+'">'+bagIcon(id)+'<b>×'+n+'</b></span>').join('')}
function warRankShow(){
 const r=WonderGear;bagArtVars();let from=1;
 popup('<h2>Ranking Reward</h2><div class="war-ranks">'+r.warRanks.map(row=>{const label=row.to===from?String(from):from+'–'+row.to;from=row.to+1;return '<div><b>'+label+'</b><span class="bag-gain" style="--rarity:#ffd86b">'+warIcon(3)+'<b>×'+row.medals+'</b></span>'+warPrizes(row.items)+'</div>'}).join('')+'</div><p>Paid when the fight ends. The first place also counts as a victory on your record.</p>');
}
function warPick(n){warFaction=n;cityContest()}
function warStop(){if(warTimer){clearInterval(warTimer);warTimer=0}}
function contestEnter(){
 const r=WonderGear;warStop();warPaid=r.warStart(S);if(warPaid)save();
 warGame=r.warNew(warFaction);contestPage='Fight';cityContest();
 warTimer=setInterval(warTick,warFast?250:500);
}
function warSpeed(){warFast=!warFast;if(warTimer){clearInterval(warTimer);warTimer=setInterval(warTick,warFast?250:500)}warPaint()}
function warSend(n){const g=warGame;if(!g||g.over)return;if(n<0)WonderGear.warHero(g).order=null;else WonderGear.warOrder(g,n);warPaint()}
// One step of the fight, then the picture. The timer calls it; tests call it directly.
function warTick(){
 const r=WonderGear,g=warGame;
 if(!g||screen!=='cityContest'||contestPage!=='Fight'){warStop();return}
 if(typeof document!=='undefined'&&document.hidden)return;
 const before=g.nextTally;r.warStep(g);
 if(g.nextTally!==before&&g.lastTally)g.note={text:'+'+g.lastTally.gain+' points',until:g.time+3};
 const due=r.warQuestsDue(S,g,warPaid);
 if(due.length){if(warPaid)save();toast('Quest: '+due[due.length-1].at+' points'+(warPaid?' · reward sent to the bag':' (practice)'))}
 if(g.over){warStop();warFinish()}else warPaint();
}
function warFinish(){
 const r=WonderGear,g=warGame,result=r.warSettle(S,g,warPaid);if(!result)return;
 save();warPaint();bagArtVars();
 const st=r.warStanding(g),rows=st.list.map((f,i)=>'<div class="'+(f.hero?'me':'')+'"><b>'+(i+1)+'</b>'+warIcon(4+f.faction)+'<span>'+esc(f.name)+(f.hero?'':' <small>AI</small>')+'</span><em>'+f.points+'</em></div>').join('');
 const best=g.scores.indexOf(Math.max(...g.scores));
 popup('<div class="war-result"><h2>'+(result.rank===1?'First place!':'Rank '+result.rank+' of '+st.list.length)+'</h2><p>'+result.points+' points · '+r.warFactions[best].name+' leads with '+g.scores[best]+'</p>'
  +(result.prize?'<div class="bag-gains"><span class="bag-gain" style="--rarity:#ffd86b">'+warIcon(3)+'<b>×'+result.prize.medals+'</b><small>Contest medals</small></span>'+warPrizes(result.prize.items)+'</div>':'<p>Practice fight: no rewards.</p>')
  +'<div class="war-board">'+rows+'</div><div class="den-actions"><button class="den-gold" onclick="$(\'#modal\').close();contestGo(\'War\')">'+denPlain+'Continue</button></div></div>');
}
function warClock(n){n=Math.max(0,Math.ceil(n));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')}
// Moves what is already on the field; the markup itself is written once by cityContest().
function warPaint(){
 const r=WonderGear,g=warGame;if(!g||typeof document.querySelectorAll!=='function')return;
 const q=sel=>document.querySelector(sel),hero=r.warHero(g),w=r.warRules;
 document.querySelectorAll('.tw-f').forEach((el,i)=>{const f=g.fighters[i];el.style.left=f.x+'%';el.style.top=f.y+'%';el.classList.toggle('down',f.dead>0);el.style.setProperty('--hp',Math.round(f.hp/f.maxhp*100)+'%')});
 document.querySelectorAll('.tw-totem').forEach((el,i)=>{const t=g.totems[i];el.style.setProperty('--tone',r.warFactions[t.owner].color);el.style.setProperty('--hp',Math.round(t.hp/w.totemHp*100)+'%');el.dataset.owner=t.owner;el.classList.toggle('aim',hero.order===i);el.querySelector('.war-ico').style.backgroundPosition=t.owner/3*100+'% 0%'});
 document.querySelectorAll('.tw-score b').forEach((el,i)=>el.textContent=g.scores[i]);
 const set=(sel,text)=>{const el=q(sel);if(el)el.textContent=text};
 set('.tw-time',warClock(w.length-g.time));set('.tw-next','Tally in '+Math.max(0,Math.ceil(g.nextTally-g.time))+' s');
 set('.tw-mine b',hero.points);const p=hero.pending;set('.tw-pending','This round: '+p.kills+' kills · '+p.assists+' assists · '+p.hits+' totem hits · totems ×'+(1+w.flag*r.warHeld(g,g.faction)).toFixed(1));
 const next=r.warQuests.find((x,n)=>!g.claimed.includes(n));set('.tw-quest',next?'Reach '+next.at+' points: '+Math.min(hero.points,next.at)+' / '+next.at:'All quests done');
 const bar=q('.tw-bar u');if(bar)bar.style.width=(next?Math.min(100,hero.points/next.at*100):100)+'%';
 set('.tw-log',g.note&&g.time<g.note.until?g.note.text:g.log[0]||'The fight begins');
 const auto=q('.tw-auto');if(auto)auto.setAttribute('aria-pressed',hero.order===null);
 const fast=q('.tw-fast');if(fast)fast.setAttribute('aria-pressed',warFast);
}
function contestBuy(id){
 const r=WonderGear;if(!r.buyContest(S,id)){toast('Not enough contest medals.');return}
 save();$('#modal').close();cityContest();toast(r.bagItemById[id].name+' sent to the bag');
}
function contestAsk(id){
 const r=WonderGear,i=r.bagItemById[id],ware=r.contestShop.find(w=>w.id===id),v=r.contestState(S);
 popup('<div class="den-item"><div class="den-item-head bag-head" style="--rarity:'+bagHue(i.rarity)+'">'+bagIcon(id)+'<div><b>'+i.name+'</b><small>Type: <u>'+i.kind+'</u></small><small>In the bag: '+r.bagCount(S,id)+'</small></div></div><h3>◆ Item Description</h3><p>'+i.text+'</p>'+(v.medals<ware.price?'<p class="den-why">Not enough contest medals.</p>':'')+'<div class="den-actions"><button class="den-gold" onclick="contestBuy(\''+id+'\')" '+(v.medals<ware.price?'disabled':'')+'>'+denPlain+'Buy · '+warIcon(3)+ware.price+'</button></div></div>');
}
function cityContest(){
 const r=WonderGear,v=r.contestState(S),w=r.warRules;warArtVars();bagArtVars();
 if(contestPage==='Duel'){duelRoom();return}
 if(!['War','Shop','Fight'].includes(contestPage)||contestPage==='Fight'&&!warGame)contestPage='War';
 const medals=sumChip(warIcon(3),v.medals,'Contest medals');
 if(contestPage==='Fight'){
  const g=warGame;
  $('#main').innerHTML=`<section class="satchel tw tw-fight"><div class="tw-top">${r.warFactions.map((f,i)=>`<span class="tw-score ${i===g.faction?'mine':''}" style="--tone:${f.color}">${warIcon(4+i)}<b>0</b></span>`).join('')}<span class="tw-clock"><b class="tw-time"></b><small class="tw-next"></small></span></div>
  <div class="tw-field" style="background-image:url('${artPath('comp-war-field')}')">${g.totems.map((t,i)=>`<button class="tw-totem" aria-label="${r.warFactions[i].name} totem" style="left:${t.x}%;top:${t.y}%" onpointerdown="warSend(${i})">${denPlain}<b class="tw-ring"></b>${warIcon(t.owner)}<i class="tw-hp"></i></button>`).join('')}${g.fighters.map(f=>`<span class="tw-f ${f.hero?'tw-me':''}" style="left:${f.x}%;top:${f.y}%;--tone:${r.warFactions[f.faction].color}">${portrait(['reina','nyra','kael','pip','vesper','briar','orin'][f.face])}<i class="tw-hp"></i>${f.hero?'<b>Reina</b>':''}</span>`).join('')}</div>
  <div class="tw-panel"><div class="tw-mine">${warIcon(4+g.faction)}<b>0</b><small>${warPaid?'your points':'practice'}</small><button class="tw-auto" aria-pressed="true" onpointerdown="warSend(-1)">${denPlain}Auto</button><button class="tw-fast" aria-pressed="${warFast}" onclick="warSpeed()">${denPlain}×2</button></div>
  <p class="tw-quest"></p><i class="tw-bar"><u></u></i><p class="tw-pending"></p><p class="tw-log"></p><small>Tap a totem to send Reina there</small></div>
  <div class="satchel-nav well-nav"><button data-back aria-label="Leave the fight" onclick="contestLeave()">‹</button></div></section>`;
  warPaint();return;
 }
 if(contestPage==='Shop'){
  $('#main').innerHTML=`<section class="satchel well well-mart"><div class="satchel-top"><strong>Contest Shop</strong>${medals}</div>
  <div class="mart-banner" style="background-image:url('${artPath('comp-summon-stall')}')"><h2>Contest Shop</h2><p>Contest medals come from Totem War quests and rankings</p></div>
  <div class="satchel-scroll"><div class="mart-grid">${r.contestShop.map(ware=>{const i=r.bagItemById[ware.id];return `<button class="shop-card ${v.medals<ware.price?'shut':''}" style="--edge:${bagHue(i.rarity)};--bg:${bagHue(i.rarity)}" aria-label="${i.name}" onclick="contestAsk('${ware.id}')">${denPlain}<small>Unlimited</small>${bagIcon(ware.id)}<b>${i.name}</b><em>${i.kind}</em><span>${warIcon(3)}${ware.price}</span></button>`}).join('')}</div></div>
  <div class="satchel-nav well-nav"><button data-back aria-label="Back" onclick="contestLeave()">‹</button></div></section>`;
  return;
 }
 $('#main').innerHTML=`<section class="satchel tw tw-lobby" style="background-image:url('${artPath('comp-war-key')}')"><div class="satchel-top"><strong>Totem War</strong>${medals}${sumChip(uiIcon('gold'),S.gold,'Gold')}</div>
 <div class="tw-stage"><p class="tw-when">Open every day · rewarded fights today: <b>${v.runs} / ${w.daily}</b></p><button class="maw-help" aria-label="Rules" onclick="warRulesShow()">${denPlain}?</button>
  <button class="tw-side" onclick="warRankShow()">${denPlain}${warIcon(7)}Ranking<br>Rewards</button><p class="tw-best">Best: <b>${v.best}</b> points · first places: <b>${v.wins}</b></p></div>
 <div class="tw-preview"><h3>Reward Preview</h3><div>${warIcon(3)}${bagIcon('chest2')}${bagIcon('wish')}${bagIcon('exp1')}</div></div>
 <div class="tw-sides">${r.warFactions.map((f,i)=>`<button aria-pressed="${i===warFaction}" style="--tone:${f.color}" onclick="warPick(${i})">${denPlain}${warIcon(4+i)}${f.name}</button>`).join('')}</div>
 <div class="tw-enter"><button class="tw-shop" onclick="contestGo('Shop')">${denPlain}${warIcon(3)}Contest<br>Shop</button><button class="den-gold" onclick="contestEnter()">${denPlain}Enter${v.runs>=w.daily?'<small>practice</small>':''}</button></div>
 <div class="satchel-nav well-nav"><button data-back aria-label="Back" onclick="contestLeave()">‹</button></div></section>`;
}

// ---- Social room: Chat, Friends, Mail, Thank-you Note (rules: WonderGear.social*, chat*, mail*) ---------------------
// Everyone here is an AI adventurer; names carry an "AI" tag. Screen `citySocial`, page in `socialPage`.
let socialPage='Chat',chatChannel='Globe',chatWith=null,chatTimer=0,chatEmoji=false,friendTab='Friends',mailPick=null,mailChecked=[],socialTimer=0;
function socialArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--soc-icons'))return;root.style.setProperty('--soc-icons','url("'+artPath('comp-social-icons')+'")')}
// 0 flowers, 1 heart, 2 empty heart, 3 letter, 4 open letter, 5 thank-you scroll, 6 chat bubble, 7 gift
const socIcon=n=>'<i class="soc-ico" style="background-position:'+(n%4)/3*100+'% '+Math.floor(n/4)/2*100+'%"></i>';
const folk=id=>WonderGear.socialById[id];
const folkFace=id=>portrait(folk(id)?.face||'guest');
const folkLevel=id=>Math.max(1,level()+(folk(id)?.lv||0));
function folkStatus(id){const h=Math.floor(Date.now()/36e5),n=[...(id+h)].reduce((a,c)=>(a*31+c.charCodeAt(0))%997,7);return n%3===0?{on:true,text:'Online'}:{on:false,text:'Offline for '+(n%2?1+n%50+' min':1+n%9+' h')}}
const socialDue=()=>{const v=WonderGear.socialState(S);return {mail:v.mail.filter(m=>m.kind==='mail'&&!m.claimed).length,notes:v.mail.filter(m=>m.kind==='note'&&!m.claimed).length,requests:v.requests.length}};
function socialOpen(page){if(WonderGear.socialTick(S))save();socialPage=page;if(screen==='citySocial')citySocial();else go('citySocial')}
function socialStop(){if(socialTimer){clearInterval(socialTimer);socialTimer=0}}
function hearts(id){const h=WonderGear.heartsOf(S,id);return Array.from({length:WonderGear.socialRules.hearts},(_,i)=>h>=i+1?socIcon(1):h>i?'<span class="soc-half">'+socIcon(2)+socIcon(1)+'</span>':socIcon(2)).join('')}
// ---- The chat sheet: slides up over the home screen (or fills the room's Chat page). Channels on the left. ----------
const chatEmojis=['😀','😂','😍','👍','🎉','🌸','⚔️','🐉','💖','😢','🙏','✨'];
const chatShortcuts=['Hello everyone!','Thank you!','Good luck!','Who wants to team up?','Let us take the next city!','See you later!'];
// Live AI replies (in-chat preview only): when the page runs inside Claude, `sample` lets an AI adventurer answer her
// own message with a line written by Claude, at most WonderGear.socialRules.liveDaily a day. Elsewhere (gh-pages, tests)
// window.claude is absent and the stock replies stay. Background AI chatter never calls Claude.
let chatAi=null,chatAiOff=false;const chatPending=new Set();
try{window.claude?.use?.('sample').then(f=>{chatAi=f||null;if(f&&document.querySelector('.chat-sheet'))chatRefresh()}).catch(()=>{})}catch{}
const chatLiveOn=()=>!!chatAi&&!chatAiOff;
function chatAsk(r){
 if(!r||!chatLiveOn()||WonderGear.chatLiveLeft(S)<1)return;
 const t=r.reply.t,f=folk(r.reply.from),ch=r.me.ch.startsWith('p:')?'a private talk':'the '+r.me.ch+' channel';
 const recent=WonderGear.socialState(S).chat.filter(c=>c.ch===r.me.ch&&c.t<r.me.t).slice(-4).map(c=>(c.from==='me'?S.name:folk(c.from)?.name||'Someone')+': '+c.text).join('\n');
 const prompt=`You are ${f.name}, a friendly AI adventurer (players see the tag "AI" next to your name) in the cozy fantasy browser RPG "Wings of Wonder", set in Sky Garden: dungeons, pets, guilds, cloud wars, fishing. The player ${S.name} wrote to you in ${ch}. Reply as ${f.name} in one short chat line, at most 25 words, in the same language as the player's message. Stay in character, be warm and playful, no links, no lists, never pretend to be a human.${recent?'\n\nEarlier lines:\n'+recent:''}\n\n${S.name}: ${r.me.text}\n\nReply with the chat line only.`;
 chatPending.add(t);chatFeedOnly();
 chatAi(prompt,{modelTier:'quick',cache:false}).then(({text})=>{if(WonderGear.chatLiveSet(S,t,text))save()})
  .catch(e=>{if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(e?.code))chatAiOff=true;if(e?.code==='rate_limited')toast('AI friends are resting, try later.')})
  .finally(()=>{chatPending.delete(t);if(document.querySelector('.chat-sheet'))chatRefresh()});
}
function chatLine(c){
 if(c.kind==='sys'||c.kind==='quiz')return `<div class="chat-note ${c.kind}">${esc(c.text)}</div>`;
 if(c.kind==='roll')return `<div class="chat-note roll"><b>${esc(folk(c.from).name)}</b> ${esc(c.text).replace(/(Bonus: )(.*)$/,'$1<u>$2</u>').replace(/rolled (\d+)/,'rolled <i>$1</i>')}</div>`;
 const me=c.from==='me',time=new Date(c.t).toISOString().slice(11,16),f=me?null:folk(c.from);
 const tag=c.srv?`<span class="srv">[S-${c.srv}]</span> `:'',fac=c.fac!==undefined?` <span class="fac" style="color:${cloudFactions[c.fac][3]}">[${cloudFactions[c.fac][0]}]</span>`:'';
 const bub=me&&S.supreme?.bubble?bubbleAt(S.supreme.bubble):'';if(bub)bubbleVars();
 return `<div class="chat-line ${me?'me':''} ${bub?'pb-line':''}" ${bub?'style="--bp:'+bub+'"':''}>${me?'':`<button class="chat-face" aria-label="Mention ${esc(f.name)}" onclick="chatMention('${f.name}')">${denPlain}${folkFace(c.from)}</button>`}<div><b>${me?esc(S.name):tag+esc(f.name)+' <small>AI</small>'+fac}<em>${time}</em></b><p>${chatPending.has(c.t)?'<i class="chat-typing">typing…</i>':esc(c.text)}</p></div></div>`;
}
const chatTarget=()=>chatChannel==='Squad'&&chatWith?'p:'+chatWith:chatChannel;
function chatSheet(room){
 const r=WonderGear,v=r.socialState(S),ch=chatTarget(),squad=r.squadOf(S),members=chatWith&&!squad.includes(chatWith)?[...squad,chatWith]:squad;
 const feed=r.chatFeed(S,ch).map(chatLine).join(''),sys=chatChannel==='System';
 const top=chatChannel==='X-server'?`<label class="chat-block"><button class="soc-check" aria-pressed="${v.xblock}" onclick="WonderGear.chatBlockX(S,${!v.xblock});save();chatRefresh()">${denPlain}</button>Block all messages in cross-server channel</label>`
  :chatChannel==='Squad'?`<div class="chat-squad"><button aria-pressed="${!chatWith}" onclick="chatWith=null;chatRefresh()">${denPlain}${socIcon(7)}<b>Team</b></button>${members.map(id=>`<button aria-pressed="${id===chatWith}" onclick="chatWith='${id}';chatRefresh()">${denPlain}${folkFace(id)}<b>${folk(id).name}</b><small>Lv${folkLevel(id)}</small></button>`).join('')}</div>`:'';
 return `<div class="chat-sheet ${room?'in-room':'over'}">${room?'':`<button class="chat-fold" aria-label="Close chat" onclick="chatSheetClose()">${denPlain}⌄</button>`}
  <div class="chat-side">${r.chatChannels.map(c=>`<button aria-pressed="${c===chatChannel}" onclick="chatChannel='${c}';chatWith=null;chatEmoji=false;chatRefresh()">${denPlain}${c}</button>`).join('')}
   <span></span><button class="chat-tool" onclick="chatQuick('📍 I am at Sky Garden · Lv. '+level())">${denPlain}${uiIcon('travel')}Coordinate</button><button class="chat-tool" onclick="chatShortcutsShow()">${denPlain}${socIcon(6)}Shortcut</button><button class="chat-tool" onclick="chatSheetClose();go('cityBag')">${denPlain}${uiIcon('equipment')}Bag</button></div>
  <div class="chat-main">${top}<div class="chat-feed">${feed||`<p class="soc-empty">${v.xblock&&chatChannel==='X-server'?'Cross-server messages are blocked.':'No messages yet. Say hello!'}</p>`}</div>
   ${chatEmoji?`<div class="chat-emoji">${chatEmojis.map(e=>`<button onclick="chatInsert('${e}')">${denPlain}${e}</button>`).join('')}</div>`:''}
   <div class="chat-input"><input id="chatText" maxlength="80" ${sys?'disabled':''} placeholder="${sys?'System messages only':'Press the avatar or input @ to notify…'}" onkeydown="if(event.key==='Enter')chatSend()"><button class="chat-smile" aria-label="Emoji" onclick="chatEmoji=!chatEmoji;chatRefresh()" ${sys?'disabled':''}>${denPlain}☺</button><button class="den-gold" onclick="chatSend()" ${sys?'disabled':''}>${denPlain}Send</button></div>${chatLiveOn()&&!sys?`<small class="chat-live">✦ Live AI replies today: ${WonderGear.chatLiveLeft(S)}/${WonderGear.socialRules.liveDaily}</small>`:''}</div></div>`;
}
function chatRefresh(){
 const el=document.querySelector('.chat-sheet');if(!el){chatStop();return}
 const box=document.getElementById('chatText'),keep=box?.value||'';
 el.outerHTML=chatSheet(el.classList.contains('in-room'));
 const nb=document.getElementById('chatText');if(nb)nb.value=keep;
 const feed=document.querySelector('.chat-feed');if(feed)feed.scrollTop=feed.scrollHeight;
}
function chatStop(){if(chatTimer){clearInterval(chatTimer);chatTimer=0}}
// The timer only swaps the messages when they changed, and keeps the reading position: nothing moves or blinks.
function chatFeedOnly(){
 const feed=document.querySelector('.chat-sheet .chat-feed');if(!feed){chatStop();return}
 const html=WonderGear.chatFeed(S,chatTarget()).map(chatLine).join('');if(!html||feed.dataset.sig===String(html.length)+html.slice(-80))return;
 const atEnd=feed.scrollHeight-feed.scrollTop-feed.clientHeight<24;feed.innerHTML=html;feed.dataset.sig=String(html.length)+html.slice(-80);if(atEnd)feed.scrollTop=feed.scrollHeight;
}
function chatTick(){chatStop();chatTimer=setInterval(()=>{if(!document.querySelector('.chat-sheet')){chatStop();return}chatFeedOnly()},8000)}
function chatSheetOpen(){
 if(WonderGear.socialTick(S))save();socialArtVars();
 const host=document.querySelector('.city-hud')||document.querySelector('#main');if(!host)return;
 document.querySelector('.chat-sheet')?.remove();host.insertAdjacentHTML('beforeend',chatSheet(false));
 const el=document.querySelector('.chat-sheet');el?.classList.add('opening');setTimeout(()=>el?.classList.remove('opening'),300);
 const feed=document.querySelector('.chat-feed');if(feed)feed.scrollTop=feed.scrollHeight;chatTick();
}
function chatSheetClose(){document.querySelector('.chat-sheet.over')?.remove();chatStop();chatEmoji=false}
function chatInsert(text){const box=document.getElementById('chatText');if(!box)return;box.value=(box.value+text).slice(0,80);box.focus?.()}
function chatMention(name){chatInsert('@'+name+' ')}
function chatSend(){
 const box=document.getElementById('chatText'),text=box?.value||'';
 const r=WonderGear.chatSay(S,chatTarget(),text);if(!r){toast(chatChannel==='System'?'Nobody can write in System.':'Write something first.');return}
 if(typeof trailTick==='function')trailTick('chat');if(box)box.value='';chatEmoji=false;save();chatRefresh();chatAsk(r);
}
function chatQuick(text){const r=WonderGear.chatSay(S,chatTarget(),text);if(r){save();if($('#modal').open)$('#modal').close();chatRefresh();chatAsk(r)}else toast('Nobody can write in System.')}
function chatShortcutsShow(){popup('<h2>Shortcut</h2><div class="soc-list">'+chatShortcuts.map(t=>`<button class="soc-row" onclick="chatQuick('${t.replace(/'/g,"\\'")}')">${denPlain}${socIcon(6)}<b>${t}</b></button>`).join('')+'</div>')}
function friendChat(id){chatChannel='Squad';chatWith=id;socialOpen('Chat')}
function friendFlower(id){if(WonderGear.sendFlower(S,id)){save();citySocial();toast('Flowers sent to '+folk(id).name)}else toast('Already sent today, or no flowers left.')}
function friendGiftAll(){const r=WonderGear.giftAll(S);save();citySocial();toast(r.sent||r.got?'Sent '+r.sent+' · received '+r.got+' (+'+r.gold+' gold)':'Everything is sent and received for today.')}
function friendPickFlower(){const v=WonderGear.socialState(S);popup('<h2>Send Flowers</h2><p>Flowers raise intimacy (hearts). '+(WonderGear.socialRules.giftsPerDay-v.sent.length)+' left today.</p><div class="soc-list">'+v.friends.map(id=>`<button class="soc-row" ${v.sent.includes(id)?'disabled':''} onclick="friendFlower('${id}');$('#modal').close()">${denPlain}${folkFace(id)}<b>${folk(id).name} <small>AI</small></b><span>${v.sent.includes(id)?'Sent':socIcon(0)}</span></button>`).join('')+'</div>')}
function friendRequests(){const v=WonderGear.socialState(S);popup('<h2>Friend Requests</h2>'+(v.requests.length?'<div class="soc-list">'+v.requests.map(id=>`<div class="soc-row">${folkFace(id)}<b>${folk(id).name} <small>AI · Lv. ${folkLevel(id)}</small></b><button class="den-gold" onclick="friendReply('${id}',true)">${denPlain}Accept</button><button onclick="friendReply('${id}',false)">${denPlain}Decline</button></div>`).join('')+'</div>':'<p>No requests right now.</p>'))}
function friendReply(id,yes){WonderGear.friendAnswer(S,id,yes);save();citySocial();friendRequests()}
function friendSuggest(){const v=WonderGear.socialState(S),list=WonderGear.socialFolk.filter(f=>!v.friends.includes(f.id)&&!v.blocked.includes(f.id));popup('<h2>Add Friends</h2><p>Adventurers you have met. They are AI companions of this world.</p>'+(list.length?'<div class="soc-list">'+list.map(f=>`<div class="soc-row">${folkFace(f.id)}<b>${f.name} <small>AI · Lv. ${folkLevel(f.id)}</small></b><button class="den-gold" onclick="friendNew('${f.id}')">${denPlain}Add</button></div>`).join('')+'</div>':'<p>Everyone is already your friend.</p>'))}
function friendNew(id){if(WonderGear.friendAdd(S,id)){save();citySocial();friendSuggest();toast(folk(id).name+' is now your friend')}}
function friendManage(id){popup(`<h2>${folk(id).name} <small>AI</small></h2><p>Lv. ${folkLevel(id)} · ${folkStatus(id).text}</p><div class="den-actions"><button class="den-gold" onclick="$('#modal').close();friendChat('${id}')">${denPlain}Chat</button><button onclick="friendBan('${id}',true)">${denPlain}Blacklist</button></div>`)}
function friendBan(id,on){WonderGear.friendBlock(S,id,on);save();$('#modal').close();citySocial();toast(on?folk(id).name+' is on the blacklist':folk(id).name+' removed from the blacklist')}
// Letters in older saves are signed "Kiki" (a name copied from the reference); they show our own senders.
function mailFrom(m){return ['Kiki','System','Sky Garden Keeper','Wingpost Courier'].includes(m.from)?'Sky Garden Post':m.from}
function mailOpen(id){mailPick=id;if(WonderGear.mailRead(S,id))save();citySocial()}
function mailCheck(id){mailChecked=mailChecked.includes(id)?mailChecked.filter(x=>x!==id):[...mailChecked,id];citySocial()}
function mailAll(kind){const ids=WonderGear.socialState(S).mail.filter(m=>m.kind===kind).map(m=>m.id);mailChecked=ids.every(id=>mailChecked.includes(id))?[]:ids;citySocial()}
function mailTake(kind){
 const v=WonderGear.socialState(S),ids=mailChecked.length?mailChecked:v.mail.filter(m=>m.kind===kind&&(m.id===mailPick||!mailPick)&&!m.claimed).map(m=>m.id);
 const r=WonderGear.mailClaim(S,ids);if(!r.n){toast('Nothing to claim.');return}
 // No "Items Obtained" window to dismiss (user: "open them and put everything in the bag, no confirmation").
 save();mailChecked=[];citySocial();const k=Object.values(r.got).reduce((a,b)=>a+b,0);toast(r.n+(r.n>1?' letters':' letter')+' claimed'+(k?' · '+k+' item'+(k>1?'s':'')+' sent to the bag':''));
}
function mailDrop(){const n=WonderGear.mailDelete(S,mailChecked);mailChecked=[];if(!n){toast('Claim the items first; only claimed letters can be deleted.');return}save();mailPick=null;citySocial();toast(n+' deleted')}
function citySocial(){
 const r=WonderGear;if(r.socialTick(S))save();const v=r.socialState(S),due=socialDue();socialArtVars();bagArtVars();
 socialStop();chatStop();if(!['Chat','Friends','Mail','Notes'].includes(socialPage))socialPage='Chat';
 const dot=n=>n?'<i class="soc-dot">'+n+'</i>':'';
 const nav=`<div class="satchel-nav well-nav soc-nav"><button data-back aria-label="Back to city" onclick="socialStop();chatStop();go('home')">‹</button>${[['Chat',6,'Chat',0],['Friends',7,'Friends',due.requests],['Mail',3,'Mail',due.mail],['Notes',5,'Thank-you Note',due.notes]].map(([p,i,label,n])=>`<button ${p===socialPage?'aria-current="page"':''} onclick="socialOpen('${p}')">${denPlain}${socIcon(i)}${label}${dot(n)}</button>`).join('')}</div>`;
 let body='';
 if(socialPage==='Chat'){
  body=`<div class="satchel-top"><strong>Chat</strong></div>${chatSheet(true)}`;
 }else if(socialPage==='Friends'){
  const list=friendTab==='Blacklist'?v.blocked:friendTab==='Recent Contacts'?v.recent.filter(id=>!v.blocked.includes(id)):v.friends;
  const card=id=>{const st=folkStatus(id),black=friendTab==='Blacklist';return `<div class="soc-card">${folkFace(id)}<div><b>${folk(id).name} <small>AI</small> <em class="${st.on?'on':''}">${st.text}</em></b><span>Lv. ${folkLevel(id)}</span><span class="soc-hearts">${hearts(id)}</span></div>${black?`<button class="den-gold" onclick="friendBan('${id}',false)">${denPlain}Remove</button>`:`<button class="soc-round" aria-label="Send flowers" onclick="friendFlower('${id}')" ${v.sent.includes(id)?'disabled':''}>${denPlain}${socIcon(0)}</button><button class="soc-round" aria-label="Chat" onclick="friendChat('${id}')">${denPlain}${socIcon(6)}</button><button class="soc-round soc-more" aria-label="More" onclick="friendManage('${id}')">${denPlain}⋯</button>`}</div>`};
  body=`<div class="soc-banner" style="background-image:url('${artPath('comp-social-banner')}')"><strong>Friends</strong><p>Giftable: <b>${r.socialRules.giftsPerDay-v.sent.length}/${r.socialRules.giftsPerDay}</b></p><p>Receivable: <b>${Math.max(0,Math.min(r.socialRules.giftsPerDay,v.friends.length)-v.got)}/${r.socialRules.giftsPerDay}</b></p><span class="soc-count">${v.friends.length}/${r.socialRules.friendsMax}</span></div>
  <div class="satchel-scroll soc-scroll">${list.map(card).join('')||'<p class="soc-empty">Nobody here yet.</p>'}</div>
  <div class="soc-actions">${[['Management',8,"toast('Tap ⋯ on a friend to chat or blacklist.')"],['Send Flowers',0,'friendPickFlower()'],['Apply',2,'friendRequests()',due.requests],['Add',1,'friendSuggest()'],['Gift All',7,'friendGiftAll()']].map(([n,i,a,c])=>`<button onclick="${a}">${denPlain}${socIcon(i)}${n}${dot(c||0)}</button>`).join('')}</div>
  <div class="soc-tabs">${['Recent Contacts','Friends','Blacklist'].map(t=>`<button aria-pressed="${t===friendTab}" onclick="friendTab='${t}';citySocial()">${denPlain}${t}</button>`).join('')}</div>`;
 }else{
  const kind=socialPage==='Mail'?'mail':'note',list=v.mail.filter(m=>m.kind===kind);
  if(!list.some(m=>m.id===mailPick))mailPick=list[0]?.id??null;
  const m=list.find(x=>x.id===mailPick),stamp=t=>new Date(t).toISOString().slice(2,19).replace('T',' ');
  const letter=m?`<div class="soc-letter"><h3>${esc(m.title)}</h3><p>${m.kind==='note'?'A note for you:':'Dear Reina,'}</p><p>${esc(m.text)}</p><em>${esc(mailFrom(m))}${m.kind==='note'?' <small>AI</small>':''}</em><div class="soc-items">${/^Title earned:/.test(m.title)?`<button class="soc-title-go" onclick="go('titles')">${denPlain}Open Titles</button>`:Object.keys(m.items).length?cloudItems(m.items):'<small>No items</small>'}${m.claimed&&Object.keys(m.items).length?'<i class="soc-claimed">Claimed</i>':''}</div></div>`:`<div class="soc-letter"><p class="soc-empty">${kind==='mail'?'No mail.':'No thank-you notes yet.'}</p></div>`;
  body=`<div class="satchel-top"><strong>${kind==='mail'?'Mail':'Thank-you Note'}</strong></div>${letter}
  <div class="satchel-scroll soc-scroll">${list.map(x=>`<div class="soc-mail ${x.id===mailPick?'on':''} ${x.read?'':'new'}" onclick="mailOpen(${x.id})">${socIcon(kind==='mail'?(x.claimed?4:3):5)}<div><b>${kind==='mail'?esc(x.title):esc(x.from)+' <small>AI</small>'}</b><small>${stamp(x.t)}</small></div>${x.claimed?'':'<i class="soc-dot">!</i>'}<button class="soc-check" aria-pressed="${mailChecked.includes(x.id)}" onclick="event.stopPropagation();mailCheck(${x.id})">${denPlain}</button></div>`).join('')}</div>
  <div class="soc-mailbar"><button class="soc-check" aria-pressed="${list.length&&list.every(x=>mailChecked.includes(x.id))}" onclick="mailAll('${kind}')">${denPlain}</button><span>Select All <b>${list.length}/${r.socialRules.mailMax}</b></span><button onclick="mailDrop()">${denPlain}Delete</button><button class="den-gold" onclick="mailTake('${kind}')">${denPlain}Claim</button></div>`;
 }
 $('#main').innerHTML=`<section class="satchel soc soc-p-${socialPage.toLowerCase()}">${body}${nav}</section>`;
 if(socialPage==='Chat'){const feed=document.querySelector('.chat-feed');if(feed)feed.scrollTop=feed.scrollHeight;chatTick()}
}
// The strip on the home screen: the latest two World lines; tap it for the chat, the bubble for friends and mail.
function homeChat(){
 if(WonderGear.socialTick(S))save();socialArtVars();const due=socialDue(),n=due.mail+due.notes+due.requests;
 const lines=WonderGear.chatFeed(S,'Globe',Date.now(),2).map(c=>`<div><small>Globe</small> ${c.from==='me'?esc(S.name):esc(folk(c.from).name)}: ${esc(c.text)}</div>`).join('');
 return `<div class="city-chat" role="button" tabindex="0" onclick="chatSheetOpen()">${lines}<button class="city-social" aria-label="Friends and mail" onclick="event.stopPropagation();socialOpen(${due.mail?"'Mail'":due.notes?"'Notes'":"'Friends'"})">${denPlain}${socIcon(6)}${n?'<i class="soc-dot">'+n+'</i>':''}</button></div>`;
}

// ---- Guild room (rules: WonderGear.guild*). Without a guild: a list of AI guilds to join and Found a Guild. --------
let guildPage='Info',guildTab='Info',guildCrestPick=0,guildPick='attack';
function guildArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--gld-icons'))return;root.style.setProperty('--gld-icons','url("'+artPath('comp-guild-icons')+'")')}
// 0 crest, 1 check-in, 2 gold, 3 prisms, 4 boss, 5 guild coin, 6 blessings, 7 shop
const gldIcon=n=>'<i class="gld-ico" style="background-position:'+(n%4)/3*100+'% '+Math.floor(n/4)*100+'%"></i>';
const gldCrest=c=>'<i class="gld-ico gld-crest" style="background-position:0% 0%;filter:hue-rotate('+[0,110,210,300][c]+'deg)"></i>';
const guildBossArt='guardian-t21';
const gldPower=n=>n>=1e6?(n/1e6).toFixed(1).replace(/\.0$/,'')+'M':n>=1e4?Math.round(n/1e3)+'K':fmt(n);
function guildGo(page,tab){guildPage=page;if(tab)guildTab=tab;if(screen==='cityGuild')cityGuild();else go('cityGuild')}
function guildJoinPick(id){if(WonderGear.guildJoin(S,id)){WonderGear.socialNote(S,'Joined the guild '+S.guild.name+'.');save();guildPage='Info';guildTab='Info';cityGuild();toast('Welcome to '+S.guild.name+'!')}}
function guildFound(){
 popup(`<h2>Found a Guild</h2><p>Costs ${fmt(WonderGear.guildRules.createGold)} gold. Your first three friends join you.</p><input id="guildName" maxlength="16" placeholder="Guild name (3–16 letters)" class="gld-name"><div class="gld-crests">${[0,1,2,3].map(c=>`<button aria-pressed="${c===guildCrestPick}" onclick="guildCrestPick=${c};this.parentNode.querySelectorAll('button').forEach((b,i)=>b.setAttribute('aria-pressed',i===${c}))">${denPlain}${gldCrest(c)}</button>`).join('')}</div><div class="den-actions"><button class="den-gold" onclick="guildFoundNow()">${denPlain}Found · ${fmt(WonderGear.guildRules.createGold)} gold</button></div>`);
}
function guildFoundNow(){
 const name=document.getElementById('guildName')?.value||'';
 if(!WonderGear.guildCreate(S,name,guildCrestPick)){toast(S.gold<WonderGear.guildRules.createGold?'Not enough gold.':'Name: 3–16 letters or numbers.');return}
 WonderGear.socialNote(S,'Founded the guild '+S.guild.name+'.');save();$('#modal').close();guildPage='Info';guildTab='Info';cityGuild();toast('Guild founded!');
}
function guildLeaveAsk(){popup(`<h2>Leave ${esc(S.guild.name)}?</h2><p>Guild coins, contribution and Academy levels stay with the guild.</p><div class="den-actions"><button class="den-gold" onclick="WonderGear.guildLeave(S);save();$('#modal').close();cityGuild()">${denPlain}Leave</button></div>`)}
function guildSignNow(){if(WonderGear.guildSign(S)){save();cityGuild();toast('Signed in: +'+WonderGear.guildRules.signFund+' guild fund')}else toast('Already signed in today.')}
function guildGive(kind){if(WonderGear.guildDonate(S,kind)){save();cityGuild();toast('Thank you for the donation!')}else toast(kind==='gold'?'No gold donations left today, or not enough gold.':'Already donated prisms today, or not enough prisms.')}
function guildUpPop(){
 const r=WonderGear,g=r.guildState(S),R=r.guildRules,max=g.lv>=R.maxLevel,cost=r.guildUpFund(g.lv),can=g.role<=1;
 popup(`<h2>Guild Level ${g.lv}${max?'':' → '+(g.lv+1)}</h2>${max?'<p>The guild has reached the highest level.</p>':`<p>Members: ${r.guildCap(g.lv)} → <b>${r.guildCap(g.lv+1)}</b><br>Academy cap: Lv. ${r.guildAcademyCap(g.lv)} → <b>${r.guildAcademyCap(g.lv+1)}</b></p><p>Guild fund: <b>${fmt(g.fund)} / ${fmt(cost)}</b></p>
 ${can?`<div class="den-actions"><button class="den-gold" ${g.fund>=cost?'':'disabled'} onclick="guildUpNow()">${denPlain}Upgrade</button></div>`:'<p>Only the leader or an elder can upgrade. The AI leader upgrades as soon as the fund is full.</p>'}`}`);
}
function guildUpNow(){if(WonderGear.guildUpgrade(S)){save();$('#modal').close();cityGuild();toast('Guild level '+S.guild.lv+'!')}}
function guildEditPop(kind){
 const g=WonderGear.guildState(S),R=WonderGear.guildRules,max=kind==='note'?R.noteMax:R.speakerMax;
 popup(`<h2>${kind==='note'?'Guild Announcement':'Edit Speaker'}</h2><p>${kind==='note'?'Every member sees it on the Info page.':'The line members see when someone signs in.'}</p><textarea id="guildText" maxlength="${max}" class="gld-name" rows="3">${esc(g[kind])}</textarea><div class="den-actions"><button class="den-gold" onclick="guildEditNow('${kind}')">${denPlain}Save</button></div>`);
}
function guildEditNow(kind){const t=document.getElementById('guildText')?.value||'';if((kind==='note'?WonderGear.guildNote:WonderGear.guildSpeaker)(S,t)){save();$('#modal').close();cityGuild()}else toast('Write a few words first.')}
function guildBoxNow(i){const items=WonderGear.guildBoxClaim(S,i);if(!items){const b=WonderGear.guildActivity(S).boxes[i];toast(b.claimed?'Already opened today.':'Needs '+b.at+' sign-in activity.');return}save();cityGuild();bagArtVars();popup('<h2>Sign-in Chest</h2><div class="bag-gains">'+cloudItems(items)+'</div>')}
function guildEnvOpen(id){
 const r=WonderGear,e=r.guildEnvelopes(S).find(x=>x.id===id);if(!e)return;
 if(!e.claimed&&!e.own){const got=r.guildEnvClaim(S,id);if(got){save();cityGuild();e.takers.push({id:'me',amount:got.amount});e.claimed=true;e.best=[...e.takers].sort((a,b)=>b.amount-a.amount)[0].id}}
 const unit=e.kind==='gold'?uiIcon('gold'):e.kind==='wishes'?'✦':gldIcon(3),who=t=>t.id==='me'?esc(S.name):folk(t.id).name+' <small>AI</small>';
 const sender=e.from==='me'?esc(S.name):folk(e.from).name+' <small>AI</small>';
 popup(`<div class="gld-env-pop"><div class="gld-env big"><i></i></div><h2>${sender}</h2><p>“${esc(e.note)}”</p>${e.claimed&&!e.own?`<p class="gld-env-got">You received <b>${unit} ${e.takers.find(t=>t.id==='me').amount}</b> ${e.kind}</p>`:''}
 <h3>Check Others' Luck · ${e.takers.length}/${e.shares}</h3><div class="gld-board">${e.takers.map(t=>`<div class="${t.id==='me'?'me':''}"><b>${t.id===e.best?'★':''}</b><span>${who(t)}</span><em>${unit} ${t.amount}</em></div>`).join('')}</div></div>`);
}
function guildEnvRecords(){
 const r=WonderGear,list=r.guildEnvelopes(S),mine=list.filter(e=>e.claimed&&!e.own),sent=list.filter(e=>e.own);
 popup(`<h2>Surprise Bag Records</h2><div class="gld-board">${mine.map(e=>`<div><b>⬇</b><span>From ${folk(e.from).name} <small>AI</small></span><em>${e.takers.find(t=>t.id==='me').amount} ${e.kind}</em></div>`).join('')}${sent.map(e=>`<div class="me"><b>⬆</b><span>You sent a Surprise Bag</span><em>${e.total} prisms</em></div>`).join('')||''}${mine.length+sent.length?'':'<p>No bags opened or sent today.</p>'}</div>`);
}
function guildEnvSendAsk(){const R=WonderGear.guildRules,g=WonderGear.guildState(S);popup(`<h2>Send Surprise Bag</h2><p>${R.envCost} prisms shared out among ${R.envShares} guild members. You gain +${R.envGain} contribution and the guild fund +${R.envCost}.</p><p>Sent today: ${g.envSent}/${R.envSendMax}</p><div class="den-actions"><button class="den-gold" ${g.envSent<R.envSendMax&&S.scales>=R.envCost?'':'disabled'} onclick="guildEnvSendNow()">${denPlain}Send · ${R.envCost} prisms</button></div>`)}
function guildEnvSendNow(){if(WonderGear.guildEnvSend(S)){save();$('#modal').close();cityGuild();toast('Surprise Bag sent!')}else toast('Not enough prisms, or three bags sent today.')}
function guildStrike(){
 const dmg=WonderGear.guildHit(S);if(dmg===null){toast(WonderGear.guildState(S).reserved?'No challenges left today, or the beast is down.':'Book the beast first.');return}
 save();cityGuild();const stage=document.querySelector('.gld-boss-art');if(stage?.insertAdjacentHTML){stage.classList.add('hit');stage.insertAdjacentHTML('beforeend',`<b class="gld-dmg">-${fmt(dmg)}</b>`)}
}
function guildReserveNow(){if(WonderGear.guildReserve(S)){save();cityGuild();toast('The Guild Beast is booked for today!')}else toast('Only the leader books the beast, for '+WonderGear.guildRules.reserveFund+' guild fund.')}
function guildClaimBoss(){
 const r=WonderGear.guildBossClaim(S);if(!r)return;save();cityGuild();bagArtVars();const q=WonderGear.gearRanks[r.quality];
 popup('<h2>Guild Beast Defeated</h2><p>Your damage rank today: <b>'+r.rank+'</b></p><div class="bag-gains"><span class="bag-gain" style="--rarity:#ffcf5a">'+gldIcon(5)+'<b>+'+r.coins+'</b><small>Guild coins</small></span>'+cloudItems(r.items)+'</div>'+(r.gear?'<p>Divine Beast Drop: <b style="color:'+q.color+'">'+q.name+' '+WonderGear.catalog[r.gear.template].name+'</b> (T'+WonderGear.catalog[r.gear.template].tier+') is in the bag.</p>':'<p>The bag is full: the piece became enhancement stones.</p>'));
}
function guildBeastRules(){const R=WonderGear.guildRules;popup(`<h2>Guild Beast</h2><p>One beast a day, of the tier you have reached. In your own guild the leader books it for ${R.reserveFund} guild fund; AI guilds book it every day.</p><p>Every member has ${R.bossHits} challenges. The beast falls when the guild's total damage reaches its HP (${fmt(R.bossHp)} × guild level). Then everyone who hit it claims a reward by damage rank.</p><p>The beast's HP and rewards reset at 00:00 UTC.</p>`)}
function guildBeastPreview(){
 const r=WonderGear,t=r.guildBeastTier(S);bagArtVars();
 popup(`<h2>Reward Preview</h2><div class="gld-board gld-prev">${r.guildBossRank.map((x,i)=>{const q=r.gearRanks[x.rank],from=i?r.guildBossRank[i-1].to+1:1;return `<div><b>${from===x.to?'#'+x.to:x.to>50?'#'+from+'+':'#'+from+'–'+x.to}</b><span><i style="color:${q.color}">T${t} ${q.name} gear</i> · ${Object.entries(x.items).map(([id,n])=>r.bagItemById[id].name+' ×'+n).join(', ')} · ${r.guildRules.bossCoins} coins</span></div>`}).join('')}</div>`);
}
function guildBuyNow(id){if(WonderGear.guildBuy(S,id)){save();cityGuild();toast(WonderGear.bagItemById[id].name+' sent to the bag')}else toast('Not enough guild coins, sold out, or the guild level is too low.')}
function guildLearnNow(){if(WonderGear.guildLearn(S,guildPick)){save();cityGuild()}else toast('Not enough contribution, or the guild level caps this stat.')}
function guildAcademyValue(a,n){const v=Math.round(n*a.step*100)/100;return '+'+fmt(v)+(WonderGear.percentKeys.has(a.key)?'%':'')}
function cityGuild(){
 const r=WonderGear,g=r.guildState(S),R=r.guildRules;guildArtVars();bagArtVars();
 const wallet=g?sumChip(gldIcon(5),g.coins,'Guild coins')+sumChip(gldIcon(1),g.contrib,'Contribution'):sumChip(uiIcon('gold'),S.gold,'Gold');
 if(!g){
  const rows=r.guildList.map(t=>{const lv=r.guildLevel(t.exp).lv;return `<div class="gld-row">${gldCrest(t.crest)}<div><b>${t.name}</b><small>Lv. ${lv} · ${t.members.length+1}/${r.guildCap(lv)} members · AI guild</small></div><button class="den-gold" onclick="guildJoinPick('${t.id}')">${denPlain}Join</button></div>`}).join('');
  $('#main').innerHTML=`<section class="satchel gld gld-p-join" style="background-image:url('${artPath('comp-guild-hall')}')"><div class="satchel-top"><strong>Guild</strong>${wallet}</div>
  <div class="gld-card"><h2>Join a Guild</h2><p>Guild members sign in, donate, study at the Academy and fight the Guild Beast together. Everyone else here is an AI adventurer.</p>${rows}<button class="den-gold gld-found" onclick="guildFound()">${denPlain}${gldCrest(guildCrestPick)}Found a Guild</button></div>
  <div class="satchel-nav well-nav gld-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button></div></section>`;
  return;
 }
 if(!['Info','Academy','Beast','Shop'].includes(guildPage))guildPage='Info';
 if(!['Info','Member','Ranking','Envelope'].includes(guildTab))guildTab='Info';
 const leader=g.role===0?esc(S.name):folk(g.members[0]).name+' <small>AI</small>',cap=r.guildCap(g.lv);
 let body='',tabs='';
 if(guildPage==='Info'){
  tabs=`<div class="gld-tabs">${[['Info','Info'],['Member','Member'],['Ranking','Ranking'],['Envelope','Red Envelope']].map(([k,n])=>`<button ${k===guildTab?'aria-current="page"':''} onclick="guildGo('Info','${k}')">${denPlain}${n}${k==='Envelope'&&r.guildEnvelopes(S).some(e=>!e.claimed&&!e.own)?'<i class="gld-dot"></i>':''}</button>`).join('')}</div>`;
  if(guildTab==='Info'){
   const act=r.guildActivity(S),up=g.lv<R.maxLevel?r.guildUpFund(g.lv):0;
   const box=(b,i)=>`<button class="gld-box ${b.claimed?'open':b.ready?'ready':''}" onclick="guildBoxNow(${i})">${denPlain}${bagIcon(i?'chest2':'chest1')}<small>${b.claimed?'✓':b.at}</small></button>`;
   const card=(name,val,icon)=>`<div class="gi-card">${icon}<small>${name}</small><b>${val}</b></div>`;
   body=`<div class="gi-body"><div class="gi-stage"><div class="gi-banner">${gldCrest(g.crest)}<b>${esc(g.name)}</b></div>
    <div class="gi-sign"><button class="gi-signbtn ${g.signed?'done':''}" onclick="guildSignNow()">${denPlain}${gldIcon(1)}<b>${g.signed?'Signed':'Sign-in'}</b></button><i class="gld-bar"><u style="width:${Math.min(100,act.points/r.guildSignBoxes[1].at*100)}%"></u><em>${act.points}</em></i>${act.boxes.map(box).join('')}</div></div>
    <div class="gi-panel"><div class="gi-lead"><span>${warIcon(7)}<b>${leader}</b></span><button class="gi-up" onclick="guildUpPop()">${denPlain}Guild Level: <b>${g.lv}</b>${g.lv<R.maxLevel?'<i>↑</i>':''}</button></div>
    <div class="gi-note"><h3>Guild Announcement${g.role<=1?`<button class="gi-edit" onclick="guildEditPop('note')">${denPlain}✎</button>`:''}</h3><p>${esc(g.note)}</p></div>
    <div class="gi-cards">${card('Guild Fund',fmt(g.fund),gldIcon(2))}${card('Guild Members',(g.members.length+1)+'/'+cap,gldIcon(1))}${card('Guild Power',gldPower(r.guildPower(S)),gldIcon(4))}${card('Upgrade Funds',up?gldPower(g.fund)+'/'+gldPower(up):'Max',gldIcon(0))}</div>
    <div class="gi-speak"><span>📣</span><p>${esc(g.speaker)}</p>${g.role<=1?`<button onclick="guildEditPop('speaker')">${denPlain}Edit Speaker</button>`:''}</div>
    <div class="gi-give"><button onclick="guildGive('gold')" ${g.gold<R.goldTimes&&S.gold>=R.goldDonate?'':'disabled'}>${denPlain}${gldIcon(2)}Donate ${fmt(R.goldDonate)} gold <small>${R.goldTimes-g.gold}/${R.goldTimes}</small></button><button onclick="guildGive('gems')" ${g.gems<R.gemTimes&&S.scales>=R.gemDonate?'':'disabled'}>${denPlain}${gldIcon(3)}Donate ${R.gemDonate} prisms <small>${R.gemTimes-g.gems}/${R.gemTimes}</small></button></div>
    <p class="gld-foot"><button class="gld-leave" onclick="guildLeaveAsk()">${denPlain}Leave guild</button>Guild chat: Home → chat → Guild</p></div></div>`;
  }else if(guildTab==='Member'){
   const today=id=>[...(g.id+id+g.day)].reduce((h,c)=>(h*31+c.charCodeAt(0))%997,7)%120;
   const rows=[{id:'me',role:g.role},...g.members.map((id,i)=>({id,role:g.role===0?(i===0?1:2):(i===0?0:i===1?1:2)}))].map(m=>m.id==='me'
    ?`<div class="gld-row me">${portrait('reina')}<div><b>${esc(S.name)}</b><small>Lv. ${level()} · ${r.guildRoles[m.role]} · Power ${gldPower(stats().power)} · Online</small></div><em>${g.contrib}</em></div>`
    :`<div class="gld-row">${folkFace(m.id)}<div><b>${folk(m.id).name} <small>AI</small></b><small>Lv. ${folkLevel(m.id)} · ${r.guildRoles[m.role]} · Power ${gldPower(r.guildFolkPower(m.id,g.lv))} · ${folkStatus(m.id).text}</small></div><em>${today(m.id)}</em></div>`).join('');
   body=`<div class="gld-card"><h2>Members <small>${g.members.length+1}/${cap}</small></h2><p class="gld-cols"><span>Member</span><span>Contribution today</span></p>${rows}</div>`;
  }else if(guildTab==='Ranking'){
   body=`<div class="gld-card"><h2>Guild Ranking <small>by Guild Power</small></h2>${r.guildRanking(S).map(x=>`<div class="gld-row gld-rank ${x.mine?'me':''}"><b class="gld-no">${x.rank}</b>${gldCrest(x.crest)}<div><b>${esc(x.name)}${x.mine?'':' <small>AI</small>'}</b><small>Lv. ${x.lv} · ${x.members} members</small></div><em>${gldPower(x.power)}</em></div>`).join('')}</div>`;
  }else{
   const envs=r.guildEnvelopes(S);
   body=`<div class="gld-card gld-envs"><h2>Red Envelope<button class="gi-rec" onclick="guildEnvRecords()">${denPlain}Surprise Bag Records</button></h2><div class="gld-env-grid">${envs.map(e=>{const from=e.from==='me'?esc(S.name):folk(e.from).name;
    return `<button class="gld-envc ${e.claimed?'claimed':''}" onclick="guildEnvOpen('${e.id}')">${denPlain}<div class="gld-env"><i></i></div><b>${from}${e.from==='me'?'':' <small>AI</small>'}</b><small>“${esc(e.note)}”</small><em>${e.own?'Sent by you':e.claimed?'Claimed · Check Others\' Luck':'Open · '+e.left+' left'}</em></button>`}).join('')}</div>
    <button class="den-gold gld-found" onclick="guildEnvSendAsk()">${denPlain}${gldIcon(3)}Send Surprise Bag</button></div>`;
  }
 }else if(guildPage==='Academy'){
  const acCap=r.guildAcademyCap(g.lv),a=r.guildAcademy.find(x=>x.key===guildPick)||r.guildAcademy[0],lv=g.academy[a.key]||0,cost=r.guildAcademyCost(lv),top=lv>=acCap;
  body=`<div class="gld-card gld-acad"><h2>Guild Academy <small>Cap Lv. ${acCap} at guild Lv. ${g.lv}</small></h2><div class="gld-acgrid">${r.guildAcademy.map(x=>`<button class="${x.key===a.key?'on':''}" onclick="guildPick='${x.key}';cityGuild()">${denPlain}${statIcon(x.key,'gld-stat')}<b>${x.name}</b><small>Lv.${g.academy[x.key]||0}</small></button>`).join('')}</div></div>
  <div class="gld-acdetail">${statIcon(a.key,'gld-stat')}<div><b>${a.name} Lv.${lv}</b><small>Basic ${a.name} ${guildAcademyValue(a,lv)}</small><small>${top?'Raise the guild level to study further':'Next Level: '+guildAcademyValue(a,lv+1)}</small></div><div class="gld-accost"><span>${gldIcon(1)}<b class="${g.contrib>=cost?'':'low'}">${gldPower(g.contrib)}</b>/${gldPower(cost)}</span><button class="den-gold" ${!top&&g.contrib>=cost?'':'disabled'} onclick="guildLearnNow()">${denPlain}Upgrade</button></div></div>`;
 }else if(guildPage==='Beast'){
  const b=r.guildBoss(S),name=m=>m.id==='me'?esc(S.name):folk(m.id).name+' <small>AI</small>',red=r.gearRanks[3];
  const drop=['bow','armor','crown','necklace','boots'].map(slot=>`<span class="gld-drop" style="--rarity:${red.color}">${gearArt({slot,tier:b.tier})}<small>T${b.tier}</small></span>`).join('');
  const reserve=b.reserved?`<button class="den-gold" disabled>${denPlain}Booked ✓</button>`:`<button class="den-gold" ${g.role===0&&g.fund>=R.reserveFund?'':'disabled'} onclick="guildReserveNow()">${denPlain}Reservation Open · ${R.reserveFund} fund</button>`;
  body=`<div class="gld-card gld-bossroom"><h2>T${b.tier} Guild Beast<button class="gi-rec" onclick="guildBeastRules()">${denPlain}?</button></h2><div class="gld-boss-art">${artImage(guildBossArt,'Guild Beast')}</div>
  <i class="gld-bar boss"><u style="width:${b.left/b.hp*100}%"></u><em>${!b.reserved?'Not booked yet':b.dead?'Defeated':fmt(b.left)+' / '+fmt(b.hp)}</em></i>
  <div class="gld-dropbox"><h3>Divine Beast Drop</h3><div>${drop}</div><p>The higher the damage dealt, the better the reward</p></div>
  <div class="den-actions gld-beastbtns">${reserve}${b.dead?`<button class="den-gold" ${b.done||!g.dmg?'disabled':''} onclick="guildClaimBoss()">${denPlain}${b.done?'Reward claimed':g.dmg?'Claim reward':'You did not attack'}</button>`:`<button class="den-gold" ${!b.reserved||b.hits>=R.bossHits?'disabled':''} onclick="guildStrike()">${denPlain}Conduct challenge · ${R.bossHits-b.hits}/${R.bossHits}</button>`}</div>
  <p class="gld-when">Open all day · resets 00:00 UTC <button class="gi-rec" onclick="guildBeastPreview()">${denPlain}Reward Preview</button></p>
  <div class="gld-board">${b.board.map((m,i)=>`<div class="${m.id==='me'?'me':''}"><b>${i+1}</b><span>${name(m)}</span><em>${fmt(m.dmg)}</em></div>`).join('')}</div></div>`;
 }else{
  body=`<div class="gld-card"><h2>Guild Shop</h2><p>Limits reset every Monday. Higher guild levels open finer wares.</p><div class="mart-grid">${r.guildShop.map(w=>{const i=r.bagItemById[w.id],left=w.limit-(g.bought[w.id]||0),shut=g.lv<w.lv||left<1||g.coins<w.price;
   return `<button class="shop-card ${shut?'shut':''}" style="--edge:${bagHue(i.rarity)}" onclick="guildBuyNow('${w.id}')">${denPlain}<small>Limit ${left}/${w.limit}</small>${bagIcon(w.id)}<b>${i.name}</b><em>${g.lv<w.lv?'Guild Lv. '+w.lv:i.kind}</em><span>${gldIcon(5)}${w.price}</span></button>`}).join('')}</div></div>`;
 }
 warArtVars();
 const nav=`<div class="satchel-nav well-nav gld-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button>${[['Info','Info',0],['Academy','Academy',6],['Beast','Guild Beast',4],['Shop','Shop',7]].map(([p,n,i])=>`<button ${p===guildPage?'aria-current="page"':''} onclick="guildGo('${p}')">${denPlain}${gldIcon(i)}${n}</button>`).join('')}</div>`;
 $('#main').innerHTML=`<section class="satchel gld gld-p-${guildPage.toLowerCase()} ${tabs?'gld-tabbed':''} gld-t-${guildTab.toLowerCase()}" style="background-image:url('${artPath('comp-guild-hall')}')"><div class="satchel-top"><strong>Guild</strong>${wallet}</div>${body}${tabs}${nav}</section>`;
}

// ---- Star Duel (rules: WonderGear.duel*). Sky Contest -> Star Duel; contestPage 'Duel', tab in duelTab. -------------
let duelTab='Qualification',duelInfoTab='Qualification';
const duelDate=(t)=>new Date(t).toISOString().slice(5,10);
const duelWho=(pk,k)=>{const p=pk.players[k];return p.me?esc(S.name):esc(p.name)+' <small>AI</small>'};
function duelGo(tab){duelTab=tab;contestPage='Duel';if(screen==='cityContest')cityContest();else go('cityContest')}
function duelWindow(v){const R=WonderGear.duelRules,d=n=>duelDate(v.start+n*864e5);
 return v.stage==='qual'?'Qualification: '+d(0)+' – '+d(R.qualDays-1):v.stage==='group'?'Group stage: '+d(R.groupDay)+' (all day)':v.stage==='peak'?'Peak Game: '+d(R.peakDay)+' · a round every '+R.peakHours+' h':'Next season: '+d(R.period)}
function duelInfo(tab){
 if(tab)duelInfoTab=tab;const r=WonderGear,R=r.duelRules,v=r.duelState(S),d=n=>duelDate(v.start+n*864e5);
 const sched={Qualification:[['The preliminary begins',d(0)+' 00:00'],['End of preliminary',d(R.qualDays-1)+' 24:00']],Group:[['Group stage',d(R.groupDay)+' 00:00–24:00'],['Rounds',(R.groupSize-1)+' fights, any time that day']],
  Peak:Array.from({length:R.peakRounds},(_,k)=>['Round '+(k+1),d(R.peakDay)+' until '+String(R.peakHours*(k+1)).padStart(2,'0')+':00'])}[duelInfoTab];
 const intro={Qualification:['The qualification lasts three days (UTC).','Each adventurer can match for '+R.matches+' games and gets a reward after each battle.','After the qualification, the top '+R.promote+' are promoted to the group stage.','Beating stronger opponents and keeping more HP gives more points.','HP does not recover during a day of qualification; it is full again the next day.'],
  Group:['The '+R.promote+' qualified adventurers are divided into groups of '+R.groupSize+' by strength.','Everyone fights everyone in the group; a victory gives '+R.groupWin+' points.','Rounds you do not fight by the end of the day count as losses.','The top two of each group enter the Peak Game.','Every group fight starts with full HP.'],
  Peak:['32 adventurers in four groups of eight: three knock-out rounds inside each group, then the four group winners meet in the Ultimate Showdown (semi-finals and final). Five rounds on one day.','Fight your round before its deadline, or it counts as a loss.','The HP left after a match carries over to the next one; nothing restores it.','Before a round is decided you may bet '+fmt(R.betStake)+' gold on a player of another match; a right bet pays ×'+R.betPay+'.','Before the first round you may guess the champion; a right guess pays '+fmt(R.guessPay)+' gold.','Ranking rewards arrive by mail when the Peak Game ends.']}[duelInfoTab];
 popup(`<h2>Match Description</h2><div class="duel-info"><h3>${duelInfoTab==='Peak'?'Peak Game':duelInfoTab} Schedule</h3>${sched.map(([a,b])=>`<p class="duel-sched"><span>◆ ${a}</span><b>${b}</b></p>`).join('')}<h3>${duelInfoTab==='Peak'?'Peak Game':duelInfoTab} Intro</h3><ol>${intro.map(x=>`<li>${x}</li>`).join('')}</ol></div>
 <div class="duel-infotabs">${['Qualification','Group','Peak'].map(t=>`<button ${t===duelInfoTab?'aria-current="page"':''} onclick="duelInfo('${t}')">${denPlain}${t==='Peak'?'Peak Game':t}</button>`).join('')}</div>`);
}
function duelInspirePop(){
 const r=WonderGear,R=r.duelRules,v=r.duelState(S);
 popup(`<h2>Inspiration</h2><div class="duel-insp"><p>Each inspiration gives Reina <b>${R.inspStep}%</b> DMG Reduction for this season.</p><p>Current DMG Reduction: <b>${v.insp*R.inspStep}%</b> (Cap: ${R.inspMax*R.inspStep}%)</p><p>Prism Inspiration: <b>${R.inspCost}</b> ${uiIcon('crystals')} / time</p>
 <label class="duel-auto"><button class="soc-check" aria-pressed="${v.auto}" onclick="WonderGear.duelAuto(S,${!v.auto});save();duelInspirePop()">${denPlain}</button>Auto maximize inspirations for the season</label></div>
 <div class="den-actions"><button class="duel-blue" ${v.insp<R.inspMax?'':'disabled'} onclick="duelInspireNow(${R.inspMax})">${denPlain}Quick Inspiration</button><button class="den-gold" ${v.insp<R.inspMax?'':'disabled'} onclick="duelInspireNow(1)">${denPlain}Inspire ${v.insp}/${R.inspMax}</button></div>`);
}
function duelInspireNow(n){if(WonderGear.duelInspire(S,n)){save();duelInspirePop();cityContest()}else toast('Not enough prisms, or the cap is reached.')}
function duelRankPop(){
 const r=WonderGear,v=r.duelState(S),q=r.duelQualRank(S),me=Math.round(stats().power);
 const row=(no,name,pts,pow,mine)=>`<div class="duel-rk ${mine?'me':''}"><b class="duel-no n${Math.min(no,4)}">${no||'–'}</b><span>${name}</span><em>Points: <i>${pts}</i></em><small>⚔ ${gldPower(pow)}</small></div>`;
 popup(`<h2>Qualification Rankings</h2><div class="duel-rks">${q.top.slice(0,20).map((a,i)=>row(i+1,esc(a.name)+' <small>AI</small>',a.now,Math.round(me*a.pow),false)).join('')}</div>${row(q.rank,esc(S.name),v.pts,me,true)}<p class="duel-note">Adventurers who fought and rank in the top <b>${r.duelRules.promote}</b> enter the group stage.</p>`);
}
function duelRewardsPop(){bagArtVars();let from=1;popup('<h2>Ranking Rewards</h2><div class="war-ranks duel-rw">'+WonderGear.duelRanks.map(x=>{const label=x.to>1e6?x.label:x.label;from=x.to+1;return '<div><b>'+label+'</b>'+warPrizes(x.items)+'</div>'}).join('')+'</div><p>Sent by mail when the Peak Game ends.</p>')}
function duelPick(k){
 const r=WonderGear,R=r.duelRules,pk=r.duelPeak(S),p=pk.players[k],v=r.duelState(S),rd=pk.rounds.find(x=>!x.revealed),m=rd?.matches.find(x=>x.a===k||x.b===k);
 const canBet=v.stage==='peak'&&m&&!m.mine&&!Object.hasOwn(v.bets,rd.k),canGuess=v.day<=R.peakDay&&v.guess===undefined&&!pk.rounds[0]?.revealed;
 popup(`<h2>${p.me?esc(S.name):esc(p.name)+' <small>AI</small>'}</h2><p>Power ⚔ ${gldPower(p.power)}</p><div class="den-actions">${canBet?`<button class="den-gold" onclick="duelBetNow(${rd.k},${k})">${denPlain}Bet ${fmt(R.betStake)} gold · round ${rd.k+1}</button>`:''}${canGuess?`<button class="duel-blue" onclick="duelGuessNow(${k})">${denPlain}Guess as champion</button>`:''}</div>${canBet||canGuess?'':'<p>No bet or guess open for this player now.</p>'}`);
}
function duelBetNow(round,k){if(WonderGear.duelBet(S,round,k)){save();$('#modal').close();cityContest();toast('Bet placed.')}else toast('Not enough gold, or this round is closed.')}
function duelGuessNow(k){if(WonderGear.duelGuess(S,k)){save();$('#modal').close();cityContest();toast('Champion guess saved.')}}
// The fight window: both fighters, HP bars and the blows one by one, then the result.
function duelShow(f,title,after){
 const me=esc(S.name),foe=esc(f.foe.name)+' <small>AI</small>';
 popup(`<h2>${title}</h2><div class="duel-fight"><div class="duel-side me"><img src="${reinaLookPath(false)}" alt=""><b>${me}</b><i class="gld-bar"><u id="duelA" style="width:${(f.hits[0]?.mine===false?1:1)*100}%"></u></i></div><span class="duel-vs">VS</span><div class="duel-side"><div class="duel-foe">⚔</div><b>${foe}</b><small>⚔ ${gldPower(f.foe.power)}</small><i class="gld-bar boss"><u id="duelB" style="width:100%"></u></i></div><b class="duel-pop" id="duelPop"></b></div><p class="duel-out" id="duelOut">Fighting…</p>`);
 let i=0;const step=()=>{const box=document.getElementById('duelOut');if(!box)return;const h=f.hits[i++];
  if(!h){box.innerHTML=(f.win?'<b class="win">Victory!</b>':'<b class="loss">Defeat</b>')+(after||'');return}
  const a=document.getElementById('duelA'),b=document.getElementById('duelB'),pop=document.getElementById('duelPop');if(a)a.style.width=h.a*100+'%';if(b)b.style.width=h.b*100+'%';
  if(pop){pop.textContent='-'+fmt(h.dmg);pop.className='duel-pop '+(h.mine?'at-foe':'at-me');void pop.offsetWidth;pop.classList.add('go')}setTimeout(step,380)};
 setTimeout(step,450);
}
function duelMatch(){
 const r=WonderGear,v=r.duelState(S);let f=null,title='',after='';
 if(duelTab==='Qualification'){f=r.duelQualFight(S);if(f?.tired){toast('No HP left today. It is full again tomorrow.');return}title='Qualification · Match '+r.duelState(S).n;if(f)after=`<br>+${f.pts} points · participation reward in the bag`}
 else if(duelTab==='Group'){f=r.duelGroupFight(S);title='Group stage · Round '+r.duelState(S).g.length;if(f)after=f.win?'<br>+'+r.duelRules.groupWin+' points':''}
 else if(duelTab==='Peak'||duelTab==='Ultimate'){f=r.duelPeakFight(S);if(f){title=['Round of 32','Round of 16','Group final','Semi-final','Final'][f.round];after=f.win?'<br>HP carried to the next round: '+r.duelState(S).php+'%':'<br>Out of the Peak Game.'}}
 if(!f){toast('No match open right now.');return}
 save();cityContest();duelShow(f,title,after);
}
// Peak Game board (user photos 2026-11-22): four groups of eight, each a small bracket of round-faces around a VS
// emblem; the four group winners meet in the Ultimate Showdown (semi-finals and final, with champion betting).
let duelPeakGroup=null,duelClock=0;
const duelSpots=[[13,9],[13,37],[87,9],[87,37],[13,63],[13,91],[87,63],[87,91]],duelMid=[[36,23],[64,23],[36,77],[64,77]],duelCore=[[50,36],[50,64]];
function duelFace(pk,k,cls=''){
 if(k===null||k===undefined)return `<span class="duel-face unknown ${cls}"><i>?</i></span>`;
 const p=pk.players[k];if(p.me)return `<span class="duel-face me ${cls}"><img src="${reinaLookPath(false)}" alt=""></span>`;
 const h=[...p.name].reduce((a,c)=>(a*31+c.charCodeAt(0))%360,7);return `<span class="duel-face ${cls}" style="--hue:${h}"><i>${esc(p.name[0])}</i></span>`;
}
const duelShort=(pk,k)=>k===null||k===undefined?'This round':pk.players[k].me?esc(S.name):esc(pk.players[k].name.split(' ')[0])+' <small>AI</small>';
function duelCountdown(v){
 const R=WonderGear.duelRules,dayStart=v.start+R.peakDay*864e5,now=Date.now();
 if(v.day<R.peakDay)return ['Top 32 start countdown',dayStart];
 if(v.day>R.peakDay||v.hours>=R.peakRounds*R.peakHours)return ['Season ends in',v.start+R.period*864e5];
 const k=Math.min(R.peakRounds-1,Math.floor(v.hours/R.peakHours));return [k<3?'Round '+(k+1)+' decides in':k===3?'Semi-finals decide in':'Final decides in',dayStart+(k+1)*R.peakHours*36e5];
}
function duelTick(){
 const el=document.querySelector('.duel-count'),b=el?.querySelector?.('b');if(!el?.dataset||!b){clearInterval(duelClock);duelClock=0;return}
 const left=Math.max(0,+el.dataset.to-Date.now()),d=Math.floor(left/864e5),h=Math.floor(left%864e5/36e5),m=Math.floor(left%36e5/6e4),s=Math.floor(left%6e4/1e3);
 b.textContent=(d?d+'d ':'')+(d||h?h+'h ':'')+m+'m '+String(s).padStart(2,'0')+'s';
}
function duelClockOn(){if(!duelClock)duelClock=setInterval(duelTick,1000);duelTick()}
function duelBoard(pk,g){
 const at=(k,i)=>pk.rounds[k]?.matches[i],win=m=>m?m.win:null;
 const slots=Array.from({length:8},(_,j)=>8*g+j),r0=[0,1,2,3].map(j=>at(0,4*g+j)),r1=[0,1].map(j=>at(1,2*g+j)),r2=at(2,g);
 const node=(x,y,k,cls,label)=>`<button class="duel-node ${cls}" style="left:${x}%;top:${y}%" ${k===null||k===undefined?'disabled':`onclick="duelPick(${k})"`}>${denPlain}${duelFace(pk,k,k!==null&&k!==undefined&&pk.players[k].me?'mine':'')}${label?`<small>${label}</small>`:''}</button>`;
 const lines=[[0,0],[1,0],[2,1],[3,1],[4,2],[5,2],[6,3],[7,3]].map(([s,m])=>`<path d="M${duelSpots[s][0]} ${duelSpots[s][1]}H${duelSpots[s][0]<50?24:76}V${duelMid[m][1]}H${duelMid[m][0]}"/>`).join('')
  +duelMid.map(([x,y],m)=>`<path d="M${x} ${y}H50V${duelCore[m<2?0:1][1]}"/>`).join('');
 const lost=(m,k)=>m&&m.win!==null&&m.win!==k?'out':'';
 const champ=win(r2);
 return `<div class="duel-board"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${lines}</svg>
  ${slots.map((k,j)=>node(duelSpots[j][0],duelSpots[j][1],k,lost(r0[j>>1],k),duelShort(pk,k))).join('')}
  ${r0.map((m,j)=>node(duelMid[j][0],duelMid[j][1],win(m),lost(r1[j>>1],win(m)),'')).join('')}
  ${r1.map((m,j)=>node(duelCore[j][0],duelCore[j][1],win(m),lost(r2,win(m)),'')).join('')}
  ${champ!==null?`<div class="duel-vs won" style="left:50%;top:50%">${duelFace(pk,champ,'big')}<b>👑 ${duelShort(pk,champ)}</b></div>`:`<div class="duel-vs" style="left:50%;top:50%">VS</div>`}</div>`;
}
function duelChampPop(){
 const r=WonderGear,pk=r.duelPeak(S),v=r.duelState(S),last=[...pk.rounds].reverse().find(x=>x.revealed);
 const alive=last?last.matches.map(m=>m.win).filter(k=>k!==null):pk.players.map((_,k)=>k);
 const open=v.guess===undefined&&!pk.rounds[3]?.revealed&&v.day<=r.duelRules.peakDay;
 popup(`<h2>Champ Betting</h2><p>Guess the champion before the semi-finals are decided. A right guess pays <b>${fmt(r.duelRules.guessPay)}</b> gold.</p>${v.guess!==undefined?`<p>Your bet is on: <b>${duelWho(pk,v.guess)}</b></p>`:''}
 <div class="duel-champs">${alive.map(k=>`<button ${open?'':'disabled'} onclick="duelGuessNow(${k})">${denPlain}${duelFace(pk,k)}<b>${duelShort(pk,k)}</b></button>`).join('')}</div>${open?'':'<p class="duel-note">Champion betting is closed.</p>'}`);
}
function duelRecordPop(){
 const r=WonderGear,v=r.duelState(S),pk=r.duelPeak(S),names=['Round of 32','Round of 16','Group final','Semi-final','Final'];
 const peak=pk.rounds.flatMap(rd=>rd.matches.filter(m=>m.mine&&m.win!==null).map(m=>`<div class="${m.win===0?'me':''}"><b>${names[rd.k]}</b><span>vs ${duelWho(pk,m.a===0?m.b:m.a)}</span><em>${m.win===0?'Win':'Loss'}</em></div>`));
 popup(`<h2>Record</h2><div class="gld-board"><div><b>Qual.</b><span>${v.n} fights · ${v.w} wins · ${v.pts} points</span><em></em></div>${v.g.length?`<div><b>Group</b><span>${v.g.filter(x=>x).length} wins · ${v.g.filter(x=>!x).length} losses</span><em></em></div>`:''}${peak.join('')}</div>`);
}
function duelBigTabs(pk,v,R){
 if(duelTab==='Peak'){
  const mine=pk.inn?0:-1;if(duelPeakGroup===null)duelPeakGroup=mine>=0?0:0;const g=duelPeakGroup;
  const canMatch=v.stage==='peak'&&pk.myRound>=0&&pk.myRound<3;
  return {main:`<div class="duel-ghead"><b>Group ${g+1}</b><small>${pk.inn?pk.meAlive?'You fight in Group 1 · HP '+v.php+'%':'You are out of the Peak Game':'Tap a player to bet or guess the champion'}</small></div>${duelBoard(pk,g)}`,
   bar:`<div class="duel-gtabs">${[0,1,2,3].map(i=>`<button ${i===g?'aria-current="page"':''} onclick="duelPeakGroup=${i};cityContest()">${denPlain}Group ${i+1}</button>`).join('')}</div>`,canMatch};
 }
 const semis=pk.rounds[3],fin=pk.rounds[4],w=m=>m?.win??null;
 const finalists=fin?[fin.matches[0].a,fin.matches[0].b]:[null,null],champ=pk.champion;
 const fig=(k,side)=>`<div class="duel-fin ${side}">${k!==null&&pk.players[k].me?`<img src="${reinaLookPath(false)}" alt="">`:`<img class="shade" src="${reinaLookPath(false)}" alt="">`}${champ!==null&&champ===k?'<b class="duel-crown">👑</b>':''}
  ${k!==null&&fin&&!fin.revealed&&!pk.players[k].me?`<button class="duel-bet" onclick="duelPick(${k})">${denPlain}Bet</button>`:''}</div>`;
 const canMatch=v.stage==='peak'&&pk.myRound>=3;
 return {main:`<div class="duel-ult">${fig(finalists[0],'l')}${fig(finalists[1],'r')}
  <div class="duel-band"><span>${duelFace(pk,finalists[0])}<b>${finalists[0]===null?'Undetermined':duelWho(pk,finalists[0])}</b></span><i>VS</i><span><b>${finalists[1]===null?'Undetermined':duelWho(pk,finalists[1])}</b>${duelFace(pk,finalists[1])}</span></div></div>`,
  bar:`<div class="duel-panel duel-champ"><h3>Champ Betting<button class="duel-q" onclick="duelInfo('Peak')">${denPlain}?</button></h3><p>Successful guess wins: ${uiIcon('gold')} <b>${fmt(R.guessPay)}</b></p><p>Your bet is on: <b>${v.guess===undefined?'—':duelWho(pk,v.guess)}</b></p>
  ${semis?`<p class="duel-semis">Semi-finals: ${semis.matches.map(m=>duelWho(pk,m.a)+' vs '+duelWho(pk,m.b)+(m.win!==null?' → '+duelWho(pk,m.win):'')).join(' · ')}</p>`:'<p class="duel-semis">The four group winners of the Peak Game meet here: semi-finals, then the final.</p>'}</div>`,canMatch,champBtn:true};
}
function duelRoom(){
 const r=WonderGear,R=r.duelRules;warArtVars();bagArtVars();
 const paid=r.duelSettle(S);if(paid.mail&&r.duelPlace(S)===1&&typeof titleGrant==='function')titleGrant('duel');if(paid.gold||paid.mail){save();if(paid.mail)toast('Star Duel rewards are in your Mail.');else toast('Bets paid: +'+fmt(paid.gold)+' gold')}
 const v=r.duelState(S),q=r.duelQualRank(S),st=stats(),place=r.duelPlace(S);
 if(!['Qualification','Group','Peak','Ultimate'].includes(duelTab))duelTab='Qualification';
 let panel='',canMatch=false,matchNote='';
 if(duelTab==='Qualification'){
  canMatch=v.stage==='qual'&&v.n<R.matches&&v.hp>0;matchNote=v.stage!=='qual'?'Closed':v.n>=R.matches?'Done':v.hp<=0?'Rest':'';
  panel=`<h3>Current Ranking: ${q.rank?'No.'+q.rank:'—'} <small>(Top ${R.promote} can be promoted)</small><button class="duel-q" onclick="duelInfo('Qualification')">${denPlain}?</button></h3>
  <div class="duel-stats"><span>Current Ranking:</span><b>${q.rank||'—'}</b><span>Remaining attempts:</span><b>${R.matches-v.n}</b><span>Match Points:</span><b>${v.pts}</b><span>Win Rate:</span><b>${v.n?Math.round(v.w/v.n*100):0}%</b></div>
  <i class="gld-bar duel-hp"><u style="width:${v.hp}%"></u><em>HP today ${v.hp}%</em></i>
  <div class="duel-part"><span>Participation Rewards</span>${Object.entries(r.duelPart).map(([id,n])=>`<span class="bag-gain" style="--rarity:${bagHue(r.bagItemById[id].rarity)}">${bagIcon(id)}<b>×${n}</b></span>`).join('')}</div>`;
 }else if(duelTab==='Group'){
  const g=r.duelGroup(S);
  if(!g)panel=`<h3>Group Stage<button class="duel-q" onclick="duelInfo('Group')">${denPlain}?</button></h3><p class="duel-note">${v.stage==='qual'?'Opens on '+duelDate(v.start+R.groupDay*864e5)+' for the top '+R.promote+' of the qualification.':'Only the top '+R.promote+' of the qualification play here. Your rank: '+(q.rank||'—')+'.'}</p>`;
  else{canMatch=v.stage==='group'&&g.next!==null;matchNote=v.stage!=='group'?'Closed':g.next===null?'Done':'';
   panel=`<h3>Your Group · Round ${Math.min(v.g.length+1,R.groupSize-1)}/${R.groupSize-1}<button class="duel-q" onclick="duelInfo('Group')">${denPlain}?</button></h3><div class="duel-table">${g.standing.map((m,i)=>`<div class="${m.me?'me':''} ${i<2?'up':''}"><b>${i+1}</b><span>${m.me?esc(S.name):esc(m.name)+' <small>AI</small>'}</span><em>${m.won}–${m.lost}</em><i>${m.pts}</i></div>`).join('')}</div>
   <p class="duel-note">${g.next!==null?'Next: '+esc(g.members[g.next].name)+' AI':g.top2?'Top two: you enter the Peak Game!':'The group is over.'}</p>`}
 }
 const nav=`<div class="satchel-nav well-nav duel-nav"><button data-back aria-label="Back to Sky Contest" onclick="contestLeave()">‹</button>${[['Qualification',4],['Group',5],['Peak',6],['Ultimate',7]].map(([t,i])=>`<button ${t===duelTab?'aria-current="page"':''} onclick="duelGo('${t}')">${denPlain}${warIcon(i)}${t==='Peak'?'Peak Game':t==='Ultimate'?'Ultimate Showdown':t}</button>`).join('')}</div>`;
 const tool=(icon,label,click)=>`<button class="duel-tool" onclick="${click}">${denPlain}${icon}<small>${label}</small></button>`;
 if(duelTab==='Peak'||duelTab==='Ultimate'){
  const pk=r.duelPeak(S),big=duelBigTabs(pk,v,R),[label,to]=duelCountdown(v);
  $('#main').innerHTML=`<section class="satchel duel-room duel-big duel-t-${duelTab.toLowerCase()}" style="background-image:url('${artPath('comp-war-field')}')">
  <div class="duel-time duel-count" data-to="${to}">${label}: <b></b><button class="duel-q" onclick="duelInfo('Peak')">${denPlain}?</button></div>
  ${big.main}${big.bar}
  <div class="duel-acts">${tool(warIcon(3),'Inspire '+v.insp+'/'+R.inspMax,'duelInspirePop()')}${big.champBtn?`<button class="den-gold duel-match" onclick="duelChampPop()">${denPlain}Champ Betting</button>`:`<button class="den-gold duel-match" ${big.canMatch?'':'disabled'} onclick="duelMatch()">${denPlain}${big.canMatch?'Match':pk.inn?pk.meAlive?'Wait':'Out':'Watch'}</button>`}${big.champBtn&&big.canMatch?`<button class="den-gold duel-match" onclick="duelMatch()">${denPlain}Match</button>`:tool(bagIcon('chest3'),'Rewards','duelRewardsPop()')}${tool(warIcon(7),'Record','duelRecordPop()')}</div>
  ${nav}</section>`;duelClockOn();return;
 }
 $('#main').innerHTML=`<section class="satchel duel-room duel-t-${duelTab.toLowerCase()}" style="background-image:url('${artPath('comp-war-field')}')">
  <div class="duel-time">${duelWindow(v)}</div>
  <div class="duel-hero"><small>Lv ${level()} ${esc(S.name)}</small><img src="${reinaLookPath(false)}" alt="Reina"><b>⚔ ${fmt(Math.round(st.power))}</b></div>
  <div class="duel-panel">${panel}</div>
  <div class="duel-acts">${tool(warIcon(3),'Inspire '+v.insp+'/'+R.inspMax,'duelInspirePop()')}<button class="den-gold duel-match" ${canMatch?'':'disabled'} onclick="duelMatch()">${denPlain}${canMatch?'Match':matchNote||'Match'}</button>${tool(warIcon(7),'Rankings','duelRankPop()')}${tool(bagIcon('chest3'),'Rewards','duelRewardsPop()')}</div>
  ${nav}</section>`;
}

let petPage='Formation',petFocus=null,emblemFilter='All',petBack='',petBackNext='';
// Leaving the room: back to Wonders when it was opened from the Pets tab there, otherwise to the city.
function petLeave(){if(petBack==='wonders'){petBack='';filter='wings';go('collection')}else go('home')}
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
// Pet rooms (rebuilt after the user's reference photos): painted pets everywhere, cards with a rarity ribbon and stars.
let petMode='Feeding';
const petModes=['Feeding','Gear','Talent'];
// Pet gear and talents (they belong to the Primary Pet slot of the pet on stage).
let gearPick=0,talentSlotPick=0,talentCell=-1,talentTab='Common',talentProphecy=false,talentPending=null,talentLog=[];
// The three icon atlases are handed to CSS once, as variables, so that modals can use them too.
function petArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--pet-tal'))return;
 for(const [key,id] of [['tal','comp-pet-talents'],['gear','comp-pet-gear'],['misc','comp-pet-misc']])root.style.setProperty('--pet-'+key,'url("'+artPath(id)+'")')}
const denIcon=(sheet,n,cols,rows)=>'<i class="den-ico" style="background-image:var(--pet-'+sheet+');background-size:'+cols*100+'% '+rows*100+'%;background-position:'+(n%cols)/(cols-1)*100+'% '+(rows>1?Math.floor(n/cols)/(rows-1)*100:0)+'%"></i>';
// Colour shows strength (green common, red Top); the corner chip shows the kind (sword attack, shield guard).
const talentIcon=id=>{const t=WonderGear.petTalents.find(x=>x.id===id);return denIcon('tal',WonderGear.petTalents.indexOf(t),4,Math.ceil(WonderGear.petTalents.length/4)).replace('class="den-ico"','class="den-ico tal-'+(t?.kind||'atk')+'"')};
const talentKind=t=>(t.top?'Top ':'')+(t.kind==='atk'?'Attack':'Guard');
const talentOf=id=>WonderGear.petTalents.find(t=>t.id===id);
function petGearUp(times){
 const slot=WonderGear.petTeam(S).indexOf(petFocus);let done=0;
 while(done<times&&WonderGear.upgradePetGear(S,slot,gearPick))done++;
 if(!done){const cost=WonderGear.petGearCost(WonderGear.petGearLevels(S,slot)[gearPick]);toast(!cost?'This piece is at its highest level.':S.gold<cost.gold?'Not enough gold.':'Not enough shards for the next tier.');return}
 save();cityPet();
}
function petGearSetInfo(){
 const r=WonderGear;popup('<h2>Gear set</h2><p>Each Primary Pet slot holds eight pieces. Ten levels make one tier (T1 to T10); the first level of a new tier also costs shards.</p><p>The set bonus follows the <b>lowest</b> tier among the eight pieces: the pet in that slot deals <b>+'+r.petGearSetStep+'%</b> bolt damage per tier.</p><p>Horn Caps, Fang Guard, Claw Gauntlet and Spirit Orb add pet ATK (+'+r.petGearStep.atk+' a level). Collar and Chest Plate add Reina HP (+'+r.petGearStep.hp+'). Wing Brace and Tail Ring add Reina DEF (+'+r.petGearStep.def+').</p><p>Gear stays in the slot when you replace the pet.</p>');
}
function talentGo(slot){talentSlotPick=slot;talentCell=-1;talentTab='Common';talentPending=null;petTab('Talent')}
function talentPickSlot(slot){if(WonderGear.petTeam(S)[slot]){talentSlotPick=slot;talentCell=-1;talentPending=null;cityPet()}}
function talentOpen(){if(WonderGear.openTalentCell(S,talentSlotPick)){save();cityPet()}else toast('Not enough talent seals.')}
function talentNote(roll){const t=talentOf(roll.id);return 'Slot '+(talentSlotPick+1)+': '+t.name+(roll.replaces?' replaced '+talentOf(roll.replaces).name:' inscribed')}
function talentLearn(){
 if(talentPending)return;const r=WonderGear,st=r.talentState(S),cost=r.learnCost(S,talentSlotPick);
 const roll=r.learnTalent(S,talentSlotPick,Math.random,talentProphecy);
 if(!roll){toast(st.seals<cost?'Not enough talent seals.':talentProphecy&&st.books<1?'No Prophecy Books. Buy one in the Shop.':'Nothing can change: unlock a talent or open a cell.');return}
 save();
 if(roll.held)talentPending={slot:talentSlotPick,roll};else{talentLog.unshift(talentNote(roll));talentCell=roll.cell;talentTab='Common';toast(talentOf(roll.id).name+' inscribed')}
 cityPet();
}
function talentKeep(yes){
 const p=talentPending;if(!p)return;talentPending=null;
 if(yes&&WonderGear.keepTalent(S,p.slot,p.roll)){save();talentLog.unshift(talentNote(p.roll));talentCell=p.roll.cell}else talentLog.unshift('Slot '+(p.slot+1)+': '+talentOf(p.roll.id).name+' foreseen and let go');
 cityPet();
}
function talentLock(){if(WonderGear.lockTalent(S,talentSlotPick,talentCell)){save();cityPet()}}
function talentForget(){if(WonderGear.forgetTalent(S,talentSlotPick,talentCell)){save();talentCell=-1;cityPet()}}
function talentRow(t,extra=''){return '<div class="den-trow">'+talentIcon(t.id)+'<div><b>'+t.name+'</b><small>'+talentKind(t)+' · passive'+(t.top?' · scroll only':'')+'</small><p>'+t.text+'</p></div>'+extra+'</div>'}
function talentGuide(){const r=WonderGear;popup('<h2>Pet talents</h2><p>Learn inscribes a random talent this slot does not have: into an empty cell, or over a random unlocked one. A locked talent is safe, but every lock makes Learn 50% dearer. Talents work while a pet stands in the slot.</p><div class="den-tlist">'+r.petTalents.map(t=>talentRow(t)).join('')+'<div class="den-trow">'+denIcon('misc',2,4,1)+'<div><b>'+r.talentSupreme.name+'</b><small>Supreme</small><p>'+r.talentSupreme.text+'</p></div></div></div>')}
function talentLogShow(){popup('<h2>Learning log</h2>'+(talentLog.length?'<div class="den-tlist">'+talentLog.slice(0,20).map(x=>'<p>'+esc(x)+'</p>').join('')+'</div>':'<p>Nothing learned yet in this visit.</p>'))}
function talentTargetPick(){
 const r=WonderGear,v=r.talentState(S).slots[talentSlotPick];
 popup('<h2>Learn target</h2><p>The chosen talent is four times as likely to come up for Slot '+(talentSlotPick+1)+'.</p><div class="den-tlist">'+r.petTalents.filter(t=>!t.top&&!v.cells.includes(t.id)).map(t=>talentRow(t,'<button onclick="talentSetTarget(\''+t.id+'\')">'+denPlain+(v.target===t.id?'Chosen':'Choose')+'</button>')).join('')+'</div>'+(v.target?'<button onclick="talentSetTarget(\'\')">'+denPlain+'No target</button>':''));
}
function talentSetTarget(id){if(WonderGear.setTalentTarget(S,talentSlotPick,id)){save();$('#modal').close();cityPet()}}
function talentBuy(id){
 const r=WonderGear,st=r.talentState(S),v=st.slots[talentSlotPick];
 if(id==='book'){if(!r.buyTalentBook(S)){toast('Not enough talent seals.');return}}
 else if(!r.buyTalentScroll(S,talentSlotPick,id)){toast(v.cells.includes(id)?'Slot '+(talentSlotPick+1)+' already has this talent.':st.seals<r.talentPrice(id)?'Not enough talent seals.':'No empty cell in Slot '+(talentSlotPick+1)+'. Open one or forget a talent.');return}
 else talentLog.unshift('Slot '+(talentSlotPick+1)+': '+talentOf(id).name+' inscribed from a scroll');
 save();if($('#modal').open)$('#modal').close();cityPet();toast(id==='book'?'Prophecy Book bought':talentOf(id).name+' inscribed in Slot '+(talentSlotPick+1));
}
// Tapping a ware shows what it is first (a small item card); buying is the button inside.
function talentWare(id){
 const r=WonderGear,st=r.talentState(S),v=st.slots[talentSlotPick],book=id==='book',t=book?null:talentOf(id);if(!book&&!t)return;
 const price=book?r.talentBook:r.talentPrice(id),has=!book&&v.cells.includes(id),empty=v.cells.some((x,n)=>n<v.open&&!x);
 const why=has?'Slot '+(talentSlotPick+1)+' already has this talent.':!book&&!empty?'No empty cell in Slot '+(talentSlotPick+1)+'. Open one or forget a talent.':st.seals<price?'Not enough talent seals.':'';
 popup('<div class="den-item"><div class="den-item-head">'+(book?denIcon('misc',1,4,1):talentIcon(id))+'<div><b>'+(book?'Prophecy Book':t.name)+'</b><small>Type: <u>'+(book?'Pet talent book':talentKind(t)+' talent scroll')+'</u></small><small>'+(book?'You have: '+st.books:'For: Slot '+(talentSlotPick+1))+'</small></div></div>'
  +'<h3>◆ Item Description</h3><p>'+(book?'Tick Prophecy before Learn: one book shows which talent would be inscribed, and you choose to keep it or let it go.':t.text+' The scroll inscribes it into the first empty cell of the slot.')+'</p>'
  +(why?'<p class="den-why">'+why+'</p>':'')
  +'<div class="den-actions"><button class="den-gold" onclick="talentBuy(\''+id+'\')" '+(why?'disabled':'')+'>'+denPlain+'Buy · '+denIcon('misc',0,4,1)+price+'</button></div></div>');
}
function talentExchange(){
 const r=WonderGear,count=rarity=>r.familiars.filter(p=>p.rarity===rarity).reduce((n,p)=>n+r.petSpares(S,p.id),0);
 popup('<h2>Fragment exchange</h2><p>Turn spare pet copies into talent seals.</p><div class="den-tlist">'+Object.entries(r.sealRates).map(([rarity,rate])=>{const n=count(rarity);return '<div class="den-trow">'+denIcon('misc',0,4,1)+'<div><b>'+rarity+' copies ×'+n+'</b><small>'+rate+' seals each</small></div><button '+(n?'':'disabled')+' onclick="talentTrade(\''+rarity+'\')">'+denPlain+'+'+fmt(n*rate)+'</button></div>'}).join('')
  +'<div class="den-trow">'+denIcon('misc',0,4,1)+'<div><b>'+fmt(r.sealGold.gold)+' gold</b><small>You have '+fmt(S.gold)+'</small></div><button '+(S.gold<r.sealGold.gold?'disabled':'')+' onclick="talentTrade(\'gold\')">'+denPlain+'+'+r.sealGold.seals+'</button></div></div><p>Seals also come from dungeon guardians (+30) and Jungle Trek chests (+10 each).</p>');
}
function talentTrade(kind){
 const got=kind==='gold'?(WonderGear.buySeals(S)?WonderGear.sealGold.seals:0):WonderGear.exchangeSpares(S,kind);
 if(!got)return;save();cityPet();talentExchange();toast('+'+fmt(got)+' talent seals');
}
const petRarity={Common:['Common','c'],Rare:['Rare','r'],Epic:['Epic','e'],'Super Rare':['S.Rare','s'],Legendary:['Legend','l']};
// An empty svg keeps decorateArt() from adding a stock icon to a text button.
const denPlain='<svg class="den-x" width="0" height="0" aria-hidden="true"></svg>';
function petPicture(p){return p.portrait||artPath(p.id)}
function petStarCount(id){return id==='d1'?S.emberStars||0:S.petStars?.[id]||0}
function petCard(id,click,label,selected=false){
 if(!id)return '<button class="den-card den-empty" onclick="'+click+'" aria-label="'+label+'">'+denPlain+'<i>+</i><small>'+label+'</small></button>';
 const p=item(id),[tag,key]=petRarity[p.rarity]||[p.rarity,'r'],stars=petStarCount(id);
 return '<button class="den-card den-'+key+(S.owned.includes(id)?'':' den-locked')+'" aria-pressed="'+selected+'" aria-label="'+esc(p.name)+', '+p.rarity+', '+label+'" onclick="'+click+'"><em>'+tag+'</em>'+(S.owned.includes(id)?'':'<i class="den-lockchip" aria-hidden="true">🔒</i>')+'<img src="'+petPicture(p)+'" alt="" draggable="false"><span class="den-stars">'+'★'.repeat(stars)+'</span><b>'+esc(p.name)+'</b><small>'+label+'</small></button>';
}
function pickPet(slot){
 const team=WonderGear.petTeam(S),owned=ITEMS.filter(p=>p.type==='dragon'&&S.owned.includes(p.id));
 popup('<h2>'+ (slot<3?'Primary Pet':'Pet Assist')+'</h2><div class="den-picker">'+owned.map(p=>petCard(p.id,"assignPet("+slot+",'"+p.id+"')",team.includes(p.id)?'Deployed':'Select',team[slot]===p.id)).join('')+'</div>'+(slot&&team[slot]?'<button onclick="assignPet('+slot+',null)">'+denPlain+'Remove</button>':''));
}
// Assist pages and the Synthesize room.
let assistPage=0,synthTier='Rare',synthPicks=[];
function assistTurn(n){const pages=WonderGear.assistPages.length;assistPage=(n+pages)%pages;cityPet()}
function synthSpares(){const from=WonderGear.synthChain[synthTier];return WonderGear.familiars.filter(p=>p.rarity===from&&WonderGear.petSpares(S,p.id)>0)}
function synthFree(id){return WonderGear.petSpares(S,id)-synthPicks.filter(x=>x===id).length}
function synthSet(tier){if(WonderGear.synthChain[tier]){synthTier=tier;synthPicks=[];cityPet()}}
function synthAdd(){
 // Fill the empty places, taking from the pets with the most spare copies first.
 while(synthPicks.length<WonderGear.synthNeed){const next=synthSpares().filter(p=>synthFree(p.id)>0).sort((a,b)=>synthFree(b.id)-synthFree(a.id))[0];if(!next)break;synthPicks.push(next.id)}
 if(!synthPicks.length)toast('No spare '+WonderGear.synthChain[synthTier]+' copies yet. Summon pets to get them.');
 cityPet();
}
function synthDrop(i){synthPicks.splice(i,1);cityPet()}
function synthShow(results){
 const one=results.length===1,r=results[0],p=item(r.id),[tag,key]=petRarity[p.rarity]||[p.rarity,'r'];
 const body=one?'<em class="den-rarity den-'+key+'">'+tag+'</em><div class="den-burst"><img src="'+petPicture(p)+'" alt="'+esc(p.name)+'"></div><h3>'+esc(p.name)+'</h3><b class="den-tag '+(r.isNew?'o':'v')+'">'+(r.isNew?'New pet!':'Already yours · +1 spare copy')+'</b>'
  :'<div class="den-picker">'+results.map(x=>petCard(x.id,'',x.isNew?'New!':'+1 copy')).join('')+'</div>';
 popup('<div class="den-congrats" onclick="$(\'#modal\').close()"><h2>Congratulations</h2>'+body+'<small>Tap anywhere to close</small></div>');
}
function synthRun(batch){
 const need=WonderGear.synthNeed,results=[];
 if(batch){synthPicks=[];for(;;){while(synthPicks.length<need){const next=synthSpares().filter(p=>synthFree(p.id)>0).sort((a,b)=>synthFree(b.id)-synthFree(a.id))[0];if(!next)break;synthPicks.push(next.id)}
   if(synthPicks.length<need)break;const r=WonderGear.synthesizePet(S,synthTier,synthPicks);synthPicks=[];if(!r)break;results.push(r)}}
 else{if(synthPicks.length<need){toast('Add '+need+' spare copies first.');return}const r=WonderGear.synthesizePet(S,synthTier,synthPicks);if(r)results.push(r)}
 synthPicks=[];
 if(!results.length){toast('Not enough spare '+WonderGear.synthChain[synthTier]+' copies ('+need+' needed).');cityPet();return}
 save();cityPet();synthShow(results);
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
 petArtVars();
 const rules=WonderGear,team=rules.petTeam(S),pets=ITEMS.filter(p=>p.type==='dragon');
 if(!petFocus||petPage==='Formation'&&!team.slice(0,3).includes(petFocus))petFocus=S.dragon;
 if(petPage==='Badge'&&emblemFilter!=='All'&&item(petFocus).rarity!==emblemFilter)petFocus=pets.find(p=>p.rarity===emblemFilter)?.id||S.dragon;
 const p=item(petFocus),owned=S.owned.includes(p.id),lv=rules.petLevel(S,p.id),atk=rules.petAttack(S,p.id),rank=rules.badgeRank(S,p.id),stars=petStarCount(p.id);
 const [tag,key]=petRarity[p.rarity]||[p.rarity,'r'],kind=p.title.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase());
 const shards=rules.state(S).materials.shard,starShards=p.id==='d1'?S.emberShards||0:shards,teamAtk=rules.petTeamAttack(S);
 const switchTo=(page,id)=>"petTab('"+page+"','"+id+"')";
 const art=(q,cls)=>'<img class="'+cls+'" src="'+petPicture(q)+'" alt="'+esc(q.name)+'" draggable="false">';
 const strip=(list,page)=>'<div class="den-strip">'+list.map(q=>petCard(q.id,switchTo(page,q.id),S.owned.includes(q.id)?'Lv. '+rules.petLevel(S,q.id):'Locked',q.id===p.id)).join('')+'</div>';
 const lineup='<div class="den-lineup">'+team.slice(0,3).map((id,i)=>'<div>'+petCard(id,id?switchTo('Formation',id):'pickPet('+i+')',id?'Lv. '+rules.petLevel(S,id):'Deploy',id===p.id)+(id?'<button class="den-link" onclick="pickPet('+i+')">'+denPlain+'Replace</button>':'<span class="den-link"></span>')+'</div>').join('')+'</div>';
 const power=n=>'<div class="den-power">⚔ <b>'+fmt(n)+'</b></div>';
 const up=n=>'<i class="den-up">▲ '+n+'</i>';
 const gem='<span class="den-gem" aria-hidden="true">◆</span>';
 // One purchase line: what you have, what it costs, and the golden button.
 const buy=(m)=>'<div class="den-cost">'+(m.max?'Maximum reached':m.icon+'<b class="'+(m.have<m.cost?'low':'')+'">'+fmt(m.have)+'</b> / '+fmt(m.cost)+' '+m.unit)+'</div><button class="den-gold" onclick="'+m.act+'" '+(m.max||m.have<m.cost||m.off?'disabled':'')+'>'+denPlain+(m.max?'Max':m.label)+'</button>';
 const offers={
  Feeding:{have:S.gold,cost:lv*100,unit:'gold',max:lv>=rules.petCap,label:'Fast Feed',act:'petFeed()',icon:uiIcon('gold')},
  Stars:{have:starShards,cost:10*(stars+1),unit:p.id==='d1'?'Ember shards':'shards',max:stars>=6,label:'Star-up',act:'starPet()',icon:gem,off:!owned},
  Badge:{have:shards,cost:5*(rank+1),unit:'shards',max:rank>=20,label:'Forge Badge',act:'forgePetBadge()',icon:gem,off:!owned}
 };
 let body,top='';
 if(petPage==='Formation'){
  const flank=team.slice(0,3).filter(id=>id&&id!==p.id).map(id=>item(id));
  top=power(teamAtk)+'<button class="den-rec" onclick="recommendPets()">'+denPlain+'<i>✦</i>Recommended<br>Lineup</button>';
   if(petMode!=='Gear')petMode='Feeding';
   const slot=team.indexOf(p.id),modes='<div class="den-modes">'+[['Feeding',"petMode='Feeding';cityPet()"],['Gear',"petMode='Gear';cityPet()"],['Talent','talentGo('+slot+')']].map(([x,act])=>'<button aria-pressed="'+(x===petMode)+'" onclick="'+act+'">'+denPlain+'Pet '+x+'</button>').join('')+'</div>';
   if(petMode==='Gear'){
    const levels=rules.petGearLevels(S,slot),bonus=rules.petGearBonus(S,slot);if(!(gearPick>=0&&gearPick<levels.length))gearPick=0;
    const piece=rules.petGearPieces[gearPick],lvl=levels[gearPick],cost=rules.petGearCost(lvl),step=rules.petGearStep[piece.stat],label={atk:'Pet ATK',hp:'Reina HP',def:'Reina DEF'}[piece.stat];
    const tile=n=>'<button class="den-gear'+(levels[n]?'':' den-gear-none')+'" aria-pressed="'+(n===gearPick)+'" aria-label="'+rules.petGearPieces[n].name+', level '+levels[n]+'" onclick="gearPick='+n+';cityPet()">'+denPlain+denIcon('gear',n,4,2)+'<em>'+(levels[n]?'T'+rules.petGearTier(levels[n]):'')+'</em><b>'+(levels[n]?'+'+levels[n]:'Forge')+'</b></button>';
    body='<div class="den-stage den-gearstage"><div class="den-gearcol">'+[0,1,2,3].map(tile).join('')+'</div><span class="den-glow"></span>'+art(p,'den-main')+'<div class="den-gearcol den-right">'+[4,5,6,7].map(tile).join('')+'</div><h2 class="den-name"><em class="den-'+key+'">'+tag+'</em>'+esc(p.name)+' · Slot '+(slot+1)+'</h2></div>'
     +'<section class="den-panel den-gearinfo"><h3>'+piece.name+' · '+(lvl?'T'+rules.petGearTier(lvl)+' +'+lvl:'not forged yet')+'</h3><p>'+label+' <b>+'+fmt(lvl*step)+'</b>'+(cost?' ▲ <b>+'+fmt((lvl+1)*step)+'</b>':' · highest level')+'</p><p>Set: lowest tier <b>T'+bonus.tier+'</b> · this pet\'s bolts <b>+'+bonus.dmg+'%</b> <u onclick="petGearSetInfo()">How sets work</u></p></section>'
     +'<div class="den-cost">'+(cost?uiIcon('gold')+'<b class="'+(S.gold<cost.gold?'low':'')+'">'+fmt(S.gold)+'</b> / '+fmt(cost.gold)+' gold'+(cost.shard?' · '+gem+'<b class="'+(shards<cost.shard?'low':'')+'">'+shards+'</b> / '+cost.shard+' shards':''):'Highest level reached')+'</div>'
     +'<div class="den-actions"><button class="den-gold" onclick="petGearUp(1)" '+(cost?'':'disabled')+'>'+denPlain+(lvl?'Upgrade':'Forge')+'</button><button class="den-gold" onclick="petGearUp(10)" '+(cost?'':'disabled')+'>'+denPlain+'×10</button></div>'
     +modes+lineup;
   }else
  body='<div class="den-stage">'+flank.map((q,i)=>art(q,'den-flank den-flank-'+i)).join('')+'<span class="den-glow"></span>'+art(p,'den-main')+'<h2 class="den-name"><em class="den-'+key+'">'+tag+'</em>'+esc(p.name)+'</h2></div>'
   +'<div class="den-skills"><div><span class="den-orb">'+art(p,'')+'<u>'+rank+'</u></span><small>Deploy</small><b class="den-tag o">Team ATK +'+fmt(atk+rank*5)+'</b><b class="den-tag v">Badge Lv.'+rank+' · +'+rank*5+'</b></div>'
   +'<div><span class="den-orb den-aura den-'+key+'">✦</span><small>Aura</small><b class="den-tag o">'+kind+'</b><b class="den-tag v">Stars '+stars+'/6 · +'+stars*30+'</b></div></div>'
   +'<div class="den-level"><span>Lv. '+lv+'</span></div>'
   +'<div class="den-exp"><small>LEVEL</small><span><i style="width:'+lv/rules.petCap*100+'%"></i><b>'+lv+' / '+rules.petCap+'</b></span></div>'
   +'<div class="den-stats"><span>ATK : <b>'+fmt(atk)+'</b>'+(lv<rules.petCap?up(12):'')+'</span><span>BADGE : <b>+'+rank*5+'</b>'+(rank<20?up(5):'')+'</span><span>STARS : <b>+'+stars*30+'</b>'+(stars<6?up(30):'')+'</span><span>TEAM : <b>'+fmt(teamAtk)+'</b></span></div>'
   +buy(offers.Feeding)
   +modes
   +lineup;
 }else if(petPage==='Assist'){
  top=power(teamAtk);
  const pages=rules.assistPages,open=rules.assistSlots(S)/12,roman=['I','II','III','IV'];
  if(assistPage>=pages.length)assistPage=0;
  const first=3+assistPage*12,locked=assistPage>=open;
  const cells=locked?'<p class="den-lock">Page '+roman[assistPage]+' opens at hero level '+pages[assistPage]+'.</p>'
   :'<div class="den-assists">'+team.slice(first,first+12).map((id,i)=>'<div>'+petCard(id,'pickPet('+(first+i)+')',id?'Lv. '+rules.petLevel(S,id):'Assign')+(id?'<button class="den-link" onclick="pickPet('+(first+i)+')">'+denPlain+'Replace</button>':'<span class="den-link"></span>')+'</div>').join('')+'</div>';
  body='<section class="den-panel"><h3 class="den-rule"><span>Primary Pet</span></h3>'+lineup+'</section><section class="den-panel den-grow"><h3 class="den-rule"><span>Pet Assist</span></h3>'+cells
   +'<div class="den-pager"><button aria-label="Previous page" onclick="assistTurn('+(assistPage-1)+')">'+denPlain+'◀</button>'+pages.map((lv,i)=>'<button aria-pressed="'+(i===assistPage)+'" class="'+(i>=open?'den-shut':'')+'" aria-label="Page '+roman[i]+(i>=open?', opens at level '+lv:'')+'" onclick="assistTurn('+i+')">'+denPlain+roman[i]+'</button>').join('')+'<button aria-label="Next page" onclick="assistTurn('+(assistPage+1)+')">'+denPlain+'▶</button></div></section><p class="den-note"><i>!</i>Deployed and assisting pets all add their full ATK.</p>';
 }else if(petPage==='Gallery'){
  top=power(atk);
  const state=team.includes(p.id)?'Deployed':owned?'Collected':'Not collected';
  body='<div class="den-head"><em class="den-rarity den-'+key+'">'+tag+'</em><div><h2>'+esc(p.name)+'</h2><small>'+kind+' · '+state+'</small></div></div>'
   +'<div class="den-stage den-solo"><span class="den-glow"></span>'+art(p,'den-main'+(owned?'':' den-dim'))+(owned?'':'<span class="den-notyet">🔒 Not collected yet</span>')+'<div class="den-side"><button onclick="petTab(\'Summon\')">'+denPlain+'<i>✧</i>Summon</button><button onclick="petTab(\'Synthesize\')">'+denPlain+'<i>❖</i>Synthesize</button><button onclick="'+switchTo('Badge',p.id)+'">'+denPlain+'<i>⬟</i>Badge</button></div><p class="den-starrow">'+(stars?'★'.repeat(stars):'<s>☆</s>')+(stars<6?'<u>▲</u>'+'★'.repeat(stars+1):'')+'</p></div>'
   +'<section class="den-panel"><h3>Pet ATK <b>'+fmt(atk)+'</b>'+(stars<6?' ▲ <b>'+fmt(atk+30)+'</b>':'')+' <span>Star bonus <b>+'+stars*30+'</b>'+(stars<6?' ▲ <b>+'+(stars+1)*30+'</b>':'')+'</span></h3><div class="den-track">'+[1,2,3,4,5,6].map(n=>'<span class="'+(n<=stars?'on':'')+'"><b>'+(n<=stars?'✦':'+'+n*30)+'</b><small>★'+n+'</small></span>').join('')+'</div><p>Total star bonus: <b>+'+stars*30+' ATK</b>'+(rules.petSpares(S,p.id)?' · spare copies <b>×'+rules.petSpares(S,p.id)+'</b>':'')+'</p></section>'
   +'<div class="den-starup"><span class="den-orb">'+art(p,'')+'</span>'+(owned?buy(offers.Stars):buy({have:S.gold,cost:p.cost,unit:'gold',label:'Unlock',act:'petUnlock()',icon:uiIcon('gold')}))+'</div>'
   +strip(pets,'Gallery');
 }else if(petPage==='Talent'||petPage==='TalentShop'){
  const st=rules.talentState(S);if(!team[talentSlotPick])talentSlotPick=0;
  const v=st.slots[talentSlotPick],filled=v.cells.filter(Boolean).length,misc=n=>denIcon('misc',n,4,1);
  top='<div class="den-chips"><span>'+misc(0)+fmt(st.seals)+'</span><span>'+misc(1)+st.books+'</span><span>'+uiIcon('gold')+fmt(S.gold)+'</span></div>'+power(teamAtk);
  const slots='<div class="den-slots">'+[0,1,2].map(n=>'<button aria-pressed="'+(n===talentSlotPick)+'" '+(team[n]?'':'disabled')+' onclick="talentPickSlot('+n+')">'+(team[n]?'<img src="'+petPicture(item(team[n]))+'" alt="">':denPlain+'<i>+</i>')+'<b>Slot '+(n+1)+'</b></button>').join('')+'</div>';
  if(petPage==='Talent'){
   const cost=rules.learnCost(S,talentSlotPick),openCost=rules.openCellCost(v.open),can=rules.rollTalent(S,talentSlotPick,()=>0)!==null;
   if(!v.cells[talentCell])talentCell=-1;
   const cell=n=>{const id=v.cells[n];
    if(n>=v.open)return '<button class="den-hex den-shut" '+(n===v.open?'onclick="talentOpen()" aria-label="Open this cell for '+openCost+' seals"':'disabled aria-label="Closed cell"')+'>'+denPlain+'<i>🔒</i>'+(n===v.open?'<small class="'+(st.seals<openCost?'low':'')+'">'+openCost+'</small>':'')+'</button>';
    if(!id)return '<button class="den-hex den-free" disabled aria-label="Empty cell">'+denPlain+'</button>';
    return '<button class="den-hex" aria-pressed="'+(n===talentCell)+'" aria-label="'+talentOf(id).name+(v.locks.includes(n)?', locked':'')+'" onclick="talentCell='+n+';talentTab=\'Common\';cityPet()">'+denPlain+talentIcon(id)+(v.locks.includes(n)?'<u>🔒</u>':'')+'</button>'};
   const round=(icon,label,act)=>'<button onclick="'+act+'">'+denPlain+'<i>'+icon+'</i>'+label+'</button>';
   let panel;
   if(talentPending){const r=talentPending.roll,t=talentOf(r.id);
    panel='<small class="den-kind">Prophecy · not inscribed yet</small><div class="den-trow">'+talentIcon(t.id)+'<div><b>'+t.name+'</b><small>'+(t.kind==='atk'?'Attack':'Guard')+' · passive</small><p>'+t.text+'</p></div></div><p>'+(r.replaces?'It would replace <b>'+talentOf(r.replaces).name+'</b>.':'It would fill an empty cell.')+'</p><div class="den-actions"><button class="den-gold" onclick="talentKeep(true)">'+denPlain+'Keep</button><button class="den-plain" onclick="talentKeep(false)">'+denPlain+'Let go</button></div>';
   }else if(talentTab==='Supreme'){
    panel='<div class="den-trow">'+misc(2)+'<div><b>'+rules.talentSupreme.name+'</b><small>Supreme · '+(filled>=rules.talentSupremeAt?'awake':'asleep')+'</small><p>'+rules.talentSupreme.text+'</p></div></div><div class="den-exp"><small>TALENTS</small><span><i style="width:'+Math.min(100,filled/rules.talentSupremeAt*100)+'%"></i><b>'+filled+' / '+rules.talentSupremeAt+'</b></span></div>';
   }else if(talentCell>=0){const t=talentOf(v.cells[talentCell]),locked=v.locks.includes(talentCell);
    panel=talentRow(t)+(locked?'<p class="den-hint">Locked: Learn will not overwrite it. Each lock makes Learn 50% dearer.</p>':'')+'<div class="den-actions"><button class="den-plain" onclick="talentLock()">'+denPlain+(locked?'🔓 Unlock':'🔒 Lock')+'</button><button class="den-plain" onclick="talentForget()">'+denPlain+'Forget</button></div>';
   }else panel='<p class="den-hint">'+(filled?'Tap a talent to read it, lock it or forget it.':'No talent yet. Tap Learn to inscribe a random one.')+'</p>'+(v.target?'<p class="den-hint">Learn target: <b>'+talentOf(v.target).name+'</b></p>':'');
   body='<div class="den-hexes">'+Array.from({length:rules.talentCells},(_,n)=>cell(n)).join('')+'</div>'
    +'<div class="den-rounds"><span>'+round('✎','Log','talentLogShow()')+round('❖','Guide','talentGuide()')+'</span><span>'+round('◎','Learn Target','talentTargetPick()')+round('⌂','Shop',"petTab('TalentShop')")+'</span></div>'
    +'<div class="den-modes den-two">'+['Common','Supreme'].map(x=>'<button aria-pressed="'+(x===talentTab&&!talentPending)+'" onclick="talentTab=\''+x+'\';cityPet()">'+denPlain+x+(x==='Common'?' Talents':' Talent')+'</button>').join('')+'</div>'
    +'<section class="den-panel den-grow den-tpanel">'+panel+'</section>'
    +'<div class="den-learn"><span class="den-cost">'+misc(0)+'<b class="'+(st.seals<cost?'low':'')+'">'+fmt(st.seals)+'</b> / '+cost+'</span><button class="den-gold" onclick="talentLearn()" '+(talentPending||!can||st.seals<cost||talentProphecy&&st.books<1?'disabled':'')+'>'+denPlain+'Learn</button><button class="den-check" aria-pressed="'+talentProphecy+'" onclick="talentProphecy=!talentProphecy;cityPet()">'+denPlain+'<i></i>Prophecy<small>'+misc(1)+'×'+st.books+'</small></button></div>'
    +slots;
  }else{
   const empty=v.cells.some((id,n)=>n<v.open&&!id);
   const ware=(id,icon,name,price,note,off,kind='')=>'<button class="den-ware'+(off?' den-off':'')+(kind==='top'?' den-topware':'')+'" onclick="talentWare(\''+id+'\')">'+denPlain+'<b>'+name+'</b><span class="den-wareart">'+icon+(kind?'<i class="den-kindchip" aria-hidden="true">'+(kind==='top'?'★':'')+'</i>':'')+'</span><small>'+note+'</small><em>'+misc(0)+fmt(price)+'</em></button>';
   body='<div class="den-shophead">'+artImage('pairs-sprout','Sprout the shopkeeper')+'<div><h2>Talent Shop</h2><p>A scroll inscribes the talent you choose into the first empty cell of the slot below.</p><button class="den-plain" onclick="talentExchange()">'+denPlain+'✦ Fragment exchange</button></div></div>'
    +slots
    +'<div class="den-wares">'+ware('book',misc(1),'Prophecy Book',rules.talentBook,'Shows a Learn result first',st.seals<rules.talentBook)
    +rules.petTalents.map(t=>{const has=v.cells.includes(t.id),price=rules.talentPrice(t.id);return ware(t.id,talentIcon(t.id),t.name,price,has?'In Slot '+(talentSlotPick+1)+' already':empty?talentKind(t):'No empty cell',has||!empty||st.seals<price,t.top?'top':t.kind)}).join('')+'</div>';
  }
 }else if(petPage==='Summon'){
  // Pet Summon lives in the room now: wishes in, a random familiar out; one she has already becomes a spare copy.
  const odds=[['Common','c',45],['Rare','r',35],['Epic','e',16],['Super Rare','s',4]],have=WonderGear.familiars.filter(q=>S.owned.includes(q.id)).length;
  const call=(n)=>'<button class="den-gold" onclick="summonPets('+n+')" '+(S.tickets<n*50?'disabled':'')+'>'+denPlain+'Summon ×'+n+'<small>'+fmt(n*50)+' wishes</small></button>';
  body='<div class="den-forge den-summon"><div class="den-ring"><span class="den-card den-s den-mystery"><em>Pet</em><i>?</i></span></div><p class="den-banner">Summon a random pet with wishes</p>'
   +'<div class="den-odds">'+odds.map(([name,key,n])=>'<span class="den-'+key+'"><b>'+n+'%</b><small>'+name+'</small></span>').join('')+'</div>'
   +'<div class="den-cost">'+uiIcon('wishes')+'<b class="'+(S.tickets<50?'low':'')+'">'+fmt(S.tickets)+'</b> wishes · collected <b>'+have+'</b> / '+WonderGear.familiars.length+'</div>'
   +'<div class="den-actions">'+call(1)+call(10)+'</div>'
   +'<p class="den-note">Rare includes fairies. A pet you already have gives 100 gold and a spare copy for <u onclick="petTab(\'Synthesize\')">Synthesize</u>.</p></div>';
 }else if(petPage==='Synthesize'){
  const need=rules.synthNeed,from=rules.synthChain[synthTier],[stag,skey]=petRarity[synthTier],[,fkey]=petRarity[from];
  synthPicks=synthPicks.filter((id,i)=>rules.petSpares(S,id)>=synthPicks.slice(0,i+1).filter(x=>x===id).length).slice(0,need);
  const total=synthSpares().reduce((n,q)=>n+rules.petSpares(S,q.id),0);
  const slot=i=>{const id=synthPicks[i];if(!id)return '<button class="den-card den-empty" aria-label="Add a spare copy" onclick="synthAdd()">'+denPlain+'<i>+</i></button>';const q=item(id);return '<button class="den-card den-'+fkey+'" aria-label="Remove '+esc(q.name)+'" onclick="synthDrop('+i+')"><img src="'+petPicture(q)+'" alt=""><b>'+esc(q.name)+'</b></button>'};
  body='<div class="den-synth"><div class="den-tiers">'+['Super Rare','Epic','Rare'].map(t=>'<button aria-pressed="'+(t===synthTier)+'" onclick="synthSet(\''+t+'\')">'+denPlain+t+'</button>').join('')+'</div>'
   +'<div class="den-forge"><div class="den-ring"><span class="den-card den-'+skey+' den-mystery"><em>'+stag+'</em><i>?</i></span></div><p class="den-banner">Randomly synthesize a '+synthTier+' pet</p>'
   +'<div class="den-mats den-two">'+slot(0)+slot(1)+'</div><div class="den-mats">'+[2,3,4,5].map(slot).join('')+'</div>'
   +'<p class="den-note">Spare '+from+' copies available: <b>'+total+'</b> · '+need+' make one '+synthTier+' pet</p>'
   +'<div class="den-actions"><button class="den-gold" onclick="synthRun(true)" '+(total<need?'disabled':'')+'>'+denPlain+'Batch</button><button class="den-gold" onclick="synthAdd()" '+(synthPicks.length>=need?'disabled':'')+'>'+denPlain+'Add</button><button class="den-gold" onclick="synthRun(false)" '+(synthPicks.length<need?'disabled':'')+'>'+denPlain+'Synthesize</button></div>'
   +'<p class="den-note">A summon that lands on a pet you already have gives a spare copy.</p></div></div>';
 }else{
  top=power(atk+rank*5);
  body='<div class="den-head"><em class="den-rarity den-'+key+'">'+tag+'</em><div><h2>'+esc(p.name)+' Badge · Lv. '+rank+'</h2><small>Exclusive to '+esc(p.name)+'</small></div></div>'
   +'<div class="den-stage den-solo"><span class="den-glow"></span>'+art(p,'den-main'+(owned?'':' den-dim'))+(owned?'':'<span class="den-notyet">🔒 Not collected yet</span>')+'</div>'
   +'<section class="den-panel"><h3>Badge Forge</h3><p>Bonus ATK <b>+'+rank*5+'</b>'+(rank<20?' → <b>+'+(rank+1)*5+'</b>':'')+'</p><div class="den-exp"><small>RANK</small><span><i style="width:'+rank/20*100+'%"></i><b>'+rank+' / 20</b></span></div></section>'
   +'<div class="den-starup"><span class="den-orb">'+art(p,'')+'</span>'+(owned?buy(offers.Badge):'<div class="den-cost">Unlock this pet in Gallery first</div>')+'</div>'
   +strip(pets.filter(q=>emblemFilter==='All'||q.rarity===emblemFilter),'Badge')
   +'<div class="den-filters">'+['All',...new Set(pets.map(q=>q.rarity))].map(f=>'<button aria-pressed="'+(emblemFilter===f)+'" onclick="emblemFilter=\''+f+'\';cityPet()">'+denPlain+f+'</button>').join('')+'</div>';
 }
 const side=petPage==='Synthesize'||petPage==='Summon',inner=petPage==='Talent'||petPage==='TalentShop';   // side rooms of the Gallery and of Formation
 $('#main').innerHTML='<section class="spirit-room den" data-page="'+petPage+'"><div class="den-top"><strong class="den-ribbon">'+(petPage==='TalentShop'?'Talent Shop':petPage)+'</strong>'+top+'</div><div class="den-body">'+body+'</div><div class="spirit-nav"><button data-back aria-label="'+(petPage==='TalentShop'?'Back to Talents':inner?'Back to Formation':side?'Back to Gallery':petBack==='wonders'?'Back to Wonders':'Back to city')+'" onclick="'+(petPage==='TalentShop'?'petTab(\'Talent\')':inner?'petTab(\'Formation\')':side?'petTab(\'Gallery\')':'petLeave()')+'">‹</button>'+petPages.map((page,i)=>'<button aria-pressed="'+(page===petPage||side&&page==='Gallery'||inner&&page==='Formation')+'" onclick="petTab(\''+page+'\')">'+artImage(['hud-pet','hud-bag','hud-companion','hud-forge'][i],'')+page+'</button>').join('')+'</div></section>';
}

let companionKey='elf',companionMode='Upgrade',companionPick={};
const companionForms=['Classic','Moonlight','Sunfire'];
function companionModes(key){
 return key==='mount'?['Looks','Upgrade','Tier-up']:['Looks','Upgrade','Tier-up'];
}
function companionTab(key,mode){
 if(!WonderGear.companionTypes[key])return;
 companionKey=key;
 companionMode=companionModes(key).includes(mode)?mode:companionModes(key)[0];
 cityCompanion();
}
// Art for one appearance of a slot: its card picture, and what the home screen shows.
function companionIcon(key,id){
 if(key==='mount')return artPath(mounts.find(m=>m.id===id)?.icon||mounts[0].icon);
 if(key==='elf')return artPath(id==='dreamveil'?WonderGear.companionTypes.elf.art:'comp-elf-'+id);
 if(key==='footprint')return artPath('comp-step-'+id);
 return artPath('comp-icon-'+key+'-'+id);
}
function companionChoices(key){return key==='mount'?mounts.map(m=>({id:m.id,name:m.name,cost:m.cost})):WonderGear.companionSkins[key]||[];}
function companionOwns(key,id){return key==='mount'?ownsMount(id):WonderGear.ownsCompanionSkin(S,key,id);}
function companionWorn(key){return key==='mount'?(currentMount()?.id||''):(()=>{const v=WonderGear.companionState(S,key);return v.equipped?WonderGear.companionSkin(S,key).id:''})();}
function companionPicked(key){
 const list=companionChoices(key),pick=companionPick[key];
 return list.find(x=>x.id===pick)||list.find(x=>x.id===(key==='mount'?chosenMount().id:WonderGear.companionSkin(S,key)?.id))||list[0];
}
// Tapping an appearance she already owns puts it on at once (no second tap on Use); unowned ones are only previewed.
function pickCompanion(id){
 const key=companionKey;if(!companionChoices(key).some(x=>x.id===id))return;
 companionPick[key]=id;
 if(key!=='mount'&&companionOwns(key,id)&&companionWorn(key)!==id&&WonderGear.useCompanionSkin(S,key,id)){save();toast(companionChoices(key).find(x=>x.id===id).name+' is on');}
 cityCompanion();
}
function companionAction(action,arg){
 const r=WonderGear,key=companionKey,v=r.companionState(S,key);
 if(action==='upgrade'||action==='tier'){
  if(!r.improveCompanion(S,key,action==='tier'))return;
 }else if(action==='use'){
  const pick=companionPicked(key);
  if(key==='mount'){
   if(!ownsMount(pick.id)){if(S.gold<pick.cost){toast('Not enough gold');return}S.gold-=pick.cost;S.mountsOwned=[...new Set([...(S.mountsOwned||[]),pick.id])];}
   S.mountPick=pick.id;S.mountId=pick.id;delete S.ridingSilverTabby;
  }else if(!r.useCompanionSkin(S,key,pick.id)){toast('Not enough gold');return}
 }else if(action==='remove'){
  if(key==='mount'){S.mountId='';delete S.ridingSilverTabby}
  else (S.companions??={})[key]={...v,equipped:false};
 }else return;
 save();cityCompanion();
}
// Fairy and footsteps beside Reina on the home screen. Cloak, back accessory and tail are part of her portrait.
// Footsteps on Reina, placed as the user sketched them: single marks that start between her feet and trail away
// behind her to the back-left, smaller with distance, visible beside her leg. (The diagonal trail picture
// comp-step-<id> is only for the cards.)
function stepTrack(id,cls){
 const src=artPath('comp-step-'+id+'-mark');
 return '<span aria-hidden="true" class="step-track '+cls+'">'+[0,1,2,3,4,5].map(i=>'<img class="step-'+i+'" src="'+src+'" alt="">').join('')+'</span>';
}
// Paint order on the home screen: pets, footsteps, Reina, fairy. The track starts under her heel, so it is drawn
// before her and after the pets.
function cityCompanionEffects(keys=['elf','footprint']){
 return keys.map(key=>{
  const v=WonderGear.companionState(S,key);
  if(!v.equipped||v.hidden||key==='footprint'&&currentMount())return '';
  if(key==='footprint')return stepTrack(WonderGear.companionSkin(S,key).id,'home-steps');
  return '<span aria-hidden="true" class="city-companion-effect fx-'+key+'"><img src="'+companionIcon(key,WonderGear.companionSkin(S,key).id)+'" alt=""></span>';
 }).join('');
}
function cityCompanion(){
 const r=WonderGear,key=companionKey,t=r.companionTypes[key],v=r.companionState(S,key);
 const labels={attack:'ATK',health:'HP',defense:'DEF',penetration:'ARP %',elementalAttack:'ELEM. ATK',elementalDefense:'ELEM. DEF'};
 const tier=companionMode==='Tier-up',points=r.companionPoints(v);
 const price=tier?v.tier*5:v.level*100,balance=tier?r.state(S).materials.shard:S.gold;
 const list=companionChoices(key),pick=companionPicked(key),worn=companionWorn(key),owned=companionOwns(key,pick.id),inUse=worn===pick.id;
 const statRows=Object.entries(t.growth).map(([k,n])=>'<div><b>'+labels[k]+'</b><span>'+fmtCompanion(n*points)+'</span><em>↑ '+fmtCompanion(n*(tier?5:1))+'</em></div>').join('');
 const nav=Object.entries(r.companionTypes).map(([k,x])=>'<button aria-pressed="'+(k===key)+'" onclick="companionTab(\''+k+'\')"><img src="'+companionIcon(k,k==='mount'?chosenMount().id:r.companionSkin(S,k).id)+'" alt=""><span>'+x.name+'</span></button>').join('');
 const upgrade='<small>'+(tier?'Tier '+v.tier+' · needs Lv. '+v.tier*5:'Lv. '+v.level+' / 100')+'</small><progress value="'+(tier?Math.min(v.level,v.tier*5):v.level)+'" max="'+(tier?v.tier*5:100)+'"></progress><button class="spirit-gold" onclick="companionAction(\''+(tier?'tier':'upgrade')+'\')" '+(balance<price||(tier?v.tier>=10||v.level<v.tier*5:v.level>=100)?'disabled':'')+'>'+(tier?'Tier up':'Upgrade')+'</button><small>'+fmt(price)+(tier?' shards':' gold')+'</small>';
 const use='<strong>'+esc(pick.name)+'</strong><small>'+(owned?(inUse?'In use':'Owned'):fmt(pick.cost)+' gold')+'</small>'+(inUse?'<button onclick="companionAction(\'remove\')">'+(key==='mount'?'Dismount':'Take off')+'</button>':'<button class="spirit-gold" onclick="companionAction(\'use\')" '+(!owned&&S.gold<pick.cost?'disabled':'')+'>'+(owned?(key==='mount'?'Ride':'Use'):'Buy &amp; '+(key==='mount'?'ride':'use'))+'</button>');
 const look=registeredLook(),weapon=S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13);
 const preview=key==='mount'?'<img class="comp-figure" src="'+mountedLookPath(pick.id)+'" alt="Reina riding '+esc(pick.name)+'">'
  :key==='elf'?'<img class="comp-figure comp-float" src="'+companionIcon(key,pick.id)+'" alt="'+esc(pick.name)+'">'
  :key==='footprint'?'<img class="comp-figure" src="'+registeredLookPath(look.dress,look.hair,weapon,'','')+'" alt="Reina">'+stepTrack(pick.id,'room-steps')
  :'<img class="comp-figure" src="'+registeredLookPath(look.dress,look.hair,weapon,'',wardrobeExtrasTag({[key]:pick.id}))+'" alt="Reina with '+esc(pick.name)+'">';
 const cards=list.map(x=>'<button class="comp-card" aria-pressed="'+(x.id===pick.id)+'" onclick="pickCompanion(\''+x.id+'\')"><img src="'+companionIcon(key,x.id)+'" alt="" loading="lazy"><span>'+esc(x.name)+'</span>'+(worn===x.id?'<em>In use</em>':companionOwns(key,x.id)?'':'<em class="price">'+fmt(x.cost)+'</em>')+'</button>').join('');
 const previous=document.querySelector?.('.comp-cards'),scroll=previous?.dataset?.key===key?previous.scrollLeft:0;
 $('#main').innerHTML='<section class="comp-room"><div class="comp-top"><strong>'+t.name+' · Lv.'+v.level+'</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div>'
  +'<div class="comp-stage"><h2>'+esc(pick.name)+'</h2>'+preview+'</div>'
  +'<div class="comp-cards" data-key="'+key+'">'+cards+'</div>'
  +'<div class="comp-panel"><div class="comp-stats">'+statRows+'</div><div class="comp-action">'+(companionMode==='Looks'?use:upgrade)+'</div></div>'
  +'<div class="comp-modes">'+companionModes(key).map(m=>'<button aria-pressed="'+(m===companionMode)+'" onclick="companionTab(\''+key+'\',\''+m+'\')">'+m+'</button>').join('')+'</div>'
  +'<div class="comp-nav"><button class="comp-back" data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+nav+'</div></section>';
 const strip=document.querySelector?.('.comp-cards');if(strip)strip.scrollLeft=scroll;
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
 skinTab=index;skinMode=mode;skinVariant=variant;if(index===0&&mode==='Morphing')return openSkinAppearance();citySkin();
}
function skinArtwork(page,variant){
 const id=page.art[variant]||page.art[0];
 if(id==='radiance')return '<img src="'+reinaLookPath(false)+'" alt="Reina">';
 if(id==='aura')return dragonSVG(item(S.dragon));
 if(id==='arrow')return '<span class="skin-arrow"><i></i></span>';
 if(id==='shield')return '<span class="skin-shield"><i>✧</i></span>';
 return artImage(id,page.title);
}
function openSkinAppearance(){
  stylePick=null;
  fashionCategory=skinTab===0?'Wings':'Weapons';
  reinaPreview=S.reinaFashion?.equipped||0;
  wingPreview=S.reinaFashion?.wingSkin||fashionWings[0].id;
  skinMode='Appearance';
  reinaAtelier();
}
function citySkin(){
 if(skinMode==='Appearance')return reinaAtelier();
 const page=skinPages[skinTab],st=stats(),morph=skinMode==='Morphing';
 const labels={health:'HP',attack:'ATK',defense:'DEF',accuracy:'Accuracy',dodge:'Dodge',crit:'Crit',critResistance:'RSL',shieldHealth:'Shield HP',penetration:'ARP',elementalDefense:'Elem. DEF'};
 const statsList=page.stats.map(key=>'<div><b>'+labels[key]+'</b><span>'+fmtCompanion(st[key])+(['accuracy','dodge','crit','critResistance','penetration'].includes(key)?'%':'')+'</span></div>').join('');
 const nav=skinPages.map((p,i)=>'<button aria-pressed="'+(i===skinTab)+'" onclick="switchSkin('+i+',\'Upgrade\',0)">'+artImage(p.icon,'')+p.name+'</button>').join('');
 const variants=[0,1,2].map(i=>'<button aria-pressed="'+(skinVariant===i)+'" onclick="switchSkin('+skinTab+',\'Morphing\','+i+')">'+artImage(page.art.length>1?page.art[i]:page.icon,'','form-'+(page.art.length>1?0:i))+'<small>'+(['Classic','Moonlight','Sunfire'][i])+'</small></button>').join('');
 const skillIcons=['gear-spiritguard-t3','gear-amulet-t3','gear-spiritluck-t6','gear-amulet-t7','gear-spiritguard-t5'];
 const strip=skillIcons.map(id=>artImage(id,'')).join('')+'<span></span>'+['gear-spiritguard-t1','gear-spiritguard-t3','gear-spiritguard-t7'].map(id=>artImage(id,'')).join('');
 const scroll=$('.skin-scroll')?.scrollLeft||0;
 $('#main').innerHTML='<section class="spirit-room companion-room skin-room"><div class="satchel-top"><strong>'+page.name+'</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div><header><h2>'+page.title+'</h2><b class="spirit-value" title="Hero combat power">⚔ '+fmt(st.power)+'</b></header><div class="companion-show"><label><input type="checkbox" '+(skinHidden?'checked':'')+' onchange="skinHidden=this.checked;citySkin()"> Hide</label><div class="companion-object skin-object skin-art-'+skinTab+' form-'+(page.art.length===1?skinVariant:0)+'">'+(skinHidden?'':skinArtwork(page,skinVariant))+'</div><button class="skin-transform" onclick="switchSkin('+skinTab+',\'Morphing\',skinVariant)">Transform</button></div><div class="'+(morph?'companion-forms':'skin-skills')+'">'+(morph?variants:strip)+'</div><section class="companion-stats"><div><small>Hero attributes</small>'+statsList+'</div><div><small>'+ (morph?'Appearance preview':'Upgrade preview')+'</small><strong>'+(morph?['Classic','Moonlight','Sunfire'][skinVariant]:page.name)+'</strong>'+(morph?'':'<progress value="0" max="1"></progress><button class="spirit-gold" disabled>Upgrade</button>')+'</div></section><div class="companion-modes">'+['Upgrade','Morphing'].map(m=>'<button aria-pressed="'+(m===skinMode)+'" onclick="switchSkin('+skinTab+',\''+m+'\',0)">'+m+'</button>').join('')+([0,2].includes(skinTab)?'<button onclick="openSkinAppearance()">Appearance</button>':'')+'</div><div class="spirit-nav skin-nav"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button><div class="skin-scroll">'+nav+'</div></div></section>';
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
 $('#main').innerHTML='<section class="spirit-room companion-room smith-room" data-forge="'+page+'"><div class="satchel-top"><strong>Forge</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([i,n])=>'<span>'+uiIcon(i)+fmt(n)+'</span>').join('')+'</div><div class="smith-scene"><div class="smith-rune"></div>'+scene+(e?tile(e):'No equipment')+'</div><div class="smith-panel">'+panel+'</div><div><button class="spirit-gold" disabled>'+action+'</button></div><div class="smith-rail">'+rail+'</div><div class="companion-modes">'+smithPages[page].map(m=>'<button aria-pressed="'+(m===sub)+'" onclick="smithTab(\''+page+'\',\''+m+'\')">'+m+'</button>').join('')+'</div><div class="spirit-nav"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+Object.keys(smithPages).map((p,i)=>'<button aria-pressed="'+(p===page)+'" onclick="smithTab(\''+p+'\')">'+artImage(icons[i],'')+p+'</button>').join('')+'</div></section>';
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
 $('#main').innerHTML='<section class="companion-room spirit-room daily-room daily-page-'+page+'"><div class="satchel-top"><strong>Daily</strong>'+[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('')+'</div><header class="daily-banner">'+banner+'</header><div class="daily-list">'+list+'</div>'+(foot?'<div class="daily-foot">'+foot+'</div>':'')+'<nav class="spirit-nav"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+dailyPages.map((name,i)=>'<button aria-pressed="'+(i===page)+'" onclick="dailyOpen('+i+')">'+artImage(['hud-daily','hud-event','hud-reward','hud-bag','hud-combat'][i],'')+name+'</button>').join('')+'</nav></section>';
}

const playSections=['Material','Challenge','Team Dungeon','Arena','Sky Contest'];
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
 const scene=mount?mountPanel:playSection===4?contestList():`<div class="gp-empty">${artImage(['hud-pet','hud-combat','hud-gear','hud-combat','hud-rank'][playSection],'')}${dest?`<button class="spirit-gold" onclick="go('${dest[1]}')">${dest[0]}</button>`:''}</div>`;
 $('#main').innerHTML=`<section class="companion-room spirit-room gp-room"><div class="satchel-top"><strong>${name}</strong>${[['gold',S.gold],['wishes',S.tickets],['crystals',S.scales]].map(([id,n])=>'<span>'+uiIcon(id)+fmt(n)+'</span>').join('')}</div><div class="gp-banner"><h2>${title}</h2>${mount?'<small>Mount development materials</small>':''}</div><div class="gp-content">${scene}</div><div class="companion-modes">${playSection===0?nav(playMaterials,playMaterial,'playMaterial'):''}</div><nav class="spirit-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button>${nav(playSections,playSection,'playSection')}</nav></section>`;
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
 $('#main').innerHTML='<section class="companion-room spirit-room bounty-room"><div class="satchel-top"><strong>Bounty</strong>'+wallet+'</div><header class="bounty-banner"><h2>'+title+'</h2>'+artImage(journal?'hud-chest':bountyPage===1?'hud-shop':'hud-pet','')+'</header>'+(journal?'<div class="bounty-track"><b>0<small>Adventure EXP</small></b><section>'+track+'</section></div>':'<div></div>')+'<div class="bounty-list">'+(journal&&bountyRank===0?cards:empty)+'</div><div class="companion-modes">'+(journal?ranks:'')+'</div><nav class="spirit-nav"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+nav+'</nav></section>';
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
 $('#main').innerHTML='<section class="companion-room spirit-room hunt-room"><div class="satchel-top"><strong>'+mode+'</strong>'+wallet+'</div><div class="hunt-scene">'+(world?preview:'<div class="hunt-title">'+mode+'</div>'+artImage(huntMode===3?'hud-clan':'hud-hunting','','hunt-emblem'))+'</div><section class="hunt-picker">'+(world?'<div class="hunt-floors">'+floors+'</div><div class="hunt-cards">'+cards+'</div>'+entry:'')+'</section><div class="companion-modes">'+(huntMode!==3?modes:'')+'</div><nav class="spirit-nav"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+button('Boss',huntMode!==3,'huntMode=0;cityHunting()')+button('X-server',huntMode===3,'huntMode=3;cityHunting()')+'</nav></section>';
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
 $('#main').innerHTML='<section class="explore-map" aria-label="Challenge chapter '+chapter+'"><div class="trail-field"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="'+exploreTrailPath+'"/></svg>'+markers+'</div><aside class="trail-benefits"><b>Challenge</b><small>Chapter '+chapter+' · '+next+' / 9</small></aside><div class="trail-bonus">'+exploreTool('Training Bonus','hud-upgrade')+'</div><div class="trail-tools">'+tools+'</div><footer><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button><div class="trail-next"><button class="spirit-gold" onclick="startExploreFight('+cleared+')" '+(power<required?'disabled':'')+'>Fight Boss</button><small>Power needed for the next stage</small><strong class="'+(power<required?'trail-low':'trail-ready')+'">'+fmt(power)+' / '+fmt(required)+'</strong></div>'+exploreTool('Power Up','hud-reinforce','cityForge')+'</footer></section>';
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
  [[78,35],[55,18],[40,39],[19,12],[79,10],[15,35]],
  [[78,65],[55,82],[40,61],[19,88],[79,90],[15,65]]
 ],
 3:[
  [[17,20],[32,16],[10,34],[43,15],[20,27],[6,43]],
  [[83,20],[68,16],[90,34],[57,15],[80,27],[94,43]],
  [[50,81],[19,68],[81,68],[12,52],[88,52],[67,77]]
 ],
 4:[0,1,3,2].map(turns=>
  [[-11,-9],[-24,-24],[-26,0],[-36,-35],[-43,0],[-32,-16]].map(([x,y])=>{
   for(let turn=0;turn<turns;turn++)[x,y]=[-y,x];
   return [50+x,50+y];
  }))
};
const cloudRanks=['Capital','Stronghold','Stronghold','Outpost','Outpost','Outpost'];
const cloudDefenders={
 Outpost:['Guard','Guard','Guard'],
 Stronghold:['Guard','Elite','Guard','Elite','Guard'],
 Capital:['Guard','Elite','Guard','Boss','Guard','Elite','Guard']
};
const duelRanks=['Capital','Fortress','Fortress','Island','Island','Island'];
let cloudCount=4;
const cloudSectorNames=[
 ['Larkspire','Kitewatch','Galehold','Wispwake','Sailfern','Swiftmere'],
 ['Cinderkeep','Ashvault','Flarewatch','Coalpetal','Emberfen','Sparkreef'],
 ['Lunavale','Duskhaven','Veilwatch','Mothmere','Glowtide','Silkmoon'],
 ['Briarcrest','Rootwatch','Mossguard','Dewthorn','Fernwake','Oakwhorl']
];
function cloudTerritories(){
 return cloudLayouts[cloudCount].flatMap((points,i)=>{
  const [owner,capital,fort,color]=cloudFactions[i];
  const names=cloudCount===4?cloudSectorNames[i]:cloudCount===2?[capital,fort+' Fortress',owner+' Fortress',...(i===0?['Snowpeak Island','Winddance Island','Thunderstone Island']:['Snowfox Island','Firebird Island','Sunrise Island'])]:[capital,fort,owner+' Keep',owner+' Lookout',owner+' Camp',owner+' Gate'];
  return points.map(([x,y],j)=>({owner,color:cloudCount===4&&i===0?'#ffdb70':color,x,y,name:names[j],rank:(cloudCount!==3?duelRanks:cloudRanks)[j]}));
 });
}
const cloudPortalRewards={
 Island:{personal:1440,armor:'gear-armor-t6'},
 Fortress:{personal:1800,armor:'gear-armor-t7'},
 Capital:{personal:2160,armor:'gear-armor-t8'}
};
const cloudPortalSlots=[
 ['Boss',50,31,16],['Elite',9,31,12],['Elite',91,31,13],['Elite',50,87,14],
 ['Guard',24,14,7],['Guard',24,48,8],['Guard',76,14,9],['Guard',76,48,10],
 ['Guard',34,69,8],['Guard',66,69,7]
];
const cloudEnemyScore={Guard:10,Elite:20,Boss:30};
const cloudEnemyHealth={Guard:2,Elite:3,Boss:4};
function cloudScore(index){
 const damage=S.cloudWarHits?.[index]||[];
 return cloudPortalSlots.reduce((sum,[role],slot)=>sum+(damage[slot]>=cloudEnemyHealth[role]?cloudEnemyScore[role]:0),0);
}
const cloudSquads=[['Aeris','Wren'],['Pyra','Flint'],['Selene','Vesper'],['Briar','Rowan']];
const cloudPatrol=[3,4,2,5,1,0];
let cloudBotTimer, cloudPlayerDuel=null;
function cloudBotDamage(index,slot){
 return S.cloudPatrol?.hits[index]?.[slot]||0;
}
function cloudDamage(index,slot){
 return Math.min(cloudEnemyHealth[cloudPortalSlots[slot][0]],cloudBotDamage(index,slot)+(S.cloudWarHits?.[index]?.[slot]||0));
}
function cloudFactionScores(index){
 const section=Math.floor(index/6),scores=[cloudScore(index),0,0,0];
 cloudPortalSlots.forEach(([role],slot)=>{
  if(cloudDamage(index,slot)>=cloudEnemyHealth[role]&&(S.cloudWarHits?.[index]?.[slot]||0)<cloudEnemyHealth[role])scores[section]+=cloudEnemyScore[role];
 });
 return scores;
}
function cloudOwner(index){
 const now=cloudFactionScores(index).findIndex(points=>points>=80);if(now>=0)return now;
 const held=S.cloud?.held?.[index];return Number.isInteger(held)?held:-1;
}
// ---- Rounds, Carnage Points and the Cloud War windows (rules: WonderGear.cloud*) ------------------------------------
const cloudMine=0;   // Reina fights for Galewing
const cloudOpen=f=>[0,1,2,3,4,5].filter(j=>cloudOwner(f*6+j)===f).length;
const cloudAlive=index=>cloudPortalSlots.filter(([role],slot)=>cloudDamage(index,slot)<cloudEnemyHealth[role]).length;
const cloudClock=()=>{const n=Math.max(0,Math.ceil((WonderGear.cloudRoundEnds(Date.now())-Date.now())/1000));return String(Math.floor(n/3600)).padStart(2,'0')+':'+String(Math.floor(n%3600/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
const cloudTokenIcon=()=>artImage('hud-cloud','Cloud Tokens','cloud-token');
// A new round brings every defender back; territories taken in the old round stay with their faction.
function cloudRoundCheck(){
 const owners={};for(let i=0;i<WonderGear.cloudRules.territories;i++){const f=cloudFactionScores(i).findIndex(p=>p>=80);if(f>=0)owners[i]=f}
 if(!WonderGear.cloudNewRound(S,owners))return false;
 delete S.cloudWarHits;S.cloudPatrol={hits:{},last:Date.now()};save();return true;
}
// A city of her own faction that has not paid its ownership reward this round shows a chest above it.
const cloudChestReady=i=>cloudCount===4&&cloudOwner(i)===cloudMine&&!WonderGear.cloudState(S).got.includes(i);
function cloudOwnClaim(i){
 const place=cloudTerritories()[i];if(!place||!cloudChestReady(i))return;
 const items=WonderGear.cloudOwnTake(S,i,place.rank);if(!items)return;WonderGear.socialNote(S,'Ownership reward of '+place.name+' collected.');
 save();if($('#modal').open)$('#modal').close();
 const board=document.querySelector('.cloud-four-board');if(board)board.outerHTML=cloudFourBoard(cloudTerritories());
 popup('<h2>Ownership Reward</h2><p>'+place.name+' belongs to '+cloudFactions[cloudMine][0]+'. The reward of this round went to the bag.</p><div class="bag-gains">'+cloudItems(items)+'</div><p>Every city she holds pays again in the next round.</p>');
}
const cloudClaimable=()=>{const v=WonderGear.cloudState(S);return WonderGear.cloudPointRewards.some((r,n)=>v.carnage>=r.at&&!v.claimed.includes(n))};
const cloudLoot={Boss:{id:'chest2',n:1},Elite:{id:'chest1',n:1},Guard:null};
function cloudItems(items){bagArtVars();return Object.entries(items).map(([id,n])=>'<span class="bag-gain" style="--rarity:'+bagHue(WonderGear.bagItemById[id].rarity)+'">'+bagIcon(id)+'<b>×'+n+'</b><small>'+WonderGear.bagItemById[id].name+'</small></span>').join('')}
function cloudPointsShow(){
 const r=WonderGear,v=r.cloudState(S);
 popup('<h2>Point Rewards</h2><p>Carnage Points today: <b>'+v.carnage+' / '+r.cloudRules.carnageCap+'</b>. Defeat defenders to earn them; rewards go to the bag.</p><div class="cloud-steps">'+r.cloudPointRewards.map((x,n)=>{const got=v.claimed.includes(n),ok=v.carnage>=x.at;
  return '<div class="'+(got?'got':ok?'ready':'')+'"><b>'+x.at+'</b><span class="bag-gains">'+cloudItems(x.items)+'</span>'+(got?'<em>Claimed</em>':ok?'<button class="den-gold" onclick="cloudTake('+n+')">'+denPlain+'Claim</button>':'<em>'+v.carnage+'/'+x.at+'</em>')+'</div>'}).join('')+'</div><p>Resets at 00:00 UTC.</p>');
}
function cloudTake(n){if(WonderGear.cloudClaim(S,n)){save();cloudPointsShow();cloudHud()}}
function cloudShopShow(){
 const r=WonderGear,v=r.cloudState(S);bagArtVars();
 popup('<h2>Cloud Shop</h2><p class="cloud-wallet">'+cloudTokenIcon()+'<b>'+fmt(v.tokens)+'</b> Cloud Tokens · one for each Carnage Point</p><div class="cloud-wares">'+r.cloudShop.map(w=>{const i=r.bagItemById[w.id];return '<button class="'+(v.tokens<w.price?'shut':'')+'" style="--rarity:'+bagHue(i.rarity)+'" onclick="cloudBuy(\''+w.id+'\')">'+denPlain+bagIcon(w.id)+'<b>'+i.name+'</b><span>'+cloudTokenIcon()+w.price+'</span></button>'}).join('')+'</div>');
}
function cloudBuy(id){const r=WonderGear;if(!r.buyCloud(S,id)){toast('Not enough Cloud Tokens.');return}save();cloudShopShow();toast(r.bagItemById[id].name+' sent to the bag')}
function cloudStatusShow(){
 const rows=cloudFactions.map((f,i)=>{let held=0,pts=0;for(let t=0;t<WonderGear.cloudRules.territories;t++){if(cloudOwner(t)===i)held++;pts+=cloudFactionScores(t)[i]||0}return {f,i,held,pts}}).sort((a,b)=>b.held-a.held||b.pts-a.pts);
 popup('<h2>Faction Battle Status</h2><p>Round ends in <b>'+cloudClock()+'</b>. A territory goes to the first faction with 80 points in it this round, and stays with it after the round.</p><div class="cloud-table"><div><b>Faction</b><b>Territories</b><b>Points this round</b></div>'+rows.map(x=>'<div class="'+(x.i===cloudMine?'me':'')+'"><span style="color:'+x.f[3]+'">'+x.f[0]+(x.i===cloudMine?' (you)':'')+'</span><b>'+x.held+'</b><b>'+x.pts+'</b></div>').join('')+'</div>');
}
const cloudRivals=[['Nyra',1],['Kael',2],['Pip',3],['Vesper',0],['Briar',2],['Orin',3],['Lumi',1],['Thane',0],['Sable',2]];
function cloudRankShow(){
 const r=WonderGear,v=r.cloudState(S),now=new Date(),hours=now.getUTCHours()+now.getUTCMinutes()/60;
 const seed=n=>[...v.day+n].reduce((h,c)=>(h*31+c.charCodeAt(0))%997,7)/997;
 const list=cloudRivals.map(([n,f])=>({n,f,pts:Math.min(r.cloudRules.carnageCap,Math.round(r.cloudRules.carnageCap*(.35+.65*seed(n))*Math.min(1,hours/20)/10)*10)})).concat([{n:esc(S.name),f:cloudMine,pts:v.carnage,me:true}]).sort((a,b)=>b.pts-a.pts);
 popup('<h2>Carnage Rankings</h2><p>Carnage Points today. Rivals are simulated AI adventurers.</p><div class="cloud-table rank">'+list.map((x,i)=>'<div class="'+(x.me?'me':'')+'"><b>'+(i+1)+'</b><span style="color:'+cloudFactions[x.f][3]+'">'+x.n+(x.me?'':' <small>AI</small>')+'</span><b>'+x.pts+'</b></div>').join('')+'</div>');
}
// Refreshes the clock and the counters at the top of the map without drawing the board again.
function cloudHud(){
 const v=WonderGear.cloudState(S),clock=document.querySelector('[data-round]'),pts=document.querySelector('[data-carnage]'),dot=document.querySelector('.cloud-dot');
 if(clock)clock.textContent=cloudClock();if(pts)pts.textContent=v.carnage+' / '+WonderGear.cloudRules.carnageCap;if(dot)dot.hidden=!cloudClaimable();
}
function cloudBotTarget(faction){
 for(const position of cloudPatrol){
  const index=faction*6+position;
  if(cloudOwner(index)===faction)continue;
  for(const slot of [4,1,0,5,2,6,3,7,8,9]){
   if(cloudDamage(index,slot)<cloudEnemyHealth[cloudPortalSlots[slot][0]]&&cloudPlayerDuel!==index*10+slot)return {index,slot};
  }
 }
 return null;
}
function cloudPatrolText(faction,slot){
 return cloudSquads[faction].join(' & ')+' · Fighting '+cloudPortalSlots[slot][0];
}
function cloudCapturePanel(index){
 const faction=Math.floor(index/6),scores=cloudFactionScores(index),owner=cloudOwner(index);
 const target=cloudBotTarget(faction);
 const points=scores.map((n,i)=>n?cloudFactions[i][0]+' '+n+'/80':'').filter(Boolean).join(' · ');
 return '<p>'+(owner<0?'Unowned':cloudFactions[owner][0]+' controls this territory')+' · '+(points||'0/80 territory points')+'</p>'+
  (target?.index===index?'<p>'+cloudPatrolText(faction,target.slot)+'</p>':'');
}
function startCloudPatrol(){
 clearInterval(cloudBotTimer);
 S.cloudPatrol??={hits:{},last:Date.now()};
 cloudBotTimer=setInterval(()=>{
  if(screen!=='cloudWar'||cloudCount!==4){clearInterval(cloudBotTimer);return;}
  if(cloudRoundCheck()&&!cloudPlayerDuel){cityCloudWar();return}
  cloudHud();
  if(document.hidden||Date.now()-S.cloudPatrol.last<6500)return;
  let moved=false;
  for(let faction=0;faction<4;faction++){
   const target=cloudBotTarget(faction);
   if(!target)continue;
   const {index,slot}=target;
   const hits=S.cloudPatrol.hits[index]??=Array(10).fill(0);
   hits[slot]++;
   moved=true;
  }
  if(!moved)return;
  S.cloudPatrol.last=Date.now();
  save();
  const board=document.querySelector('.cloud-four-board');
  if(board)board.outerHTML=cloudFourBoard(cloudTerritories());
  const panel=document.querySelector('[data-patrol-zone]');
  if(panel){
   const index=Number(panel.dataset.patrolZone);
   panel.innerHTML=cloudCapturePanel(index);
   panel.parentElement.querySelectorAll('.portal-strike').forEach((button,slot)=>{
    const remaining=cloudEnemyHealth[cloudPortalSlots[slot][0]]-cloudDamage(index,slot);
    button.disabled=remaining<=0;
    button.querySelector('progress').value=remaining;
   });
  }
 },1000);
}
function cloudArenaStyle(slot){
 return "--arena-art:url('assets/generated/cloud-arena-"+slot+".webp')";
}
function cloudArenaFloor(ctx){
 ctx.save();
 for(const x of [140,486]){
  ctx.beginPath();ctx.ellipse(x,366,x===486?77:40,9,0,0,Math.PI*2);
  ctx.fillStyle='#1e292ead';ctx.fill();
 }
 ctx.restore();
}
let cloudMapOffset=[0,0],cloudAutoNext=true,cloudHallTab='Boss';
const cloudRideMs=1900;
// The hall of a city: who is left, who is back by the round's end, which faction beat whom; tap a row to fight it.
function cloudBossName(slot){const art=cloudPortalSlots[slot][3],same=cloudPortalSlots.slice(0,slot).filter(x=>x[3]===art).length;return (WonderGear.tierGuardians.find(g=>g.id==='guardian-t'+art)?.name||'Defender')+(same?' II':'')}
const cloudNextTarget=index=>cloudPortalSlots.findIndex(([role],slot)=>cloudDamage(index,slot)<cloudEnemyHealth[role]);
function cloudHallPick(index,slot){if(cloudBattle&&!cloudBattle.done&&cloudBattle.index===index&&cloudBattle.slot===slot)return;if(cloudDamage(index,slot)>=cloudEnemyHealth[cloudPortalSlots[slot][0]]){toast('Defeated · returns in '+cloudClock());return}cloudRide(index,slot)}
// Pathfinding: Reina rides across the hall on her mount to the chosen defender, then fights it (Boss List tap and
// Auto next). The fight runs on the battle clock below, so the ride is just the start of the next timed fight.
function cloudRide(index,slot){
 if(cloudBattle&&!cloudBattle.done)cloudFightStop(true);
 cloudFightStart(index,slot,cloudRideMs);
 if(screen==='cloudWar')cloudBattleView();
}
function cloudHallTabs(tab,index,slot){cloudHallTab=tab;const hall=document.querySelector('.cloud-hall');if(hall)hall.outerHTML=cloudHall(index,slot)}
function cloudHall(index,current){
 const sector=Math.floor(index/6),pts=cloudFactionScores(index)[cloudMine]||0,owner=cloudOwner(index),holy=cloudOwner(sector*6),v=WonderGear.cloudState(S);
 const mine=S.cloudWarHits?.[index]||[],bots=S.cloudPatrol?.hits?.[index]||[];
 const rows=cloudPortalSlots.map(([role],slot)=>{const lim=cloudEnemyHealth[role],down=cloudDamage(index,slot)>=lim,by=down?((mine[slot]||0)>=lim?cloudMine:sector):-1,now=slot===current;
  return `<button class="hall-row role-${role.toLowerCase()} ${now?'now':''}" onclick="cloudHallPick(${index},${slot})">${denPlain}<b>${cloudBossName(slot)}</b><em class="${down?'':'up'}">${now?'Fighting':down?cloudClock():'Refreshed'}</em><span style="color:${by>=0?cloudFactions[by][3]:'#9fb0d8'}">${by>=0?cloudFactions[by][0]:'None'}</span></button>`}).join('');
 const killers=[[esc(S.name),cloudMine,mine.filter((n,slot)=>n>=cloudEnemyHealth[cloudPortalSlots[slot][0]]).length],...(sector===cloudMine?cloudSquads[cloudMine].map((n,i)=>[n+' <small>AI</small>',cloudMine,bots.filter((h,slot)=>h>0&&slot%2===i).length]):[])].sort((a,b)=>b[2]-a[2]);
 const dmg=killers.map(([n,f,k],i)=>`<div class="hall-row"><b>${i+1}. ${n}</b><em class="up">${k} defeated</em><span style="color:${cloudFactions[f][3]}">${cloudFactions[f][0]}</span></div>`).join('');
 return `<div class="cloud-hall"><div class="hall-info"><span>Carnage Points <b>${v.carnage}/${WonderGear.cloudRules.carnageCap}</b></span><span>Current Territory Point: <b>${pts}</b> <i class="${owner===cloudMine?'ok':''}">${owner===cloudMine?'Occupied':'Not occupied'}</i></span><span>Current Holy Land Owner: <b style="color:${holy>=0?cloudFactions[holy][3]:'#fff'}">${holy>=0?cloudFactions[holy][0]:'None'}</b></span></div>
  <div class="hall-tabs"><button aria-pressed="${cloudHallTab==='Boss'}" onclick="cloudHallTabs('Boss',${index},${current})">${denPlain}Boss List</button><button aria-pressed="${cloudHallTab==='Dmg'}" onclick="cloudHallTabs('Dmg',${index},${current})">${denPlain}DMG Rankings</button></div>
  <div class="hall-list">${cloudHallTab==='Boss'?rows:dmg}</div></div>`;
}
// Cloud War fights run on a clock (user: "each fight about a minute, auto, so you can see Reina fighting, and I can
// still leave to the menus instead of only watching"). A fight lasts CLOUD_FIGHT seconds for a full defender (less if
// it was already hurt); the result is settled by a one-second ticker whatever screen is open, Auto next rides on to the
// next defender, and a small pill on other screens shows the fight and brings her back to it. The canvas only draws.
const CLOUD_FIGHT={Guard:45,Elite:60,Boss:75},CLOUD_BURST={sec:4,cd:8},CLOUD_LOOT_MS=2400;
let cloudBattle=null,cloudBattleTimer=0,cloudViewGen=0;
function cloudFightStart(index,slot,delay=0){
 const role=cloudPortalSlots[slot][0],limit=cloudEnemyHealth[role],left=Math.max(.05,1-cloudDamage(index,slot)/limit);
 cloudBattle={index,slot,role,hp0:left,start:Date.now()+delay,dur:CLOUD_FIGHT[role]*left*1000,burstAt:0,done:false};
 cloudPlayerDuel=index*10+slot;clearInterval(cloudBattleTimer);cloudBattleTimer=setInterval(cloudFightTick,1000);cloudFightTick();
}
const cloudFightP=(b,now=Date.now())=>Math.max(0,Math.min(1,(now-b.start)/b.dur));
const cloudFightHp=(b,now)=>b.hp0*(1-cloudFightP(b,now));
// Leaving for another defender keeps the damage done so far.
function cloudFightStop(keep){
 const b=cloudBattle;if(!b)return;
 if(keep&&!b.done&&Date.now()>b.start){const lim=cloudEnemyHealth[b.role],hits=(S.cloudWarHits??={})[b.index]??=Array(10).fill(0);hits[b.slot]=Math.max(hits[b.slot]||0,Math.min(lim-1,Math.floor(lim*(1-cloudFightHp(b)))));save()}
 cloudBattle=null;cloudPlayerDuel=null;clearInterval(cloudBattleTimer);cloudBattleTimer=0;cloudPill();
}
function cloudFightSettle(){
 const b=cloudBattle,{index,slot,role}=b,limit=cloudEnemyHealth[role],hits=(S.cloudWarHits??={})[index]??=Array(10).fill(0);
 let gain=0,loot=cloudLoot[role];
 if(!(hits[slot]>=limit)){hits[slot]=limit;gain=WonderGear.cloudGain(S,cloudEnemyScore[role]);if(loot)WonderGear.bagAdd(S,loot.id,loot.n);save()}else loot=null;
 b.done=true;b.result={gain,loot};b.doneAt=Date.now();
 const next=cloudNextTarget(index),watching=document.querySelector('.cloud-encounter canvas');
 if(!watching)toast('⚔ '+cloudBossName(slot)+' defeated · +'+cloudEnemyScore[role]+' territory points'+(gain?' · +'+gain+' Carnage':''));
 b.next=cloudAutoNext&&next>=0?next:-1;
}
function cloudFightTick(){
 const b=cloudBattle;if(!b){cloudFightStop(false);return}
 const now=Date.now();
 if(!b.done&&now>=b.start+b.dur)cloudFightSettle();
 if(b.done&&now>=b.doneAt+CLOUD_LOOT_MS){
  if(b.next>=0){const {index}=b,next=b.next;cloudBattle=null;cloudFightStart(index,next,cloudRideMs);if(document.querySelector('.cloud-encounter canvas'))cloudBattleView();return}
  const back=!!document.querySelector('.cloud-encounter canvas'),{index}=b;cloudFightStop(false);
  if(back&&screen==='cloudWar'){cityCloudWar();cloudTerritory(index)}return;
 }
 cloudPill();
}
// The pill on other screens: who she fights and how far; a tap brings the fight back.
function cloudPill(){
 if(typeof document.createElement!=='function'||typeof document.getElementById!=='function')return;
 const stage=document.getElementById('stage')||document.body;let pill=document.getElementById('cloudPill');
 const b=cloudBattle,showing=!!document.querySelector('.cloud-encounter canvas');
 if(!b||showing){pill?.remove();return}
 if(!pill){pill=document.createElement('button');pill.id='cloudPill';pill.className='cloud-pill';pill.onclick=()=>{if(screen!=='cloudWar')go('cloudWar');setTimeout(cloudBattleView,60)};stage.append(pill)}
 const now=Date.now(),txt=b.done?'Victory · '+cloudBossName(b.slot):now<b.start?'Pathfinding · '+cloudBossName(b.slot):cloudBossName(b.slot)+' · '+Math.round(cloudFightHp(b,now)*100)+'% HP';
 pill.innerHTML=`<img src="${reinaLookPath(false)}" alt=""><span><b>⚔ Cloud War</b><small>${txt}</small></span><i>Watch</i>`;
}
function cloudStrike(index,slot){
 const defender=cloudPortalSlots[slot],place=cloudTerritories()[index];
 if(screen!=='cloudWar'||cloudCount!==4||!defender||!place||Math.floor(index/6)!==cloudMine)return;
 if(cloudDamage(index,slot)>=cloudEnemyHealth[defender[0]])return;
 const field=$('.cloud-field.map-4');if(field)cloudMapOffset=[field.scrollLeft,field.scrollTop];
 if(!cloudBattle||cloudBattle.index!==index||cloudBattle.slot!==slot||cloudBattle.done){if(cloudBattle)cloudFightStop(true);cloudFightStart(index,slot)}
 cloudBattleView();
}
// The battle view draws the running fight: Reina's volleys, her three pets' bolts, the defender's orbs, damage numbers.
function cloudBattleView(){
 const b=cloudBattle;if(!b||screen!=='cloudWar')return;
 const {index,slot,role}=b,place=cloudTerritories()[index],art=cloudPortalSlots[slot][3],gen=++cloudViewGen,mapOffset=cloudMapOffset;
 $('#modal').close();cloudPill();
 const body=$('#main'),maxHp=role==='Boss'?3000000:role==='Elite'?2100000:1500000;
 body.innerHTML=`<section class="cloud-encounter" style="${cloudArenaStyle(slot)}"><h2>${place.name} · ${cloudBossName(slot)}</h2><label>${role==='Boss'?'Golden Boss':role} HP <b data-enemy-hp></b><progress max="1000" value="1000"></progress><small class="cloud-share">1. ${cloudFactions[cloudMine][0]}: 100% · <span data-clock></span></small></label><div class="cloud-battlefield"><canvas width="640" height="420" aria-label="Reina fighting the ${role}"></canvas></div><p data-status>Auto-fighting</p><div class="cloud-hall-buttons"><button class="primary" data-burst>Celestial Arrow</button><button class="cloud-auto" aria-pressed="${cloudAutoNext}" onclick="cloudAutoNext=!cloudAutoNext;this.setAttribute('aria-pressed',cloudAutoNext);if(cloudBattle&&cloudBattle.done&&!cloudAutoNext)cloudBattle.next=-1">${denPlain}Auto next</button><button data-exit>Leave · keeps fighting</button><button data-stop>Stop</button></div>${cloudHall(index,slot)}</section>`;
 if(typeof body.querySelector!=='function')return;   // test page without a DOM: the fight still runs on the clock
 const canvas=body.querySelector('canvas'),ctx=canvas.getContext('2d'),burst=body.querySelector('[data-burst]'),bar=body.querySelector('progress'),number=body.querySelector('[data-enemy-hp]'),clock=body.querySelector('[data-clock]'),status=body.querySelector('[data-status]');
 const pets=(WonderGear.petTeam(S)||[]).slice(0,3).filter(Boolean).map((id,i)=>({id,i,next:.8+i*.7,kick:0}));
 const actor={clock:0,heroShotAt:-1,spriteIdle:true},g={hitFX:[]},shots=[],bolts=[],nums=[];
 let t=0,last=performance.now(),nextShot=.2,nextOrb=2.2,orb=null,hurt=-9,shownDone=false;
 const back=()=>{cloudPill();cityCloudWar();const r=$('.cloud-field.map-4');if(r){r.scrollLeft=mapOffset[0];r.scrollTop=mapOffset[1]}cloudTerritory(index)};
 body.querySelector('[data-exit]').onclick=()=>{cloudViewGen++;back()};
 body.querySelector('[data-stop]').onclick=()=>{cloudViewGen++;cloudFightStop(true);back()};
 const hit=()=>{const c=cloudBattle;if(!c||c.done||Date.now()<c.start||Date.now()<c.burstAt)return;c.start-=CLOUD_BURST.sec*1000;c.burstAt=Date.now()+CLOUD_BURST.cd*1000;shots.push({at:t,big:true});actor.heroShotAt=t};
 burst.onclick=hit;canvas.onclick=hit;
 const dmg=big=>Math.round(maxHp/(CLOUD_FIGHT[role]*1.6)*(big?6:.8+Math.random()*.5));
 function frame(now){
  if(gen!==cloudViewGen||!canvas.isConnected||screen!=='cloudWar')return;
  const c=cloudBattle;if(!c){return}
  const dt=Math.min(.1,(now-last)/1000);last=now;t+=dt;actor.clock=t;tickImpacts(g,dt);
  const wall=Date.now(),riding=wall<c.start,hp=c.done?0:cloudFightHp(c,wall);
  ctx.clearRect(0,0,640,420);cloudArenaFloor(ctx);
  // Pathfinding overlay while she rides to this defender.
  let path=canvas.parentElement.querySelector('.cloud-path');
  if(riding&&!path){canvas.parentElement.insertAdjacentHTML('beforeend',`<div class="cloud-path" role="status"><img src="${reinaLookPath(true)}" alt="Reina riding"><strong>⚔ Pathfinding</strong><small>to ${cloudBossName(slot)}</small></div>`)}
  if(!riding&&path)path.remove();
  if(!riding){
   if(!c.done&&t>=nextShot){shots.push({at:t,big:false});actor.heroShotAt=t;nextShot=t+.65}
   for(const p of pets){p.kick=Math.max(0,p.kick-dt*3);if(!c.done&&t>=p.next){bolts.push({at:t,from:p.i});p.kick=1;p.next=t+2.4}}
   if(!c.done&&t>=nextOrb){orb=t;nextOrb=t+3.2}
  }
  drawReina(ctx,actor,140,368,155,220);
  pets.forEach(p=>{const x=[70,205,110][p.i],y=[392,396,330][p.i],hop=Math.sin(t*3+p.i)*3+p.kick*6;ctx.save();ctx.globalAlpha=riding?.35:1;drawArtSprite(ctx,petArtId(p.id),x,y-hop,72,72);ctx.restore()});
  if(!c.done||wall-c.doneAt<600){ctx.save();if(role==='Boss'){ctx.shadowColor='#ffd361';ctx.shadowBlur=13}if(t-hurt<.12)ctx.filter='brightness(1.8)';ctx.globalAlpha=c.done?Math.max(0,1-(wall-c.doneAt)/600):riding?.4:1;drawArtSprite(ctx,'guardian-t'+art,486,369,200,245);ctx.restore()}
  for(let i=shots.length-1;i>=0;i--){const k=(t-shots[i].at)/.3;if(k>=1){const n=dmg(shots[i].big);nums.push({at:t,n,big:shots[i].big,x:470+Math.random()*40,y:200});addImpact(g,480,232,shots[i].big?'#ffe27a':'#fff0c0');hurt=t;shots.splice(i,1)}else drawGoldenArrow(ctx,170+290*k,234-18*k,shots[i].big?80:54,-.06)}
  for(let i=bolts.length-1;i>=0;i--){const k=(t-bolts[i].at)/.45,sx=[90,225,130][bolts[i].from],sy=[350,354,290][bolts[i].from];if(k>=1){nums.push({at:t,n:Math.round(dmg(false)*.35),x:460+Math.random()*50,y:250,pet:true});addImpact(g,478,250,'#9ff0ff','fire');bolts.splice(i,1)}else{const x=sx+(470-sx)*k,y=sy+(250-sy)*k-40*Math.sin(Math.PI*k);softLight(ctx,x,y,12,'150,230,255',.9)}}
  if(orb!==null){const k=(t-orb)/.8;if(k>=1){orb=null;nums.push({at:t,n:'−'+Math.round(dmg(false)*.2),x:120,y:170,foe:true});addImpact(g,150,240,'#d08aff')}else{const x=458-314*k,y=226+28*k-26*Math.sin(Math.PI*k);ctx.save();ctx.fillStyle='#ffdbff';ctx.shadowColor='#b65fff';ctx.shadowBlur=14;ctx.beginPath();ctx.arc(x,y,8,0,2*Math.PI);ctx.fill();ctx.restore()}}
  paintImpacts(ctx,g);
  for(let i=nums.length-1;i>=0;i--){const n=nums[i],a=(t-n.at)/.9;if(a>=1){nums.splice(i,1);continue}ctx.save();ctx.globalAlpha=1-a;ctx.font=`900 ${n.big?30:n.pet?16:20}px Georgia`;ctx.textAlign='center';ctx.lineWidth=4;ctx.strokeStyle=n.foe?'#5a1040':'#3a1a00';ctx.fillStyle=n.foe?'#ffb0e0':n.pet?'#bff4ff':n.big?'#ffe27a':'#fff4d0';const txt=typeof n.n==='number'?fmt(n.n):n.n;ctx.strokeText(txt,n.x,n.y-40*a);ctx.fillText(txt,n.x,n.y-40*a);ctx.restore()}
  number.textContent=Math.ceil(hp*100)+'%';bar.value=Math.round(hp*1000);
  const left=Math.max(0,Math.ceil((c.start+c.dur-wall)/1000));clock.textContent=riding?'riding…':c.done?'won':Math.floor(left/60)+':'+String(left%60).padStart(2,'0')+' left';
  status.textContent=riding?'Pathfinding to '+cloudBossName(slot):c.done?'Victory':'Reina · '+Math.max(40,100-Math.round(cloudFightP(c,wall)*35))+'% HP · Auto-fighting · you can leave, the fight goes on';
  const cd=Math.ceil((c.burstAt-wall)/1000);burst.disabled=riding||c.done||cd>0;burst.textContent=cd>0?'Celestial Arrow · '+cd+'s':'Celestial Arrow';
  if(c.done&&!shownDone){shownDone=true;const {gain,loot}=c.result;bagArtVars();canvas.parentElement.insertAdjacentHTML('beforeend',`<div class="cloud-floating-loot" role="status">${loot?'<div class="bag-gains">'+cloudItems({[loot.id]:loot.n})+'</div>':''}<strong>+${cloudEnemyScore[role]} territory points · ${gain?'+'+gain+' Carnage Points':'daily Carnage cap reached'}</strong></div>`);const hall=body.querySelector('.cloud-hall');if(hall)hall.outerHTML=cloudHall(index,-1)}
  requestAnimationFrame(frame);
 }
 requestAnimationFrame(frame);
}
// The city window: a mini-map of its ten defenders. Tap one to choose it (a defeated one shows when it returns),
// then Go fights the chosen defender. Other factions' cities only show their state.
let cloudPick=null;
function cloudChoose(index,slot){
 const role=cloudPortalSlots[slot][0];
 if(cloudDamage(index,slot)>=cloudEnemyHealth[role]){toast(cloudBossName(slot)+' is defeated · returns in '+cloudClock());return}
 cloudPick={index,slot};cloudTerritory(index);
}
function cloudGo(index){
 const slot=cloudPick?.index===index?cloudPick.slot:cloudNextTarget(index);
 if(slot<0){toast('Every defender here is defeated. They return in '+cloudClock()+'.');return}
 cloudPick=null;cloudStrike(index,slot);
}
function cloudPortalPreview(place,index){
 const rewards=cloudPortalRewards[place.rank];
 const paths='M50 31 L24 14 L9 31 L24 48 Z M50 31 L76 14 L91 31 L76 48 Z M50 31 V55 M50 55 H34 V69 L50 87 L66 69 V55 Z';
 // Each outer courtyard holds one elite and two guards around its central paving.
 const pads=[[50,32],[26,32],[74,32],[50,58],[14,24],[12,36],[86,24],[88,36],[42,69],[58,69]];
 if(cloudCount!==4){
  const defenders=cloudPortalSlots.map(([role,x,y,art])=>`<div class="portal-defender" data-role="${role}" style="left:${x}%;top:${y}%"><small>${role==='Boss'?'Golden Boss':role}</small>${artImage('guardian-t'+art,role)}</div>`).join('');
  return `<section class="cloud-portal-preview"><h2>${place.name}</h2><p>${place.owner} · ${place.rank==='Capital'?'Holy City':place.rank}</p><div class="portal-defenders"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${paths}"/></svg>${defenders}</div><p>Boss personal point pool <b>${rewards.personal}</b></p><div>${dailyTokens(['hud-prisms','hud-gems',rewards.armor])}</div></section>`;
 }
 const sector=Math.floor(index/6),mine=sector===cloudMine,owner=cloudOwner(index),scores=cloudFactionScores(index);
 if(cloudPick?.index!==index||cloudDamage(index,cloudPick.slot)>=cloudEnemyHealth[cloudPortalSlots[cloudPick.slot][0]])cloudPick=mine&&cloudNextTarget(index)>=0?{index,slot:cloudNextTarget(index)}:null;
 const pick=cloudPick?.slot??-1;
 const defenders=cloudPortalSlots.map(([role,,,art],slot)=>{const lim=cloudEnemyHealth[role],left=lim-cloudDamage(index,slot),down=left<=0;
  return `<button class="portal-defender portal-strike ${slot===pick?'picked':''} ${down?'down':''}" aria-label="${cloudBossName(slot)}, ${role}${down?', defeated':''}" style="left:${pads[slot][0]}%;top:${pads[slot][1]}%" data-role="${role}" onclick="cloudChoose(${index},${slot})">${denPlain}<small>${role==='Boss'?'Boss':role}</small>${artImage('guardian-t'+art,role)}${down?`<em class="portal-clock">${cloudClock()}</em>`:`<i class="portal-hp"><u style="width:${left/lim*100}%"></u></i>`}</button>`}).join('');
 const rows=cloudFactions.map((f,i)=>[f,i,scores[i]||0]).filter(([,i,n])=>n>0||i===sector||i===cloudMine).sort((a,b)=>b[2]-a[2]);
 const role=pick>=0?cloudPortalSlots[pick][0]:'Boss',loot=cloudLoot[role];
 return `<section class="cloud-portal-preview cloud-city"><h2>${place.name}</h2><p class="city-owner">Ownership: <b style="color:${owner>=0?cloudFactions[owner][3]:'#fff'}">${owner>=0?cloudFactions[owner][0]:'None'}</b> · ${place.rank==='Capital'?'Holy City':place.rank}</p>
  ${mine?'':'<p class="cloud-foreign">A city of '+place.owner+'. '+cloudFactions[cloudMine][0]+' opens only its own six cities; this one is left to its faction.</p>'}
  <div class="portal-defenders" data-terrain="${place.rank}">${defenders}</div>
  <div class="city-points"><b>Current points:</b>${rows.map(([f,i,n],k)=>`<span style="color:${f[3]}">${k+1}. ${f[0]}: ${n}</span>`).join('')}<small>80 points open the city</small></div>
  <div class="city-kill"><h3>Killing Rewards${pick>=0?' · '+cloudBossName(pick):''}</h3><p>Territory Points: <b>${cloudEnemyScore[role]}</b> · Carnage Points: <b>${cloudEnemyScore[role]}</b></p><p>Personal point pool <b>${rewards.personal}</b>, shared by damage</p><div class="bag-gains">${loot?cloudItems({[loot.id]:loot.n}):''}${dailyTokens(['hud-prisms','hud-gems'])}</div></div>
  <div class="den-actions">${cloudChestReady(index)?`<button class="den-gold city-own" onclick="cloudOwnClaim(${index})">${denPlain}Ownership Reward</button>`:''}<button class="den-gold city-go" onclick="cloudGo(${index})" ${mine&&pick>=0?'':'disabled'}>${denPlain}Go</button></div></section>`;
}
function cloudTerritory(index){
 if(cloudCount===4&&cloudRoundCheck())cityCloudWar();
 const place=cloudTerritories()[index];
 if(cloudCount!==3){modal(cloudPortalPreview(place,index));return}
 const portraits=cloudDefenders[({Island:"Outpost",Fortress:"Stronghold"})[place.rank]||place.rank].map((role,i)=>'<span>'+artImage('guardian-t'+(7+i),'')+'<small>'+role+'</small></span>').join('');
 modal('<h2>'+place.name+'</h2><p>'+place.rank+' · '+place.owner+'</p><div class="cloud-guards">'+portraits+'</div><h3>Killing Rewards</h3><p>Territory points · 30</p>'+dailyTokens(['hud-prisms','hud-gems','gear-armor-t6']));
}
function cloudBrief(page){
 const names=['3-Faction War','2-Faction War','4-Faction War','Twin Sanctum','Four Sanctums'];
 const descriptions=['Three capitals command the sky roads.','Two factions compete for the sky island.','Four factions defend their own capitals.','Four factions contest two holy cities.','Four factions contest four holy cities.'];
 const days=[null,10,14,50,90];
 const body='<h2>'+names[page]+'</h2><p>'+descriptions[page]+'</p>'+(days[page]?'<p>Opens on server day '+days[page]+'</p>':'')+(page===2?'<p>Each faction has six cities: its Holy City, two fortresses and three islands. A city opens for the faction when it scores 80 points there by defeating defenders. When both cities at the ends of a road are open, the road lights up; open all six and the whole network shines.</p><p>Dashed roads lead into other factions\' lands. Those cities could be opened, but they belong to other factions and are left alone.</p><p>Daily Carnage Point allowance: 1200. Weekly shop allowance: 80 additional points.</p>':page===1?'<p>Each capital connects to two fortresses guarding three islands.</p>':page<3?'<p>Each faction holds three outposts, two strongholds and one capital.</p>':'')+'<div class="cloud-brief-tabs">'+names.map((n,i)=>'<button aria-pressed="'+(i===page)+'" onclick="cloudBrief('+i+')">'+n+'</button>').join('')+'</div>';
 if($('#modal').open)$('#modalBody').innerHTML=body;else modal(body);
}
function cloudFourBoard(nodes){
 // A road inside one faction's sector lights up once BOTH of its cities are open (80 points each) for that faction;
 // until then it is a faint line. Roads into another faction's sector are dashed: those cities are not ours to open.
 const route=(a,b)=>{
  const start=nodes[a],end=nodes[b];
  const x=start.x*6,y=start.y*8,dx=(end.x-start.x)*6,dy=(end.y-start.y)*8;
  const bend=.055;
  const path=`M ${x} ${y} Q ${x+dx/2-dy*bend} ${y+dy/2+dx*bend} ${x+dx} ${y+dy}`;
  const sa=Math.floor(a/6),sb=Math.floor(b/6);
  if(sa!==sb)return `<path d="${path}" fill="none" stroke="#fff3cf" stroke-width="2.4" stroke-dasharray="3 7" stroke-linecap="round" opacity=".8" pointer-events="none"/>`;
  const open=cloudOwner(a)===sa&&cloudOwner(b)===sa,glow=sa===cloudMine?'#ffd86b':cloudFactions[sa][3];
  return open?`<g fill="none" stroke-linecap="round" pointer-events="none"><path d="${path}" stroke="${glow}" stroke-width="13" opacity=".6" filter="url(#cloudRoadGlow)"/><path d="${path}" stroke="${glow}" stroke-width="5.5"/><path d="${path}" stroke="#fffbe8" stroke-width="1.8"/></g>`
   :`<path d="${path}" fill="none" stroke="${nodes[a].color}" stroke-width="2.2" opacity=".55" stroke-linecap="round" pointer-events="none"/>`;
 };
 const roads=[];
 // Repeat the drawn north-west quarter clockwise. Slots are city, corner fort,
 // side fort, entry island, perimeter island and inner island.
 const clockwise=[0,6,18,12];
 for(const [quarter,base] of clockwise.entries()){
  const next=clockwise[(quarter+1)%4];
  const local=[[0,1],[0,2],[1,2],[1,5],[2,5],[2,4],[3,4],[3,5]];
  for(const [a,b] of local)roads.push(route(base+a,base+b));
  const across=[[0,0],[0,2],[1,2],[1,4],[3,4]];
  for(const [a,b] of across)roads.push(route(base+a,next+b));
 }
 const ships=cloudFactions.map((faction,sector)=>{
  const first=sector*6+3, island=nodes[first];
  const x=sector%2?552:48,y=sector<2?49:751;
  const endX=island.x*6,endY=island.y*8;
  const trail=`M ${x} ${y} Q ${x} ${(y+endY)/2} ${endX} ${endY}`;
  roads.push(`<g fill="none" stroke-linecap="round"><path d="${trail}" stroke="${island.color}" stroke-width="9" opacity=".5" filter="url(#cloudRoadGlow)"/><path d="${trail}" stroke="${island.color}" stroke-width="4"/><path d="${trail}" stroke="#fff7db" stroke-width="2" stroke-dasharray="2 6"/></g>`);
  return `<g transform="translate(${x} ${y})" role="button" tabindex="0" aria-label="${faction[0]} skyship to ${island.name}" onclick="cloudTerritory(${first})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();cloudTerritory(${first})}" style="cursor:pointer"><rect x="-32" y="-24" width="64" height="54" fill="transparent"/><image href="assets/generated/hud-isle-skyship.webp" x="-24" y="-24" width="48" height="43"/><text y="29" fill="${island.color}" stroke="#152333" stroke-width="3" paint-order="stroke" font-size="11" font-weight="bold">${faction[0]}</text></g>`;
 }).join('');
 const patrols=cloudFactions.map((_,faction)=>cloudBotTarget(faction));
 const markers=nodes.map((p,i)=>{
  const city=p.rank==='Capital',island=p.rank==='Island';
  const faction=p.owner.toLowerCase();
  const castle=faction==='galewing'?'larkspire':faction;
  const variant=['','gate','tower','grove','crystal','spring'][i%6];
  const asset=city?'cloud-sky-'+castle:'cloud-'+faction+'-'+variant;
  const size=city?100:island?48:65,width=city?133:82;
  const label=city?p.name+' · '+p.owner:p.name+' '+p.rank;
  const fontSize=city?10.5:9.5;
  const ribbonWidth=Math.ceil(label.length*fontSize*.57)+9;
  const sector=Math.floor(i/6),owner=cloudOwner(i),target=patrols[sector];
  const alive=cloudAlive(i),badge=(owner>=0?cloudFactions[owner][0]+' · ':'')+'Boss: '+alive+(target?.index===i?' · under attack':'');
  const spriteSize=city?size:Math.round(size*.9);
  const chest=cloudChestReady(i)?`<g class="cloud-own-chest" role="button" aria-label="Ownership reward of ${p.name}" onclick="event.stopPropagation();cloudOwnClaim(${i})" transform="translate(${p.x*6} ${p.y*8-size*.64})"><circle r="9" fill="#ffe27a" opacity=".35"><animate attributeName="r" values="7;10;7" dur="1.4s" repeatCount="indefinite"/></circle><g><animateTransform attributeName="transform" type="translate" values="0 0;0 -2;0 0" dur="1.4s" repeatCount="indefinite"/><image href="${artPath('comp-bag-items')}" x="${p.rank==='Capital'?-30:-10}" y="-30" width="80" height="80" clip-path="url(#cloudChestClip)"/></g></g>`:'';
  return `<g transform="translate(${p.x*6} ${p.y*8})" role="button" tabindex="0" aria-label="${p.owner}: ${p.name}, ${p.rank}" onclick="cloudTerritory(${i})" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();cloudTerritory(${i})}" style="cursor:pointer"><rect x="${-width/2}" y="${-size*.65}" width="${width}" height="${size+24}" fill="transparent"/><image href="assets/generated/${asset}.webp" x="${-spriteSize/2}" y="${size*.3-spriteSize}" width="${spriteSize}" height="${spriteSize}"/><rect x="${-ribbonWidth/2}" y="${size*.3}" width="${ribbonWidth}" height="14" rx="4" fill="#415874" fill-opacity=".65"/><text y="${size*.3+10.4}" fill="#fffdf4" font-size="${fontSize}" font-weight="600">${label}</text><text y="${size*.3+24}" fill="${owner>=0?cloudFactions[owner][3]:'#fff8dd'}" stroke="#203044" stroke-width="2.6" paint-order="stroke" font-size="8.6" font-weight="700">${badge}</text></g>`+chest;
 }).join('');
 return `<svg class="cloud-four-board" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid meet" role="group" aria-label="Four faction territories" text-anchor="middle" font-family="system-ui"><defs><filter id="cloudRoadGlow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3"/></filter><clipPath id="cloudChestClip"><rect x="-10" y="-10" width="20" height="20"/></clipPath></defs><image href="assets/generated/cloud-war-heavens.webp" width="600" height="800" preserveAspectRatio="xMidYMid slice" pointer-events="none"/><rect width="600" height="800" fill="#416c9a" opacity=".14" pointer-events="none"/>${roads.join('')}${ships}${markers}</svg>`;
}
function cloudLinkedMap(nodes){
 const links=[[0,1],[0,2],[1,3],[1,4],[2,3],[2,5]];
 const bases=cloudLayouts[cloudCount].map((_,i)=>i*6);
 const cityLinks=cloudCount===4?[[0,6],[6,18],[18,12],[12,0]]:[[0,6]];
 const capitalRoad=cityLinks.map(([a,b])=>`<line x1="${nodes[a].x}" y1="${nodes[a].y}" x2="${nodes[b].x}" y2="${nodes[b].y}" stroke="#ffedbd"/>`).join('');
 const roads=bases.flatMap(base=>links.map(([from,to])=>{
  const a=nodes[base+from],b=nodes[base+to];
  return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="${a.color}"/>`;
 })).join('');
 const places=nodes.map((p,i)=>{
  const capital=p.rank==='Capital';
  const art=p.rank==='Island'?'left-explore':(capital?'vale-castle':'vale-tower')+(i<6?1:2);
  const label=cloudCount===2||capital?p.name:p.rank;
  return `<button class="duel-place" data-rank="${p.rank}" style="left:${p.x}%;top:${p.y}%;--banner:${p.color}" aria-label="${p.owner}: ${p.name}, ${p.rank}" onclick="cloudTerritory(${i})"><img src="assets/generated/${art}.webp" alt=""><span>${label}</span>${capital?'<small>'+p.owner+' · Holy City</small>':''}</button>`;
 }).join('');
 return '<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">'+capitalRoad+roads+'</svg>'+places;
}
function cityCloudWar(){
 const previous=$('.cloud-field.map-4');
 const offset=previous&&[previous.scrollLeft,previous.scrollTop];
 const nodes=cloudTerritories();
 const symbols={Capital:'♛',Stronghold:'♜',Outpost:'⚑'};
 const markers=nodes.map((p,i)=>`<button class="cloud-place" data-rank="${p.rank}" aria-label="${p.owner}: ${p.name}, ${p.rank}" title="${p.name} · ${p.rank}" style="left:${p.x}%;top:${p.y}%;--banner:${p.color}" onclick="cloudTerritory(${i})"><span class="map-token" aria-hidden="true">${symbols[p.rank]}</span></button>`).join('');
 if(cloudCount===4)cloudRoundCheck();
 const cv=WonderGear.cloudState(S);
 $('#main').innerHTML='<section class="cloud-war"><div class="cloud-heading"><strong>Cloud War</strong>'+(cloudCount===4?'<span class="cloud-round">This round ends in <b data-round>'+cloudClock()+'</b></span><span class="cloud-level">Level <b>'+level()+'</b></span>':'<small>Battle starts at 19:30</small>')+'</div><div class="cloud-field map-'+cloudCount+'"><div class="cloud-map-plane">'+(cloudCount===4?cloudFourBoard(nodes):cloudCount===2?cloudLinkedMap(nodes):markers)+'</div></div>'+(cloudCount===4?'<div class="cloud-carnage">'+artImage('hud-rush','')+'<span>Carnage Points<b data-carnage>'+cv.carnage+' / '+WonderGear.cloudRules.carnageCap+'</b></span><span class="cloud-open">'+cloudFactions[cloudMine][0]+' cities open <b>'+cloudOpen(cloudMine)+' / 6</b></span></div>':'')+'<div class="cloud-actions"><button data-back aria-label="Back to city" onclick="go(\'home\')">‹</button>'+(cloudCount===4?[['hud-shop','Cloud Shop','cloudShopShow()'],['hud-clan','Faction Status','cloudStatusShow()'],['hud-chest','Point Rewards','cloudPointsShow()'],['hud-rank','Rankings','cloudRankShow()']].map(([icon,name,act])=>'<button class="cloud-tool" onclick="'+act+'">'+artImage(icon,'')+name+(name==='Point Rewards'?'<i class="cloud-dot"'+(cloudClaimable()?'':' hidden')+'></i>':'')+'</button>').join(''):'')+'<button class="cloud-tool" onclick="cloudBrief('+[3,2,4].indexOf(cloudCount)+')">'+artImage('hud-quest','')+'Guide</button></div></section>';
 if(cloudCount===4){
  cloudPlayerDuel=null;
  startCloudPatrol();
  const field=$('.cloud-field.map-4');
  field.scrollLeft=offset?offset[0]:0;
  field.scrollTop=offset?offset[1]:0;
 }

}

let eliteTab=0,eliteHero='reina',supremePick=null;
// ---- Fashion Elite Sale and Supreme Set (rules: WonderGear.supreme*) ------------------------------------------------
const supSet=id=>WonderGear.supremeById[id];
// A piece's picture: dress / hair / bow cards come from the wardrobe art; bubble and frame are drawn in CSS.
// Painted avatar frames (comp-avatar-frames, 4 x 2 atlas in the order of supremeSets), drawn over Reina's avatar.
function frameArtVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--avf'))return;root.style.setProperty('--avf','url("'+artPath('comp-avatar-frames')+'")')}
// Atlas order: the seven Supreme Set frames, then WonderGear.avatarFrames; 4 columns x FRAME_ROWS rows.
const FRAME_ROWS=12;
function frameArt(setId,face=true,cls=''){frameArtVars();const g=WonderGear;let n=g.supremeSets.findIndex(x=>x.id===setId);if(n<0)n=g.supremeSets.length+g.avatarFrames.findIndex(x=>x.id===setId);
 return '<span class="sup-frame pf '+cls+'">'+(face?'<img src="assets/generated/reina-avatar.webp" alt="">':'')+'<i class="pf-ring" style="background-position:'+(n%4)/3*100+'% '+Math.floor(n/4)/(FRAME_ROWS-1)*100+'%"></i></span>'}
// Painted chat bubbles (comp-chat-bubbles, 4 x 12 atlas: the seven set bubbles, then WonderGear.chatBubbles).
function bubbleAt(id){const g=WonderGear;let n=g.supremeSets.findIndex(x=>x.id===id);if(n<0)n=g.supremeSets.length+g.chatBubbles.findIndex(x=>x.id===id);return n<0?'':(n%4)/3*100+'% '+Math.floor(n/4)/(FRAME_ROWS-1)*100+'%'}
function bubbleVars(){const root=document.documentElement;if(!root?.style?.setProperty||root.style.getPropertyValue('--avb'))return;root.style.setProperty('--avb','url("'+artPath('comp-chat-bubbles')+'")')}
function bubbleArt(id,text=''){bubbleVars();return '<span class="pb" style="background-position:'+bubbleAt(id)+'"><i>'+text+'</i></span>'}
function supPieceArt(set,piece,big=false){
 if(piece==='outfit')return '<img src="'+artPath('fit-icon-'+set.dress)+'" alt="">';
 if(piece==='hair')return '<img src="'+artPath('fit-icon-hair-'+set.hair)+'" alt="">';
 if(piece==='weapon')return '<img src="'+artPath('weapon-style-'+set.bow)+'" alt="">';
 if(piece==='wings')return '<img src="'+artPath(set.wings)+'" alt="">';
 if(piece==='bubble')return bubbleArt(set.id,big?'Hello!':'');
 return frameArt(set.id,true);
}
function supTile(set,piece,extra=''){const own=WonderGear.supremeCopies(S,set.id,piece);
 return `<button class="sup-tile ${own?'':'locked'} ${screen==='citySupreme'&&supremeSel===piece&&supremePick===set.id?'sel':''}" style="--hue:${set.hue}" onclick="supTap('${set.id}','${piece}')">${denPlain}${supPieceArt(set,piece)}<b>UR</b>${own?'<i class="sup-act">Activated</i>'+(own>1?'<i class="sup-tier">T'+Math.min(WonderGear.supremeRules.pieceStars,own-1)+'</i>':''):'<i class="sup-lock">🔒</i>'}${extra}</button>`}
// Combat power a piece adds: the difference it makes to stats().power.
function supremeCp(setId,piece){
 const r=WonderGear,own={...(S.supreme?.own||{})},key=setId+':'+piece,with_={...own,[key]:Math.max(1,own[key]||0)},without={...own};delete without[key];
 const sv=S.supreme||{own:{},sale:{period:0,bought:{}}};
 return Math.max(0,Math.round(r.stats({...S,supreme:{...sv,own:with_}}).power-r.stats({...S,supreme:{...sv,own:without}}).power));
}
function supremeStatLines(stats){return Object.entries(stats).map(([k,n])=>'<li>'+(WonderGear.percentKeys.has(k)?'★ Fashion '+(WonderGear.labels[k]||k).replace(' Bonus','')+' +'+n+'%':(WonderGear.labels[k]||k)+' +'+fmt(n))+'</li>').join('')}
let supremeSel=null;
function supTap(setId,piece){if(screen==='citySupreme'){supremeSel=supremeSel===piece?null:piece;supremePick=setId;citySupreme()}else supremeInfo(setId,piece)}
const supStarRow=(n,max)=>'<span class="sup-pstars">'+'★'.repeat(n)+'<i>'+'★'.repeat(max-n)+'</i></span>';
function supremeInfo(setId,piece){
 const r=WonderGear,set=supSet(setId),p=r.supremePieces.find(x=>x.id===piece),stars=r.supremePieceStars(S,setId,piece),own=r.supremeCopies(S,setId,piece);
 const sale=r.supremeSale(),onSale=sale.set.id===setId;
 popup(`<div class="sup-info"><div class="sup-info-art" style="--hue:${set.hue}">${piece==='outfit'||piece==='wings'?`<img class="sup-figure" src="${registeredLookPath(set.dress,set.hair,0,piece==='wings'?set.wings:'','')}" alt="">`:piece==='hair'?`<span class="sup-head"><img src="${registeredLookPath(set.dress,set.hair,0,'','')}" alt=""></span>`:piece==='weapon'?`<img class="sup-weapon" src="${artPath('weapon-style-'+set.bow)}" alt="">`:supPieceArt(set,piece,true)}<b class="sup-cp">⚔ ${fmt(supremeCp(setId,piece))}</b></div>
 <div class="sup-info-head">${supTile(set,piece)}<div><h2>${set.name} (${p.name})</h2><small>${supStarRow(stars,r.supremeRules.pieceStars)}</small><small>Usage Level: <i>Unlimited</i></small><small>Type: <i>Fashion Materials</i></small></div></div>
 <div class="sup-info-body"><p>${own?'Activated · '+own+(own>1?' copies':' copy'):'Use to activate Fashion Materials'} <b>${set.name} (${p.name})</b><br>Activated CP: <i>+${fmt(supremeCp(setId,piece))}</i></p>
 <h3>◆ Activation Stats</h3><ul>${supremeStatLines(r.supremePieceStats(setId,piece,stars))}</ul>
 <h3>◆ ${set.name} (${r.supremeCount(S,setId)}/${r.supremePieceIds.length})</h3><p class="sup-setline"><span>[${r.supremePieceIds.length} Pieces]</span> ${supremeSetBonusText()}</p>
 <p class="sup-where">${onSale?'On sale now in the Fashion Elite Sale · buy as many as you like (spare copies add stars).':'Comes back in a later Fashion Elite Sale.'}</p></div></div>`);
}
function eliteBuy(piece){
 const r=WonderGear,got=r.supremeBuy(S,piece);
 if(!got){toast((S.scales||0)<r.supremeRules.price?'Not enough prisms.':'Sold out for this sale.');return}
 save();eliteStore();bagArtVars();
 popup(`<h2>You received</h2><div class="bag-gains"><span class="bag-gain" style="--rarity:${got.set.hue}">${supPieceArt(got.set,piece)}<b>×1</b><small>${got.set.name} (${r.supremePieces.find(x=>x.id===piece).name})</small></span><span class="bag-gain" style="--rarity:#ffcf5a">${uiIcon('gold')}<b>+${got.gold}</b><small>Gold</small></span></div><p>${got.first?'Activated! The piece now strengthens Reina'+(piece==='outfit'||piece==='hair'||piece==='weapon'?' and is in your wardrobe.':'.'):'A spare copy: the set gains a star.'}</p>`);
}
function eliteStore(){
 const r=WonderGear,R=r.supremeRules,sale=r.supremeSale(),set=sale.set,v=r.supremeState(S);
 const left=Math.max(0,sale.end-Date.now()),d=Math.floor(left/864e5),h=Math.floor(left%864e5/36e5),m=Math.floor(left%36e5/6e4);
 const packs=r.supremePieces.filter(p=>p.tab===eliteTab);
 const figure=piece=>piece==='weapon'?`<div class="el-bow"><img src="${artPath('weapon-style-'+set.bow)}" alt="${set.name} bow"></div>`
  :piece==='wings'?`<img class="el-fig" src="${registeredLookPath(set.dress,set.hair,0,set.wings,'')}" alt="${set.name} wings">`
  :piece==='bubble'||piece==='frame'?`<div class="el-deco">${supPieceArt(set,piece,true)}</div>`:`<img class="el-fig" src="${registeredLookPath(set.dress,set.hair,piece==='outfit'?set.bow:0,piece==='outfit'?set.wings:'','')}" alt="${set.name}">`;
 const card=p=>{const out=false;
  return `<div class="el-col">${figure(p.id)}<div class="el-tag"><b>UR</b><span>Exclusive<br>${set.name}</span></div><div class="el-cp">⚔ ${fmt(supremeCp(set.id,p.id))}</div>
  <div class="el-card"><h3>${p.pack}</h3><div class="el-items">${supTile(set,p.id,'<em>1</em>')}<span class="sup-tile gold">${denPlain}${uiIcon('gold')}<em>${R.gold}</em></span></div>
  <p class="el-old">Original price: <s>${fmt(R.oldPrice)} prisms</s> <i class="el-off">-67%</i></p><button class="den-gold el-buy" ${out?'disabled':''} onclick="eliteBuy('${p.id}')">${denPlain}${out?'Sold out':uiIcon('crystals')+' '+R.price}</button></div></div>`};
 $('#main').innerHTML=`<section class="elite-sale el-t${eliteTab}">
  <div class="el-top">${sumChip(uiIcon('gold'),S.gold,'Gold')}${sumChip(uiIcon('crystals'),S.scales||0,'Prisms')}</div>
  <h1 class="el-title">Fashion Elite Sale</h1><p class="el-time">${set.name} · Remaining Time for Direct Purchase: <b>${d}d ${String(h).padStart(2,'0')}h ${String(m).padStart(2,'0')}m</b></p>
  <div class="el-cols n${packs.length}">${packs.map(card).join('')}</div>
  <div class="satchel-nav well-nav el-nav"><button data-back aria-label="Back to city" onclick="go('home')">‹</button>${['Outfit Pack','Weapon Pack','Chat Bubble Pack'].map((t,i)=>`<button ${i===eliteTab?'aria-current="page"':''} onclick="eliteTab=${i};eliteStore()">${denPlain}${t}</button>`).join('')}<button onclick="supremePick='${set.id}';go('citySupreme')">${denPlain}Supreme Set</button></div></section>`;
}
function supremeWearSet(setId){
 const r=WonderGear,set=supSet(setId),has=p=>r.supremeCopies(S,setId,p)>0;let worn=0;
 if(has('outfit')&&ownsOutfit(set.dress)){wearOutfit('reina',set.dress,false);worn++}
 S.atelier??={owned:[]};const legacy=S.reinaFashion??={equipped:0,owned:0};
 if(has('hair')){S.atelier.hair=set.hair;legacy.equipped&=~1;S.reinaLayers={...registeredLook(),hair:fittedHairId(set.hair)};worn++}
 if(has('weapon')){S.atelier.weapon=set.bow;legacy.equipped&=~4;worn++}
 if(has('wings')){legacy.wingSkins=[...new Set([...(legacy.wingSkins||[]),set.wings])];legacy.wingSkin=set.wings;worn++}
 for(const k of ['bubble','frame'])if(has(k)){r.supremeWear(S,k,setId);worn++}
 if(!worn){toast('Get a piece of this set first.');return}
 save();citySupreme();toast(set.name+': '+worn+' piece'+(worn>1?'s':'')+' worn.');
}
function supremeStarsPop(setId){const r=WonderGear,set=supSet(setId),st=r.supremeStars(S,setId);
 popup(`<h2>Activate Stat · ${set.name}</h2><p>The first copy of a piece activates it. Every further copy you buy raises that piece one tier (T1 to T${r.supremeRules.pieceStars}); each tier adds the piece's full stats once more, so 4 copies (T3) give 4 times the stats. Tap a piece in the set room to see the next tier.</p><p class="sup-stars">${'★'.repeat(st)}<span>${'★'.repeat(r.supremeRules.maxStars-st)}</span></p><div class="gld-board">${r.supremePieces.map(p=>`<div><b>${r.supremeCopies(S,setId,p.id)}</b><span>${p.name}</span><em>${r.supremeCopies(S,setId,p.id)>1?'+'+(r.supremeCopies(S,setId,p.id)-1)+'★':''}</em></div>`).join('')}</div>`)}
function supremeFullPop(setId){const r=WonderGear,set=supSet(setId),st=r.supremeStars(S,setId);
 popup(`<h2>Full Set Preview · ${set.name}</h2><div class="sup-full">${r.supremePieces.map(p=>`<div>${supTile(set,p.id)}<div><b>${p.name}</b><ul>${supremeStatLines(r.supremePieceStats(setId,p.id,r.supremePieceStars(S,setId,p.id)))}</ul></div></div>`).join('')}</div><p class="sup-setline"><span>[${r.supremePieceIds.length} Pieces]</span> ${supremeSetBonusText()}</p>`)}
function supremeSetBonusText(){return Object.entries(WonderGear.supremeRules.setBonus).map(([k,n])=>(WonderGear.labels[k]||k)+' +'+n+(WonderGear.percentKeys.has(k)?'%':'')).join(', ')}
// The panel of one piece: its stats now and after the next star, the copies owned, and how to get the next one.
function supremePiecePanel(set,p,st){
 const r=WonderGear,own=r.supremeCopies(S,set.id,p.id),max=st>=r.supremeRules.pieceStars,now=own?r.supremePieceStats(set.id,p.id,st):{},next=r.supremePieceStats(set.id,p.id,own?Math.min(r.supremeRules.pieceStars,st+1):0),onSale=r.supremeSale().set.id===set.id;
 const label=k=>k==='penetration'?'ARP':r.percentKeys.has(k)?'Fashion '+(r.labels[k]||k).replace(' Bonus',''):(r.labels[k]||k),val=(k,x)=>r.percentKeys.has(k)?x+'%':fmt(x);
 const rows=Object.keys(next).map(k=>`<div><span>${label(k)} ${val(k,now[k]||0)}</span>${max?'':`<b class="up">▲ ${val(k,next[k])}</b>`}</div>`).join('');
 const act=!own?'Activate':max?'Max tier':'Tier-up';
 return `<div class="sup-stats piece"><div class="sup-rows">${rows}</div><div class="sup-pside">${supTile(set,p.id,`<em>${own}</em>`)}<button class="den-gold" ${max?'disabled':''} onclick="supremeGet('${set.id}','${p.id}')">${denPlain}${act}</button><button class="sup-more" onclick="supremeInfo('${set.id}','${p.id}')">${denPlain}Details</button></div></div>`;
}
// Activate / Star-up = buy one more copy of this piece in the Elite Sale (only the set on sale can be bought).
function supremeGet(setId,piece){
 const r=WonderGear;if(r.supremeSale().set.id!==setId){toast(supSet(setId).name+' comes back in a later Fashion Elite Sale.');return}
 const got=r.supremeBuy(S,piece);if(!got){toast('Not enough prisms.');return}
 save();if(screen==='citySupreme')citySupreme();else if(typeof reinaAtelier==='function')reinaAtelier();toast(got.first?'Activated!':'Tier-up! T'+r.supremePieceStars(S,setId,piece));
}
function citySupreme(){
 const r=WonderGear,sale=r.supremeSale();if(!supremePick||!supSet(supremePick))supremePick=sale.set.id;
 const set=supSet(supremePick),stars=r.supremeStars(S,set.id),n=r.supremeCount(S,set.id),sel=supremeSel?r.supremePieces.find(p=>p.id===supremeSel):null,selStars=sel?r.supremePieceStars(S,set.id,sel.id):0;
 const total={};for(const p of r.supremePieceIds)if(r.supremeCopies(S,set.id,p))for(const [k,x] of Object.entries(r.supremePieceStats(set.id,p,r.supremePieceStars(S,set.id,p))))total[k]=Math.round(((total[k]||0)+x)*100)/100;
 if(n===r.supremePieceIds.length)for(const [k,x] of Object.entries(r.supremeRules.setBonus))total[k]=(total[k]||0)+x;
 const cp=r.supremePieceIds.reduce((a,p)=>a+(r.supremeCopies(S,set.id,p)?supremeCp(set.id,p):0),0);
 const rows=['defense','penetration','health','attack'].map(k=>`<div><span>${r.labels[k]==='Armor Piercing'?'ARP':r.labels[k]}</span><b>${fmt(total[k]||0)}</b></div>`).join('')+Object.entries(total).filter(([k])=>r.percentKeys.has(k)).map(([k,x])=>`<div><span>Fashion ${(r.labels[k]||k).replace(' Bonus','')}</span><b>${x}%</b></div>`).join('');
 $('#main').innerHTML=`<section class="sup-room" style="--hue:${set.hue};--hue2:${set.hue2}">
  <div class="sup-top"><strong>Supreme Set</strong>${sumChip(uiIcon('gold'),S.gold,'Gold')}${sumChip(uiIcon('crystals'),S.scales||0,'Prisms')}</div>
  ${sel?`<h1>${set.name} (${sel.name})${selStars?' · T'+selStars:''}</h1><p class="sup-stars">${'★'.repeat(selStars)}<span>${'★'.repeat(r.supremeRules.pieceStars-selStars)}</span></p>`:`<h1>${set.name}</h1><p class="sup-stars">${'★'.repeat(stars)}<span>${'★'.repeat(r.supremeRules.maxStars-stars)}</span></p>`}
  <div class="sup-stage"><div class="sup-side">${['outfit','hair','bubble'].map(p=>supTile(set,p)).join('')}</div>
   <div class="sup-center ${sel?'piece p-'+sel.id:''}">${sel?(sel.id==='hair'?`<span class="sup-head big"><img src="${registeredLookPath(set.dress,set.hair,0,'','')}" alt=""></span>`:sel.id==='weapon'?`<img class="sup-bigbow" src="${artPath('weapon-style-'+set.bow)}" alt="">`:sel.id==='bubble'||sel.id==='frame'?`<div class="sup-bigdeco">${supPieceArt(set,sel.id,true)}</div>`:`<img src="${registeredLookPath(set.dress,set.hair,0,sel.id==='wings'?set.wings:'','')}" alt="">`):`<img class="${n?'':'shade'}" src="${registeredLookPath(set.dress,set.hair,set.bow,set.wings,'')}" alt="${set.name}">`}<span class="sup-ribbon">${set.title}</span><b class="sup-cp">⚔ ${fmt(sel?supremeCp(set.id,sel.id):cp)}</b></div>
   <div class="sup-side">${['weapon','wings','frame'].map(p=>supTile(set,p)).join('')}</div>
   <button class="sup-round l" onclick="supremeFullPop('${set.id}')">${denPlain}✦<small>Full Set Preview</small></button><button class="sup-round r" onclick="supremeStarsPop('${set.id}')">${denPlain}✧<small>Activate Stat</small></button></div>
  ${sel?supremePiecePanel(set,sel,selStars):`<div class="sup-stats"><div class="sup-rows">${rows}</div><button class="den-gold sup-wear" onclick="supremeWearSet('${set.id}')">${denPlain}Wear set</button></div>`}
  <div class="sup-sets">${r.supremeSets.map(x=>`<button class="${x.id===set.id?'on':''} ${r.supremeCount(S,x.id)?'':'none'}" style="--hue:${x.hue}" onclick="supremePick='${x.id}';supremeSel=null;citySupreme()">${denPlain}<img src="${artPath('fit-icon-'+x.dress)}" alt=""><b>${x.name}</b><small>${r.supremeCount(S,x.id)}/${r.supremePieceIds.length}${x.id===sale.set.id?' · on sale':''}</small></button>`).join('')}</div>
  <div class="satchel-nav well-nav sup-nav"><button data-back aria-label="Back to Fashion" onclick="go('fashion')">‹</button><button onclick="go('fashion')">${denPlain}Wardrobe</button><button onclick="go('eliteSale')">${denPlain}Elite Sale</button><button aria-current="page">${denPlain}Supreme Set</button></div></section>`;
}

const isleGuilds=['Dawnwing','Moonveil','Embercrest'];
const isleTotems=['Oracle Totem','West Spirit','East Spirit'];
let isleRound=null;
function leaveIsleArena(){
 if(isleRound)clearInterval(isleRound.timer);
 isleRound=null;
}
function startIsleRound(){
 if(screen!=='isleArena')return;
 leaveIsleArena();
 const round={time:90,selected:0,heldBy:-1,held:0,winner:null,targets:[1,2],
  totems:isleTotems.map(()=>({owner:-1,hp:100}))};
 isleRound=round;
 round.timer=setInterval(()=>{if(round===isleRound&&round.winner===null){advanceIsleRound(round);updateIsleArena();round.targets.forEach((target,i)=>showIsleShot(i+1,target));}},1000);
 renderIsleArena();
}
function isleHit(totem,guild,damage){
 if(totem.owner===guild){totem.hp=Math.min(100,totem.hp+damage);return;}
 totem.hp-=damage;
 if(totem.hp<=0){totem.owner=guild;totem.hp=100;}
}
function advanceIsleRound(round){
 // Resolve hits in a rotating order so the same guild does not always hit last.
 for(let turn=0;turn<3;turn++){
  const guild=(round.time+turn)%3;
  if(guild===0)continue;
  const target=round.targets[guild-1];
  isleHit(round.totems[target],guild,14);
 }
 round.time--;
 const owners=round.totems.map(t=>t.owner);
 const holder=owners.every(owner=>owner===owners[0])?owners[0]:-1;
 round.held=holder<0?0:holder===round.heldBy?round.held+1:1;
 round.heldBy=holder;
 if(round.held>=15)round.winner=holder;
 else if(!round.time){
  const majority=isleGuilds.findIndex((_,i)=>owners.filter(owner=>owner===i).length>=2);
  round.winner=majority>=0?majority:owners[0];
 }
 if(round.winner!==null)clearInterval(round.timer);
}
function selectIsleTotem(index){
 if(!isleRound||isleRound.winner!==null)return;
 const r=isleRound,t=r.totems[index];
 r.selected=index;
 const own=t.owner===0,previous=t.hp;
 isleHit(t,0,20);
 const feedback=own?(previous===100?'Fully guarded':'Guard +'+(t.hp-previous)):t.owner===0?'Captured!':'−'+(previous-t.hp)+' HP';
 updateIsleArena();
 showIsleShot(0,index);
 const effect=$('#isle-hit-'+index);
 effect.textContent=feedback;
 effect.getAnimations?.().forEach(animation=>animation.cancel());
 if(!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)effect.animate?.([{opacity:1,transform:'translateY(4px)'},{opacity:1,transform:'translateY(-4px)'},{opacity:0,transform:'translateY(-12px)'}],{duration:780,fill:'forwards'});

}
function showIsleShot(guild,target){
 const field=$('.isle-field'),actor=$('#isle-actor-'+guild),icon=$('#isle-totem-'+target+' img');
 if(!field||!actor||!icon)return;
 const f=field.getBoundingClientRect(),a=actor.getBoundingClientRect(),b=icon.getBoundingClientRect();
 const sprite=actor.querySelector('img');
 const scale=Math.min(a.width/(sprite.naturalWidth||a.width),a.height/(sprite.naturalHeight||a.height));
 const w=sprite.naturalWidth*scale||a.width,h=sprite.naturalHeight*scale||a.height;
 const grip=[[.78,.46],[.80,.14],[.24,.25]][guild];
 const x=a.left+(a.width-w)/2+w*grip[0]-f.left,y=a.top+(a.height-h)/2+h*grip[1]-f.top;
 const dx=b.left+b.width/2-f.left-x,dy=b.top+b.height/2-f.top-y;
 const shot=document.createElement('i');
 shot.className='isle-projectile isle-shot-'+guild;shot.setAttribute('aria-hidden','true');shot.style.setProperty('--aim',Math.atan2(dy,dx)+'rad');shot.style.left=x+'px';shot.style.top=y+'px';
 shot.style.color=['#fff2a1','#b391ff','#ff9467'][guild];
 field.appendChild(shot);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 if(!reduced)(sprite.closest('.dressed-hero')||sprite).animate?.([{translate:'0 0'},{translate:(-Math.cos(Math.atan2(dy,dx))*3)+'px '+(-Math.sin(Math.atan2(dy,dx))*3)+'px'},{translate:'0 0'}],{duration:180});
 if(!reduced)shot.animate([{transform:'translate(0,0)'},{transform:'translate('+dx+'px,'+dy+'px)'}],{duration:300,fill:'forwards'});
 else shot.style.transform='translate('+dx+'px,'+dy+'px)';
 setTimeout(()=>shot.remove(),340);
 icon.animate?.([{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:220,delay:reduced?0:260});
}
function renderIsleArena(){
 const r=isleRound;
 $('#main').innerHTML=`<section class="isle-arena"><div class="isle-heading"><small>Isle Expedition</small><h1>Totem Arena</h1><b id="isle-clock"></b></div><div class="isle-board"><div class="isle-field">${isleTotems.map((name,i)=>`<div class="isle-station"><button class="isle-totem" id="isle-totem-${i}" onclick="selectIsleTotem(${i})" ${r?'':'disabled'}>${artImage('explore-marker-'+[9,4,3][i],'')}<b>${name}</b><span id="isle-owner-${i}">Neutral</span><span class="isle-vital"><progress id="isle-hp-${i}" max="100" value="100" aria-label="${name} health"></progress><strong id="isle-percent-${i}" aria-hidden="true">100%</strong></span><em class="isle-hit" id="isle-hit-${i}"></em></button></div>`).join('')}${r?[reinaLookPath(false),artPath('party-mage-base'),artPath('party-rogue-base')].map((src,i)=>`<div class="isle-fighter" id="isle-actor-${i}">${i?dressedHero(i===1?'mage':'rogue',null,isleGuilds[i]):`<img src="${src}" alt="" draggable="false">`}<b>${i?isleGuilds[i]+' · Bot':'You · Reina'}</b></div>`).join(''):''}</div></div><div class="isle-controls"><strong id="isle-status">You play as Reina · Dawnwing</strong><p id="isle-hint">Hold two totems at the finish. The Oracle breaks a three-way tie. Hold all three for 15 seconds to win early.</p><button class="spirit-gold" hidden id="isle-strike" onclick="selectIsleTotem(isleRound.selected)">Strike</button><button class="spirit-gold" id="isle-start" onclick="startIsleRound()">Enter arena</button><button onclick="go('home')">Return to Menu</button></div></section>`;
 if(r){
  updateIsleArena();
  enableIsleDrag(r);
 }
}
function enableIsleDrag(round){
 const hero=$('#isle-actor-0'),field=hero.parentElement,targets=Array.from(field.querySelectorAll('.isle-totem'));
 let pointer=null;
 function targetAt(e){
  return targets.findIndex(node=>{
   const box=node.getBoundingClientRect();
   return e.clientX>=box.left&&e.clientX<=box.right&&e.clientY>=box.top&&e.clientY<=box.bottom;
  });
 }
 function finish(e){
  if(pointer!==e.pointerId)return;
  pointer=null;
  delete hero.dataset.dragging;
  targets.forEach(node=>node.classList.remove('isle-drop'));
  if(hero.hasPointerCapture(e.pointerId))hero.releasePointerCapture(e.pointerId);
  if(isleRound!==round)return;
  const index=e.type==='pointerup'?targetAt(e):-1;
  if(index>=0&&round.winner===null)selectIsleTotem(index);
  else updateIsleArena();
 }
 hero.onpointerdown=e=>{
  if(pointer!==null||round.winner!==null||e.button!==0)return;
  e.preventDefault();
  pointer=e.pointerId;
  hero.setPointerCapture(pointer);
  hero.dataset.dragging='true';
 };
 hero.onpointermove=e=>{
  if(e.pointerId!==pointer||round.winner!==null)return;
  const box=field.getBoundingClientRect(),clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  hero.style.left=clamp(100*(e.clientX-box.left)/box.width,10,90)+'%';
  hero.style.top=clamp(100*(e.clientY-box.top)/box.height,10,85)+'%';
  const index=targetAt(e);
  targets.forEach((node,i)=>node.classList.toggle('isle-drop',i===index));
 };
 hero.onpointerup=hero.onpointercancel=hero.onlostpointercapture=finish;
}
// Three approaches per totem: Reina in front, rival guilds on opposite flanks.
const isleApproaches=[
 [[50,40],[32,24],[68,24]],
 [[23,87],[9,62],[39,62]],
 [[77,87],[61,62],[91,62]]
];
function updateIsleArena(){
 const r=isleRound,done=r.winner!==null;
 [r.selected,...r.targets].forEach((target,i)=>{
  const actor=$('#isle-actor-'+i);
  if(i===0&&actor.dataset.dragging&&!done)return;
  const [x,y]=isleApproaches[target][i];
  actor.style.left=x+'%';
  actor.style.top=y+'%';
  actor.style.zIndex=String(Math.round(y));
 });
 $('#isle-strike').hidden=done;
 $('#isle-strike').textContent=(r.totems[r.selected].owner===0?'Guard ':'Strike ')+isleTotems[r.selected];
 $('#isle-clock').textContent=Math.floor(r.time/60)+':'+String(r.time%60).padStart(2,'0');
 r.totems.forEach((t,i)=>{
  const button=$('#isle-totem-'+i);button.disabled=done;
  button.setAttribute('aria-pressed',String(!done&&r.selected===i));
  $('#isle-owner-'+i).textContent=t.owner===0?'Yours · Dawnwing':isleGuilds[t.owner]||'Neutral';
  const bar=$('#isle-hp-'+i);
  bar.value=t.hp;
  bar.dataset.health=t.hp<=30?'low':t.hp<=60?'worn':'full';
  $('#isle-percent-'+i).textContent=t.hp+'%';
 });
 $('#isle-status').textContent=done?(r.winner<0?'No victor':isleGuilds[r.winner]+' wins!'):(r.totems[r.selected].owner===0?'Reina guards ':'Reina attacks ')+isleTotems[r.selected];
 $('#isle-hint').textContent=done?'The battle has ended.':r.heldBy>=0?isleGuilds[r.heldBy]+' holds all three: '+r.held+' / 15 s':'Drag Reina onto a totem or tap it to strike or guard.';
 $('#isle-start').hidden=!done;
 if(done)$('#isle-start').textContent='Play again';
}
