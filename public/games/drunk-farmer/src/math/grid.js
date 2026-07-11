// Drunk Farmer — cluster grid engine.
//
// Pure game-board logic: create a board, find adjacency, detect clusters of 5+,
// remove/collapse/refill, and score. No UI, no DOM. Only imports constants.js
// (and may use rng.js for provably-fair draws — see note on createGrid).

import { SYMBOL_WEIGHTS, PAYTABLE, CLUSTER_MIN, GRID } from './constants.js';

/** Symbol id used for the wild. Wilds substitute but have no paytable. */
const WILD = 'wld';

/** All symbol ids in a stable order, with their cumulative weight total. */
const SYMBOL_IDS = Object.keys(SYMBOL_WEIGHTS);
const TOTAL_WEIGHT = SYMBOL_IDS.reduce((sum, id) => sum + SYMBOL_WEIGHTS[id], 0);

/**
 * Refill pool: same symbols minus the wild. Wilds must never spawn during
 * refills, otherwise their population only grows and the board saturates.
 */
const REFILL_IDS = SYMBOL_IDS.filter((id) => id !== WILD);
const REFILL_TOTAL = REFILL_IDS.reduce((sum, id) => sum + SYMBOL_WEIGHTS[id], 0);

/**
 * Pick a single weighted-random symbol id from the given pool.
 *
 * Note: this uses Math.random() so that createGrid()/fillEmpty() stay
 * synchronous. rng.js is the hash-based provably-fair source and is async by
 * nature (crypto.subtle); wire it in at the caller level when you need
 * deterministic, verifiable draws.
 * @param {string[]} ids
 * @param {number} total - Sum of the ids' weights.
 * @returns {string}
 */
function pickFrom(ids, total) {
  let roll = Math.random() * total;
  for (const id of ids) {
    roll -= SYMBOL_WEIGHTS[id];
    if (roll < 0) return id;
  }
  return ids[ids.length - 1];
}

/** Pick a weighted-random symbol from the full pool (initial board, may be wild). */
function pickSymbol() {
  return pickFrom(SYMBOL_IDS, TOTAL_WEIGHT);
}

/** Build a rows×cols grid filled with null. */
function emptyGrid() {
  return Array.from({ length: GRID.rows }, () => Array.from({ length: GRID.cols }, () => null));
}

/** Deep-copy a grid (rows are sliced; cell values are primitives). */
function copyGrid(grid) {
  return grid.map((row) => row.slice());
}

/**
 * Create a fresh 6×6 board filled with weighted-random symbols.
 * @returns {string[][]} grid[row][col] = symbol id.
 */
export function createGrid() {
  const grid = emptyGrid();
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      grid[r][c] = pickSymbol();
    }
  }
  return grid;
}

/**
 * Orthogonal neighbours (up/down/left/right) of a cell, clipped to the board.
 * No diagonals.
 * @param {number} row
 * @param {number} col
 * @returns {{row:number, col:number}[]}
 */
export function getNeighbors(row, col) {
  const deltas = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];
  const out = [];
  for (const [dr, dc] of deltas) {
    const nr = row + dr;
    const nc = col + dc;
    if (nr >= 0 && nr < GRID.rows && nc >= 0 && nc < GRID.cols) {
      out.push({ row: nr, col: nc });
    }
  }
  return out;
}

/** Stable string key for a cell coordinate. */
function key(cell) {
  return `${cell.row},${cell.col}`;
}

/**
 * Find connected components (orthogonal) over an arbitrary set of cells.
 * @param {{row:number, col:number, isWild:boolean}[]} cells
 * @returns {{row:number, col:number, isWild:boolean}[][]}
 */
function componentsFromCells(cells) {
  const lookup = new Map(cells.map((c) => [key(c), c]));
  const seen = new Set();
  const components = [];
  for (const cell of cells) {
    if (seen.has(key(cell))) continue;
    const component = [];
    const stack = [cell];
    seen.add(key(cell));
    while (stack.length) {
      const cur = stack.pop();
      component.push(cur);
      for (const n of getNeighbors(cur.row, cur.col)) {
        const k = key(n);
        if (lookup.has(k) && !seen.has(k)) {
          seen.add(k);
          stack.push(lookup.get(k));
        }
      }
    }
    components.push(component);
  }
  return components;
}

/**
 * Collect candidate clusters per real symbol. For each symbol S, a candidate is
 * a connected blob of cells that are either S or wild, sized >= CLUSTER_MIN and
 * containing at least one real S. Wilds may appear in several candidates here;
 * exclusivity is resolved later in findClusters.
 * @param {string[][]} grid
 * @returns {{symbol:string, cells:object[]}[]}
 */
