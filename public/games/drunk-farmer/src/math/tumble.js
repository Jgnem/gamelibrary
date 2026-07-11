// Drunk Farmer - tumble (cascade) engine with sticky wilds.
//
// Default behavior stays compatible with Drunk Mode: wilds stick for one extra
// cascade step. Base-game callers can opt into paid-spin sticky progression and
// temporary wild escalation without changing bonus/free-spin mechanics.

import { findClusters, createGrid } from './grid.js';
import { SYMBOL_WEIGHTS, PAYTABLE, GRID, CASCADE } from './constants.js';

// Re-export so the game layer can build a board through the tumble module
// without importing grid.js directly.
export { createGrid } from './grid.js';

/** Symbol id used for the wild. Wilds substitute but have no paytable. */
const WILD = 'wld';
const MAX_BASE_STICKY_WILDS = 3;

/** Safety cap so a pathological refill stream can't loop forever. */
const MAX_STEPS = 500;
// Base-spin cascade cap and per-level win multipliers live in constants.js
// (CASCADE) — raised from 4 steps in the fat-tail pass.
const MAX_BASE_CASCADE_STEPS = CASCADE.max_steps;

/** Win multiplier for a base-mode cascade level (1-based). ×1 outside the table. */
function cascadeMultiplier(cascadeLevel) {
  return CASCADE.step_multipliers[cascadeLevel - 1] || 1;
}

// Refill pool excludes the wild: wilds must never spawn during a refill, or
// their population only grows and the board saturates with wilds.
const REFILL_IDS = Object.keys(SYMBOL_WEIGHTS).filter((id) => id !== WILD);
const REFILL_TOTAL = REFILL_IDS.reduce((sum, id) => sum + SYMBOL_WEIGHTS[id], 0);

function copyGrid(grid) {
  return grid.map((row) => row.slice());
}

function posKey(row, col) {
  return `${row},${col}`;
}

function fromKey(key) {
  const [row, col] = key.split(',').map(Number);
  return { row, col };
}

function pickSymbol(rng) {
  let roll = rng() * REFILL_TOTAL;
  for (const id of REFILL_IDS) {
    roll -= SYMBOL_WEIGHTS[id];
    if (roll < 0) return id;
  }
  return REFILL_IDS[REFILL_IDS.length - 1];
}

export function scoreCluster(cluster) {
  const table = PAYTABLE[cluster.symbol];
  if (!table) return 0;
  const idx = Math.min(cluster.cells.length, table.length - 1);
  return table[idx];
}

function scoreClusters(clusters) {
  let total = 0;
  for (const cl of clusters) total += scoreCluster(cl);
  return total;
}

function stickyGravity(grid, stickyKeys) {
  const out = Array.from({ length: GRID.rows }, () =>
    Array.from({ length: GRID.cols }, () => null)
  );
  for (let c = 0; c < GRID.cols; c += 1) {
    for (let r = 0; r < GRID.rows; r += 1) {
      if (stickyKeys.has(posKey(r, c))) out[r][c] = grid[r][c];
    }
    const movable = [];
    for (let r = 0; r < GRID.rows; r += 1) {
      if (!stickyKeys.has(posKey(r, c)) && grid[r][c] !== null) {
        movable.push(grid[r][c]);
      }
    }
    let idx = movable.length - 1;
    for (let r = GRID.rows - 1; r >= 0; r -= 1) {
      if (stickyKeys.has(posKey(r, c))) continue;
      out[r][c] = idx >= 0 ? movable[idx] : null;
      idx -= 1;
    }
  }
  return out;
}

function fillEmptyWith(grid, rng) {
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      if (grid[r][c] === null) grid[r][c] = pickSymbol(rng);
    }
  }
  return grid;
}

function temporaryWildChance(cascadeLevel) {
  if (cascadeLevel === 2) return 0.3;
  if (cascadeLevel === 3) return 0.6;
  if (cascadeLevel >= 4) return 1;
  return 0;
}

function addTemporaryWilds(grid, stickyKeys, temporaryWildKeys, cascadeLevel, rng) {
  const chance = temporaryWildChance(cascadeLevel);
  if (chance === 0 || rng() >= chance) return [];

  const candidates = [];
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      const k = posKey(r, c);
      if (
        grid[r][c] !== null &&
        grid[r][c] !== WILD &&
        !stickyKeys.has(k) &&
        !temporaryWildKeys.has(k)
      ) {
        candidates.push({ row: r, col: c });
      }
    }
  }

  if (candidates.length === 0) return [];
  const picked = candidates[Math.floor(rng() * candidates.length)];
  const k = posKey(picked.row, picked.col);
  const original = grid[picked.row][picked.col];
  grid[picked.row][picked.col] = WILD;
  temporaryWildKeys.add(k);
  return [{ ...picked, original }];
}

