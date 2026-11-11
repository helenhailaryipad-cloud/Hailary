import fs from 'node:fs';import vm from 'node:vm';import assert from 'node:assert/strict';import {DatabaseSync} from 'node:sqlite';
const elements=new Map();function el(key){if(!elements.has(key))elements.set(key,{innerHTML:'',textContent:'',value:'',disabled:false,classList:{add(){},remove(){},toggle(){}},close(){this.open=false},showModal(){this.open=true},addEventListener(){},getBoundingClientRect(){return {left:0,top:0,width:720,height:520}}});return elements.get(key)}
const context={console,Math,Date,JSON,Number,String,Array,Object,Set,Blob,URL,Promise,document:{body:{dataset:{}},querySelector:el,addEventListener(){},createElement:()=>({click(){}})},localStorage:{getItem(){return null},setItem(){}},window:{scrollTo(){}},fetch:async()=>({ok:false}),setTimeout:()=>0,clearTimeout(){},requestAnimationFrame:()=>1,cancelAnimationFrame(){}};vm.createContext(context);
vm.runInContext(fs.readFileSync('src/app.js','utf8'),context);
vm.runInContext(`
S=defaults();S.tickets=100000;const initial=S.tickets;
for(let i=0;i<30;i++)roll(10);
if(S.rolls!==300||S.scales!==3000||S.guarantees!==1||S.claimed.length!==5)throw Error('Gacha thresholds');
const ret=400+740+1240+1240+1240;if(S.tickets<initial-15000+ret)throw Error('Milestone return');
const before=S.scales;const candidate=ITEMS.find(i=>!S.owned.includes(i.id));if(candidate){claimReward('scales',candidate.id);if(S.scales!==before-2000||!S.owned.includes(candidate.id))throw Error('Exchange');const after=S.scales;claimReward('scales',candidate.id);if(S.scales!==after)throw Error('Duplicate exchange');}
if(!valid(S))throw Error('Generated save invalid');
S=defaults();openScreen('defense');game.cleared=3;const goldBefore=S.gold;endDefense(false);endDefense(false);if(S.gold!==goldBefore+210)throw Error('Defense reward duplicated');
openScreen('defense');nextWave();for(let i=0;i<300;i++)updateDefense(1/60);if(!game.enemies.length)throw Error('Defense spawning');
openScreen('merge');game.score=320;const mergeBefore=S.gold;endMerge(false);endMerge(false);if(S.gold!==mergeBefore+160)throw Error('Merge reward duplicated');
openScreen('merge');game.balls=[{x:350,y:470,r:17,k:0,vx:0,vy:0,age:3},{x:370,y:470,r:17,k:0,vx:0,vy:0,age:3}];updateMerge(1/60);if(game.score!==20||game.balls.length!==1||game.balls[0].k!==1)throw Error('Egg merge');for(let i=0;i<600;i++)updateMerge(1/60);if(!game.balls.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.y<=488))throw Error('Physics unstable');
`,context);
console.log('PASS: wish milestones, guaranteed choice, exchange, duplicate rewards, tower spawning, merge and physics.');
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('drizzle/0000_wonder.sql','utf8').replaceAll('--> statement-breakpoint',''));
const env={DB:{prepare(sql){
 const stmt=db.prepare(sql);let args=[];
 return {bind(...a){args=a;return this},async first(){return stmt.get(...args)||null},async all(){return {results:stmt.all(...args)}},async run(){return {meta:{changes:Number(stmt.run(...args).changes)}}}};
}}};
const worker=(await import('../src/server.js')).default;
const save=vm.runInContext('JSON.parse(JSON.stringify(defaults()))',context);
const req=(route,method='GET',body,uid='test-user',origin)=>{const headers={};if(uid)headers['oai-authenticated-user-id']=uid;if(body){headers['Content-Type']='application/json'}if(origin)headers.Origin=origin;return new Request('https://wonder.test'+route,{method,headers,body:body?JSON.stringify(body):undefined})};
assert.equal((await worker.fetch(req('/api/save','GET',null,null),env)).status,401);
assert.deepEqual(await (await worker.fetch(req('/api/save'),env)).json(),{save:null,revision:0});
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:0}),env)).status,200);
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:0}),env)).status,409);
assert.equal((await worker.fetch(req('/api/save','PUT',{save,revision:1},'test-user','https://evil.test'),env)).status,403);
assert.equal((await worker.fetch(req('/api/save','PUT',{save:{...save,gold:-1},revision:1}),env)).status,400);
assert.equal((await worker.fetch(req('/api/save','PUT',{save:{...save,gold:4200},revision:1}),env)).status,200);
const own=await(await worker.fetch(req('/api/save'),env)).json();assert.equal(own.revision,2);assert.equal(own.save.gold,4200);
assert.equal((await(await worker.fetch(req('/api/save','GET',null,'other-user'),env)).json()).save,null);
assert.equal((await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries.length,0);
assert.equal((await worker.fetch(req('/api/leaderboard','POST',{}),env)).status,200);
assert.equal((await(await worker.fetch(req('/api/leaderboard'),env)).json()).entries.length,1);
console.log('PASS: authenticated saves, user isolation, revision conflicts, input validation, origin protection, opt-in leaderboard.');
