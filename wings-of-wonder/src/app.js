'use strict';
const $=s=>document.querySelector(s), fmt=n=>Math.floor(n).toLocaleString('en-US');
const ITEMS=[
{id:'d0',type:'dragon',name:'Willow',title:'GROVE DRAGONLING',color:'#8bc7aa',accent:'#eff2b3',rarity:'Rare',cost:0,power:60,desc:'A curious little guardian of the enchanted grove.'},
{id:'d1',type:'dragon',name:'Emberheart',title:'EMBER DRAKE',color:'#e79272',accent:'#ffe3a0',rarity:'Epic',cost:2200,power:150,desc:'Warm-hearted, fearless, and a little mischievous.'},
{id:'d2',type:'dragon',name:'Moonwhisper',title:'MOON DRAGON',color:'#b8a4e2',accent:'#c9edfa',rarity:'Epic',cost:2800,power:190,desc:'Carries a thousand constellations beneath her wings.'},
{id:'d3',type:'dragon',name:'Aurora',title:'STAR DRAGON',color:'#9ad8df',accent:'#ffe5ba',rarity:'Legendary',cost:5000,power:280,desc:'Her golden antlers catch the first morning light.'},
{id:'w0',type:'wings',name:'Dewlight',title:'GROVE WINGS',color:'#9bcbb9',accent:'#f6edc3',rarity:'Rare',cost:0,power:40,desc:'Soft as a summer breeze. Your first pair of wings.'},
{id:'w1',type:'wings',name:'Roseveil',title:'BLOSSOM WINGS',color:'#e4a7c3',accent:'#fff0d7',rarity:'Epic',cost:1800,power:120,desc:'A cascade of rose petals and golden starlight.'},
{id:'w2',type:'wings',name:'Starweaver',title:'ASTRAL WINGS',color:'#aa9bdd',accent:'#d4efff',rarity:'Epic',cost:2600,power:180,desc:'Woven from moonlight, made for impossible dreams.'},
{id:'w3',type:'wings',name:'Sunfall',title:'SERAPH WINGS',color:'#edcf87',accent:'#fff9df',rarity:'Legendary',cost:4400,power:240,desc:'Six brilliant plumes touched by the morning sun.'}
];
ITEMS.push(...globalThis.WonderGear.familiars);
const GEAR=[{id:'bow',name:'Verdant Bow',stat:'Attack',bonus:24},{id:'crown',name:'Moonstone Crown',stat:'Health',bonus:130},{id:'armor',name:'Grove Robes',stat:'Defense',bonus:18},{id:'boots',name:'Windstep Boots',stat:'Speed',bonus:3},{id:'ring',name:'Dawn Ring',stat:'Critical',bonus:2},{id:'charm',name:'Wish Pendant',stat:'Health',bonus:90}];
const KEY='wow-save-v1';const defaults=()=>({version:1,name:'REINA',gold:3500,tickets:1800,scales:0,xp:0,owned:['d0','w0'],dragon:'d0',wings:'w0',rolls:0,claimed:[],guarantees:0,upgrades:{bow:0,crown:0,armor:0,boots:0,ring:0,charm:0},defenseWins:0,mergeBest:0,dungeonWins:0,sparWins:0,revision:0,updated:0});
function valid(s){return s&&s.version===1&&(s.exploreCleared===undefined||Number.isSafeInteger(s.exploreCleared)&&s.exploreCleared>=0&&s.exploreCleared<=1e12)&&globalThis.WonderGear.validPets(s)&&(s.valeChapter===undefined||Number.isInteger(s.valeChapter)&&s.valeChapter>=0&&s.valeChapter<4)&&['gold','tickets','scales','xp','rolls','guarantees','defenseWins','mergeBest','revision','updated'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]<=(k==='updated'?1e15:1e12))&&['dungeonWins','sparWins'].every(k=>s[k]===undefined||Number.isSafeInteger(s[k])&&s[k]>=0&&s[k]<=1e12)&&globalThis.WonderProgress.validDaily(s.expDungeon)&&globalThis.WonderAdventure.valid(s.adventure)&&MoonwaterFish.valid(s.fishCards)&&globalThis.WonderGear.valid(s.equipment)&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=24&&Array.isArray(s.owned)&&s.owned.length<=ITEMS.length&&new Set(s.owned).size===s.owned.length&&s.owned.includes('d0')&&s.owned.includes('w0')&&s.owned.every(id=>ITEMS.some(i=>i.id===id))&&s.owned.includes(s.dragon)&&s.owned.includes(s.wings)&&ITEMS.find(i=>i.id===s.dragon)?.type==='dragon'&&ITEMS.find(i=>i.id===s.wings)?.type==='wings'&&Array.isArray(s.claimed)&&s.claimed.length<=5&&s.claimed.every(n=>[15,30,60,135,240].includes(n))&&GEAR.every(g=>Number.isInteger(s.upgrades?.[g.id])&&s.upgrades[g.id]>=0&&s.upgrades[g.id]<=20)}
function normalizeAdventure(s){if(/^(reyna|reina)$/i.test(s.name))s.name='REINA';globalThis.WonderGear.repairLoadout(s);return s}
let S=defaults();try{const v=JSON.parse(localStorage.getItem(KEY));if(valid(v))S=normalizeAdventure(v);}catch{}
const INTRO_KEY='wow-intro-style-v1';
function storedIntroStyle(){return '2d'}
let screen=globalThis.location?.search==='?screen=cloudWar'?'cloudWar':globalThis.location?.search==='?screen=games'?'games':storedIntroStyle()==='2d'?'home':'intro',filter='dragon',loop=0,game=null,saveTimer=0,cloudReady=false,cloudBlocked=false,cloudStatus='Connecting…',cloudRevision=0,cloudBusy=false,gamePaused=false;
const item=id=>ITEMS.find(i=>i.id===id),level=()=>globalThis.WonderProgress.level(S.xp),gearLevel=id=>S.upgrades[id]||0;
function stats(){return globalThis.WonderGear.stats(S)}
function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toast.timer);toast.timer=setTimeout(()=>$('#toast').classList.remove('show'),3000)}
function save(){reconcileLeaflightMount();S.updated=Date.now();try{localStorage.setItem(KEY,JSON.stringify(S))}catch{toast('Device storage is unavailable. Export a backup.')}wallet();if(cloudReady&&!cloudBlocked){clearTimeout(saveTimer);saveTimer=setTimeout(syncCloud,900)}}
function wallet(){const compact=n=>n>=1000?new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1}).format(n):fmt(n);for(const [id,value,icon,label] of [['gold',S.gold,'◈','gold'],['tickets',S.tickets,'✧','wishes'],['scales',S.scales,'◇','scales']]){const cell=$('#'+id);cell.innerHTML=uiIcon(id==='gold'?'gold':id==='tickets'?'wishes':'crystals')+compact(value)+' <small>'+label+'</small>';cell.title=fmt(value)+' '+label;cell.setAttribute('aria-label',fmt(value)+' '+label)}}
function gain(g,t,x){const awardedXP=globalThis.WonderProgress.award(S,x,stats().expBonus);S.gold+=g;S.tickets+=t;save();return {gold:g,wishes:t,xp:awardedXP}}
// A small pop-up card in the middle of the screen (Pets room): same dialog, compact look, no Menu button.
function popup(html){modal(html);$('#modal').classList.add('den-pop')}
function modal(html,closeLabel='Close'){const closeButton=$('#modal').querySelector?.(':scope > button');if(closeButton){closeButton.innerHTML=uiIcon('close');closeButton.title=closeLabel;closeButton.setAttribute('aria-label',closeLabel)}$('#modal').classList.remove('gear-modal','den-pop');$('#modalBody').classList.toggle('result-screen',html.includes('class="rewards"')||html.includes('class="exp-victory"'));$('#modalBody').innerHTML=(html.includes('class="rewards"')||html.includes('class="exp-victory"')?'<div class="result-medallion">'+uiIcon('laurel')+'</div>':'')+html;$('#modal').showModal();$('#modal').scrollTop=0;requestAnimationFrame(decorateArt)}
function esc(t){return String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function visualTier(it){return Math.max(0,Math.min(3,Number(it.id.slice(1))||0))}
function tierGlow(it){const tier=visualTier(it);return [' drop-shadow(0 1px 1px #e0f4e766)',` drop-shadow(0 0 3px ${it.color}66)`,` drop-shadow(0 0 7px ${it.color}aa) drop-shadow(0 0 15px ${it.accent}55)`,` drop-shadow(0 0 9px ${it.accent}dd) drop-shadow(0 0 22px ${it.color}aa)`][tier]}
const petShapes={
 d0:{fur:'#b6c596',light:'#fff1cf',ears:'M33 50C12 10 29 0 39 36L45 49 M53 45C52 12 71 0 68 22L64 51',tail:'M65 81Q87 65 84 83Q81 95 68 89'},
 d1:{fur:'#d47643',light:'#fff1cf',ears:'M25 51L20 19L45 39 M55 39L80 19L75 52',tail:'M60 87Q88 88 91 51Q106 87 83 95Q72 100 60 92'},
 d2:{fur:'#8975ab',light:'#eee3ff',ears:'M25 52L21 30L43 41 M55 41L79 30L75 53',tail:'M33 84L44 97L50 92L56 97L68 83'},
 d3:{fur:'#c89770',light:'#ffe6bd',ears:'M35 52Q6 52 12 34Q32 34 42 48 M59 48Q71 32 89 34Q91 51 64 54',tail:'M65 83Q76 66 84 69Q82 84 68 89'}
};
function dragonSVG(it,stars){
 if(it.portrait)return `<img class="pet-portrait" src="${it.portrait}" alt="${it.name}" draggable="false">`;
 // The four first pets have paintings too; the old flat drawing remains only where a star form is asked for.
 if(stars===undefined&&/^d[0-3]$/.test(it.id))return `<img class="pet-portrait" src="${artPath(it.id)}" alt="${it.name}" draggable="false">`;
 stars??=S.emberStars||0;
 const p=petShapes[it.id],owl=it.id==='d2';
 const extraTails=it.id==='d1'&&stars>=5?
  '<g fill="#e57632" stroke="#763a31"><path d="M48 87Q4 92 9 47Q21 67 34 63Q32 76 48 87Z"/>'+
  (stars===6?'<path d="M55 80Q90 63 83 24Q106 43 96 70Q82 85 55 89Z" fill="#ffbc49"/><path d="M16 63Q1 51 7 29Q18 51 29 49Z" fill="#ffd56a"/>':'')+'</g>':'';
 const antlers=it.id==='d3'?'<path d="M40 43L33 26L29 10M34 28L22 21 M60 43L67 26L71 10M66 28L78 21" fill="none" stroke="#d8ad61" stroke-width="4"/>':'';
 return `<svg class="pet-portrait" viewBox="0 0 104 104" role="img" aria-label="${it.name}, ${it.title}"><g stroke="#594636" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="${p.fur}">${extraTails}${antlers}<path d="${p.tail}"/><ellipse cx="51" cy="78" rx="24" ry="20"/><ellipse cx="50" cy="80" rx="13" ry="15" fill="${p.light}" stroke="none"/><path d="${p.ears}"/><path d="M23 58Q23 34 49 35Q77 33 78 58Q79 76 52 80Q25 77 23 58Z"/><g fill="${p.light}" stroke="none"><ellipse cx="39" cy="59" rx="${owl?13:8}" ry="9"/><ellipse cx="61" cy="59" rx="${owl?13:8}" ry="9"/></g><g fill="#322c30"><ellipse cx="40" cy="58" rx="3.5" ry="5"/><ellipse cx="60" cy="58" rx="3.5" ry="5"/></g><g fill="white" stroke="none"><circle cx="39" cy="56" r="1.4"/><circle cx="59" cy="56" r="1.4"/></g><path d="M46 65Q50 62 54 65L50 70Z" fill="${owl?'#efb052':'#694844'}"/><ellipse cx="36" cy="94" rx="9" ry="4"/><ellipse cx="64" cy="94" rx="9" ry="4"/></g></svg>`;
}
function upgradePet(id){
 if(!WonderGear.trainPet(S,id))return;
 save();collection();toast(item(id).name+' · Lv. '+WonderGear.petLevel(S,id));
}

function wingArt(it){return `<span class="wing-sprite raised-wing-pair wing-${it.id} tier-${visualTier(it)}" role="img" aria-label="${it.name} wings" style="--visual-tier:${visualTier(it)};--wing-art:url('${artPath(it.id)}');filter:${tierGlow(it).trim()||'none'}"><span class="raised-half raised-left"></span><span class="raised-half raised-right"></span></span>`}


function art(it){return it.type==='dragon'?dragonSVG(it):wingArt(it)}
const sectionPages={
home:[['home','City'],['profile','Profile'],['attributes','Attributes'],['fashion','Fashion']],
bag:[['bag','Loadout'],['inventory','Bag'],['forge','Crafting'],['warehouse','Warehouse']],
dungeons:[['dungeons','Bosses'],['expLobby','EXP Dungeon']],
games:[['games','Festival'],['fishing','Fishing'],['defense','Castle Defense'],['merge','Dragon Merge'],['vale','Crownfall Vale'],['jungle','Jungle Trek'],['pairs','Harvest Pairs']],
collection:[['collection','Pets'],['wings','Wings'],['wish','Wishes']],
cards:[['cards','Fish Journal']],
more:[['more','Menu'],['world','Realm'],['rankings','Rankings'],['quests','Quests'],['settings','Journal']]
};
function nav(){
if(screen==='fashion'){
 $('#nav').innerHTML=['Dresses','Hair','Weapons','Wings','Mounts'].map(name=>`<button aria-pressed="${fashionCategory===name}" onclick="changeFashionTab('${name}')">${name}</button>`).join('');
 return;
}
const selected=screen==='collection'&&filter==='wings'?'wings':screen;
const active=Object.keys(sectionPages).find(section=>sectionPages[section].some(([id])=>id===selected))||'dungeons';
const tabs=sectionPages[active].map(([id,label])=>`<button aria-current="${selected===id?'page':'false'}" onclick="chooseSectionPage('${id}')">${label}</button>`).join('');
$('#nav').innerHTML='<div class="section-tabs" aria-label="Section pages">'+tabs+'</div>'+[['home','♧','Hero'],['bag','▣','Gear'],['dungeons','⚔','Dungeons'],['games','♜','Games'],['collection','◇','Wonders'],['cards','▤','Cards'],['more','☰','More']].map(([id,icon,label])=>`<button class="${active===id?'active':''}" onclick="go('${id}')"><span class="navico">${uiIcon(({home:'hero',bag:'equipment',dungeons:'dungeons',games:'castle',collection:'dragon',cards:'quests',more:'more'})[id])}</span><span class="nav-label">${label}</span></button>`).join('')}

function intro(){chooseIntro('2d')}


function chooseIntro(){try{localStorage.setItem(INTRO_KEY,'2d')}catch{}openScreen('home')}
function chooseSectionPage(id){
 if(id==='wings'||id==='collection'){filter=id==='wings'?'wings':'dragon';go('collection');return}
 go(id);
}
function moreMenu(){$('#main').innerHTML=`<div class="game-section-title">${uiIcon('more')}<h1>Sky Garden</h1></div><div class="royal-launcher">${[['rankings','scene-ranking','Rankings','ranking'],['quests','scene-quests','Quests','quests'],['world','scene-realm','Realm','party'],['wish','scene-wishes','Wishes','wishes'],['settings','scene-settings','Journal','settings']].map(([id,scene,label,icon])=>`<button class="launcher-tile" aria-label="${label}" onclick="go('${id}')">${artImage(scene,label)}<span class="launcher-shade"></span><span class="launcher-icon">${uiIcon(icon)}</span><strong>${label}</strong></button>`).join('')}</div>`;}

function stopGame(){$('#game')?._resize?.disconnect();delete document.body.dataset.playing;window.Wonder3D?.dispose();window.WonderEffects?.clear();clearInterval(worldTimer);clearInterval(rankingTimer);cancelAnimationFrame(loop);loop=0;if(game){game.running=false;game=null}gamePaused=false}
function go(id){if(screen==='home'&&id!=='home'&&$('#city-drawer')?.hidden)returnToDrawer=false;if(game?.running&&!game.ended){modal(`<p class="eyebrow">ADVENTURE IN PROGRESS</p><h2>Leave this adventure?</h2><p>This run will end without a reward. Your collection and progress are safe.</p><button onclick="$('#modal').close();openScreen('${id}')">Leave adventure</button>`,'Stay');return}openScreen(id)}
let selectedFishCard='';
window.WonderFishAlbum={
 read:()=>S.fishCards||MoonwaterFish.deviceRecords(),
 catch(id,kg){
  S.fishCards??=MoonwaterFish.deviceRecords();
  const old=MoonwaterFish.recordCatch(S.fishCards,id,kg);
  save();
  return old;
 },
 open(id){
  selectedFishCard=MoonwaterFish.byId.has(id)?id:'';
  go('cards');
 }
};
function showFishJournal(){
 const query=selectedFishCard?'?fish='+encodeURIComponent(selectedFishCard):'';
 selectedFishCard='';
 $('#main').innerHTML='<iframe class="album-frame" title="Fish Journal" src="fish-journal.html'+query+'"></iframe>';
}
function openScreen(id){if(screen==='isleArena')leaveIsleArena();if(screen==='cityExplore')leaveExploreFight();if(id==='eliteSale'){eliteTab=0;eliteHero='reina';}if(id==='cityHunting'){huntMode=0;huntFloor=WonderGear.unlockedTier(S);huntSlot=0;}if(id==='cityBounty'){bountyPage=0;bountyRank=0;}if(id==='cityGameplay'){playSection=0;playMaterial=0;playTier=3;}if(id==='cityDaily')dailyPage=0;if(id==='cityForge'){smithPage='Forge';smithMode='Identify';smithUid=null;}if(id==='citySkin'){skinTab=0;skinMode='Upgrade';skinVariant=0;skinHidden=false;}if(id==='cityCompanion'){companionKey='elf';companionMode='Upgrade';}if(id==='cityPet'){petPage='Formation';petFocus=S.dragon;petBack=petBackNext;petBackNext='';}const restoreDrawer=id==='home'&&returnToDrawer;if(id==='home'){cityExpanded=true;returnToDrawer=false;}if(id==='fashion'){stylePick=null;clothingPreview=undefined;reinaPreview=S.reinaFashion?.equipped || 0;wingPreview=S.reinaFashion?.wingSkin||'';fashionCategory='Dresses';}stopGame();screen=id;nav();render();if(restoreDrawer)toggleCityDrawer();$('#main').scrollTop=0;$('#main').scrollLeft=0;window.WonderEffects?.enter?.()}
function render(){document.body.classList.remove('is-3d');document.body.dataset.screen=screen;wallet();nav();if(screen==='isleArena')renderIsleArena();else if(screen==='eliteSale')eliteStore();else if(screen==='cloudWar')cityCloudWar();else if(screen==='cityExplore')cityExplore();else if(screen==='cityHunting')cityHunting();else if(screen==='cityBounty')cityBounty();else if(screen==='cityGameplay')cityGameplay();else if(screen==='cityDaily')cityDaily();else if(screen==='cityForge')cityForge();else if(screen==='citySkin')citySkin();else if(screen==='cityCompanion')cityCompanion();else if(screen==='cityPet')cityPet();else if(screen==='cityCraft')cityCraft();else if(screen==='cityBag')cityBag();else if(screen==='cityVault')cityVault();else if(screen==='cityDevour')cityDevour();else if(screen==='character')reinaCharacter();else if(screen==='fashion')reinaAtelier();else if(screen==='attributes')characterSheet();else if(['inventory','forge','warehouse'].includes(screen))gearWorkspace();else if(screen==='profile')heroProfile();else if(screen==='home')home();else if(screen==='intro')intro();else if(screen==='more')moreMenu();else if(screen==='bag')bag();else if(screen==='collection')collection();else if(screen==='wish')wish();else if(screen==='games')games();else if(screen==='cards')showFishJournal();else if(screen==='fishing')$('#main').innerHTML=`<iframe title="Moonwater Fishing" src="fishing.html" style="display:block;width:100%;height:100%;min-height:290px;border:0;border-radius:12px"></iframe>`;else if(screen==='world')realm();else if(screen==='rankings')rankings();else if(screen==='quests')questBoard();else if(screen==='expLobby')expLobby();else if(screen==='dungeons')dungeonLobby();else if(screen==='settings')settings();else if(screen==='defense')startDefense();else if(screen==='merge')startMerge();else if(screen==='jungle')showJungle();else if(screen==='pairs')showPairs();else if(screen==='vale')startVale();requestAnimationFrame(decorateArt)}
function renderHeroReadout(st){$('#profileReadout').innerHTML=`<div class="profile-face"><img src="assets/generated/reina-avatar.webp" alt="Reina"><b>Lv. ${level()}</b></div><div class="profile-vitals"><strong aria-label="Combat power ${fmt(st.power)}">${uiIcon('power')}<small>Power</small>${fmt(st.power)}</strong><span class="profile-hp">HP ${fmt(st.health)}</span></div>`;}
// Every mount shares one rider pose and saddle, so each dress and hairstyle fits all of them.
// `base` is the mount under the bald rider (scripts/build-mounted.py); the Silver Tabby is free.
const mounts = [
  {id:'silver-tabby', name:'Silver Tabby', rarity:'Common', icon:'mount-icon-silver-tabby', rider:'reina-silver-tabby', base:'fit-control-mount-base', cost:0},
  ...[["moon-unicorn", "Moonlight Unicorn"], ["emerald-stag", "Emerald Stag"], ["ember-fox", "Ember Fox"], ["azure-drake", "Azure Drake"], ["golden-gryphon", "Golden Gryphon"], ["frost-wolf", "Frost Wolf"], ["rose-pegasus", "Rose Pegasus"], ["star-kirin", "Starlight Kirin"], ["amethyst-panther", "Amethyst Panther"], ["sunfire-lion", "Sunfire Lion"], ["cloud-ram", "Cloud Ram"], ["tide-turtle", "Tide Turtle"], ["thunder-tiger", "Thunder Tiger"], ["snow-owl", "Snowfeather Owl"], ["rainbow-phoenix", "Rainbow Phoenix"], ["midnight-steed", "Midnight Steed"], ["honey-bear", "Honey Bear"], ["lotus-koi", "Lotus Koi"], ["moon-rabbit", "Moon Rabbit"], ["bamboo-panda", "Bamboo Panda"]].map(([id,name])=>({id,name,rarity:'Rare',icon:'mount-icon-'+id,base:'fit-control-ride-'+id,cost:1500}))
];
function ownsMount(id){return id==='silver-tabby'||Boolean(S.mountsOwned?.includes(id));}
function currentMount(){
  reconcileLeaflightMount();
  const id = S.mountId === undefined && S.ridingSilverTabby ? 'silver-tabby' : S.mountId;
  return mounts.find(mount => mount.id === id);
}
// Every dress and hairstyle has its own layer for the riding pose, so any look can ride.
function leaflightMountCompatible(){return true;}
function reconcileLeaflightMount(){
 if(!leaflightMountCompatible()&&(S.mountId||S.ridingSilverTabby)){
  S.mountId='';delete S.ridingSilverTabby;return true;
 }
 return false;
}
// The mount Reina last chose in Fashion; riding and dismounting keep that choice.
function chosenMount(){return mounts.find(m=>m.id===S.mountPick&&ownsMount(m.id))||mounts[0];}
function toggleMount(){
  if(!leaflightMountCompatible()){toast('This combination is shown standing. The complete Leaflight set supports riding.');return;}
  S.mountId = currentMount() ? '' : chosenMount().id;
  delete S.ridingSilverTabby;
  save();
  if(screen==='profile')heroProfile();else home();
  document.querySelector('.mount-toggle')?.focus?.({preventScroll:true});
}
const partyWardrobe = {
  paladin:{label:'Paladin', outfit:'Roseguard', id:'roseguard', gold:1200},
  mage:{label:'Storm mage', outfit:'Starfall', id:'starfall', gold:1200},
  healer:{label:'Priestess', outfit:'Lilyveil', id:'lilyveil', gold:1200},
  rogue:{label:'Rogue', outfit:'Emberleaf', id:'emberleaf', gold:1200}
};
const outfitCatalog=Object.fromEntries(Object.values(partyWardrobe).map(item=>[item.id,item]));
outfitCatalog.moonblossom={id:'moonblossom',outfit:'Moonblossom',gold:1200};
const reinaDresses = [
  ['dawnpetal','Sky Courier'], ['frostlace','Moonlit Ballerina'],
  ['nightbloom','Garden Apothecary'], ['sunweave','Masquerade Countess'],
  ['tidal','Amber Dancer'], ['emberveil','Northern Wayfarer'],
  ['willow','Iridescent Moth Queen'], ['stardust','Cloudfleet Captain'],
  ['pearl','Cherry Blossom Kimono'], ['sapphire','Clockwork Artisan'],
  // Second collection
  ['aurora','Aurora Sorceress'], ['rosethorn','Rosethorn Duelist'], ['seafoam','Seafoam Siren'], ['ravenwing','Ravenwing Huntress'],
  ['sunflower','Sunflower Shepherdess'], ['frostqueen','Frostqueen Regalia'], ['autumn','Autumn Minstrel'], ['starlit','Starlit Astronomer'],
  ['coral','Coral Corsair'], ['jade','Jade Empress']
].map(([id,outfit])=>({id,outfit,gold:1200,reinaOnly:true}));
for(const dress of reinaDresses)outfitCatalog[dress.id]=dress;
outfitCatalog.leaflight={id:'leaflight',outfit:'Leaflight',gold:0,reinaOnly:true};
let clothingPreview;
function currentDress(){
  return (S.reinaFashion?.equipped & 2) ? (S.costumes?.equipped?.reina || 'moonblossom') : '';
}
function fashionCard(name,icon,selected,click){
  return `<button class="fashion-card" aria-pressed="${selected}" onclick="${click}"><img src="${icon}" alt=""><span>${name}</span></button>`;
}
function fashionShowcase({portrait,alt,title,bonus,owned,price,equipped,action,cards,extra='',stage=''}){
  const category=fashionCategory;
  const tabs=['Dresses','Hair','Weapons','Wings','Mounts'].map(tab=>`<button aria-pressed="${tab===category}" onclick="changeFashionTab('${tab}')">${tab}</button>`).join('');
  const current=stats();
  const active={Dresses:Boolean(currentDress()), Hair:Boolean(wornStyle(styleSets.Hair)), Weapons:Boolean(wornStyle(styleSets.Weapons)),Wings:Boolean(S.reinaFashion?.wingSkin),Mounts:false};
  const [key,amount]={Dresses:['defense',WonderGear.fashionTraits.clothing],Hair:['health',WonderGear.fashionTraits.hair],Weapons:['attack',WonderGear.fashionTraits.weapon],Wings:['shieldHealth',WonderGear.fashionTraits.wings]}[category]||['',0];
  const delta=(Number(Boolean(bonus))-Number(active[category]))*amount;
  const fields=[['attack','ATK'],['health','HP'],['defense','DEF']];
  if(category==='Wings')fields.push(['shieldHealth','Shield HP']);
  const rows=fields.map(([stat,label])=>{
    const change=stat===key?delta:0;
    return `<div><span>${label}</span><b>${fmt(current[stat])}</b><em>${change>0?'+'+change:change||''}</em></div>`;
  }).join('');
  return `<section class="fashion-showcase" data-category="${category}">
    ${stage||`<div class="fashion-stage"><div class="fashion-model"><img src="${portrait}" alt="${alt}"></div><span class="fashion-power">${uiIcon('power')} ${fmt(current.power)}</span></div>`}
    <div class="fashion-detail"><div class="fashion-values">${rows}</div><div class="fashion-selection"><h2>${title}</h2><small>${bonus?bonus+' · ':''}${owned?'Owned':fmt(price)+' gold'}</small><button class="primary" ${equipped||(!owned&&S.gold<price)?'disabled':''} onclick="${action}">${equipped?'Equipped':owned?'Equip':'Buy &amp; equip'}</button></div></div>
    ${screen==='fashion'?'<button class="leaflight-set" onclick="wearLeaflightSet()">Wear Leaflight set</button>':''}<div class="fashion-picker">${screen==='fashion'?`<div class="fashion-tabs" role="group" aria-label="Fashion categories">${tabs}</div>`:''}<div class="fashion-cards">${cards}</div></div>${extra}</section>`;
}
function fittingRoom(){return registeredFashionRoom();}
const outfitColors={roseguard:320,starfall:195,lilyveil:65,emberleaf:345,moonblossom:235};
function ownsOutfit(id){
  return !id || Boolean(S.costumes?.owned?.includes(id)) || (id==='moonblossom' && Boolean(S.reinaFashion?.owned & 2));
}
function dressedHero(hero,outfit,label){
  const look=outfitCatalog[outfit], native=partyWardrobe[hero];
  if(hero==='reina')return '<span class="dressed-hero"><img src="'+reinaLookPath(false,look?2:0,look?.id||'')+'" alt="'+label+'"></span>';
  const tint=look && look.id!==native.id?' style="filter:grayscale(1) sepia(.85) saturate(2.4) hue-rotate('+outfitColors[outfit]+'deg)"':'';
  return '<span class="dressed-hero" role="img" aria-label="'+label+'"><img src="'+artPath('party-'+hero+'-base')+'" alt=""><img src="'+artPath('party-'+hero+'-wear-'+(look?native.id:'classic'))+'" alt=""'+tint+'></span>';
}
function wardrobe(hero,outfit=S.costumes?.equipped?.[hero] || (hero==='reina' && (S.reinaFashion?.equipped & 2)?'moonblossom':'')){
  const label=hero==='reina'?'Reina':partyWardrobe[hero].label, item=outfitCatalog[outfit];
  const current=S.costumes?.equipped?.[hero] || (hero==='reina' && (S.reinaFashion?.equipped & 2)?'moonblossom':'');
  const choices=[{id:'',outfit:'Classic'},...Object.values(outfitCatalog).filter(o=>!o.reinaOnly||o.id===outfit)];
  const action=current===outfit?'Equipped':ownsOutfit(outfit)?'Equip':'Buy & equip · '+fmt(item.gold)+' gold';
  modal(`<div class="outfit-room"><h2>${label} · Wardrobe</h2>${dressedHero(hero,outfit,label)}${hero==='reina'&&outfit?'<small>+'+WonderGear.fashionTraits.clothing+' Defense</small>':''}<div class="outfit-options">${choices.map(o=>`<button aria-pressed="${o.id===outfit}" onclick="wardrobe('${hero}','${o.id}')">${o.outfit}</button>`).join('')}</div><button class="primary" ${current===outfit||(!ownsOutfit(outfit)&&S.gold<item.gold)?'disabled':''} onclick="wearOutfit('${hero}','${outfit}')">${action}</button></div>`);
}
function wearOutfit(hero,outfit,showWardrobe=true){
  if(outfitCatalog[outfit]?.reinaOnly&&hero!=='reina')return;
  if((hero!=='reina'&&!partyWardrobe[hero])||(outfit&&!outfitCatalog[outfit]))return;
  const closet=S.costumes??={};closet.owned??=[];closet.equipped??={};
  if(!ownsOutfit(outfit)){
    const price=outfitCatalog[outfit].gold;
    if(S.gold<price)return;
    S.gold-=price;closet.owned.push(outfit);
  }
  closet.equipped[hero]=outfit;
  if(hero==='reina'){
    const pieces=S.reinaFashion??={owned:0,equipped:0};
    pieces.equipped=outfit?pieces.equipped|2:pieces.equipped&~2;
    if(outfit==='moonblossom')pieces.owned|=2;
    S.reinaLayers={...registeredLook(),dress:fittedDressId(outfit)};
  }
  if(hero==='reina'&&screen==='fashion')reinaPreview=S.reinaFashion.equipped;
  if(hero==='reina')clothingPreview=outfit;
  save();render();if(showWardrobe)wardrobe(hero,outfit);
}
const reinaPieces = [
  {bit:1, slot:'Hair', classic:'Silver waves', name:'Lilac waves', price:400},
  {bit:2, slot:'Dress &amp; boots', classic:'Grove silk set', name:'Violet silk set', price:1200},
  {bit:4, slot:'Weapon', classic:'Golden bough', name:'Frostglass bow', price:800}
];
let reinaPreview=0,wingPreview='',fashionCategory='Dresses';
const fashionWingNames=['Verdant Veins','Amber Monarch','Swanlight','Scarlet Phoenix','Glacier Shards','Violet Nocturne','Opal Skimmer','Clockwork Halo','Cherry Petals','Midnight Moth',
  'Aurora Veil','Rose Thorn','Seashell Pearl','Raven Night','Sunflower Gold','Frost Crystal','Autumn Maple','Starmap','Coral Reef','Jade Phoenix'];
const fashionWings=fashionWingNames.map((name,i)=>({name,id:'fashion-wing-'+(i+1),cost:1000}));

const wingLights=['#7ad996','#ffb34e','#cce9ff','#ff7039','#87d9ff','#bf7df1','#7be8e0','#e9b35e','#ff9ec2','#a89bff','#6fe3c4','#e0455f','#9fe6e0','#7f8fc9','#ffd24a','#bfe8ff','#ff8a3c','#8fa0ff','#ff8f7a','#58d6a0'];
function wingFittingRoom(){
  const worn=S.reinaFashion?.wingSkin||'';
  const choices=[{id:'',name:'Original'},...fashionWings];
  if(worn&&!choices.some(it=>it.id===worn))choices.push(fashionWing(worn));
  const selected=choices.find(it=>it.id===wingPreview)||choices[0];
  const cards=choices.map(it=>fashionCard(it.name,artPath(fashionWing(it.id).id),selected.id===it.id,`previewRegisteredEquipment('Wings','${it.id}')`)).join('');
  const price=wingSkinPrice(selected.id);
  const portrait=registeredLookPath(undefined,undefined,S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13),fashionWing(selected.id).id);
  const accent=wingLights[fashionWings.indexOf(selected)]||'#c7b5ff';
  const stage=`<div class="fashion-stage wing-gallery" style="--wing-light:${accent}">
    <h2>${selected.name}</h2>
    <div class="fashion-model"><img src="${portrait}" alt="Reina wearing ${selected.name}"></div>
  </div>`;
  return fashionShowcase({portrait,alt:'Reina',title:selected.name,bonus:selected.id?'+'+WonderGear.fashionTraits.wings+' Shield HP':'',owned:price===0,price,equipped:selected.id===worn,action:'wearFashionWings()',stage,cards,extra:screen==='citySkin'?`<button class="shared-fashion" onclick="switchSkin(0,'Upgrade',0)">Back to Wings</button>`:'' });
}
// Mounts tab: Reina in her current look on the chosen mount.
let mountPreview='';
function mountFittingRoom(){
  const selected=mounts.find(m=>m.id===mountPreview)||chosenMount(),riding=currentMount()?.id===selected.id,owned=ownsMount(selected.id);
  const cards=mounts.map(m=>fashionCard(m.name,artPath(m.icon),m.id===selected.id,`mountPreview='${m.id}';reinaAtelier()`)).join('');
  const portrait=mountedLookPath(selected.id);
  const stage=`<div class="fashion-stage mount-gallery"><h2>${selected.name}</h2><div class="fashion-model"><img src="${portrait}" alt="Reina riding ${selected.name}"></div></div>`;
  return fashionShowcase({portrait,alt:'Reina',title:selected.name,bonus:'',owned,price:selected.cost,equipped:riding,action:'rideFashionMount()',stage,cards});
}
function rideFashionMount(){
  if(screen!=='fashion'||fashionCategory!=='Mounts')return;
  const mount=mounts.find(m=>m.id===mountPreview);if(!mount)return;
  if(!ownsMount(mount.id)){if(S.gold<mount.cost){toast('Not enough gold');return}S.gold-=mount.cost;S.mountsOwned=[...new Set([...(S.mountsOwned||[]),mount.id])];}
  S.mountPick=mount.id;S.mountId=mount.id;delete S.ridingSilverTabby;
  save();reinaAtelier();toast('Riding '+mount.name);
}
function wearFashionWings(){
  if((screen!=='fashion'&&!(screen==='citySkin'&&skinMode==='Appearance'))||fashionCategory!=='Wings')return;
  const price=wingSkinPrice(wingPreview);
  if(S.gold<price)return;
  const state=S.reinaFashion??={owned:0,equipped:0};
  S.gold-=price;
  if(wingPreview)state.wingSkins=[...new Set([...(state.wingSkins||[]),wingPreview])];
  state.wingSkin=wingPreview;
  save();reinaAtelier();
}
function fashionWing(id=S.reinaFashion?.wingSkin){
  const cosmetic=fashionWings.find(it=>it.id===id);if(cosmetic)return cosmetic;
  return ITEMS.find(it=>it.type==='wings'&&it.id===id)||item(S.wings);
}
const fabricStyles={
  dawnpetal:['e85e88','ffe4b9',(u,v)=>(Math.cos(u/8)*Math.cos(v/8))**4],
  frostlace:['69bdde','eefaff',(u,v)=>Math.cos(u/6)+Math.cos(v/6)>1.38],
  nightbloom:['35385c','d39ce3',(u,v)=>Math.abs(Math.sin(u/13)*Math.cos(v/9))**6],
  sunweave:['dc971d','fff3ac',u=>Math.cos(u/5)>.89],
  tidal:['208792','90eddf',(u,v)=>(.5+.5*Math.sin(v/8+2*Math.sin(u/17)))**9],
  emberveil:['aa3636','ffab68',(u,v)=>Math.cos(v/7+Math.abs(u%42-21)/5)>.72],
  willow:['578551','d9dc9b',(u,v)=>Math.max(0,Math.sin(u/9+Math.cos(v/14))*Math.cos(v/9))**3],
  stardust:['6439a6','ecdbff',(u,v)=>Math.cos(u/4)*Math.cos(v/7)>.81],
  pearl:['e6d8c0','be9299',(u,v)=>Math.cos(u/11)+Math.cos(v/11)<-1.65],
  sapphire:['23549b','dec77b',(u,v)=>Math.cos(u/7)+Math.cos(v/7)>1.15]
};
// Each panel is cut relative to the waist. The mounted pose drapes the skirt backwards.
const dressCuts = {
  dawnpetal:[
    'M-19 0 Q-35 23 -71 58 Q-99 85 -102 115 Q-80 133 -52 120 Q-28 145 1 128 Q25 143 49 123 Q73 128 83 111 Q66 60 20 0Z',
    'M-18 0 Q-51 39 -77 69 Q-63 89 -40 82 Q-23 99 -1 84 Q19 99 39 82 Q55 88 68 72 Q48 37 17 0Z',
    'M-18 0 Q-34 25 -50 42 Q-37 58 -20 48 Q-7 65 7 49 Q26 60 37 47 Q48 50 49 39 L17 0Z'],
  frostlace:[
    'M-40 -73 Q-26 -85 -9 -74 L8 -68 Q23 -68 31 -52 L45 -20 L25 -25 L19 16 L4 3 L-11 28 L-18 7 L-41 22 L-37 2 L-69 12 Q-53 -28 -40 -73Z',
    'M-29 -74 Q-12 -51 25 -50 L32 -39 Q-6 -41 -42 -61Z'],
  nightbloom:[
    'M-39 -72 Q-53 -50 -55 -7 Q-59 61 -104 153 Q-78 166 -47 148 L-57 183 Q-17 163 2 120 L12 64 L-12 -57Z',
    'M-36 -73 Q-14 -74 4 -61 Q4 -12 29 18 L9 44 Q-5 12 -16 -18 L-26 18 L-47 30 Q-36 -15 -36 -73Z'],
  sunweave:[
    'M-20 -2 L20 -2 L62 63 Q51 74 33 69 Q18 80 2 73 Q-16 80 -31 71 Q-49 76 -67 66Z',
    'M-18 -1 L-12 1 L-39 69 L-53 69Z M-3 1 L2 1 L-6 74 L-18 73Z M11 1 L16 1 L41 69 L29 70Z'],
  tidal:[
    'M-18 -1 L19 -1 Q33 30 34 74 Q36 119 58 149 Q27 172 -10 160 Q-46 171 -76 146 Q-42 112 -34 67 Q-29 28 -18 -1Z',
    'M-17 1 Q12 22 32 65 Q12 49 -19 48 Q-42 46 -52 65 Q-42 20 -17 1Z',
    'M-37 -73 Q-16 -86 7 -65 Q18 -59 26 -46 Q3 -53 -6 -49 Q-30 -51 -47 -60Z'],
  emberveil:[
    'M-36 -72 L-18 -74 L-9 -52 L8 -66 L18 -61 L22 -26 L12 -6 L38 47 L15 36 L4 11 L-10 19 L-30 55 L-61 70 L-31 0 L-42 -26Z',
    'M-33 -70 L-19 -73 L-6 -45 L-16 -49 L-12 -32Z M10 -64 L17 -60 L9 -43 L0 -36Z'],
  willow:[
    'M-38 -72 Q-28 -80 -12 -71 Q-16 -53 7 -59 L22 -48 Q12 -19 16 -5 L43 45 L15 40 L4 56 L-14 45 L-38 59 L-39 42 L-61 47 Q-43 23 -27 -6 L-37 -34Z',
    'M-36 -70 Q-25 -57 -19 -49 Q-29 -38 -41 -36 Q-42 -49 -53 -48 Q-52 -58 -36 -70Z'],
  stardust:[
    'M-37 -72 Q-19 -84 -8 -67 Q-33 -37 -21 -7 L-6 11 Q-14 61 -3 112 L-15 168 Q-48 190 -97 175 Q-63 131 -54 78 Q-48 40 -44 -12Z',
    'M8 -65 L21 -55 Q23 -28 16 -3 Q27 57 52 112 L66 159 Q51 175 30 175 Q20 118 4 79 L-7 7 Q8 -26 8 -65Z',
    'M-38 -71 L-26 -77 Q-24 -48 -9 -31 L-17 -17 Q-37 -38 -38 -71Z'],
  pearl:[
    'M-19 0 L19 0 Q57 31 80 86 Q102 114 104 143 Q74 170 45 159 Q15 178 -14 161 Q-56 176 -87 153 Q-103 160 -114 143 Q-86 69 -56 42Z',
    'M-18 0 L18 0 Q46 34 69 65 Q44 76 22 63 Q0 81 -25 64 Q-53 77 -74 66 Q-53 27 -18 0Z',
    'M-38 -69 Q-25 -84 -12 -68 L-18 -54 Q-35 -48 -47 -55Z'],
  sapphire:[
    'M-36 -73 L-14 -73 L0 -54 L12 -63 L24 -49 L14 -7 L47 28 L28 39 L13 21 L4 9 L-9 17 Q-28 43 -64 61 L-51 31 L-32 0 L-39 -35Z',
    'M-31 -71 L-17 -73 L-3 -50 L-11 -47Z M-23 -18 L17 -23 L16 -16 L-25 -10Z M-27 -6 L16 -11 L17 -5 L-29 2Z']
};
function tailoredPanels(ctx,id,pose){
  const [fabric,edge]=fabricStyles[id];
  ctx.save();
  if(pose==='stand')ctx.transform(2,0,0,2,270,312);
  else ctx.transform(1.46,0,-.47,1.34,401,224);
  ctx.lineJoin='round';
  dressCuts[id].forEach((outline,index)=>{
    const path=new Path2D(outline);
    const silk=ctx.createLinearGradient(-85,-16,69,30);
    silk.addColorStop(0,'#'+edge);silk.addColorStop(.23,'#'+fabric);
    silk.addColorStop(.44,'#'+edge);silk.addColorStop(.54,'#'+fabric);
    silk.addColorStop(.82,'#'+fabric);silk.addColorStop(1,'#'+edge);
    ctx.fillStyle=silk;ctx.fill(path);
    ctx.save();ctx.clip(path);
    const shade=ctx.createLinearGradient(-48,22,54,38);
    shade.addColorStop(0,'#27172e44');shade.addColorStop(.48,'#261b3500');shade.addColorStop(1,'#291b3c55');
    ctx.fillStyle=shade;ctx.fillRect(-120,-85,230,280);
    ctx.lineWidth=1.15;ctx.strokeStyle='#'+edge+'aa';
    for(const end of [-79,-43,-20,16,49,77]){
      ctx.beginPath();ctx.moveTo(end*.15,0);ctx.quadraticCurveTo(end*.6,76,end,173);ctx.stroke();
    }
    ctx.restore();
    ctx.strokeStyle='#493548';ctx.lineWidth=2.1;ctx.stroke(path);
    ctx.strokeStyle='#'+edge;ctx.lineWidth=index===0?1.2:.85;ctx.stroke(path);
  });
  ctx.restore();
}
const dressImages=new Map();
const clothingMasks=new Map();
async function costumePixels(url){
  const sprite=new Image();
  sprite.src=url;
  await sprite.decode();
  const canvas=document.createElement('canvas');
  canvas.width=sprite.naturalWidth;canvas.height=sprite.naturalHeight;
  const ctx=canvas.getContext('2d');
  ctx.drawImage(sprite,0,0);
  return {canvas,ctx,pixels:ctx.getImageData(0,0,canvas.width,canvas.height)};
}
async function clothingMask(pose){
  const [green,violet,parts]=await Promise.all([costumePixels(artPath('look-'+pose+'-1')),costumePixels(artPath('look-'+pose+'-3')),costumePixels(artPath('parts-'+pose))]);
  const a=green.pixels.data,b=violet.pixels.data,mask=new Float32Array(a.length/4);
  for(let i=0;i<a.length;i+=4){
    if(parts.pixels.data[i]===96&&b[i+3]&&b[i+2]>b[i+1]+5){
      const change=Math.max(...[0,1,2].map(c=>Math.abs(a[i+c]-b[i+c])));
      mask[i/4]=Math.min(1,Math.max(0,(change-10)/25));
    }
  }
  return mask;
}
async function makeCostume(url,id,pose){
  if(!clothingMasks.has(pose))clothingMasks.set(pose,clothingMask(pose));
  const [{canvas,ctx,pixels},mask]=await Promise.all([costumePixels(url),clothingMasks.get(pose)]);
  const [cloth,trim,pattern]=fabricStyles[id],rgb=hex=>hex.match(/../g).map(c=>parseInt(c,16));
  const base=rgb(cloth),accent=rgb(trim),data=pixels.data;
  for(let p=0;p<mask.length;p++){
    if(!mask[p])continue;
    const i=p*4,x=p%canvas.width,y=Math.floor(p/canvas.width);
    const light=Math.min(1.8,Math.max(.2,(data[i]+data[i+1]+data[i+2])/345))**.86;
    const t=pattern(x+.26*y,y-.15*x)*.68;
    for(let c=0;c<3;c++)data[i+c]=data[i+c]*(1-mask[p])+((1-t)*base[c]+t*accent[c])*light*mask[p];
  }
  ctx.putImageData(pixels,0,0);
  if(pose==='ride'){
    // The saddle, bent arms and near leg share the mounted silhouette.
    // Confine the tailoring to the rider's visible fabric.
    tailoredPanels(ctx,id,pose);
    const panels=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    for(let p=0;p<mask.length;p++){
      const coverage=mask[p];
      if(!coverage)continue;
      for(let c=0;c<3;c++){
        const i=p*4+c;
        data[i]+=coverage*(panels[i]-data[i]);
      }
    }
    ctx.putImageData(pixels,0,0);
    return URL.createObjectURL(await new Promise(resolve=>canvas.toBlob(resolve,'image/png')));
  }
  // Keep the hand resting on the belt in front of the fitted garment.
  const hand=new Path2D(pose==='stand'
    ? 'M152 277 Q161 266 173 266 Q200 244 227 257 L239 269 L230 283 L211 278 L196 298 L177 315 L158 315 L144 300Z'
    : 'M374 243 Q391 237 405 249 L436 274 L453 282 L449 296 L424 301 L398 289 L367 267Z');
  const original=ctx.getImageData(0,0,canvas.width,canvas.height);
  tailoredPanels(ctx,id,pose);
  const foreground=document.createElement('canvas');
  foreground.width=canvas.width;foreground.height=canvas.height;
  foreground.getContext('2d').putImageData(original,0,0);
  ctx.save();ctx.clip(hand);ctx.drawImage(foreground,0,0);ctx.restore();
  return URL.createObjectURL(await new Promise(resolve=>canvas.toBlob(resolve,'image/png')));
}
document.addEventListener('load',async event=>{
  const img=event.target;
  if(img.tagName!=='IMG')return;
  const src=img.src;
  const plain=img.parentElement?.classList.contains('fashion-model') && !src.includes('#') && /(?:atelier-[a-z]+|look-stand-\d+|ranger-cartoon)\.webp(?:\?|$)/.test(src);
  const match=plain?[null,0,0]:src.match(/(look-(stand|ride)-[2367]\.webp)(?:\?[^#]*)?#dress-([a-z]+)$/);
  if(!match||!fabricStyles[match[3]])return;
  try{
    if(!dressImages.has(src))dressImages.set(src,makeCostume(src.split('#')[0],match[3],match[2]));
    const rendered=await dressImages.get(src);
    if(img.src===src)img.src=rendered;
  }catch{dressImages.delete(src);clothingMasks.delete(match[2]);}
},true);
const styleSets={
  Hair:{slot:'hair',bit:1,price:400,bonus:'+30 HP',classic:'Original hair',legacy:'Lilac waves',names:['Chestnut Pixie','Pearl Braided Bun','Cherry Bob','Copper Curls','Double Moon Buns','Golden Crown Braid','Storm Asymmetrical Bob','Rose Twin Tails','Lagoon Side Braid','Onyx Topknot','Lavender Braid',
    'Moonsilver Cascade','Sunset Ponytail','Midnight Waves','Rosegold Pixie','Emerald Twin Braids','Snowbell Bob','Violet Star Buns','Golden Halo','Crimson Curls','Mint Curls']},
  Weapons:{slot:'weapon',bit:4,price:800,bonus:'+6 Attack',classic:'Original bow',legacy:'Frostglass bow',names:['Rosewood Thorn','Glacier Recurve','Swanfeather','Amber Sunwheel','Indigo Crescent','Ruby Dragon','Tide Serpent','Raven Thorn','Clockwork Compound','Orchid Butterfly','Azure Laurel',null,null,
    'Aurora Arc','Thornrose Longbow','Pearl Tide','Ravenfeather','Sunflower Bough','Frostspire','Maple Whisper','Stargazer','Corsair Coral','Jade Phoenix']}
};
let stylePick=null;
function changeFashionTab(tab){++fashionPreviewRequest;fashionCategory=tab;if(tab==='Wings'){wingPreview=S.reinaFashion?.wingSkin||fashionWings[0].id;}if(tab==='Mounts')mountPreview=currentMount()?.id||chosenMount().id;stylePick=null;clothingPreview=undefined;reinaAtelier()}
function wornStyle(set){
  return S.atelier?.[set.slot] || ((S.reinaFashion?.equipped & set.bit)?-1:0);
}
function styleOwned(set,n){
  if(n===11)return true;
  if(n<=0)return n===0||Boolean((S.reinaFashion?.owned||0)&set.bit);
  return S.atelier?.owned?.includes(set.slot+n)||false;
}
function wearStyle(){
  const set=styleSets[fashionCategory],n=stylePick;
  if((screen!=='fashion'&&!(screen==='citySkin'&&skinMode==='Appearance'))||!set||!Number.isInteger(n)||n< -1||n>set.names.length||(n>0&&!set.names[n-1]))return;
  const wardrobe=S.atelier??={owned:[]};
  if(!styleOwned(set,n)){
    if(S.gold<set.price){toast('Not enough gold');return}
    S.gold-=set.price;
    if(n>0)wardrobe.owned.push(set.slot+n);
  }
  const legacy=S.reinaFashion??={equipped:0,owned:0};
  legacy.equipped=n===-1?legacy.equipped|set.bit:legacy.equipped&~set.bit;
  if(n===-1)legacy.owned|=set.bit;
  wardrobe[set.slot]=Math.max(0,n);
  if(set.slot==='hair')S.reinaLayers={...registeredLook(),hair:fittedHairId(n)};
  reinaPreview=legacy.equipped;
  save();reinaAtelier();
}
function styleFittingRoom(set){
  const worn=wornStyle(set),pick=stylePick??worn;
  const owned=styleOwned(set,pick),equipped=pick===worn;
  const name=n=>n===-1?set.legacy:n===0?set.classic:set.names[n-1];
  const img=n=>set.slot==='hair'?artPath('fit-icon-hair-'+n):n===11?leaflightIcon('bow'):artPath('weapon-style-'+n);
  const legacyIcons=set.slot==='hair'?['silver','lilac']:['gold','frost'];
  const cards=[0,-1,...set.names.map((_,i)=>i+1).filter(n=>set.names[n-1])].map(n=>fashionCard(name(n),n>0?img(n):artPath('atelier-icon-'+legacyIcons[-n]),n===pick,`previewRegisteredEquipment('Weapons',${n})`)).join('');
  const mask=(S.reinaFashion?.equipped||0)&~set.bit;
  const look={...S.atelier,[set.slot]:Math.max(0,pick)};
  const portrait=reinaLookPath(false,pick===-1?mask|set.bit:mask,currentDress(),look);
  return fashionShowcase({portrait,alt:'Reina · '+name(pick),title:name(pick),bonus:pick?set.bonus:'',owned,price:set.price,equipped,action:'wearStyle()',cards,extra:screen==='citySkin'?`<button onclick="switchSkin(skinTab,'Morphing',skinVariant)">Back to Holy Weapon</button>`:''});
}
// A single, uncut head/body sprite owns every anatomical landmark.
// Garments and hair are registered to this 500 x 800 coordinate system.
const fittingTemplate={width:500,height:800,body:{x:0,y:40,width:500,height:750},
  hand:[[199,289],[215,279],[233,279],[245,283],[247,289],[230,289],[244,295],[247,301],[238,302],[246,307],[244,313],[235,313],[244,319],[240,323],[223,317],[211,317],[201,324],[189,318]]};
let fittingControlDress='grove',fittingControlHair=1;
const fittingDresses=[['leaflight','Leaflight'],['grove','Emerald Leaves'],...reinaDresses.map(({id,outfit})=>[id,id==='frostlace'?'Amethyst Lace':outfit])];
const fittingHairs=styleSets.Hair.names.map((name,i)=>[i+1,name]);
// These slots are traced on the SAME 1024 x 1536 master. Never re-fit heads.
// Clip paths are renderer geometry, and the original atlas is retained unchanged.
const leaflightSlots={
 hairBack:'M350 100 L430 140 L444 218 L419 290 L405 358 L401 416 L369 470 L337 509 L305 541 L310 579 L291 613 L286 665 L290 736 L177 742 L171 627 L216 592 L230 549 L264 499 L306 432 L322 365 L337 293 L348 238 L340 182 Z',
 hairFront:'M315 0 H640 V260 H540 L548 231 Q558 234 568 234 Q552 216 565 192 Q579 165 564 137 Q541 124 517 91 Q499 66 478 69 Q455 70 442 94 Q426 119 413 124 L370 106 Q364 109 374 119 L399 143 L404 170 L377 162 L337 134 Z',
 dress:'M351 270 Q369 268 391 287 Q413 323 450 338 Q493 354 542 358 Q577 357 598 338 L592 297 L603 299 Q624 329 625 362 L616 414 L594 476 L612 530 L623 583 Q640 616 647 655 L672 730 L688 798 L703 868 L708 944 L707 1010 L700 1078 L690 1108 L699 1248 L700 1536 H70 V1130 L123 1004 L166 908 L185 836 L215 778 L270 750 L285 700 L310 627 L363 583 L408 542 L435 490 L426 445 L408 412 L395 389 Q397 355 384 318 L369 290 Z',
 bow:'M766 93 H897 V1173 H675 V1058 L694 1035 L733 979 L769 912 L787 848 L788 812 L774 789 L749 771 L757 742 L782 729 L788 589 L778 578 L764 552 L777 515 L801 481 L822 438 L831 387 L830 337 L803 265 L781 215 L763 181 Z',
 grip:'M746 639 Q767 633 784 644 Q798 638 813 647 Q839 655 837 680 Q840 701 820 718 Q800 733 781 721 Q761 712 752 692 Q741 675 746 639 Z'
};
function leaflightIcon(slot){const key=artPath('fit-control-leaflight')+'#leaflight-icon-'+slot;return readyRegisteredLooks.get(key)||key;}
async function renderLeaflightIcon(slot){
 // Icons come from the same per-pixel layers the compositor wears.
 const layer=await styleImage(artPath({hair:'fit-control-hair-11',dress:'fit-control-leaflight',bow:'fit-control-bow-11'}[slot]));
 const c=document.createElement('canvas');c.width=500;c.height=800;const ctx=c.getContext('2d');
 if(slot==='bow'){ctx.save();ctx.translate(0,40);ctx.scale(500/1024,750/1536);ctx.clip(new Path2D(leaflightSlots.bow));ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0,500,800);ctx.restore();}
 else ctx.drawImage(layer,0,0,500,800);
 const box={hair:[80,40,240,365],dress:[30,165,335,620],bow:[325,75,125,550]}[slot];
 const icon=document.createElement('canvas');icon.width=144;icon.height=160;const out=icon.getContext('2d');
 const scale=Math.min(136/box[2],152/box[3]);out.drawImage(c,...box,(144-box[2]*scale)/2,(160-box[3]*scale)/2,box[2]*scale,box[3]*scale);
 return icon.toDataURL('image/png');
}
function wearLeaflightSet(){
 if(screen!=='fashion')return;
 S.reinaLayers={dress:'leaflight',hair:11};
 S.atelier??={owned:[]};S.atelier.owned??=[];
 for(const id of ['hair11','weapon11'])if(!S.atelier.owned.includes(id))S.atelier.owned.push(id);
 S.atelier.hair=11;S.atelier.weapon=11;
 S.costumes??={owned:[],equipped:{}};S.costumes.owned??=[];S.costumes.equipped??={};
 if(!S.costumes.owned.includes('leaflight'))S.costumes.owned.push('leaflight');
 S.costumes.equipped.reina='leaflight';
 S.reinaFashion??={owned:0,equipped:0};S.reinaFashion.equipped=(S.reinaFashion.equipped|2)&~5;
 stylePick=null;clothingPreview=undefined;++fashionPreviewRequest;
 save();reinaAtelier();toast('Leaflight set equipped');
}

let wardrobeCatalogReady=false;
// Hair layers rebuilt by scripts/build-fitting-v2.py; the others still use the shared front/back split.
const wardrobePixelHairs=new Set([3,9,10,11]);
// Second collection (painted on the bald body): these hang down her back, behind body and clothes.
const wardrobeBackHairs=new Set([12,13,19,20]);
const wardrobeGripPath='M378 360 Q386 351 397 360 Q413 364 411 374 L405 383 Q399 394 390 393 L378 385 L370 374 Z';
function ensureWardrobeCatalog(){
 if(wardrobeCatalogReady)return;
 const bodyAsset='fit-control-body';
 // Every outfit is a painting of the fixed body, extracted per pixel by
 // scripts/build-fitting-v2.py: one garment layer, plus a mask of the body
 // parts it hides. Neck, wrists, hands and legs need no clip paths.
 for(const [id] of fittingDresses)
  WonderWardrobe.register({id:'dress:'+id,kind:'dress',frame:[500,800],bodyErase:'fit-control-'+id+'-erase',layers:[{slot:'garmentFront',asset:'fit-control-'+id}]});
 // Hair tails render behind the same body; cap and face-framing strands render last.
 const hairFront='M0 0 H500 V154 H285 V195 H262 V154 H220 V204 H194 V154 H0 Z';
 for(const [id] of fittingHairs){
  const asset='fit-control-hair-'+id;
  // Per-pixel hair layers sit wholly in front; gaps beside the ear are filled in the art.
  // Lavender Braid falls behind the shoulder: below the ear it sits behind the body, capes and sleeves.
  if(id===11){WonderWardrobe.register({id:'hair:11',kind:'hair',layers:[{slot:'hairBack',asset,clip:'M0 133 H215 V800 H0 Z'},{slot:'hairFront',asset,exclude:['M0 135 H215 V800 H0 Z']}]});continue;}
  if(id>=12){WonderWardrobe.register({id:'hair:'+id,kind:'hair',layers:[...(wardrobeBackHairs.has(id)?[{slot:'hairBack',asset:asset+'-back'}]:[]),{slot:'hairFront',asset}]});continue;}
  if(wardrobePixelHairs.has(id)){WonderWardrobe.register({id:'hair:'+id,kind:'hair',layers:[{slot:'hairFront',asset:'fit-control-hair-'+id}]});continue;}
  const layers=[{slot:'hairBack',asset,exclude:[hairFront]},{slot:'hairFront',asset,clip:hairFront}];
  WonderWardrobe.register({id:'hair:'+id,kind:'hair',layers});
 }
 // Grip position (fraction of the art's width) and drawn height of each bow; 12 reuses art 2.
 const bowGrip={1:.63,2:.68,3:.68,4:.61,5:.62,6:.56,7:.65,8:.62,9:.65,10:.60,14:.60,15:.60,16:.58,17:.60,18:.61,19:.62,20:.62,21:.62,22:.56,23:.62};
 // Opaque artwork bounds, including rotation, retain a 12px canvas margin.
 const bowHeight={1:301,2:308,3:319,4:306,5:295,6:340,7:303,8:300,9:279,10:313};
 for(let id=1;id<=23;id++){
  let layers;
  if(id===11||id===13)layers=[
   {slot:'weapon',asset:'fit-control-bow-11',clip:wardrobeLeafPath('bow')},
   {slot:'weapon',asset:'fit-control-bow-11',strokeOnly:true,stroke:{path:'M375.48828125 123.49609375 L336.42578125 567.83203125',color:'#d2ae58',width:1.07421875}},
   {slot:'gripFingers',asset:'fit-control-bow-11',clip:wardrobeLeafPath('grip')}
  ];
  else{
   const sourceId=id===12?2:id;
   layers=[{slot:'weapon',asset:'weapon-style-'+sourceId,handle:{x:bowGrip[sourceId],y:.5,height:bowHeight[sourceId]||312},transform:{x:390,y:375,rotation:.19,flipX:true}},
    {slot:'gripFingers',asset:bodyAsset,rect:[0,40,500,750],clip:wardrobeGripPath}];
  }
  WonderWardrobe.register({id:'weapon:'+id,kind:'weapon',layers});
 }
 wardrobeCatalogReady=true;
}
// Convert authored atlas paths into the canonical frame once, without moving anatomy.
function wardrobeLeafPath(slot){
 return {path:leaflightSlots[slot],matrix:{a:500/1024,b:0,c:0,d:750/1536,e:0,f:40}};
}
// Large wings reach past the 500-wide figure frame; portraits with wings are this much wider on each side.
const wardrobeWingPad=140,wardrobeWingTop=100;
// Cloak, back accessory and tail worn behind Reina (Companion screen). The tag "cloak.back.tail"
// travels inside portrait keys so cached portraits never show a stale accessory.
const wardrobeExtraKinds=['cloak','back','tail'],wardrobeExtraSlots={cloak:'cloakBack',back:'backItem',tail:'tailBack'};
function wardrobeExtrasTag(override){
 const ids=wardrobeExtraKinds.map(kind=>{
  if(override&&kind in override)return override[kind]||'';
  const v=WonderGear.companionState(S,kind);return v.equipped&&!v.hidden?WonderGear.companionSkin(S,kind).id:'';
 });
 return ids.some(Boolean)?ids.join('.'):'';
}
async function composeWardrobeCanvas(dress,hair,weapon=0,wings='',tag=wardrobeExtrasTag(),only=null){
 ensureWardrobeCatalog();
 const extras=(tag||'').split('.').map((id,i)=>{
  const kind=wardrobeExtraKinds[i];if(!id||!WonderGear.companionSkins[kind]?.some(skin=>skin.id===id))return null;
  const key='extra:'+kind+':'+id;
  if(!WonderWardrobe.get(key))WonderWardrobe.register({id:key,kind:'extra',layers:[{slot:wardrobeExtraSlots[kind],asset:'comp-'+kind+'-'+id}]});
  return key;
 }).filter(Boolean);
 const body='fit-control-body';
 if(wings&&!WonderWardrobe.get('wings:'+wings))WonderWardrobe.register({id:'wings:'+wings,kind:'wings',layers:[{slot:'wingsBack',asset:wings,fit:[-135,-115,720,600],minTop:2-wardrobeWingTop}]});
 return WonderWardrobe.render({dress:'dress:'+fittedDressId(dress),hair:'hair:'+fittedHairId(hair),weapon:weapon?'weapon:'+weapon:null,wings:wings?'wings:'+wings:null,extras,body,only,pad:wings?wardrobeWingPad:0,padTop:wings?wardrobeWingTop:0,
  createCanvas:(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;},load:id=>styleImage(artPath(id))});
}
async function composeRegisteredReina(dress,hair){
 return (await composeWardrobeCanvas(dress,hair)).toDataURL('image/png');
}
async function openFittingControl(dress=fittingControlDress,hair=fittingControlHair){
  if(!fittingDresses.some(([id])=>id===dress)||!fittingHairs.some(([id])=>id===hair))return;
  fittingControlDress=dress;fittingControlHair=hair;
  const previous=document.querySelector('.fit-control-portrait')?.src;
  $('#main').innerHTML=`<section class="fit-control">
    <header><h2>Reina · Layered fitting</h2><button onclick="reinaAtelier()">Back</button></header>
    <div class="fit-control-stage"><img class="fit-control-portrait" ${previous?`src="${previous}"`:'hidden'} alt="Reina wearing the selected dress and hairstyle"><span class="fit-control-status" role="status">Preparing outfit…</span></div>
    <div class="fit-control-options"><fieldset><legend>Dresses</legend>${fittingDresses.map(([id,name])=>`<button aria-pressed="${dress===id}" onclick="openFittingControl('${id}',${hair})"><img src="${id==='leaflight'?leaflightIcon('dress'):artPath('fit-control-'+(id==='base'?'body':id))}" alt=""><small>${name}</small></button>`).join('')}</fieldset>
    <fieldset><legend>Hair</legend>${fittingHairs.map(([id,name])=>`<button aria-pressed="${hair===id}" onclick="openFittingControl('${dress}',${id})">${id?`<img src="${id===11?leaflightIcon('hair'):artPath('hair-style-'+id)}" alt="">`:'<span class="fit-no-hair">∅</span>'}<small>${name}</small></button>`).join('')}</fieldset></div>
  </section>`;
  const target=document.querySelector('.fit-control-portrait');
  try{
    const result=await composeRegisteredReina(dress,hair);
    if(!target.isConnected)return;
    target.src=result;target.hidden=false;
    target.alt=`Reina · ${fittingDresses.find(([id])=>id===dress)[1]} · ${fittingHairs.find(([id])=>id===hair)[1]}`;
    document.querySelector('.fit-control-status').textContent='';
  }catch{
    if(target.isConnected)document.querySelector('.fit-control-status').textContent='Could not load this outfit. Tap its icon to retry.';
  }
}
const hairstyleEyes=[[81.38, 79.2, 118.19, 88.0], [79.44, 112.0, 118.19, 120.53], [82.34, 75.35, 122.06, 83.72], [94.94, 79.17, 125.94, 86.67], [81.38, 78.4, 117.22, 86.4], [84.28, 88.14, 124.0, 98.34], [77.5, 74.94, 110.44, 82.83], [83.31, 58.1, 110.44, 65.1], [79.89, 82.76, 118.39, 90.38], [68.34, 109.98, 105.61, 117.6]];
const fittedGrips={"grove": [375, 337], "violet": [373, 337], "dawnpetal": [353, 350], "frostlace": [389, 319], "nightbloom": [370, 327], "sunweave": [377, 328], "tidal": [376, 338], "emberveil": [356, 337], "willow": [376, 339], "stardust": [349, 330], "pearl": [360, 331], "sapphire": [345, 338]};
class WardrobeCache extends Map{
 constructor(limit=24){super();this.limit=limit;}
 set(key,value){if(this.has(key))this.delete(key);super.set(key,value);while(this.size>this.limit)this.delete(this.keys().next().value);return this;}
}
const styleRenderCache=new WardrobeCache(),styleSourceCache=new Map();
function styleImage(url){
  if(url.startsWith('data:')){const image=new Image();image.src=url;return image.decode().then(()=>image);}
  if(!styleSourceCache.has(url)){
    const image=new Image();image.src=url;
    styleSourceCache.set(url,image.decode().then(()=>image).catch(err=>{styleSourceCache.delete(url);throw err}));
  }
  return styleSourceCache.get(url);
}
// Every standing Reina uses the same complete body, including its head.
function fittedDressId(id){
  if(id==='moonblossom')return 'frostlace';
  return fittingDresses.some(([key])=>key===id)?id:'grove';
}
function fittedHairId(id){return fittingHairs.some(([key])=>key===id)?id:1;}
function registeredLook(){
  const look=S.reinaLayers||{};
  return {dress:fittedDressId(look.dress??currentDress()),hair:fittedHairId(look.hair??S.atelier?.hair)};
}
function ownsRegisteredDress(id){return ['base','grove','leaflight'].includes(id)||ownsOutfit(id)||(id==='frostlace'&&ownsOutfit('moonblossom'));}
const readyRegisteredLooks=new WardrobeCache();
let fashionPreviewRequest=0;
async function previewRegisteredSelection(category,id){
  const request=++fashionPreviewRequest,look=registeredLook();
  const choices=category==='Hair'?fittingHairs:fittingDresses;
  if(!choices.some(([key])=>key===id))return;
  const dress=category==='Dresses'?id:look.dress,hair=category==='Hair'?id:look.hair;
  const key=registeredLookKey(dress,hair,0);
  try{
    const result=await renderRegisteredLook(dress,hair,0);
    await styleImage(result);readyRegisteredLooks.set(key,result);
    if(request!==fashionPreviewRequest||screen!=='fashion'||fashionCategory!==category)return;
    if(category==='Hair')stylePick=hair;else clothingPreview=dress;
    reinaAtelier();
  }catch{toast('Could not load this style. Please try again.');}
}
function previewRegisteredHair(hair){return previewRegisteredSelection('Hair',hair);}
function previewRegisteredDress(dress){return previewRegisteredSelection('Dresses',dress);}
function registeredLookKey(dress,hair,weapon=0,wings='',tag=wardrobeExtrasTag()){
 const release=artPath('fit-control-body').split('?')[1]||'';
 return 'wardrobe-placeholder.svg'+(release?'?'+release:'')+'#registered-'+dress+'-'+hair+'-'+weapon+(wings?'~'+wings:'')+(tag?'!'+tag:'');
}
function registeredLookPath(dress=registeredLook().dress,hair=registeredLook().hair,weapon=0,wings='',tag=wardrobeExtrasTag()){
 dress=fittedDressId(dress);hair=fittedHairId(hair);
 const key=registeredLookKey(dress,hair,weapon,wings,tag);
 return readyRegisteredLooks.get(key)||key;
}
async function previewRegisteredEquipment(category,id){
 const request=++fashionPreviewRequest,{dress,hair}=registeredLook();
 const weapon=category==='Weapons'?(id>0?id:id===-1?12:13):(S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13));
 const wings=category==='Wings'?fashionWing(id).id:'';
 try{
  const result=await renderRegisteredLook(dress,hair,weapon,wings);await styleImage(result);
  readyRegisteredLooks.set(registeredLookKey(dress,hair,weapon,wings),result);
  if(request!==fashionPreviewRequest||fashionCategory!==category)return;
  if(category==='Wings')wingPreview=id;else stylePick=id;
  reinaAtelier();
 }catch{toast('Could not load this style. Please try again.');}
}
async function renderRegisteredLook(dress,hair,weapon,wings='',tag=wardrobeExtrasTag()){
 return (await composeWardrobeCanvas(dress,hair,weapon,wings,tag)).toDataURL('image/png');
}
document.addEventListener('load',async event=>{
  const img=event.target;if(img.tagName!=='IMG')return;
  const src=img.src,icon=src.match(/#leaflight-icon-(hair|dress|bow)$/);
  if(icon){try{if(!styleRenderCache.has(src))styleRenderCache.set(src,renderLeaflightIcon(icon[1]));const result=await styleRenderCache.get(src);readyRegisteredLooks.set(src,result);if(img.src===src)img.src=result;}catch{img.alt='Style';}return;}
  const ride=src.match(/#mounted-([a-z]+)-(\d+)(?:~([a-z-]+))?$/);
  if(ride&&fittingDresses.some(([id])=>id===ride[1])){
   if(!styleRenderCache.has(src))styleRenderCache.set(src,composeMountedCanvas(ride[1],+ride[2],ride[3]||'silver-tabby').then(canvas=>canvas.toDataURL('image/png')));
   try{const result=await styleRenderCache.get(src);readyRegisteredLooks.set(mountedLookKey(ride[1],+ride[2],ride[3]||'silver-tabby'),result);if(img.src===src)img.src=result;}
   catch{styleRenderCache.delete(src);img.alt='Could not load Reina. Please reopen the garden.';}
   return;
  }
  const match=src.match(/#registered-([a-z]+)-(\d+)-(\d+)(?:~([a-z0-9-]+))?(?:!([a-z.]+))?$/);
  if(!match||!fittingDresses.some(([id])=>id===match[1]))return;
  if(!styleRenderCache.has(src))styleRenderCache.set(src,renderRegisteredLook(match[1],+match[2],+match[3],match[4]||'',match[5]||''));
  try{const result=await styleRenderCache.get(src);readyRegisteredLooks.set(registeredLookKey(match[1],+match[2],+match[3],match[4]||'',match[5]||''),result);if(img.src===src)img.src=result;}
  catch{styleRenderCache.delete(src);img.alt='Could not load Reina. Please reopen Fashion.';}
},true);
// Canvas battles consume exactly the same assembled portrait as the wardrobe.
const registeredCombatCache=new WardrobeCache(8);
let lastRegisteredCombatImage=null;
// noWings: the same portrait without wings, for games that draw the wings themselves so they can beat.
function registeredCombatBitmap(noWings){
 if(typeof Image==='undefined')return null;
 const {dress,hair}=registeredLook(),weapon=S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13);
 const wings=noWings?'':fashionWing()?.id||'',key=dress+'/'+hair+'/'+weapon+'/'+wings+'/'+wardrobeExtrasTag()+(noWings?'/bare':'');
 if(!registeredCombatCache.has(key)){
  const entry={image:null};registeredCombatCache.set(key,entry);
  renderRegisteredLook(dress,hair,weapon,wings).then(styleImage).then(image=>{entry.image=image;}).catch(()=>registeredCombatCache.delete(key));
 }
 const image=registeredCombatCache.get(key)?.image;
 if(noWings)return image||null;
 if(image)lastRegisteredCombatImage=image;
 return image||lastRegisteredCombatImage;
}
// Jungle Trek animates the shot: it needs the figure without her bow, the bow alone, and the fingers that close over
// the grip, all in the same 500 x 800 frame (canvases at 2x, no wings). Null until all three are painted.
const registeredCombatParts=new WardrobeCache(4);
function registeredCombatLayers(){
 if(typeof document==='undefined'||typeof WonderWardrobe==='undefined')return null;
 const {dress,hair}=registeredLook(),weapon=S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13),tag=wardrobeExtrasTag(),key=dress+'/'+hair+'/'+weapon+'/'+tag;
 if(!registeredCombatParts.has(key)){
  const entry={ready:false};registeredCombatParts.set(key,entry);
  const hand=['weapon','gripFingers'],rest=WonderWardrobe.slots.filter(slot=>!hand.includes(slot));
  Promise.all([rest,['weapon'],['gripFingers']].map(only=>composeWardrobeCanvas(dress,hair,weapon,'',tag,only)))
   .then(([figure,bow,fingers])=>Object.assign(entry,{figure,bow,fingers,ready:true})).catch(()=>registeredCombatParts.delete(key));
 }
 const entry=registeredCombatParts.get(key);
 return entry?.ready?entry:null;
}
function reinaWorldLookPath(){
 return registeredLookPath(undefined,undefined,S.atelier?.weapon||((S.reinaFashion?.equipped&4)?12:13),fashionWing().id);
}
function reinaLookPath(riding,mask=S.reinaFashion?.equipped||0,shared=S.costumes?.equipped?.reina,styles=S.atelier){
  if(!riding)return registeredLookPath(arguments.length>=3&&shared!==currentDress()?fittedDressId(shared):undefined,undefined,styles?.weapon||((mask&4)?12:13));
  return mountedLookPath();
}
// Riding pose: one fixed base (Reina on the Silver Tabby) plus the same dress and hair, painted
// on that base and extracted per pixel by scripts/build-mounted.py.
function mountedLookKey(dress,hair,mount='silver-tabby'){
 const release=artPath('fit-control-mount-base').split('?')[1]||'';
 return 'wardrobe-placeholder.svg'+(release?'?'+release:'')+'#mounted-'+dress+'-'+hair+(mount==='silver-tabby'?'':'~'+mount);
}
function mountedLookPath(mount=currentMount()?.id||'silver-tabby'){
 const {dress,hair}=registeredLook(),key=mountedLookKey(dress,hair,mount);
 return readyRegisteredLooks.get(key)||key;
}
async function composeMountedCanvas(dress,hair,mount='silver-tabby'){
 const steed=mounts.find(m=>m.id===mount)||mounts[0];
 const [base,cloth,locks]=await Promise.all([steed.base,'fit-control-mount-'+dress,'fit-control-mounthair-'+hair].map(id=>styleImage(artPath(id))));
 const c=document.createElement('canvas');c.width=1024;c.height=936;const ctx=c.getContext('2d');
 const part=(image,y0,y1)=>{ctx.save();ctx.beginPath();ctx.rect(0,y0,1024,y1-y0);ctx.clip();ctx.drawImage(image,0,0,1024,936);ctx.restore();};
 ctx.drawImage(base,0,0,1024,936);
 // Hair that hangs down her back: below the ear it goes behind capes and sleeves.
 const behind=hair===11||wardrobeBackHairs.has(hair);
 if(behind)part(locks,138,936);
 ctx.drawImage(cloth,0,0,1024,936);
 if(behind)part(locks,0,140);else ctx.drawImage(locks,0,0,1024,936);
 return c;
}

function registeredFashionRoom(){
  const look=registeredLook(),isHair=fashionCategory==='Hair';
  const selected=isHair?(stylePick??look.hair):(clothingPreview??look.dress);
  const choices=isHair?fittingHairs:fittingDresses;
  const chosen=choices.some(([id])=>id===selected)?selected:(isHair?look.hair:look.dress);
  const dress=isHair?look.dress:chosen,hair=isHair?chosen:look.hair;
  const owned=isHair?chosen<=1||styleOwned(styleSets.Hair,chosen):ownsRegisteredDress(chosen);
  const price=isHair?400:1200;
  const cards=choices.map(([id,name])=>fashionCard(name,id==='leaflight'?leaflightIcon('dress'):isHair?artPath('fit-icon-hair-'+id):(id==='base'?registeredLookPath('base',look.hair):artPath('fit-icon-'+id)),chosen===id,isHair?`previewRegisteredHair(${id})`:`previewRegisteredDress('${id}')`)).join('');
  const bonus=isHair?(chosen?styleSets.Hair.bonus:''):(!['base','grove'].includes(chosen)?'+'+WonderGear.fashionTraits.clothing+' Defense':'');
  return fashionShowcase({portrait:registeredLookPath(dress,hair),alt:'Reina · '+choices.find(([id])=>id===chosen)[1],title:choices.find(([id])=>id===chosen)[1],bonus,owned,price,equipped:chosen===(isHair?look.hair:look.dress),action:`wearRegisteredLook('${dress}',${hair})`,cards});
}
function wearRegisteredLook(dress,hair){
  if(screen!=='fashion'||!fittingDresses.some(([id])=>id===dress)||!fittingHairs.some(([id])=>id===hair))return;
  const isHair=fashionCategory==='Hair';
  const owned=isHair?hair<=1||styleOwned(styleSets.Hair,hair):ownsRegisteredDress(dress);
  const price=owned?0:isHair?400:1200;
  if(S.gold<price){toast('Not enough gold');return;}
  S.gold-=price;
  S.reinaLayers={dress,hair};
  S.reinaFashion??={owned:0,equipped:0};
  if(isHair){
    S.atelier??={owned:[]};S.atelier.owned??=[];
    if(hair&&!S.atelier.owned.includes('hair'+hair))S.atelier.owned.push('hair'+hair);
    S.atelier.hair=hair;S.reinaFashion.equipped&=~1;
  }else{
    S.costumes??={owned:[],equipped:{}};S.costumes.owned??=[];S.costumes.equipped??={};
    const premium=!['base','grove'].includes(dress);
    if(premium&&!S.costumes.owned.includes(dress))S.costumes.owned.push(dress);
    S.costumes.equipped.reina=premium?dress:'';
    S.reinaFashion.equipped=premium?S.reinaFashion.equipped|2:S.reinaFashion.equipped&~2;
  }
  reinaPreview=S.reinaFashion.equipped;save();reinaAtelier();
}
function wingSkinPrice(id){
  if(!id||S.owned.includes(id)||S.reinaFashion?.wingSkin===id||S.reinaFashion?.wingSkins?.includes(id))return 0;
  return fashionWings.find(it=>it.id===id)?.cost??Math.floor(item(id).cost/2);
}
function reinaLookPrice(){
  const owned=(S.reinaFashion?.owned || 0) | (ownsOutfit('moonblossom')?2:0);
  return reinaPieces.reduce((sum,p)=>sum+((reinaPreview & p.bit) && !((S.reinaFashion?.equipped||0) & p.bit) && !(owned & p.bit) ? p.price : 0),wingSkinPrice(wingPreview));
}
function previewReina(mask){
  reinaPreview=mask & 7;
  reinaAtelier();
}
function wearReinaLook(){
  if(screen!=='fashion'&&!(screen==='citySkin'&&skinMode==='Appearance'))return;
  const price=reinaLookPrice();
  if(S.gold<price){toast('Not enough gold');return}
  S.gold-=price;
  const changedDress=Boolean((reinaPreview^(S.reinaFashion?.equipped||0))&2);
  const wingSkins=[...new Set([...(S.reinaFashion?.wingSkins||[]),S.reinaFashion?.wingSkin,wingPreview].filter(Boolean))];
  S.reinaFashion={wingSkins,wingSkin:wingPreview,owned:(S.reinaFashion?.owned || 0) | reinaPreview,equipped:reinaPreview};
  if(changedDress&&S.costumes?.equipped)S.costumes.equipped.reina=reinaPreview&2?'moonblossom':'';
  save();reinaAtelier();
}
function reinaAtelier(){
  const price=reinaLookPrice(), equipped=reinaPreview===(S.reinaFashion?.equipped || 0)&&wingPreview===(S.reinaFashion?.wingSkin||'');
  const inSkin=screen==='citySkin';
  if(!inSkin)nav();
  if(!inSkin&&['Dresses','Hair'].includes(fashionCategory)){
    const previous=document.querySelector('.fashion-showcase');
    const scroll=previous?.dataset?.category===fashionCategory?previous.querySelector('.fashion-cards').scrollTop:0;
    $('#main').innerHTML=registeredFashionRoom();
    const gallery=document.querySelector('.fashion-cards');if(gallery)gallery.scrollTop=scroll;
    return;
  }
  if(styleSets[fashionCategory]||fashionCategory==='Wings'||fashionCategory==='Mounts'||(!inSkin&&fashionCategory==='Dresses')){
    const previous=document.querySelector('.fashion-showcase');
    const scroll=previous?.dataset?.category===fashionCategory?previous.querySelector('.fashion-cards').scrollTop:0;
    $('#main').innerHTML=fashionCategory==='Mounts'?mountFittingRoom():fashionCategory==='Wings'?wingFittingRoom():styleSets[fashionCategory]?styleFittingRoom(styleSets[fashionCategory]):fittingRoom();
    const gallery=document.querySelector('.fashion-cards');
    if(gallery)gallery.scrollTop=scroll;
    return;
  }
  const traits=WonderGear.fashionTraits;
  const pieceBonus={1:'+'+traits.hair+' HP',2:'+'+traits.clothing+' Defense',4:'+'+traits.weapon+' Attack'};
  const wings=['',...ITEMS.filter(it=>it.type==='wings').map(it=>it.id)].map(id=>`<button aria-pressed="${wingPreview===id}" onclick="wingPreview='${id}';reinaAtelier()">${id?item(id).name:'Original'}${id?`<small>+${traits.wings} Shield HP · ${wingSkinPrice(id)?fmt(wingSkinPrice(id))+' gold':'Unlocked'}</small>`:''}</button>`).join('');
  const rows=reinaPieces.filter(p=>p.bit===({Accessories:1,Clothing:2,Weapons:4})[fashionCategory]).map(p=>{
    const picked=Boolean(reinaPreview & p.bit),owned=p.bit===2?ownsOutfit('moonblossom'):Boolean((S.reinaFashion?.owned || 0) & p.bit);
    return `<fieldset><legend>${p.slot}</legend><div><button aria-pressed="${!picked}" onclick="previewReina(${reinaPreview & ~p.bit})">${p.classic}</button><button aria-pressed="${picked}" onclick="previewReina(${reinaPreview | p.bit})">${p.name}<small>${pieceBonus[p.bit]} · ${owned?'Owned':fmt(p.price)+' gold'}</small></button></div></fieldset>`;
  }).join('');
  $('#main').innerHTML=`<section class="reina-atelier"><div class="atelier-portrait"><h1>Reina</h1><div class="fashion-model"> ${fashionCategory==='Wings'?`<span class="fashion-plumes">${wingArt(fashionWing(wingPreview))}</span>`:''}<img src="${reinaLookPath(false,reinaPreview)}" alt="Reina wearing the selected pieces"></div></div><div class="atelier-controls"><h2>${inSkin?(fashionCategory==='Wings'?'Wing appearance':'Weapon appearance'):'Fashion'}</h2>${inSkin?`<button onclick="switchSkin(skinTab,'Morphing',skinVariant)">Back to ${skinPages[skinTab].name}</button>`:''}${fashionCategory==='Clothing'?'<button onclick="wardrobe(\'reina\')">Shared outfits</button>':''}${fashionCategory==='Wings'?'<fieldset><legend>Wing appearance</legend><div class="wing-choices">'+wings+'</div></fieldset>':rows}<div class="atelier-actions"><button class="primary" ${equipped||price>S.gold?'disabled':''} onclick="wearReinaLook()">${equipped?'Equipped':price?'Buy &amp; equip · '+fmt(price)+' gold':'Equip'}</button></div>${price>S.gold?'<small>Not enough gold</small>':''}</div></section>`;
}
const fashionSeasons = [
  {hero:'paladin', tier:5}, {hero:'mage', tier:4},
  {hero:'healer', tier:2}, {hero:'rogue', tier:6}
];
const fashionBowPrice = 1200;
function activeFashionSale(now=Date.now()){
  const start = Date.UTC(2026,10,14), duration = 4*86400000;
  const period = Math.floor((now-start)/duration);
  return {...fashionSeasons[((period%4)+4)%4], end:start+(period+1)*duration};
}
let fashionTimer;
function fashionSale(){
  clearTimeout(fashionTimer);
  const sale=activeFashionSale(), item=partyWardrobe[sale.hero];
  const rank=S.fashionBows?.[item.id] || 0;
  const hours=Math.ceil((sale.end-Date.now())/3600000);
  modal(`<section class="fashion-sale"><h2>${item.outfit} Collection</h2><small>Fashion Sale · ${Math.floor(hours/24)}d ${hours%24}h</small><div class="fashion-offers"><article>${dressedHero(sale.hero,item.id,item.outfit)}<h3>${item.outfit} Outfit</h3><button onclick="wardrobe('${sale.hero}','${item.id}')">Try on</button></article><article><img src="${artPath('gear-bow-t'+sale.tier)}" alt="${item.outfit} bow"><h3>${item.outfit} Bow</h3><span>Rank ${rank} → ${rank+1} · +20 ATK</span><button ${S.gold<fashionBowPrice?'disabled':''} onclick="buyFashionBow('${item.id}')">${rank?'Upgrade':'Unlock'} · ${fmt(fashionBowPrice)} gold</button></article></div></section>`);
  fashionTimer=setTimeout(()=>{if($('#modal').open && document.querySelector('.fashion-sale')) fashionSale()},Math.min(3600000,sale.end-Date.now()+10));
}
function buyFashionBow(id){
  if(id!==partyWardrobe[activeFashionSale().hero].id){fashionSale();return}
  if(S.gold<fashionBowPrice)return;
  const bows=S.fashionBows??={};
  bows[id]=(bows[id]||0)+1;
  S.gold-=fashionBowPrice;
  save();home();fashionSale();
}
let cityExpanded=true;
const cityGroups=[
 [['top-up','Top-up'],['shop','Shop'],['benefits','benefits'],['treasure','TresHunt'],['summon','Summon','wish'],['challenge','Challenge','dungeons'],['gear','Master of Gear','forge'],['discord','Discord']],
 [['pass','ValuePass'],['siege','Pet Siege'],['goldpass','GoldPass'],['gift','DailyGift','quests'],['clan','ClanClash'],['superpack','SuperPack'],['fashion','Fashion Sale','sale'],['snow','Snowland'],['dream','DreamPass'],['fest','FestEvent'],['gacha','GodGacha','wish'],['spend','SpendRank'],['rush','Rush Rank','rankings'],['chain','Chain Buy']],
 [['character','Character','character'],['bag','Bag','cityBag'],['pet','Pet','cityPet'],['companion','Companion','cityCompanion'],['skin','Skin','citySkin'],['forge','Forge','cityForge'],['more','More','more']]
];
const cityDrawerItems=[
 ['fashion','Fashion','fashion'],['combat','Skill'],['upgrade','Advance'],['summon','Synthesize','cityCraft'],['clan','Guild'],['rank','Rankings','rankings'],
 ['pass','Gallery','petGallery'],['treasure','Legacy'],['benefits','Couple'],['reinforce','Assist','petAssist'],['siege','OldGods'],
 ['isle','Otherworld'],['challenge','Fane'],['skin','Diviniform'],['gems','Element'],['gacha','BonusCard']
];
function toggleCityDrawer(){
 returnToDrawer=false;
 const panel=$('#city-drawer'),toggle=$('#city-drawer-toggle');
 panel.hidden=!panel.hidden;
 toggle.setAttribute('aria-expanded',String(!panel.hidden));
 if(!panel.hidden){
  cityExpanded=false;
  $('.city-hud').dataset.expanded='false';
  const fold=$('.city-fold');
  fold.setAttribute('aria-expanded','false');fold.setAttribute('aria-label','Show events');
 }
}
let returnToDrawer=false;
function returnToMenu(){
 const dialog=$('#modal');
 if(dialog.open)dialog.close();
 go('home');
}
function cityDrawerAction(index){
 returnToDrawer=true;
 const [,label,target]=cityDrawerItems[index];
 if(target==='petGallery'||target==='petAssist'){go('cityPet');petTab(target==='petGallery'?'Gallery':'Assist');return}
 if(target){go(target);return}
 modal('<h2>'+label+'</h2><p>This section is in development.</p>');
}
function cityDrawerMarkup(){
 return '<nav class="city-drawer" id="city-drawer" aria-label="More activities" hidden>'+cityDrawerItems.map(([icon,label],i)=>'<button class="city-icon" onclick="cityDrawerAction('+i+')"><span class="city-glyph"><img src="'+artPath('drawer-'+icon)+'" alt=""></span><span class="city-caption">'+label+'</span></button>').join('')+'</nav>';
}
function cityAction(target,label){
 if(target==='sale')go('eliteSale');
 else if(target==='ride')toggleMount();
 else if(target==='collection')chooseSectionPage('collection');
 else if(target)go(target);
 else modal('<h2>'+esc(label)+'</h2><p>This activity is not available yet.</p>');
}
const cityArtVersion = document.querySelector('meta[name="wonder-release"]')?.content;
const cityNotices=new Set(['shop','benefits','treasure','summon','gear','goldpass','clan','superpack','dream','rush']);
function cityIcon([icon,label,target=''], artPrefix='hud-'){
 if(icon==='more')return '<button class="city-icon city-more" id="city-drawer-toggle" aria-label="More" aria-controls="city-drawer" aria-expanded="false" onclick="toggleCityDrawer()"><img class="city-four" src="assets/generated/drawer-more.webp" alt=""></button>';
 const notice=cityNotices.has(icon)?'<i class="city-notice" aria-hidden="true">!</i>':'';
 return `<button class="city-icon" onclick="cityAction('${target}','${label}')" aria-label="${label}"><span class="city-glyph"><img src="${artPath(icon==='cloud-war-citadel'?icon:artPrefix+icon)}${cityArtVersion?'?v='+cityArtVersion:''}" alt="">${notice}</span><span class="city-caption">${label}</span></button>`;
}
function foldCityMenu(button){
 const drawer=$('#city-drawer');if(drawer&&!drawer.hidden)toggleCityDrawer();
 cityExpanded=!cityExpanded;
 const hud=button.closest('.city-hud');
 hud.dataset.expanded=String(cityExpanded);
 button.setAttribute('aria-expanded',String(cityExpanded));
 button.setAttribute('aria-label',cityExpanded?'Hide events':'Show events');
}
function cityTool(icon,label,action){
 return `<button class="city-tool" aria-label="${label}" title="${label}" onclick="${action}"><img src="${artPath('hud-'+icon)}" alt=""></button>`;
}
function home(){
 const mount=currentMount(),st=stats();
 // Beside Reina stand exactly the pets placed in the three Primary Pet slots (Pet -> Formation), each in its own spot.
 const pets=WonderGear.petTeam(S).slice(0,3).map((id,slot)=>id?{...item(id),slot}:null).filter(Boolean);
 const short=[cityGroups[0][0],cityGroups[1][3]];
 $('#main').innerHTML=`<section class="city-hud" data-expanded="${cityExpanded}"><button class="city-status" onclick="go('profile')"><img src="${artPath('reina-avatar')}" alt=""><b>${fmt(st.power)}<i class="city-bars"></i><small>Lv. ${level()} · Peace</small></b></button>
 <button class="city-rank" onclick="go('rankings')"><img src="${artPath('hud-rank')}" alt="">Rank</button><div class="city-wallet"><span><img src="${artPath('hud-gems')}">${fmt(S.tickets)}</span><span><img src="${artPath('hud-prisms')}">${fmt(S.scales)}</span></div><div class="city-place">Sky Garden</div>
 <button class="city-event" onclick="go('rankings')"><img src="${artPath('hud-event')}" alt=""><small>Hall of Wonders</small><strong>${esc(S.name)}</strong></button>
 <div class="city-left-events"><div class="city-top">${cityGroups[0].map(item=>cityIcon(item,'left-')).join('')}</div><div class="city-top city-compact">${short.map(item=>cityIcon(item,'left-')).join('')}</div>
 <button class="city-fold" aria-label="${cityExpanded?'Hide events':'Show events'}" aria-expanded="${cityExpanded}" aria-controls="city-promotions" onclick="foldCityMenu(this)"><span class="city-fold-disc" aria-hidden="true"></span></button>
 <div id="city-promotions" class="city-promos">${cityGroups[1].map(item=>cityIcon(item,'left-')).join('')}</div></div>
 <button class="city-reinforce" onclick="go('forge')"><span>Reinforce<small>Gear upgrades</small></span><img src="${artPath('hud-reinforce')}"></button><div class="city-extra"><button class="city-icon" onclick="go('fishing')"><span class="city-glyph"><img class="city-fish" src="assets/generated/fishing-crowned-goldfish.webp" alt=""></span><span class="city-caption">Fishing</span></button><button class="city-icon" onclick="go('pairs')"><span class="city-glyph"><img class="city-fish" src="${artPath('pairs-sprout')}" alt=""></span><span class="city-caption">Harvest Pairs</span></button>${[['isle-skyship','Isle Expedition','isleArena'],['cloud-war-citadel','Cloud War','cloudWar']].map(item=>cityIcon(item)).join('')}</div>
 ${mount?`<div class="city-wings riding">${artImage(fashionWing().id,'Reina’s wings')}</div>`:''}<div class="city-aura"><img src="${artPath('hud-aura')}" alt="Overlord’s Aura"></div>${cityCompanionEffects(['footprint'])}${pets.map(pet=>`<div class="city-pet city-pet-${pet.slot}"><img src="${pet.portrait||artPath(pet.id)}" alt="${esc(pet.name)}" draggable="false"></div>`).join('')}<div class="city-hero${mount?' riding':''}"><b>${esc(S.name)}</b><img${mount?'':' class="winged-portrait"'} src="${mount?reinaLookPath(true):reinaWorldLookPath()}" alt="Reina"></div>${cityCompanionEffects(['elf'])}
 <div class="city-jobs">${[['Daily','cityDaily'],['Gameplay','cityGameplay'],['Bounty','cityBounty'],['Hunting','cityHunting']].map(([name,id])=>`<button onclick="go('${id}')"><img src="${artPath('wing-menu-'+name.toLowerCase())}" alt="">${name}</button>`).join('')}</div>
 <div class="city-tools">${[['broadcast','Elf Broadcast']].map(item=>cityIcon(item)).join('')}</div>
 <div class="city-skills">${[['move','Realm',"go('world')"],['ally1','Pet',"chooseSectionPage('collection')"],['combat','Combat',"go('dungeons')"],['ally2','Companion',"go('profile')"],['ride','Ride','toggleMount()'],['ally3','Wardrobe',"go('fashion')"],['travel','Travel',"go('world')"]].map(a=>cityTool(...a)).join('')}</div>
 <div class="city-quick">${cityTool('chest','Rewards',"go('quests')")}${cityTool('upgrade','Upgrade',"go('forge')")}</div>
 <button class="city-reward" aria-label="Challenge" onclick="go('cityExplore')"><img src="${artPath('left-explore')}" alt=""><small>Challenge</small></button><button class="city-quest" onclick="go('quests')"><img src="${artPath('hud-quest')}" alt=""> Quest Board</button>
 <div class="city-chat"><div><small>Globe</small> Welcome to Sky Garden</div><div><small>System</small> ${esc(S.name)} · Level ${level()}</div>${cityTool('wing-chat','Journal',"go('settings')")}</div>${cityDrawerMarkup()}<div class="city-dock">${cityGroups[2].map(item=>cityIcon(item)).join('')}</div></section>`;
}
function heroProfile(){const mount=currentMount(),st=stats(),d=item(S.dragon),w=item(S.wings);renderHeroReadout(st);$('#main').innerHTML=`<div class="profile"><div class="profile-bg"></div><aside class="profile-panel stats-panel"><p class="eyebrow">ELVEN RANGER</p><h2>${esc(S.name)}</h2><span class="level-pill">LEVEL ${level()}</span><div class="progress"><b style="width:${level()>=1500?100:S.xp%150/1.5}%"></b></div><small class="xp">${level()>=1500?'MAX LEVEL · 1500':fmt(S.xp%150)+' / 150 XP'}</small><div class="power" role="button" tabindex="0" onclick="openHeroStats()" onkeydown="if(event.key==='Enter')openHeroStats()"><small>${uiIcon('power','power-art')}COMBAT POWER · ALL STATS</small><strong>${fmt(st.power)}</strong></div>${[['Attack',st.attack,'attack'],['Defense',st.defense,'defense'],['Health',st.health,'health'],['Critical',st.crit+'%','crit'],['Speed',st.speed,'speed'],['Accuracy',st.accuracy+'%','accuracy'],['Dodge',st.dodge+'%','wind'],['Shield HP',st.shieldHealth,'shield']].map(([n,v,i])=>`<div class="stat"><span>${uiIcon(i,'stat-art')}${n}</span><b>${typeof v==='number'?fmt(v):v}</b></div>`).join('')}<button class="primary hero-equipment-link" onclick="go('bag')">Equipment ›</button></aside><div class="hero-stage"><div class="hero-visual"><div class="scene-atmosphere" aria-hidden="true"><div class="godrays"></div><div class="volumetric-fog"></div></div><div class="stage-halo"></div><div class="party-formation" role="group" aria-label="Reina’s party">${Object.entries(partyWardrobe).map(([id,item])=>`<button class="party-member party-${id}" aria-label="${item.label} wardrobe" onclick="wardrobe('${id}')">${dressedHero(id,S.costumes?.equipped?.[id],item.label)}</button>`).join('')}</div>${mount ? `<img class="avatar mounted-reina" src="${reinaLookPath(true)}" alt="Reina riding ${mount.name}">` : `<img class="avatar" src="${reinaWorldLookPath()}" alt="REINA, silver-haired elven ranger">`}<button class="fashion-sale-link" onclick="fashionSale()">Fashion Sale</button><button class="mount-toggle" type="button" aria-pressed="${Boolean(mount)}" onclick="toggleMount()">Mount</button><div class="companion" data-tier="${visualTier(d)}">${dragonSVG(d)}<span>${d.name}</span></div></div></div></div><div class="location-badge"><span>✧</span> SKY GARDEN <small>Sanctuary of the first wish</small></div>`}
function gearDetail(id){const slot={ring:'spiritluck',charm:'amulet'}[id]||id;openEquipment(globalThis.WonderGear.state(S).equipped[slot])}
function upgrade(id){const slot={ring:'spiritluck',charm:'amulet'}[id]||id,eq=globalThis.WonderGear.state(S),uid=eq.equipped[slot],entry=eq.items.find(i=>i.uid===uid);if(entry)equipmentAction(uid,'enhance',equipmentStamp(entry))}

function applyEmberEvolution(){
 if(!WonderGear.evolveEmber(S))return;
 save();showPetGallery('d1');toast(S.emberStars?'Emberheart · '+S.emberStars+' stars':'Emberheart unlocked');
}
function emberProgress(){
 const stars=S.emberStars||0,shards=S.emberShards||0,cost=WonderGear.emberCost(S),owned=S.owned.includes('d1');
 const previews=[5,6].map(n=>`<figure>${dragonSVG(item('d1'),n)}<figcaption>${n}★ · ${n===5?'Adult':'Ultimate'}</figcaption></figure>`).join('');
 return `<section class="ember-progress"><strong aria-label="${stars} of 6 stars">${'★'.repeat(stars)}${'☆'.repeat(6-stars)}</strong>
 ${stars<6?`<span>${shards} / ${cost} shards · +10 per dungeon boss</span><button ${shards<cost?'disabled':''} onclick="applyEmberEvolution()">${owned?'Star up · +30 ATK':'Summon Emberheart'}</button>`:'<span>Ultimate form unlocked</span>'}
 <details><summary>Evolution preview</summary><div class="ember-forms">${previews}</div></details></section>`;
}
let selectedPetId=null;
const galleryGroups=['Common','Rare','Epic','Super Rare','Fairies','Original'];
function summonPets(count){
 const price=count*50;
 if(![1,10].includes(count)||S.tickets<price)return;
 S.tickets-=price;
 const cards=[];
 for(let i=0;i<count;i++){
  const chance=Math.random();
  const tier=chance<.04?'Super Rare':chance<.20?'Epic':chance<.55?'Rare':'Common';
  const pool=WonderGear.familiars.filter(p=>p.rarity===tier);
  const p=pool[Math.floor(Math.random()*pool.length)],owned=S.owned.includes(p.id);
  if(owned){S.gold+=100;WonderGear.addPetSpare(S,p.id)}else S.owned.push(p.id);
  cards.push(petCard(p.id,'',owned?'+1 copy':'New!'));
 }
 save();if(screen==='cityPet')cityPet();else showPetGallery();
 popup(`<div class="den-congrats" onclick="$('#modal').close()"><h2>Pet Summon</h2><div class="den-picker den-summoned">${cards.join('')}</div><small>Tap anywhere to close</small></div>`);
}
function showPetGallery(id=selectedPetId||S.dragon){
 const pet=item(id),rules=WonderGear,lv=rules.petLevel(S,id),attack=rules.petAttack(S,id);
 selectedPetId=id;
 const owned=S.owned.includes(id),active=S.dragon===id,maxed=lv>=rules.petCap;
 const cost=lv*100;
 const group=pet.family||'Original';
 const filters=galleryGroups.map(g=>{
  const first=ITEMS.find(p=>p.type==='dragon'&&(p.family||'Original')===g);
  return `<button aria-pressed="${g===group}" onclick="showPetGallery('${first.id}')">${g}</button>`;
 }).join('');
 const portraits=ITEMS.filter(p=>p.type==='dragon'&&(p.family||'Original')===group).map(p=>`<button class="pet-choice" aria-pressed="${p.id===id}" onclick="showPetGallery('${p.id}')" style="--pet-color:${p.color}">${dragonSVG(p)}<strong>${p.name}</strong><small>Lv. ${rules.petLevel(S,p.id)}</small></button>`).join('');
 $('#main').innerHTML=`<section class="pet-gallery" style="--pet-color:${pet.color}">
 <header><div><small>${pet.rarity} · ${pet.title}</small><h1>${pet.name}</h1></div><strong>Lv. ${lv}</strong></header>
 <div class="pet-gallery-stage">${dragonSVG(pet)}</div>
 <div class="pet-gallery-panel"><strong>ATK ${attack} ${owned&&!maxed?'<em>→ '+(attack+12)+'</em>':''}</strong>
 <div class="pet-gallery-actions">${owned?`<button ${active?'disabled':''} onclick="equip('${id}')">${active?'Equipped':'Equip'}</button><button class="primary" ${maxed||S.gold<cost?'disabled':''} onclick="upgradePet('${id}')">${maxed?'Max level':'Upgrade · '+fmt(cost)+' gold'}</button>`:`<button class="primary" ${S.gold<pet.cost?'disabled':''} onclick="buy('${id}')">Unlock · ${fmt(pet.cost)} gold</button>`}</div></div>
 ${id==='d1'?emberProgress():''}<div class="pet-filter">${filters}</div><div class="pet-gallery-roster" aria-label="Choose a pet">${portraits}</div><div class="pet-draw"><button ${S.tickets<50?'disabled':''} onclick="summonPets(1)">Summon ×1 · 50 wishes</button><button ${S.tickets<500?'disabled':''} onclick="summonPets(10)">Summon ×10 · 500 wishes</button><details><summary>Summon chances</summary>Common 45% · Rare 35% (includes fairies) · Epic 16% · Super Rare 4%. Duplicates give 100 gold.</details></div></section>`;
}
// The Pets tab of Wonders opens the Pets room; its back arrow returns to Wonders (Wings).
function collection(){if(filter==='dragon'){petBackNext='wonders';openScreen('cityPet');return}nav();$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">A COLLECTION OF WONDERS</p><h1>Wonders</h1></div><span class="badge">${S.owned.length} / ${ITEMS.length} collected</span></div>${sectionArtwork('scene-wonders','Pets and luminous wings in the sanctuary')}<button class="primary wishes-link" onclick="go('wish')">Make a wish</button><div class="tabs"><button class="${filter==='dragon'?'active':''}" onclick="filter='dragon';collection()">Pets</button><button class="${filter==='wings'?'active':''}" onclick="filter='wings';collection()">Wings</button></div><div class="grid collection-grid">${ITEMS.filter(i=>i.type===filter).map(i=>{const owned=S.owned.includes(i.id),equipped=S[i.type==='dragon'?'dragon':'wings']===i.id;return `<article class="card ${equipped?'selected':''}"><div class="wonder-card-status"><span class="rarity">${i.rarity.toUpperCase()}</span>${equipped?'<span class="equipped">EQUIPPED</span>':''}</div><div class="art">${art(i)}</div><p class="eyebrow">${i.title}</p><h3>${i.name}${i.type==='dragon'?' · Lv. '+WonderGear.petLevel(S,i.id):''}</h3><p>${i.desc}</p><div class="item-footer"><span>+${i.type==='dragon'?WonderGear.petAttack(S,i.id):i.power} ${i.type==='dragon'?'ATK':'DEF'}</span><button class="${equipped?'':'primary'}" ${equipped?'disabled':''} onclick="${owned?`equip('${i.id}')`:`buy('${i.id}')`}">${equipped?'Equipped':owned?'Equip':fmt(i.cost)+' gold'}</button></div>${owned&&i.type==='dragon'?`<button class="pet-upgrade" ${WonderGear.petLevel(S,i.id)>=WonderGear.petCap||S.gold<100*WonderGear.petLevel(S,i.id)?'disabled':''} onclick="upgradePet('${i.id}')">${WonderGear.petLevel(S,i.id)>=WonderGear.petCap?'Max level':'Upgrade · '+fmt(100*WonderGear.petLevel(S,i.id))+' gold'}</button>`:''}</article>`}).join('')}</div>`}
function equip(id){const i=item(id);if(!S.owned.includes(id))return;S[i.type==='dragon'?'dragon':'wings']=id;save();collection();toast(i.name+' equipped')}
function buy(id){const i=item(id);if(S.owned.includes(id))return;if(S.gold<i.cost){toast('Not enough gold. Adventures earn gold.');return}S.gold-=i.cost;S.owned.push(id);S[i.type==='dragon'?'dragon':'wings']=id;save();collection();toast(i.name+' joined your collection')}
const MILESTONES=[[15,400],[30,740],[60,1240],[135,1240],[240,1240]];
function wish(){$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">THE WISHING TREE</p><h1>Wishes</h1></div><span class="badge">Every wish is free to earn</span></div><div class="split"><section class="panel summon"><div class="summon-tree">${artImage('scene-wishes','The crystal wishing tree')}</div><h2>A wonder is waiting.</h2><p>Pets, wings, gold, and a little stardust. What will your next wish bring?</p><div class="row"><button class="primary" onclick="roll(1)">Wish ×1 · 50</button><button class="primary" onclick="roll(10)">Wish ×10 · 500</button></div><small class="rules">Each wish also gives 10 dragon scales.</small></section><section class="panel"><p class="eyebrow">YOUR JOURNEY</p><h2>${fmt(S.rolls)} wishes made</h2><div class="progress"><b style="width:${S.rolls%300/3}%"></b></div><p class="rules">${300-S.rolls%300} wishes until your next guaranteed choice.<br>Progress and currencies never expire.</p>${MILESTONES.map(([n,v])=>`<div class="milestone ${S.claimed.includes(n)?'done':''}"><span>${n} wishes</span><span>${S.claimed.includes(n)?'✓ Received':fmt(v)+' wishes returned'}</span></div>`).join('')}<div class="row" style="margin-top:18px"><button onclick="exchange()">Trade 2,000 scales</button><button ${S.guarantees<1?'disabled':''} onclick="chooseReward('guarantee')">Choose reward (${S.guarantees})</button></div></section></div><details class="panel wish-rules" style="margin-top:20px"><summary>Wish chances & guarantees</summary><p class="eyebrow">OPEN RULES · OUR PROTOTYPE ECONOMY</p><p class="rules">Per wish: 1% dragon, 1% wings, 18% bonus 50 wishes, 10% synthesis stone, 70% gold (50–150). Within dragons and wings, unowned items are equally likely. Duplicates give 300 gold. Every wish gives 10 scales. Choose an unowned dragon or pair of wings for 2,000 scales, or after each 300 wishes. If everything is collected, your choice gives 1,000 gold. Milestone returns are automatic and awarded once. Wishes and scales carry over. No real-money purchases.</p></details>`}
function roll(n){if(S.tickets<n*50){toast('Not enough wishes. Play adventures or claim a test gift.');return}S.tickets-=n*50;let gold=0,bonus=0,synthesis=0,found=[],returns=0;const before=S.rolls;for(let j=0;j<n;j++){S.rolls++;S.scales+=10;const r=Math.random();if(r<.02){const type=r<.01?'dragon':'wings';const pool=ITEMS.filter(i=>i.type===type&&!S.owned.includes(i.id));if(pool.length){const it=pool[Math.floor(Math.random()*pool.length)];S.owned.push(it.id);found.push(it)}else gold+=300}else if(r<.20)bonus+=50;else if(r<.30)synthesis++;else gold+=50+Math.floor(Math.random()*101)}for(const [at,v]of MILESTONES)if(S.rolls>=at&&!S.claimed.includes(at)){S.claimed.push(at);returns+=v}S.guarantees+=Math.floor(S.rolls/300)-Math.floor(before/300);if(synthesis){S.equipment=WonderGear.state(S);S.equipment.materials.synthesis+=synthesis}S.gold+=gold;S.tickets+=bonus+returns;save();wish();modal(`<p class="eyebrow">YOUR WISHES ANSWERED</p><h2>${found.length?'A new wonder!':'A little closer to magic.'}</h2>${found.map(i=>`<div class="art" style="height:150px">${art(i)}</div><h3>${i.name}${i.type==='dragon'?' · Lv. '+WonderGear.petLevel(S,i.id):''}</h3>`).join('')}<div class="rewards"><span class="reward">${fmt(gold)} gold</span><span class="reward">${n*10} scales</span>${synthesis?`<span class="reward">${synthesis} synthesis stone(s)</span>`:''}${bonus?`<span class="reward">${bonus} bonus wishes</span>`:''}${returns?`<span class="reward">${fmt(returns)} milestone wishes</span>`:''}</div><p>${S.guarantees?'A guaranteed choice is ready in the Wishing Tree.':'All milestone returns have been added automatically.'}</p>`)}
function exchange(){if(S.scales<2000){toast('Collect '+fmt(2000-S.scales)+' more scales');return}chooseReward('scales')}
function chooseReward(source){if(source==='scales'&&S.scales<2000||source==='guarantee'&&S.guarantees<1)return;const pool=ITEMS.filter(i=>!S.owned.includes(i.id));modal(`<p class="eyebrow">CHOOSE YOUR WONDER</p><h2>Made for you.</h2><p>${source==='scales'?'Trade 2,000 scales':'Use one guaranteed choice'}.</p><div class="reward-choices">${pool.map(i=>`<button onclick="claimReward('${source}','${i.id}')"><span class="tiny-art">${art(i)}</span>${i.name}</button>`).join('')||`<button onclick="claimReward('${source}','gold')">Collection complete · Claim 1,000 gold</button>`}</div>`)}
function claimReward(source,id){if(source==='scales'){if(S.scales<2000)return}else if(source==='guarantee'){if(S.guarantees<1)return}else return;if(id!=='gold'&&(!item(id)||S.owned.includes(id)))return;if(id==='gold'&&S.owned.length<ITEMS.length)return;if(source==='scales')S.scales-=2000;else S.guarantees--;if(id==='gold')S.gold+=1000;else S.owned.push(id);save();$('#modal').close();wish();toast(id==='gold'?'1,000 gold received':item(id).name+' joined your collection')}
// Mini Games covers: fetched in the background soon after the game starts, and never lazy, so the page opens complete.
const GAME_COVERS=['battle-castle','pairs-cover','cover-castle-v2','cover-merge-v2','cover-crownfall'],gameCoverCache=[];
function preloadGameCovers(){if(typeof Image==='undefined'||gameCoverCache.length)return;for(const id of GAME_COVERS){const image=new Image();image.decoding='async';image.src=artPath(id);image.decode?.().catch(()=>{});gameCoverCache.push(image)}}
function eagerArt(html){return html.replaceAll('loading="lazy" decoding="async"','loading="eager" decoding="sync" fetchpriority="high"')}
if(typeof setTimeout==='function'&&typeof Image!=='undefined')setTimeout(preloadGameCovers,900);
function games(){$('#main').innerHTML=eagerArt(`<div class="game-section-title">${uiIcon('castle')}<h1>Mini Games</h1><span>PLAY · WIN · GROW</span></div><div class="game-portals"><article class="game-portal"><div class="portal-illustration">${artImage('battle-castle','Forest trail')}</div><div class="portal-shade"></div><div class="portal-game-info"><div class="booth-title"><h2>Jungle Trek</h2><span>Best score · ${fmt(S.jungleBest||0)}</span></div><button class="primary" onclick="go('jungle')">Enter the jungle</button></div></article><article class="game-portal"><div class="portal-illustration">${artImage('pairs-cover','Harvest basket')}</div><div class="portal-shade"></div><div class="portal-game-info"><small>Match and collect</small><div class="booth-title"><h2>Harvest Pairs</h2><span>Best time · ${S.pairsBest?Pairs.clock(S.pairsBest):'—'}</span></div><button class="primary" onclick="go('pairs')">Start harvest</button></div></article><article class="game-portal"><div class="portal-illustration"><img src="assets/sunny-garden.webp" alt=""></div><div class="portal-shade"></div><div class="portal-game-info"><small>Moonwater Lagoon</small><div class="booth-title"><h2>Fishing</h2><span>Moonwater Lagoon</span></div><button class="primary" onclick="go('fishing')">Cast a line</button></div></article>${[{id:'defense',art:'cover-castle-v2',title:'Castle Defense',sub:'Guard the Grove',icon:'castle',gold:800,wishes:250,xp:100},{id:'merge',art:'cover-merge-v2',title:'Dragon Merge',sub:'A Little Wonder',icon:'dragon',gold:'1,700 max',wishes:'By score',xp:'By score'},{id:'vale',art:'cover-crownfall',title:'Crownfall Vale',sub:'Castle conquest',icon:'castle',gold:450,wishes:85,xp:70}].map(g=>`<article class="game-portal"><div class="portal-illustration">${artImage(g.art,g.title+' adventure')}</div><div class="portal-shade"></div><span class="portal-emblem">${uiIcon(g.icon)}</span><div class="portal-game-info"><small>${g.sub}</small><div class="booth-title"><h2>${g.title}</h2><span>${g.id==='vale'?'Four battlefields':g.id==='merge'?'Best score · '+fmt(S.mergeBest):'Victories · '+fmt(S.defenseWins)}</span></div><div class="portal-prizes"><span>${uiIcon('gold')}${g.gold}</span><span>${uiIcon('wishes')}${g.wishes}</span><span>${uiIcon('exp')}${g.xp}</span></div><button class="primary" onclick="go('${g.id}')">${uiIcon('play')}Play</button></div></article>`).join('')}</div><button class="game-info-button" onclick="miniGameRules()">${uiIcon('quests')}How to play</button>`);}
function miniGameRules(){modal(`<h2>Choose your adventure</h2><h3>${uiIcon('castle')}Castle Defense</h3><p>Protect your crystal through 8 waves. Tap a platform to build an archer, frost mage or sun defender. Upgrade between waves.</p><p>Victory: 800 gold · 250 wishes · 100 XP. Partial rewards for cleared waves.</p><h3>${uiIcon('dragon')}Dragon Merge</h3><p>Drop matching eggs into the nest. Merge them into a celestial dragon. Keep the stack low. Finish to collect your score rewards, up to 1,200 gold plus a 500 gold celestial bonus.</p><h3>Crownfall Vale</h3><p>${VALE_HELP}</p><h3>Harvest Pairs</h3><p>Tap two matching ingredients joined by a line with no more than two turns. Clear six baskets, each larger than the last. 300 gold · 30 XP, plus 200 gold under 1:30.</p>`);}

function gameShell(title,sub,controls,arenaActions=''){document.body.dataset.playing=screen;const inDungeon=screen==='dungeon'&&sub.startsWith('DUNGEON'),inSpar=sub.startsWith('FRIENDLY');$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">${sub}</p><h1>${title}</h1></div><button class="dungeon-back" onclick="go('${inDungeon?'dungeons':inSpar?'world':'games'}')">${uiIcon('back')}${inDungeon?'Other dungeons':inSpar?'Realm':'Mini Games'}</button></div><div class="game-layout"><div><div class="game-hud" id="hud"></div><div class="canvas-wrap"><canvas id="game" width="720" height="520" aria-label="${title} touch game"></canvas>${arenaActions}</div></div><aside class="panel game-action-dock"><div class="controls">${controls}</div><p class="rules" id="gameHelp" hidden></p><div class="row game-panel-actions"><button onclick="showGameHelp()">${uiIcon('quests')}Help</button><button id="pauseBtn" onclick="togglePause()">${uiIcon('pause')}Pause</button><button id="finishBtn" onclick="requestFinish()">${uiIcon('close')}Finish</button></div></aside></div>`}
function showGameHelp(){if(game&&!game.ended){gamePaused=true;$('#pauseBtn').innerHTML=uiIcon('play')+'Resume'}modal('<h2>How to play</h2><p>'+esc($('#gameHelp').textContent)+'</p><p>Close this window and tap Resume to continue.</p>')}
function togglePause(){if(!game||game.ended)return;gamePaused=!gamePaused;$('#pauseBtn').innerHTML=uiIcon(gamePaused?'play':'pause')+(gamePaused?'Resume':'Pause')}
document.addEventListener('visibilitychange',()=>{if(document.hidden&&game&&!game.ended){gamePaused=true;$('#pauseBtn').innerHTML=uiIcon('play')+'Resume'}if(document.hidden&&cloudReady)syncCloud()});
function finishEarly(){if(!game||game.ended)return;if(screen==='vale')endVale(false);else if(screen==='defense')endDefense(false);else if(game.kind==='battle')endBattle(false);else endMerge(false)}
function motionAllowed(){return !(typeof window.matchMedia==='function'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)}
function gameLoop(update,draw){
 const canvas=$('#game');
 function fitCanvas(){
  const box=canvas.getBoundingClientRect();
  const scale=Math.min(3,Math.max(1,box.width*(window.devicePixelRatio||1)/720));
  const w=Math.round(720*scale),h=Math.round(520*scale);
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
  const ctx=canvas.getContext('2d');ctx.setTransform(w/720,0,0,h/520,0,0);
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
 }
 if(canvas.getContext){fitCanvas();if(typeof ResizeObserver!=='undefined'){const observer=new ResizeObserver(fitCanvas);observer.observe(canvas);canvas._resize=observer;}}
 let prev=0;const frame=t=>{if(!game)return;const dt=prev?Math.min((t-prev)/1000,game.kind==='merge'||game.kind==='defense'?.1:.035):0;prev=t;if(!gamePaused&&!game.ended)update(dt);if(!game)return;draw();if(gamePaused){const c=$('#game').getContext('2d');c.fillStyle='#142a36bb';c.fillRect(0,0,720,520);c.fillStyle='#fff4d2';c.font='32px WonderDisplay';c.textAlign='center';c.fillText('Adventure paused',360,255);c.font='16px WonderStory';c.fillText('Tap Resume to continue',360,290)}loop=requestAnimationFrame(frame)};loop=requestAnimationFrame(frame)}
const sceneImage=typeof Image!=='undefined'?new Image():null,unitImage=typeof Image!=='undefined'?new Image():null,petImage=typeof Image!=='undefined'?new Image():null;if(sceneImage){sceneImage.src='assets/sunny-garden.webp';unitImage.src='assets/ranger-cartoon.webp';petImage.src='assets/dragon-cartoon.webp'}
const TOWERS=[{name:'Archer',cost:60,color:'#e7ce95',damage:14,rate:.72,range:560},{name:'Frost Mage',cost:90,color:'#a3deee',damage:9,rate:1.1,range:510},{name:'Sun Tower',cost:130,color:'#f5a97d',damage:35,rate:1.6,range:450}];
function startDefense(){gameShell('Guard the Grove','CASTLE DEFENSE · 8 WAVES','<div id="defenseVitals" class="defense-vitals"></div><div id="defenderSelection" class="defender-selection"></div>'+TOWERS.map((t,i)=>`<button class="defender-choice" id="tower${i}" onclick="selectTower(${i})">${portrait(['reina','nyra','kael'][i])}<strong>${t.name}</strong><span>${uiIcon('exp')}${t.cost}</span></button>`).join('')+`<button id="upgradeTower" onclick="upgradeTower()">${uiIcon('enhance')}Upgrade selected tower<small>Select a placed tower first.</small></button><button id="waveBtn" class="primary" onclick="nextWave()">${uiIcon('play')}Start wave 1</button>`);game={kind:'defense',running:true,ended:false,wave:0,cleared:0,hp:12,energy:220,towers:[],enemies:[],shots:[],spawn:0,left:0,active:false,choice:0,selected:-1,clock:0,kills:0,damageBonus:(1+Math.min(.75,stats().attack/1500))*(1+stats().damageBonus/100),id:0};$('#gameHelp').textContent='Choose a defender, then tap a glowing platform. Tap a placed tower to select it for upgrades. Protect the crystal on the left. Tap falling suns for 25 extra energy. Build between waves. Your hero grants +'+Math.round((game.damageBonus-1)*100)+'% tower damage.';const canvas=$('#game');canvas.addEventListener('pointerdown',e=>{if(game?.kind!=='defense'||game.ended||gamePaused)return;const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)*720/r.width,y=(e.clientY-r.top)*520/r.height;if(collectGroveSun(game,x,y))return;let best=null,dist=55;for(let lane=0;lane<3;lane++)for(let col=0;col<3;col++){const p={lane,col,x:150+col*105,y:150+lane*130},d=Math.hypot(p.x-x,p.y-y);if(d<dist){best=p;dist=d}}if(!best)return;const idx=game.towers.findIndex(t=>t.lane===best.lane&&t.col===best.col);if(idx>=0){game.selected=idx;updateDefenseControls();toast('Selected '+TOWERS[game.towers[idx].type].name+' +'+game.towers[idx].level);return}const t=TOWERS[game.choice];if(game.energy<t.cost){toast('Not enough energy');return}game.energy-=t.cost;game.towers.push({...best,type:game.choice,cd:.1,level:1,shotAt:-100});miniEvent(game,best.x,best.y,'Built','#ffdf9c');game.selected=game.towers.length-1;updateDefenseHUD()});selectTower(0);updateDefenseHUD();gameLoop(updateDefense,drawDefense)}
function selectTower(i){if(!game||game.kind!=='defense')return;game.choice=i;game.selected=-1;TOWERS.forEach((_,j)=>$('#tower'+j).classList.toggle('selected',j===i));updateDefenseControls()}
function upgradeTower(){if(!game||game.kind!=='defense'||game.ended||gamePaused)return;const t=game.towers[game.selected];if(!t){toast('Tap a placed tower to select it');return}if(t.level>=4){toast('This tower is fully upgraded');return}const cost=45*t.level;if(game.energy<cost){toast('Upgrade needs '+cost+' energy');return}game.energy-=cost;t.level++;miniEvent(game,t.x,t.y,'Level '+t.level,'#ffe9a6');addImpact(game,t.x,t.y-25,'#ffe9a6','heal');updateDefenseHUD();toast('Tower upgraded to +'+t.level)}
function nextWave(){if(!game||game.kind!=='defense'||game.active||game.ended||gamePaused)return;game.wave++;game.left=6+game.wave*2;game.spawn=.4;game.active=true;game.banner={text:'WAVE '+game.wave+(game.wave===8?' · BOSS APPROACHING':''),life:1.7};$('#waveBtn').disabled=true;$('#waveBtn').innerHTML=uiIcon('castle')+'Wave '+game.wave+' in progress';updateDefenseHUD()}
function updateDefenseHUD(){if(!game)return;paintGameHTML('#defenseVitals',metric('exp','Energy',game.energy)+metric('health','Crystal',game.hp+' / 12')+metric('castle','Wave',game.wave+' / 8'));paintGameHTML('#hud',metric('castle','Wave',game.wave+' / 8')+metric('health','Crystal',game.hp+' / 12')+metric('exp','Energy',game.energy)+metric('dungeons','Defeated',game.kills));updateDefenseControls();}

function endDefense(won){const g=game;if(!g||g.ended)return;g.ended=true;g.running=false;g.won=won;updateDefenseControls();const gold=won?800:g.cleared*70,tickets=won?250:g.cleared*20,xp=won?100:g.cleared*10;if(won)S.defenseWins++;const gearReward=won||g.cleared>0?globalThis.WonderGear.grant(S,'defense',won):null;const earned=gain(gold,tickets,xp);modal(`<p class="eyebrow">${won?'VICTORY':'ADVENTURE COMPLETE'}</p><h2>${won?'A little courage. A great victory.':'Every adventure makes you stronger.'}</h2><p>${g.cleared} of 8 waves cleared</p><div class="rewards"><span class="reward">${gold} gold</span><span class="reward">${tickets} wishes</span><span class="reward">${earned.xp} XP</span>${equipmentRewardHtml(gearReward)}</div><button onclick="$('#modal').close();openScreen('defense')">Play again</button>`)}
const EGGS=[{r:21,c:'#91ed91',name:'Dewdrop'},{r:27,c:'#70d9ff',name:'Sky pearl'},{r:34,c:'#c99cff',name:'Moon egg'},{r:42,c:'#ff9fc6',name:'Blossom egg'},{r:52,c:'#ffcf60',name:'Sun egg'},{r:63,c:'#70eedb',name:'Aurora egg'},{r:76,c:'#ad83ff',name:'Dragon heart'},{r:92,c:'#ffe998',name:'Celestial dragon'}];
function startMerge(){gameShell('A Little Wonder','DRAGON MERGE · TOUCH TO DROP',`<div class="next-egg-card"><p class="eyebrow">NEXT EGG</p><div id="nextEgg"></div></div><div id="eggJourney" class="egg-journey" aria-label="Dragon evolution"></div><button class="primary" id="dropEgg" onclick="mergeDrop()">${uiIcon('dragon')}Drop egg</button><button id="mergeBreeze" onclick="mergeNudge()">${uiIcon('wind')}Gentle breeze · 1 per run</button>`);game={kind:'merge',running:true,ended:false,balls:[],score:0,next:Math.floor(Math.random()*3),queued:Math.floor(Math.random()*3),dropX:360,cooldown:0,overflow:0,clock:0,nudged:false,won:false,fx:[]};$('#gameHelp').textContent='Drag or tap above the nest to aim. Release to drop. Matching eggs merge on contact. Keep the stack low. A celestial dragon ends the run with a bonus. Tap Collect to keep your earned rewards.';const canvas=$('#game');let activePointer=null;const aim=e=>{const r=canvas.getBoundingClientRect();game.dropX=Math.max(102+EGGS[game.next].r,Math.min(618-EGGS[game.next].r,(e.clientX-r.left)*720/r.width))};canvas.addEventListener('pointerdown',e=>{if(!game||game.kind!=='merge'||gamePaused||game.ended||activePointer!==null)return;activePointer=e.pointerId;aim(e);canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(e.pointerId===activePointer&&game?.kind==='merge')aim(e)});canvas.addEventListener('pointerup',e=>{if(e.pointerId===activePointer&&game?.kind==='merge'){activePointer=null;aim(e);mergeDrop()}});canvas.addEventListener('pointercancel',e=>{if(e.pointerId===activePointer)activePointer=null});mergeHUD();gameLoop(updateMerge,drawMerge)}
function mergeHUD(){const g=game;paintGameHTML('#hud',metric('laurel','Score',fmt(g.score))+metric('ranking','Best',fmt(S.mergeBest))+metric('gold','Gold',fmt(mergeReward(g).gold)));paintGameHTML('#nextEgg',`<span class="egg-preview generated-egg-preview" style="--egg-col:${g.queued%4};--egg-row:${Math.floor(g.queued/4)}"></span><strong>${EGGS[g.queued].name}</strong>`);updateMergeControls();}

function mergeDrop(){const g=game;if(!g||g.kind!=='merge'||g.ended||gamePaused||g.cooldown>0)return;const k=g.next,r=EGGS[k].r;g.balls.push({x:Math.max(102+r,Math.min(618-r,g.dropX)),y:80,r,k,vx:0,vy:0,age:0,angle:0,spin:0,squash:0});g.next=g.queued;g.queued=Math.floor(Math.random()*3);g.cooldown=.65;mergeHUD()}
function mergeNudge(){const g=game;if(!g||g.kind!=='merge'||g.ended||gamePaused)return;if(g.nudged){toast('The breeze has already visited');return}g.nudged=true;miniEvent(g,360,260,'A gentle breeze','#b9f3e7');for(const b of g.balls){b.vx+=(Math.random()-.5)*160;b.vy-=70}updateMergeControls();toast('A gentle breeze stirs the nest')}
function drawEgg(c,x,y,r,k){generatedEgg(c,x,y,r,k);}
function endMerge(won){const g=game;if(!g||g.ended)return;g.ended=true;g.running=false;g.won=won;updateMergeControls();S.mergeBest=Math.max(S.mergeBest,g.score);const prizes=mergeReward(g),gold=prizes.gold,tickets=prizes.wishes,xp=prizes.xp;const gearReward=g.score>0?globalThis.WonderGear.grant(S,'merge',won,g.score):null;const earned=gain(gold,tickets,xp);modal(`<p class="eyebrow">${won?'A STAR FAWN':'ADVENTURE COMPLETE'}</p><h2>${won?'A little wonder hatched.':'Every dream starts small.'}</h2><p>Score ${fmt(g.score)} · Best ${fmt(S.mergeBest)}</p><div class="rewards"><span class="reward">${gold} gold</span><span class="reward">${tickets} wishes</span><span class="reward">${earned.xp} XP</span>${equipmentRewardHtml(gearReward)}</div><button onclick="$('#modal').close();openScreen('merge')">Play again</button>`)}
async function settings(){$('#main').innerHTML=`<div class="topline"><div><p class="eyebrow">YOUR ADVENTURE JOURNAL</p><h1>Journal</h1></div><span class="badge">Your adventure, saved</span></div>${sectionArtwork('scene-settings','Your magical journal and cloud save crystal')}<div class="split"><div><section class="panel"><h2>${uiIcon('settings')}Your story</h2><div class="journal-avatar">${portrait('reina')}</div><label>Hero name<input id="heroName" maxlength="24" value="${esc(S.name)}"></label><button onclick="rename()">Save name</button><p style="margin-top:16px">Level ${level()} · ${fmt(S.xp)} XP<br>${S.dungeonWins||0} dungeon victories · ${S.sparWins||0} friendly spar wins<br>${S.defenseWins} Castle Defense victories<br>Dragon Merge best: ${fmt(S.mergeBest)}<br>${S.owned.length} / ${ITEMS.length} wonders collected</p></section>${typeof location!=='undefined'&&new URLSearchParams(location.search).get('debug')==='1'?`<section class="panel" style="margin-top:18px"><p class="eyebrow">FREE PROTOTYPE GIFT</p><h2>More room to explore.</h2><p>Unlimited test gifts. No payment, no advertisements.</p><button class="primary" onclick="testGift()">Claim 3,000 gold + 5,000 wishes</button></section>`:''}</div><div><section class="panel"><h2>Your progress, kept safe.</h2><p id="cloudState">${esc(cloudStatus)}</p><div class="row"><button onclick="syncCloud(true)">Sync now</button><button onclick="downloadSave()">Export save</button><button onclick="$('#importFile').click()">Import save</button></div><input type="file" id="importFile" accept=".json,application/json" hidden onchange="importSave(this)"><p class="rules" style="margin-top:14px">Cloud progress belongs to your signed-in account. A local copy is kept on this device. Export a backup before clearing browser storage. Concurrent-device edits show a conflict instead of overwriting progress.</p><div id="conflictActions"></div></section><section class="panel" style="margin-top:18px"><p class="eyebrow">HEROES & AI ADVENTURERS</p><h2>${uiIcon('ranking')}Hall of Wonders</h2><button onclick="go('rankings')">Full rankings</button><div id="leaderboard"><p>Loading the hall…</p></div><p class="rules">Opt-in prototype leaderboard. Test gifts are allowed; this is a friendly collection showcase.</p><button onclick="publishProfile()">Share my hero in the hall</button></section></div></div>`;loadLeaderboard();if(cloudBlocked)showConflict()}
function rename(){const n=$('#heroName').value.trim();if(!n){toast('Please enter a name');return}S.name=n.slice(0,24);save();toast('Hero name saved')}
function testGift(){gain(3000,5000,0);toast('Test gift received. Have fun exploring!')}
function downloadSave(){const b=new Blob([JSON.stringify(S,null,2)],{type:'application/json'}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download='wings-of-wonder-save.json';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000)}
async function importSave(input){const f=input.files?.[0];if(!f)return;try{if(f.size>30000)throw Error();const s=JSON.parse(await f.text());if(!valid(s))throw Error();modal(`<h2>Restore this adventure?</h2><p>${esc(s.name)} · Level ${globalThis.WonderProgress.level(s.xp)} · ${s.owned.length} wonders<br>Your current progress will be replaced.</p><button class="primary" id="confirmImport">Restore save</button>`);$('#confirmImport').onclick=()=>{s.revision=cloudRevision;S=normalizeAdventure(s);save();$('#modal').close();settings();toast('Adventure restored')};}catch{toast('This save file is invalid or incompatible.')}input.value=''}
const startupState=JSON.stringify(S);
function comparable(s){const c={...s};delete c.revision;delete c.updated;return JSON.stringify(c)}
async function initCloud(){try{const r=await fetch('/api/save');if(!r.ok)throw Error();const b=await r.json();cloudRevision=b.revision||0;if(b.save&&valid(b.save)){const remote=normalizeAdventure(b.save);if(comparable(remote)!==comparable(S)){const untouched=JSON.stringify(S)===startupState&&S.updated===0&&!game;if(untouched){S=remote;S.revision=b.revision;try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}else{cloudBlocked=true;cloudStatus='Different local and cloud adventures found. Choose which to keep in your journal.'}}}cloudReady=true;cloudStatus=cloudBlocked?cloudStatus:'Cloud connected · progress saved to your account';if(!game)render();else wallet();if(!cloudBlocked)syncCloud();else{if(screen==='settings')showConflict()}}catch{cloudStatus='Local save active. Cloud connection is not available yet.';if(screen==='settings')settings()}}
async function syncCloud(manual=false){if(manual&&!cloudReady){await initCloud();if(!cloudReady){toast(cloudStatus);return false}}if(!cloudReady||cloudBusy||cloudBlocked){if(manual&&!cloudBlocked)toast(cloudStatus);if(cloudBlocked&&screen==='settings')showConflict();return false}cloudBusy=true;const data=JSON.parse(JSON.stringify(S)),snapshot=data.updated;try{const r=await fetch('/api/save',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({save:data,revision:cloudRevision})});if(r.status===409){cloudBlocked=true;cloudStatus='Another device saved newer progress. Choose which adventure to keep.';if(screen==='settings')showConflict();return false}if(!r.ok)throw Error();const b=await r.json();cloudRevision=b.revision;S.revision=b.revision;try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}cloudStatus='Cloud saved · '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});if(manual)toast('Cloud save complete');if(S.updated!==snapshot)setTimeout(syncCloud,1000);return true}catch{cloudStatus='Cloud temporarily unavailable. Your local save is safe.';if(manual)toast(cloudStatus);return false}finally{cloudBusy=false;if($('#cloudState'))$('#cloudState').textContent=cloudStatus}}
function showConflict(){if(!$('#conflictActions'))return;$('#cloudState').textContent=cloudStatus;$('#conflictActions').innerHTML='<button onclick="resolveCloud(false)">Use cloud adventure</button> <button onclick="resolveCloud(true)">Keep this device adventure</button>'}
async function resolveCloud(keepLocal){try{const r=await fetch('/api/save');if(!r.ok)throw Error();const b=await r.json();cloudRevision=b.revision;if(!keepLocal&&valid(b.save)){S=normalizeAdventure(b.save);S.revision=b.revision;try{localStorage.setItem(KEY,JSON.stringify(S))}catch{}}cloudBlocked=false;cloudStatus='Cloud connected';wallet();if(keepLocal){S.updated=Date.now();await syncCloud()}settings();toast('Save conflict resolved')}catch{toast('Cannot reach the cloud. Try again later.')}}
async function loadLeaderboard(){await loadRankingPlayers();if(!$('#leaderboard'))return;$('#leaderboard').innerHTML=rankingMarkup(true);}

async function publishProfile(){if(!cloudReady||cloudBlocked){toast('Connect and sync your cloud save first');return}if(!await syncCloud()){toast('Save to the cloud before sharing your hero.');return}try{const r=await fetch('/api/leaderboard',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!r.ok)throw Error();toast('Your hero joined the Hall of Wonders');loadLeaderboard()}catch{toast('The hall is unavailable. Please try again.')}}
render();initCloud().finally(()=>{
 if(S.fishCards===undefined){
  const legacy=MoonwaterFish.deviceRecords();
  if(Object.keys(legacy).length){S.fishCards=legacy;save();if(!game && screen!=='fishing')render()}
 }
});
