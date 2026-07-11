# Mobile Background — Generation Spec

The mobile layout now runs WITHOUT a background painting (plain gradient
placeholder). This file is the spec for generating the new one. The game's
mobile geometry in `src/ui/canvas.js` (initStage, mobile branch) is the source
of truth — the painting must be composed around these rects, not the other way
around.

## Canvas

- **941 × 1672 px, portrait** (same design space as before — nothing else in
  the code changes if this is respected).
- Style: match the desktop painting (`Background_TDF` art): painterly farm
  scene — barn, windmill, fields, warm daylight.

## Zones (all coordinates in the 941×1672 design space)

| Zone | Rect / point | Notes |
|---|---|---|
| Title sign | y ≈ 120–380, centered | "The Drunk Farmer" sign like the desktop art. NOTE: the horizontal Buzz bar (DOM) sits at y ≈ 400–465, centered, between the title and the frame — keep that band calm. |
| **Board opening** | **x 24–918, y 485–1205** (894×720) | Near-FULL width, Le Cowboy proportions (cells 149×120). DARK, even chalkboard interior — the canvas draws the cell wells and grid lines itself. No painted cell lines, no vignetting hotspots. |
| Wooden frame | ~20–35 px band around the opening | Painted frame with the rustic rope/plank look. The frame's INNER edge must sit exactly on the opening rect above. NOTE: only ~24 px of stage remain outside the frame on each side. |
| **Farmer ground spot** | feet point ≈ **(770, 1547)**, body ≈ x 618–922, y 1215–1547 | The farmer (canvas-drawn) stands BIG and GROUNDED bottom-right, hat kissing the frame's bottom edge (never the cells), Le Cowboy-style. Paint the ground plane at his feet and optionally scene depth BEHIND him — fence, cart, pumpkins, porch. Nothing in front of him. |
| Buzz-bar band | x ≈ 210–730, y ≈ 400–465 | The horizontal Buzz bar (DOM) sits here, centered ABOVE the frame's top edge. Keep the band calm/dark-ish. |
| Ground strip | y ≈ 1205–1672 | Dirt road / grass. The DOM controls live here: spin cluster at y ≈ 1360–1520 center (they may overlap the farmer's legs as translucent circles — fine, Le Cowboy does the same), stats text line at y ≈ 1560–1660. Avoid high-contrast detail in that band so white text stays readable. |

## Why the farmer is bottom-right (and how shooting works)

Le Cowboy pattern: the character is big and anchored to the ground, which
reads right 100% of the time. His rifle does NOT track the target cell — the
upward swing is capped at ~40° (`farmerActor.js` MAX_UP_ELEVATION), so every
shot is a fixed diagonal up-left pose; the crosshair + explosion FX on the
chicken's cell sell the hit, exactly like Hacksaw's cowboy firing "forward".

## After generating

1. Drop the image into `src/assets/` and wire it in `assets.js` as the mobile
   background; set it in `initStage` (mobile branch) where the placeholder
   gradient is now.
2. Measure the actual painted opening with `test-results/measure-bg.mjs`.
3. Fine-tune `GRID_RECT` (and `FARMER_RECT` if the platform moved) in
   `src/ui/canvas.js` to the measured values — cells must stay square:
   `GRID_RECT.w === GRID_RECT.h`.
4. Verify with `test-results/mobile-shots.mjs` + a 100-spin run of
   `test-results/mobile-1000-spins.mjs`.
