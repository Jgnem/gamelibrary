// Drunk Farmer — math constants.
// Data only, sourced from src/math/math.json. No logic lives here.

/**
 * Unique identifier for this game's math model.
 */
export const GAME_ID = 'drunk_farmer';

/**
 * Version of the math model these constants describe.
 */
export const VERSION = '0.1.0';

/**
 * Board dimensions (columns × rows) for the cluster grid.
 */
export const GRID = { cols: 6, rows: 6 };

/**
 * Minimum number of matching symbols required to form a paying cluster.
 */
export const CLUSTER_MIN = 5;

/**
 * Target return-to-player as a fraction (0.95 = 95%).
 */
export const RTP_TARGET = 0.95;

/**
 * Hard cap on total win for a single round, expressed as a bet multiplier.
 */
export const MAX_WIN = 5000;

/**
 * Relative spawn weights for each symbol on the grid. Higher `freq` means the
 * symbol appears more often. `wld` is the wild — depicted as a CHICKEN in the
 * base game (it replaced the old Farmer/Wild art) — and substitutes for pay
 * symbols. Every base-game wild is a chicken the farmer can shoot at (see
 * CHICKEN_SHOT below).
 */
export const SYMBOL_WEIGHTS = {
  10: 12,
  J: 12,
  Q: 10,
  K: 10,
  A: 8,
  hay: 7,
  cas: 6,
  pit: 5,
  dog: 4,
  wld: 3,
};

/**
 * Cluster paytable keyed by symbol id. Each array is indexed by cluster size,
 * giving the payout (as a bet multiplier) for that many matching symbols.
 * Index 0–4 are zero since clusters start paying at CLUSTER_MIN (5).
 * `wld` has no paytable of its own (it only substitutes).
 */
// Uniformly scaled ×0.8308 in the mechanics-diet pass (measured 114.34%
// pre-trim at 1M spins): funds the guaranteed free-spins chickens and the
// steeper top shot tier, with golden chicken + cross-multiply cut in the same
// pass. Earlier trims: ×0.9603 (free-spins pass), ×0.4669 (fat-tail), ×0.6993
// (rare-but-big). Still PLACEHOLDER — final shaping in a later pass.
export const PAYTABLE = {
  10: [0, 0, 0, 0, 0.0694, 0.1168, 0.1862, 0.2811, 0.4199, 0.6078, 0.8415, 1.1683, 1.6356, 2.3366, 3.0376],
  J: [0, 0, 0, 0, 0.0694, 0.1168, 0.1862, 0.2811, 0.4199, 0.6078, 0.8415, 1.1683, 1.6356, 2.3366, 3.0376],
  Q: [0, 0, 0, 0, 0.0931, 0.1643, 0.2574, 0.3979, 0.6078, 0.8872, 1.2614, 1.7762, 2.5703, 3.5049, 4.6731],
  K: [0, 0, 0, 0, 0.0931, 0.1643, 0.2574, 0.3979, 0.6078, 0.8872, 1.2614, 1.7762, 2.5703, 3.5049, 4.6731],
  A: [0, 0, 0, 0, 0.1406, 0.2336, 0.3742, 0.5605, 0.8415, 1.2614, 1.7762, 2.5703, 3.5049, 4.9069, 6.5425],
  hay: [0, 0, 0, 0, 0.2811, 0.4673, 0.7484, 1.1683, 1.7762, 2.5703, 3.7386, 5.3741, 7.4771, 10.281, 13.0849],
  cas: [0, 0, 0, 0, 0.4673, 0.7941, 1.2614, 1.9624, 3.0376, 4.4396, 6.3088, 9.1127, 12.6176, 17.5245, 22.4313],
  pit: [0, 0, 0, 0, 0.8415, 1.402, 2.2435, 3.5049, 5.3741, 7.9443, 11.2156, 16.1225, 22.4313, 31.3104, 40.1894],
  dog: [0, 0, 0, 0, 1.402, 2.3366, 3.7386, 5.8415, 8.879, 13.0849, 18.6927, 26.8708, 37.3855, 52.3396, 67.2937],
};

/**
 * Bottle mechanic. Each spin can spawn a bottle. The spawn chance starts at
 * BASE_SPAWN_CHANCE and rises by SPAWN_RISE_PER_DRY_SPIN for each consecutive
 * spin without a bottle, capped at 1.0. EVERY bottle contains alcohol — there
 * are no empty bottles (the old full/empty roll and its cork-sniff consolation
 * are removed). What varies is the DRINK: a spawned bottle draws its type from
 * BOTTLE_TYPES and raises the meter by that type's `fill`.
 *
 * LOW-PITY TUNING (fat-tail bottle pass): the old 0.04 base + 0.05/dry-spin
 * pity made a bottle land almost deterministically every ~5-6 spins — low
 * variance, no hope. Now the base is higher and the pity ramp much flatter:
 * same average gap (~6.4 spins → meter cycle still ~60 paid spins) but real
 * hot streaks and dry spells, so every spin's roll feels live again.
 */
