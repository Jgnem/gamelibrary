// Drunk Farmer — BASE GAME chicken-shot animation.
//
// UI-only. A base-game chicken is shot the moment it lands in a WINNING
// CLUSTER: a crosshair sweeps in and locks onto the chicken while the farmer
// swings his rifle, the shot fires, the chicken EXPLODES in a burst of
// feathers — and behind it a full-tile ×value PLAQUE is revealed (weathered
// red board covering the whole cell, big carved value).
//
// The plaque lives in the BACK layer: it is drawn between the cell wells and
// the symbols (`drawUnderlay` hooks in renderer/animator/dropIn/bottleSpawnFx),
// so it stays fully visible while the cell is empty, while refills fall on top
// of it, and across spins until a winning cluster consumes it.
//
// Driven per cascade step by animateTumble's `onStepFlash` hook (index.html).
// No math imports beyond consuming the already-computed result shape.

import { gridToPixel, boardToStage } from './canvas.js';
import { renderGrid } from './renderer.js';
import { animate, easeOutCubic } from './fx.js';

const CROSSHAIR_MS = 380; // crosshair sweeps in + locks while the farmer aims
const EXPLODE_MS = 460; // feather burst; the plaque is revealed beneath it

const BUFF_FILL = '#ff5a2c'; // base-game buff colour (distinct from Drunk Mode purple)
const CROSSHAIR_RED = '#ff3030';

// Plaque palette — weathered dark-red board with a carved tan value
// (reference: full-tile x2 multiplier plaques).
const PLAQUE_DARK = '#5c1216';
const PLAQUE_MID = '#7a1d22';
const PLAQUE_EDGE = '#3a0b0e';
const PLAQUE_TEXT_TOP = '#eccb9c';
const PLAQUE_TEXT_BOTTOM = '#c9884e';
const PLAQUE_TEXT_STROKE = '#33100a';

function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

/** Stage-coordinate center of a cell (the farmer's aim point). */
function cellStagePoint(row, col) {
  return boardToStage(gridToPixel(row, col));
}

