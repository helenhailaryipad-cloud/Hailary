# Hailary

This repo hosts continued development of **Wings of Wonder** (iPad-portrait fantasy browser RPG, hero REINA).
Read `docs/WINGS-OF-WONDER-HANDOVER.md` before any game work.

- Top priority: the wardrobe/clothing compositor is visually broken. Never claim a visual fix without rendering and looking at real combinations.
- Preserve save compatibility (`wow-save-v1`, version 1), item instance IDs, existing art and project identity.
- `mcp/gpt_image_mcp.py` is an image-generation MCP server (default model gpt-image-2.6-sunburst); the OpenAI key is injected by the session proxy, never committed.

## Current priority (user, 2026-11-20)
Build the SKELETON of the game first: screens, systems and flows that exist and work. Prices, bonuses and all stat
numbers will be tuned together later, so do not spend time balancing now and do not report balance caveats at length;
pick sensible placeholder numbers, keep them in named constants, and move on.

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
Fourth pass (2026-11-19, user feedback): barrels spawn farther and smaller (`Trek.far`
= -0.13, new projection in `drawJungle`); bonuses are collected anywhere on her figure (z 0.64-1.02, |dx| < 0.52);
storm barrels (`type:'elec'`) chain lightning to three neighbours and through other storm barrels; bomb barrels
(`type:'bomb'`) blast neighbours; the charging barrel is now labelled Rush. Bonuses every 4th kill in `dropOrder`:
multi (arrows up to 4, permanent), power (+2 damage, up to 3, changes arrow colour), rocket (10 s of homing rockets with
a blast), wings (rapid fire), shield, heart. A boss (3000 HP, `boss:true`, emberpeak art, HP bar) arrives at 66 s; beating
it gives +1000 and ends the run (`g.endAt`). Barrel HP grows every row. Rival finals are 2500-5000. Gold/XP caps, 90 s
and 3 hearts are unchanged. Balance is tuned by bot simulation only, not by hand play. `drawJungle` uses a flatter projection than before (render only). Sources in
`art-source/trek/`, built by `build-fashion-extras.py`.
Fifth pass (2026-11-19, user feedback): a run is 63 s (`Trek.length`; rows stop at `lastRow` 43, dragon at `bossAt` 46 with
`bossHp` 3600; rival finals 2400-4600). Three more bonuses: `laser` (sun beam, 6 s, burns her column), `chain` (9 s,
lightning to the aimed barrel plus two neighbours), `frost` (8 s, barrels at 45% speed, arrows +3); orbs
`trek-pickup-7..9` from `art-source/trek/orbs2.webp`. Picture: `trekSharp()` renders the 480x800 space at device
resolution (up to 2.5x) and `trekMip()` keeps halved copies of sprites, so nothing is pixelated; Reina bobs, leans
into turns (`g.lean`), pets trail (`g.pets`), and her own wings beat (`registeredCombatBitmap(true)` is the portrait
without wings, the wing art is drawn apart). The pasted wings of the Wings bonus and the hurt blink are gone. The
shield is a honeycomb dome with a light sweep; fire is drawn as painted flame tongues (`tongue`), and the dragon
turns toward the lane and breathes it from its jaws (`h.breath`). The newest finger steers (no stuck pointer).
Hit feedback (sixth pass): `Trek.pop` rings where arrows, rockets, beam and lightning land (`g.pops`), struck barrels
and the dragon jolt (`f.flash`), kills float `+50`; a hit on Reina shakes the view (`g.shake`), flashes a ring
(`g.hitFlash`), floats `−1 ♥`, pulses the hearts and vibrates where supported; a blocked hit says `Blocked!`.
Seventh pass (2026-11-19, user: "too easy; stronger sub-bosses; bosses should explode beautifully; chests at the end;
animate her shot with the image model"):
- Sub-bosses (`Trek.subs`): Thornback (guardian-t15, 1100 HP, at 13 s) lines up with Reina, warns and rushes down her
  lane, then walks back in until beaten; Stormwing (guardian-t19, 2000 HP, at 29 s) strafes and strikes three
  neighbouring lanes at once. Each gives +300 score, a bonus and a chest. The dragon has 4500 HP and is enraged below
  half (breathes sooner, second lane alight). Warnings are shorter (hazards start at age .35-.7 of the 1.6 s),
  barrels speed up over the run, a barrel hits within .36 of its lane (no safe spot between lanes).
- Finale: beating the dragon stops the clock (`g.finale`, `finaleLength` 3.8 s): it shakes with small blasts and rays
  (`g.booms`), bursts (white flash `g.whiteout`, two ground rings, burning pieces `g.debris`), three chests fly out and
  open (`g.chests`, `Trek.chest`), the remaining barrels pop, then the run ends. `Trek.effects` holds everything that
  only fades or flies. If time runs out first the result says THE DRAGON ESCAPED.
- Rewards: `g.loot {gold,wishes,chests}`: 120 gold per sub-boss chest, 150 per dragon chest (three) plus 20 wishes,
  on top of barrel gold (cap 800) and XP (cap 80). HUD shows gold so far; the end panel (`.trek-result`) shows five
  chests (open = earned), prize tiles and the breakdown. Chest art `trek-chest`, `trek-chest-open`.
- Shot animation: `registeredCombatLayers()` (`app.js`) renders the worn look as three canvases through the new engine
  option `only` (figure without bow, bow alone, fingers over the grip). In a run the bow is raised, turns about her
  hand and kicks with every volley (`g.kick`), a four-frame painted flash (`trek-shot`, image model) plays at the bow
  and the arrows leave from the bow. Her ARMS do not move: a drawn pose (pulling the string) would need a repaint of
  every dress and hairstyle per frame; offered to the user as a separate job.
- Bots with human-like reaction delays (`/tmp` sim, not in repo): slow 42% win, medium 72%, perfect 80%.
- Found and fixed: `art-meta.js` still held the 240 px bounds of the old tier guardians, so canvas battles drew only
  the top-left corner of the sharp 600 px art (tier dungeon bosses). `build-fashion-extras.py` now rewrites the bounds.
Mini Games (`games()` in `app.js`): covers are preloaded 0.9 s after start (`preloadGameCovers`) and never lazy
(`eagerArt`); best score/time sit under each title in `.booth-title span` with an explicit colour. The user saw the
old best-score text as black on the iPad; that could not be reproduced in Chromium.

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

## Companion room and appearances (2026-11-19)
Home -> Companion (`cityCompanion()` in `gear-ui.js`) was rebuilt (`.comp-room`; the old layout was broken). Six slot
tabs: Elf, Mount, Cloak, Back Accessory, Footprint, Tail (new slot `tail` in `companionTypes`). Each tab shows a large
preview, a scrollable strip of appearance cards, stats with Looks / Upgrade / Tier-up modes.
- Catalog in `gear-data.js`: `companionSkins` = 21 elves (Dreamveil + 20), 20 cloaks, 10 back accessories, 10 footsteps,
  10 tails. First of each slot is free; others cost gold once (`companionSkinPrice`), owned list in optional save field
  `S.companionSkins` ("slot:id"), worn one in `S.companions[slot].skin`. Validation rejects unowned or unknown skins.
  Appearances never change stats. The Mount tab lists the same 21 mounts as Fashion.
- Art: `scripts/build-companions.py` from `art-source/companions/`. Cloaks, back items and tails are paintings of the
  bald base body; the layer is what lies OUTSIDE her silhouette (`comp-<kind>-<id>`), drawn behind the body through new
  engine slots `cloakBack, backItem, tailBack` (after `wingsBack`), so they work under every dress. Portrait keys carry
  `!cloak.back.tail` (`wardrobeExtrasTag()`), so they show on the home screen and in battles, not when riding.
- Fairy (`comp-elf-<id>`) and footsteps (`comp-step-<id>`) are overlays on the home screen (`cityCompanionEffects`).
- Cards: cloaks, back items and mounts use separate paintings of the WHOLE item (`art-source/icons/`, built by
  `build-companions.py`; the build takes about 10 minutes); never crop a card picture. On the home screen the mounted
  hero is deliberately smaller (`.city-hero.riding`), and footsteps trail to the left behind her feet.
  Footsteps (five rounds of user feedback; the last was a sketch drawn on a screenshot, follow it): `stepTrack(id,cls)`
  in `gear-ui.js` lays six single marks (`comp-step-<id>-mark`, cut from the trail picture by
  `scripts/build-step-marks.py`): the largest between her feet, one small between her legs, the rest beside her left
  leg and on back-left into the distance, smaller as they go; all drawn behind the figure. `.room-steps` in the room,
  `.home-steps` on the home screen (markup order: footsteps, pets, hero, fairy); positions are in "stances" (see the
  comment in `stage.css`). The diagonal trail picture `comp-step-<id>` is only for the cards. Rejected by the user:
  across her legs, to the side at foot level, in front of her, one diagonal strip, and a track hidden behind the legs.
  Nothing is worn on a fresh save (`equipped:false`). Tapping a card she owns (the first of each slot is free)
  wears it at once (`pickCompanion`); unowned cards only preview until Buy & use. Screen id is `cityCompanion`.
- Chat preview packs all `comp-*` art into `pack-comp.js` (file limit). Hosted bundle headroom after this: see build.

## Pets tab (2026-11-19)
Home -> Pet (`cityPet()` in `gear-ui.js`, screen id `cityPet`) was rebuilt after four reference photos (root
`.spirit-room.den`, classes `den-*` in `stage.css`). It always showed flat vector animals (`dragonSVG`) for d0-d3 although
painted art existed; now every pet uses its painting (`petPicture`: `d0..d3.webp`, `familiar-<n>.webp`), and the titles
of d0-d3 say what the paintings show (Grove Dragonling, Ember Drake, Moon Dragon, Star Dragon; names unchanged).
- Formation: team power, Recommended Lineup, a stage with the chosen pet in front and the other two deployed pets
  behind, two skill rows whose tags are REAL numbers (team ATK, badge, kind, stars), level bar, four stats with the
  gain of the next upgrade, one cost line and golden button for the mode chosen in the sub-tabs Pet Feeding / Pet Stars
  / Pet Badge (`petMode`; `petFeed`, `starPet`, `forgePetBadge`), then the three deployed cards with Replace.
- Gallery: rarity badge, name, big art, Summon and Badge side buttons, star row, six-node star track (+30 ATK each),
  shard line with Star-up (or Unlock for gold), strip of all 54 pets. Assist: 3 primary + 12 assist cards. Badge: forge.
- Cards (`petCard`): rarity ribbon and colours (`petRarity`: c r e s l), painting, stars, name, level; the picker modal
  uses them too (`.den-picker`). Text buttons carry an empty svg (`denPlain`) so `decorateArt()` adds no stock icon.
- Second pass (eight more reference photos), with RULE changes in `gear-data.js`:
  - Spare copies: a summon that lands on an owned familiar adds one (`S.petSpares {id:n}`, optional, validated; it
    still gives +100 gold). Synthesize room (`petPage==='Synthesize'`, opened from Gallery): six spare copies of one
    rarity make a random pet of the next (`synthChain`: Common->Rare->Epic->Super Rare, `synthNeed` 6,
    `synthesizePet`); a pet she has already becomes a spare copy. Add fills the six places, Batch repeats while copies
    last, the result opens a Congratulations modal (`synthShow`). Only familiars have copies; d0-d3 do not.
  - Assist has four pages of twelve slots (`assistPages` = hero level 1, 50, 150, 300; `assistSlots`), so up to 48
    assisting pets add their ATK to Reina. This raises late-game attack; the user asked for the reference layout.
  - Gallery: red stars with the next star shown, Pet ATK and star bonus now -> next, Synthesize side button.
- Not done: pet gear/talent/skins/evolution of the reference (we have none); familiar paintings are 512 px and
  slightly soft on the big stage at 2x.
- Pets fight beside Reina (user: "these pets are also fighting in dungeons and always with Reina"): in every crawl
  hall (dungeons and EXP dungeon) the three Primary Pets trail behind her (`crawlPets`, `movePets`, `PET_SPOTS` in
  `dungeon-crawl.js`) and, once the enemy is engaged, each sends a bolt every 2.4 s for 35% of its own ATK
  (`petSupport`, called from `updateBattle` in `world.js`; `PET_HIT`, `PET_PACE`). This is extra damage on top of the
  ATK the pets already lend Reina. Jungle Trek shows her first two deployed pets instead of fixed d0/d1 (`trekCrew`).
  `petArtId(id)` maps a pet id to its art id. Spars and Castle Defense do not show pets.

- Pets in the tab (user: "launch pets in the tab"): Wonders -> Pets (`collection()` with `filter==='dragon'`, also the
  Pets section tab) now opens the Pets room instead of the old flat-animal gallery; `petBack`/`petLeave()` make its
  back arrow return to Wonders (Wings), or to the city when opened from there. Pet Summon moved into the room
  (`petPage==='Summon'`, from Gallery; `summonPets` shows painted `petCard` results). `dragonSVG` returns the painting
  for d0-d3 everywhere; the flat drawing remains only for Emberheart's evolution preview (explicit `stars`).
  `showPetGallery` is no longer reachable from the UI.

- Sharp, visible pets (user sent a screenshot of a grey silhouette: "where are they, draw them clearly"): pets not
  collected yet are shown in FULL COLOUR with a padlock chip on the card and a "Not collected yet" ribbon on the stage
  (never grey them out again). The 50 familiars were repainted at 1024 px by the image model from the old 512 px
  paintings (same designs, crisper outlines, no haze); sources in `art-source/familiars/`, built to 720 px by
  `scripts/build-familiars.py` (takes about 5 minutes; run it in the background). Cache tag `?v=sharp3` in
  `gear-data.js` (the chat builder patches that exact string). Hosted bundle headroom about 1.13 MB.

- Pet Gear and Pet Talent (user sent 15 reference photos, no text; original names, icons and numbers, similar
  mechanics). Formation sub-tabs are now Pet Feeding / Pet Gear / Pet Talent (`petModes`; Star-up stays in Gallery,
  the badge forge in the Badge tab). Both systems belong to the Primary Pet SLOT (0-2), stay when the pet is replaced,
  and count only while a pet stands in the slot. Rules in `gear-data.js`, optional save fields, validated:
  - Gear (`S.petGear` = 3 x 8 levels, 0-100): eight pieces (`petGearPieces`), ten levels per tier (T1-T10), gold per
    level and shards for the first level of a new tier (`petGearCost`); Horn/Fang/Claw/Orb add pet ATK (+4), Collar/
    Plate Reina HP (+30), Brace/Ring Reina DEF (+6); set bonus = lowest tier x 4% bolt damage (`petGearBonus`). UI:
    `petMode==='Gear'`, tiles left and right of the pet, Upgrade and x10 (`petGearUp`). No bag, synthesis or reset.
  - Talents (`S.petTalents` = {seals, books, slots:[{open, cells[15], locks, target}]}; starts at 300 seals): sixteen
    talents (`petTalents`, eight attack that shape that pet's bolts, eight guard that strengthen Reina), fifteen cells a
    slot (six open, more for seals). Learn (60 seals, +50% per lock) inscribes a random missing talent into an empty
    cell or over a random unlocked one; Prophecy (one book) shows the result first (Keep / Let go, `talentPending`);
    Learn Target makes one talent four times likelier; Supreme talent Dragon's Roar awakes at twelve talents (every
    fifth bolt x3). Talent Shop (`petPage==='TalentShop'`): Prophecy Book 50, any talent scroll 400 (needs an empty
    cell), Fragment exchange (spare copies or 1,000 gold -> seals). Seals also come from dungeon guardians (+30) and
    Jungle Trek chests (+10 each). Pages: `petPage==='Talent'` (`talentGo(slot)`), back arrow to Formation.
  - Fights: `petBolt(s,slot,id,ctx,rng)` and `petBoltPace` replace the fixed 35% / 2.4 s in `petSupport`;
    `talentGuard` runs Mending Breath and Last Stand. Stat talents and gear HP/DEF are added in `stats()`.
  - Icons: three atlases `comp-pet-talents` (4x4, order of `petTalents`), `comp-pet-gear` (4x2), `comp-pet-misc`
    (seal, book, supreme, scroll) from `art-source/pets/`, built by `scripts/build-pet-talents.py`; shown through CSS
    variables set once by `petArtVars()` (`denIcon`). Buttons that hold only an `<i>` icon need `denPlain`.
  - Balance is NOT play-tested; hosted bundle headroom about 0.77 MB.

- Three pets beside Reina (user: "3 pets are always on screen next to the hero, but first they must be placed in the
  chosen window"): the home screen shows exactly the pets of the three Primary Pet slots (`home()` in `app.js`,
  `.city-pet-<slot>`: slot 1 left, slot 2 right, slot 3 in front on the stone circle); an empty slot shows nothing, no
  stand-in pet any more. Jungle Trek runs with all three (`trekCrew`, `g.pets[3]`); dungeons already did.
  Second request: larger and closer to her (pets 21-22% wide, about a third of her height, touching her sides).

- Pop-ups, not full-screen dialogs (user, with a screenshot of the talent guide filling the screen): every dialog of
  the Pets room opens through `popup(html)` (`app.js`), which is `modal()` plus the class `den-pop` on `#modal`: a card
  at most 430 px wide and 74% of the height, centred, small text, scrolls inside, no "Menu" button under it.
  `modal()` removes the class again. Use `popup` for new information and choice windows; buttons in them need
  `denPlain` too. The user plays in the chat's side pane (about 590 x 690 px), so check pop-ups at that size.

- Item cards (user sent five photos of shop tooltips; "names can be different"): tapping a ware in the Talent Shop
  opens `talentWare(id)`, a small card (red head with icon, name, type, "For: Slot N"; "Item Description"; reason when
  it cannot be bought; Buy with the price). Buying happens only from that card (`talentBuy`). Wares that cannot be
  bought are dimmed (`.den-off`) but still open their card. Reuse the `.den-item` card for other shops.

- Full talent shelf (eight more shop photos: about twenty talent books, some named "Top ..."): `petTalents` now has
  24 talents, twelve attack and twelve guard. New: Venom Fang, Tidal Flux, Loyal Heart (Crit +2%), Swift Bond
  (Speed +4), Calm Mind (Crit RES +3%), and three `top` talents (Apex Fury, Apex Star, Apex Aegis) that never come
  from Learn or Learn Target, only from a 1,000-seal scroll (`talentTopScroll`, `talentPrice(id)`); Top wares have a
  gold card and a star chip. Icons: `art-source/pets/extra.webp`, atlas `comp-pet-talents` is now 4 x 6.
  Notes in the Pets room are a small pill at the top (`body[data-screen=cityPet] .toast`), not a big banner.

- Counter talents (the reference has "Counter" and "Counter shake"; user: add them if worth it): 26 talents now.
  Riposte (guard): when a hit lands on Reina the pet strikes back at once for 60% of a bolt, once every 3 s
  (`petCounter(g)` in `dungeon-crawl.js`, called at the end of `enemyStrike` in `world.js`; `riposteShare`,
  `riposteEvery`). Aftershock (attack): a hit on Reina charges the pet (`p.charged`), its next bolt deals double.
  Icons in `art-source/pets/counter.webp` (atlas row 7).

## Back buttons (2026-11-20)
User circled a tiny "‹" in a corner: "check all back buttons everywhere, draw them clearer, not so small, with a special
icon in the style of our game". One painted icon, `ui-back.webp` (gold-rimmed blue disc, ivory arrow; image model;
`art-source/ui/back.webp`, `scripts/build-ui-icons.py`), is now the only Back sign:
- Corner back buttons carry the attribute `data-back` (their "‹" text stays for screen readers but is invisible): all
  city rooms (`.spirit-nav`, `.comp-back`), Harvest Pairs, Jungle Trek. CSS at the end of `stage.css` draws the icon,
  at least 52 px, without frames. A new room's back button only needs `data-back`.
