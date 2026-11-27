'use strict';
(()=>{
const ids=Object.keys(globalThis.WonderGear.bossLootTables);
const quests=[
{id:'first',name:'First light',desc:'Defeat your first dungeon boss.',kind:'wins',target:1,gold:600},
{id:'hunter',name:'Boss hunter',desc:'Defeat 5 dungeon bosses.',kind:'wins',target:5,gold:1500},
{id:'legend',name:'A growing legend',desc:'Defeat 15 dungeon bosses.',kind:'wins',target:15,gold:3500},
{id:'explorer',name:'Beyond the garden',desc:'Clear 3 different dungeons.',kind:'unique',target:3,gold:1800},
{id:'cartographer',name:'Sky cartographer',desc:'Clear 9 different dungeons.',kind:'unique',target:9,gold:5000},
{id:'defender',name:'Guardian of the grove',desc:'Win Castle Defense twice.',kind:'defense',target:2,gold:1600},
{id:'merger',name:'Dragon dreamer',desc:'Reach 600 points in Dragon Merge.',kind:'merge',target:600,gold:1000},
{id:'treasure',name:'Fortune finder',desc:'Spin the boss reward wheel 5 times.',kind:'spins',target:5,gold:1200}];
const wheel=[{label:'88 prisms',prisms:88,kind:'prism'},{label:'15 Starlit Vouchers',voucher:15,kind:'voucher'},{label:'2 Wish Tickets',wish:2,kind:'wish'},{label:'10 Starlit Vouchers',voucher:10,kind:'voucher'},{label:'88 prisms',prisms:88,kind:'prism'},{label:'20 crystals',stone:20,kind:'stone'},{label:'3 Wish Tickets',wish:3,kind:'wish'},{label:'30 Starlit Vouchers',voucher:30,kind:'voucher'},{label:'88 prisms',prisms:88,kind:'prism'},{label:'700 gold',gold:700,kind:'gold'},{label:'2 Wish Tickets',wish:2,kind:'wish'},{label:'10 Starlit Vouchers',voucher:10,kind:'voucher'}];
// Boss Roulette (user photos of the reference's boss roulette: three 88-prism fields on a 12-field wheel, a spin never
// lands on a claimed field, spins come from daily boss-kill milestones, everything resets at 00:00 UTC). Boss kills =
// dungeon guardians beaten today (each costs boss energy) (addBossKill). Optional save fields: a.wheelDay, a.wheelOpen
// [field indices claimed today], a.wheelGot [milestone indices claimed today], a.bossDay {day,n}, a.wheelSkip.
const WHEEL_STEPS=[1,2,3,4,5,6,8,10,12,15,20,30];
function wheelToday(s){const a=state(s),day=globalThis.WonderProgress.day();if(a.wheelDay!==day){a.wheelDay=day;a.wheelOpen=[];a.wheelGot=[]}return a;}
function bossKills(s){const a=s.adventure||{},day=globalThis.WonderProgress.day();return a.bossDay?.day===day?a.bossDay.n:0;}
function addBossKill(s,n=1){const a=state(s),day=globalThis.WonderProgress.day();a.bossDay={day,n:bossKills(s)+n};}
function stepClaim(s,i){const a=wheelToday(s);if(!(i>=0&&i<WHEEL_STEPS.length)||a.wheelGot.includes(i)||bossKills(s)<WHEEL_STEPS[i])return 0;a.wheelGot.push(i);a.pending++;return 1;}
function stepClaimAll(s){let n=0;for(let i=0;i<WHEEL_STEPS.length;i++)n+=stepClaim(s,i);return n;}
const fresh=()=>({clears:{},claimed:[],pending:0,spins:0,contracts:0});
const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;
// Boss energy (user: "300 energy free a day = 15 bosses; to open the whole roulette you need 30 bosses, so you buy
// 300 more; 60 prisms per 10 energy; sometimes the Secret Shop has it for 28 prisms, 90% off"). A dungeon guardian
// entry costs ENERGY_BOSS. The free ENERGY_DAY refills at 00:00 UTC (dungeonDay.spent counts it); bought energy waits
// in a.energyExtra (kept across days) and is used after the free energy. The deal shows on some UTC days
// (dealOn), once per day (a.energyDeal = day bought). Numbers are placeholders.
const staminaLimit=300,ENERGY_BOSS=20,ENERGY_BUY={n:10,price:60},ENERGY_DEAL={n:50,price:28,was:300};
function dailyDungeon(s,now){
 const day=WonderProgress.day(now),record=s.adventure?.dungeonDay;
 return record?.day===day?record:{day,spent:0,wins:0};
}
function energyFree(s,now){return Math.max(0,staminaLimit-dailyDungeon(s,now).spent);}
function energyLeft(s,now){return energyFree(s,now)+(s.adventure?.energyExtra||0);}
function spendStamina(s,now){
 const daily=dailyDungeon(s,now),free=Math.max(0,staminaLimit-daily.spent),extra=s.adventure?.energyExtra||0;
 if(free+extra<ENERGY_BOSS)return false;
 const take=Math.min(free,ENERGY_BOSS),a=state(s);a.dungeonDay={...daily,spent:daily.spent+take};if(ENERGY_BOSS>take)a.energyExtra=extra-(ENERGY_BOSS-take);return true;
}
function buyEnergy(s,packs=1){packs=Math.max(1,Math.floor(packs));const price=packs*ENERGY_BUY.price;if((s.scales||0)<price)return 0;s.scales-=price;const a=state(s);a.energyExtra=(a.energyExtra||0)+packs*ENERGY_BUY.n;return packs*ENERGY_BUY.n;}
function dealOn(day=WonderProgress.day()){let h=7;for(const c of day)h=(h*31+c.charCodeAt(0))%1000003;return h%3===0;}
function buyDeal(s){const day=WonderProgress.day(),a=state(s);if(!dealOn(day)||a.energyDeal===day||(s.scales||0)<ENERGY_DEAL.price)return 0;s.scales-=ENERGY_DEAL.price;a.energyExtra=(a.energyExtra||0)+ENERGY_DEAL.n;a.energyDeal=day;return ENERGY_DEAL.n;}
function valid(a){return a===undefined||!!a&&(a.dungeonDay===undefined||(a.dungeonDay&&/^\d{4}-\d{2}-\d{2}$/.test(a.dungeonDay.day)&&int(a.dungeonDay.spent)&&a.dungeonDay.spent<=staminaLimit&&int(a.dungeonDay.wins)))&&(a.forgeQuest===undefined||(a.forgeQuest&&/^\d{4}-\d{2}-\d{2}$/.test(a.forgeQuest.day)&&int(a.forgeQuest.wins)&&a.forgeQuest.wins<=2&&int(a.forgeQuest.claimed)&&a.forgeQuest.claimed<=a.forgeQuest.wins))&&!!a.clears&&typeof a.clears==='object'&&!Array.isArray(a.clears)&&Object.keys(a.clears).length<=ids.length&&Object.entries(a.clears).every(([id,n])=>ids.includes(id)&&int(n))&&Array.isArray(a.claimed)&&a.claimed.length<=quests.length&&new Set(a.claimed).size===a.claimed.length&&a.claimed.every(id=>quests.some(q=>q.id===id))&&['pending','spins','contracts'].every(k=>int(a[k]))&&(a.wheelOpen===undefined||Array.isArray(a.wheelOpen)&&a.wheelOpen.length<=wheel.length&&new Set(a.wheelOpen).size===a.wheelOpen.length&&a.wheelOpen.every(i=>int(i)&&i<wheel.length))&&(a.wheelGot===undefined||Array.isArray(a.wheelGot)&&new Set(a.wheelGot).size===a.wheelGot.length&&a.wheelGot.every(i=>int(i)&&i<WHEEL_STEPS.length))&&(a.wheelDay===undefined||/^\d{4}-\d{2}-\d{2}$/.test(a.wheelDay))&&(a.bossDay===undefined||!!a.bossDay&&/^\d{4}-\d{2}-\d{2}$/.test(a.bossDay.day)&&int(a.bossDay.n))&&(a.energyExtra===undefined||int(a.energyExtra))&&(a.energyDeal===undefined||/^\d{4}-\d{2}-\d{2}$/.test(a.energyDeal))&&(a.wheelSkip===undefined||typeof a.wheelSkip==='boolean')&&(a.wheelBonus===undefined||!!a.wheelBonus&&typeof a.wheelBonus==='object');}
function state(s){if(!s.adventure)s.adventure=fresh();return s.adventure;}
function progress(s,q){const a=s.adventure||fresh();return q.kind==='wins'?s.dungeonWins||0:q.kind==='unique'?Object.values(a.clears).filter(n=>n>0).length:q.kind==='defense'?s.defenseWins:q.kind==='merge'?s.mergeBest:a.spins;}
function dailyForge(s){
 const day=globalThis.WonderProgress.day(),previous=s.adventure?.forgeQuest;
 const record=previous?.day===day?previous:{day,wins:0,claimed:0};
 return {...record,wins:Math.min(2,Math.max(record.wins,dailyDungeon(s).wins))};
}
function claimForge(s){const daily=dailyForge(s),amount=daily.wins-daily.claimed;if(amount<=0)return 0;
 const eq=globalThis.WonderGear.state(s);s.equipment=eq;eq.materials.synthesis+=amount;
 daily.claimed=daily.wins;state(s).forgeQuest=daily;return amount;}
// Ember shards only raise the Ember Drake (6 stars). Once it is at 6 stars a guardian pays EMBER_TO_STAR star shards
// instead of 10 ember shards (economy map 2026-11-27: ember shards had no use after 260).
const EMBER_TO_STAR=5;
function victory(s,id){if(!ids.includes(id))return 0;if((s.emberStars||0)>=6&&globalThis.WonderGear?.state){const eq=globalThis.WonderGear.state(s);s.equipment=eq;eq.materials.shard=(eq.materials.shard||0)+EMBER_TO_STAR}else s.emberShards=(s.emberShards||0)+10;const a=state(s),first=!a.clears[id];a.clears[id]=(a.clears[id]||0)+1;addBossKill(s);const today=dailyDungeon(s),daily=dailyForge(s);a.dungeonDay={...today,wins:today.wins+1};daily.wins=Math.min(2,daily.wins+1);a.forgeQuest=daily;return first?500+ids.indexOf(id)*150:0;}
function claim(s,id){const a=state(s),q=quests.find(q=>q.id===id);if(!q||a.claimed.includes(id)||progress(s,q)<q.target)return 0;a.claimed.push(id);s.gold+=q.gold;return q.gold;}
function contract(s){const a=state(s);if(Math.floor((s.dungeonWins||0)/3)<=a.contracts)return 0;a.contracts++;s.gold+=900;return 900;}
function spin(s,random=Math.random){const a=wheelToday(s);if(a.pending<1||a.wheelOpen.length>=wheel.length)return null;const closed=wheel.map((r,i)=>i).filter(i=>!a.wheelOpen.includes(i)),index=closed[Math.min(closed.length-1,Math.max(0,Math.floor(random()*closed.length)))],reward=wheel[index];a.pending--;a.spins++;a.wheelOpen=[...a.wheelOpen,index];if(typeof trailTick==='function')trailTick('wheel');s.gold+=reward.gold||0;s.scales=(s.scales||0)+(reward.prisms||0);if(reward.voucher&&typeof Rites!=='undefined')Rites.addVouchers(s,reward.voucher);if(reward.wish&&globalThis.WonderGear?.bagAdd)globalThis.WonderGear.bagAdd(s,'wish',reward.wish);if(reward.stone){const eq=globalThis.WonderGear.state(s);s.equipment=eq;eq.materials.stone+=reward.stone}return {index,...reward};}
globalThis.WonderAdventure={ENERGY_BOSS,ENERGY_BUY,ENERGY_DEAL,energyFree,energyLeft,buyEnergy,dealOn,buyDeal,WHEEL_STEPS,wheelToday,bossKills,addBossKill,stepClaim,stepClaimAll,ids,quests,wheel,staminaLimit,dailyDungeon,spendStamina,fresh,valid,state,progress,victory,claim,contract,spin,dailyForge,claimForge};
})();
