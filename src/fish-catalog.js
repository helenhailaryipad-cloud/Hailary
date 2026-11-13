// IDs, catch weights (kg) and per-copy attributes are shared by the lagoon and the hero save.
globalThis.MoonwaterFish = (() => {
 const bonuses={
  hp:{key:'health',amount:2,label:'HP'},atk:{key:'attack',amount:1,label:'ATK'},
  def:{key:'defense',amount:1,label:'DEF'},ward:{key:'shieldHealth',amount:1,label:'Shield HP'},
  tide:{key:'elementalAttack',amount:1,label:'Elemental ATK'},reef:{key:'elementalDefense',amount:1,label:'Elemental DEF'}
 };
 const families={
  minnow:'Reed shallows',trout:'Moonlit streams',carp:'Lotus pools',sailfish:'Open lagoon',ray:'Sandy flats',
  shark:'Outer reef',eel:'Rock crevices',horse:'Seagrass beds',puffer:'Coral gardens',angler:'Twilight depths',
  crab:'Tide pools',lobster:'Kelp forest',shrimp:'Reef shallows',octopus:'Reef caves',squid:'Open water',
  jelly:'Drifting waters',star:'Rock pools',shell:'Shell banks',turtle:'Warm shallows',slug:'Coral ledges',
  whale:'Deep channel',butterfly:'Coral gardens',anemone:'Tide pools',urchin:'Urchin barrens',manta:'Blue channel'
 };
 const rows=`
Silver Minnow|minnow|hp|0.2|1.6
Moonfin Trout|trout|atk|1.3|8
Jade Carp|carp|def|3|16
Star Sailfish|sailfish|tide|14|75
Pearl Seahorse|horse|ward|0.02|0.11
Honeycomb Puffer|puffer|def|0.3|2.4
Saffron Hermit Crab|crab|reef|0.06|0.5
Glasswing Shrimp|shrimp|hp|0.01|0.09
Ribbon Moray|eel|atk|0.3|3.5
Blue Velvet Nudibranch|slug|tide|0.01|0.12
Copper Skillet Ray|ray|ward|1.4|8
Peach Moon Jelly|jelly|hp|0.1|1.2
Coral Lace Butterflyfish|butterfly|reef|0.09|0.5
Ruby Cushion Star|star|def|0.2|1.8
Inkcap Octopus|octopus|atk|0.4|5
Mossback Pond Turtle|turtle|def|0.6|7
Frostglass Anchovy|minnow|ward|0.02|0.19
Garnet River Char|trout|hp|0.8|5.4
Golden Lotus Koi|carp|reef|1.2|12
Indigo Fan Marlin|sailfish|atk|35|190
Porcelain Spotted Ray|ray|reef|2|15
Velvet Catshark|shark|atk|0.6|4
Lantern Garden Eel|eel|tide|0.03|0.26
Leafveil Seadragon|horse|ward|0.05|0.32
Spiny Chestnut Burrfish|puffer|def|0.4|3.6
Candlewick Frogfish|angler|tide|0.3|2.4
Emerald Fiddler Crab|crab|atk|0.02|0.13
Roseclaw Lobster|lobster|def|0.7|7
Firecracker Pistol Shrimp|shrimp|atk|0.02|0.14
Mimic Sand Octopus|octopus|ward|0.4|2.8
Silver Arrow Squid|squid|atk|0.3|3.8
Violet Compass Jelly|jelly|tide|0.2|2.7
Sunray Brittle Star|star|reef|0.02|0.3
Opal Scallop|shell|ward|0.08|0.6
Amber Hawksbill|turtle|def|18|82
Lemon Ribbon Slug|slug|hp|0.01|0.15
Sapphire Pilot Whale|whale|hp|310|1100
Crown Bannerfish|butterfly|tide|0.09|0.45
Blush Bead Anemone|anemone|hp|0.03|0.25
Plum Pencil Urchin|urchin|def|0.06|0.42
Midnight Reef Manta|manta|ward|60|420
Mirror Smelt|minnow|reef|0.04|0.38
Dappled Brook Salmon|trout|atk|1.4|12
Vermilion Tench|carp|hp|0.5|6
Crescent Spearfish|sailfish|atk|8|45
Frost Petal Skate|ray|def|2|18
Copper Hammerhead|shark|tide|18|140
Stormglass Conger|eel|atk|2|25
Briar Pipehorse|horse|reef|0.01|0.08
Moonstone Boxfish|puffer|ward|0.15|1.1
Ember Lanternfish|angler|tide|0.02|0.18
Snowcap Spider Crab|crab|def|1|12
Blue Reef Crayfish|lobster|reef|0.2|2
Candystripe Cleaner Shrimp|shrimp|hp|0.01|0.06
Silk Blanket Octopus|octopus|ward|0.3|4
Copper Bobtail Squid|squid|tide|0.03|0.21
Crystal Bell Jelly|jelly|ward|0.1|1.4
Apricot Sunflower Star|star|hp|0.8|7
Tiger Cowrie|shell|def|0.03|0.25
Olive Ridley Turtle|turtle|reef|18|58
Glacier Sea Hare|slug|hp|0.15|3
Aurora Narwhal|whale|tide|420|1500
Goldmask Angelfish|butterfly|ward|0.2|1.6
Jade Dahlia Anemone|anemone|reef|0.1|1.2
Scarlet Fire Urchin|urchin|atk|0.08|0.5
Spotted Eagle Ray|manta|reef|15|85
Obsidian Needlefish|minnow|atk|0.1|1.6
Ivory Cutthroat Trout|trout|def|0.6|7
Bronze River Bream|carp|hp|0.3|4
Sundial Swordfish|sailfish|atk|30|220
Sandveil Electric Ray|ray|tide|2|23
Pearlspot Whale Shark|shark|hp|650|3500
Saffron Snake Eel|eel|reef|0.2|2
Amethyst Pygmy Seahorse|horse|ward|0.01|0.03
Stargazer Porcupinefish|puffer|def|0.5|4
Blackwater Angler|angler|tide|0.4|4
Blue Porcelain Crab|crab|ward|0.01|0.08
Gold Slipper Lobster|lobster|def|0.4|3
Peacock Mantis Shrimp|shrimp|atk|0.1|0.5
Dusk Dumbo Octopus|octopus|hp|0.5|5.5
Prism Reef Cuttlefish|squid|ward|0.2|4
Lionmane Jelly|jelly|tide|1|22
Cobalt Knobbed Star|star|reef|0.2|2
Rose Chambered Nautilus|shell|def|0.4|1.5
Starlit Leatherback|turtle|hp|150|600
Flame Plume Sea Slug|slug|tide|0.01|0.09
Pearl Beluga|whale|ward|380|1250
Tangerine Clownfish|butterfly|hp|0.02|0.18
Goldtip Torch Anemone|anemone|tide|0.1|0.9
Velvet Heart Urchin|urchin|reef|0.03|0.21
Crescent Devil Ray|manta|atk|9|65
Orchid Flying Fish|minnow|ward|0.2|1.2
Rainshadow Steelhead|trout|reef|2|14
Siltwhisker Catfish|carp|hp|2|32
Abyssal Thresher|shark|atk|35|240
Sunspoke Crown Star|star|def|0.6|4.5
Glass Paper Nautilus|octopus|ward|0.03|0.4
Dewdrop Comb Jelly|jelly|hp|0.02|0.32
Peacock Giant Clam|shell|reef|15|160
Moonshadow Blue Whale|whale|hp|8000|60000`.trim().split('\n');
 const species=rows.map(row=>{
  const [name,form,stat,low,high]=row.split('|');
  return {id:name.toLowerCase().replaceAll(' ','-'),name,form,water:families[form],bonus:bonuses[stat],min:Number(low),max:Number(high)};
 });
 const byId=new Map(species.map(f=>[f.id,f]));
 function valid(records){
  return records===undefined || (records!==null && typeof records==='object' && !Array.isArray(records) &&
   Object.entries(records).every(([id,r])=>byId.has(id) && r && Object.keys(r).length===2 &&
    Number.isSafeInteger(r.count) && r.count>0 && r.count<=1e8 && Number.isFinite(r.kg) && r.kg>0 && r.kg<=byId.get(id).max));
 }
 function migrateLegacy(raw){
  const result={};
  for(const f of species.slice(0,4)){
   const entry=raw?.[f.name];if(!entry)continue;
   const record={count:entry.count,kg:entry.kg};
   if(valid({[f.id]:record}))result[f.id]=record;
  }
  return result;
 }
 function recordCatch(records,id,kg){
  const fish=byId.get(id);
  if(!fish || !Number.isFinite(kg) || kg<fish.min || kg>fish.max)throw Error('Invalid catch');
  const old=records[id]||{count:0,kg:0};
  records[id]={count:old.count+1,kg:Math.max(old.kg,kg)};
  return old;
 }
 function totals(records){
  const values={};
  for(const [id,r] of Object.entries(records||{})){
   const b=byId.get(id).bonus;values[b.key]=(values[b.key]||0)+r.count*b.amount;
  }
  return values;
 }
 function deviceRecords(){
  try{
   const saved=JSON.parse(localStorage.getItem('moonwater-cards-v1'));
   if(saved && valid(saved))return saved;
   return migrateLegacy(JSON.parse(localStorage.getItem('wonder-fishing-records-v1')));
  }catch{return {}}
 }
 const artUrl=fish=>'assets/moonwater/'+fish.id+'.avif';
 return {species,byId,bonuses,valid,migrateLegacy,recordCatch,totals,deviceRecords,artUrl};
})();