function candidateClusters(grid) {
  const symbols = new Set();
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      const v = grid[r][c];
      if (v !== null && v !== WILD) symbols.add(v);
    }
  }

  const candidates = [];
  for (const sym of symbols) {
    const cells = [];
    for (let r = 0; r < GRID.rows; r += 1) {
      for (let c = 0; c < GRID.cols; c += 1) {
        const v = grid[r][c];
        if (v === sym) cells.push({ row: r, col: c, isWild: false });
        else if (v === WILD) cells.push({ row: r, col: c, isWild: true });
      }
    }
    for (const comp of componentsFromCells(cells)) {
      const realCount = comp.filter((x) => !x.isWild).length;
      if (comp.length >= CLUSTER_MIN && realCount >= 1) {
        candidates.push({ symbol: sym, cells: comp });
      }
    }
  }
  return candidates;
}

/**
 * Detect all paying clusters on the board. A cluster is 5+ orthogonally
 * connected cells of one symbol, with wilds substituting.
 *
 * Wild rule: a wild may belong to only ONE cluster — the largest available.
 * Candidates are processed largest-first; once a cluster claims a wild it is
 * marked used and removed from smaller candidates (which are then re-checked
 * for connectivity and the 5+ threshold).
 * @param {string[][]} grid
 * @returns {{symbol:string, cells:{row:number, col:number}[]}[]}
 */
export function findClusters(grid) {
  const candidates = candidateClusters(grid);
  // Largest first so bigger clusters get first claim on shared wilds.
  candidates.sort((a, b) => b.cells.length - a.cells.length);

  const usedWilds = new Set();
  const clusters = [];

  for (const cand of candidates) {
    // Drop wilds already claimed by a larger cluster.
    const available = cand.cells.filter(
      (c) => !(c.isWild && usedWilds.has(key(c)))
    );
    // Removing a wild can split the blob; re-evaluate connectivity.
    for (const comp of componentsFromCells(available)) {
      const realCount = comp.filter((x) => !x.isWild).length;
      if (comp.length >= CLUSTER_MIN && realCount >= 1) {
        for (const c of comp) {
          if (c.isWild) usedWilds.add(key(c));
        }
        clusters.push({
          symbol: cand.symbol,
          cells: comp.map((c) => ({ row: c.row, col: c.col })),
        });
      }
    }
  }
  return clusters;
}

/**
 * Apply gravity: in each column, surviving symbols fall to the bottom and nulls
 * rise to the top. Returns a new grid.
 * @param {(string|null)[][]} grid
 * @returns {(string|null)[][]}
 */
export function applyGravity(grid) {
  const out = emptyGrid();
  for (let c = 0; c < GRID.cols; c += 1) {
    const stack = [];
    for (let r = 0; r < GRID.rows; r += 1) {
      if (grid[r][c] !== null) stack.push(grid[r][c]);
    }
    let r = GRID.rows - 1;
    for (let i = stack.length - 1; i >= 0; i -= 1, r -= 1) {
      out[r][c] = stack[i];
    }
    while (r >= 0) {
      out[r][c] = null;
      r -= 1;
    }
  }
  return out;
}

/**
 * Replace every null cell with a fresh weighted-random symbol. Returns a new
 * grid (typically called after applyGravity to refill the top).
 * @param {(string|null)[][]} grid
 * @returns {string[][]}
 */
export function fillEmpty(grid) {
  const out = copyGrid(grid);
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      if (out[r][c] === null) out[r][c] = pickFrom(REFILL_IDS, REFILL_TOTAL);
    }
  }
  return out;
}

/**
 * Total win multiplier for all clusters currently on the board, summed.
 * Cluster size is clamped to the last paytable index. Wild has no paytable, so
 * clusters are always scored under their real symbol.
 * @param {string[][]} grid
 * @param {Record<string, number[]>} [paytable=PAYTABLE]
 * @returns {number}
 */
export function evaluateWin(grid, paytable = PAYTABLE) {
  let total = 0;
  for (const cluster of findClusters(grid)) {
    const table = paytable[cluster.symbol];
    if (!table) continue;
    const idx = Math.min(cluster.cells.length, table.length - 1);
    total += table[idx];
  }
  return total;
}

// --- Self-test -------------------------------------------------------------
// Run directly with `node src/math/grid.js` to print sample grids + clusters.
const invoked = typeof process !== 'undefined' && process.argv && process.argv[1];
if (invoked && decodeURIComponent(import.meta.url).endsWith(invoked.replace(/\\/g, '/'))) {
  const render = (grid) =>
    grid
      .map((row) => row.map((v) => String(v ?? '·').padStart(3, ' ')).join(' '))
      .join('\n');

  for (let i = 1; i <= 10; i += 1) {
    const grid = createGrid();
    const clusters = findClusters(grid);
    const win = evaluateWin(grid);
    console.log(`\n=== Sample grid #${i} ===`);
    console.log(render(grid));
    if (clusters.length === 0) {
      console.log('clusters: none (no 5+ clusters)');
    } else {
      console.log(`clusters: ${clusters.length}`);
      for (const cl of clusters) {
        console.log(`  ${cl.symbol} × ${cl.cells.length}`);
      }
    }
    console.log(`total win multiplier: ${win.toFixed(2)}`);
  }
}
