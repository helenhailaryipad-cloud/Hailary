# Wings of Wonder: full project handover

> Copied from the handover supplied by the user (ChatGPT export, 18 Nov 2026).
> **The project source/art is NOT yet in this repository** — it lives in
> `Wings-of-Wonder-Full-Backup-v301.zip` (361 MB). Import it before editing code.

- Snapshot: 18 November 2026. Published version: **301**.
- Source commit: `1468d48bb03c80b91f5975df822a2d2b1b7c1821`
- Project ID: `appgprj_6af4b1811d8481919c5d282c903e6631`
- Published site: https://dragon-bloom-reyna.blockchainworld.chatgpt.site

## Read this first

This is the existing Wings of Wonder project, not a request to create a different game. Open `project/` and read this handover before editing. Preserve its assets, purchased items, save compatibility and project identity. The deployment output is `project/dist/server/index.js`. The Git bundle contains the repository history. No game code was changed to create the backup, and the export did not republish the site.

**Top priority: CLOTHING STILL DOES NOT WORK VISUALLY.** Treat wardrobe alignment as unresolved. Passing programmatic tests do not prove collars, hands, hair and clothes look correct. Never claim it fixed without inspecting actual rendered combinations. The last published change was Jungle Trek, not a wardrobe fix.

The backup has source + artwork only: no production DB rows, browser storage, player saves, auth tokens, secrets, node_modules. Art that only existed in past chats and was never committed cannot be recovered.

## What the game is

Free fantasy browser RPG prototype, primarily for **iPad, portrait**, English UI. Hero: **REINA**, silver-haired elf ranger. Colorful painted/cartoon fantasy; garden hub, gold ornaments, readable text, wings, pets, mounts, collectible outfits. Not a production MMO. Progression is client-authoritative. AI adventurers are simulated (not humans, not LLM agents).

The user wants a *beautiful game*, not a website. Large touch targets, clear icons, readable white text, independent effects, restrained glow. Avoid: clipped wings, tiny equipment previews, multi-touch selection highlights, overlapping labels, gratuitous text. Active home is **2D**; Three.js files are retained history only.

## Running

Node 24 (needs `node:sqlite`). Pinned: esbuild 0.25.12, three 0.181.2. From `project/`:

```
npm ci
npm test
node scripts/test-jungle.mjs
npm run dev            # port 3000, serves src/; PORT=4173 npm run dev
node scripts/preview.mjs --port 4173   # dependency-free 2D preview
```

Open via HTTP, not file://. Preview returns 503 for `/api/` on purpose (device saves; "cloud unavailable" message expected). Do not fake a user identity.

Hosted build (run LAST before publishing — normal builds/dev overwrite `dist/server/index.js`):

```
node scripts/build.mjs --hosted
node scripts/test.mjs
node scripts/test-jungle.mjs
```

`--hosted` minifies JS/CSS, skips the dormant 3D intro. Worker embeds hundreds of images, near the ~32 MiB raw bundle limit — check size. Never delete source art to shrink it.

Art review scripts (`scripts/test-wardrobe-render.mjs`, `review-collars.mjs`, `review-leaflight.mjs`) need `@napi-rs/canvas` (not in package.json). `scripts/build-fitting-control.py` needs Pillow + NumPy. No image service is called at runtime.

## Structure