- `uiIcon('back')` returns the same icon (`.back-ico`), so text buttons "Back", "Back to ...", "Return to ..." and
  "Hero" get it too (`actionArtName`).
- The global "Menu" pill (`.return-to-menu`) shows the icon plus the word, sits top-left, and is hidden on screens
  that have their own `data-back` button (`body:has(...)`), where it used to cover the title.
Checked on 36 screens at 590 x 690. Never use a bare "‹" or "←" for going back again.

## Bag, Warehouse, Devour (2026-11-20)
User sent 12 reference photos ("the bag and its contents"). Home -> Bag (`cityBag()` in `gear-ui.js`) kept its layout and
got contents; the bottom bar (`satchelNav(here)`) now leads to four real screens: Bag, Gear Crafting (`cityCraft`,
unchanged), Warehouse (`cityVault`), Devour (`cityDevour`). Rules in `gear-data.js`, all numbers are placeholders.
- Items: `bagItems` (16 stackable things: two XP items, two coin items, Oak / Moon / Winged Chest, Armourer's Crate,
  Vigor Tonic, Wish Ticket, Pet Egg, Seal Satchel, four material bundles). Optional save field `S.bag {id:n}`; a save
  without it holds `bagStarter`. `useBagItem(s,id,count,rng)` returns `{ok,used,gains}`; chests have a fixed part
  (`give`) and one random surprise (`pick`). Sources so far: every dungeon win gives an Oak Chest (Moon Chest on a
  first clear), beating the Jungle Trek dragon gives a Moon Chest.
