#!/usr/bin/env python3
"""Drunk Farmer — Monte Carlo RTP simulator (Python port of src/math/verify.js).

This is a RUNNABLE simulator. It reads the game spec from src/math/math.json
(the same values the JS engine uses via src/math/constants.js) and replays the
base-game math in pure Python: cluster pays, tumble with sticky/temporary wilds,
the chicken-shot buff mechanic (a chicken is shot only when it lands in a
winning cluster), persistent "hot cell" buffs, bottle TYPES (beer/wine/
moonshine/jug/barrel — no empty bottles) and the meter-topped FREE SPINS (no
bet, shot chance 1.0, fresh buffs don't persist, meter frozen, overflow
carries over).

Fully ported as of the mechanics-diet pass: cascade step multipliers, ferment,
oncePerCell and the free-spins guaranteed_chickens top-up are all mirrored.
(Golden chicken and cross-multiply were CUT from the game — nothing to port.)
The Python RNG stream differs from JS, so numbers match verify.js only
statistically (over 1M+ spins); for the canonical figure use verify.js.

Usage:
    python simulator.py                      # default 10 x 100000 = 1,000,000 spins
    python simulator.py --spins 1000000      # total spins (split over --batches)
    python simulator.py --spins 200000 --batches 4
    python simulator.py --spins 100000 --seed 42
"""

import argparse
import json
import math
import os
import random
import subprocess
import time

WILD = "wld"
SPEC_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "src", "math", "math.json")

# ---------------------------------------------------------------------------
# Spec loading — every tunable is read from src/math/math.json.
# ---------------------------------------------------------------------------


def load_spec(path=SPEC_PATH):
    with open(path, "r", encoding="utf-8") as fh:
        spec = json.load(fh)

    cols = spec["grid"]["cols"]
    rows = spec["grid"]["rows"]
    cluster_min = spec["cluster_min"]
    max_win = spec["max_win"]

    symbol_ids = [s["id"] for s in spec["symbols"]]
    weights = {s["id"]: s["freq"] for s in spec["symbols"]}
    paytable = {s["id"]: s["pay"] for s in spec["symbols"] if s.get("pay")}

    refill_ids = [sid for sid in symbol_ids if sid != WILD]

    cascade_max = spec["cascade"]["max_base_steps"]
    step_multipliers = spec["cascade"]["step_multipliers"]
    sticky_max = spec["sticky_wilds"]["max_concurrent"]
    temp_chance = {int(k): v for k, v in spec["temporary_wilds"]["chance_by_step"].items()}

    fill_tiers = sorted(spec["chicken_shot"]["fill_tiers"], key=lambda t: t["min_fill"])
    buff_values = spec["chicken_shot"]["buff_values"]

    pbuff = spec["persistent_buff"]
    bottle = spec["bottle"]
    free_spins = spec["chicken_shot"]["free_spins"]

    return {
        "cols": cols,
        "rows": rows,
        "cluster_min": cluster_min,
        "max_win": max_win,
        "symbol_ids": symbol_ids,
        "weights": weights,
        "paytable": paytable,
        "refill_ids": refill_ids,
        "total_weight": sum(weights[i] for i in symbol_ids),
        "refill_total": sum(weights[i] for i in refill_ids),
        "cascade_max": cascade_max,
        "step_multipliers": step_multipliers,
        "sticky_max": sticky_max,
        "temp_chance": temp_chance,
        "fill_tiers": fill_tiers,
        "buff_values": buff_values,
        "max_value": pbuff["max_value"],
        "ferment_interval": pbuff["ferment_interval"],
        "ferment_amount": pbuff["ferment_amount"],
        "base_spawn": bottle["BASE_SPAWN_CHANCE"],
        "spawn_rise": bottle["SPAWN_RISE_PER_DRY_SPIN"],
        "meter_max": bottle["METER_MAX"],
        "bottle_types": bottle["BOTTLE_TYPES"],
        "fs_count": free_spins["count"],
        "fs_shot_chance": free_spins["shot_chance"],
        "fs_guaranteed": free_spins["guaranteed_chickens"],
        "fs_buffs_persist": free_spins["buffs_persist"],
    }


