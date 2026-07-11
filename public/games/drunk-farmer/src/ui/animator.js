// Drunk Farmer — cascade (tumble) animation.
//
// Per tumble step: flash the winning cells gold, then resolve the cascade with
// the SAME weighted physics as the drop-in. Each affected column drops as one
// tight connected strip ("rope"): the displaced part of the column (everything
// at or above the lowest removed cell, i.e. moved survivors + refills) falls the
// same distance (k = cells removed) with a single shared per-column delay, so it
// stays packed and never opens gaps. Cells below the lowest removal stay put.
// Winners fade/drop out as an overlay while the refills are already entering, and
// the empty-cell wells are drawn every frame, so the board is never empty/black.
// Reads grid.js pure helpers to reconstruct the final settled board (runTumble
// doesn't record it); no math file is changed.

import { gridToPixel, BOARD_W, BOARD_H } from './canvas.js';
import { drawCellBackground, drawSymbol, drawGoldOutline } from './symbols.js';
import { applyGravity, fillEmpty } from '../math/grid.js';
import {
  runFallAnimation,
  makeFaller,
  animate,
  delay,
  CASCADE_COLUMN_STAGGER,
  CASCADE_TIMING,
  OVERSHOOT,
  BOUNCE_BACK,
  BOUNCE_DURATION,
  SETTLE_DURATION,
  SQUASH_DURATION,
  SQUASH_X,
  SQUASH_Y,
} from './fx.js';

const FLASH_MS = 120; // gold win pulse before the cascade resolves
const FADE_OUT_MS = 100; // how long winning symbols take to fade/drop away
const PAUSE_MS = 30; // settle beat between cascade steps

function cascadeTiming(level) {
  if (level >= 4) {
    return {
      ...CASCADE_TIMING,
      fall: Math.max(230, CASCADE_TIMING.fall - 35),
      bounce: BOUNCE_DURATION + 20,
      settle: SETTLE_DURATION + 10,
      squash: SQUASH_DURATION + 15,
      overshoot: OVERSHOOT + 8,
      bounceBack: BOUNCE_BACK + 3,
      squashX: SQUASH_X + 0.04,
      squashY: SQUASH_Y - 0.04,
    };
  }
  if (level === 3) {
    return {
      ...CASCADE_TIMING,
      fall: Math.max(230, CASCADE_TIMING.fall - 45),
      bounce: BOUNCE_DURATION + 12,
      settle: SETTLE_DURATION + 6,
      squash: SQUASH_DURATION + 8,
      overshoot: OVERSHOOT + 5,
      bounceBack: BOUNCE_BACK + 2,
      squashX: SQUASH_X + 0.025,
      squashY: SQUASH_Y - 0.025,
    };
  }
  if (level === 2) {
    return {
      ...CASCADE_TIMING,
      fall: Math.max(240, CASCADE_TIMING.fall - 25),
      bounce: BOUNCE_DURATION + 6,
      settle: SETTLE_DURATION,
      squash: SQUASH_DURATION + 4,
      overshoot: OVERSHOOT + 3,
      bounceBack: BOUNCE_BACK + 1,
      squashX: SQUASH_X + 0.015,
      squashY: SQUASH_Y - 0.015,
    };
  }
  return CASCADE_TIMING;
}

function cascadeFlashMs(level) {
  if (level >= 4) return 160;
  if (level === 3) return 140;
  if (level === 2) return 125;
  return FLASH_MS;
}

function cascadePauseMs(level) {
  if (level >= 4) return 85;
  if (level === 3) return 45;
  return PAUSE_MS;
}

function cascadeShake(level, t, cellSize) {
  if (level < 3) return { x: 0, y: 0 };
  const amp = cellSize * (level >= 4 ? 0.035 : 0.018) * (1 - t * 0.35);
  return {
    x: Math.sin(t * Math.PI * 12) * amp,
    y: Math.cos(t * Math.PI * 10) * amp * 0.55,
  };
}

