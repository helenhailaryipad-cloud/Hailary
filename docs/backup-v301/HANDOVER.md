# Wings of Wonder: full project handover

Snapshot: 18 November 2026. Published version: 301.
Source commit: 1468d48bb03c80b91f5975df822a2d2b1b7c1821.
Project ID: appgprj_6af4b1811d8481919c5d282c903e6631.
Published site: https://dragon-bloom-reyna.blockchainworld.chatgpt.site

## Read this first in a new session

This is the existing Wings of Wonder project, not a request to create a different game. Open project/ and read this handover before editing. Preserve its assets, purchased items, save compatibility and project identity. The full current tracked source and artwork are in project/. The existing deployment output is project/dist/server/index.js. The Git bundle contains the available repository history. No game code was changed to create this backup, and this export did not republish the site.

The most recent user complaint is that CLOTHING STILL DOES NOT WORK VISUALLY. Treat wardrobe alignment as unresolved. Earlier successful programmatic tests do not establish that collars, hands, hair and clothes look correct. Do not tell the user this issue is fixed without inspecting actual rendered combinations. The last published change was Jungle Trek, not a new wardrobe fix.

This is a complete source/artwork backup of the recovered repository, not a backup of production database rows or the user's browser storage. No live player saves, authentication tokens, service secrets, node_modules, or temporary tool state are included. Art or attachments that existed only in a past chat and were never committed cannot be recovered from this repository. Original art-source files that are committed are included, together with the web-ready assets.

## What the game is

A free fantasy browser RPG prototype, designed primarily for an iPad with a portrait presentation and English UI. Main hero: REINA, a silver-haired elf ranger. The visual direction is colorful painted/cartoon fantasy, with a garden hub, gold ornaments, readable text, wings, pets, mounts and collectible outfits. It is not a production MMO. Most gameplay progression is client-authoritative. AI adventurers simulate activity; they are not live human opponents or LLM agents.

The user wants a beautiful game rather than a conventional website. Maintain large touch targets, clear icons, readable white text, independent effects and restrained glow. Avoid clipped wings, tiny equipment previews, selection highlights from multi-touch, overlapping labels and gratuitous text. The active home is 2D. Experimental Three.js files are retained for development history, not the active gameplay renderer.

## Running the restored project

Use Node.js 24 or a compatible modern version with node:sqlite. The core tests were executed with Node 24.22.3 when this archive was made. Dependencies are pinned by package-lock.json: esbuild 0.25.12 and three 0.181.2. From project/:

```sh
npm ci
npm test
node scripts/test-jungle.mjs
npm run dev
```

The development server defaults to port 3000 and serves src/. For a specific port, use `PORT=4173 npm run dev` on Unix, or build then run `node scripts/preview.mjs --port 4173`. Open the server's HTTP address, not index.html via file://. The preview deliberately responds 503 for /api/: local play uses device saves, and an unavailable-cloud message is expected. Do not “fix” it by inventing a user identity.

A dependency-free local UI preview of the active 2D files can also be started with `node scripts/preview.mjs --port 4173`, without building the experimental 3D bundle. Rebuilding is recommended after installing dependencies.

For the hosted Worker output:

```sh
node scripts/build.mjs --hosted
node scripts/test.mjs
node scripts/test-jungle.mjs
```

The hosted flag minifies browser JS/CSS and skips rebuilding the dormant 3D intro. Normal builds and starting the dev script overwrite dist/server/index.js with a different build. Run the hosted build LAST before packaging for publication. The current Worker embeds hundreds of image payloads and is close to the roughly 32 MiB raw bundle constraint encountered in this project. Check final size before deployment. Do not delete source art to shrink the deployment.

Optional art reviews use @napi-rs/canvas, which is not declared in package.json. Install it separately in a review environment if running scripts/test-wardrobe-render.mjs, review-collars.mjs or review-leaflight.mjs. The Python fitting builder needs Pillow and NumPy. These are authoring/review requirements, not browser runtime dependencies. No image-generation service is called during gameplay.

## Project structure and responsibility map