| Path | Responsibility |
|---|---|
| src/index.html | App shell, header, main, nav, dialog, script order |
| src/app.js | State `S`, navigation/rendering, home, shops, costumes, wardrobe catalog, persistence, UI actions |
| src/stage.css | Styling + many cumulative responsive overrides (check specificity) |
| src/wardrobe-engine.js | Layered character compositor |
| src/generated-art.js, src/art-meta.js | Image markup helpers, sprite metadata, art bounds |
| src/gear-data.js | Equipment rules, validation, stats, familiars, loot (shared client/server) |
| src/gear-ui.js | Inventory, equipment detail, dev UIs |
| src/progression-data.js | Level cap, XP awards, daily EXP entry limits |
| src/adventure-data.js, adventure-ui.js | Dungeons, first clears, quests, wheel |
| src/world.js | AI adventurers, allies, battle state, rewards |
| src/dungeon-crawl.js | Rooms, guardians, gates, boss dodge areas |
| src/boss-art.js | Vector boss illustrations |
| src/exp-dungeon.js | Daily EXP dungeon, frozen party |
| src/arena.js | Hall of Wonders, simulated/opt-in ranking |
| src/minigame-engine.js | Castle Defense, Dragon Merge |
| src/game-polish.js, effects.js | Sprite drawing, combat/DOM effects, animation |
| src/crownfall.js | Crownfall Vale castle conquest |
| src/jungle.js | Jungle Trek |
| src/fishing.html | Moonwater Fishing (self-contained) |
| src/fish-catalog.js, fish-journal.html | 100 fish species, journal |
| src/intro3d-core.js, intro3d-entry.js | Experimental 3D (inactive) |
| src/server.js | Worker: assets, authenticated save, leaderboard |
| src/assets/ | Runtime art, fonts, fish illustrations |
| scripts/art-source/ | Authoring source art incl. fitting-control PNGs |
| scripts/hosting-art/ | AVIF alternatives used at build time |
| scripts/build-fitting-control.py | Offline fitting-layer prep (changes assets — review output) |
| scripts/build.mjs | Builds Worker + release fingerprint |
| scripts/preview.mjs | Local static server |
| scripts/test*.mjs | Automated tests |
| drizzle/ | D1 schema + migrations |
| .openai/hosting.json | Site identity + DB binding |
| README.md, ART-POLISH.md, docs/ | Historical notes (README partly outdated; handover + code win) |

Package version 0.5.0 ≠ Site version 301. `FUNCTION_INDEX.md` maps functions to files/lines; `FILE_INVENTORY.csv` lists files with SHA-256.

## Gameplay and progression

- Garden hub → hero, equipment, dungeons, mini-games, collection, city. Use existing navigation functions (they clean up loops/overlays).
- Never reset state `S` to add a feature. Save format **version 1** with backward-compatible optional fields. Normalization repairs legacy equipment and standardizes the name "Reina".
- 150 XP per level, cap **1500**. Equipment: unique instance IDs, 10 slots, enhancement, stars, sockets, crafting, independent duplicates. Client and server share power calcs — keep in sync. Preserve instance IDs. Boss drops never silently replace equipped items.
- Wish economy: 50 per draw, 500 per ten, scales, milestones, guaranteed choices, exchanges. **No real payments implemented.**
- Dungeons: guardians + final boss; auto attacks + Celestial Arrow, healing, Windstep; crawl rooms; dodgeable red areas. No boss wheel spin for abandoned runs.
- **Starlight Sanctuary**: EXP-only, 2 entries/UTC day, consumed on entry; solo / 1 / 2 AI allies with different multipliers; party frozen per run.
- **Hall of Wonders**: simulated AI + player + opt-in published profiles; keep distinctions. No synchronized multiplayer.
- **Castle Defense**: 3 lanes, 3 defenders, 8 waves, upgrades, boss, suns. **Dragon Merge**: circle physics, 8 egg tiers, one-use breeze. **Crownfall Vale**: 4 stages. Rewards settle once; stop on leaving.
- **Moonwater Fishing**: Moon Compass control, timing indicator, 100 species, 10 casts/day; own localStorage keys.

## Jungle Trek (v301)

Mini Games → Jungle Trek. Portrait 480×800 canvas, perspective projection. Drag/arrows/A-D steer; auto-shoot; Esc/pause; page hide pauses. 90 s, 3 hearts. 3 barrel lanes, rising HP, numeric HP shown, swept collisions, 50 score per barrel. Fire/laser lanes warn red 1.6 s first; brief hit invulnerability. Every 4th kill drops wings → shield → heart (9 s durations; wings = rapid triple shot). Reward cap 800 gold, 80 base XP; personal best saved. Never settle twice.

First prototype only: frontal sprites, simple procedural forest. **Future work:** back-facing animated runner, richer jungle art, varied enemies, polished attacks, real ranking.

## Wardrobe (UNRESOLVED)

Intent: one intact body/head/face/neck/pose across all outfits. Base is minimally clothed (never shown). No bald/undressed loading frame — swap only when the complete new look is ready.

