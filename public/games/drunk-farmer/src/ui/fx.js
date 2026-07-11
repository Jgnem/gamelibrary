// Drunk Farmer — animation core (physics, easing, frame loop).
//
// Shared by dropIn.js and animator.js so the spin refresh and the cascade refill
// use the same sampler with separate timing profiles. A column moves as one
// RIGID ROPE: all its symbols share ONE delay and ONE motion curve, pre-spaced
// exactly one cell apart, so the spacing never stretches or compresses in
// flight. There are no per-symbol delays anywhere — per-symbol delays put
// symbols at different points of the easing curve mid-flight, which opens gaps.
//
// The spin refresh (dropIn.js) runs two rope sets per column on one timeline:
//   EXIT  — the old column accelerates down and out through the bottom clip
//           edge (easeInCubic, no deceleration, no spring — the rope just leaves).
//   GAP   — the column sits empty for COLUMN_GAP ms.
//   ENTRY — the new column falls in pre-stacked from above (easeInQuad), then
//           overshoots, springs back and squashes on landing.
// Columns are staggered left→right by COLUMN_STAGGER, applied identically to
// exit and entry, so the left columns refill while the right ones are still
// emptying (the Hacksaw "conveyor" look). Fully canvas + rAF; no DOM.

import { drawSymbol } from './symbols.js';

// ============================================================================
// ANIMATION CONTROL PANEL
// All main motion / physics tuning lives here. Keep this as the single place to
// adjust the spin and cascade feel.
// ============================================================================

// --- Spin refresh (per column: exit → gap → entry) ---
export const EXIT_DURATION = 400; // old rope accelerates out the bottom. Try ~320-480ms.
export const COLUMN_GAP = 120; // empty beat between exit end and entry start. Try ~100-180ms.
// NOTE: footage measures ~180ms, but ≤120ms is needed for the conveyor overlap
// to be VISIBLE (left columns refilling while the right ones still show exiting
// tiles) — easeInCubic clears the exit early and easeInQuad enters late.
export const FALL_DURATION = 450; // new rope, spawn -> overshoot. Try ~380-520ms.
export const COLUMN_STAGGER = 70; // våg mellan kolumner (left -> right), same for exit & entry. Try ~50-90ms.

// --- Cascade (tumble refill after cluster removal): snappier, no gap ---
export const CASCADE_FALL_DURATION = 300; // snabbare refill efter cluster. Try ~240-340ms.
export const CASCADE_COLUMN_STAGGER = 40; // mild cascade-våg mellan kolumner. Try ~20-60ms.

// --- Landing spring (one dry bounce per column; whole rope lands together) ---
export const OVERSHOOT = 9; // px förbi target innan fjädern vänder. Try ~6-14px.
export const BOUNCE_BACK = 1; // px upp från target i studsreturen. Try ~0-3px.
export const BOUNCE_DURATION = 50; // studs från overshoot till bounce-back. Try ~35-70ms.
export const SETTLE_DURATION = 60; // settle tillbaka till exakt cell. Try ~40-80ms.
export const SQUASH_DURATION = 70; // squash-håll efter landning. Try ~50-90ms.
export const SQUASH_X = 1.03; // landnings-squash, bredd. Try ~1.00-1.05.
export const SQUASH_Y = 0.96; // landnings-squash, höjd. Try ~0.94-1.00.

// --- Optional polish: vertical stretch proportional to instantaneous speed ---
export const MOTION_STRETCH = false; // enable speed-stretch during the fall.
export const STRETCH_Y = 1.06; // max vertical stretch at peak velocity.
export const STRETCH_X = 0.97; // matching horizontal thinning at peak velocity.

