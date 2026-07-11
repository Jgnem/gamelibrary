// Drunk Farmer — BASE GAME chicken shot mechanic.
//
// Every wild on the base-game board is a CHICKEN and works as an ordinary wild
// whether shot or not (substitutes, helps form clusters). A chicken is SHOT
// only when it becomes part of a WINNING CLUSTER during the tumble: for each
// chicken that lands in a cluster, one shot roll is made whose chance scales
// with the bottle meter's fill entering the spin (fuller farmer = more
// shooting), via CHICKEN_SHOT.fill_tiers.
//
// SHOT   → the chicken's cell carries a buff value drawn from
//          CHICKEN_SHOT.buff_values. The WHOLE cluster win is multiplied by
//          that value; several shot cells in one cluster SUM their values.
//          Attribution is by fixed cell, valid across cascade steps.
// UNSHOT → the chicken is just a normal wild; its cluster wins normally.
//
// A chicken NOT in any winning cluster is never shot. ALL numeric tunables live
// in CHICKEN_SHOT (constants.js) and are PLACEHOLDER — TO BE BALANCED.
//
// PERSISTENT BUFFS — PERSIST-UNTIL-USED: a buff outlives its spin as a
// property of the CELL — not as a lingering wild; the next spin the cell holds
// a normal random symbol. It waits there, visible, until a winning cluster
// covers the cell again: that cluster is multiplied and the buff is CONSUMED.
// One buff = exactly two payoffs (birth cluster + one future cluster), so the
// cost is bounded and the board cannot saturate. mergePersistentBuffs()
// combines waiting buffs with this spin's fresh shots (same cell SUMS, capped
// at PERSISTENT_BUFF.max_value); settleBuffs() applies the settle rules. The
// engine (engine.js) owns the cross-spin state and calls both after the tumble.
//
// Pure logic, no UI. Imports from constants.js and tumble.js (scoreCluster).

import { CHICKEN_SHOT, PERSISTENT_BUFF, FREE_SPINS } from './constants.js';
import { scoreCluster } from './tumble.js';

/** Symbol id used for the wild/chicken (mirrors grid.js / tumble.js). */
export const WILD = 'wld';

/**
 * Draw one entry from a weighted table ([{weight, ...}]).
 * @param {{weight:number}[]} table
 * @param {() => number} rng
 */
export function weightedDraw(table, rng) {
  const total = table.reduce((sum, e) => sum + e.weight, 0);
  let roll = rng() * total;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return table[table.length - 1];
}

/**
 * Resolve the stepped fill→shot curve: the LAST tier whose `min_fill` is <=
 * the given meter fill wins (tiers are listed in ascending min_fill).
 * @param {number} fill - Bottle meter fill entering the spin (0..METER_MAX).
 * @returns {{min_fill:number, shot_chance:number}}
 */
export function shotTierForFill(fill) {
  const tiers = CHICKEN_SHOT.fill_tiers;
  let tier = tiers[0];
  for (const t of tiers) {
    if ((fill || 0) >= t.min_fill) tier = t;
  }
  return tier;
}

/**
 * Roll the farmer's shots against the chickens that were part of a winning
 * cluster this spin. A wild cell is a candidate the first time it appears in
 * any cluster (across all cascade steps); each candidate gets one shot roll at
 * the fill-tier's shot_chance. Candidates are visited in cluster/step order,
 * and each candidate rolls SHOT, then (if shot) the buff value — fixed order
 * so a seeded rng replays exactly. Pure: reads the tumble result, mutates
 * nothing.
 *
 * Free-spin effect:
 * - `effects.freeSpin` → shot chance is FREE_SPINS.shot_chance (1.0) this spin
 *   (the meter topped out — the farmer empties the gun into everything that
 *   clusters, every free spin of the feature).
 *
 * @param {{steps:{grid:string[][], clusters:{cells:{row:number,col:number}[]}[]}[]}} tumbleResult
 * @param {number} fill - Bottle meter fill entering the spin (0..METER_MAX).
 * @param {() => number} [rng=Math.random] - Float source in [0, 1).
 * @param {{freeSpin?:boolean}} [effects] - Free-spin shot effect.
 * @returns {{
 *   tier: {min_fill:number, shot_chance:number},
 *   shotChance: number,
 *   freeSpin: boolean,
 *   shots: {row:number, col:number, shot:boolean, value:number}[],
 *   buffed: {row:number, col:number, value:number}[],
 *   chickenCount: number,
 *   shotCount: number
 * }}
 */
