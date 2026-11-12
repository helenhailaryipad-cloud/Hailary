/* Shared level cap and daily EXP-entry rules. Existing XP keeps its value. */
'use strict';
globalThis.WonderProgress=(()=>{
const maxLevel=1500,xpPerLevel=150,xpCap=(maxLevel-1)*xpPerLevel;
const level=xp=>Math.min(maxLevel,1+Math.floor(Math.max(0,xp)/xpPerLevel));
const day=now=>new Date(now===undefined?Date.now():now).toISOString().slice(0,10);
function validDaily(a){return a===undefined||!!a&&typeof a.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(a.day)&&Number.isFinite(Date.parse(a.day))&&new Date(a.day).toISOString().slice(0,10)===a.day&&Number.isInteger(a.used)&&a.used>=0&&a.used<=2&&Number.isSafeInteger(a.completed)&&a.completed>=0&&a.completed<=1e9;}
function daily(s,now){const today=day(now);return s.expDungeon?.day===today?{...s.expDungeon}:{day:today,used:0,completed:s.expDungeon?.completed||0};}
function consume(s,now){if(level(s.xp)>=maxLevel)return false;const a=daily(s,now);if(a.used>=2)return false;a.used++;s.expDungeon=a;return true;}
function award(s,base,bonus=0){const amount=Math.max(0,Math.min(Math.max(0,xpCap-s.xp),Math.floor(base*(1+bonus/100))));s.xp+=amount;return amount;}
return {maxLevel,xpPerLevel,xpCap,level,day,validDaily,daily,consume,award};
})();
