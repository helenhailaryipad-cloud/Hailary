import fs from 'node:fs';import path from 'node:path';
const src=path.resolve('src'),out=path.resolve('dist');fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(path.join(out,'server'),{recursive:true});
const ASSETS={};for(const name of ['index.html','style.css','app.js','world.js','assets/ranger.webp','assets/sanctuary.webp','assets/dragon.webp','assets/wings.webp']){const binary=name.endsWith('.webp');ASSETS['/'+name]={type:binary?'image/webp':name.endsWith('.css')?'text/css; charset=utf-8':name.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8',base64:binary,content:fs.readFileSync(path.join(src,name),binary?undefined:'utf8')};if(binary)ASSETS['/'+name].content=ASSETS['/'+name].content.toString('base64')}
fs.writeFileSync(path.join(out,'server/index.js'),'const ASSETS='+JSON.stringify(ASSETS)+';\n'+fs.readFileSync(path.join(src,'server.js'),'utf8'));
console.log('Built Wings of Wonder with '+Object.keys(ASSETS).length+' embedded assets.');
