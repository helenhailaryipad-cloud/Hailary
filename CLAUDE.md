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

## Wardrobe status (updated 2026-11-18)
Root cause of the "neck/shoulder/hand sticks out" complaints: layers were cut with hand-traced polygons
(hard edges, a pasted polygonal hand, base bodysuit showing beside narrow dresses, gaps beside the ear).

Fixed with per-pixel layers built by `wings-of-wonder/scripts/build-fitting-v2.py` (first batch, awaiting user review):
- Dresses: `grove` (Emerald Leaves), `leaflight`, `emberveil` (Northern Wayfarer).
- Hair: 3 Cherry Bob, 9 Lagoon Side Braid, 10 Onyx Topknot, 11 Lavender Braid.
- Method: dresses painted on the base body are extracted as "pixels that differ from the base body"; garment-only art
  gets the whole garment plus a colour-matted hand (`fit-control-hand`); portrait hair gets ear/temple gaps filled.
- Registered in `ensureWardrobeCatalog()` via `wardrobePixelDresses`, `wardrobeMattedHandDresses`, `wardrobePixelHairs`.
- `leaflight-master.webp` is no longer loaded at runtime or embedded in the hosted bundle (bow is `fit-control-bow-11`).
- Hosted bundle after the change: 33,520,104 bytes (limit is about 32 MiB = 33,554,432; it was 33,520,880).
- Before/after sheets: `docs/wardrobe-review/fix1-*.png`.

Still to do:
- Remaining 9 dresses still use polygons (visible: polygonal hand patch with bodysuit wedges on every one of them).
  Garment-only art (`scripts/art-source/fitting-control/<id>.png`) can use the matted-hand route like emberveil.
- Remaining hairs 1, 2, 4-8: check ear/temple gaps; 4, 8 have long tails behind the shoulders (need back/front split).
- Hair portraits are only 154x196 px sources, so hair is softer than the body.
- Not inspected yet: mounted (cat-rider) pose, combat sprites, wings tab.
- Fashion tab item icons are small full-body thumbnails.
- Fresh save shows short auburn hair (hair 1), not silver hair as the handover describes.
- `dist/` was NOT rebuilt or published; the live site is still v301.