export function resolveChickenShots(tumbleResult, fill, rng = Math.random, effects = {}) {
  const freeSpin = Boolean(effects.freeSpin);
  const tier = shotTierForFill(fill);
  const shotChance = freeSpin ? FREE_SPINS.shot_chance : tier.shot_chance;

  // Unique wild (chicken) cells that were part of SOME winning cluster — the
  // only chickens that can be shot. Gathered in step/cluster/cell order.
  const seen = new Set();
  const candidates = [];
  for (const step of tumbleResult.steps) {
    for (const cluster of step.clusters) {
      for (const { row, col } of cluster.cells) {
        if (step.grid[row][col] !== WILD) continue;
        const k = `${row},${col}`;
        if (seen.has(k)) continue;
        seen.add(k);
        candidates.push({ row, col });
      }
    }
  }

  const shots = [];
  const buffed = [];
  for (const { row, col } of candidates) {
    const shot = rng() < shotChance;
    let value = 0;
    if (shot) {
      value = weightedDraw(CHICKEN_SHOT.buff_values, rng).value;
      buffed.push({ row, col, value });
    }
    shots.push({ row, col, shot, value });
  }

  return {
    tier,
    shotChance,
    freeSpin,
    shots,
    buffed,
    chickenCount: shots.length,
    shotCount: buffed.length,
  };
}

/**
 * Re-score a tumble with cell buffs applied. For every cluster in every
 * cascade step, if the cluster covers one or more buffed cells, its paytable
 * win is multiplied by the SUM of those cells' values; a cluster covering no
 * buffed cell scores normally. Each step's win honors `step.winMultiplier`
 * (base cascade escalation). Once-per-cell is always on: a buffed cell
 * multiplies only the FIRST cluster (in step/cluster order) covering it this
 * spin — enforcing the "one buff = exactly two payoffs" contract (without it a
 * badge multiplies EVERY covering cluster, which at 7 cascade steps measured
 * far over budget).
 *
 * (CROSS-MULTIPLY was cut in the mechanics-diet pass — buffed clusters always
 * use their own covered-cell sum.)
 *
 * @param {{steps:{clusters:{symbol:string, cells:{row:number,col:number}[]}[], winMultiplier?:number}[], totalWin:number}} tumbleResult
 * @param {{row:number, col:number, value:number}[]} buffs
 * @returns {{win:number, boostedClusters:{step:number, symbol:string, size:number, baseWin:number, factor:number, win:number}[]}}
 */
export function applyWildMultipliers(tumbleResult, buffs) {
  if (buffs.length === 0) {
    return { win: tumbleResult.totalWin, boostedClusters: [] };
  }
  const valueByCell = new Map(buffs.map((b) => [`${b.row},${b.col}`, b.value]));
  const usedCells = new Set();

  let win = 0;
  const boostedClusters = [];
  tumbleResult.steps.forEach((step, stepIndex) => {
    const stepMult = step.winMultiplier || 1;
    for (const cluster of step.clusters) {
      const baseWin = scoreCluster(cluster);
      let sum = 0;
      for (const cell of cluster.cells) {
        const k = `${cell.row},${cell.col}`;
        const value = valueByCell.get(k);
        if (value && !usedCells.has(k)) {
          sum += value;
          usedCells.add(k);
        }
      }
      const factor = sum > 0 ? sum : 1;
      const clusterWin = baseWin * factor * stepMult;
      win += clusterWin;
      if (factor > 1) {
        boostedClusters.push({
          step: stepIndex,
          symbol: cluster.symbol,
          size: cluster.cells.length,
          baseWin,
          factor,
          win: clusterWin,
        });
      }
    }
  });
  return { win, boostedClusters };
}

/**
 * Combine buff cells carried in from previous spins with this spin's freshly
 * shot chickens. A fresh shot landing on an already-buffed cell (possible when
 * a wild happens to spawn there again) SUMS the new value onto the existing
 * one, capped at PERSISTENT_BUFF.max_value. All other cells pass through.
 *
 * @param {{row:number, col:number, value:number}[]} persisted - Buffs carried from previous spins.
 * @param {{row:number, col:number, value:number}[]} freshShots - This spin's shot cells (chickenShots.buffed).
 * @returns {{row:number, col:number, value:number}[]} The merged buff list active for this spin.
 */
