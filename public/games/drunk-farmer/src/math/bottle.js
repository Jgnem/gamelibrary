// Drunk Farmer - bottle meter.
//
// Each spin has a chance to spawn a bottle. The spawn chance starts at the base
// chance and rises for every consecutive spin without a bottle (a deliberately
// FLAT pity ramp — variance is the point; see constants.js). EVERY bottle
// contains alcohol — there are no empty bottles. A spawned bottle draws its
// type from BOTTLE_TYPES (beer/wine/moonshine/jug/barrel, weighted — the
// barrel fills the whole meter in one go, so free spins are theoretically
// possible on spin 1) and raises the meter by that type's `fill`. The meter
// fills gradually and never leaks — when it reaches METER_MAX it triggers the
// free-spins event and the OVERFLOW CARRIES OVER into the next cycle
// (fill -= METER_MAX; no alcohol is wasted).
//
// Pure logic, no UI. Imports only from constants.js.

import {
  BASE_SPAWN_CHANCE,
  BOTTLE_TYPES,
  METER_MAX,
  SPAWN_RISE_PER_DRY_SPIN,
} from './constants.js';

function spawnChance(spawnDryStreak) {
  return Math.min(1, BASE_SPAWN_CHANCE + SPAWN_RISE_PER_DRY_SPIN * spawnDryStreak);
}

/** Draw one bottle type from the weighted BOTTLE_TYPES table. */
function drawBottleType(rng) {
  const total = BOTTLE_TYPES.reduce((sum, t) => sum + t.weight, 0);
  let roll = rng() * total;
  for (const t of BOTTLE_TYPES) {
    roll -= t.weight;
    if (roll < 0) return t;
  }
  return BOTTLE_TYPES[BOTTLE_TYPES.length - 1];
}

/**
 * Fresh bottle-meter state.
 * - spinCount: total spins observed.
 * - spawnDryStreak: consecutive spins without a bottle spawn.
 * - fill: current meter value in [0, METER_MAX). Fills gradually, never leaks.
 * @returns {{spinCount:number, spawnDryStreak:number, fill:number}}
 */
export function createBottleState() {
  return { spinCount: 0, spawnDryStreak: 0, fill: 0 };
}

/**
 * Advance the meter by one spin. Pure: does not mutate the input state.
 *
 * Order of operations (fixed for provably-fair rng replay):
 * 1. Roll spawn chance; a spawned bottle rolls its TYPE (beer/wine/moonshine).
 * 2. The bottle raises the meter by its type's `fill` (every bottle counts).
 * 3. If the meter reaches METER_MAX, trigger free spins and carry the overflow
 *    over into the next cycle (fill -= METER_MAX).
 *
 * @param {{spinCount?:number, spawnDryStreak?:number, fill?:number}} state
 * @param {() => number} [rng=Math.random] - Float source in [0, 1).
 * @returns {{
 *   state: {spinCount:number, spawnDryStreak:number, fill:number},
 *   bottleSpawned: boolean,
 *   bottleType: {id:string, fill:number, weight:number}|null,
 *   triggerEvent: boolean,
 *   fill: number,
 *   fillFraction: number
 * }}
 */
export function tickBottle(state, rng = Math.random) {
  const spinCount = (state.spinCount || 0) + 1;
  let spawnDryStreak = state.spawnDryStreak || 0;
  let fill = state.fill || 0;

  const bottleSpawned = rng() < spawnChance(spawnDryStreak);
  let bottleType = null;

  if (bottleSpawned) {
    spawnDryStreak = 0;
    bottleType = drawBottleType(rng);
    fill += bottleType.fill;
  } else {
    spawnDryStreak += 1;
  }

  const triggerEvent = fill >= METER_MAX;
  if (triggerEvent) fill -= METER_MAX; // overflow carries over — nothing wasted

  const fillFraction = Math.min(1, fill / METER_MAX);

  return {
    state: { spinCount, spawnDryStreak, fill },
    bottleSpawned,
    bottleType,
    triggerEvent,
    fill,
    fillFraction,
  };
}
