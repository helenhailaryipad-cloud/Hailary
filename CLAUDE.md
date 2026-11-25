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
- Wing root at the shoulder blades (2026-11-25, user: "the wings are on her bottom, they must come from the back"): the
  wing fit box moved up (`fit:[-135,-140,720,600]`, root near y 215-230 of the 500 x 800 body; then user: "not from the neck"); the square starter wings
  w0-w3 have their root low in the picture and get a `rect` from `WING_ROOT` (root y 232, tips inside the padding); the
  Character page's separate wing picture `.reina-sheet-wings` is lifted (`inset:0 9% 40%`).

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

## Crystal Cascade, Pairs effects, Mini Games grid (2026-11-22)
- Leaving a running game (user: "Leave adventure has two buttons, Menu and a close cross, a mess, and does not work"):
  `go()` opens `leaveAsk(id)`, one `popup` card with Keep playing / Leave (`leaveNow` ends the run, then opens the
  screen); the in-game Finish / Retreat window (`requestFinish` in `game-polish.js`) uses the same card. `.leave-modal`
  hides the close cross and the Menu pill.
- Double-tap guard (user: "we double tap and it drops back to the main menu"): the second tap landed on a Back /
  Menu button of the screen that had just opened. `openScreen` (and `openCascade`, `showCascade`, `openPairsBoard`)
  stamp `screenChangedAt`; a capture-phase click listener drops clicks on buttons in the next 450 ms. `touch-action:
  manipulation` on the page stops iPad double-tap zoom.
- Drops to the home screen in the middle of a game (user, twice): no code path navigates on its own; the page
  RELOADS (the chat preview reloads for everyone when a new version is published, and iPad Safari reloads a heavy page
  under memory pressure - the preview carries ~75 MB of packed art). Now `openScreen` remembers the screen
  (`rememberScreen`, localStorage `wow-last-screen`) and start-up reopens it for 30 minutes (`resumeScreen`; running
  games map to their lobby or Mini Games via `RESUME_AS`) with a short "Welcome back" note. Memory use of the preview
  packs is still high; lazy-loading packs would be the next step.
- Crystal Cascade second pass (user: "poor, does not open to the sides, more stylish, first level easier"): full
  screen width (removed from the 55dvh width rule), three columns (Score / Level with progress bar / Rows / Best on the
  left, the well in a gold frame with gem corners, Next and Chests on the right), pause button, turning rune circle and
  checker cells in the well, a landing beam and filled ghost, a red glow when the stack nears the top, drifting motes.
  Level 1 falls slower (1 s a row, `speed`) and deals only the simple shapes (`easyShapes`: beam, square, crown, two
  hooks); the zig-zag steps join from level 2.
- Crystal Cascade third pass (2026-11-24, user: "ugly buttons, the page gets selected when I hold, boring squares, rows
  do not burst"): painted pad buttons and pause / play (atlas `cascade-pad` 4 x 2, position set inline as `--bp` by
  `casBp(n)`), stat plaques with painted icons (`cascade-stats`: star, crown, bars, trophy), new 3D tiles (old ones kept
  as `art-source/cascade/tiles-v1.webp`); a light sweep runs across the stack. A finger held still on the well for
  220 ms makes the piece fall fast (`CASCADE_HOLD_*`), the Fall-faster button repeats as fast; no text selection or
  callout on the screen (`user-select`, `touch-action:none` on well and pad). Bursts: a light beam along each row,
  rising motes, rays for 3+ rows, white flash. Sources `art-source/cascade/{pad,stats,tiles}.webp`.
