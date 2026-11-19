# Hailary

This repo hosts continued development of **Wings of Wonder** (iPad-portrait fantasy browser RPG, hero REINA).
Read `docs/WINGS-OF-WONDER-HANDOVER.md` before any game work.

- Top priority: the wardrobe/clothing compositor is visually broken. Never claim a visual fix without rendering and looking at real combinations.
- Preserve save compatibility (`wow-save-v1`, version 1), item instance IDs, existing art and project identity.
- `mcp/gpt_image_mcp.py` is an image-generation MCP server (default model gpt-image-2.6-sunburst); the OpenAI key is injected by the session proxy, never committed.

## Layout
- `wings-of-wonder/` — the game (imported from backup v301 with full Git history, commit 1468d48). Run commands from there: `npm ci`, `node scripts/test.mjs`, `node scripts/test-jungle.mjs`, `node scripts/preview.mjs --port 4173`.
- `docs/backup-v301/` — original handover, file inventory, function index, captured test output.
- `docs/wardrobe-review/` — rendered wardrobe contact sheets.

## Wardrobe status (updated 2026-11-18, second pass)
Root cause of the "neck/shoulder/hand/leg sticks out" complaints: garment art was drawn separately from the body and
cut with hand-traced polygons, so sleeves, collars and boots did not sit on Reina's actual wrist, neck and calves.

**Chosen approach: paint the outfit on the fixed base body, then extract it.**
1. Get a full-figure painting of the bald base body (`scripts/art-source/fitting-control/base-v2.png`, 1024x1536)
   wearing the outfit. Emerald Leaves (`a.png`) and Leaflight (`leaflight/master.png`) already were such paintings.
   Northern Wayfarer was repainted with the image model (images edit API, model gpt-image-2.6-sunburst, inputs:
   base-v2.png + the old garment art, 1024x1536, transparent background) and saved as
   `scripts/art-source/fitting-control/painted/emberveil.png`. The model keeps the body almost pixel-identical.
2. `wings-of-wonder/scripts/build-fitting-v2.py` `painted_layer()` takes every pixel that differs from the base body as
   the garment (`fit-control-<id>`), and the body pixels the painting leaves empty as an erase mask
   (`fit-control-<id>-erase`: calf wider than a boot, bare toes). The head is never repainted.
3. `wardrobe-engine.js` cuts the erase mask out of the body only (`bodyErase`); `ensureWardrobeCatalog()` registers
   these dresses through `wardrobePixelDresses` as a single `garmentFront` layer. No hand layer, no neck masks.
Result: body + layer reproduces the painting, so cuff/wrist, collar/neck and boot/leg always agree.
Rejected: polygon masks (v301) and per-pixel masks over separately drawn garment art (hand does not meet the cuff).

Done this way (third pass): ALL 12 dresses. `grove`, `frostlace` (b.png) and `leaflight` were already paintings
of the body; the other nine were repainted with the image model and their sources are in
`scripts/art-source/fitting-control/painted/<id>.png`. Wardrobe card icons (`fit-icon-<id>`) are regenerated from
the new layers. The polygon dress code, neck-opening paths and the pasted hand layer are removed from `app.js`.
Hair 11 comes from the Leaflight painting and is split at the ear: below it the braid is `hairBack` (behind body,
capes, sleeves). Hairs 3, 9, 10 have ear/temple gaps filled. A test build is published from branch `gh-pages`
(contents of `wings-of-wonder/src`) at https://helenhailaryipad-cloud.github.io/Hailary/ - update it after changes.
Sheets: `docs/wardrobe-review/fix1-*.png`, `fix2-three-approaches.png`, `fix3-*.png`.

To add or redo a dress: put a 1024x1536 transparent painting of base-v2.png wearing it in `painted/<id>.png`,
add the id to `PAINTED` in `scripts/build-fitting-v2.py`, run `python3 scripts/build-fitting-v2.py <id>`, then
render and LOOK at hand, neck, feet (`composeWardrobeCanvas` in the preview) before committing.

## Mounted pose and battles (fourth pass, 2026-11-18)
- Riding uses the same idea with its own base: `scripts/art-source/mounted/base.webp` (bald Reina in a bodysuit on the
  Silver Tabby, made from `leaflight/riding.png`), plus one painting per dress (`dress-<id>.webp`) and per hairstyle
  (`hair-<n>.webp`), all 1024x1024. `scripts/build-mounted.py` extracts `fit-control-mount-<id>` and
  `fit-control-mounthair-<n>` (1024x936). The inner face comes from the hair painting through a soft ellipse.
- `composeMountedCanvas(dress,hair)` in `app.js` draws base + dress + hair; `reinaLookPath(true)` returns a
  `#mounted-<dress>-<hair>` key that the image load handler resolves. Any dress/hair can ride now (the old rule that
  only the full Leaflight set could ride is gone). The mounted bow is always the Leafwind bow, whatever weapon is worn.
