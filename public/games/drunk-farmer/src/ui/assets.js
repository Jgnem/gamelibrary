// Drunk Farmer — bitmap asset loading & cleanup.
//
// The delivered art comes on solid backgrounds (green-screen for most symbol
// icons, near-white for the bottles/haystack/wild). This module loads each
// image once, removes the backing colour with a flood fill FROM THE BORDERS
// (so interior whites/greens — bottle highlights, the green glass — survive),
// trims to the opaque bounding box, and caches the result as an offscreen
// canvas ready for drawImage.
//
// Everything is processed at a capped working resolution (MAX_DIM) — plenty for
// ~103 design-px cells even at 3× devicePixelRatio, and it keeps the one-time
// flood fill cheap.
//
// UI-only: no math imports. Consumers: symbols.js and bottleSpawnFx.

const MAX_DIM = 512;

// Symbol id → asset URL. Resolved through Vite so dev and build both work.
const SYMBOL_URLS = {
  10: new URL('../assets/sym-10.png', import.meta.url).href,
  J: new URL('../assets/sym-j.png', import.meta.url).href,
  Q: new URL('../assets/sym-q.png', import.meta.url).href,
  K: new URL('../assets/sym-k.png', import.meta.url).href,
  A: new URL('../assets/sym-a.png', import.meta.url).href,
  // Versioned filename prevents browsers from reusing the retired haystack
  // image when this symbol is replaced with the TDF_haybale artwork.
  hay: new URL('../assets/sym-haybale.png', import.meta.url).href,
  cas: new URL('../assets/sym-cas.png', import.meta.url).href,
  pit: new URL('../assets/sym-pit.png', import.meta.url).href,
  dog: new URL('../assets/sym-dog.png', import.meta.url).href,
  wld: new URL('../assets/sym-wld.png', import.meta.url).href,
};

const BOTTLE_TILE_URL = new URL('../assets/bottle-tile.png', import.meta.url).href;
export const BACKGROUND_DESKTOP_URL = new URL('../assets/background-desktop-muted.png', import.meta.url).href;
export const BACKGROUND_MOBILE_FINAL_URL = new URL('../assets/background-mobile-final.png', import.meta.url).href;

