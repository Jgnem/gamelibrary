// Cosmetic bottle-on-grid effect.
//
// This module is intentionally UI-only: it never changes the math grid. The
// bottle (the delivered "Flaska slottile" art) is visually INSERTED into its
// column, pushing the tiles above it up one display row so the math grid's
// top-row symbol waits hidden above the board edge. When the bottle leaves the
// board the column collapses down one cell and that hidden top symbol drops
// into row 0 — the final picture equals the math grid exactly, so the tumble
// can then resolve normally.
//
// Display mapping for the bottle column (bottle at display row b):
//   display rows 0..b-1  → math rows 1..b   (shifted up one)
//   display row  b       → the bottle tile  (closed, then revealed)
//   display rows b+1..5  → math rows b+1..5 (untouched)
//   math row 0           → hidden above the board until the collapse
//
// The staged sequence for ONE spawned bottle:
//   STATE 2  the CLOSED bottle falls in as a tile of the entry rope (exact
//            same physics — see buildDropInOverrides + dropIn.js), then holds.
//   STATE 3  after the whole board settles the bottle reveals its TYPE (every
//            bottle contains alcohol — no empties): BEER (amber), WINE
//            (burgundy) or MOONSHINE (pale hot gold), each with its own glow.
//   STATE 4  the bottle flies to the farmer (he drinks it — the meter rises by
//            the type's fill); the column collapses as it leaves and the
//            hidden top symbol enters from above.
// animateTumble() is only started by the caller once this has fully resolved.

import { gridToPixel, boardToStage, mountStageCanvas, BOARD_W, BOARD_H, STAGE_W, STAGE_H } from './canvas.js';
import { drawCellBackground, drawSymbol } from './symbols.js';
import { animate, easeInOutQuad, easeOutCubic, makeFaller, sampleSymbol, CASCADE_TIMING } from './fx.js';
import { getBottleTileSprite, drawSprite } from './assets.js';

const CLOSED_HOLD_MS = 160; // STATE 2->3 hold: closed bottle sits before revealing.
const REVEAL_MS = 200; // closed pops/fades into full-or-empty.
const REVEAL_HOLD_MS = 140; // STATE 3 hold: revealed content is readable.
const FLY_MS = 400; // full bottle flies to the meter (column collapses with it).
const DISCARD_MS = 520; // empty bottle: fade away + collapse.
const COLLAPSE_DELAY_MS = 90; // the bottle starts fading first, then the column drops.

const GLOW = 'rgba(255,207,92,0.95)';
// Per-type reveal glow — the colour IS the announcement (beer amber, wine
// burgundy, moonshine near-white hot, jug burnt copper, barrel full ember —
// the instant-trigger jackpot bottle).
const TYPE_GLOWS = {
  beer: 'rgba(255,176,46,0.95)',
  wine: 'rgba(214,60,110,0.95)',
  moonshine: 'rgba(255,246,214,1)',
  jug: 'rgba(230,140,40,1)',
  barrel: 'rgba(255,96,24,1)',
};

function cellKey(cell) {
  return `${cell.row},${cell.col}`;
}

/** Draw the bottle tile sprite centered at (x, y) in a cell-sized box. */
function drawBottle(ctx, x, y, cellSize, opts = {}) {
  const { variant = 'closed', alpha = 1, scale = 1, sx = 1, sy = 1, glow = 0 } = opts;
  const box = cellSize * 0.9 * scale;
  drawSprite(ctx, getBottleTileSprite(variant), x, y, box, box, {
    alpha,
    scaleX: sx,
    scaleY: sy,
    shadow: glow > 0
      ? { color: TYPE_GLOWS[variant] || GLOW, blur: cellSize * (0.1 + glow * 0.22) }
      : { color: 'rgba(0,0,0,0.5)', blur: cellSize * 0.08, offsetY: cellSize * 0.03 },
  });
}

/**
 * The symbol shown at display cell (r, c) while the bottle occupies its column:
 * rows above the bottle show the math row one below their own index (shifted
 * up), the bottle cell itself shows nothing (the bottle is drawn separately),
 * and everything else shows the math grid as-is.
 */
function displaySymbolAt(grid, cell, r, c) {
  if (c !== cell.col || r > cell.row) return grid[r][c];
  if (r === cell.row) return null; // the bottle sits here
  return grid[r + 1][c]; // shifted up one: math row r+1 shows at display row r
}

/** Draw the shifted display board; the bottle cell is left to the caller. */
function drawDisplayBoard(ctx, grid, cellSize, cell, underlay) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c);
      drawCellBackground(ctx, x, y);
    }
  }
  if (underlay) underlay(ctx);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const symbol = displaySymbolAt(grid, cell, r, c);
      if (symbol == null) continue;
      const { x, y } = gridToPixel(r, c);
      drawSymbol(ctx, symbol, x, y, cellSize, {});
    }
  }
}