export const BASE_SPAWN_CHANCE = 0.08;
export const SPAWN_RISE_PER_DRY_SPIN = 0.02;

/**
 * Gradual bottle meter. METER_MAX is the full mark (treat as 100%); each
 * bottle raises the meter by its type's `fill`. The meter never leaks; when it
 * reaches METER_MAX the overflow CARRIES OVER (fill -= METER_MAX — no alcohol
 * is wasted) and FREE_SPINS are queued.
 */
export const METER_MAX = 100; // PLACEHOLDER — TO BE BALANCED (full mark = 100%).

/**
 * Weighted bottle types — the anticipation ladder at every spawn. Beer is the
 * common small sip, wine the mid pour, moonshine the rare gut-punch. The FAT
 * TAIL: the jug (half the meter in one pull) and the barrel (the WHOLE meter —
 * an instant free-spins trigger, theoretically possible on spin 1). Fills are
 * % of METER_MAX. Avg fill/bottle ≈ 10.6 with a bottle every ~6.4 spins →
 * meter cycle still ≈ 60 paid spins. PLACEHOLDER — TO BE BALANCED.
 */
// `label` is the player-facing name (the Buzz scale); `id` is the stable
// internal key that picks sprite tint, glow colour and reveal size in the UI.
export const BOTTLE_TYPES = [
  { id: 'beer', label: 'Small Buzz', fill: 5, weight: 58 }, // PLACEHOLDER — TO BE BALANCED
  { id: 'wine', label: 'Big Buzz', fill: 12, weight: 29 }, // PLACEHOLDER — TO BE BALANCED
  { id: 'moonshine', label: 'Mega Buzz', fill: 25, weight: 10 }, // PLACEHOLDER — TO BE BALANCED
  { id: 'jug', label: 'Ultra Buzz', fill: 50, weight: 2.5 }, // fat tail: ~1 bottle in 40 — PLACEHOLDER
  { id: 'barrel', label: 'Full Buzz', fill: 100, weight: 0.5 }, // fat tail: ~1 in 200 — full meter in one go
];

export const BOTTLE = {
  BASE_SPAWN_CHANCE,
  SPAWN_RISE_PER_DRY_SPIN,
  METER_MAX,
  BOTTLE_TYPES,
};

// ---------------------------------------------------------------------------
// BASE GAME — chicken shot mechanic. Every wild on the base-game board is a
// CHICKEN and works as a wild whether shot or not (substitutes, helps form
// clusters). A chicken is SHOT only when it is part of a WINNING CLUSTER: one
// shot roll is made per chicken that lands in a cluster, at a chance that
// scales with the bottle meter's fill level entering the spin (fuller farmer =
// more shooting). A SHOT chicken buffs the WHOLE cluster it is in — the
// cluster win is multiplied by the buff value on its cell. A chicken not in
// any winning cluster (or in one but unshot) is just a normal wild with no
// buff. ALL values PLACEHOLDER — TO BE BALANCED.
// ---------------------------------------------------------------------------

/**
 * Chicken-shot tunables.
 * - fill_tiers: stepped fill→shot curve. The tier is the LAST entry whose
 *   `min_fill` is <= the meter fill entering the spin (tiers sit at thirds of
 *   METER_MAX; bottles now fill in variable BOTTLE_TYPES steps). `shot_chance`
 *   is rolled once per chicken that is part of a winning cluster this spin.
 * - buff_values: weighted buff carried by a SHOT chicken's cell. The whole
 *   cluster win is multiplied by it; several shot cells in one cluster SUM
 *   their values. RARE-BUT-BIG design: shots are uncommon, so each one is made
 *   to feel like an event — the values are big and the paytable is trimmed to
 *   pay for them, rather than making shots frequent-but-tiny (which measured
 *   as invisible).
 *
 * TANGIBLE-METER TUNING: the top tier is deliberately steep (30%) — a 2.5% vs
 * 12.5% spread was statistically invisible over a session. A full-ish meter
 * must be FELT: at 30% per clustered chicken the farmer visibly shoots more
 * when he's loaded, which is the game's core promise.
 */
export const CHICKEN_SHOT = {
  fill_tiers: [
    { min_fill: 0, shot_chance: 0.025 }, // PLACEHOLDER — TO BE BALANCED
    { min_fill: 34, shot_chance: 0.08 }, // PLACEHOLDER — TO BE BALANCED
    { min_fill: 68, shot_chance: 0.3 }, // PLACEHOLDER — TO BE BALANCED
  ],
  buff_values: [
    { value: 3, weight: 70 },
    { value: 5, weight: 25 },
    { value: 10, weight: 5 },
  ],
};

