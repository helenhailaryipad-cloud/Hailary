'use strict';
let pendingRetreat=null;
function paintGameHTML(selector,html){const node=$(selector);if(node&&node.innerHTML!==html){node.innerHTML=html;node.__wonderPaint=html;}}
function metric(icon,label,value){return `<span class="hud-metric">${uiIcon(icon)}<span><small>${label}</small><b>${value}</b></span></span>`;}
function mergeReward(g){return {gold:Math.min(1200,Math.floor(g.score/2))+(g.won?500:0),wishes:Math.min(300,Math.floor(g.score/8))+(g.won?100:0),xp:Math.min(120,Math.floor(g.score/15))};}
function requestFinish(){if(!game||game.ended)return;if(game.kind==='merge'){finishEarly();return;}pendingRetreat={game,paused:gamePaused};$('#modal').addEventListener('close',()=>{if(pendingRetreat)cancelFinish()},{once:true});gamePaused=true;paintGameHTML('#pauseBtn',uiIcon('play')+'Resume');const exp=game.mode==='exp',defense=game.kind==='defense';popup(`<div class="leave-pop"><span class="leave-ico">${uiIcon('back')}</span><h2>${defense?'Finish this defense?':game.kind==='vale'?'Leave the vale?':'Retreat from battle?'}</h2><p>${game.kind==='vale'?'The campaign ends without rewards.':exp?'Today\'s entry is already used. Retreating gives no EXP.':defense?'You keep the rewards for waves already cleared.':'You keep the rewards for cleared halls.'}</p><div class="leave-actions"><button class="leave-stay" onclick="cancelFinish()">${denPlain}${uiIcon('play')}Keep playing</button><button class="leave-go" onclick="confirmFinish()">${denPlain}${uiIcon('back')}${defense?'Finish':'Retreat'}</button></div></div>`);$('#modal').classList.add('leave-modal');}
function cancelFinish(){const pending=pendingRetreat;pendingRetreat=null;$('#modal').close();if(pending&&game===pending.game&&!game.ended){gamePaused=pending.paused;paintGameHTML('#pauseBtn',uiIcon(gamePaused?'play':'pause')+(gamePaused?'Resume':'Pause'));}}
function confirmFinish(){const pending=pendingRetreat;pendingRetreat=null;$('#modal').close();if(pending&&game===pending.game&&!game.ended)finishEarly();}
function enemyTapBounds(g){const e=g.crawl?.enemy;if(!e)return null;const boss=!!g.enemy?.boss;return {left:e.x-(boss?181:104),right:e.x+(boss?181:104),top:e.y-(boss?252:158),bottom:e.y+16};}
function hitsDungeonEnemy(g,x,y){const b=enemyTapBounds(g);return !!b&&g.enemy.hp>0&&x>=b.left&&x<=b.right&&y>=b.top&&y<=b.bottom;}
function defenseControlState(g){const t=g.towers[g.selected],price=t&&t.level<4?45*t.level:null;return {tower:t,name:t?TOWERS[t.type].name:TOWERS[g.choice].name,cost:price,max:!!t&&t.level>=4,canUpgrade:!!t&&price!==null&&g.energy>=price&&!g.ended&&!gamePaused};}
function updateDefenseControls(){const g=game;if(!g||g.kind!=='defense')return;const v=defenseControlState(g),button=$('#upgradeTower');if(button){button.disabled=!v.canUpgrade;paintGameHTML('#upgradeTower',uiIcon('enhance')+`<span>${v.max?'Fully upgraded':v.tower?'Upgrade · '+v.cost:'Select a defender'}<small>${v.tower?v.name+' · Level '+v.tower.level:'Tap a placed defender to upgrade'}</small></span>`);}for(let i=0;i<TOWERS.length;i++){const b=$('#tower'+i);if(b){b.disabled=g.energy<TOWERS[i].cost||g.ended||gamePaused;b.setAttribute('aria-pressed',String(i===g.choice&&g.selected<0));}}paintGameHTML('#defenderSelection',`${uiIcon(v.tower?'enhance':['hero','crystals','shield'][g.choice])}<span><strong>${v.name}${v.tower?' · Lv.'+v.tower.level:''}</strong><small>${v.tower?'Selected defender':TOWERS[g.choice].cost+' energy · Tap an empty platform'}</small></span>`);}
function updateMergeControls(){const g=game;if(!g||g.kind!=='merge')return;const drop=$('#dropEgg'),breeze=$('#mergeBreeze');if(drop){drop.disabled=g.ended||gamePaused||g.cooldown>0;paintGameHTML('#dropEgg',uiIcon('dragon')+(g.cooldown>0?'Ready in '+g.cooldown.toFixed(1)+'s':'Drop egg'));}if(breeze){breeze.disabled=g.ended||gamePaused||g.nudged;paintGameHTML('#mergeBreeze',uiIcon('wind')+(g.nudged?'Breeze used':'Breeze · 1 left'));}const reward=mergeReward(g);paintGameHTML('#finishBtn',uiIcon('gold')+'Collect · '+fmt(reward.gold));const highest=Math.max(0,...g.balls.map(b=>b.k));paintGameHTML('#eggJourney',EGGS.map((egg,k)=>`<span class="evolution-egg ${k<=highest?'discovered':''}" title="${egg.name}"><span class="generated-egg-preview" style="--egg-col:${k%4};--egg-row:${Math.floor(k/4)}"></span><small>${k+1}</small></span>`).join(''));}
function addImpact(g,x,y,color='#ffe0a0',kind='impact'){if(!motionAllowed())return;g.hitFX=g.hitFX||[];g.hitFX.push({x,y,color,kind,life:.4});if(g.hitFX.length>16)g.hitFX.splice(0,g.hitFX.length-16);}
function tickImpacts(g,dt){if(g.hitFX)g.hitFX=g.hitFX.filter(p=>(p.life-=dt)>0);}
function paintImpacts(c,g){if(!motionAllowed())return;c.save();c.globalCompositeOperation='screen';for(const p of g.hitFX||[]){c.globalAlpha=Math.min(1,p.life*4);const size=40+(1-p.life/.4)*55;c.shadowColor=p.color;c.shadowBlur=14;drawRasterFX(c,p.kind,p.x,p.y,size);
    if(p.kind==='impact'){
      const progress=1-p.life/.4;
      c.fillStyle=p.color;
      c.globalCompositeOperation='lighter';
      for(let i=0;i<7;i++){
        const angle=i*Math.PI*2/7+p.x*.03;
        const radius=(10+i%3*5)*progress;
        c.beginPath();
        c.arc(p.x+Math.cos(angle)*radius,p.y+Math.sin(angle)*radius,2.3*(1-progress)+.3,0,Math.PI*2);
        c.fill();
      }
    }}c.restore();}
function canvasPill(c,text,x,y,width=190,color='#513724e8'){c.save();c.fillStyle=color;c.fillRect(x-width/2,y-19,width,36);c.strokeStyle='#f4d28c';c.lineWidth=1;c.strokeRect(x-width/2,y-19,width,36);c.font='bold 17px WonderStory';c.textAlign='center';c.fillStyle='#fff3cc';c.fillText(text,x,y+5,width-12);c.restore();}
// The back anchor follows the actual contained image, never viewport percentages.
function rangerBackAnchor(imageBox,naturalWidth,naturalHeight,stageBox){const scale=Math.min(imageBox.width/naturalWidth,imageBox.height/naturalHeight),w=naturalWidth*scale,h=naturalHeight*scale;return {x:imageBox.left-stageBox.left+(imageBox.width-w)/2+w*.5,y:imageBox.top-stageBox.top+(imageBox.height-h)/2+h*.32};}