- Battles: `drawReina` in `arena.js` cropped the 2x portrait as if it were 1x (only the top-left quarter showed); fixed.
  Battles also use the wardrobe portrait on a fresh save now.
- `save()` in `build-fitting-v2.py` blanks colour under transparent pixels (`clean_rgb`), which shrank layers a lot.
  `leaflight-riding` and `skin2-look-*`/`skin2-parts-*` are no longer embedded. Hosted bundle: 32,246,347 bytes
  (about 1.3 MB spare).
- Sheets: `docs/wardrobe-review/fix5-*.png`.

## Second fashion collection (fifth pass, 2026-11-18)
10 dresses, 10 hairstyles, 10 wings, 10 bows, all original designs painted by the image model, in Fashion:
- Dresses `aurora rosethorn seafoam ravenwing sunflower frostqueen autumn starlit coral jade` (1200 gold): painted on
  base-v2.png (text prompt only), sources in `fitting-control/painted/`, same pipeline as the first twelve.
- Hair 12-21 (400 gold): painted on the bald base (`fitting-control/hair/hair-<n>.webp`), extracted by
  `build_painted_hair()`; 12, 13, 19, 20 hang down the back and have a `-back` layer (`wardrobeBackHairs`). Cards:
  `fit-icon-hair-<n>`.
- Wings `fashion-wing-11..20` and bows `weapon-style-14..23`: `scripts/build-fashion-extras.py` (sources in
  `art-source/wings`, `art-source/bows`). Weapon numbers 12 and 13 are reserved (legacy / original bow in the
  compositor), so `styleSets.Weapons.names[11..12]` are null and cannot be bought.
- Every new dress and hairstyle also has mounted art (`art-source/mounted/`). Wing-bonus regex in `gear-data.js`
  accepts wings 1-20. Saves stay version 1 (ids are just new strings/numbers in existing fields).
- `scripts/hosting-art` now has AVIF copies of `familiar-*` and `party-*` (build-time only), which freed about 5 MB:
  hosted bundle 29.6 MB against the 32 MiB limit.
- Wings are drawn about 1.5x larger from the shoulder blades; portraits with wings are wider and taller
  (`wardrobeWingPad`, `wardrobeWingTop`), `.winged-portrait` and `drawReina` compensate.

## Harvest Pairs mini-game (2026-11-18)
Home screen icon "Harvest Pairs" (right side, next to Fishing) or Mini Games -> Harvest Pairs (`src/pairs.js`, screen id `pairs`): tap two identical ingredients that a line with at most
two turns can join; the line is drawn before the pair is collected. Six boards (2x2, 4x3, 4x4, 6x5, 6x6, 6x8 with all eight ingredients), one clock
across all of them, paused during countdowns and while the page is hidden. Reward 300 gold + 30 XP, +200 gold under 1:30
(`Pairs.bonusSeconds`), settled once; best time in optional save field `S.pairsBest` (seconds). Deals are always clearable; a stuck
board reshuffles. Second pass: a lobby (`showPairs`: host, rules, runs, Rankings) opens the board (`openPairsBoard`);
rewards only for 2 completed runs per UTC day (`S.pairsDaily {day, runs}`), further runs are practice; the Sprout mascot
gives a hint for +3 s; taps act on `pointerdown` for every finger (two tiles touched at once pair up) and never wait for animations (input locks only during the gates); the ranking modal lists the six AI adventurers with simulated daily times, labelled AI, plus
the player's best. Original art: lobby background, Sprout mascot, 8 ingredient tiles and a cover (`art-source/pairs/`, built by
`build-fashion-extras.py`). Logic tests: `node scripts/test-pairs.mjs`. Game buttons need very specific selectors:
global `#main button` rules set position, borders and `::before`.

## Jungle Trek second pass (2026-11-18)
The user sent photos of a reference runner-shooter (no text); Jungle Trek was restyled toward it with original art:
painted clearing background (`trek-bg`), barrel sprite (`trek-barrel`), power-up orbs (`trek-pickup-1..3`), violet-gold
teardrop shots, burst on hit, flame lanes, larger hero. The hero is the live wardrobe portrait
(`registeredCombatBitmap()`), so the worn dress, hair, bow and wings show; a back-view runner is NOT done (it would need
a back drawing for each of the 22 dresses). HUD: live ranking against six simulated AI rivals and gap to leader
(`Trek.rivals`, `Trek.standing`), boost icons with seconds, thumb stick under the finger. Third pass, after studying the photos again:
five lanes (`Trek.lanes`) with a row every 2.2 s and random gaps, arrows aimed at the nearest barrel (`Trek.aim`,
bolts carry `vx`), and Boom barrels: every other danger lane belongs to a marked barrel that warns for 1.6 s and then
charges down its lane; breaking it first cancels the charge ("Defused"). Floating notes (`g.texts`) for pickups.
Rival finals are 1500-3500. Rewards (gold/XP caps, 90 s, 3 hearts, boost every 4th kill) are unchanged. `drawJungle` uses a flatter projection than before (render only). Sources in
`art-source/trek/`, built by `build-fashion-extras.py`.

