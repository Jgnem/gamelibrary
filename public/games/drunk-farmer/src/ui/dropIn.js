// Drunk Farmer — spin refresh (Hacksaw-style reel exchange, per-column ropes).
//
// Per column, three phases on ONE shared rAF timeline:
//   1. EXIT  — the old column drops out through the bottom clip edge as a RIGID
//              ROPE: every symbol shares the same delay and motion curve
//              (easeInCubic — nearly still ~100ms, then rushes out at max
//              speed, never decelerating). The rope travels (ROWS + 1) cells so
//              the top symbol fully clears the board's bottom edge.
//   2. GAP   — the column sits completely empty for COLUMN_GAP ms.
//   3. ENTRY — the new column falls in from above as an equally rigid rope,
//              pre-stacked (ROWS + 1) cells above target (easeInQuad), then the
//              landing spring: overshoot → bounce → settle + impact squash. The
//              whole column lands together — one dry bounce.
// Columns are staggered left→right by COLUMN_STAGGER, applied identically to
// exit and entry, so the left columns are refilling while the right columns are
// still emptying — the "conveyor" look; the board is never fully static.
// Everything is clipped to the grid rect and the empty-cell wells are drawn
// every frame (never black).

import { gridToPixel, BOARD_W, BOARD_H } from './canvas.js';
import { drawCellBackground } from './symbols.js';
import {
  runFallAnimation,
  makeFaller,
  COLUMN_STAGGER,
  COLUMN_GAP,
  EXIT_DURATION,
  EXIT_TIMING,
  DEFAULT_TIMING,
} from './fx.js';

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {(string|null)[][]} grid - new board (e.g. result.grid).
 * @param {number} cellSize
 * @param {(string|null)[][]|null} [prevGrid] - board currently on screen; exits
 *   through the bottom before the new board enters. Null on first spin (the
 *   entry ropes then start immediately, without the exit+gap offset).
 * @param {{cellOverrides?:Map<string, {symbol?:string, draw?:Function}>, drawUnderlay?:Function, drawOverlay?:Function}} [opts]
 *   cellOverrides — UI-only remaps keyed by "row,col". `symbol` swaps which
 *   symbol rides the entry rope at that cell; `draw` replaces drawSymbol with a
 *   custom renderer (e.g. the cosmetic bottle tile). The faller keeps the exact
 *   same rope physics either way; the math grid is never touched.
 *   drawUnderlay — drawn after the wells but BEFORE the ropes (back layer;
 *   keeps the waiting buff plaques visible while old tiles exit and new tiles
 *   fall in on top of them).
 * @returns {Promise<void>}
 */
export function animateDropIn(ctx, grid, cellSize, prevGrid = null, opts = {}) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;
  if (rows === 0 || cols === 0) return Promise.resolve();

  const width = BOARD_W;
  const height = BOARD_H;
  // (rows + 1) cells: one full board height plus one extra cell so the TOP
  // symbol of an exit rope fully clears the bottom clip edge (and an entry
  // rope's BOTTOM symbol spawns fully above the top edge).
  const travel = (rows + 1) * cellSize;

  // First spin has nothing to exit — entry starts right away.
  const entryOffset = prevGrid ? EXIT_DURATION + COLUMN_GAP : 0;

  const symbols = [];
  const cells = [];
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c, cellSize);
      cells.push({ x, y });

      // ONE delay per column (no per-symbol stagger — that would put symbols at
      // different points of the easing curve and open gaps in the rope).
      const columnDelay = c * COLUMN_STAGGER;

      // Exit rope: old symbol rides from its cell down out of the board.
      const old = prevGrid && prevGrid[r] ? prevGrid[r][c] : null;
      if (old != null) {
        symbols.push(makeFaller(old, x, y, y + travel, columnDelay, cellSize, EXIT_TIMING));
      }

      // Entry rope: new symbol spawns pre-stacked above, lands with the spring.
      // A cell override may swap the symbol (bottle-column shift) or the
      // renderer (the closed bottle tile) — the physics stay identical.
      const override = opts.cellOverrides ? opts.cellOverrides.get(`${r},${c}`) : null;
      const symbol = override && override.symbol !== undefined ? override.symbol : grid[r][c];
      const faller = makeFaller(symbol, x, y - travel, y, columnDelay + entryOffset, cellSize, DEFAULT_TIMING);
      if (override && override.draw) faller.draw = override.draw;
      symbols.push(faller);
    }
  }

  const drawBackground = (cx) => {
    for (const cell of cells) drawCellBackground(cx, cell.x, cell.y, cellSize);
    if (opts.drawUnderlay) opts.drawUnderlay(cx);
  };

  // clip:true → the board rect masks anything above the top / below the bottom edge.
  return runFallAnimation(ctx, { width, height, drawBackground, drawOverlay: opts.drawOverlay, symbols, clip: true });
}
