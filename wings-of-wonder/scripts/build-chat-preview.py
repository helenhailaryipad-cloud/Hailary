"""Build the playable in-chat preview (a claude.ai Artifact) from src/.

An artifact version holds at most 511 files, so this copy drops art the game
no longer loads and packs four big icon families (gear, familiars, guardians,
fish) into pack-*.js as data URIs. Game source in src/ is not modified; the
four path expressions below are patched in the copy only.

    python3 scripts/build-chat-preview.py <output-dir>

Writes the page as <output-dir>/wings-of-wonder.html, its files under
<output-dir>/files/, and <output-dir>/files-1.json, files-2.json ... : maps of
published path -> source path, at most 250 entries each (publish limit 255).
"""
from pathlib import Path
import base64, json, re, shutil, subprocess, sys

ROOT = Path(__file__).resolve().parents[1]; SRC = ROOT/'src'
out = Path(sys.argv[1]).resolve(); files = out/'files'
shutil.rmtree(out, ignore_errors=True); files.mkdir(parents=True)

UNUSED = re.compile(r'^assets/generated/(?:fitting-|atelier-(?!icon-)|parts-|fit-mask-|skin2-|leaflight-(?:master|riding)|fit-control-hand\.)')
PACKS = {'gear': re.compile(r'^assets/generated/gear-'), 'familiar': re.compile(r'^assets/generated/familiar-'),
         'guardian': re.compile(r'^assets/generated/guardian-t'), 'fish': re.compile(r'^assets/moonwater/'),
         'icons': re.compile(r'^assets/generated/(?:fit-icon-|atelier-icon-|mount-icon-|fashion-cards\.|fashion-bows\.)'), 'bows': re.compile(r'^assets/generated/weapon-style-'), 'wings': re.compile(r'^assets/generated/fashion-wing-'), 'rites': re.compile(r'^assets/generated/comp-(?:rites-|secret-|trail-)'), 'garden': re.compile(r'^assets/generated/garden-'), 'comp': re.compile(r'^assets/generated/(?:comp-|explore-marker-)'),
         'erase': re.compile(r'^assets/generated/fit-control-[a-z]+-erase\.'), 'minis': re.compile(r'^assets/generated/(?:trek-pickup-|pairs-tile-|pairs-sprout\.|pairs-lobby\.|cascade-fx\.|cascade-pad\.|cascade-cover\.|td-|burrow-|talent-|wishwell-|blessings-|scene-ranking\.|tool-|drawer-|title-|challenge-)'),
         'hairs': re.compile(r'^assets/generated/fit-control-(?:mount)?hair-')}
packed = {k: {} for k in PACKS}
tracked = subprocess.run(['git', 'ls-files', 'src'], cwd=ROOT, capture_output=True, text=True, check=True).stdout.split('\n')
for f in filter(None, tracked):
    rel = f[4:]
    if rel == 'server.js' or 'intro3d' in rel or rel.endswith('.glb') or UNUSED.match(rel) or rel == 'index.html': continue   # .glb is not a served type
    group = next((k for k, rx in PACKS.items() if rx.match(rel)), None)
    data = (SRC/rel).read_bytes()
    if group:
        mime = 'image/avif' if rel.endswith('.avif') else 'image/webp'
        packed[group][rel] = f'data:{mime};base64,' + base64.b64encode(data).decode()
        continue
    (files/rel).parent.mkdir(parents=True, exist_ok=True); (files/rel).write_bytes(data)
for k, m in packed.items():
    (files/f'pack-{k}.js').write_text('(globalThis.WOW_PACK??={});Object.assign(WOW_PACK,' + json.dumps(m, separators=(',', ':')) + ');')

def patch(rel, old, new):
    p = files/rel; s = p.read_text()
    assert old in s, (rel, old); p.write_text(s.replace(old, new))
patch('generated-art.js', 'function artPath(id){', "function artPath(id){const packedArt=globalThis.WOW_PACK?.['assets/generated/'+id+'.webp'];if(packedArt)return packedArt;")
patch('gear-ui.js', 'src="assets/generated/gear-${template.slot}-t${eqRules().artTier(template.tier)}.webp?v=4">', 'src="${artPath(\'gear-\'+template.slot+\'-t\'+eqRules().artTier(template.tier))}">')
patch('gear-data.js', "portrait:'assets/generated/familiar-'+index+'.webp?v=sharp3'", "portrait:globalThis.WOW_PACK?.['assets/generated/familiar-'+index+'.webp']||'assets/generated/familiar-'+index+'.webp?v=fullbody2'")
patch('fish-catalog.js', "const artUrl=fish=>'assets/moonwater/'+fish.id+'.avif';", "const artUrl=fish=>globalThis.WOW_PACK?.['assets/moonwater/'+fish.id+'.avif']||'assets/moonwater/'+fish.id+'.avif';")
# Compare with the previous build so a republish sends only what changed and removes what is gone.
import hashlib
state = out.parent/(out.name+'-published.json')
prev = json.loads(state.read_text()) if state.exists() else {}
for page in ('fishing.html', 'fish-journal.html'):
    patch(page, '<script src="fish-catalog.js"></script>', '<script src="pack-fish.js"></script><script src="fish-catalog.js"></script>')

# The artifact host wraps the page in its own skeleton: keep only head links and body content.
html = (SRC/'index.html').read_text()
body = html[html.index('<body>')+6:]
body = body.replace('<script src="art-meta.js"></script>', ''.join(f'<script src="pack-{k}.js"></script>' for k in PACKS) + '<script src="art-meta.js"></script>')
body = re.sub(r'</body>|</html>', '', body)
(out/'wings-of-wonder.html').write_text('<title>Wings of Wonder</title>\n<meta name="theme-color" content="#172d36">\n<link rel="stylesheet" href="stage.css">\n' + body)

names = sorted(str(p.relative_to(files)) for p in files.rglob('*') if p.is_file())
now = {n: hashlib.md5((files/n).read_bytes()).hexdigest() for n in names}
delta = {n: n for n in names if prev.get(n) != now[n]}; delta.update({n: None for n in prev if n not in now})
(out/'files-delta.json').write_text(json.dumps(delta)); (out/'files-now.json').write_text(json.dumps(now))
print(f'delta vs last published build: {sum(v is not None for v in delta.values())} to send, {sum(v is None for v in delta.values())} to remove (after publishing, copy files-now.json to {state.name})')
for i in range(0, len(names), 250):
    (out/f'files-{i//250+1}.json').write_text(json.dumps({n: n for n in names[i:i+250]}))
total = sum((files/n).stat().st_size for n in names)
print(f'{len(names)} files, {total/1e6:.1f} MB, biggest pack {max((files/f"pack-{k}.js").stat().st_size for k in PACKS)/1e6:.1f} MB')
