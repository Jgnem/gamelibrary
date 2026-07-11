// Drunk Farmer — symbol & tile rendering (bitmap icons on cached sprites).
//
// Each symbol tile is rasterized ONCE into a cached offscreen sprite — the
// delivered icon art (via assets.js, background-stripped) fitted square into
// the cell box with a baked drop shadow — and then blitted with drawImage
// during animation. Falls back to the old text glyph when an icon is missing
// (e.g. the event-only "hen"). Also exports the empty-cell "well" background
// (rectangular: CELL_W × CELL_H) and the gold win outline.
//
// No math imports. Drawing primitives only.

import { getSymbolSprite } from './assets.js';
import { CELL_W, CELL_H } from './canvas.js';

// --- families: gradient (top→bottom) + text color ---
const PALETTE = {
  gray: { top: '#b89468', bottom: '#777d84', text: '#23262a' },
  amber: { top: '#ffcf5c', bottom: '#cf7d05', text: '#4d3100' },
  green: { top: '#74dd80', bottom: '#239a33', text: '#08340f' },
  purple: { top: '#bd66e0', bottom: '#67248c', text: '#ffffff' },
  orange: { top: '#ffb759', bottom: '#dd6300', text: '#4f2400' },
};

const SYMBOLS = {
  10: { color: 'gray', label: '10' },
  J: { color: 'gray', label: 'J' },
  Q: { color: 'gray', label: 'Q' },
  K: { color: 'gray', label: 'K' },
  A: { color: 'gray', label: 'A' },
  hay: { color: 'amber', label: 'Hay' },
  cas: { color: 'amber', label: 'Cas' },
  pit: { color: 'green', label: 'Pit' },
  dog: { color: 'green', label: 'Dog' },
  // The base-game wild is now a CHICKEN (shot mechanic).
  wld: { color: 'purple', label: 'CHICK' },
  hen: { color: 'orange', label: 'Hen' },
};

const ALIASES = { haystack: 'hay', cassava: 'cas', pitchfork: 'pit', dog: 'dog', wild: 'wld', chicken: 'wld', hen: 'hen' };

function resolve(symbol) {
  const key = String(symbol);
  if (SYMBOLS[key]) return SYMBOLS[key];
  const alias = ALIASES[key.toLowerCase()];
  if (alias && SYMBOLS[alias]) return SYMBOLS[alias];
  return { color: 'gray', label: key };
}

// --- offscreen canvas + dpr helpers ---
// Effective device px per design px used to rasterize cached sprites. canvas.js
// sets this to (contain scale × devicePixelRatio) on every resize, so sprites are
// baked at the real on-screen resolution and stay crisp when the grid is scaled
// up. Left null until set → falls back to plain devicePixelRatio (tests/standalone).
let renderScale = null;

/** @param {number} s - effective device px per design px (scale × dpr). */
export function setRenderScale(s) {
  // Round to 0.01 so continuous resizing reuses cached sprites instead of
  // rebuilding one per sub-pixel scale.
  renderScale = Math.max(0.1, Math.round(s * 100) / 100);
}

