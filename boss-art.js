'use strict';
const BOSS_NAMES={mistwood:'Thornwing Guardian',moonfall:'The Hollow Moon',emberpeak:'Ashen Crown',coral:'Pearlfin Empress',frost:'Snowbell Matriarch',honey:'Honeythorn King',storm:'Tempest Roc',crystal:'Prism Antler',sunspire:'Aurelion the Dawnkeeper',keeper:'Keeper of Starlight'};
// Mouth centres in the trimmed artwork, measured from its upper left corner.
const bossMouths={mistwood:[.17,.35],moonfall:[.20,.40],emberpeak:[.13,.45],
 coral:[.21,.23],frost:[.15,.28],honey:[.29,.34],storm:[.26,.30],
 crystal:[.23,.35],sunspire:[.19,.38],keeper:[.17,.30]};
function bossMouthPosition(g){
 const id=g.mode==='exp'?'keeper':(g.dungeon?.art||g.source), anchor=bossMouths[id]||[.22,.35];
 const bounds=globalThis.WonderArtMeta?.[id]?.bounds;
 const e=g.crawl.enemy;
 if(!anchor||!bounds)return {x:e.x,y:e.y-100};
 const scale=.88*Math.min(410/bounds[2],285/bounds[3]);
 const t=motionAllowed()?g.clock||0:0;
 return {x:e.x+(anchor[0]-.5)*bounds[2]*scale*(1+.018*Math.sin(2*t)),
         y:e.y+(anchor[1]-1)*bounds[3]*scale*(1+.012*Math.sin(2*t+.5))};
}
function bossArtMarkup(id){return artImage(DUNGEONS.find(d=>d.id===id)?.art||id,BOSS_NAMES[id]||WonderGear.tierGuardians.find(g=>g.id===id)?.name||'Dungeon boss','boss-generated-portrait');}
function bossPortrait(id){return artBitmap(DUNGEONS.find(d=>d.id===id)?.art||id);}
function drawMajesticBoss(c,g){c.save();c.shadowColor=g.flash>0?'#fff3ba':g.enemy.color;c.shadowBlur=g.flash>0?22:7;const t=motionAllowed()?g.clock||0:0;c.translate(520,290);c.scale(1+Math.sin(t*2)*.018,1+Math.sin(t*2+.5)*.012);c.translate(-520,-290);const ok=drawArtSprite(c,g.mode==='exp'?'keeper':(g.dungeon?.art||g.source),520,290,410,285);c.restore();return ok;}
function inspectBoss(id){const d=DUNGEONS.find(d=>d.id===id);if(!d)return;const mechanic=d.mechanic==='heal'?'Restores health once':d.mechanic==='shield'?'Armored against burst damage':d.mechanic==='fast'?'Fast power strikes':'Power strike · Move out of the danger zone';modal(`<div class="boss-inspection"><p class="eyebrow">FINAL DUNGEON GUARDIAN</p><h2>${d.boss}</h2><div class="boss-inspection-art" style="--boss-glow:${d.color}">${bossArtMarkup(id)}</div><p>${d.name} · Unlocks at Lv. ${d.recommended}</p><p class="boss-mechanic">${mechanic}</p>${bossLootPreview(id)}${bossEntryButton(d,true)}</div>`);}
