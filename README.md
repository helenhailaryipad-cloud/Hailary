# Wings of Wonder

Original, free, landscape-first 2D browser game prototype for iPad. English UI.

The main scene combines a large elven ranger, equipped wings and companion dragon with live stats and six upgradable equipment slots. Four dragons and four wings can be bought for earned gold, found in wishes, or chosen with scales. Wishes cost 50 currency; ten cost 500. Every draw gives 10 scales. One-time automatic milestone returns at 15 / 30 / 60 / 135 / 240 draws grant 400 / 740 / 1240 / 1240 / 1240 currency. Each 300 draws grants an explicit choice, and 2,000 scales can be exchanged for a choice. This is our documented prototype economy, inspired by past Huntopia discussions rather than a claim about its exact or hidden rules. No real payments or time-limited currency.

Castle Defense has three lanes, three defender types, eight waves, upgrades, pause, rewards and a boss. Dragon Merge uses circle physics, eight egg tiers, merge scoring, a one-use breeze, overflow detection, pause and run rewards. Both share the hero's saved progression. The Journal contains free test gifts, hero naming, save export/import and an opt-in leaderboard.

Authenticated cloud saves use the Sites user ID and D1. Optimistic revision checks prevent simultaneous-device overwrites. Local saves provide a fallback; conflicts require choosing an adventure. The leaderboard is an opt-in prototype showcase that allows test gifts, not a competitive or cheat-resistant game. The initial deployment is owner-private; the networking layer supports separate visitors when access is later expanded. This version has no shared-world multiplayer combat.

## Realm and dungeons

Six named AI adventurers have distinct roles, personalities, independent simulated records and a live activity feed in the Realm. These are explicitly marked AI simulations; they do not impersonate real users, run an LLM, or mutate the player economy. An adventurer can join as a dungeon ally with a distinct passive or be challenged to a free training spar.

Mistwood Hollow, Moonfall Ruins and Emberpeak Sanctum each have three encounters ending in a boss. Battles combine automatic basic attacks with Celestial Arrow, Healing Bloom and Windstep. Telegraphs signal power strikes. Cooldowns use paused game time. No entry currency or daily limit. Victory and partial-clear rewards are guarded against duplicate claims. Existing Castle Defense and Dragon Merge remain available in Adventures. Save version 1 remains backward compatible; dungeonWins and sparWins are optional counters validated by client and server.

## Individual equipment and the Bag

An original painted 4×3 equipment atlas supplies ten equipment slots and crafting materials. The landscape Bag surrounds the ranger with equipped items and provides a six-column inventory. Every item has its own stable instance ID, independent enhancement level (0–20), stars (0–5), gem sockets (0–3), and tier (1/3/5/8). Clicking any piece opens its individual stat, comparison and development window. Duplicate pieces remain independent. Equip, enhancement, stars, sockets, crafting, sorting, best-equipment selection and confirmed spare salvage are functional. Crafting preserves instance identity and all progress.

Legacy six-slot upgrades are inherited by their matching starter pieces. Legacy and materialized state calculate through the same pure `gear-data.js` rules, with no second legacy contribution. Client and cloud use identical validation and power calculations; equipment state is optional for backward-compatible version-1 saves. Invalid template IDs, duplicate instance IDs and wrong-slot assignments are rejected. Dungeon victories drop gear; dungeons and mini-games award materials at completed checkpoints. Full bags convert new gear to crystals. The free test chest provides prototype materials and an Epic spare item.

Equipment adds real Armor Piercing, DMG Bonus, DMG Reduction, Block and Adventure EXP effects. Result windows display awarded experience after the bonus and the actual crafting materials received. Tier colors, stars, enhancement levels and socket indicators are visible on the gear frames. Fortune and Guardian ring instances have separate slots and progress. The character illustration remains the original ranger painting; individual wearable-art transformations are future work.

## Sunny cartoon presentation and large-print UI

The current visual direction uses original sunny cartoon garden, smiling elf ranger and rounded baby-dragon sprites. White bold functional text uses 24px primary and 20px secondary scales, with large tier badges and a three-column inventory. Large item dialogs stack their attributes vertically with a sticky close control and scroll rather than shrink. Original art is retained in source as earlier assets.

CSS supplies gentle character breathing, wing drift, pet bobbing, portal shimmer and dialog transitions. A single bounded DOM effect pool provides up to 42 tap sparkles, plus 14 ambient fireflies. It clears when changing screens and pauses while hidden. Merge bursts are bounded to 72 particles and spell effects to 12, driven by the existing game RAF and paused game time. OS reduced-motion settings disable decorative animations and canvas bursts.

The combat side panel keeps Help, Pause/Resume and Finish outside its scrollable controls. Help opens readable instructions and pauses the game; Resume is explicit. Canvas aspect ratio and pointer coordinate conversion are unchanged. No extra per-effect animation loops or external AI services run during play.

## Development

`npm run dev -- --port 4173` serves a local UI preview. Its API returns 503 intentionally, so local testing does not impersonate an account.

