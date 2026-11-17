# Reina registered wardrobe

The body is immutable `base-v2.png`, including the face and both hands. It is drawn at (0,40) in a 500×800 frame after scaling to 500×750. Never replace or independently move the head.

`a.png` and `b.png` are the approved grove and amethyst costume sources. Nine named PNGs are clothes-only overlays generated using the intact body template as the position reference and each prior atelier outfit as the costume reference. No facial/hair/skin recoloring is used. Prompts requested the same 1024×1536 canvas, fixed pose, transparent clothing and footwear only, clean fantasy cartoon rendering, no head/hands/hair/weapons/wings. Designs preserve the existing courier, apothecary, countess, dancer, winter, moth queen, captain, kimono and artisan identities.

Run `python scripts/build-fitting-control.py` to prepare registered layers and garment thumbnails. Hair contours are authored individually and positioned by fixed eye landmarks; protected face pixels are removed from hair alpha. The original hand is composited above each garment. Fully covered legs are occluded beneath closed garments, keeping the master body source intact and preventing skin protruding beyond trousers or closed shoes. Matching coverage constants are in `composeRegisteredReina`.

The runtime catalog is `fittingDresses` (ten purchased designs plus two base choices) and `fittingHairs` (ten styles). Purchased IDs and ownership are preserved. Existing moonblossom ownership aliases amethyst. A selected layer is decoded before replacing the visible preview. Sequence tokens prevent a slow response from changing a newer selection or another tab.

Check `node scripts/test.mjs` for all 100 purchased-dress/hair combinations and async selection cancellation. The Python builder checks fixed facial landmarks across all 110 dressed combinations. Keep every sprite within the shared canvas, and inspect the builder's contact sheets after art changes.

Old complete atelier portraits remain in source for reference, but are excluded from the hosted bundle. Only the registered layers are used for standing Reina. Mounted and animated combat renderers are outside this wardrobe migration.
