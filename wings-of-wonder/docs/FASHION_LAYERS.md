# Reina wardrobe registration

`src/wardrobe-engine.js` owns composition. `ensureWardrobeCatalog()` in `app.js` registers art as data. The body, including head and neck, is never replaced by an outfit.

Canonical coordinates: 500 × 800. Body image: [0, 40, 500, 750]. Scale the entire assembled canvas only. Do not auto-crop layers or independently resize heads. Native 500 × 800 transparent layer PNGs can use the default rectangle. Existing atlases use explicit registered rectangles and clip paths.

Slots, back to front:
`wingsBack`, `hairBack`, `garmentBack`, `body`, `boots`, `garmentFront`, `sleeves`, `handFront`, `weapon`, `gripFingers`, `hairFront`, `accessoriesFront`.

A dress may provide rear collar, front garment, sleeves and boots separately. Rear collars sit behind the original neck. Coverage masks hide only the body underneath opaque clothing; never clear the whole composite, which would erase hair or wings. Hand masks exclude baked skin from garments and restore the original hand. Hair has back and front sections. Weapons have a registered grip and fingers above the handle. Wings share the same coordinates as the standing body.

New art must be authored over the fixed base pose. Reject mismatched anatomy instead of stretching the body. Registry rejects item-owned body layers and wrong frame dimensions. The technical base is not a wardrobe choice or a loading placeholder.

Rendering loads all required layers before returning a complete portrait. Preview selection waits for decoding and ignores stale asynchronous requests. A transparent placeholder is used during initial loading. Dresses hide wings; the Wings category shows the chosen wings on Reina.

Existing art is reused through geometric masks, not represented as newly redrawn artwork. Legacy mounted portraits are a separate pose and still require their own compatible artwork; standing coordinates cannot be pasted onto a seated body.

Validation: `node scripts/test.mjs`, rendered wardrobe checks, then `node scripts/build.mjs --hosted`. Inspect collars, shoulder joins, hands, hair tips and wing roots in actual composites before adding an item.