def load_runtime_constants():
    """Read exported JS math constants so the Python mirror can detect drift."""
    script = """
import {
  BOTTLE,
  CHICKEN_SHOT,
  CLUSTER_MIN,
  FREE_SPINS,
  GRID,
  MAX_WIN,
  PAYTABLE,
  PERSISTENT_BUFF,
  SYMBOL_WEIGHTS,
} from './src/math/constants.js';

console.log(JSON.stringify({
  grid: GRID,
  cluster_min: CLUSTER_MIN,
  max_win: MAX_WIN,
  symbols: Object.entries(SYMBOL_WEIGHTS).map(([id, freq]) => ({
    id,
    freq,
    pay: PAYTABLE[id] ?? null,
  })),
  chicken_shot: CHICKEN_SHOT,
  persistent_buff: PERSISTENT_BUFF,
  bottle: BOTTLE,
  free_spins: FREE_SPINS,
}));
"""
    proc = subprocess.run(
        ["node", "--input-type=module", "-e", script],
        cwd=os.path.dirname(os.path.abspath(__file__)),
        capture_output=True,
        check=True,
        encoding="utf-8",
    )
    return json.loads(proc.stdout)


def assert_spec_matches_runtime(spec_path=SPEC_PATH):
    with open(spec_path, "r", encoding="utf-8") as fh:
        spec = json.load(fh)
    runtime = load_runtime_constants()

    spec_symbols = [
        {"id": s["id"], "freq": s["freq"], "pay": s.get("pay")}
        for s in spec["symbols"]
    ]

    checks = {
        "grid": spec["grid"] == runtime["grid"],
        "cluster_min": spec["cluster_min"] == runtime["cluster_min"],
        "max_win": spec["max_win"] == runtime["max_win"],
        "symbols/frequencies/paytable": spec_symbols == runtime["symbols"],
        "chicken_shot": {
            "fill_tiers": spec["chicken_shot"]["fill_tiers"],
            "buff_values": spec["chicken_shot"]["buff_values"],
        }
        == runtime["chicken_shot"],
        "persistent_buff": {
            "max_value": spec["persistent_buff"]["max_value"],
            "ferment_interval": spec["persistent_buff"]["ferment_interval"],
            "ferment_amount": spec["persistent_buff"]["ferment_amount"],
        }
        == runtime["persistent_buff"],
        "bottle": {
            "BASE_SPAWN_CHANCE": spec["bottle"]["BASE_SPAWN_CHANCE"],
            "SPAWN_RISE_PER_DRY_SPIN": spec["bottle"]["SPAWN_RISE_PER_DRY_SPIN"],
            "METER_MAX": spec["bottle"]["METER_MAX"],
            "BOTTLE_TYPES": spec["bottle"]["BOTTLE_TYPES"],
        }
        == runtime["bottle"],
        "free_spins": {
            k: v for k, v in spec["chicken_shot"]["free_spins"].items() if not k.startswith("_")
        }
        == runtime["free_spins"],
    }

    failed = [name for name, ok in checks.items() if not ok]
    if failed:
        raise RuntimeError(
            "src/math/math.json is out of sync with src/math/constants.js: "
            + ", ".join(failed)
        )
    return True


# ---------------------------------------------------------------------------
# Grid + clusters (mirror of src/math/grid.js)
# ---------------------------------------------------------------------------


def weighted_pick(ids, total, weights, rng):
    roll = rng.random() * total
    for sid in ids:
        roll -= weights[sid]
        if roll < 0:
            return sid
    return ids[-1]


def create_grid(S, rng):
    return [
        [weighted_pick(S["symbol_ids"], S["total_weight"], S["weights"], rng) for _ in range(S["cols"])]
        for _ in range(S["rows"])
    ]


def neighbors(r, c, rows, cols):
    if r > 0:
        yield r - 1, c
    if r < rows - 1:
        yield r + 1, c
    if c > 0:
        yield r, c - 1
    if c < cols - 1:
        yield r, c + 1


def components_from_cells(cells, rows, cols):
    """cells: dict {(r,c): is_wild}. Returns list of components [ [(r,c,is_wild)] ]."""
    seen = set()
    comps = []
    for key in cells:
        if key in seen:
            continue
        comp = []
        stack = [key]
        seen.add(key)
        while stack:
            cur = stack.pop()
            comp.append((cur[0], cur[1], cells[cur]))
            for nb in neighbors(cur[0], cur[1], rows, cols):
                if nb in cells and nb not in seen:
                    seen.add(nb)
                    stack.append(nb)
        comps.append(comp)
    return comps


