// QA ONLY
//
// Monte-Carlo sanity check for the math model. Runs several independent batches
// of spins through the real engine and reports RTP as a mean +/- spread, so a
// single noisy sample can't be mistaken for a real RTP change. Free spins cost
// no bet, so RTP = total win / PAID spins: Base RTP counts paid-spin wins only,
// Total RTP adds the free-spins wins on top (both over the paid-spin count).
// Not part of the game UI - tuning only.

import { createGameState, spin } from '../game/engine.js';
import { scoreCluster } from './tumble.js';
import { SYMBOL_WEIGHTS } from './constants.js';

const PAY_SYMBOLS = Object.keys(SYMBOL_WEIGHTS).filter((symbol) => symbol !== 'wld');

function cellKey(row, col) {
  return `${row},${col}`;
}

/** Mean of an array. */
function mean(arr) {
  return arr.reduce((s, x) => s + x, 0) / arr.length;
}

/** Population standard deviation of an array. */
function stddev(arr) {
  const m = mean(arr);
  return Math.sqrt(mean(arr.map((x) => (x - m) ** 2)));
}

/** Summarise an array of per-batch RTPs: mean, sd, min, max. */
function summarise(arr) {
  return { mean: mean(arr), sd: stddev(arr), min: Math.min(...arr), max: Math.max(...arr) };
}

function createBreakdown() {
  return {
    bySymbol: Object.fromEntries(PAY_SYMBOLS.map((symbol) => [symbol, 0])),
    multiplierWin: 0,
    firstCascadeWin: 0,
    laterCascadeWin: 0,
    clusterCount: 0,
    clusterCells: 0,
    maxClusterSize: 0,
    cascadeCount: 0,
  };
}

function addSpinBreakdown(breakdown, result) {
  const buffByCell = new Map(
    (result.effectiveBuffs || []).map((buff) => [cellKey(buff.row, buff.col), buff.value])
  );

  breakdown.cascadeCount += result.tumble.steps.length;

  result.tumble.steps.forEach((step, stepIndex) => {
    for (const cluster of step.clusters) {
      const rawWin = scoreCluster(cluster);
      let buffSum = 0;
      for (const cell of cluster.cells) {
        buffSum += buffByCell.get(cellKey(cell.row, cell.col)) || 0;
      }

      const factor = buffSum > 0 ? buffSum : 1;
      const boostedWin = rawWin * factor;
      breakdown.bySymbol[cluster.symbol] += boostedWin;
      breakdown.multiplierWin += rawWin * (factor - 1);
      if (stepIndex === 0) breakdown.firstCascadeWin += boostedWin;
      else breakdown.laterCascadeWin += boostedWin;
      breakdown.clusterCount += 1;
      breakdown.clusterCells += cluster.cells.length;
      if (cluster.cells.length > breakdown.maxClusterSize) {
        breakdown.maxClusterSize = cluster.cells.length;
      }
    }
  });
}