- Tabs (`bagTabs`, four as in the reference): Common = items + spare equipment (worn pieces are only on the rails),
  Materials = equipment materials, talent seals, prophecy books, Pet = Pet Egg, Seal Satchel, spare pet copies with
  n/6, Ember shards, ALL. The Warehouse has Common / Materials / ALL. Do NOT add equipment tabs to the bag: the user
  rejected that reading (see Gear Crafting below). Tapping a
  tile opens the item card (`bagOpen(key)`, the `.den-item` pop-up) with Use / Use N; the result is a "You received"
  pop-up (`bagUse`, `bagGain`). Tile keys: `i:<item>`, `m:<material>`, `g:<uid>`, `p:<pet>`, `t:seals|books|ember`.
  Capacity (`bagUsed` / `bagCapacity` 150) is only shown, nothing is refused yet.
- Warehouse: stored things on top, the bag below (Common / Materials / ALL). First tap chooses (name + Deposit /
  Withdraw button), second tap on the same tile moves it (`vaultTap(side,key)`, `vaultShift`). Equipment uses the old
  `stored` flag; stacks and materials move whole into optional `S.vault {"i:<id>"|"m:<id>": n}` (`vaultMove`); stored
  materials do not count for costs. The old Gear -> Warehouse page (`gearWorkspace`) still exists.
