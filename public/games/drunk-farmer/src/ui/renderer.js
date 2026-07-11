// Drunk Farmer — static board renderer.
//
// Draws the empty-cell wells, then every symbol, then gold outlines on the
// highlighted cells. Used for the at-rest board (initial load, between spins).
// No math imports.

import { gridToPixel, BOARD_W, BOARD_H } from './canvas.js';
import { drawCellBackground, drawSymbol, drawGoldOutline } from './symbols.js';

/**
 * Render an entire board at rest.
 * @param {CanvasRenderingContext2D} ctx
 * @param {(string|null)[][]} grid
 * @param {number} cellSize
 * @param {{row:number, col:number}[]} [highlights=[]] - cells to outline in gold.
 * @param {{hiddenCells?:Set<string>, drawUnderlay?:Function, drawOverlay?:Function}} [opts]
 *   drawUnderlay — drawn after the wells but BEFORE the symbols (back layer;
 *   e.g. the full-tile buff plaques).
 */
export function renderGrid(ctx, grid, cellSize, highlights = [], opts = {}) {
  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  ctx.clearRect(0, 0, BOARD_W, BOARD_H);

  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c, cellSize);
      drawCellBackground(ctx, x, y, cellSize);
    }
  }
  if (opts.drawUnderlay) opts.drawUnderlay(ctx);
  for (let r = 0; r < rows; r += 1) {
    for (let c = 0; c < cols; c += 1) {
      const { x, y } = gridToPixel(r, c, cellSize);
      if (!opts.hiddenCells || !opts.hiddenCells.has(`${r},${c}`)) {
        drawSymbol(ctx, grid[r][c], x, y, cellSize, {});
      }
    }
  }
  for (const cell of highlights || []) {
    const { x, y } = gridToPixel(cell.row, cell.col, cellSize);
    drawGoldOutline(ctx, x, y, cellSize, 1);
  }
  if (opts.drawOverlay) opts.drawOverlay(ctx);
}
