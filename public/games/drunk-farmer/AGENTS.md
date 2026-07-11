# The Drunk Farmer — Math Agent Instructions

## Project
Slot game math simulator for "The Drunk Farmer".
6×6 cluster pays, tumble/avalanche, low volatility, target RTP 94–96%.

## Critical Rules
- NEVER modify symbol frequencies and paytable values simultaneously — change one at a time.
- NEVER draw conclusions from fewer than 1,000,000 spins.
- ALWAYS report simulated RTP as Total AND Base: Total = paid + free-spin wins over paid spins; Base = paid-spin wins only. The difference is the free-spins feature's contribution.
- Treat sub-1M-spin results as preliminary only.
- Total RTP is currently IN the 94–96% window (values still PLACEHOLDER — final shaping later). When changing any mechanic, re-fund via ONE lever (usually a uniform paytable scale) and re-measure at 1M+; do not tune several knobs in the same pass.

## Game Architecture

### Phase 1 — Base Game
- 6×6 grid (36 cells), cluster pays, 5+ matching orthogonal neighbours (horizontal/vertical, no diagonals).
- Tumble/avalanche: winning clusters removed, symbols fall, new symbols fill from above; repeat until no new clusters. Base spins cap at `CASCADE.max_steps` (7) cascade steps, and each step's cluster wins are multiplied by `CASCADE.step_multipliers[level-1]` ([1,1,1,2,2,3,4]) — ×1 early keeps common outcomes and the hit rate untouched; the tail is where the money moved (fat-tail pass).
- **Chicken wilds:** the wild symbol (`wld`) is a CHICKEN. A chicken is a working wild whether shot or not — it substitutes and helps form clusters. Shooting a chicken does NOT create the wild (it is already a wild on the board); the shot only attaches a buff to the cell.
- **Chicken shot (during the cascade), RARE-BUT-BIG with a TANGIBLE top tier:** a chicken is shot ONLY when it is part of a WINNING CLUSTER. After the tumble, `resolveChickenShots` makes one `shot_chance` roll per chicken that landed in a cluster; the chance follows the bottle meter's fill ENTERING the spin (`CHICKEN_SHOT.fill_tiers`: 2.5%/8%/30% — the top tier is deliberately steep because a 2.5%→12.5% spread was statistically invisible over a session; a full farmer must be FELT). The buff is drawn from `CHICKEN_SHOT.buff_values` (x3/x5/x10, weight 70/25/5) and multiplies the WHOLE cluster; several shot cells in one cluster SUM. The paytable was uniformly trimmed ×0.6993, then ×0.4669 (fat-tail pass), ×0.9603 (free-spins pass), then ×0.8308 (mechanics-diet pass — funds the guaranteed free-spins chickens and the steeper top tier; golden chicken + cross-multiply were cut in the same pass). Visually the farmer fires as the cluster forms (`animateTumble`'s `onStepFlash` hook → `chickenShotAnimator.js`); on cluster-with-chicken spins where no shot lands he aim-teases instead, and his sprite gets visibly tipsier per Buzz tier.
- **Golden chicken — CUT (mechanics-diet pass):** rare × rare (~1 in 10k+ base spins) with a modest payoff — dream-budget spent without buying a dream. Its RTP went back into the base paytable.
- **Persistent buffs, PERSIST-UNTIL-USED:** the shot buff multiplies its birth cluster, then STAYS on its CELL (normal random symbol on it next spin) as a waiting ×N badge — however many spins it takes — until a winning cluster covers the cell again: that cluster is multiplied and the buff is CONSUMED. One buff = exactly two payoffs — enforced in scoring by `oncePerCell`: a buffed cell multiplies only the FIRST cluster covering it per spin (without this, 7-step cascades re-cover cells and measured far over budget). A fresh shot on a waiting cell SUMS, capped at `PERSISTENT_BUFF.max_value` (25).
- **Fermenting badges:** a waiting badge that survives `ferment_interval` (10) spins grows by `ferment_amount` (1), repeating each interval, capped at `max_value`. Waiting time becomes anticipation; the badge still pays only once more.
- **Cross-multiply — CUT (mechanics-diet pass):** fired too rarely to be perceived and competed with everything else for the same budget. `applyWildMultipliers` (now in `chickenShot.js`) always uses the plain per-cluster covered-cell SUM, once-per-cell enforced.
- **Sticky wilds:** a winning wild stays pinned for the rest of the paid spin (up to 3). Later cascade steps can also add temporary wilds before the win check (guaranteed at levels 4+ — which is why late-step cascade multipliers must stay modest).
- **Bottle meter (drives the shot chance AND the free spins), LOW-PITY + FAT TAIL:** each spin can spawn a bottle (`BASE_SPAWN_CHANCE` 0.08, rising `SPAWN_RISE_PER_DRY_SPIN` 0.02 per dry spin, reset on spawn — the flat ramp keeps the same ~6.4-spin average gap as the old steep pity but with real hot streaks and dry spells). EVERY bottle contains alcohol — no empty bottles, no cork sniff. A spawned bottle draws its TYPE from `BOTTLE_TYPES` (weighted; player-facing `label` is the Buzz scale, internal `id` in parens picks tint/glow/FX): SMALL BUZZ +5 (beer, 58), BIG BUZZ +12 (wine, 29), MEGA BUZZ +25 (moonshine, 10), ULTRA BUZZ +50 (jug, 2.5), FULL BUZZ +100 (barrel, 0.5 — fills the whole meter: an INSTANT free-spins trigger, theoretically on spin 1) toward `METER_MAX` (100). The meter's fill sets the chicken-shot tier. Topping the max queues **FREE SPINS** and the OVERFLOW CARRIES OVER (`fill -= METER_MAX` — no alcohol wasted). Meter cycle ≈ 60 paid spins.
- **FREE SPINS (rampage-freespins, `FREE_SPINS`):** `count` (5) free spins — no bet — where the board is topped up to `guaranteed_chickens` (3) chickens before the tumble (`engine.guaranteeChickens`; the climax must have targets — without the guarantee the feature measured ~1.76x per free spin, an anticlimax) and every clustered chicken is shot (`shot_chance` 1.0). Free-spin buffs do NOT persist as badges (`buffs_persist` false — one payoff each, spray-and-pray) and the bottle meter is FROZEN (`meter_frozen` — no bottle spawns during free spins). Waiting badges from earlier paid spins still pay + consume normally. The free-spins session total is capped at MAX_WIN. Lives on `state.freeSpins` (`remaining`/`total`/`sessionWin`); the engine result exposes `isFreeSpin`, `freeSpins` and `freeSpinsQueued`. Replaced the single-spin RAMPAGE + CORK SNIFF (both fully removed).

