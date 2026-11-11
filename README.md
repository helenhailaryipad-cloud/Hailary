# Wings of Wonder

Original, free, landscape-first 2D browser game prototype for iPad. English UI.

The main scene combines a large elven ranger, equipped wings and companion dragon with live stats and six upgradable equipment slots. Four dragons and four wings can be bought for earned gold, found in wishes, or chosen with scales. Wishes cost 50 currency; ten cost 500. Every draw gives 10 scales. One-time automatic milestone returns at 15 / 30 / 60 / 135 / 240 draws grant 400 / 740 / 1240 / 1240 / 1240 currency. Each 300 draws grants an explicit choice, and 2,000 scales can be exchanged for a choice. This is our documented prototype economy, inspired by past Huntopia discussions rather than a claim about its exact or hidden rules. No real payments or time-limited currency.

Castle Defense has three lanes, three defender types, eight waves, upgrades, pause, rewards and a boss. Dragon Merge uses circle physics, eight egg tiers, merge scoring, a one-use breeze, overflow detection, pause and run rewards. Both share the hero's saved progression. The Journal contains free test gifts, hero naming, save export/import and an opt-in leaderboard.

Authenticated cloud saves use the Sites user ID and D1. Optimistic revision checks prevent simultaneous-device overwrites. Local saves provide a fallback; conflicts require choosing an adventure. The leaderboard is an opt-in prototype showcase that allows test gifts, not a competitive or cheat-resistant game. The initial deployment is owner-private; the networking layer supports separate visitors when access is later expanded. This version has no shared-world multiplayer combat.

## Development

`npm run dev -- --port 4173` serves a local UI preview. Its API returns 503 intentionally, so local testing does not impersonate an account.

`npm test` checks the wish economy, duplicate reward guards, merge physics, defense spawning, authenticated cloud saves, user isolation, CAS conflicts, validation and the opt-in leaderboard using in-memory SQLite.

`npm run build` bundles authored HTML, JS, CSS and WebP artwork into a dependency-free Worker module at `dist/server/index.js`. Hosting metadata is in `.openai/hosting.json`. D1 schema migrations are in `drizzle/` with a journal. Production authentication is supplied by Sites, not by client-generated credentials.

## Art and future work

Original generated environment, ranger, feather wings and dragon art are included as WebP. The available image generation interface cannot select or attest a model specifically named GPT Image 2.6. Color variations currently share the base dragon and wing paintings; more species silhouettes and individual outfit art can replace these assets. The sprite rendering and data-driven item catalog are the starting point for a later 3D renderer. Account data can keep the same shape while the display engine changes.

Future scope: original class options, more distinct item art, animation sets, real multiplayer sessions, server-authoritative progression and mobile performance profiling on physical iPads. No claim is made that current prototype balance matches Huntopia.
