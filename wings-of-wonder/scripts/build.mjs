import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
if (!process.argv.includes('--hosted')) await (await import('esbuild')).build({entryPoints:['src/intro3d-entry.js'],outfile:'src/intro3d.bundle.js',bundle:true,minify:true,format:'iife',platform:'browser',target:['es2022'],legalComments:'none'});
const src=path.resolve('src'),out=path.resolve('dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'server'),{recursive:true});
const ASSETS={};for(const name of ['index.html','fishing.html','fish-journal.html','fish-catalog.js','stage.css','effects.js','art-meta.js','generated-art.js','arena.js','game-polish.js','minigame-engine.js','crownfall.js','jungle.js','pairs.js','cascade.js','party.js','burrow.js','talents.js','siege.js','vow.js','rites.js','wishwell.js','checkin.js','titles.js','challenge.js','garden.js','realms.js','trail.js','app.js','wardrobe-engine.js','wardrobe-placeholder.svg','world.js','adventure-data.js','adventure-ui.js','dungeon-crawl.js','boss-art.js','progression-data.js','exp-dungeon.js','gear-data.js','gear-ui.js','assets/ranger-cartoon.webp','assets/sunny-garden.webp','assets/dragon-cartoon.webp','assets/wings.webp','assets/equipment-atlas.webp']){const binary=name.endsWith('.webp')||name.endsWith('.glb');ASSETS['/'+name]={type:name.endsWith('.svg')?'image/svg+xml':name.endsWith('.glb')?'model/gltf-binary':binary?'image/webp':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8',base64:binary,content:fs.readFileSync(path.join(src,name),binary?undefined:'utf8')};if(binary)ASSETS['/'+name].content=ASSETS['/'+name].content.toString('base64')}
const generatedDir=path.join(src,'assets/generated');if(fs.existsSync(generatedDir))for(const file of fs.readdirSync(generatedDir).filter(f=>f.endsWith('.webp')&&!f.startsWith('fitting-')&&f!=='leaflight-master.webp'&&f!=='leaflight-riding.webp'&&!/^skin2-(?:look|parts)-/.test(f)&&f!=='fit-control-hand.webp'&&!f.startsWith('fit-mask-')&&!/^(?:atelier-(?:grove|violet|dawnpetal|frostlace|nightbloom|sunweave|tidal|emberveil|willow|stardust|pearl|sapphire)|parts-(?:dawnpetal|frostlace|nightbloom|sunweave|tidal|emberveil|willow|stardust|pearl|sapphire))\.webp$/.test(f))){ASSETS['/assets/generated/'+file]={type:'image/webp',base64:true,content:fs.readFileSync(path.join(generatedDir,file)).toString('base64')};}
// Fail the build if a catchable species has no corresponding illustration.
await import('../src/fish-catalog.js');
for(const fish of globalThis.MoonwaterFish.species){
  const file=globalThis.MoonwaterFish.artUrl(fish);
  ASSETS['/'+file]={type:'image/avif',base64:true,content:fs.readFileSync(path.join(src,file)).toString('base64')};
}
for(const file of fs.readdirSync(path.join(src,'assets/fonts')).filter(f=>f.endsWith('.woff'))){ASSETS['/assets/fonts/'+file]={type:'font/woff',base64:true,content:fs.readFileSync(path.join(src,'assets/fonts',file)).toString('base64')};}
// Preserve artwork URLs in existing saves and serve compact image payloads.
for (const [url, asset] of Object.entries(ASSETS)) {
  if (asset.type !== 'image/webp' || url.startsWith('/assets/generated/gear-')) continue;
  const compact = path.join('scripts/hosting-art', path.basename(url, '.webp') + '.avif');
  if (!fs.existsSync(compact)) continue;
  asset.type = 'image/avif';
  asset.content = fs.readFileSync(compact).toString('base64');
}
// Keep full-resolution fitting artwork within the Worker bundle limit.
// Script-mode minification preserves top-level names used by inline handlers.
if (process.argv.includes('--hosted')) {
  const {transform} = await import('esbuild');
  for (const [url, asset] of Object.entries(ASSETS)) {
    if (asset.base64 || !/\.(js|css)$/.test(url)) continue;
    asset.content = (await transform(asset.content, {
      loader: url.endsWith('.css') ? 'css' : 'js',
      minifyWhitespace: true,
      minifySyntax: true,
      minifyIdentifiers: true,
      legalComments: 'none',
      target: 'es2022'
    })).code;
  }
}
const hash = createHash('sha256');
for (const [url, asset] of Object.entries(ASSETS).sort(([a],[b]) => a.localeCompare(b))) {
  hash.update(url).update(asset.content);
}
const release = hash.digest('hex').slice(0,16);
ASSETS['/release.json'] = {type:'application/json', content:JSON.stringify({release})};
ASSETS['/index.html'].content = ASSETS['/index.html'].content
  .replace('<title>', '<meta name="wonder-release" content="'+release+'"><title>')
  .replace(/(src|href)="([^"]+\.(?:css|js))"/g, '$1="$2?v='+release+'"');
fs.writeFileSync(path.join(out,'server/index.js'),fs.readFileSync(path.join(src,'progression-data.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'fish-catalog.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'gear-data.js'),'utf8')+'\n'+fs.readFileSync(path.join(src,'adventure-data.js'),'utf8')+'\nconst ASSETS='+JSON.stringify(ASSETS)+';\n'+fs.readFileSync(path.join(src,'server.js'),'utf8').replace("import './progression-data.js';\n",'').replace("import './fish-catalog.js';\n",'').replace("import './gear-data.js';\n",'').replace("import './adventure-data.js';\n",''));
console.log('Built Wings of Wonder with '+Object.keys(ASSETS).length+' embedded assets.');