def find_clusters(grid, S):
    rows, cols, cmin = S["rows"], S["cols"], S["cluster_min"]

    # Real symbols present, in scan order (mirrors the JS insertion-ordered Set).
    seen_syms = set()
    real_syms = []
    for r in range(rows):
        for c in range(cols):
            v = grid[r][c]
            if v is not None and v != WILD and v not in seen_syms:
                seen_syms.add(v)
                real_syms.append(v)

    candidates = []
    for sym in real_syms:
        cells = {}
        for r in range(rows):
            for c in range(cols):
                v = grid[r][c]
                if v == sym:
                    cells[(r, c)] = False
                elif v == WILD:
                    cells[(r, c)] = True
        for comp in components_from_cells(cells, rows, cols):
            real = sum(1 for x in comp if not x[2])
            if len(comp) >= cmin and real >= 1:
                candidates.append((sym, comp))

    # Largest first so bigger clusters claim shared wilds (stable for ties).
    candidates.sort(key=lambda x: -len(x[1]))

    used_wilds = set()
    clusters = []
    for sym, comp in candidates:
        available = {
            (x[0], x[1]): x[2]
            for x in comp
            if not (x[2] and (x[0], x[1]) in used_wilds)
        }
        for sub in components_from_cells(available, rows, cols):
            real = sum(1 for x in sub if not x[2])
            if len(sub) >= cmin and real >= 1:
                for x in sub:
                    if x[2]:
                        used_wilds.add((x[0], x[1]))
                clusters.append({"symbol": sym, "cells": [(x[0], x[1]) for x in sub]})
    return clusters


def score_cluster(cluster, S):
    table = S["paytable"].get(cluster["symbol"])
    if not table:
        return 0.0
    idx = min(len(cluster["cells"]), len(table) - 1)
    return table[idx]


# ---------------------------------------------------------------------------
# Tumble (mirror of src/math/tumble.js — base-game options on)
# ---------------------------------------------------------------------------


def temporary_wild_chance(level, S):
    return S["temp_chance"].get(level, 1 if level >= 4 else 0)


def add_temporary_wild(working, sticky_keys, temp_keys, level, S, rng):
    chance = temporary_wild_chance(level, S)
    if chance == 0 or rng.random() >= chance:
        return []
    cands = []
    for r in range(S["rows"]):
        for c in range(S["cols"]):
            k = (r, c)
            if working[r][c] is not None and working[r][c] != WILD and k not in sticky_keys and k not in temp_keys:
                cands.append(k)
    if not cands:
        return []
    r, c = cands[int(rng.random() * len(cands))]
    original = working[r][c]
    working[r][c] = WILD
    temp_keys.add((r, c))
    return [(r, c, original)]


def sticky_gravity(grid, sticky_keys, S):
    rows, cols = S["rows"], S["cols"]
    out = [[None] * cols for _ in range(rows)]
    for c in range(cols):
        for r in range(rows):
            if (r, c) in sticky_keys:
                out[r][c] = grid[r][c]
        movable = [grid[r][c] for r in range(rows) if (r, c) not in sticky_keys and grid[r][c] is not None]
        idx = len(movable) - 1
        for r in range(rows - 1, -1, -1):
            if (r, c) in sticky_keys:
                continue
            out[r][c] = movable[idx] if idx >= 0 else None
            idx -= 1
    return out


def fill_empty(grid, S, rng):
    for r in range(S["rows"]):
        for c in range(S["cols"]):
            if grid[r][c] is None:
                grid[r][c] = weighted_pick(S["refill_ids"], S["refill_total"], S["weights"], rng)
    return grid