function runScenario({ batches, spinsPerBatch, rng, clearPersistentBuffs }) {
  const totalRtps = [];
  const baseRtps = [];
  let hits = 0;
  let maxWin = 0;
  let paidSpins = 0;
  let freeSpins = 0;
  let freeSpinTriggers = 0;
  let freeSpinWinSum = 0;
  let allSpins = 0;
  let chickens = 0;
  let chickensShot = 0;
  let buffedSpins = 0;
  let buffCountSamples = 0;
  let buffLifetimesCompleted = 0;
  let buffLifetimesSurvived2Plus = 0;
  const breakdown = createBreakdown();

  // `spinsPerBatch` counts PAID spins — free spins run extra so RTP's
  // denominator (bets placed) is exact.
  for (let b = 0; b < batches; b += 1) {
    let state = createGameState();
    let sumTotal = 0;
    let sumBase = 0;
    const buffStreaks = new Map();

    let paidThisBatch = 0;
    while (paidThisBatch < spinsPerBatch) {
      const { state: next, result } = spin(state, rng);
      state = clearPersistentBuffs ? { ...next, persistentBuffs: [] } : next;

      sumTotal += result.totalWin;
      if (result.isFreeSpin) {
        freeSpins += 1;
        freeSpinWinSum += result.totalWin;
      } else {
        paidThisBatch += 1;
        paidSpins += 1;
        sumBase += result.totalWin;
        if (result.freeSpinsQueued > 0) freeSpinTriggers += 1;
      }
      allSpins += 1;
      if (result.totalWin > 0) hits += 1;
      if (result.totalWin > maxWin) maxWin = result.totalWin;
      addSpinBreakdown(breakdown, result);

      if (result.chickenShots) {
        chickens += result.chickenShots.chickenCount;
        chickensShot += result.chickenShots.shotCount;
        if (result.chickenShots.shotCount > 0) buffedSpins += 1;

        const persisted = clearPersistentBuffs ? [] : result.persistentBuffs;
        buffCountSamples += persisted.length;
        const currentKeys = new Set(persisted.map((buff) => cellKey(buff.row, buff.col)));
        for (const [key, streak] of buffStreaks) {
          if (currentKeys.has(key)) continue;
          buffLifetimesCompleted += 1;
          if (streak >= 2) buffLifetimesSurvived2Plus += 1;
          buffStreaks.delete(key);
        }
        for (const key of currentKeys) {
          buffStreaks.set(key, (buffStreaks.get(key) || 0) + 1);
        }
      }
    }

    for (const streak of buffStreaks.values()) {
      buffLifetimesCompleted += 1;
      if (streak >= 2) buffLifetimesSurvived2Plus += 1;
    }

    // RTP over bets: total (paid + free wins) / paid spins; base = paid only.
    totalRtps.push(sumTotal / spinsPerBatch);
    baseRtps.push(sumBase / spinsPerBatch);
  }

  return {
    total: summarise(totalRtps),
    base: summarise(baseRtps),
    hitRate: hits / allSpins,
    maxWin,
    freeSpins: {
      triggers: freeSpinTriggers,
      spins: freeSpins,
      triggerRate: paidSpins ? freeSpinTriggers / paidSpins : 0,
      avgWinPerFreeSpin: freeSpins ? freeSpinWinSum / freeSpins : 0,
      rtpContribution: paidSpins ? freeSpinWinSum / paidSpins : 0,
    },
    chickenShots: {
      baseSpins: paidSpins,
      chickensPerSpin: chickens / allSpins,
      shotRatePerChicken: chickens ? chickensShot / chickens : 0,
      buffedSpinRate: buffedSpins / allSpins,
    },
    persistentBuffs: {
      avgOnBoard: buffCountSamples / allSpins,
      survivalRate2Plus: buffLifetimesCompleted
        ? buffLifetimesSurvived2Plus / buffLifetimesCompleted
        : 0,
      lifetimesCompleted: buffLifetimesCompleted,
    },
    breakdown,
  };
}

/**
 * Run several batches of spins and log a stable, averaged estimate. Assumes a
 * flat bet of 1 per spin, so RTP == mean win. Each batch starts a fresh game
 * state (independent seeds), and per-batch RTPs are aggregated into mean +/-
 * sd and a min-max range.
 *
 * @param {number} [batches=10] - Number of independent batches.
 * @param {number} [spinsPerBatch=100000] - Spins per batch.
 * @param {() => number} [rng=Math.random] - Float source in [0, 1).
 * @returns {object} The computed metrics (also logged to the console).
 */