function drawCascadeGlow(ctx, level, t, width, height) {
  if (level < 3) return;
  const alpha = level >= 4 ? 0.18 : 0.09;
  ctx.save();
  ctx.globalAlpha = alpha * (0.55 + 0.45 * Math.sin(t * Math.PI));
  ctx.fillStyle = level >= 4 ? '#8b5cff' : '#ffd35a';
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
}

/** Rebuild the settled board after a step (clusters removed, gravity, refill). */
function settledBoard(grid, clusterCells) {
  const copy = grid.map((r) => r.slice());
  for (const { row, col } of clusterCells) copy[row][col] = null;
  return fillEmpty(applyGravity(copy));
}

/**
 * Animate a full tumble sequence.
 * @param {{hiddenCells?:Set<string>, hiddenWinnerCells?:Set<string>, drawUnderlay?:Function, drawOverlay?:Function}} [opts]
 *   drawUnderlay — drawn after the wells but BEFORE the symbols every frame
 *   (back layer; e.g. the full-tile buff plaques, visible through empty wells
 *   and under falling refills).
 *   hiddenWinnerCells — mutable set of "row,col" cells whose winning symbol
 *   must NOT play the fade-out (e.g. a chicken that already exploded).
 * @returns {Promise<(string|null)[][]|null>} the final settled board (for the
 *   next spin to drop out), or null when there were no winning steps.
 */