// ---------------------------------------------------------------------------
// Background removal
// ---------------------------------------------------------------------------
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load asset: ${url}`));
    img.src = url;
  });
}

/**
 * Draw `img` capped to MAX_DIM, flood-fill transparent from the borders
 * (removing everything close to the sampled corner colour), then trim.
 * @returns {{canvas: HTMLCanvasElement, w: number, h: number}}
 */
function processImage(img) {
  const scale = Math.min(1, MAX_DIM / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;

  // Already-transparent art (the rank SVGs) is authored on a uniform frame:
  // every glyph is pre-centered and pre-scaled inside the same canvas, so the
  // frame IS the size calibration. Skip keying AND the bounding-box trim —
  // trimming would refit each glyph to its own extents and break the shared
  // scale (a narrow J would render bigger than a wide 10).
  const cornerAlphas = [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]].map(
    ([cx, cy]) => d[(cy * w + cx) * 4 + 3]
  );
  if (cornerAlphas.every((a) => a < 8)) return { canvas, w, h };

  // Background colour: average the four corners (they're all backing colour).
  let br = 0;
  let bg = 0;
  let bb = 0;
  for (const [cx, cy] of [[1, 1], [w - 2, 1], [1, h - 2], [w - 2, h - 2]]) {
    const i = (cy * w + cx) * 4;
    br += d[i];
    bg += d[i + 1];
    bb += d[i + 2];
  }
  br /= 4;
  bg /= 4;
  bb /= 4;
  const isGreenScreen = bg > 140 && bg > br * 1.6 && bg > bb * 1.6;
  // Green screens are saturated → generous tolerance kills the fringe. White
  // backings sit close to in-art highlights → tighter tolerance + border fill
  // keeps interior whites safe.
  const tol2 = (isGreenScreen ? 150 : 70) ** 2;

  const dist2At = (i) => {
    const dr = d[i] - br;
    const dg = d[i + 1] - bg;
    const db = d[i + 2] - bb;
    return dr * dr + dg * dg + db * db;
  };

  const removed = new Uint8Array(w * h);
  if (isGreenScreen) {
    // Chroma key is far from any in-art colour → remove it GLOBALLY, which
    // also clears enclosed holes (the counter of a "0", the loop of a "Q")
    // that a border flood fill can never reach.
    for (let p = 0; p < w * h; p += 1) {
      if (dist2At(p * 4) < tol2) removed[p] = 1;
    }
  } else {
    // Near-white backing sits close to in-art highlights → BFS flood fill
    // from every border pixel only, so interior whites survive.
    const queue = new Int32Array(w * h);
    let qHead = 0;
    let qTail = 0;
    const push = (p) => {
      if (!removed[p] && dist2At(p * 4) < tol2) {
        removed[p] = 1;
        queue[qTail++] = p;
      }
    };
    for (let x = 0; x < w; x += 1) {
      push(x);
      push((h - 1) * w + x);
    }
    for (let y = 0; y < h; y += 1) {
      push(y * w);
      push(y * w + (w - 1));
    }
    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % w;
      if (x > 0) push(p - 1);
      if (x < w - 1) push(p + 1);
      if (p >= w) push(p - w);
      if (p < w * (h - 1)) push(p + w);
    }
  }

  // Apply: removed → alpha 0. Surviving pixels bordering a removed one get a
  // soft half-alpha edge (and a green de-spill when chroma-keyed).
  for (let p = 0; p < w * h; p += 1) {
    const i = p * 4;
    if (removed[p]) {
      d[i + 3] = 0;
      continue;
    }
    const x = p % w;
    const nearEdge =
      (x > 0 && removed[p - 1]) ||
      (x < w - 1 && removed[p + 1]) ||
      (p >= w && removed[p - w]) ||
      (p < w * (h - 1) && removed[p + w]);
    if (nearEdge) {
      d[i + 3] = Math.min(d[i + 3], 150);
      if (isGreenScreen) {
        const cap = Math.max(d[i], d[i + 2]) + 24;
        if (d[i + 1] > cap) d[i + 1] = cap;
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);

  // Trim to the opaque bounding box so sprites fill their cell boxes nicely.
  let minX = w;
  let minY = h;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (d[(y * w + x) * 4 + 3] > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return { canvas, w, h }; // nothing survived — keep as-is

  const tw = maxX - minX + 1;
  const th = maxY - minY + 1;
  const trimmed = document.createElement('canvas');
  trimmed.width = tw;
  trimmed.height = th;
  trimmed.getContext('2d').drawImage(canvas, minX, minY, tw, th, 0, 0, tw, th);
  return { canvas: trimmed, w: tw, h: th };
}

/** Grayscale + dim a processed sprite (the "empty bottle" look). */
function desaturate(sprite) {
  const { canvas, w, h } = sprite;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const g = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) * 0.72;
    d[i] = g;
    d[i + 1] = g;
    d[i + 2] = g;
  }
  ctx.putImageData(imageData, 0, 0);
  return { canvas: out, w, h };
}

/**
 * Tint a processed sprite toward an RGB colour (bottle TYPE variants: the one
 * delivered bottle art becomes beer/wine/moonshine by hue). Blends each pixel's
 * grayscale luminance with the tint, keeping highlights so the glass still
 * reads as glass.
 */
function tint(sprite, [tr, tg, tb], strength = 0.55) {
  const { canvas, w, h } = sprite;
  const out = document.createElement('canvas');
  out.width = w;
  out.height = h;
  const ctx = out.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(canvas, 0, 0);
  const imageData = ctx.getImageData(0, 0, w, h);
  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const lum = (d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11) / 255;
    d[i] = d[i] * (1 - strength) + tr * lum * strength;
    d[i + 1] = d[i + 1] * (1 - strength) + tg * lum * strength;
    d[i + 2] = d[i + 2] * (1 - strength) + tb * lum * strength;
  }
  ctx.putImageData(imageData, 0, 0);
  return { canvas: out, w, h };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
const sprites = {
  symbols: new Map(), // id → sprite
  bottleTile: null, // green XXX bottle (board, closed)
  bottleTileEmpty: null, // desaturated variant (legacy "empty" look)
  bottleTileBeer: null, // amber tint (revealed BEER)
  bottleTileWine: null, // deep red tint (revealed WINE)
  bottleTileMoonshine: null, // pale gold tint (revealed MOONSHINE)
  bottleTileJug: null, // copper tint (revealed JUG — half the meter)
  bottleTileBarrel: null, // ember tint (revealed BARREL — the whole meter)
};

/** Load + process every bitmap asset. Safe to call once at startup. */
export async function loadAssets() {
  const symbolEntries = Object.entries(SYMBOL_URLS);
  const [symbolImgs, tileImg] = await Promise.all([
    Promise.all(symbolEntries.map(([, url]) => loadImage(url))),
    loadImage(BOTTLE_TILE_URL),
  ]);

  symbolEntries.forEach(([id], i) => {
    sprites.symbols.set(String(id), processImage(symbolImgs[i]));
  });
  sprites.bottleTile = processImage(tileImg);
  sprites.bottleTileEmpty = desaturate(sprites.bottleTile);
  sprites.bottleTileBeer = tint(sprites.bottleTile, [255, 176, 46]); // amber
  sprites.bottleTileWine = tint(sprites.bottleTile, [168, 32, 72]); // burgundy
  sprites.bottleTileMoonshine = tint(sprites.bottleTile, [255, 244, 200], 0.7); // pale hot gold
  sprites.bottleTileJug = tint(sprites.bottleTile, [214, 128, 36], 0.65); // burnt copper
  sprites.bottleTileBarrel = tint(sprites.bottleTile, [255, 96, 24], 0.75); // ember — instant trigger
}

/** @returns {{canvas:HTMLCanvasElement, w:number, h:number}|null} */
export function getSymbolSprite(id) {
  return sprites.symbols.get(String(id)) || null;
}

/** @param {'closed'|'full'|'empty'|'beer'|'wine'|'moonshine'|'jug'|'barrel'} variant */
export function getBottleTileSprite(variant = 'closed') {
  if (variant === 'empty') return sprites.bottleTileEmpty;
  if (variant === 'beer') return sprites.bottleTileBeer;
  if (variant === 'wine') return sprites.bottleTileWine;
  if (variant === 'moonshine') return sprites.bottleTileMoonshine;
  if (variant === 'jug') return sprites.bottleTileJug;
  if (variant === 'barrel') return sprites.bottleTileBarrel;
  return sprites.bottleTile;
}

/**
 * Draw a sprite centered at (x, y), scaled to fit a boxW×boxH box while
 * preserving aspect ratio.
 * @param {object} [opts] - alpha, scaleX, scaleY, shadow {color, blur, offsetY}.
 */
export function drawSprite(ctx, sprite, x, y, boxW, boxH, opts = {}) {
  if (!sprite) return;
  const { alpha = 1, scaleX = 1, scaleY = 1, shadow = null } = opts;
  const fit = Math.min(boxW / sprite.w, boxH / sprite.h);
  const dw = sprite.w * fit * scaleX;
  const dh = sprite.h * fit * scaleY;
  ctx.save();
  ctx.globalAlpha = alpha;
  if (shadow) {
    ctx.shadowColor = shadow.color;
    ctx.shadowBlur = shadow.blur;
    ctx.shadowOffsetY = shadow.offsetY || 0;
  }
  ctx.drawImage(sprite.canvas, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();
}