| File or folder | Responsibility |
| --- | --- |
| src/index.html | App shell, header, main, navigation, dialog and script order |
| src/app.js | Main state S, navigation/rendering, home, shops, costumes, wardrobe catalog, persistence and UI actions |
| src/stage.css | Styling and many cumulative responsive overrides; check specificity before adding new overrides |
| src/wardrobe-engine.js | Registered layered character compositor |
| src/generated-art.js and src/art-meta.js | Image markup/helpers, sprite metadata and art bounds |
| src/gear-data.js | Shared equipment rules, validation, stats, familiars and loot |
| src/gear-ui.js | Inventory, equipment detail and development interfaces |
| src/progression-data.js | Level cap, XP awards and daily EXP entry limits |
| src/adventure-data.js and adventure-ui.js | Dungeons, first clears, quests, wheel and adventure UI |
| src/world.js | AI adventurers, allies, battle state and rewards |
| src/dungeon-crawl.js | Moving through rooms, guardians, gates and boss dodge areas |
| src/boss-art.js | Local vector boss illustrations |
| src/exp-dungeon.js | Daily EXP dungeon and frozen party configuration |
| src/arena.js | Hall of Wonders and simulated/opt-in ranking presentation |
| src/minigame-engine.js | Castle Defense and Dragon Merge simulation/presentation |
| src/game-polish.js and effects.js | Sprite drawing, combat/DOM effects and animation helpers |
| src/crownfall.js | Crownfall Vale castle-conquest mini-game |
| src/jungle.js | Jungle Trek state, combat, canvas renderer and controls |
| src/fishing.html | Self-contained Moonwater Fishing game, timing controls and daily counters |
| src/fish-catalog.js and fish-journal.html | Fish species, collection rules and fish journal |
| src/intro3d-core.js and intro3d-entry.js | Retained experimental 3D work |
| src/server.js | Worker asset serving, authenticated save and leaderboard endpoints |
| src/assets/ | Complete tracked runtime art, fonts, fish illustrations and other resources |
| scripts/art-source/ | Committed authoring source art, including fitting-control PNGs |
| scripts/hosting-art/ | Compact AVIF alternatives used at build time without changing artwork URLs |
| scripts/build-fitting-control.py | Offline fitting-layer preparation; changes assets, so review output carefully |
| scripts/build.mjs | Builds the self-contained Worker and release fingerprint |
| scripts/preview.mjs | Local static development server |
| scripts/test*.mjs | Automated gameplay/state/server and selected rendering tests |
| drizzle/ | D1 database schema and migration journal |
| .openai/hosting.json | Existing Site identity and DB binding |
| README.md, ART-POLISH.md, docs/ | Historical implementation notes and art records |

README.md is cumulative historical documentation. Its early statements about landscape layout, initial private access, old navigation, early dungeon counts and 3D activation are not all current. This handover and the actual current code take precedence. The site was public when this backup was created. Package version 0.5.0 is not the same thing as published Site version 301.

The generated FUNCTION_INDEX.md maps declared functions to source files and lines. FILE_INVENTORY.csv records every recovered tracked file, size and SHA-256. Read the relevant module before changing behavior; this handover is a navigation aid, not a replacement for source.

## Gameplay and progression

The garden hub leads to the hero, equipment, dungeons, mini-games, collection and other city activities. app.js owns the screen dispatcher and numerous city/feature panels. Call the existing navigation functions so active loops, overlays and game state are cleaned up correctly.

The main state S starts with REINA, gold, wish currency, scales, XP, owned starter pet/wings, upgrade state and optional feature extensions. Do not reset state to add a feature. Save format remains version 1 with backward-compatible optional fields. Normalization repairs legacy equipment and standardizes the Reina name.

Level progression uses 150 XP per level, capped at level 1500. XP awards honor the cap and equipment EXP bonus. Equipment has separate item-instance IDs, ten slots, enhancement, stars, sockets, crafting and independent duplicate pieces. Shared data modules calculate power on client and server. Keep validation and power calculations in agreement. Preserve instance IDs during upgrades and crafting. Boss drops should not silently replace equipped pieces; full inventories convert new loot as defined by the rules.

The prototype wish economy includes 50 currency per draw, 500 for ten, scales from draws, milestone returns, guaranteed choices and exchanges. Its balance is authored for this game, not a claim about another game's hidden rates. Real payments are not implemented. Some sale/event-shaped panels and user plans describe future monetization; do not assume a checkout exists. Check app.js and the shared data before changing prices or reward thresholds.

Permanent dungeons have guardian encounters and a final boss. Automatic attacks combine with Celestial Arrow, healing and Windstep. Crawl rooms require movement through unlocked exits. Red danger areas can be physically dodged. Victory, partial rewards, first clears, equipment loot and free wheel spins have distinct rules. Do not award a boss wheel spin for an abandoned run. Completed quests and repeatable bounties extend progression.

Starlight Sanctuary is an EXP-only dungeon with two entries per UTC day, consumed on entry even if the run is lost or abandoned. Solo, one AI ally and two AI allies use different multipliers. Freeze the selected party for the run. The rules are prototype save-based limits, not secure multiplayer anti-cheat.