export async function animateTumble(ctx, steps, cellSize, opts = {}) {
  if (!steps || steps.length === 0) return null;

  const rows = steps[0].grid.length;
  const cols = steps[0].grid[0].length;
  const width = BOARD_W;
  const height = BOARD_H;

  const drawWells = (cx) => {
    for (let r = 0; r < rows; r += 1) {
      for (let c = 0; c < cols; c += 1) {
        const { x, y } = gridToPixel(r, c, cellSize);
        drawCellBackground(cx, x, y, cellSize);
      }
    }
  };

  let finalGrid = null;

  for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];
    const cascadeLevel = Number.isFinite(step.cascadeLevel) ? step.cascadeLevel : 1;
    const clusterCells = step.clusters.flatMap((c) => c.cells);
    const nextGrid =
      step.nextGrid || (i + 1 < steps.length ? steps[i + 1].grid : settledBoard(step.grid, clusterCells));
    finalGrid = nextGrid;

    // 1. Flash winning cells gold (pulsing); board otherwise static.
    const flashMs = cascadeFlashMs(cascadeLevel);
    await animate(flashMs, (t) => {
      ctx.clearRect(0, 0, width, height);
      const shake = cascadeShake(cascadeLevel, t, cellSize);
      ctx.save();
      ctx.translate(shake.x, shake.y);
      drawWells(ctx);
      if (opts.drawUnderlay) opts.drawUnderlay(ctx, t * flashMs);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < cols; c += 1) {
          const { x, y } = gridToPixel(r, c, cellSize);
          if (!opts.hiddenCells || !opts.hiddenCells.has(`${r},${c}`)) {
            drawSymbol(ctx, step.grid[r][c], x, y, cellSize, {});
          }
        }
      }
      drawCascadeGlow(ctx, cascadeLevel, t, width, height);
      const ga = 0.35 + 0.65 * Math.abs(Math.sin(t * Math.PI * 2));
      for (const cell of clusterCells) {
        const { x, y } = gridToPixel(cell.row, cell.col, cellSize);
        drawGoldOutline(ctx, x, y, cellSize, ga);
      }
      if (opts.drawOverlay) opts.drawOverlay(ctx, t * flashMs);
      ctx.restore();
    });

    // BASE GAME chicken shots: a chicken is shot the moment it lands in a
    // formed cluster. The caller fires the farmer and reveals the buff badge
    // for this step's shot chickens before the cascade resolves. Optional —
    // Drunk Mode does not pass it, so its flow is untouched.
    if (opts.onStepFlash) await opts.onStepFlash(i, step);

    // 2. Resolve the cascade. Each affected column drops as one tight strip.
    const removedByCol = Array.from({ length: cols }, () => new Set());
    for (const { row, col } of clusterCells) removedByCol[col].add(row);

    const symbols = []; // the moving rope (one shared delay + distance per column)
    const staticCells = []; // cells below the lowest removal — they don't move

    for (let c = 0; c < cols; c += 1) {
      const removed = removedByCol[c];
      const k = removed.size;
      if (k === 0) {
        // Column untouched: everything stays put.
        for (let r = 0; r < rows; r += 1) {
          const { x, y } = gridToPixel(r, c, cellSize);
          if (!opts.hiddenCells || !opts.hiddenCells.has(`${r},${c}`)) {
            staticCells.push({ symbol: nextGrid[r][c], x, y });
          }
        }
        continue;
      }

      // Everything at/above the lowest removed cell is displaced and falls by k
      // cells; everything below it is undisturbed and stays put. The displaced
      // strip (moved survivors + refills packed directly above them) shares ONE
      // per-column delay and ONE curve — a rigid rope, exactly like the spin
      // refresh, so the packing never opens gaps mid-flight. The whole strip
      // lands together: one dry bounce per column.
      const lowestRemoved = Math.max(...removed);
      const dropDistance = k * cellSize;
      const columnDelay = c * CASCADE_COLUMN_STAGGER;
      for (let r = 0; r < rows; r += 1) {
        const target = gridToPixel(r, c, cellSize);
        if (r > lowestRemoved) {
          if (!opts.hiddenCells || !opts.hiddenCells.has(`${r},${c}`)) {
            staticCells.push({ symbol: nextGrid[r][c], x: target.x, y: target.y });
          }
        } else {
          if (!opts.hiddenCells || !opts.hiddenCells.has(`${r},${c}`)) {
            symbols.push(makeFaller(nextGrid[r][c], target.x, target.y - dropDistance, target.y, columnDelay, cellSize));
          }
        }
      }
    }

    const drawBackground = (cx) => {
      drawWells(cx);
      if (opts.drawUnderlay) opts.drawUnderlay(cx, 0);
      for (const s of staticCells) drawSymbol(cx, s.symbol, s.x, s.y, cellSize, {});
    };

    // Winning symbols fade + drop out as the refills are already entering.
    // Cells in hiddenWinnerCells skip the fade — their symbol already exploded.
    const winners = clusterCells
      .filter((cell) => !opts.hiddenCells || !opts.hiddenCells.has(`${cell.row},${cell.col}`))
      .filter((cell) => !opts.hiddenWinnerCells || !opts.hiddenWinnerCells.has(`${cell.row},${cell.col}`))
      .map((cell) => {
        const { x, y } = gridToPixel(cell.row, cell.col, cellSize);
        return { symbol: step.grid[cell.row][cell.col], x, y };
      });
    const drawOverlay = (cx, elapsed) => {
      const a = Math.max(0, 1 - elapsed / FADE_OUT_MS);
      if (a > 0) {
        const drift = (1 - a) * cellSize * 0.35;
        const sc = 1 - (1 - a) * 0.25;
        for (const w of winners) {
          drawSymbol(cx, w.symbol, w.x, w.y + drift, cellSize, { alpha: a, scaleX: sc, scaleY: sc });
        }
      }
      if (opts.drawOverlay) opts.drawOverlay(cx, elapsed);
    };

    // Base cascade levels escalate timing/impact; bonus steps have no
    // cascadeLevel metadata and therefore stay on the normal cascade profile.
    await runFallAnimation(ctx, {
      width,
      height,
      drawBackground,
      drawOverlay,
      symbols,
      timing: cascadeTiming(cascadeLevel),
    });
    await delay(cascadePauseMs(cascadeLevel));
  }

  return finalGrid;
}