## Dungeon lobby (2026-11-19)
`dungeonLobby()` in `world.js` was rebuilt after a reference screenshot: one guardian on stage with its name and
recommended level (green when met), a left column (Boss info, Treasure, Quests, Party, EXP trial, with badges), a
Rewards column (gold, gear, materials, XP, first-clear bonus), a scrollable strip of all tier tabs, the five guardians
of the chosen tier as cards (Open / Cleared xN / Locked), then Enter with stamina. State: `lobbyDungeon`, `lobbyTier`;
`lobbyPick`, `lobbyTierPick`, `dungeonRules`. All tiers can be browsed (before, only the current tier plus two were
shown); entry rules are unchanged (`launchBattle` checks level and stamina). Use `div`, not `header/nav/footer`, inside
`#main`, and note `decorateArt()` prepends icons to icon-less buttons after every click.

## Sharp guardian art (2026-11-19)
The 25 tier guardians (`guardian-t7..t31`) were 240 px sprites stretched on the lobby stage. They were repainted at
1024 px by the image model from the old sprites (same designs), sources in `art-source/guardians/`, built to 600 px by
`build-fashion-extras.py`. The nine named bosses (mistwood ... sunspire) were already 700 px. Hosted bundle headroom
is about 1.86 MB after this.

## Twenty extra mounts (2026-11-19)
`mounts` in `app.js` has the free Silver Tabby plus 20 mounts (1500 gold each): moon-unicorn, emerald-stag, ember-fox,
azure-drake, golden-gryphon, frost-wolf, rose-pegasus, star-kirin, amethyst-panther, sunfire-lion, cloud-ram,
tide-turtle, thunder-tiger, snow-owl, rainbow-phoenix, midnight-steed, honey-bear, lotus-koi, moon-rabbit, bamboo-panda.
- Art: each is the mounted base with ONLY the cat replaced (image model edit of `art-source/mounted/base.webp`), saved as
  `art-source/mounted/ride-<id>.webp`. `build-mounted.py mounts` copies the rider pixels from the base (the rider mask is
  what stays the same across all 20 paintings), writes `fit-control-ride-<id>` (832x760) and a head card
  `mount-icon-<id>`. All 22 dresses and 21 hairstyles therefore fit every mount with no extra art.
- Dress/hair layers were painted on the tabby and carried re-drawn grey fur; `off_the_cat()` now strips neutral-grey
  pixels over the cat's fur and keeps only what hangs together with the rider. Check new dresses on a dark mount.
- UI: Fashion has a fifth tab, Mounts (`mountFittingRoom`, `rideFashionMount`). Optional save fields `S.mountsOwned`
  (ids) and `S.mountPick` (last chosen); `chosenMount()` is what the Ride button mounts. Mounted keys are
  `#mounted-<dress>-<hair>~<mount>` (no suffix for the tabby). Mounts are cosmetic: no stats.
- 62 more build-time AVIF copies in `scripts/hosting-art` keep the hosted bundle under the limit (about 1.8 MB spare).

## In-chat playable preview (user requirement)
The user wants to play the game inside the chat, and wants SHORT replies in Russian, no fluff.
- Artifact: https://claude.ai/artifact/L9owNJPMaZjAsTmU3tDGs6 (private). After game changes, rebuild and republish:
  `python3 wings-of-wonder/scripts/build-chat-preview.py <scratchpad>/chat`, then Artifact publish of
  `<scratchpad>/chat/wings-of-wonder.html` with `url` set to that link, `root` = `<scratchpad>/chat/files`, and only the
  CHANGED files in `files` (unchanged ones are kept). A first full upload needs two publishes (files-1.json, files-2.json).
- Limits that shaped it: 511 files per artifact, no .glb, no external iframes. The builder drops unused art and packs
  gear/familiar/guardian/fish/wardrobe-card/bow icons into `pack-*.js` data URIs. The builder only sees files tracked by
  git (commit new art first) and writes `files-delta.json` (what to send, `null` = remove) against
  `<scratchpad>/chat-published.json`; copy `files-now.json` over that file after each publish.

Still to do:
- Mounted hair: small redraw specks can remain along the jaw at high zoom (hairs 2, 10); hair 8 has a dark spot in
  the left tail that is in the painting itself.
- User has not yet approved the nine repainted designs (details differ slightly from the old art).
- Other screens not inspected yet: profile, bag/character sheets, rankings, Jungle Trek sprite, wings tab.
- Hosted bundle is 33,499,960 bytes against a limit of about 33,554,432 (54 KB spare). `fit-control-hand`,
  `fit-mask-*` and `leaflight-master` are no longer embedded.
- Hairs 1, 2, 4-8 still use the fixed front/back rectangle; hair portraits are low-res (154x196).
- Fresh save shows short auburn hair (hair 1), not silver hair as the handover describes.
- `dist/` was NOT rebuilt or published; the live site is still v301.
