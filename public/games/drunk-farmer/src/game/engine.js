// Drunk Farmer — main game state machine.
//
// Orchestrates spins end to end. A spin builds + tumbles the grid, resolves the
// farmer's chicken shots on the winning clusters, and ticks the bottle meter.
//
// FREE SPINS (rampage-freespins): when the bottle meter tops out, the overflow
// carries over and the next FREE_SPINS.count spins are FREE — no bet, the
// board is topped up to FREE_SPINS.guaranteed_chickens chickens, and the
// farmer shoots EVERY chicken that lands in a winning cluster (shot chance
// 1.0). This replaces both the old single-spin RAMPAGE and the cork-sniff tier
// boost (empty bottles no longer exist — every bottle fills the meter by its
// type's amount). During free spins the meter is frozen (no bottle spawns).
//
// NOTE: DRUNK MODE was fully removed in the mechanics-diet pass (recover from
// git history if it returns). GOLDEN CHICKEN and CROSS-MULTIPLY were cut in
// the same pass — their budget went back into the base paytable.
//
// Pure logic, no UI. Imports only from the math modules (no direct grid.js).

import { createGrid, runTumble } from '../math/tumble.js';
import { createBottleState, tickBottle } from '../math/bottle.js';
import {
  resolveChickenShots,
  mergePersistentBuffs,
  settleBuffs,
  applyWildMultipliers,
  WILD,
} from '../math/chickenShot.js';
import { generateServerSeed, generateClientSeed } from '../math/rng.js';
import { MAX_WIN, METER_MAX, FREE_SPINS, GRID } from '../math/constants.js';

/**
 * State-machine phases a spin moves through.
 * Base spin: IDLE → SPINNING → TUMBLING → RESULT.
 */
export const PHASES = Object.freeze({
  IDLE: 'IDLE',
  SPINNING: 'SPINNING',
  TUMBLING: 'TUMBLING',
  RESULT: 'RESULT',
});

/**
 * Build the initial, persistent game state. Server/client seeds are generated
 * once here (provably-fair commitment); the nonce advances per spin.
 * `persistentBuffs` holds base-game "hot cell" chicken buffs that survive
 * across paid spins (see chickenShot.js). `freeSpins` tracks the meter-topped
 * free-spins feature: `remaining` spins left, `total` in the current feature,
 * `sessionWin` accumulated across the feature's spins (capped at MAX_WIN).
 * @returns {{
 *   phase: string,
 *   bottle: object,
 *   persistentBuffs: {row:number, col:number, value:number}[],
 *   freeSpins: {remaining:number, total:number, sessionWin:number},
 *   seeds: {serverSeed:string, clientSeed:string, nonce:number},
 *   spinCount: number,
 *   lastResult: object|null
 * }}
 */
export function createGameState() {
  return {
    phase: PHASES.IDLE,
    bottle: createBottleState(),
    persistentBuffs: [],
    freeSpins: { remaining: 0, total: 0, sessionWin: 0 },
    seeds: {
      serverSeed: generateServerSeed(),
      clientSeed: generateClientSeed(),
      nonce: 0,
    },
    spinCount: 0,
    lastResult: null,
  };
}

/**
 * Top a free-spin grid up to FREE_SPINS.guaranteed_chickens wilds. Counts the
 * chickens that landed naturally and converts random non-wild cells until the
 * minimum is met — the feature's promise is "the farmer shoots everything",
 * which needs targets on the board. Mutates `grid` in place (it is this spin's
 * fresh board, not shared state). Cell picks consume rng in fixed order for
 * provably-fair replay.
 */
function guaranteeChickens(grid, rng) {
  const nonWild = [];
  let wildCount = 0;
  for (let r = 0; r < GRID.rows; r += 1) {
    for (let c = 0; c < GRID.cols; c += 1) {
      if (grid[r][c] === WILD) wildCount += 1;
      else nonWild.push({ row: r, col: c });
    }
  }
  let missing = FREE_SPINS.guaranteed_chickens - wildCount;
  while (missing > 0 && nonWild.length > 0) {
    const i = Math.floor(rng() * nonWild.length);
    const { row, col } = nonWild[i];
    nonWild.splice(i, 1);
    grid[row][col] = WILD;
    missing -= 1;
  }
}