- Devour: the Glimmer Maw eats spare equipment (`devourable`, `devourGear`): essence by tier, grade, stars, enhance
  (`devourWorth`), levels by `devourNeed`, each level +6 ATK, +60 HP, +5 DEF (`devourStep`, added in `stats()`);
  optional `S.devour` (total essence). Stars and gems on eaten pieces come back as shards and gems.
- Art: `art-source/bag/items.webp` (4 x 4 sheet in the order of `bagItems`) and `maw.webp`, built by
  `scripts/build-bag-icons.py` into `comp-bag-items` and `comp-bag-maw`. Tiles need `denPlain` (stock icons).
- Quality ladder and Gear Crafting (user 2026-11-21, ten photos of the reference: "they are gathered not from 1
  star but from 2 stars, and those are orange; a red 2-star is crafted from orange ones; they drop in the dungeon
  together with purple and blue ones, which can then be devoured"). Rules in `gear-data.js`:
  - `gearRanks`: Blue (0★), Purple (1★), Orange (2★), 2-Star Red, 3-Star Red, 4-Star Dark Gold, 5-Star Pink, 5-Star
    Relic, Rainbow, Divine Rainbow. A piece keeps its place in the optional field `rank` (validated against `stars`);
    pieces from before the ladder are read from their stars (`gearRank`, `legacyRanks`) and keep the same stat bonus
    (`bonus`, used in `detail()`). Tile frame and plate colour = quality (`--rarity`, class `q-<id>`), not tier.
  - Guardians drop three pieces of one tier (`bossDropRanks` = Orange, Purple, Blue; `bossLoot` returns `entries`).
    Rare drops on top (user: "dungeons sometimes also give 2-star red, and promise all sorts of things but never
    give them"): `bossRare` = a 2-Star Red piece 8%, Jewel Box 10%, Pet Egg 5%, Winged Chest 2%, each rolled on its
    own; `bossLoot` returns `rare`. The lobby's Rewards column has "Rare drops" (`dungeonLoot()`: every drop with its
    REAL chance; never list a reward that cannot drop), and the victory window names what dropped.
  - `craftGear(save,slot,tier,rank,uids,rng)`: `need` spare pieces of the quality below, same tier and family
    (`gearGroups` = Equipment / Necklace & Amulet / Rings, any slot inside the family; `craftInputs`), plus `mats`
    for Dark Gold and finer (existing materials: essence, gems, synthesis stones). It makes a NEW piece of the chosen
    slot that keeps the highest enhancement and gems of the inputs. 2-Star Red is `flex`: fewer than five pieces work
    at 20% each (`craftChance`); a failed try loses them. The old "add a star to this piece" action is gone
    (`perform(...,'star')` refuses; the item dialog and the old Forge page point to Gear Crafting).
  - Screen `cityCraft`: quality list with tiers on the left, result tile, success rate / "At least N pieces",
    material tiles, input places (tap + to pick, tap a piece to remove), Batch (2-Star Red only) / Add / Synthesize,
    then one tile per slot of the family with the number of usable pieces; family tabs at the bottom; `?` = ladder.
  - Devour: the quick button picks only Blue and Purple; Relic and finer cannot be devoured (`gearNoDevour`);
    Auto devour (optional `S.autoDevour`) feeds Blue and Purple drops to the Maw as they drop.
  - Not done from the photos: Tier-up and alternative input tabs (Red 3-Star / Dark Gold gear / Pink Gear), locked
    extra places, the Devour pop-up with a tier filter and the Maw's Upgrade button, Male Gear.
- Equipment art is ONE design per slot in eight tier colourways (user 2026-11-21, with photos of the reference where
  T4, T7, T16 sets share their shapes: "make all sets alike, differing a little and by colour"). All ten slots were
  repainted by the image model, one 4 x 2 sheet per slot (`art-source/gear/<slot>.webp`: ivory-green, silver-emerald,
  silver-indigo, pearl-violet, gold-white, bronze-crimson, midnight-silver, crimson-rose gold), built by
  `scripts/build-gear-sets.py` (about 3 minutes, run in the background) into `gear-<slot>-t1..8.webp` + AVIF copies.
  The head slot is a winged helmet now (it showed tiaras that read as rings; slot name Helmet, items "<tier> Helm",
  slot id still `crown`). Do not give tiers different themes again. The eight themed helmets the user liked "for
  fashion" are kept in `art-source/fashion/helms.webp` (not in the game yet). Gear art cache tag is `?v=4` (the chat
  builder patches that exact string).