/** Deterministic per-cell pseudo-random in [0,1) — stable torn edges, no flicker. */
function cellRand(row, col, i) {
  const s = Math.sin(row * 127.1 + col * 311.7 + i * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

/** Torn-edge polygon path for a plaque covering the cell (deterministic). */
function tornPlaquePath(ctx, cx, cy, half, row, col) {
  const jitter = half * 0.09;
  const pts = [];
  const stepsPerEdge = 4;
  const corners = [
    [-half, -half],
    [half, -half],
    [half, half],
    [-half, half],
  ];
  let n = 0;
  for (let e = 0; e < 4; e += 1) {
    const [x0, y0] = corners[e];
    const [x1, y1] = corners[(e + 1) % 4];
    for (let s = 0; s < stepsPerEdge; s += 1) {
      const t = s / stepsPerEdge;
      const px = x0 + (x1 - x0) * t;
      const py = y0 + (y1 - y0) * t;
      const jx = (cellRand(row, col, n) - 0.5) * 2 * jitter;
      const jy = (cellRand(row, col, n + 100) - 0.5) * 2 * jitter;
      pts.push([cx + px + jx, cy + py + jy]);
      n += 1;
    }
  }
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i += 1) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}

/**
 * Draw ONE full-tile ×value plaque (BACK layer — under the symbols).
 * @param {{row:number, col:number, value:number}} buff
 * @param {{alpha?:number, reveal?:number, pulse?:number}} [opts]
 *   reveal — 0..1 pop-in progress (scale + fade); default 1 (fully shown).
 *   pulse — 0..1 glow strength (waiting-badge heartbeat).
 */
export function drawBuffPlaque(ctx, buff, cellSize, opts = {}) {
  const { alpha = 1, reveal = 1, pulse = 0 } = opts;
  const { x, y } = gridToPixel(buff.row, buff.col);
  const half = (cellSize / 2 - cellSize * 0.055) * (0.8 + 0.2 * reveal);

  ctx.save();
  ctx.globalAlpha = alpha * Math.min(1, reveal * 1.6);

  // Board: torn-edge weathered red covering the tile.
  tornPlaquePath(ctx, x, y, half, buff.row, buff.col);
  const grad = ctx.createLinearGradient(x, y - half, x, y + half);
  grad.addColorStop(0, PLAQUE_MID);
  grad.addColorStop(1, PLAQUE_DARK);
  ctx.fillStyle = grad;
  if (pulse > 0) {
    ctx.shadowColor = BUFF_FILL;
    ctx.shadowBlur = cellSize * 0.16 * pulse;
  }
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, cellSize * 0.035);
  ctx.strokeStyle = PLAQUE_EDGE;
  ctx.stroke();

  // Faint wood-grain streaks (two darker horizontal bands).
  ctx.save();
  tornPlaquePath(ctx, x, y, half, buff.row, buff.col);
  ctx.clip();
  ctx.globalAlpha *= 0.22;
  ctx.fillStyle = PLAQUE_EDGE;
  ctx.fillRect(x - half, y - half * 0.45, half * 2, half * 0.12);
  ctx.fillRect(x - half, y + half * 0.3, half * 2, half * 0.1);
  ctx.restore();

  // Big carved value — light top, darker bottom, dark outline.
  const text = `x${buff.value}`;
  const fontSize = Math.round(cellSize * (text.length > 3 ? 0.34 : 0.42));
  ctx.font = `900 ${fontSize}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const tg = ctx.createLinearGradient(x, y - fontSize / 2, x, y + fontSize / 2);
  tg.addColorStop(0, PLAQUE_TEXT_TOP);
  tg.addColorStop(1, PLAQUE_TEXT_BOTTOM);
  ctx.lineWidth = Math.max(3, cellSize * 0.05);
  ctx.strokeStyle = PLAQUE_TEXT_STROKE;
  ctx.strokeText(text, x, y + 1);
  ctx.fillStyle = tg;
  ctx.fillText(text, x, y + 1);

  ctx.restore();
}

/**
 * Draw ×value plaques for every buff cell — use as `drawUnderlay` so the
 * plaques sit BEHIND the symbols and stay visible in empty wells, under
 * falling refills and across spins.
 * @param {{row:number, col:number, value:number}[]} buffs
 * @param {{pulse?:number}} [opts]
 */
export function drawBuffPlaques(ctx, buffs, cellSize, opts = {}) {
  if (!buffs || buffs.length === 0) return;
  for (const b of buffs) drawBuffPlaque(ctx, b, cellSize, opts);
}

/** Crosshair: outer ring + inner ring + ticks + center dot, locked on (x, y). */
function drawCrosshair(ctx, x, y, cellSize, t) {
  // Sweep in: oversized + rotated → locks to scale 1; then blink twice.
  const lockT = Math.min(1, t / 0.62);
  const scale = 2.3 - 1.3 * easeOutCubic(lockT);
  const rot = (1 - easeOutCubic(lockT)) * -0.7;
  const locked = t >= 0.62;
  const blink = locked ? 0.65 + 0.35 * Math.abs(Math.sin((t - 0.62) * Math.PI * 5.2)) : 1;
  const r = cellSize * 0.34 * scale;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.globalAlpha = Math.min(1, t * 4) * blink;
  ctx.strokeStyle = CROSSHAIR_RED;
  ctx.fillStyle = CROSSHAIR_RED;
  ctx.shadowColor = CROSSHAIR_RED;
  ctx.shadowBlur = cellSize * 0.12;
  ctx.lineWidth = Math.max(2, cellSize * 0.035);

  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
  ctx.stroke();
  // Four ticks poking out of the outer ring.
  for (let i = 0; i < 4; i += 1) {
    const a = (i * Math.PI) / 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.78, Math.sin(a) * r * 0.78);
    ctx.lineTo(Math.cos(a) * r * 1.22, Math.sin(a) * r * 1.22);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(1.5, cellSize * 0.028), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Build the explosion's particles: feathers (white) + embers (orange). */
function makeExplosion(cellSize) {
  const parts = [];
  const count = 16;
  for (let i = 0; i < count; i += 1) {
    const feather = i % 2 === 0;
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    parts.push({
      feather,
      angle: a,
      dist: cellSize * (0.35 + Math.random() * 0.55),
      size: cellSize * (feather ? 0.09 + Math.random() * 0.06 : 0.04 + Math.random() * 0.03),
      spin: (Math.random() - 0.5) * 7,
      droop: feather ? cellSize * (0.12 + Math.random() * 0.2) : 0,
    });
  }
  return parts;
}

/** Draw the explosion at progress t (0..1): flash, shock ring, particles. */
function drawExplosion(ctx, x, y, cellSize, parts, t) {
  ctx.save();

  // White muzzle flash (first quarter).
  if (t < 0.25) {
    ctx.globalAlpha = (1 - t / 0.25) * 0.9;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, cellSize * 0.4 * (1 - t * 0.5), 0, Math.PI * 2);
    ctx.fill();
  }

  // Expanding shock ring.
  const ringT = Math.min(1, t / 0.7);
  ctx.globalAlpha = (1 - ringT) * 0.7;
  ctx.strokeStyle = '#ffd35a';
  ctx.lineWidth = Math.max(2, cellSize * 0.045 * (1 - ringT));
  ctx.beginPath();
  ctx.arc(x, y, cellSize * (0.2 + ringT * 0.55), 0, Math.PI * 2);
  ctx.stroke();

  // Feathers + embers flying out (ease-out, feathers droop as they fade).
  const p = easeOutCubic(t);
  for (const part of parts) {
    const px = x + Math.cos(part.angle) * part.dist * p;
    const py = y + Math.sin(part.angle) * part.dist * p + part.droop * t * t;
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(part.angle + part.spin * t);
    ctx.globalAlpha = Math.max(0, 1 - t * 1.15);
    if (part.feather) {
      ctx.fillStyle = '#fff6e0';
      ctx.beginPath();
      ctx.ellipse(0, 0, part.size, part.size * 0.42, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = t < 0.4 ? '#ffb02e' : BUFF_FILL;
      ctx.beginPath();
      ctx.arc(0, 0, part.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.restore();
}

/**
 * Animate the farmer shooting ONE chicken that just landed in a winning
 * cluster: a crosshair sweeps in and locks on while the farmer aims, the shot
 * fires, the chicken EXPLODES in feathers, and the full-tile ×value plaque is
 * revealed beneath. On completion the buff is pushed into `opts.revealed` (so
 * later frames keep the plaque) and the cell is added to `opts.hiddenWinners`
 * (so the exploded chicken never flickers back during the winners fade-out).
 *
 * @param {CanvasRenderingContext2D} ctx
 * @param {(string|null)[][]} grid - board at this cascade step (step.grid).
 * @param {number} cellSize
 * @param {{row:number, col:number, value:number}} buff - the shot chicken's cell + value.
 * @param {{farmer?:object, revealed?:object[], highlights?:{row:number,col:number}[], hiddenWinners?:Set<string>}} [opts]
 */
export async function shootChicken(ctx, grid, cellSize, buff, opts = {}) {
  const farmer = opts.farmer || null;
  const revealed = opts.revealed || [];
  const highlights = opts.highlights || [];
  const { x, y } = gridToPixel(buff.row, buff.col);
  const shown = revealed.slice(); // plaques already on the board this spin
  const hidden = new Set(); // the chicken disappears in the explosion

  const paint = (extra) =>
    renderGrid(ctx, grid, cellSize, highlights, {
      hiddenCells: hidden,
      drawUnderlay: (cx) => drawBuffPlaques(cx, shown, cellSize),
      drawOverlay: extra,
    });

  // 1. Lock on: the crosshair sweeps in and blinks while the farmer swings
  // his rifle to the cell and fires.
  await Promise.all([
    farmer ? farmer.shootAt(cellStagePoint(buff.row, buff.col)) : Promise.resolve(),
    animate(CROSSHAIR_MS, (t) => {
      paint((cx) => drawCrosshair(cx, x, y, cellSize, t));
    }),
  ]);

  // 2. BANG: the chicken explodes (hidden from this frame on) and the plaque
  // pops in beneath the feathers — back layer, covering the whole tile.
  hidden.add(`${buff.row},${buff.col}`);
  const parts = makeExplosion(cellSize);
  await animate(EXPLODE_MS, (t) => {
    renderGrid(ctx, grid, cellSize, highlights, {
      hiddenCells: hidden,
      drawUnderlay: (cx) => {
        drawBuffPlaques(cx, shown, cellSize);
        drawBuffPlaque(cx, buff, cellSize, { reveal: easeOutCubic(Math.max(0, (t - 0.15) / 0.85)) });
      },
      drawOverlay: (cx) => drawExplosion(cx, x, y, cellSize, parts, t),
    });
  });

  revealed.push({ ...buff });
  if (opts.hiddenWinners) opts.hiddenWinners.add(`${buff.row},${buff.col}`);
}