### Phase 2 — Drunk Mode — DELETED
Drunk Mode was fully REMOVED in the mechanics-diet pass: `src/math/drunkMode.js`, `src/ui/drunkModeAnimator.js`, the `DRUNK_*`/`CHICKEN_PRIZES` constants and the `math.json` `drunk_mode` block are all deleted (the generic `weightedDraw`/`applyWildMultipliers` helpers moved into `src/math/chickenShot.js`). Recover from git history if it ever returns; the meter's max triggers the base-game FREE SPINS feature.

## Symbols (10 total)
| Symbol | Type | Notes |
|--------|------|-------|
| 10, J, Q, K, A | Low paying | Standard royals |
| Haystack (hay), Cassava (cas) | Medium paying | Farm theme |
| Pitchfork (pit), Dog (dog) | High paying | Farm theme |
| Chicken (wld) | Wild | Substitutes; shootable for a cell buff (base game); no own payout |

## RTP Targets vs Current (measured)
Target (final, post-tuning): Total RTP 94–96% · Hit rate ~25–35% · Max win cap 5000x.
(When Drunk Mode returns, re-split the budget between it and the base free spins.)

Current measured, after the mechanics-diet pass (10 × 100k = 1,000,000 paid spins):
- Total RTP ≈ 94.44% ± 1.43 — IN target window. Base RTP ≈ 58.2% + free-spins feature ≈ 36.3 pp.
- Free spins: trigger ~1 in 60 paid spins · 5 spins per trigger · ~4.37x avg win per free spin (guaranteed chickens fixed the ~1.76x anticlimax)
- Hit rate ≈ 32% · Max win observed ~378x (volatility down after the trim — revisit in final shaping)
- Chicken shots ≈ 0.62 clustered chickens/spin, ~30% shot (free spins included) → buffed cluster on ~9.1% of spins
- Persist-until-used carry ≈ 10 pp isolated; total buff-multiplier uplift ≈ 107 pp
- Waiting badges ≈ 0.83 on board per spin; ~92% of badges survive ≥2 spins (visible)
- Cascade split: first hit ≈ 40 pp, steps 2+ ≈ 98 pp (71% of paid base wins)
- Funding history: pre-trim total measured 114.34% ± 1.25 at 1M → single uniform ×0.8308 paytable trim (the mechanics-diet lever). Earlier trims: ×0.6993 (rare-but-big), ×0.4669 (fat-tail), ×0.9603 (free-spins).

## Math Spec Files
- `src/math/constants.js` — the RUNTIME source of truth (the JS engine imports these values).
- `src/math/math.json` — human-readable mirror of the constants; keep it in sync when tuning. This is the spec the Python simulator reads.
- `simulator.py` — a runnable Python Monte Carlo simulator (a FULL port of `verify.js` as of the mechanics-diet pass: cascade step multipliers, ferment, oncePerCell and the free-spins guaranteed_chickens top-up are all mirrored). It reads `src/math/math.json` and replays the base-game math in Python. Handy for quick tuning sweeps; the Python RNG stream differs from JS so numbers match only statistically (1M+ spins) — the JS engine remains authoritative, for the canonical number use `verify.js`. Measured parity: Python 95.55% ± 1.16 vs verify.js 94.44% ± 1.43 at 1M spins (overlapping within 1 sd).

## Tuning Order
1. Change ONE thing in `src/math/constants.js` (paytable values OR symbol frequencies, never both).
2. Run the JS verification (below) at 1M+ spins.
3. Adjust the other lever only if still needed, then re-verify.
4. Mirror the final values into `src/math/math.json`.
5. Never adjust two levers simultaneously.

## Verification Commands
The verification runs the REAL engine (`src/game/engine.js`) via `src/math/verify.js`:
```
node --input-type=module -e "import { runVerification } from './src/math/verify.js'; runVerification(10, 100000)"
```
`runVerification(batches, spinsPerBatch)` reports Total / Base RTP as mean ± sd over independent batches (`spinsPerBatch` counts PAID spins; free spins run extra and land in Total). Use ≥ 1,000,000 total paid spins (e.g. 10 × 100k). The same hook runs on page load in `index.html` (QA only, no visual UI).

Python alternative (a port of the above; reads `src/math/math.json`):
```
python simulator.py --spins 1000000            # 10 batches x 100k by default
python simulator.py --spins 100000 --batches 2 # quick check
python simulator.py --spins 100000 --seed 42   # reproducible
```
The Python RNG stream differs from JS, so the number matches `verify.js` only statistically (over 1M+ spins). For the authoritative figure, use `verify.js`.

## Output Contract
For every tuning run, report:
1. Simulated RTP: Total / Base (mean ± sd)
2. Hit rate
3. Max win observed
4. Pass/fail against targets
5. Recommended next single adjustment if failing