- Not done from the reference: bottom-row extra slots, the star bands of Gear Crafting (ours is 1-5 Star Gear),
  capacity limits, Convert in bulk. Hosted bundle headroom is about 0.14 MB after the Summon room: add AVIF
  copies of older art (or lower their quality) before adding more pictures.

## Summon room (2026-11-21)
User sent nine reference photos (no text): a Summon icon on the home screen, Basic Summon, Advanced Summon, a shop
for summon by-products, and an event that pays advanced tickets for basic summons. Home -> Summon now opens
`citySummon` (`gear-ui.js`, root `.satchel.well`, page in `summonPage`: Basic / Advanced / Shop / Gala); the old
Wishing Tree is still under Wonders -> Wishes. Rules in `gear-data.js` (placeholders), optional save field
`S.summon {adv, pityE, pityS, orbs, marks{r,e,s}, shop{week,bought}, gala{season,day,basic,claimed,tokens,got}}`,
read through `summonState(s,now)` which applies the resets.
- Basic (`summonWells.basic`): a Wish Ticket from the bag or 50 wishes; Common 45 / Rare 35 / Epic 16 / Super Rare 4.
  Advanced: a Star Orb or 30 prisms (`S.scales`); Rare 50 / Epic 38 / Super Rare 12, an Epic or finer every 10 draws
  and a Super Rare every 40 (`summonPity`); ten advanced draws raise the Summon Level (1-20, `summonLevel`).
  `summonDraw(s,kind,count,rng,now)`; a repeat pet is a spare copy + 100 gold. The Pets room's own Summon page
  (`summonPets`) uses the same rule. `summonShow` is the result window (cards turn up one by one unless Skip is on).