Hall of Wonders combines explicitly identified simulated AI adventurers with the player's profile and opt-in published profiles. Preserve these distinctions. No shared-world synchronized combat is implemented.

Castle Defense uses three lanes, three defender types, eight waves, upgrades, a final boss and collectible suns. Damage settles when projectiles arrive. Dragon Merge uses circle physics, eight egg tiers, same-tier merging, a one-use breeze, overflow loss and bounded particles. Crownfall Vale provides four castle-conquest stages. Rewards should settle only once and stop on leaving a run.

Moonwater Fishing uses the chosen Moon Compass control, a moving timing indicator, catches and fish cards. The current species catalog contains 100 collectible species. Daily casting quota is 10. It keeps additional origin-local keys for its daily counters and tournament state. A main adventure JSON export may not contain every independent fishing-local key. Avoid mobile page selection and keep the timing controls large and smooth.

## Jungle Trek, version 301

Enter through Mini Games, then Jungle Trek. The field is a portrait 480 x 800 canvas with perspective projection. Drag horizontally to steer; arrow keys and A/D also steer. Shooting is automatic. Escape or the pause button pauses. Leaving uses the existing game navigation/confirmation flow. Hiding the page pauses an active run.

The run lasts up to 90 seconds with three hearts. Three barrel lanes spawn at intervals, with increasing HP and occasional gaps. Numeric HP appears on the barrels. Projectiles use world-space swept collision checks. Each destroyed barrel awards 50 score. Fire/laser lanes show a red warning for 1.6 seconds before becoming dangerous. A short hit-invulnerability period prevents continuous instant damage.

Every fourth kill drops a boost, cycling between wings, shield and heart according to the kill count. Wing and shield duration is nine seconds. Wings add rapid triple projectiles; shields absorb a hit; hearts restore up to three lives. The final reward is capped at 800 gold and 80 base XP, and personal best is saved. Do not call finish or settle rewards twice.

This is a FIRST gameplay prototype using existing frontal Reina/companion/enemy sprites and a simplified procedural forest. It does not visually reproduce the supplied 3D reference. A back-facing animated runner, richer jungle artwork, more varied enemy behavior and polished attacks remain future work. No real live Jungle Trek ranking was implemented. Keep this limitation explicit in future sessions.

## Wardrobe: current design and outstanding failure

The intended design is one intact body, head, face, neck and pose across all outfits. The technical base is minimally clothed, not an outfit to display publicly. The user must never see a bald or undressed loading frame. Switching should replace the current complete look only when the new complete look is ready.

Canonical composition frame: 500 x 800. Body rectangle: [0,40,500,750]. Fixed anchors include neck [231,162], back [240,206], hand [218,300], grip [390,375]. Scale the assembled portrait as a whole, never resize or reposition the head independently.

Back-to-front slots are wingsBack, hairBack, garmentBack, body, boots, garmentFront, sleeves, handFront, weapon, gripFingers, hairFront, accessoriesFront. Catalog registration lives in ensureWardrobeCatalog() in app.js. composeWardrobeCanvas() and the registered look/preview functions connect it to the UI. Dresses can declare body-coverage masks. Garment backs must sit behind the neck, hands must remain intact, weapon fingers must sit over the grip, and front/back hair must be split correctly.

Existing layers are partly built by geometrically masking source artwork. A valid slot order cannot repair an incorrectly drawn collar or a cut edge in a source image. Inspect fit-control-body, fit-control-* garment/hair images, leaflight-master, the source PNGs, neck-opening paths, rear collar masks, sleeve clipping and hand masks. Old complete portraits remain as references and some are excluded from the hosted bundle. Retained authoring notes claiming a design was approved do not override the user's later report of failure.

The user has repeatedly rejected exposed old collars, cut necks, mismatched head scale, mixed old/new clothes, remnants of old ponytails, rough cutouts, gaps, clipping and low-resolution edges. These are still the priority concern after v301. Do not add more outfits on top of this until a small representative set is visually correct on the unchanged body.

Dresses should be previewed without wings obscuring them. The Wings tab should show large wings ON Reina, rooted at the upper back behind the body, not at the pelvis. Weapons must appear in front in the proper hand. Each selectable item needs its own clear icon and a small name. Switching hairstyle must preserve the current hairstyle until the next one is decoded.

Standing, mounted and animated combat poses are separate rendering paths. Standing clothes cannot simply be pasted on the seated cat-rider pose. Inspect each path independently. Later mounted patches exist, but this does not establish every mounted combination is visually correct. Jungle Trek currently uses an existing fixed sprite rather than the entire live Fashion compositor.