- Canvas **500×800**, body rect `[0,40,500,750]`. Anchors: neck `[231,162]`, back `[240,206]`, hand `[218,300]`, grip `[390,375]`. Scale the whole portrait, never the head alone.
- Slot order back→front: `wingsBack, hairBack, garmentBack, body, boots, garmentFront, sleeves, handFront, weapon, gripFingers, hairFront, accessoriesFront`.
- Catalog: `ensureWardrobeCatalog()` in app.js; `composeWardrobeCanvas()` + look/preview functions. Dresses can declare body-coverage masks. Garment backs behind neck; hands intact; grip fingers over weapon grip; hair split front/back.
- Layers partly made by geometrically masking source art — slot order can't fix a badly drawn collar or cut edge. Inspect fit-control-body, fit-control-* garments/hair, leaflight-master, source PNGs, neck-opening paths, rear collar masks, sleeve clipping, hand masks. "Approved" notes do not override the user's later failure report.
- User has rejected: exposed old collars, cut necks, mismatched head scale, mixed old/new clothes, old ponytail remnants, rough cutouts, gaps, clipping, low-res edges. **Add no new outfits until a small representative set is visually correct.**
- Dress previews without wings covering them. Wings tab: large wings ON Reina, rooted at upper back (not pelvis). Weapons in front, proper hand. Each item: clear icon + small name. Keep current hairstyle until the next is decoded.
- Standing, mounted (cat-rider) and combat poses are separate render paths — check each. Jungle Trek uses a fixed sprite.

**Repair workflow:** reproduce broken look → inspect base alone → inspect garment/hair alpha & neck join → fix layers on the SAME canvas → render contrasting high/low collars and long/short hair → compare full size → test all combos and transitions. Preserve ownership IDs and saved outfits. No visual-fix claims from state tests.

## Saving, database, security

- Local key `wow-save-v1`. Journal has Export/Import save (JSON, ≤30,000 bytes, confirm). Origin change = different storage.
- Fishing keys: `moonwater-cards-v1`, `moonwater-daily-casts`, `moonwater-last-entered`, `moonwater-cup-<day>`, plus a pearl key in fishing.html. Main export doesn't include all of them.
- Cloudflare D1 binding `DB`. `drizzle/0000_wonder.sql`: table `adventures` (user_id PK, save_json, revision, updated_at, shared, hero_name, power, level).
- `GET/PUT /api/save` (PUT validates, revision CAS, 409 on conflict). `GET/POST /api/leaderboard` (opt-in). Identity from trusted header `oai-authenticated-user-id` — other hosts must supply real auth and never trust a client copy.
- Client-authoritative; not anti-cheat-grade; no payments.

## Deployment

Site is public. Don't create a new Site or change audience. In ChatGPT Sites: open existing project with fresh credentials, reconcile remote vs snapshot, build `--hosted`, run core + Jungle tests, package dist with `.openai/hosting.json`, push exact source, save version, deploy that version, verify. Fingerprint at `/release.json` and `wonder-release` meta. AGENTS.md asks for an in-chat playable card (`sites-project://appgprj_6af4b1811d8481919c5d282c903e6631`).

Independent hosting: Worker environment, bind DB, apply migrations, provide auth, deploy `dist/server/index.js` (static hosting alone won't serve the API).

## Verification and recovery

`verification/core-tests.txt`, `verification/jungle-tests.txt` — logic tests only, not art or layouts. History: `git clone repository-history.bundle restored-history`. Validate archive: `verify_backup.py` against `MANIFEST_SHA256.json`.

## Handoff prompt

Continue Wings of Wonder from this ZIP. Read HANDOVER.md, project/AGENTS.md and project/docs/FASHION_LAYERS.md. Preserve existing code, images, save compatibility and ownership IDs. Snapshot v301, commit 1468d48bb03c80b91f5975df822a2d2b1b7c1821. Clothing is still visually broken despite passing state tests. Reproduce and visually inspect collar, neck, sleeve, hand and hair joins before claiming a fix. Keep one intact body and fixed canvas. Jungle Trek is a first simplified prototype. Don't confuse future features with implemented ones. Reconcile the live repository before publishing. No live player-save/database export included.