- Spirit Marks: every Rare / Epic / Super Rare pet from either well leaves one mark of its rarity (Rare, Epic, Royal
  Mark). Mark Shop (`markOffer`, `buyMarkPet`): any pet of those rarities for 20 marks, three of each a week (restock
  Monday 00:00 UTC), Rare from Summon Lv. 1, Epic from 5, Super Rare from 10. Filters All / Super Rare / Epic / Rare.
- Summon Festival: eight quests for Basic summons made today (10 ... 80) pay Star Orbs and tokens (`galaQuests`,
  `galaClaim`; reset 00:00 UTC); tokens open five milestones (`galaMilestones`: Pet Egg, Seal Satchels, an Epic pet,
  Winged Chest, a Super Rare pet; `galaReward`). The Festival season is the UTC calendar month (`galaEnds`).
- Art (image model): `art-source/summon/{oracle,glade,stall,icons}.webp`, built by `scripts/build-summon-art.py` into
  `comp-summon-*` (+ AVIF copies). Pets on the pages are the game's own paintings. Icons: `sumIcon(n)` (Star Orb,
  three marks, token, level card).
- Fixed on the way: `.satchel-top span` also styled the icon inside each wallet chip, so the wallet icons of the Bag,
  Warehouse, Devour and Gear Crafting were dark blobs (`.satchel-top>span` now).