// Timing profiles. Each profile owns its ease so exit/entry/cascade can differ:
//   fall   — ms from start to overshoot (or to target when spring:false)
//   ease   — fall curve. Exit: easeInCubic (nearly still ~100ms, then rushes
//            out at max speed — NO deceleration before leaving the board).
//            Entry/cascade: easeInQuad (accelerating; only the landing spring
//            decelerates).
//   spring — true: overshoot → bounce → settle → squash landing.
//            false: the rope flies straight through targetY and stops (exit).
export const EXIT_TIMING = {
  fall: EXIT_DURATION,
  ease: easeInCubic,
  spring: false,
  bounce: 0,
  settle: 0,
  squash: 0,
};
export const DEFAULT_TIMING = {
  fall: FALL_DURATION,
  ease: easeInQuad,
  spring: true,
  bounce: BOUNCE_DURATION,
  settle: SETTLE_DURATION,
  squash: SQUASH_DURATION,
};
export const CASCADE_TIMING = {
  fall: CASCADE_FALL_DURATION,
  ease: easeInQuad,
  spring: true,
  bounce: BOUNCE_DURATION,
  settle: SETTLE_DURATION,
  squash: SQUASH_DURATION,
};
// ============================================================================
// NOTE: there is intentionally NO per-symbol stagger (the old SYMBOL_STAGGER /
// CASCADE_SYMBOL_STAGGER are gone) — per-symbol delays put symbols at different
// points of the easing curve mid-flight, which opens gaps in the rope.

const FRAME_FALLBACK_MS = 16;

/** Total per-symbol motion time (ms) for a timing profile. */
export function timingTotal(timing) {
  return timing.fall + (timing.spring ? timing.bounce + timing.settle : 0);
}

export const lerp = (a, b, p) => a + (b - a) * p;
// easeInCubic: slow start building to MAX speed exactly at the end (gravity feel).
export function easeInCubic(t) {
  return t * t * t;
}

export function easeInQuad(t) {
  return t * t;
}