Recommended repair workflow: reproduce the specific broken look; inspect the base alone privately; inspect garment/hair alpha and neck join; correct compatible layers on the SAME canvas; render several contrasting high/low collars and long/short hairstyles; compare at full size; then test all combinations and transitions. Have a visual critic inspect the result if the user requests one. Preserve ownership IDs and saved outfit choices. Do not claim a visual fix from a state-only test.

## Saving, database and security boundaries

Main local storage key: wow-save-v1. The Journal has Export save and Import save. The import validates JSON, limits size to 30,000 bytes and asks before restoring. Export a player's save on their device before clearing storage or changing domains. Origin changes create different browser storage. This project archive contains no copy of that private player state.

Fishing also uses moonwater-cards-v1, moonwater-daily-casts, moonwater-last-entered, moonwater-cup-<day> and a pearl key defined in fishing.html. Inspect all local keys when planning complete player-data migration. The main export is not automatically a complete browser-origin backup.

Cloud persistence is a Cloudflare D1 binding named DB. drizzle/0000_wonder.sql creates adventures with user_id primary key, save_json, revision, updated_at, shared, hero_name, power and level. The archive contains schema, not production rows. Separately export the real D1 database through an authorized admin path if a full service/data migration is needed.

GET /api/save reads the signed-in user's save. PUT /api/save validates input and uses optimistic revision compare-and-swap, returning 409 on conflict. GET /api/leaderboard reads opted-in records; POST /api/leaderboard opts in the current saved profile. The Worker expects the trusted Sites header oai-authenticated-user-id. A separate hosting provider must supply secure authenticated identity and must not trust a client-supplied copy of this header. Runtime secrets must be configured separately; none are in this backup.

The game remains client-authoritative. Validation and revision checks are not sufficient anti-cheat for a commercial competitive economy. Do not represent this as production-ready multiplayer or payment handling.

## Deployment and continuing development

The existing site is public and identified above. Do not create a new Site accidentally or change its audience. In a future ChatGPT Sites session, open the existing project with fresh repository credentials, reconcile the current remote source with this snapshot and avoid overwriting newer work. Never reuse an expired credential or store it in source.

Build with --hosted, run core and Jungle tests, package dist with .openai/hosting.json using the supported Sites workflow, push the exact source state, save a version and deploy that exact saved version. Verify terminal success before showing an updated game card. The release fingerprint is exposed at /release.json and in wonder-release page metadata. Build output contains the Worker and embedded assets; no third-party CDN is needed for the active 2D game art.

The repository's AGENTS.md requests an in-chat playable project card for normal game updates, not a bare download. This backup ZIP is an explicit user-requested exception for export. The card uses sites-project://appgprj_6af4b1811d8481919c5d282c903e6631.

For independent hosting, use a compatible Worker environment, bind DB and apply migrations, provide authentication, then deploy dist/server/index.js. Merely putting the Worker file on static hosting will not provide its API. The local preview is intentionally simpler and works with device saves.

## Verification and recovery

verification/core-tests.txt and verification/jungle-tests.txt contain the test output captured during export. These check data, transitions, rewards, validation, shared stats, save conflict behavior and Jungle simulation. They do not certify artwork, every mobile layout, or live database contents. No new browser visual QA was performed for this export; the last user wardrobe complaint remains unresolved.

The export contains all files listed by git ls-files at the recorded commit, including dist, source art and historical docs. It excludes working .git configuration and credential state. repository-history.bundle stores the available Git history without local remote credentials. To inspect history in a separate directory:

```sh
git clone repository-history.bundle restored-history
cd restored-history
git log --oneline -10
```

Use project/ for the exact simple restored working snapshot. Do not combine different historical art generations blindly. Run verify_backup.py from the archive root to validate file hashes against MANIFEST_SHA256.json. FILE_INVENTORY.csv covers original project files; the manifest also covers handover, history and verification files. The manifest and verification helper are deliberately excluded from their own hash set.

## Handoff prompt to paste into another session

Continue Wings of Wonder from this ZIP. Read HANDOVER.md, project/AGENTS.md and project/docs/FASHION_LAYERS.md. Preserve existing code, images, save compatibility and ownership IDs. The source snapshot is v301, commit 1468d48bb03c80b91f5975df822a2d2b1b7c1821. Clothing is still visually broken according to the user, despite earlier passing state tests. Reproduce and visually inspect collar, neck, sleeve, hand and hair joins before claiming a fix. Keep one intact body and fixed canvas. Jungle Trek is a first simplified playable prototype. Do not confuse requested future features with implemented ones. Reconcile the live repository before publishing any new work. This ZIP contains project files and history, but no live player-save/database export.