function restoreUnusedTemporaryWilds(grid, addedTemporaryWilds, usedTemporaryKeys) {
  for (const temp of addedTemporaryWilds) {
    const k = posKey(temp.row, temp.col);
    if (!usedTemporaryKeys.has(k)) grid[temp.row][temp.col] = temp.original;
  }
}

/**
 * Run a full tumble sequence on a starting grid.
 *
 * Base-game options:
 * - persistentStickyWilds: real wilds that win stay pinned for this paid spin.
 * - temporaryWilds: cascade levels 2+ can add a temporary wild before win-check.
 * Shared option (Drunk Mode wild chickens AND base-game hit chickens):
 * - injectedStickyWilds: [{row,col}] cells that are ALREADY wild in `grid` and
 *   stay pinned for the whole tumble (never removed, never fall). In the base
 *   sticky-progression mode they are pinned OUTSIDE the 3-sticky-wild cap and
 *   never consume it. Empty by default, so plain tumbles are unaffected.
 */
export function runTumble(grid, rng = Math.random, options = {}) {
  const useBaseStickyProgression = Boolean(options.persistentStickyWilds);
  const useTemporaryWilds = Boolean(options.temporaryWilds);
  // Shot-chicken cells (Drunk Mode wild chickens, base-game hit chickens) are
  // injected here: they persist pinned for the whole tumble so their
  // multiplier attribution can use a fixed cell.
  const injectedWildKeys = new Set(
    (options.injectedStickyWilds || []).map((w) => posKey(w.row, w.col))
  );
  let working = copyGrid(grid);
  let incomingSticky = new Set(); // Legacy one-step sticky state for bonus/free-spin tumbles.
  const baseStickyKeys = new Set(); // Base paid-spin sticky state; resets on each runTumble call.
  const steps = [];
  const cascadeLog = [];
  let totalWin = 0;

  const maxSteps = useBaseStickyProgression ? MAX_BASE_CASCADE_STEPS : MAX_STEPS;
  for (let step = 0; step < maxSteps; step += 1) {
    const cascadeLevel = step + 1;
    const temporaryWildKeys = new Set();
    // Base-game escalation: after a drop/refill, later cascade levels may place
    // one temporary wild before the next win-check. Bonus tumbles do not pass
    // this option, so chicken/free-spin logic is untouched.
    const addedTemporaryWilds = useTemporaryWilds
      ? addTemporaryWilds(working, baseStickyKeys, temporaryWildKeys, cascadeLevel, rng)
      : [];

    const clusters = findClusters(working);
    if (clusters.length === 0) {
      restoreUnusedTemporaryWilds(working, addedTemporaryWilds, new Set());
      break;
    }

    // Base mode: later cascade levels multiply their step win (×1 early, so
    // common outcomes and hit rate are untouched). Bonus tumbles stay ×1.
    const winMultiplier = useBaseStickyProgression ? cascadeMultiplier(cascadeLevel) : 1;
    const stepWin = scoreClusters(clusters) * winMultiplier;
    totalWin += stepWin;

    const freshSticky = new Set();
    const freshStickyList = [];
    for (const cl of clusters) {
      for (const { row, col } of cl.cells) {
        if (working[row][col] !== WILD) continue;
        const k = posKey(row, col);
        if (useBaseStickyProgression) {
          // Base paid-spin sticky wilds persist for the rest of this spin,
          // capped at 3. Temporary wilds never become sticky, and injected
          // wilds are already pinned — they must not consume the cap.
          if (
            !temporaryWildKeys.has(k) &&
            !injectedWildKeys.has(k) &&
            !baseStickyKeys.has(k) &&
            baseStickyKeys.size < MAX_BASE_STICKY_WILDS
          ) {
            baseStickyKeys.add(k);
            freshSticky.add(k);
            freshStickyList.push({ row, col });
          }
        } else if (!incomingSticky.has(k) && !freshSticky.has(k)) {
          freshSticky.add(k);
          freshStickyList.push({ row, col });
        }
      }
    }

    const activeStickyKeys = useBaseStickyProgression
      ? new Set([...baseStickyKeys, ...injectedWildKeys])
      : new Set([...freshSticky, ...injectedWildKeys]);
    const activeStickyWilds = Array.from(activeStickyKeys).map(fromKey);
    const cascadeEntry = {
      cascadeLevel,
      winAmount: stepWin,
      winMultiplier,
      stickyWildCount: activeStickyKeys.size,
      temporaryWildCount: addedTemporaryWilds.length,
    };
    if (useBaseStickyProgression) cascadeLog.push(cascadeEntry);

    const stepRecord = {
      grid: copyGrid(working),
      clusters,
      stepWin,
      // Per-step win multiplier (base cascade escalation). applyWildMultipliers
      // reads it when re-scoring; missing/1 on bonus tumbles.
      winMultiplier,
      stickyWilds: freshStickyList.map((p) => ({ ...p })),
    };
    if (useBaseStickyProgression) {
      Object.assign(stepRecord, {
        cascadeLevel,
        activeStickyWilds: activeStickyWilds.map((p) => ({ ...p })),
        temporaryWilds: addedTemporaryWilds.map(({ row, col }) => ({ row, col })),
        addedTemporaryWilds: addedTemporaryWilds.map((p) => ({ ...p })),
        cascadeLog: cascadeEntry,
      });
    }

    const winningKeys = new Set(clusters.flatMap((cl) => cl.cells.map((cell) => posKey(cell.row, cell.col))));
    const usedTemporaryKeys = new Set(
      addedTemporaryWilds
        .map((temp) => posKey(temp.row, temp.col))
        .filter((k) => winningKeys.has(k))
    );
    restoreUnusedTemporaryWilds(working, addedTemporaryWilds, usedTemporaryKeys);

    const next = copyGrid(working);
    for (const cl of clusters) {
      for (const { row, col } of cl.cells) {
        const k = posKey(row, col);
        if (!activeStickyKeys.has(k)) {
          next[row][col] = null;
        }
      }
    }

    if (!useBaseStickyProgression) {
      // Legacy behavior: incoming sticky wilds spend one extra step, then expire.
      // Injected (Drunk Mode) wilds are exempt — they stay pinned all spin.
      for (const k of incomingSticky) {
        if (injectedWildKeys.has(k)) continue;
        const [r, c] = k.split(',').map(Number);
        next[r][c] = null;
      }
    }

    if (useBaseStickyProgression) {
      const collapsed = stickyGravity(next, activeStickyKeys);
      working = fillEmptyWith(collapsed, rng);
    } else {
      // Pin both this step's fresh sticky wilds AND any injected wilds.
      const collapsed = stickyGravity(next, activeStickyKeys);
      working = fillEmptyWith(collapsed, rng);
      incomingSticky = freshSticky;
    }

    stepRecord.nextGrid = copyGrid(working);
    steps.push(stepRecord);
  }

  const lastSticky = useBaseStickyProgression
    ? Array.from(baseStickyKeys).map(fromKey)
    : steps.length
      ? steps[steps.length - 1].stickyWilds
      : [];

  return {
    steps,
    totalWin,
    stickyWilds: lastSticky.map((p) => ({ ...p })),
    temporaryWilds: [],
    temporaryWildCount: cascadeLog.reduce((sum, entry) => sum + entry.temporaryWildCount, 0),
    cascadeLevel: steps.length,
    cascadeLog,
  };
}

// --- Self-test -------------------------------------------------------------
// Run directly with `node src/math/tumble.js` to exercise a few tumbles.
const invoked = typeof process !== 'undefined' && process.argv && process.argv[1];
if (invoked && decodeURIComponent(import.meta.url).endsWith(invoked.replace(/\\/g, '/'))) {
  for (let i = 1; i <= 5; i += 1) {
    const result = runTumble(createGrid(), Math.random, {
      persistentStickyWilds: true,
      temporaryWilds: true,
    });
    console.log(
      `tumble #${i}: steps=${result.steps.length}, ` +
        `totalWin=${result.totalWin.toFixed(2)}, ` +
        `stickyWilds=${result.stickyWilds.length}, ` +
        `temporaryWildCount=${result.temporaryWildCount}`
    );
    result.steps.forEach((s) => {
      console.log(
        `  level ${s.cascadeLevel}: clusters=${s.clusters.length}, ` +
          `stepWin=${s.stepWin.toFixed(2)}, sticky=${s.stickyWilds.length}, ` +
          `temp=${s.temporaryWilds.length}`
      );
    });
  }
}