/** Advance seeds/spin counters into the next persistent state. */
function nextBookkeeping(state, result) {
  const nonce = state.seeds.nonce + 1;
  return {
    phase: PHASES.RESULT,
    seeds: { ...state.seeds, nonce },
    spinCount: state.spinCount + 1,
    lastResult: result,
  };
}

/**
 * Run one spin. Pure: the input state is not mutated.
 *
 * A spin: (1) create the grid and run the tumble, (2) resolve the farmer's
 * chicken shots on the chickens that landed in winning clusters, re-scoring the
 * buffed clusters, (3) tick the bottle meter (frozen on free spins; a topped
 * meter queues FREE_SPINS.count free spins and carries the overflow).
 *
 * A FREE spin (state.freeSpins.remaining > 0) costs no bet, tops the board up
 * to FREE_SPINS.guaranteed_chickens chickens, shoots every clustered chicken
 * (shot chance 1.0) and never persists its fresh buffs as waiting badges.
 * Waiting badges from earlier paid spins still work (and are consumed)
 * normally.
 *
 * Provably-fair note: `rng` is a float source in [0, 1). For a verifiable
 * round, derive it from this spin's seeds — precompute `hash = await
 * hashSeeds(server, client, nonce)` and pass `rng = () => seedToFloat(hash,
 * i++)`. The returned `seedInfo` reports the triple so the outcome can be
 * re-checked with verify().
 *
 * @param {object} state - Current game state (from createGameState/previous spin).
 * @param {() => number} [rng=Math.random] - Float source in [0, 1).
 * @returns {{ state: object, result: object }}
 */