`npm test` checks the wish economy, duplicate reward guards, merge physics, defense spawning, AI independence, dungeon and spar rewards, backward-compatible saves, authenticated cloud saves, user isolation, CAS conflicts, validation and the opt-in leaderboard using in-memory SQLite.

`npm run build` bundles authored HTML, JS, CSS and WebP artwork into a dependency-free Worker module at `dist/server/index.js`. Hosting metadata is in `.openai/hosting.json`. D1 schema migrations are in `drizzle/` with a journal. Production authentication is supplied by Sites, not by client-generated credentials.

## Art and future work

Original generated environment, ranger, feather wings and dragon art are included as WebP. The available image generation interface cannot select or attest a model specifically named GPT Image 2.6. Color variations currently share the base dragon and wing paintings; more species silhouettes and individual outfit art can replace these assets. The sprite rendering and data-driven item catalog are the starting point for a later 3D renderer. Account data can keep the same shape while the display engine changes.

Future scope: original class options, more distinct item art, animation sets, real multiplayer sessions, server-authoritative progression and mobile performance profiling on physical iPads. No claim is made that current prototype balance matches Huntopia.

Portrait iPad layout: Hero shows the character and readable stats; Equipment is a dedicated tab with all ten slots, independent upgrade windows, inventory, wings and dragon links. Portrait navigation stays visible in two rows.

The whole game now uses one centered portrait interface in every orientation. Five navigation tabs: Hero, Equipment, Play, Wonders, More. More opens Realm, Wishes and Journal; Wonders also links to Wishes. All existing gameplay, individual gear upgrades and saves are retained.

Home is a fixed portrait composition: stationary hero on a layered pedestal, lightly translucent Attributes panel, no scrolling. Short screens collapse Attributes into the accessible power button, opening the full stats dialog. Atmosphere uses CSS godrays, two mist layers, 18 bounded depth particles and pointer parallax coalesced into one requested frame, with reduced motion and hidden-page handling.

Optional 3D art intro: original pre-rendered REINA splash (not an interactive 3D model). Enter garden opens the existing game. Back to 2D skips the intro on future visits on this device. More > 3D intro reopens the comparison. Presentation choice uses its own local key, never changes game saves or equipment.

The 3D-rendered intro now uses one seamless full-screen garden composition, with the hero and pedestal integrated into the environment. Live HUD and translucent stats overlay the quiet foreground. The original 2D game remains accessible with Back to 2D.

Real 3D hero: uses the user-supplied corrected angel_archer(1).glb as assets/angel-archer-v2.glb, with embedded body/bow textures and embedded Idle (11.3s) held at its first pose. REINA remains static, while mana effects continue to animate. Quantized skinned poses are sampled for framing; normalization uses a separate parent Group. OrbitControls supports drag, pinch zoom, arrow-key rotation and double-tap or Home reset. Three.js and effects are bundled locally, without a CDN. The scene includes a 3D garden, pedestal, mana rings, 72 particles and capped-resolution bloom. Renderer/mixer/controls/GPU assets are cleaned up on navigation; loading is abortable and hidden pages pause. 2D/3D switches select distinct persistent main views without changing game progress. The earlier prerendered assets are retained only for rollback. WebGL is required; an accessible error with Retry and a working 2D switch is shown if unavailable.

The active home screen has been restored to the 2D REINA profile. Previous 3D preferences and legacy intro links return to this profile. Experimental GLB assets and renderer source are retained for rollback but are not loaded by the page. Game saves and progression remain unchanged.

Dungeon economy: nine permanent three-encounter dungeons, each with a unique boss, repeatable base gold and a once-only first-clear bonus. Later bosses heal once, soften burst damage or shorten strike warnings. Every completed dungeon grants one persistent free wheel spin; failed/abandoned runs do not. Eight equally likely wheel rewards are credited and saved before the cosmetic animation. Eight permanent quests and the repeatable three-victory guild bounty award gold without daily deadlines. Adventure fields are optional for older saves and validated by the same shared module on client and server. This remains a client-authoritative prototype economy.

Playable dungeon crawl: tap/drag the floor or use arrow keys to move REINA through Outer Gate, Guardian Hall and Boss Sanctum. Each guardian locks the exit until defeated; the player walks through the opened door to continue. The final boss has 2.4 times its former health. Basic arrows, Celestial Arrow, healing and Windstep drive combat. Ground-targeted boss strikes can also be dodged by physically leaving their red ellipse. No boss currency or wheel spin is granted for merely exploring halls.

Boss art: nine original vector portraits replace the small rounded boss placeholders. Each dungeon has a distinct silhouette, themed armor, elemental colors and glowing accents. The same portrait appears in its dungeon card and final combat, loaded locally as a cached SVG image. Guardians keep their smaller art. Boss art is anchored to the floor and its health bar sits beneath the boss title.

Boss equipment loot is now explicit: each defeated final boss grants one item from its disclosed slot pool, with tier, starting enhancement/stars and higher-tier odds shown before entry. Materials scale by boss. Victory shows the item, actual hero-power comparison and a link to its independent Equip/Enhance/Star/Gem/Craft window. Equipped items are never replaced automatically. A full bag converts only the new drop to 20 extra crystals; existing items remain intact.