- Not done from the photos: element badges on pets, "need N more stars" conditions, the per-pet banner rotation.

## Sky Contest: Totem War (2026-11-21)
User sent the reference's battlefield rules, then nine photos (Gameplay hub, Peak Contest list, Elements lobby with
Reward Preview / Ranking Rewards / Contest Shop / rules) and said "go" to: own entry, auto-fight with totem orders,
3-minute fights, two rewarded fights a day. Gameplay's fifth tab is now "Sky Contest" (`contestList()`: Star Duel,
Totem War, Storm Brawl, Shadow Hunt; only Totem War is open). Screen `cityContest` (`gear-ui.js`, `contestPage`:
War = lobby, Fight, Shop). Rules in `gear-data.js` (placeholders, `warRules`), optional save field
`S.contest {medals, day, runs, best, wins}`.
- Fight (`warNew`, `warStep` every 0.5 s, `warTally`): three factions (`warFactions` Ember / Tide / Gale) of five;
  Reina leads the chosen one (power x1.25), the rest are AI. Every 30 s a fighter's points = kills x10 + assists x5 +
  totem hits x2, times (1 + 0.2 x totems the faction holds). A totem (600 HP) falls to the faction that damaged it
  most; holders slowly mend their own. Defeated fighters return home after 6 s. Tap a totem to send Reina there
  (`warOrder`/`warSend`), Auto lets her choose, x2 speeds the clock. `warTick` drives the screen; `warPaint` only moves
  what `cityContest()` drew (fighters are `.tw-f`, Reina `.tw-me`; never use the class `hero`, a global rule makes it
  485 px tall; fighters have `pointer-events:none` so taps reach the totems).
- Rewards: quests at 60 / 150 / 300 points pay medals and an item into the bag at once (`warQuestsDue`); the final
  ranking of all 15 pays medals and items (`warRanks`, `warSettle`); only the first two fights of a UTC day pay
  (`warStart`), later ones are practice. Contest Shop (`contestShop`, `buyContest`): bag items for contest medals.
- Art (image model): `art-source/contest/{key,field,sheet}.webp` -> `comp-war-key`, `comp-war-field` (the three
  daises are at `warTotems`), `comp-war-icons` (totems, medal, emblems, crown) by `scripts/build-contest-art.py`.
- Fixed on the way: the Gameplay banner was a `<header>` (hidden/out of flow inside `#main`), so every Gameplay page
  was squeezed into its top 18%; it is a `div` now. `scripts/build-hosting-avif.py` added AVIF copies of five big
  atlases (headroom about 0.42 MB after this pass).
- Not done: Star Duel, Storm Brawl, Shadow Hunt, betting, the contest privilege, timed opening hours.