def run_tumble(grid, S, rng):
    working = [row[:] for row in grid]
    base_sticky = set()
    steps = []
    total_win = 0.0

    for step in range(S["cascade_max"]):
        level = step + 1
        temp_keys = set()
        added_temp = add_temporary_wild(working, base_sticky, temp_keys, level, S, rng)

        clusters = find_clusters(working, S)
        if not clusters:
            # restore the unused temp wild (none used — no clusters)
            for r, c, orig in added_temp:
                working[r][c] = orig
            break

        # Base cascade escalation: later levels multiply their step win
        # (mirror of tumble.js cascadeMultiplier — ×1 outside the table).
        mults = S["step_multipliers"]
        win_multiplier = mults[level - 1] if level - 1 < len(mults) else 1
        step_win = sum(score_cluster(cl, S) for cl in clusters) * win_multiplier
        total_win += step_win

        for cl in clusters:
            for (r, c) in cl["cells"]:
                if working[r][c] != WILD:
                    continue
                k = (r, c)
                if k not in temp_keys and k not in base_sticky and len(base_sticky) < S["sticky_max"]:
                    base_sticky.add(k)

        active = set(base_sticky)
        # Snapshot BEFORE restore/removal — temporary wilds are still present, so a
        # temp wild that won counts as a wild cell in its cluster (matches the JS).
        steps.append({
            "grid": [row[:] for row in working],
            "clusters": clusters,
            "win_multiplier": win_multiplier,
        })

        winning = set(cell for cl in clusters for cell in cl["cells"])
        used_temp = set((r, c) for (r, c, _o) in added_temp if (r, c) in winning)
        for r, c, orig in added_temp:
            if (r, c) not in used_temp:
                working[r][c] = orig

        nxt = [row[:] for row in working]
        for cl in clusters:
            for (r, c) in cl["cells"]:
                if (r, c) not in active:
                    nxt[r][c] = None

        collapsed = sticky_gravity(nxt, active, S)
        working = fill_empty(collapsed, S, rng)

    return {"steps": steps, "total_win": total_win}


# ---------------------------------------------------------------------------
# Chicken shots + persistent buffs (mirror of src/math/chickenShot.js)
# ---------------------------------------------------------------------------


def shot_tier_for_fill(fill, S):
    tier = S["fill_tiers"][0]
    for t in S["fill_tiers"]:
        if (fill or 0) >= t["min_fill"]:
            tier = t
    return tier


def weighted_draw(table, rng):
    total = sum(e["weight"] for e in table)
    roll = rng.random() * total
    for e in table:
        roll -= e["weight"]
        if roll < 0:
            return e
    return table[-1]


def resolve_chicken_shots(tumble, fill, S, rng, free_spin=False):
    tier = shot_tier_for_fill(fill, S)
    shot_chance = S["fs_shot_chance"] if free_spin else tier["shot_chance"]
    seen = set()
    candidates = []
    for step in tumble["steps"]:
        g = step["grid"]
        for cl in step["clusters"]:
            for (r, c) in cl["cells"]:
                if g[r][c] != WILD:
                    continue
                if (r, c) in seen:
                    continue
                seen.add((r, c))
                candidates.append((r, c))

    buffed = []
    for (r, c) in candidates:
        if rng.random() < shot_chance:
            val = weighted_draw(S["buff_values"], rng)["value"]
            buffed.append((r, c, val))
    return buffed, len(candidates), len(buffed)


def merge_persistent_buffs(persisted, fresh, S):
    """Buffs are (r, c, value, age). A fresh shot stacking onto a waiting cell
    SUMS (capped at max_value) and resets age to 0 (mirror of chickenShot.js)."""
    merged = {(r, c): (v, age) for (r, c, v, age) in persisted}
    for (r, c, v) in fresh:
        k = (r, c)
        if k in merged:
            merged[k] = (min(merged[k][0] + v, S["max_value"]), 0)
        else:
            merged[k] = (v, 0)
    return [(r, c, v, age) for (r, c), (v, age) in merged.items()]


def apply_wild_multipliers(tumble, buffs, S):
    """Once-per-cell is always on: a buffed cell multiplies only the FIRST
    cluster (in step/cluster order) covering it this spin — the "one buff =
    exactly two payoffs" contract. Step wins honor the cascade escalation
    multiplier (mirror of chickenShot.js applyWildMultipliers)."""
    if not buffs:
        return tumble["total_win"]
    val_by_cell = {(r, c): v for (r, c, v, _age) in buffs}
    used_cells = set()
    win = 0.0
    for step in tumble["steps"]:
        step_mult = step.get("win_multiplier", 1)
        for cl in step["clusters"]:
            base = score_cluster(cl, S)
            s = 0
            for (r, c) in cl["cells"]:
                k = (r, c)
                v = val_by_cell.get(k, 0)
                if v and k not in used_cells:
                    s += v
                    used_cells.add(k)
            factor = s if s > 0 else 1
            win += base * factor * step_mult
    return win