// easeInOutQuad: accelerate then ease OUT before the end — peak speed mid-flight.
// NOT used by any profile (it looks floaty for reel motion); kept as a utility.
export function easeInOutQuad(t) {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function easeOutQuad(t) {
  return t * (2 - t);
}

export function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

const now = () =>
  typeof performance !== 'undefined' && performance.now ? performance.now() : Date.now();
const raf = (cb) =>
  typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame(cb) : setTimeout(() => cb(now()), FRAME_FALLBACK_MS);

/** Run draw(t) each frame for `duration` ms (t in [0,1]); resolve at t=1. */
export function animate(duration, draw) {
  return new Promise((resolve) => {
    const start = now();
    (function frame() {
      const t = Math.min(1, (now() - start) / duration);
      draw(t);
      if (t < 1) raf(frame);
      else resolve();
    })();
  });
}

/** Resolve after `ms`. */
export function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Build a faller descriptor. `timing` (optional) overrides the run-level timing
 * profile for this symbol, which lets one runFallAnimation timeline mix exit
 * ropes (EXIT_TIMING) and entry ropes (DEFAULT_TIMING).
 */
export function makeFaller(symbol, x, startY, targetY, delay, cellSize, timing) {
  return { symbol, x, startY, targetY, delay, cellSize, timing };
}

// Speed-stretch factor in [0,1]: proportional to the ease's instantaneous
// velocity, forced to zero at start (v=0 there for ease-in curves) and faded to
// zero over the last 15% of the fall so the symbol lands unstretched.
function stretchAmount(ease, p) {
  const h = 0.01;
  const v = (ease(Math.min(1, p + h)) - ease(Math.max(0, p - h))) / (2 * h);
  const vEnd = (ease(1) - ease(1 - 2 * h)) / (2 * h); // peak velocity (ease-in curves peak at t=1)
  const speed = vEnd > 0 ? Math.min(1, v / vEnd) : 0;
  const landingFade = Math.min(1, (1 - p) / 0.15);
  return speed * landingFade;
}

/**
 * Sample a falling symbol's y and squash scale at local time `te` (ms since this
 * symbol's delay), using the given timing profile:
 *   fall (timing.ease) → [spring only] overshoot targetY+OVERSHOOT →
 *   bounce up to targetY-BOUNCE_BACK → spring-settle to exact targetY,
 *   with a brief impact squash (SQUASH_X/Y → 1.0).
 * With spring:false (exit ropes) the fall runs straight to targetY and stops —
 * no overshoot, no squash, no deceleration before the end.
 * @returns {{ y:number, sx:number, sy:number, settled:boolean }}
 */
export function sampleSymbol(te, s, timing = DEFAULT_TIMING) {
  const { startY, targetY } = s;
  const { fall, bounce, settle, squash, ease, spring } = timing;
  const overshoot = timing.overshoot ?? OVERSHOOT;
  const bounceBack = timing.bounceBack ?? BOUNCE_BACK;
  const squashX = timing.squashX ?? SQUASH_X;
  const squashY = timing.squashY ?? SQUASH_Y;
  if (te <= 0) return { y: startY, sx: 1, sy: 1, settled: false };

  // Fall phase — rigid (no squash) while falling; optional speed-stretch.
  if (te < fall) {
    const p = te / fall;
    const overshootY = spring ? targetY + overshoot : targetY;
    let sx = 1;
    let sy = 1;
    if (MOTION_STRETCH) {
      const amt = stretchAmount(ease, p);
      sx = lerp(1, STRETCH_X, amt);
      sy = lerp(1, STRETCH_Y, amt);
    }
    return { y: lerp(startY, overshootY, ease(p)), sx, sy, settled: false };
  }

  if (!spring) return { y: targetY, sx: 1, sy: 1, settled: true };

  const t = te - fall; // ms since impact

  // Vertical spring: overshoot → bounce-back-up → exact target.
  let y;
  if (t < bounce) {
    y = lerp(targetY + overshoot, targetY - bounceBack, easeOutQuad(t / bounce));
  } else if (t < bounce + settle) {
    y = lerp(targetY - bounceBack, targetY, easeOutCubic((t - bounce) / settle));
  } else {
    y = targetY;
  }

  // Impact squash, relaxing back to 1.0 (scaled about the symbol's center by drawSymbol).
  let sx = 1;
  let sy = 1;
  if (t < squash) {
    const q = easeOutQuad(t / squash);
    sx = lerp(squashX, 1, q);
    sy = lerp(squashY, 1, q);
  }

  return { y, sx, sy, settled: t >= bounce + settle };
}

/**
 * Animate a set of fallers into place. Each frame: clear → background → optional
 * overlay (e.g. winning symbols leaving) → fallers (+ flashes). Resolves once
 * the last faller has settled.
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {{width:number, height:number, drawBackground?:Function, drawOverlay?:Function, symbols:object[], clip?:boolean, timing?:object}} cfg
 *   clip: when true, symbols are clipped to the board rect so any that travel
 *   above the top or below the bottom (e.g. old symbols exiting on a refresh)
 *   disappear at the grid edge.
 *   timing: run-level timing profile (DEFAULT_TIMING for the spin entry,
 *   CASCADE_TIMING for the tumble refill). A faller with its own `timing`
 *   property (see makeFaller) overrides it — that is how exit and entry ropes
 *   share one rAF timeline in the spin refresh.
 * @returns {Promise<void>}
 */
export function runFallAnimation(ctx, { width, height, drawBackground, drawOverlay, symbols, clip = false, timing = DEFAULT_TIMING }) {
  let total = 0;
  for (const s of symbols) {
    const end = s.delay + timingTotal(s.timing || timing);
    if (end > total) total = end;
  }

  // A faller may carry its own `draw(ctx, x, y, cellSize, {sx, sy})` (set on the
  // object after makeFaller) — e.g. the cosmetic bottle tile riding an entry
  // rope. It gets the exact same sampled physics as a normal symbol.
  const drawSymbols = (elapsed, settled) => {
    ctx.save();
    if (clip) {
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.clip();
    }
    if (!settled && drawOverlay) drawOverlay(ctx, elapsed);
    for (const s of symbols) {
      const st = settled
        ? { y: s.targetY, sx: 1, sy: 1 }
        : sampleSymbol(elapsed - s.delay, s, s.timing || timing);
      if (s.draw) {
        s.draw(ctx, s.x, st.y, s.cellSize, { sx: st.sx, sy: st.sy });
      } else {
        drawSymbol(ctx, s.symbol, s.x, st.y, s.cellSize, { scaleX: st.sx, scaleY: st.sy });
      }
    }
    ctx.restore();
  };

  return new Promise((resolve) => {
    const start = now();
    (function frame() {
      const elapsed = now() - start;
      ctx.clearRect(0, 0, width, height);
      if (drawBackground) drawBackground(ctx);
      drawSymbols(elapsed, false);

      if (elapsed < total) {
        raf(frame);
      } else {
        ctx.clearRect(0, 0, width, height);
        if (drawBackground) drawBackground(ctx);
        drawSymbols(elapsed, true);
        resolve();
      }
    })();
  });
}