## Cloud War second pass (2026-11-21)
User sent two photos of the reference's cloud war (territory map with owners and "Boss: N", round timer, Killing
Points 390/1200, Cloud Shop / Faction Battle Status / Point Rewards / Rankings / Description; the territory hall
with a boss list). Our Cloud War (`cityCloudWar`, `cloudCount` 4, Reina = Galewing `cloudMine`) already had the map,
territory windows with ten defenders and the fight; defenders never came back and the "chests" were only counted.
- Rounds: one UTC hour (`cloudRules.roundMs`). `cloudRoundCheck()` (on opening the map, a territory, and every second
  of the patrol timer) starts a new round: `S.cloudWarHits` and the bots' `S.cloudPatrol` are cleared, so all
  defenders return, and territories taken in the old round are kept in `S.cloud.held` (`cloudNewRound`). `cloudOwner`
  = this round's taker (80 points) or the held owner.
- Carnage Points: a defeated defender gives 10 / 20 / 30 (`cloudEnemyScore`) up to 1200 a UTC day (`cloudGain`) and
  as many Cloud Tokens; a Golden Boss also gives a Moon Chest, an Elite an Oak Chest (`cloudLoot`), straight into the
  bag. Optional save field `S.cloud {round, held, day, carnage, claimed, tokens}` (`validCloud`).
- Map: round clock and Level at the top, every territory says owner and "Boss: N" (`cloudAlive`), Carnage bar, tool
  bar Cloud Shop / Faction Status / Point Rewards (red dot when claimable) / Rankings (AI rivals, simulated) / Guide;
  all windows are pop-ups (`cloudShopShow`, `cloudStatusShow`, `cloudPointsShow`, `cloudRankShow`). Icons reuse
  existing `hud-*` art (no new pictures).
- Roads (user explained the photo: "one of four factions; when the 6 cities are opened with at least 80 points each
  the lines join; a dashed line marks cities that could be opened but belong to other factions, so they are left
  alone"): in `cloudFourBoard` a road inside a sector is lit (gold for Galewing, faction colour for the others) only
  when both of its cities are open for that sector's faction; roads into another sector are dashed. Reina opens only
  Galewing's six cities (`cloudOpen`, counter "Galewing cities open n/6"); other factions' cities open as look-only
  windows (`.cloud-foreign`), `cloudStrike` refuses them. The Guide text says the same.
- The fight (user photo "this is how the fight goes": auto-fight in the city hall with a boss list beside it): under
  the canvas `cloudHall(index,current)` shows Carnage Points, the city's territory points and Occupied / Not occupied,
  the Holy Land owner, and two tabs: Boss List (all ten defenders by name, `cloudBossName`; Refreshed / return clock /
  Fighting; which faction beat it) and DMG Rankings (defenders beaten by Reina and her faction's AI squad). Tap a row
  to fight that defender (`cloudHallPick`). "Auto next" (`cloudAutoNext`, on by default) moves to the next standing
  defender after a victory (`cloudNextTarget`) instead of returning to the map. Rows need full overrides of the global
  `#main button` rules (see the end of `stage.css`).
- Pathfinding: the player chooses whom to go to (user: "after choosing the boss on the left she rides to him on her
  mount; I choose myself where to go"). A tap on a Boss List row (`cloudHallPick`) stops the current fight
  (`canvas.dataset.stop`, the frame loop and the victory timer check it) and runs `cloudRide(index,slot)`; Auto next
  uses the same ride.
- Pathfinding (user photo of the hero driving between bosses): with Auto next, 2.4 s after a victory the canvas is
  cleared and Reina rides across on her chosen mount (`reinaLookPath(true)`, `.cloud-path`, `cloudRideMs` 1.9 s) under
  "Pathfinding to <next defender>", then the next fight starts.
- City window (user: "I tap the icon and choose the boss on the mini-map", photo of the Palace City window):
  `cloudPortalPreview` for the four-faction map shows Ownership, the mini-map of ten defenders (HP bar under each,
  defeated ones grey with the return clock), Current points of the factions (80 open the city), Killing Rewards of
  the chosen defender (territory and Carnage points, its chest) and Go. Tapping a defender only chooses it
  (`cloudChoose`, state `cloudPick`; the first standing one is chosen by default); Go starts the fight (`cloudGo`).
  Other factions' cities show the same with Go disabled. Mini-map width is tuned so Go fits at 590 x 690.
- Ownership reward (user: "when a city is taken, the reward shows as a small chest above the city"): every city held
  by Galewing (`cloudOwner(i)===cloudMine`) pays once a round (`cloudOwnReward` by rank: Holy City Moon Chest + Wish
  Ticket, Fortress Oak Chest + Star Shard Pouch, Island Oak Chest; `cloudOwnTake`, `S.cloud.got` cleared by
  `cloudNewRound`). Until taken, a bobbing chest (cut from `comp-bag-items` with the SVG clip `#cloudChestClip`)
  floats above the city on the map; tapping it (`cloudOwnClaim`) or the city window's "Ownership Reward" button pays
  into the bag. Nested `<svg viewBox>` did not clip there, use the clip path.
- Not done: Cloud Hunt, buying extra Carnage, Bizarre Lands, other players' damage shares on the boss bar.

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