def settle_buffs(buffs, fresh, tumble, S, persist_fresh=True):
    """PERSIST-UNTIL-USED: fresh buffs start waiting (age 0); a waiting buff
    whose cell a winning cluster covered this spin just paid its second (final)
    time and is consumed; an uncovered waiting buff keeps waiting — and
    FERMENTS: age ticks up, and every ferment_interval spins waited its value
    grows by ferment_amount, capped at max_value. With persist_fresh=False
    (free spins) fresh buffs do NOT start waiting — their birth clusters
    covered them, so the covered-check drops them."""
    if not buffs:
        return []
    covered = set(cell for step in tumble["steps"] for cl in step["clusters"] for cell in cl["cells"])
    fresh_keys = set((r, c) for (r, c, _v) in fresh)
    out = []
    for (r, c, v, age) in buffs:
        k = (r, c)
        if persist_fresh and k in fresh_keys:
            out.append((r, c, v, 0))  # born this spin — starts waiting
        elif k not in covered:
            age += 1
            if S["ferment_interval"] > 0 and age % S["ferment_interval"] == 0:
                v = min(v + S["ferment_amount"], S["max_value"])
            out.append((r, c, v, age))
        # carried AND covered → just paid its second time → consumed
    return out


# ---------------------------------------------------------------------------
# Bottle meter (mirror of src/math/bottle.js — no Drunk Mode trigger)
# ---------------------------------------------------------------------------


def tick_bottle(bottle, S, rng):
    """Every bottle contains alcohol: a spawned bottle draws its TYPE (weighted)
    and adds that type's fill. Topping meter_max triggers free spins and the
    overflow CARRIES OVER."""
    dry = bottle["dry"]
    fill = bottle["fill"]
    spawn_chance = min(1.0, S["base_spawn"] + S["spawn_rise"] * dry)
    spawned = rng.random() < spawn_chance
    if spawned:
        dry = 0
        btype = weighted_draw(S["bottle_types"], rng)
        fill += btype["fill"]
    else:
        dry += 1
    trigger = fill >= S["meter_max"]
    if trigger:
        fill -= S["meter_max"]  # overflow carries over
    return {"dry": dry, "fill": fill}, trigger


# ---------------------------------------------------------------------------
# One spin (mirror of engine.spin — with meter-topped free spins)
# ---------------------------------------------------------------------------


def guarantee_chickens(grid, S, rng):
    """Free spins: top the board up to fs_guaranteed wilds before the tumble
    (mirror of engine.guaranteeChickens — the climax must have targets)."""
    non_wild = []
    wild_count = 0
    for r in range(S["rows"]):
        for c in range(S["cols"]):
            if grid[r][c] == WILD:
                wild_count += 1
            else:
                non_wild.append((r, c))
    missing = S["fs_guaranteed"] - wild_count
    while missing > 0 and non_wild:
        i = int(rng.random() * len(non_wild))
        r, c = non_wild.pop(i)
        grid[r][c] = WILD
        missing -= 1


def spin(state, S, rng):
    is_free = state["freeSpinsRemaining"] > 0
    grid = create_grid(S, rng)
    if is_free:
        guarantee_chickens(grid, S, rng)
    tumble = run_tumble(grid, S, rng)
    buffed, cand_count, shot_count = resolve_chicken_shots(
        tumble, state["bottle"]["fill"], S, rng, free_spin=is_free
    )
    effective = merge_persistent_buffs(state["persistentBuffs"], buffed, S)
    base_win = apply_wild_multipliers(tumble, effective, S)
    next_buffs = settle_buffs(
        effective, buffed, tumble, S, persist_fresh=(not is_free) or S["fs_buffs_persist"]
    )
    if is_free:
        bottle = state["bottle"]  # meter frozen during free spins
        remaining = state["freeSpinsRemaining"] - 1
    else:
        bottle, trigger = tick_bottle(state["bottle"], S, rng)
        remaining = S["fs_count"] if trigger else 0
    total_win = min(base_win, S["max_win"])
    new_state = {"bottle": bottle, "persistentBuffs": next_buffs, "freeSpinsRemaining": remaining}
    return new_state, base_win, total_win, cand_count, shot_count, len(next_buffs), is_free


def new_state():
    return {"bottle": {"dry": 0, "fill": 0}, "persistentBuffs": [], "freeSpinsRemaining": 0}


# ---------------------------------------------------------------------------
# Monte Carlo run + report (mirror of verify.runVerification)
# ---------------------------------------------------------------------------


def mean(xs):
    return sum(xs) / len(xs)