// ---------------------------------------------------------------------------
// BASE GAME — persistent chicken buffs: PERSIST-UNTIL-USED. A shot chicken's
// buff multiplies its cluster on the spin it is shot, then STAYS on its CELL
// (the cell itself, not a lingering wild — next spin the cell holds a normal
// random symbol) as a visible ×N badge. It waits there, across as many spins
// as it takes, until a winning cluster covers the cell again: that cluster's
// win is multiplied and the buff is CONSUMED. One buff = exactly two payoffs
// (birth cluster + one future cluster), so the cost per buff is bounded and
// the board can never saturate. A fresh shot landing on a cell already
// holding a waiting buff SUMS onto it, capped at `max_value`.
// ALL values PLACEHOLDER — TO BE BALANCED.
// ---------------------------------------------------------------------------
export const PERSISTENT_BUFF = {
  max_value: 25, // PLACEHOLDER — TO BE BALANCED (cap for stacking AND fermenting; raised 10→25 in the fat-tail pass)
  // FERMENTING: a waiting buff that survives `ferment_interval` spins without
  // being consumed grows by `ferment_amount` (again each interval), capped at
  // max_value. Turns dead waiting time into anticipation; cost stays bounded
  // because the buff still pays only once more.
  ferment_interval: 10, // PLACEHOLDER — TO BE BALANCED (spins waited per growth step)
  ferment_amount: 1, // PLACEHOLDER — TO BE BALANCED (value added per growth step)
  // CROSS-MULTIPLY was CUT in the mechanics-diet pass: it fired too rarely to
  // be perceived and its budget went back into the base paytable.
};

// ---------------------------------------------------------------------------
// BASE GAME — cascade escalation. Base spins now run up to CASCADE.max_steps
// tumble steps (raised from 4 in the fat-tail pass), and each step's cluster
// wins are multiplied by the step's entry in `step_multipliers`
// (index = cascade level - 1). Early steps ×1 keep the common outcomes and the
// hit rate untouched; the tail (long chains, fed by temporary wilds) is where
// the money moved. Funded by the uniform paytable trim.
// ---------------------------------------------------------------------------
export const CASCADE = {
  max_steps: 7, // PLACEHOLDER — TO BE BALANCED (hard cap on base-spin cascade steps)
  // Softer curve than the first draft ([1,1,2,3,5,8,10] measured +98pp RTP —
  // temporary wilds guarantee chain extension at levels 4+, so late steps are
  // common enough that big early multipliers blow the budget).
  step_multipliers: [1, 1, 1, 2, 2, 3, 4], // PLACEHOLDER — TO BE BALANCED (per cascade level)
};

// ---------------------------------------------------------------------------
// GOLDEN CHICKEN was CUT in the mechanics-diet pass: rare × rare (~1 in 10k+
// spins) with a modest payoff — it spent dream-budget without buying a dream.
// Its RTP went back into the base paytable.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BASE GAME — FREE SPINS (rampage-freespins) driven by the bottle meter.
// When the meter tops out, the overflow carries over and the NEXT `count`
// spins are FREE SPINS: no bet, and the farmer shoots EVERY chicken that lands
// in a winning cluster (`shot_chance` 1.0 — the rampage stretched into a real
// casino feature). Replaces the old single-spin rampage AND the cork sniff.
// ---------------------------------------------------------------------------
export const FREE_SPINS = {
  count: 5, // PLACEHOLDER — TO BE BALANCED (free spins per meter cycle)
  shot_chance: 1, // every clustered chicken is shot during a free spin
  // GUARANTEED CHICKENS: every free-spin board is topped up to at least this
  // many chickens before the tumble. The feature's promise is "the farmer
  // shoots everything" — without targets that promise paid near-zero (the
  // anticlimax problem: 60 spins of waiting met by 5 ordinary spins).
  guaranteed_chickens: 3, // PLACEHOLDER — TO BE BALANCED
  // Free-spin shots buff their birth clusters as usual, but the spray-and-pray
  // buffs do NOT persist as waiting badges (one payoff, not two) — same budget
  // reasoning as the old rampage, now over 5 spins instead of 1.
  buffs_persist: false,
  // The bottle meter is FROZEN during free spins (no bottle spawns, no fill
  // change) — the farmer is busy shooting, not drinking.
  meter_frozen: true,
};

// DRUNK MODE was fully REMOVED in the mechanics-diet pass (constants, math
// module and animator deleted). Recover from git history if it ever returns.