/** Draw the true math board (used once the bottle sequence has resolved). */
function drawBoard(ctx, grid, cellSize, underlay) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c);
      drawCellBackground(ctx, x, y);
    }
  }
  if (underlay) underlay(ctx);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c);
      drawSymbol(ctx, grid[r][c], x, y, cellSize, {});
    }
  }
}

export function pickBottleCell(grid) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  return {
    row: Math.floor(Math.random() * rows),
    col: Math.floor(Math.random() * cols),
  };
}

/**
 * Cell overrides for animateDropIn so the bottle column enters pre-shifted:
 * rows above the bottle carry the math symbol from one row below (the shift),
 * and the bottle cell rides the rope as a CLOSED bottle tile with the exact
 * same physics (gravity, overshoot, bounce, landing squash) as any symbol.
 */
export function buildDropInOverrides(grid, cell) {
  const overrides = new Map();
  for (let r = 0; r < cell.row; r += 1) {
    overrides.set(`${r},${cell.col}`, { symbol: grid[r + 1][cell.col] });
  }
  overrides.set(cellKey(cell), {
    draw: (ctx, x, y, cellSize, st = {}) =>
      drawBottle(ctx, x, y, cellSize, { variant: 'closed', sx: st.sx, sy: st.sy }),
  });
  return overrides;
}

/**
 * Transparent full-stage canvas used for effects that must leave the board
 * rect. The full bottle's meter flight would otherwise be clipped by the grid
 * canvas as soon as it travels above the board opening.
 */
export function initBottleFlyLayer() {
  const layer = mountStageCanvas({ x: 0, y: 0, w: STAGE_W, h: STAGE_H }, 'bottle-fly-layer');
  layer.canvas.style.pointerEvents = 'none';
  layer.canvas.style.zIndex = '20';
  return layer;
}

// ---------------------------------------------------------------------------
// Shared pieces
// ---------------------------------------------------------------------------
/** Collapse rope fallers: display rows 0..b drop one cell onto their math rows. */
function buildCollapse(grid, cell, cellSize, delayMs) {
  const collapse = [];
  const cellH = BOARD_H / grid.length;
  for (let r = 0; r <= cell.row; r += 1) {
    const p = gridToPixel(r, cell.col);
    collapse.push(makeFaller(grid[r][cell.col], p.x, p.y - cellH, p.y, delayMs, cellSize, CASCADE_TIMING));
  }
  return collapse;
}

/** Static board part: everything except the collapsing rope's column rows. */
function drawStaticDuringCollapse(ctx, grid, cellSize, cell, underlay) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c);
      drawCellBackground(ctx, x, y);
    }
  }
  if (underlay) underlay(ctx);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      if (c === cell.col && r <= cell.row) continue; // the collapsing rope
      const { x, y } = gridToPixel(r, c);
      drawSymbol(ctx, grid[r][c], x, y, cellSize, {});
    }
  }
}

function drawCollapse(ctx, collapse, elapsedMs, cellSize) {
  for (const f of collapse) {
    const st = sampleSymbol(elapsedMs - f.delay, f, CASCADE_TIMING);
    drawSymbol(ctx, f.symbol, f.x, st.y, cellSize, { scaleX: st.sx, scaleY: st.sy });
  }
}

// ---------------------------------------------------------------------------
// STATE 2 + 3: hold, then reveal in place
// ---------------------------------------------------------------------------
async function playReveal(ctx, grid, cellSize, cell, variant, underlay) {
  const start = gridToPixel(cell.row, cell.col);
  // Rarer drink → bigger reveal pop. The barrel is the instant-trigger
  // jackpot bottle and pops hardest.
  const popSize =
    variant === 'barrel' ? 0.34 : variant === 'jug' ? 0.28 : variant === 'moonshine' ? 0.22 : 0.14;

  const clearBoard = () => {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    drawDisplayBoard(ctx, grid, cellSize, cell, underlay);
  };

  // STATE 2 hold — the closed bottle sits (the drop-in rope landed it here).
  await animate(CLOSED_HOLD_MS, () => {
    clearBoard();
    drawBottle(ctx, start.x, start.y, cellSize, { variant: 'closed' });
  });

  // STATE 2 -> 3 — reveal with a small pop into the TYPE's tint + glow.
  await animate(REVEAL_MS, (t) => {
    clearBoard();
    const pop = 1 + Math.sin(Math.min(1, t) * Math.PI) * popSize;
    if (t < 0.55) {
      drawBottle(ctx, start.x, start.y, cellSize, { variant: 'closed', alpha: 1 - t / 0.55, scale: pop });
    }
    drawBottle(ctx, start.x, start.y, cellSize, {
      variant,
      alpha: Math.min(1, t / 0.55),
      scale: pop,
      glow: easeOutCubic(t),
    });
  });

  // STATE 3 hold — the revealed type is readable in place.
  await animate(REVEAL_HOLD_MS, () => {
    clearBoard();
    drawBottle(ctx, start.x, start.y, cellSize, { variant, glow: 1 });
  });
}

