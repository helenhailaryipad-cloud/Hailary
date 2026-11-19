'use strict';
const CRAWL_ROOMS=['Outer Gate','Guardian Hall','Boss Sanctum'];
const BOSS_STANDOFF = 265;
// This lane leaves room above a fully extended wing and below the boss's feet.
const BOSS_LANE = {right:520, top:358, bottom:390};
// Reina's deployed pets (the three Primary Pets) come into every hall with her. They trail behind her and, once the
// enemy is engaged, each sends a bolt every 2.4 s for 35% of its own ATK. This is on top of the ATK they lend Reina.
const PET_SPOTS=[[-66,12],[-120,-24],[-140,40]],PET_HIT=.35,PET_PACE=2.4;
function petArtId(id){return Number(id.slice(1))>3?'familiar-'+id.slice(1):id}
function crawlPets(g){
 const a=g.crawl;if(a.pets)return a.pets;
 const ids=typeof WonderGear==='undefined'||typeof S==='undefined'?[]:WonderGear.petTeam(S).slice(0,3).filter(Boolean);
 a.pets=ids.map((id,i)=>({id,i,x:a.hero.x+PET_SPOTS[i][0],y:a.hero.y+PET_SPOTS[i][1],cd:1.2+i*.8,kick:0}));a.petShots=[];
 return a.pets;
}
function movePets(g,dt){
 const a=g.crawl,h=a.hero,shift=g.ally?-44:0;
 for(const p of crawlPets(g)){
  const tx=Math.max(34,h.x+PET_SPOTS[p.i][0]+shift),ty=Math.max(238,Math.min(412,h.y+PET_SPOTS[p.i][1])),k=Math.min(1,dt*(4.4-p.i*.7));
  p.moving=Math.hypot(tx-p.x,ty-p.y)>4;p.x+=(tx-p.x)*k;p.y+=(ty-p.y)*k;p.kick=Math.max(0,p.kick-dt);
 }
 for(const shot of a.petShots)shot.life-=dt;a.petShots=a.petShots.filter(shot=>shot.life>0);
}
function petSupport(g,dt){
 const a=g.crawl;if(!a||g.ended||a.exitReady||!a.engaged||g.enemy.hp<=0||g.transition>0)return false;
 const pets=crawlPets(g);
 if(pets.length&&!a.petsHailed){a.petsHailed=true;battleLog(pets.map(p=>item(p.id).name).join(', ')+(pets.length>1?' fight':' fights')+' beside REINA.');}
 for(const p of pets){
  p.cd-=dt;if(p.cd>0)continue;p.cd=PET_PACE;p.kick=.28;
  a.petShots.push({x:p.x+16,y:p.y-34,tx:a.enemy.x,ty:a.enemy.y-(g.enemy.boss?110:70),life:.36,max:.36,color:item(p.id).color});
  battleDamage(Math.round(WonderGear.petAttack(S,p.id)*PET_HIT));
  if(g.ended||a.exitReady||g.transition>0)return true;
 }
 return false;
}
function drawCrawlPet(c,g,p){
 const still=!motionAllowed(),hop=still?0:p.moving?Math.abs(Math.sin(g.clock*9+p.i*1.7))*7:Math.sin(g.clock*2.6+p.i*2)*2+2,lunge=still?0:p.kick*46;
 c.save();c.fillStyle='rgba(20,28,40,.34)';c.beginPath();c.ellipse(p.x,p.y+6,28-hop*.6,7,0,0,Math.PI*2);c.fill();
 drawArtSprite(c,petArtId(p.id),p.x+lunge,p.y+7-hop,76,76);c.restore();
}
function setupCrawl(g){g.crawl={hero:{x:118,y:330,tx:285,ty:310},enemy:{x:520,y:300},engaged:false,exitReady:false,shots:[],danger:null,roomTime:0};}
function crawlRoom(g){const a=g.crawl;a.hero={x:118,y:330,tx:285,ty:310};a.enemy={x:520,y:g.stage===2?BOSS_LANE.top:300};a.engaged=false;a.exitReady=false;a.shots=[];a.danger=null;a.roomTime=0;g.transition=0;if(a.pets){for(const p of a.pets){p.x=a.hero.x+PET_SPOTS[p.i][0];p.y=a.hero.y+PET_SPOTS[p.i][1];p.cd=1.2+p.i*.8;p.kick=0}a.petShots=[]}}
function moveRanger(x,y){const g=game;if(!g?.crawl||g.ended||gamePaused||!Number.isFinite(x)||!Number.isFinite(y))return;g.crawl.hero.tx=Math.max(84,Math.min(640,x));g.crawl.hero.ty=Math.max(235,Math.min(406,y));}
function beginCrawlDodge(g){
 const {hero,enemy,danger}=g.crawl;
 const targetY=danger?.y??enemy.y;
 let direction=hero.y>=targetY?1:-1;
 if(hero.y+direction*52>406||hero.y+direction*52<235)direction=-direction;
 hero.tx=hero.x;
 hero.ty=hero.y+direction*52;
 hero.dodgeUntil=g.clock+.22;
}
function walkDungeon(){const g=game;if(!g?.crawl||g.ended||gamePaused)return;if(g.crawl.exitReady)moveRanger(639,316);else moveRanger(Math.max(100,g.crawl.enemy.x-(g.enemy.boss ? BOSS_STANDOFF : 195)),g.crawl.enemy.y);}
function bindCrawlInput(canvas){canvas.tabIndex=0;canvas.setAttribute('aria-label','Dungeon room. Tap the floor to move, tap an enemy to attack. Arrow keys move, E follows the path.');let pointer=null;const point=e=>{const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*720/r.width,y:(e.clientY-r.top)*520/r.height};};canvas.addEventListener('pointerdown',e=>{if(game?.kind!=='battle'||!game.crawl||game.ended||gamePaused||pointer!==null)return;pointer=e.pointerId;canvas.setPointerCapture?.(pointer);const p=point(e),a=game.crawl;if(a.exitReady&&Math.hypot(p.x-649,p.y-316)<43){walkDungeon();return;}if(!a.exitReady&&hitsDungeonEnemy(game,p.x,p.y)){walkDungeon();battleSkill('burst');}else moveRanger(p.x,p.y);});canvas.addEventListener('pointermove',e=>{if(e.pointerId===pointer&&game?.crawl){const p=point(e);moveRanger(p.x,p.y);}});for(const event of ['pointerup','pointercancel'])canvas.addEventListener(event,()=>{pointer=null;});canvas.addEventListener('keydown',e=>{const g=game;if(!g?.crawl||g.ended||gamePaused)return;const delta={ArrowLeft:[-75,0],ArrowRight:[75,0],ArrowUp:[0,-55],ArrowDown:[0,55],a:[-75,0],d:[75,0],w:[0,-55],s:[0,55]}[e.key];if(delta){e.preventDefault();moveRanger(g.crawl.hero.x+delta[0],g.crawl.hero.y+delta[1]);}else if(e.key.toLowerCase()==='e'){e.preventDefault();walkDungeon();}});}
function crawlShot(g,enemy=false,burst=false,strike=null){
 const a=g.crawl;
 if(!enemy)g.heroShotAt=g.clock;
 if(!a||(!strike&&!motionAllowed()))return;
 const h=a.hero,e=a.enemy;
 const from=enemy?(g.enemy.boss?bossMouthPosition(g):{x:e.x,y:e.y-90}):dungeonBowAim(g);
 const target=strike?.danger||h;
 const to=enemy?{x:target.x,y:target.y-88}:{x:e.x,y:e.y-(g.enemy.boss?120:85)};
 const life=enemy?.45:.75;
 a.shots.push({...from,tx:to.x,ty:to.y,life,max:life,enemy,burst,strike});
 
}
function updateCrawl(g,dt){const a=g.crawl;a.roomTime+=dt;movePets(g,dt);for(const p of a.shots)p.life-=dt;const impacts=a.shots.filter(p=>p.strike&&p.life<=0);a.shots=a.shots.filter(p=>p.life>0);const h=a.hero;
if(g.enemy.boss && g.enemy.hp>0 && !a.exitReady) h.tx=Math.min(h.tx,a.enemy.x-BOSS_STANDOFF);
const dist=Math.hypot(h.tx-h.x,h.ty-h.y),step=Math.min(dist,(h.dodgeUntil>g.clock?320:180)*dt);if(dist>.5){h.x+=(h.tx-h.x)/dist*step;h.y+=(h.ty-h.y)/dist*step;}
for(const p of impacts){if(!a.exitReady)enemyStrike(p.strike.multiplier,p.strike.special,p.strike.danger);if(g.ended)return true;}
for(const shot of a.shots){
 if(shot.enemy||shot.released)continue;
 const aim=dungeonBowAim(g);
 Object.assign(shot,{x:aim.x,y:aim.y,tx:a.enemy.x,ty:a.enemy.y-(g.enemy.boss?120:85)});
 if(shot.life<=.37)shot.released=true;
}
if(a.exitReady){if(h.x>610&&Math.abs(h.y-316)<65){g.stage++;crawlRoom(g);battleEnemy();battleLog(g.stage===2?'The final door opens. The boss awaits!':'A new hall opens before you.');}return true;}
let gap=Math.hypot(h.x-a.enemy.x,h.y-a.enemy.y);if(gap<310)a.engaged=true;if(!a.engaged)return true;
if(g.telegraph<=0 && g.enemy.boss){
  // Keep the entire boss silhouette clear of the archer, including across lanes.
  const targetX=Math.max(390,Math.min(BOSS_LANE.right,h.x+BOSS_STANDOFF));
  const targetY=Math.max(BOSS_LANE.top,Math.min(BOSS_LANE.bottom,h.y));
  const dx=targetX-a.enemy.x,dy=targetY-a.enemy.y;
  const distance=Math.hypot(dx,dy);
  if(distance>0){
    const step=Math.min(1,42*dt/distance);
    a.enemy.x+=dx*step;
    a.enemy.y+=dy*step;
  }
}else if(g.telegraph<=0 && gap>145){
  const travel=Math.min(gap-145,58*dt);
  a.enemy.x+=(h.x-a.enemy.x)/gap*travel;
  a.enemy.y+=(h.y-a.enemy.y)/gap*travel;
}
return false;}
function crawlHUD(g){const a=g.crawl;if(!a)return;const buttons=$('#crawlCombatButtons');if(buttons)buttons.hidden=a.exitReady||g.ended;
 const heal=$('#skillHeal');if(heal)heal.hidden=g.hp>=g.maxhp||a.exitReady||g.ended;
 const dodged=g.particles.some(p=>p.text==='EVADED'||p.text==='DODGED');
 const warning=(g.telegraph>0||a.shots.some(p=>p.strike?.special))&&!a.exitReady&&!g.ended;
 const cue=g.ended?(g.won?'Boss defeated':'Retreat'):a.exitReady?'Hall cleared':warning&&g.evade<=0?(g.dodgeCD>0?'Incoming strike! Move aside':'Incoming strike! Tap Dodge'):dodged?'Dodged!':g.evade>0?'Evading':a.engaged?'Tap the enemy to attack':'Tap the floor to move';
 const cueEl=$('#crawlCue');if(cueEl&&cueEl.textContent!==cue)cueEl.textContent=cue;
 const dodge=$('#skillDodge');if(dodge?.dataset)dodge.dataset.warning=String(warning);
const route=$('#dungeonRoute');if(route)paintGameHTML('#dungeonRoute',CRAWL_ROOMS.map((label,i)=>`<span class="${i===g.stage?'current':i<g.stage?'cleared':''}">${i<g.stage?uiIcon('check'):i+1} ${label}</span>`).join('<b>›</b>'));const objective=$('#dungeonObjective');if(objective)objective.textContent=g.ended?(g.won?'Boss defeated! Your treasure is ready.':'Retreat, upgrade and try again.'):a.exitReady?'Hall cleared! Tap the glowing arrow on the right.':g.stage===2?'Final boss: '+g.enemy.name+' · Dodge the incoming strike!':a.engaged?'Defeat the guardian to open the next hall.':'Explore the hall. Tap the floor to guide REINA.';}
function drawCrawl(c,g){const a=g.crawl,h=a.hero,e=a.enemy,index=Math.max(0,DUNGEONS.findIndex(d=>d.id===g.source)),color=g.dungeon.color; c.clearRect(0,0,720,520);const bg=c.createLinearGradient(0,0,0,520);bg.addColorStop(0,['#416b74','#626783','#925c68'][index%3]);bg.addColorStop(1,'#233e59');c.fillStyle=bg;c.fillRect(0,0,720,520);
drawArtScene(c,'battle-dungeon',720,520,1);
// Soften the painted scenery before drawing the combatants and effects.
c.fillStyle='rgba(33,48,58,.08)';c.fillRect(0,77,720,375);
// End doorway opens only after the guardian is defeated.
c.save();
if(a.exitReady){
  c.shadowColor='#ffcf60';
  c.shadowBlur=motionAllowed()?12+3*Math.sin(g.clock*3):12;
}
drawAtlasIcon(c,a.exitReady?'play':'lock',649,316,62);
c.restore();

if(g.enemy.hp>0){c.save();c.translate(e.x,e.y);c.scale(g.enemy.boss?.88:.68,g.enemy.boss?.88:.68);c.translate(-520,-290);drawDungeonCreature(c,{...g,clock:motionAllowed()?g.clock:0});c.restore();if(!g.enemy.boss){c.fillStyle='#193444';c.fillRect(e.x-52,e.y-175,104,7);c.fillStyle=color;c.fillRect(e.x-52,e.y-175,104*g.enemy.hp/g.enemy.maxhp,7);}}

// Pets standing farther back are drawn before Reina, nearer ones after her.
const crew=crawlPets(g);for(const p of crew)if(p.y<=h.y)drawCrawlPet(c,g,p);
c.save();
c.shadowColor='rgba(40,31,48,.78)';
c.shadowBlur=3;
c.shadowOffsetY=1;
drawReina(c,g,h.x,h.y+5,135,180);
c.restore();
for(const p of crew)if(p.y>h.y)drawCrawlPet(c,g,p);
for(const shot of motionAllowed()?a.petShots:[]){const t=1-shot.life/shot.max,x=shot.x+(shot.tx-shot.x)*t,y=shot.y+(shot.ty-shot.y)*t-Math.sin(t*Math.PI)*20;c.save();c.globalCompositeOperation='lighter';for(const [r,alpha] of [[20,.55],[11,1]]){const glow=c.createRadialGradient(x,y,0,x,y,r);glow.addColorStop(0,'#ffffff');glow.addColorStop(.4,shot.color);glow.addColorStop(1,'rgba(255,255,255,0)');c.globalAlpha=alpha;c.fillStyle=glow;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}c.restore();}
if(g.expRun?.party.length>1){const ally=ADVENTURERS.find(b=>b.id===g.expRun.party[1]);drawArtSprite(c,ally.id,h.x+55,h.y,65,105);}if(g.ally){drawArtSprite(c,g.ally.id,h.x-55,h.y,65,105);}
for(const p of motionAllowed()?a.shots:[]){if(!p.enemy&&p.life>.37)continue;const t=p.enemy?1-p.life/p.max:Math.max(0,1-p.life/.37),x=p.x+(p.tx-p.x)*t,dy=p.ty-p.y,initial=bowSlope*Math.abs(p.tx-p.x),y=p.y+(p.enemy?dy*t:initial*t+(dy-initial)*t*t);drawSpell(c,p.enemy?'fire':'arrow',x,y,p.burst?98:70,45,g.clock,Math.atan2(p.enemy?dy:initial+2*(dy-initial)*t,p.tx-p.x));}
for(const fx of motionAllowed()?g.effects:[]){if(fx.type==='dodge')continue;c.save();c.globalAlpha=Math.min(1,fx.life*2);if(fx.type==='beam'){drawRasterFX(c,'impact',e.x,e.y-60,100);}else drawSpell(c,fx.type==='heal'?'heal':'wind',h.x,h.y-45,150,130,g.clock);c.restore();}paintImpacts(c,g);drawBattleAtmosphere(c,g);c.globalAlpha=1;
for(const p of g.particles){
 if(p.text==='EVADED'||p.text==='DODGED')continue;
 if(p.bossDamage){
  const age=1-p.life, moving=motionAllowed();
  const x=p.x+(moving?p.direction*36*age:0);
  const y=p.y+(moving?-38*age*(2-age):30*age);
  c.save();c.globalAlpha=Math.min(1,p.life*3);c.textAlign='center';
  c.font='bold '+(p.burst?33:28)+'px WonderStory';c.lineWidth=4;c.lineJoin='round';
  c.strokeStyle='#532e27';c.fillStyle=p.burst?'#ffd46a':'#fff3ce';
  c.strokeText(p.text,x,y);c.fillText(p.text,x,y);c.restore();continue;
 }
 c.globalAlpha=Math.min(1,p.life);c.fillStyle=p.color;c.font='bold 24px WonderStory';c.strokeStyle='#24445c';c.lineWidth=3;c.strokeText(p.text,p.x,p.y);c.fillText(p.text,p.x,p.y);}c.globalAlpha=1;
c.fillStyle='#4c3024ed';c.fillRect(0,0,720,77);const heroHealth=Math.max(0,Math.min(1,g.hp/g.maxhp));c.fillStyle='#38251c';c.fillRect(12,8,218,61);c.fillStyle='#fff';c.font='bold 18px WonderStory';c.textAlign='left';drawAtlasIcon(c,'hero',40,31,46);c.font='bold 13px WonderStory';c.textAlign='center';c.fillText('Lv. '+level(),40,62);c.textAlign='left';c.font='bold 16px WonderStory';c.fillText('HP '+Math.ceil(Math.max(0,g.hp))+' / '+g.maxhp,71,31,151);c.fillStyle='#2c1d17';c.fillRect(71,40,150,14);c.fillStyle=heroHealth>.5?'#79ee96':heroHealth>.25?'#ffce70':'#ff6d83';c.fillRect(73,42,146*heroHealth,10);c.strokeStyle='#fff5d4';c.lineWidth=2;c.strokeRect(71,40,150,14);if(g.maxshield>0){c.fillStyle='#7fe9ff';c.fillRect(71,58,150*Math.max(0,g.shield/g.maxshield),4);}c.fillStyle='#fff';c.font='bold 24px WonderStory';c.textAlign='center';c.fillText(CRAWL_ROOMS[g.stage]+' · '+(g.stage+1)+' / 3',470,30,450);c.font='bold 19px WonderStory';c.fillStyle='#fff0b1';c.fillText(g.stage===2?'BOSS · '+g.enemy.name:g.enemy.name,470,58,450);if(g.enemy.boss){c.fillStyle='#152c43';c.fillRect(250,64,430,12);c.fillStyle=color;c.fillRect(250,64,430*g.enemy.hp/g.enemy.maxhp,12);}}