export function runVerification(batches = 10, spinsPerBatch = 100000, rng = Math.random) {
  // Total RTP = paid + free-spin wins over paid spins; Base RTP = paid-spin
  // wins only. The difference is the free-spins feature's contribution.
  const started = Date.now();
  const current = runScenario({ batches, spinsPerBatch, rng, clearPersistentBuffs: false });
  const noCarry = runScenario({ batches, spinsPerBatch, rng, clearPersistentBuffs: true });
  const elapsedMs = Date.now() - started;
  const totalSpins = batches * spinsPerBatch;

  const metrics = {
    batches,
    spinsPerBatch,
    totalSpins,
    total: current.total,
    base: current.base,
    hitRate: current.hitRate,
    maxWin: current.maxWin,
    elapsedMs,
    freeSpins: current.freeSpins,
    chickenShots: current.chickenShots,
    persistentBuffs: current.persistentBuffs,
    breakdown: current.breakdown,
    noPersistentBuffCarry: noCarry.base,
    persistentBuffDelta: current.base.mean - noCarry.base.mean,
  };

  const pct = (x) => `${(x * 100).toFixed(2)}%`;
  const pp = (x) => `${(x * 100).toFixed(2)} pp`;
  const line = (label, s) =>
    `${label.padEnd(12)} mean ${pct(s.mean).padStart(7)}  sd ${(s.sd * 100).toFixed(2).padStart(5)}  ` +
    `range [${pct(s.min)} - ${pct(s.max)}]`;

  console.log(
    `=== Drunk Farmer QA - ${batches} x ${spinsPerBatch.toLocaleString()} spins ` +
      `(${totalSpins.toLocaleString()} total, ${elapsedMs} ms) ===`
  );
  console.log(line('Total RTP:', metrics.total));
  console.log(line('Base RTP:', metrics.base));
  console.log(`Hit rate:    ${pct(metrics.hitRate)}`);
  console.log(`Max win:     ${metrics.maxWin.toFixed(2)}x`);
  const fs = metrics.freeSpins;
  console.log(
    `Free spins:  trigger 1 in ${fs.triggerRate ? Math.round(1 / fs.triggerRate).toLocaleString() : '∞'} paid spins, ` +
      `${fs.spins.toLocaleString()} free spins played, ` +
      `avg ${fs.avgWinPerFreeSpin.toFixed(2)}x per free spin, ` +
      `feature adds ${pp(fs.rtpContribution)} RTP`
  );
  const cs = metrics.chickenShots;
  console.log(
    `Chicken shots: ${cs.chickensPerSpin.toFixed(2)} clustered chickens/spin, ` +
      `shot ${pct(cs.shotRatePerChicken)} of them, ` +
      `>=1 buffed cluster on ${pct(cs.buffedSpinRate)} of base spins`
  );
  const pb = metrics.persistentBuffs;
  console.log(
    `Persistent buffs: ${pb.avgOnBoard.toFixed(3)} avg hot cells/spin, ` +
      `${pct(pb.survivalRate2Plus)} of buff lifetimes survive >=2 spins ` +
      `(${pb.lifetimesCompleted.toLocaleString()} lifetimes sampled)`
  );

  console.log('\n--- Base RTP leak breakdown (uncapped base wins, real engine) ---');
  console.log('RTP by symbol (percentage points of Base RTP):');
  const symbolRows = Object.entries(metrics.breakdown.bySymbol)
    .sort((a, b) => b[1] - a[1])
    .map(([symbol, win]) => ({ symbol, pp: win / totalSpins }));
  for (const row of symbolRows) {
    console.log(`  ${row.symbol.padEnd(3)} ${pp(row.pp).padStart(9)}`);
  }

  console.log('\nPersistent buff carry control:');
  console.log(`  current carry+stack: ${pct(metrics.base.mean)} Base RTP`);
  console.log(`  clear after spin:    ${pct(metrics.noPersistentBuffCarry.mean)} Base RTP`);
  console.log(`  isolated delta:      ${pp(metrics.persistentBuffDelta)}`);

  console.log('\nChicken-shot multiplier contribution:');
  console.log(`  total uplift from buff multipliers: ${pp(metrics.breakdown.multiplierWin / totalSpins)}`);

  const cascadeTotal = metrics.breakdown.firstCascadeWin + metrics.breakdown.laterCascadeWin;
  const laterShare = cascadeTotal ? metrics.breakdown.laterCascadeWin / cascadeTotal : 0;
  const firstShare = cascadeTotal ? metrics.breakdown.firstCascadeWin / cascadeTotal : 0;
  console.log('\nCascade payout split:');
  console.log(
    `  first hit: ${pp(metrics.breakdown.firstCascadeWin / totalSpins)} ` +
      `(${pct(firstShare)} of paid base wins)`
  );
  console.log(
    `  steps 2+:  ${pp(metrics.breakdown.laterCascadeWin / totalSpins)} ` +
      `(${pct(laterShare)} of paid base wins)`
  );

  const avgClusterSize = metrics.breakdown.clusterCount
    ? metrics.breakdown.clusterCells / metrics.breakdown.clusterCount
    : 0;
  console.log('\nCluster/cascade shape:');
  console.log(`  avg cluster size: ${avgClusterSize.toFixed(2)} cells`);
  console.log(`  max cluster size: ${metrics.breakdown.maxClusterSize} cells`);
  console.log(`  avg cascades per spin: ${(metrics.breakdown.cascadeCount / totalSpins).toFixed(3)}`);

  return metrics;
}
