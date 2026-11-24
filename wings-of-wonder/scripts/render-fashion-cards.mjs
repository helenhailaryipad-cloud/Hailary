import {createRequire} from 'node:module';const {chromium}=createRequire(import.meta.url)('playwright');
// Renders Reina (hair 11) in every dress through the running preview (node scripts/preview.mjs --port 4173) into
// scripts/art-source/fashion-cards/<id>.png; then run python3 scripts/build-fashion-cards.py.
import fs from 'node:fs';
const out='scripts/art-source/fashion-cards'; fs.mkdirSync(out,{recursive:true});
const b = await chromium.launch();
const q = await b.newPage({viewport:{width:800,height:800}});
q.on('pageerror', e => console.log('PAGEERR', e.message));
await q.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' }); await q.waitForTimeout(800);
const ids = await q.evaluate(()=>fittingDresses.map(([id])=>id).filter(id=>id!=='base'));
console.log(ids.length, JSON.stringify(ids));
for (const id of ids) {
  const url = await q.evaluate(async id=>{const c=await composeWardrobeCanvas(id,11);const cv=c.canvas||c;return cv.toDataURL('image/png')},id);
  fs.writeFileSync(out+'/'+id+'.png', Buffer.from(url.split(',')[1],'base64'));
}
await b.close();