function getDpr() {
  if (renderScale != null) return renderScale;
  return (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
}

function makeCanvas(w, h) {
  if (typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  throw new Error('No canvas factory available.');
}

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

// --- sprite caches (keyed by size+dpr / symbol) ---
const tileCache = new Map();
const bgCache = new Map();

/**
 * Build a transparent symbol sprite. Preferred path: the delivered icon art
 * (assets.js), fitted square into the cell box with a baked drop shadow.
 * Fallback (icon missing/not yet loaded): the old text glyph in the family
 * colour. Sprite geometry (margin/sprite/centre) is shared by both paths so
 * drawSymbol's placement and the isWild/sticky markers always line up.
 */
function buildTile(symbol, cellSize, dpr) {
  // The sprite frame is square (sized by the LARGER cell axis) so squash
  // animations keep working, but icons are fitted to the REAL cell rect
  // (CELL_W × CELL_H) with a small pad — tiles fill the cell instead of
  // floating in a square sized by the shorter axis.
  const frame = Math.max(CELL_W, CELL_H);
  const margin = Math.ceil(frame * 0.2); // kept: preserves sprite geometry + shadow room
  const sprite = frame + margin * 2;
  const canvas = makeCanvas(Math.round(sprite * dpr), Math.round(sprite * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const def = resolve(symbol);
  const fam = PALETTE[def.color] || PALETTE.gray;

  const boxW = CELL_W * 0.94;
  const boxH = CELL_H * 0.94;
  const size = Math.min(boxW, boxH);
  const cx = margin + frame / 2;
  const cy = margin + frame / 2;

  // --- bitmap icon path ---
  const key = String(symbol);
  const icon = getSymbolSprite(SYMBOLS[key] ? key : ALIASES[key.toLowerCase()] || key);
  if (icon) {
    // The low-value card ranks (10/J/Q/K/A) share the same 512px frame and
    // calibrated visible height, so narrow letters never get enlarged relative
    // to wide ones. Keep their authored frame intact when fitting the cell.
    const isRank = def.color === 'gray';
    // The pitchfork is intentionally long and narrow, so the same square-frame
    // fit makes it read much smaller than the broader farm symbols. Give only
    // this asset extra scale while keeping it inside the tile's shadow margin.
    const symbolScale = key === 'pit' ? 1.18 : isRank ? 0.8 : 1;
    const fit = Math.min(boxW / icon.w, boxH / icon.h) * symbolScale;
    // Rectangular cells: let the non-limiting axis stretch up to 10% toward
    // the cell edge so tiles cover the board without visibly distorting.
    const STRETCH = 1.1;
    const dw = Math.min(icon.w * fit * STRETCH, boxW);
    const dh = Math.min(icon.h * fit * STRETCH, boxH);
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.55)';
    ctx.shadowBlur = size * 0.08;
    ctx.shadowOffsetY = size * 0.03;
    ctx.drawImage(icon.canvas, cx - dw / 2, cy - dh / 2, dw, dh);
    ctx.restore();
    return { canvas, sprite, margin };
  }

  // --- text glyph fallback ---
  // Kept deliberately small and muted: these are the low-value card ranks
  // (10/J/Q/K/A) with no bitmap icon yet — they should read as filler, not
  // compete visually with the illustrated symbols (hay, wild, dog, ...). The
  // outline/shadow scale off the FONT size (not the full cell `size`), so
  // shrinking the font actually shrinks the glyph's visual weight too.
  const fontSize = size * 0.24;
  ctx.font = `700 ${Math.round(fontSize)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // Clamp glyph width to the cell so multi-char labels (WILD, Hay, Dog) condense
  // to fit instead of bleeding into neighbours; single letters stay full size.
  const maxWidth = size * 0.94;

  // Faint outline + soft drop shadow → just enough definition to read, no pop.
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = fontSize * 0.12;
  ctx.shadowOffsetY = fontSize * 0.06;
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(1, fontSize * 0.06);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeText(def.label, cx, cy, maxWidth);
  ctx.restore();

  ctx.fillStyle = fam.top;
  ctx.fillText(def.label, cx, cy, maxWidth);

  return { canvas, sprite, margin };
}

function getTile(symbol, cellSize) {
  const dpr = getDpr();
  const key = `${symbol}|${cellSize}|${dpr}`;
  let tile = tileCache.get(key);
  if (!tile) {
    tile = buildTile(symbol, cellSize, dpr);
    tileCache.set(key, tile);
  }
  return tile;
}

/**
 * Build one cell of the board background. Unlike a rounded per-cell "well", this
 * fills the cell edge-to-edge with a flat panel colour so that when every cell is
 * drawn side by side the board reads as ONE continuous surface (Hacksaw style) —
 * a tile then falls over an unbroken panel instead of over gaps between boxes.
 * Thin dividers are drawn only on the right & bottom edge: each internal grid
 * line is then painted once (by the cell to its left/above), so lines stay
 * single-weight and land exactly on the cell boundary without the sprite needing
 * to know its row/column.
 */
function buildCellBg(dpr) {
  const canvas = makeCanvas(Math.round(CELL_W * dpr), Math.round(CELL_H * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // Flat panel fill, edge to edge (no pad, no rounding → no seams when tiled).
  const grad = ctx.createLinearGradient(0, 0, 0, CELL_H);
  grad.addColorStop(0, 'rgba(12,20,15,0.9)');
  grad.addColorStop(1, 'rgba(8,14,10,0.9)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CELL_W, CELL_H);

  // Subtle engraved dividers on the right & bottom edges. Half-pixel snap keeps
  // the line crisp; the neighbouring cell shares the same boundary so no doubling.
  const lw = Math.max(1, Math.round(CELL_H * 0.012));
  const edge = lw / 2;
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.moveTo(CELL_W - edge, 0);
  ctx.lineTo(CELL_W - edge, CELL_H);
  ctx.moveTo(0, CELL_H - edge);
  ctx.lineTo(CELL_W, CELL_H - edge);
  ctx.stroke();

  return canvas;
}

function getCellBg() {
  const dpr = getDpr();
  const key = `${dpr}`;
  let bg = bgCache.get(key);
  if (!bg) {
    bg = buildCellBg(dpr);
    bgCache.set(key, bg);
  }
  return bg;
}

/**
 * Draw a symbol tile centered at (x, y).
 * @param {object} [opts] - scaleX, scaleY (squash), alpha, isWild, isSticky.
 */
export function drawSymbol(ctx, symbol, x, y, cellSize, opts = {}) {
  if (symbol == null) return;
  const { scaleX = 1, scaleY = 1, alpha = 1, removing = false, isWild = false, isSticky = false } = opts;

  const tile = getTile(symbol, cellSize);
  const dw = tile.sprite * scaleX;
  const dh = tile.sprite * scaleY;

  ctx.save();
  if (alpha < 1 || removing) ctx.globalAlpha = (removing ? 0.4 : 1) * alpha;
  ctx.drawImage(tile.canvas, x - dw / 2, y - dh / 2, dw, dh);
  ctx.restore();

  // Optional markers (cheap, drawn live).
  const pad = cellSize * 0.08;
  const size = cellSize - pad * 2;
  if (isWild) {
    const r = size * 0.12;
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + size / 2 - r, y - size / 2 + r, r, 0, Math.PI * 2);
    ctx.fillStyle = PALETTE.purple.bottom;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.stroke();
    ctx.restore();
  }
  if (isSticky) {
    drawGoldOutline(ctx, x, y, cellSize, 1, true);
  }
}

/** Draw an empty cell well centered at (x, y). Rectangular: CELL_W × CELL_H. */
export function drawCellBackground(ctx, x, y) {
  const left = x - CELL_W / 2;
  const top = y - CELL_H / 2;
  const right = left + CELL_W;
  const bottom = top + CELL_H;

  // Draw an opaque brown-green cell body. Per-cell gradients/alpha create
  // repeated horizontal bands inside the 6x6; keep the fill flat and let the
  // grid lines define the board.
  ctx.fillStyle = '#1a1209';
  ctx.fillRect(left - 0.5, top - 0.5, CELL_W + 1, CELL_H + 1);

  const lw = Math.max(1, Math.round(CELL_H * 0.012));
  const snap = lw % 2 === 1 ? 0.5 : 0;
  ctx.save();
  ctx.lineWidth = lw;
  ctx.strokeStyle = 'rgba(105,63,28,0.72)';
  ctx.beginPath();
  ctx.moveTo(Math.round(right) + snap, top);
  ctx.lineTo(Math.round(right) + snap, bottom);
  ctx.moveTo(left, Math.round(bottom) + snap);
  ctx.lineTo(right, Math.round(bottom) + snap);
  ctx.stroke();

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(235,166,78,0.16)';
  ctx.beginPath();
  ctx.moveTo(Math.round(left) + snap, top);
  ctx.lineTo(Math.round(left) + snap, bottom);
  ctx.moveTo(left, Math.round(top) + snap);
  ctx.lineTo(right, Math.round(top) + snap);
  ctx.stroke();
  ctx.restore();
}

/** Draw a gold (optionally dashed) win/sticky outline around the tile. */
export function drawGoldOutline(ctx, x, y, cellSize, alpha = 1, dashed = false) {
  const pad = cellSize * 0.06;
  const size = cellSize - pad * 2;
  const left = x - size / 2;
  const top = y - size / 2;
  const radius = size * 0.2;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.lineWidth = Math.max(3, cellSize * 0.07);
  ctx.strokeStyle = '#ffd700';
  ctx.shadowColor = 'rgba(255,215,0,0.85)';
  ctx.shadowBlur = cellSize * 0.2;
  if (dashed) ctx.setLineDash([cellSize * 0.12, cellSize * 0.08]);
  roundRectPath(ctx, left, top, size, size, radius);
  ctx.stroke();
  ctx.restore();
}
