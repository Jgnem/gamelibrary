// Drunk Farmer — stage layout, canvas setup & responsive "contain" scaling.
//
// The STAGE is the full landscape background painting (Background_TDF art,
// 1672×941 design px): a wooden frame in the middle with a dark chalkboard
// opening (no painted cell lines — the canvas draws the grid), the title sign
// on the top beam, the barn on the left and the tree/dirt road on the right.
// All UI canvases are absolutely positioned over regions of that painting:
//
//   game canvas   → the dark chalkboard opening      (GRID_RECT)
//   farmer canvas → the dirt road right of the frame (FARMER_RECT)
//
// Scaling model: one uniform `scale` contain-fits the stage into the viewport.
// Each stage canvas keeps a FIXED design coordinate space (its rect's w×h) and
// bakes `scale × devicePixelRatio` into its transform, so draw code never sees
// the real viewport size.
//
// The DESKTOP chalkboard opening is wider than it is tall, so its cells are
// RECTANGULAR: CELL_W (126) × CELL_H (103). Symbols stay square (sized by
// CELL_H) and center in their cell; vertical physics (fall distances) use
// CELL_H via the legacy scalar `cellSize`. NOTE: square-by-CELL_H content only
// fits because CELL_H is the SMALLER desktop dimension — the MOBILE board is
// therefore defined with SQUARE cells (see the mobile branch in initStage).

import { setRenderScale } from './symbols.js';
import { BACKGROUND_DESKTOP_URL, BACKGROUND_MOBILE_FINAL_URL } from './assets.js';

/** Full background painting, design px. */
export let STAGE_W = 1672;
export let STAGE_H = 941;

/** Board dimensions (kept local — this module must not import math files). */
const GRID_COLS = 6;
const GRID_ROWS = 6;

/** The dark chalkboard opening inside the wooden frame (measured in the art:
 * interior ≈ x 445–1214, y 185–815, inset a few px for the hand-drawn edge). */
export const GRID_RECT = { x: 452, y: 192, w: 756, h: 618 };
export let CELL_W = GRID_RECT.w / GRID_COLS; // ≈126.67
export let CELL_H = GRID_RECT.h / GRID_ROWS; // ≈102.67
export let BOARD_W = GRID_RECT.w;
export let BOARD_H = GRID_RECT.h;
/** Legacy scalar cell size: square symbol box + vertical physics distance. */
export let CELL_SIZE = CELL_H;

/** Dirt-road area right of the frame where the farmer stands. The rect sits
 * low enough that his boot soles (local GROUND_Y 690 → stage y 932) land on
 * the painting's road/grass ground plane. */
export const FARMER_RECT = { x: 1216, y: 242, w: 456, h: 700 };
/** Uniform farmer render scale (feet-anchored). Mobile shrinks him to fit the
 * ground strip under the taller board; desktop stays 1. */
export let ACTOR_SCALE = 1;
export const FULL_STAGE_RECT = { x: 0, y: 0, w: STAGE_W, h: STAGE_H };

// ---------------------------------------------------------------------------
// Stage + canvas mounting
// ---------------------------------------------------------------------------
let stageEl = null;

/** Current uniform stage scale (CSS px per design px). */
export function stageScale() {
  return stageEl ? stageEl.clientWidth / STAGE_W : 1;
}

/**
 * Create (once) and size the stage element with the background painting.
 * @param {HTMLElement|string} container
 */