def stddev(xs):
    m = mean(xs)
    return math.sqrt(mean([(x - m) ** 2 for x in xs]))


def run(batches, spins_per_batch, rng, spec_path=SPEC_PATH, sync_check=True):
    if sync_check:
        assert_spec_matches_runtime(spec_path)
    S = load_spec(spec_path)
    total_rtps, base_rtps = [], []
    hits = 0
    max_win = 0.0
    base_spins = 0
    chickens = 0
    chickens_shot = 0
    buffed_spins = 0
    buff_samples = 0

    free_spin_count = 0
    all_spins = 0
    t0 = time.time()
    for _b in range(batches):
        state = new_state()
        sum_total = 0.0
        sum_base = 0.0
        paid = 0
        # `spins_per_batch` counts PAID spins — free spins run extra so the
        # RTP denominator (bets placed) is exact.
        while paid < spins_per_batch:
            state, base_win, total_win, cand, shot, nbuffs, is_free = spin(state, S, rng)
            sum_total += total_win
            if is_free:
                free_spin_count += 1
            else:
                paid += 1
                base_spins += 1
                sum_base += total_win
            all_spins += 1
            if total_win > 0:
                hits += 1
            if total_win > max_win:
                max_win = total_win
            chickens += cand
            chickens_shot += shot
            if shot > 0:
                buffed_spins += 1
            buff_samples += nbuffs
        total_rtps.append(sum_total / spins_per_batch)
        base_rtps.append(sum_base / spins_per_batch)

    elapsed_ms = int((time.time() - t0) * 1000)
    total_spins = batches * spins_per_batch

    def pct(x):
        return f"{x * 100:.2f}%"

    def line(label, xs):
        return (
            f"{label:<12} mean {pct(mean(xs)):>7}  sd {stddev(xs) * 100:5.2f}  "
            f"range [{pct(min(xs))} - {pct(max(xs))}]"
        )

    print(
        f"=== Drunk Farmer QA (Python) - {batches} x {spins_per_batch:,} spins "
        f"({total_spins:,} total, {elapsed_ms} ms) ==="
    )
    if sync_check:
        print("Spec sync:   math.json matches exported constants.js tunables")
    if total_spins < 1_000_000:
        print("NOTE: sub-1M-spin result is preliminary only.")
    print(line("Total RTP:", total_rtps))
    print(line("Base RTP:", base_rtps))
    print(f"Hit rate:    {pct(hits / all_spins)}")
    print(f"Max win:     {max_win:.2f}x")
    print(
        f"Free spins:  {free_spin_count:,} played "
        f"({pct(free_spin_count / total_spins)} of paid spins; Total-Base = feature RTP)"
    )
    print(
        f"Chicken shots: {chickens / all_spins:.2f} clustered chickens/spin, "
        f"shot {pct(chickens_shot / chickens) if chickens else '0.00%'} of them, "
        f">=1 shot on {pct(buffed_spins / all_spins)} of spins"
    )
    print(f"Persistent buffs: {buff_samples / all_spins:.3f} avg hot cells/spin")
    print("(Full mirror. RNG stream differs from JS - for the canonical RTP use verify.js.)")

    return {
        "total": {"mean": mean(total_rtps), "sd": stddev(total_rtps)},
        "base": {"mean": mean(base_rtps), "sd": stddev(base_rtps)},
        "hit_rate": hits / total_spins,
        "max_win": max_win,
    }


def main():
    ap = argparse.ArgumentParser(description="Drunk Farmer Monte Carlo RTP simulator.")
    ap.add_argument("--spins", type=int, default=1_000_000, help="Total spins (split over --batches). Default 1,000,000.")
    ap.add_argument("--batches", type=int, default=10, help="Independent batches. Default 10.")
    ap.add_argument("--seed", type=int, default=None, help="RNG seed for a reproducible run.")
    ap.add_argument("--spec", type=str, default=SPEC_PATH, help="Path to the math.json spec.")
    ap.add_argument(
        "--no-sync-check",
        action="store_true",
        help="Skip the math.json vs constants.js drift check.",
    )
    args = ap.parse_args()

    batches = max(1, args.batches)
    spins_per_batch = max(1, args.spins // batches)
    rng = random.Random(args.seed)
    run(batches, spins_per_batch, rng, args.spec, sync_check=not args.no_sync_check)


if __name__ == "__main__":
    main()