export function mergePersistentBuffs(persisted, freshShots) {
  // `age` = spins spent waiting (drives fermenting). A fresh shot stacking
  // onto a waiting cell refreshes it: values SUM (capped), age resets to 0.
  const merged = new Map(
    persisted.map((b) => [`${b.row},${b.col}`, { value: b.value, age: b.age || 0 }])
  );
  for (const h of freshShots) {
    const k = `${h.row},${h.col}`;
    const existing = merged.get(k);
    merged.set(k, {
      value:
        existing !== undefined
          ? Math.min(existing.value + h.value, PERSISTENT_BUFF.max_value)
          : h.value,
      age: 0,
    });
  }
  return Array.from(merged, ([k, { value, age }]) => {
    const [row, col] = k.split(',').map(Number);
    return { row, col, value, age };
  });
}

/**
 * End-of-spin settle for the persistent buffs — PERSIST-UNTIL-USED:
 * - A buff shot FRESH this spin already multiplied its birth cluster; it now
 *   starts waiting on its cell and always carries into the next spin.
 * - A CARRIED (waiting) buff whose cell was covered by a winning cluster this
 *   spin has just paid its second time — it is CONSUMED (dropped).
 * - A carried buff whose cell was NOT covered keeps waiting — and FERMENTS:
 *   its age ticks up, and every PERSISTENT_BUFF.ferment_interval spins waited
 *   its value grows by ferment_amount, capped at max_value. Dead waiting time
 *   becomes anticipation; the cost stays bounded because the buff still pays
 *   only once more.
 * One buff therefore pays exactly twice (birth + one future use); the cost per
 * buff is bounded and the board cannot saturate with badges.
 *
 * FREE-SPIN exception: when `options.persistFresh` is false (free spins with
 * FREE_SPINS.buffs_persist off), fresh shots do NOT start waiting — their
 * cells were covered by their birth clusters, so the covered-check drops them
 * and the buff pays exactly once (spray-and-pray, no careful aim).
 *
 * @param {{row:number, col:number, value:number}[]} buffs - This spin's active buff cells (merged).
 * @param {{row:number, col:number, value:number}[]} freshShots - Cells shot THIS spin (chickenShots.buffed).
 * @param {{steps:{clusters:{cells:{row:number,col:number}[]}[]}[]}} tumbleResult
 * @param {{persistFresh?:boolean}} [options]
 * @returns {{row:number, col:number, value:number, age:number}[]} Buffs to carry into the next spin.
 */
export function settleBuffs(buffs, freshShots, tumbleResult, options = {}) {
  const persistFresh = options.persistFresh !== false;
  if (buffs.length === 0) return [];
  const covered = new Set();
  for (const step of tumbleResult.steps) {
    for (const cluster of step.clusters) {
      for (const { row, col } of cluster.cells) covered.add(`${row},${col}`);
    }
  }
  const freshKeys = new Set(freshShots.map((b) => `${b.row},${b.col}`));

  const out = [];
  for (const b of buffs) {
    const k = `${b.row},${b.col}`;
    if (persistFresh && freshKeys.has(k)) {
      out.push({ ...b, age: 0 }); // born this spin — starts waiting
    } else if (!covered.has(k)) {
      // Still waiting — age up and ferment on each full interval.
      const age = (b.age || 0) + 1;
      const value =
        PERSISTENT_BUFF.ferment_interval > 0 && age % PERSISTENT_BUFF.ferment_interval === 0
          ? Math.min(b.value + PERSISTENT_BUFF.ferment_amount, PERSISTENT_BUFF.max_value)
          : b.value;
      out.push({ ...b, value, age });
    }
    // carried AND covered → just paid its second time → consumed
  }
  return out;
}

// --- Self-test -------------------------------------------------------------
// Run directly with `node src/math/chickenShot.js` to exercise the shot rolls.
const invoked = typeof process !== 'undefined' && process.argv && process.argv[1];
if (invoked && decodeURIComponent(import.meta.url).endsWith(invoked.replace(/\\/g, '/'))) {
  const { createGrid, runTumble } = await import('./tumble.js');
  for (const fill of [0, 34, 68]) {
    const tier = shotTierForFill(fill);
    console.log(`\n=== fill ${fill} → shot chance ${tier.shot_chance * 100}% per clustered chicken ===`);
    for (let i = 1; i <= 4; i += 1) {
      const tumble = runTumble(createGrid(), Math.random, {
        persistentStickyWilds: true,
        temporaryWilds: true,
      });
      const r = resolveChickenShots(tumble, fill, Math.random);
      console.log(
        `  spin #${i}: clustered chickens=${r.chickenCount}, shot=${r.shotCount}` +
          (r.buffed.length
            ? ` [${r.buffed.map((w) => `x${w.value}@${w.row},${w.col}`).join(' ')}]`
            : '')
      );
    }
  }
}