- Buttons and result windows (2026-11-24, user: "buttons don't work, I can't get back to the lobby, the result pop-up is
  poor"): Back during a run used `confirm()`, which the chat preview's sandbox blocks, so it did nothing. Never use
  `confirm()`/`alert()`; Cascade now has a card over the well (`cascadeMenu('pause'|'leave')`: Resume / Restart / Lobby,
  Keep playing / Leave). Pad buttons carry captions (Left, Turn, Drop, Faster, Right). Shared result window
  `resultShow({title,kicker,stars,score,body,buttons,win})` / `resultClose()` in `app.js` (`.wr-*` in `stage.css`):
  painted ribbon, rotating light burst, stars that pop in, a score that counts up, prize tiles, painted gold / violet
  buttons, confetti on a win (art `ui-result-ribbon`, `ui-btn-gold`, `ui-btn-violet`, `ui-result-burst` from
  `art-source/ui/result-{sheet,burst}.webp`, `build-ui-icons.py`). Used by Crystal Cascade and Crownfall Vale.
- Crystal Cascade fourth pass (2026-11-24, user: "the Drop caption falls off the screen; holding should keep moving;
  buttons load only when I press pause; silly little balls, I want beautiful explosions; more rows, more points"):
  smaller pad keys with captions on one line and room for the iPad's bottom edge; held pad buttons capture the finger
  and repeat after `CASCADE_REPEAT_WAIT` 160 ms every `CASCADE_REPEAT_MS` 50 ms; a finger that drags sideways on the well
  and then rests keeps the piece sliding (`slideOn`); every picture of the screen, pause card and result window is
  preloaded and decoded on the lobby (`CASCADE_ART`, `cascadePreload`). Rows burst with painted effects (`cascade-fx`,
  image model on black, `art-source/cascade/fx.webp`: starburst, crystal blast, light streak, ring; `cascadeBlast`,
  `cascadeDrawFx`, `screen` blending - `lighter` turned four rows into a white blob); the glowing motes are gone.
  `lineScore` is now 100 / 400 / 900 / 1600 x level and the pop-up shows the points.
- Crownfall Vale (2026-11-24): the Upgrade button no longer appears / disappears (it pushed the field); it stays,
  greyed, "Choose your building to upgrade". Battle effects (`valeFx`, `drawValeFx`, render only): a ring when troops
  march out, glow under marching troops, flashes where they hit a building, a light pillar with rays, rings, sparks and
  "Captured!" / "Lost!" when a building changes side, a rising ring and "Tier II!" on upgrade, violet zaps from
  towers. Result window with 1-3 stars by time (`VALE_STARS` 90 / 150 s), crown, rewards, Next level / Replay.
- Harvest Pairs third pass: new clean cover (basket on a soft garden) and lobby background (empty terrace, no painted
  person; the live Reina portrait stands on it); the 3-2-1 dial is a centred CSS dial (`.pairs-dial`); the field has
  soft light, a faint cell lattice and an inner frame instead of flat green.
- Crystal Cascade (`src/cascade.js`, screen id `cascade`, Mini Games card + sub-nav tab): a falling-block puzzle with
  original magic art. Rules in `Cascade` (pure, `node scripts/test-cascade.mjs`): 10 x 20 well, seven four-crystal
  shapes with a seven-bag, kicks, ghost, soft / hard drop, lock delay, 100/300/500/800 x level for 1-4 rows with names
  (Spark!, Twin Burst!, Triple Nova!, Arcane Cascade!), combo, Crystal Clear bonus, a level every ten rows. Chests at
  1,500 / 4,000 / 8,000 points (Oak / Moon / Winged into the bag); gold = score / 10 (cap 800), XP cap 80, two rewarded
  runs a UTC day (optional `S.cascadeDaily {day,runs}`, `S.cascadeBest`). UI under the `CASCADE_UI` marker: canvas well,
  shards / rings / sparks / row flash / shake on bursts, queued pop-ups (`cascadePop`, never two at once), chest
  pop-ups, result pop-up with chests opening one by one and confetti. Touch: tap turns, drag moves, flick down drops;
  pad buttons repeat while held; keyboard arrows / space. Art (image model): `art-source/cascade/{tiles,chests,cover}`
  -> `cascade-tiles`, `cascade-chests`, `cascade-cover` by `scripts/build-cascade-art.py` (also writes AVIF copies).
- Harvest Pairs effects (user: "too primitive"): an energy bolt draws along the joining line with a glowing orb
  (`pairsEnergy`, SVG animateMotion), both tiles flare and burst into a ring and sparks (`pairsBurst`), a cleared basket
  sends a star shower and "Basket cleared!" (`pairsShower`), the finish panel pops in with turning rays and confetti
  (`.pairs-done`, `pairsConfetti`). Tiles are freed at once as before; only the visuals last longer.
- Dragon Merge (user: "the merge flash is poor"): `mergePair` adds a burst (`g.bursts`: white-to-colour flash, two
  shock rings, turning light rays, `drawMergeBurst`), sparks and stars with trails, shards cut from the two old eggs
  (`drawMergeFx`), an elastic pop of the new egg (`b.pop`) with a glow, a bouncing gold "+points" / "CHAIN ×n" label and
  a small shake (`g.shake`). The global Menu pill is hidden on gameShell games (they have "Mini Games"), it covered
  the title.
- Covers (user: "you drew a character from someone else's game - never draw characters from other games"; covers must
  not be over-processed): Jungle Trek cover = OUR Reina (image-model edit with `art-source/leaflight/master.png` as the
  reference: lavender braid, green-gold dress over green leggings, blue-gold bow), a dragon and barrels; Crystal
  Cascade cover redone cleaner; Fishing card has its own cover with a leaping fish (`cover-fishing`). Sources in
  `art-source/{trek,cascade,fishing}/cover.webp`, built by `build-cascade-art.py`. For any picture with a hero, always
  give the image model Reina's own art as reference and never describe a known character from another game.
  Helper for edits with reference images: `/tmp/claude-0/pairs/edit.py` (session scratch, not in repo).
- Mini Games list is a compact 2-column grid (overrides at the end of `stage.css`); Jungle Trek has a new cover with
  the dragon (`cover-jungle`, source `art-source/trek/cover.webp`). Hosted bundle: AVIF copies of crownfall-vale,
  cloud-war-twin-islands and cloud-war-realms-2 were re-saved at quality 34 (headroom ~180 KB).

## Burrow Blitz daily challenge (2026-11-25)
User sent photos of the reference's whack-a-critter "Max Combo" ("find the good ones fast, never tap the bad ones").
Own name and art. `src/burrow.js` (rules `Burrow`, pure, `node scripts/test-burrow.mjs`; UI below `BURROW_UI`), screen
`burrow`, a tile with a DAILY badge in the Mini Games hub (`MINI_GAMES` row; user did not notice the first version, a
strip under the featured game, so the hub grid is now 4 + 3 centred tiles) and the games sub-nav. Not in the `ARCADE`
rotation: it has its own daily ranking. `burrowStrip()` is unused.
- Run: 60 s, twelve burrows in a zig-zag (`BB_SPOTS`). Friendly: Acorn Vole +2, Berry Hamster +4, Sunbloom Hamster
  time +4 s, Lucky Gemkit +20; frost: Frost Imp, Icicle Bat, Hail Golem, Snow Wisp freeze taps for 3 s and break the
  streak. Streak multiplier x2 from 8 ... x5 from 32 (`mult`); it breaks after 2 s without a friendly tap. Pace rises
  over the run (`pace`). Taps act on pointerdown. 3-2-1 + "Challenge starts!", painted hit sparks (`burrow-fx` = the
  cascade-fx sheet with brightness as alpha: blend modes do not reach through the field's stacking context), floating
  numbers, streak banners, a frost frame while frozen, shared `resultShow` (stars at 400 / 600 / 700).
- Attempts: 1 free a UTC day + 1 extra for 50 prisms (`burrowBuy`); later runs are practice (no reward, no rank).
  Point Rewards by score bracket after every rewarded attempt (gold + bag items); the best rewarded score of the day
  ranks against 40 simulated AI (`field`, they finish through the day) and Ranking Rewards are mailed once when the
  day turns (`Burrow.roll` -> `burrowState()`, "Meadow Warden"). Optional save field `S.burrow {day, runs, extra, best,
  all}` (`Burrow.valid`).
- Lobby: title, critters popping from burrows + the live Reina portrait, Rankings board and short Rules side by side,
  Attempts left (+), Challenge, round Scoring Rules / Ranking Rewards / Point Rewards pop-ups (`.bb-pop`).
- Art (image model): `art-source/burrow/` (eight critters, meadow, burrow, frost frame, cover with Reina from
  `leaflight/master.png`) -> `burrow-critters` (4 x 2, cells 256 x 288, feet on the bottom), `burrow-bg`,
  `burrow-hole`, `burrow-frost`, `burrow-fx`, `burrow-cover` by `scripts/build-burrow-art.py` (+ AVIF). Chat preview
  packs `burrow-*` into pack-minis. Hosted bundle 33,186,666 bytes (about 360 KB spare). All numbers are placeholders.
- Critters rise out of the opening (user: "they pop out of the middle of the pit and climb onto the score"): `.bb-pit`
  is masked to the part above the opening's centre line plus the opening's lower half-ellipse (opening of burrow-hole
  x 14.7-82.5 %, y 13.8-78.5 %, printed by the build), and `burrow-rim` (the front lip without the dark opening) is
  drawn over the critter. The field starts at 31cqh so top-row critters stay clear of the HUD.
- Not done: a Daily Must-Do list like the reference's (Wayfarer Quests has no Burrow task yet).

## Star Talents: Skill / Talents screen (2026-11-25)
User shared an iCloud folder (one PDF, "Huntopia_Full_Talent_Handout", 232 photos of the reference's Talent screen):
"make the same in the Skill tab; universal for all classes". The city drawer's "Skill" item opens screen `citySkill`
(`src/talents.js`: rules `Talents`, pure, `node scripts/test-talents.mjs`; UI below `TALENTS_UI`; loaded by test.mjs).
- Same structure as the reference (transcribed by four subagents, merged spec kept only in session scratch): four
  constellations Offensive (Falcon, 9 talents, 87 points), Defensive (Turtle, 9, 92), Universal (World Tree, 11, 230),
  Mastery (Dragon, 13, 210); max levels, links, prerequisite talents ("Name cur/req") and branch gates ("Offensive /
  Defensive points invested", Universal left side counts Offensive, right side Defensive; Mastery has none) as in the
  reference. Names, effects and art are ours (`Talents.list`: key, branch, name, max, x/y %, links, pre, gate, fx,
  text). Effects are WonderGear stat bonuses (`Talents.bonus` in `stats()`) or battle procs (`Talents.procs`:
  stun / lash / boss / stunned / regen, `heroTalentHit` after Reina's hit in `updateBattle`, `heroTalentTick` in
  `petSupport`; cached on `g.heroProcs`).
- Points: 1 per hero level above `Talents.fromLevel` = 400 (as in the reference, user asked for it). Reset Talent
  returns everything for `resetPrice` 100 prisms. Optional save field `S.heroTalents {key: level}` (`Talents.valid`).
- UI: overview with the four constellation discs (talents learned x/N, points spent, red dot when something can be
  learned), tree view (constellation background, lines lit when both ends are learned, nodes: learned = colour +
  gold ring, learnable = grey + gold halo pulsing, locked = dark), tooltip card (Lv, prerequisite / gate lines green or
  red, Level 1 + Full Level effect at 0, Current + Next Level, Distribute and +5, Max stamp), branch tabs, Skill /
  Talents page tabs. Skill page = Reina's three skills (Leafwind Volley, Celestial Arrow, Windstep) + active procs.
  UI globals are prefixed `star*` (the Pets room already owns talentIcon / talentGo / talentLearn).
- Art (image model): `art-source/talents/{icons1..3,off,def,uni,mas}.webp` -> `talent-icons` (7 x 6, order of
  `Talents.list`), `talent-sky-<branch>` by `scripts/build-talent-art.py`. Chat preview packs `talent-*` (and now
  `pairs-sprout` / `pairs-lobby`) into pack-minis (510 files). Hosted bundle 33,396,048 bytes (~158 KB spare).

## Hall of Wonders clean room (2026-11-25)
User (screenshot of the rankings: "too much of the wrong stuff"): `rankings()` in `arena.js` is one full-screen room
(`.rk-room`, CSS at the end of `stage.css`): no app header / wallet / Menu pill / sub-tabs / bottom nav, no "Share my
hero" button and no prototype notes. Back (home), title, four category tabs (Power, Dungeons, Castle, Merge), a podium
for the top three, the rest as a scrolling list, her own place pinned at the bottom (not repeated in the list). The 5 s
live refresh redraws quietly (`rankings(true)`) and keeps the scroll position. `publishProfile` still exists (Journal).

## Home icons: "!" only when something is due (2026-11-25)
User: "all icons clean, no exclamation marks; the mark only when there is something to upgrade". The fixed set
`cityNotices` is gone; `cityDue(icon)` in `app.js` decides: Blessings (today's sign-in or a reached milestone), Star
Rites (free pull / open pick), Wishwell (carry-over or a finished task), Guild (not signed in today), Summon (Wish
Tickets or Star Orbs to use), Rewards tool (a quest / forge / bounty claim ready), Upgrade tool (an equipped piece
that can be enhanced with the gold and crystals she has). Icons without a working screen never show it. The two round
tools above the Quest Board and the Elf Broadcast icon had a "!" painted into the art: repainted clean
(`tool-rewards`, `tool-upgrade`, `hud-broadcast`, sources `art-source/ui/tool-*.webp`, `scripts/build-home-tools.py`).
Promotions block (user circled it: "too messy"): `cityGroups[1]` keeps only events with a working screen - Pet Siege,
Blossom Vow, DailyGift, Guild, Fashion Sale, Wishwell, Star Rites. ValuePass, GoldPass, SuperPack, DreamPass, FestEvent,
SpendRank, Chain Buy (nothing behind them) and Rush Rank (repeated the Rank button) are gone; add an icon back only
together with its screen.
Star Rites on the home screen (user: "the gacha must be shown on the main screen"): instead of a small promo icon, a
big card under the promotions on the left (`homeGacha()`, `.city-gacha`): the running rite's wings, its name, time
left, a pulsing border in the rite's colour, a turning light, and a red "Free pull!" badge while today's free pull is
unused. It opens `rites`. Smaller since 2026-11-25 (user: "it must not cover the three pets and her footsteps"): 18% wide,
ends before pet slot 1 (~20%), wings on top, name and "Nh left" under them.

## Home profile plate (2026-11-25)
User circled the old top-left status (round avatar, bar, "2,579 / Lv. 1 · Peace"): "awful, draw it". One painted plate
(image-model edit with `logo-v2.webp` as the style reference: gold filigree, emerald and ruby gems, round portrait ring,
dark-blue enamel nameplate band, level medallion, no text) `art-source/ui/profile-plate.webp` -> `hud-profile` by
`scripts/build-profile-plate.py` (prints hole / band / medallion positions). `.city-status.pf2` in `home()`: portrait in
the ring, name + ⚔ power + XP bar on the band, level in the medallion; Rank moved right, the left event icons 1.7%
lower. Hosted bundle 33,507,356 bytes.
The old v301 profile page (`heroProfile`, blue card with party heroes, Fashion / Mount, Attributes; user: "what is
this? my eyes rolled up") is retired: `go('profile')` and a saved `screen==='profile'` open `character` instead; the
plate and the Character page no longer link to it; the city skill "Companion" opens `cityCompanion`.

## Mini Games hub (2026-11-23)
User: "all games in one place, names on the main field, not hunted through sub-tabs". The bottom-nav tab is called
Mini Games; `games()` in `app.js` draws `.mg-hub`: one tile per game from `MINI_GAMES` (cover, name, line, best
result; a tap opens the game), 4 columns (3 on tall screens), no sub-tab strip on that screen (hidden in CSS). The old
portal layout is kept as `gamesOld()` (unused). A new game only needs a row in `MINI_GAMES`.
The hub is full screen (user: "why so many sub-menus"): no app header, bottom nav or Menu pill; its round `data-back`
button (`.mg-back`) goes to the home screen (CSS `body[data-screen=games]` at the end of `stage.css`). The hub is a narrow
centred column (at most 560 px): a wide event banner for the first `MINI_GAMES` row (Lagoon Gala: three party pets,
time left, Play; `.mg-event`), an "All games" divider, then the other six games in a 3 x 2 grid (user: "arrange them
more interestingly"). Short windows use flatter covers so everything fits 590 x 690.
Home screen (user circled the separate game icons: "put all mini games into one Mini Games icon"): Fishing, Harvest
Pairs and Lagoon Gala icons are gone from `.city-extra`; one larger `.city-minigames` icon (painted tent,
`art-source/ui/minigames.webp` -> `comp-minigames-icon` by `build-ui-icons.py`) opens the hub. Isle Expedition and
Cloud War stay (not mini games). Fishing came back as its own icon (user: "it is daily, by time"); the four icons
sit in one row (`.city-extra` 4 columns, 34% wide).

## Fishing cleanup and anglers (2026-11-23)
User circled the app's sub-tab strip and bottom nav on the fishing screen ("clutter, keep only the fishing; not just a
rod - show Reina and the other bots"). The fishing screen is full screen now (CSS hides the app header / nav / footer;
the page's own "Mini Games" button goes back). In `fishing.html`: Reina sits on a pier at the left (`comp-fish-reina`,
image-model edit of `leaflight/master.png`) and her line runs from the painted rod tip to the float (`drawLine`, tips in
`ROD`); three AI anglers (`comp-fish-folk-1..3`, the first three Daily Cup `anglers`, name tags "AI") fish on the far
shore, and when one of their scheduled cup catches comes due a small pop shows the fish and weight (`folkCatches`).
Each angler is cut from the sheet as the region joined to its own figure (`grow()`; plain thirds carried slivers of the
neighbour, user circled them) and has a thin line from its rod tip to its float. On tall portrait screens Reina is
capped at 50vw so her rod does not cross the anglers.
Art via `parent.artPath` (packed art in the chat preview). Sources `art-source/fishing/{reina,folk}.png`, built by
`scripts/build-fishing-anglers.py` (prints rod tips). Narrow windows get a compact header and a taller lagoon.
Painted lake (user: "draw the water more beautifully"): `.lake` under the lagoon and the controls shows
`comp-fish-water` (image model, `art-source/fishing/water.png`, same build script), faded into the shore, with drifting
sun glints and rings spreading from the float; the old dark gradients were removed. Then calmed (user: "not motley,
not messy"): glints off, one soft ring, the picture desaturated, slightly blurred and under a teal veil.
Tackle shop (user: "don't show the pendulum until fishing starts; show buying worms and feed here, like the game
photos" - those photos are not in this session's history): the dial is hidden while `data-phase=idle`; instead
`#tackle` offers Bait Worms (200 gold, +1 cast after the 10 free ones; a cast past the limit takes a worm) and Fish
Feed (300 gold for 3 portions; a cast with feed picks species with exponent 1 instead of 1.7 and heavier weights).
Optional save field `S.fishTackle {worms, feed}` (validated in `valid()`); the iframe reaches the live save through
`fishSave()` in `app.js` (`S` is a `let`, not a window property). Icons `comp-fish-tackle` from
`art-source/fishing/tackle.png` (`build-fishing-anglers.py`). The "‹ Mini Games" pill is now the painted round back
icon (`ui-back`, user crossed the pill out). Smoother pendulum: `response` 6, `tapDistance` .045, a held arrow eases in
(`holdVel`), calmer drift and green band (a simple bot still lands every fish). No jerks on cast / Cast again: the
tackle shop and the dial share one footer grid cell and cross-fade, `.controls` has a fixed height (footer never moves),
arrows fade in, and `castFlight()` flies the float from the rod tip to the water on an arc with a splash ring.
Fishing is its own content (user): the round back button goes to the home screen (it was hidden for a
moment, the user asked for it back), the lift of the arrows applies only while reeling (the Cast button used to jump up during the
wait), the catch % chip fades in, and Fishing is no longer in the Mini
Games hub or the games sub-tabs (its own home icon stays). While reeling the arrows are lifted beside the dial's horns (`placeArrows`: a transform only, footer unchanged).

## Pet Siege event (2026-11-23)
User sent twelve photos of the reference's pet siege (no text). Home promo "Pet Siege" opens screen `siege`
(`src/siege.js`: rules `Siege`, pure, `node scripts/test-siege.mjs`; UI below `SIEGE_UI`; loaded by `scripts/test.mjs`).
- Moonwing (Reina's faction, ally) vs Sunmane (enemy) for 7 UTC days from `Siege.anchor`. Map (`comp-siege-map`): five
  cities (`Siege.cities`, positions are % of the picture, placed with `50% + (y-50)*1.5cqw` because the map is
  width-fitted) with HP segments for their five defenders. City hall (`comp-siege-hall`, height-fitted, pedestals
  `Siege.spots`): castellan + four guards, AI adventurers; each has a deterministic lineup of five familiars and a CP
  scaled from Reina's top-five pet ATK at event start (`v.base`, `Siege.defender`).
- Defensive lineup pop-up -> Offense Formation (`siegeForm`: up to five owned pets, Quick deploy; a pet may attack once
  per UTC day, `v.used`) -> automatic battle (`siegeGo`, DMG Stats, countdown, Skip) -> result (`siegeResult`).
  Points = % of HP taken + 10 for breaking (`Siege.attack`); defender HP stays down for the week.
- Bottom bar: Rules, Report (last 20 attacks), Reward Preview (rank rewards paid by `siegeState()` when a new week
  starts), Siege Quest (three daily quests), Point Rewards (50 ... 800), Rankings (40 simulated AI). Faction points =
  hers + simulated ally AI (`Siege.allyAi`). Optional save field `S.siege` (`Siege.valid` from `valid()`).
- Art (image model): `art-source/siege/{map,hall}.webp` by `scripts/build-siege-art.py`. Placeholders throughout.
- Reward tabs (2026-11-24, four more photos of the reference's Reward Preview): four factions take part
  (`Siege.factions`: Moonwing hers, Sunmane the enemy, Tidefin and Stormhorn simulated; `factionPoints`, `factionRank`).
  Reward Preview (`siegePreview(tab,fac)`) has Individual Points (one page per final place of her faction, "Now" on
  the current one; counts scaled by `factionMul`, `scaled`), Faction Ranking (`factionRewards`, paid to every Moonwing
  member at the end on top of the personal reward) and Daily Reward (`daily.win` / `daily.lose`: each UTC day her faction's
  battle against Sunmane is won if the simulated ally share plus her points that day reach the enemy's, `dayScore`,
  `dayWin`; `Siege.roll` returns `daily` once when the day turns and `siegeState()` pays it). Personal tiers are
  1 / 2-3 / 4-10 / 11-999. No new save fields.

## Blossom Vow event (2026-11-24)
User sent photos of the reference's couple event (all tabs; "make it look close to the photos"). Own names and art.
Home promo "Blossom Vow" (`cityGroups[1]`, icon `comp-vow-icon` with the event's time left, `vowLeftLabel`) opens
screen `vow` (`src/vow.js`: rules `Vow`, pure, `node scripts/test-vow.mjs`; UI below `VOW_UI`; loaded by
`scripts/test.mjs`). Full screen, the blossom-tree / red-carpet / rose-arch backdrop on every tab, big glossy title,
ribbon, countdown pill, "My Point" chip, wallet (gold, prisms, heart crystals), bottom nav with five painted icons and
the round back button. Tab in `vowTab`; the room's class is `vw-tab-<tab>` (do not reuse `vw-venue` etc. for it).
- Rules: event = 2 UTC days from `Vow.anchor` (`eventDays`, user 2026-11-25: "Blossom Vow only 2 days"; repeats). She bonds with ONE AI friend or guild member per event
  (`Vow.bond`; Searching Partner pop-up `vowFindPop`: Friends / Nearby / Guild / Cross-Server, the AI accepts after a
  moment, `vowInvite` -> `vowAccept`). Gifts (`Vow.gifts`): Red Rose 120, Blossom Ring 520, Heart Rosebox 1314
  intimacy, Love Lock EXP 29 / 99 / 199. `Vow.send` (Send Oath pop-up `vowSendPop`: three cards, 20-char message,
  recipient select, count; item card `vowItem`): intimacy goes into `S.social` hearts (`WonderGear.socialGiftHearts`),
  Love Lock EXP into a lasting level (`lockLevel`, stats `lockStats` per level through `Vow.bonus` in `stats()`).
  Bond Points (team score `Vow.score`) only from gifts inside the team and only when mutual: x2 of hers + the AI
  partner's return gifts (deterministic: the first send of a day is always answered, later ones by `replyOdds`).
  Gifts to other friends give no points. Points, Oath Goal and purchase limits reset at 00:00 UTC; the day's ranking
  closes at 21:00 UTC (`closeHour`; the score freezes, `frozen`) and pays ONCE (`Vow.roll` returns `due`, `paid`):
  `vowState()` mails the bag-item part ("Blossom Herald", `WonderGear.mailGift`) and puts roses / rings / boxes /
  heart crystals straight into `S.vow`. Board (`Vow.board`): 20 couple slots, 1-3 need 10,000, 4-20 need 1,314,
  20 simulated AI couples "Name ♥ Name" (AI), her couple "Reina ♥ <partner>"; "Reach 520 pts" pays participation.
  A No.1 finish gives +15% XP the next UTC day (`Vow.buffOn`, added in `gain()`). +3 free roses a day.
- Tabs: Blossom Vow (main: Reina on the carpet, ranking list with winged badges 1-3, Ranking Reward gift, Searching
  Partner / Send Oath, sub-tabs Partner Bond `vowBond`, Bond Transfer (coming soon), Bond Gift shop `vowShop` (roses
  for gold, rings / boxes for prisms or heart crystals), Bond Reward = `vowRewards`); Oath Goal (520 / 1314 / 5200 /
  13140, Claim / Claimed / "Missed target" stamp after 21:00); Oath Ceremony (shrine, four prism packs with daily limits
  and "N% off!" badges, `Vow.packs`, `vowBuy`); Oath Test (parchment, drop preview; dungeon guardian wins drop a rose
  and sometimes a ring / box, up to 10 a day: `vowDrop()` from `endBattle` in `world.js`); Oath Witness (couple
  picture, four cards, Enter the Venue: `vowVenueView` / `vowVenueStart`, 25 s of falling bouquets, a tap catches one
  for a rose or heart crystals, 12 prizes a day, 24 during the 21:10-21:30 ceremony window). Rules pop-up `vowRules`
  (five lines). "Oath sent" moment: `vowBurst` (heart, petals, numbers, the partner's return gift). Sending also counts
  the daily "flower" quest (`trailTick('flower')`).
- Optional save field `S.vow {period, day, partner, bond, pts, back, sends, frozen?, gifts{rose,ring,box}, crystal,
  lock, goal[], buys{}, drops, venue, paid, last{day,rank,score}, buff, log[]}` (`Vow.valid` from `valid()`).
  Nothing is sold for real money (prisms, gold and heart crystals only).
- Art (image model): `art-source/vow/{bg,icons,badges,nav,shrine,couple}.webp` -> `comp-vow-bg`, `comp-vow-icons`
  (4 x 2: rose, ring, box, lock, crystal, point token, badge, bouquet = `Vow.icons`), `comp-vow-icon`,
  `comp-vow-badges`, `comp-vow-nav` (3 x 2), `comp-vow-shrine`, `comp-vow-couple` (Reina from `leaflight/master.png`
  as reference + an original young man) by `scripts/build-vow-art.py` (+ AVIF copies). Atlases are CSS variables set
  on the page root by `vowArtVars()` so pop-ups can use them. Hosted bundle 32,868,350 bytes (~686 KB spare).
- Polish (user: "nav labels cut off; unclear the ranking scrolls; too many button styles; Reina blends in"): the
  ranking is a framed board `.vw-board` (header "Today's couples · Swipe to see all N", visible scroll bar, a fade and a
  bouncing ▾ until the end, `vowListScroll`; her couple pinned in `.vw-mine`); one button family (gold painted plates
  for actions incl. pack prices, violet painted plates for the sub-tabs, gold-rimmed round discs for ? and Back); nav
  labels wrap to two lines; Reina has a soft light behind her, a white rim and a deeper shadow.
- Pop-ups, second look (user: "the partner must be the opposite sex; make the pop-ups stylish and professional"):
  `socialFolk` entries carry `sex` ('f' / 'm'); only men (`VOW_PARTNER_SEX`, `vowMen`) appear in Searching Partner
  (Friends = male friends, Guild = male members, Nearby = every other male AI, Cross-Server empty) and as Send Oath
  recipients; `vowInvite` refuses others. Both windows are `.vp` cards (CSS "Blossom Vow pop-ups, second look"): ribbon
  head with petals, Reina ♥ partner portraits, cards with a portrait in a gold ring, intimacy hearts and a tagline
  (`VOW_TAGS`), segmented tabs, painted gift cards with a tick, a lined note field, a stepper and a gold Send button that
  names the points it earns.
- Sub-tabs as pop-ups (user: "some say coming soon, some change the page; make them consistent"): Partner Bond
  (`vowBondPop`: pair, intimacy hearts, Love Lock bar, stats, Send the Oath), Bond Transfer (`vowTransferPop`,
  `Vow.transfer`: once per event week, 30 heart crystals or 120 prisms, `transferCost`; today's points stay, the new
  bond starts at 0; optional `S.vow.moved`), Bond Gift (`vowShopPop`, `vowBuyPop`) and Bond Reward (`vowRewards`), all
  `.vp` cards (`vpHead`, `vpPair`). The old full-page Bond and Shop views are gone (`vowGo('bond'|'shop')` opens the pop-up).
- Not done: a real parade with other couples, blessings / wishes in the venue, the reference's outfit
  and weapon-skin rank prizes (rewards are gifts, crystals and bag items), Nearby / Cross-Server players (nobody there).
  All numbers are placeholders.

## Mini game rotation (2026-11-23)
User: "all these mini games except fishing take turns, each runs 2-3 days, then another; rankings go by them".
`ARCADE` in `app.js` (next to `MINI_GAMES`): one featured game every `ARCADE.days` (3) UTC days from `Party.anchor`, in
the order `ARCADE.order` = Lagoon Gala, Jungle Trek, Crystal Cascade, Harvest Pairs, Dragon Merge, Castle Defense
(Crownfall Vale is a campaign, not in the rotation). Castle Defense ranks by TIME (user: "reach a set number of points
in less time"): each defeated enemy gives 10 x its wave points (boss 200, `defensePoints`), the clock (build time
between waves included) stops at `DEFENSE_TARGET` 1,000 (`defenseTarget`, optional `S.defenseBest` seconds); Score and
Time are in the vitals bar. The hub's banner shows the featured game (time left, best, rank,
Play, Ranking pop-up `arcadeRanks`) and "Up next". Runs of the featured game count (`arcadeScore`, called where each
game saves its best); optional save field `S.arcade {slot, game, best, at}` (`ARCADE.valid`). When the turn ends
`arcadeState()` pays rank rewards (`ARCADE.ranks`) into the bag; AI field per game in `ARCADE.field` (`scale`; Pairs and
Castle Defense are times, lower is better). Lagoon Gala is open only on its own turn (`arcadeOpen`, `partyClosed()` says when it returns);
its own event is now 3 days (`Party.eventDays`), so its ranking, Tide Treasures and rank rewards follow the turn.
Own names (user: "we need our own names"): Heavenly Gifts -> Tide Treasures, Advanced benefits -> Pearl Pass,
Heavenly gifts -> Coral Crown.

## Star Rites gacha (2026-11-23)
User: "can we make a gacha?" then shared her ChatGPT chat about the reference's gachas (read through chatgpt.com, now
allowed in the environment) and said "our own names, great prizes". `src/rites.js` (rules `Rites`, pure,
`node scripts/test-rites.mjs`; UI below `RITES_UI`; loaded by `scripts/test.mjs`), screen id `rites`; the home promo
that said "GodGacha" (a reference name) is now "Star Rites".
- Four rites take turns, 3.5 days each from `Rites.anchor` (`eventDays` 3.5: four rites in two weeks, user): Moonwell Rite (Moon Sigil), Dragon Hoard (Ember Scale),
  Starfall Vault (Star Key), Celestial Bloom (Bloom Charm). Own ticket each, tickets never expire (`S.rites.t`).
- 50 tickets a pull, 500 for ten (same odds), one free pull a UTC day. Odds (`Rites.odds`): exclusive wings 0.3%,
  aura 1.2%, Wish Orb 7%, rare bag item 25%, common the rest. Luck: an orb or better within 15 pulls. The rite's wings
  are certain by pull 300 of the event (`grandAt`).
- Tickets of the NEXT rite for pulls are Wishwell goals (see Wishwell), not paid by the rite; Dragon Hoard returns its own tickets at 120/250; Starfall Vault gives a free choice (wings,
  aura copy or orb, `Rites.choose`) at 360/720/800; Celestial Bloom's Petal Path pays prisms at 50/100/200.
- Prizes: exclusive wings `fashion-wing-28..31` (Moonwell Seraph, Dragonfire Crest, Starfall Comet, Celestial Bloom;
  in `PREMIUM_LOOKS`, never sold for gold, `RITE_WINGS` names the rite in the note); four auras (`comp-rites-aura-<id>`,
  copies raise the tier to T5, all owned auras give stats, the worn one glows under her feet on the home screen,
  `img.rite-aura`); ten Wish Orbs (collection, set bonuses at 4 / 7 / 10). Stats through `Rites.bonus` in `stats()`.
  Repeats become stardust (Dust Shop: tickets or an orb of choice). Rite Shop: nine 500-ticket packs per rite for
  50, 100 ... 450 prisms (once each, like the reference's Secret Shop) and a 1:1 prism exchange.
- NO GUARANTEE (2026-11-25, user: "it is not a guaranteed win: I made 450 pulls in the reference and got one aura and
  small stuff"): the pull-300 wings guarantee (`grandAt`) is gone, full luck only turns a small prize into a Wish Orb
  (never an aura), Starfall Vault choices and the Legendary tier no longer offer wings. Odds now ultra 0.005%, wings
  0.05%, aura 0.3%, orb 5%, rare 25% (`Rites.odds`, shown with `Rites.pct`); a 4,000-player sim of 450 pulls: about one
  aura each, wings for ~21%, ultra for ~2.5%. The altar line reads "Grand prize chance" instead of a progress %.
  `ev.grand` stays in saves (validated) but is no longer used. Old notes below about the 300-pull guarantee are outdated.
  Then (user: "look, the wings are 'guaranteed' at 1,800 pulls, in another gacha, same principle"): `grandAt` = 1,800 -
  the rite's wings are certain at pull 1,800 of the event; the altar shows "Grand prize progress: N% (pulls/1,800)"
  (`grandProgress`, like the reference's 14.73%) and Rewards lists the 1,800 row. Aura and ultra stay unguaranteed.
  No ticket return in Moonwell Rite (user: "today's gacha does not even return tickets"): only Dragon Hoard keeps
  `extra: 'returns'`.
- MONETIZATION RULE (user): gacha tickets are never sold for real money directly. Tickets are bought only with prisms
  (the player's choice); real-money packs (later) sell prisms, with tickets and items only as a bonus inside them. Welcome gift 1,000 tickets of the running rite.
- Altar screen (2026-11-25, user photos of the reference's gacha "Priceless Treasures"): `showRites()` is now a full
  altar: timer, wallet, title + Record (`riteRecord`, last `logMax` 50 prizes in `S.rites.log`), the three prizes on
  show (aura, wings, orbs) in glowing bubbles, "Grand prize progress" % (`grandProgress`), three reward tiers
  (`Rites.tiers`: Legendary every 500 pulls, Rare 240, Ordinary 60; each item has a per-event limit shown left/limit;
  a ring around the tier chest fills toward the next selection; `tierOpen`, `tierLeft`, `tierTake`, pop-up `riteTier`),
  Luck bar, Pull x1 (or Free Pull) / Pull x10 priced "tickets or prisms", "Use prisms when tickets run short"
  (`S.rites.auto`: missing tickets bought 1:1 in `Rites.pull`), bottom tabs Altar / Shop / Collection / Rewards /
  Rotation. Result window "Congratulations" with each prize's prism value (`Rites.values`, `value`) and a "This pull's
  value" star, Confirm / Try Again. CSS under "Star Rites altar" (`.ra-*`). Tests in `test-wishwell.mjs`.
- Ultra prize (2026-11-25, user: "golden wings on the main screen, something that will hardly ever drop but everyone
  wants"): Aurelian Sunwings = `fashion-wing-32` (`Rites.ultra`, image-model edit with wing-31 as the layout reference,
  `art-source/wings/wing-32.webp`, built by `build-rites-art.py`; AVIF of wings 28-32 at quality 40). 0.05% on every
  pull of every rite (`odds.ultra`, carved before the other bands, no extra random call), no pity, never sold, never in
  a selection, in `PREMIUM_LOOKS`; repeat = 1,000 stardust; owning it adds `ultra.stats` through `Rites.bonus`. It is
  the centre bubble of the altar (rite wings left, aura right) and the art of the home card (`homeGacha`, "ULTRA PRIZE
  0.05%"). Tapping a bubble opens a prize card (`riteInfo(kind)`: big art with rays, CP from `riteCP`, type, Activated
  CP, Activation Stats, Owned), like the reference's item preview. Hosted bundle 33,500,833 bytes (~54 KB spare).
- Secret Shop (2026-11-25, user photos + "this is where tickets are bought for 50-100-...-500 prisms per 50 pulls, and
  prisms for euros with tickets and a few shards of some pet that changes"): a page of the rites room (`riteView`
  'shop', `riteSecret()`, nav `riteNav` Altar / Secret Shop / Collection / Rewards / Rotation; the wallet "+" opens it):
  banner `comp-secret-shop` (original raccoon merchant, `art-source/rites/secret-shop.webp`), Prism Packs
  (`Rites.cashPacks`: EUR 0.99 ... 49.99 = prisms + bonus rite tickets + copies of the rite's featured Super Rare pet
  `featuredPet(period)`, once per rite, `ev.cash`; `cashGrant` / `givePet` hold the grant, the first copy unlocks the
  pet, the rest are spare copies). Real payment is NOT connected: the price opens an info card (`riteCash`). Ticket
  Packs: ten x 500 tickets for 50 ... 500 prisms (`Rites.packs`), once each per rite, Sold out stamps. The old pop-up
  (exchange, vouchers, stardust) is `riteMore()`. Hosted bundle 33,537,051 bytes (~17 KB spare: compress old art first).
- Win feed (2026-11-25, user: "the feed of other people's wins is very important"): `Rites.feed(s,now,n)` = a
  deterministic stream of AI adventurers' wins from the clock (`feedAt(slot)`, one slot per `feedSlot` 15 s, a win in
  70% of slots: orb / aura / wings / ultra by `feedOdds`, about 9 ultra and 340 wings a day; names `feedNames` with a
  server tag and the AI label) merged with her own orb / aura / wings / ultra prizes from `S.rites.log` ("You").
  UI (`riteFeedStrip`): a strip in the altar's top bar between the timer and the wallet (no extra row: the altar is
  full at 590 x 690) and over the home scene above Reina (`.rf-home`); one shared 3 s timer (`riteFeedTick`) slides the
  newest win in; wings / ultra make the strip gold with a light sweep. Since 2026-11-25 (user: "the record only inside the
  gacha, not on the main field") the home strip is gone; the altar's Record button and the strip open one Record pop-up
  (`riteRecord(tab)`) with Server Record (the feed, last 30) / Personal Record (her log) tabs. No save fields.
- Optional save field `S.rites {t, auras, aura, orbs, dust, ev{period,pulls,luck,got,picks,grand,packs,free}}` + optional `auto`, `log`, `ev.sel`, `ev.taken`
  (`Rites.valid` from `valid()`). Art (image model): `art-source/rites/` + `art-source/wings/wing-28..31.webp`, built by
  `scripts/build-rites-art.py` (wings, auras, hall backgrounds `comp-rites-bg-<id>`, icon atlas `comp-rites-icons`:
  tickets, orbs, luck chest, stardust). Hosted bundle 33.03 MB (about 0.5 MB spare). All numbers are placeholders.

## Titles (2026-11-25)
User photo of the reference's Title screen (Celebrity Titles, title plate over the hero, CP and stats underlined,
"Title Anecdote: 1st Place in ...", Activate / Activatable, opened from Mail). Own names; plates drawn in CSS (no new
pictures). `src/titles.js` (rules `Titles`, pure, `node scripts/test-titles.mjs`; UI below `TITLES_UI`), screen
`titles` (drawer item Titles, the worn plate on the home screen, "Open Titles" in a title letter).
- Celebrity titles for a No.1 finish, granted where each ranking pays (`titleGrant`): Burrow Blitz day (`meadow`),
  Blossom Vow day (`sweetheart`), Lagoon Gala (`lagoon`), featured mini game turn in `arcadeState` (`arcade`), Pet Siege
  week (`siege`), Star Duel season (`duel`, after `duelSettle` in gear-ui). Achievement titles from the save
  (`Titles.check` via `titlesCheck()` on home / Titles): 50 guardians, Pairs <= 1:30, Cascade 8,000, Burrow 700, ten
  orbs, four auras, Aurelian Sunwings.
- A new title arrives "Activatable" with a letter from "Hall of Wonders"; Activate turns its stats on for good (all
  activated titles count, `Titles.bonus` in `stats()`); one activated title can be worn: its plate (`titleHome`,
  `.city-title`) replaces the "Overlord's Aura" plate over Reina. Optional save field `S.titles {got{id:time}, on[], worn}`
  (`Titles.valid`). Room `.tt-room`: category list left (Celebrity / Achievement), plate, Reina, CP, stats, Title Story,
  Activate / Wear / Take off. Hosted bundle: comp-avatar-frames AVIF re-saved at q34 (-59 KB) -> 33,486,994 bytes.
- Painted EMBLEMS (user: "titles must be beautiful, in the style of our game", then photos of the reference's Title
  screen opened from the Character page): every title is a painted wordmark (image-model edit with `logo-v2.webp` as
  the style reference, glossy gold lettering + themed decoration; all 22 spelled correctly) in
  `art-source/titles/mark-<id>.webp` -> atlas `title-marks` 4 x 6 of 360 x 216 (`Titles.markOrder`, `markRows`) by
  `scripts/build-title-art.py`; `titlePlate()` draws `.tt-mark`. The plate + CSS lettering pass was rejected ("not like
  this") and removed. Categories like the reference: Celebrity (No.1 daily: Burrow, Lagoon Gala, featured game),
  Event (achievements), Romance (Blossom Vow No.1, Blossom Bond = has a partner, Eternal Vow = Love Lock 5), Ranking
  (Pet Siege, Star Duel). With nothing chosen the room shows the overview: total CP / stats of activated titles and
  "Source of Title" got/total per category. Activate (Activatable) -> Equip (Forever) / Unequip. The Character page has
  a Title button (red dot when one is activatable, `titleDue`; `openTitles(from)` returns there). Hosted bundle:
  comp-rites-icons, talent-icons, comp-avatar-frames, cloud-war-twin-islands AVIF at q28 -> 33,489,680 bytes.

## Wishwell: Star Rites carry-over (2026-11-25)
User sent photos of the reference's "Adventure Goals" behind its Snowland home icon ("tickets for the next gacha for
pulls in today's"). Own name, art and wording. The home promo `snow` is now "Wishwell" (screen `wishwell`,
`src/wishwell.js`: rules `Wishwell`, pure, `node scripts/test-wishwell.mjs`; UI below `WISHWELL_UI`; loaded by test.mjs).
- Goals (user photo of the reference's Adventure Goals: "they are not returns, they are tickets for the next gacha"):
  `Wishwell.goals` 15 / 30 / 60 / 135 / 240 pulls in the running rite = 400 / 740 / 1,240 / 1,240 / 1,240 tickets of the NEXT rite
  (4,860; 3,620 up to 135 as in her ChatGPT notes, 240 added by the user), four tiles per row like the reference, claimed by hand (Claim per row, or tap the
  well's bubble / Claim all, `claimGoal`, `claimAll`). Goals reached but unclaimed when the rite ends wait in the well
  during the next rite (`leftover`, paid in its tickets). No percentage carry-over any more (`carryRate` is gone).
  Star Rites no longer pays these automatically (`Rites.steps` is empty; the 240 + orb row is gone); its Rewards pop-up
  shows only the rite's own extras (Dragon Hoard returns, Starfall choices, Petal Path) and the 1,800 wings, with a
  Wishwell button. Optional save fields `S.wishwell.g` / `pg` {p, got[]} (`claimed` from older saves still validates).
- Wish Coins: one per pull (counted from `Rites` pull totals, `seen`), plus five daily Tasks (free pull, pull 1 / 10 /
  30 / 60 times today); Wish Market (`wares`: next / current rite tickets, bag items, a Wish Orb; limits reset with each
  rite, `bp`). Optional save field `S.wishwell {day, dayPulls, done[], coins, seen{period,pulls}, claimed, bp, buys}`
  (`Wishwell.valid`).
- Art (image model): `art-source/wishwell/{bg,coin}.webp` (glade, wishing well with a bubble, original arctic-fox
  courier mascot) -> `wishwell-bg`, `wishwell-coin` by `scripts/build-wishwell-art.py`; chat preview packs `wishwell-*`.
  Hosted bundle 33,466,934 bytes (~87 KB spare). All numbers are placeholders.

## Daily Blessings: sign-in calendar (2026-11-25)
User photos of the reference's Daily Check-in behind its "benefits" home icon. The icon is now "Blessings" (screen
`blessings`, `src/checkin.js`: rules `Blessings`, pure, `node scripts/test-checkin.mjs`; UI below `CHECKIN_UI`).
- Monthly calendar (user: "it is a calendar for the month"): one UTC calendar month, 28-31 cells (`Blessings.days`
  has 31, `length(cycle)`), month name shown; one claim per UTC day (a missed day does not
  lose anything, the calendar moves on one per sign-in); milestone chests at 2 / 7 / 14 / 21 / 28 sign-ins.
- Blessing Pass (300 prisms, never real money; the reference's SVIP x2 marks): doubles the days marked "Pass ×2" for
  the cycle, marked days already claimed are paid once more at purchase. Optional save field `S.blessings {cycle, n,
  last, got[], pass}` (`Blessings.valid`). The reference's SVIP Pack tab is not built (no VIP system).
- Art: `art-source/blessings/banner.webp` (cliff garden, blank signboard with the title over it, original baby-owl
  mascot) -> `blessings-banner` by `scripts/build-blessings-art.py`; chat preview packs `blessings-*`.

## Wayfarer Quests: daily tasks (2026-11-23)
User: "the core is grind + gacha: every day a set amount of everything, a small CP rise, and a bit of excitement",
then three photos of the reference's Adventure Quest (task list paying adventure EXP and a few gacha tickets, chest
track, Silver / Gold / Diamond tabs) and its World Boss roulette ("a few tickets for dungeons and for daily quests").
`src/trail.js` (rules `Trail`, pure, `node scripts/test-trail.mjs`; UI below `TRAIL_UI`), screen `cityTrail`, opened by
the home "Daily" button (the old `cityDaily` shell is unused).
- Twelve daily tasks (`Trail.quests`: guardians, EXP Forest, featured mini game, fishing casts, Cloud War carnage,
  guild sign-in and boss, flowers, Sky Contest fights, Pet Siege, pet summons, Star Rites pulls), reset 00:00 UTC,
  counted by `trailTick(key,n)` hooks where the thing happens (world.js, exp-dungeon.js, gear-data.js, gear-ui.js,
  siege.js, rites.js, fishing.html via `parent.trailTick`, `arcadeScore`). Go buttons open the right screen.
- Second pass (user sent 16 photos of all three tabs): Silver / Gold / Diamond are NOT paywalls. They are the same task
  kinds (`Trail.kinds`, now 16: + boss wheel spins, chat message, Spend gold, Spend prisms) with rising goals per tab
  (`Trail.goals.s/g/d`, 0 = not in that tab) and bigger rewards (`Trail.tiers`); one counter per task, a claim per tab.
  Spend goals are counted by `trailSpend()` (called from `save()`, compares balances). The reference's "Top-up EUR"
  goals are left out (no real money). Wayfarer EXP fills a DAILY chest track (`Trail.track`, 300 ... 6,000; reset
  00:00 UTC with the tasks). The old monthly pass is gone; `pass` / `season` in old saves still validate.
- Wayfarer Shop (user photo of the reference's Adventure Shop): every claim pays Wayfarer Coins (`give.coins` 20 / 30 / 40,
  kept across days in `S.trail.coins`); bottom switch Quests / Wayfarer Shop (`trailPage`). Six wares from `Trail.wares`
  (theme avatar frames and chat bubbles by rarity, bag items, Starlit Vouchers), one at -30%, sold-out stamp, auto refresh
  when all are sold, manual refresh 100 coins, Obtain pop-up. A frame / bubble ware adds a copy (first activates and
  wears it, repeats raise its tier; `Trail.grant` through the exported `supremeState` / `supremePack`). Optional
  `S.trail.shop` (validated). Coin icon `comp-trail-coin` (image model). The reference's face accessories ("Glasses (F)")
  are a slot we do not have; its Pet Pass tab is not built.
- Gacha tickets drip in: the quests above pay tickets of the running rite; +20 Starlit Vouchers per dungeon guardian
  (`Trail.dungeonTickets`) and two slots of the existing boss wheel (`WonderAdventure.wheel`, a free spin per guardian
  win) pay 30 / 60 vouchers.
- Starlit Vouchers (user photo of the reference's "General Lottery Ticket": universal tokens swapped for draw tickets
  at a fixed rate): `S.rites.v`, +20 per dungeon guardian and two boss-wheel slots (30 / 60); swapped 1:1 for tickets of
  the running rite (`Rites.redeem`, Rite Shop "Swap all", the item card `riteVoucher()` from the wallet chip), so she
  can save them for the rite she wants. Icon `comp-rites-voucher` (image model, `art-source/rites/voucher.png`).
- Optional save field `S.trail {day, c, got{s,g,d}, season, exp, ms, pass}` (`Trail.valid`). Banner art
  `comp-trail-banner` (image model, `art-source/trail/banner.png`, built in `build-rites-art.py`).

## Lagoon Gala event mini-game (2026-11-23; renamed from "Splash Party" so the name is clearly our own)
User sent eleven photos of the reference's "Pet Party" event ("add this one too"). Original name and art, same
mechanics. Mini Games card + sub-nav tab, screen id `party`, `src/party.js` (rules `Party`, pure, `node
scripts/test-party.mjs`; UI below the `PARTY_UI` marker; also loaded by `scripts/test.mjs`).
- Board 4 x 4: a swipe (pointer on `#ppBoard`, or arrow keys) slides every pet. Two equal pets merge into the next of
  eleven tiers (our familiars `Party.tiers`, d47 ... d43) for 10 x tier points. A new tier 1 pet (10% tier 2) comes
  after each move.
- Stamina: 1 per move, 200 max (user asked for 200 instead of 100), +1 every 5 min, full at 00:00 UTC; Stamina Potion +5.
- Items with per-round limits (`roundLimit`): Party Fireworks (clears the lowest tier), Party Cake (tier 1 -> 2),
  Magic Wand (tap a pet: +1 tier), Stamina Potion.
- Deadlock overlay when nothing can move; New round keeps the score as a result.
- Event = 7 UTC days from `Party.anchor` (`period`). Best round score ranks against 40 simulated AI (`field`, labelled
  AI; ties go to the earlier).
- Total points open Tide Treasures (`track`, columns Basic free / Pearl Pass 680 / Coral Crown 1280 prisms).
- Heavenly Gifts second pass (six photos of the reference's offers, then five of the whole track): 21 rows up to 72,000
  points (Basic one material, Advanced the same doubled, Heavenly two special items; green progress line, big ticks); lobby buttons
  Advanced benefits / Heavenly gifts (`.pp-passes`) open an offer window (`partyUnlock`: Value, all rewards, rewards of
  the rows already open, prisms returned at once `Party.refund`, price button `partyUnlockBuy`; `Party.colGifts`).
- Gift Packs for prisms with event limits (real money is not built).
- Tier achievements once per event, and a Gallery of merges.
- Personal rewards by final rank (`ranks`) are paid into the bag by `partyState()` when a new week starts (`Party.roll`
  returns `due`); event items reset then.
- Optional save field `S.party` (validated by `Party.valid` from `valid()` in `app.js`).
- Art (image model): `art-source/party/{bg,items}.webp` -> `comp-party-bg`, `comp-party-items` by
  `scripts/build-party-art.py`. The board view is a flex column sized in cqh (`.pp-room` is a size container) so it
  fits 590 x 690 and iPad portrait; pop-up rows need the `#modal .pp-*` colour overrides.
- All numbers are placeholders.

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
Eighth pass (2026-11-24, user: "shorter rules, better buttons, a beautiful interface; the left buttons do nothing; the
font is primitive; too many shields; the win cuts off into a pop-up"): the lobby is a rules card (`trekLobby()`: the
`cover-jungle` picture, one line, four icon tips, lives / seconds / best, reward icons, a painted gold Play button
`.trek-btn`); the HUD is hidden behind it. Pause is a round disc with an svg (`TREK_PAUSE` / `TREK_PLAY`) and opens a
card with Continue / Leave run (`leaveNow`, no extra question). The left icons were status indicators that looked like
buttons: now pills `TREK_BUFFS` (icon, name, value, a draining bar for timed bonuses, slide-in when gained), never
tappable, hidden during the ending. Floating words are drawn by `trekWord()` in WonderDisplay with a dark outline,
coloured glow and a pop-in; `Trek.say(g,text,x,z,tone)` tones `TREK_TONES` (bonus, bad, block, good, score, gold, big =
announcements on a ribbon at a fixed height). Bonuses: `dropOrder` has 14 slots with ONE shield; a full-health heart
becomes frost; a shield never drops while one is up or twice in a row (`g.lastDrop`, `dropSpare`). Ending: rewards are
paid at once, then the field plays on: a "Victory!" banner (`trekBanner`, rays) comes up as the dragon bursts, the
chests land and open, then `Trek.outro()` (picture only: leftover barrels pop, an escaping dragon flies off) runs for
`TREK_OUTRO` 1.7 s (win) / 2.3 s ("Time's up!" / "Out of hearts"), then the shared `resultShow` window (stars = dragon 3
or sub-bosses beaten, counting points, five chests, prize tiles incl. seals and Moon Chest, Play again / Mini Games).
The old `#trekPanel.trek-result` panel is gone. CSS under "Jungle Trek polish" at the end of `stage.css`.
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

- Third talent shelf (user sent fifteen photos of the reference's common skills, "add them"): 39 talents now. Thirteen
  new, original names: Fierce Spirit (+7%), True Aim (+10% vs bosses), Keen Eye (7% crit x1.5), Stunning Bash (15%
  stun: enemy's next attack 1 s later, `g.enemyCD`), Ambush (+7%), Toxic Blade (10% poison, 1% max HP a second for
  5 s, `g.poison` in `petSupport`), Wavering Tide (90-120%), Duelist's Art (+4% Reina damage in Star Duel per pet,
  `duelBoost`), Oak Heart (HP +3%), Steadfast (10% to shrug off a power strike, once per 15 s, `petShrug`), Bulwark
  (-8% power-strike damage, `petBulwark`), Unshaken (Crit RES +2.5%), Thorn Echo (20% to strike back for 10% ATK, in
  `petCounter`). Odds and numbers in `talentOdds`, `talentNums`. Icons: `art-source/pets/shelf3.webp` (4x4 sheet, 13
  used), atlas `comp-pet-talents` is 4 x 10. `build-hosting-avif.py` now uses quality 40 (bundle headroom ~62 KB).
- Talent colours (user: "red are strong, the other colour weak"): badge colour now shows STRENGTH, not kind. All
  common talents are green enamel, the Top talents red: `build-pet-talents.py` recolours each tile's enamel by hue
  (`enamel()`, tiers read from `petTalents` in `gear-data.js`). The kind is a corner chip like the reference
  (`talentIcon` adds `.tal-atk` orange sword / `.tal-def` green shield, CSS at the end of `stage.css`).

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

## Sky Contest: Star Duel (2026-11-22)
User sent ten photos of the reference's Peak Duel ("held every two weeks") and chose a schedule by DAYS. Sky Contest ->
Star Duel is open (`contestModes` flag 'Duel'); it lives in the `cityContest` screen as `contestPage==='Duel'`
(`duelRoom()`, tabs `duelTab` Qualification / Group / Peak / Ultimate). Rules in `gear-data.js` (`duelRules`,
placeholders), optional save field `S.duel` (`validDuel`), read through `duelState(s,now)`.
- Season: 14 UTC days from `duelRules.anchor` (2026-11-21), `duelSeason(now)`. Days 1-3 Qualification: 15 auto-fights
  (`duelQualFight`, `duelSim`) against the simulated AI field (`duelField`: 1200 AI adventurers with final points and
  power relative to Reina, `duelAi`); points = win base + foe strength + HP left, 5 for a loss; HP does not recover
  within a day; a participation reward per fight (`duelPart`). Rank among the field (`duelQualRank`); top 160 promote.
- Day 4 Group stage (`duelGroup`, `duelGroupFight`): ten players near her rank, round robin (circle method), 3 points
  a win, AI-vs-AI results by power, unplayed rounds are losses, top two go on.
- Day 5 Peak Game (`duelPeak`, `duelPeakFight`): 32 players, five knock-out rounds, round k is decided by hour
  4(k+1) UTC (or when she fights it); HP carries between rounds (`php`). Bets (`duelBet`: 1000 gold on a player of
  an AI match, pays x2.5) and a champion guess (`duelGuess`, 5000 gold).
- Inspire (`duelInspire`, `duelAuto`): up to 5 x 6% DMG reduction for 50 prisms each, for the season; auto-maximize.
- Results: `duelPlace`; `duelSettle` (on opening the room) pays bets and the guess and, after the Peak day, mails the
  ranking reward (`duelRanks`) from "Arena Herald". Ultimate Showdown is only a placeholder page.
- Peak Game board (user sent five more photos): the 32 are four groups of eight (bracket slots 8g..8g+7); rounds 1-3
  are played inside a group, drawn as round faces with connecting lines around a VS emblem (`duelBoard`, Group 1-4
  tabs `duelPeakGroup`, the group winner gets a crown), a live countdown to the next decision (`duelCountdown`,
  `duelTick`). Ultimate Showdown = rounds 4-5 (semi-finals of the four group winners, then the final): two finalist
  figures (silhouettes until known, Reina's portrait if she is there), Bet under each, a blue-red VS band, Champ
  Betting (`duelChampPop`; the champion guess is open until the semi-finals are decided). Record pop-up lists her
  fights. AI players have lettered faces (no portraits).
- Pop-ups: Match Description (three tabs, schedule + intro), Inspiration, Qualification Rankings, Ranking Rewards,
  player pick (bet / guess), the fight window (`duelShow`). No new art: background `comp-war-field`, icons `warIcon`.

## Fashion room redesign (2026-11-22)
User: "I don't like how the Fashion page looks" (after the reference photo of its Fashion room). `fashionShowcase()` in
`app.js` returns a new layout when `screen==='fashion'` (`.fx-room`, CSS at the end of `stage.css`; the Skin room's
Appearance mode keeps the old layout): full-height starry blue room without the global header / nav, top bar (Back,
"Fashion" ribbon, gold and prisms), Reina large on the stage with CP and two round buttons (Leaflight Set, Elite Sale),
a panel with stats and ▲ / ▼ change plus the chosen item (tile, name, bonus / price, Equip / Buy / Exclusive), five
tabs with icons (Garment, Hairstyle, Fashion Bow, Wings, Mounts), a 4-column grid of rarity cards (`fashionCardMeta`
reads id from the card's onclick: UR exclusives red, SSR orange, SR purple; padlock when not owned, green tick when
worn) and a bottom bar Fashion / Supreme Set / Elite Sale. Second pass (three more photos): tabs in the reference's order and scrollable:
Garment, Fashion Bow, Avatar, Bubble, Hairstyle, Wings, Mounts. Avatar and Bubble (`decoRoom`, `decoPick`) list the
Supreme Set frames / bubbles as UR cards with tiers; the panel shows the piece's stats now and ▲ next, Activate /
Tier-up (`supremeGet`, only while its set is on sale) and Equip / Unequip (`supremeWear`). Apparel Records pop-up
(`apparelRecords`) counts owned looks per category. Lighter sky-blue palette like the reference.
Painted avatar frames (user: "beautiful avatars"; chose frames): one per Supreme Set (image model, transparent ring;
`art-source/frames/<set id>.webp` -> atlas `comp-avatar-frames` 4 x 2 by `scripts/build-avatar-frames.py`, AVIF copy).
`frameArt(setId,face,cls)` in `gear-ui.js` draws Reina's avatar inside the painted ring; used by `supPieceArt` (sale,
set room, Avatar tab, item card) and, for the worn frame, on the home avatar (`.pf-city`) and `#profileReadout`. Own avatar frames (user sent two photos of the reference's Avatar tab, "examples"): sixteen themed frames painted by
the image model (`avatarFrames` in `gear-data.js`: MR Star-Moon; UR Inferno Charm, Arcade, Fairy Garden; SSR Lantern
Festival, Seaside, Idol Stage, Ocean Wave, Hourglass; SR Rose Balloon, Dragonling Gift, Pumpkin Night, Harvest, Pirate
Cove, Clockwork, Winter Holly). Optional `S.supreme.frames {id: copies}`; `S.supreme.frame` may be a set id or one of
these. First copy activates the stats for good, every further copy is a tier up to T20 (each tier adds the base stats
once more, `frameStats`, added through `supremeBonus`); SR cost gold, the rest prisms (`frameBuy`). Avatar tab =
`frameRoom()` (MR, UR incl. the seven set frames, SSR, SR; class `r-mr`). Atlas `comp-avatar-frames` is now 4 x 6
(sets first, then `avatarFrames`, `FRAME_ROWS`); sources in `art-source/frames/` (haze cleaned). Hosted headroom ~80 KB.
Painted chat bubbles (user photo of the reference's Bubble tab): `chatBubbles` = the same sixteen themes (ids, names,
rarities, prices as the frames; stats HP / DEF / ARP), optional `S.supreme.bubbles`, worn `S.supreme.bubble` (set id or
own id). Shared rules: `decoKinds`, `decoCopies`, `decoTier`, `decoStats`, `decoBuy` (frame* are wrappers). One room
`decoRoom(cat)` serves Avatar and Bubble. The seven set bubbles are painted too (no more CSS bubbles): `bubbleArt(id,
text)` / `bubbleAt(id)` in `gear-ui.js`, atlas `comp-chat-bubbles` 4 x 6 of 256 x 160 (sets, then `chatBubbles`) by
`scripts/build-chat-bubbles.py` from `art-source/bubbles/` (centres flattened where the model left haze). A worn
bubble stretches its tile behind her chat lines (`.pb-line`). Global `.fashion-card span` rules need the `#stage .pb`
override. AVIF copies of reina-walk, reina-shoot, fit-control-mount-base, portraits, stat-icons re-saved at quality 32
(looked identical): hosted headroom ~410 KB.
Fashion themes (user photos of the reference's Adventure Shop: "they come in pairs, with a gown and a weapon in the
same theme"): each of the sixteen own frames is a THEME = frame + bubble + gown + bow. Gowns are dress ids 'th'+id
(`throse` ... `thstarmoon`), painted on base-v2.png like the other gowns (`painted/th<id>.png`, `PAINTED` in
`build-fitting-v2.py`) with mounted versions (`mounted/dress-th<id>.webp`, `DRESSES` in `build-mounted.py`); names in
`THEME_GOWNS`, gold by rarity `THEME_GOLD` (the dress price is now `outfitCatalog[id].gold`, not a fixed 1200). Bows are
weapon styles 24-39 (`themeBows`, sources `art-source/bows/bow-24..39.webp`, `bowGrip` entries, the weapon register
loop runs to 39). `themeOfDress`, `themeOfBow`; cards take the theme's rarity. `themeChips(th)` (`.fx-theme`, right
column of the stage) lists the four pieces with ticks and jumps to them (`themeJump`) from the Avatar, Bubble, Garment
and Fashion Bow tabs. Not done: the reference's event exchange shop (Adventure Shop with tokens).
Themes are the WEAK, plentiful line (user: "these are not Supreme Sets; they are weak, but there must be many so there is
a choice"): 40 themes, only SR / SSR (`themeRarStats`, `themeRarPrice`: all for gold; frame ATK 100/140 against the
Supreme frame's 300; bubbles `bubbleStatsBy`). The 24 added in the third pass: melody northlight royal knight storm gem
gothic lotus (SSR), sakura meadow candy teaparty bunny carnival library snowfall oasis tropic papillon kitty foxwood owl
honey rainbow (SR); bows 40-63. Frame and bubble atlases are 4 x 12 (`FRAME_ROWS` 12); the build scripts' `IDS` must
follow sets + `avatarFrames` order (a test checks it). Bubbles from the image model often have see-through centres:
their panels are refilled with a per-theme colour (session helper, the sources in `art-source/bubbles/` are already
fixed). Hosted bundle 31.9 MB (about 1.7 MB spare). Chat preview packs hair layers too (`pack-hairs.js`).
All bundled AVIF copies over 40 KB were re-encoded at quality 32 where that saved 15%+ (193 files, -5.6 MB raw; spot
checks looked identical): hosted bundle 28.1 MB. Chat preview packs `fit-control-*-erase` (`pack-erase.js`) and
trek pickups / pairs tiles (`pack-minis.js`) to stay under 511 files.
Big figure (2026-11-24, user photo of the reference next to ours, figure circled): the card grid row is 21%, the
stage slides under the top bar (`margin-top:-6cqw`), the figure fills it down to the CP plate (feet on the plate; an
old `height:100%` rule had pushed the feet under the panel), round side buttons without boxes, no name over a figure
(the panel names the item; Avatar / Bubble keep it). Rules at the end of `stage.css`.
Second look (same day: "starrier background, the figure is lost among the buttons, cards need not show the whole
outfit, the CP must not be so black on her legs"): night-sky gradient with many stars and a twinkle layer, smaller side
buttons in the bottom corners, CP as glowing text on a faint shadow. Garment cards are close shots of Reina (hair 11)
wearing the dress, head to thighs, from ONE atlas `fashion-cards` (10 x 7 of 200 px, order `FX_CARD_IDS` in `app.js`,
`fxDressArt`, CSS var `--fx-cards`); made by `node scripts/render-fashion-cards.mjs` (needs the preview running; PNGs are
not committed) + `python3 scripts/build-fashion-cards.py`. A new dress needs its id appended to `FX_CARD_IDS` and a
rebuild, otherwise its card falls back to the fit-icon. The chat preview packs the atlas into `pack-icons.js` (the
preview is at the 511-file limit). Hosted bundle 33,520,105 bytes: about 34 KB spare, compress older art first.
Hairstyle tab (user photo of the reference): the stage shows a close bust, head to waist, about 2x
(`.fx-room[data-category=Hair]`: scale from the top, mask fades the body out under a see-through stat panel).
Shoes (user: "why are they barefoot"): 26 theme gowns had been painted with bare feet. Their paintings got shoes
matching the gown (image-model edit of `painted/th<id>.png`, only the rows below y 1250 taken over, so the gown is
unchanged), and 15 mounted paintings where the foot shows in the stirrup (`mounted/dress-th<id>.webp`, merged through a
local difference mask). Rebuilt with `build-fitting-v2.py` / `build-mounted.py`; their AVIF copies re-saved at quality
32 (the builders write 72-80). When painting new gowns, ask for shoes in the prompt.
Bow cards (user circled blurry Original / Frostglass cards and empty Aurora Arc ... cards on the iPad): the two old
bows only had 21 x 128 icons, and on the iPad many separate bow pictures did not show in time. All 63 bow cards now come
from ONE atlas `fashion-bows` (bow laid diagonally, 10 x 7 of 200 px, order `FX_BOW_IDS`, `fxBowArt`, CSS var
`--fx-bows`), built by `scripts/build-fashion-bows.py`; Original bow (= the Leaflight bow, also Azure Laurel) and
Frostglass got clean item paintings (`art-source/fashion-cards/bow-{original,frost}.webp`, image-model edits of the bow
cut from a render). A new bow needs its number in `FX_BOW_IDS` and a rebuild.
Plain Leaflight bow hidden (2026-11-25, user crossed it out: "remove it, it is not like the others"): the Bow tab
no longer lists weapon 0 (Original bow) or its copy 11 (Azure Laurel); `styleFittingRoom` opens on Frostglass when she
still wears it. The bow itself still works (default look, mounted bow).
Tabs like notebook index tabs (user): all seven in one fixed row (grid, no scrolling), short labels (Garment, Bow,
Avatar, Bubble, Hair, Wings, Mounts), the chosen tab taller, in the colour of the card sheet and joined to it; the
others lower and darker.
Found, not fixed: the Skin room (`citySkin`) layout is
broken (overlapping title, blank square, cut labels) - it was like that before this pass.

## Fashion Elite Sale and Supreme Sets (2026-11-22)
User sent twelve photos (Fashion Elite Sale with Outfit / Weapon / Chat Bubble packs, item cards with Activation
Stats and a 5-piece set bonus, Fashion -> Supreme Set). Rules in `gear-data.js` (`supreme*`, placeholders), optional save
field `S.supreme {own{"set:piece":copies}, bubble, frame, sale{period,bought}}`.
- Four sets (`supremeSets`: Ember Charm, Frost Crown, Jade Phoenix, Starlit Night), each = an existing dress, hairstyle
  and bow plus a chat bubble and an avatar frame drawn in CSS (no new pictures). Owning a piece activates its stats
  for good (`supremeStats`, `supremeBonus` in `stats()`); five pieces add `setBonus`; every spare copy is a set star
  (max 10, +5% each, `supremeStars`).
- Elite Sale (screen `eliteSale`, `eliteStore()` rewritten): one set every four UTC days (`supremeSale`), tabs Outfit
  Pack (outfit + hair accessory), Weapon Pack, Chat Bubble Pack (bubble + avatar frame). A pack = the piece + 680 gold
  for 300 prisms (real money is never used; struck "original" 900), limit 3 or 5 per sale (`supremeBuy`). The first
  copy also unlocks the dress / hair / bow in the wardrobe. Tapping a piece opens the item card (`supremeInfo`).
- Supreme Set (screen `citySupreme`, from Fashion's "Supreme Set" button and the sale): five piece tiles around the
  figure, stars, title ribbon, CP, stat table, Wear set (`supremeWearSet`: dress, hair, bow, bubble, frame that she
  owns), Full Set Preview and Activate Stat pop-ups, set strip. The worn bubble frames her chat lines; the worn frame
  rings the avatar in `#profileReadout`.
- Third pass (the photos again): the sale stands in a clean lilac palace hall with a round dais (`elite-hall`,
  source `art-source/fashion/elite-hall.webp`), sunburst limit badge, a green "Activated" corner ribbon on owned
  piece tiles (`.sup-act`), the Hair Accessory card shows a head close-up (`.sup-head`), the Weapon card the bow, and
  the weapon tab shows a big bow over the dais.
- Premium pass (user: "they are sold for real money, buy as many as you like, make them really beautiful so you
  want to buy them, add matching wings"): no purchase limit (the `limit` fields are gone; validation still accepts old
  `sale.bought`). Each set has its own exclusive gown and matching wings painted for it (image model; gowns are edits
  of `base-v2.png`, mounted versions edits of `mounted/base.webp`, so they work in the wardrobe, battles and riding):
  ember = Phoenix Empress (`phoenix`, `fashion-wing-21`), frost = Crystal Snow Queen (`snowqueen`, 22), jade = Peacock
  Jade (`peacock`, 23), star = Starlit Galaxy (`galaxy`, 24). Added on request: mermaid = Mermaid Princess (`mermaid`, 25), icequeen =
  Ice Queen (`icequeen`, 26, deep sapphire, unlike the pale Snow Queen), love = Sweetheart (`sweetheart`, 27). Seven
  sets rotate in the sale (one every four days). A sixth piece, Wings (Weapon tab), so a full set is 6/6.
  Exclusives are never sold for gold (`PREMIUM_LOOKS`, `premiumLocked`, `premiumNote` in `app.js`). Real-money payment
  is NOT built: packs still cost prisms (a payment provider and store accounts would be needed). Gold-jewel styling of
  tiles, cards, ribbon and set room; unowned sets show in full colour. Hosted bundle: AVIF copies of several large maps
  and sprites (cloud-war-*, companion-poses, reina-silver-tabby, equipment-atlas, dragon/enemy-motion) were re-saved
  smaller to make room (headroom ~560 KB).
- Piece stars (user photos of the reference's Supreme Set: every repeated purchase raises that piece's stats): the
  first copy activates a piece, each further copy is a TIER of that piece (`supremePieceStars`, T1..T5; user photo:
  4 purchases = T3 = 4 x the base stats, so `starStep` is 1: each tier adds the full stats once more; tiles show Tn,
  the button says Tier-up); the 10-star row of the set is all its spares together. Paid stats were raised to strong
  flat values plus a percentage per piece (`supremeStats`), set bonus ATK +200, ATK +8%, HP +8% (placeholders).
  Set room: tap a piece to select it (`supremeSel`, `supTap`): title "<set> (<piece>)" with its 5 stars, the piece
  large in the centre, a panel with stats now and ▲ after the next star, the copies owned and Activate / Star-up
  (`supremeGet` buys one more copy when the set is on sale), Details opens the item card. Tap again for the set view.
- Not done: Relic tab, Apparel Records, fashion Tier-up, male sets.

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
  `cloudNewRound`). Until taken, a SMALL (20 px, user: "it is small and shows the city is taken") bobbing chest (cut from `comp-bag-items` with the SVG clip `#cloudChestClip`)
  floats above the city on the map; tapping it (`cloudOwnClaim`) or the city window's "Ownership Reward" button pays
  into the bag. Nested `<svg viewBox>` did not clip there, use the clip path.
  Second look (2026-11-25, user photos: big glowing chests beside each held city, "Congratulations on Obtaining"): the
  chest is the Winged Chest cell at 46 units to the right of the city, with a pulsing gold glow (`#cloudChestGlow`) and
  two sparkles; a tap pays into the bag and opens the shared `resultShow` window (Congratulations!, prize tiles in a
  grid, Confirm). `cloudOwnReward` has more tiles now (Capital 6 kinds, Fortress 5, Island 4; placeholders).
  Map bottom (user crossed out the dark Carnage bar and the boxed tool bar): the map runs to the bottom; Carnage Points
  is a small pill floating on it and the tools are small icons with outlined labels on a soft gradient, right of the
  back button (CSS "Cloud War bottom, third look" at the end of stage.css).
- Timed background fights (2026-11-24, user: "each fight about a minute, auto, you can see Reina fighting, and I can
  leave to the menus instead of only watching"): a fight lasts `CLOUD_FIGHT` seconds (Guard 45, Elite 60, Boss 75; less
  for a hurt defender) on a wall clock (`cloudBattle {index,slot,role,hp0,start,dur}`); `cloudFightTick` (1 s interval,
  any screen) settles it (`cloudFightSettle`: hits, Carnage, loot) and, with Auto next, starts the next one after the
  loot (`CLOUD_LOOT_MS`) and the ride (`cloudRideMs`). `cloudBattleView` only draws: Reina's volleys, her three pets'
  bolts, the defender's orbs, damage numbers, HP and time left; Celestial Arrow takes 4 s off (8 s cooldown). Buttons:
  Leave · keeps fighting (back to the city, fight goes on), Stop (`cloudFightStop(true)` keeps the damage done). On other
  screens a pill (`#cloudPill`, `cloudPill`) shows the fight; tapping it returns to the view. Not saved across a reload.
- Not done: Cloud Hunt, buying extra Carnage, Bizarre Lands, other players' damage shares on the boss bar.

## Social room: chat, friends, mail (2026-11-21)
User: "let's launch the chat", with photos of the reference's chat strip, Friends (Giftable / Receivable, hearts,
Management / Send Flowers / Apply / Add / Gift All, Recent Contacts / Friends / Blacklist), Mail and Thank-you Note.
There are no other players: every person is an AI adventurer and is labelled "AI" everywhere.
- Home: the old dead strip (`.city-chat`, "Globe Welcome to Sky Garden") is now `homeChat()`: the latest two World
  lines; tapping it opens the chat, its bubble opens Friends / Mail / Notes with a red count of unclaimed letters and
  friend requests. The Journal moved to More only.
- Screen `citySocial` (`gear-ui.js`, `socialPage` Chat / Friends / Mail / Notes, bottom bar). Rules in `gear-data.js`,
  optional save field `S.social` (`validSocial`), read through `socialState(s,now)` (daily reset of flowers).
  - Chat: channels World / Guild / Cross-server / Private (`chatChannels`). AI lines arrive every 25 s, picked from the
    clock (`chatFeed`, same after a reload); her own lines are kept (last 30) and an AI answers each (`chatSay`; `<>`
    stripped, 80 chars). Private: pick a friend; recent partners go to Recent Contacts. The page refreshes every 8 s
    unless she is typing (`socialTimer`, stopped on leaving).
  - Friends: ten AI adventurers (`socialFolk`, portraits via `portrait()`), start with four friends and two requests.
    Flowers: ten sent and ten received a UTC day (`sendFlower`, `giftAll`: +10 intimacy each, received ones +20
    gold); hearts = intimacy / 100, up to five, half hearts shown. Apply (accept/decline), Add, Blacklist (via ⋯).
  - Mail and Thank-you Note: a welcome letter, a Daily Courier letter every UTC day and one or two thank-you notes
    from friends (`socialTick`), each with bag items; Claim (checked or all), Delete (only claimed), 30 letters max.
    Claim puts the items straight into the bag with a short toast, no "Items Obtained" window (user: no confirming).
    Own wording everywhere (user: "similar, never the reference's words verbatim"): letters from "Sky Garden Post",
    "Dear Reina,", Morning Parcel; older saved letters (Kiki / System / ...) show "Sky Garden Post" (`mailFrom`). Buttons never select their label on a long press (`#stage button`).
- Art (image model): `art-source/social/banner.webp` + one painting per icon `icon-0..8.webp` (user: "polish them,
  nothing cut off"; the old grid sheet `icons.webp` carried slivers of neighbours) -> `comp-social-banner`,
  `comp-social-icons` (4 x 3: flowers, heart, empty heart, letter, open letter, note, chat bubble, gift, friends ledger
  for Management) by `scripts/build-social-art.py`; every tile keeps an 18 px clear gutter so small icons (hearts) never
  show a neighbour on the iPad. The Friends action bar shows them in gold-rimmed discs.
- Chat sheet (second pass, four photos of the reference's chat): tapping the home strip slides a sheet up over the
  home screen (`chatSheetOpen`, `.chat-sheet.over`, ⌄ closes; the room's Chat page shows the same sheet `.in-room`).
  Channels in a column on the left: System (read-only; `socialNote(s,text)` adds her events: dungeon victories,
  Super Rare summons, crafts, Cloud War ownership rewards; optional `S.social.sys`, last 20), Squad (Team line plus
  one card per squad member = her first three friends, `squadOf`; a card opens a talk `p:<id>`), Globe, X-server (AI
  with `[S-nn]` server tags and faction tags, a riddle every ten minutes with AI answers and an end line, "Block all
  messages in cross-server channel" = optional `S.social.xblock`), Guild (AI loot rolls "rolled N" / "rolled highest
  this round! Bonus: T3·Boots (Orange)" and guild lines), Faction (Cloud War talk). Below the channels: Coordinate
  (posts where she is), Shortcut (quick phrases), Bag. Input "Press the avatar or input @ to notify…"; tapping an
  avatar inserts @Name; ☺ opens twelve emoji. Old saved channel names World / Cross-server read as Globe / X-server
  (`chatOld`). No jerking (user: "the chat window must not twitch"): the 8 s timer only swaps the messages when they
  changed (`chatFeedOnly`) and keeps the reading position unless she is at the bottom; the slide-up animation plays
  only when the sheet opens (`.opening`); `chatRefresh` (full redraw) is only for her own actions.
- Live AI replies (user 2026-11-22: "bots should answer the real person with a real model, low daily limits, do not
  spend all the money"): the OpenAI key cannot be used (the proxy injects it only in the dev container, and a key in a
  browser game would leak). Instead the in-chat preview artifact declares the `sample` capability (publish with
  `capabilities: {sample: {}}`): when she sends a line (`chatSend`, `chatQuick`), `chatAsk` asks Claude (`modelTier`
  quick, `cache:false`, prompt with the AI's name, the channel, the last four lines, "at most 25 words, same language")
  and `chatLiveSet` replaces the stock reply; "typing…" while waiting. At most `socialRules.liveDaily` (30) a UTC day,
  counted in optional `S.social.live {day,n}`; AI lines may be up to 160 chars (`liveMax`) and carry `live:true`.
  It spends the viewer's own Claude usage (consent dialog on the first call); background AI chatter and every
  failure keep the free stock lines; a refusal turns it off for the page load (`chatAiOff`). On gh-pages and in tests
  `window.claude` is absent, so nothing changes there.
- Not done: a real guild, voice messages, the reference's Management page, sending mail to friends.

## Guild (2026-11-21)
User: "now let's make the guild" (no photos). Home -> Guild (the left promo icon, formerly ClanClash, and the drawer's
Guild) opens `cityGuild` (`gear-ui.js`, `guildPage` Hall / Members / Boss / Shop / Blessings). Rules in `gear-data.js`
(placeholders, `guildRules`), optional save field `S.guild` (`validGuild`), read through `guildState(s,now)` (daily
counters reset 00:00 UTC, shop limits on Monday). Every member besides Reina is an AI adventurer, labelled AI.
- No guild: join one of three AI guilds (`guildList`, `guildJoin`, she is Member) or Found a Guild for 2000 gold with
  a name and one of four crests (`guildCreate`; she is Leader, her first three friends join). Leave any time.
- Hall: crest, name, level bar (`guildLevel`, 1000 x level EXP per level, max 10), Daily Check-in, Donate Gold (3 a
  day), Donate Prisms (1 a day) -> guild EXP, contribution, guild coins; Guild Boss shortcut.
- Members: her and the AI members with role, level, online status and contribution today.
- Boss: one a day, HP 60000 x guild level; AI members' damage grows through the day (`guildAiDamage`); she has three
  attacks (`guildHit`, damage from her power); when the total reaches the HP the reward is claimable once: 100 guild
  coins and a chest by her rank (`guildBossRank`, `guildBossClaim`). Boss art reuses `guardian-t21`.
- Shop: bag items for guild coins, weekly limits, some need a guild level (`guildShop`, `guildBuy`).
- Blessings: contribution raises ATK / HP / DEF levels for Reina (cap = 2 x guild level; `guildSkillUp`,
  `guildBonus`, added in `stats()`).
- System chat notes on joining / founding. Art (image model): `art-source/guild/{hall,icons}.webp` ->
  `comp-guild-hall`, `comp-guild-icons` by `scripts/build-guild-art.py`; crests are the one crest icon hue-rotated.
- Second pass (user sent five photos of the reference's guild; Warehouse, Hire and Guild Auction are extras, skipped):
  bottom bar Info / Academy / Guild Beast / Shop (`guildPage`), the Info page has sub-tabs Info / Member / Ranking /
  Red Envelope (`guildTab`). The Hall and Blessings pages are gone.
  - Level and fund: the guild has a stored `lv` and `fund` (sign-in, donations and Surprise Bags feed the fund);
    Guild Level ↑ (`guildUpPop`, `guildUpgrade`) spends `guildUpFund(lv)`, leader or elder only; in an AI guild the
    AI leader upgrades as soon as the fund allows (`guildGain`). Member cap `guildCap(lv)`. Guild Power = her power +
    simulated AI powers (`guildFolkPower`); Ranking against AI guilds (`guildRanking`, `guildRivals`).
  - Info: name banner over the hall art, leader with crown, Guild Announcement and Speaker line (editable by leader /
    elder, `guildNote`, `guildSpeaker`), four cards (fund, members, power, upgrade funds), donations, and a Sign-in
    button with two chests opened by the day's sign-in activity (her + AI members, `guildActivity`, `guildBoxClaim`).
  - Red Envelope: AI members send Surprise Bags daily (five shares, one kept for her: gold or wishes), Check Others'
    Luck, records, Send Surprise Bag for prisms (`guildEnvelopes`, `guildEnvClaim`, `guildEnvSend`). The envelope is
    drawn in CSS (`.gld-env`).
  - Academy: twelve stats (`guildAcademy`: ATK, HP, ARP, DEF, Dodge, Accuracy, ATK%, HP Bonus, DMG Bonus, DEF Bonus,
    ELEM. ATK, ELEM. DEF) for contribution, cap `guildAcademyCap(lv)` (`guildLearn`, `guildBonus` in `stats()`).
  - Guild Beast: tier = Reina's tier (`guildBeastTier`), Divine Beast Drop row, her own guild must book it first
    (Reservation, `guildReserve`, from the fund; AI guilds are always booked), three challenges a day, the claim adds
    a piece of the beast's tier by damage rank (2-Star Red / Orange / Purple, `guildBossRank`) plus chests and coins;
    Reward Preview and rules pop-ups.
  - Save: optional `lv, fund, note, speaker, academy, box, reserved, envGot, envSent`; first-pass saves (`exp`,
    `skills`) still load: `guildState()` derives the level from `exp` and turns the old ATK/HP/DEF blessings into
    Academy levels. No new pictures (headroom).
- Hosted bundle headroom is only about 0.1 MB now: compress older art before adding pictures.
- Not done: guild wars, guild quests, applications from other players, roles management, Warehouse, Hire, Auction.

## Castle Defense restyle (2026-11-24)
User: "made by ChatGPT, very primitive; animate the characters, preload everything, beautiful explosions and hits, the
suns should fly out, nicer texts". Rules, scores (`defensePoints`, `DEFENSE_TARGET`), rewards and save fields unchanged.
- Art (image model, sources `scripts/art-source/defense/`, built by `scripts/build-defense-art.py` into
  `src/assets/generated/td-*.webp` + AVIF in `scripts/hosting-art/`): `td-reina` (edit of `leaflight/master.png`),
  `td-nyra`, `td-kael` = 4 x 2 sheets (row 0 idle loop, row 1 shot / cast; cells 240 x 280, feet at 100,274; the
  build aligns every frame on its feet and drops specks from neighbouring cells), `td-foes` (4 x 3 walk cycles facing
  left), `td-boss` (4 walk frames of emberpeak), `td-fx` (4 x 2 on black, drawn with 'screen': starburst, fire blast,
  ice shatter, ring, sparkles, death poof, ice bolt, sun comet), `td-sun` (pickup). Layout constants `TD_ART`, `TD_FX`
  in `minigame-engine.js` must match the build script. The Archer is always the painted Leaflight Reina (not the worn
  wardrobe look).
- Code (all Castle Defense code in `minigame-engine.js` above `MERGE_STEP`): `defensePreload` (decodes every picture
  when the game opens, and 1.5 s after the Mini Games covers), `drawDefender` (idle 5 fps + breathing, shot frames
  timed by `TD_SHOT`, release at the projectile's windup, charge glow, pop when built / upgraded), `drawFoe` (walk
  cycle, knock-back `e.kb`, white hit flash and squash via cached silhouettes `tdSilhouette`, frost tint when slowed),
  `defenseHit` / `defenseDeath` (painted bursts `tdFx`, shards and sparks `tdBurst`, swelling white corpse `g.dead`,
  shake), `tdText` / `drawDefenseTexts` (outlined gradient numbers that pop, rise and fade: damage, +points, +energy
  with a sun, -crystal), `drawDefenseBanner` (WAVE N / WAVE CLEARED ribbon), `drawIncoming` (red edge, moving chevrons).
  Suns: the sky sun (`g.sun`, same random calls as before) plus suns that pop out of fallen foes (`g.drops`,
  `TD_DROP_SUN` 30%, every boss drops 3; `TD_DROP_VALUE` 15) bounce and bob; tapping one bursts into sparkles and it
  flies to the energy counter (`g.sunFly`). Visual randomness uses `tdRand()`, never `Math.random()` (keeps the
  balance test's sequence).
- UI: controls painted by `updateDefenseControls` (`game-polish.js`): vitals plaques, defender cards with the unit's
  own idle frame (`defensePick`, CSS var `--td-art`), violet Upgrade and gold Wave buttons side by side; CSS under
  "CASTLE DEFENSE UI" at the end of `stage.css`. The end window is `resultShow` (`defenseResult`, stars by
  `DEFENSE_STARS` 150 s). Hosted bundle after this: 32,554,965 bytes.

## Full-width screens (2026-11-24)
User: "some sections are narrow (Fashion Elite Sale), Blossom Vow opens to the full width and looks much better; make ALL
sections open to the full width, professionally". RULE: every screen fills the window; never cap `#stage` at 55-72dvh
again. One rule under "Full-width screens" at the end of `stage.css` sets `#stage{width:min(100%,86dvh)}` for home,
character, fashion, isleArena and all city rooms (Bag, Craft, Vault, Devour, Pet, Companion, Skin, Forge, Daily,
Gameplay, Explore, Cloud War, Elite Sale, Bounty, Hunting, Summon, Contest, Social, Guild, Supreme): full width at
590 x 690 and iPad portrait, a centred column on a landscape desktop. Only the Mini Games hub (`.mg-hub`) stays a narrow
column on purpose. A new screen must not add its own width cap.
- The rooms size things in `cqw`, so a wider room grew everything and ran out of height. Fix pattern: cap by height,
  `min(Xcqw, Ycqh)` (in rooms that are size containers, `.spirit-room` / `.satchel`, cqh is the room; elsewhere the
  viewport). Fashion uses `min(Xcqw, 0.58·X cqh)` = exactly the old size, and its card grid gets more columns instead.
- Found on the way: in-room `<nav>` / `<header>` elements pick up the global app-nav / app-header rules (absolute,
  76-94 px): `.spirit-nav` is pinned back into its grid row and the Skin room's `<header>` back into the grid (that was
  the "broken Skin room"). Use `div` for new bars, or reset them like that block does.
- Elite Sale and Supreme Set buttons are the painted plates (`ui-btn-gold` for the price and the current tab,
  `ui-btn-violet` for the other tabs). Sheets: `fw-sheet-590-*.png`, `fw-sheet-1024-*.png` (session scratch).

## In-chat playable preview (user requirement)
The user wants to play the game inside the chat, and wants SHORT replies in Russian, no fluff.
- Artifact: https://claude.ai/artifact/L9owNJPMaZjAsTmU3tDGs6 (private). After game changes, rebuild and republish:
  `python3 wings-of-wonder/scripts/build-chat-preview.py <scratchpad>/chat`, then Artifact publish of
  `<scratchpad>/chat/wings-of-wonder.html` with `url` set to that link, `root` = `<scratchpad>/chat/files`, and only the
  CHANGED files in `files` (unchanged ones are kept). A first full upload needs two publishes (files-1.json, files-2.json).
- Durable save copy (user lost a Lagoon Gala round: the viewer's browser storage came back empty): the artifact declares
  `capabilities: {sample:{}, db:{}, user:{}}`; `initDbSave()` / `dbSaveWrite()` in `app.js` keep the save as a JSON
  string in the private doc `data/users/<id>/save` (2.5 s debounce after `save()`); on load the newer of local and
  stored (`updated`) wins. ALWAYS republish with those capabilities (omitting `capabilities` carries them forward).
- Limits that shaped it: 511 files per artifact, no .glb, no external iframes. The builder drops unused art and packs
  gear/familiar/guardian/fish/wardrobe-card/bow icons into `pack-*.js` data URIs. The builder only sees files tracked by
  git (commit new art first) and writes `files-delta.json` (what to send, `null` = remove) against
  `<scratchpad>/chat-published.json`; copy `files-now.json` over that file after each publish.

Still to do:
- Home promo "Challenge" was removed (2026-11-23, user: it duplicated Dungeons, Hunting is the way in); bring the
  slot back only when a real Challenge feature exists (user: "maybe something will come later").
- Mounted hair: small redraw specks can remain along the jaw at high zoom (hairs 2, 10); hair 8 has a dark spot in
  the left tail that is in the painting itself.
- User has not yet approved the nine repainted designs (details differ slightly from the old art).
- Other screens not inspected yet: profile, bag/character sheets, rankings, Jungle Trek sprite, wings tab.
- Hosted bundle is 33,499,960 bytes against a limit of about 33,554,432 (54 KB spare). `fit-control-hand`,
  `fit-mask-*` and `leaflight-master` are no longer embedded.
- Hairs 1, 2, 4-8 still use the fixed front/back rectangle; hair portraits are low-res (154x196).
- Fresh save shows short auburn hair (hair 1), not silver hair as the handover describes.
- `dist/` was NOT rebuilt or published; the live site is still v301.