export function initStage(container) {
  const mount = typeof container === 'string' ? document.querySelector(container) : container;
  if (!mount) throw new Error('initStage: container element not found.');
  stageEl = mount;
  const savedMode = localStorage.getItem('tdf-display-mode');
  const mobile = savedMode ? savedMode === 'mobile' : window.innerHeight > window.innerWidth;
  if (mobile) {
    // Design space 941×1672 (portrait). NO background art yet — the old
    // painting's chalkboard opening was 626×852 (cells 104×142), which made
    // the square-by-CELL_H symbols/outlines spill ~10px into neighbouring
    // columns and pushed the board so low the farmer overlapped it. This is
    // the target geometry the NEW art must be painted around
    // (MOBILE_BG_SPEC.md); re-measure with test-results/measure-bg.mjs and
    // fine-tune these rects when the painting lands.
    //
    // Board: Le Cowboy proportions — near-full width, FLAT-rectangular cells
    // (149×120, ratio 0.805 = LC's mobile grid). Square content sized by
    // CELL_H (120) fits with side slack, same as desktop (126×103); the old
    // collision came from TALL cells where CELL_H was the LARGER dimension.
    // Farmer: BIG and GROUNDED bottom-right, hat kissing the frame's bottom
    // edge like LC's cowboy — never the cells. His rifle's upward swing is
    // capped (farmerActor MAX_UP_ELEVATION), so shots read as a fixed diagonal
    // up-left while the cell FX sells the hit. The Buzz meter moves to the
    // bottom-left ground strip (hud.js) — no side margin remains for it.
    STAGE_W = 941;
    STAGE_H = 1672;
    Object.assign(GRID_RECT, { x: 24, y: 485, w: 894, h: 720 });
    // Full Le Cowboy size: the hat overlaps the board's bottom-right corner
    // cell slightly (like LC's cowboy) — an accepted trade for presence.
    Object.assign(FARMER_RECT, { x: 500, y: 900, w: 456, h: 700 });
    ACTOR_SCALE = 0.8;
  }
  CELL_W = GRID_RECT.w / GRID_COLS;
  CELL_H = GRID_RECT.h / GRID_ROWS;
  BOARD_W = GRID_RECT.w;
  BOARD_H = GRID_RECT.h;
  CELL_SIZE = CELL_H;
  Object.assign(FULL_STAGE_RECT, { x: 0, y: 0, w: STAGE_W, h: STAGE_H });
  mount.style.position = 'relative';
  if (mobile) {
    mount.style.backgroundImage = `url(${BACKGROUND_MOBILE_FINAL_URL})`;
    document.body.style.background = '#11120f';
  } else {
    mount.style.backgroundImage = `url(${BACKGROUND_DESKTOP_URL})`;
  }
  mount.style.backgroundSize = '100% 100%';
  mount.style.overflow = 'hidden';
  // Layout class lets CSS scope rules to one mode (e.g. index.html hides the
  // desktop farmer when the window goes portrait, but never the mobile one).
  mount.classList.add(mobile ? 'tdf-mobile' : 'tdf-desktop');
  // Desktop letterbox backdrop is a plain dark gradient (index.html): every
  // painted background variant contains the huge board frame, which reads as
  // random giant shapes when stretched behind the pillarboxed stage.

  function resizeStage() {
    // Contain-fit the single stage image so every painted edge remains visible
    // and all coordinate-mapped overlays stay aligned with the frame.
    const scale = Math.min(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);
    mount.style.width = `${STAGE_W * scale}px`;
    mount.style.height = `${STAGE_H * scale}px`;
    // Published for the HUD: the control bar and side widgets anchor to the
    // stage's on-screen width instead of the viewport, so they stay attached
    // to the game when the stage is pillarboxed (e.g. mobile layout in a
    // landscape window).
    document.documentElement.style.setProperty('--tdf-stage-w', `${Math.round(STAGE_W * scale)}px`);
    document.documentElement.style.setProperty('--tdf-stage-h', `${Math.round(STAGE_H * scale)}px`);
  }
  resizeStage();
  return { stage: mount, resizeStage };
}

/**
 * Mount an absolutely positioned canvas over a stage rect. Draw code works in
 * the rect's own design coordinates (0..rect.w, 0..rect.h). Call `resize()`
 * after the stage rescales to re-bake the backing store.
 * @param {{x:number,y:number,w:number,h:number}} rect - region in stage design px.
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, resize: () => void}}
 */
export function mountStageCanvas(rect, className) {
  if (!stageEl) throw new Error('mountStageCanvas: initStage must run first.');
  const canvas = document.createElement('canvas');
  if (className) canvas.className = className;
  canvas.style.position = 'absolute';
  canvas.style.left = `${(rect.x / STAGE_W) * 100}%`;
  canvas.style.top = `${(rect.y / STAGE_H) * 100}%`;
  canvas.style.width = `${(rect.w / STAGE_W) * 100}%`;
  canvas.style.height = `${(rect.h / STAGE_H) * 100}%`;
  stageEl.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.style.left = `${(rect.x / STAGE_W) * 100}%`;
    canvas.style.top = `${(rect.y / STAGE_H) * 100}%`;
    canvas.style.width = `${(rect.w / STAGE_W) * 100}%`;
    canvas.style.height = `${(rect.h / STAGE_H) * 100}%`;
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    const scale = stageScale();
    canvas.width = Math.max(1, Math.round(rect.w * scale * dpr));
    canvas.height = Math.max(1, Math.round(rect.h * scale * dpr));
    ctx.setTransform(scale * dpr, 0, 0, scale * dpr, 0, 0);
  }
  resize();
  return { canvas, ctx, resize };
}

/**
 * Create the game-grid canvas over the grid opening.
 * @param {HTMLElement|string} container - the stage container element.
 * @returns {{ canvas, ctx, cellSize, resize, resizeStage }}
 */
export function initCanvas(container) {
  const { resizeStage } = initStage(container);
  const mounted = mountStageCanvas(GRID_RECT, 'game-grid');

  function resize() {
    resizeStage();
    mounted.resize();
    // Rasterize cached symbol sprites at the on-screen device resolution.
    const dpr = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
    setRenderScale(stageScale() * dpr);
  }
  resize();
  return { canvas: mounted.canvas, ctx: mounted.ctx, cellSize: CELL_SIZE, resize, resizeStage };
}

// ---------------------------------------------------------------------------
// Coordinate helpers
// ---------------------------------------------------------------------------
/**
 * Pixel center of a grid cell in BOARD design coordinates. Cells are
 * rectangular (CELL_W × CELL_H); the legacy 3rd `cellSize` argument is
 * accepted and ignored so existing call sites keep working.
 */
export function gridToPixel(row, col) {
  return {
    x: col * CELL_W + CELL_W / 2,
    y: row * CELL_H + CELL_H / 2,
  };
}

/** Board design coords → stage design coords. */
export function boardToStage(pt) {
  return { x: GRID_RECT.x + pt.x, y: GRID_RECT.y + pt.y };
}

/** Stage design coords → local coords of an arbitrary stage rect. */
export function stageToRect(pt, rect) {
  return { x: pt.x - rect.x, y: pt.y - rect.y };
}
