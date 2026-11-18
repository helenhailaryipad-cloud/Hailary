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

## Known wardrobe defects (verified visually 2026-11-18)
- Hair 9 "Lagoon Side Braid": the braid is cut by a hard vertical edge and disappears behind every dress below the shoulder. Cause: all hairstyles share one fixed `hairFront` clip (`ensureWardrobeCatalog()` in src/app.js), which ends at y=154; this braid hangs in front of the shoulder. Needs a per-hairstyle front mask.
- Fashion tab item icons are small full-body thumbnails.
- Fresh save shows Reina with short auburn hair (hair 1), not silver hair as the handover describes.
- Still to inspect: mounted (cat-rider) pose, combat sprites, wings on Reina, weapons in hand.