// ---------------------------------------------------------------------------
// STATE 4a: FULL — fly to the meter while the column collapses
// ---------------------------------------------------------------------------
function meterTargetToBoard(canvas, clientPoint) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientPoint.x - rect.left) / rect.width) * BOARD_W,
    y: ((clientPoint.y - rect.top) / rect.height) * BOARD_H,
  };
}

function clientPointToStage(canvas, clientPoint) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((clientPoint.x - rect.left) / rect.width) * STAGE_W,
    y: ((clientPoint.y - rect.top) / rect.height) * STAGE_H,
  };
}

async function playFlyToMeter(ctx, canvas, grid, cellSize, cell, targetClientPoint, flyLayer, variant = 'full', underlay = null) {
  const start = gridToPixel(cell.row, cell.col);
  const target = meterTargetToBoard(canvas, targetClientPoint);
  const flyCtx = flyLayer ? flyLayer.ctx : ctx;
  const flyCanvas = flyLayer ? flyLayer.canvas : canvas;
  const flyStart = flyLayer ? boardToStage(start) : start;
  const flyTarget = flyLayer ? clientPointToStage(flyCanvas, targetClientPoint) : target;
  const flyW = flyLayer ? STAGE_W : BOARD_W;
  const flyH = flyLayer ? STAGE_H : BOARD_H;
  const collapse = buildCollapse(grid, cell, cellSize, 0);

  await animate(FLY_MS, (t) => {
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    drawStaticDuringCollapse(ctx, grid, cellSize, cell, underlay);
    drawCollapse(ctx, collapse, t * FLY_MS, cellSize);
    if (flyLayer) flyCtx.clearRect(0, 0, flyW, flyH);

    const flyT = easeInOutQuad(t);
    const arc = Math.sin(t * Math.PI) * cellSize * 0.7;
    const x = flyStart.x + (flyTarget.x - flyStart.x) * flyT;
    const y = flyStart.y + (flyTarget.y - flyStart.y) * flyT - arc;
    drawBottle(flyCtx, x, y, cellSize, {
      variant,
      alpha: 1 - Math.max(0, (t - 0.82) / 0.18) * 0.45,
      scale: 1 - easeOutCubic(t) * 0.3,
      glow: 1 - t * 0.5,
    });
  });
  if (flyLayer) flyCtx.clearRect(0, 0, flyW, flyH);
}

// ---------------------------------------------------------------------------
// STATE 4b: EMPTY — the bottle is discarded (fades away, column collapses)
// ---------------------------------------------------------------------------
async function playDiscard(ctx, grid, cellSize, cell, underlay) {
  const start = gridToPixel(cell.row, cell.col);
  const collapse = buildCollapse(grid, cell, cellSize, COLLAPSE_DELAY_MS);

  await animate(DISCARD_MS, (t) => {
    const ms = t * DISCARD_MS;
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);
    drawStaticDuringCollapse(ctx, grid, cellSize, cell, underlay);
    drawCollapse(ctx, collapse, ms, cellSize);

    const fade = easeInOutQuad(Math.min(1, ms / (DISCARD_MS * 0.7)));
    if (fade < 1) {
      drawBottle(ctx, start.x, start.y, cellSize, {
        variant: 'empty',
        alpha: 1 - fade,
        scale: 1 - fade * 0.3,
      });
    }
  });
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------
/**
 * Run the full bottle sequence over the settled (shifted) board. Resolves once
 * the collapse rope has landed and the display equals the math grid, so the
 * caller can then start the tumble.
 *
 * Every bottle flies to the FARMER (he drinks it — no empties exist) —
 * `meterTarget` is his catch point in client coordinates. Without a target it
 * falls back to the legacy discard-in-place.
 *
 * @param {{row:number, col:number}} cell - the bottle's display cell.
 * @param {object} opts
 *   type         - 'beer' | 'wine' | 'moonshine' | 'jug' | 'barrel' (the reveal variant).
 *   meterTarget  - client-coordinate fly-to point (the farmer's catch hand).
 *   flyLayer     - full-stage effect layer from initBottleFlyLayer().
 *   drawUnderlay - back-layer painter (wells → underlay → symbols), keeps the
 *                  waiting buff plaques visible through the bottle sequence.
 */
export async function animateBottleSpawnFx(ctx, canvas, grid, cellSize, cell, opts = {}) {
  const { type = 'beer', meterTarget = null, flyLayer = null, drawUnderlay = null } = opts;

  await playReveal(ctx, grid, cellSize, cell, type, drawUnderlay);

  if (meterTarget) {
    await playFlyToMeter(ctx, canvas, grid, cellSize, cell, meterTarget, flyLayer, type, drawUnderlay);
  } else {
    await playDiscard(ctx, grid, cellSize, cell, drawUnderlay);
  }

  ctx.clearRect(0, 0, BOARD_W, BOARD_H);
  drawBoard(ctx, grid, cellSize, drawUnderlay);
}