export function spin(state, rng = Math.random) {
  const freeSpinsState = state.freeSpins || { remaining: 0, total: 0, sessionWin: 0 };
  const isFreeSpin = freeSpinsState.remaining > 0;

  // 1. Grid + tumble cascade, THEN chicken shots. Every wild on the board is a
  // chicken — a working wild whether shot or not — so the tumble runs normally
  // (chickens substitute and form clusters like any wild).
  //
  // PERSISTENT BUFFS — PERSIST-UNTIL-USED: buffs carried from previous spins
  // wait on their CELLS (the cells hold normal random symbols this spin — no
  // wild forcing). They are merged with this spin's fresh shots into the buff
  // set the scoring uses; settleBuffs then settles: a fresh buff starts
  // waiting, a waiting buff whose cell a winning cluster covered this spin has
  // paid its second (and final) time and is consumed, and an uncovered waiting
  // buff keeps waiting.
  const grid = createGrid();
  // Free spins guarantee targets: top the board up to the minimum chicken
  // count before the tumble (the climax must have something to shoot).
  if (isFreeSpin) guaranteeChickens(grid, rng);
  const tumbleResult = runTumble(grid, rng, {
    persistentStickyWilds: true,
    temporaryWilds: true,
  });
  const chickenShots = resolveChickenShots(tumbleResult, state.bottle.fill, rng, {
    freeSpin: isFreeSpin,
  });
  const effectiveBuffs = mergePersistentBuffs(state.persistentBuffs, chickenShots.buffed);
  // Re-score the tumble: a cluster covering buffed cells has its WHOLE win
  // multiplied by the SUM of the covered cells' values. Step wins carry the
  // cascade escalation multiplier from runTumble. Once-per-cell is enforced in
  // applyWildMultipliers: one buff = exactly two payoffs.
  const { win: baseWin, boostedClusters } = applyWildMultipliers(tumbleResult, effectiveBuffs);
  // Free-spin buffs are one-payoff-only (no waiting badge) unless configured.
  const nextPersistentBuffs = settleBuffs(effectiveBuffs, chickenShots.buffed, tumbleResult, {
    persistFresh: !isFreeSpin || FREE_SPINS.buffs_persist,
  });

  // 2. Bottle meter. FROZEN during free spins (the farmer is shooting, not
  // drinking). On paid spins it ticks as usual; topping out queues
  // FREE_SPINS.count free spins and the overflow carries over.
  let bottleTick;
  let nextFreeSpins;
  if (isFreeSpin && FREE_SPINS.meter_frozen) {
    bottleTick = {
      state: state.bottle,
      bottleSpawned: false,
      bottleType: null,
      triggerEvent: false,
      fill: state.bottle.fill,
      fillFraction: Math.min(1, (state.bottle.fill || 0) / METER_MAX),
    };
  } else {
    bottleTick = tickBottle(state.bottle, rng);
  }

  // 3. Cap total win. Free spins additionally cap the FEATURE total: the whole
  // free-spins session (this spin included) never pays past MAX_WIN.
  // PLACEHOLDER round-cap semantics — revisit when the win cap is finalised.
  let totalWin = Math.min(baseWin, MAX_WIN);
  let freeSpinsResult = null;
  if (isFreeSpin) {
    const sessionBefore = freeSpinsState.sessionWin;
    totalWin = Math.min(totalWin, MAX_WIN - sessionBefore);
    const sessionWin = sessionBefore + totalWin;
    const remaining = freeSpinsState.remaining - 1;
    freeSpinsResult = {
      index: freeSpinsState.total - freeSpinsState.remaining + 1, // 1-based
      total: freeSpinsState.total,
      remaining,
      sessionWin,
    };
    nextFreeSpins =
      remaining > 0
        ? { remaining, total: freeSpinsState.total, sessionWin }
        : { remaining: 0, total: 0, sessionWin: 0 };
  } else if (bottleTick.triggerEvent) {
    nextFreeSpins = { remaining: FREE_SPINS.count, total: FREE_SPINS.count, sessionWin: 0 };
  } else {
    nextFreeSpins = freeSpinsState;
  }

  const seedInfo = {
    serverSeed: state.seeds.serverSeed,
    clientSeed: state.seeds.clientSeed,
    nonce: state.seeds.nonce + 1,
  };

  const result = {
    baseWin,
    totalWin,
    isFreeSpin,
    seedInfo,
    grid,
    tumble: tumbleResult,
    // Chicken-shot block: per-chicken rolls, shot (buffed) cells and the
    // clusters they multiplied. `baseWinRaw` is the unmultiplied tumble win.
    chickenShots,
    boostedClusters,
    // Free-spins bookkeeping: `freeSpins` describes THIS spin when it is a
    // free spin (index/total/remaining/sessionWin); `freeSpinsQueued` is the
    // number of free spins a topped meter just queued (UI trigger hook).
    freeSpins: freeSpinsResult,
    freeSpinsQueued: !isFreeSpin && bottleTick.triggerEvent ? FREE_SPINS.count : 0,
    baseWinRaw: tumbleResult.totalWin,
    // Persistent "hot cell" buffs: `effectiveBuffs` is what this spin's
    // scoring actually used (carried-over + this spin's fresh shots, merged);
    // it settles into `persistentBuffs` — what carries into the next spin.
    effectiveBuffs,
    persistentBuffs: nextPersistentBuffs,
    cascadeLevel: tumbleResult.cascadeLevel,
    cascadeLog: tumbleResult.cascadeLog,
    temporaryWildCount: tumbleResult.temporaryWildCount,
    bottle: {
      spawned: bottleTick.bottleSpawned,
      type: bottleTick.bottleType,
      fill: bottleTick.fill,
      fillFraction: bottleTick.fillFraction,
      // The meter topped out this spin — free spins are queued (overflow kept).
      meterReset: bottleTick.triggerEvent,
      frozen: isFreeSpin && FREE_SPINS.meter_frozen,
    },
    phases: [PHASES.SPINNING, PHASES.TUMBLING, PHASES.RESULT],
  };

  const newState = {
    ...state,
    ...nextBookkeeping(state, result),
    bottle: bottleTick.state,
    persistentBuffs: nextPersistentBuffs,
    freeSpins: nextFreeSpins,
  };

  return { state: newState, result };
}
