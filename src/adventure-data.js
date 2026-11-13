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
const wheel=[{label:'150 gold',gold:150,color:'#d75163'},{label:'50 wishes',tickets:50,color:'#745bb4'},{label:'1 synthesis stone',synthesis:1,color:'#dc874b'},{label:'12 crystals',stone:12,color:'#369e9b'},{label:'400 gold',gold:400,color:'#cf537c'},{label:'100 wishes',tickets:100,color:'#627bcc'},{label:'700 gold',gold:700,color:'#bd8740'},{label:'2 gems',gem:2,color:'#49a37c'}];
const fresh=()=>({clears:{},claimed:[],pending:0,spins:0,contracts:0});
const int=n=>Number.isSafeInteger(n)&&n>=0&&n<=1e9;
const staminaLimit=5;
function dailyDungeon(s,now){
 const day=WonderProgress.day(now),record=s.adventure?.dungeonDay;
 return record?.day===day?record:{day,spent:0,wins:0};
}
function spendStamina(s,now){
 const daily=dailyDungeon(s,now);
 if(daily.spent>=staminaLimit)return false;
 state(s).dungeonDay={...daily,spent:daily.spent+1};return true;
}
function valid(a){return a===undefined||!!a&&(a.dungeonDay===undefined||(a.dungeonDay&&/^\d{4}-\d{2}-\d{2}$/.test(a.dungeonDay.day)&&int(a.dungeonDay.spent)&&a.dungeonDay.spent<=staminaLimit&&int(a.dungeonDay.wins)))&&(a.forgeQuest===undefined||(a.forgeQuest&&/^\d{4}-\d{2}-\d{2}$/.test(a.forgeQuest.day)&&int(a.forgeQuest.wins)&&a.forgeQuest.wins<=2&&int(a.forgeQuest.claimed)&&a.forgeQuest.claimed<=a.forgeQuest.wins))&&!!a.clears&&typeof a.clears==='object'&&!Array.isArray(a.clears)&&Object.keys(a.clears).length<=ids.length&&Object.entries(a.clears).every(([id,n])=>ids.includes(id)&&int(n))&&Array.isArray(a.claimed)&&a.claimed.length<=quests.length&&new Set(a.claimed).size===a.claimed.length&&a.claimed.every(id=>quests.some(q=>q.id===id))&&['pending','spins','contracts'].every(k=>int(a[k]));}
function state(s){if(!s.adventure)s.adventure=fresh();return s.adventure;}
function progress(s,q){const a=s.adventure||fresh();return q.kind==='wins'?s.dungeonWins||0:q.kind==='unique'?Object.values(a.clears).filter(n=>n>0).length:q.kind==='defense'?s.defenseWins:q.kind==='merge'?s.mergeBest:a.spins;}
function dailyForge(s){
 const day=globalThis.WonderProgress.day(),previous=s.adventure?.forgeQuest;
 return previous?.day===day?previous:{day,wins:0,claimed:0};
}
function claimForge(s){const daily=dailyForge(s),amount=daily.wins-daily.claimed;if(amount<=0)return 0;
 const eq=globalThis.WonderGear.state(s);s.equipment=eq;eq.materials.synthesis+=amount;
 daily.claimed=daily.wins;state(s).forgeQuest=daily;return amount;}
function victory(s,id){if(!ids.includes(id))return 0;const a=state(s),first=!a.clears[id];a.clears[id]=(a.clears[id]||0)+1;a.pending++;const today=dailyDungeon(s);a.dungeonDay={...today,wins:today.wins+1};const daily=dailyForge(s);daily.wins=Math.min(2,daily.wins+1);a.forgeQuest=daily;return first?500+ids.indexOf(id)*150:0;}
function claim(s,id){const a=state(s),q=quests.find(q=>q.id===id);if(!q||a.claimed.includes(id)||progress(s,q)<q.target)return 0;a.claimed.push(id);s.gold+=q.gold;return q.gold;}
function contract(s){const a=state(s);if(Math.floor((s.dungeonWins||0)/3)<=a.contracts)return 0;a.contracts++;s.gold+=900;return 900;}
function spin(s,random=Math.random){const a=state(s);if(a.pending<1)return null;const index=Math.min(7,Math.max(0,Math.floor(random()*8))),reward=wheel[index];a.pending--;a.spins++;s.gold+=reward.gold||0;s.tickets+=reward.tickets||0;if(reward.synthesis||reward.stone||reward.gem){const eq=globalThis.WonderGear.state(s);s.equipment=eq;eq.materials.synthesis+=reward.synthesis||0;eq.materials.stone+=reward.stone||0;eq.materials.gem+=reward.gem||0;}return {index,...reward};}
globalThis.WonderAdventure={ids,quests,wheel,staminaLimit,dailyDungeon,spendStamina,fresh,valid,state,progress,victory,claim,contract,spin,dailyForge,claimForge};
})();
